import React, { useEffect, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { GLASS_CARD_STYLE } from '../utils/theme';
import { AIAnalysisContent } from './AIAnalysisContent';
import { WordDetailContent } from './WordDetailContent';

// 半屏位置：45% 处开始，露出 center + inner 层气泡
const PANEL_TOP_HALF = 45;
// 全屏位置：顶部留出 safe area + 少量间距
const PANEL_TOP_FULL = 0;

interface MobileDetailPanelProps {
  isOpen: boolean;
  selectedItem: BubbleItem | null;
  includeAnalysis: boolean;
  isStreaming?: boolean;
  streamingReason?: string;
  isLoading?: boolean;
  onClose: () => void;
  onExplore: (word: string) => void;
}

export const MobileDetailPanel: React.FC<MobileDetailPanelProps> = ({
  isOpen, selectedItem, includeAnalysis,
  isStreaming, streamingReason, isLoading,
  onClose, onExplore,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const touchRef = React.useRef<{ startY: number } | null>(null);

  // 关闭时重置全屏状态
  useEffect(() => {
    if (!isOpen) setIsFullScreen(false);
  }, [isOpen]);

  // AI 模式开始流式时跳第2页
  useEffect(() => {
    if (isStreaming && includeAnalysis) setCurrentPage(2);
  }, [isStreaming, includeAnalysis]);

  // 切换到快速模式回第1页
  useEffect(() => {
    if (!includeAnalysis) setCurrentPage(1);
  }, [includeAnalysis]);

  // 新词加载时回第1页
  useEffect(() => {
    if (!isStreaming) setCurrentPage(1);
  }, [selectedItem?.word]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { startY: e.touches[0].clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const deltaY = e.changedTouches[0].clientY - touchRef.current.startY;
    if (deltaY > 80) {
      // 下拉：全屏→半屏，半屏→关闭
      if (isFullScreen) {
        setIsFullScreen(false);
      } else {
        onClose();
      }
    } else if (deltaY < -60 && !isFullScreen) {
      // 上拉：半屏→全屏
      setIsFullScreen(true);
    }
    touchRef.current = null;
  };

  const handleExplore = () => {
    if (selectedItem && !isLoading) {
      onExplore(selectedItem.word);
      onClose();
    }
  };

  const topPercent = isFullScreen ? PANEL_TOP_FULL : PANEL_TOP_HALF;

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 z-40 transition-all duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ top: `${topPercent}%` }}
    >
      <div
        className="h-full flex flex-col rounded-t-2xl"
        style={GLASS_CARD_STYLE}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* 顶栏：拖拽条 */}
        <div className="flex justify-center px-4 pt-2 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        {/* 分页指示器（AI 模式） */}
        {includeAnalysis && (
          <div className="flex items-center justify-center gap-0 py-2 flex-shrink-0 border-b border-white/10">
            <button
              onClick={() => setCurrentPage(1)}
              className={`w-5 h-5 rounded-full text-[10px] font-medium transition-all duration-200 flex items-center justify-center ${
                currentPage === 1
                  ? 'bg-white/30 text-white border border-white/50'
                  : 'bg-transparent text-white/40 border border-white/20'
              }`}
            >
              1
            </button>
            <div className="w-8 h-px bg-white/20 mx-1" />
            <button
              onClick={() => setCurrentPage(2)}
              className={`w-5 h-5 rounded-full text-[10px] font-medium transition-all duration-200 flex items-center justify-center ${
                currentPage === 2
                  ? 'bg-white/30 text-white border border-white/50'
                  : 'bg-transparent text-white/40 border border-white/20'
              }`}
            >
              2
            </button>
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {selectedItem && (
            <>
              {currentPage === 1 && (
                <WordDetailContent
                  item={selectedItem}
                  onExplore={handleExplore}
                  canExplore={!isLoading && selectedItem.layer !== 'center'}
                />
              )}
              {currentPage === 2 && <AIAnalysisContent isStreaming={isStreaming} streamingReason={streamingReason} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
