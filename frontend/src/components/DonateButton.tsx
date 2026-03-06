import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const DonateModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl w-72 text-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/30 hover:text-white/70 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <p className="text-white/90 font-medium text-base mb-1">开发者为爱发电自费买token</p>
        <p className="text-white/40 text-sm mb-6">如果这个工具对您有帮助，欢迎请我喝杯咖啡 ☕</p>

        <div className="flex flex-col items-center gap-2">
          <div className="w-44 h-44 rounded-xl overflow-hidden bg-white flex items-center justify-center">
            <img
              src="/qrcode-wechat.png"
              alt="微信收款码"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center text-gray-400 text-xs text-center p-3 flex-col gap-1">
              <span className="text-3xl">📷</span>
              <span>请将微信收款码<br />放入 public/qrcode-wechat.png</span>
            </div>
          </div>
          <span className="text-white/40 text-xs">微信扫码</span>
        </div>
      </div>
    </div>
  );
};

export const DonateButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="请我喝杯咖啡"
        className="px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 bg-gray-800/80 text-gray-400 border-gray-700/50 hover:text-white hover:border-gray-500"
      >
        ☕
      </button>
      {open && createPortal(<DonateModal onClose={() => setOpen(false)} />, document.body)}
    </>
  );
};
