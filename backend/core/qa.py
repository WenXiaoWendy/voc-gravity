# qa.py
from langchain_community.vectorstores.faiss import FAISS
from langchain_community.embeddings.huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
import os

# 初始化组件（只加载一次）
_embedding = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
_llm = ChatOpenAI(name="gpt-3.5-turbo", temperature=0)

# 使用新的向量数据库架构
from core.mem import get_vector_db

# 默认使用雅思词书
_vectorstore = get_vector_db('ielts')

from langchain.chains.retrieval_qa.base import RetrievalQA

# 只有在向量数据库存在时才创建QA链
if _vectorstore:
    _qa_chain = RetrievalQA.from_chain_type(llm=_llm, retriever=_vectorstore.as_retriever())
else:
    _qa_chain = None

def ask_question(query: str) -> str:
    """问答函数 - 如果向量数据库不可用，返回默认响应"""
    if not _qa_chain:
        return "抱歉，当前向量数据库不可用，请检查后端配置。"

    try:
        response = _qa_chain.invoke({"query": query})
        return response["result"]
    except Exception as e:
        print(f"问答过程中出错: {e}")
        return "抱歉，处理您的问题时出现了错误。"
