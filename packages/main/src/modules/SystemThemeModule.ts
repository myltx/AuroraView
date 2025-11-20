import { BrowserWindow, ipcMain, nativeTheme } from "electron";
import type { AppModule } from "../AppModule.js";
import { IPC_CHANNELS } from "../ipc/channels.js";

function currentTheme(): "dark" | "light" {
  return nativeTheme.shouldUseDarkColors ? "dark" : "light";
}

export function createSystemThemeModule(): AppModule {
  return {
    enable() {
      ipcMain.handle(IPC_CHANNELS.THEME_GET, () => currentTheme());

      nativeTheme.on("updated", () => {
        const theme = currentTheme();
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send(IPC_CHANNELS.THEME_UPDATED, theme);
        });
      });
    },
  };
}
