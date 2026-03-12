import React from 'react';

/**
 * 可替换的卡片容器组件
 * @param {Object} props
 * @param {React.ReactNode} props.children - 子内容
 * @param {string} [props.className] - 额外类名
 * @param {boolean} [props.hoverable] - 是否悬停高亮
 * @param {() => void} [props.onClick] - 点击回调（可选，用于可点击卡片）
 */
export function Card({ children, className = '', hoverable = false, onClick, ...rest }) {
  const base = 'glass rounded-2xl border border-white/[0.1] overflow-hidden bg-white/[0.06] backdrop-blur-[24px]';
  const hover = hoverable ? 'glass-hover transition-colors cursor-pointer' : '';
  const cls = `${base} ${hover} ${className}`.trim();
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp type={onClick ? 'button' : undefined} className={cls} onClick={onClick} {...rest}>
      {children}
    </Comp>
  );
}
