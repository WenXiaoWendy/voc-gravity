import React from 'react';

// 词书配置
const VOCABULARY_BOOKS = [
  { key: 'ielts', name: '雅思词汇真经', description: '权威雅思词汇库' }
];

// 样式常量
const TOP_BAR_CLASSES = 'fixed top-0 left-0 right-0 z-30 bg-black/30 backdrop-blur-xl p-4 border-b border-white/10';
const TOP_BAR_GRID_CLASSES = 'grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4';
const SELECT_CLASSES = 'w-40 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 appearance-none focus:outline-none focus:border-blue-500';
const SELECT_ARROW_CLASSES = 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60';

interface NavBarProps {
  isLoading: boolean;
  selectedItemWord: string | null;
  totalWordsCount: number;
  onSearch: (query: string) => void;
  className?: string;
}

// 顶部状态栏组件
const NavBar: React.FC<NavBarProps> = ({
  isLoading,
  selectedItemWord,
  totalWordsCount,
  onSearch,
  className = ''
}) => {
  // 动态导入SearchBar组件以避免循环依赖
  const SearchBarComponent = React.lazy(async () => {
    const module = await import('./SearchBar');
    return { default: module.SearchBar };
  });

  return (
    <div className={`${className} ${TOP_BAR_CLASSES}`}>
      {/* 关键：全宽 + 1fr auto 1fr，保证搜索框以屏幕中心居中 */}
      <div className={TOP_BAR_GRID_CLASSES}>
        {/* 左 */}
        <div className="justify-self-start flex items-center gap-6 min-w-0">
          <div className="leading-tight">
            <h1 className="text-2xl font-semibold text-white/95">Voc Gravity</h1>
            <p className="text-sm text-white/60">语义邻域探索工具</p>
          </div>

          <div className="relative">
            <select
              className={SELECT_CLASSES}
              defaultValue="ielts"
            >
              {VOCABULARY_BOOKS.map((book) => (
                <option key={book.key} value={book.key}>
                  {book.name}
                </option>
              ))}
            </select>

            <svg
              className={SELECT_ARROW_CLASSES}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* 中：永远屏幕中心 */}
        <div className="justify-self-center w-[min(32rem,calc(100vw-2rem))]">
          <React.Suspense fallback={<div className="w-full h-10 bg-white/10 rounded-lg"></div>}>
            <SearchBarComponent onSearch={onSearch} />
          </React.Suspense>
        </div>

        {/* 右 */}
        <div className="justify-self-end text-sm text-white/60 whitespace-nowrap">
          {isLoading ? "搜索中..." : `当前: ${selectedItemWord || "无"} • 共 ${totalWordsCount} 个词`}
        </div>
      </div>
    </div>
  );
};

export default NavBar;
