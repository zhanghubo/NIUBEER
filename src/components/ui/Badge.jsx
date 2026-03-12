import React from 'react';

/**
 * 可替换的徽标/标签组件
 * @param {Object} props
 * @param {React.ReactNode} props.children - 文案
 * @param {'default'|'primary'|'success'} [props.variant='default'] - 样式变体
 * @param {string} [props.className] - 额外类名
 */
export function Badge({ children, variant = 'default', className = '', onClick, ...rest }) {
  const variants = {
    default: 'bg-zinc-700 text-zinc-300',
    primary: 'bg-emerald-500/20 text-emerald-300',
    success: 'bg-emerald-500/20 text-emerald-300',
  };
  const cls = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`.trim();
  const Comp = onClick ? 'button' : 'span';
  return (
    <Comp type={onClick ? 'button' : undefined} className={cls} onClick={onClick} {...rest}>
      {children}
    </Comp>
  );
}
