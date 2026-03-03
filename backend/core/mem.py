import os
import json
import time
from langchain_community.vectorstores import FAISS
# from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import OpenAIEmbeddings
from langchain.chains.retrieval_qa.base import RetrievalQA
from langchain_openai import ChatOpenAI
from langchain.schema import Document
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
start = time.time()

# backend 根目录（core/mem.py 的上一级）
_backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 初始化 AI 记忆数据库
# 使用本地模型避免HuggingFace认证问题
# embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
# 使用OpenAI text-embedding-3-large模型（DeepSeek不提供embedding服务）
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
    api_key=os.getenv("OPENAI_API_KEY") # type: ignore
)
llm = ChatOpenAI(
    model="deepseek-chat",
    base_url="https://api.deepseek.com/v1",
    api_key=os.getenv("DEEPSEEK_API_KEY") # type: ignore
)

# 注意：如果更改嵌入模型，需要删除 faiss_index 目录以重新构建索引

# 词书配置
VOCABULARY_BOOKS = {
    'ielts': {
        'name': '雅思词汇真经',
        'json_file': 'ielts.json',
        'description': '权威雅思词汇库'
    }
}

def get_vector_db(book_key='ielts'):
    """根据词书key值获取对应的向量数据库"""

    # 构建词书特定的数据库路径
    db_path = os.path.join(_backend_root, "faiss_index", book_key)

    # 确保目录存在
    os.makedirs(os.path.join(_backend_root, "faiss_index"), exist_ok=True)

    # 判断本地是否已有该词书的向量数据库
    if os.path.exists(db_path):
        print(f"🔁 加载词书 '{VOCABULARY_BOOKS[book_key]['name']}' 的向量数据库")
        db = FAISS.load_local(
            db_path, embeddings=embeddings, allow_dangerous_deserialization=True
        )
        return db
    else:
        print(f"📌 本地无词书 '{VOCABULARY_BOOKS[book_key]['name']}' 的向量库，重新构建")

        # 读取词书对应的JSON文件
        json_file_path = os.path.join(_backend_root, "data", VOCABULARY_BOOKS[book_key]['json_file'])

        if not os.path.exists(json_file_path):
            print(f"❌ 词书JSON文件不存在: {json_file_path}")
            return None

        # 读取JSON文件
        with open(json_file_path, 'r', encoding='utf-8') as f:
            vocabulary_data = json.load(f)

        # 将每条信息拼接成字符串
        texts = []
        for item in vocabulary_data:
            # 拼接词汇信息
            text_parts = []

            # 基本信息
            if 'word' in item:
                text_parts.append(f"单词: {item['word']}")
            if 'pos' in item:
                text_parts.append(f"词性: {item['pos']}")
            if 'meaning' in item:
                text_parts.append(f"中文释义: {item['meaning']}")
            if 'example' in item and item['example'] != '-':
                text_parts.append(f"例句: {item['example']}")
            if 'extra' in item and item['extra'] != '-':
                text_parts.append(f"额外信息: {item['extra']}")
            if 'topic' in item:
                text_parts.append(f"主题: {item['topic']}")

            # 拼接成完整文本
            if text_parts:
                text = " | ".join(text_parts)
                texts.append(text)

        if not texts:
            print("❌ 未从JSON文件中提取到有效文本")
            return None

        print(f"📚 处理了 {len(texts)} 条词汇信息")

        # 包装为 Document 对象
        docs = [Document(page_content=text) for text in texts]

        # 去重
        seen = set()
        unique_docs = []
        for doc in docs:
            if doc.page_content not in seen:
                seen.add(doc.page_content)
                unique_docs.append(doc)

        print(f"🔍 去重后剩余 {len(unique_docs)} 条唯一记录")

        # 构建向量数据库
        db = FAISS.from_documents(unique_docs, embeddings)

        # 保存到词书特定的路径
        db.save_local(db_path)
        print(f"💾 词书 '{VOCABULARY_BOOKS[book_key]['name']}' 向量数据库已保存")

        return db

# 默认加载雅思词书
db = get_vector_db('ielts')

# 让 AI 记住一条信息
def store_memory(text, book_key='ielts'):
    """存储一条记忆到指定词书的向量数据库"""
    global db
    if db:
        db.add_texts([text])
        # 重新保存更新后的数据库
        db.save_local(f"faiss_index/{book_key}")

# 查询相关记忆
def query_memory(query, book_key='ielts', k=5):
    """查询指定词书的相关记忆"""
    global db
    if db:
        results = db.similarity_search(query, k=k)
        return results
    return []

# 切换词书
def switch_vocabulary_book(book_key):
    """切换当前使用的词书"""
    global db
    if book_key in VOCABULARY_BOOKS:
        db = get_vector_db(book_key)
        return True
    else:
        print(f"❌ 未知的词书key: {book_key}")
        return False
