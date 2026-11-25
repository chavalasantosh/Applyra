import type { ApplyraTheme } from './types.js';

declare const chrome: any;

export function hasExtensionStorage(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome?.storage?.local);
}

export async function storageGet<T = Record<string, unknown>>(keys: string | string[]): Promise<T> {
  if (!hasExtensionStorage()) {
    return {} as T;
  }
  return (await chrome.storage.local.get(keys)) as T;
}

export async function storageSet(items: Record<string, unknown>): Promise<void> {
  if (!hasExtensionStorage()) {
    throw new Error('Extension storage is unavailable in this context.');
  }
  await chrome.storage.local.set(items);
}

export async function sendRuntimeMessage<T = unknown>(type: string, payload: Record<string, unknown> = {}): Promise<T> {
  if (typeof chrome === 'undefined' || !chrome?.runtime?.sendMessage) {
    throw new Error('Extension runtime messaging is unavailable.');
  }
  return new Promise<T>((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...payload }, (response: T) => {
      const err = chrome.runtime?.lastError;
      if (err) {
        reject(new Error(err.message || 'Runtime messaging failed.'));
        return;
      }
      resolve(response);
    });
  });
}

export function getSavedTheme(): ApplyraTheme {
  try {
    const value = localStorage.getItem('applyra-theme');
    if (value === 'light' || value === 'dark') return value;
  } catch {
    // Ignore storage access restrictions
  }
  return 'dark';
}
