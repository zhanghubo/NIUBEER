import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AuthGuard } from './components/auth/AuthGuard';

/** @type {() => JSX.Element} 路由级懒加载，每个页面独立打包，按需下载 */
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ImageGeneratePage = lazy(() => import('./pages/ImageGeneratePage').then(m => ({ default: m.ImageGeneratePage })));
const VideoGeneratePage = lazy(() => import('./pages/VideoGeneratePage').then(m => ({ default: m.VideoGeneratePage })));
const DigitalHumanPage = lazy(() => import('./pages/DigitalHumanPage').then(m => ({ default: m.DigitalHumanPage })));
const ScriptLLMPage = lazy(() => import('./pages/ScriptLLMPage').then(m => ({ default: m.ScriptLLMPage })));
const ApiPage = lazy(() => import('./pages/ApiPage').then(m => ({ default: m.ApiPage })));
const DeveloperLandingPage = lazy(() => import('./pages/DeveloperLandingPage').then(m => ({ default: m.DeveloperLandingPage })));

/**
 * 页面加载过渡动画
 * @returns {JSX.Element}
 */
function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <span className="text-sm text-zinc-500">加载中…</span>
      </div>
    </div>
  );
}

/**
 * 应用根组件，配置全局路由（懒加载 + Suspense）
 * 启动页 / -> 登录页 /login -> 需登录的首页及功能页
 * @returns {JSX.Element}
 */
function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dev" element={<DeveloperLandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/ai-tool/home" replace />} />
            <Route path="ai-tool/home" element={<HomePage />} />
            <Route path="ai-tool/script" element={<ScriptLLMPage />} />
            <Route path="ai-tool/image/generate" element={<ImageGeneratePage />} />
            <Route path="ai-tool/video" element={<VideoGeneratePage />} />
            <Route path="ai-tool/digital-human" element={<DigitalHumanPage />} />
            <Route path="ai-tool/api" element={<ApiPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
