import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DynamicBackground } from '../components/ui/DynamicBackground';

/**
 * SaaS 落地页 - 疆影 AI
 * 结构：Hero → 功能亮点 → 如何开始 → 底部 CTA → Footer
 * @returns {JSX.Element}
 */
export function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: '🖼️',
      title: 'AI 图片生成',
      desc: '一句话描述，多图参考、系列组图，多种风格一键出图。',
    },
    {
      icon: '🎬',
      title: 'AI 视频生成',
      desc: '文本或首尾帧驱动，智能多帧、超长镜头，高质量短视频。',
    },
    {
      icon: '👤',
      title: '数字人与动作模仿',
      desc: '大师级数字人、动作模仿，虚拟人物自然灵动。',
    },
  ];

  const steps = [
    { step: '01', title: '注册 / 登录', desc: '一键进入工作台' },
    { step: '02', title: '选择能力', desc: '图片、视频、数字人' },
    { step: '03', title: '一句话创作', desc: '描述想法，即刻生成' },
  ];

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] text-white antialiased">
      <DynamicBackground />
      <div className="relative z-10">
      {/* ========== Header ========== */}
      <header className="glass fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08]">
        <div className="header-bar mx-auto flex max-w-6xl items-center justify-between px-4" style={{ height: 'var(--header-h, 4rem)' }}>
          <button
            type="button"
            onClick={() => scrollTo('hero')}
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <img src="/logo.png" alt="猛兽影" className="header-logo" />
            <span className="header-logo-text text-white hidden sm:inline"> AI</span>
          </button>
          <nav className="hidden items-center gap-8 md:flex">
            <button
              type="button"
              onClick={() => scrollTo('features')}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              功能
            </button>
            <button
              type="button"
              onClick={() => scrollTo('how')}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              如何开始
            </button>
            <button
              type="button"
              onClick={() => scrollTo('cta')}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              免费开始
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              登录
            </Button>
            <Button variant="primary" size="sm" className="btn-glow" onClick={() => navigate('/login')}>
              免费开始
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ========== Hero ========== */}
        <section
          id="hero"
          className="hero-glow relative flex min-h-[90vh] flex-col items-center justify-center px-4 pt-24 pb-20 md:min-h-[85vh] md:pt-28"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
          </div>
          <div className="relative mx-auto max-w-4xl text-center">
            <img src="/logo.png" alt="猛兽影" className="animate-fade-in-up mx-auto mb-6 h-14 w-auto object-contain md:h-16" style={{ animationDelay: '0s' }} />
            <p className="animate-fade-in-up mb-4 text-sm font-medium uppercase tracking-widest text-emerald-400/90">
              一站式 AI 创作平台
            </p>
            <h1 className="animate-fade-in-up mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl" style={{ animationDelay: '0.05s' }}>
              用一句话
              <br />
              <span className="logo-gradient">造出你的梦</span>
            </h1>
            <p className="animate-fade-in-up mx-auto mb-10 max-w-2xl text-lg text-zinc-400 md:text-xl" style={{ animationDelay: '0.1s' }}>
              图片、视频、数字人，一个平台全搞定。零门槛创作，灵感即刻成片。
            </p>
            <div className="animate-fade-in-up flex flex-col items-center gap-4 sm:flex-row sm:justify-center" style={{ animationDelay: '0.15s' }}>
              <Button
                variant="primary"
                size="lg"
                className="btn-glow w-full min-w-[200px] sm:w-auto"
                onClick={() => navigate('/login')}
              >
                免费开始创作
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => scrollTo('features')}
              >
                了解功能
              </Button>
            </div>
          </div>
        </section>

        {/* ========== Features ========== */}
        <section id="features" className="relative border-t border-zinc-800/80 px-4 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
                你需要的创作能力，都在这里
              </h2>
              <p className="mx-auto max-w-2xl text-zinc-400">
                从灵感到成片，图片、视频、数字人，一站完成。
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((item, i) => (
                <div
                  key={item.title}
                  className="card-lift glass glass-hover animate-fade-in-up group rounded-2xl border border-white/[0.08] p-6"
                  style={{ animationDelay: `${0.2 + i * 0.08}s` }}
                >
                  <div className="mb-4 text-3xl">{item.icon}</div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== How it works ========== */}
        <section id="how" className="relative border-t border-zinc-800/80 px-4 py-24 md:py-32">
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
                三步开始创作
              </h2>
              <p className="text-zinc-400">无需专业基础，打开即用。</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((item, i) => (
                <div key={item.step} className="relative text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-lg font-bold text-emerald-400">
                    {item.step}
                  </div>
                  <h3 className="mb-2 font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-zinc-400">{item.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="absolute right-0 top-6 hidden w-full md:block" style={{ width: 'calc(100% + 2rem)' }}>
                      <div className="h-px bg-gradient-to-r from-zinc-700 to-transparent" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== CTA ========== */}
        <section id="cta" className="relative border-t border-zinc-800/80 px-4 py-24 md:py-32">
          <div className="glass hero-glow mx-auto max-w-3xl rounded-3xl border border-white/[0.08] p-8 text-center md:p-12">
            <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
              准备好用 AI 创作了吗？
            </h2>
            <p className="mb-8 text-zinc-400">
              注册即用，无需信用卡。一句话开始你的第一个作品。
            </p>
            <div className="flex flex-col gap-3 sm:mx-auto sm:max-w-md sm:flex-row">
              <Input
                type="email"
                placeholder="输入邮箱（可选）"
                value={email}
                onChange={setEmail}
                className="flex-1"
              />
              <Button
                variant="primary"
                size="lg"
                className="btn-glow shrink-0"
                onClick={() => navigate('/login')}
              >
                免费开始
              </Button>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              点击即跳转登录 / 注册；邮箱仅用于展示，实际以登录页为准。
            </p>
          </div>
        </section>
      </main>

      {/* ========== Footer ========== */}
      <footer className="border-t border-zinc-800/80 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <img src="/logo.png" alt="猛兽影" className="h-8 w-auto object-contain" />
              <span className="text-white"> AI</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-zinc-400">
              <button type="button" onClick={() => scrollTo('features')} className="transition hover:text-white">
                功能
              </button>
              <button type="button" onClick={() => scrollTo('how')} className="transition hover:text-white">
                如何开始
              </button>
              <button type="button" onClick={() => navigate('/login')} className="transition hover:text-white">
                登录
              </button>
            </nav>
          </div>
          <p className="mt-8 text-center text-sm text-zinc-500">
            © {new Date().getFullYear()} 猛兽影 AI · 即刻造梦
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
}
