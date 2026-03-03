import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any, Set

project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from core.generate_vocabulary import load_ielts_words, generate_vocabulary_data, save_vocabulary_data

def load_ielts_full_data() -> List[Dict[str, Any]]:
    """加载完整的雅思词库数据"""
    with open('data/ielts.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def get_single_words(words: List[str]) -> List[str]:
    """过滤掉包含空格的复合词"""
    return [word for word in words if ' ' not in word]

def load_progress() -> Dict[str, Any]:
    """加载进度文件"""
    progress_file = 'data/batch_progress.json'
    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        'completed_words': [],
        'failed_words': [],
        'current_index': 0
    }

def save_progress(progress: Dict[str, Any]):
    """保存进度"""
    with open('data/batch_progress.json', 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)

def process_batch(batch_words: List[str], batch_idx: int, total_batches: int, max_retries: int, retry_delay: float):
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
    batch_size: int = 80,
    max_retries: int = 3,
    retry_delay: float = 2.0,
    max_workers: int = 3,
    clear_old_data: bool = False
):
    """
    分批并行生成所有单词数据

    Args:
        batch_size: 每批单词数量（deepseek-reasoner 32k token，建议 60-100）
        max_retries: 最大重试次数
        retry_delay: 重试延迟（秒）
        max_workers: 并行线程数
        clear_old_data: 是否清空旧数据重新开始
    """
    # 加载完整词库
    ielts_data = load_ielts_full_data()
    all_words = [item['word'] for item in ielts_data]
    single_words = get_single_words(all_words)

    print(f"雅思词库总单词数: {len(all_words)}")
    print(f"单个单词数（不含复合词）: {len(single_words)}")
    print(f"每批大小: {batch_size}")
    print(f"并行线程数: {max_workers}")
    print(f"最大重试次数: {max_retries}")
    print(f"清空旧数据: {'是' if clear_old_data else '否'}")
    print("-" * 50)

    # 清空旧数据（如果需要）
    if clear_old_data:
        if os.path.exists('data/batch_progress.json'):
            os.remove('data/batch_progress.json')
            print("已清空进度文件")
        if os.path.exists('data/ielts_complete.json'):
            os.remove('data/ielts_complete.json')
            print("已清空结果文件")

    # 加载进度
    progress = load_progress()
    completed_words = set(progress['completed_words'])
    failed_words = progress['failed_words'].copy()

    # 从当前索引位置继续处理
    current_index = progress.get('current_index', 0)
    pending_words = single_words[current_index:]

    print(f"已完成: {len(completed_words)}")
    print(f"当前索引: {current_index}")
    print(f"待处理: {len(pending_words)}")
    if pending_words:
        print(f"前10个待处理（按顺序）: {pending_words[:10]}")
    print("-" * 50)

    # 加载已有的结果
    all_results = {}
    if os.path.exists('data/ielts_complete.json'):
        with open('data/ielts_complete.json', 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
            if isinstance(existing_data, list):
                for item in existing_data:
                    all_results[item["word"]] = item
            else:
                all_results = existing_data
        print(f"已加载 {len(all_results)} 个已有结果")

    # 切分批次
    batches = [
        pending_words[i:i + batch_size]
        for i in range(0, len(pending_words), batch_size)
    ]
    total_batches = len(batches)
    completed_count = 0

    # 并行处理
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(process_batch, batch, idx, total_batches, max_retries, retry_delay): (idx, batch)
            for idx, batch in enumerate(batches)
        }

        for future in as_completed(futures):
            idx, batch_words = futures[future]
            results, failed = future.result()

            # 更新结果（线程安全：GIL 保护 dict 更新）
            for item in results:
                all_results[item["word"]] = item
            completed_words.update(item["word"] for item in results)

            for word in failed:
                if word not in failed_words and word not in completed_words:
                    failed_words.append(word)
            failed_words = [w for w in failed_words if w not in completed_words]

            # 每完成一个批次保存进度和后端数据（不写前端，避免 Vite 热更新卡死）
            completed_count += 1
            progress['completed_words'] = list(completed_words)
            progress['failed_words'] = [w for w in failed_words if w not in completed_words]
            progress['current_index'] = current_index + completed_count * batch_size
            save_progress(progress)
            save_vocabulary_data(all_results, 'data/ielts_complete.json')

            print(f"总进度: {len(completed_words)}/{len(single_words)} ({len(completed_words)/len(single_words)*100:.1f}%)")

    # 全部完成后一次性同步到前端
    frontend_path = os.path.join(project_root, '../frontend/src/data/ielts_complete.json')
    save_vocabulary_data(all_results, frontend_path)
    print(f"已同步到前端: {frontend_path}")

    # 完成后总结
    print("\n" + "=" * 50)
    print("分批处理完成!")
    print(f"总单词数: {len(single_words)}")
    print(f"成功: {len(completed_words)}")
    print(f"失败: {len(failed_words)}")
    if failed_words:
        print(f"失败单词: {failed_words}")
    print(f"生成结果已保存到 data/ielts_complete.json")
    print("=" * 50)

    # 验证单词一致性
    print("\n验证单词一致性...")
    missing_words = [w for w in single_words if w not in all_results]
    if missing_words:
        print(f"  缺少 {len(missing_words)} 个单词: {missing_words}")
        print("  建议重新运行脚本以处理失败单词")
    else:
        print("  ✓ 所有单词均已生成!")

if __name__ == '__main__':
    batch_generate_all(
        batch_size=10,       # 每批10个（chat 响应快，小批多线程效率高）
        max_retries=3,       # 最多重试3次
        retry_delay=2.0,     # 重试延迟2秒
        max_workers=8,       # 8个并行线程
        clear_old_data=False # 不清空旧数据，继续之前的进度
    )
