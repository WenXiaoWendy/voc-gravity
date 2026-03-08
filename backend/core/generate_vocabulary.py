import json
import os
from typing import List, Dict, Any
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
import sys

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from core.token_stats import token_stats


def validate_vocabulary_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    验证词汇数据是否符合规范

    Args:
        data: 单个词汇数据对象

    Returns:
        验证通过后的数据（可能经过清理）

    Raises:
        ValueError: 数据不符合规范时抛出
    """
    # 复制一份数据，避免修改原始数据
    validated = data.copy()

    # 必需字段检查
    required_fields = ['word', 'pos', 'frequency', 'category', 'pronunciation',
                      'chinese_meaning', 'english_meaning', 'examples',
                      'collocations', 'word_forms', 'derivatives', 'usage_notes']

    for field in required_fields:
        if field not in validated:
            raise ValueError(f"缺少必需字段: {field}")

    # word 验证
    if not isinstance(validated['word'], str) or not validated['word'].strip():
        raise ValueError(f"word 必须是非空字符串: {validated.get('word')}")
    validated['word'] = validated['word'].strip()

    # pos 验证
    if not isinstance(validated['pos'], list):
        raise ValueError(f"pos 必须是数组: {validated.get('pos')}")
    if len(validated['pos']) == 0:
        raise ValueError("pos 数组不能为空")

    valid_pos = {'n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'int.'}
    for pos in validated['pos']:
        if not isinstance(pos, str):
            raise ValueError(f"pos 元素必须是字符串: {pos}")
        if pos not in valid_pos:
            # 如果不是标准词性，尝试修正
            pos_lower = pos.lower().strip()
            if pos_lower in ['n', 'noun']:
                pos = 'n.'
            elif pos_lower in ['v', 'verb']:
                pos = 'v.'
            elif pos_lower in ['adj', 'adjective']:
                pos = 'adj.'
            elif pos_lower in ['adv', 'adverb']:
                pos = 'adv.'
            elif pos_lower in ['prep', 'preposition']:
                pos = 'prep.'
            elif pos_lower in ['conj', 'conjunction']:
                pos = 'conj.'
            elif pos_lower in ['pron', 'pronoun']:
                pos = 'pron.'
            elif pos_lower in ['int', 'interjection']:
                pos = 'int.'
            elif pos_lower in ['modal v.', 'modal verb', 'modal']:
                pos = 'v.'
            elif pos_lower in ['det.', 'det', 'determiner', 'art.', 'article']:
                pos = 'adj.'
            else:
                raise ValueError(f"无效的词性: {pos}")

    # frequency 验证
    if not isinstance(validated['frequency'], (int, float)):
        raise ValueError(f"frequency 必须是数字: {validated.get('frequency')}")
    validated['frequency'] = max(1, min(10, int(validated['frequency'])))

    # category 验证
    if not isinstance(validated['category'], list):
        raise ValueError(f"category 必须是数组: {validated.get('category')}")

    valid_categories = {'四级', '六级', '托福', '雅思', 'GRE', 'GMAT', 'SAT', 'ACT',
                       '考研', '专四', '专八', '商务英语', '日常用语'}
    validated['category'] = [cat for cat in validated['category']
                            if isinstance(cat, str) and cat in valid_categories]

    # pronunciation 验证
    if not isinstance(validated['pronunciation'], list):
        raise ValueError(f"pronunciation 必须是数组: {validated.get('pronunciation')}")
    if len(validated['pronunciation']) == 0:
        raise ValueError("pronunciation 数组不能为空")

    # chinese_meaning 验证
    if not isinstance(validated['chinese_meaning'], str):
        raise ValueError(f"chinese_meaning 必须是字符串: {validated.get('chinese_meaning')}")
    validated['chinese_meaning'] = validated['chinese_meaning'].strip()

    # english_meaning 验证
    if not isinstance(validated['english_meaning'], str):
        raise ValueError(f"english_meaning 必须是字符串: {validated.get('english_meaning')}")
    validated['english_meaning'] = validated['english_meaning'].strip()

    # examples 验证
    if not isinstance(validated['examples'], list):
        raise ValueError(f"examples 必须是数组: {validated.get('examples')}")

    validated_examples = []
    for i, example in enumerate(validated['examples'][:2]):  # 只保留前2条
        if not isinstance(example, dict):
            continue

        required_example_fields = ['sentence', 'chinese_translation', 'source']
        for field in required_example_fields:
            if field not in example:
                example[field] = ''

        if not isinstance(example['sentence'], str):
            example['sentence'] = ''
        if not isinstance(example['chinese_translation'], str):
            example['chinese_translation'] = ''
        if not isinstance(example['source'], str):
            example['source'] = ''

        example['sentence'] = example['sentence'].strip()
        example['chinese_translation'] = example['chinese_translation'].strip()
        example['source'] = example['source'].strip()

        validated_examples.append(example)

    validated['examples'] = validated_examples

    # collocations 验证
    if not isinstance(validated['collocations'], list):
        validated['collocations'] = []

    validated['collocations'] = [coll.strip() for coll in validated['collocations']
                                if isinstance(coll, str) and coll.strip()][:5]  # 最多5个

    # word_forms 验证
    if not isinstance(validated['word_forms'], dict):
        validated['word_forms'] = {}

    valid_word_form_keys = {
        'plural', 'singular', 'past_tense', 'past_participle',
        'present_participle', 'third_person_singular', 'gerund',
        'infinitive', 'comparative', 'superlative',
        'adjective', 'adverb', 'noun', 'verb'
    }

    validated_word_forms = {}
    for key, value in validated['word_forms'].items():
        if key in valid_word_form_keys and isinstance(value, str) and value.strip():
            validated_word_forms[key] = value.strip()

    validated['word_forms'] = validated_word_forms

    # derivatives 验证
    if not isinstance(validated['derivatives'], list):
        validated['derivatives'] = []

    validated_derivatives = []
    for derivative in validated['derivatives'][:5]:  # 最多5个
        if not isinstance(derivative, dict):
            continue

        required_derivative_fields = ['word', 'pos', 'meaning']
        for field in required_derivative_fields:
            if field not in derivative:
                derivative[field] = ''

        if not isinstance(derivative['word'], str):
            derivative['word'] = ''
        if not isinstance(derivative['pos'], str):
            derivative['pos'] = ''
        if not isinstance(derivative['meaning'], str):
            derivative['meaning'] = ''

        derivative['word'] = derivative['word'].strip()
        derivative['pos'] = derivative['pos'].strip()
        derivative['meaning'] = derivative['meaning'].strip()

        if derivative['word'] and derivative['pos']:
            # 限制中文解释不超过6个字
            if len(derivative['meaning']) > 6:
                derivative['meaning'] = derivative['meaning'][:6]
            validated_derivatives.append(derivative)

    validated['derivatives'] = validated_derivatives

    # usage_notes 验证
    if not isinstance(validated['usage_notes'], list):
        validated['usage_notes'] = []

    validated['usage_notes'] = [note.strip() for note in validated['usage_notes']
                                if isinstance(note, str) and note.strip()][:2]  # 最多2条

    return validated


SYSTEM_PROMPT = """你是一个严谨的英语词汇数据生成专家。请严格按照以下要求为给定单词生成词汇数据。

【核心要求】
1. 只返回纯JSON数组，不要任何额外文本、说明或markdown标记
2. 所有数据必须基于权威词典（如牛津、柯林斯、韦氏），不得编造
3. 如不确定某个信息，宁可省略也不要编造
4. 严格遵守字段类型和格式要求

【字段定义与要求】

word: 单词本身（字符串）
- 准确，与输入一致

pos: 词性（字符串数组）
- 必须使用标准缩写：n., v., adj., adv., prep., conj., pron., int.
- 多个词性按常用程度从高到低排序
- 示例：["v.", "n."]

frequency: 词频（数字1-10）
- 10=最常用，1=极少用
- 基于COCA或BNC语料库

category: 词汇类别（字符串数组）
- 只能从以下选择：四级, 六级, 托福, 雅思, GRE, GMAT, SAT, ACT, 考研, 专四, 专八, 商务英语, 日常用语
- 可多选

pronunciation: 音标（字符串数组）
- 使用国际音标，用 / 包裹
- 示例：["/ˈætməsfɪər/"]
- 多个发音按常用程度排序

chinese_meaning: 中文释义（字符串）
- 按常用程度排序，用分号分隔
- 第一、二个含义最重要
- 示例："大气层；氛围，气氛"

english_meaning: 英文释义（字符串）
- 按常用程度排序，用分号分隔
- 与中文释义一一对应

examples: 例句（对象数组，固定2条）
- 第1条对应第1个含义，第2条对应第2个含义
- 每个例句包含：
  - sentence: 英文例句（自然、真实，最好来自权威词典或语料库）
  - chinese_translation: 中文翻译（准确、通顺）
  - source: 来源（如牛津词典、柯林斯词典、日常对话、小说、新闻、电影、电视剧等，合理即可，不要编造具体作品名除非确实知道）
- 来源示例："牛津词典"、"柯林斯词典"、"日常对话"、"小说"、"新闻"、"电影"、"电视剧"、""

collocations: 高频搭配（字符串数组，3-5个）
- 实用、常用的搭配
- 示例：["friendly atmosphere", "atmosphere of"]

word_forms: 词形变化（对象）
- 键必须从以下选择，不得使用其他键：
  - plural: 复数
  - singular: 单数
  - past_tense: 过去式
  - past_participle: 过去分词
  - present_participle: 现在分词
  - third_person_singular: 第三人称单数
  - gerund: 动名词
  - infinitive: 不定式
  - comparative: 比较级
  - superlative: 最高级
  - adjective: 形容词形式
  - adverb: 副词形式
  - noun: 名词形式
  - verb: 动词形式
- 值为变化后的词
- 只包含实际存在的词形变化

derivatives: 派生词（对象数组，3-5个）
- 每个派生词包含：
  - word: 派生词（准确拼写）
  - pos: 词性（标准缩写）
  - meaning: 中文解释（1个最常用含义，不超过6个字）
- 派生词要实用、高频

usage_notes: 使用注意事项（字符串数组，可选）
- 如无特殊注意事项，返回空数组 []
- 如有，不超过2条

【输出格式】
[
  {
    "word": "atmosphere",
    "pos": ["n."],
    "frequency": 7,
    "category": ["四级", "六级", "雅思", "托福"],
    "pronunciation": ["/ˈætməsfɪər/"],
    "chinese_meaning": "大气层；氛围，气氛",
    "english_meaning": "the layer of gases surrounding the Earth; the mood or feeling in a place",
    "examples": [
      {
        "sentence": "The atmosphere of Mars is much thinner than that of Earth.",
        "chinese_translation": "火星的大气层比地球的稀薄得多。",
        "source": "牛津词典"
      },
      {
        "sentence": "There was a friendly atmosphere in the room.",
        "chinese_translation": "房间里有一种友好的氛围。",
        "source": "日常对话"
      }
    ],
    "collocations": ["friendly atmosphere", "tense atmosphere", "atmosphere of", "create an atmosphere"],
    "word_forms": {
      "plural": "atmospheres",
      "adjective": "atmospheric"
    },
    "derivatives": [
      {
        "word": "atmospheric",
        "pos": "adj.",
        "meaning": "大气的"
      },
      {
        "word": "atmospherically",
        "pos": "adv.",
        "meaning": "在大气中"
      }
    ],
    "usage_notes": ["既指物理大气层，也指抽象氛围"]
  }
]

【最后警告】
- 只返回JSON，不要任何其他内容
- 不要编造不确定的信息
- 严格遵守所有格式要求
- 确保JSON语法正确
"""


def generate_vocabulary_data(words: List[str], batch_size: int = 25) -> List[Dict[str, Any]]:
    """调用 LLM API 生成完整的词汇数据（单次 API 调用，由调用方控制批次大小）
    可替换为任意 OpenAI 兼容接口，参见 semantic.py 注释"""
    llm = ChatOpenAI(
        model="deepseek-chat",
        temperature=0.3,
        base_url="https://api.deepseek.com/v1",
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        max_tokens=8192
    )

    user_prompt = f"请为以下单词生成详细的词汇数据：\n\n{json.dumps(words, ensure_ascii=False, indent=2)}"

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_prompt)
    ]
    response = llm(messages)
    content = str(response.content)

    # 优先使用 API 实际返回的 token 数，fallback 到估算
    usage = response.response_metadata.get('token_usage', {})
    input_tokens = usage.get('prompt_tokens') or token_stats.estimate_tokens(SYSTEM_PROMPT + "\n" + user_prompt)
    output_tokens = usage.get('completion_tokens') or token_stats.estimate_tokens(content)

    # 记录 token 统计
    token_stats.record_call(
        model="deepseek-chat",
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cache_hit=False,
        metadata={"task": "generate_vocabulary", "word_count": len(words)}
    )

    # 解析 JSON
    start_idx = content.find('[')
    end_idx = content.rfind(']') + 1
    if start_idx == -1 or end_idx == 0:
        raise ValueError(f"无法从响应中提取 JSON: {content[:200]}...")

    batch_results = json.loads(content[start_idx:end_idx])

    # 验证每个单词数据
    validated_results = []
    for item in batch_results:
        try:
            validated_results.append(validate_vocabulary_data(item))
        except ValueError as e:
            print(f"  数据验证失败 [{item.get('word', 'unknown')}]: {e}")

    print(f"  成功处理 {len(validated_results)}/{len(batch_results)} 个单词")
    return validated_results


# 批量生成与词书管理相关函数见 core/batch_generate.py
