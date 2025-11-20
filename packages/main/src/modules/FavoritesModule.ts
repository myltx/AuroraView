import { ipcMain } from "electron";
import type { AppModule } from "../AppModule.js";
import { IPC_CHANNELS } from "../ipc/channels.js";
import { FavoritesStore } from "../services/FavoritesStore.js";

export function createFavoritesModule(): AppModule {
  const store = new FavoritesStore();

  return {
    async enable() {
      await store.init();

      ipcMain.handle(IPC_CHANNELS.FAVORITES_LIST, () => store.list());

      ipcMain.handle(IPC_CHANNELS.FAVORITES_ADD, async (_event, payload) => {
        const { path, name } = payload as { path: string; name?: string };
        return store.add(path, name);
      });

      ipcMain.handle(IPC_CHANNELS.FAVORITES_REMOVE, async (_event, payload) => {
        const { id } = payload as { id: string };
        return store.remove(id);
      });
    },
  };
}
