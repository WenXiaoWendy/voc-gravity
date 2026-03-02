import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { BACKGROUND_COLOR } from '../utils/theme';
import { BottomSheet } from './BottomSheet';
import { BubbleField } from './BubbleField';
import { HoverBubbleCard } from './HoverBubbleCard';
import NavBar from './NavBar';
import RelationLegend from './RelationLegend';

// 导入本地词书数据
import ieltsVocabulary from '../data/ielts_complete.json';
// API基础URL
const API_BASE_URL = 'http://localhost:8000/api';

// 从本地JSON数据获取单词详细信息
const getWordDetails = (word: string): any => {
  return ieltsVocabulary[word] || null;
};

const retrieveSimilarWords = async (query: string, bookKey: string = 'ielts', includeAnalysis: boolean = false): Promise<{ words: string[], analysis?: any }> => {
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
    throw new Error(`服务器错误 (${response.status})`);
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
  const relationTypes = ['synonym', 'antonym', 'hypernym', 'hyponym', 'cohyponym', 'collocation', 'frame', 'register', 'noise'];
  const hash = simpleHash(centerWord + '_' + neighborWord);
  return [relationTypes[hash % relationTypes.length]];
};
// 主屏幕组件 - Apple Health / iOS 17 风格
// 莫兰迪低饱和渐变彩质感

const BOTTOM_BAR_CLASSES = 'fixed bottom-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-lg p-3 text-center text-sm text-white/60 border-t border-white/5';

export const VocabularyGravityScreen: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<BubbleItem | null>(null);
  const [hoverItem, setHoverItem] = useState<BubbleItem | null>(null);
  const [currentWords, setCurrentWords] = useState<BubbleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [includeAnalysis, setIncludeAnalysis] = useState(false);
  const [selectedRelationTypes, setSelectedRelationTypes] = useState<string[]>([]);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [showRelationColors, setShowRelationColors] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentQueryRef = useRef<string>('');
  const bubbleCache = useRef<Map<string, BubbleItem[]>>(new Map());

  // 挂载后默认搜索abandon
  useEffect(() => {
    handleSearch('abandon');
  }, []);

  // 确保 showRelationColors 和 includeAnalysis 保持一致
  useEffect(() => {
    // 如果切换到快速模式，立即关闭关系颜色
    if (!includeAnalysis) {
      setShowRelationColors(false);
    }
  }, [includeAnalysis]);

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

  const createBubbleItem = (
    word: string,
    id: string,
    layer: 'center' | 'inner' | 'middle' | 'outer',
    score: number,
    relation_type: string | string[]
  ): BubbleItem => {
    const wordDetails = getWordDetails(word);
    const {
      pos,
      chinese_meaning,
      frequency,
      category,
      pronunciation,
      english_meaning,
      examples,
      collocations,
      word_forms,
      derivatives,
      usage_notes
    } = wordDetails || {};

    return {
      id,
      word,
      pos: pos || 'n.',
      brief_gloss: chinese_meaning || `Definition for ${word}`,
      chinese_gloss: chinese_meaning || `${word}的中文释义`,
      source: 'retriever',
      layer,
      score,
      relation_type,
      frequency,
      category,
      pronunciation,
      english_meaning,
      examples,
      collocations,
      word_forms,
      derivatives,
      usage_notes: usage_notes || ['Common usage'],
      example: examples?.[0]?.sentence || `This is an example sentence for ${word}.`
    };
  };

  // 根据后端返回的单词数组生成气泡数据
  const generateBubbleItems = (words: string[], centerWord: string): BubbleItem[] => {
    const bubbleItems: BubbleItem[] = [];

    // 中心词
    bubbleItems.push(createBubbleItem(centerWord, 'center', 'center', 0.95, 'center'));

    // 按照7-16-32层级分配其他词汇
    const layerDistribution = [7, 16, 32];
    let wordIndex = 0;
    let uniqueId = 0;

    for (let layerIndex = 0; layerIndex < layerDistribution.length; layerIndex++) {
      const layerSize = layerDistribution[layerIndex];
      const layer = layerIndex === 0 ? 'inner' : layerIndex === 1 ? 'middle' : 'outer';
      let addedInLayer = 0;

      while (addedInLayer < layerSize && wordIndex < words.length) {
        const word = words[wordIndex];
        wordIndex++;

        if (word === centerWord) continue; // 跳过中心词

        const relationType = generateRelationType(centerWord, word);
        bubbleItems.push(createBubbleItem(
          word,
          `word-${uniqueId++}`,
          layer,
          0.95 - (wordIndex * 0.003),
          relationType
        ));
        addedInLayer++;
      }
    }

    return bubbleItems;
  };

  const handleSearch = useCallback(async (query: string, includeAnalysisParam?: boolean) => {
    if (!query.trim() || isLoading) {
      return;
    }

    // 只有当查询词改变时才跳过重复搜索
    // 模式切换时即使查询词相同也需要重新搜索
    if (currentQueryRef.current === query && includeAnalysisParam === undefined) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    currentQueryRef.current = query;
    const shouldIncludeAnalysis = includeAnalysisParam ?? includeAnalysis;

    try {
      // 检查缓存
      const cachedBubbleItems = bubbleCache.current.get(query);

      // 同步发起检索请求（整合语义邻域分析）
      const retrieveResult = await (cachedBubbleItems
        ? Promise.resolve({
          words: cachedBubbleItems.filter(item => item.word !== query).map(item => item.word),
          analysis: undefined
        })
        : retrieveSimilarWords(query, 'ielts', shouldIncludeAnalysis)
      );
      console.log('检索结果:', retrieveResult);

      if (retrieveResult.words.length === 0) {
        setErrorMessage('未检索到相关词汇，请尝试其他单词');
        return;
      }

      // 生成气泡数据
      const bubbleItems = cachedBubbleItems || generateBubbleItems(retrieveResult.words, query);

      if (retrieveResult.analysis) {
        try {
          const analysisData = retrieveResult.analysis;

          const updatedBubbleItems = bubbleItems.map(item => {
            if (item.id === 'center') {
              return {
                ...item,
                reason: analysisData.reason
              };
            }

            const relations = analysisData.relation?.[item.word];
            if (relations && relations.length > 0) {
              return {
                ...item,
                relation_type: relations,
              };
            }

            return item;
          });

          bubbleCache.current.set(query, updatedBubbleItems);
          setCurrentWords(updatedBubbleItems);

          const newCenterItem = updatedBubbleItems[0];
          setSelectedItem(newCenterItem);
          setLoadingItemId(null);

          if (shouldIncludeAnalysis) {
            setShowRelationColors(true);
          }

        } catch (e) {
          setCurrentWords(bubbleItems);
          setSelectedItem(bubbleItems[0]);
          setLoadingItemId(null);
          if (shouldIncludeAnalysis) {
            setShowRelationColors(true);
          }
        }
      } else {
        setCurrentWords(bubbleItems);
        setSelectedItem(bubbleItems[0]);
        setLoadingItemId(null);
        if (shouldIncludeAnalysis) {
          setShowRelationColors(true);
        }
      }

    } catch (error) {
      console.error('搜索失败:', error);
      setErrorMessage(error instanceof Error ? error.message : '搜索失败，请稍后重试');
      setLoadingItemId(null);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, includeAnalysis]);

  // 处理模式切换
  const handleModeChange = useCallback((newIncludeAnalysis: boolean) => {
    // 切换到快速探索时清空关系筛选项和loadingItemId
    if (!newIncludeAnalysis) {
      setSelectedRelationTypes([]);
      setLoadingItemId(null);
      setShowRelationColors(false);
    }

    setIncludeAnalysis(newIncludeAnalysis);

    // 切换到AI探索时
    if (currentQueryRef.current && newIncludeAnalysis) {
      // 检查缓存中是否有该单词的数据，且有AI分析数据
      const cachedBubbleItems = bubbleCache.current.get(currentQueryRef.current);
      const hasCachedAnalysis = cachedBubbleItems && cachedBubbleItems.some(item => item.reason);

      if (hasCachedAnalysis) {
        // 有缓存且有AI分析数据，直接使用缓存
        setCurrentWords(cachedBubbleItems);
        setSelectedItem(cachedBubbleItems[0]);
        setShowRelationColors(true);
      } else {
        // 没有缓存或没有AI分析数据，发起请求
        // 设置当前选中项为loadingItem，显示呼吸灯效果
        if (selectedItem) {
          setLoadingItemId(selectedItem.id);
        }

        // 清除当前查询词的缓存，强制重新获取包含AI分析的数据
        bubbleCache.current.delete(currentQueryRef.current);
        handleSearch(currentQueryRef.current, newIncludeAnalysis);
      }
    }
  }, [handleSearch, selectedItem]);

  const handleSelectItem = useCallback((item: BubbleItem) => {
    // 点击时设置正在加载的节点（显示呼吸灯效果，但不立即放大）
    setLoadingItemId(item.id);

    // 如果点击的是新词，发起搜索
    if (item.word !== currentQueryRef.current) {
      handleSearch(item.word, includeAnalysis);
    } else {
      // 点击的是当前中心词，直接选中它
      setSelectedItem(item);
      setLoadingItemId(null);
    }
  }, [handleSearch, includeAnalysis]);

  return (
    <div
      className="min-h-screen text-white font-serif"
      style={{ backgroundColor: BACKGROUND_COLOR }}
    >
      {/* 顶部状态栏 */}
      <NavBar
        onSearch={handleSearch}
        onModeChange={handleModeChange}
        isLoading={isLoading}
      />

      {/* 错误提示 */}
      {errorMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-lg px-6 py-3 shadow-xl">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white/90 text-sm">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="ml-2 text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 气泡场 */}
      <div className="pt-20 relative">
        {/* 气泡场 */}
        <BubbleField
          items={currentWords}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
          selectedRelationTypes={selectedRelationTypes}
          includeAnalysis={showRelationColors}
          isLoading={isLoading}
          loadingItemId={loadingItemId}
          onHoverItem={setHoverItem}
        />

        {/* Hover 卡片 */}
        <HoverBubbleCard item={hoverItem} includeAnalysis={showRelationColors} />
      </div>

      {/* 关系类型图例 - 固定在右上方 */}
      <RelationLegend
        selectedRelationTypes={selectedRelationTypes}
        filteredWordsCount={calculateFilteredWordsCount()}
        onRelationTypeChange={setSelectedRelationTypes}
        includeAnalysis={showRelationColors}
      />

      {/* 右侧信息抽屉 */}
      <BottomSheet selectedItem={selectedItem} includeAnalysis={showRelationColors} />

      {/* 底部信息栏 - 半透明 */}
      <div className={BOTTOM_BAR_CLASSES}>
        {includeAnalysis
          ? '🫧 点击任意气泡，探索词汇间的语义关系与详细分析'
          : '🫧 气泡颜色代表词性 • 点击气泡快速探索相邻语义空间 • 切换到AI模式获取关系分析'
        }
      </div>
    </div>
  );
};

export default VocabularyGravityScreen;
