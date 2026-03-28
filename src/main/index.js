const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const log = require('electron-log');
const Store = require('electron-store').default;

const BackendManager = require('./backend-manager');
const { setupIpcHandlers } = require('./ipc-handlers');
const AppUpdater = require('./updater');

log.transports.file.level = 'info';
log.transports.console.level = 'info';
log.info('Application starting...');

const store = new Store();

let mainWindow = null;
let backendManager = null;
let appUpdater = null;
let isShuttingDown = false;
let shutdownPromise = null;

const isDev = process.env.NODE_ENV === 'development';

function reportFatalError(title, error, details = {}) {
  const normalizedError = error instanceof Error ? error : new Error(String(error));

  log.error(title, normalizedError, {
    appVersion: app.getVersion(),
    isPackaged: app.isPackaged,
    platform: process.platform,
    ...details,
  });

  if (!app.isReady()) {
    return;
  }

  dialog.showErrorBox(
    title,
    `${normalizedError.message}\n\nCheck the desktop logs in:\n${app.getPath('logs')}`
  );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 760,
    show: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.on('unresponsive', () => {
    log.warn('Main window became unresponsive');
  });

  mainWindow.webContents.on('render-process-gone', (_, details) => {
    reportFatalError('Renderer process crashed', new Error(details.reason), details);
  });

  mainWindow.webContents.on('did-fail-load', (_, code, description, validatedURL) => {
    reportFatalError(
      'Renderer failed to load',
      new Error(description || 'Unknown renderer load failure'),
      { code, validatedURL }
    );
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initialize() {
  try {
    backendManager = new BackendManager({ store, log });
    appUpdater = new AppUpdater({ log, store, getWindow: () => mainWindow });

    setupIpcHandlers({ backendManager, appUpdater });

    createWindow();
    appUpdater.initialize();
  } catch (error) {
    reportFatalError('Initialization failed', error);
    app.quit();
  }
}

async function shutdownApp() {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  shutdownPromise = (async () => {
    isShuttingDown = true;

    if (appUpdater) {
      appUpdater.dispose();
    }

    if (backendManager) {
      await backendManager.stop();
    }
  })()
    .catch((error) => {
      log.error('Application shutdown failed', error);
    })
    .finally(() => {
      shutdownPromise = null;
    });

  return shutdownPromise;
}

process.on('uncaughtException', (error) => {
  reportFatalError('Main process crashed', error);
});

process.on('unhandledRejection', (error) => {
  reportFatalError('Unhandled promise rejection', error);
});

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) {
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  });

  app.whenReady().then(initialize);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!isShuttingDown && BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', (event) => {
  if (isShuttingDown) {
    return;
  }

  event.preventDefault();

  shutdownApp().finally(() => {
    app.exit(0);
  });
});
