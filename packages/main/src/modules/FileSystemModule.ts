import { ipcMain } from "electron";
import type { AppModule } from "../AppModule.js";
import { IPC_CHANNELS } from "../ipc/channels.js";
import {
  DirectoryReadOptions,
  FileSystemService,
} from "../services/FileSystemService.js";

export function createFileSystemModule(): AppModule {
  const service = new FileSystemService();

  return {
    enable() {
      ipcMain.handle(IPC_CHANNELS.FS_READ_DIRECTORY, async (_event, payload) => {
        const { path, options } = payload as {
          path: string;
          options?: DirectoryReadOptions;
        };
        return service.readDirectory(path, options);
      });

      ipcMain.handle(IPC_CHANNELS.FS_GET_SYSTEM_DIRECTORIES, () => {
        return service.getSystemDirectories();
      });
    },
  };
}
