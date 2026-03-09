import React, { useState } from 'react';
import { useGravityState } from '../hooks/useGravityState';
import { BubbleItem } from '../types/bubble';
import { BACKGROUND_COLOR } from '../utils/theme';
import { BottomSheet } from './BottomSheet';
import BreadcrumbPath from './BreadcrumbPath';
import { BubbleField } from './BubbleField';
import { ConfirmDialog } from './ConfirmDialog';
import { HoverBubbleCard } from './HoverBubbleCard';
import NavBar from './NavBar';
import RelationLegend from './RelationLegend';

// 主屏幕组件 - Apple Health / iOS 17 风格
// 莫兰迪低饱和渐变彩质感

const BOTTOM_BAR_CLASSES = 'fixed bottom-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-lg p-3 text-center text-sm text-white/60 border-t border-white/5';

export const VocabularyGravityScreen: React.FC = () => {
  const [hoverItem, setHoverItem] = useState<BubbleItem | null>(null);

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
    setRecallMode,
    confirmDialog, setConfirmDialog,
    pathStack,
    handleSearch,
    handleSearchFromBar,
    handleConfirmGenerate,
    handleModeChange,
    handleSelectItem,
    calculateFilteredWordsCount,
    recallMode,
  } = useGravityState();

  return (
    <div
      className="min-h-screen text-white font-serif"
      style={{ backgroundColor: BACKGROUND_COLOR }}
    >
      {/* 顶部状态栏 */}
      <NavBar
        onSearch={handleSearchFromBar}
        onModeChange={handleModeChange}
        onRecallModeChange={setRecallMode}
        isLoading={isLoading}
        includeAnalysis={includeAnalysis}
      />

      {/* 错误提示 */}
      {errorMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-lg px-6 py-3 shadow-xl">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white/90 text-sm">{errorMessage}</span>
              <button
                onClick={clearError}
                className="ml-2 text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 面包屑探索路径 */}
      <BreadcrumbPath pathStack={pathStack} onNavigateTo={handleSearch} isLoading={isLoading} />

      {/* 气泡场：覆盖全屏，让 NavBar/面包屑的 backdrop-blur 能模糊到气泡 */}
      <div className="relative">
        <BubbleField
          items={currentWords}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
          selectedRelationTypes={selectedRelationTypes}
          includeAnalysis={showRelationColors}
          isLoading={isLoading}
          loadingItemId={loadingItemId}
          isRelationPending={isRelationPending}
          recallMode={recallMode}
          onHoverItem={setHoverItem}
        />

        {/* Hover 卡片 */}
        <HoverBubbleCard item={hoverItem} includeAnalysis={showRelationColors} />
      </div>

      {/* 右侧面板：关系类型图例 + 词汇详情面板，共享固定容器 */}
      <div
        className="fixed right-3 z-30 w-[432px] flex flex-col gap-2"
        style={{ top: pathStack.length >= 2 ? '128px' : '96px', bottom: '48px' }}
      >
        <div className="flex-shrink-0">
          <RelationLegend
            selectedRelationTypes={selectedRelationTypes}
            filteredWordsCount={calculateFilteredWordsCount()}
            onRelationTypeChange={setSelectedRelationTypes}
            includeAnalysis={showRelationColors}
          />
        </div>
        <div className="flex-1 min-h-0">
          <BottomSheet selectedItem={selectedItem} includeAnalysis={showRelationColors} isStreaming={isStreaming} streamingReason={streamingReason} />
        </div>
      </div>

      {/* 底部信息栏 - 半透明 */}
      <div className={BOTTOM_BAR_CLASSES}>
        {includeAnalysis
          ? '🫧 点击任意气泡，探索词汇间的语义关系与详细分析'
          : '🫧 气泡颜色代表词性 • 点击气泡快速探索相邻语义空间 • 切换到AI模式获取关系分析'
        }
      </div>

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

export default VocabularyGravityScreen;
