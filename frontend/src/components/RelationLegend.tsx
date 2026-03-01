import React from 'react';

// 关系类型中文映射（不包含中心词）
// const relationTypeChineseMap: Record<string, string> = {
//   'synonym': '近义/ 同义',
//   'antonym': '反义 / 对立',
//   'hypernym': '上位（更泛）',
//   'hyponym': '下位（更具体）',
//   'cohyponym': '同类并列（同一上位下的兄弟词）',
//   'collocation': '常见搭配（固定搭配 / 高频搭配）',
//   'frame': '同场景 / 同语义框架（相关但非同义）',
//   'register': '语体差异（正式 / 口语 / 文学 / 俚语等）',
//   'noise': '噪声/漂移（不相关或多义跑偏）'
// };

// 关系类型中文映射（不包含中心词）
const relationTypeChineseMap: Record<string, string> = {
  'synonym': '近义/同义',
  'antonym': '反义/对立',
  'hypernym': '上位（更泛）',
  'hyponym': '下位（更具体）',
  'cohyponym': '同类并列',
  'collocation': '常见搭配',
  'frame': '同场景',
  'register': '语体差异',
  'noise': '噪声/漂移'
};

// 关系类型颜色映射（不包含中心词）
const relationTypeColorMap: Record<string, string> = {
  'synonym': '#7FA8B8',
  'antonym': '#B4848F',
  'hypernym': '#8FA3A0',
  'hyponym': '#7FA58A',
  'cohyponym': '#8F98B6',
  'collocation': '#9EA3AA',
  'frame': '#9EA3AA',
  'register': '#9EA3AA',
  'noise': '#B79A7A'
};

interface RelationLegendProps {
  selectedRelationTypes: string[];
  filteredWordsCount: number;
  onRelationTypeChange: (relationTypes: string[]) => void;
  className?: string;
  includeAnalysis?: boolean;
}

// 关系类型图例组件 - 紧凑布局，无边框设计
const RelationLegend: React.FC<RelationLegendProps> = ({
  selectedRelationTypes,
  filteredWordsCount,
  onRelationTypeChange,
  className = '',
  includeAnalysis = true
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

  // 清除所有选中的关系类型
  const handleClearAll = () => {
    onRelationTypeChange([]);
  };

  return (
    <div className={`${className} fixed top-24 right-4 z-30 ${!includeAnalysis ? 'pointer-events-none' : ''}`}>
      {/* 紧凑布局容器 */}
      <div className={`bg-black/30 backdrop-blur-xl rounded-xl shadow-xl p-3 w-64 ${!includeAnalysis ? 'blur-[0.5px]' : ''}`}>
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

          {/* 清空选择按钮 - 跟随在最后一个关系映射元素后面 */}
          <div
            key="clear-all"
            onClick={handleClearAll}
            className={`
              flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-150
              border border-transparent hover:border-white/20
              ${selectedRelationTypes.length > 0 ? 'bg-white/20' : ''}
            `}
          >
            {/* 清除图标 - 使用叉号，与颜色圆点对齐 */}
            <div className="text-lg text-white/80 font-bold">×</div>
            {/* 按钮文字 - 与关系文字对齐 */}
            <span className={`text-sm ${selectedRelationTypes.length > 0 ? 'text-white font-medium' : 'text-white/80'}`}>
              清空选择
            </span>
          </div>
        </div>

        {/* 简洁的状态信息 */}
        <div className={`mt-2 text-xs text-white/60 text-center`}>
          {includeAnalysis
            ? (selectedRelationTypes.length > 0
              ? `已筛选出单词 ${filteredWordsCount} 个`
              : '点击关系进行筛选'
            )
            : '切换到 AI 深度解析以进行关系筛选'
          }
        </div>
      </div>
    </div>
  );
};

export default RelationLegend;
