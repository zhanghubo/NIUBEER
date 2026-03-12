import React from 'react';

/**
 * 可替换的弹窗组件
 * @param {Object} props
 * @param {boolean} props.open - 是否打开
 * @param {() => void} [props.onClose] - 关闭回调
 * @param {React.ReactNode} props.children - 内容
 * @param {string} [props.title] - 标题
 */
export function Modal({ open, onClose, children, title = '' }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="glass glass-strong rounded-2xl border border-white/[0.12] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.1]">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {onClose && (
              <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white p-1">
                ×
              </button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
