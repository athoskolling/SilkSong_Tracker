// The only bridge between the page and the main process. It exposes what the page needs
// and nothing else, so the page never gets direct access to Node or Electron.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlay', {
  quit: () => ipcRenderer.send('overlay:quit'),
  onMode: (callback) => {
    ipcRenderer.on('overlay:mode', (_event, mode) => callback(mode));
  },
});
