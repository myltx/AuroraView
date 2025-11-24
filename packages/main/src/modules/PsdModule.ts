import { ipcMain } from "electron";
import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { IPC_CHANNELS } from "../ipc/channels.js";
import { FileSystemService } from "../services/FileSystemService.js";
import {
  PsdMetadataStore,
  type PsdMetadata,
} from "../services/PsdMetadataStore.js";

type PsdVariant = {
  path: string;
  extension: string;
};

export type PsdGroup = {
  baseName: string;
  directory: string;
  psd: PsdVariant;
  others: PsdVariant[];
  metadata: PsdMetadata;
};

export function createPsdModule(): AppModule {
  const fsService = new FileSystemService();
  const metadataStore = new PsdMetadataStore();

  return {
    async enable(_ctx: ModuleContext) {
      // 获取目录下包含 psd 的同名分组
      ipcMain.handle(IPC_CHANNELS.PSD_GET_GROUPS, async (_event, payload) => {
        const { directory } = payload as { directory: string };
        if (!directory) return [];
        const result = await fsService.readDirectory(directory, {
          filter: "images",
          includeHidden: false,
        });

        const byBaseName = new Map<string, PsdVariant[]>();

        for (const item of result.items) {
          if (item.type !== "file" || !item.extension) continue;
          const ext = item.extension.toLowerCase();
          const nameWithoutExt = item.name.replace(/\.[^.]+$/, "");
          const list = byBaseName.get(nameWithoutExt) ?? [];
          list.push({ path: item.path, extension: ext });
          byBaseName.set(nameWithoutExt, list);
        }

        const groups: PsdGroup[] = [];

        for (const [baseName, variants] of byBaseName) {
          const psd = variants.find((v) => v.extension === "psd");
          if (!psd) continue;
          const others = variants.filter((v) => v.path !== psd.path);
          const metadata = await metadataStore.getMetadata(psd.path);
          groups.push({
            baseName,
            directory,
            psd,
            others,
            metadata,
          });
        }

        return groups;
      });

      // 读取单个 psd 的 metadata
      ipcMain.handle(
        IPC_CHANNELS.PSD_GET_METADATA,
        async (_event, payload) => {
          const { path } = payload as { path: string };
          if (!path) return {};
          return metadataStore.getMetadata(path);
        }
      );

      // 更新 psd 的 edited 标签
      ipcMain.handle(IPC_CHANNELS.PSD_SET_EDITED, async (_event, payload) => {
        const { path, edited } = payload as {
          path: string;
          edited: boolean;
        };
        if (!path) return {};
        return metadataStore.setEdited(path, edited);
      });
    },
  };
}

