// ipc-handlers.js
const { ipcMain, shell } = require('electron');
const os = require('os');
const { exec } = require('child_process');

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

  ipcMain.handle('open-external-url', async (_, url) => {
    try {
      await shell.openExternal(url, { activate: true });
      return; // 👈 THIS stops the fallback
    } catch (err) {
      console.error('shell.openExternal failed, trying fallback:', err);
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
  });
}

module.exports = { setupIpcHandlers };
