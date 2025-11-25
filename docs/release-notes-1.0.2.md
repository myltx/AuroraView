# AuroraView 1.0.2 – 修图工作流与外部打开增强（草稿）

> 本文档记录了最近一轮与「已修 / 未修」状态、高级格式支持以及外部应用打开相关的改动，供后续版本发布与维护参考。

## 1. 修图状态模型（PSD + RAW 分组）

- 新增修图状态模型：
  - 仍然以 PSD 的虚拟标签作为「已修」的唯一来源：
    - 主进程：`PsdMetadataStore`（`psd-metadata.json`）存储 `edited: boolean`。
    - 渲染层：`usePsdMetadata` 暴露 `isEdited(path)` / `toggleEdited(path)`。
  - 在渲染层为图片计算统一的修图状态：
    - `edited`：同名分组中存在 PSD 且该 PSD 已标记为已修。
    - `unedited`：不满足 `edited`，但分组中包含 RAW/DNG 等专业格式或 PSD。
    - `none`：既无 PSD，也无 RAW 类文件，仅视为普通图片。
- RAW/专业格式列表通过 `RAW_LIKE_EXTENSIONS` 维护（`Viewer.vue`）：
  - 包含 `dng, raw, nef, cr2, cr3, arw, raf, orf, rw2` 等常见 RAW 格式。
- 分组规则：
  - 按文件名去掉扩展名后的 baseName 分组，例如 `photo.dng / photo.jpg / photo.psd` 视为同一组。
  - 对每个分组统计：
    - `hasPsd` / `psdEdited`：是否存在 PSD 及其是否已修；
    - `hasRawLike`：是否存在 RAW 类文件。

## 2. 缩略图角标组件（EditStatusBadge）

- 新增通用角标组件：`packages/renderer/src/components/EditStatusBadge.vue`：
  - Props：`status: "edited" | "unedited" | "none"`。
  - `edited`：
    - 绿色圆角胶囊背景（接近成功状态色），内含 ✔ 图标与「已修」文案；
    - 较高视觉优先级，带阴影与模糊以贴合现有玻璃拟物风格。
  - `unedited`：
    - 深色半透明背景，内含 ✎（写字笔）图标与「未修」文案；
    - 视觉强度略低于「已修」，提示为“待修原始文件”。
  - `none`：不渲染角标。
- 集成位置：
  - `Viewer.vue` 缩略图块内：
    - 在 `viewer-gallery__asset` 容器内渲染 `<EditStatusBadge :status="getEditStatusForItem(item)" />`；
    - 利用 `viewer-gallery__asset` 的 `position: relative`，在右上角定位角标。
- 状态判定：
  - PSD 文件：
    - `status = "edited"` 当且仅当该 PSD 的 metadata 标记为已修；
    - 未修 PSD 不再显示「未修」角标，仅在文件名处提供「标记为已修」按钮。
  - RAW / DNG 等专业格式：
    - 当其所在 baseName 分组被判定为 `unedited` 时展示「未修」角标；
    - 该分组一旦出现已修 PSD，则 RAW 不再显示未修角标。

## 3. 修图筛选下拉（已修 / 未修 / 全部）

- 在 Viewer 工具栏中新增「修图筛选」下拉菜单：
  - 仅在非星级视图（`!isRatingCollectionView`）且当前目录存在图片源数据时显示；
  - 按钮风格与排序、视图模式等保持一致：
    - 图标使用 `TOOLBAR_ICONS.psdManager`，语义为“修图相关筛选”；
    - 悬停提示文案会根据当前筛选状态动态变更，如“修图筛选：全部图片 / 筛选：已修图片 / 筛选：未修图片”。
- 下拉菜单选项：
  - `全部`：`editStatusFilter = "all"`，不按修图状态过滤；
  - `已修`：`editStatusFilter = "edited"`，仅展示被判定为 `edited` 的分组；
  - `未修`：`editStatusFilter = "unedited"`，仅展示被判定为 `unedited` 的分组。
- 过滤规则：
  - 基于前述按 baseName 分组的 `GroupInfo`（`hasPsd / psdEdited / hasRawLike`）计算；
  - 一旦某个分组被选中（已修或未修），该分组下所有格式（PSD、RAW、JPG 等）都会一起展示，方便对比同名不同格式。
- 边界行为：
  - 当筛选为“已修”但当前目录里没有任何已修分组时：
    - 缩略图列表为空；
    - 「修图筛选」下拉按钮仍然可见（基于 `hasAnySourceImages` 判断），允许用户切回“全部 / 未修”，避免出现“筛完按钮也消失”的困境。

## 4. PSD 标签与交互文案调整

- 缩略图文件名区域的 PSD 文本标签进行了语义收紧：
  - 仅 PSD 显示按钮，RAW 等不再显示「未修」文案，以免与角标重复。
  - 文案调整：
    - 已修 PSD：`[已修]`（高亮）；
    - 未修 PSD：按钮文案为「标记为已修」。
  - 点击行为：
    - 已修 → 再次点击切换为未修（取消虚拟标签）；
    - 未修 → 点击设为已修。
- 该逻辑与 psdManager 面板中“一键标记已修”的行为保持一致。

## 5. 右键菜单与外部应用打开（回顾）

> 这一部分在上一轮改动中已经落地，这里一并记录，便于理解与维护整体工作流。

- 缩略图右键新增自定义菜单：
  - 功能项：
    - `打开（系统默认应用）`：使用 macOS 关联的默认应用打开当前图片；
    - `在 Finder 中显示`：通过 Electron `shell.showItemInFolder` 定位文件；
    - `使用已配置应用打开（.ext）`：如果已为对应扩展名配置固定应用，则直接使用该应用打开；
    - `选择应用并设为 .ext 默认打开方式…`：弹出系统文件选择对话框（macOS 下筛 `.app`），选择应用后：
      - 立即用该应用打开当前图片；
      - 将扩展名 → 应用路径的映射写入用户配置。
- 打开方式映射：
  - 主进程用户配置 `preferences.json` 中新增字段：
    - `openWith: Record<string, string>`，例如 `{ "psd": "/Applications/Adobe Photoshop 2024.app" }`。
  - 通过 `PreferencesService.set("openWith", mapping)` 读写；
  - Preload 中扩展 `UserPreferences` 类型，并在 `window.electron.preferences.get()` 返回中携带；
  - 渲染层在 `Viewer.vue` 初次挂载时加载到 `openWithMap`，供右键菜单和大图视图使用。
- 文件操作 API 扩展：
  - 主进程：
    - `FILEOPS_OPEN`：使用系统默认应用打开；
    - `FILEOPS_OPEN_WITH_CHOOSER`：
      - 支持传入 `appPath`（直接用指定应用打开）；
      - 或弹出对话框让用户选择，返回选择的应用路径。
  - Preload：在 `fileOps` 上暴露 `open(path)` 与 `openWithChooser(path, appPath?)`；
  - 渲染层：`Viewer.vue` 中封装了统一的“用默认 / 用映射 / 选择并保存到映射”的行为。

## 6. 大图视图：外部应用打开按钮（统一化）

- 大图模式（lightbox）顶部工具栏新增“用外部应用打开当前图片”的按钮：
  - 不再局限于 PSD，所有图片均可使用；
  - 图标复用 `TOOLBAR_ICONS.psdManager`，标题根据当前扩展名动态提示：
    - 例如：`使用外部应用打开 (.psd)`、`使用外部应用打开 (.dng)`。
- 行为：
  - 若当前扩展名已在 `openWith` 中配置应用：
    - 直接调用 `fileOps.openWithChooser(path, mappedAppPath)` 打开；
  - 否则：
    - 弹窗询问是否选择应用并设为该格式默认打开方式；
    - “确定”→ 调用 `openWithChooser` 让用户选 `.app`，并更新 `openWith`；
    - “取消”→ 回退为系统默认应用打开。

## 7. 选择行为与 UI 细节修正

- 默认选择逻辑：
  - 打开目录时不再自动选中第一张图片；
  - `currentIndex` 虽仍重置为 0，但 `selectedIndexes` 为空，避免“看起来选中但其实没有选”的错觉。
- 点击空白区域取消多选：
  - 在缩略图网格容器上监听点击；
  - 当点击目标不在 `.viewer-gallery__item` 内时，清空当前所有选中状态。
- 视觉一致性：
  - `viewer-gallery__item.is-active` 仅在对应索引确实在 `selectedIndexes` 中时生效，保证 UI 与逻辑同步。

## 8. 风险与兼容性说明

- `preferences.json` 结构变更：
  - 新增 `openWith` 字段，但通过默认值合并，旧版本配置仍可兼容；
  - 如遇到不兼容配置（解析失败），会回退到默认配置并重新写入。
- `psd-metadata.json` 结构未变：
  - 仍为 `version: 1` + `items: Record<string, { edited?: boolean }>`；
  - 本轮改动仅在渲染层增加了利用该字段的逻辑，不改变存储。
- 右键菜单与修图筛选均只建立在已有数据之上：
  - 当目录为空或仅包含非图片文件时，不会影响已有功能；
  - 当修图筛选结果为空时，下拉按钮仍然存在，用户可以轻松切回“全部”视图。

---

> 如后续继续扩展「修图状态」到更多工作流（例如配合评分、收藏、导出未修列表等），建议在此文档基础上追加对应小节，保持演进历史清晰可查。 

