import React from 'react';

/**
 * 可替换的按钮组件
 * @param {Object} props
 * @param {'primary'|'secondary'|'ghost'|'outline'} [props.variant='primary'] - 按钮变体
 * @param {'md'|'sm'|'lg'} [props.size='md'] - 尺寸
 * @param {boolean} [props.disabled] - 是否禁用
 * @param {React.ReactNode} props.children - 子内容
 * @param {string} [props.className] - 额外类名
 * @param {React.CSSProperties} [props.style] - 内联样式
 */
export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  className = '',
  style,
  ...rest
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors';
  const variants = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-400 active:bg-emerald-600',
    secondary: 'bg-zinc-700 text-white hover:bg-zinc-600',
    ghost: 'text-slate-300 hover:bg-white/10',
    outline: 'border border-zinc-500 text-slate-300 hover:bg-white/5',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`.trim();
  return (
    <button className={cls} style={style} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
