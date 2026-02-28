import React from 'react';
import { BubbleItem } from '../types/bubble';
import { getBubbleTheme } from '../utils/theme';

interface BottomSheetProps {
  selectedItem: BubbleItem | null;
}

// 右侧信息抽屉组件 - iOS 毛玻璃效果
// Apple Health / iOS 17 风格
// 毛玻璃 + 细边框 + 柔和阴影

export const BottomSheet: React.FC<BottomSheetProps> = ({ selectedItem }) => {
  if (!selectedItem) {
    return null;
  }

  const theme = getBubbleTheme(selectedItem);

  return (
    <div className="
      fixed right-4 top-1/2 transform -translate-y-1/2 w-96 z-50
      bg-white/10 backdrop-blur-xl rounded-2xl p-6
      border border-white/10 shadow-2xl
      transition-all duration-300 ease-out
    ">
      {/* 标题区域 */}
      <div className="mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          {/* 关系类型徽章 - 同色系 */}
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: theme.badgeColor }}
          />
          <h3 className="text-2xl font-serif font-semibold text-white/95">
            {selectedItem.word}
          </h3>
        </div>

        <div className="flex items-center gap-3 text-white/60">
          {selectedItem.pos && (
            <span className="text-sm font-medium">{selectedItem.pos}</span>
          )}
          {selectedItem.relation_type && (
            <span className="text-sm font-medium">{selectedItem.relation_type}</span>
          )}
        </div>
      </div>

      {/* 中文释义 */}
      {selectedItem.chinese_gloss && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-white/60 mb-2">中文释义</h4>
          <p className="text-white/90 leading-relaxed">{selectedItem.chinese_gloss}</p>
        </div>
      )}

      {/* 英文释义
      {selectedItem.brief_gloss && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-white/60 mb-2">英文释义</h4>
          <p className="text-white/90 leading-relaxed">{selectedItem.brief_gloss}</p>
        </div>
      )} */}

      {/* 例句 */}
      {selectedItem.example && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-white/60 mb-2">例句</h4>
          <p className="text-white/80 text-sm leading-relaxed italic">
            "{selectedItem.example}"
          </p>
        </div>
      )}

      {/* 额外信息 */}
      {selectedItem.usage_notes && selectedItem.usage_notes.length > 0 && selectedItem.usage_notes[0] !== 'Common usage' && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-white/60 mb-2">额外信息</h4>
          <ul className="space-y-2">
            {selectedItem.usage_notes.map((note, index) => (
              <li key={index} className="text-white/80 text-sm leading-relaxed">
                • {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 关系说明 */}
      {selectedItem.why && selectedItem.relation_type !== 'center' && (
        <div>
          <h4 className="text-sm font-medium text-white/60 mb-2">关系说明</h4>
          <p className="text-white/80 text-sm leading-relaxed">{selectedItem.why}</p>
        </div>
      )}
    </div>
  );
};
