import {AppModule} from '../AppModule.js';
import {BrowserWindow, dialog} from 'electron';
import electronUpdater, {type AppUpdater, type Logger} from 'electron-updater';

type DownloadNotification = Parameters<AppUpdater['checkForUpdatesAndNotify']>[0];

export class AutoUpdater implements AppModule {

  readonly #logger: Logger | null;
  readonly #notification: DownloadNotification;

  constructor(
    {
      logger = null,
      downloadNotification = undefined,
    }:
      {
        logger?: Logger | null | undefined,
        downloadNotification?: DownloadNotification
      } = {},
  ) {
    this.#logger = logger;
    this.#notification = downloadNotification;
  }

  async enable(): Promise<void> {
    await this.runAutoUpdater();
  }

  getAutoUpdater(): AppUpdater {
    // Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
    // It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
    const {autoUpdater} = electronUpdater;
    return autoUpdater;
  }

  async runAutoUpdater() {
    const updater = this.getAutoUpdater();
    const log = (...args: unknown[]) => console.log("[AutoUpdater]", ...args);

    updater.on('checking-for-update', () => log('Checking for update...'));
    updater.on('update-available', info => log('Update available', info?.version ?? 'unknown'));
    updater.on('update-not-available', () => log('No update available'));
    updater.on('error', error => console.error('[AutoUpdater] error', error));
    updater.on('download-progress', progress => log('Download progress', {
      percent: Math.round(progress.percent),
      bytesPerSecond: Math.round(progress.bytesPerSecond),
    }));
    updater.on('update-downloaded', async info => {
      log('Update downloaded', info?.version ?? 'unknown');

      const win =
        BrowserWindow.getFocusedWindow() ??
        BrowserWindow.getAllWindows()[0] ??
        undefined;

      const {response} = await dialog.showMessageBox(win, {
        type: 'info',
        buttons: ['立即重启', '稍后'],
        defaultId: 0,
        cancelId: 1,
        title: '发现新版本',
        message: '应用更新已准备就绪',
        detail: info?.version
          ? `已下载新版本 ${info.version}，现在重启即可应用更新。`
          : '已下载新版本，现在重启即可应用更新。',
      });

      if (response === 0) {
        // 立即重启并安装更新
        updater.quitAndInstall();
      } else {
        // 保持默认行为：用户手动退出应用时再安装
        log('User chose to install update on next app quit');
      }
    });

    try {
      updater.logger = this.#logger || null;
      updater.fullChangelog = true;

      if (import.meta.env.VITE_DISTRIBUTION_CHANNEL) {
        updater.channel = import.meta.env.VITE_DISTRIBUTION_CHANNEL;
      }

      return await updater.checkForUpdatesAndNotify(this.#notification);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('No published versions')) {
          return null;
        }
      }

      throw error;
    }
  }
}


export function autoUpdater(...args: ConstructorParameters<typeof AutoUpdater>) {
  return new AutoUpdater(...args);
}
