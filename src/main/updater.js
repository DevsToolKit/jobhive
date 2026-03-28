const { app } = require('electron');

let autoUpdater = null;

try {
  ({ autoUpdater } = require('electron-updater'));
} catch {
  autoUpdater = null;
}

const DEFAULT_STATUS = {
  ok: true,
  enabled: false,
  status: 'idle',
  message: 'Auto-updates are not configured.',
  currentVersion: app.getVersion(),
  updateAvailable: false,
  downloadedVersion: null,
};

class AppUpdater {
  constructor({ log, store, getWindow }) {
    this.log = log;
    this.store = store;
    this.getWindow = getWindow;
    this.pollTimer = null;
    this.state = { ...DEFAULT_STATUS };
  }

  initialize() {
    if (!autoUpdater) {
      this.state = {
        ...DEFAULT_STATUS,
        message: 'electron-updater is not installed. Run npm install to enable auto-updates.',
      };
      this.log.warn(this.state.message);
      return;
    }

    if (!app.isPackaged) {
      this.state = {
        ...DEFAULT_STATUS,
        message: 'Auto-updates are disabled in development mode.',
      };
      return;
    }

    autoUpdater.logger = this.log;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
      this.setState({
        ok: true,
        enabled: true,
        status: 'checking',
        message: 'Checking for updates...',
      });
    });

    autoUpdater.on('update-available', (info) => {
      this.setState({
        ok: true,
        enabled: true,
        status: 'available',
        message: `Update ${info.version} is available and downloading.`,
        updateAvailable: true,
      });
    });

    autoUpdater.on('update-not-available', () => {
      this.setState({
        ok: true,
        enabled: true,
        status: 'idle',
        message: 'You are on the latest version.',
        updateAvailable: false,
      });
    });

    autoUpdater.on('download-progress', (progress) => {
      this.setState({
        ok: true,
        enabled: true,
        status: 'downloading',
        message: `Downloading update: ${Math.round(progress.percent)}%`,
        updateAvailable: true,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.setState({
        ok: true,
        enabled: true,
        status: 'downloaded',
        message: `Update ${info.version} is ready to install.`,
        updateAvailable: true,
        downloadedVersion: info.version,
      });
    });

    autoUpdater.on('error', (error) => {
      this.log.error('Auto-update error', error);
      this.setState({
        ok: false,
        enabled: true,
        status: 'error',
        message: error?.message || 'Auto-update failed.',
      });
    });

    this.setState({
      ok: true,
      enabled: true,
      status: 'idle',
      message: 'Auto-updates are enabled.',
    });

    this.checkForUpdates();
    this.pollTimer = setInterval(() => {
      this.checkForUpdates();
    }, 6 * 60 * 60 * 1000);
  }

  dispose() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async checkForUpdates() {
    if (!autoUpdater || !app.isPackaged) {
      return this.getStatus();
    }

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.log.error('Failed to check for updates', error);
      this.setState({
        ok: false,
        enabled: true,
        status: 'error',
        message: error?.message || 'Failed to check for updates.',
      });
    }

    return this.getStatus();
  }

  async downloadUpdate() {
    if (!autoUpdater || !app.isPackaged) {
      return this.getStatus();
    }

    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      this.log.error('Failed to download update', error);
      this.setState({
        ok: false,
        enabled: true,
        status: 'error',
        message: error?.message || 'Failed to download update.',
      });
    }

    return this.getStatus();
  }

  quitAndInstall() {
    if (autoUpdater && app.isPackaged) {
      autoUpdater.quitAndInstall();
    }
  }

  getStatus() {
    return {
      ...this.state,
      currentVersion: app.getVersion(),
    };
  }

  setState(nextState) {
    this.state = {
      ...this.state,
      ...nextState,
      currentVersion: app.getVersion(),
    };

    this.store.set('updates.state', this.state);
    this.store.set('updates.lastCheckedAt', new Date().toISOString());

    const window = this.getWindow();
    if (window && !window.isDestroyed()) {
      window.webContents.send('updater:status', this.state);
    }
  }
}

module.exports = AppUpdater;
