/*
 * Shared JSON-safe extension messaging with request correlation and timeouts.
 * Messages remain flat (message.type still exists) so older handlers keep working.
 */
(() => {
  'use strict';
  const PROTOCOL_VERSION = 1;
  const DEFAULT_TIMEOUT_MS = 12000;
  const MAX_TIMEOUT_MS = 180000;

  // Long-running extension operations must not share the short UI RPC timeout.
  // These are transport budgets, not artificial delays: the operation can still
  // resolve immediately, but the message channel is allowed to stay open long
  // enough for real Naukri navigation / DOM work to finish.
  const REQUEST_TIMEOUT_FLOORS = Object.freeze({
    EXTRACT_PROFILE: 90000,
    OPEN_PROFILE_SECTION: 30000,
    OPEN_NAUKRI_SEARCH: 60000,
    PREVIEW_NAUKRI_AUTO_APPLY: 60000,
    RUN_NAUKRI_AUTO_APPLY: 150000,
    RUN_NAUKRI_SEARCH_AUTO_APPLY: 150000,
    CHECK_NAUKRI_AUTO_APPLY: 45000,
    RUN_PROFILE_BOOST_NOW: 90000,
    RECOVER_PROFILE_BOOST: 90000
  });

  function toJsonSafeMessage(message) {
    try {
      const encoded = JSON.stringify(message, (_key, value) => {
        if (typeof value === "undefined" || typeof value === "function" || typeof value === "symbol") return undefined;
        if (typeof value === "bigint") throw new TypeError("BigInt values are not supported");
        return value;
      });
      if (encoded === undefined) throw new TypeError("The message must be a JSON value");
      return JSON.parse(encoded);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new TypeError("Runtime message is not JSON-serializable: " + reason);
    }
  }

  function randomId(prefix='req') {
    const bytes = new Uint8Array(12);
    if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
    else for (let i=0;i<bytes.length;i+=1) bytes[i]=Math.floor(Math.random()*256);
    return `${prefix}-${Date.now().toString(36)}-${Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}`;
  }

  function createRequest(message, options={}) {
    const safe = toJsonSafeMessage(message || {});
    if (!safe || typeof safe !== 'object' || Array.isArray(safe)) throw new TypeError('Runtime request must be an object.');
    const existing = safe.__nc && typeof safe.__nc === 'object' ? safe.__nc : {};
    return {
      ...safe,
      __nc: {
        protocolVersion: PROTOCOL_VERSION,
        requestId: String(existing.requestId || options.requestId || randomId()),
        sentAt: String(existing.sentAt || new Date().toISOString())
      }
    };
  }

  function requestId(message) { return String(message?.__nc?.requestId || ''); }
  function withResponseMeta(request, response) {
    const safe = toJsonSafeMessage(response == null ? {} : response);
    if (!safe || typeof safe !== 'object' || Array.isArray(safe)) return safe;
    const id = requestId(request);
    if (!id) return safe;
    return {
      ...safe,
      __nc: {
        protocolVersion: PROTOCOL_VERSION,
        requestId: id,
        respondedAt: new Date().toISOString()
      }
    };
  }

  function validateResponse(request, response) {
    const expected = requestId(request);
    const received = String(response?.__nc?.requestId || '');
    if (expected && !received) throw new Error('Extension response correlation metadata is missing.');
    if (expected && received !== expected) throw new Error('Extension response correlation failed.');
    return response;
  }

  function effectiveTimeoutMs(request, requestedTimeoutMs) {
    const type = String(request?.type || '');
    const floor = Number(REQUEST_TIMEOUT_FLOORS[type]) || 0;
    let requested = Number(requestedTimeoutMs);
    if (!Number.isFinite(requested) || requested <= 0) requested = DEFAULT_TIMEOUT_MS;
    if (type === 'EXTRACT_PROFILE') {
      const pageWait = Math.max(0, Number(request?.waitMs) || 0);
      // Cold Naukri profile pages can spend tens of seconds hydrating lazy sections.
      // Keep a generous transport margin so first capture does not lose the channel.
      requested = Math.max(requested, pageWait + 45000);
    }
    return Math.max(1000, Math.min(MAX_TIMEOUT_MS, Math.max(requested, floor)));
  }

  function sendWithTimeout(invoke, request, timeoutMs=DEFAULT_TIMEOUT_MS) {
    const ms = effectiveTimeoutMs(request, timeoutMs);
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error(`Extension request timed out after ${ms} ms.`));
      }, ms);
      const done = (error, response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else {
          try { resolve(validateResponse(request, response)); }
          catch (e) { reject(e); }
        }
      };
      try { invoke(done); } catch (error) { done(error); }
    });
  }

  function sendRuntime(chromeApi, message, options={}) {
    if (!chromeApi?.runtime?.sendMessage) return Promise.reject(new Error('Extension runtime messaging is unavailable.'));
    const request = createRequest(message, options);
    return sendWithTimeout((done) => {
      chromeApi.runtime.sendMessage(request, (response) => {
        const err = chromeApi.runtime.lastError;
        done(err ? new Error(err.message) : null, response);
      });
    }, request, options.timeoutMs);
  }

  function sendTab(chromeApi, tabId, message, options={}) {
    if (!chromeApi?.tabs?.sendMessage) return Promise.reject(new Error('Tab messaging is unavailable.'));
    const request = createRequest(message, options);
    return sendWithTimeout((done) => {
      chromeApi.tabs.sendMessage(tabId, request, (response) => {
        const err = chromeApi.runtime?.lastError;
        done(err ? new Error(err.message) : null, response);
      });
    }, request, options.timeoutMs);
  }

  globalThis.NowCurryMessage = Object.freeze({
    PROTOCOL_VERSION, DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS, REQUEST_TIMEOUT_FLOORS, effectiveTimeoutMs,
    toJsonSafeMessage, randomId, createRequest, requestId, withResponseMeta, validateResponse, sendRuntime, sendTab
  });
})();
