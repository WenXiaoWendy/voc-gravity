import json
import os
from datetime import datetime
from typing import Dict, Optional

# 计费规则（单位：元/百万tokens）
PRICING = {
    "input_cached": 0.2,      # 输入（缓存命中）
    "input_uncached": 2.0,    # 输入（缓存未命中）
    "output": 3.0              # 输出
}

# 使用绝对路径，确保从任意目录运行时都写入同一个文件
_backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATS_FILE = os.path.join(_backend_root, "data", "token_stats.json")


class TokenStats:
    def __init__(self):
        self.stats = {
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "total_cost": 0.0,
            "calls": [],
            "daily_stats": {}
        }
        self.load_stats()

    def load_stats(self):
        """从文件加载统计数据"""
        if os.path.exists(STATS_FILE):
            try:
                with open(STATS_FILE, 'r', encoding='utf-8') as f:
                    self.stats = json.load(f)
            except Exception as e:
                print(f"加载统计数据失败: {e}")

    def save_stats(self):
        """保存统计数据到文件"""
        try:
            # 确保目录存在
            os.makedirs(os.path.dirname(STATS_FILE), exist_ok=True)
            with open(STATS_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.stats, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"保存统计数据失败: {e}")

    def record_call(self, model: str, input_tokens: int, output_tokens: int,
                     cache_hit: bool = False, metadata: Optional[Dict] = None):
        """记录一次 API 调用"""
        now = datetime.now()
        date_key = now.strftime("%Y-%m-%d")
        time_key = now.isoformat()

        # 计算费用
        input_cost = (input_tokens / 1_000_000) * (PRICING["input_cached"] if cache_hit else PRICING["input_uncached"])
        output_cost = (output_tokens / 1_000_000) * PRICING["output"]
        total_cost = input_cost + output_cost

        # 更新总体统计
        self.stats["total_input_tokens"] += input_tokens
        self.stats["total_output_tokens"] += output_tokens
        self.stats["total_cost"] += total_cost

        # 记录调用详情
        call_detail = {
            "time": time_key,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cache_hit": cache_hit,
            "cost": total_cost,
            "metadata": metadata or {}
        }
        self.stats["calls"].append(call_detail)

        # 更新每日统计
        if date_key not in self.stats["daily_stats"]:
            self.stats["daily_stats"][date_key] = {
                "input_tokens": 0,
                "output_tokens": 0,
                "cost": 0.0,
                "calls": 0
            }
        self.stats["daily_stats"][date_key]["input_tokens"] += input_tokens
        self.stats["daily_stats"][date_key]["output_tokens"] += output_tokens
        self.stats["daily_stats"][date_key]["cost"] += total_cost
        self.stats["daily_stats"][date_key]["calls"] += 1

        # 只保留最近 1000 次调用记录
        if len(self.stats["calls"]) > 1000:
            self.stats["calls"] = self.stats["calls"][-1000:]

        self.save_stats()
        return call_detail

    def get_stats(self, date: Optional[str] = None) -> Dict:
        """获取统计数据"""
        if date:
            return self.stats["daily_stats"].get(date, {
                "input_tokens": 0,
                "output_tokens": 0,
                "cost": 0.0,
                "calls": 0
            })
        return {
            "total": {
                "input_tokens": self.stats["total_input_tokens"],
                "output_tokens": self.stats["total_output_tokens"],
                "cost": self.stats["total_cost"],
                "calls": len(self.stats["calls"])
            },
            "daily": self.stats["daily_stats"],
            "recent_calls": self.stats["calls"][-20:]  # 最近 20 次调用
        }

    def estimate_tokens(self, text: str) -> int:
        """粗略估算文本的 token 数量（按中文字符约 1.3 tokens/字符，英文约 4 字符/token）"""
        if not text:
            return 0

        chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
        other_chars = len(text) - chinese_chars

        chinese_tokens = int(chinese_chars * 1.3)
        other_tokens = (other_chars + 3) // 4  # 向上取整

        return chinese_tokens + other_tokens


# 全局实例
token_stats = TokenStats()
