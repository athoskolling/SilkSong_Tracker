// account-page.js: the second half of the Account page (docs/CONTRACTS.md section 5).
// main.js builds the page shell and the sign-in plate; this module adds Backup file, Start a new
// run, How saving works and Guide data next to it. It never touches the sign-in plate.
// Progress is touched only through progress.js; whether someone is signed in comes from firebase.js
// (onAuthChange), used here only to word the "Start a new run" text.

import { exportProgress, importProgress, clearProgress } from './progress.js';
import { onAuthChange } from './firebase.js';
import { loadData } from './data.js';

// ---------------------------------------------------------------- tiny helpers

// Same idea as the helper in render.js (which does not export its own): h('div', { class: 'x' }, 'text', child).
// Text always goes in through the DOM, never innerHTML.
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    el.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child);
  }
  return el;
}

// "silksong-guide-backup-2026-10-19.json", using the player's own calendar day, not UTC.
function backupFileName(now = new Date()) {
  const two = (n) => String(n).padStart(2, '0');
  return `silksong-guide-backup-${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}.json`;
}

function countText(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}

// Hands the Blob from progress.js to the browser as a file download. Returns the file name.
function downloadBackup() {
  const name = backupFileName();
  const url = URL.createObjectURL(exportProgress());
  const link = h('a', { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  // Revoke later, not at once: some browsers start reading the URL after click() returns.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return name;
}

// ------------------------------------------------------------- Backup file

// Messages go in a live region that is built once and never replaced, so a screen reader hears each
// new text. kind 'error' makes it --silk (and the words say what happened and what to do).
function say(region, text, kind = 'info') {
  region.textContent = text;
  region.className = kind === 'error' ? 'form-message is-error' : 'form-message';
}

function importedText({ addedDone, addedVisited }) {
  if (!addedDone && !addedVisited) {
    return 'That backup had nothing new. Your progress was not changed.';
  }
  return (
    `Added ${countText(addedDone, 'entry', 'entries')} and ${countText(addedVisited, 'Region', 'Regions')} from the backup. ` +
    'Nothing was removed.'
  );
}

function buildBackup() {
  const message = h('p', { class: 'form-message', 'aria-live': 'polite' });
  // A real file input, kept out of sight: the visible control is a button that opens it, so it looks
  // like the other buttons and works with the keyboard.
  const input = h('input', { type: 'file', id: 'backup-file', accept: '.json,application/json', hidden: true });

  const section = h(
    'section',
    { class: 'plate', 'aria-labelledby': 'backup-heading' },
    h('h2', { class: 'plate-heading', id: 'backup-heading' }, 'Backup file'),
    h(
      'p',
      { class: 'plate-text' },
      'Download your progress as a file, or add a backup you saved earlier. It works with or without an account.'
    ),
    h(
      'div',
      { class: 'button-row' },
      h('button', { type: 'button', class: 'button button--primary', 'data-action': 'download-backup' }, 'Download backup'),
      h('button', { type: 'button', class: 'button button--secondary', 'data-action': 'add-backup' }, 'Add a backup file'),
      input
    ),
    h(
      'p',
      { class: 'plate-help' },
      'Adding a backup keeps everything you have and adds what the file has. It never removes progress.'
    ),
    message
  );

  section.querySelector('[data-action="download-backup"]').addEventListener('click', () => {
    try {
      say(message, `Backup downloaded as ${downloadBackup()}.`);
    } catch (error) {
      console.error(error);
      say(message, 'The backup could not be downloaded. Reload the page and try again.', 'error');
    }
  });

  section.querySelector('[data-action="add-backup"]').addEventListener('click', () => input.click());

  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      say(message, importedText(await importProgress(file)));
    } catch (error) {
      // progress.js writes the rejection message for people ("That file is not a Silksong Guide backup...").
      say(message, error.message, 'error');
    } finally {
      input.value = ''; // so choosing the same file again still fires "change"
    }
  });

  return section;
}

// ------------------------------------------------------------ Start a new run

function buildNewRun() {
  let signedIn = false;
  let confirming = false;

  const message = h('p', { class: 'form-message', 'aria-live': 'polite' });
  const where = () => (signedIn ? 'on this device and in your account' : 'on this device');

  const intro = h('p', { class: 'plate-text' });
  const startButton = h(
    'button',
    { type: 'button', class: 'button button--danger', 'data-action': 'start-run' },
    'Start a new run'
  );
  const startRow = h('div', { class: 'button-row' }, startButton);

  const warning = h('p', { class: 'confirm-text', id: 'run-warning' });
  const downloadFirst = h(
    'button',
    { type: 'button', class: 'button button--primary', 'data-action': 'download-first' },
    'Download backup first'
  );
  const clearButton = h(
    'button',
    { type: 'button', class: 'button button--danger-solid', 'data-action': 'clear-run' },
    'Clear my progress'
  );
  const cancelButton = h('button', { type: 'button', class: 'button button--text', 'data-action': 'cancel-run' }, 'Cancel');
  // tabindex -1 so focus can move to the plate itself: a screen reader then reads the warning first.
  const confirmPlate = h(
    'div',
    { class: 'callout confirm', role: 'group', 'aria-labelledby': 'run-warning', tabindex: '-1', hidden: true },
    warning,
    h('div', { class: 'button-row' }, downloadFirst, clearButton, cancelButton)
  );

  function refreshText() {
    intro.textContent = `Clears your progress ${where()} so you can start again from nothing. You get a chance to download a backup first.`;
    warning.textContent = `This clears all your progress ${where()}. It cannot be undone.`;
  }

  function openConfirm() {
    confirming = true;
    startRow.hidden = true;
    confirmPlate.hidden = false;
    say(message, '');
    confirmPlate.focus();
  }

  // Focus goes back to the button that opened the plate, so a keyboard user is not left behind.
  function closeConfirm() {
    confirming = false;
    confirmPlate.hidden = true;
    startRow.hidden = false;
    startButton.focus();
  }

  startButton.addEventListener('click', openConfirm);
  cancelButton.addEventListener('click', () => {
    closeConfirm();
    say(message, 'Nothing was cleared. Your progress is as it was.');
  });
  confirmPlate.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && confirming) {
      event.stopPropagation();
      cancelButton.click();
    }
  });

  downloadFirst.addEventListener('click', () => {
    try {
      say(message, `Backup downloaded as ${downloadBackup()}. You can clear your progress now.`);
    } catch (error) {
      console.error(error);
      say(message, 'The backup could not be downloaded, so nothing was cleared. Reload the page and try again.', 'error');
    }
  });

  clearButton.addEventListener('click', async () => {
    clearButton.disabled = true;
    try {
      await clearProgress();
      closeConfirm();
      // Not a promise about other devices: one that still holds the old run can write it back (contract section 3).
      say(
        message,
        signedIn
          ? 'Your progress is cleared on this device. Your account copy is being deleted; the line at the bottom of the page says if that fails.'
          : 'Your progress is cleared on this device. You can start again from nothing.'
      );
    } catch (error) {
      console.error(error);
      say(message, 'Your progress could not be cleared. Reload the page and try again.', 'error');
    } finally {
      clearButton.disabled = false;
    }
  });

  const section = h(
    'section',
    { class: 'plate', 'aria-labelledby': 'run-heading' },
    h('h2', { class: 'plate-heading', id: 'run-heading' }, 'Start a new run'),
    intro,
    startRow,
    confirmPlate,
    message
  );

  refreshText();
  // The wording follows the account: "on this device" until someone signs in.
  onAuthChange((user) => {
    signedIn = Boolean(user);
    refreshText();
  });

  return section;
}

// ------------------------------------------------------------ How saving works

function savingRow(markClass, title, text) {
  return h(
    'li',
    { class: 'saving-row' },
    h('span', { class: `saving-mark ${markClass}`, 'aria-hidden': 'true' }),
    h('div', {}, h('span', { class: 'saving-title' }, title), h('p', { class: 'plate-help' }, text))
  );
}

function buildSide() {
  const version = h('dd', { class: 'data-value' }, 'Loading');
  const regionCount = h('dd', { class: 'data-value' }, 'Loading');

  const side = h(
    'section',
    { class: 'plate account-side', 'aria-labelledby': 'saving-heading' },
    h('h2', { class: 'plate-heading', id: 'saving-heading' }, 'How saving works'),
    h(
      'ul',
      { class: 'saving-list' },
      savingRow('saving-mark--device', 'On this device', 'Every change is saved here first, so the guide works without an account.'),
      savingRow('saving-mark--account', 'In your account', 'After you sign in, your progress syncs between your devices.'),
      savingRow(
        'saving-mark--differ',
        'When they differ',
        'The first time you sign in, both are combined. After that, the most recent change wins.'
      )
    ),
    h(
      'div',
      {},
      h('h3', { class: 'data-heading' }, 'Guide data'),
      h(
        'dl',
        { class: 'data-list' },
        h('div', { class: 'data-row' }, h('dt', {}, 'Version'), version),
        h('div', { class: 'data-row' }, h('dt', {}, 'Regions in the guide'), regionCount)
      )
    )
  );

  // Read through data.js, like every other page. A data problem only blanks these two lines.
  loadData()
    .then(({ regions, dataVersion, sample }) => {
      version.textContent = dataVersion === null ? 'Unknown' : sample ? `${dataVersion} (sample)` : String(dataVersion);
      regionCount.textContent = String(regions.length);
    })
    .catch((error) => {
      console.error(error);
      version.textContent = 'Not loaded';
      regionCount.textContent = 'Not loaded';
    });

  return side;
}

// ------------------------------------------------------------------- page

// main.js builds .account-column synchronously, but module scripts do not promise an order, so wait for it.
function whenShellReady(callback) {
  const app = document.getElementById('app');
  const find = () => app.querySelector('.account-column');
  if (find()) return callback(find());
  const observer = new MutationObserver(() => {
    const column = find();
    if (column) {
      observer.disconnect();
      callback(column);
    }
  });
  observer.observe(app, { childList: true, subtree: true });
}

function addSections(column) {
  // The design is two columns: the account plates on the left, How saving works on the right. The
  // shell only has the left column, so wrap it and put the side plate beside it.
  const layout = h('div', { class: 'account-layout' });
  column.before(layout);
  layout.append(column, buildSide());
  column.append(buildBackup(), buildNewRun());
}

if (document.body.dataset.page === 'account') whenShellReady(addSections);
