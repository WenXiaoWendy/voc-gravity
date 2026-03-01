from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
import json

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.1)
embedding = OpenAIEmbeddings(model="text-embedding-3-large")

# 新的在线问答功能：分析语义邻域
def analyze_semantic_neighborhood(center_word, neighbor_words):
    """
    分析中心词和其语义邻域的关系

    Args:
        center_word: 中心词
        neighbor_words: 语义邻域词汇列表

    Returns:
        OpenAI的分析结果
    """

    # 设置更明确的系统提示
    SYSTEM = """
你是一个专业的语义关系分析助手。请分析中心词和其邻域词汇之间的语义关系。

输入数据：
- 中心词：一个单词
- 邻域词汇：一个词汇列表

请为每个邻域词汇分配语义关系标签，使用以下关系代码：
- "syn": 同义词
- "ant": 反义词
- "hyper": 上位词
- "hypo": 下位词
- "sib": 同级词
- "coll": 搭配词
- "frame": 框架关系
- "reg": 区域变体
- "int": 强度变化
- "poly": 多义词不同含义
- "noise": 无关系或不确定

输出格式要求：
- 必须返回有效的JSON格式
- 每个邻域词汇作为键，对应的关系标签列表作为值
- 每个词汇可以有多个关系标签（最多3个）
- 如果词汇与中心词无关或不确定，使用["noise"]

示例输出格式：
{
  "desert": ["syn"],
  "forsake": ["syn"],
  "quit": ["frame"],
  "resign": ["frame"],
  "ditch": ["reg","syn"],
  "bishop": ["noise"]
}

请确保分析准确，不要添加额外的文本或解释。
"""

    # 构建更明确的用户提示
    user_prompt = f"""
请分析以下中心词和其邻域词汇的语义关系：

中心词: {center_word}
邻域词汇: {', '.join(neighbor_words)}

请按照上述要求输出JSON格式的分析结果。
"""

    messages = [
        SystemMessage(content=SYSTEM.strip()),
        HumanMessage(content=user_prompt.strip()),
    ]

    try:
        response = llm(messages)

        # 尝试解析JSON以确保格式正确
        try:
            parsed_response = json.loads(str(response.content))

            # 将关系代码映射为前端可用的关系类型
            # 关系代码到关系类型的映射
            relation_mapping = {
                "syn": "near-synonym",
                "ant": "contrast",
                "hyper": "topic-cluster",
                "hypo": "topic-cluster",
                "sib": "topic-cluster",
                "coll": "usage",
                "frame": "usage",
                "reg": "formal",
                "int": "formal",
                "poly": "confusable",
                "noise": "general"
            }

            # 转换关系类型，确保与输入顺序一致
            converted_response = {}

            # 按照输入顺序处理每个单词
            for word in neighbor_words:
                if word in parsed_response:
                    relations = parsed_response[word]
                    if relations and relations[0] != "noise":  # 使用第一个关系类型
                        converted_response[word] = [relation_mapping.get(relations[0], "general")]
                    else:
                        converted_response[word] = ["general"]
                else:
                    # 如果OpenAI没有返回该单词的关系，使用默认值
                    converted_response[word] = ["general"]

            return json.dumps(converted_response)

        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {e}")
            print(f"原始响应内容: {response.content}")
            # 如果JSON解析失败，返回默认的general响应
            error_response = {}
            for word in neighbor_words:
                error_response[word] = ["general"]
            return json.dumps(error_response)

        return response.content
    except Exception as e:
        print(f"OpenAI调用失败: {e}")
        # 返回一个默认的错误响应
        error_response = {}
        for word in neighbor_words:
            error_response[word] = ["noise"]
        return json.dumps(error_response)
