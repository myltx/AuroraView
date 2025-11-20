# 阶段 10：发布与分发

## 1. 构建流程
- `npm run build`：在 `main/preload/renderer` 多包内执行 `vite build`，产出 `packages/*/dist`
- `npm run compile`：先执行 build，再调用 `electron-builder`（配置在 `electron-builder.mjs`），生成 `.app`、`.dmg` 或 `.exe` 产物
- 构建前可设置 `CSC_IDENTITY_AUTO_DISCOVERY=false` 以跳过证书签名，或在 CI 中注入签名证书

## 2. 自动更新
- 主进程已启用 `autoUpdater()`（`packages/main/src/index.ts:24-65`），默认使用 `electron-updater` 配置
- 发布流程：`electron-builder` 默认读取 `publish` 配置，可在 `electron-builder.mjs` 或 CI 中设置 `publish: [{ provider: "github", owner: "<org>", repo: "<repo>" }]`，也可改为自建服务器
- 渠道区分：可通过 `process.env.FEED_URL` 或 `autoUpdater.setFeedURL()` 切换测试/正式渠道；GitHub Releases 的预发布可作为 beta 通道

## 3. 发布清单
- 核对 `package.json` 中 `version` 与 `electron-builder.mjs` 的 `appId`
- 运行 `npm run compile -- --mac dmg --x64 --arm64` 生成 macOS 通用包；Windows/Linux 按需求追加 `--win`, `--linux`
- 输出位于 `dist/`，需附带 `latest-mac.yml` 等自动更新描述文件

## 4. 测试步骤
- 手动安装最新构建，验证启动、目录读取、缩略图渲染、Lightbox、拖放管理、自动刷新及深浅模式
- 运行 `npm run test`（Playwright）在打包产物上执行端到端脚本
- 将验证结果与下载链接附在 Release Note 中，标记兼容平台及已知问题

## 5. 自动更新链路验证
- 为测试环境准备一个 `latest.yml` 和二进制包（可通过 GitHub Releases 草稿或本地静态服务器），并设置 `FEED_URL` 指向该 feed
- 启动旧版本，观察主进程日志：`Checking for update → Update available → Download progress → Update downloaded`
- `packages/main/src/modules/AutoUpdater.ts` 会打印这些事件，必要时可在渲染层提示；下载完成后 `checkForUpdatesAndNotify` 会调用 `quitAndInstall`
- 重启后再检查 `app.getVersion()`，确认已升级到发布版本；若无新版可用，应看到 `No published versions` 的容错日志

## 6. CI 建议
- GitHub Actions 示例：
  ```yaml
  jobs:
    build:
      runs-on: macos-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v3
        - run: npm install
        - run: npm run typecheck
        - run: npm run compile -- --publish=never
  ```
- 若需自动发布，可将 `--publish=never` 改为 `--publish=always`，并配置 `GH_TOKEN`

> Stage 10 交付：具备可重复的 build/packaging 命令、自动更新配置與发布 checklist，可用于 CI/CD 流程。
