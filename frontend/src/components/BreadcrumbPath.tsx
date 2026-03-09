import React from 'react';

interface BreadcrumbPathProps {
  pathStack: string[];
  onNavigateTo: (word: string) => void;
  isLoading?: boolean;
  compact?: boolean;
}

const MAX_VISIBLE = 8;

const BreadcrumbPath: React.FC<BreadcrumbPathProps> = ({ pathStack, onNavigateTo, isLoading = false, compact = false }) => {
  if (pathStack.length < 2) return null;

  const visibleItems = pathStack.slice(-MAX_VISIBLE);
  const textSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div className="fixed top-[58px] left-0 right-0 z-20"
      style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div className={`flex items-center overflow-x-auto scrollbar-none min-w-0 ${compact ? 'gap-0.5 px-3 py-1.5' : 'gap-1 px-6 py-2.5'}`}>
        {pathStack.length > MAX_VISIBLE && (
          <>
            <span className={`text-white/25 ${textSize} shrink-0 select-none`}>···</span>
            <span className={`text-white/20 ${textSize} shrink-0 select-none`}>›</span>
          </>
        )}
        {visibleItems.map((word, i) => {
          const isLast = i === visibleItems.length - 1;
          const globalIdx = pathStack.length - visibleItems.length + i;
          return (
            <React.Fragment key={`${word}-${globalIdx}`}>
              {i > 0 && (
                <span className={`text-white/20 ${textSize} shrink-0 select-none`}>›</span>
              )}
              <button
                onClick={() => !isLast && !isLoading && onNavigateTo(word)}
                className={`${textSize} shrink-0 whitespace-nowrap transition-colors ${isLast
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
