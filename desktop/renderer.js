// Page script for the overlay. It only reacts to the main process; it does not read game data yet.
const hint = document.getElementById('hint');

document.getElementById('quit').addEventListener('click', () => {
  window.overlay.quit();
});

window.overlay.onMode(({ clickThrough }) => {
  hint.textContent = clickThrough
    ? 'Clicks pass through to the game. Press Ctrl+Shift+O to get the window back.'
    : 'Press Ctrl+Shift+O to let clicks pass through to the game.';
});
