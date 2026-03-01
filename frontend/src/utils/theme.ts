// 莫兰迪低饱和渐变彩 - Apple Health / iOS 17 风格主题配置
export interface BubbleTheme {
  baseColor: string;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  badgeColor: string;
}

export const getBubbleTheme = (item: any, includeAnalysis: boolean = true): BubbleTheme => {
  // 莫兰迪调色板 - 低饱和、偏灰、统一明度
  const themeMap: Record<string, BubbleTheme> = {
    // 近义/同义 - 灰尘蓝
    'synonym': {
      baseColor: '#7FA8B8',
      gradientFrom: '#7FA8B8',
      gradientTo: '#6E96A8',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#5E8698'
    },
    // 反义/对立 - 灰尘玫瑰
    'antonym': {
      baseColor: '#B4848F',
      gradientFrom: '#B4848F',
      gradientTo: '#A57480',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#956470'
    },
    // 上位（更泛） - 鼠尾草灰
    'hypernym': {
      baseColor: '#8FA3A0',
      gradientFrom: '#8FA3A0',
      gradientTo: '#7F9491',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#6F8481'
    },
    // 下位（更具体） - 灰尘绿
    'hyponym': {
      baseColor: '#7FA58A',
      gradientFrom: '#7FA58A',
      gradientTo: '#6E967D',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#5E876D'
    },
    // 同类并列 - 灰尘靛蓝
    'cohyponym': {
      baseColor: '#8F98B6',
      gradientFrom: '#8F98B6',
      gradientTo: '#7F88A6',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#6F7896'
    },
    // 常见搭配 - 暖灰
    'collocation': {
      baseColor: '#9EA3AA',
      gradientFrom: '#9EA3AA',
      gradientTo: '#8E939A',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#7E838A'
    },
    // 同场景 - 暖灰
    'frame': {
      baseColor: '#9EA3AA',
      gradientFrom: '#9EA3AA',
      gradientTo: '#8E939A',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#7E838A'
    },
    // 语体差异 - 暖灰
    'register': {
      baseColor: '#9EA3AA',
      gradientFrom: '#9EA3AA',
      gradientTo: '#8E939A',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#7E838A'
    },
    // 噪声/漂移 - 灰尘琥珀
    'noise': {
      baseColor: '#B79A7A',
      gradientFrom: '#B79A7A',
      gradientTo: '#A98969',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#997859'
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

  // 词性（POS）颜色映射 - 用于快速探索模式
  const posThemeMap: Record<string, BubbleTheme> = {
    // 名词 - 灰尘蓝
    'v.': {
      baseColor: '#7FA8B8',
      gradientFrom: '#7FA8B8',
      gradientTo: '#6E96A8',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#5E8698'
    },
    // 动词 - 鼠尾草灰
    'n.': {
      baseColor: '#8FA3A0',
      gradientFrom: '#8FA3A0',
      gradientTo: '#7F9491',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#6F8481'
    },
    // 形容词 - 灰尘玫瑰
    'adj.': {
      baseColor: '#B4848F',
      gradientFrom: '#B4848F',
      gradientTo: '#A57480',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#956470'
    },
    // 副词 - 灰尘绿
    'adv.': {
      baseColor: '#7FA58A',
      gradientFrom: '#7FA58A',
      gradientTo: '#6E967D',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#5E876D'
    },
    // 其他词性 - 灰尘靛蓝
    'other': {
      baseColor: '#8F98B6',
      gradientFrom: '#8F98B6',
      gradientTo: '#7F88A6',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#6F7896'
    }
  };

  if (includeAnalysis) {
    // AI深度解析模式：根据关系类型分类
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
  } else {
    // 快速探索模式：根据词性（POS）分类
    // 获取词性，如果有多个词性，使用第一个
    let posKey = 'other';
    if (item.pos) {
      if (item.pos.includes('/')) {
        // 如果是数组，使用第一个词性
        posKey = item.pos.split('/')?.[0] || 'other';
      } else {
        // 如果是字符串，直接使用
        posKey = item.pos;
      }
    }

    // 标准化词性键（确保以点号结尾）
    if (!posKey.endsWith('.')) {
      posKey = posKey + '.';
    }

    // 查找对应的POS主题，如果没有则使用'other'
    const posTheme = posThemeMap[posKey];
    return posTheme || posThemeMap['other'];
  }
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
