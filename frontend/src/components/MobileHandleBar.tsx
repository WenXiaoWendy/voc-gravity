import React, { useEffect, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { isFavorited, toggleFavorite } from '../utils/favorites';
import { GLASS_CARD_STYLE } from '../utils/theme';
import { PronunciationButton } from './PronunciationButton';

interface MobileHandleBarProps {
  selectedItem: BubbleItem | null;
  isLoading?: boolean;
  onPullUp: () => void;
  onExplore: (word: string) => void;
}

export const MobileHandleBar: React.FC<MobileHandleBarProps> = ({ selectedItem, isLoading, onPullUp, onExplore }) => {
  const [favorited, setFavorited] = useState(false);
  const touchRef = React.useRef<{ startY: number; startTime: number } | null>(null);

  useEffect(() => {
    setFavorited(isFavorited(selectedItem?.word ?? ''));
  }, [selectedItem?.word]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { startY: e.touches[0].clientY, startTime: Date.now() };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const deltaY = touchRef.current.startY - e.changedTouches[0].clientY;
    const deltaTime = Date.now() - touchRef.current.startTime;
    if (deltaY > 30 || (deltaY > 10 && deltaTime < 200)) {
      onPullUp();
    }
    touchRef.current = null;
  };

  const handleExplore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedItem && !isLoading && selectedItem.layer !== 'center') {
      onExplore(selectedItem.word);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="rounded-t-2xl px-4 pt-2 pb-3 cursor-pointer"
        style={GLASS_CARD_STYLE}
        onClick={onPullUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* 拖拽指示条 */}
        <div className="flex justify-center mb-2">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        {selectedItem ? (
          <div className="flex items-center gap-2">
            {/* 左：词汇信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white/95 font-semibold text-base shrink-0">{selectedItem.word}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setFavorited(toggleFavorite(selectedItem.word)); }}
                  className="text-sm leading-none shrink-0 active:scale-95"
                  style={{ color: favorited ? '#f87171' : 'rgba(255,255,255,0.35)' }}
                >
                  {favorited ? '♥' : '♡'}
                </button>
                {selectedItem.pronunciation && (
                  <span className="text-white/45 text-[11px] font-mono truncate">
                    {Array.isArray(selectedItem.pronunciation) ? selectedItem.pronunciation[0] : selectedItem.pronunciation}
                  </span>
                )}
                <span onClick={e => e.stopPropagation()}>
                  <PronunciationButton word={selectedItem.word} size={14} />
                </span>
                {selectedItem.pos && (
                  <span className="text-white/40 text-[11px] shrink-0">
                    {Array.isArray(selectedItem.pos) ? selectedItem.pos[0] : selectedItem.pos}
                  </span>
                )}
              </div>
              <p className="text-white/55 text-xs truncate mt-0.5">
                {selectedItem.chinese_gloss}
              </p>
            </div>

            {/* 右：探索按钮或 loading */}
            {isLoading ? (
              <div className="flex gap-1 shrink-0">
                <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : selectedItem.layer !== 'center' ? (
              <button
                onClick={handleExplore}
                className="flex items-center gap-0.5 text-xs text-white/70 active:text-white shrink-0 px-2 py-1 rounded-full bg-white/10 active:bg-white/20 transition-all"
              >
                探索
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-white/40 text-sm text-center">点击气泡查看词汇详情</p>
        )}
      </div>
    </div>
  );
};
