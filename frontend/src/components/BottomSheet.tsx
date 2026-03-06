import React, { useEffect, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { isFavorited, toggleFavorite } from '../utils/favorites';
import { wordFormChineseMap } from '../utils/wordForms';
import { PronunciationButton } from './PronunciationButton';

interface BottomSheetProps {
  selectedItem: BubbleItem | null;
  includeAnalysis: boolean;
  isStreaming?: boolean;
  streamingReason?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ selectedItem, includeAnalysis, isStreaming, streamingReason }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [favorited, setFavorited] = useState(false);

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

  // 同步收藏状态
  useEffect(() => {
    setFavorited(isFavorited(selectedItem?.word ?? ''));
  }, [selectedItem?.word]);

  // 将 **text** 转为带加粗标签的 React 节点数组
  const renderWithBold = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} className="text-white/95 font-medium">{part.slice(2, -2)}</strong>
        : part
    );
  };

  const formatReason = (reason: string) => {
    if (!reason) return null;

    const lines = reason.split('\n').filter(line => line.trim());

    return lines.map((line, index) => {
      const trimmed = line.trim();
      // 识别编号列表项：以 "1." "2." 等开头
      const listMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
      if (listMatch) {
        return (
          <div key={index} className="flex gap-2 mb-2 last:mb-0">
            <span className="text-white/40 text-xs font-mono mt-0.5 shrink-0">{listMatch[1]}.</span>
            <p className="text-white/80 text-sm leading-relaxed">{renderWithBold(listMatch[2])}</p>
            <br />
          </div>
        );
      }
      return (
        <div>
          <p key={index} className="text-white/80 text-sm leading-relaxed mb-2 last:mb-0">
            {renderWithBold(trimmed)}
          </p>
          <br />
        </div>
      );
    });
  };

  return (
    <div
      className={`
        h-full w-full flex flex-col
        bg-white/10 backdrop-blur-xl rounded-2xl
        border border-white/10 shadow-2xl
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
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
            {/* 第1页：词汇详情 */}
            {currentPage === 1 && (
              <div className="h-full flex flex-col">
                {/* 标题区域 */}
                <div className="p-5 pb-3 border-b border-white/10 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-xl font-serif font-semibold text-white/95 shrink-0">
                      {selectedItem.word}
                    </h3>
                    <button
                      onClick={() => setFavorited(toggleFavorite(selectedItem.word))}
                      title={favorited ? '取消收藏' : '加入收藏'}
                      className="text-base leading-none transition-colors shrink-0 hover:scale-110 active:scale-95"
                      style={{ color: favorited ? '#f87171' : 'rgba(255,255,255,0.35)' }}
                    >
                      {favorited ? '♥' : '♡'}
                    </button>
                    {selectedItem.pronunciation && (
                      <span className="text-white/55 text-sm font-mono truncate">
                        {Array.isArray(selectedItem.pronunciation)
                          ? selectedItem.pronunciation[0]
                          : selectedItem.pronunciation}
                      </span>
                    )}
                    <PronunciationButton word={selectedItem.word} size={16} />
                    {selectedItem.frequency && (
                      <span className="ml-auto shrink-0 text-xs bg-white/10 px-1.5 py-0.5 rounded-full text-white/60">
                        词频 {selectedItem.frequency}/10
                      </span>
                    )}
                  </div>
                  {(selectedItem.pos || (selectedItem.category && selectedItem.category.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-1">
                      {selectedItem.pos && (
                        Array.isArray(selectedItem.pos) ? (
                          selectedItem.pos.map((p, idx) => (
                            <span key={idx} className="text-xs font-medium text-white/60">{p}</span>
                          ))
                        ) : (
                          <span className="text-xs font-medium text-white/60">{selectedItem.pos}</span>
                        )
                      )}
                      {selectedItem.category && selectedItem.category.map((cat, index) => (
                        <span key={index} className="text-xs bg-white/5 px-1.5 py-0.5 rounded text-white/50">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 滚动内容 */}
                <div className="flex-1 overflow-y-auto px-5 py-3">
                  {selectedItem.chinese_gloss && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-white/60 mb-1.5">中文释义</h4>
                      <p className="text-white/90 leading-relaxed text-sm">{selectedItem.chinese_gloss}</p>
                    </div>
                  )}

                  {selectedItem.english_meaning && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-white/60 mb-1.5">英文释义</h4>
                      <p className="text-white/80 text-xs leading-relaxed italic">{selectedItem.english_meaning}</p>
                    </div>
                  )}

                  {selectedItem.examples && selectedItem.examples.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-white/60 mb-1.5">例句</h4>
                      <div className="space-y-2.5">
                        {selectedItem.examples.map((example, index) => (
                          <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/5">
                            <p className="text-white/85 text-xs leading-relaxed italic mb-1">
                              "{example.sentence}"
                            </p>
                            <p className="text-white/65 text-xs leading-relaxed mb-0.5">
                              {example.chinese_translation}
                            </p>
                            <p className="text-white/45 text-[10px] font-medium">
                              — {example.source}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.word_forms && Object.keys(selectedItem.word_forms).length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-white/60 mb-1.5">词形变化</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(selectedItem.word_forms).map(([form, word], index) => (
                          <div key={index} className="bg-white/5 px-2 py-1 rounded-lg">
                            <span className="text-white/50 text-[10px] mr-0.5">{wordFormChineseMap[form] || form}:</span>
                            <span className="text-white/80 text-xs font-medium">{word}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.collocations && selectedItem.collocations.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-white/60 mb-1.5">高频搭配</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedItem.collocations.map((collocation, index) => (
                          <span key={index} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/75">
                            {collocation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.derivatives && selectedItem.derivatives.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-white/60 mb-1.5">派生词</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.derivatives.map((derivative, index) => (
                          <div key={index} className="bg-white/5 px-2 py-1 rounded-lg">
                            <div className="font-medium text-white/85 text-xs mb-0.5">
                              {derivative.word}
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              {derivative.pos && (
                                <span className="text-white/50">{derivative.pos}</span>
                              )}
                              {derivative.meaning && (
                                <span className="text-white/65">{derivative.meaning}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.usage_notes && selectedItem.usage_notes.length > 0 && selectedItem.usage_notes[0] !== 'Common usage' && (
                    <div>
                      <h4 className="text-xs font-medium text-white/60 mb-1.5">使用注意</h4>
                      <ul className="space-y-1">
                        {selectedItem.usage_notes.map((note, index) => (
                          <li key={index} className="text-white/80 text-xs leading-relaxed">
                            • {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 第2页：AI语义分析 */}
            {currentPage === 2 && (
              <div className="h-full flex flex-col px-5 py-4">
                <h4 className="text-xs font-medium text-white/60 mb-3 flex-shrink-0">AI 语义分析 ( 可点击上方关系类型筛选后对照查看讲解 )</h4>
                <div className="flex-1 overflow-y-auto">
                  {isStreaming && !streamingReason ? (
                    /* 气泡上色阶段：等待 reason_chunk 到来 */
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <p className="text-white/60 text-sm text-center leading-relaxed">
                        AI 正在分析词汇之间的关系类型，请耐心等待……
                      </p>
                      <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  ) : streamingReason ? (
                    /* 有 reason 内容：流式输出中或已完成 */
                    <div>
                      {isStreaming ? (
                        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                          {streamingReason}<span className="animate-pulse">▋</span>
                        </p>
                      ) : (
                        <div className="space-y-0">
                          {formatReason(streamingReason)}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 无分析内容（AI 模式尚未搜索） */
                    <div className="flex items-center justify-center h-full">
                      <p className="text-white/40 text-xs text-center">
                        搜索词汇后将在此显示 AI 语义分析
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
