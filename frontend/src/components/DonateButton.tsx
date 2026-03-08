import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export const DonateModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl w-96 text-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/30 hover:text-white/70 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <p className="text-white/80 text-sm mb-4 leading-relaxed">
          如果这个工具对你有帮助，欢迎请我喝杯咖啡 ☕
        </p>

        <div className="flex flex-col items-center gap-2 mb-5">
          <div className="w-44 h-44 rounded-xl overflow-hidden bg-white flex items-center justify-center">
            <img
              src="/qrcode-wechat.jpg"
              alt="微信收款码"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center text-gray-400 text-xs text-center p-3 flex-col gap-1">
              <span className="text-3xl">📷</span>
              <span>请将微信收款码<br />放入 public/qrcode-wechat.jpg</span>
            </div>
          </div>
          <span className="text-white/40 text-xs">微信扫码</span>
        </div>

        {/* 开源信息 */}
        <div className="border-t border-white/8 pt-4 text-left space-y-2">
          <p className="text-white/50 text-xs leading-relaxed">
            项目已开源，内置批量词汇生成脚本与 token 计费统计，接入自己的 API Key 即可用于任意语言的语义探索。
          </p>
          <a
            href="https://github.com/WenXiaoWendy/voc-gravity"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            WenXiaoWendy/voc-gravity
            <span className="text-white/25">· 欢迎 Fork & Star ⭐</span>
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
};
