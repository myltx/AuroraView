import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import type { MenuItemConstructorOptions } from "electron";
import { BrowserWindow, Menu, shell } from "electron";
import { IPC_CHANNELS } from "../ipc/channels.js";

type AppMenuAction = "open-directory" | "refresh-directory";

function dispatchAction(type: AppMenuAction) {
  const win =
    BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  win?.webContents.send(IPC_CHANNELS.APP_ACTION, { type });
}

export function createApplicationMenuModule(): AppModule {
  return {
    async enable({ app }: ModuleContext) {
      await app.whenReady();
      const isMac = process.platform === "darwin";
      if (app.name !== "助眠神奇") {
        app.setName("助眠神奇");
      }

      const template: MenuItemConstructorOptions[] = [
        ...(isMac
          ? ([
              {
                label: app.name,
                submenu: [
                  { role: "about" },
                  { type: "separator" },
                  { role: "services" },
                  { type: "separator" },
                  { role: "hide" },
                  { role: "hideOthers" },
                  { role: "unhide" },
                  { type: "separator" },
                  { role: "quit" },
                ] as MenuItemConstructorOptions[],
              },
            ] as MenuItemConstructorOptions[])
          : []),
        {
          label: "文件",
          submenu: [
            {
              label: "打开目录…",
              accelerator: "CmdOrCtrl+O",
              click: () => dispatchAction("open-directory"),
            },
            {
              label: "刷新目录",
              accelerator: "CmdOrCtrl+R",
              click: () => dispatchAction("refresh-directory"),
            },
            { type: "separator" },
            isMac ? { role: "close" } : { role: "quit" },
          ] as MenuItemConstructorOptions[],
        },
        {
          label: "编辑",
          submenu: [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },
            ...(isMac
              ? [
                  { role: "pasteAndMatchStyle" },
                  { role: "delete" },
                  { role: "selectAll" },
                ]
              : [{ role: "delete" }, { role: "selectAll" }]),
          ] as MenuItemConstructorOptions[],
        },
        {
          label: "视图",
          submenu: [
            { role: "togglefullscreen" },
            { role: "toggleDevTools" },
          ] as MenuItemConstructorOptions[],
        },
        {
          label: "窗口",
          submenu: [
            { role: "minimize" },
            { role: "zoom" },
            ...(isMac
              ? [{ type: "separator" }, { role: "front" }]
              : [{ role: "close" }]),
          ] as MenuItemConstructorOptions[],
        },
        {
          role: "help",
          submenu: [
            {
              label: "使用说明（在线）",
              click: () => {
                shell.openExternal(
                  "https://github.com/mayunlong/Photon#%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97"
                );
              },
            },
            {
              label: "快捷键一览",
              click: () => {
                shell.openExternal(
                  "https://github.com/mayunlong/Photon#%E5%BF%AB%E6%8D%B7%E9%94%AE%E4%B8%80%E8%A7%88"
                );
              },
            },
            { type: "separator" },
            {
              label: "项目文档",
              click: () => {
                shell.openExternal("https://github.com/mayunlong/Photon");
              },
            },
          ] as MenuItemConstructorOptions[],
        },
      ];

      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    },
  };
}
