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
