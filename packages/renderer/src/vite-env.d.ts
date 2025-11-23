/// <reference types="vite/client" />
import type { ThemeMode, ThemePreference } from "./types/theme";

interface DirectoryTreeNode {
  name: string;
  path: string;
  images: string[];
  children: DirectoryTreeNode[];
}

interface FileSystemItem {
  path: string;
  name: string;
  type: "directory" | "file";
  extension?: string;
  size: number;
  modifiedAt: number;
  createdAt: number;
  isHidden: boolean;
}

interface DirectoryReadResult {
  path: string;
  items: FileSystemItem[];
}

interface DirectoryReadOptions {
  includeHidden?: boolean;
  filter?: "all" | "images";
}

interface SystemDirectory {
  id: string;
  name: string;
  path: string;
}

interface ImageFolderSelection {
  directory: string;
  images: string[];
  tree: DirectoryTreeNode | null;
}

interface DirectoryDialogOptions {
  title?: string;
}

interface DirectoryChangePayload {
  directory: string;
  event: string;
  targetPath?: string;
}

interface UserPreferences {
  themePreference: ThemePreference;
}

interface FileSystemAPI {
  readDirectory: (
    path: string,
    options?: DirectoryReadOptions
  ) => Promise<DirectoryReadResult>;
  getSystemDirectories: () => Promise<SystemDirectory[]>;
  watchDirectory: (
    path: string,
    handler: (payload: DirectoryChangePayload) => void
  ) => () => void;
}

interface FavoriteEntry {
  id: string;
  name: string;
  path: string;
  addedAt: number;
  rating?: number;
}

interface FavoritesAPI {
  list: () => Promise<FavoriteEntry[]>;
  add: (path: string, name?: string) => Promise<FavoriteEntry[]>;
  remove: (id: string) => Promise<FavoriteEntry[]>;
  setRating: (path: string, rating: number) => Promise<FavoriteEntry[]>;
  getRating: (path: string) => Promise<number | undefined>;
  listByRating: (rating: number) => Promise<FavoriteEntry[]>;
}

interface FileOperationsAPI {
  delete: (paths: string[]) => Promise<void>;
  reveal: (path: string) => Promise<void>;
  rename: (path: string, newName: string) => Promise<string | void>;
  export: (paths: string[], destination: string) => Promise<string[] | void>;
  move: (paths: string[], destination: string) => Promise<string[] | void>;
  copy: (paths: string[], destination: string) => Promise<string[] | void>;
}

interface ThemeAPI {
  get: () => Promise<ThemeMode>;
  onDidChange: (handler: (mode: ThemeMode) => void) => () => void;
}

interface PreferencesAPI {
  get: () => Promise<UserPreferences>;
  set: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => Promise<UserPreferences>;
}

type AppActionPayload = {
  type: "open-directory" | "refresh-directory";
};

interface ElectronAPI {
  toggleFullscreen: () => void;
  selectImages: () => Promise<string[]>;
  selectFolder: () => Promise<ImageFolderSelection | null>;
  selectDirectory: (options?: DirectoryDialogOptions) => Promise<string | null>;
  fs: FileSystemAPI;
  favorites: FavoritesAPI;
  fileOps: FileOperationsAPI;
  theme: ThemeAPI;
  preferences: PreferencesAPI;
  onAction: (handler: (payload: AppActionPayload) => void) => () => void;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
