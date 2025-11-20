# 阶段 6：Viewer 动效与手势

## 1. 查看器基础
- Lightbox 采用独立遮罩层，信息条展示当前序号、文件名、尺寸与日期
- 进入/切换时根据方向添加 `viewer-lightbox__canvas--forward/backward` 过渡，保持 Photos 式流畅感
- 控制栏新增“适配窗口”按钮，支持一键回到默认视角

## 2. 高级缩放
- `useImageViewer` 增加平移状态（offset）与 `resetView`，可同时控制缩放、旋转、翻转
- 滚轮或 `ctrl + trackpad` 捏合会以鼠标/手势所在位置为基准缩放，保证焦点不跳动
- 支持 0.25 – 8x 的缩放范围，并在缩放归 1x 时自动清除所有偏移状态

## 3. 手势与拖拽
- Canvas 改写为 `pointer` 事件：当缩放 >1 时可按住拖拽，松手带有减速惯性
- Trackpad 垂直/水平滚动在放大状态下直接平移画布，未放大时可横向轻扫切图
- 双击画布或点击“适配窗口”会重置缩放、平移、旋转与翻转

## 4. 交互补充
- `ImageCanvas` 采用 `translate + rotate + scale` 链式变换并根据交互状态切换过渡曲线
- 光标根据可拖拽状态自动切换 `grab/grabbing`，配合模糊玻璃背景更贴近 macOS Viewer
- 文档保留 Stage 7 多选能力，Viewer 现已具备 Stage 6 规划中的滑动、缩放、拖拽与快捷键体验
