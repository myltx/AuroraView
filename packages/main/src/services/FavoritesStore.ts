import { app } from "electron";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

export type FavoriteEntry = {
  id: string;
  name: string;
  path: string;
  addedAt: number;
};

const FAVORITES_FILE = "favorites.json";

export class FavoritesStore {
  #favorites: FavoriteEntry[] = [];
  #filePath: string;
  #initialized = false;

  constructor() {
    this.#filePath = join(app.getPath("userData"), FAVORITES_FILE);
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
        await writeFile(this.#filePath, JSON.stringify([]), "utf-8");
      }

      const content = await readFile(this.#filePath, "utf-8");
      this.#favorites = JSON.parse(content) as FavoriteEntry[];
    } catch (error) {
      console.error("加载收藏失败", error);
      this.#favorites = [];
    }
  }

  list() {
    return this.#favorites;
  }

  async add(path: string, name?: string) {
    await this.init();
    if (this.#favorites.some((fav) => fav.path === path)) {
      return this.#favorites;
    }

    const entry: FavoriteEntry = {
      id: randomUUID(),
      path,
      name: name || basename(path),
      addedAt: Date.now(),
    };
    this.#favorites.push(entry);
    await this.#persist();
    return this.#favorites;
  }

  async remove(id: string) {
    await this.init();
    this.#favorites = this.#favorites.filter((fav) => fav.id !== id);
    await this.#persist();
    return this.#favorites;
  }

  async #persist() {
    try {
      await writeFile(
        this.#filePath,
        JSON.stringify(this.#favorites, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("保存收藏失败", error);
    }
  }
}
