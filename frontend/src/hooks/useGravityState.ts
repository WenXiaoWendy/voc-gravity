import { useCallback, useEffect, useRef, useState } from 'react';
import { retrieveSimilarWords, retrieveWithSSE, validateWord } from '../api/retrieve';
import { useErrorMessage } from './useErrorMessage';
import { useVocabularyDB } from './useVocabularyDB';
import { BubbleItem } from '../types/bubble';
import { loadPath, pushToPath } from '../utils/pathStack';
import { addToHistory } from '../utils/searchHistory';

export interface ConfirmDialogData {
  lemma: string;
  originalWord: string;
  pos?: string;
  chineseMeaning: string;
  isGenerating?: boolean;
}

export function useGravityState() {
  const { getWordDetails, cacheWordDetails, fetchAndCacheWord } = useVocabularyDB();
  const [selectedItem, setSelectedItem] = useState<BubbleItem | null>(null);
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
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogData | null>(null);
  const [pathStack, setPathStack] = useState<string[]>(() => loadPath());
  const currentQueryRef = useRef<string>('');
  const bubbleCache = useRef<Map<string, BubbleItem[]>>(new Map());

  const updatePath = useCallback((word: string) => {
    setPathStack(prev => pushToPath(prev, word));
  }, []);

  // 确保 showRelationColors 和 includeAnalysis 保持一致
  useEffect(() => {
    if (!includeAnalysis) {
      setShowRelationColors(false);
    }
  }, [includeAnalysis]);

  // 计算筛选后的单词数量
  const calculateFilteredWordsCount = (): number => {
    if (selectedRelationTypes.length === 0) {
      return currentWords.length + 1;
    }
    return currentWords.filter(item => {
      if (item.layer === 'center') return true;
      if (Array.isArray(item.relation_type)) {
        return item.relation_type.some(relation => selectedRelationTypes.includes(relation));
      } else if (item.relation_type) {
        return selectedRelationTypes.includes(item.relation_type);
      }
      return false;
    }).length;
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
      pos, chinese_meaning, frequency, category, pronunciation,
      english_meaning, examples, collocations, word_forms, derivatives, usage_notes
    } = wordDetails || {};

    return {
      id, word,
      pos: pos || 'n.',
      brief_gloss: chinese_meaning || `Definition for ${word}`,
      chinese_gloss: chinese_meaning || `${word}的中文释义`,
      source: 'retriever',
      layer, score, relation_type,
      frequency, category, pronunciation, english_meaning,
      examples, collocations, word_forms, derivatives,
      usage_notes: usage_notes || ['Common usage'],
      example: examples?.[0]?.sentence || `This is an example sentence for ${word}.`
    };
  };

  const generateBubbleItems = (words: string[], centerWord: string): BubbleItem[] => {
    const bubbleItems: BubbleItem[] = [];
    bubbleItems.push(createBubbleItem(centerWord, 'center', 'center', 0.95, 'center'));

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
        if (word === centerWord) continue;

        bubbleItems.push(createBubbleItem(
          word, `word-${uniqueId++}`, layer,
          0.95 - (wordIndex * 0.003), []
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
    setLoadingItemId('center');
    clearError();
    currentQueryRef.current = query;
    const shouldIncludeAnalysis = includeAnalysisParam ?? includeAnalysis;

    try {
      const cachedBubbleItems = bubbleCache.current.get(query);
      if (cachedBubbleItems) {
        const hasCachedAnalysis = cachedBubbleItems.some(item => item.reason);
        if (shouldIncludeAnalysis && !hasCachedAnalysis) {
          // Cache exists but without analysis — auto-switch to fast mode, no re-fetch
          setIncludeAnalysis(false);
          setShowRelationColors(false);
          setSelectedRelationTypes([]);
        }
        setCurrentWords(cachedBubbleItems);
        setSelectedItem(cachedBubbleItems[0]);
        updatePath(query);
        setLoadingItemId(null);
        if (shouldIncludeAnalysis && hasCachedAnalysis) setShowRelationColors(true);
        return;
      }

      if (shouldIncludeAnalysis) {
        setStreamingReason('');
        setIsStreaming(true);
        let localItems: BubbleItem[] = [];
        let localReason = '';
        let streamDone = false;

        try {
          for await (const event of retrieveWithSSE(query, 'ielts')) {
            if (currentQueryRef.current !== query) break;

            if (event.type === 'words') {
              if (!event.words?.length) { showError('未检索到相关词汇，请尝试其他单词'); break; }
              if (event.word_details) cacheWordDetails(event.word_details);
              localItems = generateBubbleItems(event.words, query);
              setCurrentWords(localItems);
              setSelectedItem(localItems[0]);
              updatePath(query);
              setLoadingItemId('center');
              setIsRelationPending(true);
            } else if (event.type === 'relation') {
              localItems = localItems.map(item => {
                const rel = event.data[item.word];
                return rel ? { ...item, relation_type: rel } : item;
              });
              setCurrentWords([...localItems]);
              setShowRelationColors(true);
            } else if (event.type === 'reason_chunk') {
              localReason += event.data;
              setStreamingReason(
                localReason.replace(/^[\s"]+/, '').replace(/\\n/g, '\n').replace(/\\"/g, '"')
              );
            } else if (event.type === 'done') {
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
              const centerItem = localItems.find(i => i.id === 'center');
              if (centerItem) setSelectedItem(prev => prev?.id === 'center' ? centerItem : prev);
              setStreamingReason(localReason);
              setIsStreaming(false);
              setIsRelationPending(false);
              setLoadingItemId(null);
              setIsLoading(false);
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

      addToHistory(lemma);
      handleSearch(lemma);
    } catch (error) {
      showError(error instanceof Error ? error.message : '验证失败，请稍后重试');
      setIsLoading(false);
    }
  }, [isLoading, clearError, showError, handleSearch]);

  const handleConfirmGenerate = useCallback(async () => {
    if (!confirmDialog || confirmDialog.isGenerating) return;
    const { lemma } = confirmDialog;
    setConfirmDialog(prev => prev ? { ...prev, isGenerating: true } : null);
    await fetchAndCacheWord(lemma);
    addToHistory(lemma);
    setConfirmDialog(null);
    currentQueryRef.current = '';
    handleSearch(lemma);
  }, [confirmDialog, fetchAndCacheWord, handleSearch]);

  const handleModeChange = useCallback((newIncludeAnalysis: boolean) => {
    if (!newIncludeAnalysis) {
      setSelectedRelationTypes([]);
      setLoadingItemId(null);
      setShowRelationColors(false);
    }

    setIncludeAnalysis(newIncludeAnalysis);

    if (currentQueryRef.current && newIncludeAnalysis) {
      const cachedBubbleItems = bubbleCache.current.get(currentQueryRef.current);
      const hasCachedAnalysis = cachedBubbleItems && cachedBubbleItems.some(item => item.reason);

      if (hasCachedAnalysis) {
        setCurrentWords(cachedBubbleItems);
        setSelectedItem(cachedBubbleItems[0]);
        setShowRelationColors(true);
      } else {
        if (selectedItem) {
          setLoadingItemId(selectedItem.id);
        }
        bubbleCache.current.delete(currentQueryRef.current);
        handleSearch(currentQueryRef.current, newIncludeAnalysis);
      }
    }
  }, [handleSearch, selectedItem]);

  // 桌面端行为：点击气泡触发搜索
  const handleSelectItem = useCallback((item: BubbleItem) => {
    setLoadingItemId(item.id);
    if (item.word !== currentQueryRef.current) {
      handleSearch(item.word, includeAnalysis);
    } else {
      setSelectedItem(item);
      setLoadingItemId(null);
    }
  }, [handleSearch, includeAnalysis]);

  // 组件挂载后触发默认搜索：恢复上次路径末尾词，否则搜 abandon
  useEffect(() => {
    const saved = loadPath();
    const lastWord = saved.length > 0 ? saved[saved.length - 1] : 'abandon';
    handleSearch(lastWord);
  }, []);

  return {
    // State
    selectedItem, setSelectedItem,
    currentWords,
    isLoading,
    includeAnalysis,
    selectedRelationTypes, setSelectedRelationTypes,
    loadingItemId,
    showRelationColors,
    errorMessage, clearError,
    isStreaming, streamingReason,
    isRelationPending,
    recallMode, setRecallMode,
    confirmDialog, setConfirmDialog,
    pathStack,

    // Handlers
    handleSearch,
    handleSearchFromBar,
    handleConfirmGenerate,
    handleModeChange,
    handleSelectItem,

    // Derived
    calculateFilteredWordsCount,
  };
}
