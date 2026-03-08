# ===========================================================================
# 批量词汇数据生成模块（仅在新增词书时使用）
#
# 用途：为整本词书批量调用 DeepSeek，生成完整词汇数据并写入 JSON 文件。
#
# 使用场景：
#   - 首次生成 IELTS 词书数据（已完成）
#   - 日后接入新词书（如 TOEFL、GRE）时重新运行
#
# 运行方式（在 backend/ 目录下执行）：
#   source venv/bin/activate
#   python -m core.batch_generate
#
# 进度恢复：中断后重新运行会从 data/batch_progress.json 自动续跑；
#           文件不存在时从头开始，不会报错。
# ===========================================================================

import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any

# 确保能找到同级模块
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_ROOT)

from core.generate_vocabulary import generate_vocabulary_data


# ---------------------------------------------------------------------------
# 词书数据加载
# ---------------------------------------------------------------------------

def load_ielts_words() -> List[str]:
    """从 ielts.json 加载单词列表（批量专用）"""
    file_path = os.path.join(BACKEND_ROOT, 'data', 'ielts.json')
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"文件 {file_path} 不存在")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return [item['word'] for item in data]


def load_ielts_full_data() -> List[Dict[str, Any]]:
    """加载完整的雅思词库数据（批量专用）"""
    file_path = os.path.join(BACKEND_ROOT, 'data', 'ielts.json')
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_single_words(words: List[str]) -> List[str]:
    """过滤掉包含空格的复合词"""
    return [word for word in words if ' ' not in word]


def save_vocabulary_data(data, filename: str = None):
    """保存生成的词汇数据到文件（支持数组或键值对格式）（批量专用）"""
    if filename is None:
        filename = os.path.join(BACKEND_ROOT, 'data', 'ielts_complete.json')

    os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)

    if isinstance(data, list):
        key_value_data = {item['word']: item for item in data}
        data_to_save = key_value_data
        count = len(key_value_data)
    else:
        data_to_save = data
        count = len(data)

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data_to_save, f, ensure_ascii=False, indent=2)
    print(f"已保存 {count} 个单词到 {filename}")


# ---------------------------------------------------------------------------
# 进度管理
# ---------------------------------------------------------------------------

def load_progress() -> Dict[str, Any]:
    """加载进度文件；不存在时从头开始"""
    progress_file = os.path.join(BACKEND_ROOT, 'data', 'batch_progress.json')
    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'completed_words': [], 'failed_words': [], 'current_index': 0}


def save_progress(progress: Dict[str, Any]):
    """保存进度"""
    progress_file = os.path.join(BACKEND_ROOT, 'data', 'batch_progress.json')
    with open(progress_file, 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# 批次处理
# ---------------------------------------------------------------------------

def process_batch(batch_words: List[str], batch_idx: int, total_batches: int,
                  max_retries: int, retry_delay: float):
    """处理单个批次，返回 (成功结果列表, 失败单词列表)"""
    print(f"\n[批次 {batch_idx + 1}/{total_batches}] 开始: {', '.join(batch_words)}")
    for retry in range(max_retries):
        try:
            results = generate_vocabulary_data(batch_words)
            generated_words = {item['word'] for item in results}
            failed = [w for w in batch_words if w not in generated_words]
            print(f"[批次 {batch_idx + 1}/{total_batches}] 完成: {len(results)}/{len(batch_words)} 成功")
            return results, failed
        except Exception as e:
            print(f"[批次 {batch_idx + 1}/{total_batches}] 第 {retry + 1} 次失败: {e}")
            if retry < max_retries - 1:
                time.sleep(retry_delay)
    print(f"[批次 {batch_idx + 1}/{total_batches}] 全部重试失败")
    return [], batch_words


def batch_generate_all(
    batch_size: int = 12,
    max_retries: int = 3,
    retry_delay: float = 2.0,
    max_workers: int = 8,
    clear_old_data: bool = False
):
    """
    分批并行生成所有单词数据。

    Args:
        batch_size:    每批单词数量（chat 小批多线程效率高）
        max_retries:   最大重试次数
        retry_delay:   重试延迟（秒）
        max_workers:   并行线程数
        clear_old_data:是否清空旧数据重新开始
    """
    ielts_data = load_ielts_full_data()
    all_words = [item['word'] for item in ielts_data]
    single_words = get_single_words(all_words)

    output_backend = os.path.join(BACKEND_ROOT, 'data', 'ielts_complete.json')

    print(f"雅思词库总单词数: {len(all_words)}")
    print(f"单个单词数（不含复合词）: {len(single_words)}")
    print(f"每批大小: {batch_size}  并行线程: {max_workers}  最大重试: {max_retries}")
    print(f"清空旧数据: {'是' if clear_old_data else '否'}")
    print("-" * 50)

    if clear_old_data:
        for f in [os.path.join(BACKEND_ROOT, 'data', 'batch_progress.json'), output_backend]:
            if os.path.exists(f):
                os.remove(f)
                print(f"已清空: {f}")

    progress = load_progress()
    completed_words = set(progress['completed_words'])
    failed_words = progress['failed_words'].copy()
    current_index = progress.get('current_index', 0)
    pending_words = single_words[current_index:]

    print(f"已完成: {len(completed_words)} | 当前索引: {current_index} | 待处理: {len(pending_words)}")
    if pending_words:
        print(f"前10个待处理: {pending_words[:10]}")
    print("-" * 50)

    # 加载已有结果
    all_results = {}
    if os.path.exists(output_backend):
        with open(output_backend, 'r', encoding='utf-8') as f:
            existing = json.load(f)
            all_results = existing if isinstance(existing, dict) else {item['word']: item for item in existing}
        print(f"已加载 {len(all_results)} 个已有结果")

    batches = [pending_words[i:i + batch_size] for i in range(0, len(pending_words), batch_size)]
    total_batches = len(batches)
    completed_count = 0

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(process_batch, batch, idx, total_batches, max_retries, retry_delay): (idx, batch)
            for idx, batch in enumerate(batches)
        }

        for future in as_completed(futures):
            idx, batch_words = futures[future]
            results, failed = future.result()

            for item in results:
                all_results[item['word']] = item
            completed_words.update(item['word'] for item in results)

            for word in failed:
                if word not in failed_words and word not in completed_words:
                    failed_words.append(word)
            failed_words = [w for w in failed_words if w not in completed_words]

            completed_count += 1
            progress['completed_words'] = list(completed_words)
            progress['failed_words'] = [w for w in failed_words if w not in completed_words]
            progress['current_index'] = current_index + completed_count * batch_size
            save_progress(progress)
            save_vocabulary_data(all_results, output_backend)

            print(f"总进度: {len(completed_words)}/{len(single_words)} ({len(completed_words)/len(single_words)*100:.1f}%)")


    print("\n" + "=" * 50)
    print("分批处理完成!")
    print(f"成功: {len(completed_words)} | 失败: {len(failed_words)}")
    if failed_words:
        print(f"失败单词: {failed_words}")

    missing = [w for w in single_words if w not in all_results]
    if missing:
        print(f"  缺少 {len(missing)} 个单词，建议重新运行")
    else:
        print("  ✓ 所有单词均已生成!")
    print("=" * 50)


if __name__ == '__main__':
    batch_generate_all()
