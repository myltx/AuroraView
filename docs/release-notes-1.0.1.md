# AuroraView 更新记录（大版本改造）

> 版本：1.0.1（草稿）  
> 范围：布局响应式、外接存储支持、PSD 虚拟标签、自动更新与发布流程等

---

## 一、界面与交互

### 1. Viewer 布局与响应式

- 新增「窗口宽度自适应布局」：
  - 当窗口宽度 < 900px 时，左侧边栏自动折叠，优先展示右侧缩略图区域；
  - 当窗口恢复到宽屏时，自动恢复展开侧边栏。
- 顶栏左侧新增「侧边栏开关」按钮（窄屏模式下可见）：
  - 支持手动展开 / 收起侧边栏；
  - 图标方向根据折叠状态自动变化（展开时向左，折叠时向右）。
- 左侧各分组列表（收藏目录 / 外接存储 / 系统目录 / 自定义目录）：
  - 支持各自独立滚动，避免单个分组过长时推高整个侧边栏；
  - 每个分组内部增加折叠/展开控制，提升在小窗口下的可用性。

### 2. Viewer 内部交互优化

- Toolbar 交互状态：
  - 确认并保持工具栏按钮（打开目录、刷新、视图切换、排序等）的 hover 高亮效果；
  - 统一使用 `toolbar-interactive` + `-webkit-app-region: no-drag` 避免被窗口拖拽区域覆盖。
- 缩略图区域：
  - PSD 图片在标题行前新增一个小标签按钮，用于标记「已修 / 未修」（详见 PSD 虚拟标签一节）。

---

## 二、外接存储（仅 macOS）

### 1. 外接卷识别与过滤

- 新增 FileSystemService#getExternalVolumes：
  - 通过 `diskutil info <mountPoint>` 获取卷信息，严格判断：
    - 仅保留已挂载（Mounted: Yes）的卷；
    - 过滤内部盘（Internal: Yes 且不可移除）；
    - 过滤磁盘映像 / 虚拟卷 / 网络卷（Protocol 为 Disk Image / Virtual / Network 等）；
    - 增加名称黑名单，忽略 `Preboot / Recovery / VM / Update / Amazon Q` 等系统或工具卷。
- 针对 fork 默认模板中出现的 `/Volumes/Amazon Q` 等“幽灵卷”，通过上述过滤逻辑确保不会出现在 UI 的「外接存储」列表中。

### 2. IPC 与 Preload 接口

- 新增 IPC 通道：
  - `FS_GET_EXTERNAL_VOLUMES`: 返回经过过滤的外接卷列表。
- Preload (`packages/preload/src/index.ts`) 中新增：
  - `fs.getExternalVolumes(): Promise<SystemDirectory[]>`。

### 3. Viewer 侧边栏展示

- 左侧新增「外接存储」分组：
  - 显示当前已挂载的外接卷，每个卷作为根节点；
  - 根节点采用「硬盘」图标，展开后的下级目录采用「文件夹」图标。
- 支持外接存储目录树展开：
  - 点击小三角 (`chevron`) 可展开 / 收起子目录，行为与系统目录一致；
  - 内部使用统一的 `toggleNode` + `loadChildren` 机制懒加载子目录。
- `DirectoryWatcher` 监听 `/Volumes`：
  - 通过 `fs.watchDirectory("/Volumes", ...)` 检测卷插拔；
  - 触发 `loadExternalVolumes()` 刷新「外接存储」列表。

---

## 三、自定义目录改造

- 原自定义目录仅展示为平铺列表，现改造为支持多级目录树：
  - 顶层「自定义目录」仍作为入口；
  - 每个自定义根目录可以展开下级子目录结构；
  - 顶层节点显示用户图标，下级统一使用文件夹图标。
- 自定义目录节点支持：
  - 展开/收起子目录（与系统/外接目录同一逻辑）；
  - 顶层节点支持「移除目录」按钮，仅对根节点可见。

---

## 四、PSD 虚拟标签与同名分组

### 1. 同名分组逻辑

- 在主进程新增 `PsdModule`：
  - 对指定目录调用 `FileSystemService.readDirectory(directory, { filter: "images" })`；
  - 按 baseName（去掉扩展名的文件名）分组，例如：
    - `photo.jpg / photo.png / photo.psd` 会被归为同一组；
  - 只保留包含 `psd` 的分组，生成 `PsdGroup`：
    ```ts
    type PsdGroup = {
      baseName: string;
      directory: string;
      psd: { path: string; extension: string };
      others: { path: string; extension: string }[];
      metadata: PsdMetadata; // { edited?: boolean }
    };
    ```

### 2. 虚拟标签存储（不改文件名）

- 新增 `PsdMetadataStore`（JSON 存储）：
  - 文件路径：`<userData>/psd-metadata.json`
  - 结构：
    ```json
    {
      "version": 1,
      "items": {
        "/absolute/path/to/photo.psd": { "edited": true }
      }
    }
    ```
  - 完全独立于真实文件名，不会改动文件系统。

### 3. PSD IPC 接口与 Preload

- 新增 IPC 通道：
  - `PSD_GET_GROUPS`: 获取目录下包含 psd 的同名分组；
  - `PSD_GET_METADATA`: 获取单个 psd 的 metadata；
  - `PSD_SET_EDITED`: 更新 psd 的 `edited` 标签。
- Preload 暴露 `window.electron.psd`：
  ```ts
  psd: {
    getGroups(directory: string): Promise<PsdGroup[]>;
    getMetadata(path: string): Promise<PsdMetadata>;
    setEdited(path: string, edited: boolean): Promise<PsdMetadata>;
  }
  ```

### 4. 渲染层状态管理与 UI 展示

- 新增 composable：`usePsdMetadata`：
  - 管理一个 `Map<string, boolean>`：`psdPath -> edited`；
  - 提供：
    - `isEdited(psdPath)`：查询该 psd 是否标记为已修；
    - `loadFromGroups(groups: PsdGroup[])`：从主进程返回的分组批量加载状态；
    - `toggleEdited(psdPath)`：切换编辑状态并回写到 metadata。
  - Viewer 中集成：
  - 在 `loadImagesForDirectory(path)` 完成后调用：
    ```ts
    if (window.electron?.psd) {
      const groups = await window.electron.psd.getGroups(path);
      await loadPsdGroups(groups); // 来自 usePsdMetadata
    }
    ```
- 缩略图标题区域 UI：
  - 对 psd 文件，在文件名左侧显示一个可点击的标签：
    - 未标记：显示「未修」，点击后变为「已修」；
    - 已标记：显示「已修」，点击可取消标记；
  - 仅改变内部 metadata，真实文件名保持不变。

### 5. PSD 标记管理面板

- Viewer 顶部工具栏新增「PSD 标记管理」按钮：
  - 仅当当前目录中存在 psd 文件时可用；
  - 点击后在右下角打开一个浮层面板，集中展示当前目录中「待标记」的 psd。
- PSD 管理面板能力：
  - 自动列出当前目录中所有包含 psd 的同名分组（基于 `PsdGroup`）；
  - 仅展示尚未标记为「已修」的 psd（使用 `pendingPsdGroups` 过滤）；
  - 每条记录显示：
    - psd 的完整路径；
    - 同名其它变体的扩展名（如 JPG/PNG）；
    - 一键操作按钮「标记为已修」，点击后调用 `togglePsdEdited` 写入 metadata，并同步更新 UI。
  - 面板支持随时关闭，不影响缩略图中的单个 psd 标签操作。

---

## 五、自动更新与发布流程

### 1. electron-builder 配置调整

- `electron-builder.mjs`：
  - `appId` 设置为稳定 ID：`com.myltx.auroraview`；
  - `productName` 保持中文 `助眠神器`，用于应用名称；
  - `artifactName` 改为 ASCII 形式，避免 URL 中出现未转义字符：
    ```js
    artifactName: 'AuroraView-${version}-${os}-${arch}.${ext}',
    ```
  - mac 配置：
    ```js
    mac: {
      // 本地构建同时生成 dmg + zip
      target: ["dmg", "zip"],
    },
    ```
  - `publish` 配置指向当前仓库：
    ```js
    publish: [
      {
        provider: "github",
        owner: "myltx",
        repo: "AuroraView",
        // 如需直接生成正式 Release，可补充 releaseType: "release"
      },
    ],
    ```

### 2. NPM 脚本与发布命令

- `package.json` 新增脚本：
  ```jsonc
  "scripts": {
    "build": "npm run build -ws --if-present",
    "compile": "npm run build && node ./scripts/run-electron-builder.mjs",
    "release": "npm run build && node ./scripts/run-electron-builder.mjs build --config electron-builder.mjs --mac zip --publish always",
    "release:onTag": "npm run build && node ./scripts/run-electron-builder.mjs build --config electron-builder.mjs --mac zip --publish onTag",
    ...
  }
  ```

- 使用方式：
  - 本地打包（生成 dmg + zip，不发布）：
    ```bash
    npm run compile
    ```
  - 发布到 GitHub Releases（只生成并上传 zip，用于自动更新）：
    ```bash
    export GH_TOKEN=你的 GitHub Token
    npm run release
    ```

### 3. AutoUpdater 行为优化

- `AutoUpdater` 模块（`packages/main/src/modules/AutoUpdater.ts`）：
  - 启动时自动调用 `checkForUpdatesAndNotify`；
  - 下载完成后，新增友好弹框：
    - 标题：「发现新版本」；
    - 选项：「立即重启」/「稍后」；
    - 选择“立即重启”：`autoUpdater.quitAndInstall()` 立即应用更新；
    - 选择“稍后”：保留默认行为，用户下次退出应用时再安装。

---

## 六、其它说明

- 清理与兼容：
  - 清理了 fork 模板中多余的 Dependabot 远程分支，仅保留 `main` 作为主分支；
  - 兼容 electron-builder 与自动更新的文件命名与发布策略，避免中文文件名导致的 URL/路径问题。
- 已知限制：
  - PSD 虚拟标签目前为简单布尔状态 `edited: boolean`，如果未来需要更多状态（例如「已审核」「待修改」等），可扩展为枚举或多字段结构；
  - PSD 同名分组逻辑当前仅基于 baseName + 扩展名，不区分大小写，也不做智能匹配（例如 `photo-retouched.psd` 与 `photo.jpg` 不会自动归为一组）。

> 如果后续有需要，可在此基础上继续扩展：例如「同名变体面板」、更丰富的 PSD 状态枚举、或基于 EXIF / XMP 进一步增强 metadata 管理能力。  
