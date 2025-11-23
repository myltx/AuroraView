import { app } from "electron";
import { readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";

export type DirectoryReadOptions = {
  includeHidden?: boolean;
  filter?: "all" | "images";
};

export type FileSystemItem = {
  path: string;
  name: string;
  type: "directory" | "file";
  extension?: string;
  size: number;
  modifiedAt: number;
  createdAt: number;
  isHidden: boolean;
};

export type DirectoryReadResult = {
  path: string;
  items: FileSystemItem[];
};

export type SystemDirectory = {
  id: string;
  name: string;
  path: string;
};

const IMAGE_EXTENSIONS = new Set([
  // 标准格式
  "png",
  "jpg",
  "jpeg",
  "webp",
  "bmp",
  "gif",
  "tiff",
  "tif",
  "heic",
  "heif",
  "svg",
  // 专业格式
  "psd", // Adobe Photoshop
  "dng", // Adobe Digital Negative
  // RAW 格式（各相机厂商）
  "raw", // 通用 RAW
  "cr2", // Canon RAW 2
  "cr3", // Canon RAW 3
  "nef", // Nikon Electronic Format
  "nrw", // Nikon RAW
  "arw", // Sony Alpha RAW
  "sr2", // Sony RAW 2
  "srf", // Sony RAW Format
  "orf", // Olympus RAW Format
  "raf", // Fujifilm RAW
  "rw2", // Panasonic RAW 2
  "rwl", // Leica RAW
  "3fr", // Hasselblad RAW
  "fff", // Hasselblad RAW
  "mrw", // Minolta RAW
  "x3f", // Sigma RAW
  "erf", // Epson RAW
  "kdc", // Kodak RAW
  "dcr", // Kodak RAW
  "dcs", // Kodak RAW
  "drf", // Kodak RAW
  "mef", // Mamiya RAW
  "mos", // Leaf RAW
  "iiq", // Phase One RAW
  "rwz", // Rawzor
]);

export class FileSystemService {
  async readDirectory(
    directoryPath: string,
    options: DirectoryReadOptions = {}
  ): Promise<DirectoryReadResult> {
    const includeHidden = options.includeHidden ?? false;
    const filter = options.filter ?? "all";

    const dirEntries = await readdir(directoryPath, { withFileTypes: true });
    const items: FileSystemItem[] = [];

    for (const entry of dirEntries) {
      const isHidden = entry.name.startsWith(".");
      if (!includeHidden && isHidden) continue;

      const fullPath = join(directoryPath, entry.name);
      const stats = await stat(fullPath);

      if (entry.isDirectory()) {
        items.push({
          path: fullPath,
          name: entry.name,
          type: "directory",
          size: stats.size,
          createdAt: stats.birthtimeMs,
          modifiedAt: stats.mtimeMs,
          isHidden,
        });
        continue;
      }

      if (!entry.isFile()) continue;

      const extension = extname(entry.name).slice(1).toLowerCase();
      if (filter === "images" && !IMAGE_EXTENSIONS.has(extension)) continue;

      items.push({
        path: fullPath,
        name: entry.name,
        type: "file",
        extension,
        size: stats.size,
        createdAt: stats.birthtimeMs,
        modifiedAt: stats.mtimeMs,
        isHidden,
      });
    }

    return {
      path: directoryPath,
      items: items.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
    };
  }

  getSystemDirectories(): SystemDirectory[] {
    const map: Array<[string, string]> = [
      ["desktop", app.getPath("desktop")],
      ["documents", app.getPath("documents")],
      ["downloads", app.getPath("downloads")],
      ["pictures", app.getPath("pictures")],
      ["videos", app.getPath("videos")],
      ["music", app.getPath("music")],
    ];

    return map.map(([id, path]) => ({
      id,
      name: this.formatSystemName(id),
      path,
    }));
  }

  private formatSystemName(id: string) {
    switch (id) {
      case "desktop":
        return "桌面";
      case "documents":
        return "文稿";
      case "downloads":
        return "下载";
      case "pictures":
        return "图片";
      case "videos":
        return "影片";
      case "music":
        return "音乐";
      default:
        return id;
    }
  }
}
