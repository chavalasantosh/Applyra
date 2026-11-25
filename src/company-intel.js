/**
 * Applyra Native Company & Compensation Intelligence Controller
 * Multi-Source Production Pipeline:
 * - Option 1: Live Public Tech APIs (Remotive, Arbeitnow, Adzuna)
 * - Option 2: Applyra Extractor Database (Naukri, LinkedIn, Indeed Workspace Data)
 * - Option 3: Supabase Cloud Sync
 */

(() => {
  'use strict';

  const Core = window.ApplyraCompanyIntelCore;
  if (!Core) {
    console.error('ApplyraCompanyIntelCore not loaded.');
    return;
  }

  // Read initial URL query parameters
  const initialParams = new URLSearchParams(window.location.search);
  const paramComp = initialParams.get('company');
  const paramRole = initialParams.get('track') || initialParams.get('role');
  const paramCur = initialParams.get('currency');

  // Global State
  let currentCompany = (paramComp && paramComp.trim()) ? paramComp.trim() : '';
  let currentCurrency = (paramCur && paramCur.trim() && Core.CURRENCY_REGISTRY?.[paramCur.trim().toUpperCase()]) 
    ? paramCur.trim().toUpperCase() 
    : 'INR';
  let currentTrack = (paramRole && paramRole.trim()) ? paramRole.trim() : 'Software Engineer';
  let activeCategory = 'india_tech';
  let activeExpFilter = 'all';
  let roleSearchTerm = '';
  let selectedBenchmarkLevelIndex = 2; // Default to Senior (L3)
  let storageCache = { jobs: [], careerSuite: { tracker: [] }, history: [], pipelineConfig: {} };
  let trackDebounceTimer = null;
  let liveRequestNumber = 0;

  // Auto-detect category from initial company if present
  if (currentCompany && Core.COMPANY_CATEGORIES) {
    for (const [catKey, catList] of Object.entries(Core.COMPANY_CATEGORIES)) {
      if (catList.some(item => {
        const name = typeof item === 'string' ? item : item.name;
        const nLower = name.toLowerCase();
        const cLower = currentCompany.toLowerCase();
        return nLower === cLower || cLower.includes(nLower) || nLower.includes(cLower);
      })) {
        activeCategory = catKey;
        break;
      }
    }
  }

  // DOM Elements - Shell & Controls
  const companyInput = document.getElementById('companyInput');
  const companiesList = document.getElementById('companiesList');
  const currencySelect = document.getElementById('currencySelect');
  const trackInput = document.getElementById('trackInput');
  const categoryTabs = document.getElementById('categoryTabs');
  const quickChipsContainer = document.getElementById('quickChipsContainer');
  const chipsLabel = document.getElementById('chipsLabel');

  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // Tab 1 Elements: Live Market Openings & Dossier
  const activeCompanyLogo = document.getElementById('activeCompanyLogo');
  if (activeCompanyLogo) {
    activeCompanyLogo.addEventListener('error', () => {
      activeCompanyLogo.style.display = 'none';
    });
  }
  const liveJobsTitle = document.getElementById('liveJobsTitle');
  const dossierTierBadge = document.getElementById('dossierTierBadge');
  const liveJobsSubtitle = document.getElementById('liveJobsSubtitle');
  const activeSourceBadge = document.getElementById('activeSourceBadge');
  const pipelineStatusText = document.getElementById('pipelineStatusText');
  const statIndustry = document.getElementById('statIndustry');
  const statHQ = document.getElementById('statHQ');
  const statEmployees = document.getElementById('statEmployees');
  const statRating = document.getElementById('statRating');
  const roleSearchInput = document.getElementById('roleSearchInput');
  const roleExpFilters = document.getElementById('roleExpFilters');
  const nativeJobsList = document.getElementById('nativeJobsList');

  // Tab 2 Elements: Compensation Distribution Benchmark
  const chartTitle = document.getElementById('chartTitle');
  const chartLevelSwitcher = document.getElementById('chartLevelSwitcher');
  const benchmarkVisualBox = document.getElementById('benchmarkVisualBox');
  const compensationChartContainer = document.getElementById('compensationChartContainer') || benchmarkVisualBox;
  const compensationLadderBody = document.getElementById('compensationLadderBody');

  // Tab 3 Elements: Leveling Ladder & Comparison
  const levelingTitle = document.getElementById('levelingTitle');
  const compareInputA = document.getElementById('compareInputA');
  const compareInputB = document.getElementById('compareInputB');
  const updateCompareBtn = document.getElementById('updateCompareBtn');
  const sideBySideLevelingGrid = document.getElementById('sideBySideLevelingGrid');
  const universalMatrixBody = document.getElementById('universalMatrixBody');

  // Tab 4 Elements: Pipeline
  const liveStatusText = document.getElementById('liveStatusText');
  const liveDetailText = document.getElementById('liveDetailText');
  const matchedJobsContainer = document.getElementById('matchedJobsContainer');

  // Tab 5 Elements: Calculator
  const calcBase = document.getElementById('calcBase');
  const calcBonus = document.getElementById('calcBonus');
  const calcEquity = document.getElementById('calcEquity');
  const displayTotalTc = document.getElementById('displayTotalTc');
  const displayVerdictBadge = document.getElementById('displayVerdictBadge');
  const displayCounterTip = document.getElementById('displayCounterTip');

  // Pipeline Settings Modal Elements
  const togglePipelineSettingsBtn = document.getElementById('togglePipelineSettingsBtn');
  const pipelineSettingsModal = document.getElementById('pipelineSettingsModal');
  const closePipelineModalBtn = document.getElementById('closePipelineModalBtn');
  const savePipelineConfigBtn = document.getElementById('savePipelineConfigBtn');
  const adzunaAppIdInput = document.getElementById('adzunaAppIdInput');
  const adzunaApiKeyInput = document.getElementById('adzunaApiKeyInput');
  const supabaseUrlInput = document.getElementById('supabaseUrlInput');
  const workspaceJobsCountBadge = document.getElementById('workspaceJobsCountBadge');

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Populate datalist with companies
  function populateCompaniesDatalist() {
    if (!companiesList) return;
    companiesList.innerHTML = '';
    Core.POPULAR_COMPANIES.forEach(comp => {
      const opt = document.createElement('option');
      opt.value = comp.name;
      companiesList.appendChild(opt);
    });
  }

  // Render Hub Chips based on selected category
  function renderChipsForCategory(category) {
    if (!quickChipsContainer) return;
    quickChipsContainer.innerHTML = '';

    let list = [];
    if (category === 'user') {
      const userComps = Core.extractUserCompanies(storageCache);
      if (chipsLabel) chipsLabel.textContent = 'YOUR SAVED JOBS:';
      if (userComps.length === 0) {
        quickChipsContainer.innerHTML = '<span style="font-size:12px;color:var(--text-tertiary);padding:4px 0;">No saved jobs yet in your tracker. Extracting roles from job boards will automatically add employer chips here!</span>';
        return;
      }
      list = userComps;
    } else if (Core.COMPANY_CATEGORIES[category]) {
      list = Core.COMPANY_CATEGORIES[category];
      if (chipsLabel) {
        if (category === 'india_tech') chipsLabel.textContent = 'INDIA TECH & SERVICES:';
        else if (category === 'top_tech') chipsLabel.textContent = 'TOP TECH (TIER 1):';
        else if (category === 'cloud_unicorns') chipsLabel.textContent = 'CLOUD & UNICORNS:';
        else if (category === 'fintech_quant') chipsLabel.textContent = 'FINTECH & QUANT:';
        else if (category === 'ai_hardware') chipsLabel.textContent = 'AI & HARDWARE:';
      }
    } else {
      list = Core.COMPANY_CATEGORIES.india_tech;
    }

    list.forEach(item => {
      const compName = typeof item === 'string' ? item : item.name;
      const btn = document.createElement('button');
      btn.className = 'chip';
      if (category === 'user') btn.classList.add('user-chip');
      if (compName.toLowerCase() === currentCompany.toLowerCase()) {
        btn.classList.add('active');
      }
      btn.textContent = compName;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        currentCompany = compName;
        if (companyInput) companyInput.value = currentCompany;
        if (compareInputA) compareInputA.value = currentCompany;
        updateAllViews();
      });

      quickChipsContainer.appendChild(btn);
    });
  }

  // Setup Category Pills
  function setupCategorySelector() {
    if (!categoryTabs) return;
    const pills = categoryTabs.querySelectorAll('.category-pill');

    pills.forEach(pill => {
      const cat = pill.getAttribute('data-cat');
      pill.classList.toggle('active', cat === activeCategory);
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeCategory = pill.getAttribute('data-cat');
        renderChipsForCategory(activeCategory);
      });
    });
  }

  // -----------------------------------------------------------------
  // TAB 1: RENDER LIVE MARKET OPPORTUNITIES (MULTI-SOURCE PIPELINE)
  // -----------------------------------------------------------------
  async function renderLiveOpportunities() {
    const requestNumber = ++liveRequestNumber;
    if (!nativeJobsList) return;

    if (!currentCompany) {
      if (activeCompanyLogo) activeCompanyLogo.style.display = 'none';
      if (liveJobsTitle) liveJobsTitle.textContent = 'Select or Search an Employer';
      if (dossierTierBadge) dossierTierBadge.textContent = 'Awaiting Input';
      if (liveJobsSubtitle) {
        liveJobsSubtitle.textContent = `Type an employer name above or pick a quick chip below to view live market openings.`;
      }
      if (statIndustry) statIndustry.textContent = '—';
      if (statHQ) statHQ.textContent = '—';
      if (statEmployees) statEmployees.textContent = '—';
      if (statRating) statRating.textContent = '—';
      nativeJobsList.innerHTML = `
        <div style="background:var(--bg-subtle);border:1px dashed var(--border-subtle);border-radius:var(--radius-md);padding:36px 20px;text-align:center;">
          <div style="font-size:14px;font-weight:750;color:var(--text-primary);margin-bottom:6px;">
            🔍 Search or select an employer
          </div>
          <div style="font-size:12px;color:var(--text-secondary);max-width:440px;margin:0 auto 14px;">
            Enter an employer name above (e.g. Google, TCS, Infosys, Flipkart, Stripe) or click any quick chip to inspect compensation benchmarks and verified openings.
          </div>
        </div>
      `;
      return;
    }

    // Instant preliminary sync so the requested company's dossier renders immediately (0ms)
    const preliminaryDossier = Core.getCompanyDossier(currentCompany, currentTrack, currentCurrency);
    const curMeta = Core.CURRENCY_REGISTRY[currentCurrency] || Core.CURRENCY_REGISTRY.INR;

    if (activeCompanyLogo) {
      activeCompanyLogo.src = Core.getCompanyLogoUrl(currentCompany);
      activeCompanyLogo.style.display = 'block';
    }
    if (liveJobsTitle) liveJobsTitle.textContent = preliminaryDossier.name;
    if (dossierTierBadge) dossierTierBadge.textContent = preliminaryDossier.tier;
    if (liveJobsSubtitle) {
      liveJobsSubtitle.textContent = `Sourced job listings for "${currentTrack}" (${curMeta.region} · ${curMeta.code}).`;
    }
    if (statIndustry) statIndustry.textContent = preliminaryDossier.industry;
    if (statHQ) statHQ.textContent = preliminaryDossier.headquarters;
    if (statEmployees) statEmployees.textContent = `${preliminaryDossier.employees || 'Enterprise Scale'}`;
    if (statRating) {
      statRating.innerHTML = `<span style="color:var(--primary);font-weight:700;">Role Benchmark</span> <span style="font-size:11px;font-weight:500;color:var(--text-secondary);">(No salary evidence)</span>`;
    }

    // Show live loading shimmer
    nativeJobsList.innerHTML = `
      <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:24px 20px;text-align:center;">
        <div style="font-size:13px;font-weight:750;color:var(--primary);margin-bottom:6px;">
          ⚡ Aggregating Multi-Source Intelligence for ${escapeHtml(currentCompany)}…
        </div>
        <div style="font-size:11.5px;color:var(--text-secondary);">
          Querying Option 1 (Live Public APIs) · Option 2 (Applyra Extractor DB) · Option 3 (Supabase Sync)
        </div>
      </div>
    `;

    // Fetch unified intelligence from all 3 options
    const intel = await Core.fetchUnifiedMarketIntelligence({
      company: currentCompany,
      track: currentTrack,
      currency: currentCurrency,
      storageData: storageCache,
      customConfig: storageCache.pipelineConfig || {}
    });

    if (requestNumber !== liveRequestNumber) return;
    const dossier = intel.dossier;

    // Update Header & Dossier Metrics
    if (activeCompanyLogo) {
      activeCompanyLogo.src = Core.getCompanyLogoUrl(currentCompany);
      activeCompanyLogo.style.display = 'block';
    }
    if (liveJobsTitle) liveJobsTitle.textContent = dossier.name;
    if (dossierTierBadge) dossierTierBadge.textContent = dossier.tier;
    if (liveJobsSubtitle) {
      liveJobsSubtitle.textContent = `Sourced job listings for "${currentTrack}" (${curMeta.region} · ${curMeta.code}).`;
    }

    if (activeSourceBadge) activeSourceBadge.textContent = dossier.sourceBadge;
    if (pipelineStatusText) pipelineStatusText.textContent = dossier.sourceDetail;

    if (statIndustry) statIndustry.textContent = dossier.industry;
    if (statHQ) statHQ.textContent = dossier.headquarters;
    if (statEmployees) statEmployees.textContent = `${dossier.employees || 'Enterprise Scale'}`;
    if (statRating) {
      if (dossier.isEmpirical) {
        statRating.innerHTML = `<span style="color:var(--accent-emerald);font-weight:750;">● Observed salary records</span> <span style="font-size:11px;font-weight:500;color:var(--text-secondary);">(${dossier.empiricalCount} Listing samples)</span>`;
      } else {
        statRating.innerHTML = `<span style="color:var(--primary);font-weight:700;">Role Benchmark</span> <span style="font-size:11px;font-weight:500;color:var(--text-secondary);">(No salary evidence)</span>`;
      }
    }

    // Filter jobs
    let jobs = Array.isArray(intel.jobs) ? intel.jobs : [];
    if (roleSearchTerm) {
      const term = roleSearchTerm.toLowerCase();
      jobs = jobs.filter(r => 
        r.title.toLowerCase().includes(term) || 
        r.tags.some(t => t.toLowerCase().includes(term)) ||
        (r.location && r.location.toLowerCase().includes(term))
      );
    }

    if (activeExpFilter !== 'all') {
      jobs = jobs.filter(r => {
        const exp = r.exp || '';
        if (activeExpFilter === '0-2') return /0-2|1-2|entry|junior/i.test(exp) || /junior/i.test(r.title);
        if (activeExpFilter === '2-5') return /2-5|3-5|mid/i.test(exp) || /ii/i.test(r.title);
        if (activeExpFilter === '5-8') return /5-8|4-7|5-9|senior/i.test(exp) || /senior/i.test(r.title);
        if (activeExpFilter === '8+') return /8\+|8-12|9-13|10\+|lead|principal|staff/i.test(exp) || /lead|principal|staff|manager/i.test(r.title);
        return true;
      });
    }

    nativeJobsList.innerHTML = '';

    if (jobs.length === 0) {
      nativeJobsList.innerHTML = `
        <div style="background:var(--bg-subtle);border:1px dashed var(--border-subtle);border-radius:var(--radius-md);padding:32px 20px;text-align:center;">
          <strong style="font-size:14px;color:var(--text-primary);display:block;margin-bottom:6px;">No live postings match the selected filter</strong>
          <p style="font-size:12px;color:var(--text-secondary);margin:0 0 14px;">Try searching for a different keyword or selecting "All Roles".</p>
          <button id="resetRoleFiltersBtn" class="hdr-btn primary" style="font-size:11.5px;padding:6px 14px;">Show All Verified Roles</button>
        </div>
      `;
      document.getElementById('resetRoleFiltersBtn')?.addEventListener('click', () => {
        if (roleSearchInput) roleSearchInput.value = '';
        roleSearchTerm = '';
        activeExpFilter = 'all';
        document.querySelectorAll('.role-exp-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-exp') === 'all'));
        renderLiveOpportunities();
      });
      return;
    }

    jobs.forEach(role => {
      const companyValid = dossier.name && dossier.name !== 'Select or Search an Employer';
      const isAlreadyTracked = companyValid && storageCache.jobs && storageCache.jobs.some(j => 
        ((j.company && j.company.toLowerCase() === dossier.name.toLowerCase()) || 
         (j.companyName && j.companyName.toLowerCase() === dossier.name.toLowerCase())) &&
        ((j.title && j.title.toLowerCase() === role.title.toLowerCase()) ||
         (j.position?.title && j.position.title.toLowerCase() === role.title.toLowerCase()))
      );

      const card = document.createElement('div');
      card.className = 'native-job-card';

      // Source Tag styling
      let sourceTagStyle = 'background:#eff6ff;color:#1e40af;border-color:#bfdbfe;';
      if (role.sourceType === 'live_api') {
        sourceTagStyle = 'background:#ecfdf5;color:#047857;border-color:#a7f3d0;';
      } else if (role.sourceType === 'workspace') {
        sourceTagStyle = 'background:#fefce8;color:#854d0e;border-color:#fef08a;';
      }

      const skillPillsHtml = (role.tags || []).map(tag => 
        `<span class="job-skill-pill">${escapeHtml(tag)}</span>`
      ).join('');

      const applyUrl = role.url && role.url !== '#' 
        ? role.url 
        : `https://www.google.com/search?q=${encodeURIComponent((dossier.name || '') + ' ' + role.title + ' jobs apply')}`;

      card.innerHTML = `
        <div class="job-card-top">
          <div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span class="source-badge" style="${sourceTagStyle}font-size:10px;padding:2px 8px;">● ${escapeHtml(role.sourceLabel || 'Applyra Market Feed')}</span>
            </div>
            <h3 class="job-role-title">${escapeHtml(role.title)}</h3>
            <div class="job-meta-row">
              <span class="meta-tag">📍 ${escapeHtml(role.location)}</span>
              ${role.exp ? `<span class="meta-tag">⏳ ${escapeHtml(role.exp)}</span>` : ''}
              <span class="meta-tag">🏢 ${escapeHtml(dossier.name)}</span>
            </div>
          </div>
          <span class="job-ctc-tag">💰 ${escapeHtml(role.salary || role.ctc || 'Market Scale')}</span>
        </div>

        <div class="job-skills-wrap">
          ${skillPillsHtml}
        </div>

        <div class="job-card-foot">
          <span class="job-posted-time">Verified · ${escapeHtml(role.posted || 'Active')}</span>
          <div class="job-card-actions">
            <a href="${escapeHtml(applyUrl)}" target="_blank" rel="noopener noreferrer" class="btn-apply-job">🚀 Apply Now ↗</a>
            <button class="btn-simulate-offer" data-ctc="${escapeHtml(role.salary || role.ctc)}">🧮 Simulate Offer</button>
            <button class="btn-track-pipeline ${isAlreadyTracked ? 'tracked' : ''}" data-role-id="${escapeHtml(role.id)}">
              ${isAlreadyTracked ? '✓ Tracked in Pipeline' : '+ Track in Applyra Pipeline'}
            </button>
          </div>
        </div>
      `;

      // Track in Pipeline Click Handler
      const trackBtn = card.querySelector('.btn-track-pipeline');
      trackBtn?.addEventListener('click', () => {
        saveRoleToPipeline(role, dossier.name, trackBtn);
      });

      // Simulate Offer Click Handler
      const simBtns = card.querySelectorAll('.btn-simulate-offer');
      simBtns.forEach(btn => {
        if (!btn.href) {
          btn.addEventListener('click', () => {
            prefillOfferSimulator(role.salary || role.ctc);
          });
        }
      });

      nativeJobsList.appendChild(card);
    });
  }

  // Save role directly to Applyra's local storage pipeline
  function saveRoleToPipeline(role, companyName, btnElement) {
    try {
      const newJob = {
        id: `applyra_market_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: role.title,
        company: companyName,
        companyName: companyName,
        location: role.location,
        salary: role.salary || role.ctc,
        status: 'saved',
        date: new Date().toISOString(),
        tags: role.tags || [],
        notes: `Captured from Applyra Market Radar · Verified CTC: ${role.salary || role.ctc} (${currentCurrency})`
      };

      if (!Array.isArray(storageCache.jobs)) storageCache.jobs = [];
      storageCache.jobs.unshift(newJob);

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ jobs: storageCache.jobs }, () => {
          if (btnElement) {
            btnElement.textContent = '✓ Tracked in Pipeline';
            btnElement.classList.add('tracked');
          }
          renderPipelineTab();
          updatePipelineCountBadge();
          if (window.ApplyraToast) {
            window.ApplyraToast.show(`Saved "${role.title}" at ${companyName} to your Applyra pipeline!`);
          }
        });
      } else {
        if (btnElement) {
          btnElement.textContent = '✓ Tracked in Pipeline';
          btnElement.classList.add('tracked');
        }
        renderPipelineTab();
      }
    } catch (e) {
      console.error('Error saving role to pipeline:', e);
    }
  }

  // Pre-fill offer simulator with role numbers and switch tab
  function prefillOfferSimulator(ctcText) {
    const matches = (ctcText || '').match(/(\d+(?:\.\d+)?)/g);
    let totalApprox = 25;
    if (matches && matches.length >= 2) {
      const low = parseFloat(matches[0]);
      const high = parseFloat(matches[1]);
      totalApprox = (low + high) / 2;
    } else if (matches && matches.length === 1) {
      totalApprox = parseFloat(matches[0]);
    }

    const approxBase = Math.round(totalApprox * 0.70 * 10) / 10;
    const approxBonus = Math.round(totalApprox * 0.12 * 10) / 10;
    const approxEquity = Math.round(totalApprox * 0.18 * 10) / 10;

    if (calcBase) calcBase.value = approxBase;
    if (calcBonus) calcBonus.value = approxBonus;
    if (calcEquity) calcEquity.value = approxEquity;

    recalculateOffer();

    // Switch to Tab 5 (Calculator)
    const calcTabBtn = document.querySelector('.tab-btn[data-tab="calculator"]');
    calcTabBtn?.click();
  }

  // -----------------------------------------------------------------
  // TAB 2: RENDER COMPENSATION DISTRIBUTION BENCHMARK
  // -----------------------------------------------------------------
  function renderCompensationBenchmark() {
    if (!currentCompany) {
      if (chartTitle) chartTitle.textContent = `Observed posted salary distribution (${currentCurrency}) · Awaiting Employer`;
      if (chartLevelSwitcher) chartLevelSwitcher.innerHTML = '';
      if (compensationChartContainer) {
        compensationChartContainer.innerHTML = `
          <div style="padding:36px 20px;text-align:center;color:var(--text-secondary);font-size:13px;">
            Please search or select an employer above to view compensation curves and seniority percentiles.
          </div>
        `;
      }
      if (compensationLadderBody) compensationLadderBody.innerHTML = '';
      return;
    }

    const wsData = Core.extractWorkspaceEmpiricalData(currentCompany, currentTrack, storageCache);
    const dossier = Core.getCompanyDossier(currentCompany, currentTrack, currentCurrency, wsData.empiricalSalaries);
    const benchmarks = dossier.benchmarks || [];
    const curMeta = Core.CURRENCY_REGISTRY[currentCurrency] || Core.CURRENCY_REGISTRY.INR;

    if (chartTitle) {
      const empiricalTag = wsData.empiricalSalaries.length > 0 ? ` · Empirically Calibrated (${wsData.empiricalSalaries.length} Workspace Points)` : ' · No salary evidence';
      chartTitle.textContent = `${dossier.name} · ${currentTrack} Observed posted salary distribution (${curMeta.code})${empiricalTag}`;
    }

    if (!benchmarks.length) {
      if (chartLevelSwitcher) chartLevelSwitcher.innerHTML='';
      if (compensationLadderBody) compensationLadderBody.innerHTML='';
      if (benchmarkVisualBox) benchmarkVisualBox.textContent=dossier.benchmarkNote;
      if (compensationChartContainer) compensationChartContainer.textContent=dossier.benchmarkNote;
      return;
    }
    // Render Seniority Switcher Buttons
    if (chartLevelSwitcher) {
      chartLevelSwitcher.innerHTML = '';
      benchmarks.forEach((b, idx) => {
        const btn = document.createElement('button');
        btn.className = 'level-switch-btn';
        if (idx === selectedBenchmarkLevelIndex) btn.classList.add('active');
        btn.textContent = b.level;
        btn.addEventListener('click', () => {
          document.querySelectorAll('.level-switch-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          selectedBenchmarkLevelIndex = idx;
          renderBenchmarkVisual(benchmarks[selectedBenchmarkLevelIndex], dossier.name);
        });
        chartLevelSwitcher.appendChild(btn);
      });
    }

    // Render active level visual
    if (benchmarks.length > 0) {
      if (selectedBenchmarkLevelIndex >= benchmarks.length) selectedBenchmarkLevelIndex = 0;
      renderBenchmarkVisual(benchmarks[selectedBenchmarkLevelIndex], dossier.name);
    }

    // Render Full Seniority Table
    if (compensationLadderBody) {
      compensationLadderBody.innerHTML = '';
      benchmarks.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${escapeHtml(b.level)}</strong></td>
          <td><span class="meta-tag">${escapeHtml(b.yoe)}</span></td>
          <td><strong style="color:var(--text-secondary);">${b.p25}</strong></td>
          <td><strong style="color:var(--accent-emerald);font-size:13.5px;">${b.median}</strong></td>
          <td><strong style="color:var(--primary);">${b.p75}</strong></td>
          <td><strong style="color:var(--accent-purple);">${b.p90}</strong></td>
          <td style="font-size:11.5px;color:var(--text-secondary);">Base: ${escapeHtml(b.base)} · Bonus: ${escapeHtml(b.bonus)} · Equity: ${escapeHtml(b.equity)}</td>
        `;
        compensationLadderBody.appendChild(tr);
      });
    }
  }

  // Render Visual Percentile Bar & Breakdown Cards for selected level
  function renderBenchmarkVisual(bench, companyName) {
    if (!benchmarkVisualBox || !bench) return;

    benchmarkVisualBox.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:8px;">
        <div>
          <h3 style="margin:0;font-size:16px;font-weight:800;color:var(--text-primary);">${escapeHtml(bench.level)}</h3>
          <span style="font-size:12px;color:var(--text-secondary);">Experience: <strong>${escapeHtml(bench.yoe)}</strong> · Employer: <strong>${escapeHtml(companyName)}</strong> · Track: <strong>${escapeHtml(currentTrack)}</strong></span>
        </div>
        <span class="job-ctc-tag" style="font-size:14px;">Observed midpoint median: ${bench.median}</span>
      </div>

      <!-- Percentile Track Visual -->
      <div class="percentile-track-container">
        <div class="percentile-bar-track"></div>
        <div class="percentile-markers">
          <div class="percentile-node">
            <span class="node-badge">25TH %ILE (ENTRY)</span>
            <span class="node-val">${bench.p25}</span>
          </div>
          <div class="percentile-node">
            <span class="node-badge">50TH %ILE (MEDIAN)</span>
            <span class="node-val" style="color:var(--accent-emerald);">${bench.median}</span>
          </div>
          <div class="percentile-node">
            <span class="node-badge">75TH %ILE (STRONG)</span>
            <span class="node-val" style="color:var(--primary);">${bench.p75}</span>
          </div>
          <div class="percentile-node">
            <span class="node-badge">90TH %ILE (TOP TIER)</span>
            <span class="node-val" style="color:var(--accent-purple);">${bench.p90}</span>
          </div>
        </div>
      </div>

      <!-- Breakdown Component Cards -->
      <div class="breakdown-cards-grid">
        <div class="breakdown-card">
          <span class="stat-label">ANNUAL FIXED BASE</span>
          <strong style="font-size:16px;color:var(--text-primary);display:block;margin-top:4px;">${escapeHtml(bench.base)}</strong>
          <span style="font-size:11px;color:var(--text-tertiary);">Guaranteed fixed component</span>
        </div>
        <div class="breakdown-card">
          <span class="stat-label">PERFORMANCE BONUS</span>
          <strong style="font-size:16px;color:var(--accent-amber);display:block;margin-top:4px;">${escapeHtml(bench.bonus)}</strong>
          <span style="font-size:11px;color:var(--text-tertiary);">Annual variable incentive</span>
        </div>
        <div class="breakdown-card">
          <span class="stat-label">EQUITY / ESOP / RSUS</span>
          <strong style="font-size:16px;color:var(--accent-purple);display:block;margin-top:4px;">${escapeHtml(bench.equity)}</strong>
          <span style="font-size:11px;color:var(--text-tertiary);">Annual stock vesting</span>
        </div>
        <div class="breakdown-card" style="background:#f0fdf4;border-color:#bbf7d0;">
          <span class="stat-label" style="color:#166534;">MEDIAN TOTAL PACKAGE</span>
          <strong style="font-size:16px;color:#15803d;display:block;margin-top:4px;">${bench.median}</strong>
          <span style="font-size:11px;color:#166534;">Verified benchmark average</span>
        </div>
      </div>
    `;
  }

  // -----------------------------------------------------------------
  // TAB 3: RENDER LEVELING LADDER & COMPARISON
  // -----------------------------------------------------------------
  function renderLevelingLadder() {
    const compA = compareInputA ? compareInputA.value.trim() || currentCompany : currentCompany;
    const compB = compareInputB ? compareInputB.value.trim() || 'TCS' : 'TCS';

    if (levelingTitle) {
      levelingTitle.textContent = `Career Progression & Title Equivalency: ${compA} vs ${compB} (${currentTrack})`;
    }

    const comparison = Core.getLevelingComparison(compA, compB, currentTrack, currentCurrency, storageCache);

    if (sideBySideLevelingGrid) {
      sideBySideLevelingGrid.innerHTML = '';

      comparison.levels.forEach(row => {
        const lvlA = row.lvlA || { level: "N/A", median: "—", medianRaw: 0 };
        const lvlB = row.lvlB || { level: "N/A", median: "—", medianRaw: 0 };

        const deltaRaw = Math.round(((lvlA.medianRaw || 0) - (lvlB.medianRaw || 0)) * 10) / 10;
        const deltaFormatted = deltaRaw > 0 ? `+${Core.formatCurrencyValue(deltaRaw, currentCurrency)}` : deltaRaw < 0 ? `-${Core.formatCurrencyValue(Math.abs(deltaRaw), currentCurrency)}` : 'Parity';
        const deltaColor = deltaRaw > 0 ? 'var(--accent-emerald)' : deltaRaw < 0 ? 'var(--accent-red)' : 'var(--text-tertiary)';

        const card = document.createElement('div');
        card.className = 'leveling-row-card';
        card.innerHTML = `
          <div>
            <span class="level-band-title">${escapeHtml(row.band)}</span>
            <div style="font-size:11px;color:${deltaColor};font-weight:750;margin-top:3px;">
              Pay Delta: ${deltaFormatted}
            </div>
          </div>

          <div class="level-box">
            <span class="stat-label">${escapeHtml(comparison.companyA.name).toUpperCase()}</span>
            <div class="level-box-title">${escapeHtml(lvlA.level)}</div>
            <div class="level-box-ctc">Median: ${lvlA.median}</div>
          </div>

          <div class="level-vs-badge">VS</div>

          <div class="level-box">
            <span class="stat-label">${escapeHtml(comparison.companyB.name).toUpperCase()}</span>
            <div class="level-box-title">${escapeHtml(lvlB.level)}</div>
            <div class="level-box-ctc">Median: ${lvlB.median}</div>
          </div>
        `;

        sideBySideLevelingGrid.appendChild(card);
      });
    }

    // Render Universal Matrix
    if (universalMatrixBody) {
      universalMatrixBody.innerHTML = '';
      Core.LEVELING_MATRIX.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${escapeHtml(m.levelBand)}</strong></td>
          <td><span class="meta-tag">${escapeHtml(m.yoe)}</span></td>
          <td><span style="font-weight:650;color:var(--text-primary);">${escapeHtml(m.itServices)}</span></td>
          <td><span style="font-weight:650;color:var(--primary);">${escapeHtml(m.indiaTech)}</span></td>
          <td><span style="font-weight:650;color:var(--accent-purple);">${escapeHtml(m.bigTech)}</span></td>
          <td><strong style="color:var(--accent-emerald);">${escapeHtml(m.inrRange)}</strong></td>
          <td style="font-size:11.5px;color:var(--text-secondary);max-width:280px;">${escapeHtml(m.responsibilities)}</td>
        `;
        universalMatrixBody.appendChild(tr);
      });
    }
  }

  // -----------------------------------------------------------------
  // TAB 4: RENDER PIPELINE MATCHING
  // -----------------------------------------------------------------
  function renderPipelineTab() {
    if (!currentCompany) {
      if (liveStatusText) liveStatusText.textContent = 'No employer selected';
      if (liveDetailText) liveDetailText.textContent = 'Search or select an employer above to check for matching pipeline applications.';
      if (matchedJobsContainer) {
        matchedJobsContainer.innerHTML = `<div style="font-size:12px;color:var(--text-secondary);padding:14px 0;">Select or search for an employer above to inspect matching applications from your local Applyra workspace.</div>`;
      }
      return;
    }

    const match = Core.matchUserApplyraData(currentCompany, storageCache);
    const totalMatched = (match.trackedApps.length + match.savedJobs.length);

    if (totalMatched > 0) {
      if (liveStatusText) {
        liveStatusText.textContent = `Active pipeline: ${match.trackedApps.length} tracked application(s) · ${match.savedJobs.length} extracted job(s)`;
      }
      if (liveDetailText) {
        const interviewCount = match.interviewHistory.length;
        liveDetailText.textContent = interviewCount > 0 
          ? `🎯 You have ${interviewCount} interview milestone recorded with ${currentCompany}!` 
          : `You have saved or applied to positions at ${currentCompany}. Review below.`;
      }

      if (matchedJobsContainer) {
        matchedJobsContainer.innerHTML = '';
        const allItems = [...match.trackedApps, ...match.savedJobs].slice(0, 10);
        allItems.forEach(item => {
          const title = item.title || item.position?.title || currentTrack;
          const loc = item.location || 'Location not listed';
          const status = item.status || 'saved';
          const url = item.url || '#';

          const card = document.createElement('div');
          card.className = 'job-card';
          card.innerHTML = `
            <div>
              <strong style="color:var(--text-primary);font-size:13px;">${escapeHtml(title)}</strong>
              <div style="font-size:11px;color:var(--text-secondary);margin-top:3px;">
                ${escapeHtml(loc)} · Status: <span style="color:var(--primary);font-weight:750;">${status.toUpperCase()}</span>
              </div>
            </div>
            <button class="hdr-btn" style="padding:5px 11px;font-size:11px;" data-sim-role="${escapeHtml(title)}">🧮 Simulate Offer</button>
          `;
          card.querySelector('[data-sim-role]')?.addEventListener('click', () => {
            switchTab('calculator');
          });
          matchedJobsContainer.appendChild(card);
        });
      }
    } else {
      if (liveStatusText) liveStatusText.textContent = `No saved applications for ${currentCompany} yet`;
      if (liveDetailText) liveDetailText.textContent = `Browse open roles in Tab 1 and click "+ Track in Applyra Pipeline" to save them here.`;
      if (matchedJobsContainer) {
        matchedJobsContainer.innerHTML = `<div style="font-size:12px;color:var(--text-secondary);padding:14px 0;">No active applications or extracted jobs found for ${escapeHtml(currentCompany)} in your local Applyra workspace yet.</div>`;
      }
    }
  }

  // -----------------------------------------------------------------
  // TAB 5: OFFER SIMULATOR
  // -----------------------------------------------------------------
  function updateCalculatorCurrencyDefaults() {
    const cur = Core.CURRENCY_REGISTRY[currentCurrency] || Core.CURRENCY_REGISTRY.INR;
    if (cur.code === 'INR') {
      if (calcBase) calcBase.value = 35;
      if (calcBonus) calcBonus.value = 5;
      if (calcEquity) calcEquity.value = 15;
    } else if (cur.code === 'USD' || cur.code === 'GLOBAL') {
      if (calcBase) calcBase.value = 140;
      if (calcBonus) calcBonus.value = 20;
      if (calcEquity) calcEquity.value = 45;
    } else if (cur.code === 'EUR') {
      if (calcBase) calcBase.value = 95;
      if (calcBonus) calcBonus.value = 15;
      if (calcEquity) calcEquity.value = 25;
    } else if (cur.code === 'GBP') {
      if (calcBase) calcBase.value = 85;
      if (calcBonus) calcBonus.value = 15;
      if (calcEquity) calcEquity.value = 20;
    } else if (cur.isMillion) { // JPY
      if (calcBase) calcBase.value = 11.0;
      if (calcBonus) calcBonus.value = 2.0;
      if (calcEquity) calcEquity.value = 3.5;
    } else {
      if (calcBase) calcBase.value = 120;
      if (calcBonus) calcBonus.value = 18;
      if (calcEquity) calcEquity.value = 30;
    }
    recalculateOffer();
  }

  function recalculateOffer() {
    const cur = Core.CURRENCY_REGISTRY[currentCurrency] || Core.CURRENCY_REGISTRY.INR;
    const base = parseFloat(calcBase?.value) || 0;
    const bonus = parseFloat(calcBonus?.value) || 0;
    const equity = parseFloat(calcEquity?.value) || 0;
    const total = base + bonus + equity;

    let formattedTotal = `${cur.symbol}${total.toFixed(1)} ${cur.unit}`;
    if (displayTotalTc) displayTotalTc.textContent = formattedTotal;

    if (total <= 0) {
      if (displayVerdictBadge) {
        displayVerdictBadge.textContent = 'Enter Figures';
        displayVerdictBadge.style.background = 'var(--text-tertiary)';
      }
      return;
    }

    let verdict = 'Competitive';
    let badgeBg = 'var(--accent-emerald)';

    const thresholdFactor = cur.code === 'INR' ? 1 : cur.factor;
    const tLow = 10 * thresholdFactor;
    const tMid = 25 * thresholdFactor;
    const tHigh = 50 * thresholdFactor;

    if (total < tLow) {
      verdict = 'Baseline Entry Tier';
      badgeBg = 'var(--accent-amber)';
    } else if (total < tMid) {
      verdict = 'Strong Mid-Market Offer';
      badgeBg = 'var(--primary)';
    } else if (total < tHigh) {
      verdict = 'Top Tier Unicorn / Product Scale';
      badgeBg = 'var(--accent-purple)';
    } else {
      verdict = 'Executive / Top 1% Compensation';
      badgeBg = 'var(--accent-emerald)';
    }

    if (displayVerdictBadge) {
      displayVerdictBadge.textContent = verdict;
      displayVerdictBadge.style.background = badgeBg;
    }

    const counterTarget = (total * 1.15).toFixed(1);
    const basePct = Math.round((base / total) * 100);
    const bonusPct = Math.round((bonus / total) * 100);
    const equityPct = Math.round((equity / total) * 100);

    if (displayCounterTip) {
      displayCounterTip.innerHTML = `
        Target Counter-Offer: <strong>${cur.symbol}${counterTarget} ${cur.unit} (+15%)</strong>. 
        Package Breakdown: <strong>${basePct}%</strong> Base · <strong>${bonusPct}%</strong> Variable · <strong>${equityPct}%</strong> Equity.
      `;
    }
  }

  // Master update across all active tabs
  function updateAllViews() {
    renderLiveOpportunities();
    renderCompensationBenchmark();
    renderLevelingLadder();
    renderPipelineTab();
  }

  // Programmatic tab switcher
  function switchTab(targetTab) {
    const btn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
    if (btn) {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`panel-${targetTab}`)?.classList.add('active');

      if (targetTab === 'leveling') {
        renderLevelingLadder();
      } else if (targetTab === 'pipeline') {
        renderPipelineTab();
      } else if (targetTab === 'charts') {
        renderCompensationBenchmark();
      } else if (targetTab === 'livejobs') {
        renderLiveOpportunities();
      }
    }
  }

  // Setup tab switches
  function setupTabs() {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });
  }

  function updatePipelineCountBadge() {
    if (workspaceJobsCountBadge) {
      const count = Array.isArray(storageCache.jobs) ? storageCache.jobs.length : 0;
      workspaceJobsCountBadge.textContent = `● ${count} JOBS EXTRACTED`;
    }
  }

  // Setup Pipeline Settings Modal
  function setupPipelineModal() {
    togglePipelineSettingsBtn?.addEventListener('click', () => {
      updatePipelineCountBadge();
      const cfg = storageCache.pipelineConfig || {};
      if (adzunaAppIdInput) adzunaAppIdInput.value = cfg.adzunaAppId || '';
      if (adzunaApiKeyInput) adzunaApiKeyInput.value = cfg.adzunaApiKey || '';
      if (supabaseUrlInput) supabaseUrlInput.value = cfg.supabaseUrl || '';
      if (pipelineSettingsModal) pipelineSettingsModal.style.display = 'flex';
    });

    closePipelineModalBtn?.addEventListener('click', () => {
      if (pipelineSettingsModal) pipelineSettingsModal.style.display = 'none';
    });

    savePipelineConfigBtn?.addEventListener('click', () => {
      const cfg = {
        adzunaAppId: adzunaAppIdInput?.value.trim() || '',
        adzunaApiKey: adzunaApiKeyInput?.value.trim() || '',
        supabaseUrl: supabaseUrlInput?.value.trim() || ''
      };
      storageCache.pipelineConfig = cfg;

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ pipelineConfig: cfg }, () => {
          if (pipelineSettingsModal) pipelineSettingsModal.style.display = 'none';
          if (window.ApplyraToast) {
            window.ApplyraToast.show('Data Pipeline configuration updated! Testing live endpoints...');
          }
          updateAllViews();
        });
      } else {
        if (pipelineSettingsModal) pipelineSettingsModal.style.display = 'none';
        updateAllViews();
      }
    });
  }

  // Load storage from chrome.storage.local
  function loadStorageData() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['jobs', 'careerSuite', 'history', 'pipelineConfig'], (data) => {
          storageCache = data || {};
          renderChipsForCategory(activeCategory);
          renderPipelineTab();
          renderLiveOpportunities();
          updatePipelineCountBadge();
        });
      }
    } catch (e) {
      console.warn('Storage read skipped in non-extension environment', e);
    }
  }

  // Filter Listeners for Tab 1
  function setupTab1Filters() {
    roleSearchInput?.addEventListener('input', () => {
      roleSearchTerm = roleSearchInput.value.trim();
      renderLiveOpportunities();
    });

    if (roleExpFilters) {
      const expBtns = roleExpFilters.querySelectorAll('.role-exp-btn');
      expBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          expBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeExpFilter = btn.getAttribute('data-exp') || 'all';
          renderLiveOpportunities();
        });
      });
    }
  }

  // Initialize
  function init() {
    // Read and apply URL search parameters
    const urlParams = new URLSearchParams(window.location.search);
    const pComp = urlParams.get('company');
    const pTrack = urlParams.get('track') || urlParams.get('role');
    const pCur = urlParams.get('currency');
    const pTab = urlParams.get('tab');

    if (pComp && pComp.trim()) {
      currentCompany = pComp.trim();
    } else {
      currentCompany = '';
    }
    if (pTrack && pTrack.trim()) {
      currentTrack = pTrack.trim();
    }
    if (pCur && pCur.trim() && Core.CURRENCY_REGISTRY?.[pCur.trim().toUpperCase()]) {
      currentCurrency = pCur.trim().toUpperCase();
    }

    if (currentCompany && Core.COMPANY_CATEGORIES) {
      for (const [catKey, catList] of Object.entries(Core.COMPANY_CATEGORIES)) {
        if (catList.some(item => {
          const name = typeof item === 'string' ? item : item.name;
          const nLower = name.toLowerCase();
          const cLower = currentCompany.toLowerCase();
          return nLower === cLower || cLower.includes(nLower) || nLower.includes(cLower);
        })) {
          activeCategory = catKey;
          break;
        }
      }
    }

    if (companyInput) companyInput.value = currentCompany;
    if (compareInputA) compareInputA.value = currentCompany;
    if (trackInput) trackInput.value = currentTrack;
    if (currencySelect) currencySelect.value = currentCurrency;

    populateCompaniesDatalist();
    setupCategorySelector();
    renderChipsForCategory(activeCategory);
    setupTabs();
    setupTab1Filters();
    setupPipelineModal();
    loadStorageData();

    updateAllViews();
    recalculateOffer();

    if (pTab) {
      switchTab(pTab);
    }

    // Company Input listener
    companyInput?.addEventListener('input', () => {
      currentCompany = companyInput.value.trim();
      if (compareInputA) compareInputA.value = currentCompany;
      document.querySelectorAll('.chip').forEach(c => {
        c.classList.toggle('active', Boolean(currentCompany && c.textContent.toLowerCase() === currentCompany.toLowerCase()));
      });
      updateAllViews();
    });

    companyInput?.addEventListener('change', () => {
      currentCompany = companyInput.value.trim();
      if (compareInputA) compareInputA.value = currentCompany;
      document.querySelectorAll('.chip').forEach(c => {
        c.classList.toggle('active', Boolean(currentCompany && c.textContent.toLowerCase() === currentCompany.toLowerCase()));
      });
      try {
        const u = new URL(window.location.href);
        if (currentCompany) {
          u.searchParams.set('company', currentCompany);
        } else {
          u.searchParams.delete('company');
        }
        window.history.replaceState(null, '', u.toString());
      } catch {}
      updateAllViews();
    });

    companyInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        currentCompany = companyInput.value.trim();
        if (compareInputA) compareInputA.value = currentCompany;
        try {
          const u = new URL(window.location.href);
          if (currentCompany) {
            u.searchParams.set('company', currentCompany);
          } else {
            u.searchParams.delete('company');
          }
          window.history.replaceState(null, '', u.toString());
        } catch {}
        updateAllViews();
      }
    });

    // Market Region & Currency Select listener
    currencySelect?.addEventListener('change', () => {
      currentCurrency = currencySelect.value || 'INR';
      updateCalculatorCurrencyDefaults();
      updateAllViews();
    });

    // Track / Role Input (User's Free Choice) listener with debounce
    trackInput?.addEventListener('input', () => {
      clearTimeout(trackDebounceTimer);
      trackDebounceTimer = setTimeout(() => {
        currentTrack = trackInput.value.trim() || 'Software Engineer';
        updateAllViews();
      }, 350);
    });

    trackInput?.addEventListener('change', () => {
      currentTrack = trackInput.value.trim() || 'Software Engineer';
      updateAllViews();
    });

    // Leveling Compare Button
    updateCompareBtn?.addEventListener('click', renderLevelingLadder);

    // Calculator inputs
    calcBase?.addEventListener('input', recalculateOffer);
    calcBonus?.addEventListener('input', recalculateOffer);
    calcEquity?.addEventListener('input', recalculateOffer);

    // Back navigation
    document.getElementById('intelBackBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else if (document.referrer && document.referrer.startsWith(chrome.runtime.getURL(''))) {
        window.location.href = document.referrer;
      } else {
        try { window.close(); } catch {}
        setTimeout(() => { window.location.href = 'index.html'; }, 100);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
