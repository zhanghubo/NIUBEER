import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const ACCEPT_IMAGES = 'image/*';
const ACCEPT_VIDEO = 'video/*';
const ACCEPT_MEDIA = 'image/*,video/*';
const API_CONFIG_KEY = 'jiangying_api_config';

/** 视频比例（含 21:9 等），用于下拉与缩略图 */
const VIDEO_RATIOS = [
  { value: '21:9', label: '21:9' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
];

/**
 * 比例缩略图：按比例画小矩形示意
 * @param {{ ratio: string; className?: string }} props
 */
function RatioThumb({ ratio, className = '' }) {
  const [w, h] = ratio.split(':').map(Number);
  const isPortrait = h > w;
  const style = isPortrait
    ? { width: (24 * w) / h, height: 24 }
    : { width: 24, height: (24 * h) / w };
  return (
    <span
      className={`inline-block shrink-0 rounded border border-white/30 bg-white/10 ${className}`}
      style={style}
      aria-hidden
    />
  );
}

/** 时长选项：5 秒到 15 秒 */
const DURATIONS = Array.from({ length: 11 }, (_, i) => {
  const sec = i + 5;
  return { value: sec, label: `${sec}s` };
});

/** 视频画质：高清 / 2K / 4K */
const VIDEO_QUALITIES = [
  { value: 'hd', label: '高清' },
  { value: '2k', label: '2K' },
  { value: '4k', label: '4K' },
];

/** 视频封装格式 */
const VIDEO_FORMATS = [
  { value: 'mov', label: 'MOV' },
  { value: 'mp4', label: 'MP4' },
];

/** 视频编码格式（与封装格式配合：MP4/MOV + H.264 或 H.265） */
const VIDEO_CODECS = [
  { value: 'h264', label: 'H.264' },
  { value: 'h265', label: 'H.265' },
];

/** 首尾帧下拉模式：全能参考、首尾帧、智能多帧、主体参考 */
const FRAME_MODES = [
  { value: 'omni', label: '全能参考', icon: '⊗', isNew: true },
  { value: 'firstLast', label: '首尾帧', icon: '▭' },
  { value: 'multi', label: '智能多帧', icon: '{ }' },
  { value: 'subject', label: '主体参考', icon: '▢' },
];

/**
 * 单个首帧/尾帧上传槽位：支持拖拽、点击上传、预览
 * @param {{ label: string; file: File | null; onFile: (f: File | null) => void; accept?: string }} props
 */
function FrameSlot({ label, file, onFile, accept = ACCEPT_IMAGES }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const addFile = (fileList) => {
    const first = Array.from(fileList || []).find((f) => f.type.startsWith('image/'));
    if (first) onFile(first);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    addFile(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col items-center">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          addFile(e.target.files);
          e.target.value = '';
        }}
      />
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
          isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/[0.15] bg-white/[0.04] hover:border-white/[0.25] hover:bg-white/[0.06]'
        }`}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt={label} className="max-h-full max-w-full object-contain rounded-lg" />
            <p className="mt-1 text-xs text-zinc-400 truncate max-w-full px-1">{file?.name}</p>
          </>
        ) : (
          <>
            <span className="text-4xl text-zinc-500">+</span>
            <p className="mt-1 text-sm text-zinc-400">拖拽或点击上传</p>
          </>
        )}
      </div>
      <p className="mt-2 text-sm font-medium text-zinc-300">{label}</p>
      {file && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFile(null); }}
          className="mt-1 text-xs text-zinc-500 hover:text-red-400"
        >
          移除
        </button>
      )}
    </div>
  );
}

/**
 * 全能参考单项：显示图片/视频缩略图、文件名、移除按钮，并管理 Object URL 释放
 * @param {{ file: File; onRemove: () => void }} props
 */
function OmniRefThumbnail({ file, onRemove }) {
  const [url, setUrl] = useState('');
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="group relative flex shrink-0 flex-col items-center rounded-lg border border-white/10 bg-white/[0.04] overflow-hidden">
      <div className="relative h-20 w-20 flex items-center justify-center bg-zinc-800/80">
        {isImage && url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : isVideo && url ? (
          <video src={url} muted className="h-full w-full object-cover" preload="metadata" />
        ) : (
          <span className="text-2xl text-zinc-500">?</span>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-500"
          title="移除"
        >
          ×
        </button>
      </div>
      <p className="w-20 truncate px-1 py-1 text-center text-xs text-zinc-400" title={file.name}>{file.name}</p>
    </div>
  );
}

/** 将 prompt 按 @图片N / @视频N 拆成段落，便于渲染带缩略图的芯片 */
function parsePromptToSegments(prompt, atOptions) {
  if (!prompt || !atOptions?.length) return prompt ? [{ type: 'text', value: prompt }] : [];
  const re = /@(图片\d+|视频\d+)/g;
  const segments = [];
  let lastEnd = 0;
  let m;
  while ((m = re.exec(prompt)) !== null) {
    if (m.index > lastEnd) segments.push({ type: 'text', value: prompt.slice(lastEnd, m.index) });
    const refIndex = atOptions.findIndex((o) => o.label === m[1]);
    if (refIndex >= 0) segments.push({ type: 'ref', refIndex });
    else segments.push({ type: 'text', value: m[0] });
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd < prompt.length) segments.push({ type: 'text', value: prompt.slice(lastEnd) });
  return segments.length ? segments : [{ type: 'text', value: prompt }];
}

/** 将段落序列化回 prompt 字符串 */
function serializeSegments(segments, atOptions) {
  if (!atOptions?.length) return segments.map((s) => (s.type === 'text' ? s.value : '')).join('');
  return segments
    .map((s) => (s.type === 'text' ? s.value : '@' + atOptions[s.refIndex].label))
    .join('');
}

/**
 * 内联引用芯片：@图片1 / @视频1 后带缩略图，用于 contenteditable 内
 * @param {{ file: File; label: string }} props
 */
function InlineRefChip({ file, label }) {
  const [url, setUrl] = useState('');
  const isImage = file?.type?.startsWith('image/');
  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <span
      contentEditable={false}
      data-ref-label={label}
      className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 align-middle"
    >
      {url && isImage ? (
        <img src={url} alt="" className="h-5 w-5 shrink-0 rounded object-cover" />
      ) : url ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-600 text-xs">▶</span>
      ) : null}
      <span className="text-xs text-zinc-300">{label}</span>
    </span>
  );
}

/**
 * 视频生成页 - 布局对齐参考图：大文案框 + 首帧/尾帧双槽 + 底部操作栏（比例、时长等）
 */
export function VideoGeneratePage() {
  const location = useLocation();
  const initialPrompt = (location.state && typeof location.state.prompt === 'string') ? location.state.prompt : '';
  const [prompt, setPrompt] = useState(initialPrompt);
  const [startFrame, setStartFrame] = useState(null);
  const [endFrame, setEndFrame] = useState(null);
  const [videoRatio, setVideoRatio] = useState('21:9');
  const [duration, setDuration] = useState(15);
  const [frameMode, setFrameMode] = useState('firstLast');
  const [frameMenuOpen, setFrameMenuOpen] = useState(false);
  const [ratioMenuOpen, setRatioMenuOpen] = useState(false);
  const [durationMenuOpen, setDurationMenuOpen] = useState(false);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [codecMenuOpen, setCodecMenuOpen] = useState(false);
  const [videoQuality, setVideoQuality] = useState('2k');
  const [videoFormat, setVideoFormat] = useState('mp4');
  const [videoCodec, setVideoCodec] = useState('h264');
  /** 已生成的视频列表（预览、下载、再次生成/再次编辑） */
  const [generatedVideos, setGeneratedVideos] = useState([]);
  const [omniRefs, setOmniRefs] = useState([]);
  const omniInputRef = useRef(null);
  /** 智能多帧：每项为 File | null，至少 1 个槽位，最多 8 个 */
  const [multiFrames, setMultiFrames] = useState([null]);
  const MULTI_FRAME_MAX = 8;

  const setMultiFrameAt = (index, file) => {
    setMultiFrames((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  };
  const addMultiFrameSlot = () => {
    setMultiFrames((prev) => (prev.length < MULTI_FRAME_MAX ? [...prev, null] : prev));
  };
  const removeMultiFrameSlot = (index) => {
    setMultiFrames((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [null];
    });
  };

  const addOmniRefs = (files) => {
    const list = Array.from(files || []).filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
    setOmniRefs((prev) => [...prev, ...list].slice(0, 5));
  };
  const removeOmniRef = (index) => setOmniRefs((prev) => prev.filter((_, i) => i !== index));

  /**
   * 构建视频生成请求参数。
   * prompt 仅写入 AI 能理解的视觉设置（比例、时长、模式）；
   * 画质/格式/编码等后处理参数通过 payload 结构化字段传给后端
   */
  const buildVideoGeneratePayload = () => {
    const user = (prompt || '').trim();
    const modeLabel = FRAME_MODES.find((m) => m.value === frameMode)?.label || frameMode;
    const settings = [`比例 ${videoRatio}`, `时长 ${duration}s`, `模式 ${modeLabel}`];
    const fullPrompt = user
      ? `${user}\n[设置] ${settings.join(' | ')}`
      : `[设置] ${settings.join(' | ')}`;
    return {
      prompt: fullPrompt,
      duration,
      aspectRatio: videoRatio,
      resolution: videoQuality,
      format: videoFormat,
      codec: videoCodec,
      frameMode,
    };
  };

  /** @ 关联菜单：仅在全能参考且有已选参考时可用 */
  const [atMenuOpen, setAtMenuOpen] = useState(false);
  const atIndexRef = useRef(0);
  const atAnchorRef = useRef(0);
  const promptInputRef = useRef(null);
  const atMenuRef = useRef(null);
  const pendingCursorRef = useRef(null);

  /** 根据 omniRefs 生成可插入的 @选项：图片1、视频2 等 */
  const atOptions = React.useMemo(() => {
    return omniRefs.map((file, i) => {
      const n = i + 1;
      const label = file.type.startsWith('image/') ? `图片${n}` : `视频${n}`;
      return { label, insert: label };
    });
  }, [omniRefs]);

  /** 检测光标前是否为「刚输入的 @」，是则打开 @ 关联菜单并记录插入位置 */
  const tryOpenAtMenu = (value, cursorStart) => {
    if (frameMode !== 'omni' || omniRefs.length === 0) return false;
    const start = cursorStart ?? value.length;
    const before = value.slice(0, start);
    const atIdx = before.lastIndexOf('@');
    if (atIdx === -1) return false;
    if (!/^@\s*$/.test(before.slice(atIdx))) return false;
    atIndexRef.current = atIdx;
    atAnchorRef.current = start;
    setAtMenuOpen(true);
    return true;
  };

  /** 纯文本输入框变更：读 value 与 selectionStart，支持 @ 关联 */
  const handlePromptChange = (e) => {
    const el = e.target;
    const v = el.value;
    const start = el.selectionStart ?? v.length;
    setPrompt(v);
    if (!tryOpenAtMenu(v, start)) setAtMenuOpen(false);
  };

  const insertAtRef = (insert) => {
    const at = atIndexRef.current;
    const anchor = atAnchorRef.current;
    const newText = prompt.slice(0, at) + '@' + insert + prompt.slice(anchor);
    setPrompt(newText);
    setAtMenuOpen(false);
    pendingCursorRef.current = at + insert.length + 1;
  };

  /** 是否使用富文本输入（全能参考且有参考时，@ 后显示缩略图） */
  const useRichPrompt = frameMode === 'omni' && omniRefs.length > 0;
  const editableRef = useRef(null);
  /** 从 contenteditable DOM 序列化出 prompt 并返回当前光标字符偏移 */
  const serializeEditableAndGetCursor = () => {
    const el = editableRef.current;
    if (!el) return { prompt: '', cursor: 0 };
    const sel = window.getSelection();
    let prompt = '';
    let cursor = -1;
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const start = prompt.length;
        prompt += node.textContent || '';
        if (sel && node === sel.anchorNode) cursor = start + (sel.anchorOffset || 0);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node;
      if (el.getAttribute?.('data-ref-label')) {
        const label = el.getAttribute('data-ref-label');
        const start = prompt.length;
        prompt += '@' + label;
        if (sel && (el.contains(sel.anchorNode) || el === sel.anchorNode)) cursor = start + 1 + label.length;
        return;
      }
      for (let i = 0; i < el.childNodes.length; i++) walk(el.childNodes[i]);
    };
    for (let i = 0; i < el.childNodes.length; i++) walk(el.childNodes[i]);
    if (cursor < 0) cursor = prompt.length;
    return { prompt, cursor };
  };
  /** 将 contenteditable 光标设到指定字符位置 */
  const setEditableCursor = (offset) => {
    const el = editableRef.current;
    if (!el) return;
    const sel = window.getSelection();
    const range = document.createRange();
    let passed = 0;
    const find = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const len = (node.textContent || '').length;
        if (passed + len >= offset) {
          range.setStart(node, Math.min(offset - passed, len));
          range.collapse(true);
          return true;
        }
        passed += len;
        return false;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return false;
      const elem = node;
      if (elem.getAttribute?.('data-ref-label')) {
        const label = elem.getAttribute('data-ref-label');
        const len = 1 + label.length;
        if (passed + len >= offset) {
          range.setStartAfter(elem);
          range.collapse(true);
          return true;
        }
        passed += len;
        return false;
      }
      for (let i = 0; i < elem.childNodes.length; i++) if (find(elem.childNodes[i])) return true;
      return false;
    };
    find(el);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const handleRichInput = () => {
    const { prompt: nextPrompt, cursor } = serializeEditableAndGetCursor();
    setPrompt(nextPrompt);
    if (!tryOpenAtMenu(nextPrompt, cursor)) setAtMenuOpen(false);
    pendingCursorRef.current = cursor;
  };
  const handleRichPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    setTimeout(handleRichInput, 0);
  };

  /** 插入 @ 选项后恢复光标位置（textarea 或 contenteditable） */
  useEffect(() => {
    if (pendingCursorRef.current == null) return;
    const pos = pendingCursorRef.current;
    pendingCursorRef.current = null;
    if (useRichPrompt && editableRef.current) {
      editableRef.current.focus();
      setEditableCursor(pos);
    } else if (promptInputRef.current) {
      promptInputRef.current.focus();
      promptInputRef.current.setSelectionRange(pos, pos);
    }
  }, [prompt, useRichPrompt]);

  /** 兜底：prompt 变化后若末尾是 @（含空格），且未打开菜单，则用当前内容再尝试打开（解决 IME/受控下 selectionStart 不准） */
  useEffect(() => {
    if (atMenuOpen || !prompt || frameMode !== 'omni' || omniRefs.length === 0) return;
    const trimmed = prompt.trimEnd();
    if (!trimmed.endsWith('@')) return;
    const atIdx = trimmed.lastIndexOf('@');
    atIndexRef.current = atIdx;
    atAnchorRef.current = prompt.length;
    setAtMenuOpen(true);
  }, [prompt, frameMode, omniRefs.length, atMenuOpen]);

  /** 点击菜单和输入框外时关闭 @ 菜单，不遮挡输入框，保证可继续输入 */
  useEffect(() => {
    if (!atMenuOpen) return;
    const handleClickOutside = (e) => {
      const inMenu = atMenuRef.current?.contains(e.target);
      const inInput = promptInputRef.current?.contains(e.target);
      if (!inMenu && !inInput) setAtMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [atMenuOpen]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-white">视频生成</h1>
      <p className="mb-6 text-zinc-400">智能多帧 · 超长镜头轻松生成</p>

      {/* 文案输入：全能参考且有参考时用 contenteditable 显示 @图片N 后带缩略图，否则用 textarea */}
      <Card className="relative mb-6 overflow-visible p-4">
        {useRichPrompt ? (
          <div
            ref={(r) => {
              editableRef.current = r;
              promptInputRef.current = r;
            }}
            contentEditable
            suppressContentEditableWarning
            onInput={handleRichInput}
            onPaste={handleRichPaste}
            data-placeholder="输入文字，描述你想创作的画面内容、运动方式等。输入 @ 可关联已上传的参考，如 @图片1 作为首帧、@视频1 的动作。"
            className="min-h-[120px] w-full resize-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-base text-slate-100 focus:border-emerald-500 focus:bg-white/[0.06] focus:outline-none backdrop-blur-xl transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-500"
          >
            {(!prompt || !prompt.trim()) ? null : parsePromptToSegments(prompt, atOptions).map((seg, i) =>
              seg.type === 'text' ? (
                <span key={i}>{seg.value}</span>
              ) : (
                <InlineRefChip
                  key={i}
                  file={omniRefs[seg.refIndex]}
                  label={atOptions[seg.refIndex].label}
                />
              )
            )}
          </div>
        ) : (
          <textarea
            ref={promptInputRef}
            rows={4}
            placeholder="输入文字，描述你想创作的画面内容、运动方式等。全能参考时输入 @ 可关联已上传的参考图/视频，如 @图片1 作为首帧、@视频1 的动作。"
            value={prompt ?? ''}
            onChange={handlePromptChange}
            className="w-full resize-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-base text-slate-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:bg-white/[0.06] focus:outline-none backdrop-blur-xl transition-colors"
          />
        )}
        {atMenuOpen && atOptions.length > 0 && (
          <div
            ref={atMenuRef}
            className="absolute left-4 right-4 bottom-full z-20 mb-1 rounded-xl border border-emerald-500/30 bg-zinc-900 py-1 shadow-xl ring-1 ring-black/20"
            role="listbox"
            aria-label="选择要关联的参考"
          >
              <p className="px-3 py-1.5 text-xs text-zinc-500">选择要关联的参考（作为角色/首尾帧/动作等）</p>
              {atOptions.map((opt) => (
                <button
                  key={opt.insert}
                  type="button"
                  role="option"
                  onClick={() => insertAtRef(opt.insert)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/[0.08] hover:text-white"
                >
                  <span className="text-emerald-400">@</span>
                  {opt.label}
                </button>
              ))}
          </div>
        )}
      </Card>

      {/* 全能参考：参考内容上传 + 说明文案（与参考图一致） */}
      {frameMode === 'omni' ? (
        <Card className="mb-6 overflow-visible p-6">
          <div className="flex gap-6">
            <input
              ref={omniInputRef}
              type="file"
              accept={ACCEPT_MEDIA}
              multiple
              className="hidden"
              onChange={(e) => { addOmniRefs(e.target.files); e.target.value = ''; }}
            />
            <div className="flex shrink-0 flex-col items-center">
              <div
                onClick={() => omniInputRef.current?.click()}
                className="flex h-36 w-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/[0.06] transition hover:border-white/30 hover:bg-white/[0.08]"
              >
                <span className="text-5xl font-light text-white">+</span>
                <span className="mt-2 text-sm text-zinc-400">参考内容</span>
              </div>
              {omniRefs.length > 0 && (
                <>
                  <p className="mt-3 text-xs text-zinc-500">{omniRefs.length}/5 已选</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {omniRefs.map((file, i) => (
                      <OmniRefThumbnail key={i} file={file} onRemove={() => removeOmniRef(i)} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed text-zinc-400">
                上传 1–5 张参考图或视频，可自由组合人物、角色、道具、服装、场景等元素，定义他们之间的精彩互动。
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                例如：@图片1 作为首帧，@图片2 作为尾帧，模仿 @视频1 的动作跳舞
              </p>
            </div>
          </div>
        </Card>
      ) : frameMode === 'multi' ? (
        /* 智能多帧：第1帧、第2帧… 带预览，右侧提示「请添加智能多帧的镜头」 */
        <Card className="mb-6 overflow-visible p-6">
          <div className="flex gap-6">
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex flex-wrap gap-4">
                {multiFrames.map((file, i) => (
                  <div key={i} className="flex w-40 flex-col items-center">
                    <FrameSlot
                      label={`第${i + 1}帧`}
                      file={file}
                      onFile={(f) => setMultiFrameAt(i, f)}
                    />
                    {multiFrames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMultiFrameSlot(i)}
                        className="mt-1 text-xs text-zinc-500 hover:text-red-400"
                      >
                        移除本帧
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {multiFrames.length < MULTI_FRAME_MAX && (
                <button
                  type="button"
                  onClick={addMultiFrameSlot}
                  className="mt-4 flex w-fit items-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/[0.04] px-4 py-2 text-sm text-zinc-400 transition hover:border-white/30 hover:bg-white/[0.06] hover:text-zinc-300"
                >
                  <span className="text-lg">+</span>
                  添加一帧
                </button>
              )}
            </div>
            <div className="flex shrink-0 flex-col justify-center">
              <p className="text-sm text-zinc-400">请添加智能多帧的镜头</p>
            </div>
          </div>
        </Card>
      ) : (
        /* 首帧 ⇄ 尾帧 双槽 */
        <Card className="mb-6 p-6">
          <div className="flex items-stretch gap-4">
            <div className="flex-1 min-w-0">
              <FrameSlot label="首帧" file={startFrame} onFile={setStartFrame} />
            </div>
            <div className="flex items-center justify-center shrink-0 text-zinc-500" title="首尾帧">
              <span className="text-2xl">⇄</span>
            </div>
            <div className="flex-1 min-w-0">
              <FrameSlot label="尾帧" file={endFrame} onFile={setEndFrame} />
            </div>
          </div>
        </Card>
      )}

      {/* 底部操作栏：overflow-visible 让下拉不被裁剪 */}
      <Card className="relative z-10 mb-6 overflow-visible p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            className="btn-glow shrink-0"
            onClick={async () => {
              const id = Date.now();
              const refFiles = frameMode === 'omni'
                ? omniRefs.slice(0, 2)
                : [startFrame, endFrame].filter(Boolean);
              const refThumbnailUrls = refFiles.map((f) => URL.createObjectURL(f));
              const payload = buildVideoGeneratePayload();
              let videoUrl = null;
              let thumbnailUrl = null;
              try {
                const raw = localStorage.getItem(API_CONFIG_KEY);
                const config = raw ? JSON.parse(raw) : null;
                const base = (config?.video?.baseUrl || config?.baseUrl || '').toString().replace(/\/$/, '');
                const path = (config?.video?.endpoint || '/v1/video/generate').replace(/^\//, '');
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
                    videoUrl = data.videoUrl ?? data.data?.videoUrl ?? data.url;
                    thumbnailUrl = data.thumbnailUrl ?? data.data?.thumbnailUrl;
                  }
                }
              } catch (_) {
                // 未配置或请求失败时使用占位，下方统一 push 一项
              }
              setGeneratedVideos((prev) => [
                ...prev,
                {
                  id,
                  name: `视频_${prev.length + 1}.${videoFormat === 'mov' ? 'mov' : 'mp4'}`,
                  thumbnailUrl,
                  videoUrl,
                  description: prompt || '暂无描述',
                  duration,
                  refThumbnailUrls,
                  quality: videoQuality,
                  format: videoFormat,
                  codec: videoCodec,
                },
              ]);
            }}
          >
            <span className="mr-1">▶</span>
            视频生成
          </Button>
          <div className="h-6 w-px bg-white/10" />
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.1]"
          >
            <span className="text-zinc-500">◇</span>
            Seedance 2.0
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setFrameMenuOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                frameMenuOpen ? 'bg-white/[0.1] text-white' : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]'
              }`}
            >
              <span className="text-zinc-500">▭</span>
              {FRAME_MODES.find((m) => m.value === frameMode)?.label ?? '首尾帧'}
              <span className={`inline-block transition-transform ${frameMenuOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {frameMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFrameMenuOpen(false)} aria-hidden />
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl">
                  {FRAME_MODES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => {
                        setFrameMode(m.value);
                        setFrameMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm ${
                        frameMode === m.value ? 'bg-white/[0.08] text-white' : 'text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="text-zinc-500">{m.icon}</span>
                      <span className="flex-1">{m.label}</span>
                      {m.isNew && (
                        <span className="text-xs text-zinc-500">New</span>
                      )}
                      {frameMode === m.value && (
                        <span className="text-emerald-400">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="h-6 w-px bg-white/10" />
          {/* 比例下拉 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setRatioMenuOpen((v) => !v); setDurationMenuOpen(false); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                ratioMenuOpen ? 'bg-white/[0.1] text-white' : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]'
              }`}
            >
              <RatioThumb ratio={videoRatio} className="border-white/40" />
              {VIDEO_RATIOS.find((r) => r.value === videoRatio)?.label ?? '21:9'}
              <span className={`inline-block transition-transform ${ratioMenuOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {ratioMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRatioMenuOpen(false)} aria-hidden />
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl">
                  <p className="px-3 py-2 text-xs text-zinc-500">选择比例</p>
                  {VIDEO_RATIOS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => { setVideoRatio(r.value); setRatioMenuOpen(false); }}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                        videoRatio === r.value ? 'bg-white/[0.08] text-white' : 'text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <RatioThumb ratio={r.value} />
                      <span>{r.label}</span>
                      {videoRatio === r.value && <span className="ml-auto text-emerald-400">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* 时长下拉 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setDurationMenuOpen((v) => !v); setRatioMenuOpen(false); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                durationMenuOpen ? 'bg-white/[0.1] text-white' : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]'
              }`}
            >
              <span className="text-zinc-500">🕐</span>
              {DURATIONS.find((d) => d.value === duration)?.label ?? '15s'}
              <span className={`inline-block transition-transform ${durationMenuOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {durationMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDurationMenuOpen(false)} aria-hidden />
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl">
                  <p className="px-3 py-2 text-xs text-zinc-500">选择视频生成时长</p>
                  <div className="max-h-[240px] overflow-y-auto">
                    {DURATIONS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => { setDuration(d.value); setDurationMenuOpen(false); }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                          duration === d.value ? 'bg-white/[0.08] text-white' : 'text-zinc-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="text-zinc-500">🕐</span>
                        <span>{d.label}</span>
                        {duration === d.value && <span className="ml-auto text-emerald-400">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* 画质：高清 / 2K / 4K */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setQualityMenuOpen((v) => !v); setFormatMenuOpen(false); setCodecMenuOpen(false); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                qualityMenuOpen ? 'bg-white/[0.1] text-white' : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]'
              }`}
            >
              <span className="text-zinc-500">◇</span>
              {VIDEO_QUALITIES.find((q) => q.value === videoQuality)?.label ?? '2K'}
              <span className={`inline-block transition-transform ${qualityMenuOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {qualityMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setQualityMenuOpen(false)} aria-hidden />
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[100px] rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl">
                  {VIDEO_QUALITIES.map((q) => (
                    <button
                      key={q.value}
                      type="button"
                      onClick={() => { setVideoQuality(q.value); setQualityMenuOpen(false); }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                        videoQuality === q.value ? 'bg-white/[0.08] text-white' : 'text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>{q.label}</span>
                      {videoQuality === q.value && <span className="text-emerald-400">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* 格式：MOV / MP4 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setFormatMenuOpen((v) => !v); setQualityMenuOpen(false); setCodecMenuOpen(false); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                formatMenuOpen ? 'bg-white/[0.1] text-white' : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]'
              }`}
            >
              {VIDEO_FORMATS.find((f) => f.value === videoFormat)?.label ?? 'MP4'}
              <span className={`inline-block transition-transform ${formatMenuOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {formatMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFormatMenuOpen(false)} aria-hidden />
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[100px] rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl">
                  {VIDEO_FORMATS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => { setVideoFormat(f.value); setFormatMenuOpen(false); }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                        videoFormat === f.value ? 'bg-white/[0.08] text-white' : 'text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>{f.label}</span>
                      {videoFormat === f.value && <span className="text-emerald-400">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* 编码格式：H.264 / H.265 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setCodecMenuOpen((v) => !v); setQualityMenuOpen(false); setFormatMenuOpen(false); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                codecMenuOpen ? 'bg-white/[0.1] text-white' : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]'
              }`}
              title="视频编码格式"
            >
              <span className="text-zinc-500 text-xs hidden sm:inline">编码</span>
              {VIDEO_CODECS.find((c) => c.value === videoCodec)?.label ?? 'H.264'}
              <span className={`inline-block transition-transform ${codecMenuOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {codecMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCodecMenuOpen(false)} aria-hidden />
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-xl">
                  <p className="px-3 py-2 text-xs text-zinc-500">编码格式</p>
                  {VIDEO_CODECS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => { setVideoCodec(c.value); setCodecMenuOpen(false); }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                        videoCodec === c.value ? 'bg-white/[0.08] text-white' : 'text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>{c.label}</span>
                      {videoCodec === c.value && <span className="text-emerald-400">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* 生成结果：视频预览列表，支持下载、再次生成、再次编辑 */}
      <Card className="relative z-0 mt-6 p-4">
        <h3 className="mb-4 text-sm font-medium text-zinc-300">生成结果</h3>
        {generatedVideos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-12 text-center text-sm text-zinc-500">
            暂无生成视频，点击「视频生成」开始创作
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {generatedVideos.map((item) => (
              <div
                key={item.id}
                className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
              >
                {/* 顶部：参考图缩略图 + 描述与时长、详细信息 */}
                <div className="flex gap-3 border-b border-white/10 p-3">
                  <div className="flex shrink-0">
                    {(item.refThumbnailUrls || []).slice(0, 2).map((url, i) => (
                      <div
                        key={i}
                        className="-ml-2 first:ml-0 inline-block h-12 w-12 overflow-hidden rounded-lg border border-white/15 bg-zinc-800"
                        style={{ zIndex: 2 - i }}
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                    {(!item.refThumbnailUrls || item.refThumbnailUrls.length === 0) && (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/15 bg-zinc-800 text-zinc-500 text-xs">
                        参考
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-3 text-xs text-zinc-400">{item.description || '暂无描述'}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Seedance 2.0 | {item.duration ?? 15}s | {(item.quality || '2k').toUpperCase()} {item.format?.toUpperCase() || 'MP4'} {item.codec === 'h265' ? 'H.265' : 'H.264'}
                    </p>
                  </div>
                </div>
                {/* 视频预览区 + 叠加强 controls */}
                <div className="group relative aspect-video w-full bg-zinc-800/80">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : item.videoUrl ? (
                    <video src={item.videoUrl} className="h-full w-full object-cover" muted preload="metadata" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-500">
                      <span className="text-4xl">▶</span>
                    </div>
                  )}
                  {/* 右上角：下载、更多、收藏 */}
                  <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    {item.videoUrl ? (
                      <a
                        href={item.videoUrl}
                        download={item.name || 'video.mp4'}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70"
                        title="下载"
                      >
                        ↓
                      </a>
                    ) : (
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-zinc-500 cursor-not-allowed"
                        title="下载"
                      >
                        ↓
                      </span>
                    )}
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70"
                      title="更多"
                    >
                      ⋯
                    </button>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70"
                      title="收藏"
                    >
                      ☆
                    </button>
                  </div>
                  {/* 底部居中：音量、跳过、HD、音乐 */}
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-black/50 px-2 py-1.5 opacity-0 transition group-hover:opacity-100">
                    <button type="button" className="p-1 text-white/80 hover:text-white" title="字幕/语音">🗣</button>
                    <button type="button" className="p-1 text-white/80 hover:text-white" title="音量">〰</button>
                    <button type="button" className="p-1 text-white/80 hover:text-white" title="跳过">⏭</button>
                    <span className="px-1 text-xs text-white/70">HD</span>
                    <button type="button" className="p-1 text-white/80 hover:text-white" title="音乐">♪</button>
                  </div>
                </div>
                {/* 底部操作：重新编辑、再次生成、更多 */}
                <div className="flex items-center gap-2 p-3">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg bg-white/[0.08] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.12]"
                  >
                    <span>↻</span>
                    重新编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      item.refThumbnailUrls?.forEach((u) => URL.revokeObjectURL(u));
                      setGeneratedVideos((prev) => prev.filter((v) => v.id !== item.id));
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-white/[0.08] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.12]"
                  >
                    <span>⟳</span>
                    再次生成
                  </button>
                  <button
                    type="button"
                    className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.08] text-zinc-400 hover:bg-white/[0.12]"
                    title="更多"
                  >
                    ⋯
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
