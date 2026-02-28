import React, { useState, useMemo } from 'react';
import { BubbleItem } from '../types/bubble';
import { layoutBubbles } from '../utils/layout';
import { Bubble } from './Bubble';

interface BubbleFieldProps {
  items: BubbleItem[];
  selectedItem: BubbleItem | null;
  onSelectItem: (item: BubbleItem) => void;
}

// 气泡场组件
export const BubbleField: React.FC<BubbleFieldProps> = ({ items, selectedItem, onSelectItem }) => {
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
        
        return (
          <Bubble
            key={item.id}
            item={item}
            layout={layout}
            isSelected={selectedItem?.id === item.id}
            onClick={onSelectItem}
          />
        );
      })}
    </div>
  );
};