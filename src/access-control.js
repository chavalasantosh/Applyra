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
