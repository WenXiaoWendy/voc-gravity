from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

app = Flask(__name__)
CORS(app)

# 导入现有的Python模块
try:
    from core.mem import query_memory, switch_vocabulary_book
    from core.open import analyze_semantic_neighborhood
    from core.token_stats import token_stats
    from core.generate_vocabulary import load_ielts_words, generate_vocabulary_data, save_vocabulary_data
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
def retrieve():
    """检索相似词汇接口（整合语义邻域分析）"""
    if not backend_available:
        return jsonify({
            'error': 'Backend not available',
            'message': 'Python backend modules could not be loaded'
        }), 503

    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        book_key = data.get('book_key', 'ielts')
        k = data.get('k', 56)  # 默认召回56个近邻
        include_analysis = data.get('include_analysis', False)  # 默认不包含语义分析

        if not query:
            return jsonify({'error': 'Query is required'}), 400

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
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/api/analyze_neighborhood', methods=['POST'])
def analyze_neighborhood():
    """语义邻域分析接口"""
    if not backend_available:
        return jsonify({
            'error': 'Backend not available',
            'message': 'Python backend modules could not be loaded'
        }), 503

    try:
        data = request.get_json()
        center_word = data.get('center_word', '').strip()
        neighbor_words = data.get('neighbor_words', [])

        if not center_word:
            return jsonify({'error': 'Center word is required'}), 400

        if not neighbor_words or not isinstance(neighbor_words, list):
            return jsonify({'error': 'Neighbor words must be a non-empty list'}), 400

        # 调用语义邻域分析函数
        analysis_result = analyze_semantic_neighborhood(center_word, neighbor_words)

        return jsonify({
            'center_word': center_word,
            'neighbor_words': neighbor_words,
            'analysis': analysis_result,
            'success': True
        })

    except Exception as e:
        print(f"Error in analyze_neighborhood endpoint: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/api/token-stats', methods=['GET'])
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
        return jsonify({
            'error': str(e),
            'success': False
        }), 500


@app.route('/api/generate-vocabulary', methods=['POST'])
def generate_vocabulary():
    """生成完整的雅思词汇数据接口"""
    if not backend_available:
        return jsonify({
            'error': 'Backend not available',
            'message': 'Python backend modules could not be loaded'
        }), 503

    try:
        data = request.get_json()
        batch_size = data.get('batch_size', 15)
        start_index = data.get('start_index', 0)
        end_index = data.get('end_index', None)

        # 加载现有单词
        words = load_ielts_words()

        # 如果指定了范围，截取对应部分
        if end_index is not None:
            words = words[start_index:end_index]
        elif start_index > 0:
            words = words[start_index:]

        print(f"开始生成 {len(words)} 个单词的完整词汇数据...")

        # 生成完整数据
        vocabulary_data = generate_vocabulary_data(words, batch_size=batch_size)

        # 保存结果
        if vocabulary_data:
            output_filename = "data/ielts_complete.json"
            save_vocabulary_data(vocabulary_data, output_filename)
            return jsonify({
                'success': True,
                'message': f"成功生成 {len(vocabulary_data)} 个单词的完整词汇数据",
                'count': len(vocabulary_data),
                'output_file': output_filename
            })
        else:
            return jsonify({
                'success': False,
                'message': '未能生成任何词汇数据'
            }), 500

    except Exception as e:
        print(f"Error in generate_vocabulary endpoint: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
