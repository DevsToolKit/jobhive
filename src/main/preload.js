const { contextBridge, ipcRenderer } = require("electron");

/**
 * Expose protected methods to renderer process
 */
contextBridge.exposeInMainWorld("electron", {
  // Backend API
  getBackendInfo: () => ipcRenderer.invoke("get-backend-info"),
  backendHealthCheck: () => ipcRenderer.invoke("backend-health-check"),

  // Dialog API
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),
  showOpenDialog: (options) => ipcRenderer.invoke("show-open-dialog", options),

  // App API
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  // Store API (for settings)
  store: {
    get: (key) => ipcRenderer.invoke("store-get", key),
    set: (key, value) => ipcRenderer.invoke("store-set", key, value),
    delete: (key) => ipcRenderer.invoke("store-delete", key),
  },

  // Logging API
  log: {
    info: (message) => ipcRenderer.send("log-info", message),
    error: (message) => ipcRenderer.send("log-error", message),
  },
});
