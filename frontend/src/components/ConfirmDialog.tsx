interface ConfirmDialogProps {
  word: string;
  originalWord: string;
  pos?: string;
  chineseMeaning: string;
  onConfirm: () => void;
  onCancel: () => void;
  isGenerating?: boolean;
}

import { GLASS_CARD, TEXT_BODY, TEXT_LABEL, TEXT_MUTED, TEXT_SECONDARY } from '../utils/theme';

export function ConfirmDialog({ word, originalWord, pos, chineseMeaning, onConfirm, onCancel, isGenerating = false }: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={isGenerating ? undefined : onCancel}
    >
      <div
        className={`${GLASS_CARD} rounded-2xl shadow-2xl w-80 mx-4 overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* 词汇信息区 */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-xl font-semibold text-white tracking-wide">{word}</span>
            {pos && (
              <span className={`text-xs font-medium ${TEXT_LABEL}`}>
                {pos}
              </span>
            )}
          </div>
          {chineseMeaning && (
            <p className={`${TEXT_BODY} text-sm mt-1.5 leading-relaxed`}>{chineseMeaning}</p>
          )}
          {originalWord !== word && (
            <p className={`${TEXT_MUTED} text-xs mt-2.5 flex items-center gap-1.5`}>
              <span>输入</span>
              <span className={TEXT_LABEL}>「{originalWord}」</span>
              <span>→ 原形</span>
              <span className="text-[#7FA8B8]/90">「{word}」</span>
            </p>
          )}
        </div>

        {/* 说明文字区 */}
        <div className="px-6 py-4 border-b border-white/5">
          <p className={`${TEXT_SECONDARY} text-sm leading-relaxed`}>
            该词不在当前词书中，AI 可为您生成发音、例句、搭配等详细信息。
          </p>
        </div>

        {/* 操作按钮区 */}
        <div className="px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isGenerating}
            className={`px-4 py-1.5 ${TEXT_MUTED} text-sm hover:text-white/70 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isGenerating}
            className="px-4 py-1.5 border border-white/10 text-white/80 text-sm rounded-xl transition-all duration-200 flex items-center gap-2 min-w-[100px] justify-center disabled:cursor-not-allowed"
            style={{ backgroundColor: isGenerating ? 'rgba(127,168,184,0.15)' : 'rgba(127,168,184,0.2)' }}
          >
            {isGenerating ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>AI 生成中…</span>
              </>
            ) : 'AI 详细讲解'}
          </button>
        </div>
      </div>
    </div>
  );
}
