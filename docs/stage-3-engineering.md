# 阶段 3：工程基础

## 1. 项目结构
```
packages/
  main/      # Electron 主进程
    src/
      ipc/               # IPC channel 常量
      modules/           # 主进程模块（Window, FileSystem...）
      services/          # Node / 平台能力封装
  preload/   # 预加载脚本（安全暴露 API）
  renderer/  # Vue3 + TS UI 层
```

- 主进程入口：`packages/main/src/index.ts`，通过 `createModuleRunner` 初始化各模块
- 新增 `FileSystemModule` 注册 IPC，统一暴露文件系统能力
- 服务层 `FileSystemService` 负责目录扫描与系统目录查询

## 2. IPC 与 API
| Channel | 描述 | Payload | 返回 |
| --- | --- | --- | --- |
| `fs:read-directory` | 读取指定目录（可过滤图片/隐藏项） | `{ path: string, options?: { includeHidden?: boolean; filter?: "all"|"images" } }` | `{ path, items: FileSystemItem[] }` |
| `fs:get-system-directories` | 获取系统常用目录（桌面/下载等） | 无 | `SystemDirectory[]` |

预加载脚本通过 `contextBridge` 暴露 `window.electron.fs`，渲染层只需调用安全 API，无需直接访问 Node 能力。

## 3. 类型与安全
- `packages/renderer/src/vite-env.d.ts` 声明了 FileSystem 类型，提供完整的 TS 提示
- 预加载避免泄露 `ipcRenderer`，仅暴露必要方法，继续保持 `contextIsolation: true`

## 4. 后续巩固
- Stage 4 起，可基于 `electron.fs.readDirectory` + `getSystemDirectories` 构建 Finder 风格侧栏
- 后续扩展：收藏夹持久化（lowdb）、目录监听（chokidar）、缩略图缓存（Sharp）等，都可以在服务层 / 模块层继续扩展
