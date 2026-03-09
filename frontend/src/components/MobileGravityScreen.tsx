import React, { useRef, useState } from 'react';
import { useGravityState } from '../hooks/useGravityState';
import { BACKGROUND_COLOR } from '../utils/theme';
import BreadcrumbPath from './BreadcrumbPath';
import { ConfirmDialog } from './ConfirmDialog';
import { MobileBubbleField } from './MobileBubbleField';
import { MobileDetailPanel } from './MobileDetailPanel';
import { MobileHandleBar } from './MobileHandleBar';
import { MobilePullDownSearch } from './MobilePullDownSearch';
import { MobileRelationToggle } from './MobileRelationToggle';
import NavBar from './NavBar';

const MobileGravityScreen: React.FC = () => {
  const {
    selectedItem,
    currentWords,
    isLoading,
    includeAnalysis,
    selectedRelationTypes, setSelectedRelationTypes,
    loadingItemId,
    showRelationColors,
    errorMessage, clearError,
    isStreaming, streamingReason,
    isRelationPending,
    recallMode, setRecallMode,
    confirmDialog, setConfirmDialog,
    pathStack,
    handleSearch,
    handleSearchFromBar,
    handleConfirmGenerate,
    handleModeChange,
    setSelectedItem,
  } = useGravityState();

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const pullDownRef = useRef<{ startY: number; startTime: number } | null>(null);

  // 移动端点击气泡：仅选中，不触发搜索
  const handleBubbleTap = React.useCallback((item: typeof selectedItem) => {
    if (item) setSelectedItem(item);
  }, [setSelectedItem]);

  // 探索此词：触发搜索 + 关闭面板
  const handleExplore = React.useCallback((word: string) => {
    handleSearch(word, includeAnalysis);
  }, [handleSearch, includeAnalysis]);

  // 下拉手势检测：起点 y < 150 且 deltaY > 60 时展示搜索
  const onTouchStart = (e: React.TouchEvent) => {
    const y = e.touches[0].clientY;
    if (y < 150) {
      pullDownRef.current = { startY: y, startTime: Date.now() };
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!pullDownRef.current) return;
    const deltaY = e.changedTouches[0].clientY - pullDownRef.current.startY;
    if (deltaY > 60) setIsSearchVisible(true);
    pullDownRef.current = null;
  };

  return (
    <div
      className="min-h-screen text-white font-serif"
      style={{ backgroundColor: BACKGROUND_COLOR }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* NavBar：隐藏搜索栏 */}
      <NavBar
        onSearch={handleSearchFromBar}
        onModeChange={handleModeChange}
        onRecallModeChange={setRecallMode}
        isLoading={isLoading}
        hideSearch
      />

      {/* 错误提示 */}
      {errorMessage && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 w-full max-w-sm">
          <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-lg px-4 py-2.5 shadow-xl">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white/90 text-xs flex-1">{errorMessage}</span>
              <button onClick={clearError} className="text-white/60 active:text-white">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 下拉搜索 */}
      <MobilePullDownSearch
        isVisible={isSearchVisible}
        isLoading={isLoading}
        onSearch={handleSearchFromBar}
        onClose={() => setIsSearchVisible(false)}
      />

      {/* 面包屑：紧凑模式 */}
      <BreadcrumbPath pathStack={pathStack} onNavigateTo={handleSearch} isLoading={isLoading} compact />

      {/* 气泡场 */}
      <MobileBubbleField
        items={currentWords}
        selectedItem={selectedItem}
        onSelectItem={handleBubbleTap}
        selectedRelationTypes={selectedRelationTypes}
        includeAnalysis={showRelationColors}
        isLoading={isLoading}
        loadingItemId={loadingItemId}
        isRelationPending={isRelationPending}
        recallMode={recallMode}
      />

      {/* AI 关系筛选浮动按钮 */}
      <MobileRelationToggle
        selectedRelationTypes={selectedRelationTypes}
        filteredWordsCount={currentWords.filter(item => {
          if (selectedRelationTypes.length === 0) return true;
          if (item.layer === 'center') return true;
          if (Array.isArray(item.relation_type)) return item.relation_type.some(r => selectedRelationTypes.includes(r));
          return item.relation_type ? selectedRelationTypes.includes(item.relation_type) : false;
        }).length}
        onRelationTypeChange={setSelectedRelationTypes}
        includeAnalysis={showRelationColors}
      />

      {/* 底部 Handle Bar */}
      <MobileHandleBar
        selectedItem={selectedItem}
        isLoading={isLoading}
        onPullUp={() => setIsDetailOpen(true)}
        onExplore={handleExplore}
      />

      {/* 全屏详情面板 */}
      <MobileDetailPanel
        isOpen={isDetailOpen}
        selectedItem={selectedItem}
        includeAnalysis={showRelationColors}
        isStreaming={isStreaming}
        streamingReason={streamingReason}
        isLoading={isLoading}
        onClose={() => setIsDetailOpen(false)}
        onExplore={handleExplore}
      />

      {/* AI 生成确认弹窗 */}
      <ConfirmDialog
        isOpen={!!confirmDialog}
        word={confirmDialog?.lemma ?? ''}
        originalWord={confirmDialog?.originalWord ?? ''}
        pos={confirmDialog?.pos}
        chineseMeaning={confirmDialog?.chineseMeaning ?? ''}
        isGenerating={confirmDialog?.isGenerating}
        onConfirm={handleConfirmGenerate}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
};

export default MobileGravityScreen;
