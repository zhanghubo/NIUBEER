import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

/** 批量分镜切换后提示显示时长（毫秒） */
const BATCH_SWITCH_HINT_DURATION = 4000;

const SCRIPT_BATCH_STORAGE_KEY = 'script_batch_prompts';

const ACCEPT_IMAGES = 'image/*';

/** 比例选项 */
const RATIOS = [
  { value: '21:9', label: '21:9' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
];

/** 画质选项 */
const QUALITIES = [
  { value: '2k', label: '高清 2K' },
  { value: '4k', label: '超清 4K' },
  { value: '1k', label: '标准 1K' },
];

/** 摄影机/机型（融入提示词） */
const CAMERA_OPTIONS = [
  { value: '', label: '不指定' },
  { value: 'Studio Digital S35', label: 'Studio Digital S35' },
  { value: 'Full Frame', label: '全画幅' },
  { value: 'APS-C', label: 'APS-C' },
  { value: 'Super 35', label: 'Super 35' },
  { value: 'Large Format', label: '大画幅' },
];

/** 镜头类型 */
const LENS_OPTIONS = [
  { value: '', label: '不指定' },
  { value: 'Warm Cinema Prime', label: 'Warm Cinema Prime' },
  { value: 'Cinema Prime', label: 'Cinema Prime' },
  { value: 'Anamorphic', label: '变形宽银幕' },
  { value: 'Standard Prime', label: '标准定焦' },
  { value: 'Telephoto', label: '长焦' },
  { value: 'Wide Angle', label: '广角' },
];

/** 焦距 */
const FOCAL_LENGTHS = [
  { value: '', label: '不指定' },
  { value: '24', label: '24 mm' },
  { value: '35', label: '35 mm' },
  { value: '50', label: '50 mm' },
  { value: '85', label: '85 mm' },
  { value: '135', label: '135 mm' },
];

/** 光圈 */
const APERTURES = [
  { value: '', label: '不指定' },
  { value: 'f/2', label: 'f/2' },
  { value: 'f/2.8', label: 'f/2.8' },
  { value: 'f/4', label: 'f/4' },
  { value: 'f/5.6', label: 'f/5.6' },
  { value: 'f/8', label: 'f/8' },
];

/**
 * 推荐预设：一键应用电影级相机/镜头组合（参考 Cinema Studio 风格）
 */
const CAMERA_PRESETS = [
  {
    id: 'cinema-s35',
    label: '电影感 S35',
    camera: 'Studio Digital S35',
    lens: 'Warm Cinema Prime',
    focal: '35',
    aperture: 'f/4',
  },
  {
    id: 'cinema-prime',
    label: '暖调定焦',
    camera: 'Super 35',
    lens: 'Warm Cinema Prime',
    focal: '50',
    aperture: 'f/2.8',
  },
  {
    id: 'anamorphic',
    label: '变形宽银幕',
    camera: 'Full Frame',
    lens: 'Anamorphic',
    focal: '35',
    aperture: 'f/4',
  },
  {
    id: 'portrait',
    label: '人像特写',
    camera: 'Full Frame',
    lens: 'Standard Prime',
    focal: '85',
    aperture: 'f/2',
  },
];

/**
 * 文生图页 - Cinema Studio 风格：大输入框 + 参考图 + 摄影参数 + 底部栏
 */
export function ImageGeneratePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const initialPrompt = typeof state.prompt === 'string' ? state.prompt : '';
  const [prompt, setPrompt] = useState(initialPrompt);
  const [ratio, setRatio] = useState('21:9');
  const [quality, setQuality] = useState('2k');
  const [qualityOpen, setQualityOpen] = useState(false);
  const [qualityMenuPosition, setQualityMenuPosition] = useState({ top: 0, left: 0 });
  const qualityTriggerRef = useRef(null);
  /** 摄影参数：融入提示词 */
  const [cameraModel, setCameraModel] = useState('');
  const [lensType, setLensType] = useState('');
  const [focalLength, setFocalLength] = useState('35');
  const [aperture, setAperture] = useState('f/4');
  const [cameraPanelOpen, setCameraPanelOpen] = useState(false);
  const cameraTriggerRef = useRef(null);
  const [cameraPanelPosition, setCameraPanelPosition] = useState({ top: 0, left: 0 });
  const [refImages, setRefImages] = useState([]);
  const fileInputRef = useRef(null);
  /** 文案输入框 ref，用于 T 按钮插入 "" 后定位光标 */
  const promptInputRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewPrompt, setPreviewPrompt] = useState('');
  /** 在文案输入栏光标处插入 ""，光标置于中间，"" 内为要在画面中显示的文字输出内容 */
  const insertTextOutputMarker = () => {
    const el = promptInputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? prompt.length;
    const end = el.selectionEnd ?? prompt.length;
    const before = prompt.slice(0, start);
    const after = prompt.slice(end);
    const pair = '""';
    const nextPrompt = before + pair + after;
    setPrompt(nextPrompt);
    setTimeout(() => {
      promptInputRef.current?.focus();
      const pos = start + 1;
      promptInputRef.current?.setSelectionRange(pos, pos);
    }, 0);
  };
  /** 剧本批量分镜：当前镜号（0-based）、总镜数、列表 */
  const batchFromScript = state.batchFromScript === true;
  const [batchIndex, setBatchIndex] = useState(state.batchIndex ?? 0);
  const batchTotal = state.batchTotal ?? 0;
  /** 点击「下一镜」后显示的简短提示，若干秒后自动消失 */
  const [batchSwitchHint, setBatchSwitchHint] = useState('');
  const batchList = useMemo(() => {
    if (!batchFromScript || batchTotal <= 0) return [];
    try {
      return JSON.parse(sessionStorage.getItem(SCRIPT_BATCH_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }, [batchFromScript, batchTotal]);

  useEffect(() => {
    if (batchList.length > 0 && batchIndex >= 0 && batchIndex < batchList.length) {
      setPrompt(batchList[batchIndex].prompt ?? '');
    }
  }, [batchIndex, batchList]);

  /** 画质下拉打开时按按钮位置计算浮层坐标，用于 Portal 定位 */
  const openQualityMenu = () => {
    setQualityOpen(true);
    if (qualityTriggerRef.current) {
      const rect = qualityTriggerRef.current.getBoundingClientRect();
      setQualityMenuPosition({ top: rect.bottom + 4, left: rect.left });
    }
  };

  /** 摄影参数拼接为一句，用于拼入提示词（生成时与用户文案一起发给模型） */
  const getCameraPromptSuffix = () => {
    const parts = [];
    if (cameraModel) parts.push(cameraModel);
    if (lensType) parts.push(lensType);
    if (focalLength) parts.push(`${focalLength}mm`);
    if (aperture) parts.push(aperture);
    return parts.length ? parts.join(', ') : '';
  };

  /**
   * 生成时使用的完整提示词：用户输入 + AI 能理解的视觉设置
   * 比例、摄影参数写入提示词；画质（分辨率）通过 payload 结构化字段传给后端
   */
  const getFullPrompt = () => {
    const user = (prompt || '').trim();
    const parts = [];
    parts.push(`比例 ${RATIOS.find((r) => r.value === ratio)?.label || ratio}`);
    const cameraStr = getCameraPromptSuffix();
    if (cameraStr) parts.push(`摄影 ${cameraStr}`);
    const suffix = `[设置] ${parts.join(' | ')}`;
    return user ? `${user}\n${suffix}` : suffix;
  };

  const openCameraPanel = () => {
    setCameraPanelOpen(true);
    if (cameraTriggerRef.current) {
      const rect = cameraTriggerRef.current.getBoundingClientRect();
      setCameraPanelPosition({ top: rect.bottom + 4, left: rect.left });
    }
  };

  /** 一键应用推荐预设 */
  const applyCameraPreset = (preset) => {
    setCameraModel(preset.camera);
    setLensType(preset.lens);
    setFocalLength(preset.focal);
    setAperture(preset.aperture);
  };

  const addRefImages = (e) => {
    const list = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    const newEntries = list.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setRefImages((prev) => [...prev, ...newEntries]);
    e.target.value = '';
  };

  const removeRefImage = (index) => {
    setRefImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const removed = prev[index];
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* 剧本批量分镜：当前镜 x/y、上一镜 / 下一镜 */}
      {batchFromScript && batchTotal > 0 && batchList.length > 0 && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-emerald-500/20 p-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-zinc-300">
              分镜 <span className="font-semibold text-emerald-400">{batchIndex + 1}</span> / {batchTotal}
              {batchList[batchIndex]?.剧集 && (
                <span className="ml-2 text-zinc-500">· {batchList[batchIndex].剧集}</span>
              )}
            </span>
            <span className="text-xs text-zinc-500">生成本镜后点击「下一镜」继续下一镜</span>
            {batchSwitchHint && (
              <span className="text-xs text-emerald-400/90">{batchSwitchHint}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBatchIndex((i) => Math.max(0, i - 1))}
              disabled={batchIndex <= 0}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm text-zinc-300 disabled:opacity-40 hover:bg-white/15 hover:text-white"
            >
              上一镜
            </button>
            <button
              type="button"
              onClick={() => {
                if (batchIndex >= batchList.length - 1) return;
                const next = batchIndex + 1;
                setBatchIndex(next);
                setBatchSwitchHint(`已切换到第 ${next + 1} 镜，请编辑描述并生成`);
                setTimeout(() => setBatchSwitchHint(''), BATCH_SWITCH_HINT_DURATION);
              }}
              disabled={batchIndex >= batchList.length - 1}
              className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300 disabled:opacity-40 hover:bg-emerald-500/30"
            >
              下一镜
            </button>
            <button
              type="button"
              onClick={() => navigate('/ai-tool/script')}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm text-zinc-400 hover:bg-white/10"
            >
              返回剧本
            </button>
          </div>
        </Card>
      )}

      {/* 标题 + Cinema Studio 风格 tagline */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          想象无疆 影像成真{' '}
          <span className="text-emerald-400">疆影AI</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          专业级画面，在浏览器中完成
        </p>
      </div>

      {/* 主输入区：大圆角框 + 文案 + 参考图 + 底部操作栏（overflow-visible 避免画质等下拉被裁切） */}
      <Card className="p-0" style={{ overflow: 'visible' }}>
        <div className="relative p-4 pb-0">
          {/* 参考图入口：左上角虚线框 + */}
          <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/[0.04] text-2xl text-zinc-400 transition hover:border-emerald-400/50 hover:bg-white/[0.06] hover:text-emerald-400"
              title="添加参考图"
            >
              +
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_IMAGES}
              multiple
              className="hidden"
              onChange={addRefImages}
            />
            {refImages.map((item, i) => (
              <div key={i} className="relative">
                <img
                  src={item.url}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => removeRefImage(i)}
                  className="absolute -right-1 -top-1 rounded-full bg-red-500/90 px-1.5 py-0.5 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <Input
            ref={promptInputRef}
            type="textarea"
            rows={5}
            placeholder="描述场景、镜头或画面… 可搭配下方摄影参数获得电影感"
            value={prompt}
            onChange={setPrompt}
            className="min-h-[120px] resize-none border-0 bg-transparent pl-0 pt-14 focus:ring-0"
          />
          {getCameraPromptSuffix() && (
            <p className="mt-2 flex items-center gap-2 px-1 text-xs text-emerald-400/90">
              <span className="text-zinc-500">摄影参数将融入提示词：</span>
              {getCameraPromptSuffix()}
            </p>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="relative flex flex-wrap items-center gap-2 border-t border-white/[0.08] bg-white/[0.02] px-4 py-3 overflow-visible">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.1]"
          >
            <span className="text-zinc-500">🖼</span>
            图片生成
            <span className="text-zinc-500">▾</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.1]"
          >
            <span className="text-zinc-500">◇</span>
            图片5.0 Lite
            <span className="text-zinc-500">▾</span>
          </button>
          <div className="flex items-center gap-1">
            {RATIOS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRatio(r.value)}
                title={r.value === '21:9' ? '电影宽银幕' : undefined}
                className={`rounded px-2.5 py-1.5 text-sm ${
                  ratio === r.value ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-400 hover:bg-white/[0.08]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="relative" ref={cameraTriggerRef}>
            <button
              type="button"
              onClick={() => (cameraPanelOpen ? setCameraPanelOpen(false) : openCameraPanel())}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                cameraPanelOpen ? 'bg-white/[0.1] text-white' : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]'
              }`}
              title="摄影机/镜头参数，将融入提示词"
            >
              <span className="text-zinc-500">📷</span>
              {getCameraPromptSuffix() ? (
                <span className="max-w-[120px] truncate text-emerald-400/90">{getCameraPromptSuffix()}</span>
              ) : (
                '摄影'
              )}
              <span className={`inline-block transition-transform ${cameraPanelOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {cameraPanelOpen &&
              createPortal(
                <>
                  <div className="fixed inset-0 z-[200]" aria-hidden onClick={() => setCameraPanelOpen(false)} />
                  <div
                    className="fixed z-[201] w-[320px] rounded-xl border border-white/10 bg-black/70 p-3 shadow-xl backdrop-blur-xl"
                    style={{ top: cameraPanelPosition.top, left: cameraPanelPosition.left }}
                  >
                  <p className="mb-2 text-xs font-medium text-white">摄影参数（融入提示词）</p>
                  <p className="mb-2 text-[11px] text-zinc-400">推荐 · 一键应用电影级组合</p>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {CAMERA_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyCameraPreset(preset)}
                        className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-white hover:border-emerald-500/40 hover:bg-emerald-500/20 hover:text-emerald-200"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/10 pt-3 grid grid-cols-2 gap-2">
                    {/* 1. 机器 CAMERA - 全球顶尖电影机示意 */}
                    <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">Camera</p>
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="text-[11px] text-zinc-500">机器</span>
                        <svg className="h-5 w-8 shrink-0 text-white/80" viewBox="0 0 32 20" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden title="电影级摄影机">
                          {/* 机身 */}
                          <path d="M6 4h14v12H6z" />
                          <path d="M8 4V2h12v2" />
                          {/* 前镜筒（电影机镜头） */}
                          <path d="M20 9h6v2h-6z" />
                          <circle cx="23" cy="10" r="1.5" />
                          {/* 取景器/顶把手 */}
                          <path d="M12 2h8v2h-2v1h-4V4h-2z" />
                        </svg>
                      </div>
                      <select
                        value={cameraModel}
                        onChange={(e) => setCameraModel(e.target.value)}
                        className="w-full rounded border border-white/20 bg-black/50 px-1.5 py-1 text-xs text-white focus:border-white/40 focus:outline-none"
                      >
                        {CAMERA_OPTIONS.map((o) => (
                          <option key={o.value || 'none'} value={o.value} className="bg-zinc-900 text-white">{o.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* 2. 镜头 LENS */}
                    <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">Lens</p>
                      <p className="mb-1 text-[11px] text-zinc-500">镜头</p>
                      <select
                        value={lensType}
                        onChange={(e) => setLensType(e.target.value)}
                        className="w-full rounded border border-white/20 bg-black/50 px-1.5 py-1 text-xs text-white focus:border-white/40 focus:outline-none"
                      >
                        {LENS_OPTIONS.map((o) => (
                          <option key={o.value || 'none'} value={o.value} className="bg-zinc-900 text-white">{o.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* 3. 焦距 FOCAL LENGTH */}
                    <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">Focal Length</p>
                      <p className="mb-1 text-[11px] text-zinc-500">焦距</p>
                      <select
                        value={focalLength}
                        onChange={(e) => setFocalLength(e.target.value)}
                        className="w-full rounded border border-white/20 bg-black/50 px-1.5 py-1 text-xs text-white focus:border-white/40 focus:outline-none"
                      >
                        {FOCAL_LENGTHS.map((o) => (
                          <option key={o.value || 'none'} value={o.value} className="bg-zinc-900 text-white">{o.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* 4. 光孔 APERTURE */}
                    <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">Aperture</p>
                      <p className="mb-1 text-[11px] text-zinc-500">光孔</p>
                      <select
                        value={aperture}
                        onChange={(e) => setAperture(e.target.value)}
                        className="w-full rounded border border-white/20 bg-black/50 px-1.5 py-1 text-xs text-white focus:border-white/40 focus:outline-none"
                      >
                        {APERTURES.map((o) => (
                          <option key={o.value || 'none'} value={o.value} className="bg-zinc-900 text-white">{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                </>,
                document.body
              )}
          </div>
          <div className="relative" ref={qualityTriggerRef}>
            <button
              type="button"
              onClick={() => (qualityOpen ? setQualityOpen(false) : openQualityMenu())}
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.1]"
            >
              {QUALITIES.find((q) => q.value === quality)?.label || '高清 2K'}
              <span className="text-zinc-500">▾</span>
            </button>
            {qualityOpen &&
              createPortal(
                <>
                  <div className="fixed inset-0 z-[200]" aria-hidden onClick={() => setQualityOpen(false)} />
                  <div
                    className="fixed z-[201] min-w-[10rem] rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-xl"
                    style={{ top: qualityMenuPosition.top, left: qualityMenuPosition.left }}
                  >
                    {QUALITIES.map((q) => (
                      <button
                        key={q.value}
                        type="button"
                        onClick={() => {
                          setQuality(q.value);
                          setQualityOpen(false);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm ${quality === q.value ? 'text-emerald-400' : 'text-zinc-300 hover:bg-white/[0.06]'}`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </>,
                document.body
              )}
          </div>
          <button
            type="button"
            onClick={insertTextOutputMarker}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1]"
            title={'插入文字输出标记 ""，引号内为要在画面中显示的文字'}
          >
            <span className="text-lg font-serif font-bold">T</span>
          </button>
          <div className="ml-auto" />
          <button
            type="button"
            className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-400"
            title="生成"
            onClick={async () => {
              const fullPrompt = getFullPrompt();
              setPreviewPrompt(fullPrompt);
              setGenerating(true);
              try {
                const raw = localStorage.getItem('jiangying_api_config');
                const cfg = raw ? JSON.parse(raw) : null;
                const base = (cfg?.image?.baseUrl || cfg?.baseUrl || '').toString().replace(/\/$/, '');
                const path = (cfg?.image?.endpoint || '/v1/image/generate').replace(/^\//, '');
                if (base) {
                  const res = await fetch(`${base}/${path}`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(cfg?.apiKey && { Authorization: `Bearer ${cfg.apiKey}` }),
                    },
                    body: JSON.stringify({
                      prompt: fullPrompt,
                      ratio,
                      quality,
                      camera: getCameraPromptSuffix() || undefined,
                    }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setPreviewUrl(data.imageUrl ?? data.data?.imageUrl ?? data.url ?? null);
                  }
                }
              } catch (_) {
                /* 未配置或失败时使用占位 */
              } finally {
                setGenerating(false);
              }
            }}
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                生成中…
              </span>
            ) : '生成'}
          </button>
        </div>
      </Card>

      {/* 预览区：显示实际发送给 AI 的完整提示词 */}
      <Card className="mt-6 p-4">
        <p className="mb-3 text-sm text-zinc-400">生成预览</p>
        {previewPrompt && (
          <div className="mb-3 rounded-lg bg-white/[0.04] p-3">
            <p className="mb-1 text-xs text-zinc-500">发送给 AI 的完整提示词：</p>
            <pre className="whitespace-pre-wrap text-xs text-emerald-300/90">{previewPrompt}</pre>
          </div>
        )}
        <div className="aspect-square max-w-md rounded-xl bg-white/[0.04] flex items-center justify-center text-zinc-500 overflow-hidden">
          {previewUrl ? (
            <img src={previewUrl} alt="生成结果" className="h-full w-full object-contain" />
          ) : generating ? (
            <span className="flex items-center gap-2 text-zinc-400">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              正在生成…
            </span>
          ) : '生成结果将显示在这里'}
        </div>
      </Card>
    </div>
  );
}
