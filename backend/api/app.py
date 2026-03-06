from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import re
import sys
import os
import json
from functools import wraps

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

app = Flask(__name__)
# 限制请求体最大 64 KB，防止超大 payload
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024

# 初始化限速器
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[],
    storage_uri="memory://"
)

# ── 输入校验工具 ────────────────────────────────────────────────
# 只允许英文字母、空格、连字符、撇号（如 don't、well-known）
_WORD_RE = re.compile(r"^[a-zA-Z][a-zA-Z\s\-']{0,49}$")
_ALLOWED_BOOKS = {'ielts'}

def _clean_word(raw) -> str | None:
    """校验并返回清洗后的单词字符串；不合法返回 None。"""
    if not isinstance(raw, str):
        return None
    word = raw.strip()
    return word if _WORD_RE.match(word) else None

CORS(app)

def _get_generate_limit_key():
    """始终返回IP地址进行限速"""
    return get_remote_address()

def _localhost_only(f):
    """装饰器：仅允许 localhost 调用，其余 IP 返回 403"""
    @wraps(f)
    def decorated(*args, **kwargs):
        remote = get_remote_address()
        if remote not in ('127.0.0.1', '::1'):
            return jsonify({'error': 'Forbidden'}), 403
        return f(*args, **kwargs)
    return decorated

# 限速错误处理
@app.errorhandler(429)
def ratelimit_handler(e):
    desc = str(e.description)  # e.g. "20 per 1 hour"
    limit_map = {
        'hour': ('每小时', '一小时后'),
        'day':  ('每天',   '明天'),
        'minute': ('每分钟', '分钟后'),
    }
    period_key = next((k for k in limit_map if k in desc), None)
    if period_key and desc.split()[0].isdigit():
        count = desc.split()[0]
        label, reset_hint = limit_map[period_key]
        message = f'AI 分析{label}最多使用 {count} 次，已达上限，请{reset_hint}再试'
    else:
        message = f'请求过于频繁（限制：{desc}），请稍后再试'
    return jsonify({
        'error': '请求过于频繁',
        'message': message,
        'retry_after': desc
    }), 429

# 导入现有的Python模块
try:
    from core.retrieval import query_memory
    from core.semantic import analyze_semantic_neighborhood, analyze_semantic_neighborhood_stream
    from core.token_stats import token_stats
    from core.generate_vocabulary import generate_vocabulary_data
    from core.validate import validate_and_normalize
    backend_available = True
except ImportError as e:
    print(f"Warning: Could not import backend modules: {e}")
    backend_available = False

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'backend_available': backend_available
    })

@app.route('/api/retrieve', methods=['POST'])
@limiter.limit("120/hour", key_func=_get_generate_limit_key)
def retrieve():
    """检索相似词汇接口（整合语义邻域分析）"""
    if not backend_available:
        return jsonify({
            'error': 'Backend not available',
            'message': 'Python backend modules could not be loaded'
        }), 503

    try:
        data = request.get_json(silent=True) or {}
        query = _clean_word(data.get('query', ''))
        if not query:
            return jsonify({'error': 'Invalid query: must be an English word or phrase'}), 400

        book_key = data.get('book_key', 'ielts')
        if book_key not in _ALLOWED_BOOKS:
            return jsonify({'error': f'Unknown book_key: {book_key}'}), 400

        k = data.get('k', 56)
        if not isinstance(k, int) or not (1 <= k <= 56):
            k = 56
        include_analysis = bool(data.get('include_analysis', False))

        # 调用向量数据库检索
        results = query_memory(query, book_key=book_key, k=k)

        # 提取单词信息，保持原始顺序
        words = []
        seen_words = set()  # 用于去重，但保持顺序

        for result in results:
            # 从文档内容中提取单词
            content = result.page_content
            # 查找"单词: "后面的内容
            if "单词: " in content:
                word_start = content.index("单词: ") + 4
                word_end = content.find(" | ", word_start)
                if word_end == -1:
                    word_end = len(content)
                word = content[word_start:word_end].strip()
                if word and word not in seen_words:
                    seen_words.add(word)
                    words.append(word)

        # 限制返回数量，保持原始检索顺序
        final_words = words[:56]

        # 语义邻域分析结果
        analysis_result = None
        if include_analysis and final_words:
            try:
                analysis_result = analyze_semantic_neighborhood(query, final_words)
            except Exception as analysis_error:
                print(f"语义邻域分析失败: {analysis_error}")
                # 分析失败不影响主要功能

        return jsonify({
            'query': query,
            'words': final_words,
            'count': len(final_words),
            'analysis': analysis_result,
            'include_analysis': include_analysis,
            'success': True
        })
    except Exception as e:
        print(f"[retrieve] error: {e}")
        return jsonify({'error': 'Internal server error', 'success': False}), 500


@app.route('/api/retrieve-stream', methods=['POST'])
@limiter.limit("20/hour", key_func=_get_generate_limit_key)
@limiter.limit("100/day", key_func=_get_generate_limit_key)
def retrieve_stream():
    """AI 模式 SSE 流式接口：先推 FAISS 词汇，再流式输出 relation + reason"""
    if not backend_available:
        return jsonify({'error': 'Backend not available'}), 503

    data = request.get_json(silent=True) or {}
    query = _clean_word(data.get('query', ''))
    book_key = data.get('book_key', 'ielts')
    try:
        k = min(max(int(data.get('k', 56)), 1), 56)
    except (TypeError, ValueError):
        k = 56
    if not query or book_key not in _ALLOWED_BOOKS:
        return jsonify({'error': 'invalid params'}), 400

    def generate():
        results = query_memory(query, book_key=book_key, k=k)
        words = []
        seen = set()
        for r in results:
            content = r.page_content
            if "单词: " in content:
                w_start = content.index("单词: ") + 4
                w_end = content.find(" | ", w_start)
                word = content[w_start:w_end if w_end != -1 else len(content)].strip()
                if word and word not in seen:
                    seen.add(word)
                    words.append(word)
        words = words[:56]
        # 第一阶段：推送词汇，前端立即渲染气泡
        yield f"data: {json.dumps({'type': 'words', 'words': words}, ensure_ascii=False)}\n\n"
        # 第二、三阶段：流式 DeepSeek（relation → reason_chunk → done）
        for event in analyze_semantic_neighborhood_stream(query, words):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return Response(
        stream_with_context(generate()),
        content_type='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'}
    )


@app.route('/api/validate-word', methods=['POST'])
@limiter.limit("60/hour", key_func=_get_generate_limit_key)
def validate_word():
    """验证英文单词合法性，返回原形（lemma）及基础中文释义"""
    if not backend_available:
        return jsonify({'valid': False, 'error': 'Backend not available'}), 503

    try:
        word = _clean_word((request.get_json(silent=True) or {}).get('word', ''))
        if not word:
            return jsonify({'valid': False, 'error': 'Invalid word'}), 400

        result = validate_and_normalize(word)
        return jsonify(result)

    except Exception as e:
        print(f"[validate-word] error: {e}")
        return jsonify({'valid': False, 'error': 'Internal server error'}), 500


@app.route('/api/generate-word', methods=['POST'])
@limiter.limit("10/day", key_func=_get_generate_limit_key)
def generate_word():
    """为词库外的单词生成词汇数据，结果由前端缓存到 localStorage，不写入服务端 JSON，不嵌入 FAISS"""
    if not backend_available:
        return jsonify({'error': 'Backend not available'}), 503

    try:
        word = _clean_word((request.get_json(silent=True) or {}).get('word', ''))
        if not word:
            return jsonify({'success': False, 'error': 'Invalid word'}), 400

        results = generate_vocabulary_data([word])
        if not results:
            return jsonify({'success': False, 'error': 'generation failed'}), 500

        return jsonify({'success': True, 'word_data': results[0]})

    except Exception as e:
        print(f"[generate-word] error: {e}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500


@app.route('/api/token-stats', methods=['GET'])
@_localhost_only
def get_token_stats():
    """获取 token 用量统计接口"""
    if not backend_available:
        return jsonify({
            'error': 'Backend not available',
            'message': 'Python backend modules could not be loaded'
        }), 503

    try:
        date = request.args.get('date')
        stats = token_stats.get_stats(date)
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        print(f"[token-stats] error: {e}")
        return jsonify({'error': 'Internal server error', 'success': False}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
