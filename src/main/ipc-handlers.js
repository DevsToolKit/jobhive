const { app, ipcMain, shell } = require('electron');
const os = require('os');
const { exec } = require('child_process');

function createNoopUpdater() {
  const preferences = {
    autoCheckOnLaunch: true,
    autoDownload: true,
  };

  return {
    getPreferences: () => preferences,
    setPreferences: (nextPreferences = {}) => Object.assign(preferences, nextPreferences),
    getStatus: () => ({
      ok: true,
      enabled: false,
      status: 'idle',
      message: 'Auto-updates are not available yet.',
      currentVersion: app.getVersion(),
      channel: 'latest',
      updateAvailable: false,
      downloadedVersion: null,
    }),
    checkForUpdates: async function () {
      return this.getStatus();
    },
    downloadUpdate: async function () {
      return this.getStatus();
    },
    quitAndInstall: () => {},
  };
}

function normalizeUrl(rawUrl) {
  const url = new URL(rawUrl);
  const allowedProtocols = new Set(['http:', 'https:', 'mailto:']);

  if (!allowedProtocols.has(url.protocol)) {
    throw new Error(`Unsupported external URL protocol: ${url.protocol}`);
  }

  return url.toString();
}

function setupIpcHandlers({ backendManager, appUpdater }) {
  const updater = appUpdater || createNoopUpdater();

  ipcMain.handle('backend:check-internet', async () => {
    return backendManager.checkInternet();
  });

  ipcMain.handle('backend:start', async () => {
    return backendManager.start();
  });

  ipcMain.handle('backend:restart', async () => {
    await backendManager.stop();
    return backendManager.start();
  });

  ipcMain.handle('backend:status', async () => {
    return backendManager.getStatus();
  });

  ipcMain.handle('app:get-info', async () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      isPackaged: app.isPackaged,
      platform: process.platform,
      logsPath: app.getPath('logs'),
      userDataPath: app.getPath('userData'),
    };
  });

  ipcMain.handle('updater:status', async () => {
    return updater.getStatus();
  });

  ipcMain.handle('updater:preferences:get', async () => {
    return updater.getPreferences();
  });

  ipcMain.handle('updater:preferences:set', async (_, nextPreferences) => {
    return updater.setPreferences(nextPreferences);
  });

  ipcMain.handle('updater:check', async () => {
    return updater.checkForUpdates();
  });

  ipcMain.handle('updater:download', async () => {
    return updater.downloadUpdate();
  });

  ipcMain.handle('updater:quit-and-install', async () => {
    updater.quitAndInstall();
    return { ok: true };
  });

  ipcMain.handle('open-external-url', async (_, rawUrl) => {
    const url = normalizeUrl(rawUrl);

    try {
      await shell.openExternal(url, { activate: true });
      return { ok: true };
    } catch (error) {
      console.error('shell.openExternal failed, trying fallback:', error);
    }

    const platform = os.platform();

    if (platform === 'win32') {
      exec(`start "" "${url}"`, { shell: 'cmd.exe' }, (error) => {
        if (error) console.error('Windows fallback failed:', error);
      });
    } else if (platform === 'darwin') {
      exec(`open "${url}"`, (error) => {
        if (error) console.error('macOS fallback failed:', error);
      });
    } else {
      exec(`xdg-open "${url}"`, (error) => {
        if (error) console.error('Linux fallback failed:', error);
      });
    }

    return { ok: true };
  });
}

module.exports = { setupIpcHandlers };
