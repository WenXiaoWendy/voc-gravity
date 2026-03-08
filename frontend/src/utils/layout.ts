// 基于 d3-force 的力导向布局算法 - 放射状散开 + 软边界扩散
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

export const layoutBubbles = (items: any[], viewport: { width: number; height: number }) => {
  const layoutMap = new Map<string, any>();
  // 上下留白：避开 NavBar(80px) + 面包屑(~40px) 和底部栏(48px)
  const MARGIN_TOP = 140;
  const MARGIN_BOTTOM = 60;
  const MARGIN_X = 10;
  const centerX = viewport.width / 2;
  // 布局中心偏移到可用区域的垂直中心
  const centerY = (MARGIN_TOP + viewport.height - MARGIN_BOTTOM) / 2;
  const GAP = 10;

  // 可用区域半高，用于自适应缩放
  const availableHalfH = (viewport.height - MARGIN_TOP - MARGIN_BOTTOM) / 2;
  // 当可用高度不足时，按比例缩小各层半径
  const scale = Math.min(1, availableHalfH / 550);

  const bubbleConfig = {
    sizes: { center: 90, inner: 80, middle: 60, outer: 45 },
    baseRadii: {
      center: 0,
      inner: Math.round(250 * scale),
      middle: Math.round(400 * scale),
      outer: Math.round(550 * scale),
    },
    maxCount: { center: 1, inner: 7, middle: 16, outer: 32 }
  };

  const getBubbleSize = (item: any) => {
    const baseSize = bubbleConfig.sizes[item.layer as keyof typeof bubbleConfig.sizes] || 50;
    return Math.max(40, baseSize * (0.7 + item.score * 0.6));
  };

  // 按层级分组并限制每层气泡数量
  const itemsByLayer = new Map<string, any[]>();
  items.forEach(item => {
    const layer = item.layer || 'outer';
    if (!itemsByLayer.has(layer)) itemsByLayer.set(layer, []);
    itemsByLayer.get(layer)!.push(item);
  });

  const filteredItems: any[] = [];
  itemsByLayer.forEach((layerItems, layer) => {
    const maxCount = bubbleConfig.maxCount[layer as keyof typeof bubbleConfig.maxCount] || 32;
    const sorted = layerItems.sort((a, b) => b.score - a.score);
    filteredItems.push(...sorted.slice(0, maxCount));
  });

  // 准备节点
  const nodes: ForceNode[] = filteredItems.map(item => {
    const radius = getBubbleSize(item);
    const isCenter = item.layer === 'center';
    const baseRadius = bubbleConfig.baseRadii[item.layer as keyof typeof bubbleConfig.baseRadii] || Math.round(440 * scale);

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
      isCenter, targetRadius: baseRadius
    };
  });

  // 自定义软边界力：气泡中心接近边界时被弹回
  // 气泡体可以部分超出（形成 backdrop-blur 模糊透出效果）
  function boundaryForce() {
    let _nodes: ForceNode[];
    function force() {
      for (const node of _nodes) {
        if (node.isCenter) continue;
        const k = 0.5; // 边界弹力强度
        // 上边界
        if (node.y < MARGIN_TOP) node.vy += (MARGIN_TOP - node.y) * k;
        // 下边界
        if (node.y > viewport.height - MARGIN_BOTTOM) node.vy += (viewport.height - MARGIN_BOTTOM - node.y) * k;
        // 左边界
        if (node.x < MARGIN_X) node.vx += (MARGIN_X - node.x) * k;
        // 右边界
        if (node.x > viewport.width - MARGIN_X) node.vx += (viewport.width - MARGIN_X - node.x) * k;
      }
    }
    force.initialize = (n: ForceNode[]) => { _nodes = n; };
    return force;
  }

  // 创建力导向模拟
  const simulation = forceSimulation(nodes)
    .force('charge', forceManyBody<ForceNode>()
      .strength((d) => {
        if (d.isCenter) return -2000;
        if (d.layer === 'inner') return -1000;
        if (d.layer === 'middle') return -300;
        return -300;
      })
    )
    .force('collide', forceCollide<ForceNode>()
      .radius((d) => d.radius + GAP)
      .strength(1.0)
      .iterations(8)
    )
    // 向心力：整体聚拢
    .force('center', forceCenter(centerX, centerY).strength(0.05))
    .force('radial', forceRadial<ForceNode>(
      (d) => d.targetRadius,
      centerX, centerY
    ).strength((d) => {
      if (d.isCenter) return 0;
      if (d.layer === 'inner') return 1.8;
      if (d.layer === 'middle') return 1.2;
      return 0.9;
    }))
    // 软边界力：气泡自然远离边界并向四角扩散
    .force('boundary', boundaryForce() as any)
    .alphaMin(0.0001)
    .alphaDecay(0.008) // 更慢衰减，让模拟更充分
    .velocityDecay(0.35)
    .stop();

  // 运行模拟
  for (let i = 0; i < 1500; i++) {
    simulation.tick();
    const maxVelocity = Math.max(...nodes.map(n => Math.sqrt(n.vx * n.vx + n.vy * n.vy)));
    if (maxVelocity < 0.01) break;
  }

  // 二次碰撞检查：最终保障，绝对不允许重叠
  for (let iter = 0; iter < 300; iter++) {
    let hasOverlap = false;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let extraGap = 0;
        if (n1.isCenter || n2.isCenter) extraGap = 15;

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

  // 构建布局映射
  nodes.forEach(node => {
    layoutMap.set(node.id, { x: node.x, y: node.y, r: node.radius });
  });

  return layoutMap;
};
