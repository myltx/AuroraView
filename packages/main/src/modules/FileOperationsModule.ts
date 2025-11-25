import { ipcMain, dialog } from "electron";
import type { AppModule } from "../AppModule.js";
import { IPC_CHANNELS } from "../ipc/channels.js";
import { FileOperationsService } from "../services/FileOperationsService.js";

export function createFileOperationsModule(): AppModule {
  const service = new FileOperationsService();

  return {
    enable() {
      ipcMain.handle(IPC_CHANNELS.FILEOPS_DELETE, async (_event, payload) => {
        const { paths } = payload as { paths: string[] };
        await service.deleteItems(paths ?? []);
      });

      ipcMain.handle(IPC_CHANNELS.FILEOPS_REVEAL, (_event, payload) => {
        const { path } = payload as { path: string };
        service.revealInFinder(path);
      });

      ipcMain.handle(IPC_CHANNELS.FILEOPS_RENAME, async (_event, payload) => {
        const { path, newName } = payload as { path: string; newName: string };
        return service.renameItem(path, newName);
      });

      ipcMain.handle(IPC_CHANNELS.FILEOPS_EXPORT, async (_event, payload) => {
        const { paths, destination } = payload as {
          paths: string[];
          destination: string;
        };
        return service.exportItems(paths ?? [], destination);
      });

      ipcMain.handle(IPC_CHANNELS.FILEOPS_MOVE, async (_event, payload) => {
        const { paths, destination } = payload as {
          paths: string[];
          destination: string;
        };
        return service.moveItems(paths ?? [], destination);
      });

      ipcMain.handle(IPC_CHANNELS.FILEOPS_COPY, async (_event, payload) => {
        const { paths, destination } = payload as {
          paths: string[];
          destination: string;
        };
        return service.copyItems(paths ?? [], destination);
      });

      ipcMain.handle(IPC_CHANNELS.FILEOPS_OPEN, async (_event, payload) => {
        const { path } = payload as { path: string };
        await service.openItem(path);
      });

      ipcMain.handle(
        IPC_CHANNELS.FILEOPS_OPEN_WITH_CHOOSER,
        async (_event, payload) => {
          const { path, appPath } = payload as {
            path: string;
            appPath?: string;
          };
          if (!path) return;

          // 如果传入了应用路径，则直接用该应用打开，不弹出对话框
          if (appPath) {
            await service.openWith(path, appPath);
            return appPath;
          }

          const result = await dialog.showOpenDialog({
            title: "选择用于打开图片的应用",
            properties: ["openFile"],
            ...(process.platform === "darwin"
              ? { filters: [{ name: "应用程序", extensions: ["app"] }] }
              : {}),
          });
          if (result.canceled || !result.filePaths.length) return;
          const selectedAppPath = result.filePaths[0];
          await service.openWith(path, selectedAppPath);
          return selectedAppPath;
        }
      );
    },
  };
}
