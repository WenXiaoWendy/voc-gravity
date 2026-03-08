import React from 'react';
import { BubbleItem, BubbleLayout } from '../types/bubble';
import { BORDER_CONFIG, getBubbleTheme, SHADOW_CONFIG } from '../utils/theme';

// 渐变强度配置 - 可调整参数
// const GRADIENT_CONFIG = {
//   // 基础渐变层配置
//   baseGradient: {
//     darkenPercent: 15,        // 颜色加深百分比 (0-100)
//     gradientPosition: '25% 25%', // 渐变中心位置
//     gradientStops: '70%',      // 渐变停止点
//   },

//   // 内高光效果配置
//   innerGlow: {
//     opacity: 0.25,            // 透明度 (0-1)
//     position: '20% 20%',      // 高光位置
//     stops: '60%',             // 渐变停止点
//     intensity: 0.6,           // 高光强度 (0-1)
//   },

//   // 边缘阴影效果配置
//   edgeShadow: {
//     opacity: 0.15,            // 透明度 (0-1)
//     position: '80% 80%',      // 阴影位置
//     stops: '70%',             // 渐变停止点
//     intensity: 0.3,           // 阴影强度 (0-1)
//   }
// };

// iOS 17 液态玻璃风格 - 多层高光+背光+边缘发光
const GRADIENT_CONFIG = {
  // 基础渐变 - 左上亮、右下暗，增大加深幅度
  baseGradient: { darkenPercent: 38, gradientPosition: '22% 22%', gradientStops: '50%' },
  // 主高光区域 - 左上 1/4 区域的玻璃漫反射
  primaryHighlight: { opacity: 0.50, position: '16% 16%', stops: '46%', intensity: 0.88 },
  // 镜面尖点 - 左上角极小亮斑，模拟曲面玻璃高光焦点
  specularTip: { opacity: 0.42, position: '10% 10%', stops: '20%', intensity: 1.0 },
  // 右下深度阴影 - 强化立体感
  depthShadow: { opacity: 0.38, position: '84% 84%', stops: '55%', intensity: 0.62 },
  // 中心环境光 - 玻璃透光感
  centerAmbient: { opacity: 0.10, position: '46% 42%', stops: '60%', intensity: 0.7 },
  // 底部边缘背光 - 模拟背面光源穿透玻璃
  bottomRim: { opacity: 0.22, position: '50% 92%', stops: '30%', intensity: 0.5 },
};

// 颜色处理函数 - 加深颜色
const darkenColor = (color: string, percent: number): string => {
  // 简单的颜色加深逻辑，适用于 hex 颜色
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) - amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) - amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) - amt));
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  }
  return color;
};

interface BubbleProps {
  item: BubbleItem;
  layout: BubbleLayout;
  isSelected: boolean;
  onClick: (item: BubbleItem) => void;
  isBlurred?: boolean;
  isPending?: boolean;
  includeAnalysis?: boolean;
  isLoading?: boolean;
  isLoadingItem?: boolean;
  recallMode?: boolean;
  onMouseEnter?: (item: BubbleItem) => void;
  onMouseLeave?: () => void;
}

// 单个气泡组件 - Apple Health / iOS 17 风格
// 莫兰迪低饱和渐变彩质感
// 玻璃感 + 轻阴影 + 细描边 + 半透明
// 克制、精致、高级

export const Bubble = React.memo<BubbleProps>(({ item, layout, isSelected, onClick, isBlurred = false, isPending = false, includeAnalysis = false, isLoading = false, isLoadingItem = false, recallMode = false, onMouseEnter, onMouseLeave }) => {
  const theme = getBubbleTheme(item, includeAnalysis);

  // 按层独立配置字号，填满气泡同时防止长词变形
  const calculateFontSize = () => {
    // radiusRatio: 理想字号 = r * ratio（填满气泡）
    // min/max: 该层字号范围（px）
    const LAYER_CONFIG: Record<string, { radiusRatio: number; min: number; max: number }> = {
      center: { radiusRatio: 0.72, min: 26, max: 42 },
      inner:  { radiusRatio: 0.70, min: 24, max: 34 },
      middle: { radiusRatio: 0.68, min: 21, max: 29 },
      outer:  { radiusRatio: 0.56, min: 15, max: 21 },
    };
    const cfg = LAYER_CONFIG[item.layer] ?? LAYER_CONFIG.outer;

    // 半径驱动：优先填满气泡
    const radiusBased = layout.r * cfg.radiusRatio;

    // 字符宽度适配：气泡 padding 15px 两侧共 30px，再留 6px 安全边距
    const availableWidth = layout.r * 2 - 36;
    const widthBased = availableWidth / Math.max(1, item.word.length * 0.65);

    // widthBased 优先级最高（保证词完整显示），在此基础上再应用 min 保底和 max 上限
    const raw = Math.min(Math.max(cfg.min, Math.min(radiusBased, widthBased)), widthBased);
    return Math.min(cfg.max, raw);
  };

  const fontSize = calculateFontSize();

  // 玻璃内壁边缘发光 - 模拟 iOS 17 液态玻璃折射高光
  // inset 0 0 0 1px : 全周亮边（玻璃厚度感）
  // inset 3px 3px 8px : 左上强方向高光
  // inset -2px -2px 5px : 右下内壁阴影
  const RIM_LIGHT = [
    'inset 0 0 0 1px rgba(255,255,255,0.28)',
    'inset 3px 3px 8px rgba(255,255,255,0.55)',
    'inset -2px -2px 5px rgba(0,0,0,0.28)',
  ].join(', ');

  // 呼吸灯边框样式 - 白色光圈，透明度变化
  const breathingBorder = {
    boxShadow: isLoading && isLoadingItem
      ? 'none'  // 呼吸灯模式下，让动画完全控制box-shadow
      : isSelected
        ? `${RIM_LIGHT}, ${SHADOW_CONFIG.normal}, ${SHADOW_CONFIG.selected}, ${SHADOW_CONFIG.glow}`
        : `${RIM_LIGHT}, ${SHADOW_CONFIG.normal}`,
  };

  // 气泡基础样式 - Apple 质感
  const baseBubbleStyle = {
    left: layout.x - layout.r,
    top: layout.y - layout.r,
    width: layout.r * 2,
    height: layout.r * 2,
    padding: '15px',
    background: 'transparent',
    opacity: isBlurred ? 0.3 : isPending ? 0.12 : (item.layer === 'center' ? 0.95 : 0.85),
    border: isLoading && isLoadingItem
      ? 'none'
      : isSelected
        ? BORDER_CONFIG.selected
        : BORDER_CONFIG.normal,
    boxShadow: breathingBorder.boxShadow,
    transform: isBlurred ? 'scale(0.9)' : (isSelected ? 'scale(1.15)' : 'scale(1)'),
    zIndex: isSelected ? 20 : item.layer === 'center' ? 15 : 10,
    filter: isBlurred ? 'blur(4px)' : 'none',
    // 呼吸灯效果 - 加载状态下被选中的气泡微弱发光
    animation: isLoading && isLoadingItem ? 'bubbleBreathing 3s ease-in-out infinite' : 'none',
  };

  // 处理点击事件 - 加载状态下不可点击
  const handleClick = () => {
    if (!isBlurred && !isLoading) {
      onClick(item);
    }
  };

  const handleMouseEnter = () => {
    if (onMouseEnter) {
      onMouseEnter(item);
    }
  };

  const handleMouseLeave = () => {
    if (onMouseLeave) {
      onMouseLeave();
    }
  };

  // 中心气泡的特殊效果（在呼吸灯模式下禁用，避免干扰白色光圈）
  const centerGlowEffect = item.layer === 'center' && !(isLoading && isLoadingItem) ? {
    boxShadow: `${RIM_LIGHT}, ${SHADOW_CONFIG.normal}, 0 0 60px rgba(167, 166, 191, 0.3)`
  } : {};

  return (
    <div
      className={`
        absolute rounded-full flex items-center justify-center
        ${isLoading && isLoadingItem ? '' : 'transition-all duration-300'} font-serif backdrop-blur-sm
        ${isBlurred ? 'cursor-default' : (isLoading ? 'cursor-default' : 'cursor-pointer hover:scale-105 hover:opacity-95 active:scale-100')}
      `}
      style={
        (isLoading && isLoadingItem)
          ? baseBubbleStyle  // 呼吸灯模式下只使用基础样式
          : { ...baseBubbleStyle, ...centerGlowEffect }
      }
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 多层渐变效果 - iOS 17 液态玻璃立体感 */}
      {/* 基础渐变层 - 左上亮右下暗 */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${GRADIENT_CONFIG.baseGradient.gradientPosition}, ${theme.gradientFrom}, ${theme.gradientTo} ${GRADIENT_CONFIG.baseGradient.gradientStops}, ${darkenColor(theme.gradientTo, GRADIENT_CONFIG.baseGradient.darkenPercent)} 100%)`
        }}
      />

      {/* 主高光区域 - 左上漫反射 */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          opacity: GRADIENT_CONFIG.primaryHighlight.opacity,
          background: `radial-gradient(circle at ${GRADIENT_CONFIG.primaryHighlight.position}, rgba(255,255,255,${GRADIENT_CONFIG.primaryHighlight.intensity}), transparent ${GRADIENT_CONFIG.primaryHighlight.stops})`
        }}
      />

      {/* 镜面尖点 - 左上角极小亮斑 */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          opacity: GRADIENT_CONFIG.specularTip.opacity,
          background: `radial-gradient(circle at ${GRADIENT_CONFIG.specularTip.position}, rgba(255,255,255,${GRADIENT_CONFIG.specularTip.intensity}), transparent ${GRADIENT_CONFIG.specularTip.stops})`
        }}
      />

      {/* 右下深度阴影 - 增强立体感 */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          opacity: GRADIENT_CONFIG.depthShadow.opacity,
          background: `radial-gradient(circle at ${GRADIENT_CONFIG.depthShadow.position}, transparent ${GRADIENT_CONFIG.depthShadow.stops}, rgba(0,0,0,${GRADIENT_CONFIG.depthShadow.intensity}) 100%)`
        }}
      />

      {/* 中心环境光 - 玻璃透光感 */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          opacity: GRADIENT_CONFIG.centerAmbient.opacity,
          background: `radial-gradient(circle at ${GRADIENT_CONFIG.centerAmbient.position}, rgba(255,255,255,${GRADIENT_CONFIG.centerAmbient.intensity}), transparent ${GRADIENT_CONFIG.centerAmbient.stops})`
        }}
      />

      {/* 底部背光 - 模拟背面透光 */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          opacity: GRADIENT_CONFIG.bottomRim.opacity,
          background: `radial-gradient(circle at ${GRADIENT_CONFIG.bottomRim.position}, rgba(255,255,255,${GRADIENT_CONFIG.bottomRim.intensity}), transparent ${GRADIENT_CONFIG.bottomRim.stops})`
        }}
      />

      {/* 内壁亮环 - 模拟玻璃边缘折射光圈 */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 62%, rgba(255,255,255,0.14) 70%, rgba(255,255,255,0.06) 78%, transparent 84%)'
        }}
      />

      <div className="text-center relative z-10" style={{
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {/* Word - 最大字号、居中、占主视觉，不换行 */}
        <span
          className={`font-medium whitespace-nowrap`}
          style={{
            fontSize: fontSize,
            lineHeight: '1.15',
            color: theme.textColor,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
            fontWeight: item.layer === 'center' ? 600 : 500
          }}
        >
          {item.word}
        </span>

        {/* 中文释义：回忆模式下隐藏；center/inner/middle 显示词性+中文，outer 只显示一个中文 */}
        {item.chinese_gloss && !recallMode && (
          <div
            className="mt-1 leading-tight whitespace-nowrap"
            style={{
              fontSize: Math.max(10, fontSize * (item.layer === 'center' ? 0.30 : 0.38)),
              lineHeight: '1.1',
              color: 'rgba(255, 255, 255, 0.95)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)',
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            {(() => {
              const meanings = item.chinese_gloss.split(/[，；、]/);
              const maxMeanings = item.layer === 'center'
                ? (fontSize > 22 ? 3 : 2)
                : (fontSize > 18 ? 3 : 2);
              const displayMeanings = meanings.slice(0, maxMeanings);
              const posRaw = item.pos ? (Array.isArray(item.pos) ? item.pos : item.pos.split('/')) : [];
              const posStr = item.layer === 'center' ? posRaw.join(' ') : (posRaw[0] ?? '');
              const posPrefix = posStr ? `${posStr} ` : '';
              return posPrefix + displayMeanings.join('; ');
            })()}
          </div>
        )}
      </div>
    </div>
  );
});
