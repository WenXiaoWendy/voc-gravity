import { BubbleItem } from '../types/bubble';

// 常用雅思词汇库 - 包含中英文释义
const commonIELTSWords = [
  // abandon 相关词汇
  { word: 'abandon', pos: 'v', gloss: 'to leave behind or discontinue use of; to give up completely', chinese: '放弃，抛弃' },
  { word: 'desert', pos: 'v', gloss: 'to leave without intending to return; to abandon', chinese: '遗弃，抛弃' },
  { word: 'leave', pos: 'v', gloss: 'to go away from; to depart from', chinese: '离开，留下' },
  { word: 'quit', pos: 'v', gloss: 'to stop doing something; to resign from a job', chinese: '停止，辞职' },
  { word: 'surrender', pos: 'v', gloss: 'to give up control or possession of; to yield', chinese: '投降，放弃' },
  { word: 'forsake', pos: 'v', gloss: 'to abandon or leave someone or something', chinese: '抛弃，放弃' },
  { word: 'relinquish', pos: 'v', gloss: 'to give up or let go of something', chinese: '放弃，让出' },
  { word: 'abandonment', pos: 'n', gloss: 'the act of abandoning something or someone', chinese: '放弃，遗弃' },
  { word: 'desertion', pos: 'n', gloss: 'the act of deserting or leaving without permission', chinese: '遗弃，擅离职守' },
  { word: 'departure', pos: 'n', gloss: 'the act of leaving a place', chinese: '离开，出发' },
  { word: 'renunciation', pos: 'n', gloss: 'the act of renouncing or rejecting something', chinese: '放弃，否认' },
  { word: 'withdrawal', pos: 'n', gloss: 'the act of withdrawing or removing something', chinese: '撤回，撤退' },

  // 教育相关词汇
  { word: 'education', pos: 'n', gloss: 'the process of teaching and learning', chinese: '教育' },
  { word: 'academic', pos: 'adj', gloss: 'relating to education and scholarship', chinese: '学术的，学院的' },
  { word: 'curriculum', pos: 'n', gloss: 'the subjects comprising a course of study', chinese: '课程' },
  { word: 'pedagogy', pos: 'n', gloss: 'the method and practice of teaching', chinese: '教学法' },
  { word: 'literacy', pos: 'n', gloss: 'the ability to read and write', chinese: '读写能力' },
  { word: 'tuition', pos: 'n', gloss: 'teaching or instruction, especially of individuals', chinese: '学费，教学' },
  { word: 'scholarship', pos: 'n', gloss: 'academic study or achievement', chinese: '奖学金，学术成就' },
  { word: 'enrollment', pos: 'n', gloss: 'the act of enrolling in a school or course', chinese: '注册，入学' },
  { word: 'graduation', pos: 'n', gloss: 'the receiving of an academic degree', chinese: '毕业' },
  { word: 'diploma', pos: 'n', gloss: 'a certificate awarded by an educational institution', chinese: '文凭，毕业证书' },

  // 环境相关词汇
  { word: 'environment', pos: 'n', gloss: 'the surroundings or conditions in which a person lives', chinese: '环境' },
  { word: 'pollution', pos: 'n', gloss: 'the presence of harmful substances in the environment', chinese: '污染' },
  { word: 'conservation', pos: 'n', gloss: 'the protection of natural resources', chinese: '保护，保存' },
  { word: 'sustainability', pos: 'n', gloss: 'the ability to be maintained at a certain rate', chinese: '可持续性' },
  { word: 'ecosystem', pos: 'n', gloss: 'a biological community of interacting organisms', chinese: '生态系统' },
  { word: 'biodiversity', pos: 'n', gloss: 'the variety of life in a particular habitat', chinese: '生物多样性' },
  { word: 'renewable', pos: 'adj', gloss: 'able to be replenished naturally', chinese: '可再生的' },
  { word: 'deforestation', pos: 'n', gloss: 'the clearing of forests', chinese: '森林砍伐' },
  { word: 'emission', pos: 'n', gloss: 'the production and discharge of something', chinese: '排放，散发' },
  { word: 'recycling', pos: 'n', gloss: 'the process of converting waste into reusable material', chinese: '回收利用' },

  // 科技相关词汇
  { word: 'technology', pos: 'n', gloss: 'the application of scientific knowledge', chinese: '技术' },
  { word: 'innovation', pos: 'n', gloss: 'a new method, idea, or product', chinese: '创新' },
  { word: 'digital', pos: 'adj', gloss: 'relating to or using computer technology', chinese: '数字的，数码的' },
  { word: 'automation', pos: 'n', gloss: 'the use of automatic equipment in manufacturing', chinese: '自动化' },
  { word: 'artificial', pos: 'adj', gloss: 'made or produced by human beings', chinese: '人工的，人造的' },
  { word: 'algorithm', pos: 'n', gloss: 'a process or set of rules to be followed', chinese: '算法' },
  { word: 'cybersecurity', pos: 'n', gloss: 'the protection of computer systems', chinese: '网络安全' },
  { word: 'virtual', pos: 'adj', gloss: 'not physically existing but made by software', chinese: '虚拟的' },
  { word: 'interface', pos: 'n', gloss: 'a point where two systems meet and interact', chinese: '界面，接口' },
  { word: 'database', pos: 'n', gloss: 'a structured set of data held in a computer', chinese: '数据库' },

  // 健康相关词汇
  { word: 'health', pos: 'n', gloss: 'the state of being free from illness or injury', chinese: '健康' },
  { word: 'nutrition', pos: 'n', gloss: 'the process of providing or obtaining food', chinese: '营养' },
  { word: 'wellness', pos: 'n', gloss: 'the state of being in good health', chinese: '健康，保健' },
  { word: 'prevention', pos: 'n', gloss: 'the action of stopping something from happening', chinese: '预防' },
  { word: 'treatment', pos: 'n', gloss: 'medical care given to a patient', chinese: '治疗，处理' },
  { word: 'diagnosis', pos: 'n', gloss: 'the identification of the nature of an illness', chinese: '诊断' },
  { word: 'therapy', pos: 'n', gloss: 'treatment intended to relieve or heal a disorder', chinese: '治疗，疗法' },
  { word: 'vaccination', pos: 'n', gloss: 'treatment with a vaccine to produce immunity', chinese: '疫苗接种' },
  { word: 'epidemic', pos: 'n', gloss: 'a widespread occurrence of an infectious disease', chinese: '流行病' },
  { word: 'pandemic', pos: 'n', gloss: 'an epidemic that has spread worldwide', chinese: '大流行病' },

  // 经济相关词汇
  { word: 'economy', pos: 'n', gloss: 'the wealth and resources of a country', chinese: '经济' },
  { word: 'inflation', pos: 'n', gloss: 'a general increase in prices and fall in purchasing value', chinese: '通货膨胀' },
  { word: 'investment', pos: 'n', gloss: 'the action of investing money for profit', chinese: '投资' },
  { word: 'recession', pos: 'n', gloss: 'a period of temporary economic decline', chinese: '经济衰退' },
  { word: 'globalization', pos: 'n', gloss: 'the process of international integration', chinese: '全球化' },
  { word: 'entrepreneur', pos: 'n', gloss: 'a person who sets up a business', chinese: '企业家' },
  { word: 'market', pos: 'n', gloss: 'a regular gathering of people for the purchase and sale', chinese: '市场' },
  { word: 'currency', pos: 'n', gloss: 'a system of money in general use', chinese: '货币' },
  { word: 'trade', pos: 'n', gloss: 'the action of buying and selling goods and services', chinese: '贸易' },
  { word: 'commerce', pos: 'n', gloss: 'the activity of buying and selling', chinese: '商业' },

  // 社会相关词汇
  { word: 'society', pos: 'n', gloss: 'the aggregate of people living together', chinese: '社会' },
  { word: 'culture', pos: 'n', gloss: 'the arts and other manifestations of human achievement', chinese: '文化' },
  { word: 'tradition', pos: 'n', gloss: 'the transmission of customs or beliefs', chinese: '传统' },
  { word: 'community', pos: 'n', gloss: 'a group of people living in the same place', chinese: '社区' },
  { word: 'diversity', pos: 'n', gloss: 'the state of being diverse', chinese: '多样性' },
  { word: 'equality', pos: 'n', gloss: 'the state of being equal', chinese: '平等' },
  { word: 'justice', pos: 'n', gloss: 'just behavior or treatment', chinese: '正义，司法' },
  { word: 'democracy', pos: 'n', gloss: 'a system of government by the whole population', chinese: '民主' },
  { word: 'freedom', pos: 'n', gloss: 'the power to act, speak, or think as one wants', chinese: '自由' },
  { word: 'rights', pos: 'n', gloss: 'moral or legal entitlements', chinese: '权利' },

  // 心理相关词汇
  { word: 'psychology', pos: 'n', gloss: 'the scientific study of the human mind', chinese: '心理学' },
  { word: 'emotion', pos: 'n', gloss: 'a natural instinctive state of mind', chinese: '情感，情绪' },
  { word: 'behavior', pos: 'n', gloss: 'the way in which one acts or conducts oneself', chinese: '行为' },
  { word: 'cognition', pos: 'n', gloss: 'the mental action of acquiring knowledge', chinese: '认知' },
  { word: 'perception', pos: 'n', gloss: 'the ability to see, hear, or become aware', chinese: '感知' },
  { word: 'memory', pos: 'n', gloss: 'the faculty by which the mind stores information', chinese: '记忆' },
  { word: 'intelligence', pos: 'n', gloss: 'the ability to acquire and apply knowledge', chinese: '智力，智能' },
  { word: 'consciousness', pos: 'n', gloss: 'the state of being aware of and responsive', chinese: '意识' },
  { word: 'subconscious', pos: 'adj', gloss: 'of or concerning the part of the mind', chinese: '潜意识的' },
  { word: 'therapy', pos: 'n', gloss: 'treatment intended to relieve or heal', chinese: '治疗，疗法' },

  // 艺术相关词汇
  { word: 'art', pos: 'n', gloss: 'the expression of human creative skill', chinese: '艺术' },
  { word: 'music', pos: 'n', gloss: 'vocal or instrumental sounds', chinese: '音乐' },
  { word: 'literature', pos: 'n', gloss: 'written works, especially those considered', chinese: '文学' },
  { word: 'painting', pos: 'n', gloss: 'the process or art of using paint', chinese: '绘画' },
  { word: 'sculpture', pos: 'n', gloss: 'the art of making three-dimensional works', chinese: '雕塑' },
  { word: 'architecture', pos: 'n', gloss: 'the art of designing buildings', chinese: '建筑' },
  { word: 'performance', pos: 'n', gloss: 'an act of presenting a play, concert', chinese: '表演' },
  { word: 'creative', pos: 'adj', gloss: 'relating to or involving imagination', chinese: '创造性的' },
  { word: 'aesthetic', pos: 'adj', gloss: 'concerned with beauty or the appreciation', chinese: '美学的' },
  { word: 'inspiration', pos: 'n', gloss: 'the process of being mentally stimulated', chinese: '灵感' }
];

// 关系类型定义
const relationTypes = ['near-synonym', 'contrast', 'confusable', 'topic-cluster', 'usage', 'formal', 'literary', 'noun-form', 'general'];

// 生成100个词汇数据
const generateMockWords = (): BubbleItem[] => {
  const words: BubbleItem[] = [];

  // 中心词
  words.push({
    id: '1',
    word: 'abandon',
    pos: 'v',
    brief_gloss: 'to leave behind or discontinue use of; to give up completely',
    chinese_gloss: '放弃，抛弃',
    source: 'ielts_v1',
    layer: 'center',
    score: 0.95,
    relation_type: 'center',
    example: 'He decided to abandon his old car and buy a new one.'
  });

  // 生成其他99个词汇
  for (let i = 2; i <= 100; i++) {
    const baseWord = commonIELTSWords[(i - 1) % commonIELTSWords.length];
    const layer = i <= 10 ? 'inner' : i <= 30 ? 'middle' : 'outer';
    const score = 0.95 - (i * 0.003); // 分数逐渐降低
    const relationType = relationTypes[Math.floor(Math.random() * relationTypes.length)];

    words.push({
      id: i.toString(),
      word: baseWord.word,
      pos: baseWord.pos,
      brief_gloss: baseWord.gloss,
      chinese_gloss: baseWord.chinese,
      source: 'ielts_v1',
      layer,
      score: Math.max(0.5, score), // 确保分数不低于0.5
      relation_type: relationType,
      why: `Related to ${words[0].word} through ${relationType} relationship`,
      usage_notes: [`${baseWord.word} + noun/verb`, `Common in ${layer} layer`],
      example: `This is an example sentence for ${baseWord.word}.`,
      contrast_example: i % 5 === 0 ? `Contrast with ${words[Math.floor(Math.random() * words.length)].word}` : undefined
    });
  }

  return words;
};

export const mockWords: BubbleItem[] = generateMockWords();
