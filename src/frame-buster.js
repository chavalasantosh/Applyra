/**
 * Applyra Frame Buster
 * Prevents the main dashboard (index.html) from ever being loaded nested inside an iframe.
 */
(() => {
  'use strict';
  if (window.self !== window.top) {
    try {
      window.top.location.href = window.location.href;
    } catch (e) {
      // In case of cross-origin restriction, navigate parent window
      window.open(window.location.href, '_top');
    }
  }
})();
