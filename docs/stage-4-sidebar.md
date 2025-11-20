# 阶段 4：Sidebar（目录树模块）

## 1. 本地文件系统读取
- 主进程新增 `FileSystemService` + `fs:read-directory` IPC，支持按需加载目录（可过滤图片/隐藏文件）
- 预加载暴露 `window.electron.fs`，渲染层调用时不再直接接触 Node API

## 2. 目录树渲染
- Sidebar 采用 Finder 式布局，分为收藏夹与系统目录两段
- 节点支持展开/折叠，按需加载子目录，缩进随层级自动调节
- 选择目录后立即读取该路径下的图片并更新右侧缩略图

## 3. 收藏夹（持久化）
- 主进程实现 `FavoritesStore`，将收藏写入 `userData/favorites.json`
- IPC：`favorites:list/add/remove`，渲染层可添加/移除收藏，状态即时更新
- 收藏节点在 Sidebar 顶部显示，并提供移除按钮

## 4. 当前限制与后续
- 仍使用按钮添加收藏，后续可扩展拖拽/右键菜单
- 未实现目录自动监听（计划在阶段 8 接入 `chokidar`）
- 收藏条目当前仅包含名称/路径，后期可加入标签与排序

> 阶段 4 交付：具备可用的 Finder 风格侧栏，可浏览系统目录树并管理收藏。
