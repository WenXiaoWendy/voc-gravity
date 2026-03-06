import React, { useEffect } from 'react';
import { usePronunciation, prefetchAudioUrl } from '../hooks/usePronunciation';

interface Props {
  word: string;
  size?: number;
  className?: string;
}

export const PronunciationButton: React.FC<Props> = ({ word, size = 15, className = '' }) => {
  const { speak, isPlaying, isLoading } = usePronunciation();

  // 组件渲染时立即预取，用户点击时直接从缓存播放
  useEffect(() => {
    prefetchAudioUrl(word);
  }, [word]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(word);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      title={`Pronounce "${word}"`}
      aria-label={`Play pronunciation of ${word}`}
      className={`inline-flex items-center justify-center rounded-full p-1
        text-white/50 hover:text-white/90 hover:bg-white/10
        transition-all duration-150 focus:outline-none
        disabled:opacity-40 disabled:cursor-wait
        ${isPlaying ? 'text-white/90' : ''}
        ${className}`}
    >
      {isPlaying ? (
        // 播放中：实心喇叭带声波
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
      ) : (
        // 静默：喇叭带全声波
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      )}
    </button>
  );
};
