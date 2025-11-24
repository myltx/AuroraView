## 开发者指南（Developer Guide）

> 本文档承载工程结构、脚本命令、构建与测试说明。用户使用与功能介绍请查看根目录 `README.md`。

<div align="center">

# Photon（开发者文档）

基于 Electron + Vite + TypeScript + Vue 的桌面应用工程模板，采用 npm workspaces 管理多包架构，内置开发、构建、打包与端到端测试工作流。

</div>

### 目录

- 项目结构
- 构建脚本与命令
- 开发与调试
- 环境变量
- 构建与发布
- 测试
- 代码与命名规范
- 常见问题

### 项目结构

```
packages/
  main/                  # Electron 主进程
  preload/               # 预加载脚本，暴露安全 API
  renderer/              # 渲染器（Vue）界面实现
  integrate-renderer/    # 渲染器集成 CLI
  electron-versions/     # 版本与辅助逻辑
packages/dev-mode.js     # 开发模式脚本
packages/entry-point.mjs # 入口控制脚本
buildResources/          # 静态资源、签名等
tests/e2e.spec.ts        # 端到端用例（Playwright）
.mise.toml               # 可选：工具链版本声明
```

> 渲染器包可通过 `npm run create-renderer` 生成并位于同级 `src` 目录。

### 构建脚本与命令

- `npm start`：通过 `packages/dev-mode.js` 启动开发模式并监听热更新。
- `npm run build`：在所有 workspace 内执行 `vite build` 或各自 `build` 脚本，输出到 `dist/`。
- `npm run compile`：先运行 `build`，随后使用 `electron-builder` 生成安装包。
  - 调试安装包目录结构可加：`--dir -c.asar=false`
- `npm run test`：使用 Playwright 针对 `npm run compile` 产物执行 E2E 用例。
- `npm run typecheck`：在各 package 内运行 `tsc --noEmit`。
- `npm run init`：顺序执行 `create-renderer`、`integrate-renderer` 并重新安装依赖。

### 开发与调试

- TypeScript `module/target: ESNext`，严格模式开启。
- 跨包引用通过路径别名 `@app/*`。
- 保持 `contextIsolation: true`，所有文件访问与 IPC 封装在 `packages/preload/src` 暴露的 API。
- 渲染进程避免直接使用 Node 原语。

### 环境变量

- 仅 `VITE_` 前缀变量会暴露给渲染进程（由 Vite 注入）。
- 新增变量需同步到 `types/env.d.ts` 的 `ImportMetaEnv`，确保类型安全。

### 构建与发布

- 执行 `npm run build` 生成各包 `dist/` 产物。
- 使用 `npm run compile` 调用 `electron-builder` 产出安装器；
  - 调试安装包目录结构可加：`--dir -c.asar=false`。

### 测试

- 端到端测试基于 Playwright（`@playwright/test`）。
- 推荐在本地先执行：
  ```bash
  npm run compile && npm run test
  ```
  以便复现 CI 环境。
- 为 package 编写单测时，文件命名为 `*.spec.ts`/`*.test.ts`（默认被构建排除）。

### 代码与命名规范

- 两空格缩进、UTF-8、LF、尾随换行；无行尾空格（Markdown 允许保留）。
- 函数与变量使用小驼峰，类使用帕斯卡命名，常量使用 `ALL_CAPS` 或清晰前缀。
- 自定义类型放入 `types/*.d.ts` 并在 `tsconfig` 的 `paths` 中声明。

### 常见问题（工程相关）

- 渲染器无法访问环境变量？
  - 确保使用 `VITE_` 前缀，并在 `types/env.d.ts` 中补充类型。

- 新增界面包未接入主程序？
  - 执行 `npm run init`，或分别运行 `npm run create-renderer` 与 `npm run integrate-renderer`。

- 需要调试安装包内容？
  - 使用：`npm run compile -- --dir -c.asar=false`

