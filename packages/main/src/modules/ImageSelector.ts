import { ipcMain, dialog } from "electron";
import { readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { LOCAL_FILE_PROTOCOL_SCHEME } from "./LocalFileProtocol.js";

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "bmp",
  "gif",
  "webp",
  "tiff",
  "svg",
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
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "bmp", "gif", "webp"],
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
