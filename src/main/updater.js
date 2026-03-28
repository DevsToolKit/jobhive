const { app } = require('electron');

const semver = require('semver');

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
  channel: 'latest',
  updateAvailable: false,
  downloadedVersion: null,
};

function normalizeChannel(value) {
  return value?.trim().toLowerCase() || null;
}

function getVersionChannel(version) {
  const prerelease = semver.prerelease(version);

  if (!prerelease || prerelease.length === 0) {
    return 'latest';
  }

  return String(prerelease[0]).toLowerCase();
}

class AppUpdater {
  constructor({ log, store, getWindow }) {
    this.log = log;
    this.store = store;
    this.getWindow = getWindow;
    this.pollTimer = null;
    this.channel = normalizeChannel(process.env.JOBHIVE_UPDATE_CHANNEL) || getVersionChannel(app.getVersion());
    this.state = { ...DEFAULT_STATUS, channel: this.channel };
  }

  getPreferences() {
    return {
      autoCheckOnLaunch: this.store.get('updates.preferences.autoCheckOnLaunch', true),
      autoDownload: this.store.get('updates.preferences.autoDownload', true),
    };
  }

  syncPolling(autoCheckOnLaunch) {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (!autoCheckOnLaunch) {
      return;
    }

    this.pollTimer = setInterval(() => {
      this.checkForUpdates();
    }, 6 * 60 * 60 * 1000);
  }

  setPreferences(nextPreferences = {}) {
    const preferences = {
      ...this.getPreferences(),
      ...nextPreferences,
    };

    this.store.set('updates.preferences.autoCheckOnLaunch', preferences.autoCheckOnLaunch);
    this.store.set('updates.preferences.autoDownload', preferences.autoDownload);

    if (autoUpdater) {
      autoUpdater.autoDownload = preferences.autoDownload;
    }

    this.syncPolling(preferences.autoCheckOnLaunch);

    if (this.state.enabled) {
      this.setState({
        message: preferences.autoCheckOnLaunch
          ? 'Auto-updates are enabled.'
          : 'Auto-updates are enabled, but automatic checks are turned off.',
      });
    }

    return preferences;
  }

  configureAutoUpdater(preferences) {
    const isPrereleaseChannel = this.channel !== 'latest';

    autoUpdater.logger = this.log;
    autoUpdater.autoDownload = preferences.autoDownload;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.fullChangelog = true;
    autoUpdater.allowPrerelease = isPrereleaseChannel;

    if (isPrereleaseChannel) {
      autoUpdater.channel = this.channel;
    }

    // Avoid automatic downgrades when moving between channels.
    autoUpdater.allowDowngrade = false;

    this.log.info(
      {
        currentVersion: app.getVersion(),
        channel: this.channel,
        allowPrerelease: autoUpdater.allowPrerelease,
      },
      'Configured auto-updater channel'
    );
  }

  getActionableErrorMessage(error) {
    const message = error?.message || 'Auto-update failed.';

    if (
      this.channel === 'latest' &&
      /Unable to find latest version on GitHub|Cannot parse releases feed|HTTP 406/i.test(message)
    ) {
      return 'No stable GitHub release is available for the stable update channel. GitHub /releases/latest ignores prereleases, so publish a non-prerelease release or ship this build on the beta channel.';
    }

    return message;
  }

  initialize() {
    if (!autoUpdater) {
      this.state = {
        ...DEFAULT_STATUS,
        channel: this.channel,
        message: 'electron-updater is not installed. Run npm install to enable auto-updates.',
      };
      this.log.warn(this.state.message);
      return;
    }

    if (!app.isPackaged) {
      this.state = {
        ...DEFAULT_STATUS,
        channel: this.channel,
        message: 'Auto-updates are disabled in development mode.',
      };
      return;
    }

    const preferences = this.getPreferences();

    this.configureAutoUpdater(preferences);

    autoUpdater.on('checking-for-update', () => {
      this.setState({
        ok: true,
        enabled: true,
        status: 'checking',
        channel: this.channel,
        message: 'Checking for updates...',
      });
    });

    autoUpdater.on('update-available', (info) => {
      this.setState({
        ok: true,
        enabled: true,
        status: 'available',
        channel: this.channel,
        message: `Update ${info.version} is available and downloading.`,
        updateAvailable: true,
      });
    });

    autoUpdater.on('update-not-available', () => {
      this.setState({
        ok: true,
        enabled: true,
        status: 'idle',
        channel: this.channel,
        message: 'You are on the latest version.',
        updateAvailable: false,
      });
    });

    autoUpdater.on('download-progress', (progress) => {
      this.setState({
        ok: true,
        enabled: true,
        status: 'downloading',
        channel: this.channel,
        message: `Downloading update: ${Math.round(progress.percent)}%`,
        updateAvailable: true,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.setState({
        ok: true,
        enabled: true,
        status: 'downloaded',
        channel: this.channel,
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
        channel: this.channel,
        message: this.getActionableErrorMessage(error),
      });
    });

    this.setState({
      ok: true,
      enabled: true,
      status: 'idle',
      channel: this.channel,
      message: preferences.autoCheckOnLaunch
        ? 'Auto-updates are enabled.'
        : 'Auto-updates are enabled, but automatic checks are turned off.',
    });

    this.syncPolling(preferences.autoCheckOnLaunch);

    if (preferences.autoCheckOnLaunch) {
      this.checkForUpdates();
    }
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
        channel: this.channel,
        message: this.getActionableErrorMessage(error),
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
        channel: this.channel,
        message: this.getActionableErrorMessage(error),
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
      channel: this.channel,
    };
  }

  setState(nextState) {
    this.state = {
      ...this.state,
      ...nextState,
      currentVersion: app.getVersion(),
      channel: this.channel,
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
