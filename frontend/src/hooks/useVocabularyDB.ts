import { useCallback, useRef } from 'react';

export function useVocabularyDB() {
  const vocabRef = useRef<Record<string, any>>({});
  const initialized = useRef(false);

  // 首次调用时从 localStorage 加载个人词库
  if (!initialized.current) {
    const personal = JSON.parse(localStorage.getItem('voc-personal') || '{}');
    vocabRef.current = { ...personal };
    initialized.current = true;
  }

  const getWordDetails = useCallback((word: string) => vocabRef.current[word] || null, []);

  /** 批量将后端返回的详情写入缓存（个人词库中已有的词不覆盖） */
  const cacheWordDetails = useCallback((details: Record<string, any>) => {
    if (!details) return;
    const personal = JSON.parse(localStorage.getItem('voc-personal') || '{}');
    for (const [word, data] of Object.entries(details)) {
      if (!personal[word]) {
        vocabRef.current[word] = data;
      }
    }
  }, []);

  // 中心词不在词库时调用，生成后缓存到 localStorage，不嵌入 FAISS
  const fetchAndCacheWord = useCallback(async (word: string): Promise<any> => {
    const res = await fetch('/api/generate-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word })
    });

    if (!res.ok) {
      if (res.status === 429) {
        const data = await res.json();
        throw new Error(data.message || '请求过于频繁，请稍后再试');
      }
      throw new Error(`服务器错误 (${res.status})`);
    }

    const data = await res.json();
    if (data.success && data.word_data) {
      vocabRef.current[word] = data.word_data;
      const personal = JSON.parse(localStorage.getItem('voc-personal') || '{}');
      personal[word] = data.word_data;
      localStorage.setItem('voc-personal', JSON.stringify(personal));
      return data.word_data;
    }
    return null;
  }, []);

  return { getWordDetails, cacheWordDetails, fetchAndCacheWord };
}
