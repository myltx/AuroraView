# 阶段 2：视觉与布局规范（Modern Minimal）

## 1. 颜色体系
- **主色（Primary）**：`#5C6BC0`（靛蓝），用于按钮、选中状态、缩略图高亮
- **辅色（Accent）**：`#42A5F5`（亮蓝），用于 Hover、强调提示
- **中性色**：
  - 背景 `--color-window`: `#ECEFF5`
  - 内容面 `--color-surface`: `#FFFFFF`
  - 侧栏 `--color-sidebar`: `#F5F5F5`
  - 分隔线 `--color-divider`: `#D9DEEC`
  - 文本 `--color-text`: `#333333`
  - 辅助文字 `--color-muted`: `#666666`
- **暗色模式**：对应变量在 `:root[data-theme="dark"]` 中定义，例如 `--color-window: #0F111A`、`--color-surface: #1A1C26`，保持高对比和柔和阴影

## 2. 布局与留白
- 页面采用 **左侧导航 + 右侧内容** 的三段式布局，`viewer` 高度占满视口，外层不滚动
- 左侧侧栏宽度 260px，背景浅灰，圆角 20px，阴影 `var(--color-shadow)`，用于目录与收藏操作
- 右侧内容区为白色卡片，缩略图区域单独滚动；工具栏/卡片均使用 12px 圆角与 16px 内边距，营造整齐留白

## 3. 组件风格
- **按钮**：圆角 8–10px，描边 `--color-divider`，Hover 时描边与背景切换为辅色
- **侧栏节点**：根据层级推入，选中/拖放状态均以主色描边 + 15% 透明底色表示
- **缩略图**：固定尺寸 80–220px 自适应，卡片背景 `--color-surface`，Hover 加强阴影，选中状态使用主色描边/阴影
- **工具栏**：白色/毛玻璃卡片，阴影 `var(--color-shadow)`，文字全部使用大写 Label + 0.2em 字间距

## 4. 动态主题
- 通过 `document.documentElement.dataset.theme = "light" | "dark"` 控制 CSS 变量
- 主进程监听 `nativeTheme`，渲染层自动更新 data-theme，确保与 macOS 深浅色同步
