import React, { useEffect, useState } from 'react';
import { BubbleItem } from '../types/bubble';
import { isFavorited, toggleFavorite } from '../utils/favorites';
import { wordFormChineseMap } from '../utils/wordForms';
import { PronunciationButton } from './PronunciationButton';

interface WordDetailContentProps {
  item: BubbleItem;
}

export const WordDetailContent: React.FC<WordDetailContentProps> = ({ item }) => {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    setFavorited(isFavorited(item.word));
  }, [item.word]);

  return (
    <div className="h-full flex flex-col">
      {/* 标题区域 */}
      <div className="p-5 pb-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-xl font-serif font-semibold text-white/95 shrink-0">
            {item.word}
          </h3>
          <button
            onClick={() => setFavorited(toggleFavorite(item.word))}
            title={favorited ? '取消收藏' : '加入收藏'}
            className="text-base leading-none transition-colors shrink-0 hover:scale-110 active:scale-95"
            style={{ color: favorited ? '#f87171' : 'rgba(255,255,255,0.35)' }}
          >
            {favorited ? '♥' : '♡'}
          </button>
          {item.pronunciation && (
            <span className="text-white/55 text-sm font-mono truncate">
              {Array.isArray(item.pronunciation)
                ? item.pronunciation[0]
                : item.pronunciation}
            </span>
          )}
          <PronunciationButton word={item.word} size={16} />
          {item.frequency && (
            <span className="ml-auto shrink-0 text-xs bg-white/10 px-1.5 py-0.5 rounded-full text-white/60">
              词频 {item.frequency}/10
            </span>
          )}
        </div>
        {(item.pos || (item.category && item.category.length > 0)) && (
          <div className="flex flex-wrap items-center gap-1">
            {item.pos && (
              Array.isArray(item.pos) ? (
                item.pos.map((p, idx) => (
                  <span key={idx} className="text-xs font-medium text-white/60">{p}</span>
                ))
              ) : (
                <span className="text-xs font-medium text-white/60">{item.pos}</span>
              )
            )}
            {item.category && item.category.map((cat, index) => (
              <span key={index} className="text-xs bg-white/5 px-1.5 py-0.5 rounded text-white/50">
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 滚动内容 */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {item.chinese_gloss && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-white/60 mb-1.5">中文释义</h4>
            <p className="text-white/90 leading-relaxed text-sm">{item.chinese_gloss}</p>
          </div>
        )}

        {item.english_meaning && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-white/60 mb-1.5">英文释义</h4>
            <p className="text-white/80 text-xs leading-relaxed italic">{item.english_meaning}</p>
          </div>
        )}

        {item.examples && item.examples.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-white/60 mb-1.5">例句</h4>
            <div className="space-y-2.5">
              {item.examples.map((example, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <p className="text-white/85 text-xs leading-relaxed italic mb-1">
                    "{example.sentence}"
                  </p>
                  <p className="text-white/65 text-xs leading-relaxed mb-0.5">
                    {example.chinese_translation}
                  </p>
                  <p className="text-white/45 text-[10px] font-medium">
                    — {example.source}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.word_forms && Object.keys(item.word_forms).length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-white/60 mb-1.5">词形变化</h4>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(item.word_forms).map(([form, word], index) => (
                <div key={index} className="bg-white/5 px-2 py-1 rounded-lg">
                  <span className="text-white/50 text-[10px] mr-0.5">{wordFormChineseMap[form] || form}:</span>
                  <span className="text-white/80 text-xs font-medium">{word}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.collocations && item.collocations.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-white/60 mb-1.5">高频搭配</h4>
            <div className="flex flex-wrap gap-1">
              {item.collocations.map((collocation, index) => (
                <span key={index} className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/75">
                  {collocation}
                </span>
              ))}
            </div>
          </div>
        )}

        {item.derivatives && item.derivatives.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-white/60 mb-1.5">派生词</h4>
            <div className="flex flex-wrap gap-1.5">
              {item.derivatives.map((derivative, index) => (
                <div key={index} className="bg-white/5 px-2 py-1 rounded-lg">
                  <div className="font-medium text-white/85 text-xs mb-0.5">
                    {derivative.word}
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    {derivative.pos && (
                      <span className="text-white/50">{derivative.pos}</span>
                    )}
                    {derivative.meaning && (
                      <span className="text-white/65">{derivative.meaning}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.usage_notes && item.usage_notes.length > 0 && item.usage_notes[0] !== 'Common usage' && (
          <div>
            <h4 className="text-xs font-medium text-white/60 mb-1.5">使用注意</h4>
            <ul className="space-y-1">
              {item.usage_notes.map((note, index) => (
                <li key={index} className="text-white/80 text-xs leading-relaxed">
                  • {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
