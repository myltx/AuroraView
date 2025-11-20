# 信息架构（IA）

```
Photon Viewer
├─ Shell / Frame
│  ├─ Titlebar（自定义 window controls、视图切换）
│  └─ Toolbar（搜索、排序、缩略图尺寸、视图模式）
│
├─ Sidebar（Finder-like）
│  ├─ 快捷入口：最近浏览 / 最近修改 / 收藏 / 系统目录
│  ├─ 收藏夹列表（拖拽添加、右键菜单）
│  └─ 本地磁盘与外接设备（可展开目录树）
│
├─ Content Area
│  ├─ Grid Gallery
│  │  ├─ 缩略图网格（虚拟列表 + 缩略图缓存）
│  │  ├─ 子目录卡片（多图拼贴）
│  │  └─ 状态层（空态提示 / Loading / 搜索结果）
│  └─ Empty / Loading states
│
├─ Lightbox Viewer（Overlay）
│  ├─ 主画布（ImageCanvas + 手势操作）
│  ├─ 信息栏（名称、尺寸、EXIF、标签）
│  └─ 工具条（缩放、旋转、翻转、全屏、幻灯、删除等）
│
├─ Services / Stores
│  ├─ FileSystemService（目录扫描 / chokidar / Spotlight）
│  ├─ ThumbnailService（Sharp 缩略图缓存）
│  ├─ FavoritesStore（收藏夹持久化）
│  ├─ GalleryStore（当前目录、排序、选中状态）
│  └─ ViewerStore（当前图片、历史、幻灯 state）
│
└─ System Integration
   ├─ 快捷键 / 手势绑定
   ├─ Finder 分享 / 右键菜单 / 默认查看器
   └─ 自动更新、日志、崩溃上报
```

该架构确保：
- 侧栏管理导航与收藏，Toolbar 负责搜索与全局控制
- Content Area 专注于缩略图栅格，Lightbox 覆盖式展示大图
- Service / Store 层统一封装本地能力（文件系统、缩略图、收藏、查看器状态）
