import React, { forwardRef } from 'react';

/**
 * 可替换的输入框组件
 * @param {Object} props
 * @param {string} [props.placeholder] - 占位文案
 * @param {string} [props.value] - 受控值
 * @param {(v: string) => void} [props.onChange] - 变更回调
 * @param {string} [props.className] - 额外类名
 * @param {'text'|'textarea'|'password'|'email'|'number'} [props.type='text'] - 输入类型
 * @param {React.Ref} [ref] - 转发给 textarea / input
 */
export const Input = forwardRef(function Input({
  placeholder = '',
  value,
  onChange,
  className = '',
  type = 'text',
  rows = 3,
  ...rest
}, ref) {
  const base = 'w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-slate-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-white/[0.06] backdrop-blur-xl transition-colors';
  if (type === 'textarea') {
    return (
      <textarea
        ref={ref}
        className={`${base} resize-none ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        rows={rows}
        {...rest}
      />
    );
  }
  return (
    <input
      ref={ref}
      type={type}
      className={`${base} ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      {...rest}
    />
  );
});
