// Preload — expõe APENAS uma API mínima e segura ao renderer via contextBridge.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flixon', {
  platform: process.platform,
  version: () => ipcRenderer.invoke('app:version'),
  window: {
    minimize: () => ipcRenderer.send('win:minimize'),
    toggleMaximize: () => ipcRenderer.send('win:toggle-maximize'),
    close: () => ipcRenderer.send('win:close'),
    isMaximized: () => ipcRenderer.invoke('win:is-maximized'),
    onMaximizeChange: (cb) =>
      ipcRenderer.on('win:maximize-changed', (_e, v) => cb(v))
  },
  // Abre um link http/https no navegador do sistema operacional
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  // Recebe aviso de nova versão disponível
  onUpdateAvailable: (cb) =>
    ipcRenderer.on('update-available', (_e, info) => cb(info))
});
