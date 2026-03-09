import React, { useCallback, useEffect, useRef, useState } from 'react';
import { retrieveSimilarWords, retrieveWithSSE, validateWord } from '../api/retrieve';
import { useErrorMessage } from '../hooks/useErrorMessage';
import { useVocabularyDB } from '../hooks/useVocabularyDB';
import { BubbleItem } from '../types/bubble';
import { loadPath, pushToPath } from '../utils/pathStack';
import { addToHistory } from '../utils/searchHistory';
import { BACKGROUND_COLOR } from '../utils/theme';
import { BottomSheet } from './BottomSheet';
import BreadcrumbPath from './BreadcrumbPath';
import { BubbleField } from './BubbleField';
import { ConfirmDialog } from './ConfirmDialog';
import { HoverBubbleCard } from './HoverBubbleCard';
import NavBar from './NavBar';
import RelationLegend from './RelationLegend';

// 主屏幕组件 - Apple Health / iOS 17 风格
// 莫兰迪低饱和渐变彩质感

const BOTTOM_BAR_CLASSES = 'fixed bottom-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-lg p-3 text-center text-sm text-white/60 border-t border-white/5';

export const VocabularyGravityScreen: React.FC = () => {
  const { getWordDetails, cacheWordDetails, fetchAndCacheWord } = useVocabularyDB();
  const [selectedItem, setSelectedItem] = useState<BubbleItem | null>(null);
  const [hoverItem, setHoverItem] = useState<BubbleItem | null>(null);
  const [currentWords, setCurrentWords] = useState<BubbleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [includeAnalysis, setIncludeAnalysis] = useState(false);
  const [selectedRelationTypes, setSelectedRelationTypes] = useState<string[]>([]);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [showRelationColors, setShowRelationColors] = useState(false);
  const { errorMessage, showError, clearError } = useErrorMessage();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingReason, setStreamingReason] = useState('');
  const [isRelationPending, setIsRelationPending] = useState(false);
  const [recallMode, setRecallMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ lemma: string; originalWord: string; pos?: string; chineseMeaning: string; isGenerating?: boolean } | null>(null);
  const [pathStack, setPathStack] = useState<string[]>(() => loadPath());
  const currentQueryRef = useRef<string>('');
  const bubbleCache = useRef<Map<string, BubbleItem[]>>(new Map());

  const updatePath = useCallback((word: string) => {
    setPathStack(prev => pushToPath(prev, word));
  }, []);

  // 组件挂载后触发默认搜索
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

        bubbleItems.push(createBubbleItem(
          word,
          `word-${uniqueId++}`,
          layer,
          0.95 - (wordIndex * 0.003),
          [] // 不生成伪关系类型，等待后端返回真实关系类型
        ));
        addedInLayer++;
      }
    }

    return bubbleItems;
  };

  const handleSearch = useCallback(async (query: string, includeAnalysisParam?: boolean) => {
    if (!query.trim() || isLoading) return;
    if (currentQueryRef.current === query && includeAnalysisParam === undefined) return;

    setIsLoading(true);
    clearError();
    currentQueryRef.current = query;
    const shouldIncludeAnalysis = includeAnalysisParam ?? includeAnalysis;

    try {
      // 缓存命中：直接使用缓存数据
      const cachedBubbleItems = bubbleCache.current.get(query);
      if (cachedBubbleItems) {
        setCurrentWords(cachedBubbleItems);
        setSelectedItem(cachedBubbleItems[0]);
        updatePath(query);
        setLoadingItemId(null);
        if (shouldIncludeAnalysis) setShowRelationColors(true);
        return;
      }

      if (shouldIncludeAnalysis) {
        // AI 模式：SSE 流式路径
        setStreamingReason(''); // 新搜索前重置，避免显示上一次的分析内容
        setIsStreaming(true);
        let localItems: BubbleItem[] = [];
        let localReason = '';
        let streamDone = false;

        try {
          for await (const event of retrieveWithSSE(query, 'ielts')) {
            if (currentQueryRef.current !== query) break; // 搜索词已变更，放弃此流

            if (event.type === 'words') {
              if (!event.words?.length) { showError('未检索到相关词汇，请尝试其他单词'); break; }
              if (event.word_details) cacheWordDetails(event.word_details);
              localItems = generateBubbleItems(event.words, query);
              setCurrentWords(localItems);
              setSelectedItem(localItems[0]);
              updatePath(query);
              // isLoading 保持 true，直到 done 才关闭，期间禁止操作
              setLoadingItemId('center'); // 中心气泡持续呼吸灯
              setIsRelationPending(true); // 非中心气泡先置暗
            } else if (event.type === 'relation') {
              localItems = localItems.map(item => {
                const rel = event.data[item.word];
                return rel ? { ...item, relation_type: rel } : item;
              });
              setCurrentWords([...localItems]);
              setShowRelationColors(true);
            } else if (event.type === 'reason_chunk') {
              localReason += event.data;
              // LLM 输出的是 JSON 原始字符流，\n 是 JSON 转义序列，需要还原为真实换行符
              setStreamingReason(
                localReason.replace(/^[\s"]+/, '').replace(/\\n/g, '\n').replace(/\\"/g, '"')
              );
            } else if (event.type === 'done') {
              // 清理首尾 JSON 残留，并还原 JSON 转义序列
              localReason = localReason
                .replace(/^[\s"]+/, '')
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/["}]+$/, '').trimEnd();
              localItems = localItems.map(item =>
                item.id === 'center' ? { ...item, reason: localReason } : item
              );
              bubbleCache.current.set(query, localItems);
              setCurrentWords([...localItems]);
              // 若用户仍在看中心词，同步更新 selectedItem 使 reason 生效
              const centerItem = localItems.find(i => i.id === 'center');
              if (centerItem) setSelectedItem(prev => prev?.id === 'center' ? centerItem : prev);
              setStreamingReason(localReason); // 保留最终 reason，供第2页持续显示
              setIsStreaming(false);
              setIsRelationPending(false);
              setLoadingItemId(null); // 呼吸灯停止
              setIsLoading(false);    // 恢复操作（移到 done 事件）
              streamDone = true;
            }
          }
        } finally {
          if (!streamDone) {
            setIsStreaming(false);
            setStreamingReason('');
            setIsRelationPending(false);
            setLoadingItemId(null);
          }
        }
      } else {
        // 快速模式：非流式
        const result = await retrieveSimilarWords(query, 'ielts', false);
        if (!result.words.length) { showError('未检索到相关词汇，请尝试其他单词'); return; }
        if (result.wordDetails) cacheWordDetails(result.wordDetails);
        const items = generateBubbleItems(result.words, query);
        bubbleCache.current.set(query, items);
        setCurrentWords(items);
        setSelectedItem(items[0]);
        updatePath(query);
        setLoadingItemId(null);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      showError(error instanceof Error ? error.message : '搜索失败，请稍后重试');
      setLoadingItemId(null);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, includeAnalysis, showError, clearError, updatePath]);

  // 搜索框入口：负责词汇验证、历史写入，再调公共 handleSearch
  const handleSearchFromBar = useCallback(async (rawQuery: string) => {
    if (isLoading) return;
    const query = rawQuery.trim();
    if (!query) return;

    clearError();
    setIsLoading(true);

    try {
      const validation = await validateWord(query);

      if (!validation.valid) {
        showError(validation.error || '请输入正确的英文单词');
        setIsLoading(false);
        return;
      }

      const lemma: string = validation.lemma;

      if (!validation.in_vocab) {
        setConfirmDialog({ lemma, originalWord: query, pos: validation.pos, chineseMeaning: validation.chinese_meaning || '' });
        setIsLoading(false);
        return;
      }

      // lemma 在词书中
      addToHistory(lemma);
      handleSearch(lemma);
    } catch (error) {
      showError(error instanceof Error ? error.message : '验证失败，请稍后重试');
      setIsLoading(false);
    }
  }, [isLoading, clearError, showError, handleSearch]);

  // 用户在弹窗中确认 AI 生成词汇详情
  const handleConfirmGenerate = useCallback(async () => {
    if (!confirmDialog || confirmDialog.isGenerating) return;
    const { lemma } = confirmDialog;
    // 弹窗内进入 loading 态，不关闭
    setConfirmDialog(prev => prev ? { ...prev, isGenerating: true } : null);
    await fetchAndCacheWord(lemma);
    addToHistory(lemma);
    // 数据就绪后关闭弹窗并发起搜索
    setConfirmDialog(null);
    currentQueryRef.current = ''; // 清空以绕过重复搜索检查
    handleSearch(lemma);
  }, [confirmDialog, fetchAndCacheWord, handleSearch]);

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
        onSearch={handleSearchFromBar}
        onModeChange={handleModeChange}
        onRecallModeChange={setRecallMode}
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
                onClick={clearError}
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

      {/* 面包屑探索路径 */}
      <BreadcrumbPath pathStack={pathStack} onNavigateTo={handleSearch} isLoading={isLoading} />

      {/* 气泡场：覆盖全屏，让 NavBar/面包屑的 backdrop-blur 能模糊到气泡 */}
      <div className="relative">
        <BubbleField
          items={currentWords}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
          selectedRelationTypes={selectedRelationTypes}
          includeAnalysis={showRelationColors}
          isLoading={isLoading}
          loadingItemId={loadingItemId}
          isRelationPending={isRelationPending}
          recallMode={recallMode}
          onHoverItem={setHoverItem}
        />

        {/* Hover 卡片 */}
        <HoverBubbleCard item={hoverItem} includeAnalysis={showRelationColors} />
      </div>

      {/* 右侧面板：关系类型图例 + 词汇详情面板，共享固定容器 */}
      <div
        className="fixed right-3 z-30 w-[432px] flex flex-col gap-2"
        style={{ top: pathStack.length >= 2 ? '128px' : '96px', bottom: '48px' }}
      >
        <div className="flex-shrink-0">
          <RelationLegend
            selectedRelationTypes={selectedRelationTypes}
            filteredWordsCount={calculateFilteredWordsCount()}
            onRelationTypeChange={setSelectedRelationTypes}
            includeAnalysis={showRelationColors}
          />
        </div>
        <div className="flex-1 min-h-0">
          <BottomSheet selectedItem={selectedItem} includeAnalysis={showRelationColors} isStreaming={isStreaming} streamingReason={streamingReason} />
        </div>
      </div>

      {/* 底部信息栏 - 半透明 */}
      <div className={BOTTOM_BAR_CLASSES}>
        {includeAnalysis
          ? '🫧 点击任意气泡，探索词汇间的语义关系与详细分析'
          : '🫧 气泡颜色代表词性 • 点击气泡快速探索相邻语义空间 • 切换到AI模式获取关系分析'
        }
      </div>

      {/* AI 生成确认弹窗 */}
      <ConfirmDialog
        isOpen={!!confirmDialog}
        word={confirmDialog?.lemma ?? ''}
        originalWord={confirmDialog?.originalWord ?? ''}
        pos={confirmDialog?.pos}
        chineseMeaning={confirmDialog?.chineseMeaning ?? ''}
        isGenerating={confirmDialog?.isGenerating}
        onConfirm={handleConfirmGenerate}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
};

export default VocabularyGravityScreen;
