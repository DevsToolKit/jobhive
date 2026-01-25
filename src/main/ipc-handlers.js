// ipc-handlers.js
const { ipcMain } = require('electron');

function setupIpcHandlers({ backendManager }) {
  ipcMain.handle('backend:check-internet', async () => {
    return backendManager.checkInternet();
  });

  ipcMain.handle('backend:start', async () => {
    return backendManager.start();
  });

  ipcMain.handle('backend:status', async () => {
    return backendManager.getStatus();
  });
}

module.exports = { setupIpcHandlers };
