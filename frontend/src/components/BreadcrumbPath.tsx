import React from 'react';

interface BreadcrumbPathProps {
  pathStack: string[];
  onNavigateTo: (word: string) => void;
  isLoading?: boolean;
}

const FOLD_THRESHOLD = 10; // 超过此数量才折叠
const MAX_VISIBLE = FOLD_THRESHOLD - 1; // 折叠时显示最后 N 个词

const BreadcrumbPath: React.FC<BreadcrumbPathProps> = ({ pathStack, onNavigateTo, isLoading = false }) => {
  if (pathStack.length < 2) return null;

  const hasHidden = pathStack.length > FOLD_THRESHOLD;
  const visibleItems = hasHidden ? pathStack.slice(-MAX_VISIBLE) : pathStack;

  return (
    <div className="fixed top-[70px] left-0 right-0 z-20"
      style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center gap-1 px-6 py-2.5 overflow-x-auto scrollbar-none min-w-0">
        {/* 若有隐藏词，显示第一个词 + 省略号 */}
        {hasHidden && (
          <>
            <button
              onClick={() => !isLoading && onNavigateTo(pathStack[0])}
              className={`text-sm shrink-0 whitespace-nowrap transition-colors ${isLoading ? 'text-white/25 cursor-default' : 'text-white/40 hover:text-white/65 cursor-pointer'}`}
            >
              {pathStack[0]}
            </button>
            <span className="text-white/20 text-sm shrink-0 select-none mx-0.5">···</span>
            <span className="text-white/20 text-sm shrink-0 select-none">›</span>
          </>
        )}

        {/* 可见词列表 */}
        {visibleItems.map((word, i) => {
          const isLast = i === visibleItems.length - 1;
          const globalIdx = hasHidden ? pathStack.length - MAX_VISIBLE + i : i;
          return (
            <React.Fragment key={`${word}-${globalIdx}`}>
              {i > 0 && (
                <span className="text-white/20 text-sm shrink-0 select-none">›</span>
              )}
              <button
                onClick={() => !isLast && !isLoading && onNavigateTo(word)}
                className={`text-sm shrink-0 whitespace-nowrap transition-colors ${
                  isLast
                    ? 'text-white/85 font-medium cursor-default'
                    : isLoading
                      ? 'text-white/25 cursor-default'
                      : 'text-white/45 hover:text-white/70 cursor-pointer'
                }`}
              >
                {word}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default BreadcrumbPath;
