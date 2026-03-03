from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
import json
import os
from core.token_stats import token_stats

llm = ChatOpenAI(
    model="deepseek-chat",
    temperature=0.1,
    # 出于与 OpenAI 兼容考虑，您也可以将 base_url 设置为 https://api.deepseek.com/v1 来使用，但注意，此处 v1 与模型版本无关
    base_url="https://api.deepseek.com/v1",
    api_key=os.getenv("DEEPSEEK_API_KEY") # type: ignore
)
embedding = OpenAIEmbeddings(
    model="text-embedding-3-large",
    api_key=os.getenv("OPENAI_API_KEY") # type: ignore
)

# 新的在线问答功能：分析语义邻域
def analyze_semantic_neighborhood(center_word, neighbor_words):
    """
    分析中心词和其语义邻域的关系

    Args:
        center_word: 中心词
        neighbor_words: 语义邻域词汇列表

    Returns:
        DeepSeek的分析结果
    """

    # 设置更明确的系统提示
    SYSTEM = """
你是一个专业的语义关系分析助手。请严格按照以下规则分析中心词和其语义邻域的关系。

【核心规则 - 必须遵守】
1. 先判断是否为 noise，如果不是，再从其他类型中选择
2. 优先使用更具体的类型，避免过度使用 frame
3. 每个词汇最多标记3个关系，按重要性从高到低排序

【关系类型定义 - 按优先级从高到低】

1. "synonym" - 近义/同义（最高优先级）
   - 定义：意思非常接近，在大多数语境下可以互换
   - 例子：abandon ↔ desert, quit ↔ resign
   - 判断标准：查词典会互相列为同义词

2. "antonym" - 反义/对立
   - 定义：意思完全相反或对立
   - 例子：big ↔ small, love ↔ hate
   - 判断标准：查词典会列为反义词

3. "hypernym" - 上位（更泛）
   - 定义：neighbor 是 center 的上位概念，范围更广
   - 例子：dog ↔ animal, apple ↔ fruit
   - 判断标准：center 是 neighbor 的一种

4. "hyponym" - 下位（更具体）
   - 定义：neighbor 是 center 的下位概念，范围更窄
   - 例子：animal ↔ dog, fruit ↔ apple
   - 判断标准：neighbor 是 center 的一种

5. "cohyponym" - 同类并列
   - 定义：与 center 共享同一个上位词，是兄弟关系
   - 例子：dog ↔ cat（都是 animal）, apple ↔ banana（都是 fruit）
   - 判断标准：属于同一类别，但不是上下位关系

6. "collocation" - 常见搭配
   - 定义：center 和 neighbor 经常一起出现，形成固定搭配
   - 例子：make ↔ decision, take ↔ care
   - 判断标准：经常组合在一起使用

7. "register" - 语体差异
   - 定义：意思相近但使用场合不同（正式/口语/文学/俚语等）
   - 例子：children ↔ kids, die ↔ pass away
   - 判断标准：同一概念的不同表达方式

8. "frame" - 同场景（谨慎使用）
   - 定义：在相同场景或语境中使用，但不属于以上任何类型
   - 注意：只有当其他类型都不适用时才使用
   - 例子：doctor ↔ hospital（都在医疗场景）

9. "noise" - 噪声/漂移（兜底）
   - 定义：满足以下条件之一
     - 词性/语义完全不相关
     - 明显是中心词另一义项导致的漂移
     - 模型无法给出任何合理解释
     - 属于邻域末尾且明显不相关

【输出格式要求 - 最重要】
- 只返回 JSON，不要任何其他文本、解释或markdown标记
- 不要添加任何前缀或后缀，直接返回JSON对象
- 必须返回严格有效的 JSON 格式
- reason：用中文提供专业的教学讲解（100-300字），包含：
  1. 整体分组概览
  2. 每个关系类型的代表性词汇举例
  3. 为什么这些词汇属于该类型的解释
  4. 学习建议或注意事项
- relation：每个邻域词汇作为键，对应关系标签数组作为值
- 确保所有 neighbor_words 中的词汇都出现在 relation 对象中
- 按输入顺序处理词汇

【输出格式说明】
{
 "reason": "本次分析围绕中心词 'abandon' 展开，邻域词汇可分为以下几类：\n1. 同义词（synonym）：desert、forsake 与 abandon 意思高度接近，都表示'离开、放弃'，在多数语境下可互换使用。\n2. 同场景词（frame）：quit、resign 都与'离开某个位置或状态'相关，quit 更口语化，resign 更正式，常用于辞去职位。\n3. 语体差异（register）：ditch 是口语化表达，与 abandon 同义，但更随意。\n4. 噪声（noise）：bishop 与 abandon 完全无关，属于召回误差。\n学习建议：注意区分正式与非正式用词，如 quit 与 resign 的使用场景差异。",
 "relation": {
    "desert": ["synonym"],
    "forsake": ["synonym"],
    "quit": ["frame"],
    "resign": ["frame"],
    "ditch": ["register", "synonym"],
    "bishop": ["noise"]
  }
}

现在请开始分析，严格遵守以上规则！
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
        output_text = str(response.content)

        # 优先使用 API 实际返回的 token 数，fallback 到估算
        usage = response.response_metadata.get('token_usage', {})
        input_tokens = usage.get('prompt_tokens') or token_stats.estimate_tokens(SYSTEM.strip() + "\n" + user_prompt.strip())
        output_tokens = usage.get('completion_tokens') or token_stats.estimate_tokens(output_text)

        # 记录 token 统计
        token_stats.record_call(
            model="deepseek-chat",
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cache_hit=False,
            metadata={"center_word": center_word, "neighbor_count": len(neighbor_words)}
        )

        # 尝试解析JSON以确保格式正确
        try:
            print("=" * 80)
            print(f"原始响应类型: {type(response.content)}")
            print(f"原始响应内容:")
            print(repr(response.content))
            print("=" * 80)

            # 清理响应内容，提取JSON部分
            content = str(response.content).strip()

            # 尝试找到JSON的开始和结束位置
            json_start = content.find('{')
            json_end = content.rfind('}')

            if json_start != -1 and json_end != -1 and json_end > json_start:
                content = content[json_start:json_end+1]

            # 清理无效控制字符和格式化问题
            import re
            # 移除所有控制字符
            content = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', content)
            # 修复reason字段中的换行符问题（更安全的方式）
            # 先找到reason字段的内容，然后单独处理
            reason_match = re.search(r'"reason":\s*"([^"]*)"', content)
            if reason_match:
                reason_content = reason_match.group(1)
                # 清理reason内容：移除换行符，替换双引号为单引号
                cleaned_reason = reason_content.replace('\n', ' ').replace('"', "'")
                # 替换回原内容
                content = content.replace(reason_content, cleaned_reason)
            # 确保JSON格式正确
            content = re.sub(r',\s*\}', '}', content)  # 移除尾随逗号
            content = re.sub(r',\s*\]', ']', content)  # 移除数组尾随逗号

            print(f"清理后的响应: {content}")
            print("=" * 80)

            parsed_response = json.loads(content)

            # 处理新的格式 {reason: "...", relation: {...}}
            result = {
                "reason": parsed_response.get("reason", ""),
                "relation": {}
            }

            # 提取 relation 对象
            relation_data = parsed_response.get("relation", {})

            # 按照输入顺序处理每个单词，确保所有单词都有结果
            for word in neighbor_words:
                if word in relation_data:
                    relations = relation_data[word]
                    if relations:
                        result["relation"][word] = relations
                    else:
                        result["relation"][word] = ["noise"]
                else:
                    # 如果DeepSeek没有返回该单词的关系，使用默认值
                    result["relation"][word] = ["noise"]

            return result

        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {e}")
            print(f"原始响应内容: {response.content}")
            # 如果JSON解析失败，返回默认的noise响应
            error_response = {
                "reason": "JSON解析失败，使用默认关系",
                "relation": {}
            }
            for word in neighbor_words:
                error_response["relation"][word] = ["noise"]
            return error_response

    except Exception as e:
        print(f"DeepSeek调用失败: {e}")
        # 返回一个默认的错误响应
        error_response = {
            "reason": f"DeepSeek调用失败: {str(e)}",
            "relation": {}
        }
        for word in neighbor_words:
            error_response["relation"][word] = ["noise"]
        return error_response
