/**
 * Applyra Career Toolkit Client Bridge
 * Connects the Applyra Extension with the Python Career Toolkit (job_auto_apply_toolkit.py).
 */
(function(root) {
  'use strict';

  const DEFAULT_ENDPOINT = 'http://127.0.0.1:8765';

  const ApplyraToolkitBridge = {
    endpoint: DEFAULT_ENDPOINT,

    async checkHealth(endpoint = this.endpoint) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${endpoint}/api/health`, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!res.ok) return { ok: false, connected: false, healthy: false, status: 'error', code: res.status };
        const data = await res.json();
        return {
          ok: true,
          connected: true,
          healthy: true,
          jobCount: data.jobs || 0,
          ...data
        };
      } catch (e) {
        return { ok: false, connected: false, error: e.message || String(e) };
      }
    },

    async syncToToolkit(workspaceData, endpoint = this.endpoint) {
      try {
        const res = await fetch(`${endpoint}/api/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workspaceData || {})
        });
        if (!res.ok) throw new Error(`Toolkit returned HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        return { ok: false, error: e.message || String(e) };
      }
    },

    async fetchFromToolkit(endpoint = this.endpoint) {
      try {
        const res = await fetch(`${endpoint}/api/export`, { method: 'GET' });
        if (!res.ok) throw new Error(`Toolkit returned HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        return { ok: false, error: e.message || String(e) };
      }
    },

    async fetchAnalytics(endpoint = this.endpoint) {
      try {
        const res = await fetch(`${endpoint}/api/analytics`, { method: 'GET' });
        if (!res.ok) throw new Error(`Toolkit returned HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        return { ok: false, error: e.message || String(e) };
      }
    },

    async tailorResume(jobDescription, resumeText = '', endpoint = this.endpoint) {
      try {
        const res = await fetch(`${endpoint}/api/tailor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobDescription, resumeText })
        });
        if (!res.ok) throw new Error(`Toolkit returned HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        return { ok: false, error: e.message || String(e) };
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApplyraToolkitBridge;
  }
  if (typeof root !== 'undefined') {
    root.ApplyraToolkitBridge = ApplyraToolkitBridge;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
