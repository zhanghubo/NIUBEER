import React from 'react';

/**
 * 可替换的标签页组件
 * @param {Object} props
 * @param {Array<{ key: string, label: string }>} props.tabs - 标签配置
 * @param {string} props.activeKey - 当前激活的 key
 * @param {(key: string) => void} props.onChange - 切换回调
 * @param {string} [props.className] - 容器类名
 */
export function Tab({ tabs, activeKey, onChange, className = '' }) {
  return (
    <div className={`glass flex gap-1 p-1 rounded-xl border border-white/[0.1] ${className}`}>
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeKey === key ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
