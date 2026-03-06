export const relationTypeChineseMap: Record<string, string> = {
  'synonym': '同义/近义',
  'antonym': '反义/对立',
  'hypernym': '上位(更泛)',
  'hyponym': '下位(具体)',
  'cohyponym': '同类并列',
  'collocation': '常见搭配',
  'frame': '同场景',
  'register': '语体差异',
  'noise': '噪声/漂移'
};

export const relationTypeColorMap: Record<string, string> = {
  'synonym': '#7FA8B8',
  'antonym': '#B4848F',
  'hypernym': '#8FA3A0',
  'hyponym': '#7FA58A',
  'cohyponym': '#8F98B6',
  'collocation': '#9EA3AA',
  'frame': '#A897B0',
  'register': '#A880A0',
  'noise': '#B79A7A'
};

export const getRelationChinese = (relationType: string | string[]): string => {
  if (Array.isArray(relationType) && relationType.length > 0) {
    return relationType.map(rt => relationTypeChineseMap[rt] || rt).join(', ');
  }
  if (typeof relationType === 'string') {
    return relationTypeChineseMap[relationType] || relationType;
  }
  return '';
};
