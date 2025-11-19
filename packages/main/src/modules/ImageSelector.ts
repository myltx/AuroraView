import { ipcMain, dialog } from "electron";

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

    return result.filePaths;
  });

  ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog({
      title: "选择文件夹",
      properties: ["openDirectory"],
    });

    return result.filePaths;
  });
}
