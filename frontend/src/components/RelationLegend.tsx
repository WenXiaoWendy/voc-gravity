import React from 'react';
import { relationTypeChineseMap, relationTypeColorMap } from '../utils/relations';

interface RelationLegendProps {
  selectedRelationTypes: string[];
  filteredWordsCount: number;
  onRelationTypeChange: (relationTypes: string[]) => void;
  className?: string;
  includeAnalysis?: boolean;
}

const RelationLegend: React.FC<RelationLegendProps> = ({
  selectedRelationTypes,
  filteredWordsCount,
  onRelationTypeChange,
  className = '',
  includeAnalysis = true
}) => {
  const handleRelationTypeClick = (relationType: string) => {
    if (selectedRelationTypes.includes(relationType)) {
      onRelationTypeChange(selectedRelationTypes.filter(type => type !== relationType));
    } else {
      onRelationTypeChange([...selectedRelationTypes, relationType]);
    }
  };

  const handleClearAll = () => {
    onRelationTypeChange([]);
  };

  return (
    <div className={`${className} fixed top-24 right-3 z-30 ${!includeAnalysis ? 'pointer-events-none' : ''}`}>
      <div className={`bg-black/30 backdrop-blur-xl rounded-lg shadow-xl p-2 w-56 ${!includeAnalysis ? 'blur-[0.5px]' : ''}`}>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(relationTypeChineseMap).map(([key, chinese]) => {
            const isSelected = selectedRelationTypes.includes(key);

            return (
              <div
                key={key}
                onClick={() => handleRelationTypeClick(key)}
                className={`
                  flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer transition-all duration-150
                  border border-transparent hover:border-white/20
                  ${isSelected && 'bg-white/20'}
                `}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: relationTypeColorMap[key] }}
                />
                <span className={`text-xs ${isSelected ? 'text-white font-medium' : 'text-white/80'}`}>
                  {chinese}
                </span>
                {isSelected && (
                  <div className="ml-auto text-xs text-white/80 font-bold">×</div>
                )}
              </div>
            );
          })}

          <div
            key="clear-all"
            onClick={handleClearAll}
            className={`
              flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer transition-all duration-150
              border border-transparent hover:border-white/20
              ${selectedRelationTypes.length > 0 ? 'bg-white/20' : ''}
            `}
          >
            <div className="text-sm text-white/80 font-bold">×</div>
            <span className={`text-xs ${selectedRelationTypes.length > 0 ? 'text-white font-medium' : 'text-white/80'}`}>
              清空选择
            </span>
          </div>
        </div>

        <div className={`mt-1.5 text-[10px] text-white/60 text-center`}>
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
