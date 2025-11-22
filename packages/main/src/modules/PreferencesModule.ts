import { ipcMain, nativeTheme } from "electron";
import type { AppModule } from "../AppModule.js";
import { IPC_CHANNELS } from "../ipc/channels.js";
import {
  PreferencesService,
  type ThemePreference,
} from "../services/PreferencesService.js";

function toNativeThemeSource(preference: ThemePreference): "system" | "light" | "dark" {
  return preference === "auto" ? "system" : preference;
}

export function createPreferencesModule(): AppModule {
  const service = new PreferencesService();

  return {
    async enable() {
      await service.init();
      const initial = await service.getAll();
      nativeTheme.themeSource = toNativeThemeSource(initial.themePreference);

      ipcMain.handle(IPC_CHANNELS.PREFERENCES_GET, async () => {
        return service.getAll();
      });

      ipcMain.handle(IPC_CHANNELS.PREFERENCES_SET, async (_event, payload) => {
        const { key, value } = payload ?? {};
        if (key === "themePreference" && value) {
          const updated = await service.set("themePreference", value);
          nativeTheme.themeSource = toNativeThemeSource(updated.themePreference);
          return updated;
        }
        return service.getAll();
      });
    },
  };
}
