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
type ThemePreference = "auto" | ThemeMode;
type UserPreferences = {
  themePreference: ThemePreference;
};

type AppActionPayload = {
  type: "open-directory" | "refresh-directory";
};

type PsdMetadata = {
  edited?: boolean;
};

type PsdVariant = {
  path: string;
  extension: string;
};

type PsdGroup = {
  baseName: string;
  directory: string;
  psd: PsdVariant;
  others: PsdVariant[];
  metadata: PsdMetadata;
};

const fsAPI = {
  readDirectory: (path: string, options?: DirectoryReadOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.FS_READ_DIRECTORY, { path, options }) as Promise<DirectoryReadResult>,
  getSystemDirectories: () =>
    ipcRenderer.invoke(IPC_CHANNELS.FS_GET_SYSTEM_DIRECTORIES) as Promise<SystemDirectory[]>,
  getExternalVolumes: () =>
    ipcRenderer.invoke(IPC_CHANNELS.FS_GET_EXTERNAL_VOLUMES) as Promise<SystemDirectory[]>,
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
  rating?: number;
  kind?: "favorite" | "rating";
};

const favoritesAPI = {
  list: () =>
    ipcRenderer.invoke(IPC_CHANNELS.FAVORITES_LIST) as Promise<FavoriteEntry[]>,
  add: (path: string, name?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.FAVORITES_ADD, { path, name }) as Promise<FavoriteEntry[]>,
  remove: (id: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.FAVORITES_REMOVE, { id }) as Promise<FavoriteEntry[]>,
  setRating: (path: string, rating: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.FAVORITES_SET_RATING, { path, rating }) as Promise<FavoriteEntry[]>,
  getRating: (path: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.FAVORITES_GET_RATING, { path }) as Promise<number | undefined>,
  listByRating: (rating: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.FAVORITES_LIST_BY_RATING, { rating }) as Promise<FavoriteEntry[]>,
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

const preferencesAPI = {
  get: () =>
    ipcRenderer.invoke(IPC_CHANNELS.PREFERENCES_GET) as Promise<UserPreferences>,
  set: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) =>
    ipcRenderer.invoke(IPC_CHANNELS.PREFERENCES_SET, { key, value }) as Promise<UserPreferences>,
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

const psdAPI = {
  getGroups: (directory: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PSD_GET_GROUPS, { directory }) as Promise<PsdGroup[]>,
  getMetadata: (path: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PSD_GET_METADATA, { path }) as Promise<PsdMetadata>,
  setEdited: (path: string, edited: boolean) =>
    ipcRenderer.invoke(IPC_CHANNELS.PSD_SET_EDITED, { path, edited }) as Promise<PsdMetadata>,
};

const viewAPI = {
  notifyViewMode: (mode: "regular" | "compact") => {
    ipcRenderer.send("view:mode-changed", mode);
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
  preferences: preferencesAPI,
  onAction: actionAPI.onAction,
  view: viewAPI,
  psd: psdAPI,
};

contextBridge.exposeInMainWorld("electron", electronAPI);

function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

export { sha256sum, versions, send };
