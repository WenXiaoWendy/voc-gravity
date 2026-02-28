// 莫兰迪低饱和渐变彩 - Apple Health / iOS 17 风格主题配置
export interface BubbleTheme {
  baseColor: string;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  badgeColor: string;
}

export const getBubbleTheme = (item: any): BubbleTheme => {
  // 莫兰迪调色板 - 低饱和、偏灰、统一明度
  const themeMap: Record<string, BubbleTheme> = {
    // 近义词关系 - 灰尘蓝
    'near-synonym': {
      baseColor: '#7FA8B8',
      gradientFrom: '#7FA8B8',
      gradientTo: '#6E96A8',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#5E8698'
    },
    // 易混淆词 - 灰尘琥珀
    'confusable': {
      baseColor: '#B79A7A',
      gradientFrom: '#B79A7A',
      gradientTo: '#A98969',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#997859'
    },
    // 对比关系 - 灰尘玫瑰
    'contrast': {
      baseColor: '#B4848F',
      gradientFrom: '#B4848F',
      gradientTo: '#A57480',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#956470'
    },
    // 主题聚类 - 灰尘绿
    'topic-cluster': {
      baseColor: '#7FA58A',
      gradientFrom: '#7FA58A',
      gradientTo: '#6E967D',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#5E876D'
    },
    // 用法关系 - 灰尘靛蓝
    'usage': {
      baseColor: '#8F98B6',
      gradientFrom: '#8F98B6',
      gradientTo: '#7F88A6',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#6F7896'
    },
    // 名词形式 - 暖灰
    'noun-form': {
      baseColor: '#9EA3AA',
      gradientFrom: '#9EA3AA',
      gradientTo: '#8E939A',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#7E838A'
    },
    // 通用关系 - 鼠尾草灰
    'general': {
      baseColor: '#8FA3A0',
      gradientFrom: '#8FA3A0',
      gradientTo: '#7F9491',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#6F8481'
    },
    // 中心词 - 柔和紫罗兰
    'center': {
      baseColor: '#A7A6BF',
      gradientFrom: '#A7A6BF',
      gradientTo: '#9796AF',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#87869F'
    }
  };

  // 优先使用 relation_type，如果没有则根据层级
  let themeKey = item.layer; // 默认使用层级

  if (item.relation_type) {
    if (Array.isArray(item.relation_type)) {
      // 如果是数组，使用第一个关系类型
      themeKey = item.relation_type[0] || item.layer;
    } else {
      // 如果是字符串，直接使用
      themeKey = item.relation_type;
    }
  }

  // 如果没有匹配的主题，使用通用默认值
  return themeMap[themeKey] || {
    baseColor: '#8FA3A0',
    gradientFrom: '#8FA3A0',
    gradientTo: '#7F9491',
    textColor: 'rgba(255, 255, 255, 0.95)',
    badgeColor: '#6F8481'
  };
};

// 背景颜色配置
export const BACKGROUND_COLOR = '#0B0C10';

// 阴影配置
export const SHADOW_CONFIG = {
  normal: '0 8px 24px rgba(0, 0, 0, 0.35)',
  selected: '0 0 40px rgba(255, 255, 255, 0.15)',
  glow: '0 0 0 2px rgba(255, 255, 255, 0.1)'
};

// 边框配置
export const BORDER_CONFIG = {
  normal: '1px solid rgba(255, 255, 255, 0.08)',
  selected: '1px solid rgba(255, 255, 255, 0.15)'
};
