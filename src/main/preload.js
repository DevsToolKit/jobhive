// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('app', {
  check_for_updates: async () => {
    return false; // stub
  },
  start_backend: () => ipcRenderer.invoke('backend:start'),
  check_internet: () => ipcRenderer.invoke('backend:check-internet'),
});
