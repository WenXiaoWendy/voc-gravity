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
    from core.qa import ask_question
    from core.mem import query_memory, switch_vocabulary_book
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

@app.route('/api/ask', methods=['POST'])
def ask():
    if not backend_available:
        return jsonify({
            'error': 'Backend not available',
            'message': 'Python backend modules could not be loaded'
        }), 503

    try:
        data = request.get_json()
        question = data.get('question', '').strip()

        if not question:
            return jsonify({'error': 'Question is required'}), 400

        # 调用现有的问答函数
        answer = ask_question(question)

        return jsonify({
            'question': question,
            'answer': answer,
            'success': True
        })

    except Exception as e:
        print(f"Error in ask endpoint: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/api/retrieve', methods=['POST'])
def retrieve():
    """检索相似词汇接口"""
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

        if not query:
            return jsonify({'error': 'Query is required'}), 400

        # 调用向量数据库检索
        results = query_memory(query, book_key=book_key, k=k)

        # 提取单词信息
        words = []
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
                if word:
                    words.append(word)

        # 去重并保持顺序
        unique_words = []
        seen = set()
        for word in words:
            if word not in seen:
                seen.add(word)
                unique_words.append(word)

        return jsonify({
            'query': query,
            'words': unique_words[:56],  # 确保不超过56个
            'count': len(unique_words[:56]),
            'success': True
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    if not backend_available:
        return jsonify({
            'error': 'Backend not available',
            'message': 'Python backend modules could not be loaded'
        }), 503

    try:
        data = request.get_json()
        message = data.get('message', '').strip()

        if not message:
            return jsonify({'error': 'Message is required'}), 400

        # 这里可以扩展为更复杂的对话逻辑
        answer = ask_question(message)

        return jsonify({
            'message': message,
            'response': answer,
            'success': True
        })

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
