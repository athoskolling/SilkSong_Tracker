// Main process: owns the window and the global hotkey. It stays small on purpose,
// so the parts that decide how the overlay behaves over the game are easy to review.
const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('node:path');

// Ctrl+Shift+O works while the game has focus, because it is a global shortcut.
const HOTKEY = 'CommandOrControl+Shift+O';

const WIDTH = 340;
const HEIGHT = 460;

let win = null;
let clickThrough = false;

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();

  win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    minWidth: 240,
    minHeight: 160,
    x: workArea.x + workArea.width - WIDTH - 16,
    y: workArea.y + 16,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // 'screen-saver' asks Windows to keep the window above borderless-windowed games.
  // Exclusive fullscreen still covers any overlay, which is why the README asks for borderless mode.
  win.setAlwaysOnTop(true, 'screen-saver');

  win.loadFile(path.join(__dirname, 'index.html'));

  win.webContents.on('did-finish-load', () => sendMode());
}

// When click-through is on, mouse clicks pass through the window to the game.
// The hotkey still works, so the player can always get the window back.
function setClickThrough(on) {
  clickThrough = on;
  win.setIgnoreMouseEvents(on);
  sendMode();
}

function sendMode() {
  if (win && !win.isDestroyed()) {
    win.webContents.send('overlay:mode', { clickThrough });
  }
}

ipcMain.on('overlay:quit', () => app.quit());

app.whenReady().then(() => {
  createWindow();

  const registered = globalShortcut.register(HOTKEY, () => setClickThrough(!clickThrough));
  if (!registered) {
    // Another app already owns this shortcut. The overlay still works, but the hotkey does nothing.
    console.warn(`Could not register ${HOTKEY}. Another app may be using it.`);
  }
});

app.on('will-quit', () => globalShortcut.unregisterAll());

app.on('window-all-closed', () => app.quit());
