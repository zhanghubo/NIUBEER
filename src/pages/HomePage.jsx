import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Tab } from '../components/ui/Tab';
import { Input } from '../components/ui/Input';

/**
 * 首页 - 对应疆影官网 ai-tool/home
 * 包含：Agent 模式、灵感、生成等入口
 */
export function HomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');
  const [prompt, setPrompt] = useState('');

  /** 一句话生成短片：跳转到视频生成页并带上输入的描述 */
  const handleGenerateShort = () => {
    navigate('/ai-tool/video', { state: { prompt } });
  };

  const tabs = [
    { key: 'create', label: '创作' },
    { key: 'activity', label: '活动' },
  ];

  const features = [
    {
      title: '大模型·剧本',
      desc: '剧本拆分为剧集与分镜，prompt 传递文生图/文生视频',
      path: '/ai-tool/script',
      icon: '📜',
    },
    {
      title: '图片生成',
      desc: '支持多图参考 · 生成系列组图',
      path: '/ai-tool/image/generate',
      icon: '🖼️',
    },
    {
      title: '视频生成',
      desc: '智能多帧 · 超长镜头轻松生成',
      path: '/ai-tool/video',
      icon: '🎬',
    },
    {
      title: '数字人',
      desc: '大师模式 · 虚拟人物栩栩如生',
      path: '/ai-tool/digital-human',
      icon: '👤',
    },
    {
      title: '动作模仿',
      desc: '响应更灵动 跟随质量高',
      path: '/ai-tool/digital-human',
      tag: '数字人',
      icon: '🎭',
    },
    {
      title: 'API 对接',
      desc: '配置 Base URL、API Key 与各服务端点',
      path: '/ai-tool/api',
      icon: '🔌',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Agent 模式英雄区 - 优化：渐变光晕 + 卡片悬停 */}
      <section className="hero-glow relative -mx-4 rounded-2xl px-4 py-12 md:py-16">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            开启你的 Agent 模式
          </h1>
          <p className="mb-6 text-xl text-zinc-400">梦想无疆 影像成真</p>
          <div className="card-lift glass mx-auto max-w-2xl rounded-2xl border border-white/[0.08] p-4">
            <p className="mb-3 text-sm text-zinc-400">输入几个关键词，将推送给专业大模型进行文生视频</p>
            <Input
              placeholder="描述你想生成的画面或视频..."
              value={prompt}
              onChange={setPrompt}
              className="mb-3"
            />
            <Button
              variant="primary"
              size="lg"
              className="btn-glow w-full"
              onClick={handleGenerateShort}
            >
              Agent 模式自动发现 → 短片
            </Button>
          </div>
        </div>
      </section>

      {/* 创作 / 活动 Tab */}
      <section className="mb-10">
        <Tab tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
      </section>

      {/* 功能卡片网格 - 优化：悬停上浮 + 阴影 */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">创作工具</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => (
            <Link key={item.path + item.title} to={item.path}>
              <Card hoverable className="card-lift glass glass-hover h-full p-6">
                <div className="mb-3 text-2xl">{item.icon}</div>
                <h3 className="mb-1 font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-zinc-400">{item.desc}</p>
                {item.tag && (
                  <span className="mt-2 inline-block text-xs text-emerald-400">{item.tag}</span>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
