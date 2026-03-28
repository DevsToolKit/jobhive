const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('app', {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  get_backend_status: () => ipcRenderer.invoke('backend:status'),
  start_backend: () => ipcRenderer.invoke('backend:start'),
  restart_backend: () => ipcRenderer.invoke('backend:restart'),
  check_internet: () => ipcRenderer.invoke('backend:check-internet'),
  getUpdateStatus: () => ipcRenderer.invoke('updater:status'),
  getUpdatePreferences: () => ipcRenderer.invoke('updater:preferences:get'),
  setUpdatePreferences: (preferences) => ipcRenderer.invoke('updater:preferences:set', preferences),
  check_for_updates: () => ipcRenderer.invoke('updater:check'),
  download_update: () => ipcRenderer.invoke('updater:download'),
  quit_and_install_update: () => ipcRenderer.invoke('updater:quit-and-install'),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
});
