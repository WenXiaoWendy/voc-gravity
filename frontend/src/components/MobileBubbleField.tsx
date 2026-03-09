import React, { useCallback, useMemo, useRef, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { layoutBubblesMobile } from '../utils/mobileLayout';
import { Bubble } from './Bubble';

// 顶部区域预留给下拉搜索手势，不启动拖动
const PULL_DOWN_ZONE = 120;
// 拖动边界：最多偏移半个视口
const PAN_LIMIT_RATIO = 0.5;

interface MobileBubbleFieldProps {
  items: BubbleItem[];
  selectedItem: BubbleItem | null;
  onSelectItem: (item: BubbleItem) => void;
  selectedRelationTypes?: string[];
  includeAnalysis?: boolean;
  isLoading?: boolean;
  loadingItemId?: string | null;
  isRelationPending?: boolean;
  recallMode?: boolean;
}

export const MobileBubbleField = React.memo<MobileBubbleFieldProps>(({
  items, selectedItem, onSelectItem,
  selectedRelationTypes = [], includeAnalysis = false,
  isLoading = false, loadingItemId = null,
  isRelationPending = false, recallMode = false,
}) => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    height: typeof window !== 'undefined' ? window.innerHeight : 844,
  });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const touchRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number; moved: boolean } | null>(null);

  React.useEffect(() => {
    const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 新词搜索时重置偏移
  const prevCenterWord = useRef<string | undefined>();
  const centerWord = items.find(i => i.layer === 'center')?.word;
  if (centerWord !== prevCenterWord.current) {
    prevCenterWord.current = centerWord;
    if (panOffset.x !== 0 || panOffset.y !== 0) {
      setPanOffset({ x: 0, y: 0 });
    }
  }

  const itemsKey = useMemo(
    () => items.map(i => `${i.word}:${i.id}:${i.score.toFixed(4)}`).join('|'),
    [items]
  );

  const layouts = useMemo(() => {
    return layoutBubblesMobile(items, viewport);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, viewport]);

  const maxPanX = viewport.width * PAN_LIMIT_RATIO;
  const maxPanY = viewport.height * PAN_LIMIT_RATIO;

  const clampPan = useCallback((x: number, y: number) => ({
    x: Math.max(-maxPanX, Math.min(maxPanX, x)),
    y: Math.max(-maxPanY, Math.min(maxPanY, y)),
  }), [maxPanX, maxPanY]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    // 顶部区域不拦截，留给下拉搜索手势
    if (t.clientY < PULL_DOWN_ZONE) return;
    touchRef.current = { startX: t.clientX, startY: t.clientY, startPanX: panOffset.x, startPanY: panOffset.y, moved: false };
  }, [panOffset]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      touchRef.current.moved = true;
    }
    setPanOffset(clampPan(touchRef.current.startPanX + dx, touchRef.current.startPanY + dy));
  }, [clampPan]);

  const onTouchEnd = useCallback(() => {
    touchRef.current = null;
  }, []);

  // 双击重置偏移
  const lastTapRef = useRef(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setPanOffset({ x: 0, y: 0 });
    }
    lastTapRef.current = now;
  }, []);

  // 点击处理：移动 < 10px 视为点击
  const handleBubbleClick = useCallback((item: BubbleItem) => {
    if (touchRef.current?.moved) return;
    onSelectItem(item);
  }, [onSelectItem]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-black"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleDoubleTap}
    >
      <div style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)`, willChange: 'transform' }}>
        {items.map(item => {
          const layout = layouts.get(item.id);
          if (!layout) return null;

          const isBlurred = selectedRelationTypes.length > 0 && item.layer !== 'center' && item.relation_type
            ? (Array.isArray(item.relation_type)
              ? !item.relation_type.some(r => selectedRelationTypes.includes(r))
              : !selectedRelationTypes.includes(item.relation_type))
            : false;

          const isPending = isRelationPending && item.layer !== 'center' && !item.relation_type?.length;

          return (
            <Bubble
              key={item.id}
              item={item}
              layout={layout}
              isSelected={selectedItem?.id === item.id}
              onClick={handleBubbleClick}
              isBlurred={isBlurred}
              isPending={isPending}
              includeAnalysis={includeAnalysis}
              isLoading={isLoading}
              isLoadingItem={loadingItemId === item.id}
              recallMode={recallMode}
            />
          );
        })}
      </div>
    </div>
  );
});
