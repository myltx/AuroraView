import { shell } from "electron";
import { rename, copyFile, mkdir, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { basename, dirname, extname, join } from "node:path";

export class FileOperationsService {
  async deleteItems(paths: string[]) {
    for (const filePath of paths) {
      if (!filePath) continue;
      await shell.trashItem(filePath).catch((error) => {
        console.error("删除文件失败", filePath, error);
      });
    }
  }

  revealInFinder(path: string) {
    if (!path) return;
    shell.showItemInFolder(path);
  }

  async renameItem(path: string, newName: string) {
    if (!path || !newName) return;
    const newPath = join(dirname(path), newName);
    if (newPath === path) return;
    await rename(path, newPath).catch((error) => {
      console.error("重命名失败", path, error);
      throw error;
    });
    return newPath;
  }

  async exportItems(paths: string[], destination: string) {
    return this.copyItems(paths, destination);
  }

  async copyItems(paths: string[], destination: string) {
    return this.#transferItems(paths, destination, async (source, target) => {
      await copyFile(source, target);
    });
  }

  async moveItems(paths: string[], destination: string) {
    return this.#transferItems(paths, destination, async (source, target) => {
      await rename(source, target);
    });
  }

  async #transferItems(
    paths: string[],
    destination: string,
    transfer: (source: string, target: string) => Promise<void>
  ) {
    if (!destination || !paths.length) return [];
    await mkdir(destination, { recursive: true }).catch(() => undefined);
    const results: string[] = [];
    for (const filePath of paths) {
      if (!filePath) continue;
      try {
        const target = await this.#resolveDestination(destination, basename(filePath));
        await transfer(filePath, target);
        results.push(target);
      } catch (error) {
        console.error("文件操作失败", filePath, error);
      }
    }
    return results;
  }

  async #resolveDestination(dir: string, fileName: string) {
    const extension = extname(fileName);
    const base = fileName.slice(0, fileName.length - extension.length) || "未命名";
    let attempt = 0;
    while (true) {
      const suffix = attempt === 0 ? "" : ` ${attempt}`;
      const candidate = join(dir, `${base}${suffix}${extension}`);
      if (!(await this.#exists(candidate))) {
        return candidate;
      }
      attempt++;
    }
  }

  async #exists(path: string) {
    try {
      await access(path, fsConstants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
