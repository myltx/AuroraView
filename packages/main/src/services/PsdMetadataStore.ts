import { app } from "electron";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type PsdMetadata = {
  edited?: boolean;
};

type PsdMetadataFile = {
  version: 1;
  items: Record<string, PsdMetadata>;
};

const PSD_METADATA_FILE = "psd-metadata.json";

export class PsdMetadataStore {
  #filePath: string;
  #initialized = false;
  #data: PsdMetadataFile = { version: 1, items: {} };

  constructor() {
    this.#filePath = join(app.getPath("userData"), PSD_METADATA_FILE);
  }

  async init() {
    if (this.#initialized) return;
    this.#initialized = true;

    try {
      const dir = dirname(this.#filePath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      if (!existsSync(this.#filePath)) {
        await writeFile(
          this.#filePath,
          JSON.stringify(this.#data, null, 2),
          "utf-8"
        );
        return;
      }

      const content = await readFile(this.#filePath, "utf-8");
      const parsed = JSON.parse(content) as PsdMetadataFile;
      if (parsed && parsed.version === 1 && parsed.items) {
        this.#data = {
          version: 1,
          items: parsed.items,
        };
      }
    } catch (error) {
      console.error("[PsdMetadataStore] 加载元数据失败", error);
      this.#data = { version: 1, items: {} };
    }
  }

  async getMetadata(psdPath: string): Promise<PsdMetadata> {
    await this.init();
    return this.#data.items[psdPath] ?? {};
  }

  async setEdited(psdPath: string, edited: boolean): Promise<PsdMetadata> {
    await this.init();
    const current = this.#data.items[psdPath] ?? {};
    const next: PsdMetadata = { ...current, edited };
    this.#data.items[psdPath] = next;
    await this.#persist();
    return next;
  }

  async #persist() {
    try {
      await writeFile(
        this.#filePath,
        JSON.stringify(this.#data, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("[PsdMetadataStore] 保存元数据失败", error);
    }
  }
}

