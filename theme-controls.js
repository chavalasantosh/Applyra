/* Applyra theme + accent controller. External file only — the extension's
   CSP (script-src 'self') blocks inline scripts on every page. */
(function(){
  var root = document.documentElement;
  var THEME_KEY = 'applyra-theme';
  var ACCENT_KEY = 'applyra-accent';
  var APPEARANCE_KEY = 'applyra-appearance';
  var DARK_APPEARANCE_KEY = 'applyra-dark-appearance';
  var MOTION_KEY = 'applyra-motion-mode';
  var VALID_APPEARANCES = ['obsidian', 'ivory', 'spatial', 'cyber', 'graphite', 'aurora'];
  var VALID_MOTIONS = ['reduced', 'standard', 'enhanced', 'cinematic'];

  function systemTheme(){
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch(e) {
      return 'light';
    }
  }

  function getSavedTheme(){
    try {
      var v = localStorage.getItem(THEME_KEY);
      if (v === 'dark' || v === 'light') return v;
    } catch(e) {}
    return 'dark';
  }

  function saveTheme(t){
    try { localStorage.setItem(THEME_KEY, t); } catch(e) {}
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ applyraTheme: t });
      }
    } catch(e) {}
  }

  function ensureToggleMarkup(b){
    if (b.querySelector('.dt-track')) return;
    b.textContent = '';
    b.classList.add('applyra-daynight');
    var track = document.createElement('span');
    track.className = 'dt-track';
    track.setAttribute('aria-hidden', 'true');

    var clouds = document.createElement('span');
    clouds.className = 'dt-clouds';
    for (var i = 1; i <= 2; i++) {
      var c = document.createElement('span');
      c.className = 'dt-cloud dt-cloud-' + i;
      clouds.appendChild(c);
    }

    var stars = document.createElement('span');
    stars.className = 'dt-stars';
    for (var j = 1; j <= 4; j++) {
      var s = document.createElement('span');
      s.className = 'dt-star dt-star-' + j;
      stars.appendChild(s);
    }

    var knob = document.createElement('span');
    knob.className = 'dt-knob';
    for (var k = 1; k <= 3; k++) {
      var cr = document.createElement('span');
      cr.className = 'dt-crater dt-crater-' + k;
      knob.appendChild(cr);
    }

    track.appendChild(clouds);
    track.appendChild(stars);
    track.appendChild(knob);
    b.appendChild(track);
  }

  function updateToggleButtons(theme){
    document.querySelectorAll('[data-theme-btn]').forEach(function(b){
      b.setAttribute('aria-pressed', String(b.getAttribute('data-theme-btn') === theme));
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(function(b){
      var isDark = theme === 'dark';
      ensureToggleMarkup(b);
      b.setAttribute('aria-pressed', String(isDark));
      b.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  function getSavedAppearance(theme){
    try {
      var ap = localStorage.getItem(APPEARANCE_KEY);
      if (VALID_APPEARANCES.indexOf(ap) !== -1) return ap;
    } catch(e) {}
    return theme === 'light' ? 'ivory' : 'obsidian';
  }

  function getSavedMotion(){
    try {
      var m = localStorage.getItem(MOTION_KEY);
      if (VALID_MOTIONS.indexOf(m) !== -1) return m;
    } catch(e) {}
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced';
    } catch(e) {}
    return 'enhanced';
  }

  function apply(theme, accent, explicitAppearance){
    var resolved = theme === 'dark' ? 'dark' : 'light';
    var appearance = explicitAppearance || getSavedAppearance(resolved);
    if (resolved === 'light') appearance = 'ivory';
    else if (appearance === 'ivory') {
      try {
        var prevDark = localStorage.getItem(DARK_APPEARANCE_KEY);
        appearance = (VALID_APPEARANCES.indexOf(prevDark) !== -1 && prevDark !== 'ivory') ? prevDark : 'obsidian';
      } catch(e) {
        appearance = 'obsidian';
      }
    }
    root.setAttribute('data-theme', resolved);
    root.setAttribute('data-appearance', appearance);
    root.setAttribute('data-motion', getSavedMotion());
    root.style.colorScheme = resolved;
    root.setAttribute('data-accent', accent || 'aqua');
    try {
      localStorage.setItem(APPEARANCE_KEY, appearance);
      if (resolved === 'dark' && appearance !== 'ivory') {
        localStorage.setItem(DARK_APPEARANCE_KEY, appearance);
      }
    } catch(e) {}
    updateToggleButtons(resolved);
  }

  var savedAccent = 'aqua';
  try { savedAccent = localStorage.getItem(ACCENT_KEY) || 'aqua'; } catch(e) {}
  apply(getSavedTheme(), savedAccent);

  // Sync from chrome.storage.local if available
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['applyraTheme', 'applyraAppearance', 'applyraMotionMode'], function(res){
        if (res && VALID_MOTIONS.indexOf(res.applyraMotionMode) !== -1) {
          try { localStorage.setItem(MOTION_KEY, res.applyraMotionMode); } catch(e) {}
          root.setAttribute('data-motion', res.applyraMotionMode);
        }
        if (res && (res.applyraTheme === 'dark' || res.applyraTheme === 'light')) {
          try { localStorage.setItem(THEME_KEY, res.applyraTheme); } catch(e) {}
          var ap = VALID_APPEARANCES.indexOf(res.applyraAppearance) !== -1 ? res.applyraAppearance : null;
          apply(res.applyraTheme, root.getAttribute('data-accent') || 'aqua', ap);
        }
      });
    }
  } catch(e) {}

  window.addEventListener('storage', function(ev){
    if (ev.key === THEME_KEY && (ev.newValue === 'dark' || ev.newValue === 'light')) {
      apply(ev.newValue, root.getAttribute('data-accent') || 'aqua');
    }
  });

  function mountThemeToggle(){
    if (!document.body) return;
    var topbarActions = document.querySelector('.topbar-actions');
    if (topbarActions) {
      var existingFab = document.querySelector('.applyra-theme-fab');
      if (existingFab) existingFab.remove();
      if (!topbarActions.querySelector('[data-theme-toggle]')) {
        var topBtn = document.createElement('button');
        topBtn.type = 'button';
        topBtn.className = 'applyra-topbar-theme-btn theme-toggle-btn';
        topBtn.setAttribute('data-theme-toggle', '');
        topBtn.setAttribute('aria-label', 'Toggle dark mode');
        topbarActions.appendChild(topBtn);
      }
      updateToggleButtons(root.getAttribute('data-theme') || 'dark');
      return;
    }
    if (!document.querySelector('[data-theme-toggle], [data-theme-btn]')) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'applyra-theme-fab';
      btn.setAttribute('data-theme-toggle', '');
      btn.setAttribute('aria-label', 'Toggle dark mode');
      document.body.appendChild(btn);
    }
    updateToggleButtons(root.getAttribute('data-theme') || 'dark');
  }

  document.addEventListener('DOMContentLoaded', function(){
    mountThemeToggle();
    if (typeof MutationObserver !== 'undefined' && document.body) {
      var obs = new MutationObserver(function(){
        var topbarActions = document.querySelector('.topbar-actions');
        if (topbarActions && !topbarActions.querySelector('[data-theme-toggle]')) {
          mountThemeToggle();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  });

  document.addEventListener('click', function(ev){
    var toggleBtn = ev.target.closest && ev.target.closest('[data-theme-toggle]');
    var themeBtn = ev.target.closest && ev.target.closest('[data-theme-btn]');
    var accentBtn = ev.target.closest && ev.target.closest('[data-accent-btn]');
    if (toggleBtn) {
      var next = (root.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
      saveTheme(next);
      apply(next, root.getAttribute('data-accent') || 'aqua');
    }
    if (themeBtn) {
      var t = themeBtn.getAttribute('data-theme-btn');
      saveTheme(t);
      apply(t, root.getAttribute('data-accent') || 'aqua');
    }
    if (accentBtn) {
      var a = accentBtn.getAttribute('data-accent-btn');
      try { localStorage.setItem(ACCENT_KEY, a); } catch(e) {}
      apply(root.getAttribute('data-theme') || 'light', a);
    }
  });
})();
