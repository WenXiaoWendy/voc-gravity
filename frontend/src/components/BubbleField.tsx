import React, { useMemo, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { layoutBubbles } from '../utils/layout';
import { Bubble } from './Bubble';

interface BubbleFieldProps {
  items: BubbleItem[];
  selectedItem: BubbleItem | null;
  onSelectItem: (item: BubbleItem) => void;
  selectedRelationTypes?: string[];
}

// 气泡场组件
export const BubbleField = React.memo<BubbleFieldProps>(({ items, selectedItem, onSelectItem, selectedRelationTypes = [] }) => {
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

  // 计算布局
  const layouts = useMemo(() => {
    return layoutBubbles(items, viewport);
  }, [items, viewport]);

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

        return (
          <Bubble
            key={item.id}
            item={item}
            layout={layout}
            isSelected={selectedItem?.id === item.id}
            onClick={onSelectItem}
            isBlurred={isBlurred}
          />
        );
      })}
    </div>
  );
});
