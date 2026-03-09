import React from 'react';
import { DonateModal } from './DonateButton';
import { FavoritesPanel } from './FavoritesPanel';
import { SearchBar } from './SearchBar';
import { NAV_ACTIVE_COLORS } from '../utils/theme';

// ── 词书配置 ────────────────────────────────────────────────────────────────────
const VOCABULARY_BOOKS = [
  { key: 'ielts', name: '雅思词汇真经', shortName: '雅思' }
];

// ── SVG 图标（Heroicons outline，24x24 viewBox，strokeWidth 1.5）─────────────────
const IconEye: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconEyeSlash: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const IconBookmark: React.FC<{ className?: string; filled?: boolean }> = ({ className, filled }) => (
  <svg className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
  </svg>
);

const IconCoffee: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 18h12a3 3 0 003-3v-1h1a3 3 0 000-6h-1V7a1 1 0 00-1-1H4a1 1 0 00-1 1v8a3 3 0 003 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 21h13" />
  </svg>
);

const IconChevronDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

// ── NavIconButton 统一图标按钮 ───────────────────────────────────────────────────
interface NavIconButtonProps {
  icon: React.ReactNode;
  isActive?: boolean;
  activeColor?: string;
  title?: string;
  onClick: () => void;
}

const NavIconButton: React.FC<NavIconButtonProps> = ({ icon, isActive = false, activeColor, title, onClick }) => {
  const activeStyle = isActive && activeColor ? {
    backgroundColor: `${activeColor}15`,
    borderColor: `${activeColor}30`,
    color: activeColor,
  } : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl border transition-all duration-200
        ${isActive
          ? ''
          : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:border-white/30 hover:text-white/90'
        }`}
      style={activeStyle}
    >
      {icon}
    </button>
  );
};

// ── 模式切换 ─────────────────────────────────────────────────────────────────────
const SWITCH_CONTAINER = 'flex items-center gap-0.5 bg-white/5 rounded-full p-0.5 border border-white/15';
const switchButton = (active: boolean, disabled: boolean) =>
  `px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 ${disabled
    ? 'text-white/30 cursor-default'
    : active
      ? 'bg-white/15 text-white'
      : 'text-white/70 hover:text-white/90'
  }`;

// ── 主组件 ───────────────────────────────────────────────────────────────────────
interface NavBarProps {
  onSearch: (query: string) => void;
  onModeChange?: (includeAnalysis: boolean) => void;
  onRecallModeChange?: (recallMode: boolean) => void;
  className?: string;
  isLoading?: boolean;
  hideSearch?: boolean;
}

const NavBar: React.FC<NavBarProps> = ({
  onSearch,
  onModeChange,
  onRecallModeChange,
  className = '',
  isLoading = false,
  hideSearch = false,
}) => {
  const [includeAnalysis, setIncludeAnalysis] = React.useState(false);
  const [recallMode, setRecallMode] = React.useState(false);
  const [showFavorites, setShowFavorites] = React.useState(false);
  const [showDonate, setShowDonate] = React.useState(false);

  const handleRecallModeToggle = () => {
    const newMode = !recallMode;
    setRecallMode(newMode);
    onRecallModeChange?.(newMode);
  };

  const handleModeToggle = () => {
    if (isLoading) return;
    const newMode = !includeAnalysis;
    setIncludeAnalysis(newMode);
    onModeChange?.(newMode);
  };

  // 图标按钮组（桌面端和移动端共享）
  const iconButtons = (
    <>
      <NavIconButton
        icon={recallMode ? <IconEyeSlash className="w-[18px] h-[18px]" /> : <IconEye className="w-[18px] h-[18px]" />}
        isActive={recallMode}
        activeColor={NAV_ACTIVE_COLORS.recall}
        title={recallMode ? '退出回忆模式' : '回忆模式：隐藏中文'}
        onClick={handleRecallModeToggle}
      />
      <NavIconButton
        icon={<IconBookmark className="w-[18px] h-[18px]" filled={showFavorites} />}
        isActive={showFavorites}
        activeColor={NAV_ACTIVE_COLORS.favorites}
        title="收藏与历史"
        onClick={() => setShowFavorites(v => !v)}
      />
      <NavIconButton
        icon={<IconCoffee className="w-[18px] h-[18px]" />}
        isActive={showDonate}
        activeColor={NAV_ACTIVE_COLORS.donate}
        title="请我喝杯咖啡"
        onClick={() => setShowDonate(true)}
      />
    </>
  );

  // 模式切换
  const modeSwitch = (compact = false) => (
    <div className={SWITCH_CONTAINER}>
      <button
        type="button"
        onClick={() => includeAnalysis && handleModeToggle()}
        className={switchButton(!includeAnalysis, isLoading)}
        disabled={isLoading}
      >
        {compact ? '快速' : '快速探索'}
      </button>
      <button
        type="button"
        onClick={() => !includeAnalysis && handleModeToggle()}
        className={switchButton(includeAnalysis, isLoading)}
        disabled={isLoading}
      >
        {compact ? 'AI' : 'AI 深度解析'}
      </button>
    </div>
  );

  return (
    <div className={`${className} fixed top-0 left-0 right-0 z-30`}>
      {/* 玻璃层：独立处理 backdrop-blur + 半透明背景，不影响子元素颜色 */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-xl border-b border-white/10" />

      {/* 内容层：relative z-10 脱离玻璃合成层，颜色不被 bg-black/30 压暗 */}
      <div className="relative z-10">
        {/* ── 桌面端布局 (>=768px) ───────────────────────────────────────────── */}
        <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-3">
          {/* 左 */}
          <div className="justify-self-start flex items-center gap-4 min-w-0">
            <h1 className="text-lg font-semibold text-white/95 whitespace-nowrap">Voc Gravity</h1>
            <div className="relative">
              <select
                className="w-36 px-3 py-1.5 rounded-lg text-white/85 text-sm border border-white/15 appearance-none focus:outline-none focus:border-white/30 transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                defaultValue="ielts"
              >
                {VOCABULARY_BOOKS.map((book) => (
                  <option key={book.key} value={book.key}>{book.name}</option>
                ))}
              </select>
              <IconChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60" />
            </div>
          </div>

          {/* 中：搜索栏居中 */}
          <div className="justify-self-center w-[min(32rem,calc(100vw-2rem))]">
            <SearchBar onSearch={onSearch} isLoading={isLoading} />
          </div>

          {/* 右 */}
          <div className="justify-self-end flex items-center gap-3">
            {modeSwitch(false)}
            <div className="flex items-center gap-2">
              {iconButtons}
            </div>
          </div>
        </div>

        {/* ── 移动端布局 (<768px) ────────────────────────────────────────────── */}
        <div className="md:hidden flex flex-col gap-2 p-3">
          {/* 第一行 */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-base font-semibold text-white/95 whitespace-nowrap shrink-0">Voc Gravity</h1>

            {/* 中：模式切换（紧凑） */}
            {modeSwitch(true)}

            {/* 右：图标按钮组 */}
            <div className="flex items-center gap-1.5 shrink-0">
              {iconButtons}
            </div>
          </div>

          {/* 第二行：搜索栏全宽（移动端可通过 hideSearch 隐藏） */}
          {!hideSearch && <SearchBar onSearch={onSearch} isLoading={isLoading} />}
        </div>
      </div>

      {/* ── 浮层 ──────────────────────────────────────────────────────────── */}
      <FavoritesPanel
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        onSearch={onSearch}
      />
      {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}
    </div>
  );
};

export default NavBar;
