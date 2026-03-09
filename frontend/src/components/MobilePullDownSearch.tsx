import React, { useEffect, useRef } from 'react';
import { GLASS_CARD_STYLE } from '../utils/theme';
import { SearchBar } from './SearchBar';

interface MobilePullDownSearchProps {
  isVisible: boolean;
  isLoading?: boolean;
  onSearch: (query: string) => void;
  onClose: () => void;
}

export const MobilePullDownSearch: React.FC<MobilePullDownSearchProps> = ({
  isVisible, isLoading, onSearch, onClose,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);

  // 搜索后自动关闭
  const handleSearch = (query: string) => {
    onSearch(query);
    onClose();
  };

  // ESC 关闭
  useEffect(() => {
    if (!isVisible) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isVisible, onClose]);

  return (
    <>
      {/* 背景遮罩 */}
      {isVisible && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-[35] bg-black/40"
          onClick={onClose}
        />
      )}

      {/* 搜索栏覆盖层 */}
      <div
        className={`fixed left-0 right-0 z-40 transition-all duration-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{ top: '58px' }}
      >
        <div className="px-3 py-2" style={GLASS_CARD_STYLE}>
          <SearchBar onSearch={handleSearch} isLoading={isLoading} autoFocus={isVisible} />
        </div>
      </div>
    </>
  );
};
