// 类型定义 - 符合项目数据模型
export interface WordEntry {
  id: string;
  word: string;
  pos?: string;
  brief_gloss?: string;
  chinese_gloss?: string;
  source: string;
  tags?: string[];
}

export interface BubbleItem extends WordEntry {
  layer: 'center' | 'inner' | 'middle' | 'outer';
  score: number;
  relation_type?: string | string[];
  why?: string;
  usage_notes?: string[];
  example?: string;
  contrast_example?: string;
}

export type Layer = 'center' | 'inner' | 'middle' | 'outer';

// 布局计算函数返回类型
export interface BubbleLayout {
  x: number;
  y: number;
  r: number;
}
