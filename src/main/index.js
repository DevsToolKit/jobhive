const { app, BrowserWindow } = require('electron');
const path = require('path');
const log = require('electron-log');
const Store = require('electron-store').default;

const BackendManager = require('./backend-manager');
const { setupIpcHandlers } = require('./ipc-handlers');

log.transports.file.level = 'info';
log.info('Application starting...');

const store = new Store();

let mainWindow = null;
let backendManager = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
    },
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
}

async function initialize() {
  try {
    backendManager = new BackendManager({ store, log });

    setupIpcHandlers({ backendManager }); // ✅ CLEAN

    createWindow();
  } catch (err) {
    log.error('Initialization failed', err);
    app.quit();
  }
}

app.whenReady().then(initialize);

app.on('before-quit', async () => {
  if (backendManager) {
    await backendManager.stop();
  }
});
