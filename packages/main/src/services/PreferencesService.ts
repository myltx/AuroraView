import { app } from "electron";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export type ThemePreference = "auto" | "light" | "dark";

export type PerformanceProfile = "balanced" | "fast" | "eco";

export type UserPreferences = {
  themePreference: ThemePreference;
  // 按扩展名记录默认打开应用，例如 { psd: "/Applications/Adobe Photoshop 2024.app" }
  openWith: Record<string, string>;
  // 性能模式，影响缩略图等策略
  performanceProfile: PerformanceProfile;
};

const PREFERENCES_FILE = "preferences.json";
const DEFAULT_PREFERENCES: UserPreferences = {
  themePreference: "auto",
  openWith: {},
  performanceProfile: "balanced",
};

export class PreferencesService {
  #filePath: string;
  #preferences: UserPreferences = DEFAULT_PREFERENCES;
  #initialized = false;

  constructor() {
    this.#filePath = join(app.getPath("userData"), PREFERENCES_FILE);
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
          JSON.stringify(DEFAULT_PREFERENCES, null, 2),
          "utf-8"
        );
      }

      const content = await readFile(this.#filePath, "utf-8");
      const parsed = JSON.parse(content) as Partial<UserPreferences>;
      this.#preferences = { ...DEFAULT_PREFERENCES, ...parsed };
    } catch (error) {
      console.error("加载用户配置失败", error);
      this.#preferences = { ...DEFAULT_PREFERENCES };
    }
  }

  async getAll() {
    await this.init();
    return { ...this.#preferences };
  }

  async set<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    await this.init();
    this.#preferences = { ...this.#preferences, [key]: value };
    await this.#persist();
    return this.getAll();
  }

  async #persist() {
    try {
      await writeFile(
        this.#filePath,
        JSON.stringify(this.#preferences, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("保存用户配置失败", error);
    }
  }
}
