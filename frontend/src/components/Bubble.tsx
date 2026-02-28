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

// 更强的立体感
const GRADIENT_CONFIG = {
  baseGradient: { darkenPercent: 25, gradientPosition: '20% 20%', gradientStops: '60%' },
  innerGlow: { opacity: 0.35, position: '15% 15%', stops: '50%', intensity: 0.8 },
  edgeShadow: { opacity: 0.25, position: '85% 85%', stops: '60%', intensity: 0.5 }
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
}

// 单个气泡组件 - Apple Health / iOS 17 风格
// 莫兰迪低饱和渐变彩质感
// 玻璃感 + 轻阴影 + 细描边 + 半透明
// 克制、精致、高级

export const Bubble: React.FC<BubbleProps> = ({ item, layout, isSelected, onClick }) => {
  const theme = getBubbleTheme(item);

  // 计算合适的字体大小，确保文字不超出边界
  const calculateFontSize = () => {
    const maxWidth = layout.r * 2 - 30; // 预留15px边距 * 2
    const wordLength = item.word.length;

    // 根据单词长度和气泡大小计算字体大小
    const baseSize = Math.min(layout.r * 0.4, maxWidth / Math.max(1, wordLength * 0.6));
    return Math.max(12, Math.min(24, baseSize)); // 限制在12-24px之间
  };

  const fontSize = calculateFontSize();

  // 气泡基础样式 - Apple 质感
  const baseBubbleStyle = {
    left: layout.x - layout.r,
    top: layout.y - layout.r,
    width: layout.r * 2,
    height: layout.r * 2,
    padding: '15px',
    background: 'transparent',
    opacity: item.layer === 'center' ? 0.95 : 0.85,
    border: isSelected ? BORDER_CONFIG.selected : BORDER_CONFIG.normal,
    boxShadow: isSelected
      ? `${SHADOW_CONFIG.normal}, ${SHADOW_CONFIG.selected}, ${SHADOW_CONFIG.glow}`
      : SHADOW_CONFIG.normal,
    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
    zIndex: isSelected ? 20 : item.layer === 'center' ? 15 : 10,
  };

  // 中心气泡的特殊效果
  const centerGlowEffect = item.layer === 'center' ? {
    boxShadow: `${SHADOW_CONFIG.normal}, 0 0 60px rgba(167, 166, 191, 0.3)`
  } : {};

  return (
    <div
      className={`
        absolute rounded-full flex items-center justify-center cursor-pointer
        transition-all duration-300 font-serif backdrop-blur-sm
        hover:scale-105 hover:opacity-95 active:scale-100
      `}
      style={{
        ...baseBubbleStyle,
        ...centerGlowEffect
      }}
      onClick={() => onClick(item)}
    >
      {/* 多层渐变效果 - 增强立体感 */}
        {/* 基础渐变层 */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${GRADIENT_CONFIG.baseGradient.gradientPosition}, ${theme.gradientFrom}, ${theme.gradientTo} ${GRADIENT_CONFIG.baseGradient.gradientStops}, ${darkenColor(theme.gradientTo, GRADIENT_CONFIG.baseGradient.darkenPercent)} 100%)`
          }}
        />

        {/* 内高光效果 - 增强玻璃质感 */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            opacity: GRADIENT_CONFIG.innerGlow.opacity,
            background: `radial-gradient(circle at ${GRADIENT_CONFIG.innerGlow.position}, rgba(255,255,255,${GRADIENT_CONFIG.innerGlow.intensity}), transparent ${GRADIENT_CONFIG.innerGlow.stops})`
          }}
        />

        {/* 边缘阴影效果 - 增强立体感 */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            opacity: GRADIENT_CONFIG.edgeShadow.opacity,
            background: `radial-gradient(circle at ${GRADIENT_CONFIG.edgeShadow.position}, transparent ${GRADIENT_CONFIG.edgeShadow.stops}, rgba(0,0,0,${GRADIENT_CONFIG.edgeShadow.intensity}) 100%)`
          }}
        />

      <div className="text-center relative z-10" style={{
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {/* Word - 最大字号、居中、占主视觉，不换行 */}
        <span
          className={`font-medium leading-none whitespace-nowrap`}
          style={{
            fontSize: fontSize,
            lineHeight: '1',
            color: theme.textColor,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
            fontWeight: item.layer === 'center' ? 600 : 500
          }}
        >
          {item.word}
        </span>

        {/* 中文释义 - 优化显示清晰度和可辨认度 */}
        {item.chinese_gloss && (
          <div
            className="mt-1 leading-tight whitespace-nowrap"
            style={{
              fontSize: Math.max(10, fontSize * 0.5), // 增大字体
              lineHeight: '1.1', // 增加行高
              color: 'rgba(255, 255, 255, 0.95)', // 提高对比度
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)', // 增强阴影
              fontWeight: 500, // 增加字体权重
              letterSpacing: '0.02em', // 增加字间距
            //   fontFamily: 'system-ui, -apple-system, sans-serif' // 使用系统字体
            }}
          >
            {(() => {
              const allMeanings = item.chinese_gloss.split(/[，；、]/);
              // 根据气泡大小决定显示几个释义
              const maxMeanings = fontSize > 20 ? 3 : fontSize > 14 ? 2 : 1;
              const displayMeanings = allMeanings.slice(0, maxMeanings);
              return displayMeanings.join('；');
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
