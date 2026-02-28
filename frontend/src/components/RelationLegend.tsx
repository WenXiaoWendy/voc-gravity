import React from 'react';

// 关系类型中文映射（不包含中心词）
const relationTypeChineseMap: Record<string, string> = {
  'near-synonym': '近义词',
  'contrast': '对比词',
  'confusable': '易混淆词',
  'topic-cluster': '主题相关',
  'usage': '用法相关',
  'formal': '正式用语',
  'literary': '文学用语',
  'noun-form': '名词形式',
  'general': '一般关系'
};

// 关系类型颜色映射（不包含中心词）
const relationTypeColorMap: Record<string, string> = {
  'near-synonym': '#7FA8B8',
  'contrast': '#B4848F',
  'confusable': '#B79A7A',
  'topic-cluster': '#7FA58A',
  'usage': '#8F98B6',
  'formal': '#9EA3AA',
  'literary': '#9EA3AA',
  'noun-form': '#9EA3AA',
  'general': '#8FA3A0'
};

interface RelationLegendProps {
  selectedRelationTypes: string[];
  filteredWordsCount: number;
  onRelationTypeChange: (relationTypes: string[]) => void;
  className?: string;
}

// 关系类型图例组件 - 紧凑布局，无边框设计
const RelationLegend: React.FC<RelationLegendProps> = ({
  selectedRelationTypes,
  filteredWordsCount,
  onRelationTypeChange,
  className = ''
}) => {
  // 处理关系类型选择
  const handleRelationTypeClick = (relationType: string) => {
    if (selectedRelationTypes.includes(relationType)) {
      // 如果已选中，则移除
      onRelationTypeChange(selectedRelationTypes.filter(type => type !== relationType));
    } else {
      // 如果未选中，则添加
      onRelationTypeChange([...selectedRelationTypes, relationType]);
    }
  };

  return (
    <div className={`${className} fixed top-24 right-4 z-30`}>
      {/* 紧凑布局容器 */}
      <div className="bg-black/30 backdrop-blur-xl rounded-xl shadow-xl p-3 w-64">
        {/* 紧凑的两列布局 */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(relationTypeChineseMap).map(([key, chinese]) => {
            const isSelected = selectedRelationTypes.includes(key);

            return (
              <div
                key={key}
                onClick={() => handleRelationTypeClick(key)}
                className={`
                  flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-150
                  border border-transparent hover:border-white/20
                  ${isSelected && 'bg-white/20'}
                `}
              >
                {/* 颜色标识 */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: relationTypeColorMap[key] }}
                />

                {/* 中文名称 */}
                <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-white/80'}`}>
                  {chinese}
                </span>

                {/* 选中状态指示器 */}
                {isSelected && (
                  <div className="ml-auto text-xs text-white/80 font-bold">×</div>
                )}
              </div>
            );
          })}
        </div>

        {/* 简洁的状态信息 */}
        <div className="mt-2 text-xs text-white/60 text-center">
          {selectedRelationTypes.length > 0
            ? `已筛选出单词 ${filteredWordsCount} 个`
            : '点击关系进行筛选'
          }
        </div>
      </div>
    </div>
  );
};

export default RelationLegend;
