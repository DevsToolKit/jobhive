// preload.js
const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('app', {
  check_for_updates: async () => {
    return false; // stub
  },

  get_backend_status: () => ipcRenderer.invoke('backend:status'),
  start_backend: () => ipcRenderer.invoke('backend:start'),
  check_internet: () => ipcRenderer.invoke('backend:check-internet'),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
});
