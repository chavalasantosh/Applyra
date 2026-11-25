const NOWCURRY_RADAR_VERSION = "2.6.1-security.1";

function radarText(value, max = 4000) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().slice(0, max);
}
function radarSlug(value) { return radarText(value, 300).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function radarHash(value) { let h = 2166136261; for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function radarHttpsUrl(value) { try { const u = new URL(String(value || "")); if (u.protocol !== "https:") return "#"; u.hash = ""; return u.href; } catch { return "#"; } }
function makeFingerprint(job) {
  const company = radarSlug(job.company?.name || job.companyName);
  const title = radarSlug(job.position?.title || job.title);
  const rawLocation = radarSlug(job.location?.display || job.locationText);
  const location = /\b(remote|worldwide|anywhere)\b/.test(rawLocation) ? "remote" : rawLocation;
  return `job_${radarHash(`${company}|${title}|${location}`)}`;
}
function normalizeJob(input = {}) {
  const job = {
    schemaVersion: 1,
    id: radarText(input.id || "", 160),
    fingerprint: "",
    source: {
      id: radarText(input.source?.id || input.source || "applyra", 80),
      label: radarText(input.source?.label || "Applyra Verified Intelligence", 120),
      url: radarHttpsUrl(input.source?.url),
      attributionRequired: Boolean(input.source?.attributionRequired)
    },
    position: {
      title: radarText(input.position?.title || input.title || "Untitled role", 260),
      description: radarText(input.position?.description || input.description || "", 5000),
      employmentType: radarText(input.position?.employmentType || input.employmentType || "", 100),
      category: radarText(input.position?.category || input.category || "", 160)
    },
    company: { name: radarText(input.company?.name || input.companyName || "Enterprise Organization", 220) },
    location: {
      display: radarText(input.location?.display || input.locationText || "", 260),
      remote: Boolean(input.location?.remote ?? input.remote)
    },
    compensation: {
      text: radarText(input.compensation?.text || input.salary || "", 240),
      min: Number(input.compensation?.min || 0) || null,
      max: Number(input.compensation?.max || 0) || null,
      currency: radarText(input.compensation?.currency || "", 12)
    },
    postedAt: input.postedAt ? new Date(input.postedAt).toISOString() : "",
    discoveredAt: new Date().toISOString(),
    url: radarHttpsUrl(input.url),
    intelligence: { matchScore: null, reasons: [], duplicateSources: [] }
  };
  job.fingerprint = input.fingerprint || makeFingerprint(job);
  if (!job.id) job.id = `${job.source.id}_${job.fingerprint}`;
  return job;
}
function dedupeJobs(input = []) {
  const map = new Map();
  for (const raw of input) {
    const job = normalizeJob(raw);
    const existing = map.get(job.fingerprint);
    if (!existing) { map.set(job.fingerprint, job); continue; }
    const sources = new Map([[existing.source.id, existing.source], [job.source.id, job.source]]);
    existing.intelligence.duplicateSources = [...sources.values()];
    if (!existing.compensation.text && job.compensation.text) existing.compensation = job.compensation;
    if ((job.position.description || "").length > (existing.position.description || "").length) existing.position.description = job.position.description;
    if (!existing.postedAt || (job.postedAt && job.postedAt > existing.postedAt)) existing.postedAt = job.postedAt;
  }
  return [...map.values()];
}
function scoreJob(job, profile = {}, query = "") {
  const hay = radarSlug([job.position.title, job.position.description, job.position.category].join(" "));
  const terms = [...new Set([query, ...(profile.roles || []), ...(profile.skills || [])].flatMap(v => radarSlug(v).split(" ")).filter(v => v.length > 2))];
  if (!terms.length) return { score: 50, reasons: ["Calibrated by Applyra Career Engine"] };
  const hits = terms.filter(t => hay.includes(t));
  let score = Math.round(35 + 60 * Math.min(1, hits.length / Math.max(3, Math.min(terms.length, 8))));
  if (job.location.remote) score += 3;
  score = Math.max(0, Math.min(98, score));
  return { score, reasons: hits.slice(0, 5).map(t => `Matches ${t}`) };
}
globalThis.NowCurryRadar = { version: NOWCURRY_RADAR_VERSION, normalizeJob, dedupeJobs, scoreJob, makeFingerprint };
