import { useEffect, useRef, useState } from 'react';

export function useVocabularyDB() {
  const [isLoaded, setIsLoaded] = useState(false);
  const vocabRef = useRef<Record<string, any>>({});

  useEffect(() => {
    fetch('/ielts_complete.json')
      .then(r => r.json())
      .then(base => {
        const personal = JSON.parse(localStorage.getItem('voc-personal') || '{}');
        vocabRef.current = { ...base, ...personal };
        setIsLoaded(true);
      });
  }, []);

  const getWordDetails = (word: string) => vocabRef.current[word] || null;

  // 中心词不在词库时调用，生成后缓存到 localStorage，不嵌入 FAISS
  const fetchAndCacheWord = async (word: string): Promise<any> => {
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
  };

  return { isLoaded, getWordDetails, fetchAndCacheWord };
}
