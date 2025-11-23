import { ipcMain, dialog } from "electron";
import { readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { LOCAL_FILE_PROTOCOL_SCHEME } from "./LocalFileProtocol.js";

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

type DirectoryNode = {
  name: string;
  path: string;
  images: string[];
  children: DirectoryNode[];
};

export function setupImageSelector() {
  ipcMain.handle("select-images", async () => {
    const result = await dialog.showOpenDialog({
      title: "选择图片",
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "所有图片格式",
          extensions: [
            "png", "jpg", "jpeg", "bmp", "gif", "webp", "tiff", "tif",
            "heic", "heif", "svg", "psd", "dng", "raw", "cr2", "cr3",
            "nef", "nrw", "arw", "sr2", "srf", "orf", "raf", "rw2",
            "rwl", "3fr", "fff", "mrw", "x3f", "erf", "kdc", "dcr",
            "dcs", "drf", "mef", "mos", "iiq", "rwz"
          ],
        },
        {
          name: "标准图片",
          extensions: ["png", "jpg", "jpeg", "bmp", "gif", "webp", "tiff", "tif", "heic", "heif", "svg"],
        },
        {
          name: "专业格式",
          extensions: ["psd", "dng"],
        },
        {
          name: "RAW 格式",
          extensions: ["raw", "cr2", "cr3", "nef", "nrw", "arw", "sr2", "srf", "orf", "raf", "rw2", "rwl", "3fr", "fff", "mrw", "x3f", "erf", "kdc", "dcr", "dcs", "drf", "mef", "mos", "iiq", "rwz"],
        },
      ],
    });

    if (result.canceled) {
      return [];
    }

    return result.filePaths.map(toImageResource);
  });

  ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog({
      title: "选择文件夹",
      properties: ["openDirectory"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const directory = result.filePaths[0];

    try {
      const tree = await readDirectoryTree(directory);
      const images = collectImages(tree);
      return { directory, images, tree };
    } catch (error) {
      console.error("读取目录中的图片失败:", error);
      return { directory, images: [], tree: null };
    }
  });

  ipcMain.handle("dialog:select-directory", async (_event, payload?: { title?: string }) => {
    const title = payload?.title ?? "选择文件夹";
    const result = await dialog.showOpenDialog({
      title,
      properties: ["openDirectory", "createDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
}

async function readDirectoryTree(
  directory: string
): Promise<DirectoryNode | null> {
  const dirEntries = await readdir(directory, { withFileTypes: true });
  const images: string[] = [];
  const children: DirectoryNode[] = [];

  for (const entry of dirEntries) {
    if (entry.isDirectory()) {
      const childNode = await readDirectoryTree(join(directory, entry.name));
      if (childNode) {
        children.push(childNode);
      }
      continue;
    }

    if (!entry.isFile()) continue;

    const extension = extname(entry.name).slice(1).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(extension)) continue;

    const filePath = join(directory, entry.name);
    images.push(toImageResource(filePath));
  }

  children.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );
  images.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (images.length === 0 && children.length === 0) {
    return null;
  }

  return {
    name: basename(directory),
    path: directory,
    images,
    children,
  };
}

function collectImages(node: DirectoryNode | null): string[] {
  if (!node) return [];
  const images = [...node.images];
  for (const child of node.children) {
    images.push(...collectImages(child));
  }
  return images;
}

function toImageResource(filePath: string) {
  return `${LOCAL_FILE_PROTOCOL_SCHEME}://resource?path=${encodeURIComponent(
    filePath
  )}`;
}
