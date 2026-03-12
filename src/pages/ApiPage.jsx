import React, { useState, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

const STORAGE_KEY = 'jiangying_api_config';

/**
 * 圆形指示灯：灰=未检测，蓝旋转=检测中，绿=通过，红=失败
 * @param {{ status: null|'testing'|'ok'|'fail', message?: string }} props
 */
function StatusLight({ status, message }) {
  if (status === 'testing') {
    return (
      <span className="relative flex h-4 w-4" title="检测中…">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      </span>
    );
  }
  if (status === 'ok') {
    return (
      <span className="relative flex h-4 w-4" title={message || '已连通'}>
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-40" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
      </span>
    );
  }
  if (status === 'fail') {
    return (
      <span className="relative flex h-4 w-4" title={message || '连接失败'}>
        <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-30" />
        <span className="relative inline-flex h-4 w-4 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
      </span>
    );
  }
  return (
    <span className="relative flex h-4 w-4" title="未检测">
      <span className="relative inline-flex h-4 w-4 rounded-full bg-zinc-600" />
    </span>
  );
}

/** 默认配置结构 */
const defaultConfig = {
  baseUrl: '',
  apiKey: '',
  /** 剧作大模型可配独立 baseUrl；charactersEndpoint 可选，用于「大模型提取角色信息」 */
  scriptLLM: { enabled: true, endpoint: '/v1/script/breakdown', baseUrl: '', charactersEndpoint: '' },
  image: { enabled: true, endpoint: '/v1/image/generate' },
  video: { enabled: true, endpoint: '/v1/video/generate' },
  digitalHuman: { enabled: true, endpoint: '/v1/digital-human' },
};

/**
 * 从本地存储读取 API 配置
 * @returns {typeof defaultConfig}
 */
function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultConfig, ...parsed };
    }
  } catch (_) {
    // ignore
  }
  return { ...defaultConfig };
}

/**
 * 单个服务的连通性检测结果
 * @typedef {{ status: null|'testing'|'ok'|'fail', message: string }} TestResult
 */

/**
 * 对指定 URL 做连通探测（HEAD → GET → POST 逐级尝试），超时 8 秒
 * @param {string} url - 完整端点 URL
 * @param {string} [apiKey] - 可选 Bearer Token
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
async function probeEndpoint(url, apiKey) {
  const headers = {};
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    for (const method of ['HEAD', 'GET', 'POST']) {
      try {
        const opts = { method, headers, signal: ctrl.signal };
        if (method === 'POST') opts.headers = { ...headers, 'Content-Type': 'application/json' };
        if (method === 'POST') opts.body = '{}';
        const res = await fetch(url, opts);
        clearTimeout(timer);
        if (res.ok || res.status === 401 || res.status === 403) {
          return { ok: true, message: `${method} → ${res.status} OK` };
        }
        if (res.status === 405) continue;
        return { ok: false, message: `${method} → HTTP ${res.status}` };
      } catch (e) {
        if (e.name === 'AbortError') throw e;
        continue;
      }
    }
    return { ok: false, message: '所有方法均无响应' };
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') return { ok: false, message: '超时（8s）' };
    return { ok: false, message: e?.message || '连接失败' };
  }
}

/**
 * API 对接页面 - 配置 Base URL、API Key、各服务端点及测试连接
 * @returns {JSX.Element}
 */
export function ApiPage() {
  const [config, setConfig] = useState(loadConfig);

  /** 每个服务独立的检测状态，互不干扰 */
  const [testResults, setTestResults] = useState(
    /** @type {Record<string, TestResult>} */
    {}
  );

  const update = useCallback((key, value) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateNested = useCallback(
    (service, field, value) => {
      setConfig((prev) => {
        const next = {
          ...prev,
          [service]: { ...prev[service], [field]: value },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  /**
   * 对单个服务发起连通检测，不影响其他服务的状态
   * @param {string} serviceKey - 服务标识
   * @param {string} fullUrl - 完整请求 URL
   */
  const testService = useCallback(async (serviceKey, fullUrl) => {
    setTestResults((prev) => ({ ...prev, [serviceKey]: { status: 'testing', message: '' } }));
    if (!fullUrl || fullUrl === '/') {
      setTestResults((prev) => ({ ...prev, [serviceKey]: { status: 'fail', message: '未配置地址' } }));
      return;
    }
    const result = await probeEndpoint(fullUrl, config.apiKey);
    setTestResults((prev) => ({
      ...prev,
      [serviceKey]: { status: result.ok ? 'ok' : 'fail', message: result.message },
    }));
  }, [config.apiKey]);

  /**
   * 一键检测所有已启用的服务（并发执行，互不阻塞）
   */
  const testAll = useCallback(async () => {
    const tasks = [];
    const base = (config.baseUrl || '').replace(/\/$/, '');
    const scriptBase = (config.scriptLLM?.baseUrl || base || '').replace(/\/$/, '');

    if (config.scriptLLM?.enabled !== false) {
      const ep = config.scriptLLM?.endpoint || '/v1/script/breakdown';
      tasks.push(testService('scriptLLM', `${scriptBase}${ep.startsWith('/') ? '' : '/'}${ep}`));
    }
    if (config.image?.enabled !== false) {
      const ep = config.image?.endpoint || '/v1/image/generate';
      tasks.push(testService('image', `${base}${ep.startsWith('/') ? '' : '/'}${ep}`));
    }
    if (config.video?.enabled !== false) {
      const ep = config.video?.endpoint || '/v1/video/generate';
      tasks.push(testService('video', `${base}${ep.startsWith('/') ? '' : '/'}${ep}`));
    }
    if (config.digitalHuman?.enabled !== false) {
      const ep = config.digitalHuman?.endpoint || '/v1/digital-human';
      tasks.push(testService('digitalHuman', `${base}${ep.startsWith('/') ? '' : '/'}${ep}`));
    }
    await Promise.allSettled(tasks);
  }, [config, testService]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-white">API 对接</h1>
      <p className="mb-8 text-zinc-400">剧作大模型与视频/图生成是不同能力，需分别配置；此处可设通用 Base URL 及剧作大模型独立地址。</p>

      {/* 通用配置 */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">通用配置</h2>
        <p className="mb-4 text-xs text-zinc-500">图片生成、视频生成、数字人共用下方 Base URL；剧作大模型可单独配置独立地址（见下方服务端点）。</p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Base URL（视频/图/数字人）</label>
            <Input
              placeholder="https://api.example.com"
              value={config.baseUrl}
              onChange={(v) => update('baseUrl', v)}
            />
            <p className="mt-1 text-xs text-zinc-500">视觉生成与数字人服务根地址，不要以 / 结尾</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">API Key（可选）</label>
            <Input
              type="password"
              placeholder="Bearer token 或 API Key"
              value={config.apiKey}
              onChange={(v) => update('apiKey', v)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              className="btn-glow"
              onClick={testAll}
              disabled={Object.values(testResults).some((r) => r?.status === 'testing')}
            >
              {Object.values(testResults).some((r) => r?.status === 'testing') ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  检测中…
                </span>
              ) : '🔌 一键检测全部服务'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 为何要区分：剧作大模型 vs 视频/图模型 */}
      <Card className="mb-6 border-amber-500/10 p-4">
        <h3 className="mb-2 text-sm font-semibold text-amber-400/90">为何不能一个 API 解决所有问题</h3>
        <p className="mb-2 text-xs text-zinc-400">
          剧作栏需要的是<strong className="text-zinc-300">文本大模型</strong>（剧本拆分、景别运镜、角色提取等细节），而视频生成、文生图是<strong className="text-zinc-300">视觉模型</strong>，能力不同。建议剧作大模型配置独立服务地址，视频/图/数字人共用另一套 Base URL。
        </p>
        <ul className="list-inside list-disc text-xs text-zinc-500">
          <li>剧作大模型：理解剧本、输出结构化分镜与角色信息</li>
          <li>视频/图模型：根据分镜描述生成画面，不处理剧作细节</li>
        </ul>
      </Card>

      {/* 与剧作栏联动说明 */}
      <Card className="mb-6 border-emerald-500/10 p-4">
        <h3 className="mb-2 text-sm font-semibold text-emerald-400/90">与剧作栏（大模型·剧本）联动</h3>
        <ul className="list-inside list-disc space-y-1 text-xs text-zinc-400">
          <li><strong className="text-zinc-300">剧作大模型</strong>：可填独立 Base URL；请求体含「固定关键词 + 上下文记忆 + 剧本正文」，仅用于拆分与角色提取。</li>
          <li><strong className="text-zinc-300">固定关键词、上下文记忆、工作项目</strong>：本地保存，由前端拼入剧作大模型请求体。</li>
          <li><strong className="text-zinc-300">文生图、文生视频</strong>：走通用 Base URL，仅接收分镜 prompt，不含剧作固定关键词。</li>
        </ul>
      </Card>

      {/* 各服务端点 */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">服务端点</h2>
        <p className="mb-4 text-sm text-zinc-400">剧作大模型可配独立 Base URL；其余能力相对「Base URL（视频/图/数字人）」。</p>
        <div className="space-y-4">
          <div className="glass glass-hover flex flex-col gap-3 rounded-xl border border-amber-500/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">剧作大模型</span>
                  {config.scriptLLM?.enabled !== false && <Badge variant="primary">已启用</Badge>}
                </div>
                <p className="mt-1 text-xs text-zinc-500">剧本拆分剧集/分镜、角色提取；请求体含固定关键词、上下文记忆、剧本。建议使用专用文本/LLM 服务。</p>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <StatusLight status={testResults.scriptLLM?.status} message={testResults.scriptLLM?.message} />
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-500/20 hover:border-amber-400/60 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={testResults.scriptLLM?.status === 'testing'}
                  onClick={() => {
                    const base = (config.scriptLLM?.baseUrl || config.baseUrl || '').replace(/\/$/, '');
                    const ep = config.scriptLLM?.endpoint || '/v1/script/breakdown';
                    testService('scriptLLM', `${base}${ep.startsWith('/') ? '' : '/'}${ep}`);
                  }}
                >
                  <span className="text-sm">⚡</span> 检测连通
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:pl-0">
              <div>
                <label className="mb-0.5 block text-xs text-zinc-500">独立 Base URL（可选）</label>
                <Input
                  placeholder="留空则用通用 Base URL"
                  value={config.scriptLLM?.baseUrl ?? ''}
                  onChange={(v) => updateNested('scriptLLM', 'baseUrl', v)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-zinc-500">拆分端点路径</label>
                <Input
                  placeholder="/v1/script/breakdown"
                  value={config.scriptLLM?.endpoint ?? ''}
                  onChange={(v) => updateNested('scriptLLM', 'endpoint', v)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-zinc-500">角色提取端点（可选）</label>
                <Input
                  placeholder="如 /v1/script/characters，留空则剧本页用本地规则"
                  value={config.scriptLLM?.charactersEndpoint ?? ''}
                  onChange={(v) => updateNested('scriptLLM', 'charactersEndpoint', v)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
          {[
            { key: 'image', label: '图片生成', desc: '文生图、图生图接口' },
            { key: 'video', label: '视频生成', desc: '文本/图片生成视频' },
            { key: 'digitalHuman', label: '数字人', desc: '数字人、动作模仿' },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="glass glass-hover flex flex-col gap-3 rounded-xl border border-white/[0.1] p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-white">{label}</span>
                    {config[key]?.enabled !== false && <Badge variant="primary">已启用</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{desc}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <StatusLight status={testResults[key]?.status} message={testResults[key]?.message} />
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 hover:border-emerald-400/60 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={testResults[key]?.status === 'testing'}
                    onClick={() => {
                      const base = (config.baseUrl || '').replace(/\/$/, '');
                      const ep = config[key]?.endpoint || '/v1/...';
                      testService(key, `${base}${ep.startsWith('/') ? '' : '/'}${ep}`);
                    }}
                  >
                    <span className="text-sm">⚡</span> 检测连通
                  </button>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Input
                  placeholder="/v1/..."
                  value={config[key]?.endpoint ?? ''}
                  onChange={(v) => updateNested(key, 'endpoint', v)}
                  className="text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <p className="mt-6 text-sm text-zinc-500">
        配置将保存在浏览器本地，仅用于本机请求。生产环境请使用环境变量或服务端配置管理密钥。
      </p>
      <p className="mt-2 text-xs text-zinc-600">
        剧作栏工作项目、固定关键词、上下文记忆亦存于本地，与上述 API 配置独立；对接剧作大模型时由前端将三者与剧本一并发送。
      </p>
    </div>
  );
}
