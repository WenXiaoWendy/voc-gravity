import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { BACKGROUND_COLOR } from '../utils/theme';
import { BottomSheet } from './BottomSheet';
import { BubbleField } from './BubbleField';
import { SearchBar } from './SearchBar';

// 导入本地词书数据
import ieltsVocabulary from '../data/ielts.json';

// 词书配置
const VOCABULARY_BOOKS = [
  { key: 'ielts', name: '雅思词汇真经', description: '权威雅思词汇库' }
];

// API基础URL
const API_BASE_URL = 'http://localhost:8000/api';

// 从本地JSON数据获取单词详细信息
const getWordDetails = (word: string): any => {
  return ieltsVocabulary.find((item: any) => item.word === word) || null;
};

// 后端检索相似词汇
const retrieveSimilarWords = async (query: string, bookKey: string = 'ielts'): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/retrieve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        book_key: bookKey,
        k: 56
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return data.words || [];
    } else {
      throw new Error(data.error || '检索失败');
    }
  } catch (error) {
    console.error('检索相似词汇失败:', error);
    return [];
  }
};

// 简单的字符串哈希函数，用于生成确定性值
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash);
};

// 确定性关系类型生成，基于中心词和邻居词
const generateRelationType = (centerWord: string, neighborWord: string): string => {
  const relationTypes = ['near-synonym', 'contrast', 'confusable', 'topic-cluster', 'usage', 'formal', 'literary', 'noun-form', 'general'];
  const hash = simpleHash(centerWord + '_' + neighborWord);
  return relationTypes[hash % relationTypes.length];
};

// 主屏幕组件 - Apple Health / iOS 17 风格
// 莫兰迪低饱和渐变彩质感
// 深色背景 + 毛玻璃效果 + 克制设计

const TOP_BAR_CLASSES = 'fixed top-0 left-0 right-0 z-30 bg-black/30 backdrop-blur-xl p-4 border-b border-white/10';
const TOP_BAR_GRID_CLASSES = 'grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4';
const SELECT_CLASSES = 'w-40 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 appearance-none focus:outline-none focus:border-blue-500';
const SELECT_ARROW_CLASSES = 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60';
const BOTTOM_BAR_CLASSES = 'fixed bottom-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-lg p-3 text-center text-sm text-white/60 border-t border-white/5';

export const VocabularyGravityScreen: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<BubbleItem | null>(null);
  const [currentWords, setCurrentWords] = useState<BubbleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const currentQueryRef = useRef<string>('');
  const bubbleCache = useRef<Map<string, BubbleItem[]>>(new Map());

  // 挂载后默认搜索abandon
  useEffect(() => {
    handleSearch('abandon');
  }, []);

  // 根据后端返回的单词数组生成气泡数据
  const generateBubbleItems = (words: string[], centerWord: string): BubbleItem[] => {
    const bubbleItems: BubbleItem[] = [];

    // 中心词
    const centerWordDetails = getWordDetails(centerWord);
    bubbleItems.push({
      id: 'center',
      word: centerWord,
      pos: centerWordDetails?.pos || 'n.',
      brief_gloss: centerWordDetails?.meaning || `Definition for ${centerWord}`,
      chinese_gloss: centerWordDetails?.meaning || `${centerWord}的中文释义`,
      source: 'retriever',
      layer: 'center',
      score: 0.95,
      relation_type: 'center',
      why: `This is the center word: ${centerWord}`,
      usage_notes: centerWordDetails?.extra !== '-' ? [centerWordDetails?.extra] : ['Common usage'],
      example: centerWordDetails?.example || `This is an example sentence for ${centerWord}.`
    });

    // 按照7-16-32层级分配其他词汇
    const layerDistribution = [7, 16, 32];
    let wordIndex = 0;

    for (let layerIndex = 0; layerIndex < layerDistribution.length; layerIndex++) {
      const layerSize = layerDistribution[layerIndex];
      const layer = layerIndex === 0 ? 'inner' : layerIndex === 1 ? 'middle' : 'outer';

      for (let i = 0; i < layerSize && wordIndex < words.length; i++, wordIndex++) {
        const word = words[wordIndex];
        if (word === centerWord) continue; // 跳过中心词

        const wordDetails = getWordDetails(word);
        const relationType = generateRelationType(centerWord, word);

        bubbleItems.push({
          id: `word-${wordIndex}`,
          word: word,
          pos: wordDetails?.pos || 'n.',
          brief_gloss: wordDetails?.meaning || `Definition for ${word}`,
          chinese_gloss: wordDetails?.meaning || `${word}的中文释义`,
          source: 'retriever',
          layer,
          score: 0.95 - (wordIndex * 0.003),
          relation_type: relationType,
          why: `Related to ${centerWord} through ${relationType} relationship`,
          usage_notes: wordDetails?.extra !== '-' ? [wordDetails?.extra] : ['Common usage'],
          example: wordDetails?.example || `This is an example sentence for ${word}.`
        });
      }
    }

    return bubbleItems;
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || isLoading || currentQueryRef.current === query) {
      return;
    }

    setIsLoading(true);
    currentQueryRef.current = query;

    try {
      // 检查缓存
      const cachedBubbleItems = bubbleCache.current.get(query);
      if (cachedBubbleItems) {
        // 使用缓存数据
        setCurrentWords(cachedBubbleItems);
        setSelectedItem(cachedBubbleItems[0]);
        return;
      }

      // 调用后端检索接口
      const similarWords = await retrieveSimilarWords(query);

      if (similarWords.length === 0) {
        console.warn('未检索到相关词汇');
        return;
      }

      // 生成气泡数据（同步函数）
      const bubbleItems = generateBubbleItems(similarWords, query);

      // 存入缓存
      bubbleCache.current.set(query, bubbleItems);

      // 更新状态
      setCurrentWords(bubbleItems);
      setSelectedItem(bubbleItems[0]); // 设置中心词为选中状态

    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleSelectItem = useCallback((item: BubbleItem) => {
    // 如果点击的是新词，直接搜索（搜索完成后会自动设置选中项）
    if (item.word !== currentQueryRef.current) {
      handleSearch(item.word);
    }
  }, [handleSearch]);

  return (
    <div
      className="min-h-screen text-white font-serif"
      style={{ backgroundColor: BACKGROUND_COLOR }}
    >
      {/* 顶部状态栏 - 毛玻璃效果 */}
      <div className={TOP_BAR_CLASSES}>
        {/* 关键：全宽 + 1fr auto 1fr，保证搜索框以屏幕中心居中 */}
        <div className={TOP_BAR_GRID_CLASSES}>
          {/* 左 */}
          <div className="justify-self-start flex items-center gap-6 min-w-0">
            <div className="leading-tight">
              <h1 className="text-2xl font-semibold text-white/95">Voc Gravity</h1>
              <p className="text-sm text-white/60">语义邻域探索工具</p>
            </div>

            <div className="relative">
              <select
                className={SELECT_CLASSES}
                defaultValue="ielts"
              >
                {VOCABULARY_BOOKS.map((book) => (
                  <option key={book.key} value={book.key}>
                    {book.name}
                  </option>
                ))}
              </select>

              <svg
                className={SELECT_ARROW_CLASSES}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* 中：永远屏幕中心 */}
          <div className="justify-self-center w-[min(32rem,calc(100vw-2rem))]">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* 右 */}
          <div className="justify-self-end text-sm text-white/60 whitespace-nowrap">
            {isLoading ? "搜索中..." : `当前: ${selectedItem?.word || "无"} • 共 ${currentWords.length + 1} 个词`}
          </div>
        </div>
      </div>

      {/* 气泡场 */}
      <div className="pt-20 relative">
        {/* 始终渲染气泡场，保持组件挂载 */}
        <BubbleField
          items={currentWords}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
        />

        {/* 加载状态覆盖层 */}
        {/* {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="text-white/80 text-lg font-medium">加载中...</div>
          </div>
        )} */}
      </div>

      {/* 右侧信息抽屉 */}
      <BottomSheet selectedItem={selectedItem} />

      {/* 底部信息栏 - 半透明 */}
      <div className={BOTTOM_BAR_CLASSES}>
        点击气泡探索语义邻域 • 支持近义词、对比词、易混淆词等多种关系类型
      </div>
    </div>
  );
};

export default VocabularyGravityScreen;
