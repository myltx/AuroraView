# 阶段 7：图片管理能力（基础）

## 1. 多选逻辑
- 缩略图网格支持 Cmd/Shift 选择：`selectedIndexes` 记录状态，支持范围选择、单独切换、双击打开 Lightbox
- 工具栏在有选中项时显示操作计数，并提供“复制路径”“Finder 显示”“删除（移入废纸篓）”按钮

## 2. 文件操作 IPC
- 主进程新增 `FileOperationsService`，通过 Electron `shell.trashItem` / `showItemInFolder` 执行删除与定位
- IPC `fileops:delete`、`fileops:reveal` 在预加载层通过 `window.electron.fileOps` 暴露
- 渲染层通过 `window.electron.fileOps.delete/ reveal` 触发真实文件操作，并刷新当前目录

## 3. Viewer 互动
- Lightbox 现在支持滚轮缩放与方向键切图，上一张/下一张带有过渡动画，右上信息栏显示文件大小与修改时间
- 快捷键：Cmd+O 打开目录、Cmd+A 全选、Cmd+C 复制路径、Delete/Backspace 删除、Cmd+E 导出、空格开关 Lightbox、左右箭头切图；滚轮在 Lightbox 中即为缩放

## 4. 导出与后续
- 选择任意图片可通过工具栏或 `Cmd+E` 调出目录对话框，将文件批量复制到目标文件夹；导出时自动处理重名
- 缩略图支持原生拖放：拖到侧边栏目录默认移动，按住 Option/Command 时变为复制，并在同一目录下生成不重名的副本
- 新增“复制到…”与“移动到…”操作（⌘⇧C / ⌘⇧M 或工具栏图标），通过目录对话框批量复制/迁移图片，完成后 toast 提示
- 删除/导出/拖放操作全部通过右下角 Toast 提示成败，不再出现阻塞式弹窗
- 暂未实现真正的拖拽移动、标签等，后续可继续扩展 `fileOps` IPC，与 `chokidar` 联动监听变化
