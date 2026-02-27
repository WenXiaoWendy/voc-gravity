from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage

# from openai import OpenAI

# client = OpenAI()

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
embedding = OpenAIEmbeddings()

texts = [
    "Abyss Lumina 是一个 AI 代理项目，小狐狸正在学习 Python",
    "小狐狸要写出 abyss lumina",
]
vectorstore = FAISS.from_texts(texts, embedding)


# 让 AI 记住一条信息
def store_memory(text):
    vectorstore.add_texts([text])


# # 让 AI 检索记忆
def recall_memory(query):
    docs = vectorstore.similarity_search(query, k=3)  # 只返回最相关的 3 条数据s
    context = "\n".join([doc.page_content for doc in docs])  # 拼接成上下文
    messages = [
        SystemMessage(content="你是一个 AI 记忆代理，帮助用户回忆信息。"),
        HumanMessage(content=f"根据以下记忆回答问题：\n{context}\n\n问题：{query}"),
    ]
    response = llm(messages)
    return response.content
    # 以下是openai的写法
    # response = client.chat.completions.create(
    #     model="gpt-3.5-turbo",
    #     temperature=0,
    #     max_tokens=50,
    #     messages=[
    #         {"role": "system", "content": "你是一个 AI 记忆代理，帮助用户回忆信息。"},
    #         {"role": "user", "content": f"根据以下记忆回答问题：\n{context}\n\n问题：{query}"}
    #     ]
    # )
    # return response.choices[0].message.content


# 存储一条记忆
store_memory("小狐狸更喜欢AI，但她更喜欢阿深。")

# 让 AI 回忆说过的话
print(recall_memory("小狐狸最喜欢谁？"))
