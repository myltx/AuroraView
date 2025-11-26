import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import type { MenuItemConstructorOptions } from "electron";
import { BrowserWindow, Menu, shell, ipcMain } from "electron";
import { IPC_CHANNELS } from "../ipc/channels.js";

type AppMenuAction =
  | "open-directory"
  | "refresh-directory"
  | "view-mode-regular"
  | "view-mode-compact"
  | "theme-auto"
  | "theme-light"
  | "theme-dark"
  | "open-help"
  | "open-psd-manager"
  | "file-copy-paths"
  | "file-copy-to-directory"
  | "file-move-to-directory"
  | "file-export"
  | "file-delete"
  | "perf-balanced"
  | "perf-fast"
  | "perf-eco";

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
      if (app.name !== "助眠神器") {
        app.setName("助眠神器");
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
            {
              label: "复制选中图片路径",
              accelerator: "CmdOrCtrl+C",
              click: () => dispatchAction("file-copy-paths"),
            },
            {
              label: "复制到其他目录…",
              accelerator: "CmdOrCtrl+Shift+C",
              click: () => dispatchAction("file-copy-to-directory"),
            },
            {
              label: "移动到其他目录…",
              accelerator: "CmdOrCtrl+Shift+M",
              click: () => dispatchAction("file-move-to-directory"),
            },
            {
              label: "导出选中图片…",
              accelerator: "CmdOrCtrl+E",
              click: () => dispatchAction("file-export"),
            },
            {
              label: "删除选中图片",
              accelerator: "Delete",
              click: () => dispatchAction("file-delete"),
            },
            { type: "separator" },
            {
              label: "PSD 标记管理…",
              click: () => dispatchAction("open-psd-manager"),
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
            {
              label: "布局",
              submenu: [
                {
                  label: "标准视图",
                  type: "radio",
                  id: "view-mode-regular",
                  checked: true,
                  click: () => dispatchAction("view-mode-regular"),
                },
                {
                  label: "紧凑视图",
                  type: "radio",
                  id: "view-mode-compact",
                  click: () => dispatchAction("view-mode-compact"),
                },
              ] as MenuItemConstructorOptions[],
            },
            { type: "separator" },
            {
              label: "主题",
              submenu: [
                {
                  label: "自动",
                  type: "radio",
                  checked: true,
                  click: () => dispatchAction("theme-auto"),
                },
                {
                  label: "浅色",
                  type: "radio",
                  click: () => dispatchAction("theme-light"),
                },
                {
                  label: "深色",
                  type: "radio",
                  click: () => dispatchAction("theme-dark"),
                },
              ] as MenuItemConstructorOptions[],
            },
            {
              label: "性能模式",
              submenu: [
                {
                  label: "平衡（推荐）",
                  type: "radio",
                  checked: true,
                  click: () => dispatchAction("perf-balanced"),
                },
                {
                  label: "性能优先",
                  type: "radio",
                  click: () => dispatchAction("perf-fast"),
                },
                {
                  label: "省资源",
                  type: "radio",
                  click: () => dispatchAction("perf-eco"),
                },
              ] as MenuItemConstructorOptions[],
            },
            { type: "separator" },
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
              label: "使用说明",
              accelerator: isMac ? "Cmd+/" : "Ctrl+/",
              click: () => dispatchAction("open-help"),
            },
            { type: "separator" },
            {
              label: "项目文档",
              click: () => {
                shell.openExternal("https://github.com/myltx/AuroraView");
              },
            },
          ] as MenuItemConstructorOptions[],
        },
      ];

      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);

      ipcMain.on("view:mode-changed", (_event, mode: "regular" | "compact") => {
        const appMenu = Menu.getApplicationMenu();
        if (!appMenu) return;
        const regularItem = appMenu.getMenuItemById("view-mode-regular");
        const compactItem = appMenu.getMenuItemById("view-mode-compact");
        if (!regularItem || !compactItem) return;
        regularItem.checked = mode === "regular";
        compactItem.checked = mode === "compact";
      });
    },
  };
}
