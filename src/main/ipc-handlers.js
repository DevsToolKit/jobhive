const { ipcMain, dialog } = require("electron");
const log = require("electron-log");
const Store = require("electron-store");

/**
 * Setup all IPC handlers
 */
function setupIpcHandlers(mainWindow, backendManager, store) {
  // Get backend info
  ipcMain.handle("get-backend-info", async () => {
    return backendManager.getInfo();
  });

  // Backend health check
  ipcMain.handle("backend-health-check", async () => {
    return await backendManager.healthCheck();
  });

  // Show save dialog
  ipcMain.handle("show-save-dialog", async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  });

  // Show open dialog
  ipcMain.handle("show-open-dialog", async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });

  // Get app version
  ipcMain.handle("get-app-version", () => {
    return require("electron").app.getVersion();
  });

  // Store operations
  ipcMain.handle("store-get", (event, key) => {
    return store.get(key);
  });

  ipcMain.handle("store-set", (event, key, value) => {
    store.set(key, value);
    return true;
  });

  ipcMain.handle("store-delete", (event, key) => {
    store.delete(key);
    return true;
  });

  // Log from renderer
  ipcMain.on("log-info", (event, message) => {
    log.info(`[Renderer] ${message}`);
  });

  ipcMain.on("log-error", (event, message) => {
    log.error(`[Renderer] ${message}`);
  });

  log.info("IPC handlers registered");
}

module.exports = { setupIpcHandlers };
