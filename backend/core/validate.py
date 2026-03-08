"""
词汇验证与标准化模块

流程：
1. Free Dictionary API 验证单词合法性（免费，无需 API Key）
2. DeepSeek 极简调用获取 lemma（原形）+ 基础中文含义
   - 成本极低：约 120 input + 30 output token ≈ 0.001 元/次
"""

import json
import os

import httpx
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

DICT_API = "https://api.dictionaryapi.dev/api/v2/entries/en/{word}"

VALIDATE_SYSTEM = """你是一个严格的英语词汇标准化工具。
给定用户输入的英文字符串，执行以下判断：

1. 判断是否为合法的英语单词（非乱码、非中文、非纯数字、非无意义字符串）
2. 如果合法，返回该词的原形（base form）：
   - 复数 → 单数（cats → cat）
   - 过去式 / 过去分词 → 原形（ran → run，written → write）
   - 现在分词 → 原形（running → run）
   - 比较级 / 最高级 → 原级（better → good，fastest → fast）
   - 如果已是原形，原样返回
3. 返回该词的词性（pos）：n., v., adj., adv., prep., conj., pron., int.等
4. 返回最简洁的中文基础释义（10字以内，不要例句，不要括号说明）

严格返回以下 JSON 格式之一，不要输出任何其他内容：
{"valid": true, "lemma": "原形单词", "pos": "词性", "chinese_meaning": "基础中文释义"}
{"valid": false, "error": "不是合法的英文单词"}"""


def validate_and_normalize(word: str) -> dict:
    """
    验证英文单词合法性，并返回原形（lemma）及基础中文释义。

    步骤：
    1. Free Dictionary API 验证合法性（无成本，快速）
    2. DeepSeek 获取 lemma + 中文含义（极小 token 调用）

    若词典 API 超时，fallback 到纯 AI 验证（不阻断流程）。
    """
    # Step 1: Free Dictionary API 验证
    dict_ok = None
    dict_definition = None
    dict_pos = None
    try:
        resp = httpx.get(DICT_API.format(word=word.lower()), timeout=5.0)
        dict_ok = resp.status_code != 404
        if not dict_ok:
            return {"valid": False, "error": "请输入合法的英文单词（非乱码、非中文、非纯数字、非无意义字符串）"}

        if dict_ok:
            data = resp.json()
            if data and len(data) > 0 and "meanings" in data[0]:
                meanings = data[0]["meanings"]
                if meanings and len(meanings) > 0:
                    dict_pos = meanings[0].get("partOfSpeech", "")
                    if dict_pos:
                        pos_map = {
                            "noun": "n.",
                            "verb": "v.",
                            "adjective": "adj.",
                            "adverb": "adv.",
                            "preposition": "prep.",
                            "conjunction": "conj.",
                            "pronoun": "pron.",
                            "interjection": "int."
                        }
                        dict_pos = pos_map.get(dict_pos, dict_pos + ".")
                    definitions = meanings[0].get("definitions", [])
                    if definitions and len(definitions) > 0:
                        dict_definition = definitions[0].get("definition", "")
    except Exception:
        # 网络超时等异常：跳过词典验证，交由 AI 判断
        dict_ok = None

    # Step 2: LLM 获取 lemma + 中文（可替换为任意 OpenAI 兼容接口，参见 semantic.py 注释）
    llm = ChatOpenAI(
        model="deepseek-chat",
        temperature=0,
        base_url="https://api.deepseek.com/v1",
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        max_tokens=80,
    )
    messages = [
        SystemMessage(content=VALIDATE_SYSTEM),
        HumanMessage(content=word),
    ]
    response = llm.invoke(messages)
    content = response.content.strip()

    # 记录 token 用量
    try:
        from core.token_stats import token_stats
        usage = response.response_metadata.get("token_usage", {})
        token_stats.record_call(
            model="deepseek-chat",
            input_tokens=usage.get("prompt_tokens") or 130,
            output_tokens=usage.get("completion_tokens") or 30,
            cache_hit=False,
            metadata={"task": "validate_word", "word": word},
        )
    except Exception:
        pass

    # 解析 JSON
    start = content.find("{")
    end = content.rfind("}") + 1
    if start == -1 or end == 0:
        return {"valid": False, "error": "验证服务暂时不可用"}

    result = json.loads(content[start:end])

    # 若词典 API 已确认合法但 AI 返回 invalid，以词典为准（更可靠）
    if dict_ok and not result.get("valid"):
        result = {"valid": True, "lemma": word.lower(), "pos": dict_pos or "", "chinese_meaning": dict_definition or ""}

    return result
