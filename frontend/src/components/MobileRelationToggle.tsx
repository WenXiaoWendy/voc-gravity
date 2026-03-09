import React, { useState } from 'react';
import { GLASS_CARD_STYLE } from '../utils/theme';
import RelationLegend from './RelationLegend';

interface MobileRelationToggleProps {
  selectedRelationTypes: string[];
  filteredWordsCount: number;
  onRelationTypeChange: (types: string[]) => void;
  includeAnalysis: boolean;
}

export const MobileRelationToggle: React.FC<MobileRelationToggleProps> = ({
  selectedRelationTypes, filteredWordsCount, onRelationTypeChange, includeAnalysis,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!includeAnalysis) return null;

  return (
    <>
      {/* 右下角浮动按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-3 bottom-[80px] z-25 w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        style={GLASS_CARD_STYLE}
        title="关系筛选"
      >
        <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        {selectedRelationTypes.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-white/30 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
            {selectedRelationTypes.length}
          </span>
        )}
      </button>

      {/* 半屏抽屉 */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[45] bg-black/40" onClick={() => setIsOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-4 pb-8" style={GLASS_CARD_STYLE}>
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>
            <RelationLegend
              selectedRelationTypes={selectedRelationTypes}
              filteredWordsCount={filteredWordsCount}
              onRelationTypeChange={onRelationTypeChange}
              includeAnalysis={includeAnalysis}
            />
          </div>
        </>
      )}
    </>
  );
};
