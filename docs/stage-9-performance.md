# 阶段 9：性能与体验优化

## 1. 缩略图缓存
- 新增 `useThumbnailCache` 组合式工具（`packages/renderer/src/composables/useThumbnailCache.ts`），通过 `fetch -> createImageBitmap -> OffscreenCanvas` 实际缩放到 256px，并输出高压缩 `webp` 资源，最多保留 400 张
- 虚拟列表根据当前窗口调用 `prefetchMany()`，缓存命中时 `<img>` 直接挂载内存 URL，显著减少原图解码/磁盘 IO
- 缓存具备 LRU 机制和 `retain()`，目录切换时即时清理未使用的 object URL，控制内存占用

## 2. 网格懒加载
- `Viewer.vue` 中的缩略图改为 Skeleton + 渐进加载：未缓存时显示线性渐变骨架，缓存完成后淡入图片，给出更快的视觉反馈
- 虚拟列表 Watchers 针对 `virtualItems` 自动预取当前可见区域及 buffer 区域，滚动时无明显白屏

## 3. 目录自动刷新
- 基于 `chokidar` 的 `DirectoryWatcherModule` 监听当前目录变化，渲染层调用 `window.electron.fs.watchDirectory()`；一旦新增/删除文件，即刻 `refreshCurrentDirectory()`，无需手动刷新

## 4. 结果
- 大目录滚动时 DOM 数量保持在虚拟窗口范围，缩略图切换更流畅
- 重复打开同一目录时缩略图几乎瞬时展示，且文件变动能自动同步
