import chokidar, { FSWatcher } from "chokidar";
import type { WebContents } from "electron";
import { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../ipc/channels.js";

type WatchMap = Map<string, FSWatcher>;

export class DirectoryWatcherService {
  #watchersByContents = new Map<number, WatchMap>();

  watchDirectory(webContents: WebContents, directory: string) {
    if (!directory) return;
    const wcId = webContents.id;
    const watchers = this.#watchersByContents.get(wcId) ?? new Map();
    if (watchers.has(directory)) {
      return;
    }

    const watcher = chokidar.watch(directory, {
      ignoreInitial: true,
      depth: 0,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });

    const emitChange = (event: string, targetPath?: string) => {
      if (webContents.isDestroyed()) {
        this.unwatchDirectory(webContents, directory);
        return;
      }
      webContents.send(IPC_CHANNELS.FS_DIRECTORY_CHANGED, {
        directory,
        event,
        targetPath,
      });
    };

    watcher.on("all", emitChange);
    watcher.on("error", (error) => {
      console.error("[DirectoryWatcher] error", error);
    });

    watchers.set(directory, watcher);
    this.#watchersByContents.set(wcId, watchers);
  }

  unwatchDirectory(webContents: WebContents, directory?: string) {
    const wcId = webContents.id;
    const watchers = this.#watchersByContents.get(wcId);
    if (!watchers) return;
    if (directory) {
      const watcher = watchers.get(directory);
      if (watcher) {
        watcher.close().catch((error) => {
          console.warn("[DirectoryWatcher] failed to close watcher", error);
        });
        watchers.delete(directory);
      }
    } else {
      watchers.forEach((watcher) => watcher.close().catch(console.warn));
      watchers.clear();
    }

    if (watchers.size === 0) {
      this.#watchersByContents.delete(wcId);
    }
  }

  handleWindowDestroyed(webContentsId: number) {
    const watchers = this.#watchersByContents.get(webContentsId);
    if (!watchers) return;
    watchers.forEach((watcher) => watcher.close().catch(console.warn));
    watchers.clear();
    this.#watchersByContents.delete(webContentsId);
  }
}
