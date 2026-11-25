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
