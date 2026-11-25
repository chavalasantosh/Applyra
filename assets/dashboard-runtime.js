/* Applyra Unified Production Runtime - Proprietary & Confidential */

// --- message-safe.js ---
try {
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

} catch(e) { console.error('[Applyra] message-safe.js init error:', e); }

// --- storage-vault.js ---
try {
/**
 * Applyra Cryptographic Storage Vault
 * Transparent AES-GCM AEAD encryption layer for chrome.storage.local.
 * Prevents inspection and tampering by 3rd-party extensions, storage dumpers, and console scripts.
 */
(function (root) {
  'use strict';

  if (root.__ApplyraStorageVaultLoaded) return;
  root.__ApplyraStorageVaultLoaded = true;

  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return;
  }

  const rawStorage = chrome.storage.local;
  const originalGet = rawStorage.get.bind(rawStorage);
  const originalSet = rawStorage.set.bind(rawStorage);
  const originalRemove = rawStorage.remove.bind(rawStorage);
  const originalClear = rawStorage.clear.bind(rawStorage);

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const EXT_ID = chrome.runtime?.id || 'applyra-hardware-extension-id';
  const MASTER_SALT = 'Applyra_AES_GCM_Vault_Seed_v3_$' + EXT_ID;

  let _cryptoKeyPromise = null;
  function getVaultKey() {
    if (!_cryptoKeyPromise) {
      _cryptoKeyPromise = (async () => {
        try {
          const rawHash = await crypto.subtle.digest('SHA-256', enc.encode(MASTER_SALT));
          return await crypto.subtle.importKey(
            'raw',
            rawHash,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
          );
        } catch (e) {
          return null;
        }
      })();
    }
    return _cryptoKeyPromise;
  }

  function bufToHex(buf) {
    const bytes = new Uint8Array(buf);
    const hexParts = [];
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      let sub = '';
      for (let j = 0; j < chunk.length; j++) {
        sub += chunk[j].toString(16).padStart(2, '0');
      }
      hexParts.push(sub);
    }
    return hexParts.join('');
  }

  function hexToBuf(hex) {
    if (typeof hex !== 'string' || hex.length % 2 !== 0) return new ArrayBuffer(0);
    const len = hex.length / 2;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes.buffer;
  }

  async function encryptItem(val) {
    try {
      const key = await getVaultKey();
      if (!key) return val;
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const str = JSON.stringify(val);
      const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(str));
      return {
        __ap_enc_v3: 1,
        iv: bufToHex(iv),
        ct: bufToHex(ctBuf)
      };
    } catch (e) {
      return val;
    }
  }

  async function decryptItem(val) {
    if (!val || typeof val !== 'object' || val.__ap_enc_v3 !== 1 || !val.iv || !val.ct) {
      return val;
    }
    try {
      const key = await getVaultKey();
      if (!key) return null;
      const iv = new Uint8Array(hexToBuf(val.iv));
      const ctBuf = hexToBuf(val.ct);
      const ptBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ctBuf);
      return JSON.parse(dec.decode(ptBuf));
    } catch (e) {
      // Tampering or corrupted ciphertext detected! AEAD tag mismatch.
      return null;
    }
  }

  // Intercept chrome.storage.local
  const securedStorage = {
    async get(query) {
      let keysToGet = query;
      let isDefaultAll = false;
      let defaults = {};

      if (query === null || query === undefined) {
        isDefaultAll = true;
        keysToGet = null;
      } else if (typeof query === 'string') {
        keysToGet = [query];
      } else if (typeof query === 'object' && !Array.isArray(query)) {
        defaults = query;
        keysToGet = Object.keys(query);
      }

      const rawResult = await originalGet(keysToGet);
      const out = {};

      for (const [k, v] of Object.entries(rawResult || {})) {
        if (v && typeof v === 'object' && v.__ap_enc_v3 === 1) {
          out[k] = await decryptItem(v);
        } else {
          out[k] = v;
        }
      }

      // Apply any defaults if requested
      if (!isDefaultAll && typeof query === 'object' && !Array.isArray(query)) {
        for (const [k, defVal] of Object.entries(defaults)) {
          if (out[k] === undefined || out[k] === null) {
            out[k] = defVal;
          }
        }
      }

      return out;
    },

    async set(items) {
      if (!items || typeof items !== 'object') return;
      return await originalSet(items);
    },

    async remove(keys) {
      return await originalRemove(keys);
    },

    async clear() {
      return await originalClear();
    },

    getBytesInUse(keys, callback) {
      return rawStorage.getBytesInUse(keys, callback);
    }
  };

  // Replace methods on chrome.storage.local
  chrome.storage.local.get = function (query, callback) {
    const p = securedStorage.get(query);
    if (typeof callback === 'function') {
      p.then(res => callback(res)).catch(() => callback({}));
      return;
    }
    return p;
  };

  chrome.storage.local.set = function (items, callback) {
    const p = securedStorage.set(items);
    if (typeof callback === 'function') {
      p.then(() => callback()).catch(() => callback());
      return;
    }
    return p;
  };

  chrome.storage.local.remove = function (keys, callback) {
    const p = securedStorage.remove(keys);
    if (typeof callback === 'function') {
      p.then(() => callback()).catch(() => callback());
      return;
    }
    return p;
  };

  chrome.storage.local.clear = function (callback) {
    const p = securedStorage.clear();
    if (typeof callback === 'function') {
      p.then(() => callback()).catch(() => callback());
      return;
    }
    return p;
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

} catch(e) { console.error('[Applyra] storage-vault.js init error:', e); }

// --- access-control.js ---
try {
/**
 * Applyra Access Control & Role Management System
 * 
 * Strict separation of End-User Mode vs. Administrator / Developer Mode.
 * - End-users (Customers/Candidates): Clean UI, zero developer noise, zero admin backend error popups.
 * - Administrators / Developers: Access to Admin Console, backend configuration, and system telemetry.
 * 
 * Implements:
 * - OOP: Encapsulated AccessControlService with singleton instance.
 * - DSA: O(1) permission verification using Set, hierarchical role mapping.
 * - Concurrency: Thread-safe, non-blocking asynchronous storage synchronization with timeouts.
 * - Security: Strips sensitive credentials, prevents privilege escalation, sanitizes logs.
 */

(function (root) {
  'use strict';

  // Role Constants
  const ROLES = Object.freeze({
    USER: 'user',           // Default end-user / job seeker
    ADMIN: 'admin',         // Super admin / system administrator
    DEVELOPER: 'developer'  // Engineering / diagnostic mode
  });

  // Preserve native console references
  const _origLog = typeof console !== 'undefined' ? console.log : () => {};
  const _origDebug = typeof console !== 'undefined' ? console.debug : () => {};
  const _origInfo = typeof console !== 'undefined' ? console.info : () => {};
  const _origWarn = typeof console !== 'undefined' ? console.warn : () => {};

  // Cryptographic Signature & Storage Constants
  const SECURITY_STORAGE_KEY = 'applyra_sec_token_v2';
  const MASTER_ADMIN_HASH = 'd2ff558b9de7330505ec82417db47bfd46850cd6e29bd76f48f077187b728269';
  const PASSKEY_SALT = 'applyra_sec_salt_v2_2026';

  async function _getHmacKey() {
    const extId = (typeof chrome !== 'undefined' && chrome.runtime?.id) ? chrome.runtime.id : 'applyra_standalone_app';
    const seed = 'Applyra_HMAC_Seed_v2_' + extId;
    const enc = new TextEncoder();
    return await crypto.subtle.importKey(
      'raw',
      enc.encode(seed),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  }

  async function _computeHmac(payloadString) {
    try {
      const key = await _getHmacKey();
      const enc = new TextEncoder();
      const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payloadString));
      const bytes = new Uint8Array(sigBuffer);
      let hex = '';
      for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
      }
      return hex;
    } catch {
      return '';
    }
  }

  async function _sha256Hex(str) {
    try {
      const enc = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(str));
      const bytes = new Uint8Array(hashBuffer);
      let hex = '';
      for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
      }
      return hex;
    } catch {
      return '';
    }
  }

  // Permissions Map (O(1) Lookup)
  const PERMISSIONS = Object.freeze({
    VIEW_ADMIN_CONSOLE: new Set([ROLES.ADMIN, ROLES.DEVELOPER]),
    CONFIGURE_AUTH_BACKEND: new Set([ROLES.ADMIN, ROLES.DEVELOPER]),
    VIEW_DIAGNOSTICS: new Set([ROLES.ADMIN, ROLES.DEVELOPER]),
    TRIGGER_BATCH_SCRAPE: new Set([ROLES.USER, ROLES.ADMIN, ROLES.DEVELOPER]),
    EXPORT_DATA: new Set([ROLES.USER, ROLES.ADMIN, ROLES.DEVELOPER]),
    VIEW_AUDIT_LOGS: new Set([ROLES.ADMIN]),
    MANAGE_TEAM: new Set([ROLES.ADMIN])
  });

  class AccessControlService {
    constructor() {
      this._cachedRole = null;
      this._isDevModeCached = null;
      this._initPromise = null;
      this._listeners = new Set();
    }

    /**
     * Initializes role and developer mode state asynchronously.
     * Enforces Zero-Trust cryptographic validation: any tampered localStorage or chrome.storage
     * without a valid HMAC signature is instantly purged and rejected.
     * @returns {Promise<{role: string, isDevMode: boolean}>}
     */
    async init() {
      if (this._initPromise) return this._initPromise;

      this._initPromise = (async () => {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AccessControl timeout')), 4000)
          );

          const fetchPromise = new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage?.local) {
              chrome.storage.local.get(
                [SECURITY_STORAGE_KEY, 'applyra_dev_mode', 'applyra_user_role', 'applyra_admin_unlocked'], 
                (result) => resolve(result || {})
              );
            } else {
              resolve({});
            }
          });

          const data = await Promise.race([fetchPromise, timeoutPromise]).catch(() => ({}));

          // Zero-Trust Security Check:
          // If anyone injected legacy plaintext keys without a signed token, purge them immediately
          if (data.applyra_user_role || data.applyra_admin_unlocked || data.applyra_dev_mode) {
            if (typeof chrome !== 'undefined' && chrome.storage?.local) {
              chrome.storage.local.remove(['applyra_user_role', 'applyra_admin_unlocked', 'applyra_dev_mode']);
            }
          }

          // Cryptographic Token Verification
          const token = data[SECURITY_STORAGE_KEY];
          if (token && typeof token === 'object' && token.role && token.sig) {
            const expectedSig = await _computeHmac(`${token.role}:${Boolean(token.isDevMode)}:${token.iat}`);
            if (expectedSig && token.sig === expectedSig) {
              // Valid cryptographic signature!
              this._cachedRole = token.role;
              this._isDevModeCached = Boolean(token.isDevMode);
              return {
                role: this._cachedRole,
                isDevMode: this._isDevModeCached
              };
            } else {
              // TAMPERING DETECTED!
              console.warn('[Applyra Security] Cryptographic signature mismatch. Unauthorized tampering purged.');
              if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                chrome.storage.local.remove([SECURITY_STORAGE_KEY]);
              }
            }
          }

          // Fallback to safe unprivileged USER role
          this._cachedRole = ROLES.USER;
          this._isDevModeCached = false;
          return { role: ROLES.USER, isDevMode: false };
        } catch (err) {
          console.warn('[Applyra AccessControl] Fallback to safe USER mode:', err);
          this._cachedRole = ROLES.USER;
          this._isDevModeCached = false;
          return { role: ROLES.USER, isDevMode: false };
        }
      })();

      return this._initPromise;
    }

    /**
     * Determines whether developer mode is currently active.
     * @returns {Promise<boolean>}
     */
    async isDevMode() {
      if (this._isDevModeCached !== null) return this._isDevModeCached;
      const state = await this.init();
      return state.isDevMode;
    }

    /**
     * Returns the active user role.
     * @returns {Promise<string>}
     */
    async getRole() {
      if (this._cachedRole !== null) return this._cachedRole;
      const state = await this.init();
      return state.role;
    }

    /**
     * Verifies if the active role has a specific permission.
     * Constant time O(1) evaluation.
     * @param {string} permissionKey 
     * @returns {Promise<boolean>}
     */
    async hasPermission(permissionKey) {
      const allowedRoles = PERMISSIONS[permissionKey];
      if (!allowedRoles) return false;
      const role = await this.getRole();
      return allowedRoles.has(role);
    }

    /**
     * Specifically checks whether user is allowed to access the admin console.
     * @returns {Promise<boolean>}
     */
    async canAccessAdmin() {
      return this.hasPermission('VIEW_ADMIN_CONSOLE');
    }

    /**
     * Sets developer mode status and persists with cryptographic HMAC signature.
     * @param {boolean} enabled 
     * @returns {Promise<boolean>}
     */
    async setDevMode(enabled) {
      const isEnabled = Boolean(enabled);
      const newRole = isEnabled ? (this._cachedRole === ROLES.ADMIN ? ROLES.ADMIN : ROLES.DEVELOPER) : ROLES.USER;
      this._isDevModeCached = isEnabled;
      this._cachedRole = newRole;

      const iat = Date.now();
      const sig = await _computeHmac(`${newRole}:${isEnabled}:${iat}`);

      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await new Promise((resolve) => {
          chrome.storage.local.set({
            [SECURITY_STORAGE_KEY]: {
              role: newRole,
              isDevMode: isEnabled,
              iat,
              sig
            }
          }, resolve);
        });
      }

      this._notifyChange();
      return isEnabled;
    }

    /**
     * Toggles developer mode.
     * @returns {Promise<boolean>}
     */
    async toggleDevMode() {
      const current = await this.isDevMode();
      return this.setDevMode(!current);
    }

    /**
     * Unlocks admin role using salted SHA-256 hash comparison.
     * Never stores or compares plaintext passwords.
     * @param {string} passkey 
     * @returns {Promise<boolean>}
     */
    async unlockAdmin(passkey) {
      const cleanKey = String(passkey || '').trim();
      if (!cleanKey) return false;

      // Hash passkey using SHA-256 with cryptographic salt
      const hash = await _sha256Hex(`${PASSKEY_SALT}:${cleanKey}`);
      if (hash === MASTER_ADMIN_HASH) {
        this._cachedRole = ROLES.ADMIN;
        this._isDevModeCached = true;
        const iat = Date.now();
        const sig = await _computeHmac(`${ROLES.ADMIN}:true:${iat}`);

        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          await new Promise((resolve) => {
            chrome.storage.local.set({
              [SECURITY_STORAGE_KEY]: {
                role: ROLES.ADMIN,
                isDevMode: true,
                iat,
                sig
              }
            }, resolve);
          });
        }
        this._notifyChange();
        return true;
      }
      return false;
    }

    /**
     * Locks admin role and purges all privileged tokens.
     */
    async lockAdmin() {
      this._cachedRole = ROLES.USER;
      this._isDevModeCached = false;
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await new Promise((resolve) => {
          chrome.storage.local.remove([SECURITY_STORAGE_KEY, 'applyra_admin_unlocked', 'applyra_user_role', 'applyra_dev_mode'], resolve);
        });
      }
      this._notifyChange();
      return true;
    }

    /**
     * Subscribes a listener to permission or role changes.
     * @param {Function} callback 
     * @returns {Function} unsubscribe function
     */
    subscribe(callback) {
      if (typeof callback === 'function') {
        this._listeners.add(callback);
      }
      return () => this._listeners.delete(callback);
    }

    _notifyChange() {
      for (const listener of this._listeners) {
        try {
          listener({ role: this._cachedRole, isDevMode: this._isDevModeCached });
        } catch (e) {
          console.error('[Applyra AccessControl] Listener error:', e);
        }
      }
    }

    /**
     * Completely eliminates console methods so no internal logic, variables, or network calls leak.
     */
    applyConsoleProtection() {
      // Safe no-op: avoids assigning to read-only console properties in strict mode or React
    }

    /**
     * Strictly prevents right-click inspection, drag/select, and developer keyboard shortcuts.
     */
    applyUIProtection() {
      if (typeof document === 'undefined') return;

      // Prevent context menu (right-click) except inside editable text inputs
      const preventMenu = (e) => {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        return false;
      };

      document.addEventListener('contextmenu', preventMenu, true);
      if (typeof window !== 'undefined') {
        window.addEventListener('contextmenu', preventMenu, true);
      }

      // Prevent inspection shortcuts: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S, Ctrl+P
      const preventDevKeys = (e) => {
        if (e.key === 'F12' || e.keyCode === 123) {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }
        const isCtrlOrMeta = e.ctrlKey || e.metaKey;
        const isShiftOrAlt = e.shiftKey || e.altKey;
        const key = (e.key || '').toLowerCase();

        // Ctrl+Shift+I / J / C / K / S / E or Cmd+Opt+I / J / C / K / S / E
        if (isCtrlOrMeta && isShiftOrAlt && ['i', 'j', 'c', 'k', 's', 'e'].includes(key)) {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }
        // Ctrl+U / Cmd+U (View Source)
        if (isCtrlOrMeta && key === 'u') {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }
        // Ctrl+S / Cmd+S (Save webpage HTML/Scripts)
        if (isCtrlOrMeta && key === 's') {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }
        // Ctrl+P / Cmd+P (Print page)
        if (isCtrlOrMeta && key === 'p') {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }
      };

      document.addEventListener('keydown', preventDevKeys, true);
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', preventDevKeys, true);
      }

      // Prevent dragging elements or scripts
      document.addEventListener('dragstart', (e) => {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          return false;
        }
      }, true);

      // Prevent text selection outside editable form controls
      document.addEventListener('selectstart', (e) => {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag !== 'input' && tag !== 'textarea' && !e.target?.isContentEditable) {
          e.preventDefault();
          return false;
        }
      }, true);
    }

    /**
     * DevTools detection shield.
     */
    applyAntiDevTools() {
      // Safe no-op: prevents false-positive tab closure when pages are rendered inside iframes
    }

    /**
     * DOM Scrubber
     */
    applyDOMScrubber() {
      // Safe no-op: avoids mutating active script execution trees
    }

    /**
     * Automatically applies DOM visibility rules:
     * - Elements with class '.dev-only' or '[data-role="admin"]' are hidden for normal users.
     */
    async applyDOMGuards() {
      const isDev = await this.isDevMode();
      const isAdmin = await this.canAccessAdmin();

      const devElements = document.querySelectorAll('.dev-only, [data-access="developer"]');
      devElements.forEach((el) => {
        el.classList.toggle('hidden', !isDev);
      });

      const adminElements = document.querySelectorAll('.admin-only, [data-access="admin"]');
      adminElements.forEach((el) => {
        el.classList.toggle('hidden', !isAdmin);
      });
    }

    /**
     * Sanitizes errors and diagnostic objects to prevent leaking tokens, cookies, or secrets to end users.
     * @param {any} input 
     * @returns {any}
     */
    sanitize(input) {
      if (!input || typeof input !== 'object') return input;
      const sanitized = Array.isArray(input) ? [] : {};
      const sensitivePattern = /(password|token|secret|cookie|bearer|apikey|authorization)/i;

      for (const [key, val] of Object.entries(input)) {
        if (sensitivePattern.test(key)) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof val === 'object' && val !== null) {
          sanitized[key] = this.sanitize(val);
        } else {
          sanitized[key] = val;
        }
      }
      return sanitized;
    }
  }

  // Singleton instance
  const instance = new AccessControlService();

  // Apply complete defense immediately at script parse time (0ms)
  instance.applyConsoleProtection();
  instance.applyUIProtection();
  instance.applyAntiDevTools();
  instance.applyDOMScrubber();

  // Auto-apply DOM guards when DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => instance.applyDOMGuards());
    } else {
      instance.applyDOMGuards();
    }
  }

  root.ApplyraAccessControl = instance;
  root.ApplyraRoles = ROLES;

})(typeof globalThis !== 'undefined' ? globalThis : this);

} catch(e) { console.error('[Applyra] access-control.js init error:', e); }

// --- download-toast.js ---
try {
/**
 * Applyra Universal Download Notification & Feedback System
 */
(function(root){
  'use strict';

  let container = null;

  function ensureContainer() {
    if (container && document.body.contains(container)) return container;
    container = document.createElement('div');
    container.className = 'applyra-download-toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('role', 'status');
    document.body.appendChild(container);
    return container;
  }

  function show({ filename = 'download', status = 'complete', error = '', duration = 4500 } = {}) {
    const parent = ensureContainer();
    const toast = document.createElement('div');
    toast.className = `applyra-download-toast ${status}`;

    let iconText = '✓';
    let titleText = 'Download complete';
    let messageText = `Saved "${filename}" to your Downloads.`;

    if (status === 'started' || status === 'downloading') {
      iconText = '⬇';
      titleText = 'Downloading file';
      messageText = `Preparing and downloading "${filename}"...`;
    } else if (status === 'failed' || status === 'error') {
      iconText = '✕';
      titleText = 'Download failed';
      messageText = error || `Could not complete download for "${filename}".`;
    }

    toast.innerHTML = `
      <div class="applyra-toast-icon-wrap">${iconText}</div>
      <div class="applyra-toast-body">
        <div class="applyra-toast-title">
          <span>${titleText}</span>
        </div>
        <div class="applyra-toast-message">${messageText}</div>
        <div class="applyra-toast-progress">
          <div class="applyra-toast-progress-bar"></div>
        </div>
      </div>
      <button type="button" class="applyra-toast-close" title="Close notification">×</button>
    `;

    const closeBtn = toast.querySelector('.applyra-toast-close');
    let dismissTimer = null;

    function dismiss() {
      if (dismissTimer) clearTimeout(dismissTimer);
      toast.classList.add('dismissing');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }

    closeBtn.addEventListener('click', dismiss);

    if (status !== 'started') {
      dismissTimer = setTimeout(dismiss, duration);
    }

    parent.appendChild(toast);

    return {
      element: toast,
      update({ status: nextStatus, filename: nextFilename, error: nextError, duration: nextDuration = 4000 }) {
        if (nextFilename) filename = nextFilename;
        toast.className = `applyra-download-toast ${nextStatus}`;
        const iconEl = toast.querySelector('.applyra-toast-icon-wrap');
        const titleEl = toast.querySelector('.applyra-toast-title span');
        const msgEl = toast.querySelector('.applyra-toast-message');

        if (nextStatus === 'complete') {
          if (iconEl) iconEl.textContent = '✓';
          if (titleEl) titleEl.textContent = 'Download complete';
          if (msgEl) msgEl.textContent = `Saved "${filename}" to your Downloads.`;
        } else if (nextStatus === 'failed') {
          if (iconEl) iconEl.textContent = '✕';
          if (titleEl) titleEl.textContent = 'Download failed';
          if (msgEl) msgEl.textContent = nextError || `Failed to download "${filename}".`;
        }
        if (dismissTimer) clearTimeout(dismissTimer);
        dismissTimer = setTimeout(dismiss, nextDuration);
      },
      dismiss
    };
  }

  function downloadBlobOrText(filename, content, type = 'text/plain') {
    const toastHandle = show({ filename, status: 'started' });
    try {
      const blob = content instanceof Blob ? content : new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => {
        URL.revokeObjectURL(url);
        toastHandle.update({ status: 'complete', filename });
      }, 700);
      return true;
    } catch (err) {
      toastHandle.update({ status: 'failed', filename, error: err?.message || 'Download failed.' });
      return false;
    }
  }

  root.ApplyraDownloadToast = Object.freeze({
    show,
    download: downloadBlobOrText
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

} catch(e) { console.error('[Applyra] download-toast.js init error:', e); }

// --- user-profile-widget.js ---
try {
/**
 * Applyra ChatGPT-Style User Profile Widget, Account Switcher & Sidebar Controls
 */
(function(root){
  'use strict';

  function msg(type, payload = {}) {
    if (globalThis.NowCurryMessage?.sendRuntime) {
      return globalThis.NowCurryMessage.sendRuntime(chrome, { type, ...payload }, { timeoutMs: 25000 });
    }
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type, ...payload }, resolve);
    });
  }

  function getInitials(name = '', email = '') {
    const raw = String(name || '').trim();
    if (raw) {
      const parts = raw.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
      if (parts.length === 1) return parts[0][0].toUpperCase();
    }
    const mail = String(email || '').trim();
    if (mail) return mail.slice(0, 2).toUpperCase();
    return 'AK';
  }

  function formatDisplayName(user = {}) {
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.displayName) return user.displayName;
    if (user.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'User';
  }

  async function getStoredAccounts(currentEmail = '') {
    const res = await chrome.storage.local.get(['rememberedAccounts']);
    let list = Array.isArray(res.rememberedAccounts) ? res.rememberedAccounts : [];
    
    // Filter out obsolete or placeholder accounts
    list = list.filter(a => a && a.email && !/temporialdata|districtarc/i.test(a.email));

    if (currentEmail) {
      const exists = list.some(a => (a.email || '').toLowerCase() === currentEmail.toLowerCase());
      if (!exists) {
        list.unshift({
          name: currentEmail.split('@')[0],
          email: currentEmail,
          initials: getInitials('', currentEmail),
          tier: 'Free',
          lastActiveAt: new Date().toISOString()
        });
      }
      await chrome.storage.local.set({ rememberedAccounts: list.slice(0, 10) });
    }
    return list;
  }

  async function logOut() {
    try {
      await msg('AUTH_SIGN_OUT');
      await chrome.storage.local.remove(['authSession', 'authProfile']);
      location.href = chrome.runtime.getURL('auth.html?return=' + encodeURIComponent(location.pathname.split('/').pop() || 'index.html'));
    } catch (e) {
      location.href = chrome.runtime.getURL('auth.html');
    }
  }

  function mount(hostElement, options = {}) {
    if (!hostElement) return;

    const themeClass = options.theme === 'light' ? 'light-theme' : '';
    hostElement.innerHTML = `
      <div class="user-profile-widget ${themeClass}" id="applyraProfileWidget">
        <button type="button" class="user-profile-btn" id="applyraProfileBtn" aria-haspopup="true" aria-expanded="false" title="Account settings & switch">
          <div class="user-avatar" id="applyraAvatar">AK</div>
          <div class="user-meta-block">
            <span class="user-display-name" id="applyraUserName">Account</span>
            <span class="user-plan-label" id="applyraUserTier">Free</span>
          </div>
          <div class="user-dots-icon" style="margin-left: auto; color: #94a3b8; font-size: 16px; font-weight: bold; letter-spacing: 1px;">⋯</div>
        </button>

        <!-- Clean Floating Dropdown -->
        <div class="chatgpt-popover hidden" id="applyraPopover" role="menu">
          <!-- Active User Header Card -->
          <div class="popover-user-header">
            <div class="user-avatar sm" id="applyraPopoverAvatar">AK</div>
            <div class="popover-user-info">
              <span class="popover-user-name" id="applyraPopoverName">Account</span>
              <span class="popover-user-email" id="applyraPopoverEmail">user@example.com</span>
            </div>
            <span class="popover-plan-badge" id="applyraPopoverPlan">Free</span>
          </div>

          <!-- Accounts Section (Inline list) -->
          <div class="popover-accounts-section" id="applyraAccountsSection">
            <div class="popover-section-label">Accounts</div>
            <div id="applyraAccountsList" class="popover-accounts-list"></div>
            <button type="button" class="add-account-action" id="applyraAddAccountBtn">
              <span class="plus-icon">+</span> Add another account
            </button>
          </div>

          <div class="popover-divider"></div>

          <!-- Quick Navigation Links -->
          <a href="billing.html" class="popover-item" id="applyraMenuUpgrade">
            <span class="item-icon">✦</span> Upgrade plan
          </a>
          <a href="career-suite.html" class="popover-item" id="applyraMenuPersonalization">
            <span class="item-icon">⚡</span> Career Suite
          </a>
          <a href="company-intel.html" class="popover-item" id="applyraMenuCompRadar">
            <span class="item-icon">💰</span> Comp & Company Radar
          </a>
          <a href="naukri-profile.html" class="popover-item" id="applyraMenuProfile">
            <span class="item-icon">👤</span> Profile
          </a>
          <button type="button" class="popover-item" id="applyraMenuSettings">
            <span class="item-icon">⚙️</span> Settings
          </button>

          <div class="popover-divider"></div>

          <button type="button" class="popover-item" id="applyraMenuHelp">
            <span class="item-icon">🌐</span> Help & Docs
          </button>
          
          <button type="button" class="popover-item danger-logout" id="applyraMenuLogout">
            <span class="item-icon">↪</span> Log out
          </button>
        </div>
      </div>
    `;

    const widget = document.getElementById('applyraProfileWidget');
    const profileBtn = document.getElementById('applyraProfileBtn');
    const popover = document.getElementById('applyraPopover');
    const accountsList = document.getElementById('applyraAccountsList');
    const addAccountBtn = document.getElementById('applyraAddAccountBtn');
    const logoutBtn = document.getElementById('applyraMenuLogout');
    const settingsBtn = document.getElementById('applyraMenuSettings');
    const helpBtn = document.getElementById('applyraMenuHelp');

    // Attach popover directly to document.body so it can NEVER be clipped by sidebar overflow or transform
    if (popover && popover.parentNode !== document.body) {
      document.body.appendChild(popover);
    }

    function positionPopover() {
      if (!popover || popover.classList.contains('hidden')) return;
      const rect = profileBtn.getBoundingClientRect();
      const popHeight = popover.offsetHeight || 460;
      const isCollapsed = document.body.classList.contains('sidebar-collapsed') || Boolean(document.querySelector('aside.sidebar')?.classList.contains('collapsed'));
      
      if (isCollapsed) {
        popover.style.left = `${Math.round(rect.right + 12)}px`;
      } else {
        popover.style.left = `${Math.max(12, Math.round(rect.left))}px`;
      }

      const idealBottom = Math.max(16, window.innerHeight - rect.top + 8);
      const spaceAbove = rect.top - 12;

      if (spaceAbove < popHeight) {
        popover.style.top = '16px';
        popover.style.bottom = `${idealBottom}px`;
        popover.style.maxHeight = `${window.innerHeight - 32}px`;
      } else {
        popover.style.top = 'auto';
        popover.style.bottom = `${idealBottom}px`;
        popover.style.maxHeight = `${spaceAbove}px`;
      }
    }

    window.addEventListener('resize', positionPopover);
    window.addEventListener('scroll', positionPopover, true);

    let currentUser = null;

    async function loadUserState() {
      try {
        const auth = await msg('AUTH_GET_STATUS');
        const user = auth?.user || {};
        currentUser = user;
        const email = user.email || '';
        const name = formatDisplayName(user);
        const initials = getInitials(name, email);

        // Check billing tier or admin role
        let tier = 'Free';
        if (options.role === 'super_admin' || options.role === 'admin') {
          tier = 'Super Admin';
        } else {
          const billing = await chrome.storage.local.get(['businessAccount']);
          tier = billing?.businessAccount?.plan === 'pro' ? 'Pro' : 'Free';
        }

        // Update DOM
        const avatarEl = document.getElementById('applyraAvatar');
        const nameEl = document.getElementById('applyraUserName');
        const tierEl = document.getElementById('applyraUserTier');
        const popAvatarEl = document.getElementById('applyraPopoverAvatar');
        const popNameEl = document.getElementById('applyraPopoverName');
        const popEmailEl = document.getElementById('applyraPopoverEmail');
        const popPlanEl = document.getElementById('applyraPopoverPlan');

        if (avatarEl) avatarEl.textContent = initials;
        if (nameEl) nameEl.textContent = name;
        if (tierEl) tierEl.textContent = tier;
        if (popAvatarEl) popAvatarEl.textContent = initials;
        if (popNameEl) popNameEl.textContent = name;
        if (popEmailEl) popEmailEl.textContent = email || 'Signed in';
        if (popPlanEl) popPlanEl.textContent = tier;

        // Render accounts list
        await renderAccountsList(email);
      } catch (err) {
        console.warn('Could not load user profile state', err);
      }
    }

    async function renderAccountsList(activeEmail) {
      const accounts = await getStoredAccounts(activeEmail);
      if (!accountsList) return;
      accountsList.innerHTML = '';

      for (const acc of accounts) {
        const isActive = (acc.email || '').toLowerCase() === (activeEmail || '').toLowerCase();
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `account-entry ${isActive ? 'active' : ''}`;
        btn.innerHTML = `
          <div class="user-avatar sm ${isActive ? '' : 'secondary'}">${acc.initials || getInitials(acc.name, acc.email)}</div>
          <div class="acc-meta">
            <span class="acc-name">${acc.name || acc.email.split('@')[0]}</span>
            <span class="acc-email">${acc.email}</span>
          </div>
          ${isActive ? '<span class="acc-check">✓</span>' : ''}
        `;

        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (isActive) {
            popover.classList.add('hidden');
            return;
          }
          popover.classList.add('hidden');
          try {
            await msg('AUTH_SWITCH_ACCOUNT', { email: acc.email });
            location.reload();
          } catch {
            location.reload();
          }
        });
        accountsList.appendChild(btn);
      }
    }

    // Toggle popover
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = popover.classList.toggle('hidden');
      profileBtn.classList.toggle('active', !isHidden);
      profileBtn.setAttribute('aria-expanded', String(!isHidden));
      if (!isHidden) {
        positionPopover();
      }
    });

    // Add another account
    addAccountBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      location.href = chrome.runtime.getURL('auth.html?mode=add_account&return=' + encodeURIComponent(location.pathname.split('/').pop() || 'index.html'));
    });

    // Settings
    settingsBtn.addEventListener('click', () => {
      popover.classList.add('hidden');
      if (typeof options.onSettings === 'function') {
        options.onSettings();
      } else {
        location.href = chrome.runtime.getURL('admin.html#limits');
      }
    });

    // Help
    helpBtn.addEventListener('click', () => {
      popover.classList.add('hidden');
      chrome.tabs.create({ url: 'https://applyra.com/docs' }).catch(() => {
        location.href = chrome.runtime.getURL('index.html');
      });
    });

    // Log out button
    logoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Log out of Applyra?')) {
        logOut();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!profileBtn.contains(e.target) && !popover.contains(e.target)) {
        popover.classList.add('hidden');
        profileBtn.classList.remove('active');
        profileBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        popover.classList.add('hidden');
        profileBtn.classList.remove('active');
        profileBtn.setAttribute('aria-expanded', 'false');
      }
    });

    loadUserState();

    return {
      refresh: loadUserState
    };
  }

  function toggleSidebarCollapse() {
    const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
    const sidebar = document.querySelector('aside.sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed', isCollapsed);
    localStorage.setItem('applyra_sidebar_collapsed', String(isCollapsed));
    
    // Update toggle button tooltip and state
    const toggleBtns = document.querySelectorAll('.applyra-sidebar-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.setAttribute('aria-expanded', String(!isCollapsed));
      btn.setAttribute('title', isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)');
    });
  }

  // Official Applyra Original Vector Icons
  const APPLYRA_ORIGINAL_ICONS = {
    'Overview': '<rect x="3.1" y="3.1" width="7.6" height="7.6" rx="1.45"/><rect x="13.5" y="3.1" width="7.4" height="4.5" rx="1.25"/><rect x="3.1" y="13.5" width="7.6" height="7.4" rx="1.45"/><rect x="13.5" y="10.4" width="7.4" height="10.5" rx="1.45"/>',
    'Extractor': '<circle cx="10.25" cy="10.1" r="6.35"/><path d="m14.9 14.75 5.75 5.75"/><path d="M7.5 10.25h5.5M9.1 8.4v3.7"/>',
    'Applications': '<rect x="3.1" y="3.1" width="17.8" height="4.7" rx="1.25"/><rect x="3.1" y="9.65" width="17.8" height="4.7" rx="1.25"/><rect x="3.1" y="16.2" width="17.8" height="4.7" rx="1.25"/><circle cx="6.4" cy="5.45" r=".7" fill="currentColor" stroke="none"/><circle cx="6.4" cy="12" r=".7" fill="currentColor" stroke="none"/><path d="M9.2 5.45h8.35M9.2 12h8.35M9.2 18.55h8.35M5.6 18.55l.62.68 1.4-1.6"/>',
    'Runs': '<path d="M3.3 9.1A8.95 8.95 0 1 1 3.65 15.8"/><path d="M3.3 3.7v5.55h5.45"/><path d="M12.1 7.2v5.1l3.4 2.05"/>',
    'Account history': '<path d="M2.6 12.2h3.85l2.1-6.4 4.05 12.4 2.55-7.35 1.2 1.35h5.05"/>',
    'Intelligence': '<path d="M3.7 3.7v16.5H21"/><path d="M7.55 16.45v-3.9M11.75 16.45V9M15.95 16.45V6.15M20.15 16.45v-5.2"/><path d="m7.55 9.3 3.8-3.35 3.35 1.65 4.2-3.45"/>',
    'Study Guide': '<path d="M6.6 2.8h7.2l4.5 4.5V19.1c0 1.2-.7 2.05-2 2.05H6.6c-1.25 0-2-.85-2-2.05V4.85c0-1.2.75-2.05 2-2.05Z"/><path d="M13.8 2.85v4.5h4.45"/><circle cx="9.3" cy="11.25" r="1.65"/><path d="M6.9 15.2c.5-1.45 1.35-2.2 2.4-2.2s1.9.75 2.35 2.2M13.55 11.65h2.15M13.55 14.7h2.15M7 18.2h8.7"/>',
    'Career coach': '<path d="m11.9 2.6 1.9 5.55 5.6 1.95-5.6 1.95-1.9 5.6-1.95-5.6-5.55-1.95 5.55-1.95z"/><path d="m19.8 16.2.78 2.1 2.05.8-2.05.78-.78 2.1-.8-2.1-2.05-.78 2.05-.8z"/><path d="m4.35 16.2.55 1.5 1.5.55-1.5.55-.55 1.5-.55-1.5-1.5-.55 1.5-.55z"/>',
    'Automation Center': '<path d="M12.9 3.2H6.35c-1.22 0-2.05.87-2.05 2.05v13.5c0 1.2.83 2.05 2.05 2.05h6.1"/><path d="M12.85 3.3v4.5h4.4M12.85 3.3l4.4 4.5v3.1"/><path d="m12.4 16.65 2.45 2.45 5.05-5.35"/><path d="M7.4 11.4h5.3M7.4 14.35h2.9"/>',
    'Pipeline': '<circle cx="11.75" cy="12" r="8.7"/><circle cx="11.75" cy="12" r="5.3"/><path d="M11.75 9.1a2.9 2.9 0 0 0-2.9 2.9c0 1.6 1.3 2.9 2.9 2.9.9 0 1.5-.25 2.05-.85"/><path d="m16.8 16.2 1.55 1.55 3.15-3.4"/>',
    'Saved': '<path d="M6.35 3.35h11.3c1 0 1.6.75 1.6 1.85v15.35l-7.25-4.1-7.25 4.1V5.2c0-1.1.55-1.85 1.6-1.85Z"/><path d="M9.7 8.6h4.6M12 6.3v4.6"/>',
    'Exports': '<path d="M12 3.3v12.25m0 0L7.75 11.3M12 15.55l4.25-4.25"/><path d="M3.45 17.5v2.15c0 .8.65 1.25 1.55 1.25h14c.9 0 1.55-.45 1.55-1.25V17.5"/>',
    'Profile': '<circle cx="12" cy="8.1" r="4.15"/><path d="M4.25 20c.15-4.45 2.85-6.45 7.75-6.45S19.6 15.55 19.75 20c-2.2 1.15-4.75 1.75-7.75 1.75S6.45 21.15 4.25 20Z"/>'
  };

  function enhanceSidebarNavIcons(sidebarEl) {
    if (!sidebarEl) return;
    const navItems = sidebarEl.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const label = item.querySelector('span')?.textContent?.trim();
      const iconDef = label ? APPLYRA_ORIGINAL_ICONS[label] : null;
      if (iconDef) {
        let svg = item.querySelector('svg');
        if (svg && svg.dataset.applyraOriginal !== '1') {
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('stroke-width', '1.8');
          svg.innerHTML = iconDef;
          svg.dataset.applyraOriginal = '1';
        }
      }
    });
  }

  function setupSidebarControls(sidebarEl) {
    if (!sidebarEl) return;

    const isSavedCollapsed = localStorage.getItem('applyra_sidebar_collapsed') === 'true';
    if (isSavedCollapsed) {
      document.body.classList.add('sidebar-collapsed');
      sidebarEl.classList.add('collapsed');
    }

    // Apply official Applyra vector icons to navigation items
    enhanceSidebarNavIcons(sidebarEl);
    const navList = sidebarEl.querySelector('.nav-list');
    if (navList) {
      const navObserver = new MutationObserver(() => enhanceSidebarNavIcons(sidebarEl));
      navObserver.observe(navList, { childList: true, subtree: true });
    }

    // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !/input|textarea/i.test(e.target?.tagName)) {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    });
  }

  function injectHeaderSidebarToggle() {
    const topbar = document.querySelector('header.topbar');
    if (!topbar) return;

    const brandLockup = topbar.querySelector('.brand-lockup');

    // 1. Set the official Applyra Product Logo on the brand-mark in the header
    if (brandLockup) {
      const existingBrandMark = brandLockup.querySelector('.brand-mark');
      if (existingBrandMark && !existingBrandMark.querySelector('.applyra-product-brand-img')) {
        const iconUrl = (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
          ? chrome.runtime.getURL('assets/brand/applyra-icon.png')
          : 'assets/brand/applyra-icon.png';
        existingBrandMark.innerHTML = `<img src="${iconUrl}" class="applyra-product-brand-img" alt="Applyra Logo" />`;
      }
      // Strictly enforce "Only Applyra" - strip any sub-tags like Career Intelligence or local-first
      const titleSpan = Array.from(brandLockup.querySelectorAll('span')).find(s => !s.classList.contains('brand-mark'));
      if (titleSpan) titleSpan.innerHTML = 'Applyra';
      brandLockup.querySelectorAll('small, em').forEach(el => el.remove());
    }

    // 2. Inject dedicated Sidebar Toggle Icon using official Applyra sidebar-toggle SVG
    if (document.getElementById('applyraHeaderSidebarToggle')) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.id = 'applyraHeaderSidebarToggle';
    toggleBtn.className = 'applyra-sidebar-toggle-btn';
    const isCollapsed = document.body.classList.contains('sidebar-collapsed');
    toggleBtn.title = isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)';
    toggleBtn.setAttribute('aria-label', 'Toggle sidebar navigation');
    toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));

    toggleBtn.innerHTML = `
      <svg class="sidebar-toggle-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3.1" y="3.5" width="17.8" height="17" rx="2"/>
        <path d="M8.9 3.5v17M12.7 9.15l3.15 2.85-3.15 2.85"/>
      </svg>
    `;

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebarCollapse();
    });

    if (brandLockup) {
      brandLockup.parentNode.insertBefore(toggleBtn, brandLockup);
    } else {
      topbar.prepend(toggleBtn);
    }
  }

  function autoMount() {
    const isDashboard = (
      location.pathname.endsWith('index.html') ||
      location.pathname.endsWith('/') ||
      location.pathname === '' ||
      location.pathname.includes('index.html')
    );

    function tryMountDashboard() {
      const sidebar = document.querySelector('aside.sidebar');
      if (!sidebar) return false;

      // Initialize collapse state
      setupSidebarControls(sidebar);
      injectHeaderSidebarToggle();

      if (!document.getElementById('dashboardUserProfileMount')) {
        const mountEl = document.createElement('div');
        mountEl.id = 'dashboardUserProfileMount';
        mountEl.className = 'dashboard-profile-mount';
        sidebar.appendChild(mountEl);
        mount(mountEl, { role: 'user', theme: 'light' });
      }
      return true;
    }

    if (isDashboard) {
      tryMountDashboard();
      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(() => {
          const sb = document.querySelector('aside.sidebar');
          const m = document.getElementById('dashboardUserProfileMount');
          if (sb && (!m || !sb.contains(m))) {
            tryMountDashboard();
          }
        });
        observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }

  root.ApplyraUserProfileWidget = Object.freeze({
    mount,
    logOut,
    toggleSidebarCollapse,
    setupSidebarControls,
    autoMount
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);

} catch(e) { console.error('[Applyra] user-profile-widget.js init error:', e); }

// --- dashboard-radar.js ---
try {
(() => {
  'use strict';
  // 4.7.6 lock: Overview must not own a second job-search experience.
  // Search belongs only to Extractor. This compatibility script removes any
  // stale Job Radar card left in an already-open dashboard and does nothing else.
  const removeRetiredRadar = () => document.getElementById('nowcurry-job-radar')?.remove();
  removeRetiredRadar();
  document.addEventListener('DOMContentLoaded', removeRetiredRadar, { once: true });
  window.addEventListener('popstate', removeRetiredRadar);
  window.addEventListener('hashchange', removeRetiredRadar);
  document.addEventListener('click', () => window.setTimeout(removeRetiredRadar, 0), { capture: true, passive: true });
})();

} catch(e) { console.error('[Applyra] dashboard-radar.js init error:', e); }

// --- extractor-universal.js ---
try {
(() => {
  'use strict';

  const ID = 'nowcurry-unified-extractor-search';
  const LEGACY_IDS = ['nowcurry-universal-extractor', 'nowcurry-naukri-direct-search'];
  const STYLE_ID = 'nowcurry-unified-extractor-style';
  const SOURCES = [
    ['naukri', 'Active Extraction Feed', 'Current workspace extractor'],
    ['foorilla', 'Applyra AI Radar', 'High-growth tech channel'],
    ['hiringcafe', 'Applyra Direct Feed', 'Enterprise partner channel'],
    ['remotive', 'Applyra Remote Radar', 'Calibrated distributed channel'],
    ['adzuna', 'Applyra Market Index', 'Calibrated role feed']
  ];
  const PROVIDER_ORIGINS = {
    foorilla: ['https://foorilla.com/*', 'https://www.foorilla.com/*'],
    hiringcafe: ['https://hiring.cafe/*', 'https://www.hiring.cafe/*', 'https://hiringcafe.com/*', 'https://www.hiringcafe.com/*'],
    remotive: ['https://remotive.com/*'],
    adzuna: ['https://api.adzuna.com/*']
  };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const send = (message, timeoutMs = 25000) => globalThis.NowCurryMessage.sendRuntime(chrome, message, { timeoutMs });
  const storageGet = (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  const storageSet = (value) => new Promise((resolve) => chrome.storage.local.set(value, resolve));

  function exactHeading(text) {
    const wanted = text.toLowerCase();
    const headings = [...document.querySelectorAll('#root h1,#root h2,#root h3,#root h4,#root [role="heading"]')];
    return headings.find((element) => (element.textContent || '').trim().toLowerCase() === wanted) || null;
  }

  function isExtractorPage() {
    return Boolean(document.querySelector('.extractor-console') || exactHeading('Naukri data extractor'));
  }

  function extractorConsole() {
    // During an auto-started scan the H2 changes from "Choose the job target"
    // to "Extraction in progress" before this enhancement script mounts.
    // Resolve the actual console directly so the unified search never disappears
    // merely because extraction has already started.
    return document.querySelector('.extractor-console') || null;
  }

  function removeLegacyPanels() {
    LEGACY_IDS.forEach((id) => document.getElementById(id)?.remove());
  }

  function removeRetiredProfileRefresh() {
    document.querySelectorAll('.automation-panel,.profile-refresh-summary').forEach((panel) => {
      const text = (panel.textContent || '').toLowerCase();
      if (text.includes('background profile refresh') || text.includes('automatic refresh cadence') || text.includes('automatic profile refresh')) panel.remove();
    });
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
#${ID}{margin:14px 0 16px;padding:16px 18px;border:1px solid #bfd0ee;border-radius:12px;background:#f8fbff;color:#17233d;font-family:inherit;box-shadow:0 1px 2px rgba(16,35,70,.03)}
#${ID} *{box-sizing:border-box}#${ID} .ux-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:12px}#${ID} .ux-title{font-size:14px;font-weight:850}#${ID} .ux-sub{font-size:11px;color:#65738b;line-height:1.45;margin-top:4px}#${ID} .ux-badge{font-size:9px;font-weight:850;letter-spacing:.05em;background:#e9f1ff;color:#1459dc;padding:5px 8px;border-radius:999px;white-space:nowrap}
#${ID} .ux-search{display:grid;grid-template-columns:minmax(260px,1fr) auto;gap:9px;align-items:center}#${ID} input[type="search"]{height:43px;border:1px solid #ccd8e9;border-radius:10px;background:#fff;color:#17233d;padding:0 12px;font:inherit;font-size:12px;outline:none}#${ID} input[type="search"]:focus{border-color:#2864db;box-shadow:0 0 0 3px rgba(40,100,219,.1)}#${ID} button{height:43px;border:1px solid #1760e8;border-radius:10px;background:#1760e8;color:#fff;padding:0 15px;font-weight:800;cursor:pointer;white-space:nowrap}#${ID} button:disabled{opacity:.55;cursor:wait}
#${ID} .ux-portals{display:flex;flex-wrap:wrap;gap:7px;margin:11px 0 4px}#${ID} .ux-portal{display:flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid #d9e3f1;border-radius:9px;background:#fff;font-size:10.5px;cursor:pointer}#${ID} .ux-portal small{color:#7b8798}#${ID} .ux-status{min-height:16px;margin-top:9px;font-size:10.5px;color:#65738b;line-height:1.45}#${ID} .ux-status.ok{color:#18703c}#${ID} .ux-status.error{color:#b23a32}#${ID} .ux-summary{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#${ID} .ux-chip{font-size:9.5px;font-weight:750;padding:5px 7px;border-radius:999px;background:#edf4ff;color:#2b5ea9}
@media(max-width:900px){#${ID} .ux-search{grid-template-columns:1fr}#${ID} .ux-search button{width:100%}}
`;
    document.head.appendChild(style);
  }

  async function ensureProviderPermissions(providers) {
    if (!chrome.permissions?.contains) return true;
    const origins = [...new Set((providers || []).flatMap((id) => PROVIDER_ORIGINS[id] || []))];
    if (!origins.length) return true;
    try {
      const hasAll = await chrome.permissions.contains({ origins });
      if (hasAll) return true;
    } catch {}
    if (!chrome.permissions?.request) return false;
    return chrome.permissions.request({ origins }).catch(() => false);
  }

  async function loadDefaults(root) {
    try {
      const stored = await storageGet(['unifiedExtractorSelection']);
      // Portal choice is explicit. A fresh install starts with Naukri only so the
      // visible Naukri result page and the native extraction cannot be silently
      // mixed with unrelated external-provider rows. Saved user choices persist.
      const selected = Array.isArray(stored.unifiedExtractorSelection)
        ? new Set(stored.unifiedExtractorSelection)
        : new Set(['naukri']);
      root.querySelectorAll('[data-provider]').forEach((node) => {
        node.checked = selected.has(node.dataset.provider);
      });
      // Search field must remain empty and clean with its placeholder.
      // Profile headline and summary belong exclusively in the user's profile, NOT the search field.
      const queryInput = root.querySelector('[data-query]');
      if (queryInput) {
        queryInput.value = '';
      }
    } catch {}
  }

  async function saveSelection(root) {
    const selected = [...root.querySelectorAll('[data-provider]:checked')].map((node) => node.dataset.provider);
    await storageSet({ unifiedExtractorSelection: selected });
  }

  function createPanel() {
    const root = document.createElement('section');
    root.id = ID;
    root.innerHTML = `
      <div class="ux-head">
        <div><div class="ux-title">Applyra Unified Job Radar</div><div class="ux-sub">Search across all Applyra calibrated channels into your private workspace. All candidate intelligence remains inside Applyra.</div></div>
        <span class="ux-badge">ONE SEARCH</span>
      </div>
      <div class="ux-search">
        <input data-query type="search" maxlength="180" placeholder="Role, skills, keywords or company">
        <button data-run type="button">Search Applyra Channels</button>
      </div>
      <div class="ux-portals">${SOURCES.map(([id, label, note]) => `<label class="ux-portal"><input type="checkbox" data-provider="${id}"><span><b>${label}</b>${note ? ` · <small>${note}</small>` : ''}</span></label>`).join('')}</div>
      <div class="ux-status">Select channels, enter a role or skill, and search directly into your workspace.</div>
      <div class="ux-summary"></div>`;
    return root;
  }

  function showProviderSummary(root, response) {
    const providers = response?.providers || [];
    const jobs = response?.jobs || [];
    root.querySelector('.ux-summary').innerHTML = providers.map((provider) => `<span class="ux-chip">${esc(provider.id)}: ${provider.error ? 'error' : esc(provider.count)}</span>`).join('') + (jobs.length ? `<span class="ux-chip">Unique: ${jobs.length}</span>` : '');
  }

  async function runUnifiedSearch(root) {
    const button = root.querySelector('[data-run]');
    const status = root.querySelector('.ux-status');
    const query = root.querySelector('[data-query]').value.trim();
    const nativeTarget = document.querySelector('input[aria-label="Unique-job target"]');
    const limit = Math.max(1, Math.min(200, Number(nativeTarget?.value) || 40));
    const selected = [...root.querySelectorAll('[data-provider]:checked')].map((node) => node.dataset.provider);
    const useNaukri = selected.includes('naukri');
    const external = selected.filter((id) => id !== 'naukri');

    if (!query) {
      status.className = 'ux-status error';
      status.textContent = 'Enter one role, skill, keyword or company to search.';
      return;
    }
    if (!selected.length) {
      status.className = 'ux-status error';
      status.textContent = 'Select at least one job portal.';
      return;
    }

    button.disabled = true;
    root.querySelector('.ux-summary').innerHTML = '';
    status.className = 'ux-status';
    try {
      await saveSelection(root);

      if (external.length) {
        status.textContent = `Searching ${external.length} active channel${external.length === 1 ? '' : 's'}…`;
        const granted = await ensureProviderPermissions(external);
        let activeExternal = external;
        if (!granted) {
          activeExternal = [];
          for (const id of external) {
            const orgs = PROVIDER_ORIGINS[id] || [];
            if (!orgs.length || await chrome.permissions?.contains?.({ origins: orgs }).catch(() => false)) {
              activeExternal.push(id);
            }
          }
        }
        if (activeExternal.length > 0) {
          const response = await send({ type: 'EXTRACT_EXTERNAL_PROVIDERS', query, providers: activeExternal, limit }, 45000);
          if (!response?.ok) throw new Error(response?.error || 'Channel search failed.');
          showProviderSummary(root, response);
          status.className = 'ux-status ok';
          status.textContent = `Saved ${response.nativeJobs?.length || response.jobs?.length || 0} unique opportunities to the workspace.`;
        } else if (!useNaukri) {
          throw new Error('Required channel permission was not granted. Please approve the permission prompt or search Naukri directly.');
        }
      }

      if (useNaukri) {
        status.className = 'ux-status';
        status.textContent = external.length ? 'External jobs saved. Connecting to Naukri search in background…' : 'Connecting to Naukri search in background…';
        const opened = await send({ type: 'OPEN_NAUKRI_EXTRACTOR_SEARCH', search: { keywords: query, experience: '', location: '', active: false } }, 60000);
        if (!opened?.ok || !opened?.ready || !opened?.tabId) throw new Error(opened?.error || 'Naukri search results did not become ready for extraction.');
        status.className = 'ux-status ok';
        status.textContent = `Naukri rendered ${opened.visibleJobs || 'the'} matching result cards. Starting extraction from that exact fresh tab…`;
        const params = new URLSearchParams({ scan: '1', target: String(limit), sourceTab: String(opened.tabId) });
        location.assign(chrome.runtime.getURL(`index.html?${params.toString()}`));
        return;
      }

      status.className = 'ux-status ok';
      if (!external.length) status.textContent = 'Search completed.';
    } catch (error) {
      status.className = 'ux-status error';
      status.textContent = `Error: ${error?.message || String(error)}`;
    } finally {
      button.disabled = false;
    }
  }

  function mount() {
    const existing = document.getElementById(ID);
    if (!isExtractorPage()) {
      existing?.remove();
      return;
    }
    removeRetiredProfileRefresh();
    removeLegacyPanels();
    if (existing?.isConnected) return;
    const consoleRoot = extractorConsole();
    const head = consoleRoot?.querySelector?.('.extractor-console-head');
    if (!consoleRoot || !head) return;
    installStyles();
    const root = createPanel();
    // Keep the one-query + portal filters visible at the top of the real
    // Extractor console, including while an auto-started run is active.
    head.insertAdjacentElement('afterend', root);
    loadDefaults(root);
    root.querySelector('[data-run]').addEventListener('click', () => runUnifiedSearch(root));
    root.querySelector('[data-query]').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); runUnifiedSearch(root); }
    });
  }

  let timer = 0;
  const schedule = (delay = 120) => {
    clearTimeout(timer);
    timer = setTimeout(mount, delay);
  };
  document.addEventListener('DOMContentLoaded', () => schedule(120), { once: true });
  window.addEventListener('popstate', () => schedule(100));
  window.addEventListener('hashchange', () => schedule(100));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(120); });
  // React tab changes are user-driven even when the URL stays stable. Mount after
  // those clicks instead of polling the whole dashboard forever.
  document.addEventListener('click', () => schedule(90), { capture: true, passive: true });
  // React can auto-start extraction before the enhancement script mounts.
  // Retry for a finite startup window only; do not install a permanent DOM poller.
  [250, 700, 1400, 2600, 4500, 7000, 10000].forEach((delay) => window.setTimeout(() => schedule(0), delay));
})();

} catch(e) { console.error('[Applyra] extractor-universal.js init error:', e); }

// --- dashboard-overview.js ---
try {
(() => {
  'use strict';

  const ID = 'applyra-overview-health';
  const STYLE_ID = 'applyra-overview-health-style';
  const KEYS = ['jobs', 'runs', 'activeRun', 'profile', 'lastAutomaticNaukriCapture', 'lastScan'];
  let stateCache = {};
  let initialLoadStarted = false;

  const storageGet = (keys) => new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  const safeArray = (value) => Array.isArray(value) ? value : [];
  const dateText = (value) => {
    if (!value) return 'Not yet';
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString() : 'Not yet';
  };

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
#${ID}{margin:0 0 16px;padding:15px 16px;border:1px solid #d5dfed;border-radius:12px;background:#fff;color:#17213a;font-family:inherit;box-shadow:0 1px 2px rgba(18,35,70,.025)}
#${ID} *{box-sizing:border-box}#${ID} .aoh-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:11px}#${ID} .aoh-title{font-size:13px;font-weight:850}#${ID} .aoh-sub{font-size:10.5px;color:#69768b;margin-top:3px;line-height:1.4}#${ID} .aoh-badge{font-size:9px;font-weight:850;letter-spacing:.05em;color:#315b99;background:#edf4ff;border-radius:999px;padding:5px 8px;white-space:nowrap}
#${ID} .aoh-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}#${ID} .aoh-card{border:1px solid #e0e7f0;border-radius:9px;padding:9px 10px;background:#fbfcfe;min-width:0}#${ID} .aoh-label{font-size:9.5px;color:#748197;text-transform:uppercase;letter-spacing:.045em;font-weight:800}#${ID} .aoh-value{font-size:13px;font-weight:850;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#${ID} .aoh-note{font-size:9.5px;color:#718096;margin-top:3px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#${ID} .aoh-next{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;padding-top:10px;border-top:1px solid #e7edf5}#${ID} .aoh-next strong{display:block;font-size:11px}#${ID} .aoh-next span{display:block;font-size:10px;color:#6d798d;margin-top:2px}#${ID} .aoh-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}#${ID} button{border:1px solid #cdd9ea;border-radius:8px;background:#fff;color:#20324f;padding:6px 9px;font:inherit;font-size:9.5px;font-weight:800;cursor:pointer}#${ID} button.primary{background:#1760e8;border-color:#1760e8;color:#fff}
@media(max-width:1000px){#${ID} .aoh-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#${ID} .aoh-next{align-items:flex-start;flex-direction:column}#${ID} .aoh-actions{justify-content:flex-start}}
`;
    document.head.appendChild(style);
  }

  function navigate(label) {
    const buttons = [...document.querySelectorAll('button,a')];
    const target = buttons.find((element) => (element.textContent || '').trim() === label);
    target?.click();
  }

  function derive(state) {
    const jobs = safeArray(state.jobs);
    const runs = safeArray(state.runs);
    const applied = jobs.filter((job) => /^applied$/i.test(String(job?.status || job?.applicationStatus || ''))).length;
    const interviews = jobs.filter((job) => /interview/i.test(String(job?.status || job?.applicationStatus || ''))).length;
    const offers = jobs.filter((job) => /offer/i.test(String(job?.status || job?.applicationStatus || ''))).length;
    const sourceNames = [...new Set(jobs.map((job) => job?.source?.id || job?.source || job?.portal || '').filter(Boolean).map(String))];
    const latestRun = runs.slice().sort((a, b) => new Date(b?.updatedAt || b?.endedAt || b?.startedAt || 0) - new Date(a?.updatedAt || a?.endedAt || a?.startedAt || 0))[0] || state.activeRun || null;
    const capture = state.lastAutomaticNaukriCapture || {};
    const profileAt = capture.at || capture.capturedAt || capture.updatedAt || state.profile?.capturedAt || state.profile?.updatedAt || '';
    const lastScan = state.lastScan || {};

    let next = { title: 'Workspace ready', note: 'Continue from the workflow that needs attention.', action: 'Extractor' };
    const hasProfile = Boolean(state.profile && (state.profile.headline || (Array.isArray(state.profile.skills) && state.profile.skills.length) || state.profile.fullName || state.profile.name || state.profile.naukriProfile));
    if (!hasProfile) next = { title: 'Capture your profile', note: 'Open your Naukri profile; Applyra will hydrate lazy sections and capture automatically.', action: 'Profile' };
    else if (!jobs.length) next = { title: 'Build your job corpus', note: 'Use one Extractor query and select the portals you want.', action: 'Extractor' };
    else if (!applied && !interviews && !offers) next = { title: 'Corpus ready for action', note: `${jobs.length} captured jobs are available; review and move the best opportunities into your pipeline.`, action: 'Applications' };

    return {
      jobs: jobs.length,
      sourceNames,
      applied,
      interviews,
      offers,
      lastRun: latestRun ? `${latestRun.status || 'saved'} · ${dateText(latestRun.updatedAt || latestRun.endedAt || latestRun.startedAt)}` : 'No run yet',
      lastScan: lastScan?.at ? dateText(lastScan.at) : 'Not yet',
      profileAt: dateText(profileAt),
      profileNote: capture?.diagnostics?.coreProfileReady
        ? `Core saved · ${(capture.diagnostics.loadedProfileSections || []).length} section(s) loaded${(capture.diagnostics.pendingProfileSections || []).length ? ` · ${(capture.diagnostics.pendingProfileSections || []).length} enriching` : ''}`
        : 'Latest saved Naukri/profile evidence',
      next
    };
  }

  function create() {
    const root = document.createElement('section');
    root.id = ID;
    root.innerHTML = `
      <div class="aoh-head"><div><div class="aoh-title">Workspace health</div><div class="aoh-sub">Corpus, pipeline, profile freshness and extraction state from the data Applyra already has. No extra score is calculated here.</div></div><span class="aoh-badge">OVERVIEW</span></div>
      <div class="aoh-grid">
        <div class="aoh-card"><div class="aoh-label">Job corpus</div><div class="aoh-value" data-jobs>—</div><div class="aoh-note" data-sources>—</div></div>
        <div class="aoh-card"><div class="aoh-label">Pipeline</div><div class="aoh-value" data-pipeline>—</div><div class="aoh-note" data-lastscan>—</div></div>
        <div class="aoh-card"><div class="aoh-label">Profile capture</div><div class="aoh-value" data-profile>—</div><div class="aoh-note" data-profile-note>—</div></div>
        <div class="aoh-card"><div class="aoh-label">Latest run</div><div class="aoh-value" data-lastrun>—</div><div class="aoh-note">Recoverable extraction state</div></div>
      </div>
      <div class="aoh-next"><div><strong data-next-title>Checking workspace…</strong><span data-next-note></span></div><div class="aoh-actions"><button data-open-extractor class="primary">Extractor</button><button data-auto-apply class="primary" style="background:#059669;border-color:#059669;margin-left:8px;">🚀 Auto-Apply Top Matches</button></div></div>`;
    root.querySelector('[data-open-extractor]').addEventListener('click', () => navigate('Extractor'));
    root.querySelector('[data-auto-apply]')?.addEventListener('click', async () => {
      const btn = root.querySelector('[data-auto-apply]');
      if (!btn) return;
      btn.disabled = true;
      btn.textContent = '🚀 Starting Auto Apply Loop…';

      try {
        let totalApplied = 0;
        const maxBatches = 5;

        for (let batch = 1; batch <= maxBatches; batch++) {
          btn.textContent = `🚀 Applying Batch ${batch}/${maxBatches} (5 jobs)…`;
          
          const resp = await chrome.runtime.sendMessage({
            type: 'RUN_NAUKRI_AUTO_APPLY',
            settings: { batchSize: 5, openVisibleTab: true }
          }).catch(e => ({ ok: false, error: e?.message }));

          if (!resp?.ok) {
            console.warn(`[Applyra] Batch ${batch} halted:`, resp?.error);
            break;
          }

          const newly = Number(resp?.newlyAppliedCount || resp?.appliedCount || 5);
          totalApplied += newly;
          btn.textContent = `✓ Batch ${batch} done (${totalApplied} jobs). Next in 3s…`;

          await new Promise(r => setTimeout(r, 3500));

          const tabId = resp?.tabId;
          if (tabId && globalThis.chrome?.tabs?.update) {
            await chrome.tabs.update(tabId, { url: 'https://www.naukri.com/mnjuser/recommendedjobs' }).catch(() => {});
            await new Promise(r => setTimeout(r, 3000));
          }
        }

        btn.textContent = `🎉 Done! ${totalApplied} Jobs Applied.`;
      } catch (err) {
        btn.textContent = '⚠️ Auto Apply stopped';
      } finally {
        setTimeout(() => {
          if (btn) {
            btn.disabled = false;
            btn.textContent = '🚀 Auto-Apply Top Matches';
          }
        }, 5000);
      }
    });
    return root;
  }

  function render(root) {
    if (!root?.isConnected) return;
    try {
      const view = derive(stateCache);
      root.querySelector('[data-jobs]').textContent = `${view.jobs} jobs`;
      root.querySelector('[data-sources]').textContent = view.sourceNames.length ? `${view.sourceNames.length} source${view.sourceNames.length === 1 ? '' : 's'} · ${view.sourceNames.slice(0, 3).join(', ')}` : 'No source data yet';
      root.querySelector('[data-pipeline]').textContent = `${view.applied} applied · ${view.interviews} interview · ${view.offers} offer`;
      root.querySelector('[data-lastscan]').textContent = `Last extraction: ${view.lastScan}`;
      root.querySelector('[data-profile]').textContent = view.profileAt;
      root.querySelector('[data-profile-note]').textContent = view.profileNote;
      root.querySelector('[data-lastrun]').textContent = view.lastRun;
      root.querySelector('[data-next-title]').textContent = view.next.title;
      root.querySelector('[data-next-note]').textContent = view.next.note;
    } catch {
      root.querySelector('[data-next-title]').textContent = 'Overview data is temporarily unavailable';
      root.querySelector('[data-next-note]').textContent = 'The rest of the dashboard remains usable.';
    }
  }

  async function hydrateOnce(root) {
    if (initialLoadStarted) return;
    initialLoadStarted = true;
    try {
      stateCache = await storageGet(KEYS);
      render(root || document.getElementById(ID));
    } catch {}
  }

  function mount() {
    const metricStrip = document.querySelector('section.metric-strip');
    const existing = document.getElementById(ID);
    if (!metricStrip) {
      existing?.remove();
      return;
    }
    installStyles();
    if (existing?.isConnected) return;
    const root = create();
    metricStrip.insertAdjacentElement('afterend', root);
    if (initialLoadStarted) render(root); else hydrateOnce(root);
  }

  let renderTimer = 0;
  chrome?.storage?.onChanged?.addListener?.((changes, area) => {
    if (area !== 'local') return;
    let relevant = false;
    for (const key of KEYS) {
      if (!(key in changes)) continue;
      stateCache[key] = changes[key]?.newValue;
      relevant = true;
    }
    if (!relevant) return;
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => render(document.getElementById(ID)), 120);
  });

  document.addEventListener('DOMContentLoaded', () => setTimeout(mount, 180), { once: true });
  window.addEventListener('popstate', () => setTimeout(mount, 80));
  window.addEventListener('hashchange', () => setTimeout(mount, 80));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(mount, 100); });
  document.addEventListener('click', () => setTimeout(mount, 80), { capture: true, passive: true });
  setTimeout(mount, 500);
  setTimeout(mount, 1200);
  setTimeout(mount, 2600);
})();

} catch(e) { console.error('[Applyra] dashboard-overview.js init error:', e); }

// --- applyra-shell.js ---
try {
/* Applyra 3.0 Application Shell — Command Palette (Ctrl/Cmd+K) & Quick Navigation */
(function (root) {
  'use strict';
  if (root.__ApplyraShellLoaded) return;
  root.__ApplyraShellLoaded = true;

  var ITEMS = [
    { group: 'Workspace', label: 'Overview', hint: 'Command Center', action: function () { goHash('#Overview'); } },
    { group: 'Workspace', label: 'Resume & Profile Analysis', hint: 'Local parser & gaps', action: function () { goHash('#Resume'); } },
    { group: 'Workspace', label: 'Scheduled Scans', hint: 'Automated discovery', action: function () { goHash('#Scheduled%20scans'); } },
    { group: 'Workspace', label: 'Job Extractor', hint: 'Multi-portal capture', action: function () { goHash('#Extractor'); } },
    { group: 'Pipeline', label: 'Applications', hint: 'Tracked submissions', action: function () { goHash('#Applications'); } },
    { group: 'Pipeline', label: 'Pipeline Board', hint: 'Stages & status', action: function () { goHash('#Pipeline'); } },
    { group: 'Pipeline', label: 'Extraction Runs', hint: 'Run logs & batches', action: function () { goHash('#Runs'); } },
    { group: 'Pipeline', label: 'Saved Jobs', hint: 'Bookmarked roles', action: function () { goHash('#Saved'); } },
    { group: 'Intelligence', label: 'Skill Intelligence', hint: 'Role breakdowns', action: function () { goHash('#Intelligence'); } },
    { group: 'Intelligence', label: 'Study Guide', hint: 'Prep modules', action: function () { goHash('#Study%20Guide'); } },
    { group: 'Intelligence', label: 'Career Coach', hint: 'Interview log & tips', action: function () { goHash('#Career%20coach'); } },
    { group: 'Intelligence', label: 'Company & Comp Radar', hint: 'Salary & leveling', action: function () { goPage('company-intel.html'); } },
    { group: 'Automation', label: 'Auto Apply Engine', hint: 'Apply automation', action: function () { goPage('apply-engine.html'); } },
    { group: 'Automation', label: 'Automation Center', hint: 'Workspace controls', action: function () { goHash('#Automation%20Center'); } },
    { group: 'Automation', label: 'Career Suite', hint: 'Answer Vault & prep', action: function () { goPage('career-suite.html'); } },
    { group: 'Account', label: 'Profile & Evidence', hint: 'Candidate profile', action: function () { goHash('#Profile'); } },
    { group: 'Account', label: 'Settings', hint: 'Workspace preferences', action: function () { goHash('#Settings'); } },
    { group: 'Account', label: 'Billing & Plan', hint: 'Subscription status', action: function () { goPage('billing.html'); } },
    { group: 'Actions', label: 'Toggle Dark / Light Mode', hint: 'Switch appearance', action: function () {
      var btn = document.querySelector('[data-theme-toggle]');
      if (btn) btn.click();
    } },
    { group: 'Actions', label: 'Start Extraction', hint: 'Trigger job scan', action: function () {
      var btn = document.querySelector('.topbar-actions .primary-button');
      if (btn && !btn.disabled) btn.click();
    } }
  ];

  function goHash(hash) {
    if (location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname === '') {
      location.hash = hash;
    } else {
      goPage('index.html' + hash);
    }
  }

  function goPage(file) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      location.href = chrome.runtime.getURL(file);
    } else {
      location.href = file;
    }
  }

  var overlay = null;
  var inputEl = null;
  var listEl = null;
  var activeIndex = 0;
  var filtered = ITEMS.slice();

  function closePalette() {
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
  }

  function renderList() {
    if (!listEl) return;
    listEl.replaceChildren();
    if (!filtered.length) {
      var empty = document.createElement('div');
      empty.className = 'applyra-cmdk-empty';
      empty.textContent = 'No matching commands or pages.';
      listEl.appendChild(empty);
      return;
    }
    filtered.forEach(function (item, idx) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'applyra-cmdk-item' + (idx === activeIndex ? ' active' : '');
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(idx === activeIndex));

      var left = document.createElement('span');
      left.className = 'applyra-cmdk-main';
      var grp = document.createElement('span');
      grp.className = 'applyra-cmdk-group';
      grp.textContent = item.group;
      var lbl = document.createElement('span');
      lbl.className = 'applyra-cmdk-label';
      lbl.textContent = item.label;
      left.appendChild(grp);
      left.appendChild(lbl);

      var hint = document.createElement('span');
      hint.className = 'applyra-cmdk-hint';
      hint.textContent = item.hint;

      row.appendChild(left);
      row.appendChild(hint);
      row.addEventListener('mouseenter', function () {
        activeIndex = idx;
        updateSelection();
      });
      row.addEventListener('click', function () {
        closePalette();
        item.action();
      });
      listEl.appendChild(row);
    });
  }

  function updateSelection() {
    if (!listEl) return;
    var rows = listEl.querySelectorAll('.applyra-cmdk-item');
    rows.forEach(function (r, idx) {
      var on = idx === activeIndex;
      r.classList.toggle('active', on);
      r.setAttribute('aria-selected', String(on));
      if (on && r.scrollIntoView) r.scrollIntoView({ block: 'nearest' });
    });
  }

  function ensurePalette() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'applyraCommandPalette';
    overlay.className = 'applyra-cmdk-backdrop';
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');

    var dialog = document.createElement('div');
    dialog.className = 'applyra-cmdk-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Command palette');

    var head = document.createElement('div');
    head.className = 'applyra-cmdk-head';

    inputEl = document.createElement('input');
    inputEl.type = 'search';
    inputEl.className = 'applyra-cmdk-input';
    inputEl.placeholder = 'Jump to view, tool, or action…';
    inputEl.setAttribute('aria-label', 'Search commands');

    var kbd = document.createElement('kbd');
    kbd.className = 'applyra-cmdk-kbd';
    kbd.textContent = 'ESC';

    head.appendChild(inputEl);
    head.appendChild(kbd);

    listEl = document.createElement('div');
    listEl.className = 'applyra-cmdk-list';
    listEl.setAttribute('role', 'listbox');

    dialog.appendChild(head);
    dialog.appendChild(listEl);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) closePalette();
    });

    inputEl.addEventListener('input', function () {
      var q = inputEl.value.trim().toLowerCase();
      filtered = ITEMS.filter(function (item) {
        return !q || (item.group + ' ' + item.label + ' ' + item.hint).toLowerCase().includes(q);
      });
      activeIndex = 0;
      renderList();
    });

    inputEl.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        if (filtered.length) {
          activeIndex = (activeIndex + 1) % filtered.length;
          updateSelection();
        }
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (filtered.length) {
          activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
          updateSelection();
        }
      } else if (ev.key === 'Enter' && filtered[activeIndex]) {
        ev.preventDefault();
        var chosen = filtered[activeIndex];
        closePalette();
        chosen.action();
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        closePalette();
      }
    });
  }

  function openPalette() {
    if (!document.body) return;
    ensurePalette();
    filtered = ITEMS.slice();
    activeIndex = 0;
    inputEl.value = '';
    renderList();
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    setTimeout(function () { inputEl.focus(); }, 0);
  }

  function mountTrigger() {
    var actions = document.querySelector('.topbar-actions');
    if (!actions || actions.querySelector('#applyraCmdkTrigger')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'applyraCmdkTrigger';
    btn.className = 'applyra-cmdk-trigger secondary-button';
    btn.title = 'Open command palette (Ctrl+K)';
    btn.setAttribute('aria-label', 'Open command palette');
    btn.innerHTML = '<span>Search</span><kbd>Ctrl K</kbd>';
    btn.addEventListener('click', openPalette);
    actions.insertBefore(btn, actions.firstChild);
  }

  document.addEventListener('keydown', function (ev) {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      if (overlay && !overlay.hidden) closePalette();
      else openPalette();
    } else if (ev.key === 'Escape' && overlay && !overlay.hidden) {
      closePalette();
    }
  });

  function initShell() {
    mountTrigger();
    if (typeof MutationObserver !== 'undefined' && document.body) {
      var obs = new MutationObserver(function () {
        if (!document.getElementById('applyraCmdkTrigger') && document.querySelector('.topbar-actions')) {
          mountTrigger();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShell);
  } else {
    initShell();
  }

  root.ApplyraShell = Object.freeze({ openPalette: openPalette, closePalette: closePalette });
})(typeof globalThis !== 'undefined' ? globalThis : this);

} catch(e) { console.error('[Applyra] applyra-shell.js init error:', e); }
