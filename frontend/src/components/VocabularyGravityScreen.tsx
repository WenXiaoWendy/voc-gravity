import React, { useCallback, useState } from 'react';
import { mockWords } from '../data/mockWords';
import { BubbleItem } from '../types/bubble';
import { BACKGROUND_COLOR } from '../utils/theme';
import { BottomSheet } from './BottomSheet';
import { BubbleField } from './BubbleField';
import { SearchBar } from './SearchBar';

// 词书配置
const VOCABULARY_BOOKS = [
  { key: 'ielts', name: '雅思词汇真经', description: '权威雅思词汇库' }
];

// 主屏幕组件 - Apple Health / iOS 17 风格
// 莫兰迪低饱和渐变彩质感
// 深色背景 + 毛玻璃效果 + 克制设计

export const VocabularyGravityScreen: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<BubbleItem | null>(mockWords[0]);
  const [currentWords, setCurrentWords] = useState<BubbleItem[]>(mockWords);

  const handleSelectItem = useCallback((item: BubbleItem) => {
    setSelectedItem(item);

    // 模拟中心切换 - 重新组织布局
    const newWords = currentWords.map(word => {
      if (word.id === item.id) {
        return { ...word, layer: 'center' as const, score: 0.95 };
      } else if (word.layer === 'center') {
        return { ...word, layer: 'inner' as const, score: Math.random() * 0.3 + 0.6 };
      }
      return word;
    });

    setCurrentWords(newWords);
  }, [currentWords]);

  const handleSearch = useCallback((query: string) => {
    // 首先检查是否已有该词
    const existingWord = currentWords.find(word =>
      word.word.toLowerCase() === query.toLowerCase()
    );

    if (existingWord) {
      // 如果已有该词，直接将其设为中心
      handleSelectItem(existingWord);
      return;
    }

    // 模拟搜索功能 - 创建完整的新词数据
    const newCenter: BubbleItem = {
      id: Date.now().toString(),
      word: query,
      pos: 'v', // 默认词性
      brief_gloss: `Definition for ${query}`,
      chinese_gloss: `${query}的中文释义`,
      source: 'search',
      layer: 'center',
      score: 0.95,
      relation_type: 'center',
      why: `This word was searched: ${query}`,
      usage_notes: [`Usage note for ${query}`],
      example: `This is an example sentence for ${query}.`
    };

    // 重新组织布局，将当前中心移到内层
    const updatedWords = currentWords.map(word => {
      if (word.layer === 'center') {
        return { ...word, layer: 'inner' as const, score: Math.random() * 0.3 + 0.6 };
      }
      return word;
    });

    setCurrentWords([newCenter, ...updatedWords.filter(w => w.id !== newCenter.id)]);
    setSelectedItem(newCenter);
  }, [currentWords, handleSelectItem]);

  return (
    <div
      className="min-h-screen text-white font-serif"
      style={{ backgroundColor: BACKGROUND_COLOR }}
    >
      {/* 顶部状态栏 - 毛玻璃效果 */}
      <div className="
        fixed top-0 left-0 right-0 z-30
        bg-black/30 backdrop-blur-xl p-4
        border-b border-white/10
      ">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* 左侧：标题 + 词书选择 */}
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-white/95">Voc Gravity</h1>
              <p className="text-sm text-white/60">语义邻域探索工具</p>
            </div>

            {/* 词书选择框 */}
            <div className="relative">
              <select
                className="
                  px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700
                  focus:outline-none focus:border-blue-500 appearance-none
                  w-40
                "
                defaultValue="ielts"
              >
                {VOCABULARY_BOOKS.map(book => (
                  <option key={book.key} value={book.key}>
                    {book.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* 中间：搜索框 */}
          <div className="flex-1 max-w-md mx-8">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* 右侧：状态信息 */}
          <div className="text-sm text-white/60">
            当前: {selectedItem?.word} • 共 {currentWords.length} 个词
          </div>
        </div>
      </div>

      {/* 气泡场 */}
      <div className="pt-20">
        <BubbleField
          items={currentWords}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
        />
      </div>

      {/* 右侧信息抽屉 */}
      <BottomSheet selectedItem={selectedItem} />

      {/* 底部信息栏 - 半透明 */}
      <div className="
        fixed bottom-0 left-0 right-0 z-20
        bg-black/20 backdrop-blur-lg p-3
        text-center text-sm text-white/60
        border-t border-white/5
      ">
        点击气泡探索语义邻域 • 支持近义词、对比词、易混淆词等多种关系类型
      </div>
    </div>
  );
};

export default VocabularyGravityScreen;
