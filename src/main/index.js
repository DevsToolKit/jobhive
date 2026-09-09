const { app, BrowserWindow, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
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

function resolveAppIcon() {
  const possiblePaths = [
    path.join(__dirname, '../../resources/icon.ico'),
    path.join(process.resourcesPath, 'icon.ico'),
    path.join(process.resourcesPath, 'resources/icon.ico'),
  ];

  for (const iconPath of possiblePaths) {
    if (fs.existsSync(iconPath)) {
      return iconPath;
    }
  }

  return undefined;
}

function createApplicationMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }]
          : [{ role: 'close' }]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function saveWindowState() {
  if (!mainWindow) return;

  try {
    const isMaximized = mainWindow.isMaximized();
    store.set('window.isMaximized', isMaximized);

    if (!isMaximized) {
      const bounds = mainWindow.getBounds();
      store.set('window.bounds', bounds);
    }
  } catch (err) {
    log.warn('Failed to save window state:', err);
  }
}

function createWindow() {
  const savedBounds = store.get('window.bounds', {});
  const wasMaximized = store.get('window.isMaximized', false);

  const isMac = process.platform === 'darwin';
  const isWin = process.platform === 'win32';

  mainWindow = new BrowserWindow({
    width: savedBounds.width || 1400,
    height: savedBounds.height || 900,
    x: savedBounds.x,
    y: savedBounds.y,
    minWidth: 1100,
    minHeight: 760,
    show: false,
    icon: resolveAppIcon(),
    backgroundColor: '#0f172a',
    autoHideMenuBar: !isMac,
    titleBarStyle: isMac ? 'hiddenInset' : isWin ? 'hidden' : 'default',
    ...(isMac
      ? { trafficLightPosition: { x: 16, y: 16 } }
      : isWin
        ? {
            titleBarOverlay: {
              color: '#0f172a',
              symbolColor: '#cbd5e1',
              height: 44,
            },
          }
        : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  if (!isMac) {
    mainWindow.setMenuBarVisibility(false);
  }

  if (wasMaximized) {
    mainWindow.maximize();
  }

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

  // Navigation & Security Hardening
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const isDevUrl = isDev && navigationUrl.startsWith('http://localhost:5173');
    const isFileUrl = navigationUrl.startsWith('file://');

    if (!isDevUrl && !isFileUrl) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
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

  mainWindow.on('close', () => {
    saveWindowState();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initialize() {
  try {
    createApplicationMenu();

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

    saveWindowState();

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
