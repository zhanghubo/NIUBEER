# UI 组件库（可替换）

本文件夹用于存放**可替换的 UI 组件**。如需更换整体视觉风格，只需替换此目录下的组件实现即可，无需改动页面逻辑。

## 组件列表

| 组件 | 文件 | 说明 |
|------|------|------|
| Button | Button.jsx | 主按钮、次要按钮、幽灵按钮 |
| Card | Card.jsx | 通用卡片容器 |
| Input | Input.jsx | 文本输入框 |
| Tab | Tab.jsx | 标签页切换 |
| Modal | Modal.jsx | 弹窗 |
| Badge | Badge.jsx | 徽标/标签 |

## 替换指南

1. 保留组件导出的 **props 接口** 不变（如 `variant`, `children`, `onClick` 等）
2. 在组件内部替换为你的设计系统的样式类名或样式对象
3. 若使用 CSS Modules / Tailwind / 其他方案，在此目录内维护即可
