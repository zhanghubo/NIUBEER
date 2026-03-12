import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** 导航项配置，与疆影官网结构一致 */
const NAV_ITEMS = [
  { path: '/ai-tool/home', label: '首页' },
  { path: '/ai-tool/script', label: '大模型·剧本' },
  { path: '/ai-tool/image/generate', label: '文生图' },
  { path: '/ai-tool/video', label: '视频生成' },
  { path: '/ai-tool/digital-human', label: '数字人' },
  { path: '/ai-tool/api', label: 'API 对接' },
];

/**
 * 顶部导航栏（可替换样式）
 * @returns {JSX.Element}
 */
export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  return (
    <header className="glass sticky top-0 z-40 border-b border-white/[0.08]">
      <div className="header-bar mx-auto flex max-w-7xl items-center justify-between px-4" style={{ height: 'var(--header-h, 4rem)' }}>
        <Link to="/ai-tool/home" className="flex items-center gap-2 font-semibold tracking-tight">
          <img src="/logo.png" alt="猛兽影" className="header-logo" />
          <span className="header-logo-text text-white hidden sm:inline"> AI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ path, label }) => {
            const isActive = location.pathname === path || (path !== '/ai-tool/home' && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {user && (
            <span className="text-sm text-zinc-400">欢迎，{user}</span>
          )}
          <Link
            to="/ai-tool/home"
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-400"
          >
            开始创作
          </Link>
          {user && (
            <button
              type="button"
              onClick={() => { logout(); navigate('/'); }}
              className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
            >
              退出
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
