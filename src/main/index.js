const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');
const Store = require('electron-store').default;

const BackendManager = require('./backend-manager');
const { setupIpcHandlers } = require('./ipc-handlers');

// Configure logging
log.transports.file.level = 'info';
log.info('Application starting...');

// Initialize store for settings
const store = new Store();

// Global references
let mainWindow = null;
let backendManager = null;

// Check if running in development
const isDev = process.env.NODE_ENV === 'development';

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false, // Don't show until ready
    backgroundColor: '#ffffff',
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Load the app
  if (isDev) {
    // Development: load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log.info('Main window shown');
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Setup IPC handlers
  setupIpcHandlers(mainWindow, backendManager, store);
}

/**
 * Initialize the application
 */
async function initialize() {
  try {
    log.info('Initializing backend...');

    // Create and start backend manager
    backendManager = new BackendManager();
    await backendManager.start();

    log.info('Backend started successfully');

    // Create the window
    createWindow();
  } catch (error) {
    log.error('Failed to initialize:', error);

    // Show error dialog
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Startup Error',
      `Failed to start the application:\n\n${error.message}\n\nPlease try restarting the app.`
    );

    app.quit();
  }
}

// App lifecycle events
app.whenReady().then(initialize);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async () => {
  log.info('Application shutting down...');

  // Stop backend
  if (backendManager) {
    await backendManager.stop();
    log.info('Backend stopped');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled rejection at:', promise, 'reason:', reason);
});
