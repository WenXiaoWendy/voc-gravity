import { BubbleItem } from '../types/bubble';
import vocabularyData from './ielts.json';

// 从vocabulary.json中提取词汇数据
const vocabularyWords = vocabularyData as Array<{
  word: string;
  pos: string;
  meaning: string;
  example: string;
  extra: string;
  topic: string;
}>;

// 关系类型定义
const relationTypes = ['near-synonym', 'contrast', 'confusable', 'topic-cluster', 'usage', 'formal', 'literary', 'noun-form', 'general'];

// 生成词汇数据 - 使用vocabulary.json数据
const generateMockWords = (): BubbleItem[] => {
  const words: BubbleItem[] = [];

  // 中心词 - 使用vocabulary.json中的第一个词
  if (vocabularyWords.length > 0) {
    const centerWord = vocabularyWords[0];
    words.push({
      id: '1',
      word: centerWord.word,
      pos: centerWord.pos,
    //   brief_gloss: centerWord.meaning,
      chinese_gloss: centerWord.meaning,
      source: 'vocabulary_json',
      layer: 'center',
      score: 0.95,
      relation_type: 'center',
      example: centerWord.example,
      why: `This word is the center word from vocabulary.json`,
      usage_notes: [centerWord.extra !== '-' ? centerWord.extra : 'Common usage'],
      contrast_example: vocabularyWords.length > 1 ? `Contrast with ${vocabularyWords[1].word}` : undefined
    });
  }

  // 生成其他词汇 - 使用vocabulary.json数据
  const maxWords = Math.min(100, vocabularyWords.length);

  for (let i = 2; i <= maxWords; i++) {
    const baseWord = vocabularyWords[i - 1];
    const layer = i <= 10 ? 'inner' : i <= 30 ? 'middle' : 'outer';
    const score = 0.95 - (i * 0.003); // 分数逐渐降低
    const relationType = relationTypes[Math.floor(Math.random() * relationTypes.length)];

    words.push({
      id: i.toString(),
      word: baseWord.word,
      pos: baseWord.pos,
    //   brief_gloss: baseWord.meaning,
      chinese_gloss: baseWord.meaning,
      source: 'vocabulary_json',
      layer,
      score: Math.max(0.5, score), // 确保分数不低于0.5
      relation_type: relationType,
      why: `Related to ${words[0].word} through ${relationType} relationship`,
      usage_notes: [baseWord.extra !== '-' ? baseWord.extra : 'Common usage'],
      example: baseWord.example,
      contrast_example: i % 5 === 0 ? `Contrast with ${vocabularyWords[Math.floor(Math.random() * vocabularyWords.length)].word}` : undefined
    });
  }

  return words;
};

export const mockWords: BubbleItem[] = generateMockWords();
