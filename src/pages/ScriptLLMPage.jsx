import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
/** mammoth 按需动态加载，仅解析 docx 时才下载（~478KB），避免拖慢首屏 */
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const SCRIPT_ACCEPT = '.txt,.md,.doc,.docx,text/plain,text/markdown,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const SCRIPT_EXT = /\.(txt|md|doc|docx)$/i;
const SCRIPT_BATCH_STORAGE_KEY = 'script_batch_prompts';
const SCRIPT_LLM_FIXED_KEYWORDS_KEY = 'script_llm_fixed_keywords';
const SCRIPT_LLM_CONTEXT_KEY = 'script_llm_context_memory';
const SCRIPT_PROJECTS_KEY = 'script_projects';
const API_CONFIG_KEY = 'jiangying_api_config';

/**
 * 剧作大模型默认任务指令：先分集、再人物、再场景（按影视化分镜表 11 要素）
 * 每次「大模型拆分剧集与分镜」时自动拼入提示词最前，保证输出结构一致
 */
const SCRIPT_LLM_TASK_PROMPT = `请按以下流程处理剧本：

1. 拆分剧集、分集：将剧本按场/集拆分为若干单元。
2. 设计人物形象：提取并描述主要角色的年龄、装扮、身份、容貌、身高、身材、癖好等，便于后续场景中一致呈现。
3. 根据人物形象进行场景设计：为每个镜头按「影视化分镜表」输出以下 11 项要素——
景别 · 构图 · 运镜 · 演员调度 · 光线 · 内外镜 · 现场音 · 画外音 · 特效 · 色调 · 画面风格。

每个分镜请给出：描述（画面概要），以及上述各要素的简要标注（可为空但结构需保留），便于文生图/文生视频直接使用。`;

/** 角色提取时的任务说明：与分集、场景设计配套的人物形象设计 */
const SCRIPT_LLM_CHARACTER_TASK_PROMPT = `请从剧本中提取主要角色，为每个角色设计人物形象并填写：姓名、年龄、装扮、道具、身份、容貌、身高、身材、癖好等。这些设定将用于后续场景分镜与文生图时保持一致的人物呈现。`;

/**
 * 从 API 对接页配置中读取剧作大模型请求地址与密钥
 * @returns {{ url: string; charactersUrl?: string; apiKey: string } | null} 无可用时返回 null
 */
function getScriptLLMRequestConfig() {
  try {
    const raw = localStorage.getItem(API_CONFIG_KEY);
    if (!raw) return null;
    const config = JSON.parse(raw);
    const base = (config.scriptLLM?.baseUrl || config.baseUrl || '').toString().replace(/\/$/, '');
    if (!base) return null;
    const path = (config.scriptLLM?.endpoint || '/v1/script/breakdown').replace(/^\//, '');
    const url = path ? `${base}/${path}` : base;
    const charactersPath = (config.scriptLLM?.charactersEndpoint || '').toString().replace(/^\//, '');
    const charactersUrl = charactersPath ? `${base}/${charactersPath}` : undefined;
    return { url, charactersUrl, apiKey: config.apiKey || '' };
  } catch (_) {
    return null;
  }
}

/** 将 API 返回的单条分镜归一为前端结构（含 prompt） */
function normalizeShot(raw) {
  const line = typeof raw?.描述 === 'string' ? raw.描述 : (raw?.prompt || raw?.描述 || '');
  const shot = parseShotFromLine(line);
  if (raw && typeof raw === 'object') {
    SHOT_FIELDS.forEach((f) => { if (raw[f.key] != null) shot[f.key] = String(raw[f.key]); });
    if (raw.色调 != null) shot['色调'] = String(raw.色调);
    if (raw.画面风格 != null) shot['画面风格'] = String(raw.画面风格);
    shot.prompt = buildPromptFromShot(shot);
  }
  return shot;
}

function loadFixedKeywords() {
  try {
    return localStorage.getItem(SCRIPT_LLM_FIXED_KEYWORDS_KEY) || '';
  } catch {
    return '';
  }
}

function loadContextMemory() {
  try {
    return localStorage.getItem(SCRIPT_LLM_CONTEXT_KEY) || '';
  } catch {
    return '';
  }
}

/** @returns {{ id: string, name: string, savedAt: number, data: object }[]} */
function loadProjects() {
  try {
    const raw = localStorage.getItem(SCRIPT_PROJECTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

function saveProjects(list) {
  try {
    localStorage.setItem(SCRIPT_PROJECTS_KEY, JSON.stringify(list));
  } catch (_) {}
}

/**
 * 读取单个剧本文件为文本（支持 .txt .md .doc .docx）
 * @param {File} file
 * @returns {Promise<string>}
 */
async function readScriptFile(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.txt') || name.endsWith('.md')) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result ?? ''));
      r.onerror = () => reject(r.error);
      r.readAsText(file, 'UTF-8');
    });
  }
  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    const buf = await file.arrayBuffer();
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    return value || '';
  }
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(r.error);
    r.readAsText(file, 'UTF-8');
  });
}

/** 分镜单条：影视工业字段 */
const SHOT_FIELDS = [
  { key: '景别', placeholder: '远景/全景/中景/近景/特写' },
  { key: '构图', placeholder: '三分法/对称/前景遮挡…' },
  { key: '运镜', placeholder: '推/拉/摇/移/跟/升/降/固定' },
  { key: '演员调度', placeholder: '走位、互动、入画出画' },
  { key: '光线', placeholder: '自然光/主光/逆光/侧光/影调' },
  { key: '内外镜', placeholder: '内景/外景' },
  { key: '现场音', placeholder: '环境声、对白、动效' },
  { key: '画外音', placeholder: '旁白、OS' },
  { key: '特效', placeholder: 'VFX、合成、调色' },
];

/** 色调可选（用于分镜 prompt） */
const COLOR_TONES = [
  { value: '', label: '未选' },
  { value: '暖调', label: '暖调' },
  { value: '冷调', label: '冷调' },
  { value: '中性', label: '中性' },
  { value: '电影感调色', label: '电影感调色' },
  { value: '高饱和', label: '高饱和' },
  { value: '低饱和', label: '低饱和' },
  { value: '黑白', label: '黑白' },
  { value: '青橙调', label: '青橙调' },
  { value: '复古色', label: '复古色' },
  { value: '赛博朋克', label: '赛博朋克' },
];

/** 画面风格可选（用于分镜 prompt） */
const VISUAL_STYLES = [
  { value: '', label: '未选' },
  { value: '电影感', label: '电影感' },
  { value: '赛博朋克', label: '赛博朋克' },
  { value: '日系', label: '日系' },
  { value: '复古胶片', label: '复古胶片' },
  { value: '写实', label: '写实' },
  { value: '动画', label: '动画' },
  { value: '高对比', label: '高对比' },
  { value: '柔光唯美', label: '柔光唯美' },
  { value: '纪录片', label: '纪录片' },
  { value: '悬疑暗调', label: '悬疑暗调' },
  { value: '科幻', label: '科幻' },
];

/** 角色信息字段（恒定人物刻画，助力短剧创作） */
const CHARACTER_FIELDS = [
  { key: '姓名', placeholder: '角色名' },
  { key: '年龄', placeholder: '如 25岁' },
  { key: '装扮', placeholder: '服装、造型' },
  { key: '道具', placeholder: '常持道具' },
  { key: '身份', placeholder: '职业、身份' },
  { key: '容貌', placeholder: '五官、气质' },
  { key: '身高', placeholder: '如 175cm' },
  { key: '身材', placeholder: '体型描述' },
  { key: '癖好', placeholder: '习惯、口头禅、小动作' },
];

const defaultCharacter = () =>
  Object.fromEntries(CHARACTER_FIELDS.map((f) => [f.key, '']));

const defaultShot = () => ({
  ...Object.fromEntries(SHOT_FIELDS.map((f) => [f.key, ''])),
  色调: '',
  画面风格: '',
});

/**
 * 从单行文本中尝试提取景别、内外镜、运镜等（简单规则，实际可交给大模型）
 */
function parseShotFromLine(line) {
  const shot = { ...defaultShot(), 描述: line };
  const lower = line;
  const 景别Match = lower.match(/(远景|大全景|全景|中景|近景|特写|大特写|过肩)/);
  if (景别Match) shot['景别'] = 景别Match[1];
  if (/内景|室内|INT/i.test(lower)) shot['内外镜'] = shot['内外镜'] ? shot['内外镜'] + ' 内景' : '内景';
  if (/外景|室外|EXT/i.test(lower)) shot['内外镜'] = shot['内外镜'] ? shot['内外镜'] + ' 外景' : '外景';
  if (/推|拉|摇|移|跟|升|降|固定/i.test(lower)) {
    const m = lower.match(/(推镜|拉镜|摇镜|移镜|跟镜|升|降|固定)/);
    if (m) shot['运镜'] = m[1];
  }
  if (/逆光|侧光|自然光|主光|剪影/i.test(lower)) {
    const m = lower.match(/(逆光|侧光|自然光|主光|剪影|柔光)/);
    if (m) shot['光线'] = m[1];
  }
  const 色调Match = lower.match(/(暖调|冷调|中性|电影感调色|高饱和|低饱和|黑白|青橙调|复古色|赛博朋克)/);
  if (色调Match) shot['色调'] = 色调Match[1];
  const 风格Match = lower.match(/(电影感|赛博朋克|日系|复古胶片|写实|动画|高对比|柔光唯美|纪录片|悬疑暗调|科幻)/);
  if (风格Match) shot['画面风格'] = 风格Match[1];
  shot.prompt = buildPromptFromShot(shot);
  return shot;
}

/** 用分镜字段（含色调、画面风格）拼成文生图/文生视频可用的 prompt */
function buildPromptFromShot(shot) {
  const parts = [shot['描述']];
  SHOT_FIELDS.forEach(({ key }) => {
    if (shot[key]) parts.push(`${key}: ${shot[key]}`);
  });
  if (shot['色调']) parts.push(`色调: ${shot['色调']}`);
  if (shot['画面风格']) parts.push(`画面风格: ${shot['画面风格']}`);
  return parts.filter(Boolean).join('；');
}

/**
 * 大模型·剧本页 - 影视化分镜表
 * 支持景别、构图、运镜、演员调度、光线、内外镜、现场音、画外音、特效，传递到文生图/文生视频
 */
export function ScriptLLMPage() {
  const navigate = useNavigate();
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  /** 拆分结果：{ 剧集: string, 分镜: { 描述, prompt, ...景别等 }[] }[] */
  const [result, setResult] = useState([]);
  const [expandedEpisode, setExpandedEpisode] = useState(null);
  /** 恒定角色信息（大模型提取，可编辑） */
  const [characters, setCharacters] = useState([]);
  const [characterLoading, setCharacterLoading] = useState(false);
  /** 大模型固定关键词：每次拆分剧集/分镜时固定加入提示词，仅用于剧作栏大模型，不影响文生图/文生视频 */
  const [fixedKeywords, setFixedKeywords] = useState(loadFixedKeywords);
  /** 大模型上下文记忆：每次请求会一并发给大模型，便于连续创作 */
  const [contextMemory, setContextMemory] = useState(loadContextMemory);
  /** 已保存的工作项目列表 */
  const [projects, setProjects] = useState(loadProjects);
  const [projectName, setProjectName] = useState('');
  const [showSaveProject, setShowSaveProject] = useState(false);
  /** 拆分完成后的来源提示，若干秒后自动清除 */
  const [splitStatusMessage, setSplitStatusMessage] = useState('');
  const splitStatusTimerRef = useRef(null);

  useEffect(() => () => {
    if (splitStatusTimerRef.current) clearTimeout(splitStatusTimerRef.current);
  }, []);

  const saveFixedKeywords = (value) => {
    setFixedKeywords(value);
    try {
      localStorage.setItem(SCRIPT_LLM_FIXED_KEYWORDS_KEY, value);
    } catch (_) {}
  };

  const saveContextMemory = (value) => {
    setContextMemory(value);
    try {
      localStorage.setItem(SCRIPT_LLM_CONTEXT_KEY, value);
    } catch (_) {}
  };

  /** 用当前剧本与分镜结果更新上下文记忆（摘要） */
  const updateContextFromCurrent = () => {
    const parts = [];
    if (script.trim()) parts.push(`剧本字数：${script.length}；`);
    if (result.length > 0) {
      const totalShots = result.reduce((n, ep) => n + ep.分镜.length, 0);
      parts.push(`当前共 ${result.length} 场、${totalShots} 镜；`);
    }
    if (characters.length > 0) parts.push(`角色数：${characters.length}。`);
    const newContext = parts.length ? (contextMemory ? contextMemory + '\n' : '') + parts.join(' ') : contextMemory;
    saveContextMemory(newContext);
  };

  /** 保存当前为工作项目 */
  const handleSaveProject = () => {
    const name = (projectName || '').trim() || `项目_${new Date().toISOString().slice(0, 10)}`;
    const data = {
      script,
      result,
      characters,
      fixedKeywords,
      contextMemory,
    };
    const list = loadProjects();
    const existing = list.find((p) => p.name === name);
    const entry = {
      id: existing ? existing.id : `p_${Date.now()}`,
      name,
      savedAt: Date.now(),
      data,
    };
    const next = existing ? list.map((p) => (p.name === name ? entry : p)) : [...list, entry];
    saveProjects(next);
    setProjects(next);
    setProjectName('');
    setShowSaveProject(false);
  };

  /** 加载工作项目 */
  const loadProject = (project) => {
    if (!project?.data) return;
    const d = project.data;
    setScript(d.script ?? '');
    setResult(d.result ?? []);
    setCharacters(d.characters ?? []);
    setFixedKeywords(d.fixedKeywords ?? '');
    setContextMemory(d.contextMemory ?? '');
    try {
      localStorage.setItem(SCRIPT_LLM_FIXED_KEYWORDS_KEY, d.fixedKeywords ?? '');
      localStorage.setItem(SCRIPT_LLM_CONTEXT_KEY, d.contextMemory ?? '');
    } catch (_) {}
    setExpandedEpisode(null);
  };

  /** 新建项目（清空当前） */
  const handleNewProject = () => {
    setScript('');
    setResult([]);
    setCharacters([]);
    setExpandedEpisode(null);
    setProjectName('');
    setShowSaveProject(false);
  };

  const deleteProject = (id) => {
    const next = projects.filter((p) => p.id !== id);
    saveProjects(next);
    setProjects(next);
  };

  /** 收集可用的剧本文件（支持从 file list 或 folder 选中的文件），按名称排序 */
  const collectScriptFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => SCRIPT_EXT.test(f.name || ''));
    return files.sort((a, b) => (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name));
  };

  const processFiles = async (fileList) => {
    const files = collectScriptFiles(fileList);
    if (files.length === 0) {
      setUploadError('未包含支持的剧本文件（.txt / .md / .doc / .docx）');
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      const texts = await Promise.all(files.map(readScriptFile));
      setScript(texts.join('\n\n'));
    } catch (e) {
      setUploadError(e?.message || '读取文件失败');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onFileChange = (e) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  const onFolderChange = (e) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  const handleSplit = () => {
    if (!script.trim()) return;
    if (splitStatusTimerRef.current) clearTimeout(splitStatusTimerRef.current);
    setSplitStatusMessage('');
    setLoading(true);
    setResult([]);
    setExpandedEpisode(null);
    /** 发给大模型时的完整输入：任务指令（分集→人物→场景 11 要素）+ 固定关键词 + 上下文记忆 + 剧本 */
    const parts = ['【任务说明】\n' + SCRIPT_LLM_TASK_PROMPT];
    if (fixedKeywords.trim()) parts.push('【固定关键词】\n' + fixedKeywords.trim());
    if (contextMemory.trim()) parts.push('【上下文】\n' + contextMemory.trim());
    parts.push('【剧本】\n' + script);
    const fullPromptForLLM = parts.join('\n\n');

    const requestConfig = getScriptLLMRequestConfig();
    const showStatus = (msg) => {
      setSplitStatusMessage(msg);
      splitStatusTimerRef.current = setTimeout(() => {
        setSplitStatusMessage('');
        splitStatusTimerRef.current = null;
      }, 5000);
    };

    if (requestConfig?.url) {
      fetch(requestConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(requestConfig.apiKey && { Authorization: `Bearer ${requestConfig.apiKey}` }),
        },
        body: JSON.stringify({
          prompt: fullPromptForLLM,
          fixedKeywords: fixedKeywords.trim() || undefined,
          contextMemory: contextMemory.trim() || undefined,
          script: script.trim(),
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`请求失败: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          /** 期望返回 { episodes: [...], characters?: [...] }，任务说明要求先分集→人物→场景，后端可同时返回角色 */
          const rawEpisodes = Array.isArray(data.episodes) ? data.episodes : data.data?.episodes;
          const rawCharacters = Array.isArray(data.characters) ? data.characters : data.data?.characters;
          if (rawEpisodes?.length) {
            const episodes = rawEpisodes.map((ep) => ({
              剧集: ep.剧集 ?? ep.episode ?? ep.name ?? '场',
              分镜: (Array.isArray(ep.分镜) ? ep.分镜 : ep.shots || []).map(normalizeShot),
            }));
            setResult(episodes);
            if (episodes.length > 0) setExpandedEpisode(0);
            if (rawCharacters?.length) {
              const list = rawCharacters.map((c) => {
                const row = defaultCharacter();
                CHARACTER_FIELDS.forEach((f) => { if (c[f.key] != null) row[f.key] = String(c[f.key]); });
                return row;
              });
              setCharacters(list);
            }
            showStatus('已使用大模型拆分');
          } else {
            runLocalSplit();
            showStatus('大模型返回格式不符，已用本地规则拆分');
          }
        })
        .catch(() => {
          runLocalSplit();
          showStatus('请求失败，已改用本地规则拆分');
        })
        .finally(() => setLoading(false));
    } else {
      runLocalSplit();
      showStatus('已使用本地规则拆分（未配置 API）');
    }

    /** 无 API 或请求失败时使用的本地规则拆分 */
    function runLocalSplit() {
      const lines = script
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const episodes = [];
      let currentEpisode = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isEpisodeTitle =
          /^第[一二三四五六七八九十\d]+[集场]/.test(line) ||
          /^[Scene|场景]\s*\d+/i.test(line) ||
          /^[INT|EXT]\./.test(line);
        if (isEpisodeTitle && line.length < 40) {
          currentEpisode = { 剧集: line, 分镜: [] };
          episodes.push(currentEpisode);
        } else if (currentEpisode) {
          currentEpisode.分镜.push(parseShotFromLine(line));
        } else {
          if (!currentEpisode) {
            currentEpisode = { 剧集: `场 ${episodes.length + 1}`, 分镜: [] };
            episodes.push(currentEpisode);
          }
          currentEpisode.分镜.push(parseShotFromLine(line));
        }
      }
      if (episodes.length === 0 && lines.length > 0) {
        episodes.push({
          剧集: '场 1',
          分镜: lines.map(parseShotFromLine),
        });
      }
      setResult(episodes);
      setLoading(false);
      if (episodes.length > 0) setExpandedEpisode(0);
    }
  };

  /** 更新某条分镜的色调/画面风格并重算 prompt */
  const updateShot = (epIdx, shotIdx, updates) => {
    setResult((prev) => {
      const next = prev.map((ep, ei) => {
        if (ei !== epIdx) return ep;
        return {
          ...ep,
          分镜: ep.分镜.map((s, si) => {
            if (si !== shotIdx) return s;
            const updated = { ...s, ...updates };
            updated.prompt = buildPromptFromShot(updated);
            return updated;
          }),
        };
      });
      return next;
    });
  };

  /** 将角色列表格式化为一段摘要，用于拼入分镜 prompt */
  const buildCharacterSummary = () => {
    const parts = characters
      .filter((c) => c['姓名'] || CHARACTER_FIELDS.some((f) => f.key !== '姓名' && c[f.key]))
      .map((c) => {
        const segs = CHARACTER_FIELDS.map((f) => (c[f.key] ? `${f.key}:${c[f.key]}` : '')).filter(Boolean);
        return segs.length ? segs.join('，') : null;
      })
      .filter(Boolean);
    return parts.length ? `【角色设定】${parts.join('；')}。` : '';
  };

  /** 大模型提取角色信息：若配置了 charactersEndpoint 则请求 API，否则本地规则模拟 */
  const handleExtractCharacters = () => {
    if (!script.trim()) return;
    setCharacterLoading(true);
    const cfg = getScriptLLMRequestConfig();
    if (cfg?.charactersUrl) {
      fetch(cfg.charactersUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cfg.apiKey && { Authorization: `Bearer ${cfg.apiKey}` }),
        },
        body: JSON.stringify({
          taskInstruction: SCRIPT_LLM_CHARACTER_TASK_PROMPT,
          script: script.trim(),
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`请求失败: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          const raw = Array.isArray(data.characters) ? data.characters : data.data?.characters;
          if (raw?.length) {
            const list = raw.map((c) => {
              const row = defaultCharacter();
              CHARACTER_FIELDS.forEach((f) => { if (c[f.key] != null) row[f.key] = String(c[f.key]); });
              return row;
            });
            setCharacters(list);
          } else {
            runLocalExtractCharacters();
          }
        })
        .catch(() => runLocalExtractCharacters())
        .finally(() => setCharacterLoading(false));
    } else {
      runLocalExtractCharacters();
    }

    function runLocalExtractCharacters() {
      const names = [];
      const nameRe = /[一二三四五六七八九十百千\d]+[岁]|(?:主角|配角|男主|女主|父亲|母亲|老师|医生|小明|小红|张三|李四|王五|阿强|小美)(?=[\s：:出场])/g;
      let m;
      while ((m = nameRe.exec(script)) !== null) names.push(m[0].replace(/[\s：:出场]+$/, ''));
      const unique = [...new Set(names)];
      const ageRe = /(\d{1,3})\s*岁/g;
      const ages = [];
      while ((m = ageRe.exec(script)) !== null) ages.push(m[1] + '岁');
      const defaultAges = [...new Set(ages)].slice(0, 3);
      const list = unique.length
        ? unique.slice(0, 8).map((name, i) => ({
            ...defaultCharacter(),
            姓名: name,
            年龄: defaultAges[i] || '',
          }))
        : [{ ...defaultCharacter(), 姓名: '主角', 年龄: '' }, { ...defaultCharacter(), 姓名: '配角', 年龄: '' }];
      setCharacters(list);
      setCharacterLoading(false);
    }
  };

  const updateCharacter = (idx, updates) => {
    setCharacters((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...updates } : c))
    );
  };

  const addCharacter = () => setCharacters((prev) => [...prev, defaultCharacter()]);
  const removeCharacter = (idx) => setCharacters((prev) => prev.filter((_, i) => i !== idx));

  /** 批量传递到文生图：汇总所有分镜 prompt（含角色设定），写入 sessionStorage 并跳转 */
  const handleBatchToImage = () => {
    const characterPrefix = buildCharacterSummary();
    const list = [];
    result.forEach((ep) => {
      ep.分镜.forEach((shot, i) => {
        list.push({
          prompt: characterPrefix ? characterPrefix + shot.prompt : shot.prompt,
          镜号: i + 1,
          剧集: ep.剧集,
        });
      });
    });
    if (list.length === 0) return;
    try {
      sessionStorage.setItem(SCRIPT_BATCH_STORAGE_KEY, JSON.stringify(list));
      navigate('/ai-tool/image/generate', {
        state: { prompt: list[0].prompt, batchFromScript: true, batchIndex: 0, batchTotal: list.length },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const passToImage = (prompt) => {
    navigate('/ai-tool/image/generate', { state: { prompt } });
  };
  const passToVideo = (prompt) => {
    navigate('/ai-tool/video', { state: { prompt } });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 影视化标题区 + 工作项目 */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-amber-500/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-white md:text-3xl">
            大模型 · 剧本与分镜
          </h1>
          <p className="mt-1 text-sm text-amber-200/80">
            景别 · 构图 · 运镜 · 演员调度 · 光线 · 内外镜 · 现场音 · 画外音 · 特效 · 色调 · 画面风格
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">工作项目</span>
          <select
            value=""
            onChange={(e) => {
              const id = e.target.value;
              if (!id) return;
              const p = projects.find((x) => x.id === id);
              if (p) loadProject(p);
              e.target.value = '';
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/30 focus:outline-none"
          >
            <option value="">选择已保存项目…</option>
            {[...projects].sort((a, b) => b.savedAt - a.savedAt).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}（{new Date(p.savedAt).toLocaleDateString()}）
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowSaveProject((v) => !v)}
            className="rounded-lg bg-amber-600/80 px-3 py-2 text-sm text-white hover:bg-amber-500"
          >
            保存项目
          </button>
          <button
            type="button"
            onClick={handleNewProject}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10"
          >
            新建项目
          </button>
        </div>
      </div>

      {showSaveProject && (
        <Card className="mb-6 flex flex-row flex-wrap items-end gap-3 p-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs text-zinc-500">项目名称</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="输入项目名称后保存"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-amber-500/30 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveProject}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-500"
          >
            保存
          </button>
          <button
            type="button"
            onClick={() => { setShowSaveProject(false); setProjectName(''); }}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-zinc-400 hover:bg-white/10"
          >
            取消
          </button>
        </Card>
      )}

      {/* 大模型固定关键词：仅用于拆分剧集/分镜时加入提示词，不影响文生图、文生视频 */}
      <Card className="mb-6 overflow-hidden border-amber-500/10 p-0">
        <div className="border-b border-white/10 bg-white/[0.02] px-4 py-2">
          <span className="text-xs font-medium uppercase tracking-wider text-amber-400/90">
            大模型固定关键词
          </span>
          <p className="mt-0.5 text-xs text-zinc-500">
            会固定加入每次「大模型拆分」的提示词（任务说明已包含：先分集→人物形象→场景设计，分镜含景别·构图·运镜·演员调度·光线·内外镜·现场音·画外音·特效·色调·画面风格）。此处可追加风格、术语等补充要求。
          </p>
        </div>
        <textarea
          value={fixedKeywords}
          onChange={(e) => saveFixedKeywords(e.target.value)}
          placeholder="例如：短剧风格；严格影视工业术语；输出 JSON 含 episodes[].分镜[].描述 及上述 11 要素……"
          rows={3}
          className="w-full resize-y border-0 bg-transparent px-4 py-3 text-sm text-slate-200 placeholder:text-zinc-600 focus:outline-none focus:ring-0"
        />
      </Card>

      {/* 大模型上下文记忆：每次请求会一并发给大模型，便于连续创作 */}
      <Card className="mb-6 overflow-hidden border-amber-500/10 p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-2">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-amber-400/90">
              上下文记忆
            </span>
            <p className="mt-0.5 text-xs text-zinc-500">
              以下内容会在每次「大模型拆分」时一并发给大模型，作为上下文；可手动填写或点击「用当前结果更新」自动追加摘要
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={updateContextFromCurrent}>
            用当前结果更新
          </Button>
        </div>
        <textarea
          value={contextMemory}
          onChange={(e) => saveContextMemory(e.target.value)}
          placeholder="例如：上一场为室内日景；主角已出场；当前为第2场……"
          rows={3}
          className="w-full resize-y border-0 bg-transparent px-4 py-3 text-sm text-slate-200 placeholder:text-zinc-600 focus:outline-none focus:ring-0"
        />
      </Card>

      {/* 剧本上传：支持 .txt / .md / .doc / .docx，拖拽或选择文件/文件夹 */}
      <Card className="mb-6 overflow-hidden border-amber-500/10 p-0">
        <div className="border-b border-white/10 bg-white/[0.02] px-4 py-2">
          <span className="text-xs font-medium uppercase tracking-wider text-amber-400/90">
            剧本上传
          </span>
          <p className="mt-0.5 text-xs text-zinc-500">
            支持 .txt、.md、.doc、.docx；可拖拽文件/文件夹到下方区域，或点击按钮选择
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={SCRIPT_ACCEPT}
          multiple
          className="hidden"
          onChange={onFileChange}
        />
        <input
          ref={folderInputRef}
          type="file"
          accept={SCRIPT_ACCEPT}
          className="hidden"
          webkitDirectory
          onChange={onFolderChange}
        />
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative border-2 border-dashed px-4 py-8 transition-colors ${
            isDragging ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/15 bg-white/[0.02]'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <span className="text-4xl text-amber-400/70">📄</span>
            <p className="text-sm text-zinc-400">
              将剧本文件或文件夹拖拽到此处，或
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? '读取中…' : '选择文件'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={uploading}
                onClick={() => folderInputRef.current?.click()}
              >
                选择文件夹
              </Button>
            </div>
            <p className="text-xs text-zinc-500">
              .txt · .md · .doc · .docx
            </p>
          </div>
        </div>
        {uploadError && (
          <div className="border-t border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {uploadError}
          </div>
        )}
      </Card>

      {/* 剧本输入区 - 影视剧本风格 */}
      <Card className="mb-8 overflow-hidden border-amber-500/10 p-0">
        <div className="border-b border-white/10 bg-white/[0.02] px-4 py-2">
          <span className="text-xs font-medium uppercase tracking-wider text-amber-400/90">
            剧本正文
          </span>
          <p className="mt-0.5 text-xs text-zinc-500">
            可包含场次、景别、内外景、运镜、光线等标注，大模型将拆分为分镜表并生成生图/生视频 prompt；也可从上方向导入手稿
          </p>
        </div>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder={`示例：\n场1 内景 教室 日\n全景。教室空无一人，阳光从窗户斜射。\n推镜至讲台。黑板上写满公式。\n特写。一只手拿起粉笔。\n画外音：多年以后…\n现场音：脚步声、风声。`}
          rows={12}
          className="w-full resize-y border-0 bg-transparent px-4 py-4 font-mono text-sm leading-relaxed text-slate-200 placeholder:text-zinc-600 focus:outline-none focus:ring-0"
        />
        <div className="flex flex-col gap-2 border-t border-white/10 bg-white/[0.02] px-4 py-3">
          {splitStatusMessage && (
            <p className="text-xs text-amber-400/90" role="status">
              {splitStatusMessage}
            </p>
          )}
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSplit}
              disabled={loading || !script.trim()}
              className="bg-amber-600 hover:bg-amber-500"
            >
              {loading
                ? (getScriptLLMRequestConfig()?.url ? '正在请求大模型…' : '拆分中…')
                : '大模型拆分 · 生成分镜表'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 角色信息：大模型提取恒定人物设定，可编辑，批量成图时会带入每镜 prompt */}
      <Card className="mb-8 overflow-hidden border-amber-500/10 p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-amber-400/90">
              角色信息（人物刻画）
            </span>
            <p className="mt-0.5 text-xs text-zinc-500">
              年龄、装扮、道具、身份、容貌、身高、身材、癖好等恒定设定，批量生成分镜图时会自动带入
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={characterLoading || !script.trim()}
              onClick={handleExtractCharacters}
            >
              {characterLoading ? '提取中…' : '大模型提取角色信息'}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={addCharacter}>
              添加角色
            </Button>
          </div>
        </div>
        {characters.length > 0 && (
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((char, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-400/90">角色 {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeCharacter(idx)}
                    className="text-xs text-zinc-500 hover:text-red-400"
                  >
                    移除
                  </button>
                </div>
                <div className="space-y-2">
                  {CHARACTER_FIELDS.map(({ key, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs text-zinc-500">{key}</label>
                      <input
                        type="text"
                        value={char[key] || ''}
                        onChange={(e) => updateCharacter(idx, { [key]: e.target.value })}
                        placeholder={placeholder}
                        className="mt-0.5 w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/30 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 分镜表结果 - 影视化表格/卡片 */}
      {result.length > 0 && (
        <Card className="overflow-hidden border-amber-500/10 p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400/90">
              分镜表 · 可传递至文生图 / 文生视频
            </h2>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleBatchToImage}
              className="bg-amber-600 hover:bg-amber-500"
            >
              批量生成分镜图（逐镜发往文生图）
            </Button>
          </div>
          <div className="divide-y divide-white/5">
            {result.map((ep, idx) => (
              <div key={idx} className="bg-white/[0.01]">
                <button
                  type="button"
                  onClick={() => setExpandedEpisode(expandedEpisode === idx ? null : idx)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/[0.03]"
                >
                  <span className="font-medium text-white">{ep.剧集}</span>
                  <span className="text-xs text-zinc-500">
                    {expandedEpisode === idx ? '▾' : '▸'} {ep.分镜.length} 镜
                  </span>
                </button>
                {expandedEpisode === idx && (
                  <div className="border-t border-white/10 px-4 pb-4 pt-2">
                    {ep.分镜.map((shot, i) => (
                      <div
                        key={i}
                        className="mb-4 overflow-hidden rounded-lg border border-white/10 bg-zinc-900/50 last:mb-0"
                      >
                        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-2">
                          <span className="text-xs font-medium text-amber-400/90">镜 {i + 1}</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => passToImage(shot.prompt)}
                              className="rounded bg-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-amber-500/20 hover:text-amber-200"
                            >
                              文生图
                            </button>
                            <button
                              type="button"
                              onClick={() => passToVideo(shot.prompt)}
                              className="rounded bg-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-amber-500/20 hover:text-amber-200"
                            >
                              文生视频
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-x-4 gap-y-2 p-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          {SHOT_FIELDS.map(({ key, placeholder }) => (
                            <div key={key} className="flex flex-col gap-0.5">
                              <span className="text-xs text-zinc-500">{key}</span>
                              <span className="text-zinc-300">
                                {shot[key] || (
                                  <span className="italic text-zinc-600">—</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-4 border-t border-white/10 px-3 py-3 sm:gap-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-zinc-500">色调</span>
                            <select
                              value={shot['色调'] || ''}
                              onChange={(e) => updateShot(idx, i, { 色调: e.target.value })}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none"
                            >
                              {COLOR_TONES.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-zinc-500">画面风格</span>
                            <select
                              value={shot['画面风格'] || ''}
                              onChange={(e) => updateShot(idx, i, { 画面风格: e.target.value })}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500/50 focus:outline-none"
                            >
                              {VISUAL_STYLES.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="border-t border-white/10 px-3 py-2">
                          <span className="text-xs text-zinc-500">描述 / 综合 prompt</span>
                          <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                            {shot.prompt || shot['描述']}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
