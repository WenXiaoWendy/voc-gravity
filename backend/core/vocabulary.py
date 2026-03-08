"""词汇详情服务：启动时加载 ielts_complete.json 到内存，提供批量查询"""
import os
import json

_backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_vocab_data: dict[str, dict] = {}


def _load():
    global _vocab_data
    path = os.path.join(_backend_root, "data", "ielts_complete.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            _vocab_data = json.load(f)
        print(f"📖 词汇详情已加载: {len(_vocab_data)} 词")


_load()


def get_word_details(word: str) -> dict | None:
    return _vocab_data.get(word)


def get_words_details(words: list[str]) -> dict[str, dict]:
    """批量查询，返回 {word: details}，不存在的词不包含在结果中"""
    return {w: _vocab_data[w] for w in words if w in _vocab_data}


def has_word(word: str) -> bool:
    return word in _vocab_data
