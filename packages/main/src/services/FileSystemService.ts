import { app } from "electron";
import { readdir, stat } from "node:fs/promises";
import { extname, join, basename } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { isSupportedImageExtension } from "../constants/imageExtensions.js";

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

const execFileAsync = promisify(execFile);
const IGNORED_VOLUME_NAMES = new Set<string>([
  "Preboot",
  "Recovery",
  "VM",
  "Update",
  "Amazon Q",
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
      if (filter === "images" && !isSupportedImageExtension(extension)) continue;

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

  async getExternalVolumes(): Promise<SystemDirectory[]> {
    if (process.platform !== "darwin") {
      return [];
    }

    const volumesRoot = "/Volumes";
    let entries: Awaited<ReturnType<typeof readdir>>;
    try {
      entries = await readdir(volumesRoot, { withFileTypes: true });
    } catch (error) {
      console.warn("[FileSystemService] 读取 /Volumes 失败", error);
      return [];
    }

    const dirs = entries.filter((entry) => entry.isDirectory());
    const results: SystemDirectory[] = [];

    for (const entry of dirs) {
      const mountPath = join(volumesRoot, entry.name);
      try {
        const info = await this.getDiskInfo(mountPath);
        if (!info || !info.isMounted) continue;

        // 仅保留外接 / 可移除 / 非内部卷，避免把系统卷也当作外接设备
        if (info.isInternal && !info.isRemovable) {
          continue;
        }

        // 过滤掉磁盘映像、虚拟卷、网络卷等非物理外接盘
        if (info.protocol) {
          const proto = info.protocol.toLowerCase();
          if (
            proto.includes("disk image") ||
            proto.includes("virtual") ||
            proto.includes("network")
          ) {
            continue;
          }
        }

        const name = info.volumeName || entry.name || basename(mountPath);
        if (IGNORED_VOLUME_NAMES.has(name)) {
          continue;
        }

        const id = info.uuid || mountPath;
        results.push({ id, name, path: mountPath });
      } catch (error) {
        console.warn("[FileSystemService] 解析卷信息失败", error);
      }
    }

    return results;
  }

  private async getDiskInfo(mountPoint: string): Promise<{
    isMounted: boolean;
    isInternal: boolean;
    isRemovable: boolean;
    protocol?: string;
    volumeName: string;
    uuid: string;
  } | null> {
    try {
      const { stdout } = await execFileAsync("diskutil", ["info", mountPoint]);
      const lines = stdout.split(/\r?\n/).map((line) => line.trim());

      const readValue = (label: string): string | undefined => {
        const line = lines.find((l) => l.startsWith(label));
        if (!line) return undefined;
        const idx = line.indexOf(":");
        if (idx === -1) return undefined;
        return line.slice(idx + 1).trim();
      };

      const mountedVal = readValue("Mounted");
      const isMounted = mountedVal === "Yes";

      const deviceLocation = readValue("Device Location");
      const internalVal = readValue("Internal");
      const isInternal =
        deviceLocation === "Internal" ||
        internalVal === "Yes" ||
        deviceLocation === "Built In";

      const removableVal = readValue("Removable Media");
      const isRemovable = removableVal === "Removable" || removableVal === "Yes";

      const protocol = readValue("Protocol");
      const volumeName = readValue("Volume Name") || basename(mountPoint);
      const uuid =
        readValue("Volume UUID") ||
        readValue("Disk / Partition UUID") ||
        "";

      return {
        isMounted,
        isInternal,
        isRemovable,
        protocol,
        volumeName,
        uuid,
      };
    } catch {
      // 对于没有实际挂载的残留目录，diskutil 会报错，直接忽略
      return null;
    }
  }
}
