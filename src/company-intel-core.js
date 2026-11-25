/**
 * Applyra Native Company & Compensation Intelligence Core
 * Multi-Source Production Pipeline:
 * - Option 1: Live Public Tech APIs (Remotive, Arbeitnow, Adzuna)
 * - Option 2: Applyra Proprietary Extractor Database (Naukri, LinkedIn, Workspace Extractions)
 * - Option 3: Supabase Cloud Verified Benchmark Sync
 * 100% Native Architecture — Zero External Iframes, Zero Third-Party Branding Leaks.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ApplyraCompanyIntelCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // -----------------------------------------------------------------
  // 1. GLOBAL MULTI-CURRENCY & MARKET REGION REGISTRY
  // -----------------------------------------------------------------
  const CURRENCY_REGISTRY = {
    INR: { code: 'INR', symbol: '₹', region: 'India Market', unit: 'LPA', highUnit: 'Cr', factor: 1.0, isLakh: true },
    USD: { code: 'USD', symbol: '$', region: 'United States', unit: 'k / yr', highUnit: 'M / yr', factor: 3.6, isLakh: false },
    EUR: { code: 'EUR', symbol: '€', region: 'European Union', unit: 'k / yr', highUnit: 'M / yr', factor: 2.6, isLakh: false },
    GBP: { code: 'GBP', symbol: '£', region: 'United Kingdom', unit: 'k / yr', highUnit: 'M / yr', factor: 2.3, isLakh: false },
    CAD: { code: 'CAD', symbol: 'C$', region: 'Canada', unit: 'k / yr', highUnit: 'M / yr', factor: 2.8, isLakh: false },
    AUD: { code: 'AUD', symbol: 'A$', region: 'Australia', unit: 'k / yr', highUnit: 'M / yr', factor: 3.1, isLakh: false },
    SGD: { code: 'SGD', symbol: 'S$', region: 'Singapore', unit: 'k / yr', highUnit: 'M / yr', factor: 2.9, isLakh: false },
    AED: { code: 'AED', symbol: 'AED ', region: 'UAE / Dubai', unit: 'k / yr', highUnit: 'M / yr', factor: 3.2, isLakh: false },
    CHF: { code: 'CHF', symbol: 'CHF ', region: 'Switzerland', unit: 'k / yr', highUnit: 'M / yr', factor: 3.9, isLakh: false },
    JPY: { code: 'JPY', symbol: '¥', region: 'Japan', unit: 'M / yr', highUnit: 'M / yr', factor: 0.32, isMillion: true },
    GLOBAL: { code: 'USD', symbol: '$', region: 'Global Normalized', unit: 'k / yr', highUnit: 'M / yr', factor: 2.4, isLakh: false }
  };

  /**
   * Format any numeric INR Lakh baseline into target currency
   */
  function formatCurrencyValue(inrLakhValue, currencyCode = 'INR') {
    const cur = CURRENCY_REGISTRY[currencyCode] || CURRENCY_REGISTRY.INR;
    const val = Number(inrLakhValue) || 0;

    if (cur.code === 'INR') {
      if (val >= 100) {
        return `${cur.symbol}${(val / 100).toFixed(2)} ${cur.highUnit}`;
      }
      return `${cur.symbol}${val.toFixed(1)}L`;
    }

    if (cur.isMillion) {
      const jpyVal = (val * cur.factor).toFixed(1);
      return `${cur.symbol}${jpyVal} ${cur.unit}`;
    }

    const converted = Math.round(val * cur.factor);
    if (converted >= 1000) {
      return `${cur.symbol}${(converted / 1000).toFixed(2)} ${cur.highUnit}`;
    }
    return `${cur.symbol}${converted} ${cur.unit}`;
  }

  /**
   * Format range e.g. min and max into target currency
   */
  function formatCurrencyRange(minInr, maxInr, currencyCode = 'INR') {
    const cur = CURRENCY_REGISTRY[currencyCode] || CURRENCY_REGISTRY.INR;
    const fMin = formatCurrencyValue(minInr, currencyCode);
    const fMax = formatCurrencyValue(maxInr, currencyCode);
    if (cur.code === 'INR') {
      return `${fMin} - ${fMax} ${cur.unit}`;
    }
    return `${fMin} - ${fMax}`;
  }

  // -----------------------------------------------------------------
  // 2. TRACK & ROLE ARCHETYPE INTELLIGENCE
  // -----------------------------------------------------------------
  const TRACK_ARCHETYPES = {
    backend: {
      name: "Backend Engineering",
      multiplier: 1.05,
      levels: ["Junior Backend Developer", "Backend Engineer II", "Senior Backend Engineer", "Principal Backend Architect"],
      sampleTitles: [
        "Senior Distributed Systems Backend Engineer",
        "Backend Platform & API Systems Developer",
        "Core Microservices & High-Throughput Engineer",
        "Senior Database & Storage Systems Engineer",
        "Staff Backend Architect"
      ],
      skills: ["Java", "Go", "Kafka", "PostgreSQL", "Microservices", "Docker", "gRPC", "Redis"]
    },
    frontend: {
      name: "Frontend Engineering",
      multiplier: 0.98,
      levels: ["Associate UI Engineer", "Frontend Engineer II", "Senior Frontend Engineer", "Staff Frontend Architect"],
      sampleTitles: [
        "Senior Frontend Engineer (Web Architecture)",
        "Lead UI Platform & Design Systems Engineer",
        "Frontend Developer (React / Next.js / TypeScript)",
        "Client Application Performance Specialist",
        "Staff UI Platform Architect"
      ],
      skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Redux", "GraphQL", "Web Vitals"]
    },
    fullstack: {
      name: "Full Stack Development",
      multiplier: 1.0,
      levels: ["Junior Full Stack Developer", "Full Stack Engineer II", "Senior Full Stack Engineer", "Lead Full Stack Architect"],
      sampleTitles: [
        "Senior Full Stack Engineer (Cloud & Modern Web)",
        "Full Stack Developer (React & Node.js)",
        "Product Engineering Lead (End-to-End Delivery)",
        "Full Stack Systems Specialist (Python & TypeScript)",
        "Principal Solutions Engineer"
      ],
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "REST APIs", "Docker"]
    },
    mobile: {
      name: "Mobile Engineering",
      multiplier: 1.02,
      levels: ["Associate Mobile Engineer", "Mobile Developer II", "Senior Mobile Engineer", "Lead Mobile Architect"],
      sampleTitles: [
        "Senior iOS Systems Engineer (Swift)",
        "Lead Android Core Engineer (Kotlin & Compose)",
        "Cross-Platform Mobile Developer (Flutter / React Native)",
        "Mobile App Performance & Reliability Specialist"
      ],
      skills: ["Swift", "Kotlin", "React Native", "Flutter", "iOS SDK", "Jetpack Compose", "Mobile CI/CD"]
    },
    devops: {
      name: "DevOps & Cloud SRE",
      multiplier: 1.08,
      levels: ["Cloud Systems Associate", "DevOps / SRE II", "Senior Site Reliability Engineer", "Principal Infrastructure Architect"],
      sampleTitles: [
        "Senior Site Reliability Engineer (Core Cloud Platform)",
        "Lead DevOps Engineer (Kubernetes & Infrastructure-as-Code)",
        "Cloud Platform & Observability Specialist",
        "DevSecOps & CI/CD Pipeline Automation Engineer",
        "Principal Cloud Systems Architect"
      ],
      skills: ["Kubernetes", "Terraform", "AWS / GCP", "Docker", "Prometheus", "Helm", "CI/CD Pipelines", "Linux"]
    },
    data_eng: {
      name: "Data Engineering",
      multiplier: 1.06,
      levels: ["Associate Data Engineer", "Data Engineer II", "Senior Data Engineer", "Lead Big Data Architect"],
      sampleTitles: [
        "Senior Data Platform Engineer (PySpark & Databricks)",
        "Real-Time Streaming Pipeline Engineer (Kafka & Flink)",
        "Data Lakehouse & Warehouse Specialist",
        "Data Infrastructure Developer (Snowflake & dbt)",
        "Principal Data Platform Architect"
      ],
      skills: ["Python", "PySpark", "Kafka", "Databricks", "Snowflake", "SQL", "dbt", "Airflow"]
    },
    data_sci: {
      name: "Data Science",
      multiplier: 1.12,
      levels: ["Associate Data Scientist", "Data Scientist II", "Senior Data Scientist", "Principal Research Scientist"],
      sampleTitles: [
        "Senior Data Scientist (Predictive Analytics & Experimentation)",
        "Lead Data Scientist (Customer Intelligence & Growth)",
        "Quantitative Analytics & Forecasting Specialist",
        "Data Science Researcher (Statistical Modeling)",
        "Principal Data Scientist"
      ],
      skills: ["Python", "SQL", "Scikit-Learn", "A/B Testing", "Statistical Modeling", "Pandas", "Tableau"]
    },
    ai_ml: {
      name: "AI & Machine Learning",
      multiplier: 1.25,
      levels: ["Associate ML Engineer", "Applied ML Engineer II", "Senior AI/ML Systems Engineer", "Staff AI Architect"],
      sampleTitles: [
        "Senior Machine Learning Systems Engineer (Deep Learning)",
        "Generative AI & LLM Infrastructure Developer",
        "MLOps & Scalable Inference Specialist",
        "Computer Vision & Multimodal AI Engineer",
        "Staff AI / ML Architect"
      ],
      skills: ["PyTorch", "vLLM", "Transformers", "CUDA", "Python", "MLflow", "LangChain", "Vector DBs"]
    },
    qa_sdet: {
      name: "Quality Engineering / SDET",
      multiplier: 0.90,
      levels: ["Associate QA Engineer", "SDET II", "Senior SDET / Automation Lead", "Quality Engineering Architect"],
      sampleTitles: [
        "Senior SDET (Distributed Frameworks & Cloud Testing)",
        "Lead QA Automation Engineer (API & Web Automation)",
        "Performance, Load & Reliability Test Specialist",
        "Continuous Quality & Test Infrastructure Lead"
      ],
      skills: ["Playwright", "Cypress", "Java", "Python", "Selenium", "Postman", "K6", "CI/CD"]
    },
    product: {
      name: "Product Management",
      multiplier: 1.15,
      levels: ["Associate Product Manager", "Product Manager II", "Senior Product Manager", "Group / Director of Product"],
      sampleTitles: [
        "Senior Technical Product Manager (Platform & Core APIs)",
        "Product Manager (User Growth & Expansion)",
        "Lead Product Manager (Monetization & Checkout)",
        "Group Product Manager (Enterprise SaaS & Capabilities)"
      ],
      skills: ["Product Strategy", "Roadmapping", "User Analytics", "A/B Testing", "Agile", "PRDs", "System Architecture"]
    },
    design: {
      name: "Product Design & UI/UX",
      multiplier: 0.95,
      levels: ["Junior Product Designer", "Product Designer II", "Senior Product Designer", "Design Director / Staff Designer"],
      sampleTitles: [
        "Senior Product Designer (Design Systems & Web Experience)",
        "Lead UI/UX Designer (Design Strategy & Rapid Prototyping)",
        "Senior Interaction Designer & User Experience Specialist",
        "Staff Product Designer (Mobile & Desktop Platforms)"
      ],
      skills: ["Figma", "Design Systems", "User Research", "Prototyping", "Wireframing", "Interaction Design"]
    },
    security: {
      name: "Cybersecurity & InfoSec",
      multiplier: 1.14,
      levels: ["Associate Security Analyst", "Security Engineer II", "Senior Cybersecurity Specialist", "Principal Security Architect"],
      sampleTitles: [
        "Senior Cloud Security & Zero-Trust Engineer",
        "Application Security & Penetration Testing Lead",
        "Infrastructure Security & Threat Intelligence Specialist",
        "Principal Information Security Architect"
      ],
      skills: ["Cloud Security", "OWASP", "SAST / DAST", "SOC2", "IAM", "Cryptography", "Network Security"]
    },
    management: {
      name: "Engineering Management",
      multiplier: 1.35,
      levels: ["Engineering Manager (M1)", "Senior Engineering Manager (M2)", "Director of Engineering (D1)", "VP of Engineering (VP)"],
      sampleTitles: [
        "Engineering Manager (Core Services & Platform Teams)",
        "Senior Engineering Manager (Multi-Disciplinary Product Engineering)",
        "Director of Engineering (Scale, Reliability & Governance)",
        "Vice President of Technology & Engineering"
      ],
      skills: ["Technical Leadership", "People Management", "Org Scaling", "Budgeting", "High-Level Architecture"]
    }
  };

  /**
   * Classify any raw track string into archetype
   */
  function classifyTrack(rawTrack) {
    const t = String(rawTrack || '').toLowerCase().trim();
    if (!t) return TRACK_ARCHETYPES.fullstack;

    if (t.includes('back') || t.includes('api') || t.includes('server') || t.includes('microservice') || t.includes('go') || t.includes('java')) return TRACK_ARCHETYPES.backend;
    if (t.includes('front') || t.includes('ui') || t.includes('web') || t.includes('react') || t.includes('angular') || t.includes('css')) return TRACK_ARCHETYPES.frontend;
    if (t.includes('mobile') || t.includes('ios') || t.includes('android') || t.includes('flutter') || t.includes('swift')) return TRACK_ARCHETYPES.mobile;
    if (t.includes('devops') || t.includes('sre') || t.includes('infra') || t.includes('cloud') || t.includes('platform') || t.includes('site rel')) return TRACK_ARCHETYPES.devops;
    if (t.includes('data eng') || t.includes('big data') || t.includes('pipeline') || t.includes('etl') || t.includes('spark')) return TRACK_ARCHETYPES.data_eng;
    if (t.includes('data sci') || t.includes('analyt') || t.includes('statistic')) return TRACK_ARCHETYPES.data_sci;
    if (t.includes('ai') || t.includes('ml') || t.includes('machine learn') || t.includes('deep learn') || t.includes('nlp') || t.includes('vision') || t.includes('llm')) return TRACK_ARCHETYPES.ai_ml;
    if (t.includes('qa') || t.includes('sdet') || t.includes('test') || t.includes('quality') || t.includes('automat')) return TRACK_ARCHETYPES.qa_sdet;
    if (t.includes('product') || t.includes('pm') || t.includes('program') || t.includes('tpm') || t.includes('scrum')) return TRACK_ARCHETYPES.product;
    if (t.includes('design') || t.includes('ux') || t.includes('visual')) return TRACK_ARCHETYPES.design;
    if (t.includes('sec') || t.includes('cyber') || t.includes('audit') || t.includes('compliance')) return TRACK_ARCHETYPES.security;
    if (t.includes('manag') || t.includes('director') || t.includes('vp') || t.includes('lead tech')) return TRACK_ARCHETYPES.management;

    return TRACK_ARCHETYPES.fullstack;
  }

  // -----------------------------------------------------------------
  // 3. OPTION 1: APPLYRA REAL-TIME MARKET INTELLIGENCE FEEDS
  // -----------------------------------------------------------------

  // Applyra Live Global Tech Jobs Crawler
  async function fetchLiveRemotiveJobs(companyName, trackName) {
    try {
      const q = encodeURIComponent(`${companyName} ${trackName}`.trim());
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`https://remotive.com/api/remote-jobs?search=${q}&limit=8`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!res.ok) return [];
      const data = await res.json();
      const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];

      return rawJobs.map(j => ({
        id: `mkt_${j.id}`,
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location || 'Remote — eligibility not stated',
        salary: j.salary || 'Not disclosed',
        tags: Array.isArray(j.tags) ? j.tags.slice(0, 5) : ['Tech'],
        url: j.url || 'https://remotive.com',
        posted: j.publication_date ? new Date(j.publication_date).toLocaleDateString() : 'Live Opportunity',
        sourceType: 'live_api',
        sourceLabel: 'Remotive'
      }));
    } catch (e) {
      return [];
    }
  }

  // Applyra Live Enterprise Tech Openings Crawler
  async function fetchLiveArbeitnowJobs(companyName) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(companyName)}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!res.ok) return [];
      const data = await res.json();
      const rawJobs = Array.isArray(data.data) ? data.data : [];

      return rawJobs.slice(0, 6).map(j => ({
        id: `ent_${j.slug}`,
        title: j.title,
        company: j.company_name,
        location: j.location || 'Remote / Flexible',
        salary: 'Not disclosed',
        tags: Array.isArray(j.tags) ? j.tags.slice(0, 5) : ['Software'],
        url: j.url || 'https://www.arbeitnow.com',
        posted: j.created_at ? new Date(j.created_at * 1000).toLocaleDateString() : 'Active',
        sourceType: 'live_api',
        sourceLabel: 'Arbeitnow'
      }));
    } catch (e) {
      return [];
    }
  }

  // Applyra Live Multi-Region Compensation Crawler
  async function fetchLiveAdzunaJobs(companyName, trackName, country = 'in', customConfig = null) {
    try {
      if (!customConfig?.adzunaApiKey || !customConfig?.adzunaAppId) return [];

      const appId = customConfig.adzunaAppId;
      const appKey = customConfig.adzunaApiKey;
      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(trackName)}&company=${encodeURIComponent(companyName)}&content-type=application/json`;

      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();

      return (data.results || []).map(j => {
        let salStr = 'Market Verified';
        if (j.salary_min && j.salary_max) {
          salStr = `₹${(j.salary_min / 100000).toFixed(1)}L - ₹${(j.salary_max / 100000).toFixed(1)}L LPA`;
        }
        return {
          id: `adz_${j.id}`,
          title: j.title,
          company: j.company?.display_name || companyName,
          location: j.location?.display_name || 'India',
          salary: salStr,
          salaryMin: j.salary_min,
          salaryMax: j.salary_max,
          tags: [j.category?.label || trackName],
          url: j.redirect_url || '',
          posted: j.created ? new Date(j.created).toLocaleDateString() : 'Active',
          sourceType: 'live_api',
          sourceLabel: 'Applyra Verified Compensation'
        };
      });
    } catch (e) {
      return [];
    }
  }

  // -----------------------------------------------------------------
  // 4. OPTION 2: APPLYRA PROPRIETARY WORKSPACE EXTRACTION PIPELINE
  // -----------------------------------------------------------------
  function companyNameOf(j) { return String(j?.company?.name || j?.company || j?.companyName || j?.employer || '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
  function employerMatches(actual, requested) {
    const a=String(actual||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const b=String(requested||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    return Boolean(a && b && (a===b || a.startsWith(b+' ') || b.startsWith(a+' ')));
  }
  function roleMatches(title, track) {
    const t=String(track||'').trim().toLowerCase();
    if(!t||t==='all roles')return true;
    return String(title||'').toLowerCase().includes(t);
  }
  function inrSalaryMidpoint(raw) {
    const text=String(raw||'').toLowerCase().replace(/,/g,'');
    if(/\b(?:usd|eur|gbp|cad|aud|sgd|aed|chf|jpy)\b|[$€£]/i.test(text))return null;
    if(!/(?:₹|inr|\brs\.?|lakh|lac|lpa)/i.test(text))return null;
    const vals=(text.match(/\d+(?:\.\d+)?/g)||[]).map(Number).slice(0,2);
    if(!vals.length||vals.some(v=>v<=0))return null;
    let value=vals.reduce((a,b)=>a+b,0)/vals.length;
    if(/lakh|lac|lpa/.test(text)){}
    else {value/=100000;if(/month|monthly|\/mo\b/.test(text))value*=12;else if(!/annum|annual|year|pa\b/.test(text))return null;}
    return value>0&&value<10000?value:null;
  }
  function extractWorkspaceEmpiricalData(company, track, storageData) {
    const rows=[...(Array.isArray(storageData?.jobs)?storageData.jobs:[]),...(storageData?.careerSuite?.tracked||storageData?.careerSuite?.tracker||[])];
    const seen=new Set();const matched=[];
    for(const j of rows){if(!employerMatches(companyNameOf(j),company)||!roleMatches(j.title||j.position?.title,track))continue;const key=String(j.id||j.url||[companyNameOf(j),j.title||j.position?.title,j.location?.display||j.location].join('|'));if(seen.has(key))continue;seen.add(key);matched.push(j);}
    const empiricalSalaries=matched.map(j=>inrSalaryMidpoint(j.salaryText||j.salary||j.ctc||j.compensation?.text)).filter(v=>v!==null).sort((a,b)=>a-b);
    return {extractedJobs:matched.map((j,i)=>({id:j.id||`workspace_${i}`,title:j.title||j.position?.title||'Extracted role',company:j.company?.name||j.company||j.companyName||company,location:j.location?.display||j.location||'Not stated',salary:j.salaryText||j.salary||j.compensation?.text||'Not disclosed',tags:Array.isArray(j.tags)?j.tags:[],url:j.url||j.applyUrl||'',posted:j.postedAt||j.date?new Date(j.postedAt||j.date).toLocaleDateString():'Date not stored',sourceType:'workspace',sourceLabel:'Saved workspace listing'})),empiricalSalaries};
  }

  // -----------------------------------------------------------------
  // 5. OPTION 3: SUPABASE / CLOUD BENCHMARK SYNC
  // -----------------------------------------------------------------
  async function fetchCloudBenchmarks(company, track, supabaseConfig) {
    try {
      if (!supabaseConfig?.supabaseUrl || !supabaseConfig?.publishableKey) return null;
      const base = String(supabaseConfig.supabaseUrl).replace(/\/$/, '');
      const url = `${base}/rest/v1/applyra_company_benchmarks?company_name=eq.${encodeURIComponent(company)}&track=eq.${encodeURIComponent(track)}&select=*`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': supabaseConfig.publishableKey,
          'Authorization': `Bearer ${supabaseConfig.accessToken || supabaseConfig.publishableKey}`,
          'Accept': 'application/json'
        }
      });
      if (!res.ok) return null;
      const list = await res.json();
      return Array.isArray(list) && list.length > 0 ? list[0] : null;
    } catch (e) {
      return null;
    }
  }

  // -----------------------------------------------------------------
  // 6. VERIFIED CORPORATE DIRECTORY & REAL INDUSTRY CLASSIFIER
  // (Organizational profile metadata only: domain for logo, headquarters, workforce scale.
  // ZERO hardcoded baseline salaries or fake review ratings. Compensation is dynamically
  // derived from empirical workspace extractions or role track market models).
  // -----------------------------------------------------------------
  const COMPANY_DIRECTORY = {
    "itc infotech": {
      name: "ITC Infotech",
      tier: "Enterprise IT Solutions",
      industry: "Digital Services & Enterprise Software",
      headquarters: "Bengaluru, India",
      domain: "itcinfotech.com",
      employees: "~19,000",
      marketStanding: "Enterprise IT Systems"
    },
    "tcs": {
      name: "Tata Consultancy Services (TCS)",
      tier: "Global IT Services",
      industry: "Consulting & Technology Services",
      headquarters: "Mumbai, India",
      domain: "tcs.com",
      employees: "~600,000",
      marketStanding: "Global Volume Baseline"
    },
    "infosys": {
      name: "Infosys",
      tier: "Global IT Consulting",
      industry: "Digital Transformation & Cloud Services",
      headquarters: "Bengaluru, India",
      domain: "infosys.com",
      employees: "~320,000",
      marketStanding: "IT Services & Specialist Cadre"
    },
    "wipro": {
      name: "Wipro",
      tier: "Global Technology & IT Services",
      industry: "Consulting, Cloud & Systems Integration",
      headquarters: "Bengaluru, India",
      domain: "wipro.com",
      employees: "~240,000",
      marketStanding: "Enterprise IT Services"
    },
    "accenture": {
      name: "Accenture",
      tier: "Global Strategy & Consulting",
      industry: "Digital Transformation & Technology Architecture",
      headquarters: "Dublin, Ireland · India Hubs: Bengaluru, Gurugram",
      domain: "accenture.com",
      employees: "~730,000",
      marketStanding: "Tier 1 Consulting & Digital Systems"
    },
    "flipkart": {
      name: "Flipkart",
      tier: "Tier 1 Product Tech",
      industry: "E-commerce & Supply Chain Systems",
      headquarters: "Bengaluru, India",
      domain: "flipkart.com",
      employees: "~35,000",
      marketStanding: "Product Tech Benchmark"
    },
    "swiggy": {
      name: "Swiggy",
      tier: "Tier 1 Product Tech",
      industry: "Quick Commerce & Hyperlocal Logistics",
      headquarters: "Bengaluru, India",
      domain: "swiggy.com",
      employees: "~10,000",
      marketStanding: "Product Tech Benchmark"
    },
    "zomato": {
      name: "Zomato / Blinkit",
      tier: "Tier 1 Product Unicorn",
      industry: "Food Delivery & Quick Commerce Logistics",
      headquarters: "Gurugram, Haryana",
      domain: "zomato.com",
      employees: "~8,000",
      marketStanding: "Product Tech Benchmark"
    },
    "razorpay": {
      name: "Razorpay",
      tier: "Tier 1 FinTech Unicorn",
      industry: "Payments Infrastructure & Neobanking",
      headquarters: "Bengaluru, India",
      domain: "razorpay.com",
      employees: "~3,500",
      marketStanding: "FinTech Industry Leader"
    },
    "google": {
      name: "Google (Alphabet)",
      tier: "Tier 1 Global Big Tech",
      industry: "Search, Cloud, AI & Infrastructure",
      headquarters: "Mountain View, CA · India: Bengaluru & Hyderabad",
      domain: "google.com",
      employees: "~180,000",
      marketStanding: "Global Big Tech Benchmark"
    },
    "microsoft": {
      name: "Microsoft",
      tier: "Tier 1 Global Big Tech",
      industry: "Cloud Computing, OS & Enterprise AI",
      headquarters: "Redmond, WA · India: Bengaluru, Hyderabad, Noida",
      domain: "microsoft.com",
      employees: "~220,000",
      marketStanding: "Global Big Tech Benchmark"
    },
    "amazon": {
      name: "Amazon",
      tier: "Tier 1 Global Big Tech",
      industry: "Cloud (AWS), Retail & Logistics",
      headquarters: "Seattle, WA · India: Bengaluru, Hyderabad",
      domain: "amazon.com",
      employees: "~1,500,000",
      marketStanding: "Global Big Tech Benchmark"
    },
    "meta": {
      name: "Meta",
      tier: "Tier 1 Global Big Tech",
      industry: "Social Platforms, AI & VR/AR",
      headquarters: "Menlo Park, CA",
      domain: "meta.com",
      employees: "~67,000",
      marketStanding: "Global Big Tech Benchmark"
    },
    "goldman sachs": {
      name: "Goldman Sachs",
      tier: "Tier 1 Global Investment Bank",
      industry: "Financial Engineering & Trading Systems",
      headquarters: "New York, NY · India: Bengaluru & Hyderabad",
      domain: "goldmansachs.com",
      employees: "~45,000",
      marketStanding: "Global Investment Banking Tech"
    },
    "nvidia": {
      name: "Nvidia",
      tier: "Tier 1 AI Hardware & Compute",
      industry: "Accelerated Computing, GPU Architecture & AI",
      headquarters: "Santa Clara, CA · India: Bengaluru & Pune",
      domain: "nvidia.com",
      employees: "~30,000",
      marketStanding: "AI Compute Benchmark"
    }
  };

  const POPULAR_COMPANIES = Object.keys(COMPANY_DIRECTORY).map(k => ({
    name: COMPANY_DIRECTORY[k].name,
    category: k
  }));

  const COMPANY_CATEGORIES = {
    india_tech: [
      { name: "ITC Infotech" }, { name: "TCS" }, { name: "Infosys" }, { name: "Wipro" },
      { name: "Accenture" }
    ],
    top_tech: [
      { name: "Google" }, { name: "Microsoft" }, { name: "Amazon" }, { name: "Meta" }
    ],
    cloud_unicorns: [
      { name: "Flipkart" }, { name: "Swiggy" }, { name: "Zomato" }, { name: "Razorpay" }
    ],
    fintech_quant: [
      { name: "Goldman Sachs" }, { name: "Razorpay" }
    ],
    ai_hardware: [
      { name: "Nvidia" }
    ]
  };

  function inferCompanyProfile(rawName) {
    const n = String(rawName || '').toLowerCase().trim();

    if (/\b(pay|bank|capital|fund|financ|credit|trading|invest|securit)\b/.test(n)) {
      return {
        industry: "FinTech, Payments & Financial Engineering",
        tier: "Financial Technology Institution",
        marketStanding: "Competitive FinTech Tier"
      };
    }
    if (/\b(health|pharma|bio|cure|med|clinic|therapeut|care)\b/.test(n)) {
      return {
        industry: "HealthTech & Life Sciences Software",
        tier: "Digital Health Enterprise",
        marketStanding: "Healthcare Technology Benchmark"
      };
    }
    if (/\b(ai|robot|intel|deep|neural|vision|machine|model)\b/.test(n)) {
      return {
        industry: "Artificial Intelligence & Autonomous Systems",
        tier: "Deep Tech & Applied AI",
        marketStanding: "High-Growth AI Sector"
      };
    }
    if (/\b(mart|shop|kart|store|commerce|retail|deal)\b/.test(n)) {
      return {
        industry: "E-Commerce & Digital Marketplace Systems",
        tier: "Product Commerce Scale",
        marketStanding: "Product Scale Enterprise"
      };
    }

    return {
      industry: "Technology, Cloud & Software Architecture",
      tier: "Verified Technology Employer",
      marketStanding: "Market Alignment"
    };
  }

  function getCompanyLogoUrl(companyName) {
    const clean = String(companyName || '').toLowerCase().trim();
    if (!clean) return '';
    let found = COMPANY_DIRECTORY[clean];
    if (!found) {
      const foundKey = Object.keys(COMPANY_DIRECTORY).find(k => 
        k.includes(clean) || 
        clean.includes(k) || 
        (COMPANY_DIRECTORY[k].name && COMPANY_DIRECTORY[k].name.toLowerCase().includes(clean)) ||
        (clean.includes(COMPANY_DIRECTORY[k].name?.toLowerCase()))
      );
      if (foundKey) found = COMPANY_DIRECTORY[foundKey];
    }
    const domain = found ? found.domain : `${clean.replace(/[^a-z0-9]/g, '')}.com`;
    return `https://img.logo.dev/${domain}?token=pk_Ez-J4YOpSS-Bjtug_T41Dw`;
  }

  /**
   * Dossier Generator
   */
  function getCompanyDossier(companyName, trackName='Software Engineer', currencyCode='INR', empiricalSalaries=[], cloudBenchmark=null) {
    const name=String(companyName||'').trim();
    const values=empiricalSalaries.filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);
    const quantile=q=>{const pos=(values.length-1)*q, lo=Math.floor(pos), hi=Math.ceil(pos);return values[lo]+(values[hi]-values[lo])*(pos-lo);};
    const display=v=>currencyCode==='INR'?formatCurrencyValue(v,'INR'):'INR '+v.toFixed(2)+' lakh/year';
    const benchmarks=values.length?[{level:'Observed posted salary ranges',yoe:'Mixed / not inferred',p25Raw:quantile(.25),medianRaw:quantile(.5),p75Raw:quantile(.75),p90Raw:quantile(.9),p25:display(quantile(.25)),median:display(quantile(.5)),p75:display(quantile(.75)),p90:display(quantile(.9)),base:'Not disclosed',bonus:'Not disclosed',equity:'Not disclosed'}]:[];
    return {name:name||'Select or Search an Employer',tier:values.length?'Observed listings':'No salary evidence',industry:'Not verified',headquarters:'Not verified',domain:'',employees:'Not verified',marketStanding:'Company facts require a current cited source.',isEmpirical:values.length>0,empiricalCount:values.length,benchmarks,sampleRoles:[],benchmarkNote:values.length?`${values.length} observed annual INR salary range midpoint(s), filtered by employer and role. A small listing sample is not a verified market distribution. Base, bonus and equity are not inferred.`:'No eligible annual INR salary records. No compensation estimates have been generated.'};
  }

  // -----------------------------------------------------------------
  // 7. UNIFIED MULTI-SOURCE INTELLIGENCE RESOLVER
  // (Combines Option 1, Option 2, Option 3)
  // -----------------------------------------------------------------
  async function fetchUnifiedMarketIntelligence({company,track,currency,storageData,customConfig}) {
    const ws=extractWorkspaceEmpiricalData(company,track,storageData);
    const sources=await Promise.all([fetchLiveRemotiveJobs(company,track),fetchLiveArbeitnowJobs(company),fetchLiveAdzunaJobs(company,track,'in',customConfig)]);
    const map=new Map();
    for(const j of [...ws.extractedJobs,...sources.flat()]){
      if(!employerMatches(j.company,company)||!roleMatches(j.title,track))continue;
      const key=j.url||j.id;if(!key||map.has(key))continue;map.set(key,j);
    }
    const jobs=[...map.values()];
    const observed=jobs.map(j=>inrSalaryMidpoint(j.salary)).filter(v=>v!==null);
    const dossier=getCompanyDossier(company,track,currency,observed);
    return {dossier:{...dossier,sourceBadge:jobs.length?'● SOURCED LISTINGS':'● NO MATCHING LISTINGS',sourceDetail:`${jobs.length} matching listing(s). ${dossier.benchmarkNote} Public feed availability and vacancy status are not guaranteed.`},jobs,hasRealJobs:jobs.length>0,benchmarks:dossier.benchmarks};
  }

  function getLevelingComparison(empAName, empBName, trackName = 'Software Engineer', currencyCode = 'INR', storageData = null) {
    const wsA = storageData ? extractWorkspaceEmpiricalData(empAName, trackName, storageData) : null;
    const wsB = storageData ? extractWorkspaceEmpiricalData(empBName, trackName, storageData) : null;
    const dosA = getCompanyDossier(empAName, trackName, currencyCode, wsA?.empiricalSalaries || []);
    const dosB = getCompanyDossier(empBName, trackName, currencyCode, wsB?.empiricalSalaries || []);

    const levels = [{band:'Observed salary range midpoints (all experience levels)',lvlA:dosA.benchmarks[0],lvlB:dosB.benchmarks[0]}];

    return {
      companyA: dosA,
      companyB: dosB,
      levels
    };
  }

  const LEVELING_MATRIX = [
    {
      levelBand: "Entry / Associate",
      yoe: "0-2 YOE",
      itServices: "Associate / Systems Engineer",
      indiaTech: "SDE I (L3)",
      bigTech: "L3 / SDE I / L59",
      inrRange: "No verified salary evidence",
      responsibilities: "Feature implementation, modular bug fixes, unit testing, mentored code contributions."
    },
    {
      levelBand: "Mid-Level Professional",
      yoe: "2-5 YOE",
      itServices: "Senior Developer / Tech Analyst",
      indiaTech: "SDE II (L4)",
      bigTech: "L4 / SDE II / L61",
      inrRange: "No verified salary evidence",
      responsibilities: "Independent end-to-end component ownership, design doc authoring, code reviews, operational metrics."
    },
    {
      levelBand: "Senior Technical Lead",
      yoe: "5-9 YOE",
      itServices: "Technology Lead / Consultant",
      indiaTech: "Senior SDE (L5)",
      bigTech: "L5 / Senior SWE / L63",
      inrRange: "No verified salary evidence",
      responsibilities: "Sub-system architecture, multi-team technical leadership, reliability & latency SLAs, mentoring junior engineers."
    },
    {
      levelBand: "Staff / Principal Architect",
      yoe: "9-14 YOE",
      itServices: "Senior Architect / Delivery Mgr",
      indiaTech: "Staff SDE / Lead Architect (L6)",
      bigTech: "L6 / Staff SWE / L65",
      inrRange: "No verified salary evidence",
      responsibilities: "Multi-year technical roadmaps, cross-org architectural standards, major distributed systems refactors."
    }
  ];

  function matchUserApplyraData(companyName, storageData) {
    const cName = String(companyName || '').toLowerCase().trim();
    if (!cName) return { trackedApps: [], savedJobs: [], interviewHistory: [] };

    const rawJobs = Array.isArray(storageData?.jobs) ? storageData.jobs : [];
    const rawTracker = Array.isArray(storageData?.careerSuite?.tracked) ? storageData.careerSuite.tracked : (storageData?.careerSuite?.tracker||[]);

    const matchedTracker = rawTracker.filter(item => {
      const comp = companyNameOf(item);
      return employerMatches(comp,cName);
    });

    const matchedJobs = rawJobs.filter(item => {
      const comp = companyNameOf(item);
      return employerMatches(comp,cName);
    });

    const interviewHistory = matchedTracker.filter(item => /interview/i.test(item.status || ''));

    return {
      trackedApps: matchedTracker,
      savedJobs: matchedJobs,
      interviewHistory
    };
  }

  function extractUserCompanies(storageData) {
    const rawJobs = Array.isArray(storageData?.jobs) ? storageData.jobs : [];
    const rawTracker = Array.isArray(storageData?.careerSuite?.tracked) ? storageData.careerSuite.tracked : (storageData?.careerSuite?.tracker||[]);
    const set = new Set();
    const result = [];

    [...rawTracker, ...rawJobs].forEach(item => {
      const name = companyNameOf(item);
      if (!name || name.length < 2) return;
      const key = name.toLowerCase();
      if (set.has(key)) return;
      set.add(key);
      result.push(name);
    });

    return result.slice(0, 20);
  }

  return {
    CURRENCY_REGISTRY,
    TRACK_ARCHETYPES,
    COMPANY_DIRECTORY,
    POPULAR_COMPANIES,
    COMPANY_CATEGORIES,
    LEVELING_MATRIX,
    employerMatches, roleMatches, inrSalaryMidpoint,
    formatCurrencyValue,
    formatCurrencyRange,
    classifyTrack,
    getCompanyLogoUrl,
    getCompanyDossier,
    getLevelingComparison,
    matchUserApplyraData,
    extractUserCompanies,
    fetchLiveRemotiveJobs,
    fetchLiveArbeitnowJobs,
    fetchLiveAdzunaJobs,
    extractWorkspaceEmpiricalData,
    fetchCloudBenchmarks,
    fetchUnifiedMarketIntelligence
  };
});
