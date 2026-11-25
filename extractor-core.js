(function attachNowCurryExtractor(root) {
  "use strict";

  const CARD_SELECTORS = [
    ".srp-jobtuple-wrapper",
    ".cust-job-tuple",
    "article.jobTuple",
    ".jobTuple",
    "[data-job-id]",
    "[class*='jobTuple']",
    "[class*='job-tuple']",
    "[class*='styles_job-listing']",
    "[class*='styles_jlc']",
    "[class*='job-card']",
    "[class*='jobCard']",
    "article[class*='job']",
    "[data-testid*='job-tuple']",
    "[class*='srp-container'] article"
  ];

  const TITLE_SELECTORS = [
    "a.title",
    "a[class*='title']",
    "a[href*='/job-listings-']",
    "a[href*='/job/']",
    "a[href*='job-overview']",
    "[class*='title'] a",
    "[data-testid*='job-title']",
    "h2 a",
    "h3 a"
  ];

  const FIELD_SELECTORS = {
    company: [
      ".comp-name",
      ".subTitle",
      "[class*='companyInfo'] [class*='title']",
      "[class*='company-name']",
      "[class*='companyName']",
      "[data-testid*='company']"
    ],
    location: [
      ".locWdth",
      "[class*='location']",
      "[class*='loc-wrap']",
      "[data-testid*='location']"
    ],
    experience: [
      ".expwdth",
      "[class*='experience']",
      "[class*='exp-wrap']",
      "[data-testid*='experience']"
    ],
    salary: [
      ".sal",
      "[class*='salary']",
      "[data-testid*='salary']"
    ],
    description: [
      ".job-desc",
      "[class*='job-description']",
      "[class*='jobDesc']",
      "[class*='description']"
    ],
    posted: [
      ".job-post-day",
      "[class*='postedDate']",
      "[class*='job-post']",
      "[class*='date']"
    ]
  };

  const SKILL_SELECTORS = [
    ".tag-li",
    "[class*='skill']",
    "[class*='tags'] li",
    "[class*='key-skill']",
    "[data-testid*='skill']"
  ];

  const NEXT_SELECTORS = [
    "a[rel='next']",
    "a[aria-label='Next']",
    "button[aria-label='Next']",
    "a[title='Next']",
    "button[title='Next']",
    "[class*='styles_pagination'] a.styles_btn-secondary__2As-H:last-of-type",
    "[class*='pagination'] a[class*='secondary']:last-of-type",
    "a.fright",
    "#lastCompMark a[href]:last-of-type"
  ];

  const HISTORY_CARD_SELECTORS = [
    "[data-job-id]",
    "[data-testid*='application']",
    "[data-testid*='job']",
    "[class*='appliedJob']",
    "[class*='applied-job']",
    "[class*='applicationCard']",
    "[class*='application-card']",
    "[class*='application']",
    "[class*='jobTuple']",
    "[class*='job-tuple']",
    "[class*='job-card']",
    "[class*='jobCard']",
    "[class*='tile']",
    "[role='listitem']",
    "article",
    "li"
  ];

  const HISTORY_TITLE_SELECTORS = [
    "a[href*='/job-listings-']",
    "a[href*='/job/']",
    "[class*='title'] a",
    "a[class*='title']",
    "[class*='title']",
    "[data-testid*='title']",
    "[class*='jobTitle']",
    "[class*='job-title']",
    "[class*='role']",
    "h2",
    "h3",
    "h4"
  ];

  // Naukri has changed profile class names more than once. These selectors
  // intentionally describe meaning, then the text heuristics below provide a
  // safe fallback. No credential, cookie, email, or phone selector is used.
  const PROFILE_SELECTORS = {
    headline: [
      "#lazyResumeHead [class*='resumeHeadline']",
      "#lazyResumeHead [class*='headline']",
      "#lazyResumeHead p",
      "[class*='profile-headline']",
      "[class*='profileHeadline']",
      "[class*='designation']",
      "[class*='headline']",
      "[data-testid*='headline']",
      "[data-testid*='designation']"
    ],
    location: [
      ".profilePage [class*='location']",
      "#lazyResumeHead [class*='location']",
      "[class*='profile-location']",
      "[class*='profileLocation']",
      "[class*='location']",
      "[class*='current-location']",
      "[data-testid*='location']"
    ],
    summary: [
      "#lazyProfileSummary [class*='summary']",
      "#lazyProfileSummary p",
      "[class*='profile-summary']",
      "[class*='profileSummary']",
      "[class*='about-me']",
      "[class*='aboutMe']",
      "[class*='summary']",
      "[data-testid*='summary']"
    ],
    skills: [
      "#lazyKeySkills li",
      "#lazyKeySkills [class*='chip']",
      "#lazyKeySkills [class*='tag']",
      "#lazyKeySkills a",
      "#lazyKeySkills span",
      "[class*='key-skill'] li",
      "[class*='keySkill'] li",
      "[class*='skill-section'] li",
      "[class*='skillSection'] li",
      "[class*='skills'] li",
      "[class*='skill'] span",
      "[class*='skill'] a",
      "[data-testid*='skill']"
    ],
    roles: [
      "#lazyEmployment [class*='designation']",
      "#lazyEmployment [class*='title']",
      "[class*='experience'] [class*='title']",
      "[class*='experience'] [class*='designation']",
      "[class*='employment'] [class*='title']",
      "[class*='work-history'] [class*='title']",
      "[class*='workHistory'] [class*='title']"
    ],
    workHistory: [
      "#lazyEmployment [class*='employment']",
      "#lazyEmployment [class*='experience']",
      "#lazyEmployment li",
      "#lazyEmployment article",
      "[class*='experience-item']",
      "[class*='experienceItem']",
      "[class*='employment-item']",
      "[class*='employmentItem']",
      "[class*='work-history-item']",
      "[class*='workHistoryItem']",
      "[class*='experience'] li",
      "[class*='employment'] li",
      "[class*='work-history'] li",
      "[class*='workHistory'] li"
    ]
  };

  const ACCOUNT_SURFACE_PATTERNS = [
    { kind: "applications", pattern: /my applications|application history|applied jobs|\/myapply\/history/i },
    { kind: "invites", pattern: /invite|invited|recruiter action|recruiter invite|connect request/i },
    { kind: "comments", pattern: /comment|reply|discussion/i },
    { kind: "post-visits", pattern: /post visit|visited post|post viewed|viewed post|posts? visited/i },
    { kind: "profile-updates", pattern: /profile (?:update|updated|edit|edited)|(?:updated|edited|update|edit) your profile/i },
    { kind: "resume-updates", pattern: /(?:resume|cv) (?:update|updated|upload|uploaded)|(?:updated|uploaded|upload) (?:your )?(?:resume|cv)/i },
    { kind: "profile-tracking", pattern: /profile viewed|viewed your profile|profile visitors|profile tracking/i },
    { kind: "interviews", pattern: /interview|assessment|screening round/i }
  ];

  const ACCOUNT_LINK_SELECTORS = [
    "a[href]",
    "button[data-url]",
    "[role='link']"
  ];

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function profileSafe(value) {
    return clean(value)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
      .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function unique(values) {
    const seen = new Set();
    return values.filter((value) => {
      const key = clean(value).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function isVisible(node) {
    if (!node || node.getAttribute?.("aria-hidden") === "true") return false;
    const view = node.ownerDocument?.defaultView;
    if (!view?.getComputedStyle) return true;
    const style = view.getComputedStyle(node);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  function textFrom(container, selectors) {
    for (const selector of selectors) {
      const node = container && container.querySelector ? container.querySelector(selector) : null;
      if (!isVisible(node)) continue;
      const value = clean(node && (node.innerText || node.textContent || node.getAttribute?.("title")));
      if (value) return value;
    }
    return "";
  }

  function textFromIncludingSelf(container, selectors) {
    for (const selector of selectors) {
      const node = container && container.matches?.(selector) ? container : (container && container.querySelector ? container.querySelector(selector) : null);
      if (!isVisible(node)) continue;
      const value = clean(node && (node.innerText || node.textContent || node.getAttribute?.("title")));
      if (value) return value;
    }
    return "";
  }

  function textsFrom(container, selectors) {
    const values = [];
    for (const selector of selectors) {
      const nodes = container && container.querySelectorAll ? Array.from(container.querySelectorAll(selector)) : [];
      for (const node of nodes) {
        if (!isVisible(node)) continue;
        const value = clean(node.innerText || node.textContent || node.getAttribute?.("title"));
        if (value) values.push(...value.split(/[,|•·]/).map(clean));
      }
    }
    return unique(values.filter((value) => value.length > 1 && value.length <= 90)).slice(0, 60);
  }

  function firstMatch(text, pattern, fallback) {
    const match = clean(text).match(pattern);
    return match && match[0] ? clean(match[0]) : fallback;
  }

  function numberMatch(text, pattern) {
    const match = clean(text).match(pattern);
    if (!match || !match[1]) return null;
    const value = Number(match[1].replace(/,/g, ""));
    return Number.isFinite(value) ? value : null;
  }

  function absoluteUrl(value, baseUrl) {
    try {
      return new URL(value, baseUrl).href;
    } catch {
      return "";
    }
  }

  function stableId(url, title, company) {
    const urlId = String(url).match(/[-/](\d{8,})(?:[/?#]|$)/)?.[1];
    if (urlId) return urlId;
    return [title, company].map(clean).join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function relativeDate(value, now) {
    const text = clean(value);
    const base = Number.isFinite(now) ? now : Date.now();
    if (/\b(?:today|few hours? ago|just now)\b/i.test(text)) return new Date(base).toISOString();
    if (/\byesterday\b/i.test(text)) return new Date(base - 86400000).toISOString();
    const days = text.match(/\b(\d+)\+?\s+days?\s+ago\b/i)?.[1];
    if (days) return new Date(base - Number(days) * 86400000).toISOString();
    const weeks = text.match(/\b(\d+)\+?\s+weeks?\s+ago\b/i)?.[1];
    if (weeks) return new Date(base - Number(weeks) * 7 * 86400000).toISOString();
    const months = text.match(/\b(\d+)\+?\s+months?\s+ago\b/i)?.[1];
    if (months) return new Date(base - Number(months) * 30 * 86400000).toISOString();
    return "";
  }

  function applicationDate(value) {
    const relative = relativeDate(value);
    if (relative) return relative;
    const plain = clean(value).replace(/^applied(?:\s+on)?\s*[:\-]?\s*/i, "");
    const parsed = Date.parse(plain);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
  }

  function pageText(documentRef) {
    return clean(documentRef?.body?.innerText || documentRef?.body?.textContent || documentRef?.documentElement?.innerText || "");
  }

  function rawPageText(documentRef) {
    return String(documentRef?.body?.innerText || documentRef?.body?.textContent || documentRef?.documentElement?.innerText || "").replace(/\r/g, "");
  }

  function sectionText(documentRef, selector, labels = [], maxLength = 1200) {
    const node = documentRef?.querySelector?.(selector);
    if (!node || !isVisible(node)) return "";
    let value = profileSafe(node.innerText || node.textContent || "");
    for (const label of labels) value = value.replace(new RegExp(`^\\s*${label}\\s*[:\\-]?\\s*`, "i"), "");
    value = value.replace(/\b(?:edit|add|update|modify)\b\s*$/i, "").trim();
    return value.slice(0, maxLength);
  }

  function sectionSkillTexts(documentRef) {
    const root = documentRef?.querySelector?.("#lazyKeySkills");
    if (!root || !isVisible(root)) return [];
    const values = [];
    const leaves = Array.from(root.querySelectorAll("li, a, [class*='chip'], [class*='tag'], span"));
    for (const node of leaves) {
      if (!isVisible(node)) continue;
      const value = profileSafe(node.innerText || node.textContent || "");
      if (!value || value.length > 90 || /^(?:key skills?|skills?|edit|add|update|show more|show less)$/i.test(value)) continue;
      values.push(...value.split(/[,|•·]/).map(profileSafe));
    }
    return unique(values.filter((value) => value.length > 1 && value.length <= 90)).slice(0, 60);
  }

  // Naukri sometimes exposes icon-font names and hidden modal text through
  // innerText. Profile capture therefore uses exact labels/known sections first
  // and treats broad class-name matches only as a last-resort fallback.
  const PROFILE_NOISE_RE = /(?:edit|location|experience|wallet|calendar|phone|email|camera|delete|briefcase|profile|notice|salary)OneTheme/gi;
  const PROFILE_JUNK_RE = /(?:are you sure you want to delete photo|cancel\s*delete|delete photo|upload photo|change photo|profile photo|remove photo)/i;

  function cleanProfileValue(value, maxLength = 1200) {
    return profileSafe(value)
      .replace(PROFILE_NOISE_RE, " ")
      .replace(/\b(?:read more|show more|show less)\b\s*$/i, "")
      .replace(/\b(?:edit|update|modify|add)\b\s*$/i, "")
      .replace(/^\s*(?:edit|update|modify)\s+/i, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  function validProfileValue(value, maxLength = 1200) {
    const cleaned = cleanProfileValue(value, maxLength);
    if (!cleaned || PROFILE_JUNK_RE.test(cleaned)) return "";
    if (/^(?:edit|update|modify|add|delete|cancel|save|profile|resume|summary|skills?|location|experience)$/i.test(cleaned)) return "";
    return cleaned;
  }

  function rawMarkerValue(rawText, marker, stopMarkers = [], maxLength = 180) {
    const source = String(rawText || "").replace(/\r/g, " ");
    if (!source || !marker) return "";
    const stops = stopMarkers.length ? `(?=\\s*(?:${stopMarkers.map(escapeRegExp).join("|")})|$)` : "$";
    const re = new RegExp(`${escapeRegExp(marker)}\\s*[:\\-]?\\s*([\\s\\S]{1,${Math.max(40, maxLength * 3)}}?)${stops}`, "i");
    const match = source.match(re);
    return validProfileValue(match?.[1] || "", maxLength);
  }

  function inlineLabelValue(rawText, labels = [], stopLabels = [], maxLength = 240) {
    const source = String(rawText || "").replace(/\r/g, "\n");
    if (!source || !labels.length) return "";
    for (const label of labels) {
      const starts = escapeRegExp(label);
      const stops = [...PROFILE_BOUNDARY_LABELS, ...stopLabels]
        .filter((x) => String(x).toLowerCase() !== String(label).toLowerCase())
        .map(escapeRegExp)
        .sort((a,b)=>b.length-a.length)
        .join("|");
      const stopPattern = stops ? `(?:\\n|\\s)(?:${stops})\\s*[:\\-]?\\s*` : "$";
      const re = new RegExp(`(?:^|\\n|\\s)${starts}\\s*[:\\-]?\\s*([\\s\\S]{1,${Math.max(80, maxLength * 3)}}?)(?=${stopPattern}|$)`, "i");
      const match = source.match(re);
      const value = validProfileValue(match?.[1] || "", maxLength);
      if (value) return value;
    }
    return "";
  }

  function directSectionValue(root, labels = [], maxLength = 240) {
    if (!root || !isVisible(root)) return "";
    const raw = String(root.innerText || root.textContent || "");
    const labelled = inlineLabelValue(raw, labels, [], maxLength);
    if (labelled) return labelled;
    const lines = raw.split(/\n+/).map((line) => cleanProfileValue(line, maxLength)).filter(Boolean);
    const labelSet = new Set(labels.map((x) => String(x).toLowerCase()));
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const normalized = line.replace(/[:\-]+$/, "").toLowerCase();
      if (labelSet.has(normalized)) {
        for (let nextIndex = index + 1; nextIndex < Math.min(lines.length, index + 5); nextIndex += 1) {
          const next = validProfileValue(lines[nextIndex], maxLength);
          if (!next || /^(?:edit|update|modify|add|show more|show less)$/i.test(next)) continue;
          if (PROFILE_BOUNDARY_LABELS.some((label) => next.toLowerCase() === String(label).toLowerCase())) break;
          return next;
        }
        continue;
      }
      if (/^(?:edit|update|modify|add|show more|show less)$/i.test(line)) continue;
      if (labels.some((label) => new RegExp(`^${escapeRegExp(label)}\\b`, "i").test(line))) {
        const stripped = labels.reduce((value, label) => value.replace(new RegExp(`^${escapeRegExp(label)}\\s*[:\\-]?\\s*`, "i"), ""), line);
        const cleaned = validProfileValue(stripped, maxLength);
        if (cleaned) return cleaned;
      }
    }
    return "";
  }

  const PROFILE_BOUNDARY_LABELS = [
    "Resume headline", "Profile headline", "Current title", "Key skills", "Core skills", "Technical skills",
    "Profile summary", "Professional summary", "About me", "Current location", "Preferred work location", "Preferred location",
    "Total experience", "Overall experience", "Work experience", "Internship experience", "Full-time experience", "Full time experience",
    "Notice period", "Availability to join", "Current CTC", "Current salary", "Annual CTC", "Preferred salary", "Expected CTC", "Expected salary",
    "Employment", "Work history", "Education", "Projects", "IT skills", "Certifications", "Career profile", "Personal details", "Accomplishments", "Resume"
  ];

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function profileBlockValue(rawText, startLabels = [], stopLabels = [], maxLength = 1200) {
    const flat = String(rawText || "").replace(/\u00a0/g, " ").replace(/\r/g, "\n").replace(/\s+/g, " ").trim();
    if (!flat || !startLabels.length) return "";
    const starts = startLabels.map(escapeRegExp).sort((a, b) => b.length - a.length).join("|");
    const startLower = new Set(startLabels.map((x) => String(x).toLowerCase()));
    const stops = [...PROFILE_BOUNDARY_LABELS, ...stopLabels]
      .filter((x) => !startLower.has(String(x).toLowerCase()))
      .map(escapeRegExp)
      .sort((a, b) => b.length - a.length)
      .join("|");
    const cap = Math.max(240, Math.min(6000, maxLength * 4));
    const re = new RegExp(`(?:^|\\s)(?:${starts})\\s*[:\\-]?\\s*(.{1,${cap}}?)(?=\\s(?:${stops})\\s*[:\\-]?\\s|$)`, "i");
    const match = flat.match(re);
    return validProfileValue(match?.[1] || "", maxLength);
  }

  function profileBlockList(rawText, startLabels = [], stopLabels = [], { maxItems = 60, maxLength = 90 } = {}) {
    const block = profileBlockValue(rawText, startLabels, stopLabels, Math.min(4000, maxItems * maxLength));
    if (!block) return [];
    return unique(block.split(/[,;|•·]+/).map((x) => validProfileValue(x, maxLength)).filter(Boolean)).slice(0, maxItems);
  }

  function profileStructuralLabelCount(value) {
    const text = String(value || "");
    return PROFILE_BOUNDARY_LABELS.reduce((count, label) => count + (new RegExp(`\\b${escapeRegExp(label)}\\b`, "i").test(text) ? 1 : 0), 0);
  }

  function isAggregateProfileText(value) {
    const text = validProfileValue(value, 5000);
    if (!text) return false;
    if (profileStructuralLabelCount(text) >= 3) return true;
    return /(?:supported formats|uploaded on\s+[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}|you(?:'|’)?re\s+1\s+step\s+away|downloadOneTheme|career profile\s+personal details)/i.test(text);
  }

  function isPlausibleProfileHeadline(value) {
    const text = validProfileValue(value, 240);
    if (!text || isAggregateProfileText(text)) return false;
    if (/^(?:diversity\s*&\s*inclusion|accomplishments?|career profile|personal details|resume|key skills?|profile summary|recommended jobs?|jobs?|companies|services)$/i.test(text)) return false;
    if (/(?:fair chance|401\(k\)|applicants? in california|salary\s+\d{5,})/i.test(text)) return false;
    return true;
  }

  function roleLikeHeadline(value) {
    const text = isPlausibleProfileHeadline(value) ? validProfileValue(value, 120) : "";
    if (!text || text.length > 100 || text.split(/\s+/).length > 12) return "";
    if (/[.!?]/.test(text) || /\b(?:years? of experience|skilled in|building|looking for|seeking)\b/i.test(text)) return "";
    return text;
  }

  function roleFromHeadline(value) {
    const text = isPlausibleProfileHeadline(value) ? validProfileValue(value, 180) : "";
    if (!text) return "";
    const shortened = text
      .replace(/\s+(?:with|having)\s+\d+(?:\.\d+)?\+?\s*(?:years?|yrs?)(?:\s+of\s+experience)?[\s\S]*$/i, "")
      .replace(/\s+[|·•-]\s*(?:\d+(?:\.\d+)?\+?\s*(?:years?|yrs?)|experienced|specializing)[\s\S]*$/i, "")
      .trim();
    const direct = roleLikeHeadline(shortened);
    if (direct) return direct;
    if (shortened && shortened.length <= 100 && shortened.split(/\s+/).length <= 12 && !/[.!?]/.test(shortened)) return shortened;
    return "";
  }

  function isPlausibleProfileSummary(value) {
    const text = validProfileValue(value, 1200);
    if (!text || isAggregateProfileText(text)) return false;
    if (PROFILE_BOUNDARY_LABELS.some((label) => text.toLowerCase() === String(label).toLowerCase())) return false;
    if (/^(?:accomplishments?|career profile|personal details|resume|key skills?|profile summary|employment|education|projects|certifications)$/i.test(text)) return false;
    return true;
  }

  function exactLabelNodes(documentRef, labels = []) {
    const wanted = labels.map((label) => String(label).trim().replace(/[:\-]+$/, "").toLowerCase());
    const nodes = documentRef?.querySelectorAll ? Array.from(documentRef.querySelectorAll("label,dt,th,h2,h3,h4,strong,span,p,div")) : [];
    return nodes.filter((node) => {
      if (!isVisible(node)) return false;
      const raw = String(node.innerText || node.textContent || "");
      const value = cleanProfileValue(raw, 180).replace(/\b(?:edit|update|modify|add)\b\s*$/i, "").replace(/[:\-]+$/, "").trim().toLowerCase();
      if (wanted.includes(value)) return true;
      return wanted.some((label) => value.length <= label.length + 24 && (value.startsWith(`${label} `) || value.startsWith(`${label}:`) || value.startsWith(`${label} -`)));
    });
  }

  function valuesNearLabel(documentRef, labels = [], { maxItems = 20, maxLength = 180 } = {}) {
    const out = [];
    const seenContainers = new Set();
    for (const labelNode of exactLabelNodes(documentRef, labels)) {
      // Stay inside the field that owns the label. Walking up to a broader
      // preference/profile section mixes values from neighboring fields.
      let container = labelNode.closest?.(".data-cont,dd,li,[data-field],[class*='field']") || null;
      if (!container) {
        const parent = labelNode.parentElement;
        container = parent && clean(parent.innerText || parent.textContent).replace(/[:\-]+$/, "").trim().toLowerCase() === clean(labelNode.innerText || labelNode.textContent).replace(/[:\-]+$/, "").trim().toLowerCase()
          ? parent.parentElement
          : parent;
      }
      if (!container || seenContainers.has(container)) continue;
      seenContainers.add(container);

      const labelRaw = String(labelNode.innerText || labelNode.textContent || "");
      for (const label of labels) {
        const inline = validProfileValue(labelRaw.replace(new RegExp(`^\s*${escapeRegExp(label)}\s*[:\-]?\s*`, "i"), ""), maxLength);
        if (inline && inline.toLowerCase() !== labelRaw.trim().toLowerCase() && !/^(?:edit|update|modify|add)$/i.test(inline)) out.push(inline);
      }
      if (out.length >= maxItems) return unique(out).slice(0, maxItems);

      const preferred = Array.from(container.querySelectorAll?.(".chip,[class*='chip'],[class*='tag'],dd,[data-value],li") || []);
      const candidates = preferred.length ? preferred : (() => {
        const siblings = [];
        let sib = labelNode.nextElementSibling;
        for (let i = 0; sib && i < 12; i += 1, sib = sib.nextElementSibling) siblings.push(sib);
        if (siblings.length) return siblings;
        return Array.from(container.children || []).filter((node) => node !== labelNode && !node.contains?.(labelNode));
      })();

      for (const node of candidates) {
        if (!isVisible(node)) continue;
        const raw = node.getAttribute?.("data-value") || node.getAttribute?.("title") || node.innerText || node.textContent || "";
        const value = validProfileValue(raw, maxLength);
        if (!value) continue;
        const lower = value.toLowerCase();
        if (labels.some((label) => lower === String(label).trim().toLowerCase())) continue;
        if (/^(?:edit|update|modify|add|show more|show less)$/i.test(value)) continue;
        out.push(value);
        if (out.length >= maxItems) return unique(out);
      }

      if (!candidates.length) {
        let value = validProfileValue(container.innerText || container.textContent || "", maxLength * 3);
        if (value) {
          for (const label of labels) value = value.replace(new RegExp(`^\\s*${String(label).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\s*[:\\-]?\\s*`, "i"), "");
          value = validProfileValue(value, maxLength);
          if (value) out.push(value);
        }
      }
    }
    return unique(out).slice(0, maxItems);
  }

  function semanticSectionText(documentRef, labels = [], maxLength = 1200) {
    for (const labelNode of exactLabelNodes(documentRef, labels)) {
      const container = labelNode.closest?.(".data-cont,section,article,[class*='section'],[class*='card']") || labelNode.parentElement?.parentElement || labelNode.parentElement;
      if (!container) continue;
      const candidates = Array.from(container.querySelectorAll?.("p,div,span") || [])
        .filter((node) => node !== labelNode && isVisible(node))
        .map((node) => validProfileValue(node.innerText || node.textContent, maxLength))
        .filter((value) => value && !labels.some((label) => value.toLowerCase() === String(label).trim().toLowerCase()))
        .filter((value) => !/^(?:edit|update|modify|add|delete|cancel|save)$/i.test(value))
        .filter((value) => !PROFILE_JUNK_RE.test(value))
        .sort((a, b) => b.length - a.length);
      const best = candidates.find((value) => value.length >= 20);
      if (best) return best.slice(0, maxLength);
    }
    return "";
  }

  function cleanLocationValue(value) {
    let out = validProfileValue(value, 240);
    if (!out) return "";
    out = out.split(/(?:experienceOneTheme|walletOneTheme|₹|\brs\.?\s*\d)/i)[0];
    out = out.replace(/^ot\s+(?=[a-z])/i, "").replace(/\b(?:experience|salary|ctc)\b.*$/i, "").trim();
    if (/\d+\s*(?:years?|months?)/i.test(out)) out = out.split(/\d+\s*(?:years?|months?)/i)[0].trim();
    if (!out || out.length > 120 || PROFILE_JUNK_RE.test(out)) return "";
    return out;
  }

  function firstSemanticValue(documentRef, labels = [], maxLength = 180) {
    return valuesNearLabel(documentRef, labels, { maxItems: 1, maxLength })[0] || "";
  }

  function sessionState(documentRef, mode) {
    if (mode === "login") return "login-required";
    const text = pageText(documentRef);
    const hasSignedInMarker = /\b(?:logout|log out|my profile|view profile|edit profile|account settings|my applications)\b/i.test(text);
    const hasLoginMarker = /\b(?:login|log in|sign in)\b/i.test(text) && /\b(?:password|otp|continue|register|new to naukri)\b/i.test(text);
    if (hasLoginMarker && !hasSignedInMarker) return "login-required";
    if (mode === "profile" && (hasSignedInMarker || /(?:current location|key skills?|professional summary|total experience|work experience)/i.test(text))) return "connected";
    if (hasSignedInMarker || Boolean(documentRef?.querySelector?.('.nI-gNb-drawer, .nI-gNb-header__user-avatar, [class*="user-avatar"], [class*="user-name"], a[href*="/mnjuser/profile"]'))) return "connected";
    return "unknown";
  }

  function accountSurfaceLinks(documentRef, pageUrl) {
    const links = [];
    const seen = new Set();
    for (const selector of ACCOUNT_LINK_SELECTORS) {
      const nodes = documentRef?.querySelectorAll ? Array.from(documentRef.querySelectorAll(selector)) : [];
      for (const node of nodes) {
        if (!isVisible(node)) continue;
        const rawHref = node.getAttribute?.("href") || node.getAttribute?.("data-url") || node.href || "";
        const href = absoluteUrl(rawHref, pageUrl);
        let parsed;
        try {
          parsed = href ? new URL(href) : null;
        } catch {
          parsed = null;
        }
        if (!parsed || !(parsed.hostname === "naukri.com" || parsed.hostname.endsWith(".naukri.com"))) continue;
        const label = clean(node.innerText || node.textContent || node.getAttribute?.("aria-label") || node.getAttribute?.("title"));
        const evidence = `${label} ${href}`;
        const match = ACCOUNT_SURFACE_PATTERNS.find((item) => item.pattern.test(evidence));
        if (!match) continue;
        const key = href.split("#")[0];
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({ id: key, kind: match.kind, label: label || match.kind, url: key, lastSeenAt: new Date().toISOString() });
      }
    }
    return links.slice(0, 100);
  }

  function yearsValue(value) {
    const text = clean(value);
    const years = Number(text.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i)?.[1] || 0);
    const months = Number(text.match(/(\d+(?:\.\d+)?)\s*months?/i)?.[1] || 0);
    if (!years && !months) return 0;
    return Math.round((years + months / 12) * 10) / 10;
  }

  function salaryValues(value) {
    const text = clean(value);
    if (!text || !/(?:lpa|lac|lakh|₹|rs\.?|inr)/i.test(text)) return [];
    const normalized = text.replace(/,/g, "");
    const range = normalized.match(/(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lac|lakhs?)/i);
    if (range) return [Number(range[1]), Number(range[2])].filter((item) => Number.isFinite(item) && item >= 0 && item < 500);
    const lpa = normalized.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lac|lakhs?)/i);
    if (lpa) return [Number(lpa[1])].filter((item) => Number.isFinite(item) && item >= 0 && item < 500);
    const money = normalized.match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)/i);
    if (!money) return [];
    const raw = Number(money[1]);
    if (!Number.isFinite(raw) || raw < 0) return [];
    const inLpa = raw >= 1000 ? Math.round((raw / 100000) * 100) / 100 : raw;
    return inLpa < 500 ? [inLpa] : [];
  }

  function labelledValue(text, labels, maxLength = 120) {
    const source = clean(text);
    for (const label of labels) {
      const pattern = new RegExp(`${label}\\s*[:\\-]?\\s*([^!?\\n]{1,${maxLength}})`, "i");
      const match = source.match(pattern);
      if (match?.[1]) return clean(match[1]);
    }
    return "";
  }

  function labelledYears(text, labels) {
    const source = clean(text);
    for (const label of labels) {
      const pattern = new RegExp(`${label}[^\\n]{0,100}?(\\d+(?:\\.\\d+)?\\s*(?:years?|yrs?)(?:\\s*\\d+(?:\\.\\d+)?\\s*months?)?)`, "i");
      const match = source.match(pattern);
      if (match?.[1]) return yearsValue(match[1]);
    }
    return 0;
  }

  function firstHeading(documentRef) {
    const nodes = documentRef?.querySelectorAll ? Array.from(documentRef.querySelectorAll("h1, h2, h3")) : [];
    return nodes.filter(isVisible).map((node) => profileSafe(node.innerText || node.textContent)).find((value) => value && !/^(?:profile|my profile|about|skills|experience|resume)$/i.test(value) && value.length <= 120) || "";
  }


  // Exact Naukri profile DOM map captured from the current signed-in profile UI.
  // These selectors are intentionally section-scoped and take precedence over
  // broad semantic fallbacks. This gives Applyra a stable structured mirror of
  // the fields Naukri actually renders while keeping legacy profile fields for
  // matching/backward compatibility.
  const NAUKRI_PROFILE_SECTION_MAP = {
    top: { root: ".row.mb0.no-pend-acts", edit: ".row.mb0.no-pend-acts .hdn .edit.icon" },
    resume: { root: "#lazyAttachCV", update: "#lazyAttachCV .dummyUpload", download: "#lazyAttachCV [data-title='download-resume']", remove: "#lazyAttachCV [data-title='delete-resume']" },
    resumeHeadline: { root: "#lazyResumeHead", edit: "#lazyResumeHead .widgetHead .edit.icon" },
    keySkills: { root: "#lazyKeySkills", edit: "#lazyKeySkills .widgetHead .edit.icon" },
    employment: { root: "#lazyEmployment", add: "#lazyEmployment #add-employment", item: "#lazyEmployment .emp-list", itemEdit: ".emp-desg + .edit.icon, .title .edit.icon" },
    education: { root: "#lazyEducation", add: "#lazyEducation .widgetHead .add.no-outline", item: "#lazyEducation .edu-list", itemEdit: ".edit.icon" },
    itSkills: { root: "#lazyITSkills", add: "#lazyITSkills .widgetHead .add.no-outline", item: "#lazyITSkills li.collection:not(.head)", itemEdit: ".edit.icon" },
    projects: { root: "#lazyProject", add: "#lazyProject .widgetHead .add.no-outline", item: "#lazyProject .project-list", itemEdit: ".edit.icon" },
    profileSummary: { root: "#lazyProfileSummary", edit: "#lazyProfileSummary .widgetHead .edit.icon" },
    accomplishments: { root: "#lazyAccomplishment" },
    careerProfile: { root: "#lazyDesiredProfile", edit: "#lazyDesiredProfile .widgetHead .edit.icon" },
    personalDetails: { root: "#lazyPersonalDetail", edit: "#lazyPersonalDetail .personalDetails > div > .widgetHead .edit.icon" },
    diversity: { root: "#dynamicForm-diversity-fields", edit: "#dynamicForm-diversity-fields .cta-container .cta__icon" },
    quickLinks: { root: ".quick-link-wrap" }
  };

  const NAUKRI_ACCOMPLISHMENT_SECTION_MAP = {
    onlineProfiles: { wrapper: ".onlineProfile-wrapper", add: ".onlineProfile-wrapper .mb20 .add", item: ".onlineProfile-wrapper .mb20", itemEdit: ".edit.icon" },
    workSamples: { wrapper: ".workSample-wrapper", add: ".workSample-wrapper .mb20 .add", item: ".workSample-wrapper .mb20", itemEdit: ".edit.icon" },
    publications: { wrapper: ".publication-wrapper", add: ".publication-wrapper .mb20 .add", item: ".publication-wrapper .mb20", itemEdit: ".edit.icon" },
    presentations: { wrapper: ".presentation-wrapper", add: ".presentation-wrapper .mb20 .add", item: ".presentation-wrapper .mb20", itemEdit: ".edit.icon" },
    patents: { wrapper: ".patent-wrapper", add: ".patent-wrapper .mb20 .add", item: ".patent-wrapper .mb20", itemEdit: ".edit.icon" },
    certifications: { wrapper: ".certifications-wrapper", add: ".certifications-wrapper .mb20 .add", item: ".certifications-wrapper .cert-list", itemEdit: ".edit.icon" }
  };

  function directRawText(node, maxLength = 4000) {
    return clean(node?.getAttribute?.("title") || node?.innerText || node?.textContent || "").slice(0, maxLength);
  }

  function directNode(documentRef, selector, root = null) {
    const scope = root || documentRef;
    return scope?.querySelector?.(selector) || null;
  }

  function directText(documentRef, selector, { root = null, attr = "", maxLength = 1000 } = {}) {
    const node = directNode(documentRef, selector, root);
    if (!node) return "";
    const raw = attr ? node.getAttribute?.(attr) : (node.getAttribute?.("title") || node.innerText || node.textContent);
    return clean(raw || "").replace(/\bRead More\b\s*$/i, "").trim().slice(0, maxLength);
  }

  function directTexts(documentRef, selector, { root = null, attr = "", maxItems = 100, maxLength = 300 } = {}) {
    const scope = root || documentRef;
    const nodes = scope?.querySelectorAll ? Array.from(scope.querySelectorAll(selector)) : [];
    return unique(nodes.map((node) => clean((attr ? node.getAttribute?.(attr) : (node.getAttribute?.("title") || node.innerText || node.textContent)) || "").replace(/\bRead More\b\s*$/i, "").trim().slice(0, maxLength)).filter(Boolean)).slice(0, maxItems);
  }

  function splitProfileList(value, maxItems = 30) {
    return unique(String(value || "").split(/\s*,\s*|\s*;\s*|\s*\|\s*/).map((x) => clean(x)).filter(Boolean)).slice(0, maxItems);
  }

  function noticeDays(value) {
    const text = clean(value);
    if (!text) return 0;
    if (/immediate|immediately/i.test(text)) return 0;
    const n = Number(text.match(/\d+(?:\.\d+)?/)?.[0] || 0);
    if (!n) return 0;
    if (/month/i.test(text)) return Math.round(n * 30);
    if (/week/i.test(text)) return Math.round(n * 7);
    return Math.round(n);
  }

  function durationYears(value) {
    const text = clean(value);
    const paren = text.match(/\(([^)]+)\)/)?.[1] || text;
    return yearsValue(paren);
  }

  function mapRawFields(root) {
    const out = {};
    if (!root?.querySelectorAll) return out;
    for (const field of Array.from(root.querySelectorAll(".hori-list .col, .prof-cont .col"))) {
      const title = clean(field.querySelector?.(".title")?.innerText || field.querySelector?.(".title")?.textContent || "");
      const value = clean(field.querySelector?.(".desc")?.innerText || field.querySelector?.(".desc")?.textContent || "");
      if (title && value) out[title] = value;
    }
    return out;
  }

  function directEmployment(documentRef) {
    const root = documentRef?.querySelector?.("#lazyEmployment");
    if (!root) return [];
    return Array.from(root.querySelectorAll(".emp-list")).map((row) => {
      const title = directText(documentRef, ".emp-desg", { root: row, attr: "title", maxLength: 180 }) || directText(documentRef, ".emp-desg", { root: row, maxLength: 180 });
      const company = directText(documentRef, ".emp-org", { root: row, attr: "title", maxLength: 180 }) || directText(documentRef, ".emp-org", { root: row, maxLength: 180 });
      const type = directText(documentRef, ".expType", { root: row, maxLength: 80 });
      const period = directText(documentRef, ".experienceType span.truncate:not(.expType)", { root: row, maxLength: 200 })
        || directText(documentRef, ".experienceType", { root: row, maxLength: 240 }).replace(type, "").trim();
      const noticePeriod = directText(documentRef, ".emp-notice-prd", { root: row, maxLength: 120 });
      const description = directText(documentRef, ".emp-desc", { root: row, maxLength: 3000 }).replace(/\s*\.\.\.\s*Read More\s*$/i, "").replace(/\s*Read More\s*$/i, "").trim();
      const projects = directTexts(documentRef, ".projects .chip[title]", { root: row, attr: "title", maxItems: 30, maxLength: 180 });
      const topSkills = splitProfileList(directText(documentRef, ".keyskillList .txt-col-n6", { root: row, maxLength: 1200 }), 30);
      return { title, company, type, period, durationYears: durationYears(period), noticePeriod, noticePeriodDays: noticeDays(noticePeriod), description, projects, topSkills, current: /present|current|till date/i.test(period), source: "naukri-profile-direct" };
    }).filter((row) => row.title || row.company);
  }

  function directEducation(documentRef) {
    const root = documentRef?.querySelector?.("#lazyEducation");
    if (!root) return [];
    return Array.from(root.querySelectorAll(".edu-list")).map((row) => {
      const titles = directTexts(documentRef, ".title", { root: row, maxItems: 6, maxLength: 200 }).filter((x) => !/^edit/i.test(x));
      const institution = directText(documentRef, ".ins", { root: row, maxLength: 240 }) || directText(documentRef, ".typ-14Medium.txt-col-n8", { root: row, maxLength: 240 });
      const periodAndMode = directText(documentRef, ".typ-14Regular.txt-col-n6", { root: row, maxLength: 240 });
      const mode = /full\s*time/i.test(periodAndMode) ? "Full Time" : /part\s*time/i.test(periodAndMode) ? "Part Time" : "";
      const period = clean(periodAndMode.replace(/full\s*time|part\s*time/ig, "").replace(/\s+/g, " "));
      return { level: titles[0] || "", specialization: titles.slice(1).join(" · "), institution, period, mode, source: "naukri-profile-direct" };
    }).filter((row) => row.level || row.institution);
  }

  function directITSkills(documentRef) {
    const root = documentRef?.querySelector?.("#lazyITSkills");
    if (!root) return [];
    return Array.from(root.querySelectorAll("li.collection")).filter((row) => !row.classList?.contains("head")).map((row) => {
      const cols = Array.from(row.querySelectorAll(":scope > span"));
      const skillText = clean(cols[0]?.innerText || cols[0]?.textContent || "");
      return {
        skillText,
        skills: unique(skillText.split(/\s*,\s*/).map(clean).filter(Boolean)),
        version: clean(cols[1]?.innerText || cols[1]?.textContent || ""),
        lastUsed: clean(cols[2]?.innerText || cols[2]?.textContent || ""),
        experience: clean(cols[3]?.innerText || cols[3]?.textContent || ""),
        experienceYears: yearsValue(cols[3]?.innerText || cols[3]?.textContent || ""),
        source: "naukri-profile-direct"
      };
    }).filter((row) => row.skillText);
  }

  function directProjects(documentRef) {
    const root = documentRef?.querySelector?.("#lazyProject");
    if (!root) return [];
    return Array.from(root.querySelectorAll(".project-list")).map((row) => ({
      title: directText(documentRef, ".title .truncate", { root: row, attr: "title", maxLength: 240 }) || directText(documentRef, ".title .truncate", { root: row, maxLength: 240 }),
      organization: directText(documentRef, ".item .truncate.typ-14Medium", { root: row, attr: "title", maxLength: 240 }) || directText(documentRef, ".item .truncate.typ-14Medium", { root: row, maxLength: 240 }),
      period: directText(documentRef, ".item.typ-14Regular.txt-col-n6", { root: row, maxLength: 240 }),
      description: directText(documentRef, ".item.prefill", { root: row, maxLength: 3000 }).replace(/\s*\.\.\.\s*Read More\s*$/i, "").replace(/\s*Read More\s*$/i, "").trim(),
      source: "naukri-profile-direct"
    })).filter((row) => row.title);
  }

  function directLanguages(documentRef) {
    const root = documentRef?.querySelector?.("#lazyPersonalDetail");
    if (!root) return [];
    const yes = (row, selector) => /tickOutlineOneTheme/i.test(clean(row.querySelector?.(selector)?.innerText || row.querySelector?.(selector)?.textContent || ""));
    return Array.from(root.querySelectorAll(".language-list li.collection")).filter((row) => !row.classList?.contains("head")).map((row) => ({
      language: directText(documentRef, ".language", { root: row, maxLength: 100 }),
      proficiency: directText(documentRef, ".proficiency", { root: row, maxLength: 100 }),
      read: yes(row, ".read .icon"), write: yes(row, ".write .icon"), speak: yes(row, ".speak .icon")
    })).filter((row) => row.language);
  }

  function directAccomplishments(documentRef) {
    const root = documentRef?.querySelector?.("#lazyAccomplishment");
    if (!root) return { onlineProfiles: [], workSamples: [], publications: [], presentations: [], patents: [], certifications: [] };
    const generic = (wrapperSelector) => Array.from(root.querySelectorAll(`${wrapperSelector} .mb20`)).map((row) => {
      const title = directText(documentRef, ".hdn4", { root: row, attr: "title", maxLength: 240 }) || directText(documentRef, ".hdn4", { root: row, maxLength: 240 });
      const link = row.querySelector?.("a[href]")?.href || row.querySelector?.("a[href]")?.getAttribute?.("href") || "";
      const description = directText(documentRef, ".typ-14Medium.txt-col-n7.brkword", { root: row, maxLength: 3000 });
      const details = directText(documentRef, ".txt-col-n6.typ-14Regular", { root: row, maxLength: 240 });
      return { title, link: clean(link), description, details };
    }).filter((row) => row.title && !/^add$/i.test(row.title));
    const certifications = Array.from(root.querySelectorAll(".certifications-wrapper .cert-list")).map((row) => ({
      title: directText(documentRef, ".hdn4", { root: row, attr: "title", maxLength: 300 }) || directText(documentRef, ".hdn4", { root: row, maxLength: 300 }),
      provider: directText(documentRef, ".txt-col-n6.typ-14Medium", { root: row, maxLength: 200 }),
      link: clean(row.querySelector?.("a[href]")?.href || row.querySelector?.("a[href]")?.getAttribute?.("href") || ""),
      validity: directText(documentRef, ".txt-col-n6.typ-14Regular", { root: row, maxLength: 240 })
    })).filter((row) => row.title);
    return { onlineProfiles: generic(".onlineProfile-wrapper"), workSamples: generic(".workSample-wrapper"), publications: generic(".publication-wrapper"), presentations: generic(".presentation-wrapper"), patents: generic(".patent-wrapper"), certifications };
  }

  function directDiversity(documentRef) {
    const root = documentRef?.querySelector?.("#dynamicForm-diversity-fields .preview");
    const fields = {};
    if (!root) return { fields };
    const labels = Array.from(root.querySelectorAll("h4.heading-h4"));
    for (const labelNode of labels) {
      const label = clean(labelNode.innerText || labelNode.textContent || "");
      let node = labelNode.parentElement?.nextElementSibling || null;
      const value = clean(node?.querySelector?.("h3.heading-h3")?.innerText || node?.querySelector?.("h3.heading-h3")?.textContent || "");
      if (label && value) fields[label] = value;
    }
    return { fields, disabilityStatus: fields["Disability status"] || "", militaryExperience: fields["Military experience"] || "", careerBreak: fields["Career break"] || "" };
  }

  function sectionCapabilities(documentRef) {
    const out = {};
    for (const [key, cfg] of Object.entries(NAUKRI_PROFILE_SECTION_MAP)) {
      const rootNode = documentRef?.querySelector?.(cfg.root);
      const rootText = clean(rootNode?.innerText || rootNode?.textContent || "");
      const explicitLazy = Boolean(rootNode && (rootNode.getAttribute?.("data-plugin") === "lazyload" || /^lazy/i.test(rootNode.id || "")));
      const loaded = Boolean(rootNode && (rootNode.getAttribute?.("data-loaded") === "true" || rootText.length >= 8 || (!explicitLazy && rootNode.children?.length)));
      out[key] = {
        present: Boolean(rootNode), loaded, rootSelector: cfg.root,
        canEdit: Boolean(cfg.edit && documentRef?.querySelector?.(cfg.edit)), editSelector: cfg.edit || "",
        canAdd: Boolean(cfg.add && documentRef?.querySelector?.(cfg.add)), addSelector: cfg.add || "",
        canUpdate: Boolean(cfg.update && documentRef?.querySelector?.(cfg.update)), updateSelector: cfg.update || "",
        itemCount: cfg.item && documentRef?.querySelectorAll ? documentRef.querySelectorAll(cfg.item).length : 0
      };
    }
    return out;
  }

  function extractNaukriProfileMap(documentRef, capturedAt = "") {
    const top = documentRef?.querySelector?.(NAUKRI_PROFILE_SECTION_MAP.top.root);
    const organizationRaw = directText(documentRef, ".txt-wrapper .desg .typ-14Medium", { root: top, maxLength: 200 });
    const currentCompany = organizationRaw.replace(/^at\s+/i, "").trim();
    const designationRaw = directText(documentRef, ".txt-wrapper .desg.typ-16Bold", { root: top, maxLength: 400 });
    const currentTitle = clean(designationRaw.replace(organizationRaw, "").replace(/\s+at\s*$/i, "").trim());
    const experienceText = directText(documentRef, "span.txt[name='Experience'][title]", { root: top, attr: "title", maxLength: 120 }) || directText(documentRef, "span.txt[name='Experience']", { root: top, maxLength: 120 });
    const salaryNode = directNode(documentRef, "span.txt[name='Salary']", top);
    const salaryText = clean(salaryNode?.innerText || salaryNode?.textContent || "").slice(0, 120);
    const noticePeriod = directText(documentRef, ".notice-label", { root: top, attr: "title", maxLength: 120 }) || directText(documentRef, ".notice-label", { root: top, maxLength: 120 });
    const resumeHeadline = directText(documentRef, "#lazyResumeHead .widgetCont .prefill > div", { maxLength: 1800 });
    const keySkills = directTexts(documentRef, "#lazyKeySkills .widgetCont .prefill .chip[title]", { attr: "title", maxItems: 100, maxLength: 180 });
    const employment = directEmployment(documentRef);
    const education = directEducation(documentRef);
    const itSkills = directITSkills(documentRef);
    const projects = directProjects(documentRef);
    const profileSummary = directText(documentRef, "#lazyProfileSummary .widgetCont .prefill", { maxLength: 4000 }).replace(/\s*\.\.\.\s*Read More\s*$/i, "").replace(/\s*Read More\s*$/i, "").trim();
    const careerRoot = documentRef?.querySelector?.("#lazyDesiredProfile");
    const careerFields = mapRawFields(careerRoot);
    const personalRoot = documentRef?.querySelector?.("#lazyPersonalDetail");
    const personalFields = mapRawFields(personalRoot);
    const accomplishments = directAccomplishments(documentRef);
    const diversity = directDiversity(documentRef);
    const quickLinks = Array.from(documentRef?.querySelectorAll?.(".quick-link-wrap li.collection-item") || []).map((row) => ({
      label: directText(documentRef, ".text", { root: row, maxLength: 120 }),
      action: directText(documentRef, ".secondary-content", { root: row, maxLength: 80 })
    })).filter((row) => row.label);
    const resumeFileName = directText(documentRef, "#lazyAttachCV .resume-name-inline .exten", { attr: "title", maxLength: 260 }) || directText(documentRef, "#lazyAttachCV .resume-name-inline .exten", { maxLength: 260 });
    const resumeUploaded = directText(documentRef, "#lazyAttachCV .updateOn", { maxLength: 160 }).replace(/^Uploaded on\s*/i, "").trim();
    const currentLocation = directText(documentRef, "span.txt[name='Location'][title]", { root: top, attr: "title", maxLength: 180 }) || directText(documentRef, "span.txt[name='Location']", { root: top, maxLength: 180 });
    const contact = {
      phone: directText(documentRef, "span.txt[name='Mobile'][title]", { root: top, attr: "title", maxLength: 80 }) || directText(documentRef, "span.txt[name='Mobile']", { root: top, maxLength: 80 }),
      email: directText(documentRef, "span.txt[name='Email'][title]", { root: top, attr: "title", maxLength: 240 }) || directText(documentRef, "span.txt[name='Email']", { root: top, maxLength: 240 })
    };
    const career = {
      fields: careerFields,
      currentIndustry: careerFields["Current industry"] || "", department: careerFields.Department || "", roleCategory: careerFields["Role category"] || "", jobRole: careerFields["Job role"] || "",
      desiredJobTypes: splitProfileList(careerFields["Desired job type"] || "", 20), desiredEmploymentTypes: splitProfileList(careerFields["Desired employment type"] || "", 20),
      preferredJobRoles: splitProfileList(careerFields["Preferred job role"] || "", 30), preferredWorkLocations: splitProfileList(careerFields["Preferred work location"] || "", 30),
      preferredAnnualSalaryText: careerFields["Preferred annual salary"] || "", preferredAnnualSalaryLpa: salaryValues(careerFields["Preferred annual salary"] || "")[0] || 0,
      preferredShift: careerFields["Preferred shift"] || ""
    };
    const identity = {
      fullName: directText(documentRef, ".fullname", { root: top, maxLength: 180 }), currentTitle, currentCompany,
      profileUpdatedAt: directText(documentRef, ".mod-date-val", { root: top, maxLength: 120 }), currentLocation,
      experienceText, experienceYears: yearsValue(experienceText), currentSalaryText: salaryText, currentSalaryLpa: salaryValues(salaryText)[0] || 0,
      noticePeriod, noticePeriodDays: noticeDays(noticePeriod)
    };
    const privateData = {
      contact,
      personal: { fields: personalFields, languages: directLanguages(documentRef) },
      diversity
    };
    const sectionStatus = sectionCapabilities(documentRef);
    const presentSections = Object.values(sectionStatus).filter((x) => x.present).length;
    const loadedSections = Object.values(sectionStatus).filter((x) => x.loaded).length;
    return {
      schemaVersion: 1, source: "naukri-direct-dom", capturedAt: capturedAt || new Date().toISOString(),
      identity, resume: { fileName: resumeFileName, uploadedOn: resumeUploaded, present: Boolean(resumeFileName), canUpdate: sectionStatus.resume?.canUpdate || false, canDownload: Boolean(documentRef?.querySelector?.(NAUKRI_PROFILE_SECTION_MAP.resume.download)), canDelete: Boolean(documentRef?.querySelector?.(NAUKRI_PROFILE_SECTION_MAP.resume.remove)) },
      resumeHeadline, keySkills, employment, education, itSkills, projects, profileSummary, accomplishments, careerProfile: career, private: privateData, quickLinks, sections: sectionStatus,
      diagnostics: { presentSections, loadedSections, directAnchors: { top: Boolean(top), resumeHeadline: Boolean(documentRef?.querySelector?.("#lazyResumeHead .widgetCont .prefill")), keySkills: Boolean(documentRef?.querySelector?.("#lazyKeySkills .widgetCont .prefill")), employment: Boolean(documentRef?.querySelector?.("#lazyEmployment .emp-list")), careerProfile: Boolean(sectionStatus.careerProfile?.loaded), education: Boolean(sectionStatus.education?.loaded), itSkills: Boolean(sectionStatus.itSkills?.loaded), projects: Boolean(sectionStatus.projects?.loaded), profileSummary: Boolean(sectionStatus.profileSummary?.loaded), accomplishments: Boolean(sectionStatus.accomplishments?.loaded), personalDetails: Boolean(sectionStatus.personalDetails?.loaded) } }
    };
  }

  function profileWorkHistory(documentRef) {
    const direct = directEmployment(documentRef);
    if (direct.length) return direct.slice(0, 20);
    const nodes = [];
    const seen = new Set();
    for (const selector of PROFILE_SELECTORS.workHistory) {
      const matches = documentRef?.querySelectorAll ? Array.from(documentRef.querySelectorAll(selector)) : [];
      for (const node of matches) {
        if (seen.has(node)) continue;
        seen.add(node);
        const text = clean(node.innerText || node.textContent);
        if (text.length < 12 || text.length > 900) continue;
        const title = profileSafe(textFrom(node, ["[class*='title']", "[class*='designation']", "h3", "h4"]));
        const company = profileSafe(textFrom(node, ["[class*='company']", "[class*='organization']", "[class*='employer']"]));
        const period = firstMatch(text, /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}[^.!?]{0,50}(?:present|\d{4})/i, "")
          || firstMatch(text, /\b\d{4}\s*(?:-|–|—|to)\s*(?:present|\d{4})\b/i, "");
        const fallbackTitle = title || text.split(/\s{2,}|\n/).map(clean).find((value) => value.length > 2 && value.length < 120) || "";
        if (!fallbackTitle) continue;
        nodes.push({
          title: profileSafe(fallbackTitle),
          company: company || "",
          period,
          type: /internship|intern\b/i.test(text) ? "Internship" : "Full-time / other",
          source: "naukri-profile"
        });
      }
    }
    return nodes.slice(0, 20);
  }

  function extractProfileHeuristic(documentRef, pageUrl, capturedAt) {
    const text = rawPageText(documentRef);

    const resumeHead = documentRef?.querySelector?.("#lazyResumeHead");
    const resumeHeadRaw = String(resumeHead?.innerText || resumeHead?.textContent || "");
    const stableHeadline = validProfileValue(textFromIncludingSelf(resumeHead, [".resumeHeadline", "[class*='resumeHeadline']", "[class*='headline']", "p"]), 240);
    const directHeadline = directSectionValue(resumeHead, ["Resume headline", "Profile headline", "Current title"], 240);
    const boundedHeadline = profileBlockValue(text, ["Resume headline", "Profile headline", "Current title"], ["Key skills", "Profile summary", "Current location"], 240);
    const semanticHeadline = firstSemanticValue(documentRef, ["Resume headline", "Profile headline", "Current title"], 240);
    const scopedFallbackHeadline = validProfileValue(textFrom(documentRef?.querySelector?.("main, .profilePage, [class*='profilePage']") || null, ["[class*='profile-headline']", "[class*='profileHeadline']", "[data-testid*='headline']"]), 240);
    const headlineCandidate = [directHeadline, stableHeadline, boundedHeadline, semanticHeadline, scopedFallbackHeadline].find(isPlausibleProfileHeadline) || "";
    const headline = headlineCandidate
      .replace(/^(?:resume headline|profile headline|headline|current title)\s*[:\-]?\s*/i, "")
      .trim()
      .slice(0, 240);

    const semanticLocation = firstSemanticValue(documentRef, ["Current location"], 120);
    const boundedLocation = profileBlockValue(text, ["Current location"], ["Preferred work location", "Preferred location", "Total experience", "Notice period"], 120);
    const markerLocation = rawMarkerValue(resumeHeadRaw, "locationOneTheme", ["experienceOneTheme", "walletOneTheme", "calendarOneTheme", "phoneOneTheme", "emailOneTheme"], 120);
    const scopedLocationRoot = documentRef?.querySelector?.("#lazyResumeHead, main.profilePage, .profilePage, [class*='profilePage']") || null;
    const fallbackLocation = textFrom(scopedLocationRoot, PROFILE_SELECTORS.location);
    const currentLocation = cleanLocationValue(semanticLocation || boundedLocation || markerLocation || fallbackLocation || labelledValue(text, ["current location"], 100));

    const stableSummaryRaw = sectionText(documentRef, "#lazyProfileSummary", ["profile summary", "professional summary", "summary"], 1200);
    const stableSummary = isPlausibleProfileSummary(stableSummaryRaw) ? validProfileValue(stableSummaryRaw, 1200) : "";
    const directSummaryRaw = directSectionValue(documentRef?.querySelector?.("#lazyProfileSummary") || null, ["Profile summary", "Professional summary", "About me"], 1200);
    const directSummary = isPlausibleProfileSummary(directSummaryRaw) ? directSummaryRaw : "";
    const boundedSummary = profileBlockValue(text, ["Profile summary", "Professional summary", "About me"], ["Employment", "Work history", "Education", "Projects", "IT skills", "Personal details"], 1200);
    const semanticSummaryRaw = semanticSectionText(documentRef, ["Profile summary", "Professional summary", "About me"], 1200);
    const semanticSummary = isPlausibleProfileSummary(semanticSummaryRaw) ? semanticSummaryRaw : "";
    const scopedSummaryRoot = documentRef?.querySelector?.("#lazyProfileSummary, main.profilePage, .profilePage, [class*='profilePage']") || null;
    const fallbackSummaryRaw = validProfileValue(textFrom(scopedSummaryRoot, PROFILE_SELECTORS.summary), 1200);
    const fallbackSummary = isPlausibleProfileSummary(fallbackSummaryRaw) ? fallbackSummaryRaw : "";
    const summary = (directSummary || stableSummary || boundedSummary || semanticSummary || fallbackSummary)
      .replace(/^(?:profile summary|professional summary|summary|about me)\s*[:\-]?\s*/i, "")
      .trim()
      .slice(0, 1200);

    const semanticSkills = valuesNearLabel(documentRef, ["Key skills", "Core skills", "Technical skills"], { maxItems: 60, maxLength: 90 });
    const boundedSkills = profileBlockList(text, ["Key skills", "Core skills", "Technical skills"], ["Profile summary", "Employment", "Work history", "Education", "Projects", "IT skills"], { maxItems: 60, maxLength: 90 });
    const scopedSkillRoot = documentRef?.querySelector?.("#lazyKeySkills, main.profilePage, .profilePage, [class*='profilePage']") || null;
    const skillValues = unique([...sectionSkillTexts(documentRef), ...semanticSkills, ...boundedSkills, ...textsFrom(scopedSkillRoot, PROFILE_SELECTORS.skills)])
      .map((value) => validProfileValue(value, 90))
      .filter(Boolean)
      .filter((value) => !/^(?:key skills?|core skills?|skills?|add skills?|technical skills?|edit|update)$/i.test(value))
      .filter((value) => value.length <= 90 && !isAggregateProfileText(value));

    const preferredRoles = unique([
      ...valuesNearLabel(documentRef, ["Preferred job role", "Preferred role", "Job role"], { maxItems: 12, maxLength: 120 }),
      ...profileBlockList(text, ["Preferred job role", "Preferred role", "Job role"], ["Preferred work location", "Preferred location", "Current location", "Key skills"], { maxItems: 12, maxLength: 120 })
    ]);
    const preferredLocations = unique([
      ...valuesNearLabel(documentRef, ["Preferred work location", "Preferred location"], { maxItems: 12, maxLength: 120 }),
      ...profileBlockList(text, ["Preferred work location", "Preferred location"], ["Current location", "Total experience", "Notice period", "Key skills"], { maxItems: 12, maxLength: 120 })
    ]).map(cleanLocationValue).filter(Boolean);

    const history = profileWorkHistory(documentRef);
    const historyRoles = history.map((item) => validProfileValue(item.title, 120)).filter(Boolean);

    const headerExperienceText = rawMarkerValue(resumeHeadRaw, "experienceOneTheme", ["locationOneTheme", "walletOneTheme", "calendarOneTheme", "phoneOneTheme", "emailOneTheme"], 100);
    const totalExperienceText = firstSemanticValue(documentRef, ["Total experience", "Overall experience", "Work experience"], 100)
      || profileBlockValue(text, ["Total experience", "Overall experience", "Work experience"], ["Current location", "Notice period", "Current CTC", "Expected CTC"], 100)
      || labelledValue(text, ["total experience", "overall experience", "work experience"], 100)
      || headerExperienceText;
    const internshipText = firstSemanticValue(documentRef, ["Internship experience"], 100)
      || profileBlockValue(text, ["Internship experience"], ["Full-time experience", "Total experience", "Current location", "Notice period"], 100)
      || labelledValue(text, ["internship experience"], 100);
    const fullTimeText = firstSemanticValue(documentRef, ["Full-time experience", "Full time experience", "Professional experience", "Employment experience"], 100)
      || profileBlockValue(text, ["Full-time experience", "Full time experience", "Professional experience", "Employment experience"], ["Internship experience", "Total experience", "Current location", "Notice period"], 100)
      || labelledValue(text, ["full[- ]time experience", "professional experience", "employment experience"], 100);
    const totalExperience = yearsValue(totalExperienceText);
    const internshipYears = yearsValue(internshipText);
    const explicitFullTime = yearsValue(fullTimeText);
    const fullTimeYears = explicitFullTime || (totalExperience ? Math.max(0, Math.round((totalExperience - internshipYears) * 10) / 10) : 0);

    const noticeText = firstSemanticValue(documentRef, ["Notice period", "Availability to join"], 100)
      || profileBlockValue(text, ["Notice period", "Availability to join"], ["Current CTC", "Expected CTC", "Current location", "Employment"], 100)
      || labelledValue(text, ["notice period", "availability to join"], 100);
    let noticePeriodDays = Number(noticeText.match(/\d+/)?.[0] || 0);
    if (/immediate|immediately/i.test(noticeText)) noticePeriodDays = 0;
    else if (/month/i.test(noticeText) && noticePeriodDays) noticePeriodDays *= 30;

    const headerSalaryText = rawMarkerValue(resumeHeadRaw, "walletOneTheme", ["locationOneTheme", "experienceOneTheme", "calendarOneTheme", "phoneOneTheme", "emailOneTheme"], 100);
    const currentSalaryText = firstSemanticValue(documentRef, ["Current CTC", "Current salary", "Annual CTC"], 100)
      || profileBlockValue(text, ["Current CTC", "Current salary", "Annual CTC"], ["Preferred salary", "Expected CTC", "Expected salary", "Notice period", "Employment"], 100)
      || labelledValue(text, ["current ctc", "current salary", "annual ctc"], 100)
      || headerSalaryText;
    const preferredSalaryText = firstSemanticValue(documentRef, ["Preferred salary", "Expected CTC", "Expected salary"], 100)
      || profileBlockValue(text, ["Preferred salary", "Expected CTC", "Expected salary"], ["Notice period", "Employment", "Education", "Personal details"], 100)
      || labelledValue(text, ["preferred salary", "expected ctc", "expected salary"], 100);
    const currentSalaryValues = salaryValues(currentSalaryText);
    const expectedSalaryValues = salaryValues(preferredSalaryText);

    const fallbackRole = roleFromHeadline(headline);
    const roles = unique((preferredRoles.length ? preferredRoles : [...historyRoles, fallbackRole])
      .map((value) => validProfileValue(value, 120))
      .filter((value) => value && !/^(?:profile|my profile|about|skills|experience|diversity\s*&\s*inclusion)$/i.test(value))).slice(0, 12);
    const locations = unique((preferredLocations.length ? preferredLocations : [currentLocation]).filter(Boolean)).slice(0, 12);
    const skills = unique(skillValues).slice(0, 60);

    const profileEvidence = {
      headline: Boolean(headline),
      summary: Boolean(summary),
      currentLocation: Boolean(currentLocation),
      preferredRoles: preferredRoles.length,
      preferredLocations: preferredLocations.length,
      roles: roles.length,
      skills: skills.length,
      workHistory: history.length,
      totalExperience: totalExperience || fullTimeYears || internshipYears,
      internshipYears,
      noticePeriodDays,
      currentSalary: currentSalaryValues[0] || 0,
      expectedSalary: expectedSalaryValues[0] || 0
    };
    const evidenceCount = [profileEvidence.headline, profileEvidence.currentLocation, profileEvidence.roles > 0, profileEvidence.skills > 0, Boolean(profileEvidence.totalExperience)].filter(Boolean).length;
    return {
      headline,
      summary,
      currentLocation,
      roles,
      locations,
      skills,
      fullTimeYears,
      internshipYears,
      currentSalary: currentSalaryValues[0] || 0,
      salaryMin: expectedSalaryValues.length ? Math.min(...expectedSalaryValues) : 0,
      salaryMax: expectedSalaryValues.length ? Math.max(...expectedSalaryValues) : 0,
      noticePeriodDays,
      workHistory: history,
      source: "naukri-profile",
      sourceUrl: pageUrl || "",
      capturedAt: capturedAt || new Date().toISOString(),
      diagnostics: { profileEvidence, evidenceCount, readyState: documentRef?.readyState || "unknown" }
    };
  }

  function extractProfile(documentRef, pageUrl, capturedAt) {
    const direct = extractNaukriProfileMap(documentRef, capturedAt);
    const fallback = extractProfileHeuristic(documentRef, pageUrl, capturedAt);
    const directRoles = direct.careerProfile?.preferredJobRoles?.length
      ? direct.careerProfile.preferredJobRoles
      : direct.careerProfile?.jobRole ? [direct.careerProfile.jobRole] : [];
    const directLocations = direct.careerProfile?.preferredWorkLocations?.length
      ? direct.careerProfile.preferredWorkLocations
      : direct.identity?.currentLocation ? [direct.identity.currentLocation] : [];
    const directSkills = unique([
      ...(direct.keySkills || []),
      ...(direct.itSkills || []).flatMap((row) => row.skills || [])
    ]).filter((value) => value && value.length <= 120).slice(0, 100);
    const fullTimeRows = (direct.employment || []).filter((row) => /full[- ]?time/i.test(row.type || ""));
    const internshipRows = (direct.employment || []).filter((row) => /intern/i.test(row.type || ""));
    const sumYears = (rows) => Math.round(rows.reduce((sum, row) => sum + Number(row.durationYears || 0), 0) * 10) / 10;
    const directFullTimeYears = sumYears(fullTimeRows) || ((fullTimeRows.length || !(direct.employment || []).length) ? Number(direct.identity?.experienceYears || 0) : 0);
    const directInternshipYears = sumYears(internshipRows);
    const currentEmployment = (direct.employment || []).find((row) => row.current) || (direct.employment || [])[0] || null;
    const directNotice = Number(direct.identity?.noticePeriodDays || currentEmployment?.noticePeriodDays || 0);
    const preferredSalary = Number(direct.careerProfile?.preferredAnnualSalaryLpa || 0);
    const education = (direct.education || []).map((row) => [row.level, row.specialization, row.institution, row.period, row.mode].filter(Boolean).join(" · "));
    const certifications = (direct.accomplishments?.certifications || []).map((row) => [row.title, row.provider, row.validity].filter(Boolean).join(" · "));
    const result = {
      ...fallback,
      headline: direct.resumeHeadline || fallback.headline || direct.identity?.currentTitle || "",
      summary: direct.sections?.profileSummary?.present ? (direct.profileSummary || "") : (direct.profileSummary || fallback.summary || ""),
      currentLocation: direct.identity?.currentLocation || fallback.currentLocation || "",
      roles: direct.sections?.careerProfile?.present ? unique(directRoles).slice(0, 20) : (directRoles.length ? unique(directRoles).slice(0, 20) : fallback.roles),
      locations: direct.sections?.careerProfile?.present ? unique(directLocations).slice(0, 30) : (directLocations.length ? unique(directLocations).slice(0, 30) : fallback.locations),
      skills: directSkills.length ? directSkills : fallback.skills,
      fullTimeYears: directFullTimeYears || fallback.fullTimeYears || 0,
      internshipYears: directInternshipYears || fallback.internshipYears || 0,
      currentSalary: Number(direct.identity?.currentSalaryLpa || 0) || fallback.currentSalary || 0,
      salaryMin: preferredSalary || fallback.salaryMin || 0,
      salaryMax: preferredSalary || fallback.salaryMax || preferredSalary || 0,
      noticePeriodDays: directNotice || fallback.noticePeriodDays || 0,
      workHistory: (direct.employment || []).length ? direct.employment : fallback.workHistory,
      education: direct.sections?.education?.present ? education : (education.length ? education : (fallback.education || [])),
      certifications: direct.sections?.accomplishments?.present ? certifications : (certifications.length ? certifications : (fallback.certifications || [])),
      naukriProfile: direct,
      source: "naukri-profile",
      sourceUrl: pageUrl || "",
      capturedAt: capturedAt || new Date().toISOString()
    };
    const directPresent = Number(direct.diagnostics?.presentSections || 0);
    const evidence = {
      ...(fallback.diagnostics?.profileEvidence || {}),
      headline: Boolean(result.headline), summary: Boolean(result.summary), currentLocation: Boolean(result.currentLocation),
      preferredRoles: result.roles?.length || 0, preferredLocations: result.locations?.length || 0, roles: result.roles?.length || 0,
      skills: result.skills?.length || 0, workHistory: result.workHistory?.length || 0,
      totalExperience: result.fullTimeYears || result.internshipYears || 0, internshipYears: result.internshipYears || 0,
      noticePeriodDays: result.noticePeriodDays || 0, currentSalary: result.currentSalary || 0, expectedSalary: result.salaryMin || result.salaryMax || 0,
      directPresentSections: directPresent
    };
    result.diagnostics = {
      ...(fallback.diagnostics || {}),
      profileEvidence: evidence,
      evidenceCount: [Boolean(result.headline), Boolean(result.currentLocation), Boolean(result.roles?.length), Boolean(result.skills?.length), Boolean(result.fullTimeYears || result.internshipYears), Boolean(result.workHistory?.length)].filter(Boolean).length,
      directMap: direct.diagnostics || {},
      directMapUsed: directPresent > 0,
      readyState: documentRef?.readyState || "unknown"
    };
    return result;
  }

  function pageMode(pageUrl) {
    let url;
    try { url = new URL(pageUrl); } catch { return "unsupported"; }
    const path = url.pathname.toLowerCase();
    const search = url.search.toLowerCase();
    const hash = url.hash.toLowerCase();
    const full = path + search + hash;

    if (/\/(?:mnjuser\/profile|profile(?:\/view|\/edit)?)(?:[/?#]|$)/i.test(path)) return "profile";
    if (/\/profile\b/i.test(path) && !/profile[-_]?(?:viewers?|visitors?|tracking)/i.test(path)) return "profile";
    if (/\/myapply|\/application|applied-jobs|appliedjobs|\/applications\b/i.test(full)) return "application-history";
    if (/\/job-listings?-|\/job\/|\/job-overview\b/i.test(path)) return "job-detail";
    if (/\/nlogin\//i.test(path)) return "login";
    if (/\/(?:mnjuser|account)\/(?:[^/?#]*(?:activity|history|invite|comment|post|resume[-_]?update|profile[-_]?viewers|tracking)[^/?#]*)(?:[/?#]|$)/i.test(path)) return "account-history";
    if (/(?:recommendedjobs|jobs-in-|[-/]jobs(?:-|$|\?|\/)|jobsearch|search|feed)/i.test(full)) return "search-results";
    if (url.hostname.includes("naukri.com")) return "search-results";
    return "unsupported";
  }

  function isJobUrl(value) {
    return /\/job-listings?-|\/job\/|\/job-overview\b/i.test(String(value || ""));
  }

  function titleLinkFrom(container) {
    if (container && container.matches && container.matches("a[href]") && isJobUrl(container.getAttribute("href"))) return container;
    for (const selector of TITLE_SELECTORS) {
      const candidate = container && container.querySelector ? container.querySelector(selector) : null;
      if (candidate && isJobUrl(candidate.getAttribute?.("href") || candidate.href)) return candidate;
    }
    return null;
  }

  function findContainer(anchor) {
    let node = anchor;
    for (let depth = 0; depth < 9 && node; depth += 1, node = node.parentElement) {
      if (CARD_SELECTORS.some((selector) => node.matches?.(selector))) return node;
      const text = clean(node.innerText || node.textContent);
      if (text.length >= 70 && text.length <= 8000 && /\b(?:yr|year|lpa|location|experience|skills?)\b/i.test(text)) return node;
    }
    return anchor && (anchor.closest?.("article, li") || anchor.parentElement);
  }

  function extractCard(container, pageUrl, capturedAt) {
    const titleLink = titleLinkFrom(container);
    if (!titleLink) return null;
    const title = clean(titleLink.getAttribute?.("title") || titleLink.innerText || titleLink.textContent);
    if (!title || title.length < 3 || title.length > 240) return null;

    const url = absoluteUrl(titleLink.getAttribute?.("href") || titleLink.href, pageUrl);
    if (!url || !isJobUrl(url)) return null;
    const fullText = clean(container.innerText || container.textContent);
    const company = textFrom(container, FIELD_SELECTORS.company) || "Company not listed";
    const location = textFrom(container, FIELD_SELECTORS.location) || "Not listed";
    const experienceText = textFrom(container, FIELD_SELECTORS.experience)
      || firstMatch(fullText, /\b\d+(?:\.\d+)?\s*(?:-|–|—|to)\s*\d+(?:\.\d+)?\s*(?:yrs?|years?)\b/i, "Not listed");
    const salaryText = textFrom(container, FIELD_SELECTORS.salary)
      || firstMatch(fullText, /(?:₹|rs\.?\s*)?\d+(?:\.\d+)?\s*(?:-|–|—|to)\s*\d+(?:\.\d+)?\s*(?:lpa|lakhs?)/i, "Not disclosed");
    const shortDescription = textFrom(container, FIELD_SELECTORS.description).slice(0, 1600);
    const postedText = textFrom(container, FIELD_SELECTORS.posted) || fullText;
    const skills = textsFrom(container, SKILL_SELECTORS);

    return {
      id: stableId(url, title, company),
      title,
      company,
      location,
      experienceText,
      salaryText,
      skills,
      shortDescription,
      description: shortDescription,
      url,
      applyUrl: url,
      source: "naukri-live",
      createdAt: relativeDate(postedText),
      capturedAt: capturedAt || new Date().toISOString(),
      applicants: numberMatch(fullText, /([\d,]+)\s*(?:applicants?|applied)\b/i),
      views: numberMatch(fullText, /([\d,]+)\s+views?\b/i),
      vacancies: numberMatch(fullText, /([\d,]+)\s*(?:openings?|vacancies)\b/i),
      companyApply: /company site|apply on company/i.test(fullText),
      status: "Unreviewed"
    };
  }

  function candidateContainers(documentRef) {
    const containers = [];
    const seen = new Set();
    for (const selector of CARD_SELECTORS) {
      const matches = documentRef.querySelectorAll ? Array.from(documentRef.querySelectorAll(selector)) : [];
      for (const match of matches) {
        if (!seen.has(match)) {
          seen.add(match);
          containers.push(match);
        }
      }
    }
    const anchors = documentRef.querySelectorAll ? Array.from(documentRef.querySelectorAll("a[href]")) : [];
    for (const anchor of anchors.filter((candidate) => isJobUrl(candidate.getAttribute?.("href") || candidate.href))) {
      const container = findContainer(anchor);
      if (container && !seen.has(container)) {
        seen.add(container);
        containers.push(container);
      }
    }
    return containers;
  }

  function dedupeJobs(jobs) {
    const seen = new Set();
    return jobs.filter((job) => {
      const key = job.url
        ? String(job.url).split("?")[0].replace(/\/$/, "").toLowerCase()
        : [job.title, job.company, job.location].map((value) => clean(value).toLowerCase()).join("|");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function extractJobs(documentRef, pageUrl) {
    const capturedAt = new Date().toISOString();
    return dedupeJobs(candidateContainers(documentRef)
      .map((container) => extractCard(container, pageUrl, capturedAt))
      .filter(Boolean));
  }

  function historyEvidence(text) {
    return /\b(?:applied(?:\s+on)?|application(?:\s+status|\s+sent|\s+received)?|recruiter(?:\s+action|\s+viewed)?|profile\s+viewed|under\s+review|not\s+selected|shortlisted|interview|submitted|screening|viewed|status)\b/i.test(clean(text));
  }

  function findHistoryContainer(node) {
    let current = node;
    let fallback = null;
    for (let depth = 0; depth < 10 && current; depth += 1, current = current.parentElement) {
      const text = clean(current.innerText || current.textContent);
      if (text.length < 20 || text.length > 6000) continue;
      if (!fallback && /\b(?:applied|application)\b/i.test(text)) fallback = current;
      if (historyEvidence(text) && /\b(?:company|experience|location|applied|status|job)\b/i.test(text)) return current;
    }
    return fallback;
  }

  function historyContainers(documentRef) {
    const nodes = [];
    const seen = new Set();
    for (const selector of HISTORY_CARD_SELECTORS) {
      const matches = documentRef.querySelectorAll ? Array.from(documentRef.querySelectorAll(selector)) : [];
      for (const node of matches) {
        const text = clean(node.innerText || node.textContent);
        const hasTitle = nodeFrom(node, HISTORY_TITLE_SELECTORS);
        if (hasTitle && text.length >= 20 && text.length <= 6000 && historyEvidence(text) && !seen.has(node)) {
          seen.add(node);
          nodes.push(node);
        }
      }
    }
    const anchors = documentRef.querySelectorAll ? Array.from(documentRef.querySelectorAll("a[href]")) : [];
    for (const anchor of anchors.filter((candidate) => isJobUrl(candidate.getAttribute?.("href") || candidate.href))) {
      const container = findHistoryContainer(anchor);
      if (container && !seen.has(container)) {
        seen.add(container);
        nodes.push(container);
      }
    }
    return nodes.filter((node) => !nodes.some((other) => other !== node && node.contains?.(other) && historyEvidence(other.innerText || other.textContent)));
  }

  function nodeFrom(container, selectors) {
    for (const selector of selectors) {
      const node = container?.querySelector?.(selector);
      if (node) return node;
    }
    return null;
  }

  function applicationState(fullText) {
    const values = [
      [/\bnot selected\b/i, "Not selected"],
      [/\binterview(?:ing| scheduled)?\b/i, "Interview"],
      [/\bshortlisted\b/i, "Shortlisted"],
      [/\b(?:under review|in review)\b/i, "Under review"],
      [/\bprofile viewed\b/i, "Profile viewed"],
      [/\bapplication sent\b/i, "Application sent"],
      [/\bapplied\b/i, "Applied"]
    ];
    return values.find(([pattern]) => pattern.test(fullText))?.[1] || "Applied";
  }

  function appliedDateText(fullText) {
    return firstMatch(fullText, /\bapplied(?:\s+on)?\s*[:\-]?\s*(?:today|yesterday|\d+\s+(?:days?|weeks?|months?)\s+ago|\d{1,2}[\s\/-](?:[a-z]{3,9}|\d{1,2})[\s\/-]\d{2,4})\b/i, "");
  }

  function extractHistoryCard(container, pageUrl, capturedAt) {
    const fullText = clean(container.innerText || container.textContent);
    if (!historyEvidence(fullText)) return null;
    const titleNode = nodeFrom(container, HISTORY_TITLE_SELECTORS);
    const titleLink = titleLinkFrom(container);
    const title = clean(titleLink?.getAttribute?.("title") || titleLink?.innerText || titleLink?.textContent || titleNode?.getAttribute?.("title") || titleNode?.innerText || titleNode?.textContent);
    if (!title || title.length < 3 || title.length > 240 || /^(?:applied|application status|my applications)$/i.test(title)) return null;
    const rawUrl = titleLink?.getAttribute?.("href") || titleLink?.href || titleNode?.getAttribute?.("href") || titleNode?.href || "";
    const url = rawUrl ? absoluteUrl(rawUrl, pageUrl) : "";
    const company = textFrom(container, FIELD_SELECTORS.company) || "Company not listed";
    const location = textFrom(container, FIELD_SELECTORS.location) || "Not listed";
    const experienceText = textFrom(container, FIELD_SELECTORS.experience)
      || firstMatch(fullText, /\b\d+(?:\.\d+)?\s*(?:-|–|—|to)\s*\d+(?:\.\d+)?\s*(?:yrs?|years?)\b/i, "Not listed");
    const salaryText = textFrom(container, FIELD_SELECTORS.salary) || "Not disclosed";
    const dateText = appliedDateText(fullText);
    const dateValue = applicationDate(dateText);
    const appStatus = applicationState(fullText);
    const skills = textsFrom(container, SKILL_SELECTORS);
    const description = textFrom(container, FIELD_SELECTORS.description).slice(0, 1600);
    return {
      id: stableId(url, title, company),
      title,
      company,
      location,
      experienceText,
      salaryText,
      skills,
      shortDescription: description,
      description,
      url,
      applyUrl: url,
      sourcePage: pageUrl,
      source: "naukri-application-history",
      applicationStatus: appStatus,
      appliedAtText: dateText,
      appliedAt: dateValue,
      createdAt: dateValue,
      capturedAt: capturedAt || new Date().toISOString(),
      status: appStatus === "Interview" ? "Interview" : "Applied"
    };
  }

  function extractApplicationHistory(documentRef, pageUrl) {
    const capturedAt = new Date().toISOString();
    return dedupeJobs(historyContainers(documentRef)
      .map((container) => extractHistoryCard(container, pageUrl, capturedAt))
      .filter(Boolean));
  }

  function historyEventType(fullText) {
    const text = clean(fullText);
    const rules = [
      ["application", /\b(?:applied|application sent|application status|my application|job application)\b/i],
      ["invite", /\b(?:invite|invited|recruiter action|recruiter invite|connect request)\b/i],
      ["comment", /\b(?:commented|comment|reply|replied|discussion)\b/i],
      ["post-visit", /\b(?:post visit|visited post|post viewed|viewed post|posts? visited)\b/i],
      ["profile-update", /\b(?:profile (?:update|updated|edit|edited)|(?:updated|edited|update|edit) your profile)\b/i],
      ["resume-update", /\b(?:(?:resume|cv) (?:update|updated|upload|uploaded)|(?:updated|uploaded|update) (?:your )?(?:resume|cv))\b/i],
      ["profile-view", /\b(?:profile viewed|viewed your profile|profile visitors|profile tracking)\b/i],
      ["interview", /\b(?:interview|assessment|screening round)\b/i]
    ];
    return rules.find(([, pattern]) => pattern.test(text))?.[0] || "";
  }

  function historyEventEvidence(text) {
    return /\b(?:applied|application|invite|invited|comment(?:ed)?|reply|replied|post visit|visited post|post viewed|viewed post|posts? visited|profile (?:update|updated|edit|edited|viewed|visitors?|tracking)|(?:updated|edited|update|edit) your profile|(?:resume|cv) (?:update|updated|upload|uploaded)|(?:updated|uploaded|upload) (?:your )?(?:resume|cv)|interview|assessment|screening round)\b/i.test(clean(text));
  }

  function eventDateText(fullText) {
    return firstMatch(fullText, /\b(?:today|yesterday|just now|\d+\+?\s+(?:hours?|days?|weeks?|months?)\s+ago|\d{1,2}[\s\/-](?:[a-z]{3,9}|\d{1,2})[\s\/-]\d{2,4})\b/i, "");
  }

  function historyCandidates(documentRef) {
    const selectors = [
      "[data-activity-id]",
      "[data-event-id]",
      "[data-testid*='activity']",
      "[data-testid*='history']",
      "[class*='activity']",
      "[class*='event']",
      "[class*='history']",
      "[class*='timeline'] li",
      "[class*='notification']",
      "[class*='invite']",
      "[class*='comment']",
      "[class*='resume']",
      "[class*='profile'] li",
      "article",
      "tr",
      "li"
    ];
    const nodes = [];
    const seen = new Set();
    for (const selector of selectors) {
      const matches = documentRef?.querySelectorAll ? Array.from(documentRef.querySelectorAll(selector)) : [];
      for (const node of matches) {
        if (seen.has(node) || !isVisible(node)) continue;
        const text = clean(node.innerText || node.textContent);
        if (text.length < 12 || text.length > 2800 || !historyEventEvidence(text)) continue;
        seen.add(node);
        nodes.push(node);
      }
    }
    return nodes.filter((node) => !nodes.some((other) => other !== node && node.contains?.(other) && historyEventEvidence(other.innerText || other.textContent)));
  }

  function historyEventFromNode(node, pageUrl, capturedAt) {
    const rawText = clean(node?.innerText || node?.textContent);
    const type = historyEventType(rawText);
    if (!type) return null;
    const titleNode = nodeFrom(node, ["h1", "h2", "h3", "h4", "[class*='title']", "[class*='subject']", "a[href]"]);
    const title = clean(titleNode?.getAttribute?.("title") || titleNode?.innerText || titleNode?.textContent);
    const company = profileSafe(textFrom(node, FIELD_SELECTORS.company) || textFrom(node, ["[class*='company']", "[class*='organization']", "[class*='employer']"]));
    const hrefNode = nodeFrom(node, ["a[href]"]);
    const rawHref = hrefNode?.getAttribute?.("href") || hrefNode?.href || "";
    const url = rawHref ? absoluteUrl(rawHref, pageUrl) : "";
    const dateText = eventDateText(rawText);
    const occurredAt = applicationDate(dateText);
    const status = firstMatch(rawText, /\b(?:not selected|shortlisted|under review|profile viewed|application sent|applied|invited|accepted|rejected|scheduled|completed)\b/i, "");
    const fallbackTitle = title && !historyEventType(title) ? title : rawText.split(/\s{2,}|\n/).map(clean).find((value) => value.length > 2 && value.length < 180 && !historyEventType(value)) || "Naukri activity";
    return {
      id: [type, url || fallbackTitle, company, occurredAt || dateText].join("|").toLowerCase().replace(/[^a-z0-9|]+/g, "-").slice(0, 240),
      type,
      title: profileSafe(fallbackTitle),
      company,
      url,
      sourceUrl: pageUrl || "",
      occurredAt,
      occurredAtText: dateText,
      capturedAt: capturedAt || new Date().toISOString(),
      details: profileSafe(rawText).slice(0, 1600),
      status,
      confidence: type === "other" ? 0.55 : 0.82,
      source: "naukri-visible",
      rawText: profileSafe(rawText).slice(0, 2000),
      metadata: { pageMode: pageMode(pageUrl) }
    };
  }

  function applicationEventsFromJobs(jobs, pageUrl, capturedAt) {
    return (jobs || []).map((job) => ({
      id: `application|${job.id || job.url || job.title}|${job.appliedAt || job.createdAt || ""}`.toLowerCase().replace(/[^a-z0-9|]+/g, "-"),
      type: "application",
      title: job.title || "Job application",
      company: job.company || "",
      url: job.url || "",
      sourceUrl: pageUrl || job.sourcePage || "",
      occurredAt: job.appliedAt || job.createdAt || "",
      occurredAtText: job.appliedAtText || "",
      capturedAt: capturedAt || new Date().toISOString(),
      details: [job.applicationStatus, job.location, job.experienceText].filter(Boolean).join(" · "),
      status: job.applicationStatus || job.status || "Applied",
      confidence: 0.94,
      source: "naukri-visible",
      rawText: ""
    }));
  }

  function extractAccountHistory(documentRef, pageUrl) {
    const capturedAt = new Date().toISOString();
    const mode = pageMode(pageUrl);
    const applicationJobs = mode === "application-history" ? extractApplicationHistory(documentRef, pageUrl) : [];
    const events = [
      ...historyCandidates(documentRef).map((node) => historyEventFromNode(node, pageUrl, capturedAt)).filter(Boolean),
      ...applicationEventsFromJobs(applicationJobs, pageUrl, capturedAt)
    ];
    const byId = new Map();
    events.forEach((event) => { if (!byId.has(event.id)) byId.set(event.id, event); });
    const uniqueEvents = Array.from(byId.values());
    const detectedTypes = Array.from(new Set(uniqueEvents.map((event) => event.type)));
    return {
      mode,
      pageMode: mode,
      page: pageUrl || "",
      events: uniqueEvents,
      jobs: applicationJobs,
      surfaces: accountSurfaceLinks(documentRef, pageUrl),
      diagnostics: {
        eventNodes: historyCandidates(documentRef).length,
        events: uniqueEvents.length,
        detectedTypes,
        applicationJobs: applicationJobs.length,
        visibleTextChars: pageText(documentRef).length,
        readyState: documentRef?.readyState || "unknown"
      }
    };
  }

  function extractPage(documentRef, pageUrl) {
    let mode = pageMode(pageUrl);
    let jobs = [];
    if (mode === "application-history") {
      jobs = extractApplicationHistory(documentRef, pageUrl);
      if (!jobs.length) {
        const fallback = extractJobs(documentRef, pageUrl);
        if (fallback.length) {
          jobs = fallback;
          mode = "search-results";
        }
      }
    } else {
      jobs = extractJobs(documentRef, pageUrl);
      if (!jobs.length) {
        const fallback = extractApplicationHistory(documentRef, pageUrl);
        if (fallback.length) {
          jobs = fallback;
          mode = "application-history";
        }
      }
    }
    return { mode, jobs };
  }

  function pageFingerprint(jobs, pageUrl) {
    const keys = (jobs || []).slice(0, 6).map((job) => job.id || job.url || `${job.title}|${job.company}`);
    return [String(pageUrl || "").split("#")[0], ...keys].join("::");
  }

  function isDisabled(node) {
    const className = clean(node?.className);
    return Boolean(node?.disabled)
      || Boolean(node?.hasAttribute?.("disabled"))
      || node?.getAttribute?.("aria-disabled") === "true"
      || /\b(?:disabled|disable)\b/i.test(className);
  }

  function isPrevious(node) {
    if (!node) return false;
    const text = clean(node?.innerText || node?.textContent || node?.getAttribute?.("aria-label") || node?.getAttribute?.("title") || "");
    const className = clean(node?.className || "");
    const rel = node?.getAttribute?.("rel") || "";
    return /^(?:prev|previous|back|‹|«|<)$/i.test(text)
      || /\b(?:prev|previous|back)\b/i.test(text)
      || /\b(?:prev|previous|btn-prev)\b/i.test(className)
      || rel.toLowerCase() === "prev";
  }

  function isExplicitNext(node) {
    if (!node || isDisabled(node) || isPrevious(node)) return false;
    const text = clean(node?.innerText || node?.textContent || node?.getAttribute?.("aria-label") || node?.getAttribute?.("title") || "");
    const aria = clean(node?.getAttribute?.("aria-label") || node?.getAttribute?.("title") || "");
    const rel = node?.getAttribute?.("rel") || "";
    if (rel.toLowerCase() === "next") return true;
    if (/^(?:next|next page|›|»|>)$/i.test(text)) return true;
    if (/\bnext\b/i.test(text) && node.closest?.("[class*='pagination'], [class*='pages'], [class*='styles_pages']")) return true;
    if (/\bnext\b/i.test(aria)) return true;
    return false;
  }

  function findNextNode(documentRef) {
    if (!documentRef) return null;

    // 1. Highest priority: Find candidate by explicit 'Next' label / aria / rel
    const candidates = documentRef.querySelectorAll ? Array.from(documentRef.querySelectorAll("a, button")) : [];
    const explicitNext = candidates.find(isExplicitNext);
    if (explicitNext) return explicitNext;

    // 2. Next: Check targeted NEXT_SELECTORS, strictly skipping any node that is disabled or Previous
    for (const selector of NEXT_SELECTORS) {
      const nodes = documentRef.querySelectorAll ? Array.from(documentRef.querySelectorAll(selector)) : [];
      for (const node of nodes) {
        if (!isDisabled(node) && !isPrevious(node)) return node;
      }
    }

    // 3. Fallback: Check if there's an active page pill and pick the next numbered pill
    const activePill = documentRef.querySelector ? documentRef.querySelector("[class*='styles_pages'] [class*='selected'], [class*='pages'] [class*='active'], [class*='pagination'] [aria-current='page'], [aria-current='page']") : null;
    if (activePill) {
      const activeNum = parseInt(clean(activePill.textContent || activePill.innerText || ""), 10);
      if (Number.isFinite(activeNum)) {
        const nextNum = activeNum + 1;
        const pageLinks = activePill.parentElement?.querySelectorAll ? Array.from(activePill.parentElement.querySelectorAll("a")) : [];
        const nextLink = pageLinks.find((link) => clean(link.textContent || link.innerText || "") === String(nextNum));
        if (nextLink && !isDisabled(nextLink) && !isPrevious(nextLink)) return nextLink;
      }
    }

    return null;
  }

  function nextPage(documentRef, pageUrl) {
    const node = findNextNode(documentRef);
    if (!node) return { exists: false, url: "", mode: "none" };
    const rawHref = node.getAttribute?.("href") || node.href || "";
    const url = rawHref && !/^javascript:/i.test(rawHref) ? absoluteUrl(rawHref, pageUrl) : "";
    return { exists: true, url, mode: url ? "url" : "click" };
  }

  root.NowCurryExtractorCore = {
    CARD_SELECTORS,
    HISTORY_CARD_SELECTORS,
    PROFILE_SELECTORS,
    NAUKRI_PROFILE_SECTION_MAP,
    NAUKRI_ACCOMPLISHMENT_SECTION_MAP,
    clean,
    dedupeJobs,
    extractCard,
    extractJobs,
    extractApplicationHistory,
    extractAccountHistory,
    accountSurfaceLinks,
    extractNaukriProfileMap,
    extractProfile,
    extractPage,
    findNextNode,
    nextPage,
    numberMatch,
    pageFingerprint,
    pageMode,
    sessionState,
    relativeDate,
    applicationDate,
    stableId
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
