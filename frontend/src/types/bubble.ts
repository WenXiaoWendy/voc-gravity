// 完整词汇数据类型定义
export interface Derivative {
  word: string;
  pos: string;
  meaning: string;
}

export interface CompleteWordData {
  word: string;
  pos: string | string[];
  frequency: number;
  category: string[];
  pronunciation: string | string[];
  chinese_meaning: string;
  english_meaning: string;
  examples: Array<{
    sentence: string;
    chinese_translation: string;
    source: string;
  }>;
  collocations: string[];
  word_forms: Record<string, string>;
  derivatives: Derivative[];
  usage_notes: string[];
}

// 词汇条目（简化版本，用于词库）
export interface WordEntry {
  id: string;
  word: string;
  pos?: string | string[];
  brief_gloss?: string;
  chinese_gloss?: string;
  source: string;
  tags?: string[];
  // 新增完整词汇数据字段
  frequency?: number;
  category?: string[];
  pronunciation?: string | string[];
  english_meaning?: string;
  examples?: Array<{
    sentence: string;
    chinese_translation: string;
    source: string;
  }>;
  collocations?: string[];
  word_forms?: Record<string, string>;
  derivatives?: Derivative[];
}

// 气泡数据结构
export interface BubbleItem extends WordEntry {
  id: string;
  layer: Layer;
  score: number;
  relation_type: string | string[];
  reason?: string;
  usage_notes?: string[];
  example?: string;
}

export type Layer = 'center' | 'inner' | 'middle' | 'outer';

// 布局计算函数返回类型
export interface BubbleLayout {
  x: number;
  y: number;
  r: number;
}
