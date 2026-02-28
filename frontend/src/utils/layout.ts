// 基于 d3-force 的力导向布局算法 - 统一互斥 + 智能边界展开
import { forceCenter, forceCollide, forceManyBody, forceRadial, forceSimulation } from 'd3-force';

export const layoutBubbles = (items: any[], viewport: { width: number; height: number }) => {
  const layoutMap = new Map<string, any>();
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const GAP = 10; // 统一间隙：10px

  // 气泡配置
  const bubbleConfig = {
    sizes: { center: 90, inner: 80, middle: 60, outer: 45 },
    baseRadii: {
      center: 0,
      inner: 200,    // 中心半径 45 + 间隙 10 + 内层半径 40 + 额外空间 105
      middle: 350,   // 内层 200 + 间隙 10 + 中层半径 30 + 额外空间 110
      outer: 500     // 中层 350 + 间隙 10 + 外层半径 22.5 + 额外空间 117.5
    },
    maxCount: {
      center: 1,
      inner: 7,
      middle: 16,
      outer: 32
    }
  };

  // 气泡大小配置
  const getBubbleSize = (item: any) => {
    const baseSize = bubbleConfig.sizes[item.layer as keyof typeof bubbleConfig.sizes] || 50;
    return Math.max(40, baseSize * (0.7 + item.score * 0.6));
  };

  // 按层级分组并限制每层气泡数量
  const itemsByLayer = new Map<string, any[]>();
  items.forEach(item => {
    const layer = item.layer || 'outer';
    if (!itemsByLayer.has(layer)) {
      itemsByLayer.set(layer, []);
    }
    itemsByLayer.get(layer)!.push(item);
  });

  // 根据配置限制每层气泡数量
  const filteredItems: any[] = [];
  itemsByLayer.forEach((layerItems, layer) => {
    const maxCount = bubbleConfig.maxCount[layer as keyof typeof bubbleConfig.maxCount] || 32;
    // 按相似度排序，取前 N 个
    const sorted = layerItems.sort((a, b) => b.score - a.score);
    const selected = sorted.slice(0, maxCount);
    filteredItems.push(...selected);
  });

  // 准备 d3-force 的数据结构
  const nodes = filteredItems.map(item => {
    const radius = getBubbleSize(item);
    const isCenter = item.layer === 'center';
    const baseRadius = bubbleConfig.baseRadii[item.layer as keyof typeof bubbleConfig.baseRadii] || 440;

    // 根据层级和相似度设置初始位置
    let initialX = centerX;
    let initialY = centerY;

    if (!isCenter) {
      const angle = Math.random() * 2 * Math.PI;
      initialX = centerX + Math.cos(angle) * baseRadius;
      initialY = centerY + Math.sin(angle) * baseRadius;
    }

    return {
      id: item.id,
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
      fx: isCenter ? centerX : undefined, // 固定中心节点位置
      fy: isCenter ? centerY : undefined,
      radius: radius,
      layer: item.layer,
      score: item.score,
      item: item,
      isCenter: isCenter,
      targetRadius: baseRadius
    };
  });

  // 定义节点类型
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

  // 创建力导向模拟 - 使用统一的互斥算法
  const simulation = forceSimulation(nodes as ForceNode[])
    // 分层的电荷力：中心气泡有更强的排斥力
    .force('charge', forceManyBody<ForceNode>()
      .strength((d: ForceNode) => {
        if (d.isCenter) return -3000; // 中心气泡有非常强的排斥力
        if (d.layer === 'inner') return -1200; // 内层气泡有较强排斥力
        if (d.layer === 'middle') return -800;  // 中层气泡中等排斥力
        return -600;                             // 外层气泡较弱排斥力
      })
    )
    // 统一的碰撞检测：所有气泡间隙统一为 10px
    .force('collide', forceCollide<ForceNode>()
      .radius((d: ForceNode) => d.radius + GAP) // 统一间隙 10px
      .strength(1.0) // 最强碰撞强度，确保不重叠
      .iterations(3)
    )
    // 轻微的中心力，保持整体向心性
    .force('center', forceCenter(centerX, centerY).strength(0.05))
    // 径向力：保持分层结构
    .force('radial', forceRadial<ForceNode>(
      (d: ForceNode) => d.targetRadius,
      centerX,
      centerY
    ).strength((d: ForceNode) => {
      if (d.isCenter) return 0;
      // 内层气泡径向力最强，确保不靠近中心
      if (d.layer === 'inner') return 1.2;
      if (d.layer === 'middle') return 0.8;
      return 0.6;
    }))
    .alphaMin(0.001)
    .alphaDecay(0.02)
    .velocityDecay(0.3)
    .stop();

  // 手动运行模拟，确保收敛
  for (let i = 0; i < 500; i++) {
    simulation.tick();

    // 检查是否收敛
    const maxVelocity = Math.max(...nodes.map(n => Math.sqrt(n.vx * n.vx + n.vy * n.vy)));
    if (maxVelocity < 0.05) {
      break;
    }
  }

  // 边界约束和智能展开逻辑
  const viewportMargin = GAP;
  const maxRadius = Math.min(viewport.width, viewport.height) / 2 - viewportMargin;

  nodes.forEach(node => {
    // 中心节点保持固定位置
    if (node.isCenter) {
      node.x = centerX;
      node.y = centerY;
      return;
    }

    // 计算到中心的距离
    const dx = node.x - centerX;
    const dy = node.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // 检查是否超出边界
    if (distance + node.radius > maxRadius) {
      // 超出边界，沿着当前角度向外展开
      const targetDistance = maxRadius - node.radius;
      node.x = centerX + Math.cos(angle) * targetDistance;
      node.y = centerY + Math.sin(angle) * targetDistance;
    }

    // 确保不超出视口边界
    const margin = viewportMargin;

    // 左边界
    if (node.x - node.radius < margin) {
      node.x = margin + node.radius;
    }
    // 右边界
    if (node.x + node.radius > viewport.width - margin) {
      node.x = viewport.width - margin - node.radius;
    }
    // 上边界
    if (node.y - node.radius < margin) {
      node.y = margin + node.radius;
    }
    // 下边界
    if (node.y + node.radius > viewport.height - margin) {
      node.y = viewport.height - margin - node.radius;
    }
  });

  // 二次碰撞检查：确保边界调整后仍然没有重叠
  for (let iter = 0; iter < 100; iter++) {
    let hasOverlap = false;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = n1.radius + n2.radius + GAP;

        if (dist < minDist && dist > 0) {
          hasOverlap = true;
          // 沿连线方向推开
          const overlap = minDist - dist;
          const pushX = (dx / dist) * overlap * 0.5;
          const pushY = (dy / dist) * overlap * 0.5;

          // 如果不是中心节点，则移动
          if (!n1.isCenter) {
            n1.x -= pushX;
            n1.y -= pushY;
          }
          if (!n2.isCenter) {
            n2.x += pushX;
            n2.y += pushY;
          }
        }
      }
    }

    if (!hasOverlap) break;
  }

  // 构建布局映射
  nodes.forEach(node => {
    layoutMap.set(node.id, {
      x: node.x,
      y: node.y,
      r: node.radius
    });
  });

  return layoutMap;
};
