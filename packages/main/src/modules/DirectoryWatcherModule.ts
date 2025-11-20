import { ipcMain } from "electron";
import type { AppModule } from "../AppModule.js";
import { IPC_CHANNELS } from "../ipc/channels.js";
import { DirectoryWatcherService } from "../services/DirectoryWatcherService.js";

export function createDirectoryWatcherModule(): AppModule {
  const service = new DirectoryWatcherService();
  const registeredListeners = new Set<number>();

  return {
    enable() {
      ipcMain.handle(IPC_CHANNELS.FS_WATCH_DIRECTORY, (event, payload) => {
        const { path } = payload as { path: string };
        if (!path) return;
        const wcId = event.sender.id;
        if (!registeredListeners.has(wcId)) {
          registeredListeners.add(wcId);
          event.sender.once("destroyed", () => {
            registeredListeners.delete(wcId);
            service.handleWindowDestroyed(wcId);
          });
        }
        service.watchDirectory(event.sender, path);
      });

      ipcMain.handle(IPC_CHANNELS.FS_UNWATCH_DIRECTORY, (event, payload) => {
        const { path } = (payload ?? {}) as { path?: string };
        service.unwatchDirectory(event.sender, path);
      });
    },
  };
}
