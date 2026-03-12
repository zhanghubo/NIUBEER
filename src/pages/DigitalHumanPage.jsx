import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

const ACCEPT_AUDIO = 'audio/*';
const ACCEPT_IMAGES = 'image/*';

/** 视频画质 / 格式 / 编码（数字人单图视频输出） */
const OUTPUT_QUALITIES = [
  { value: 'hd', label: '高清' },
  { value: '2k', label: '2K' },
  { value: '4k', label: '4K' },
];
const OUTPUT_FORMATS = [
  { value: 'mov', label: 'MOV' },
  { value: 'mp4', label: 'MP4' },
];
/** 视频编码格式（H.264 / H.265，与输出格式 MOV/MP4 配合） */
const OUTPUT_CODECS = [
  { value: 'h264', label: 'H.264' },
  { value: 'h265', label: 'H.265' },
];

/** 模式：单图视频生成 | 推流直播 */
const MODE_VIDEO = 'video';
const MODE_LIVE = 'live';

/**
 * 数字人页 - 支持单图视频生成与推流直播
 * 模式一：角色 + 说话内容/音频 → 生成数字人单图视频
 * 模式二：角色 + 推流地址 → 数字人直接推流直播
 */
export function DigitalHumanPage() {
  const [mode, setMode] = useState(MODE_VIDEO);
  const [speakContent, setSpeakContent] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [characterFile, setCharacterFile] = useState(null);
  const [characterPreviewUrl, setCharacterPreviewUrl] = useState('');
  /** 推流直播：推流地址（RTMP URL） */
  const [streamUrl, setStreamUrl] = useState('');
  /** 推流直播：推流密钥（可选，与地址拼接） */
  const [streamKey, setStreamKey] = useState('');
  /** 推流直播：是否正在推流 */
  const [isStreaming, setIsStreaming] = useState(false);
  /** 单图视频：生成中状态 */
  const [videoGenerating, setVideoGenerating] = useState(false);
  /** 单图视频输出：画质、格式、编码 */
  const [outputQuality, setOutputQuality] = useState('2k');
  const [outputFormat, setOutputFormat] = useState('mp4');
  const [outputCodec, setOutputCodec] = useState('h264');
  const [outputQualityOpen, setOutputQualityOpen] = useState(false);
  const [outputFormatOpen, setOutputFormatOpen] = useState(false);
  const [outputCodecOpen, setOutputCodecOpen] = useState(false);
  const audioInputRef = useRef(null);
  const characterInputRef = useRef(null);

  /** 推流中离开页面前提示，防止误关 */
  useEffect(() => {
    if (!isStreaming) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isStreaming]);

  useEffect(() => {
    if (!characterFile) {
      setCharacterPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(characterFile);
    setCharacterPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [characterFile]);

  const handleAudioChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setAudioFile(file);
    e.target.value = '';
  };

  const handleCharacterChange = (e) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) setCharacterFile(file);
    e.target.value = '';
  };

  /** 开始推流：后续可对接真实推流 SDK/API */
  const handleStartStream = () => {
    const url = (streamUrl || '').trim();
    if (!url) return;
    setIsStreaming(true);
    // TODO: 调用推流 API，传入 streamUrl、streamKey、角色/音色/说话内容等
  };

  /** 停止推流 */
  const handleStopStream = () => {
    setIsStreaming(false);
    // TODO: 断开推流
  };

  /**
   * 单图视频生成。请求体会带上 outputQuality(高清|2k|4k)、outputFormat(mov|mp4)、outputCodec(h264|h265)，
   * 只有后端按这些参数生成并返回视频后，选项才真正生效；未配置 API 时仅为占位。
   */
  const handleGenerateVideo = async () => {
    if (videoGenerating) return;
    setVideoGenerating(true);
    const payload = {
      speakContent: speakContent.trim(),
      actionDesc: actionDesc.trim(),
      resolution: outputQuality,
      format: outputFormat,
      codec: outputCodec,
    };
    try {
      const raw = localStorage.getItem('jiangying_api_config');
      const config = raw ? JSON.parse(raw) : null;
      const base = (config?.digitalHuman?.baseUrl || config?.baseUrl || '').toString().replace(/\/$/, '');
      const path = (config?.digitalHuman?.endpoint || '/v1/digital-human').replace(/^\//, '');
      if (base) {
        const res = await fetch(`${base}/${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config?.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          const videoUrl = data.videoUrl ?? data.data?.videoUrl;
          if (videoUrl) {
            // TODO: 将 videoUrl 写入预览区或结果列表
          }
        }
      }
    } catch (_) {}
    setVideoGenerating(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* 标题 */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          开启你的
          <span className="text-cyan-400"> 数字人</span>
          、即刻造梦!
        </h1>
      </div>

      {/* 模式切换：单图视频生成 | 推流直播 */}
      <div className="mb-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setMode(MODE_VIDEO)}
          className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
            mode === MODE_VIDEO
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1]'
          }`}
        >
          单图视频生成
        </button>
        <button
          type="button"
          onClick={() => setMode(MODE_LIVE)}
          className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
            mode === MODE_LIVE
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1]'
          }`}
        >
          推流直播
        </button>
      </div>

      {/* 主卡片：左侧 角色/音色 + 中间 内容区（按模式切换） */}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-col md:flex-row">
          {/* 左侧：角色、音色 */}
          <div className="flex shrink-0 flex-row justify-center gap-4 border-b border-white/[0.08] p-6 md:flex-col md:border-b-0 md:border-r">
            <input
              ref={characterInputRef}
              type="file"
              accept={ACCEPT_IMAGES}
              className="hidden"
              onChange={handleCharacterChange}
            />
            <button
              type="button"
              onClick={() => characterInputRef.current?.click()}
              className="flex h-28 w-28 flex-shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/[0.04] transition hover:border-cyan-400/50 hover:bg-white/[0.06] -rotate-2"
            >
              {characterPreviewUrl ? (
                <img
                  src={characterPreviewUrl}
                  alt="角色"
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <>
                  <span className="text-3xl text-zinc-400">+</span>
                  <span className="mt-1 text-xs text-zinc-500">角色</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="flex h-28 w-28 flex-shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/[0.04] transition hover:border-cyan-400/50 hover:bg-white/[0.06] rotate-1"
            >
              <span className="text-2xl text-zinc-400">〰️</span>
              <span className="mt-1 text-xs text-zinc-500">音色</span>
            </button>
          </div>

          {/* 中间：按模式显示 */}
          <div className="flex-1 p-6">
            {mode === MODE_VIDEO && (
              <>
                <label className="mb-2 block text-sm font-medium text-zinc-300">说话内容</label>
                <Input
                  type="textarea"
                  rows={4}
                  placeholder="请输入你希望角色说出的内容"
                  value={speakContent}
                  onChange={setSpeakContent}
                  className="mb-4 resize-none"
                />
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  动作描述 <span className="text-zinc-500">(可选)</span>
                </label>
                <Input
                  type="textarea"
                  rows={3}
                  placeholder="添加动作描述和镜头语言，如：镜头推进，他摘下眼镜，对着镜头笑着说"
                  value={actionDesc}
                  onChange={setActionDesc}
                  className="resize-none"
                />
              </>
            )}

            {mode === MODE_LIVE && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  配置推流地址后，数字人将直接推流到直播平台（如抖音、快手、OBS 等）。
                </p>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">推流地址 (RTMP)</label>
                  <Input
                    placeholder="rtmp://xxx/live/..."
                    value={streamUrl}
                    onChange={setStreamUrl}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                    推流密钥 <span className="text-zinc-500">(可选)</span>
                  </label>
                  <Input
                    placeholder="部分平台将地址与密钥分开填写"
                    value={streamKey}
                    onChange={setStreamKey}
                    className="font-mono text-sm"
                  />
                </div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">直播时说话内容</label>
                <Input
                  type="textarea"
                  rows={3}
                  placeholder="推流过程中可随时更新，或由 TTS 实时合成"
                  value={speakContent}
                  onChange={setSpeakContent}
                  className="resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏：按模式切换 */}
        <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.08] bg-white/[0.02] px-6 py-4">
          {mode === MODE_VIDEO && (
            <>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-cyan-400 hover:bg-white/[0.1]"
              >
                <span className="text-zinc-500">👄</span>
                数字人
                <span className="text-zinc-500">▾</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.1]"
              >
                <span className="text-zinc-500">◇</span>
                快速模式
              </button>
              <input
                ref={audioInputRef}
                type="file"
                accept={ACCEPT_AUDIO}
                className="hidden"
                onChange={handleAudioChange}
              />
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.1]"
              >
                <span className="text-zinc-500">↑</span>
                上传音频
                {audioFile && <span className="text-xs text-cyan-400">({audioFile.name})</span>}
              </button>
              <div className="h-6 w-px bg-white/10" />
              {/* 输出画质 */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setOutputQualityOpen((v) => !v); setOutputFormatOpen(false); setOutputCodecOpen(false); }}
                  className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.1]"
                >
                  {OUTPUT_QUALITIES.find((q) => q.value === outputQuality)?.label ?? '2K'}
                  <span className={`inline-block transition-transform ${outputQualityOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {outputQualityOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOutputQualityOpen(false)} aria-hidden />
                    <div className="absolute left-0 top-full z-20 mt-1 min-w-[90px] rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-xl">
                      {OUTPUT_QUALITIES.map((q) => (
                        <button key={q.value} type="button" onClick={() => { setOutputQuality(q.value); setOutputQualityOpen(false); }}
                          className={`block w-full px-3 py-2 text-left text-sm ${outputQuality === q.value ? 'text-cyan-400' : 'text-zinc-300 hover:bg-white/[0.06]'}`}
                        >{q.label}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setOutputFormatOpen((v) => !v); setOutputQualityOpen(false); setOutputCodecOpen(false); }}
                  className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.1]"
                >
                  {OUTPUT_FORMATS.find((f) => f.value === outputFormat)?.label ?? 'MP4'}
                  <span className={`inline-block transition-transform ${outputFormatOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {outputFormatOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOutputFormatOpen(false)} aria-hidden />
                    <div className="absolute left-0 top-full z-20 mt-1 min-w-[90px] rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-xl">
                      {OUTPUT_FORMATS.map((f) => (
                        <button key={f.value} type="button" onClick={() => { setOutputFormat(f.value); setOutputFormatOpen(false); }}
                          className={`block w-full px-3 py-2 text-left text-sm ${outputFormat === f.value ? 'text-cyan-400' : 'text-zinc-300 hover:bg-white/[0.06]'}`}
                        >{f.label}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setOutputCodecOpen((v) => !v); setOutputQualityOpen(false); setOutputFormatOpen(false); }}
                  className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.1]"
                  title="视频编码格式"
                >
                  {OUTPUT_CODECS.find((c) => c.value === outputCodec)?.label ?? 'H.264'}
                  <span className={`inline-block transition-transform ${outputCodecOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {outputCodecOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOutputCodecOpen(false)} aria-hidden />
                    <div className="absolute left-0 top-full z-20 mt-1 min-w-[120px] rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-xl">
                      <p className="px-3 py-1.5 text-xs text-zinc-500">编码格式</p>
                      {OUTPUT_CODECS.map((c) => (
                        <button key={c.value} type="button" onClick={() => { setOutputCodec(c.value); setOutputCodecOpen(false); }}
                          className={`block w-full px-3 py-2 text-left text-sm ${outputCodec === c.value ? 'text-cyan-400' : 'text-zinc-300 hover:bg-white/[0.06]'}`}
                        >{c.label}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-zinc-400">◇ 0</span>
                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={videoGenerating}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-white hover:bg-cyan-400 disabled:opacity-60"
                  title="生成"
                >
                  {videoGenerating ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <span className="text-xl">↑</span>
                  )}
                </button>
              </div>
            </>
          )}

          {mode === MODE_LIVE && (
            <>
              <div className="flex items-center gap-2 text-sm">
                {isStreaming ? (
                  <span className="flex items-center gap-1.5 text-red-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                    推流中
                  </span>
                ) : (
                  <span className="text-zinc-500">未推流</span>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {!isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStartStream}
                    disabled={!streamUrl.trim()}
                    className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500"
                  >
                    开始推流
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopStream}
                    className="rounded-full border border-red-400/50 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/20"
                  >
                    停止推流
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* 预览区：单图视频为生成结果，推流直播为实时画面 */}
      <Card className="mt-6 p-4">
        <p className="mb-3 text-sm text-zinc-400">
          {mode === MODE_VIDEO ? '预览' : isStreaming ? '直播推流画面' : '推流后将在此显示实时画面'}
        </p>
        <div className="aspect-[9/16] max-h-[400px] rounded-xl bg-white/[0.04] flex flex-col items-center justify-center gap-2 text-zinc-500 text-sm text-center">
          {mode === MODE_VIDEO && (
            <span>{videoGenerating ? '生成中…' : '数字人生成结果将在此展示'}</span>
          )}
          {mode === MODE_LIVE && isStreaming && (
            <span className="text-cyan-400">推流已连接 · 直播中</span>
          )}
          {mode === MODE_LIVE && !isStreaming && (
            <span>配置推流地址并点击「开始推流」</span>
          )}
        </div>
      </Card>
    </div>
  );
}
