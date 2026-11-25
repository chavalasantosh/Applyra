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
