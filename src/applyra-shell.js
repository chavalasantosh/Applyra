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
