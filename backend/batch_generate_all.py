import json
import os
import sys
import time
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

def batch_generate_all(
    batch_size: int = 8,
    max_retries: int = 3,
    retry_delay: float = 2.0,
    clear_old_data: bool = False
):
    """
    分批生成所有单词数据

    Args:
        batch_size: 每批单词数量
        max_retries: 最大重试次数
        retry_delay: 重试延迟（秒）
        clear_old_data: 是否清空旧数据重新开始
    """
    # 加载完整词库
    ielts_data = load_ielts_full_data()
    all_words = [item['word'] for item in ielts_data]
    single_words = get_single_words(all_words)

    print(f"雅思词库总单词数: {len(all_words)}")
    print(f"单个单词数（不含复合词）: {len(single_words)}")
    print(f"每批大小: {batch_size}")
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

    # 分批处理
    all_results = {}

    # 先加载已有的结果
    if os.path.exists('data/ielts_complete.json'):
        with open('data/ielts_complete.json', 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
            # 如果是数组格式，转换为键值对
            if isinstance(existing_data, list):
                for item in existing_data:
                    word = item["word"]
                    all_results[word] = item
            else:
                all_results = existing_data
        print(f"已加载 {len(all_results)} 个已有结果")

    # 分批处理
    total_batches = (len(pending_words) + batch_size - 1) // batch_size

    for batch_idx in range(total_batches):
        start_idx = batch_idx * batch_size
        end_idx = min((batch_idx + 1) * batch_size, len(pending_words))
        batch_words = pending_words[start_idx:end_idx]

        print(f"\n正在处理第 {batch_idx + 1}/{total_batches} 批")
        print(f"单词: {', '.join(batch_words)}")

        # 尝试生成，支持重试
        batch_success = False
        for retry in range(max_retries):
            try:
                batch_results = generate_vocabulary_data(batch_words, batch_size=batch_size)

                if batch_results:
                    print(f"  成功生成 {len(batch_results)}/{len(batch_words)} 个单词")

                    # 更新结果
                    generated_words = {item['word'] for item in batch_results}

                    # 添加到总结果
                    for item in batch_results:
                        word = item["word"]
                        all_results[word] = item

                    # 更新进度
                    completed_words.update(generated_words)

                    # 记录失败的单词
                    failed_in_batch = [w for w in batch_words if w not in generated_words]
                    for word in failed_in_batch:
                        if word not in failed_words:
                            failed_words.append(word)
                    # 从失败列表中移除成功的
                    failed_words = [w for w in failed_words if w not in generated_words]

                    # 保存进度和结果
                    progress['completed_words'] = list(completed_words)
                    progress['failed_words'] = failed_words
                    # 更新current_index为下一个待处理单词的位置
                    progress['current_index'] = current_index + end_idx
                    save_progress(progress)
                    save_vocabulary_data(all_results, 'data/ielts_complete.json')
                    # 同时保存到前端目录
                    frontend_path = os.path.join(project_root, '../frontend/src/data/ielts_complete.json')
                    save_vocabulary_data(all_results, frontend_path)

                    print(f"  总进度: {len(completed_words)}/{len(single_words)} ({len(completed_words)/len(single_words)*100:.1f}%)")

                    batch_success = True
                    break

            except Exception as e:
                print(f"  第 {retry + 1} 次尝试失败: {e}")
                if retry < max_retries - 1:
                    print(f"  {retry_delay} 秒后重试...")
                    time.sleep(retry_delay)

        if not batch_success:
            print(f"  批次失败，单词已加入失败列表")
            # 确保失败单词在列表中
            for word in batch_words:
                if word not in failed_words and word not in completed_words:
                    failed_words.append(word)
            progress['failed_words'] = failed_words
            save_progress(progress)

        # 批次间延迟，避免API限流
        if batch_idx < total_batches - 1:
            time.sleep(1)

    # 完成后的总结
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
    result_words = set(all_results.keys())
    missing_words = [w for w in single_words if w not in result_words]

    if missing_words:
        print(f"  缺少 {len(missing_words)} 个单词: {missing_words}")
        print("  建议重新运行脚本以处理失败单词")
    else:
        print("  ✓ 所有单词均已生成!")

if __name__ == '__main__':
    batch_generate_all(
        batch_size=8,       # 调整为8个，减少JSON解析失败概率
        max_retries=3,      # 最多重试3次
        retry_delay=2.0,    # 重试延迟2秒
        clear_old_data=False  # 不清空旧数据，继续之前的进度
    )
