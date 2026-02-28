import React, { useEffect, useRef, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { getBubbleTheme } from '../utils/theme';

interface BottomSheetProps {
  selectedItem: BubbleItem | null;
}

// 右侧信息抽屉组件 - iOS 毛玻璃效果
// Apple Health / iOS 17 风格
// 毛玻璃 + 细边框 + 柔和阴影 + 可收起动画

export const BottomSheet: React.FC<BottomSheetProps> = ({ selectedItem }) => {
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
        fixed right-4 top-1/2 transform -translate-y-1/2 z-50
        bg-white/10 backdrop-blur-xl rounded-2xl
        border border-white/10 shadow-2xl
        transition-all duration-300 linear
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        ${isExpanded ? 'w-96 min-h-64' : 'w-16 max-h-128'}
      `}
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
          className={`w-4 h-4 text-white/80 transition-transform duration-300 ${
            isExpanded ? 'rotate-0' : 'rotate-180'
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
      <div className={`p-6 transition-all duration-300 ease-out ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
        {selectedItem && (
          <>
            {/* 标题区域 */}
            <div className="mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3 mb-2">
                {/* 关系类型徽章 - 同色系 */}
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme?.badgeColor }}
                />
                <h3 className="text-2xl font-serif font-semibold text-white/95">
                  {selectedItem.word}
                </h3>
              </div>

              <div className="flex items-center gap-3 text-white/60">
                {selectedItem.pos && (
                  <span className="text-sm font-medium">{selectedItem.pos}</span>
                )}
                {selectedItem.relation_type && (
                  <span className="text-sm font-medium">{selectedItem.relation_type}</span>
                )}
              </div>
            </div>

            {/* 中文释义 */}
            {selectedItem.chinese_gloss && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-white/60 mb-2">中文释义</h4>
                <p className="text-white/90 leading-relaxed">{selectedItem.chinese_gloss}</p>
              </div>
            )}

            {/* 例句 */}
            {selectedItem.example && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-white/60 mb-2">例句</h4>
                <p className="text-white/80 text-sm leading-relaxed italic">
                  "{selectedItem.example}"
                </p>
              </div>
            )}

            {/* 额外信息 */}
            {selectedItem.usage_notes && selectedItem.usage_notes.length > 0 && selectedItem.usage_notes[0] !== 'Common usage' && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-white/60 mb-2">额外信息</h4>
                <ul className="space-y-2">
                  {selectedItem.usage_notes.map((note, index) => (
                    <li key={index} className="text-white/80 text-sm leading-relaxed">
                      • {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 关系说明 */}
            {selectedItem.why && selectedItem.relation_type !== 'center' && (
              <div>
                <h4 className="text-sm font-medium text-white/60 mb-2">关系说明</h4>
                <p className="text-white/80 text-sm leading-relaxed">{selectedItem.why}</p>
              </div>
            )}
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
            {/* 关系类型徽章 */}
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.badgeColor }}
            />
            {/* 单词 - 纵向排列 */}
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
