import React, { useMemo, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { layoutBubbles } from '../utils/layout';
import { Bubble } from './Bubble';

interface BubbleFieldProps {
  items: BubbleItem[];
  selectedItem: BubbleItem | null;
  onSelectItem: (item: BubbleItem) => void;
  selectedRelationTypes?: string[];
  includeAnalysis?: boolean;
  isLoading?: boolean;
  loadingItemId?: string | null;
  isRelationPending?: boolean;
  recallMode?: boolean;
  onHoverItem?: (item: BubbleItem | null) => void;
}

// 气泡场组件
export const BubbleField = React.memo<BubbleFieldProps>(({ items, selectedItem, onSelectItem, selectedRelationTypes = [], includeAnalysis = false, isLoading = false, loadingItemId = null, isRelationPending = false, recallMode = false, onHoverItem }) => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // 监听窗口大小变化
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 仅在词汇集合（ID + score）变化时重新计算布局，忽略 relation_type 等展示属性的变动
  // word 内容也纳入 key，确保切换中心词时触发重新布局
  const itemsKey = useMemo(
    () => items.map(i => `${i.word}:${i.id}:${i.score.toFixed(4)}`).join('|'),
    [items]
  );
  const layouts = useMemo(() => {
    return layoutBubbles(items, viewport);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, viewport]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {items.map(item => {
        const layout = layouts.get(item.id);
        if (!layout) return null;

        // 判断气泡是否应该模糊（中心词始终可见，支持多选）
        const isBlurred = selectedRelationTypes.length > 0 && item.layer !== 'center' && item.relation_type ?
          (Array.isArray(item.relation_type) ?
            !item.relation_type.some(relation => selectedRelationTypes.includes(relation)) :
            !selectedRelationTypes.includes(item.relation_type)
          ) : false;

        // relation 待接收时，非中心气泡先置暗，收到 relation 后自动亮起
        const isPending = isRelationPending && item.layer !== 'center' && !item.relation_type?.length;

        return (
          <Bubble
            key={item.id}
            item={item}
            layout={layout}
            isSelected={selectedItem?.id === item.id}
            onClick={onSelectItem}
            isBlurred={isBlurred}
            isPending={isPending}
            includeAnalysis={includeAnalysis}
            isLoading={isLoading}
            isLoadingItem={loadingItemId === item.id}
            recallMode={recallMode}
            onMouseEnter={onHoverItem && !isBlurred ? (item) => onHoverItem(item) : undefined}
            onMouseLeave={onHoverItem && !isBlurred ? () => onHoverItem(null) : undefined}
          />
        );
      })}
    </div>
  );
});
