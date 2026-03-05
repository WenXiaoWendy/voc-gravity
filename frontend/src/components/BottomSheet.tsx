import React, { useEffect, useRef, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { getBubbleTheme } from '../utils/theme';
import { wordFormChineseMap } from '../utils/wordForms';

interface BottomSheetProps {
  selectedItem: BubbleItem | null;
  includeAnalysis: boolean;
  isStreaming?: boolean;
  streamingReason?: string;
}

// 右侧信息抽屉组件 - iOS 毛玻璃效果
// Apple Health / iOS 17 风格
// 毛玻璃 + 细边框 + 柔和阴影 + 可收起动画

export const BottomSheet: React.FC<BottomSheetProps> = ({ selectedItem, includeAnalysis, isStreaming, streamingReason }) => {
  const formatReason = (reason: string) => {
    if (!reason) return null;

    let formatted = reason;

    formatted = formatted.replace(/。(?![\s\n])/g, '。\n');
    formatted = formatted.replace(/[：:](?![\s\n])/g, '：\n');
    formatted = formatted.replace(/；(?![\s\n])/g, '；\n');
    // formatted = formatted.replace(/，(?=[^，。；：；、]{10,}[：；。])/g, '，\n');

    const lines = formatted.split('\n').filter(line => line.trim());

    return lines.map((line, index) => (
      <p key={index} className="text-white/80 text-sm leading-relaxed mb-2 last:mb-0">
        {line.trim()}
      </p>
    ));
  };

  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // 当选中项变化时显示抽屉（延迟执行，避免与切换动画冲突）
  useEffect(() => {
    if (selectedItem) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsExpanded(true);
      }, 50); // 延迟50ms，确保在下一个setState中更新
      return () => clearTimeout(timer);
    } else {
      // 没有选中项时，延迟隐藏抽屉，保持DOM稳定
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsExpanded(false);
      }, 300); // 等待动画完成后再隐藏
      return () => clearTimeout(timer);
    }
  }, [selectedItem]);

  const theme = selectedItem ? getBubbleTheme(selectedItem) : null;

  return (
    <div
      ref={sheetRef}
      className={`
        fixed right-4 bottom-4 z-40
        bg-white/10 backdrop-blur-xl rounded-2xl
        border border-white/10 shadow-2xl
        transition-all duration-300 linear
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        ${isExpanded ? 'w-96 min-h-64' : 'w-16 max-h-128'}
      `}
      style={{ height: isExpanded ? '800px' : 'auto' }}
      aria-hidden={!isVisible}
    >
      {/* 展开按钮 - 收起状态下横向居中 */}
      <button
        className={`
          absolute top-4 right-4 z-10
          w-8 h-8 flex items-center justify-center
          rounded-full bg-white/10 hover:bg-white/20
          border border-white/10
          transition-all duration-200
          focus:outline-none
          ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? '收起抽屉' : '展开抽屉'}
        tabIndex={isVisible ? 0 : -1}
      >
        <svg
          className={`w-4 h-4 text-white/80 transition-transform duration-300 ${isExpanded ? 'rotate-0' : 'rotate-180'
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* 抽屉内容 */}
      <div className={`transition-all duration-300 ease-out ${isExpanded ? 'opacity-100' : 'opacity-0'} ${isExpanded ? 'h-full flex flex-col' : ''}`}>
        {selectedItem && (
          <>
            {/* 标题区域 - 固定 */}
            <div className="p-5 pb-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5 mb-1.5">
                <h3 className="text-xl font-serif font-semibold text-white/95">
                  {selectedItem.word}
                </h3>
                {selectedItem.pos && (
                  <div className="flex items-center gap-1">
                    {Array.isArray(selectedItem.pos) ? (
                      selectedItem.pos.map((p, idx) => (
                        <span key={idx} className="text-sm font-medium text-white/60">{p}</span>
                      ))
                    ) : (
                      <span className="text-sm font-medium text-white/60">{selectedItem.pos}</span>
                    )}
                  </div>
                )}
                {selectedItem.frequency && (
                  <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full text-white/60">
                    词频 {selectedItem.frequency}/10
                  </span>
                )}
              </div>
              {selectedItem.pronunciation && (
                <div className="mb-2">
                  {Array.isArray(selectedItem.pronunciation) ? (
                    selectedItem.pronunciation.map((pron, idx) => (
                      <p key={idx} className="text-white/70 text-sm font-mono">{pron}</p>
                    ))
                  ) : (
                    <p className="text-white/70 text-sm font-mono">{selectedItem.pronunciation}</p>
                  )}
                </div>
              )}
              {selectedItem.category && selectedItem.category.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedItem.category.map((cat, index) => (
                    <span key={index} className="text-xs bg-white/5 px-1.5 py-0.5 rounded text-white/60">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 滚动内容区域 */}
            <div className="flex-1 overflow-y-auto px-5 py-3">

              {/* 中文释义 */}
              {selectedItem.chinese_gloss && (
                <div className="mb-3 flex-shrink-0">
                  <h4 className="text-xs font-medium text-white/60 mb-1.5">中文释义</h4>
                  <p className="text-white/90 leading-relaxed text-sm">{selectedItem.chinese_gloss}</p>
                </div>
              )}

              {/* 英文释义 */}
              {selectedItem.english_meaning && (
                <div className="mb-3 flex-shrink-0">
                  <h4 className="text-xs font-medium text-white/60 mb-1.5">英文释义</h4>
                  <p className="text-white/80 text-xs leading-relaxed italic">{selectedItem.english_meaning}</p>
                </div>
              )}

              {/* 例句 */}
              {selectedItem.examples && selectedItem.examples.length > 0 && (
                <div className="mb-3 flex-shrink-0">
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

              {/* 词形变化 */}
              {selectedItem.word_forms && Object.keys(selectedItem.word_forms).length > 0 && (
                <div className="mb-3 flex-shrink-0">
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

              {/* 高频搭配 */}
              {selectedItem.collocations && selectedItem.collocations.length > 0 && (
                <div className="mb-3 flex-shrink-0">
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

              {/* 派生词 */}
              {selectedItem.derivatives && selectedItem.derivatives.length > 0 && (
                <div className="mb-3 flex-shrink-0">
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

              {/* 使用注意事项 */}
              {selectedItem.usage_notes && selectedItem.usage_notes.length > 0 && selectedItem.usage_notes[0] !== 'Common usage' && (
                <div className="flex-shrink-0">
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

              {includeAnalysis && (selectedItem.reason || streamingReason) && (
                <div className="pt-4 border-t border-white/10 flex-shrink-0 min-h-0 mb-3">
                  <h4 className="text-xs font-medium text-white/60 mb-2">AI语义分析</h4>
                  <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 border border-white/10 shadow-inner overflow-y-auto max-h-48">
                    <div className="space-y-0.5">
                      {isStreaming && streamingReason ? (
                        <p className="text-white/80 text-sm leading-relaxed">
                          {streamingReason}<span className="animate-pulse">▋</span>
                        </p>
                      ) : (
                        formatReason(selectedItem.reason ?? '')
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 收起状态显示 - 纵向展示单词 */}
      <div className={`
        absolute inset-0 flex flex-col items-center justify-center gap-3
        transition-all duration-300 ease-out
        ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}>
        {selectedItem && theme && (
          <>
            <div className="flex flex-col items-center">
              {selectedItem.word.split('').map((char, index) => (
                <span
                  key={index}
                  className="text-white/90 font-medium text-xs leading-none"
                >
                  {char}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
