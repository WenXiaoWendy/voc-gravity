import React, { useEffect, useRef } from 'react';

interface AIAnalysisContentProps {
  isStreaming?: boolean;
  streamingReason?: string;
}

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
      <div key={index}>
        <p className="text-white/80 text-sm leading-relaxed mb-2 last:mb-0">
          {renderWithBold(trimmed)}
        </p>
        <br />
      </div>
    );
  });
};

export const AIAnalysisContent: React.FC<AIAnalysisContentProps> = ({ isStreaming, streamingReason }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 流式输出时自动滚到底部
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamingReason, isStreaming]);

  return (
    <div className="h-full flex flex-col px-5 py-4">
      <h4 className="text-xs font-medium text-white/60 mb-3 flex-shrink-0">AI 语义分析 ( 可进行关系类型筛选后对照查看讲解 )</h4>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isStreaming && !streamingReason ? (
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
          <div className="flex items-center justify-center h-full">
            <p className="text-white/40 text-xs text-center">
              搜索词汇后将在此显示 AI 语义分析
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
