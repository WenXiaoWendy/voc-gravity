import React, { useEffect, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { GLASS_CARD_STYLE } from '../utils/theme';
import { AIAnalysisContent } from './AIAnalysisContent';
import { WordDetailContent } from './WordDetailContent';

interface BottomSheetProps {
  selectedItem: BubbleItem | null;
  includeAnalysis: boolean;
  isStreaming?: boolean;
  streamingReason?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ selectedItem, includeAnalysis, isStreaming, streamingReason }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  const hasTwoPages = includeAnalysis;

  // 可见性：有选中词时显示
  useEffect(() => {
    if (selectedItem) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [selectedItem]);

  // AI 搜索开始时自动跳第2页
  useEffect(() => {
    if (isStreaming && hasTwoPages) {
      setCurrentPage(2);
    }
  }, [isStreaming, hasTwoPages]);

  // 切换到快速模式时强制回第1页
  useEffect(() => {
    if (!includeAnalysis) {
      setCurrentPage(1);
    }
  }, [includeAnalysis]);

  // 新词加载完成时（word 变化 + 非 streaming）回第1页
  useEffect(() => {
    if (!isStreaming) {
      setCurrentPage(1);
    }
  }, [selectedItem?.word]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`
        h-full w-full flex flex-col
        rounded-2xl shadow-2xl
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      style={GLASS_CARD_STYLE}
      aria-hidden={!isVisible}
    >
      {/* 分页指示器 */}
      {hasTwoPages && (
        <div className="flex items-center justify-center gap-0 py-3 flex-shrink-0 border-b border-white/10">
          <button
            onClick={() => setCurrentPage(1)}
            className={`
              w-5 h-5 rounded-full text-[10px] font-medium transition-all duration-200 flex items-center justify-center
              ${currentPage === 1
                ? 'bg-white/30 text-white border border-white/50'
                : 'bg-transparent text-white/40 border border-white/20 hover:border-white/35'
              }
            `}
            aria-label="词汇详情"
          >
            1
          </button>
          {/* 连接线 */}
          <div className="w-8 h-px bg-white/20 mx-1" />
          <button
            onClick={() => setCurrentPage(2)}
            className={`
              w-5 h-5 rounded-full text-[10px] font-medium transition-all duration-200 flex items-center justify-center
              ${currentPage === 2
                ? 'bg-white/30 text-white border border-white/50'
                : 'bg-transparent text-white/40 border border-white/20 hover:border-white/35'
              }
            `}
            aria-label="AI语义分析"
          >
            2
          </button>
        </div>
      )}

      {/* 页面内容 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {selectedItem && (
          <>
            {currentPage === 1 && <WordDetailContent item={selectedItem} />}
            {currentPage === 2 && <AIAnalysisContent isStreaming={isStreaming} streamingReason={streamingReason} />}
          </>
        )}
      </div>
    </div>
  );
};
