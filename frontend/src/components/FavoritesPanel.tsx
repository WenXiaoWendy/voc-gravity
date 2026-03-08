import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { FavoriteItem, getFavorites, removeFromFavorites } from '../utils/favorites';
import { getHistory } from '../utils/searchHistory';
import { GLASS_CARD_STYLE } from '../utils/theme';

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (word: string) => void;
}

export const FavoritesPanel: React.FC<FavoritesPanelProps> = ({ isOpen, onClose, onSearch }) => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // 打开时刷新数据
  useEffect(() => {
    if (isOpen) {
      setFavorites(getFavorites());
      setHistory(getHistory());
    }
  }, [isOpen]);

  // 点击面板外部关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  const handleRemoveFavorite = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    removeFromFavorites(word);
    setFavorites(getFavorites());
  };

  const handleWordClick = (word: string) => {
    onSearch(word);
    onClose();
  };

  if (!isOpen) return null;

  const panel = (
    <div
      ref={panelRef}
      className="fixed top-[70px] right-3 md:right-4 z-[200] w-64 rounded-xl overflow-hidden shadow-2xl"
      style={GLASS_CARD_STYLE}
    >
      {/* Tab 切换 */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'favorites'
              ? 'text-white border-b-2 border-white/50'
              : 'text-white/45 hover:text-white/70'
          }`}
        >
          收藏
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-white border-b-2 border-white/50'
              : 'text-white/45 hover:text-white/70'
          }`}
        >
          最近搜索
        </button>
      </div>

      {/* 内容区 */}
      <div className="max-h-72 overflow-y-auto">
        {activeTab === 'favorites' ? (
          favorites.length === 0 ? (
            <div className="flex items-center justify-center h-24 px-4">
              <p className="text-white/30 text-xs text-center">暂无收藏，点击词汇详情中的 ♡ 添加</p>
            </div>
          ) : (
            <ul>
              {favorites.map(({ word }) => (
                <li
                  key={word}
                  onClick={() => handleWordClick(word)}
                  className="flex items-center justify-between px-4 py-1.5 hover:bg-white/8 cursor-pointer group transition-colors"
                >
                  <span className="text-white/85 text-sm font-medium">{word}</span>
                  <button
                    onClick={(e) => handleRemoveFavorite(e, word)}
                    className="text-white/25 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none"
                    title="取消收藏"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          history.length === 0 ? (
            <div className="flex items-center justify-center h-24">
              <p className="text-white/30 text-xs">暂无搜索记录</p>
            </div>
          ) : (
            <ul>
              {history.map((word) => (
                <li
                  key={word}
                  onClick={() => handleWordClick(word)}
                  className="flex items-center px-4 py-1.5 hover:bg-white/8 cursor-pointer transition-colors"
                >
                  <svg className="w-3 h-3 text-white/25 mr-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white/75 text-sm">{word}</span>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(panel, document.body);
};
