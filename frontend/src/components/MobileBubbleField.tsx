import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { getOuterRadius, layoutBubblesMobile } from '../utils/mobileLayout';
import { Bubble } from './Bubble';

// 顶部区域预留给下拉搜索手势，不启动拖动
const PULL_DOWN_ZONE = 120;

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
  isDetailOpen?: boolean;
}

export const MobileBubbleField = React.memo<MobileBubbleFieldProps>(({
  items, selectedItem, onSelectItem,
  selectedRelationTypes = [], includeAnalysis = false,
  isLoading = false, loadingItemId = null,
  isRelationPending = false, recallMode = false,
  isDetailOpen = false,
}) => {
  // viewport 只取一次，不监听 resize（避免地址栏伸缩触发 D3 重算）
  const [viewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    height: typeof window !== 'undefined' ? window.innerHeight : 844,
  });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const touchRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number; moved: boolean } | null>(null);

  // 新词搜索时重置偏移
  const centerWord = items.find(i => i.layer === 'center')?.word;
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
  }, [centerWord]);

  const itemsKey = useMemo(
    () => items.map(i => `${i.word}:${i.id}:${i.score.toFixed(4)}`).join('|'),
    [items]
  );

  const layouts = useMemo(() => {
    return layoutBubblesMobile(items, viewport);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, viewport]);

  // 椭圆 pan 边界：允许把 center 偏移半个 outerR，聚焦边缘气泡但不露大片黑边
  const outerR = useMemo(() => getOuterRadius(viewport), [viewport]);
  const panRx = outerR * 0.5;
  const panRy = outerR * 0.4;

  const clampPan = useCallback((x: number, y: number) => {
    const d = (x / panRx) ** 2 + (y / panRy) ** 2;
    if (d <= 1) return { x, y };
    // 投影到椭圆边缘
    const s = 1 / Math.sqrt(d);
    return { x: x * s, y: y * s };
  }, [panRx, panRy]);

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

  // 渐变淡出遮罩
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: 'radial-gradient(ellipse 85% 80% at center, black 60%, transparent 100%)',
    maskImage: 'radial-gradient(ellipse 85% 80% at center, black 60%, transparent 100%)',
  };

  // 面板展开时将气泡中心上移至上半屏中心
  // current center ≈ vh/2，target = (58 + vh*0.45)/2 → shift = 30 - vh*0.275
  const panelShiftY = isDetailOpen ? (30 - viewport.height * 0.275) : 0;

  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      style={{ height: '100dvh', touchAction: 'none', ...maskStyle }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleDoubleTap}
    >
      {/* 面板偏移层：带 transition，不影响触摸拖拽响应速度 */}
      <div style={{ transform: `translateY(${panelShiftY}px)`, transition: 'transform 0.3s ease-out', willChange: 'transform' }}>
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
    </div>
  );
});
