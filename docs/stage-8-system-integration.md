# 阶段 8：系统适配与集成

## 1. 深色模式
- 主进程新增 `SystemThemeModule`，通过 `nativeTheme.shouldUseDarkColors` 与 `theme:updated` IPC 广播系统主题
- 预加载暴露 `window.electron.theme.get/onDidChange`，渲染层 `useSystemTheme()` 在启动时拉取当前主题并监听变化
- 全局样式改为 `:root[data-theme="light"|"dark"]` 定义变量，确保即时切换背景、文本、阴影与主色

## 2. 目录实时监听
- `DirectoryWatcherModule` 基于 `chokidar` 监听已打开目录，按 WebContents 维度管理 watcher
- `window.electron.fs.watchDirectory(path, handler)` 可在渲染层注册回调，`Viewer.vue` 选中目录后自动订阅，文件新增/删除即时刷新缩略图

## 3. Finder 集成（基础）
- 通过 `window.electron.fileOps.reveal()` 支持从工具栏在 Finder 中定位文件
- 目录监听 + 深色模式同步形成 macOS 原生态体验；后续可在此基础上扩展 Finder 右键插件与默认查看器注册
