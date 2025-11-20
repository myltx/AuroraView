# 阶段 5：图片缩略图浏览模块

## 1. 缩略图列表
- 渲染层改为 `GalleryItem` 数据结构，包含 `path/resource/name/extension/modifiedAt/size`
- 目录切换通过 `fs.readDirectory(filter:"images")` 拉取文件列表，映射到缩略图资源 `photon-file://`
- 缩略图网格支持 CSS 变量控制大小，默认 120px，可通过 slider 在 80-220px 范围调节

## 2. 排序与元信息
- 工具栏 `viewer-toolbar` 允许切换排序：名称 A→Z、名称 Z→A、最近修改、文件大小
- 每个缩略图 hover 提示包含扩展名徽章、文件大小、人性化的修改日期

## 3. 查看器联动
- Lightbox 操作条只在放大状态出现，按钮纯图标化，图片自适应画布避免溢出
- 重用 `GalleryItem` 元信息显示当前计数/文件名，后续可扩展 EXIF 信息栏

## 4. 虚拟列表与性能
- 当前采用自研虚拟列表（基于容器宽度/scrollTop 计算可见行，使用上下 spacer），在无需新依赖的情况下即可支撑上千张图片的顺畅滚动
- 后续仍可评估引入 `vue-virtual-scroller` 以复用成熟组件，并结合 IntersectionObserver 进一步优化
- 缩略图缓存（Stage 5.3）计划通过 Sharp 预生成 + 本地缓存索引实现
- Hover 信息层后续可扩展尺寸、标签、评级、收藏状态等
