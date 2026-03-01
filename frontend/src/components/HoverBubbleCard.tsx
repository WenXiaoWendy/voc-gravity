import React, { useEffect, useRef, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { getRelationChinese, relationTypeColorMap } from '../utils/relations';

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
      const cardHeight = 220;

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
      className={`
        fixed z-40 pointer-events-none
        bg-white/10 backdrop-blur-xl rounded-xl
        border border-white/10 shadow-xl
        transition-opacity duration-200 ease-out
      `}
      style={{
        opacity: opacity,
        width: '280px',
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      {item && (
        <div className="p-4">
          <div className="mb-3 pb-3 border-b border-white/10">
            <div className="flex items-start gap-2 mb-2">
              <h3 className="text-lg font-serif font-semibold text-white/95 flex-shrink-0">
                {item.word}
              </h3>
              {includeAnalysis && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {getRelationTypes().map((relationType, index) => (
                    <span
                      key={index}
                      className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={getRelationTagStyle(relationType)}
                    >
                      {getRelationChinese(relationType)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {item.chinese_gloss && (
            <div className="mb-3">
              <div className="flex items-start gap-2">
                {item.pos && (
                  <span className="text-xs font-medium text-white/60 flex-shrink-0 mt-0.5">{item.pos}</span>
                )}
                <p className="text-white/90 text-sm leading-relaxed flex-1">{item.chinese_gloss}</p>
              </div>
            </div>
          )}

          {item.example && item.example !== '-' && (
            <div className="mb-3">
              <p className="text-white/70 text-xs leading-relaxed italic">
                "{item.example}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
