import { sha256sum } from "./nodeCrypto.js";
import { versions } from "./versions.js";
import { ipcRenderer, contextBridge } from "electron";
import { IPC_CHANNELS } from "@app/main/src/ipc/channels.js";

type DirectoryTreeNode = {
  name: string;
  path: string;
  images: string[];
  children: DirectoryTreeNode[];
};

type DirectoryReadOptions = {
  includeHidden?: boolean;
  filter?: "all" | "images";
};

type FileSystemItem = {
  path: string;
  name: string;
  type: "directory" | "file";
  extension?: string;
  size: number;
  modifiedAt: number;
  createdAt: number;
  isHidden: boolean;
};

type DirectoryReadResult = {
  path: string;
  items: FileSystemItem[];
};

type SystemDirectory = {
  id: string;
  name: string;
  path: string;
};

type FolderSelectionResult = {
  directory: string;
  images: string[];
  tree: DirectoryTreeNode | null;
};

type DirectoryDialogOptions = {
  title?: string;
};

type DirectoryChangePayload = {
  directory: string;
  event: string;
  targetPath?: string;
};

type ThemeMode = "light" | "dark";

type AppActionPayload = {
  type: "open-directory" | "refresh-directory";
};

const fsAPI = {
  readDirectory: (path: string, options?: DirectoryReadOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.FS_READ_DIRECTORY, { path, options }) as Promise<DirectoryReadResult>,
  getSystemDirectories: () =>
    ipcRenderer.invoke(IPC_CHANNELS.FS_GET_SYSTEM_DIRECTORIES) as Promise<SystemDirectory[]>,
  watchDirectory: (path: string, handler: (payload: DirectoryChangePayload) => void) => {
    if (!path) return () => undefined;
    const listener = (_event: Electron.IpcRendererEvent, payload: DirectoryChangePayload) => {
      if (payload.directory === path) {
        handler(payload);
      }
    };
    ipcRenderer.on(IPC_CHANNELS.FS_DIRECTORY_CHANGED, listener);
    ipcRenderer.invoke(IPC_CHANNELS.FS_WATCH_DIRECTORY, { path }).catch(console.error);
    return () => {
      ipcRenderer.invoke(IPC_CHANNELS.FS_UNWATCH_DIRECTORY, { path }).catch(() => undefined);
      ipcRenderer.removeListener(IPC_CHANNELS.FS_DIRECTORY_CHANGED, listener);
    };
  },
};

type FavoriteEntry = {
  id: string;
  name: string;
  path: string;
  addedAt: number;
};

const favoritesAPI = {
  list: () =>
    ipcRenderer.invoke(IPC_CHANNELS.FAVORITES_LIST) as Promise<FavoriteEntry[]>,
  add: (path: string, name?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.FAVORITES_ADD, { path, name }) as Promise<FavoriteEntry[]>,
  remove: (id: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.FAVORITES_REMOVE, { id }) as Promise<FavoriteEntry[]>,
};

const themeAPI = {
  get: () => ipcRenderer.invoke(IPC_CHANNELS.THEME_GET) as Promise<ThemeMode>,
  onDidChange: (handler: (mode: ThemeMode) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, mode: ThemeMode) => handler(mode);
    ipcRenderer.on(IPC_CHANNELS.THEME_UPDATED, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.THEME_UPDATED, listener);
    };
  },
};

const actionAPI = {
  onAction: (handler: (payload: AppActionPayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: AppActionPayload) => {
      handler(payload);
    };
    ipcRenderer.on(IPC_CHANNELS.APP_ACTION, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.APP_ACTION, listener);
    };
  },
};

const electronAPI = {
  toggleFullscreen: () => ipcRenderer.send("toggle-fullscreen"),
  selectImages: () =>
    ipcRenderer.invoke("select-images") as Promise<string[]>,
  selectFolder: () =>
    ipcRenderer.invoke("select-folder") as Promise<
      FolderSelectionResult | null
    >,
  selectDirectory: (options?: DirectoryDialogOptions) =>
    ipcRenderer.invoke("dialog:select-directory", options ?? {}) as Promise<string | null>,
  fs: fsAPI,
  favorites: favoritesAPI,
  fileOps: {
    delete: (paths: string[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.FILEOPS_DELETE, { paths }) as Promise<void>,
    reveal: (path: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FILEOPS_REVEAL, { path }) as Promise<void>,
    rename: (path: string, newName: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FILEOPS_RENAME, { path, newName }) as Promise<string | void>,
    export: (paths: string[], destination: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FILEOPS_EXPORT, { paths, destination }) as Promise<string[] | void>,
    move: (paths: string[], destination: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FILEOPS_MOVE, { paths, destination }) as Promise<string[] | void>,
    copy: (paths: string[], destination: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FILEOPS_COPY, { paths, destination }) as Promise<string[] | void>,
  },
  theme: themeAPI,
  onAction: actionAPI.onAction,
};

contextBridge.exposeInMainWorld("electron", electronAPI);

function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

export { sha256sum, versions, send };
