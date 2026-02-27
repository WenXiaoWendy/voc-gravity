# qa.py
from langchain_community.vectorstores.faiss import FAISS
from langchain_community.embeddings.huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
import os

# 初始化组件（只加载一次）
_embedding = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
_llm = ChatOpenAI(name="gpt-3.5-turbo", temperature=0)

# 使用绝对路径加载faiss_index
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
faiss_index_path = os.path.join(project_root, "faiss_index")
_vectorstore = FAISS.load_local(faiss_index_path, embeddings=_embedding, allow_dangerous_deserialization=True)

from langchain.chains.retrieval_qa.base import RetrievalQA
_qa_chain = RetrievalQA.from_chain_type(llm=_llm, retriever=_vectorstore.as_retriever())

def ask_question(query: str) -> str:
    response = _qa_chain.invoke({"query": query})
    return response["result"]
