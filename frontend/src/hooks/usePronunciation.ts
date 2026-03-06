import { useState, useCallback, useRef } from 'react';

// 缓存：word -> audio URL（null 表示该词无录音）
const audioCache = new Map<string, string | null>();
// 缓存：word -> 已预加载的 Audio 对象
const audioObjectCache = new Map<string, HTMLAudioElement>();

function _preloadAudioObject(word: string, url: string): void {
  if (!audioObjectCache.has(word)) {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audioObjectCache.set(word, audio);
  }
}

// 导出供组件预取使用
export function prefetchAudioUrl(word: string): void {
  if (audioCache.has(word)) {
    const url = audioCache.get(word);
    if (url) _preloadAudioObject(word, url);
    return;
  }
  fetchAudioUrl(word).then(url => {
    if (url) _preloadAudioObject(word, url);
  });
}

async function fetchAudioUrl(word: string): Promise<string | null> {
  if (audioCache.has(word)) {
    return audioCache.get(word)!;
  }
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (!res.ok) {
      audioCache.set(word, null);
      return null;
    }
    const data = await res.json();
    const phonetics: { audio?: string }[] = data[0]?.phonetics ?? [];
    const entry = phonetics.find((p) => p.audio && p.audio.trim() !== '');
    const url = entry?.audio ?? null;
    audioCache.set(word, url);
    return url;
  } catch {
    audioCache.set(word, null);
    return null;
  }
}

function speakWithTTS(word: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('SpeechSynthesis not supported'));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-GB';
    utterance.rate = 0.85;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang === 'en-GB' && v.localService) ??
      voices.find((v) => v.lang.startsWith('en-GB')) ??
      voices.find((v) => v.lang.startsWith('en-US') && v.localService);
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(new Error(e.error));
    window.speechSynthesis.speak(utterance);
  });
}

export function usePronunciation() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef(false);

  const speak = useCallback(
    async (word: string) => {
      if (isPlaying || isLoading) return;
      abortRef.current = false;
      setIsLoading(true);

      try {
        const audioUrl = await fetchAudioUrl(word);
        if (abortRef.current) return;

        if (audioUrl) {
          audioRef.current?.pause();
          const audio = audioObjectCache.get(word) ?? new Audio(audioUrl);
          audioRef.current = audio;
          audio.currentTime = 0;
          setIsLoading(false);
          setIsPlaying(true);
          await new Promise<void>((resolve, reject) => {
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error('Audio playback failed'));
            audio.play().catch(reject);
          });
        } else {
          setIsLoading(false);
          setIsPlaying(true);
          await speakWithTTS(word);
        }
      } catch {
        // 静默失败，不影响 UI
      } finally {
        setIsPlaying(false);
        setIsLoading(false);
      }
    },
    [isPlaying, isLoading]
  );

  return { speak, isPlaying, isLoading };
}
