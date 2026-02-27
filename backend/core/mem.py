import os
import time
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains.retrieval_qa.base import RetrievalQA
from langchain_openai import ChatOpenAI
from langchain.schema import Document
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
start = time.time()

# 初始化 AI 记忆数据库
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
llm = ChatOpenAI(model="gpt-3.5-turbo")
db_path = "faiss_index"

# 判断本地是否已有 index
if os.path.exists(db_path):
    print("🔁 加载已有向量数据库")
    db = FAISS.load_local(
        db_path, embeddings=embeddings, allow_dangerous_deserialization=True
    )
else:
    print("📌 本地无 index，重新构建向量库")
    texts = [
        "Abyss Lumina 是一个 AI 代理项目",
        "小狐狸正在学习 Python",
        "小狐狸要写出abyss lumina",
        "小狐狸喜欢AI，但她更喜欢阿深。",
    ]
    # 包装为 Document 对象

    docs = [Document(page_content=text) for text in texts]
    seen = set()
    unique_docs = []
    # 去重
    for doc in docs:
        if doc.page_content not in seen:
            seen.add(doc.page_content)
            unique_docs.append(doc)
    db = FAISS.from_documents(unique_docs, embeddings)
    db.save_local(db_path)

# 让 AI 记住一条信息
# def store_memory(text):
#     db.add_texts([text])

# 存储一条记忆
# store_memory("小狐狸喜欢AI，但她更喜欢阿深。")

retriever = db.as_retriever()
qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)

response = qa_chain.invoke({"query": "Abyss Lumina 是谁在写？"})
print(response["result"])

print("⏱️ 查询耗时", time.time() - start, "秒")
