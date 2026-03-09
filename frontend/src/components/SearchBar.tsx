import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GLASS_CARD_STYLE } from '../utils/theme';
import { getHistory } from '../utils/searchHistory';

// 只允许英文字母、空格、连字符、撇号（如 don't、well-known）
const sanitize = (val: string) => val.replace(/[^a-zA-Z\s\-']/g, '');
const isValidWord = (val: string) => /^[a-zA-Z][a-zA-Z\s\-']*$/.test(val.trim());

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  autoFocus?: boolean;
}

// 搜索组件
export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading = false, autoFocus = false }) => {
  const [query, setQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openHistory = () => {
    const h = getHistory();
    setHistory(h);
    if (h.length > 0 && inputRef.current) {
      setDropdownRect(inputRef.current.getBoundingClientRect());
      setShowHistory(true);
    }
  };

  const handleFocus = () => {
    if (!query.trim()) openHistory();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = sanitize(e.target.value);
    setQuery(val);
    if (!val.trim()) {
      openHistory();
    } else {
      setShowHistory(false);
    }
  };

  const doSearch = (word: string) => {
    if (!word.trim() || isLoading) return;
    const trimmed = word.trim();
    if (!isValidWord(trimmed)) return;
    setQuery(trimmed);
    setShowHistory(false);
    onSearch(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const dropdown = showHistory && history.length > 0 && dropdownRect
    ? createPortal(
        <div
          className="rounded-xl shadow-2xl overflow-hidden"
          style={{
            ...GLASS_CARD_STYLE,
            position: 'fixed',
            top: dropdownRect.bottom + 4,
            left: dropdownRect.left,
            width: dropdownRect.width,
            zIndex: 9999,
          }}
        >
          <div className="px-3 py-1.5 text-[11px] text-white/35 border-b border-white/10 tracking-wider uppercase">
            最近搜索
          </div>
          {history.map((word) => (
            <button
              key={word}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); doSearch(word); }}
              className="w-full text-left px-4 py-2 text-white/70 hover:text-white/95 hover:bg-white/8 text-sm transition-colors"
            >
              {word}
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={handleFocus}
            placeholder="搜索词汇..."
            disabled={isLoading}
            autoFocus={autoFocus}
            className="w-full pl-4 pr-[100px] py-2.5 bg-white/5 text-white/90 rounded-lg border border-white/20 focus:outline-none focus:border-[#7FA8B8]/80 placeholder:text-white/40 disabled:opacity-70 transition-colors duration-200"
          />
          {query && !isLoading && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus(); openHistory(); }}
              className="absolute right-[76px] top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors duration-150"
              tabIndex={-1}
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center min-w-[52px]"
            style={{ backgroundColor: '#7FA8B8', color: '#fff' }}
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : '搜索'}
          </button>
        </div>
      </form>
      {dropdown}
    </div>
  );
};
