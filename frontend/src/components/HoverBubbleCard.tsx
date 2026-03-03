import React, { useEffect, useRef, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { getRelationChinese, relationTypeColorMap } from '@/utils/relations';
import { GLASS_CARD, TEXT_PRIMARY, TEXT_BODY, TEXT_SECONDARY, TEXT_LABEL, TEXT_MUTED } from '@/utils/theme';
import { wordFormChineseMap } from '@/utils/wordForms';

interface HoverBubbleCardProps {
  item: BubbleItem | null;
  includeAnalysis?: boolean;
}

export const HoverBubbleCard: React.FC<HoverBubbleCardProps> = ({ item, includeAnalysis = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const offsetX = 20;
      const offsetY = 20;
      const cardWidth = 280;
      const cardHeight = 280;

      let x = e.clientX + offsetX;
      let y = e.clientY + offsetY;

      if (x + cardWidth > window.innerWidth) {
        x = e.clientX - cardWidth - offsetX;
      }

      if (y + cardHeight > window.innerHeight) {
        y = e.clientY - cardHeight - offsetY;
      }

      setPosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (item) {
      setIsVisible(true);
      setTimeout(() => setOpacity(1), 10);
    } else {
      setOpacity(0);
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [item]);

  const getRelationTagStyle = (relationType: string) => {
    const baseColor = relationTypeColorMap[relationType] || '#9EA3AA';

    const addOpacity = (color: string, opacity: number) => {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    return {
      backgroundColor: addOpacity(baseColor, 0.35),
      color: 'rgba(255,255,255,0.95)'
    };
  };

  const getRelationTypes = () => {
    if (!item || !item.relation_type || item.relation_type === 'center') {
      return [];
    }
    if (Array.isArray(item.relation_type)) {
      return item.relation_type;
    }
    return [item.relation_type];
  };

  if (!isVisible && !item) return null;

  return (
    <div
      ref={cardRef}
      className={`fixed z-50 pointer-events-none ${GLASS_CARD} rounded-xl shadow-xl transition-opacity duration-200 ease-out`}
      style={{
        opacity: opacity,
        width: '280px',
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      {item && (
        <div className="p-3.5">
          {/* 单词、发音、词频一行 */}
          <div className="flex items-center gap-2 mb-2.5">
            <h3 className={`text-lg font-serif font-semibold ${TEXT_PRIMARY}`}>
              {item.word}
            </h3>
            {item.pronunciation && (
              <span className={`${TEXT_LABEL} text-xs font-mono`}>
                {Array.isArray(item.pronunciation) ? item.pronunciation[0] : item.pronunciation}
              </span>
            )}
            {item.frequency && (
              <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full text-white/50 ml-auto">
                {item.frequency}/10
              </span>
            )}
          </div>

          {includeAnalysis && (
            <div className="flex flex-wrap gap-1 mb-2">
              {getRelationTypes().map((relationType, index) => (
                <span
                  key={index}
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={getRelationTagStyle(relationType)}
                >
                  {getRelationChinese(relationType)}
                </span>
              ))}
            </div>
          )}

          {/* 词性和中文释义 */}
          <div className="mb-2.5">
            <div className="flex items-start gap-2">
              {item.pos && (
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(item.pos) ? (
                    item.pos.map((p, idx) => (
                      <span key={idx} className={`text-xs font-medium ${TEXT_LABEL} mt-0.5`}>{p}</span>
                    ))
                  ) : (
                    <span className={`text-xs font-medium ${TEXT_LABEL} mt-0.5`}>{item.pos}</span>
                  )}
                </div>
              )}
              <p className={`${TEXT_BODY} text-sm leading-relaxed flex-1`}>{item.chinese_gloss}</p>
            </div>
          </div>

          {/* 例句（英文+中文） */}
          {item.examples && item.examples.length > 0 && (
            <div className="mb-2.5">
              <p className={`${TEXT_SECONDARY} text-xs leading-relaxed italic mb-1`}>
                "{item.examples[0].sentence}"
              </p>
              <p className={`${TEXT_LABEL} text-xs leading-relaxed`}>
                {item.examples[0].chinese_translation}
              </p>
            </div>
          )}

          {/* 词形变化（放最下面） */}
          {item.word_forms && Object.keys(item.word_forms).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(item.word_forms).map(([key, value], idx) => (
                <div key={idx} className="bg-white/5 px-2 py-1 rounded-lg">
                  <span className={`${TEXT_MUTED} text-[10px] mr-0.5`}>{wordFormChineseMap[key] || key}:</span>
                  <span className="text-white/80 text-xs font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
