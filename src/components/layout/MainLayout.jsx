import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { DynamicBackground } from '../ui/DynamicBackground';

/**
 * 主布局：动态背景 + 顶栏 + 子路由出口
 * @returns {JSX.Element}
 */
export function MainLayout() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#0a0a0f] text-white">
      <DynamicBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="min-h-[calc(100vh-3.5rem)] flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
