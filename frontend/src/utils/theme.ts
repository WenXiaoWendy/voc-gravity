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
    // 同场景 - 灰尘薰衣草
    'frame': {
      baseColor: '#A897B0',
      gradientFrom: '#A897B0',
      gradientTo: '#987FA0',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#886F90'
    },
    // 语体差异 - 灰尘玫瑰紫
    'register': {
      baseColor: '#A880A0',
      gradientFrom: '#A880A0',
      gradientTo: '#987090',
      textColor: 'rgba(255, 255, 255, 0.95)',
      badgeColor: '#886080'
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
      if (Array.isArray(item.pos)) {
        // 如果是数组，使用第一个词性
        posKey = item.pos[0] || 'other';
      } else if (typeof item.pos === 'string') {
        if (item.pos.includes('/')) {
          // 如果是用 / 分隔的字符串，使用第一个词性
          posKey = item.pos.split('/')?.[0] || 'other';
        } else {
          // 如果是简单字符串，直接使用
          posKey = item.pos;
        }
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

// 毛玻璃 / Glassmorphism 公共样式
// 适用于悬浮卡片、搜索历史下拉、确认弹窗等所有浮层
// 注意：需通过 createPortal 渲染到 document.body，否则父级 backdrop-filter 会阻断模糊效果
export const GLASS_CARD = 'bg-white/10 backdrop-blur-xl border border-white/10';

// 阴影配置
export const SHADOW_CONFIG = {
  normal: '0 8px 24px rgba(0, 0, 0, 0.35)',
  selected: '0 0 40px rgba(255, 255, 255, 0.15)',
  glow: '0 0 0 2px rgba(255, 255, 255, 0.1)'
};

// 边框配置
export const BORDER_CONFIG = {
  normal: '1px solid rgba(255, 255, 255, 0.22)',
  selected: '1px solid rgba(255, 255, 255, 0.40)'
};

// 文字颜色层级 — 以 HoverBubbleCard 为基准，跨组件统一对比度
export const TEXT_PRIMARY   = 'text-white/95';  // 词汇标题
export const TEXT_BODY      = 'text-white/90';  // 主体内容（中文释义）
export const TEXT_SECONDARY = 'text-white/70';  // 次级内容（例句英文）
export const TEXT_LABEL     = 'text-white/60';  // 标签（词性、音标）
export const TEXT_MUTED     = 'text-white/50';  // 弱化信息（词形标签等）

// ── NavBar 设计 Token ──────────────────────────────────────────────────────────
// 图标按钮激活色（Morandi 色系）
export const NAV_ACTIVE_COLORS = {
  recall:    '#B79A7A',  // 琥珀
  favorites: '#A7A6BF',  // 紫罗兰
  donate:    '#B4848F',  // 玫瑰
} as const;
