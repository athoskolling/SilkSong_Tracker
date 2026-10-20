// A safety net, not part of the guide itself. It is a classic script (not a module) on purpose:
// the thing it guards against is a module that fails to load, and a module would fail the same way.
//
// Why it exists: GitHub Pages and browsers cache every file separately for a few minutes, so right
// after an update a visitor can get a new page script together with an older cached js/render.js
// (or the reverse). The ES module import then fails, nothing builds the page, and <main id="app">
// stays empty. This script waits a few seconds after the page has loaded and, only if #app is still
// empty, says what happened and what to do. Pages that built themselves are never touched, and a
// page that finishes late simply replaces the message (every page fills #app with replaceChildren).
(function () {
  var WAIT_MS = 4000;

  // <noscript> counts as empty: it is the no-JavaScript text, not page content.
  function hasContent(app) {
    for (var i = 0; i < app.children.length; i++) {
      if (app.children[i].tagName !== 'NOSCRIPT') return true;
    }
    return false;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function showMessage(app) {
    var heading = el('h1', 'plate-heading', 'This page did not load.');
    var text = el(
      'p',
      'plate-text',
      'This can happen for a few minutes after the guide is updated. Reload the page; if it stays blank, hold Shift while you reload.'
    );
    var button = el('button', 'button button--primary', 'Reload');
    button.type = 'button';
    button.addEventListener('click', function () {
      location.reload();
    });
    var row = el('p', 'button-row');
    row.appendChild(button);

    var plate = el('div', 'plate message');
    // role="alert" so a screen reader announces it: nothing else on the page will.
    plate.setAttribute('role', 'alert');
    plate.appendChild(heading);
    plate.appendChild(text);
    plate.appendChild(row);

    var frame = el('div', 'frame main-plain');
    frame.appendChild(plate);
    app.appendChild(frame);
  }

  // A slow connection can still be fetching data/*.json when the four seconds are up. Count the requests
  // that are in flight (the wrapper hands back the very same promise, so callers see no difference) and
  // give them a little longer, up to EXTRA_WAITS times, before calling the page broken.
  var pending = 0;
  var EXTRA_WAITS = 3;
  var EXTRA_MS = 2000;
  if (typeof window.fetch === 'function') {
    var realFetch = window.fetch;
    window.fetch = function () {
      var request = realFetch.apply(this, arguments);
      pending++;
      var settled = function () {
        pending--;
      };
      request.then(settled, settled);
      return request;
    };
  }

  function check(waitsLeft) {
    var app = document.getElementById('app');
    if (!app || hasContent(app)) return;
    if (pending > 0 && waitsLeft > 0) {
      setTimeout(function () {
        check(waitsLeft - 1);
      }, EXTRA_MS);
      return;
    }
    showMessage(app);
  }

  function schedule() {
    setTimeout(function () {
      check(EXTRA_WAITS);
    }, WAIT_MS);
  }

  // Count the four seconds from the end of loading, so a slow connection is not blamed on the page.
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);
})();
