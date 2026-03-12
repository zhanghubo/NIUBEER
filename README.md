# 猛兽影 AI — 一站式 AI 创作平台

## 一、项目概述

**猛兽影 AI** 是一个前端 SaaS 创作平台，支持 AI 剧本拆分、文生图、视频生成、数字人等能力。  
前端基于 React 18 + Vite 5 + Tailwind CSS 构建，后端通过 API 配置页灵活对接各类大模型与生成服务。

- **品牌色**：绿色（`#22c55e`）
- **品牌 Slogan**：梦想无疆 影像成真
- **设计风格**：深色毛玻璃（Glass Morphism）+ 动态光球背景 + 电路科技纹理

---

## 二、技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 18.2 |
| 构建 | Vite | 5.1 |
| 样式 | Tailwind CSS | 3.4 |
| 路由 | React Router DOM | 6.22 |
| 文档解析 | mammoth（按需加载） | 1.6 |
| 包管理 | npm | - |

---

## 三、安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 3. 生产构建
npm run build

# 4. 预览生产构建
npm run preview
```

---

## 四、目录结构

```
NIUBEER/
├── public/                       # 静态资源
│   ├── logo.png                  # 品牌 Logo（透明背景 PNG）
│   ├── circuit-pattern.svg       # 电路科技纹背景（SVG 平铺）
│   └── favicon.svg               # 浏览器标签图标
├── src/
│   ├── main.jsx                  # 应用入口
│   ├── App.jsx                   # 路由配置（懒加载 + Suspense）
│   ├── styles/
│   │   └── index.css             # 全局样式（Tailwind + 自定义动效）
│   ├── context/
│   │   └── AuthContext.jsx       # 登录状态管理（Context + localStorage）
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthGuard.jsx     # 登录守卫（未登录跳转 /login）
│   │   ├── layout/
│   │   │   ├── Header.jsx        # 顶部导航栏（Logo + 菜单 + 登录信息）
│   │   │   └── MainLayout.jsx    # 主布局（动态背景 + 导航 + 内容区）
│   │   └── ui/                   # 通用 UI 组件
│   │       ├── Badge.jsx         # 标签/徽标
│   │       ├── Button.jsx        # 按钮（primary/ghost/outline）
│   │       ├── Card.jsx          # 卡片容器
│   │       ├── DynamicBackground.jsx  # 动态背景（光球 + 电路图）
│   │       ├── Input.jsx         # 输入框（text/password/textarea）
│   │       ├── Modal.jsx         # 弹窗
│   │       └── Tab.jsx           # 选项卡
│   └── pages/
│       ├── LandingPage.jsx       # 官网落地页（Hero + 功能亮点 + CTA）
│       ├── LoginPage.jsx         # 登录页
│       ├── HomePage.jsx          # 首页（Agent 模式入口 + 功能卡片）
│       ├── ScriptLLMPage.jsx     # 大模型·剧本（剧本拆分 + 角色提取）
│       ├── ImageGeneratePage.jsx # 文生图（Cinema Studio 风格）
│       ├── VideoGeneratePage.jsx # 视频生成（多模式 + 画质/格式/编码）
│       ├── DigitalHumanPage.jsx  # 数字人（单图视频 + 推流直播）
│       ├── ApiPage.jsx           # API 对接（配置 + 连通检测）
│       └── DeveloperLandingPage.jsx # 开发者落地页
├── index.html                    # HTML 入口
├── vite.config.js                # Vite 构建配置
├── tailwind.config.js            # Tailwind 配置
├── postcss.config.js             # PostCSS 配置
├── package.json                  # 依赖与脚本
└── README.md                     # 本文档
```

---

## 五、页面功能详细说明

### 5.1 落地页（`/`）

- Hero 区：品牌 Logo + Slogan + CTA 按钮
- 功能亮点：AI 图片生成、AI 视频生成、数字人
- 操作引导：注册 → 选择能力 → 一句话创作
- 动态背景：绿色光球漂移 + 呼吸 + 电路科技纹理

### 5.2 登录页（`/login`）

- 用户名 + 密码登录（演示模式：任意用户名即可进入）
- 密码字段已正确使用 `type="password"` 隐藏输入
- 登录状态通过 `AuthContext` 全局管理，持久化到 `localStorage`

### 5.3 首页（`/ai-tool/home`）

- **Agent 模式**：输入关键词 → 推送给大模型进行文生视频
- 副标题：「梦想无疆 影像成真」
- 功能卡片：大模型·剧本、图片生成、视频生成、数字人、动作模仿、API 对接
- 创作/活动 Tab 切换

### 5.4 大模型·剧本（`/ai-tool/script`）

**结构**：分集 → 人物 → 场景（11 要素）

**功能**：
- 上传剧本文件（.txt / .md / .docx），mammoth 按需动态加载解析 docx
- **AI 剧本拆分**：调用 `scriptLLM.baseUrl` + `scriptLLM.endpoint`，将剧本拆分为剧集/分镜
- **AI 角色提取**：调用 `scriptLLM.charactersEndpoint`，自动识别角色信息
- 分镜 11 要素：景别、构图、运镜、演员调度、色调、光影、机位、特效、备注等
- 固定关键词 + 上下文记忆 + 工作项目：本地保存，拼入请求体
- 分镜批量导出到文生图：一键跳转带上 prompt 列表

### 5.5 文生图（`/ai-tool/image/generate`）

**Cinema Studio 风格界面**

**用户可配置项**：
| 设置 | 选项 | 是否写入提示词 |
|------|------|:---:|
| 比例 | 21:9 / 16:9 / 9:16 / 1:1 / 4:3 / 3:4 | ✅ |
| 画质 | 标准 1K / 高清 2K / 超清 4K | ❌（payload 字段） |
| 摄影-机型 | Studio Digital S35 / 全画幅 / APS-C / Super 35 / 大画幅 | ✅ |
| 摄影-镜头 | Warm Cinema Prime / Anamorphic / Standard Prime 等 | ✅ |
| 摄影-焦距 | 自由输入（mm） | ✅ |
| 摄影-光孔 | f/1.4 ~ f/22 | ✅ |

**提示词拼接规则**：
```
用户输入的描述文案
[设置] 比例 21:9 | 摄影 Full Frame, Warm Cinema Prime, 50mm, f/2.8
```

- 推荐预设：电影变形宽银幕、暖调定焦、人像特写
- T 按钮：在光标位置插入 `""`，引号内为画面中显示的文字
- 参考图上传：多图参考
- 预览区：显示发送给 AI 的完整提示词 + 生成结果

### 5.6 视频生成（`/ai-tool/video`）

**四种模式**：全能参考 / 首尾帧 / 智能多帧 / 主体参考

**用户可配置项**：
| 设置 | 选项 | 是否写入提示词 |
|------|------|:---:|
| 比例 | 21:9 / 16:9 / 9:16 / 1:1 / 4:3 / 3:4（带缩略图） | ✅ |
| 时长 | 5s ~ 15s | ✅ |
| 模式 | 全能参考 / 首尾帧 / 智能多帧 / 主体参考 | ✅ |
| 画质 | 高清 / 2K / 4K | ❌（payload 字段） |
| 格式 | MOV / MP4 | ❌（payload 字段） |
| 编码 | H.264 / H.265 | ❌（payload 字段） |

**提示词拼接规则**：
```
用户输入的描述文案
[设置] 比例 21:9 | 时长 10s | 模式 首尾帧
```

**API 请求 payload**：
```json
{
  "prompt": "用户描述\n[设置] 比例 21:9 | 时长 10s | 模式 首尾帧",
  "duration": 10,
  "aspectRatio": "21:9",
  "resolution": "2k",
  "format": "mov",
  "codec": "h265",
  "frameMode": "firstLast"
}
```

- 全能参考：@ 关联已上传参考图/视频，contentEditable 富文本
- 首尾帧：双槽上传首帧/尾帧
- 生成结果卡片：参考缩略图 + 视频预览 + 下载 + 详细参数

### 5.7 数字人（`/ai-tool/digital-human`）

**双模式**：
1. **单图视频生成**：上传角色图 + 说话内容 + 动作描述 → 生成数字人视频
2. **推流直播**：配置推流地址/密钥 → 实时数字人直播

**输出设置**：
| 设置 | 选项 | 传递方式 |
|------|------|---------|
| 画质 | 高清 / 2K / 4K | payload `resolution` 字段 |
| 格式 | MOV / MP4 | payload `format` 字段 |
| 编码 | H.264 / H.265 | payload `codec` 字段 |

- 离开页面前提示（推流中防误关）
- 角色形象 + 音色选择 + 说话文案 + 动作描述

### 5.8 API 对接（`/ai-tool/api`）

**配置结构**：
```
通用 Base URL（视频/图/数字人共用）
├── API Key（可选 Bearer Token）
├── 图片生成端点（默认 /v1/image/generate）
├── 视频生成端点（默认 /v1/video/generate）
└── 数字人端点（默认 /v1/digital-human）

剧作大模型（可配独立 Base URL）
├── 拆分端点（默认 /v1/script/breakdown）
└── 角色提取端点（可选 /v1/script/characters）
```

**连通检测功能**：
- 每个服务独立「⚡ 检测连通」按钮 + 圆形指示灯
- 🟢 绿灯 + 光晕脉冲 = 已连通
- 🔴 红灯 + 光晕脉冲 = 连接失败（hover 显示原因）
- 🔵 旋转圈 = 检测中
- ⚫ 灰色 = 未检测
- 「🔌 一键检测全部服务」：并发检测所有已启用服务，互不阻塞
- 探测方式：HEAD → GET → POST 逐级尝试，8s 超时，401/403 视为连通

**配置存储**：`localStorage` 键名 `jiangying_api_config`

---

## 六、提示词与 API 参数设计原则

### 写入提示词的设置（AI 能理解）
- **比例**（21:9 等）：影响构图
- **摄影参数**（机型/镜头/焦距/光孔）：影响画面风格与景深
- **时长**：部分模型可通过提示词理解
- **生成模式**：让 AI 了解参考方式

### 仅通过 payload 字段传递的设置（后端处理）
- **画质/分辨率**（高清/2K/4K）：由模型推理分辨率 + 后端缩放决定
- **封装格式**（MOV/MP4）：后端编码器选择
- **编码格式**（H.264/H.265）：后端编码器选择

---

## 七、性能优化

| 优化项 | 说明 |
|-------|------|
| **React.lazy 按需加载** | 9 个页面全部懒加载，首次只下载当前页 JS |
| **Suspense 加载动画** | 页面切换时显示品牌风格加载指示器 |
| **mammoth 动态 import** | 478KB 的 docx 解析库仅在上传 .docx 时才下载 |
| **vendor 分包** | React 核心 + 路由库独立打包，浏览器长期缓存 |
| **CSS 动画** | 背景动效全用 CSS（不用 JS 定时器），不阻塞主线程 |

**构建产物体积**：

| 文件 | 大小 | 说明 |
|------|------|------|
| 入口 JS | ~9 KB | App 框架 + 路由配置 |
| vendor-react | ~0.04 KB | React 运行时 |
| vendor-router | ~163 KB | React Router（可缓存） |
| 各页面 | 1~27 KB | 按需加载 |
| mammoth | ~494 KB | 仅上传 docx 时加载 |
| CSS | ~35 KB | 全局样式 |

---

## 八、视觉效果

### 动态背景
- **5 个绿色光球**：不同大小、位置，缓慢漂移 + 呼吸动画（6~12 秒循环）
- **电路科技纹理**：SVG 平铺（网格 + 走线 + 节点），opacity 0.6
- **光照层**：与光球同步的 5 个光斑，`mix-blend-mode: screen`，光球经过时电路被照亮

### 品牌元素
- Logo：透明背景 PNG，导航栏高度自适应（`--header-h` CSS 变量控制）
- 主色：`#22c55e`（Emerald 500）
- 毛玻璃：`backdrop-filter: blur(24px)` + 半透明白色背景

---

## 九、本地存储说明

| 键名 | 用途 | 页面 |
|------|------|------|
| `jiangying_api_config` | API 配置（Base URL、API Key、各端点） | API 对接 |
| `jiangying_auth_user` | 登录用户名 | 全局 |
| `jiangying_script_fixed_keywords` | 剧作固定关键词 | 大模型·剧本 |
| `jiangying_script_context_memory` | 剧作上下文记忆 | 大模型·剧本 |
| `jiangying_script_project` | 剧作工作项目名称 | 大模型·剧本 |
| `jiangying_script_batch` | 分镜批量列表（sessionStorage） | 文生图 |

---

## 十、路由表

| 路径 | 页面 | 权限 |
|------|------|------|
| `/` | 落地页 | 公开 |
| `/dev` | 开发者落地页 | 公开 |
| `/login` | 登录页 | 公开 |
| `/ai-tool/home` | 首页 | 需登录 |
| `/ai-tool/script` | 大模型·剧本 | 需登录 |
| `/ai-tool/image/generate` | 文生图 | 需登录 |
| `/ai-tool/video` | 视频生成 | 需登录 |
| `/ai-tool/digital-human` | 数字人 | 需登录 |
| `/ai-tool/api` | API 对接 | 需登录 |

---

## 十一、后端对接指南

### 请求格式

所有 API 请求使用 `POST` + `Content-Type: application/json`。  
如配置了 API Key，请求头会带 `Authorization: Bearer <key>`。

### 图片生成

```
POST {baseUrl}{image.endpoint}

Body:
{
  "prompt": "描述文案\n[设置] 比例 21:9 | 摄影 Full Frame, 50mm, f/2.8",
  "ratio": "21:9",
  "quality": "2k",
  "camera": "Full Frame, Standard Prime, 50mm, f/2.8"
}

期望返回:
{ "imageUrl": "https://..." }
或 { "data": { "imageUrl": "https://..." } }
```

### 视频生成

```
POST {baseUrl}{video.endpoint}

Body:
{
  "prompt": "描述文案\n[设置] 比例 21:9 | 时长 10s | 模式 首尾帧",
  "duration": 10,
  "aspectRatio": "21:9",
  "resolution": "2k",
  "format": "mov",
  "codec": "h265",
  "frameMode": "firstLast"
}

期望返回:
{ "videoUrl": "https://...", "thumbnailUrl": "https://..." }
```

### 数字人

```
POST {baseUrl}{digitalHuman.endpoint}

Body:
{
  "speakContent": "说话内容",
  "actionDesc": "动作描述",
  "resolution": "2k",
  "format": "mp4",
  "codec": "h264"
}

期望返回:
{ "videoUrl": "https://..." }
```

### 剧本拆分

```
POST {scriptLLM.baseUrl}{scriptLLM.endpoint}

Body:
{
  "project": "工作项目名",
  "fixedKeywords": "固定关键词",
  "contextMemory": "上下文记忆",
  "script": "剧本正文..."
}

期望返回:
{
  "episodes": [
    {
      "title": "第一集",
      "shots": [
        { "景别": "全景", "构图": "三分法", "运镜": "推", "prompt": "..." }
      ]
    }
  ]
}
```

### 角色提取

```
POST {scriptLLM.baseUrl}{scriptLLM.charactersEndpoint}

Body: { "script": "剧本正文..." }

期望返回:
{
  "characters": [
    { "name": "张三", "desc": "男，30岁，退役军人" }
  ]
}
```

---

## 十二、常见问题

**Q: 为什么编码格式（H.264/H.265）不写入提示词？**  
A: 编码格式是后端视频编码器（如 FFmpeg）在 AI 生成完原始帧后处理的，AI 模型无法通过提示词控制编码。同理，MOV/MP4 是封装格式，画质是输出分辨率，都由后端决定。

**Q: 为什么剧作大模型和视频/图模型要分开配置？**  
A: 剧作需要文本理解能力（剧本拆分、角色提取），而视频/图需要视觉生成能力，两者是不同模型、不同服务。

**Q: Logo 显示有黑边怎么办？**  
A: 当前 logo 已处理为透明背景。若有缓存，请强制刷新（Cmd+Shift+R）。

**Q: 如何修改导航栏高度和 Logo 大小？**  
A: 修改 `src/styles/index.css` 中 `.header-bar` 的 `--header-h` 变量，Logo 会按 85% 比例自动缩放。

---

*最后更新：2026-02-13*
