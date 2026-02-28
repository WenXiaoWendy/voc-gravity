import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { BACKGROUND_COLOR } from '../utils/theme';
import { BottomSheet } from './BottomSheet';
import { BubbleField } from './BubbleField';
import NavBar from './NavBar';
import RelationLegend from './RelationLegend';

// 导入本地词书数据
import ieltsVocabulary from '../data/ielts.json';
// API基础URL
const API_BASE_URL = 'http://localhost:8000/api';

// 从本地JSON数据获取单词详细信息
const getWordDetails = (word: string): any => {
  return ieltsVocabulary.find((item: any) => item.word === word) || null;
};

// 后端检索相似词汇（整合语义邻域分析）
const retrieveSimilarWords = async (query: string, bookKey: string = 'ielts', includeAnalysis: boolean = true): Promise<{ words: string[], analysis?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/retrieve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        book_key: bookKey,
        k: 56,
        include_analysis: includeAnalysis
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return {
        words: data.words || [],
        analysis: data.analysis
      };
    } else {
      throw new Error(data.error || '检索失败');
    }
  } catch (error) {
    console.error('检索相似词汇失败:', error);
    return { words: [] };
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
const generateRelationType = (centerWord: string, neighborWord: string): string[] => {
  const relationTypes = ['near-synonym', 'contrast', 'confusable', 'topic-cluster', 'usage', 'formal', 'literary', 'noun-form', 'general'];
  const hash = simpleHash(centerWord + '_' + neighborWord);
  return [relationTypes[hash % relationTypes.length]];
};
// 主屏幕组件 - Apple Health / iOS 17 风格
// 莫兰迪低饱和渐变彩质感

const BOTTOM_BAR_CLASSES = 'fixed bottom-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-lg p-3 text-center text-sm text-white/60 border-t border-white/5';

export const VocabularyGravityScreen: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<BubbleItem | null>(null);
  const [currentWords, setCurrentWords] = useState<BubbleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [neighborhoodAnalysis, setNeighborhoodAnalysis] = useState<string>('');
  const [selectedRelationTypes, setSelectedRelationTypes] = useState<string[]>([]);
  const currentQueryRef = useRef<string>('');
  const bubbleCache = useRef<Map<string, BubbleItem[]>>(new Map());

  // 挂载后默认搜索abandon
  useEffect(() => {
    handleSearch('abandon');
  }, []);

  // 计算筛选后的单词数量
  const calculateFilteredWordsCount = (): number => {
    if (selectedRelationTypes.length === 0) {
      // 未选择任何关系类型时，显示所有单词（包括中心词）
      return currentWords.length + 1;
    }

    // 计算符合筛选条件的单词数量
    const filteredCount = currentWords.filter(item => {
      // 中心词始终显示
      if (item.layer === 'center') return true;

      // 检查单词的关系类型是否匹配选中的关系类型
      if (Array.isArray(item.relation_type)) {
        return item.relation_type.some(relation => selectedRelationTypes.includes(relation));
      } else if (item.relation_type) {
        return selectedRelationTypes.includes(item.relation_type);
      }

      return false;
    }).length;

    return filteredCount;
  };

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

      // 同步发起检索请求（整合语义邻域分析）
      const retrieveResult = await (cachedBubbleItems
        ? Promise.resolve({
          words: cachedBubbleItems.filter(item => item.word !== query).map(item => item.word),
          analysis: undefined
        })
        : retrieveSimilarWords(query, 'ielts', true)
      );

      if (retrieveResult.words.length === 0) {
        console.warn('未检索到相关词汇');
        return;
      }

      // 生成气泡数据
      const bubbleItems = cachedBubbleItems || generateBubbleItems(retrieveResult.words, query);

      // 存入缓存（如果没有缓存）
      if (!cachedBubbleItems) {
        bubbleCache.current.set(query, bubbleItems);
      }

      // 更新状态
      setCurrentWords(bubbleItems);
      setSelectedItem(bubbleItems[0]);

      // 设置语义邻域分析结果
      if (retrieveResult.analysis) {
        console.log('语义邻域分析结果:', retrieveResult.analysis);
        setNeighborhoodAnalysis(retrieveResult.analysis);
      }

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
      {/* 顶部状态栏 */}
      <NavBar
        isLoading={isLoading}
        selectedItemWord={selectedItem?.word || null}
        totalWordsCount={currentWords.length + 1}
        onSearch={handleSearch}
      />

      {/* 气泡场 */}
      <div className="pt-20 relative">
        {/* 气泡场 */}
        <BubbleField
          items={currentWords}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
          selectedRelationTypes={selectedRelationTypes}
        />

        {/* 加载状态覆盖层 */}
        {isLoading && (
          <div className="absolute inset-0 bg-transparent flex justify-center items-center z-50">
            <div className="flex flex-col items-center space-y-4">
              {/* 旋转的loading图标 */}
              <div className="w-12 h-12 border-4 border-white/30 border-t-white/80 rounded-full animate-spin"></div>
              <div className="text-white/80 text-lg font-medium">加载中...</div>
            </div>
          </div>
        )}
      </div>

      {/* 关系类型图例 - 固定在右上方 */}
      <RelationLegend
        selectedRelationTypes={selectedRelationTypes}
        filteredWordsCount={calculateFilteredWordsCount()}
        onRelationTypeChange={setSelectedRelationTypes}
      />

      {/* 右侧信息抽屉 */}
      <BottomSheet selectedItem={selectedItem} neighborhoodAnalysis={neighborhoodAnalysis} />

      {/* 底部信息栏 - 半透明 */}
      <div className={BOTTOM_BAR_CLASSES}>
        点击气泡探索语义邻域 • 支持近义词、对比词、易混淆词等多种关系类型
      </div>
    </div>
  );
};

export default VocabularyGravityScreen;
