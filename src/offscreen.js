/**
 * Applyra MV3 Offscreen Worker & Task Coordinator
 * 
 * Provides:
 * - Persistent execution during long-running extractions (prevents SW 30s timeout).
 * - Offscreen DOM parsing using DOMParser (isolated and thread-safe).
 * - Offscreen Blob/Data pipeline coordination.
 */

(function () {
  'use strict';

  // Heartbeat to keep MV3 background service worker alive during active runs
  let heartbeatTimer = null;

  function startHeartbeat() {
    if (heartbeatTimer) return;
    heartbeatTimer = setInterval(() => {
      try {
        chrome.runtime.sendMessage({ type: 'APPLYRA_HEARTBEAT_ACK', timestamp: Date.now() }).catch(() => {});
      } catch {}
    }, 20000);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  // Handle incoming messages from background or dashboard
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message !== 'object') return false;

    switch (message.type) {
      case 'OFFSCREEN_PING':
        sendResponse({ ok: true, source: 'offscreen', timestamp: Date.now() });
        return false;

      case 'START_OFFSCREEN_HEARTBEAT':
        startHeartbeat();
        sendResponse({ ok: true, active: true });
        return false;

      case 'STOP_OFFSCREEN_HEARTBEAT':
        stopHeartbeat();
        sendResponse({ ok: true, active: false });
        return false;

      case 'PARSE_DOM_SNIPPET': {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(message.html || '', 'text/html');
          const title = doc.title || '';
          const bodyText = doc.body ? doc.body.textContent.slice(0, 500) : '';
          sendResponse({ ok: true, title, preview: bodyText });
        } catch (err) {
          sendResponse({ ok: false, error: err.message });
        }
        return false;
      }

      default:
        return false;
    }
  });

  // Start heartbeat upon initialization
  startHeartbeat();
})();
