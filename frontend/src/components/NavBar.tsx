import React from 'react';
import { SearchBar } from './SearchBar';

// 词书配置
const VOCABULARY_BOOKS = [
  { key: 'ielts', name: '雅思词汇真经', description: '权威雅思词汇库' }
];

// 样式常量
const TOP_BAR_CLASSES = 'fixed top-0 left-0 right-0 z-30 bg-black/30 backdrop-blur-xl p-4 border-b border-white/10';
const TOP_BAR_GRID_CLASSES = 'grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4';
const SELECT_CLASSES = 'w-40 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 appearance-none focus:outline-none focus:border-blue-500';
const SELECT_ARROW_CLASSES = 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60';
const AVATAR_CLASSES = 'w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold';
const SWITCH_CONTAINER_CLASSES = 'flex items-center gap-2 bg-gray-800/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-700/50';
const SWITCH_BUTTON_CLASSES = (active: boolean, disabled: boolean) =>
  `px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 ${disabled
    ? 'text-gray-500 cursor-default'
    : active
      ? 'bg-blue-500 text-white shadow-md'
      : 'text-gray-300 hover:text-white'
  }`;

interface NavBarProps {
  onSearch: (query: string) => void;
  onModeChange?: (includeAnalysis: boolean) => void;
  className?: string;
  isLoading?: boolean;
}

// 顶部状态栏组件
const NavBar: React.FC<NavBarProps> = ({
  onSearch,
  onModeChange,
  className = '',
  isLoading = false
}) => {
  const [includeAnalysis, setIncludeAnalysis] = React.useState(false);

  const handleModeToggle = () => {
    // 加载中不允许切换模式
    if (isLoading) return;

    const newMode = !includeAnalysis;
    setIncludeAnalysis(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

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
          <SearchBar onSearch={onSearch} />
        </div>

        {/* 右：用户头像和模式切换 */}
        <div className="justify-self-end flex items-center gap-4">
          {/* 模式切换开关 */}
          <div className={SWITCH_CONTAINER_CLASSES}>
            <button
              type="button"
              onClick={() => includeAnalysis && handleModeToggle()}
              className={SWITCH_BUTTON_CLASSES(!includeAnalysis, isLoading)}
              disabled={isLoading}
            >
              快速探索
            </button>
            <button
              type="button"
              onClick={() => !includeAnalysis && handleModeToggle()}
              className={SWITCH_BUTTON_CLASSES(includeAnalysis, isLoading)}
              disabled={isLoading}
            >
              AI 深度解析
            </button>
          </div>

          {/* 用户头像占位符 */}
          <div className={AVATAR_CLASSES}>
            <span className="text-sm">U</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
