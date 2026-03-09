// 移动端力导向布局算法 — 气泡缩小 + 层半径按可用空间自适应
import { forceCenter, forceCollide, forceManyBody, forceRadial, forceSimulation } from 'd3-force';

interface ForceNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
  radius: number;
  layer: string;
  score: number;
  item: any;
  isCenter: boolean;
  targetRadius: number;
}

// 布局常量
const MARGIN_TOP = 58;   // navbar 高度
const MARGIN_BOTTOM = 60; // handle bar 高度

/** 返回 outer 层轨道半径（用于 pan 边界计算） */
export const getOuterRadius = (viewport: { width: number; height: number }) => {
  const available = viewport.height - MARGIN_TOP - MARGIN_BOTTOM;
  const scale = Math.min(1, available / 800);
  return Math.round(280 * scale);
};

export const layoutBubblesMobile = (items: any[], viewport: { width: number; height: number }) => {
  const layoutMap = new Map<string, any>();
  const centerX = viewport.width / 2;
  // 中心点：navbar 和 handlebar 之间的视觉中心
  const centerY = (MARGIN_TOP + viewport.height - MARGIN_BOTTOM) / 2;
  const GAP = 4;

  // 用高度驱动 scale，允许外层气泡超出视口宽度（靠 pan 查看）
  const available = viewport.height - MARGIN_TOP - MARGIN_BOTTOM;
  const scale = Math.min(1, available / 800);

  const bubbleConfig = {
    sizes: { center: 52, inner: 44, middle: 36, outer: 28 },
    baseRadii: {
      center: 0,
      inner: Math.round(120 * scale),
      middle: Math.round(200 * scale),
      outer: Math.round(280 * scale),
    },
    maxCount: { center: 1, inner: 7, middle: 16, outer: 32 },
  };

  const getBubbleSize = (item: any) => {
    const baseSize = bubbleConfig.sizes[item.layer as keyof typeof bubbleConfig.sizes] || 28;
    return Math.max(24, baseSize * (0.7 + item.score * 0.6));
  };

  // 按层分组并限数
  const itemsByLayer = new Map<string, any[]>();
  items.forEach(item => {
    const layer = item.layer || 'outer';
    if (!itemsByLayer.has(layer)) itemsByLayer.set(layer, []);
    itemsByLayer.get(layer)!.push(item);
  });

  const filteredItems: any[] = [];
  itemsByLayer.forEach((layerItems, layer) => {
    const maxCount = bubbleConfig.maxCount[layer as keyof typeof bubbleConfig.maxCount] || 32;
    filteredItems.push(...layerItems.sort((a, b) => b.score - a.score).slice(0, maxCount));
  });

  const nodes: ForceNode[] = filteredItems.map(item => {
    const radius = getBubbleSize(item);
    const isCenter = item.layer === 'center';
    const baseRadius = bubbleConfig.baseRadii[item.layer as keyof typeof bubbleConfig.baseRadii] || Math.round(280 * scale);

    let initialX = centerX;
    let initialY = centerY;
    if (!isCenter) {
      const angle = Math.random() * 2 * Math.PI;
      initialX = centerX + Math.cos(angle) * baseRadius;
      initialY = centerY + Math.sin(angle) * baseRadius;
    }

    return {
      id: item.id, x: initialX, y: initialY, vx: 0, vy: 0,
      fx: isCenter ? centerX : undefined,
      fy: isCenter ? centerY : undefined,
      radius, layer: item.layer, score: item.score, item,
      isCenter, targetRadius: baseRadius,
    };
  });

  // 软边界力 — 仅防止气泡跑到屏幕极端外侧，不限制在视口内
  function boundaryForce() {
    let _nodes: ForceNode[];
    const softTop = MARGIN_TOP - 20;
    const softBottom = viewport.height - MARGIN_BOTTOM + 20;
    function force() {
      for (const node of _nodes) {
        if (node.isCenter) continue;
        const k = 0.4;
        if (node.y < softTop) node.vy += (softTop - node.y) * k;
        if (node.y > softBottom) node.vy += (softBottom - node.y) * k;
        // 水平方向不约束，让外层气泡自然扩展（通过 pan 查看）
      }
    }
    force.initialize = (n: ForceNode[]) => { _nodes = n; };
    return force;
  }

  const simulation = forceSimulation(nodes)
    .force('charge', forceManyBody<ForceNode>().strength(d => {
      if (d.isCenter) return -800;
      if (d.layer === 'inner') return -400;
      return -150;
    }))
    .force('collide', forceCollide<ForceNode>().radius(d => d.radius + GAP).strength(1.0).iterations(8))
    .force('center', forceCenter(centerX, centerY).strength(0.06))
    .force('radial', forceRadial<ForceNode>(d => d.targetRadius, centerX, centerY).strength(d => {
      if (d.isCenter) return 0;
      if (d.layer === 'inner') return 1.8;
      if (d.layer === 'middle') return 1.2;
      return 0.9;
    }))
    .force('boundary', boundaryForce() as any)
    .alphaMin(0.0001)
    .alphaDecay(0.01)
    .velocityDecay(0.35)
    .stop();

  for (let i = 0; i < 1200; i++) {
    simulation.tick();
    const maxV = Math.max(...nodes.map(n => Math.sqrt(n.vx * n.vx + n.vy * n.vy)));
    if (maxV < 0.01) break;
  }

  // 二次碰撞检查
  for (let iter = 0; iter < 200; iter++) {
    let hasOverlap = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i], n2 = nodes[j];
        const dx = n2.x - n1.x, dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const extraGap = (n1.isCenter || n2.isCenter) ? 10 : 0;
        const minDist = n1.radius + n2.radius + GAP + extraGap;
        if (dist < minDist && dist > 0) {
          hasOverlap = true;
          const overlap = minDist - dist;
          const pushX = (dx / dist) * overlap * 0.5;
          const pushY = (dy / dist) * overlap * 0.5;
          if (!n1.isCenter) { n1.x -= pushX; n1.y -= pushY; }
          if (!n2.isCenter) { n2.x += pushX; n2.y += pushY; }
        }
      }
    }
    if (!hasOverlap) break;
  }

  nodes.forEach(node => {
    layoutMap.set(node.id, { x: node.x, y: node.y, r: node.radius });
  });

  return layoutMap;
};
