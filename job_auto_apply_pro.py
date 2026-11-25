#!/usr/bin/env python3
"""JOB AUTO APPLY PRO — one-file desktop application (Windows / macOS / Linux).

Naukri-first job search, scoring, filters, pipeline tracking, selective
auto-apply with verified history, analytics and reports.

Requirements: Python 3.10+ and playwright  (py -m pip install playwright)
              then once:                   (py -m playwright install chromium)

Principles (unchanged from v1, deliberately):
  * Uses YOUR OWN visible browser session. You sign in manually.
  * Never bypasses blocks, CAPTCHAs or access controls. A 403/denied page stops
    the run and tells you so.
  * A button click is never reported as a confirmed application. Only a
    job-specific UI confirmation plus a matching network response is CONFIRMED.
  * Never guesses answers to recruiter questions or ticks consent boxes.
  * Passwords are never stored.

Commands:
  py job_auto_apply_pro.py                  start the desktop app
  py job_auto_apply_pro.py --self-test      run offline tests (no browser)
  py job_auto_apply_pro.py --stats          print pipeline statistics
  py job_auto_apply_pro.py --export-history out.csv
  py job_auto_apply_pro.py --report out.html
  py job_auto_apply_pro.py --backup out.zip
  py job_auto_apply_pro.py --version

NEW in 2.2: removes artificial job/page count limits; persistent one-time
migration of legacy limits; better pagination discovery and duplicate-page guards;
terminal browser shutdown handling; click-pending crash safety; confirmed-only
pipeline advancement and analytics.

NEW in 2.1: resume analyzer (resume score, skills, roles, ATS tips), profile analysis,
resume-fit score per job, resume-fit job list, search suggestions, skill-gap report,
CLI --analyze-resume FILE; faster regex/DB paths.

NEW in 2.0 (highlights):
  match scoring against your skills, persistent job database with "new since
  last scan", favourites / hide / notes / pipeline stages, saved searches,
  company and title blacklists, daily apply limit, dry-run mode, randomised
  polite pacing, retries with backoff, screening-answer rules, dark/light
  theme, sortable columns, quick search, detail pane, analytics tab, follow-up
  reminders, HTML/CSV/JSON export, backups, rotating log file, CLI helpers.
"""
from __future__ import annotations

import os
import shutil
import sys
import atexit

sys.dont_write_bytecode = True
os.environ["PYTHONDONTWRITEBYTECODE"] = "1"

def _purge_pycache():
    try:
        p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "__pycache__")
        if os.path.exists(p):
            shutil.rmtree(p, ignore_errors=True)
    except Exception:
        pass

_purge_pycache()
atexit.register(_purge_pycache)

import argparse
import csv
import html
import json
import logging
import os
import queue
import random
import re
import shutil
import sqlite3
import sys
import threading
import time
import traceback
import zipfile
from collections import Counter
from dataclasses import asdict, dataclass, field, fields
from functools import lru_cache
from datetime import datetime, timedelta, timezone
from logging.handlers import RotatingFileHandler
from pathlib import Path
from urllib.parse import quote_plus, urljoin, urlparse

VERSION = "2.2.0"
APP_TITLE = "Job Auto Apply PRO — Naukri"
HOME = Path(os.environ.get("JOB_AUTO_APPLY_HOME") or (Path.home() / ".job_auto_apply"))
PROFILE_FILE = HOME / "candidate.json"
SETTINGS_FILE = HOME / "settings.json"
DB_FILE = HOME / "history.sqlite3"
LOG_FILE = HOME / "app.log"
BROWSER_DIR = HOME / "browser-profile"
BACKUP_DIR = HOME / "backups"
NAUKRI_HOSTS = {"naukri.com", "www.naukri.com"}
BLOCK_TEXT = ("you don't have permission to access", "errors.edgesuite.net", "access denied")

# Statuses that mean "do not try this job again automatically".
ATTEMPT_STATUSES = (
    "CONFIRMED", "ATTEMPTED", "UI_EVIDENCE_ONLY", "NETWORK_EVIDENCE_ONLY",
    "NEEDS_REVIEW", "ALREADY_APPLIED", "MANUAL_REVIEW", "CLICK_PENDING",
)
PIPELINE_STAGES = ("New", "Saved", "Applied", "Interview", "Offer", "Rejected", "Ignored")

CARD_CSS = ", ".join((
    ".srp-jobtuple-wrapper", ".cust-job-tuple", "article.jobTuple",
    ".jobTuple", "[data-job-id][class*='tuple']", "[class*='jobTuple']",
    "[class*='jobtuple']",
))
import json as _json  # noqa: E402  (kept separate for the JS template below)
JS_EXTRACT = r"""() => {
    const groups = document.querySelectorAll(%s);
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    const items = []; const seen = new Set();
    for (const el of Array.from(groups)) {
        const link = el.querySelector('a.title[href], a[href*="job-listings-"]');
        if (!link || !link.href || seen.has(link.href)) continue;
        const title = clean(link.textContent || link.getAttribute('title'));
        if (!title || title.length < 3) continue;
        seen.add(link.href);
        const txt = sel => clean(el.querySelector(sel)?.textContent);
        const text = clean(el.textContent).slice(0, 1600);
        const tags = Array.from(el.querySelectorAll('.tag-li, .tags-gt li, [class*="tag"] li'))
            .map(x => clean(x.textContent)).filter(Boolean).slice(0, 20);
        items.push({
          id: el.getAttribute('data-job-id') || '',
          title, url: link.href,
          company: txt('.comp-name, .subTitle, .companyName, a.comp-name'),
          location: txt('.locWdth, .location, [class*="locWdth"], [class*="location"]'),
          experience: txt('.expwdth, .experience, [class*="expwdth"]'),
          salary: txt('.sal-wrap, [class*="salary"], [class*="sal-wrap"]'),
          posted: txt('.job-post-day, .type, .postedDate, [class*="posted"]'),
          description: txt('.job-desc, .job-description, [class*="job-description"], [class*="job-desc"]'),
          tags: tags.join(', '),
          snippet: text
        });
    }
    return items;
}""" % _json.dumps(CARD_CSS)

JS_DETAIL = r"""() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    const pick = sels => { for (const s of sels) { const e = document.querySelector(s);
        if (e && clean(e.textContent)) return clean(e.textContent); } return ''; };
    return {
      description: pick(['.styles_JDC__dang-inner-html__h0K4t', '.job-desc', '[class*="dang-inner-html"]', '[class*="job-desc"]', 'section[class*="JDC"]']),
      skills: Array.from(document.querySelectorAll('[class*="chip"] a, .key-skill a, [class*="key-skill"] a, .chip'))
              .map(x => clean(x.textContent)).filter(Boolean).slice(0, 40),
      salary: pick(['[class*="salary"]', '.salary']),
      location: pick(['[class*="location"]', '.location'])
    };
}"""


# --------------------------------------------------------------------------- #
# Logging
# --------------------------------------------------------------------------- #
LOG = logging.getLogger("jobautoapply")


def setup_logging(level: int = logging.INFO) -> None:
    if LOG.handlers:
        return
    LOG.setLevel(level)
    try:
        HOME.mkdir(parents=True, exist_ok=True)
        handler = RotatingFileHandler(str(LOG_FILE), maxBytes=1_000_000, backupCount=3, encoding="utf-8")
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
        LOG.addHandler(handler)
    except OSError:
        LOG.addHandler(logging.NullHandler())


# --------------------------------------------------------------------------- #
# Data models
# --------------------------------------------------------------------------- #
@dataclass
class Job:
    key: str
    title: str
    company: str = ""
    location: str = ""
    experience: str = ""
    salary: str = ""
    posted: str = ""
    description: str = ""
    snippet: str = ""
    tags: str = ""
    job_id: str = ""
    status: str = "Not applied"
    score: int = 0
    stage: str = "New"
    favorite: bool = False
    hidden: bool = False
    note: str = ""
    first_seen: str = ""
    last_seen: str = ""
    is_new: bool = False
    matched: str = ""
    fit: int = 0                      # resume-fit score, set by the resume analyzer
    fit_matched: list = field(default_factory=list)
    fit_missing: list = field(default_factory=list)


@dataclass
class Candidate:
    full_name: str = ""
    email: str = ""
    mobile: str = ""
    resume: str = ""
    years_experience: str = ""
    notice_days: str = ""
    current_ctc_lpa: str = ""
    expected_ctc_lpa: str = ""
    skills: str = ""            # comma separated, used for match scoring
    target_titles: str = ""     # comma separated keywords that should appear in a title
    city_pref: str = ""
    headline: str = ""


@dataclass
class Settings:
    theme: str = "light"                 # light | dark
    daily_limit: int = 0                 # 0 = no application count limit
    delay_min: float = 4.0               # seconds between applications (polite pacing)
    delay_max: float = 9.0
    dry_run: bool = False                # walk the flow but never click Apply
    min_score_to_apply: int = 0          # skip jobs scoring below this
    min_fit_to_apply: int = 0            # skip jobs whose resume-fit is below this
    skip_hidden: bool = True
    skip_external: bool = True             # compatibility setting; external ATS sites are NOT implemented
    nav_retries: int = 2
    nav_timeout_ms: int = 45000
    blacklist_companies: str = ""        # comma separated
    blacklist_title_words: str = "intern, trainee, unpaid"
    followup_days: int = 7
    default_pages: int = 0               # 0 = discover until actual last accessible page
    limits_migrated_v22: bool = True      # old saved defaults are migrated once
    auto_backup: bool = True
    browser: str = "auto"                # auto | brave | chromium
    screening_rules: list = field(default_factory=lambda: [
        {"pattern": r"notice", "answer": "{notice_days}"},
        {"pattern": r"expected.*(ctc|salary)", "answer": "{expected_ctc_lpa}"},
        {"pattern": r"current.*(ctc|salary)", "answer": "{current_ctc_lpa}"},
        {"pattern": r"total.*experience|years.*experience", "answer": "{years_experience}"},
    ])
    saved_searches: list = field(default_factory=list)  # [{name, query, city, experience, days, pages}]


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def today_utc() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def clean_space(s) -> str:
    return re.sub(r"\s+", " ", str(s or "")).strip()


def csv_list(s: str) -> list[str]:
    return [x.strip() for x in re.split(r"[,;\n]", s or "") if x.strip()]


def normalize_title(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (s or "").casefold())


def naukri_url(value: str) -> bool:
    try:
        p = urlparse(value)
        return p.scheme == "https" and p.hostname in NAUKRI_HOSTS
    except (TypeError, ValueError):
        return False


# --------------------------------------------------------------------------- #
# Persistence of settings / candidate
# --------------------------------------------------------------------------- #
def _atomic_write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, path)
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass


def load_candidate(path: Path | None = None) -> Candidate:
    path = path or PROFILE_FILE
    try:
        obj = json.loads(path.read_text(encoding="utf-8"))
        return Candidate(**{f.name: str(obj.get(f.name, "")) for f in fields(Candidate)})
    except (FileNotFoundError, ValueError, TypeError, OSError):
        return Candidate()


def save_candidate(candidate: Candidate, path: Path | None = None) -> None:
    _atomic_write_json(path or PROFILE_FILE, asdict(candidate))


def load_settings(path: Path | None = None) -> Settings:
    path = path or SETTINGS_FILE
    base = Settings()
    try:
        obj = json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, ValueError, OSError):
        return base
    if not isinstance(obj, dict):
        return base
    for f in fields(Settings):
        if f.name not in obj:
            continue
        default = getattr(base, f.name)
        value = obj[f.name]
        try:
            if isinstance(default, bool):
                value = value if isinstance(value, bool) else str(value).strip().lower() in ("true", "1", "yes", "on")
            elif isinstance(default, int):
                value = int(value)
            elif isinstance(default, float):
                value = float(value)
            elif isinstance(default, str):
                value = str(value)
            elif isinstance(default, list):
                value = list(value) if isinstance(value, list) else default
        except (TypeError, ValueError):
            continue
        setattr(base, f.name, value)
    # Old versions silently saved an 8-page limit and a 25-apply daily limit.
    # On the first launch of v2.2, drop those legacy count caps. Afterwards users
    # can explicitly set their own optional numeric limits in Settings.
    if "limits_migrated_v22" not in obj:
        base.default_pages = 0
        base.daily_limit = 0
        base.limits_migrated_v22 = True
        try:
            save_settings(base, path)
        except OSError:
            pass
    return sanitize_settings(base)


def sanitize_settings(s: Settings) -> Settings:
    s.theme = s.theme if s.theme in ("light", "dark") else "light"
    s.daily_limit = max(0, int(s.daily_limit))
    s.delay_min = max(1.0, min(120.0, float(s.delay_min)))
    s.delay_max = max(s.delay_min, min(300.0, float(s.delay_max)))
    s.min_score_to_apply = max(0, min(100, int(s.min_score_to_apply)))
    s.min_fit_to_apply = max(0, min(100, int(s.min_fit_to_apply)))
    s.nav_retries = max(0, min(5, int(s.nav_retries)))
    s.nav_timeout_ms = max(10000, min(120000, int(s.nav_timeout_ms)))
    s.followup_days = max(1, min(90, int(s.followup_days)))
    s.default_pages = max(0, int(s.default_pages))
    if s.browser not in ("auto", "brave", "chromium"):
        s.browser = "auto"
    return s


def save_settings(s: Settings, path: Path | None = None) -> None:
    _atomic_write_json(path or SETTINGS_FILE, asdict(sanitize_settings(s)))


# --------------------------------------------------------------------------- #
# Parsing helpers
# --------------------------------------------------------------------------- #
def job_from_dict(raw: dict, base: str) -> Job | None:
    url = urljoin(base, raw.get("url", ""))
    title = clean_space(raw.get("title", ""))
    if not naukri_url(url) or not title:
        return None
    # Drop tracking query strings so the same job isn't stored twice.
    parsed = urlparse(url)
    url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    m = re.search(r"-(\d{10,})(?:[/?#]|$)", url)
    job_id = str(raw.get("id") or (m.group(1) if m else ""))
    if job_id and not re.fullmatch(r"\d+", job_id):
        job_id = ""
    return Job(
        key=url, title=title[:260], company=clean_space(raw.get("company"))[:180],
        location=clean_space(raw.get("location"))[:260],
        experience=clean_space(raw.get("experience"))[:110],
        salary=clean_space(raw.get("salary"))[:110],
        posted=clean_space(raw.get("posted"))[:100],
        description=clean_space(raw.get("description"))[:2000],
        snippet=clean_space(raw.get("snippet"))[:1800],
        tags=clean_space(raw.get("tags"))[:400], job_id=job_id,
    )


def search_url(query: str, location: str, experience: str = "", days: str = "Any") -> str:
    query = clean_space(query)
    location = clean_space(location)
    if not query:
        raise ValueError("Enter a job title or keyword.")

    def slug(s: str) -> str:
        return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:95]

    path = f"/{slug(query)}-jobs"
    if location:
        path += f"-in-{slug(location)}"
    params = [f"k={quote_plus(query)}"]
    if location:
        params.append(f"l={quote_plus(location)}")
    if str(experience).strip():
        try:
            years = int(str(experience).strip())
        except ValueError:
            raise ValueError("Experience must be a whole number of years.")
        if years < 0 or years > 50:
            raise ValueError("Experience must be 0–50 years.")
        params.append(f"experience={years}")
    day_map = {"24 hours": 1, "3 days": 3, "7 days": 7, "15 days": 15, "30 days": 30}
    if days in day_map:
        params.append(f"jobAge={day_map[days]}")
    return "https://www.naukri.com" + path + "?" + "&".join(params)


def parse_year_range(s: str):
    """Advertised experience range; unknown values return None."""
    t = str(s or "").lower().replace("years", "yrs")
    m = re.search(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(?:yrs|yr|y\b)?", t)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:yrs|yr)\b", t)
    if m:
        return 0.0, float(m.group(1))
    return None


def parse_salary_range_lpa(s: str):
    """Return (low, high) in LPA, or None if the salary is undisclosed/unparseable."""
    t = str(s or "").lower().replace(",", "")
    if not t or "not disclosed" in t:
        return None
    m = re.search(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lacs?|l\b)", t)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lacs?)\b", t)
    if m:
        v = float(m.group(1))
        return v, v
    return None


def parse_salary_min_lpa(s: str) -> float | None:
    r = parse_salary_range_lpa(s)
    return r[0] if r else None


def parse_posted_days(s: str) -> float | None:
    """'3 Days Ago' -> 3, 'Just Now' / 'Today' -> 0, '30+ Days Ago' -> 30, unknown -> None."""
    t = str(s or "").lower()
    if not t:
        return None
    if any(w in t for w in ("just now", "today", "few hours", "hour")):
        return 0.0
    m = re.search(r"(\d+)\+?\s*day", t)
    if m:
        return float(m.group(1))
    m = re.search(r"(\d+)\+?\s*week", t)
    if m:
        return float(m.group(1)) * 7
    m = re.search(r"(\d+)\+?\s*month", t)
    if m:
        return float(m.group(1)) * 30
    return None


# --------------------------------------------------------------------------- #
# Scoring, filtering, screening answers
# --------------------------------------------------------------------------- #
@lru_cache(maxsize=4096)
def _needle_re(needle: str):
    if re.fullmatch(r"[a-z0-9+#.\- ]+", needle):
        return re.compile(r"(?<![a-z0-9])" + re.escape(needle) + r"(?![a-z0-9])")
    return None


def _word_in(haystack: str, needle: str) -> bool:
    needle = needle.strip().casefold()
    if not needle:
        return False
    rx = _needle_re(needle)
    if rx is not None:
        return rx.search(haystack) is not None
    return needle in haystack


def score_job(job: Job, candidate: Candidate) -> tuple[int, list[str]]:
    """0–100 relevance score. Missing information is neutral, never penalised hard.

    60 pts skill overlap, 25 pts title keyword hit, 15 pts experience fit.
    With no skills configured, the skill share is neutral (30).
    """
    haystack = f"{job.title} {job.tags} {job.description} {job.snippet}".casefold()
    skills = csv_list(candidate.skills)
    matched = [s for s in skills if _word_in(haystack, s)]
    if skills:
        skill_pts = 60.0 * len(matched) / len(skills)
    else:
        skill_pts = 30.0
    titles = csv_list(candidate.target_titles)
    if titles:
        title_pts = 25.0 if any(_word_in(job.title.casefold(), t) for t in titles) else 0.0
    else:
        title_pts = 12.5
    exp_pts = 7.5
    rng = parse_year_range(job.experience)
    try:
        years = float(candidate.years_experience) if candidate.years_experience else None
    except ValueError:
        years = None
    if rng and years is not None:
        lo, hi = rng
        if lo <= years <= hi:
            exp_pts = 15.0
        else:
            gap = min(abs(years - lo), abs(years - hi))
            exp_pts = max(0.0, 15.0 - 5.0 * gap)
    total = int(round(min(100.0, skill_pts + title_pts + exp_pts)))
    return total, matched


def matches_filters(job: Job, f: dict, settings: Settings | None = None) -> bool:
    """Unknown fields stay visible; missing salary/work-mode data is never invented."""
    if job.hidden and not f.get("show_hidden"):
        return False
    if f.get("favorites_only") and not job.favorite:
        return False
    if f.get("new_only") and not job.is_new:
        return False
    stage = f.get("stage")
    if stage and stage != "Any" and job.stage != stage:
        return False
    q = (f.get("quick") or "").strip().casefold()
    if q:
        blob = f"{job.title} {job.company} {job.location} {job.tags} {job.note}".casefold()
        if not all(part in blob for part in q.split()):
            return False
    if f.get("company") and f["company"].lower() not in job.company.lower():
        return False
    for bad in csv_list(f.get("exclude", "")):
        if bad.lower() in job.company.lower():
            return False
    for bad in csv_list(f.get("exclude_title", "")):
        if bad.lower() in job.title.lower():
            return False
    if f.get("location") and f["location"].lower() not in job.location.lower():
        return False
    if f.get("skill"):
        haystack = f"{job.title} {job.tags} {job.description} {job.snippet}".casefold()
        if not all(_word_in(haystack, w) for w in csv_list(f["skill"])):
            return False
    if f.get("mode") and f["mode"] != "Any":
        words = f"{job.location} {job.snippet}".casefold()
        tokens = {"Remote": ("remote", "work from home", "wfh"),
                  "Hybrid": ("hybrid",),
                  "On-site": ("on-site", "onsite", "work from office", "wfo")}[f["mode"]]
        if not any(token in words for token in tokens):
            return False
    if f.get("min_salary"):
        rng = parse_salary_range_lpa(job.salary)
        if rng is not None and rng[1] < float(f["min_salary"]):
            return False
    if f.get("candidate_years"):
        rng = parse_year_range(job.experience)
        years = float(f["candidate_years"])
        if rng and not rng[0] <= years <= rng[1]:
            return False
    if f.get("min_score"):
        if job.score < int(f["min_score"]):
            return False
    if f.get("min_fit"):
        if job.fit < int(f["min_fit"]):
            return False
    if f.get("max_age_days"):
        age = parse_posted_days(job.posted)
        if age is not None and age > float(f["max_age_days"]):
            return False
    return True


def blacklisted(job: Job, settings: Settings) -> str:
    """Return a reason string if the job should never be auto-applied to."""
    for bad in csv_list(settings.blacklist_companies):
        if bad.lower() in job.company.lower():
            return f"Company blacklisted ({bad})"
    for bad in csv_list(settings.blacklist_title_words):
        if _word_in(job.title.casefold(), bad):
            return f"Title contains blacklisted word ({bad})"
    return ""


class _SafeDict(dict):
    def __missing__(self, key):
        return ""


def screening_answer(label: str, rules: list, candidate: Candidate) -> str:
    """First matching user rule wins. Returns '' when no rule or the value is empty."""
    text = clean_space(label).lower()
    values = asdict(candidate)
    for rule in rules or []:
        try:
            if re.search(str(rule.get("pattern", "")), text, re.I):
                answer = str(rule.get("answer", "")).format_map(_SafeDict(values))
                return clean_space(answer)
        except (re.error, ValueError, KeyError, AttributeError, IndexError):
            continue
    return ""


def sort_key(job: Job, column: str):
    if column == "score":
        return job.score
    if column == "fit":
        return job.fit
    if column == "posted":
        age = parse_posted_days(job.posted)
        return 9999 if age is None else age
    if column == "salary":
        r = parse_salary_range_lpa(job.salary)
        return -1.0 if r is None else r[1]
    if column == "exp":
        r = parse_year_range(job.experience)
        return -1.0 if r is None else r[0]
    return str(getattr(job, {"title": "title", "company": "company", "location": "location",
                             "status": "status", "stage": "stage"}.get(column, "title"), "")).casefold()


def duplicate_groups(jobs: list[Job]) -> dict[str, list[Job]]:
    """Group jobs that look like the same posting (same title + company)."""
    groups: dict[str, list[Job]] = {}
    for job in jobs:
        k = normalize_title(job.title) + "|" + normalize_title(job.company)
        groups.setdefault(k, []).append(job)
    return {k: v for k, v in groups.items() if len(v) > 1}


# --------------------------------------------------------------------------- #
# Browser helpers
# --------------------------------------------------------------------------- #
def blocked(page, response=None) -> bool:
    if response is not None and response.status in (401, 403, 429):
        return True
    try:
        t = clean_space(page.locator("body").inner_text(timeout=3000))[:6500].lower()
        title = page.title().lower()
        return any(mark in t for mark in BLOCK_TEXT) or title == "access denied"
    except Exception:
        return False


def network_confirmation(responses: list, job_id: str) -> str:
    """Require the exact job id and a saveApply response with result code 200."""
    if not job_id:
        return ""
    for response in responses:
        try:
            if "/myapply/saveApply" not in response.url or response.status < 200 or response.status >= 300:
                continue
            body = response.text()
            request_body = response.request.post_data or ""
            if job_id not in request_body and job_id not in body:
                continue
            payload = json.loads(body)
            if isinstance(payload, dict):
                result = payload.get("multiApplyResp")
                if isinstance(result, str):
                    result = json.loads(result)
                if isinstance(result, dict) and str(result.get(job_id)) == "200":
                    return "Matching saveApply response for job " + job_id
            if re.search(r'["\']?' + re.escape(job_id) + r'["\']?\s*:\s*200\b', body):
                return "Matching saveApply response for job " + job_id
        except Exception:
            continue
    return ""


def ui_confirmation(page, job: Job) -> str:
    """Require job-specific UI evidence. A generic 'Apply' label isn't proof."""
    try:
        title = page.title().lower()
        if "apply confirmation" in title:
            fields_ = page.locator(".applied-job-content .job-title, .job-title-text .job-title, "
                                   ".applied-job-content h1, .applied-job-content h2")
            for i in range(min(fields_.count(), 8)):
                shown = clean_space(fields_.nth(i).inner_text(timeout=1200))
                if normalize_title(shown) == normalize_title(job.title):
                    return "Apply Confirmation page matches exact job title"
    except Exception:
        pass
    return ""


def brave_executable() -> str | None:
    candidates: list[Path] = []
    for key in ("PROGRAMFILES", "PROGRAMFILES(X86)", "LOCALAPPDATA"):
        root = os.environ.get(key)
        if root:
            candidates.append(Path(root) / "BraveSoftware" / "Brave-Browser" / "Application" / "brave.exe")
    candidates.append(Path("/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"))
    for name in ("brave-browser", "brave"):
        found = shutil.which(name)
        if found:
            candidates.append(Path(found))
    for p in candidates:
        try:
            if p.exists():
                return str(p)
        except OSError:
            continue
    return None


# --------------------------------------------------------------------------- #
# Database
# --------------------------------------------------------------------------- #
SCHEMA = """
CREATE TABLE IF NOT EXISTS application_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_url TEXT NOT NULL,
  job_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  evidence TEXT NOT NULL DEFAULT '',
  timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS hist_job_url ON application_history(job_url);
CREATE INDEX IF NOT EXISTS hist_time ON application_history(timestamp);
CREATE TABLE IF NOT EXISTS jobs (
  url TEXT PRIMARY KEY,
  job_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  experience TEXT NOT NULL DEFAULT '',
  salary TEXT NOT NULL DEFAULT '',
  posted TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  snippet TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL DEFAULT 0,
  matched TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'New',
  favorite INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS jobs_stage ON jobs(stage);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
"""


class History:
    """SQLite store. Name kept from v1; now also holds discovered jobs."""

    def __init__(self, path: Path = DB_FILE):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(str(self.path), check_same_thread=False)
        self.lock = threading.RLock()
        with self.lock:
            self.connection.execute("PRAGMA journal_mode=WAL")
            self.connection.execute("PRAGMA busy_timeout=5000")
            self.connection.executescript(SCHEMA)
            self.connection.commit()

    # ----- history ------------------------------------------------------- #
    def add(self, job: Job, status: str, evidence: str) -> None:
        with self.lock:
            self.connection.execute(
                "INSERT INTO application_history(job_url,job_id,title,company,status,evidence,timestamp) "
                "VALUES (?,?,?,?,?,?,?)",
                (job.key, job.job_id, job.title, job.company, status, evidence[:1000], utcnow()))
            if status == "CONFIRMED":
                self.connection.execute(
                    "UPDATE jobs SET stage='Applied' WHERE url=? AND stage IN ('New','Saved')", (job.key,))
            self.connection.commit()

    def already_attempted(self, job: Job) -> bool:
        marks = ",".join("?" for _ in ATTEMPT_STATUSES)
        with self.lock:
            row = self.connection.execute(
                f"SELECT 1 FROM application_history WHERE (job_url=? OR (job_id != '' AND job_id=?)) "
                f"AND status IN ({marks}) LIMIT 1",
                (job.key, job.job_id, *ATTEMPT_STATUSES)).fetchone()
        return bool(row)

    def list(self, limit: int | None = None):
        """Return all history unless the caller explicitly requests a page limit."""
        with self.lock:
            sql = ("SELECT timestamp,title,company,status,evidence,job_url FROM application_history "
                   "ORDER BY id DESC")
            if limit is None:
                return self.connection.execute(sql).fetchall()
            return self.connection.execute(sql + " LIMIT ?", (max(0, int(limit)),)).fetchall()

    def attempts_today(self) -> int:
        """Real attempts (button clicked) made on today's UTC date."""
        with self.lock:
            row = self.connection.execute(
                "SELECT COUNT(DISTINCT job_url) FROM application_history "
                "WHERE status IN ('ATTEMPTED','CLICK_PENDING') AND substr(timestamp,1,10)=?", (today_utc(),)).fetchone()
        return int(row[0] or 0)

    def status_counts(self) -> Counter:
        with self.lock:
            # Count each job's latest outcome, not every intermediate CLICK_PENDING
            # / ATTEMPTED event as a separate application.
            rows = self.connection.execute(
                "SELECT status, COUNT(*) FROM application_history WHERE id IN "
                "(SELECT MAX(id) FROM application_history GROUP BY job_url) "
                "GROUP BY status").fetchall()
        return Counter({r[0]: r[1] for r in rows})

    def per_day(self, days: int = 30) -> list[tuple[str, int]]:
        since = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
        with self.lock:
            rows = self.connection.execute(
                "SELECT substr(timestamp,1,10) d, COUNT(*) FROM application_history "
                "WHERE status='CONFIRMED' AND d>=? "
                "GROUP BY d ORDER BY d", (since,)).fetchall()
        return [(r[0], int(r[1])) for r in rows]

    def top_companies(self, limit: int = 10) -> list[tuple[str, int]]:
        with self.lock:
            rows = self.connection.execute(
                "SELECT company, COUNT(*) c FROM application_history "
                "WHERE company != '' AND status='CONFIRMED' "
                "GROUP BY company ORDER BY c DESC, company LIMIT ?", (limit,)).fetchall()
        return [(r[0], int(r[1])) for r in rows]

    # ----- jobs ---------------------------------------------------------- #
    def upsert_jobs(self, jobs: list[Job]) -> int:
        """Insert/refresh discovered jobs, preserving user data. Returns count of new jobs."""
        now = utcnow()
        new = 0
        with self.lock:
            for job in jobs:
                row = self.connection.execute(
                    "SELECT first_seen,stage,favorite,hidden,note FROM jobs WHERE url=?", (job.key,)).fetchone()
                if row is None:
                    new += 1
                    job.is_new = True
                    job.first_seen = job.last_seen = now
                    self.connection.execute(
                        "INSERT INTO jobs(url,job_id,title,company,location,experience,salary,posted,"
                        "description,snippet,tags,score,matched,stage,favorite,hidden,note,first_seen,last_seen) "
                        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        (job.key, job.job_id, job.title, job.company, job.location, job.experience,
                         job.salary, job.posted, job.description, job.snippet, job.tags, job.score,
                         job.matched, job.stage, int(job.favorite), int(job.hidden), job.note, now, now))
                else:
                    job.is_new = False
                    job.first_seen, job.stage = row[0], row[1]
                    job.favorite, job.hidden, job.note = bool(row[2]), bool(row[3]), row[4]
                    job.last_seen = now
                    self.connection.execute(
                        "UPDATE jobs SET job_id=?,title=?,company=?,location=?,experience=?,salary=?,posted=?,"
                        "description=CASE WHEN length(?)>length(description) THEN ? ELSE description END,"
                        "snippet=?,tags=?,score=?,matched=?,last_seen=? WHERE url=?",
                        (job.job_id, job.title, job.company, job.location, job.experience, job.salary,
                         job.posted, job.description, job.description, job.snippet, job.tags, job.score,
                         job.matched, now, job.key))
            self.connection.commit()
        return new

    def _row_to_job(self, r) -> Job:
        return Job(key=r[0], job_id=r[1], title=r[2], company=r[3], location=r[4], experience=r[5],
                   salary=r[6], posted=r[7], description=r[8], snippet=r[9], tags=r[10], score=r[11],
                   matched=r[12], stage=r[13], favorite=bool(r[14]), hidden=bool(r[15]), note=r[16],
                   first_seen=r[17], last_seen=r[18])

    def load_jobs(self, limit: int | None = None) -> list[Job]:
        with self.lock:
            sql = ("SELECT url,job_id,title,company,location,experience,salary,posted,description,snippet,"
                   "tags,score,matched,stage,favorite,hidden,note,first_seen,last_seen FROM jobs "
                   "ORDER BY last_seen DESC, score DESC")
            if limit is None:
                rows = self.connection.execute(sql).fetchall()
            else:
                rows = self.connection.execute(sql + " LIMIT ?", (max(0, int(limit)),)).fetchall()
        jobs = [self._row_to_job(r) for r in rows]
        statuses = self.latest_statuses()
        for job in jobs:
            job.status = statuses.get(job.key, "Not applied")
        return jobs

    def latest_statuses(self) -> dict[str, str]:
        """One query instead of one per job."""
        with self.lock:
            rows = self.connection.execute(
                "SELECT job_url, status FROM application_history WHERE id IN "
                "(SELECT MAX(id) FROM application_history GROUP BY job_url)").fetchall()
        return {u: st for u, st in rows}

    def latest_status(self, url: str) -> str:
        with self.lock:
            row = self.connection.execute(
                "SELECT status FROM application_history WHERE job_url=? ORDER BY id DESC LIMIT 1",
                (url,)).fetchone()
        return row[0] if row else "Not applied"

    def update_job(self, url: str, **cols) -> None:
        allowed = {"stage", "favorite", "hidden", "note", "description", "score", "matched"}
        cols = {k: v for k, v in cols.items() if k in allowed}
        if not cols:
            return
        sets = ",".join(f"{k}=?" for k in cols)
        vals = [int(v) if isinstance(v, bool) else v for v in cols.values()]
        with self.lock:
            self.connection.execute(f"UPDATE jobs SET {sets} WHERE url=?", (*vals, url))
            self.connection.commit()

    def purge_old_jobs(self, days: int = 60) -> int:
        """Remove old, untouched jobs (not favourites, not applied, no notes)."""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat(timespec="seconds")
        with self.lock:
            cur = self.connection.execute(
                "DELETE FROM jobs WHERE last_seen<? AND favorite=0 AND note='' AND stage IN ('New','Ignored')"
                " AND url NOT IN (SELECT job_url FROM application_history)", (cutoff,))
            self.connection.commit()
            return cur.rowcount

    def followups_due(self, days: int) -> list[tuple[str, str, str, str]]:
        """Applied jobs older than N days with no stage progress: (title, company, applied_on, url)."""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat(timespec="seconds")
        with self.lock:
            rows = self.connection.execute(
                "SELECT h.title,h.company,substr(h.timestamp,1,10),h.job_url FROM application_history h "
                "JOIN jobs j ON j.url=h.job_url WHERE h.status='CONFIRMED' AND h.timestamp<? "
                "AND j.stage='Applied' GROUP BY h.job_url ORDER BY h.timestamp", (cutoff,)).fetchall()
        return [tuple(r) for r in rows]

    # ----- meta ---------------------------------------------------------- #
    def get_meta(self, key: str, default: str = "") -> str:
        with self.lock:
            row = self.connection.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
        return row[0] if row else default

    def set_meta(self, key: str, value: str) -> None:
        with self.lock:
            self.connection.execute(
                "INSERT INTO meta(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                (key, value))
            self.connection.commit()

    # ----- backup -------------------------------------------------------- #
    def backup_to(self, target: Path) -> Path:
        target = Path(target)
        target.parent.mkdir(parents=True, exist_ok=True)
        tmp_db = target.with_suffix(".db.tmp")
        with self.lock:
            dest = sqlite3.connect(str(tmp_db))
            try:
                self.connection.backup(dest)
            finally:
                dest.close()
        with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.write(tmp_db, "history.sqlite3")
            for extra in (SETTINGS_FILE, PROFILE_FILE):
                if extra.exists():
                    zf.write(extra, extra.name)
        tmp_db.unlink(missing_ok=True)
        return target

    def close(self) -> None:
        with self.lock:
            try:
                self.connection.close()
            except sqlite3.Error:
                pass


def auto_backup(store: History, keep: int = 7) -> Path | None:
    """One backup per day; keeps the newest `keep` archives."""
    try:
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        target = BACKUP_DIR / f"backup-{today_utc()}.zip"
        if target.exists():
            return None
        store.backup_to(target)
        for old in sorted(BACKUP_DIR.glob("backup-*.zip"))[:-keep]:
            old.unlink(missing_ok=True)
        return target
    except (OSError, sqlite3.Error) as exc:
        LOG.warning("auto-backup failed: %s", exc)
        return None


# --------------------------------------------------------------------------- #
# Reports and exports
# --------------------------------------------------------------------------- #
def text_bar(value: int, maximum: int, width: int = 30) -> str:
    if maximum <= 0:
        return ""
    return "█" * max(1 if value else 0, int(round(width * value / maximum)))


def stats_text(store: History) -> str:
    counts = store.status_counts()
    jobs = store.load_jobs()
    lines = [f"Job Auto Apply PRO {VERSION} — statistics", "=" * 48]
    confirmed = counts.get("CONFIRMED", 0)
    partial = counts.get("UI_EVIDENCE_ONLY", 0) + counts.get("NETWORK_EVIDENCE_ONLY", 0)
    lines.append(f"Discovered jobs stored : {len(jobs)}")
    lines.append(f"Favourites             : {sum(1 for j in jobs if j.favorite)}")
    lines.append(f"Confirmed applications : {confirmed}")
    lines.append(f"Partial evidence       : {partial}")
    lines.append(f"Attempts today         : {store.attempts_today()}")
    lines.append("")
    lines.append("Result breakdown")
    top = max(counts.values(), default=0)
    for status, n in counts.most_common():
        lines.append(f"  {status:<24}{n:>5}  {text_bar(n, top)}")
    stage_counts = Counter(j.stage for j in jobs)
    lines.append("")
    lines.append("Pipeline stages")
    top = max(stage_counts.values(), default=0)
    for stage in PIPELINE_STAGES:
        n = stage_counts.get(stage, 0)
        lines.append(f"  {stage:<12}{n:>5}  {text_bar(n, top)}")
    per_day = store.per_day(14)
    if per_day:
        lines.append("")
        lines.append("Applications per day (last 14 days)")
        top = max(n for _, n in per_day)
        for d, n in per_day:
            lines.append(f"  {d}  {n:>3}  {text_bar(n, top)}")
    companies = store.top_companies(8)
    if companies:
        lines.append("")
        lines.append("Top companies applied to")
        for name, n in companies:
            lines.append(f"  {name[:34]:<36}{n:>3}")
    return "\n".join(lines)


def history_report_html(store: History) -> str:
    rows = store.list()
    counts = store.status_counts()
    esc = html.escape
    badge = {"CONFIRMED": "#1e8e3e", "UI_EVIDENCE_ONLY": "#b06000", "NETWORK_EVIDENCE_ONLY": "#b06000",
             "BLOCKED": "#c5221f", "ERROR": "#c5221f", "NEEDS_REVIEW": "#8430ce"}
    body = []
    for ts, title, company, status, evidence, url in rows:
        color = badge.get(status, "#5f6368")
        body.append(
            f"<tr><td>{esc(ts)}</td><td><a href='{esc(url)}'>{esc(title)}</a></td><td>{esc(company)}</td>"
            f"<td><span class='b' style='background:{color}'>{esc(status)}</span></td><td>{esc(evidence)}</td></tr>")
    summary = " · ".join(f"{esc(k)}: {v}" for k, v in counts.most_common())
    return (
        "<!doctype html><html><head><meta charset='utf-8'><title>Application report</title><style>"
        "body{font-family:Segoe UI,Arial,sans-serif;margin:30px;color:#202124}"
        "table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #e0e0e0;padding:7px 9px;text-align:left;font-size:13px}"
        "th{background:#f1f3f4}.b{color:#fff;padding:2px 8px;border-radius:10px;font-size:11px}"
        "</style></head><body><h1>Job Auto Apply PRO — report</h1>"
        f"<p>Generated {esc(utcnow())} UTC</p><p>{summary}</p>"
        "<table><tr><th>Time (UTC)</th><th>Job</th><th>Company</th><th>Status</th><th>Evidence</th></tr>"
        + "".join(body) + "</table></body></html>")


def write_csv(path: str, headers: list[str], rows) -> None:
    with open(path, "w", newline="", encoding="utf-8-sig") as out:
        writer = csv.writer(out)
        writer.writerow(headers)
        writer.writerows(rows)


def jobs_to_json(jobs: list[Job]) -> str:
    return json.dumps([asdict(j) for j in jobs], indent=2, ensure_ascii=False)


# --------------------------------------------------------------------------- #
# Resume analyzer: extraction, skills, resume & profile analysis, fit, suggestions
# --------------------------------------------------------------------------- #
class ResumeError(Exception):
    """Raised when a resume file cannot be read into text."""


# canonical name: aliases (pipe separated). Matching is case-insensitive and
# boundary-aware, so "java" never matches inside "javascript".
_SKILL_SPEC = """
python: python3
java: core java|java 8|java 11|java 17
javascript: js|es6|ecmascript
typescript:
c++: cpp
c#: csharp|c sharp
golang: go lang|go programming
rust:
kotlin:
swift:
php:
ruby:
scala:
r programming: r language
matlab:
bash: shell scripting|shell script
powershell:
sql: t-sql|tsql|pl/sql|plsql
html: html5
css: css3
sass: scss
react: react.js|reactjs|react js
angular: angularjs|angular.js
vue: vue.js|vuejs
next.js: nextjs
node.js: nodejs|node js
express.js: expressjs
django:
flask:
fastapi:
spring boot: springboot
spring framework: spring mvc|spring core
hibernate:
.net: dotnet|.net core|asp.net
laravel:
rails: ruby on rails
graphql:
rest api: restful|rest apis|restful api|restful apis
microservices: microservice
grpc:
tailwind: tailwindcss|tailwind css
bootstrap:
jquery:
redux:
webpack:
mysql:
postgresql: postgres
mongodb: mongo
redis:
sqlite:
oracle:
sql server: mssql|ms sql
elasticsearch: elastic search
cassandra:
dynamodb:
snowflake:
bigquery:
kafka: apache kafka
rabbitmq:
spark: apache spark|pyspark
hadoop:
airflow: apache airflow
dbt:
etl:
data warehousing: data warehouse
pandas:
numpy:
scipy:
matplotlib:
seaborn:
scikit-learn: sklearn|scikit learn
tensorflow:
keras:
pytorch:
machine learning: ml
deep learning:
nlp: natural language processing
computer vision: opencv
llm: llms|large language models|large language model
generative ai: genai|gen ai
transformers: huggingface|hugging face
langchain:
rag: retrieval augmented generation
data analysis: data analytics
data visualization: data visualisation
statistics: statistical analysis
power bi: powerbi
tableau:
excel: ms excel|advanced excel
looker:
aws: amazon web services
azure: microsoft azure
gcp: google cloud|google cloud platform
docker:
kubernetes: k8s
terraform:
ansible:
jenkins:
ci/cd: cicd|ci cd|continuous integration
github actions:
gitlab ci:
linux: unix
nginx:
git: github|gitlab|bitbucket
jira:
agile: scrum|kanban
selenium:
cypress:
playwright:
pytest:
junit:
postman:
test automation: automation testing|automated testing
manual testing:
api testing:
android: android development
ios: ios development
flutter:
react native:
firebase:
oauth: oauth2
jwt:
cybersecurity: information security|infosec
penetration testing: pentesting|pen testing
siem:
networking: tcp/ip
salesforce:
sap:
service now: servicenow
figma:
ui/ux: ux design|ui design
photoshop:
blockchain:
solidity:
web scraping: scraping|beautifulsoup|scrapy
celery:
multithreading: concurrency|multiprocessing
object oriented programming: oop|oops
data structures: dsa|algorithms
system design:
unit testing:
tdd: test driven development
communication skills:
leadership:
problem solving:
project management: pmp
business analysis: requirement gathering
"""


def _build_skill_index() -> tuple[dict[str, str], "re.Pattern[str]"]:
    alias_to_canon: dict[str, str] = {}
    for line in _SKILL_SPEC.strip().splitlines():
        name, _, aliases = line.partition(":")
        name = name.strip().lower()
        alias_to_canon[name] = name
        for a in aliases.split("|"):
            a = a.strip().lower()
            if a:
                alias_to_canon[a] = name
    # Longest first so "spring boot" wins over "spring".
    ordered = sorted(alias_to_canon, key=len, reverse=True)
    pattern = re.compile(
        r"(?<![A-Za-z0-9+#.])(" + "|".join(re.escape(a) for a in ordered) + r")(?![A-Za-z0-9+#])",
        re.I)
    return alias_to_canon, pattern


SKILL_ALIASES, SKILL_RE = _build_skill_index()
KNOWN_SKILLS = frozenset(SKILL_ALIASES.values())
SOFT_SKILLS = frozenset({"communication skills", "leadership", "problem solving", "agile", "project management"})


def extract_skills(text: str) -> Counter:
    """Canonical skill -> mention count. One compiled regex pass over the text."""
    found: Counter = Counter()
    for m in SKILL_RE.finditer(text or ""):
        canon = SKILL_ALIASES.get(m.group(1).lower())
        if canon:
            found[canon] += 1
    return found


# role name -> (title keywords, core skills)
ROLE_PROFILES: dict[str, tuple[tuple[str, ...], tuple[str, ...]]] = {
    "Python Developer": (("python",), ("python", "django", "flask", "fastapi", "sql", "git", "rest api")),
    "Backend Developer": (("backend", "back end", "back-end"), ("rest api", "sql", "microservices", "docker", "git", "redis")),
    "Full Stack Developer": (("full stack", "fullstack", "full-stack"), ("javascript", "react", "node.js", "sql", "html", "css")),
    "Frontend Developer": (("frontend", "front end", "front-end", "ui developer"), ("javascript", "react", "html", "css", "typescript")),
    "Java Developer": (("java",), ("java", "spring boot", "hibernate", "sql", "microservices", "rest api")),
    ".NET Developer": ((".net", "dotnet", "c#"), (".net", "c#", "sql server", "rest api", "azure")),
    "Data Analyst": (("data analyst", "analyst"), ("sql", "excel", "power bi", "tableau", "python", "data analysis")),
    "Data Scientist": (("data scientist",), ("python", "machine learning", "pandas", "scikit-learn", "statistics", "sql")),
    "Machine Learning Engineer": (("machine learning", "ml engineer", "ai engineer"), ("python", "machine learning", "tensorflow", "pytorch", "deep learning", "docker")),
    "NLP Engineer": (("nlp", "language"), ("python", "nlp", "transformers", "pytorch", "llm", "machine learning")),
    "Generative AI Engineer": (("generative", "genai", "llm", "ai engineer"), ("llm", "generative ai", "langchain", "rag", "python", "transformers")),
    "Data Engineer": (("data engineer",), ("python", "sql", "spark", "airflow", "etl", "aws", "kafka")),
    "DevOps Engineer": (("devops", "sre", "site reliability"), ("docker", "kubernetes", "ci/cd", "terraform", "aws", "linux", "jenkins")),
    "Cloud Engineer": (("cloud",), ("aws", "azure", "gcp", "terraform", "linux", "docker")),
    "Android Developer": (("android",), ("android", "kotlin", "java", "firebase", "rest api")),
    "iOS Developer": (("ios",), ("ios", "swift", "rest api", "git")),
    "QA Automation Engineer": (("qa", "test", "sdet", "quality"), ("selenium", "test automation", "pytest", "api testing", "jira", "ci/cd")),
    "Business Analyst": (("business analyst",), ("business analysis", "sql", "excel", "jira", "agile", "power bi")),
    "Cybersecurity Analyst": (("security", "cyber"), ("cybersecurity", "siem", "networking", "linux", "penetration testing")),
    "Web Scraping Engineer": (("scraping", "crawler"), ("web scraping", "python", "playwright", "selenium", "sql")),
}

ACTION_VERBS = frozenset("""
achieved administered analyzed analysed architected automated built championed collaborated configured
created debugged delivered deployed designed developed drove engineered enhanced established executed
generated implemented improved increased integrated launched led maintained managed mentored migrated
modernized monitored optimized orchestrated owned planned reduced refactored resolved scaled shipped
simplified spearheaded streamlined supported tested trained transformed upgraded wrote
""".split())

SECTION_HEADINGS = {
    "experience": ("experience", "work experience", "professional experience", "employment", "work history", "career history"),
    "education": ("education", "academics", "academic background", "qualifications"),
    "skills": ("skills", "technical skills", "key skills", "core competencies", "skills summary", "tech stack"),
    "projects": ("projects", "personal projects", "academic projects", "key projects"),
    "summary": ("summary", "professional summary", "profile", "objective", "career objective", "about me", "about"),
    "certifications": ("certifications", "certificates", "licenses", "courses"),
    "achievements": ("achievements", "awards", "accomplishments", "honors"),
}
_HEADING_LOOKUP = {h: sec for sec, hs in SECTION_HEADINGS.items() for h in hs}

_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
_PHONE_RE = re.compile(r"(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)|(?<!\d)\+?\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}(?!\d)")
_LINKEDIN_RE = re.compile(r"linkedin\.com/in/[\w\-%]+", re.I)
_GITHUB_RE = re.compile(r"github\.com/[\w\-]+", re.I)
_MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec"
_RANGE_RE = re.compile(
    r"(?:(?:" + _MONTHS + r")[a-z]*\.?,?\s+)?((?:19|20)\d{2})\s*(?:-|–|—|to)\s*"
    r"(?:(?:" + _MONTHS + r")[a-z]*\.?,?\s+)?((?:19|20)\d{2}|present|current|till date|till now|now|ongoing)", re.I)
_YEARS_STATED_RE = re.compile(r"(\d{1,2}(?:\.\d)?)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+|total\s+|relevant\s+|hands[- ]on\s+)?experience", re.I)
_QUANT_RE = re.compile(r"\d+(?:\.\d+)?\s*(?:%|x\b|k\b|m\b|lakhs?|crores?|users|customers|requests|ms\b|seconds|hours|days|clients|projects|tickets|records|apis?)|[$₹]\s?\d|\b\d{2,}\b")


@dataclass
class ResumeAnalysis:
    path: str = ""
    word_count: int = 0
    skills: dict = field(default_factory=dict)          # canonical -> count
    sections: list = field(default_factory=list)
    email: str = ""
    phone: str = ""
    linkedin: str = ""
    github: str = ""
    years_estimate: float = 0.0
    years_stated: float = 0.0
    action_verbs: int = 0
    bullets: int = 0
    quantified: int = 0
    score: int = 0
    score_parts: dict = field(default_factory=dict)
    roles: list = field(default_factory=list)            # [(role, 0-100)]
    seniority: str = ""
    issues: list = field(default_factory=list)
    tips: list = field(default_factory=list)
    warning: str = ""

    @property
    def skill_set(self) -> frozenset:
        return frozenset(self.skills)

    def top_skills(self, n: int = 15) -> list[str]:
        hard = [(s, c) for s, c in self.skills.items() if s not in SOFT_SKILLS]
        hard.sort(key=lambda kv: (-kv[1], kv[0]))
        return [s for s, _ in hard[:n]]


def _docx_text(path: Path) -> str:
    try:
        with zipfile.ZipFile(path) as zf:
            xml = zf.read("word/document.xml").decode("utf-8", "ignore")
    except (KeyError, zipfile.BadZipFile, OSError) as exc:
        raise ResumeError(f"Could not read DOCX: {exc}")
    xml = re.sub(r"</w:p>", "\n", xml)
    xml = re.sub(r"<w:tab/>", "\t", xml)
    text = re.sub(r"<[^>]+>", "", xml)
    return html.unescape(text)


def _pdf_text(path: Path) -> str:
    errors = []
    for mod in ("pypdf", "PyPDF2"):
        try:
            lib = __import__(mod)
            reader = lib.PdfReader(str(path))
            text = "\n".join((p.extract_text() or "") for p in reader.pages)
            if clean_space(text):
                return text
            errors.append(f"{mod}: no text layer")
        except ImportError:
            continue
        except Exception as exc:
            errors.append(f"{mod}: {exc}")
    exe = shutil.which("pdftotext")
    if exe:
        try:
            import subprocess
            out = subprocess.run([exe, "-layout", str(path), "-"], capture_output=True, timeout=30, check=True)
            text = out.stdout.decode("utf-8", "ignore")
            if clean_space(text):
                return text
            errors.append("pdftotext: no text layer")
        except Exception as exc:
            errors.append(f"pdftotext: {exc}")
    hint = "; ".join(errors) or "no PDF reader installed"
    raise ResumeError("Could not extract text from the PDF (" + hint + "). "
                      "Install a reader with:  py -m pip install pypdf   — a scanned/image-only PDF has no text to read.")


def extract_resume_text(path: str) -> str:
    p = Path(path)
    if not p.is_file():
        raise ResumeError("Resume file not found.")
    if p.stat().st_size > 15_000_000:
        raise ResumeError("Resume file is larger than 15 MB.")
    ext = p.suffix.lower()
    if ext == ".docx":
        text = _docx_text(p)
    elif ext == ".pdf":
        text = _pdf_text(p)
    elif ext in (".txt", ".md", ".text"):
        text = p.read_text(encoding="utf-8", errors="ignore")
    elif ext == ".doc":
        raise ResumeError("Legacy .doc files can't be read. Save the resume as .docx, .pdf or .txt.")
    else:
        raise ResumeError(f"Unsupported resume type '{ext}'. Use PDF, DOCX or TXT.")
    text = text.replace("\r", "\n").replace("\x00", "")
    if len(clean_space(text)) < 40:
        raise ResumeError("The resume contains almost no readable text.")
    return text


def detect_sections(text: str) -> dict[str, str]:
    """Return {section: its text}. Headings are short lines that match known names."""
    lines = (text or "").splitlines()
    current, buckets = "header", {"header": []}
    for line in lines:
        stripped = line.strip().strip(":").strip()
        key = re.sub(r"[^a-z ]", "", stripped.lower()).strip()
        if stripped and len(stripped) <= 40 and key in _HEADING_LOOKUP:
            current = _HEADING_LOOKUP[key]
            buckets.setdefault(current, [])
            continue
        buckets.setdefault(current, []).append(line)
    return {k: "\n".join(v) for k, v in buckets.items()}


def estimate_years(text: str, now_year: int | None = None) -> tuple[float, float]:
    """(from date ranges merged without overlap, from 'N years of experience' statements)."""
    now_year = now_year or datetime.now().year
    sections = detect_sections(text)
    scope = sections.get("experience") or text
    spans: list[tuple[int, int]] = []
    for m in _RANGE_RE.finditer(scope):
        start = int(m.group(1))
        end_raw = m.group(2).lower()
        end = now_year if not end_raw.isdigit() else int(end_raw)
        if 1980 <= start <= now_year and start <= end <= now_year + 1:
            spans.append((start, min(end, now_year)))
    spans.sort()
    merged: list[list[int]] = []
    for s, e in spans:
        if merged and s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    from_ranges = float(sum(max(0, e - s) for s, e in merged))
    stated = [float(x) for x in _YEARS_STATED_RE.findall(text or "")]
    return from_ranges, (max(stated) if stated else 0.0)


def infer_roles(skills: Counter | dict, text: str = "", limit: int = 6) -> list[tuple[str, int]]:
    have = set(skills)
    low = (text or "").casefold()
    scored = []
    for role, (keywords, core) in ROLE_PROFILES.items():
        hits = sum(1 for s in core if s in have)
        base = hits / min(len(core), 6)
        bonus = 0.15 if any(k in low for k in keywords) else 0.0
        pct = int(round(min(1.0, base + bonus) * 100))
        if pct >= 25:
            scored.append((role, pct))
    scored.sort(key=lambda x: (-x[1], x[0]))
    return scored[:limit]


def seniority_from_years(years: float) -> str:
    if years <= 0:
        return "Unknown"
    if years < 2:
        return "Entry level (0–2 yrs)"
    if years < 5:
        return "Mid level (2–5 yrs)"
    if years < 9:
        return "Senior (5–9 yrs)"
    return "Lead / Principal (9+ yrs)"


def analyze_resume_text(text: str, path: str = "") -> ResumeAnalysis:
    a = ResumeAnalysis(path=path)
    a.word_count = len(re.findall(r"\b\w+\b", text))
    sections = detect_sections(text)
    a.sections = [s for s in sections if s != "header" and clean_space(sections[s])]
    a.skills = dict(extract_skills(text))
    m = _EMAIL_RE.search(text)
    a.email = m.group(0) if m else ""
    m = _PHONE_RE.search(sections.get("header", "")) or _PHONE_RE.search(text)
    a.phone = clean_space(m.group(0)) if m else ""
    m = _LINKEDIN_RE.search(text)
    a.linkedin = m.group(0) if m else ""
    m = _GITHUB_RE.search(text)
    a.github = m.group(0) if m else ""
    a.years_estimate, a.years_stated = estimate_years(text)
    best_years = max(a.years_estimate, a.years_stated)
    a.seniority = seniority_from_years(best_years)
    words = re.findall(r"[A-Za-z]+", text.lower())
    a.action_verbs = sum(1 for w in words if w in ACTION_VERBS)
    bullet_lines = [ln.strip() for ln in text.splitlines()
                    if re.match(r"^\s*(?:[-•●▪*·►➢]|\d+[.)])\s+\S", ln)]
    a.bullets = len(bullet_lines)
    a.quantified = sum(1 for ln in (bullet_lines or text.splitlines()) if _QUANT_RE.search(ln))
    a.roles = infer_roles(a.skills, text)

    parts = {}
    parts["Contact details"] = (6 if a.email else 0) + (5 if a.phone else 0) + (2 if a.linkedin else 0) + (2 if a.github else 0)
    core_sections = sum(1 for s in ("experience", "education", "skills") if s in a.sections)
    parts["Structure"] = core_sections * 7 + (2 if "summary" in a.sections else 0) + (2 if "projects" in a.sections else 0)
    hard = [s for s in a.skills if s not in SOFT_SKILLS]
    parts["Skills coverage"] = min(15, int(round(15 * min(len(hard), 10) / 10)))
    parts["Quantified impact"] = min(15, a.quantified * 3)
    parts["Action verbs"] = min(10, a.action_verbs)
    if 300 <= a.word_count <= 900:
        parts["Length"] = 10
    elif 180 <= a.word_count < 300 or 900 < a.word_count <= 1200:
        parts["Length"] = 6
    else:
        parts["Length"] = 2
    parts["Experience dates"] = 10 if a.years_estimate > 0 else (5 if a.years_stated else 0)
    a.score_parts = parts
    a.score = min(100, sum(parts.values()))

    if not a.email:
        a.issues.append("No email address found.")
    if not a.phone:
        a.issues.append("No phone number found.")
    for s in ("experience", "education", "skills"):
        if s not in a.sections:
            a.issues.append(f"No clear '{s.title()}' section heading detected (recruiter systems rely on these).")
    if a.word_count < 180:
        a.issues.append(f"Very short ({a.word_count} words). Add detail on responsibilities and results.")
    elif a.word_count > 1200:
        a.issues.append(f"Long ({a.word_count} words). Aim for 1–2 pages, about 400–800 words.")
    if len(hard) < 6:
        a.issues.append(f"Only {len(hard)} recognised technical skills. Add a clear Skills section.")
    if a.quantified < 3:
        a.tips.append("Quantify results (e.g. 'reduced API latency by 35%', 'handled 50k requests/day').")
    if a.action_verbs < 6:
        a.tips.append("Start bullets with strong verbs: built, automated, optimised, led, migrated, reduced.")
    if not a.linkedin:
        a.tips.append("Add your LinkedIn URL.")
    if not a.github and any(s in a.skills for s in ("python", "java", "javascript", "react", "node.js", "golang")):
        a.tips.append("Add a GitHub link with 2–3 representative projects.")
    if "summary" not in a.sections:
        a.tips.append("Add a 2–3 line summary naming your target role and top skills.")
    if a.years_estimate and a.years_stated and abs(a.years_estimate - a.years_stated) >= 2:
        a.tips.append(f"Experience dates add up to ~{a.years_estimate:g} years but the text says {a.years_stated:g}. Make them consistent.")
    if a.bullets == 0 and a.word_count > 200:
        a.tips.append("Use bullet points for responsibilities; dense paragraphs are skimmed less.")
    return a


_ANALYSIS_CACHE: dict[tuple, ResumeAnalysis] = {}


def analyze_resume_file(path: str) -> ResumeAnalysis:
    """Cached by (path, mtime, size); re-reads only when the file changes."""
    p = Path(path)
    try:
        st = p.stat()
        key = (str(p.resolve()), st.st_mtime_ns, st.st_size)
    except OSError:
        raise ResumeError("Resume file not found.")
    cached = _ANALYSIS_CACHE.get(key)
    if cached is not None:
        return cached
    text = extract_resume_text(path)
    result = analyze_resume_text(text, str(p))
    if len(_ANALYSIS_CACHE) > 8:
        _ANALYSIS_CACHE.clear()
    _ANALYSIS_CACHE[key] = result
    return result


# ----- job requirements, fit and suggestions ---------------------------------
_JOB_SKILL_CACHE: dict[tuple, frozenset] = {}


def job_skills(job: Job) -> frozenset:
    """Skills a job asks for. Tags weigh in because Naukri lists key skills there."""
    ck = (job.key, len(job.tags), len(job.description), len(job.snippet))
    hit = _JOB_SKILL_CACHE.get(ck)
    if hit is not None:
        return hit
    found = set(extract_skills(f"{job.title}. {job.tags}. {job.description}. {job.snippet}"))
    found -= SOFT_SKILLS
    result = frozenset(found)
    if len(_JOB_SKILL_CACHE) > 20000:
        _JOB_SKILL_CACHE.clear()
    _JOB_SKILL_CACHE[ck] = result
    return result


def resume_fit(job: Job, analysis: ResumeAnalysis, candidate_years: float | None = None) -> tuple[int, list[str], list[str]]:
    """0–100 fit of THIS resume for THIS job, plus matched and missing skills.

    70 pts: share of the job's required skills the resume shows.
    15 pts: job title lines up with the resume's strongest roles.
    15 pts: advertised experience range vs the resume's experience.
    Jobs with no extractable skills get a neutral skill share, never a hard penalty.
    """
    required = job_skills(job)
    have = analysis.skill_set
    matched = sorted(required & have, key=lambda s: (-analysis.skills.get(s, 0), s))
    missing = sorted(required - have)
    if required:
        skill_pts = 70.0 * len(matched) / len(required)
    else:
        skill_pts = 35.0
    title = job.title.casefold()
    title_pts = 4.0
    top_roles = [r for r, pct in analysis.roles[:3]]
    if top_roles:
        title_pts = 7.0
        for role in top_roles:
            if any(k in title for k in ROLE_PROFILES[role][0]):
                title_pts = 15.0
                break
    years = candidate_years if candidate_years else max(analysis.years_estimate, analysis.years_stated)
    exp_pts = 7.5
    rng = parse_year_range(job.experience)
    if rng and years:
        lo, hi = rng
        if lo <= years <= hi:
            exp_pts = 15.0
        else:
            gap = min(abs(years - lo), abs(years - hi))
            exp_pts = max(0.0, 15.0 - 5.0 * gap)
    return int(round(min(100.0, skill_pts + title_pts + exp_pts))), matched, missing


def apply_fit(jobs: list[Job], analysis: ResumeAnalysis, candidate_years: float | None = None) -> None:
    for j in jobs:
        j.fit, j.fit_matched, j.fit_missing = resume_fit(j, analysis, candidate_years)


def skill_gaps(jobs: list[Job], analysis: ResumeAnalysis, top: int = 15) -> list[tuple[str, int, int]]:
    """Skills most demanded by the given jobs that the resume lacks: (skill, jobs, percent)."""
    counts: Counter = Counter()
    considered = 0
    for j in jobs:
        req = job_skills(j)
        if not req:
            continue
        considered += 1
        for s in req - analysis.skill_set:
            counts[s] += 1
    return [(s, n, int(round(100 * n / considered))) for s, n in counts.most_common(top)] if considered else []


def suggest_searches(analysis: ResumeAnalysis, candidate: Candidate, limit: int = 8) -> list[dict]:
    """Search ideas derived from the resume's strongest roles and skills."""
    out: list[dict] = []
    seen: set[str] = set()
    years = max(analysis.years_estimate, analysis.years_stated)
    exp = str(int(round(years))) if years >= 1 else ""
    city = candidate.city_pref

    def add(query: str, why: str):
        k = query.lower()
        if k not in seen and len(out) < limit:
            seen.add(k)
            out.append({"query": query, "city": city, "experience": exp, "why": why})
    for role, pct in analysis.roles:
        add(role, f"{pct}% of the typical {role} skill set appears in your resume")
    top = analysis.top_skills(4)
    for s in top[:3]:
        add(f"{s} developer" if s not in ("sql", "excel", "power bi", "tableau", "aws", "azure", "gcp") else f"{s} specialist",
            f"'{s}' is one of your most-mentioned skills")
    for t in csv_list(candidate.target_titles)[:3]:
        add(t, "from your target titles in the profile")
    return out


# ----- profile analysis ------------------------------------------------------
@dataclass
class ProfileReport:
    score: int = 0
    missing: list = field(default_factory=list)
    warnings: list = field(default_factory=list)
    suggestions: list = field(default_factory=list)


_PROFILE_WEIGHTS = (
    ("full_name", "Full name", 8), ("email", "Email", 10), ("mobile", "Mobile", 10), ("resume", "Resume file", 15),
    ("years_experience", "Years of experience", 10), ("skills", "Skills", 15), ("target_titles", "Target titles", 8),
    ("city_pref", "Preferred city", 5), ("headline", "Headline", 5), ("notice_days", "Notice period", 5),
    ("expected_ctc_lpa", "Expected CTC", 5), ("current_ctc_lpa", "Current CTC", 4),
)


def analyze_profile(c: Candidate, analysis: ResumeAnalysis | None = None) -> ProfileReport:
    r = ProfileReport()
    for key, label, weight in _PROFILE_WEIGHTS:
        if clean_space(getattr(c, key)):
            r.score += weight
        else:
            r.missing.append(label)
    if c.email and not _EMAIL_RE.fullmatch(c.email.strip()):
        r.warnings.append("Email address doesn't look valid.")
    digits = re.sub(r"\D", "", c.mobile or "")
    if c.mobile and not (10 <= len(digits) <= 13):
        r.warnings.append("Mobile number should have 10–13 digits.")
    if c.resume and not Path(c.resume).is_file():
        r.warnings.append("Resume path points to a file that doesn't exist.")
    try:
        cur = float(c.current_ctc_lpa) if c.current_ctc_lpa else None
        exp = float(c.expected_ctc_lpa) if c.expected_ctc_lpa else None
        if cur is not None and exp is not None:
            if exp < cur:
                r.warnings.append("Expected CTC is lower than current CTC — check this isn't a typo.")
            elif cur > 0 and exp > cur * 2:
                r.warnings.append("Expected CTC is more than double current CTC; many filters will drop you.")
        if c.notice_days and float(c.notice_days) > 90:
            r.warnings.append("Notice period above 90 days reduces recruiter response noticeably.")
    except ValueError:
        r.warnings.append("A numeric profile field (CTC / notice / experience) contains non-numeric text.")
    skills = [s.lower() for s in csv_list(c.skills)]
    if len(skills) < 5 and skills:
        r.suggestions.append("List at least 5–8 skills so match scoring is reliable.")
    if analysis:
        have = analysis.skill_set
        canon_declared = {SKILL_ALIASES.get(s, s) for s in skills}
        unproven = sorted(s for s in canon_declared if s in KNOWN_SKILLS and s not in have)
        if unproven:
            r.warnings.append("Skills in your profile that your resume doesn't show: " + ", ".join(unproven[:10])
                              + ". Add them to the resume or remove them.")
        undeclared = [s for s in analysis.top_skills(15) if s not in canon_declared]
        if undeclared:
            r.suggestions.append("Resume skills missing from your profile: " + ", ".join(undeclared[:10]) + ".")
        best = max(analysis.years_estimate, analysis.years_stated)
        try:
            declared_years = float(c.years_experience) if c.years_experience else None
        except ValueError:
            declared_years = None
        if declared_years is not None and best and abs(declared_years - best) >= 2:
            r.warnings.append(f"Profile says {declared_years:g} years but the resume suggests ~{best:g}.")
        titles = [t.lower() for t in csv_list(c.target_titles)]
        if titles and analysis.roles:
            role_words = " ".join(" ".join(ROLE_PROFILES[role][0]) + " " + role.lower() for role, _ in analysis.roles[:4])
            if not any(any(w in role_words for w in t.split() if len(w) > 3) for t in titles):
                r.suggestions.append("Your target titles don't match the roles your resume supports best ("
                                     + ", ".join(role for role, _ in analysis.roles[:3]) + ").")
        if analysis.email and c.email and analysis.email.lower() != c.email.lower():
            r.warnings.append("Profile email differs from the email on the resume.")
    elif c.resume:
        r.suggestions.append("Run the resume analysis to cross-check your profile against the resume.")
    r.score = min(100, r.score)
    return r


def fill_profile_from_resume(c: Candidate, a: ResumeAnalysis) -> tuple[Candidate, list[str]]:
    """Fill ONLY empty profile fields from the resume. Never overwrites what you typed."""
    n = Candidate(**asdict(c))
    changes: list[str] = []

    def setif(attr, value, label):
        if value and not clean_space(getattr(n, attr)):
            setattr(n, attr, value)
            changes.append(f"{label}: {value}")
    setif("email", a.email, "Email")
    setif("mobile", a.phone, "Mobile")
    best = max(a.years_estimate, a.years_stated)
    setif("years_experience", f"{best:g}" if best else "", "Years of experience")
    setif("skills", ", ".join(a.top_skills(15)), "Skills")
    setif("target_titles", ", ".join(r for r, _ in a.roles[:3]), "Target titles")
    setif("resume", a.path, "Resume")
    return n, changes


# ----- text reports for the UI / CLI ----------------------------------------
def resume_report_text(a: ResumeAnalysis) -> str:
    L = [f"RESUME SCORE: {a.score}/100", "=" * 44]
    for k, v in a.score_parts.items():
        L.append(f"  {k:<20}{v:>3}  {text_bar(v, 15, 15)}")
    L += ["", f"Words: {a.word_count}    Seniority: {a.seniority}",
          f"Experience from dates: ~{a.years_estimate:g} yrs    stated: {a.years_stated:g} yrs",
          f"Sections found: {', '.join(a.sections) or 'none'}",
          f"Email: {a.email or '—'}   Phone: {a.phone or '—'}",
          f"LinkedIn: {a.linkedin or '—'}   GitHub: {a.github or '—'}",
          f"Bullets: {a.bullets}   Quantified lines: {a.quantified}   Action verbs: {a.action_verbs}", ""]
    L.append("Skills detected (by mentions):")
    ranked = sorted(a.skills.items(), key=lambda kv: (-kv[1], kv[0]))
    L.append("  " + (", ".join(f"{s}×{c}" for s, c in ranked[:40]) or "none"))
    L += ["", "Roles your resume supports best:"]
    for role, pct in a.roles:
        L.append(f"  {role:<28}{pct:>3}%  {text_bar(pct, 100, 20)}")
    if not a.roles:
        L.append("  (add more technical skills to infer roles)")
    if a.issues:
        L += ["", "Problems to fix:"] + [f"  ✗ {x}" for x in a.issues]
    if a.tips:
        L += ["", "Improvements:"] + [f"  → {x}" for x in a.tips]
    return "\n".join(L)


def profile_report_text(r: ProfileReport) -> str:
    L = [f"PROFILE COMPLETENESS: {r.score}/100", "=" * 44]
    if r.missing:
        L += ["Missing fields: " + ", ".join(r.missing)]
    if r.warnings:
        L += ["", "Warnings:"] + [f"  ✗ {x}" for x in r.warnings]
    if r.suggestions:
        L += ["", "Suggestions:"] + [f"  → {x}" for x in r.suggestions]
    if not (r.missing or r.warnings or r.suggestions):
        L.append("Nothing to fix. The profile looks complete and consistent.")
    return "\n".join(L)


def browser_closed_error(exc: BaseException) -> bool:
    """Identify terminal Playwright session errors; don't keep issuing new_page()."""
    typ = type(exc).__name__.lower()
    detail = str(exc).lower()
    return ("targetclosed" in typ or "browserclosed" in typ or
            "target page, context or browser has been closed" in detail or
            "browser has been closed" in detail or
            "browser is closed" in detail or
            "connection closed" in detail or
            "context or browser has been closed" in detail)


# --------------------------------------------------------------------------- #
# Browser worker — the ONLY thread that touches Playwright
# --------------------------------------------------------------------------- #
class BrowserWorker(threading.Thread):
    def __init__(self, jobs: queue.Queue, events: queue.Queue, store: History, settings: Settings):
        super().__init__(daemon=True)
        self.jobs, self.events, self.store, self.settings = jobs, events, store, settings
        self.pw = self.context = self.home = None
        self.stop_event = threading.Event()
        self.manual_event = threading.Event()
        self.manual_action = ""
        self.processing = False
        self.relogin_required = False

    # ----- messaging ----------------------------------------------------- #
    def send(self, kind, **payload):
        self.events.put((kind, payload))

    def log(self, message):
        LOG.info(message)
        self.send("log", text=message)

    def sleep_interruptible(self, seconds: float) -> None:
        end = time.monotonic() + seconds
        while time.monotonic() < end and not self.stop_event.is_set():
            time.sleep(0.1)

    # ----- browser ------------------------------------------------------- #
    def launch(self):
        if self.relogin_required:
            raise RuntimeError("Browser session closed. Click 'Open Naukri / Sign in' to start a fresh browser session.")
        if self.context is not None:
            try:
                if self.home is not None and not self.home.is_closed():
                    return
            except Exception:
                pass
            self._mark_browser_closed()
            raise RuntimeError("Browser session is no longer available. Reopen it via 'Open Naukri / Sign in'.")
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise RuntimeError("Playwright missing. Install via: py -m pip install playwright")
        self.pw = sync_playwright().start()
        kwargs = {
            "user_data_dir": str(BROWSER_DIR), "headless": False,
            "viewport": {"width": 1365, "height": 865}, "accept_downloads": False,
            "args": ["--disable-notifications"],
        }
        choice = self.settings.browser
        brave = brave_executable() if choice in ("auto", "brave") else None
        if brave:
            kwargs["executable_path"] = brave
        else:
            kwargs["channel"] = "chromium"
        try:
            self.context = self.pw.chromium.launch_persistent_context(**kwargs)
            self.home = self.context.pages[0] if self.context.pages else self.context.new_page()
        except Exception as exc:
            try:
                self.pw.stop()
            except Exception:
                pass
            self.pw = self.context = self.home = None
            raise RuntimeError(f"Couldn't open browser: {exc}\n"
                               "If needed: py -m playwright install chromium") from exc
        self.log("Visible browser launched. Sign in to Naukri in that browser window.")

    def _mark_browser_closed(self):
        self.relogin_required = True
        self.stop_event.set()
        self.log("Browser closed/disconnected: queue stopped. No further applications will be attempted.")
        self.context = self.home = None
        if self.pw:
            try:
                self.pw.stop()
            except Exception:
                pass
            self.pw = None

    def goto(self, page, url: str):
        """Navigate with bounded retries. A block is returned, never retried around."""
        last: Exception | None = None
        for attempt in range(self.settings.nav_retries + 1):
            if self.stop_event.is_set():
                raise RuntimeError("Stopped by user")
            try:
                response = page.goto(url, wait_until="domcontentloaded", timeout=self.settings.nav_timeout_ms)
                return response
            except Exception as exc:  # network hiccup / timeout
                if browser_closed_error(exc):
                    self._mark_browser_closed()
                    raise
                last = exc
                wait = 1.5 * (2 ** attempt)
                self.log(f"Navigation problem ({type(exc).__name__}); retry {attempt + 1} in {wait:.0f}s")
                self.sleep_interruptible(wait)
        raise RuntimeError(f"Could not load {url}: {last}")

    def show_login(self):
        if self.relogin_required:
            self.relogin_required = False
            self.context = self.home = None
        self.launch()
        response = self.goto(self.home, "https://www.naukri.com/")
        if blocked(self.home, response):
            self.log("ACCESS DENIED: Naukri blocked this browser session. No bypass is attempted.")
        else:
            self.log("Naukri opened. If asked, sign in manually in the opened browser.")
        self.send("login_open")

    # ----- searching ----------------------------------------------------- #
    def scan(self, payload):
        if self.processing:
            raise RuntimeError("Finish or stop the current application queue first.")
        self.launch()
        self.stop_event.clear()
        url = search_url(payload["query"], payload["city"], payload["experience"], payload["days"])
        candidate: Candidate = payload.get("candidate") or Candidate()
        self.log("Searching Naukri: " + url)
        response = self.goto(self.home, url)
        self.home.wait_for_timeout(1800)
        if blocked(self.home, response):
            self.send("search_blocked", message="Naukri denied automated browser access."
                                                " This is not a zero-result search.")
            return
        found: dict[str, Job] = {}
        requested_pages = max(0, int(payload.get("pages", 0)))  # 0 means all accessible pages
        seen_signatures = set()
        visited_urls = {self.home.url}
        page_number = 0
        while not self.stop_event.is_set():
            page_number += 1
            try:
                self.home.evaluate("window.scrollTo(0, Math.round(document.body.scrollHeight * 0.65))")
                self.home.wait_for_timeout(650)
            except Exception as exc:
                if browser_closed_error(exc):
                    self._mark_browser_closed()
                    raise
            raw_items = self.home.evaluate(JS_EXTRACT)
            if not naukri_url(self.home.url):
                raise RuntimeError("Search redirected outside Naukri; stopping")
            signature = tuple(sorted(str(item.get("url", "")) for item in raw_items))
            if signature in seen_signatures:
                self.log("Previously seen listing set detected; stopping pagination safely.")
                break
            seen_signatures.add(signature)
            for raw in raw_items:
                job = job_from_dict(raw, self.home.url)
                if job:
                    job.score, matched = score_job(job, candidate)
                    job.matched = ", ".join(matched)
                    found[job.key] = job
            self.send("progress", text=f"Search page {page_number}: {len(found)} unique jobs")
            self.log(f"Search page {page_number}: {len(raw_items)} visible cards, {len(found)} unique jobs")
            if requested_pages and page_number >= requested_pages:
                break
            if not raw_items:
                self.log("No job cards were detected on this page; stopping rather than guessing results.")
                break
            if not self._next_page(raw_items, page_number, visited_urls, seen_signatures):
                break
            visited_urls.add(self.home.url)
            if blocked(self.home):
                self.log("Search page blocked; stopping pagination.")
                break
        new_count = self.store.upsert_jobs(list(found.values()))
        for job in found.values():
            job.status = self.store.latest_status(job.key)
        self.send("search_done", jobs=list(found.values()), searched_url=url, new_count=new_count)
        if not found:
            self.log("No recognised job cards; sign-in, access denial, or changed markup may be responsible.")

    def _next_page(self, previous_raw, current_page: int, visited_urls=None, seen_signatures=None) -> bool:
        """Try real pagination links, then validated page URL formats; stop on duplicates."""
        from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
        visited_urls = visited_urls if visited_urls is not None else set()
        seen_signatures = seen_signatures if seen_signatures is not None else set()
        old_url = self.home.url
        old_signature = tuple(sorted(str(item.get("url", "")) for item in previous_raw))

        def is_new_page():
            new_raw = self.home.evaluate(JS_EXTRACT)
            signature = tuple(sorted(str(item.get("url", "")) for item in new_raw))
            return bool(new_raw and signature != old_signature and signature not in seen_signatures)

        buttons = self.home.locator(
            "a[rel='next'], a[aria-label*='Next' i], a[title*='Next' i], "
            "button[aria-label*='Next' i], a:has-text('Next'), button:has-text('Next')")
        for i in range(min(buttons.count(), 25)):
            if self.stop_event.is_set():
                return False
            control = buttons.nth(i)
            try:
                if not (control.is_visible() and control.is_enabled()):
                    continue
                control.click(timeout=4500)
                self.home.wait_for_timeout(1400)
                if naukri_url(self.home.url) and not blocked(self.home) and is_new_page():
                    return True
            except Exception as exc:
                if browser_closed_error(exc):
                    self._mark_browser_closed()
                    raise
                self.log("Pagination control did not navigate: " + type(exc).__name__)
            if self.home.url != old_url:
                try:
                    self.goto(self.home, old_url)
                except Exception:
                    return False

        # Use links the website publishes, including numbered pagination links.
        candidates = []
        try:
            candidates = self.home.evaluate(r"""nextPage => {
                const as = [...document.querySelectorAll('a[href]')];
                return as.filter(a => {
                  const t = (a.innerText || a.textContent || '').trim();
                  const aria = a.getAttribute('aria-label') || '';
                  const rel = a.getAttribute('rel') || '';
                  return t === String(nextPage) || /next/i.test(t + ' ' + aria + ' ' + rel);
                }).map(a => a.href).filter(Boolean);
            }""", current_page + 1) or []
        except Exception as exc:
            if browser_closed_error(exc):
                self._mark_browser_closed()
                raise

        # Naukri's listing pages sometimes use a -2 path segment rather than a Next button.
        # Alternate URLs are validated against actual changing job cards (not guessed as success).
        parts = urlsplit(old_url)
        base_path = re.sub(r"-\d+$", "", parts.path) if current_page > 1 else parts.path
        candidates.append(urlunsplit((parts.scheme, parts.netloc, base_path + f"-{current_page + 1}", parts.query, "")))
        for param in ("page", "p"):
            query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True) if k not in ("page", "p")]
            query.append((param, str(current_page + 1)))
            candidates.append(urlunsplit((parts.scheme, parts.netloc, base_path, urlencode(query), "")))
        for candidate in dict.fromkeys(candidates):
            if self.stop_event.is_set():
                return False
            if not naukri_url(candidate) or candidate == old_url or candidate in visited_urls:
                continue
            try:
                response = self.goto(self.home, candidate)
                self.home.wait_for_timeout(750)
                if not blocked(self.home, response) and is_new_page():
                    self.log("Pagination advanced to: " + self.home.url)
                    return True
            except Exception as exc:
                if browser_closed_error(exc):
                    self._mark_browser_closed()
                    raise
                self.log(f"Pagination candidate not accessible ({type(exc).__name__})")
        # restore original page in browser without retrying indefinitely
        if not self.stop_event.is_set():
            try:
                self.goto(self.home, old_url)
            except Exception:
                pass
        self.log("No further accessible page with new job listings; pagination stopped.")
        return False

    def fetch_details(self, payload):
        """Open one job page (read-only) and enrich description/skills."""
        job: Job = payload["job"]
        candidate: Candidate = payload.get("candidate") or Candidate()
        if not naukri_url(job.key):
            raise RuntimeError("Not a Naukri job URL")
        self.launch()
        page = self.context.new_page()
        try:
            response = self.goto(page, job.key)
            page.wait_for_timeout(1200)
            if blocked(page, response):
                self.send("search_blocked", message="Naukri denied access to the job page.")
                return
            data = page.evaluate(JS_DETAIL) or {}
            desc = clean_space(data.get("description"))[:6000]
            skills = ", ".join(clean_space(s) for s in (data.get("skills") or []))[:600]
            if desc:
                job.description = desc
            if skills:
                job.tags = skills
            job.score, matched = score_job(job, candidate)
            job.matched = ", ".join(matched)
            self.store.update_job(job.key, description=job.description, score=job.score, matched=job.matched)
            self.send("job_updated", job=job)
            self.log(f"Details loaded for {job.title} (score {job.score})")
        finally:
            try:
                page.close()
            except Exception:
                pass

    # ----- applying ------------------------------------------------------ #
    def verify(self, page, job, responses):
        ui = ui_confirmation(page, job)
        net = network_confirmation(responses, job.job_id)
        if ui and net:
            return "CONFIRMED", ui + "; " + net
        if ui:
            return "UI_EVIDENCE_ONLY", ui + "; exact saveApply response not observed"
        if net:
            return "NETWORK_EVIDENCE_ONLY", net + "; matching UI confirmation not observed"
        return "", ""

    def fill_standard_application(self, page, candidate: Candidate):
        """Fill only recognised fields. Never guess radios, never tick consent.

        Returns (filled_count, unknown_required_labels, submit_locator).
        """
        scopes = page.locator("[role='dialog'], form, [class*='apply-form'], [class*='applyForm']")
        fill_count, unanswered, chosen = 0, [], None
        details = asdict(candidate)
        field_rules = [
            (r"expected.*(?:ctc|salary|compensation)|(?:ctc|salary).*expected", "expected_ctc_lpa"),
            (r"current.*(?:ctc|salary|compensation)|(?:ctc|salary).*current", "current_ctc_lpa"),
            (r"notice.*period|joining.*days|available.*(?:days|joining)", "notice_days"),
            (r"(?:total|relevant|years).*experience|experience.*(?:year|total)", "years_experience"),
            (r"e[ -]?mail", "email"),
            (r"mobile|phone|contact.*number", "mobile"),
            (r"(?:full|candidate).*name|^name$", "full_name"),
        ]
        for i in range(min(scopes.count(), 20)):
            scope = scopes.nth(i)
            try:
                if not scope.is_visible():
                    continue
                text = clean_space(scope.inner_text(timeout=700)).lower()[:600]
                if not re.search(r"apply|application|resume|screening|questionnaire", text):
                    continue
                controls = scope.locator("input, textarea, select")
                local_count, local_unknown = 0, []
                for j in range(min(controls.count(), 45)):
                    ctrl = controls.nth(j)
                    if not ctrl.is_visible() or not ctrl.is_enabled():
                        continue
                    meta = ctrl.evaluate(r"""el => ({
                       type: (el.getAttribute('type') || '').toLowerCase(),
                       tag: el.tagName.toLowerCase(),
                       required: !!el.required || el.getAttribute('aria-required') === 'true',
                       value: el.value || '',
                       checked: !!el.checked,
                       label: [...(el.labels || [])].map(x => x.textContent).join(' ') + ' ' +
                        ['aria-label', 'placeholder', 'name', 'id'].map(x => el.getAttribute(x) || '').join(' ')
                    })""")
                    kind = meta.get("type", "")
                    label = clean_space(meta.get("label", ""))[:140]
                    if kind in ("hidden", "button", "submit", "reset", "image", "search"):
                        continue
                    if kind == "file":
                        filename = details.get("resume", "")
                        if filename and Path(filename).is_file():
                            try:
                                ctrl.set_input_files(filename, timeout=4000)
                                local_count += 1
                                self.log("Attached saved resume to application form")
                            except Exception as exc:
                                local_unknown.append("Resume upload failed: " + str(exc)[:100])
                        elif meta.get("required") and not meta.get("value"):
                            local_unknown.append(label or "Required resume upload")
                        continue
                    if kind in ("checkbox", "radio"):
                        if meta.get("required") and not meta.get("checked"):
                            local_unknown.append(label or "Required checkbox/radio choice")
                        continue
                    if meta.get("tag") == "select":
                        if meta.get("required") and not meta.get("value"):
                            local_unknown.append(label or "Required dropdown")
                        continue
                    if meta.get("value"):
                        continue
                    value = ""
                    field_name = next((n for pat, n in field_rules if re.search(pat, label.lower())), None)
                    if field_name:
                        value = details.get(field_name, "")
                    if not value:  # user-defined screening rules as a second source
                        value = screening_answer(label, self.settings.screening_rules, self.candidate_for_rules)
                    if value:
                        try:
                            ctrl.fill(value, timeout=3500)
                            local_count += 1
                        except Exception as exc:
                            local_unknown.append("Couldn't fill " + (label or "field") + ": " + str(exc)[:80])
                    elif meta.get("required"):
                        local_unknown.append(label or "Required application question")
                if local_count or local_unknown or controls.count():
                    fill_count += local_count
                    unanswered.extend(local_unknown)
                    submit = scope.locator("button[type='submit'], input[type='submit'], "
                                           "button:has-text('Submit Application'), button:has-text('Submit'), "
                                           "button:has-text('Save and Apply')")
                    for k in range(min(submit.count(), 8)):
                        if submit.nth(k).is_visible() and submit.nth(k).is_enabled():
                            chosen = submit.nth(k)
                            break
                    break
            except Exception as exc:
                self.log("Application form inspection warning: " + str(exc)[:160])
        return fill_count, unanswered, chosen

    candidate_for_rules: Candidate = Candidate()

    def apply_one(self, job: Job, candidate: Candidate):
        """Naukri internal Apply; pauses on unknown questions, never invents answers."""
        if not naukri_url(job.key):
            return "SKIPPED", "Outside supported Naukri HTTPS domain"
        if self.store.already_attempted(job):
            return "DUPLICATE_SKIP", "Already attempted or confirmed in local application history"
        reason = blacklisted(job, self.settings)
        if reason:
            return "SKIPPED", reason
        if self.settings.skip_hidden and job.hidden:
            return "SKIPPED", "Job is hidden"
        if job.score < self.settings.min_score_to_apply:
            return "SKIPPED", f"Match score {job.score} below minimum {self.settings.min_score_to_apply}"
        if self.settings.min_fit_to_apply and job.fit < self.settings.min_fit_to_apply:
            return "SKIPPED", f"Resume fit {job.fit} below minimum {self.settings.min_fit_to_apply}"
        self.candidate_for_rules = candidate
        try:
            page = self.context.new_page()
        except Exception as exc:
            if browser_closed_error(exc):
                self._mark_browser_closed()
                return "BROWSER_CLOSED", "Browser closed before job could be opened; queue stopped"
            return "ERROR", f"Could not open job tab: {exc}"
        capture: list = []
        page.on("response", lambda r: capture.append(r) if "/myapply/saveApply" in r.url else None)
        try:
            response = self.goto(page, job.key)
            page.wait_for_timeout(1300)
            if blocked(page, response):
                return "BLOCKED", "Website denied access to this job page"
            if not naukri_url(page.url):
                return "EXTERNAL_SKIP", "Job navigation left the supported Naukri domain"
            applied = page.locator("button#apply-button")
            external = page.locator("button#company-site-button")
            if applied.count() == 0:
                if page.get_by_text(re.compile(r"^Applied$", re.I), exact=True).count():
                    return "ALREADY_APPLIED", "Naukri displays Applied; not a new submission"
                if external.count():
                    return "EXTERNAL_SKIP", "External company career portal is not supported"
                return "UNKNOWN_SKIP", "Naukri internal Apply button not found"
            button = applied.first
            if not button.is_visible() or not button.is_enabled():
                return "UNKNOWN_SKIP", "Apply button not interactable"
            if re.search(r"already applied|applied", clean_space(button.inner_text(timeout=2000)), re.I):
                return "ALREADY_APPLIED", "Apply button indicates job was already applied"
            if self.settings.dry_run:
                return "DRY_RUN", "Apply button found and interactable; dry-run mode, nothing was clicked"
            # Persist an in-flight marker BEFORE dispatching a potentially irreversible click.
            # If the process crashes mid-click, the job needs review rather than an automatic retry.
            self.store.add(job, "CLICK_PENDING", "Apply click initiated; outcome not yet known")
            try:
                button.click(timeout=12000)
            except Exception as exc:
                if browser_closed_error(exc):
                    self._mark_browser_closed()
                    return "BROWSER_CLOSED", "Browser closed during Apply; check Naukri history before retrying"
                return "NEEDS_REVIEW", ("Apply click raised " + type(exc).__name__ +
                                        "; request may have reached the website. Verify manually before retrying")
            self.store.add(job, "ATTEMPTED", "Apply click completed; awaiting exact submission evidence")
            self.log("Clicked internal Apply: " + job.title)
            status, evidence = "", ""
            for _ in range(6):
                if self.stop_event.is_set():
                    break
                page.wait_for_timeout(650)
                status, evidence = self.verify(page, job, capture)
                if status == "CONFIRMED":
                    return status, evidence
            if status in ("UI_EVIDENCE_ONLY", "NETWORK_EVIDENCE_ONLY"):
                return status, evidence
            filled, unknown, submit = self.fill_standard_application(page, candidate)
            if filled:
                self.log(f"Filled {filled} known application field(s) for {job.title}")
            if unknown:
                self.log("Required questions need manual input: " + "; ".join(unknown[:5]))
            elif submit is not None:
                # A fully pre-filled form can still require the final Submit click.
                # We only reach this path if no required unanswered fields were found.
                try:
                    self.log("Submitting completed standard application form")
                    submit.click(timeout=7000)
                    page.wait_for_timeout(1800)
                    status, evidence = self.verify(page, job, capture)
                    if status:
                        return status, evidence
                except Exception as exc:
                    self.log("Form submission needs manual attention: " + str(exc)[:150])
            self.log("Confirmation incomplete for: " + job.title + ". Inspect the open tab.")
            self.send("needs_manual", title=job.title, company=job.company, url=job.key,
                      unknown=unknown[:6],
                      message="An Apply click isn't proof of submission. If a questionnaire or login appeared, "
                              "complete it in the open browser tab, then click Verify & Continue. "
                              "Otherwise click Skip & Continue.")
            self.manual_action = ""
            self.manual_event.clear()
            while not self.manual_event.wait(0.25):
                if self.stop_event.is_set():
                    return "NEEDS_REVIEW", "Stopped while awaiting application confirmation"
            if self.manual_action == "verify":
                page.wait_for_timeout(1000)
                status, evidence = self.verify(page, job, capture)
                if status:
                    return status, evidence
                return "NEEDS_REVIEW", "Manual step completed but no matching confirmation evidence was found"
            return "NEEDS_REVIEW", "User skipped confirmation/manual step; not recorded as applied"
        except Exception as exc:
            if browser_closed_error(exc):
                self._mark_browser_closed()
                return "BROWSER_CLOSED", "Browser session terminated during application; check history"
            return "ERROR", f"{type(exc).__name__}: {exc}"
        finally:
            try:
                page.close()
            except Exception:
                pass

    def apply_queue(self, jobs: list[Job], candidate: Candidate):
        if self.processing:
            raise RuntimeError("An application queue is already running")
        self.launch()
        self.processing = True
        self.stop_event.clear()
        successes = partial = skipped = 0
        started = 0
        try:
            for idx, job in enumerate(jobs, 1):
                if self.stop_event.is_set():
                    self.log("Application queue stopped by user.")
                    break
                limit = self.settings.daily_limit
                if not self.settings.dry_run and limit and self.store.attempts_today() >= limit:
                    self.log(f"Daily limit of {limit} attempts reached. Remaining jobs were not touched.")
                    break
                self.send("applying", index=idx, total=len(jobs), title=job.title)
                status, evidence = self.apply_one(job, candidate)
                self.store.add(job, status, evidence)
                self.send("application_result", job=job, status=status, evidence=evidence)
                self.log(f"[{idx}/{len(jobs)}] {job.title} — {status}: {evidence}")
                if status == "CONFIRMED":
                    successes += 1
                elif status in ("UI_EVIDENCE_ONLY", "NETWORK_EVIDENCE_ONLY"):
                    partial += 1
                elif status.endswith("SKIP") or status in ("SKIPPED", "DUPLICATE_SKIP"):
                    skipped += 1
                if status in ("BLOCKED", "BROWSER_CLOSED"):
                    self.log("Stopping application queue: " + evidence)
                    break
                if self.stop_event.is_set() or idx == len(jobs):
                    continue
                if status not in ("SKIPPED", "DUPLICATE_SKIP", "DRY_RUN"):
                    started += 1
                    pause = random.uniform(self.settings.delay_min, self.settings.delay_max)
                    self.send("progress", text=f"Waiting {pause:.0f}s before next job (polite pacing)")
                    self.sleep_interruptible(pause)
        finally:
            self.processing = False
            self.send("batch_finished", confirmed=successes, partial=partial, skipped=skipped)

    # ----- main loop ----------------------------------------------------- #
    def run(self):
        try:
            while True:
                kind, payload = self.jobs.get()
                if kind == "quit":
                    break
                try:
                    if kind == "login":
                        self.show_login()
                    elif kind == "search":
                        self.stop_event.clear()
                        self.scan(payload)
                    elif kind == "details":
                        self.stop_event.clear()
                        self.fetch_details(payload)
                        self.send("idle")
                    elif kind == "apply":
                        self.apply_queue(payload["jobs"], payload["candidate"])
                    else:
                        raise ValueError("Unknown job command " + kind)
                except Exception as exc:
                    LOG.error("worker error: %s\n%s", exc, traceback.format_exc())
                    self.log("ERROR: " + str(exc))
                    self.send("error", message=str(exc))
        finally:
            if self.context:
                try:
                    self.context.close()
                except Exception:
                    pass
            if self.pw:
                try:
                    self.pw.stop()
                except Exception:
                    pass


# --------------------------------------------------------------------------- #
# Desktop GUI (Tkinter is imported lazily so --self-test / CLI work headless)
# --------------------------------------------------------------------------- #
THEMES = {
    "light": {"bg": "#f4f7fb", "fg": "#1f2937", "panel": "#ffffff", "header": "#152a44", "accent": "#2563eb",
              "log_bg": "#111c2c", "log_fg": "#d4e6fa", "sel": "#cfe0ff", "new": "#e8f5e9", "fav": "#fff8e1",
              "dim": "#9aa3af"},
    "dark": {"bg": "#12161c", "fg": "#e5e7eb", "panel": "#1b212b", "header": "#0b1220", "accent": "#60a5fa",
             "log_bg": "#0a0f17", "log_fg": "#c9d7ea", "sel": "#26416b", "new": "#1d3326", "fav": "#3a3015",
             "dim": "#6b7280"},
}

TABLE_COLUMNS = (
    ("fav", "★", 36), ("score", "Match", 56), ("fit", "Fit", 50), ("title", "Title", 280), ("company", "Company", 150),
    ("location", "Location", 130), ("exp", "Experience", 100), ("salary", "Salary", 110),
    ("posted", "Posted", 90), ("stage", "Stage", 90), ("status", "Application", 140),
)


def main_gui() -> int:
    import tkinter as tk
    from tkinter import filedialog, messagebox, simpledialog, ttk

    class App(tk.Tk):
        def __init__(self):
            super().__init__()
            setup_logging()
            self.title(f"{APP_TITLE}  v{VERSION}")
            self.geometry("1500x900")
            self.minsize(1100, 680)
            self.settings = load_settings()
            self.candidate = load_candidate()
            self.store = History()
            if self.settings.auto_backup:
                auto_backup(self.store)
            self.commands: queue.Queue = queue.Queue()
            self.events: queue.Queue = queue.Queue()
            self.worker = BrowserWorker(self.commands, self.events, self.store, self.settings)
            self.worker.candidate_for_rules = self.candidate
            self.worker.start()
            self.jobs_by_url: dict[str, Job] = {}
            self.all_results: list[Job] = []
            self.visible: list[Job] = []
            self.sort_column, self.sort_reverse = "score", True
            self.busy = False
            self.manual_dialog = None
            self.analysis: ResumeAnalysis | None = None
            self._quick_job = None
            self.style = ttk.Style(self)
            if "clam" in self.style.theme_names():
                self.style.theme_use("clam")
            self.option_add("*Font", "{Segoe UI} 10")
            self._build()
            self.apply_theme()
            self.refresh_analysis(silent=True)
            self._load_stored_jobs()
            self._refresh_history()
            self._refresh_followups()
            self._refresh_analytics()
            self._bind_keys()
            self.after(150, self.poll)
            self.protocol("WM_DELETE_WINDOW", self.on_close)

        # ----- theme ----------------------------------------------------- #
        def apply_theme(self):
            t = THEMES[self.settings.theme]
            self.configure(bg=t["bg"])
            s = self.style
            s.configure(".", background=t["bg"], foreground=t["fg"])
            s.configure("TFrame", background=t["bg"])
            s.configure("TLabel", background=t["bg"], foreground=t["fg"])
            s.configure("TLabelframe", background=t["bg"], foreground=t["fg"])
            s.configure("TLabelframe.Label", background=t["bg"], foreground=t["accent"], font=("Segoe UI", 10, "bold"))
            s.configure("TCheckbutton", background=t["bg"], foreground=t["fg"])
            s.configure("TNotebook", background=t["bg"])
            s.configure("TNotebook.Tab", padding=(12, 6))
            s.configure("Treeview", rowheight=28, font=("Segoe UI", 10), background=t["panel"],
                        fieldbackground=t["panel"], foreground=t["fg"])
            s.map("Treeview", background=[("selected", t["sel"])], foreground=[("selected", t["fg"])])
            s.configure("Treeview.Heading", font=("Segoe UI", 10, "bold"))
            s.configure("TButton", padding=(10, 6))
            s.configure("Accent.TButton", padding=(12, 7), font=("Segoe UI", 10, "bold"))
            self.header.configure(bg=t["header"])
            for w in self.header.winfo_children():
                if isinstance(w, tk.Label):
                    w.configure(bg=t["header"])
            self.logbox.configure(bg=t["log_bg"], fg=t["log_fg"], insertbackground=t["fg"])
            self.detail.configure(bg=t["panel"], fg=t["fg"], insertbackground=t["fg"])
            self.analytics_box.configure(bg=t["panel"], fg=t["fg"])
            self.table.tag_configure("new", background=t["new"])
            self.table.tag_configure("fav", background=t["fav"])
            self.table.tag_configure("hidden", foreground=t["dim"])

        def toggle_theme(self):
            self.settings.theme = "dark" if self.settings.theme == "light" else "light"
            save_settings(self.settings)
            self.apply_theme()

        # ----- layout ---------------------------------------------------- #
        def _build(self):
            self.header = tk.Frame(self, padx=18, pady=10)
            self.header.pack(fill="x")
            tk.Label(self.header, text="JOB AUTO APPLY PRO", fg="white", font=("Segoe UI", 18, "bold")).pack(side="left")
            tk.Label(self.header, text="Search → Score → Filter → Select → Apply → Verify → Track",
                     fg="#c7d4e8", font=("Segoe UI", 10)).pack(side="left", padx=20)
            for text, cmd in (("Resume Analyzer", self.open_resume_analyzer), ("Settings", self.edit_settings), ("Profile / Resume", self.edit_profile),
                              ("Theme", self.toggle_theme), ("Open Naukri / Sign in", lambda: self.enqueue("login"))):
                ttk.Button(self.header, text=text, command=cmd).pack(side="right", padx=3)

            self.vars = {k: tk.StringVar(value=v) for k, v in {
                "query": "Python Developer", "city": self.candidate.city_pref or "Bengaluru", "experience": "",
                "days": "Any", "pages": str(self.settings.default_pages), "company": "", "exclude": "",
                "exclude_title": "", "skill": "", "filter_location": "", "min_salary": "", "candidate_years":
                self.candidate.years_experience, "mode": "Any", "min_score": "", "max_age_days": "",
                "stage": "Any", "quick": "", "saved": "", "min_fit": ""}.items()}
            self.flags = {k: tk.BooleanVar(value=False) for k in ("favorites_only", "new_only", "show_hidden")}

            controls = ttk.LabelFrame(self, text="1 · Find jobs", padding=8)
            controls.pack(fill="x", padx=12, pady=(10, 4))

            def field(parent, label, var, col, width=16, opts=None, row=0, readonly=True):
                block = ttk.Frame(parent)
                block.grid(row=row, column=col, sticky="ew", padx=(0, 8), pady=2)
                ttk.Label(block, text=label).pack(anchor="w")
                if opts is not None:
                    w = ttk.Combobox(block, textvariable=var, values=opts, width=width,
                                     state="readonly" if readonly else "normal")
                else:
                    w = ttk.Entry(block, textvariable=var, width=width)
                w.pack(fill="x")
                parent.columnconfigure(col, weight=1)
                return w

            field(controls, "Job title / keywords", self.vars["query"], 0, 26)
            field(controls, "Search city", self.vars["city"], 1)
            field(controls, "Search exp. (years)", self.vars["experience"], 2, 12)
            field(controls, "Posted within", self.vars["days"], 3, 12, ["Any", "24 hours", "3 days", "7 days", "15 days", "30 days"])
            field(controls, "Pages (0 = all)", self.vars["pages"], 4, 8)
            self.saved_combo = field(controls, "Saved searches", self.vars["saved"], 5, 18, self._saved_names())
            self.saved_combo.bind("<<ComboboxSelected>>", lambda _e: self.load_saved_search())
            ttk.Button(controls, text="Save this search", command=self.save_search).grid(row=0, column=6, padx=3, sticky="s")
            ttk.Button(controls, text="Delete saved", command=self.delete_saved).grid(row=0, column=7, padx=3, sticky="s")
            ttk.Button(controls, text="SEARCH NAUKRI", style="Accent.TButton", command=self.search).grid(row=0, column=8, padx=5, sticky="s")

            filters = ttk.LabelFrame(self, text="2 · Filter & rank", padding=8)
            filters.pack(fill="x", padx=12, pady=(0, 4))
            self.quick_entry = field(filters, "Quick search", self.vars["quick"], 0, 16, row=0)
            field(filters, "Company contains", self.vars["company"], 1, row=0)
            field(filters, "Exclude companies (,)", self.vars["exclude"], 2, row=0)
            field(filters, "Exclude title words (,)", self.vars["exclude_title"], 3, row=0)
            field(filters, "Required skills (,)", self.vars["skill"], 4, row=0)
            field(filters, "Location contains", self.vars["filter_location"], 5, row=0)
            field(filters, "Work mode", self.vars["mode"], 6, 10, ["Any", "Remote", "Hybrid", "On-site"], row=0)
            field(filters, "Min salary (LPA)", self.vars["min_salary"], 0, 16, row=1)
            field(filters, "My exp. (years)", self.vars["candidate_years"], 1, row=1)
            field(filters, "Min match score", self.vars["min_score"], 2, row=1)
            field(filters, "Max age (days)", self.vars["max_age_days"], 3, row=1)
            field(filters, "Pipeline stage", self.vars["stage"], 4, 12, ["Any", *PIPELINE_STAGES], row=1)
            chk = ttk.Frame(filters)
            chk.grid(row=1, column=5, columnspan=2, sticky="w")
            ttk.Checkbutton(chk, text="★ only", variable=self.flags["favorites_only"], command=self.render_results).pack(side="left", padx=4)
            ttk.Checkbutton(chk, text="New only", variable=self.flags["new_only"], command=self.render_results).pack(side="left", padx=4)
            ttk.Checkbutton(chk, text="Show hidden", variable=self.flags["show_hidden"], command=self.render_results).pack(side="left", padx=4)
            ttk.Button(filters, text="Apply filters", command=self.render_results).grid(row=1, column=7, padx=3, sticky="e")
            ttk.Button(filters, text="Clear", command=self.clear_filters).grid(row=1, column=8, padx=3, sticky="e")
            field(filters, "Min resume fit", self.vars["min_fit"], 0, 16, row=2)
            self.vars["quick"].trace_add("write", self._debounced_render)

            action = ttk.Frame(self, padding=(12, 4))
            action.pack(fill="x")
            self.summary = ttk.Label(action, text="Search for jobs to begin, or use previously discovered jobs.")
            self.summary.pack(side="left")
            ttk.Button(action, text="Stop", command=self.stop).pack(side="right", padx=3)
            ttk.Button(action, text="AUTO APPLY SELECTED", style="Accent.TButton", command=self.start_apply).pack(side="right", padx=3)
            ttk.Button(action, text="Export ▾", command=self.export_menu).pack(side="right", padx=3)
            ttk.Button(action, text="Select all shown", command=self.select_all).pack(side="right", padx=3)
            ttk.Button(action, text="Load details", command=self.load_details).pack(side="right", padx=3)
            ttk.Button(action, text="Resume-fit jobs", command=self.show_fit_jobs).pack(side="right", padx=3)

            panes = ttk.PanedWindow(self, orient="vertical")
            panes.pack(fill="both", expand=True, padx=12, pady=(2, 6))
            upper = ttk.PanedWindow(panes, orient="horizontal")
            panes.add(upper, weight=3)
            left = ttk.Frame(upper)
            upper.add(left, weight=5)
            cols = [c[0] for c in TABLE_COLUMNS]
            self.table = ttk.Treeview(left, columns=cols, show="headings", selectmode="extended")
            for key, label, width in TABLE_COLUMNS:
                self.table.heading(key, text=label, command=lambda k=key: self.sort_by(k))
                self.table.column(key, width=width, stretch=key in ("title", "company"), minwidth=36,
                                  anchor="center" if key in ("fav", "score", "fit") else "w")
            self.table.pack(side="left", fill="both", expand=True)
            vs = ttk.Scrollbar(left, orient="vertical", command=self.table.yview)
            vs.pack(side="right", fill="y")
            self.table.configure(yscrollcommand=vs.set)
            self.table.bind("<Double-1>", self.open_selected_url)
            self.table.bind("<<TreeviewSelect>>", self.show_detail)
            self.table.bind("<Button-3>", self.context_menu)
            self.table.bind("<Button-2>", self.context_menu)

            right = ttk.Frame(upper)
            upper.add(right, weight=2)
            ttk.Label(right, text="Job detail").pack(anchor="w")
            self.detail = tk.Text(right, wrap="word", height=10, width=42, relief="flat", padx=8, pady=6)
            self.detail.pack(fill="both", expand=True)
            self.detail.configure(state="disabled")

            lower = ttk.Notebook(panes)
            panes.add(lower, weight=2)
            self.logbox = tk.Text(lower, height=8, wrap="word")
            lower.add(self.logbox, text="Execution log")

            hist = ttk.Frame(lower, padding=4)
            lower.add(hist, text="Application history")
            bar = ttk.Frame(hist)
            bar.pack(fill="x")
            ttk.Button(bar, text="Refresh", command=self._refresh_history).pack(side="left")
            ttk.Button(bar, text="Export history CSV", command=self.export_history).pack(side="left", padx=6)
            ttk.Button(bar, text="HTML report", command=self.export_report).pack(side="left")
            self.hist = ttk.Treeview(hist, columns=("time", "job", "company", "status", "evidence"), show="headings", height=8)
            for col, title, width in (("time", "Time (UTC)", 170), ("job", "Job", 220), ("company", "Company", 130),
                                      ("status", "Status", 150), ("evidence", "Evidence / Reason", 520)):
                self.hist.heading(col, text=title)
                self.hist.column(col, width=width, stretch=True)
            self.hist.pack(fill="both", expand=True)

            follow = ttk.Frame(lower, padding=4)
            lower.add(follow, text="Follow-ups")
            self.follow_label = ttk.Label(follow, text="")
            self.follow_label.pack(anchor="w")
            self.follow = ttk.Treeview(follow, columns=("title", "company", "date"), show="headings", height=7)
            for col, title, width in (("title", "Job", 340), ("company", "Company", 200), ("date", "Applied on", 110)):
                self.follow.heading(col, text=title)
                self.follow.column(col, width=width)
            self.follow.pack(fill="both", expand=True)
            self.follow.bind("<Double-1>", self._follow_open)

            ana = ttk.Frame(lower, padding=4)
            lower.add(ana, text="Analytics")
            ttk.Button(ana, text="Refresh", command=self._refresh_analytics).pack(anchor="w")
            self.analytics_box = tk.Text(ana, wrap="none", font=("Consolas", 10), height=10, relief="flat")
            self.analytics_box.pack(fill="both", expand=True)

            self.status = ttk.Label(self, text="Ready. Sign in via 'Open Naukri / Sign in' first. A separate visible browser profile is used.", padding=(14, 4))
            self.status.pack(fill="x")

        def _bind_keys(self):
            self.bind("<Control-f>", lambda e: self.focus_quick())
            self.bind("<Control-a>", lambda e: self.select_all() if self.focus_get() is self.table else None)
            self.bind("<F5>", lambda e: self.search())
            self.bind("<Escape>", lambda e: self.stop())
            self.table.bind("<space>", lambda e: self.toggle_favorite())
            self.table.bind("<Delete>", lambda e: self.hide_selected())

        def focus_quick(self):
            self.quick_entry.focus_set()
            return "break"

        # ----- queue / state --------------------------------------------- #
        def enqueue(self, kind, **kwargs):
            if self.busy:
                self.say("Please wait for the current operation or click Stop.")
                return
            self.busy = True
            self.status.config(text="Running: " + kind)
            self.commands.put((kind, kwargs))

        def say(self, text):
            self.logbox.insert("end", "[" + datetime.now().strftime("%H:%M:%S") + "] " + str(text) + "\n")
            self.logbox.see("end")

        # ----- searching & saved searches -------------------------------- #
        def _saved_names(self):
            return [s.get("name", "") for s in self.settings.saved_searches]

        def search_params(self):
            return {"query": self.vars["query"].get(), "city": self.vars["city"].get(),
                    "experience": self.vars["experience"].get().strip(), "days": self.vars["days"].get(),
                    "pages": self.vars["pages"].get()}

        def save_search(self):
            name = simpledialog.askstring("Save search", "Name for this search:", parent=self)
            if not name or not name.strip():
                return
            entry = {"name": name.strip(), **self.search_params()}
            self.settings.saved_searches = [s for s in self.settings.saved_searches if s.get("name") != entry["name"]]
            self.settings.saved_searches.append(entry)
            save_settings(self.settings)
            self.saved_combo.configure(values=self._saved_names())
            self.say(f"Saved search '{entry['name']}'.")

        def load_saved_search(self):
            for s in self.settings.saved_searches:
                if s.get("name") == self.vars["saved"].get():
                    for k in ("query", "city", "experience", "days", "pages"):
                        self.vars[k].set(str(s.get(k, "")))
                    self.say(f"Loaded saved search '{s['name']}'.")
                    return

        def delete_saved(self):
            name = self.vars["saved"].get()
            if not name:
                return
            self.settings.saved_searches = [s for s in self.settings.saved_searches if s.get("name") != name]
            save_settings(self.settings)
            self.saved_combo.configure(values=self._saved_names())
            self.vars["saved"].set("")

        def search(self):
            try:
                p = self.search_params()
                pages = int(p["pages"])
                if pages < 0:
                    raise ValueError("Pages must be 0 (all accessible pages) or a positive integer")
                p["pages"] = pages
                search_url(p["query"], p["city"], p["experience"], p["days"])
            except (ValueError, TypeError) as exc:
                messagebox.showerror("Search settings", str(exc))
                return
            self.enqueue("search", candidate=self.candidate, **p)

        # ----- filtering -------------------------------------------------- #
        def _filter(self):
            try:
                g = lambda k: self.vars[k].get().strip()
                for key in ("min_salary", "candidate_years", "max_age_days"):
                    if g(key) and float(g(key)) < 0:
                        raise ValueError(f"{key.replace('_', ' ').title()} must be nonnegative")
                if g("min_score") and not 0 <= int(g("min_score")) <= 100:
                    raise ValueError("Min match score must be 0–100")
                if g("min_fit") and not 0 <= int(g("min_fit")) <= 100:
                    raise ValueError("Min resume fit must be 0–100")
                return {
                    "quick": g("quick"), "company": g("company"), "exclude": g("exclude"),
                    "exclude_title": g("exclude_title"), "skill": g("skill"), "location": g("filter_location"),
                    "min_salary": g("min_salary"), "candidate_years": g("candidate_years"), "mode": g("mode"),
                    "min_score": g("min_score"), "min_fit": g("min_fit"), "max_age_days": g("max_age_days"), "stage": g("stage"),
                    **{k: v.get() for k, v in self.flags.items()},
                }
            except ValueError as exc:
                messagebox.showerror("Filter error", str(exc))
                return None

        def clear_filters(self):
            for k in ("company", "exclude", "exclude_title", "skill", "filter_location", "min_salary",
                      "min_score", "max_age_days", "quick", "min_fit"):
                self.vars[k].set("")
            self.vars["mode"].set("Any")
            self.vars["stage"].set("Any")
            for v in self.flags.values():
                v.set(False)
            self.render_results()

        def sort_by(self, column):
            if column == "fav":
                column = "score"
            if self.sort_column == column:
                self.sort_reverse = not self.sort_reverse
            else:
                self.sort_column, self.sort_reverse = column, column in ("score", "salary", "fit")
            self.render_results()

        def _row_values(self, job: Job):
            return ("★" if job.favorite else "", job.score, job.fit if self.analysis else "", job.title, job.company, job.location,
                    job.experience, job.salary, job.posted, job.stage, job.status)

        def render_results(self):
            f = self._filter()
            if f is None:
                return
            selected = set(self.table.selection())
            self.table.delete(*self.table.get_children())
            visible = [j for j in self.all_results if matches_filters(j, f, self.settings)]
            visible.sort(key=lambda j: sort_key(j, self.sort_column), reverse=self.sort_reverse)
            self.visible = visible
            for job in visible:
                tags = []
                if job.hidden:
                    tags.append("hidden")
                elif job.favorite:
                    tags.append("fav")
                elif job.is_new:
                    tags.append("new")
                self.table.insert("", "end", iid=job.key, values=self._row_values(job), tags=tags)
            for iid in selected:
                if self.table.exists(iid):
                    self.table.selection_add(iid)
            new_total = sum(1 for j in self.all_results if j.is_new)
            self.summary.config(text=f"{len(visible)} shown / {len(self.all_results)} stored · {new_total} new this scan · "
                                     f"sorted by {self.sort_column} {'↓' if self.sort_reverse else '↑'}")
            self.status.config(text="Unknown salary/experience values are never invented — check details before selecting.")

        def _load_stored_jobs(self):
            self.all_results = self.store.load_jobs()
            for j in self.all_results:
                j.score, m = score_job(j, self.candidate)
                j.matched = ", ".join(m)
            self.jobs_by_url = {j.key: j for j in self.all_results}
            self._apply_fit()
            self.render_results()

        def rescore_all(self):
            for j in self.all_results:
                j.score, m = score_job(j, self.candidate)
                j.matched = ", ".join(m)
                self.store.update_job(j.key, score=j.score, matched=j.matched)
            self._apply_fit()
            self.render_results()

        # ----- selection helpers ----------------------------------------- #
        def select_all(self):
            self.table.selection_set(self.table.get_children())

        def selected_jobs(self):
            return [self.jobs_by_url[u] for u in self.table.selection() if u in self.jobs_by_url]

        def open_selected_url(self, _event=None):
            import webbrowser
            sel = self.selected_jobs()
            if sel:
                webbrowser.open(sel[0].key)

        def show_detail(self, _event=None):
            sel = self.selected_jobs()
            self.detail.configure(state="normal")
            self.detail.delete("1.0", "end")
            if len(sel) == 1:
                j = sel[0]
                lines = [j.title, f"{j.company} — {j.location}", "",
                         f"Match score : {j.score}/100", f"Matched     : {j.matched or '—'}",
                         (f"Resume fit  : {j.fit}/100" if self.analysis else "Resume fit  : set a resume in Profile / Resume"),
                         f"You have    : {', '.join(j.fit_matched) or '—'}", f"Missing     : {', '.join(j.fit_missing) or '—'}",
                         f"Experience  : {j.experience or 'not stated'}", f"Salary      : {j.salary or 'not disclosed'}",
                         f"Posted      : {j.posted or '—'}", f"Stage       : {j.stage}", f"Application : {j.status}",
                         f"First seen  : {j.first_seen[:10] or '—'}", "", "Skills/tags: " + (j.tags or "—"), "",
                         (j.description or j.snippet or "No description yet — use 'Load details'."), ""]
                if j.note:
                    lines += ["— Note —", j.note]
                self.detail.insert("1.0", "\n".join(lines))
            elif len(sel) > 1:
                self.detail.insert("1.0", f"{len(sel)} jobs selected.")
            self.detail.configure(state="disabled")

        # ----- per-job actions ------------------------------------------- #
        def _refresh_rows(self, jobs):
            for j in jobs:
                if self.table.exists(j.key):
                    self.table.item(j.key, values=self._row_values(j))

        def toggle_favorite(self):
            sel = self.selected_jobs()
            for j in sel:
                j.favorite = not j.favorite
                self.store.update_job(j.key, favorite=j.favorite)
            self.render_results()
            return "break"

        def hide_selected(self):
            sel = self.selected_jobs()
            for j in sel:
                j.hidden = True
                self.store.update_job(j.key, hidden=True, stage="Ignored")
                j.stage = "Ignored"
            self.render_results()

        def unhide_selected(self):
            for j in self.selected_jobs():
                j.hidden = False
                self.store.update_job(j.key, hidden=False)
            self.render_results()

        def set_stage(self, stage):
            for j in self.selected_jobs():
                j.stage = stage
                self.store.update_job(j.key, stage=stage)
            self.render_results()
            self._refresh_analytics()

        def edit_note(self):
            sel = self.selected_jobs()
            if len(sel) != 1:
                return
            j = sel[0]
            text = simpledialog.askstring("Note", f"Note for {j.title}:", initialvalue=j.note, parent=self)
            if text is None:
                return
            j.note = text.strip()[:2000]
            self.store.update_job(j.key, note=j.note)
            self.show_detail()
            self.render_results()

        def copy_url(self):
            sel = self.selected_jobs()
            if sel:
                self.clipboard_clear()
                self.clipboard_append("\n".join(j.key for j in sel))
                self.say(f"Copied {len(sel)} URL(s).")

        def load_details(self):
            sel = self.selected_jobs()
            if len(sel) != 1:
                messagebox.showinfo("Load details", "Select exactly one job to load its full description.")
                return
            self.enqueue("details", job=sel[0], candidate=self.candidate)

        def context_menu(self, event):
            row = self.table.identify_row(event.y)
            if row and row not in self.table.selection():
                self.table.selection_set(row)
            menu = tk.Menu(self, tearoff=0)
            menu.add_command(label="Open in default browser", command=self.open_selected_url)
            menu.add_command(label="Load full details (read-only visit)", command=self.load_details)
            menu.add_command(label="Toggle ★ favourite", command=self.toggle_favorite)
            menu.add_command(label="Edit note…", command=self.edit_note)
            stage_menu = tk.Menu(menu, tearoff=0)
            for st in PIPELINE_STAGES:
                stage_menu.add_command(label=st, command=lambda s=st: self.set_stage(s))
            menu.add_cascade(label="Set stage", menu=stage_menu)
            menu.add_separator()
            menu.add_command(label="Hide (ignore)", command=self.hide_selected)
            menu.add_command(label="Unhide", command=self.unhide_selected)
            menu.add_command(label="Copy URL", command=self.copy_url)
            menu.tk_popup(event.x_root, event.y_root)

        # ----- applying -------------------------------------------------- #
        def start_apply(self):
            chosen = self.selected_jobs()
            if not chosen:
                messagebox.showwarning("Select jobs", "Select one or more rows before clicking Auto Apply.")
                return
            if self.busy:
                messagebox.showwarning("Busy", "A search or application queue is already running.")
                return
            if self.settings.min_fit_to_apply and not self.analysis:
                messagebox.showwarning("Resume needed", "A minimum resume fit is set, but no resume has been analysed. "
                                       "Choose a resume under Profile / Resume first.")
                return
            todo, skipped = [], Counter()
            for j in chosen:
                if self.store.already_attempted(j):
                    skipped["already attempted"] += 1
                elif blacklisted(j, self.settings):
                    skipped["blacklisted"] += 1
                elif j.score < self.settings.min_score_to_apply:
                    skipped["below min score"] += 1
                elif self.settings.min_fit_to_apply and j.fit < self.settings.min_fit_to_apply:
                    skipped["below min resume fit"] += 1
                else:
                    todo.append(j)
            if not todo:
                messagebox.showinfo("Nothing to apply", "All chosen jobs were skipped: " +
                                    (", ".join(f"{v} {k}" for k, v in skipped.items()) or "none") + ".")
                return
            remaining = max(0, self.settings.daily_limit - self.store.attempts_today())
            mode = "DRY RUN (nothing will be clicked)" if self.settings.dry_run else "REAL applications"
            txt = (f"{mode}\n\nJobs to process: {len(todo)}"
                   + (f"\nSkipped up-front: " + ", ".join(f"{v} {k}" for k, v in skipped.items()) if skipped else "")
                   + (f"\nDaily allowance left today: {remaining} of {self.settings.daily_limit}" if not self.settings.dry_run and self.settings.daily_limit else "")
                   + "\n\nThis clicks Naukri's internal Apply button and can submit applications."
                   "\nUnknown recruiter questions pause for you. External sites are skipped."
                   "\nOnly job-specific confirmation counts as proof.\n\nContinue?")
            if not messagebox.askyesno("Confirm", txt, icon="warning"):
                return
            self.worker.settings = self.settings
            self.enqueue("apply", jobs=todo, candidate=self.candidate)

        def stop(self):
            self.worker.stop_event.set()
            self.worker.manual_action = "skip"
            self.worker.manual_event.set()
            self.say("Stop requested. An in-progress browser operation may finish before stopping.")

        # ----- dialogs ---------------------------------------------------- #
        def edit_profile(self):
            d = tk.Toplevel(self)
            d.title("Candidate / Resume")
            d.transient(self)
            d.grab_set()
            d.geometry("700x600")
            d.configure(bg=THEMES[self.settings.theme]["bg"])
            spec = [("full_name", "Full name"), ("email", "Email"), ("mobile", "Mobile number"),
                    ("resume", "Resume path (PDF/DOCX)"), ("years_experience", "Years of experience"),
                    ("notice_days", "Notice period (days)"), ("current_ctc_lpa", "Current CTC (LPA)"),
                    ("expected_ctc_lpa", "Expected CTC (LPA)"), ("city_pref", "Preferred city"),
                    ("headline", "Headline"), ("skills", "Skills (comma separated) — drives match score"),
                    ("target_titles", "Target title keywords (comma separated)")]
            vars_ = {}
            for i, (key, label) in enumerate(spec):
                ttk.Label(d, text=label).grid(row=i, column=0, sticky="w", padx=14, pady=7)
                v = tk.StringVar(value=getattr(self.candidate, key))
                ttk.Entry(d, textvariable=v, width=48).grid(row=i, column=1, sticky="ew", pady=6)
                vars_[key] = v
            ttk.Button(d, text="Browse…", command=lambda: vars_["resume"].set(
                filedialog.askopenfilename(parent=d, filetypes=[("Resumes", "*.pdf *.docx *.doc"), ("All", "*.*")])
                or vars_["resume"].get())).grid(row=3, column=2, padx=6)
            d.columnconfigure(1, weight=1)

            def save():
                p = Candidate(**{k: v.get().strip() for k, v in vars_.items()})
                if p.resume and not Path(p.resume).is_file():
                    messagebox.showerror("Resume not found", "Select a real resume file or leave blank.", parent=d)
                    return
                for k in ("years_experience", "notice_days", "current_ctc_lpa", "expected_ctc_lpa"):
                    val = getattr(p, k)
                    if val:
                        try:
                            float(val)
                        except ValueError:
                            messagebox.showerror("Invalid number", f"{k.replace('_', ' ')} must be numeric.", parent=d)
                            return
                self.candidate = p
                self.worker.candidate_for_rules = p
                save_candidate(p)
                if p.years_experience:
                    self.vars["candidate_years"].set(p.years_experience)
                self.refresh_analysis(silent=True)
                self.rescore_all()
                self.say("Profile saved locally and all jobs re-scored.")
                d.destroy()
            ttk.Button(d, text="Save profile", style="Accent.TButton", command=save).grid(row=len(spec), column=1, pady=16, sticky="w")
            ttk.Label(d, text="No password is ever stored. Complex questionnaires always need you.").grid(
                row=len(spec) + 1, column=0, columnspan=3, pady=4)

        def edit_settings(self):
            d = tk.Toplevel(self)
            d.title("Settings")
            d.transient(self)
            d.grab_set()
            d.geometry("760x700")
            d.configure(bg=THEMES[self.settings.theme]["bg"])
            s = self.settings
            vars_ = {
                "daily_limit": tk.StringVar(value=str(s.daily_limit)),
                "delay_min": tk.StringVar(value=str(s.delay_min)), "delay_max": tk.StringVar(value=str(s.delay_max)),
                "min_score_to_apply": tk.StringVar(value=str(s.min_score_to_apply)),
                "min_fit_to_apply": tk.StringVar(value=str(s.min_fit_to_apply)),
                "followup_days": tk.StringVar(value=str(s.followup_days)),
                "default_pages": tk.StringVar(value=str(s.default_pages)),
                "nav_retries": tk.StringVar(value=str(s.nav_retries)),
                "blacklist_companies": tk.StringVar(value=s.blacklist_companies),
                "blacklist_title_words": tk.StringVar(value=s.blacklist_title_words),
                "browser": tk.StringVar(value=s.browser), "theme": tk.StringVar(value=s.theme),
            }
            bools = {k: tk.BooleanVar(value=getattr(s, k)) for k in ("dry_run", "skip_hidden", "skip_external", "auto_backup")}
            rows = [("Daily apply limit (0 = unlimited)", "daily_limit"), ("Min delay between applies (s)", "delay_min"),
                    ("Max delay between applies (s)", "delay_max"), ("Min match score to auto-apply", "min_score_to_apply"), ("Min resume fit to auto-apply", "min_fit_to_apply"),
                    ("Follow-up reminder after (days)", "followup_days"), ("Default pages per search", "default_pages"),
                    ("Navigation retries", "nav_retries"), ("Blacklisted companies (,)", "blacklist_companies"),
                    ("Blacklisted title words (,)", "blacklist_title_words")]
            for i, (label, key) in enumerate(rows):
                ttk.Label(d, text=label).grid(row=i, column=0, sticky="w", padx=14, pady=5)
                ttk.Entry(d, textvariable=vars_[key], width=46).grid(row=i, column=1, sticky="ew", pady=4)
            r = len(rows)
            ttk.Label(d, text="Browser").grid(row=r, column=0, sticky="w", padx=14)
            ttk.Combobox(d, textvariable=vars_["browser"], values=["auto", "brave", "chromium"], state="readonly").grid(row=r, column=1, sticky="w")
            ttk.Label(d, text="Theme").grid(row=r + 1, column=0, sticky="w", padx=14, pady=5)
            ttk.Combobox(d, textvariable=vars_["theme"], values=["light", "dark"], state="readonly").grid(row=r + 1, column=1, sticky="w")
            ttk.Checkbutton(d, text="Dry-run (walk the flow but never click Apply)", variable=bools["dry_run"]).grid(row=r + 2, column=0, columnspan=2, sticky="w", padx=14)
            ttk.Checkbutton(d, text="Skip jobs I hid", variable=bools["skip_hidden"]).grid(row=r + 3, column=0, columnspan=2, sticky="w", padx=14)
            ttk.Checkbutton(d, text="Daily automatic backup", variable=bools["auto_backup"]).grid(row=r + 4, column=0, columnspan=2, sticky="w", padx=14)
            ttk.Label(d, text='Screening rules (JSON list of {"pattern": regex, "answer": "{field}"}):').grid(
                row=r + 5, column=0, columnspan=2, sticky="w", padx=14, pady=(10, 2))
            rules = tk.Text(d, height=8, width=80)
            rules.grid(row=r + 6, column=0, columnspan=3, padx=14, sticky="ew")
            rules.insert("1.0", json.dumps(s.screening_rules, indent=2))
            d.columnconfigure(1, weight=1)

            def save():
                try:
                    parsed = json.loads(rules.get("1.0", "end"))
                    if not isinstance(parsed, list) or not all(isinstance(x, dict) for x in parsed):
                        raise ValueError("Rules must be a JSON list of objects.")
                    for x in parsed:
                        re.compile(str(x.get("pattern", "")))
                    new = Settings(**{**asdict(s),
                                      "daily_limit": int(vars_["daily_limit"].get()),
                                      "delay_min": float(vars_["delay_min"].get()),
                                      "delay_max": float(vars_["delay_max"].get()),
                                      "min_score_to_apply": int(vars_["min_score_to_apply"].get()),
                                      "min_fit_to_apply": int(vars_["min_fit_to_apply"].get()),
                                      "followup_days": int(vars_["followup_days"].get()),
                                      "default_pages": int(vars_["default_pages"].get()),
                                      "nav_retries": int(vars_["nav_retries"].get()),
                                      "blacklist_companies": vars_["blacklist_companies"].get(),
                                      "blacklist_title_words": vars_["blacklist_title_words"].get(),
                                      "browser": vars_["browser"].get(), "theme": vars_["theme"].get(),
                                      "screening_rules": parsed,
                                      **{k: v.get() for k, v in bools.items()}})
                except (ValueError, re.error, TypeError) as exc:
                    messagebox.showerror("Invalid settings", str(exc), parent=d)
                    return
                self.settings = sanitize_settings(new)
                self.worker.settings = self.settings
                save_settings(self.settings)
                self.apply_theme()
                self.say("Settings saved.")
                d.destroy()
            ttk.Button(d, text="Save settings", style="Accent.TButton", command=save).grid(row=r + 7, column=1, pady=14, sticky="w")

        # ----- resume analyzer ------------------------------------------- #
        def _debounced_render(self, *_):
            if self._quick_job:
                self.after_cancel(self._quick_job)
            self._quick_job = self.after(250, self.render_results)

        def _years(self):
            try:
                return float(self.candidate.years_experience) if self.candidate.years_experience else None
            except ValueError:
                return None

        def _apply_fit(self):
            if self.analysis:
                apply_fit(self.all_results, self.analysis, self._years())

        def refresh_analysis(self, silent=False):
            self.analysis = None
            if not self.candidate.resume:
                return None
            try:
                self.analysis = analyze_resume_file(self.candidate.resume)
            except ResumeError as exc:
                self.say("Resume analysis: " + str(exc))
                if not silent:
                    messagebox.showwarning("Resume analysis", str(exc))
                return None
            except Exception as exc:  # a bad file must never break the app
                LOG.error("resume analysis failed: %s\n%s", exc, traceback.format_exc())
                self.say("Resume analysis failed: " + str(exc))
                return None
            self._apply_fit()
            self.render_results()
            self.say(f"Resume analysed: score {self.analysis.score}/100, {len(self.analysis.skills)} skills detected.")
            return self.analysis

        def show_fit_jobs(self):
            if not self.analysis:
                messagebox.showinfo("Resume fit", "Choose a resume under Profile / Resume first (PDF, DOCX or TXT).")
                return
            self.vars["min_fit"].set("60")
            self.sort_column, self.sort_reverse = "fit", True
            self.render_results()

        def open_resume_analyzer(self):
            import webbrowser
            t = THEMES[self.settings.theme]
            d = tk.Toplevel(self)
            d.title("Resume Analyzer")
            d.geometry("1000x740")
            d.transient(self)
            d.configure(bg=t["bg"])
            top = ttk.Frame(d, padding=8)
            top.pack(fill="x")
            path_var = tk.StringVar(value=self.candidate.resume)
            ttk.Label(top, text="Resume:").pack(side="left")
            ttk.Entry(top, textvariable=path_var).pack(side="left", padx=6, fill="x", expand=True)
            nb = ttk.Notebook(d)
            nb.pack(fill="both", expand=True, padx=8, pady=6)

            def text_tab(title):
                frame = ttk.Frame(nb)
                box = tk.Text(frame, wrap="word", font=("Consolas", 10), relief="flat", padx=10, pady=8,
                              bg=t["panel"], fg=t["fg"])
                sb = ttk.Scrollbar(frame, orient="vertical", command=box.yview)
                box.configure(yscrollcommand=sb.set)
                sb.pack(side="right", fill="y")
                box.pack(fill="both", expand=True)
                nb.add(frame, text=title)
                return box

            def tree_tab(title, cols):
                frame = ttk.Frame(nb)
                tree = ttk.Treeview(frame, columns=[c[0] for c in cols], show="headings")
                for key, label, width in cols:
                    tree.heading(key, text=label)
                    tree.column(key, width=width, stretch=True)
                sb = ttk.Scrollbar(frame, orient="vertical", command=tree.yview)
                tree.configure(yscrollcommand=sb.set)
                sb.pack(side="right", fill="y")
                tree.pack(fill="both", expand=True)
                nb.add(frame, text=title)
                return tree

            resume_box = text_tab("Resume report")
            profile_box = text_tab("Profile report")
            sug = tree_tab("Suggested searches (double-click to run)",
                           (("query", "Search", 230), ("city", "City", 100), ("exp", "Exp", 50), ("why", "Why", 540)))
            gaps = tree_tab("Skill gaps in shown jobs", (("skill", "Skill you lack", 220), ("jobs", "Jobs asking", 100), ("pct", "% of jobs", 100)))
            best = tree_tab("Best resume-fit jobs (double-click to open)",
                            (("fit", "Fit", 50), ("title", "Title", 300), ("company", "Company", 160),
                             ("have", "You have", 220), ("missing", "Missing", 220)))

            def put(box, text):
                box.configure(state="normal")
                box.delete("1.0", "end")
                box.insert("1.0", text)
                box.configure(state="disabled")

            def render_all(a):
                put(resume_box, resume_report_text(a) if a else "No resume analysed yet. Choose a file above and click Analyze.")
                put(profile_box, profile_report_text(analyze_profile(self.candidate, a)))
                for tree in (sug, gaps, best):
                    tree.delete(*tree.get_children())
                if not a:
                    return
                for i, s_ in enumerate(suggest_searches(a, self.candidate)):
                    sug.insert("", "end", iid=f"s{i}", values=(s_["query"], s_["city"], s_["experience"], s_["why"]))
                pool = self.visible or self.all_results
                for skill, n, pct in skill_gaps(pool, a):
                    gaps.insert("", "end", values=(skill, n, f"{pct}%"))
                ranked = sorted((j for j in self.all_results if not j.hidden), key=lambda j: -j.fit)[:40]
                for j in ranked:
                    best.insert("", "end", iid=j.key, values=(j.fit, j.title, j.company,
                                                              ", ".join(j.fit_matched[:6]), ", ".join(j.fit_missing[:6])))

            def run():
                path = path_var.get().strip()
                if not path:
                    messagebox.showwarning("Resume", "Choose a resume file first.", parent=d)
                    return
                try:
                    a = analyze_resume_file(path)
                except ResumeError as exc:
                    messagebox.showerror("Resume analysis", str(exc), parent=d)
                    return
                if path != self.candidate.resume:
                    self.candidate.resume = path
                    save_candidate(self.candidate)
                self.analysis = a
                self._apply_fit()
                self.render_results()
                render_all(a)

            def browse():
                p = filedialog.askopenfilename(parent=d, filetypes=[("Resumes", "*.pdf *.docx *.txt"), ("All", "*.*")])
                if p:
                    path_var.set(p)
                    run()

            def fill():
                if not self.analysis:
                    messagebox.showinfo("Profile", "Analyze a resume first.", parent=d)
                    return
                new, changes = fill_profile_from_resume(self.candidate, self.analysis)
                if not changes:
                    messagebox.showinfo("Profile", "Nothing to fill — those fields already have values.", parent=d)
                    return
                if not messagebox.askyesno("Fill empty profile fields", "These EMPTY fields will be filled from the resume:\n\n"
                                           + "\n".join(changes) + "\n\nExisting values are never overwritten. Save?", parent=d):
                    return
                self.candidate = new
                self.worker.candidate_for_rules = new
                save_candidate(new)
                self.rescore_all()
                render_all(self.analysis)

            def run_suggestion(_e=None):
                sel = sug.selection()
                if not sel:
                    return
                q, city, exp, _why = sug.item(sel[0], "values")
                self.vars["query"].set(q)
                if city:
                    self.vars["city"].set(city)
                self.vars["experience"].set(str(exp))
                d.destroy()
                self.search()

            def open_best(_e=None):
                sel = best.selection()
                if sel:
                    webbrowser.open(sel[0])

            sug.bind("<Double-1>", run_suggestion)
            best.bind("<Double-1>", open_best)
            ttk.Button(top, text="Browse…", command=browse).pack(side="left", padx=3)
            ttk.Button(top, text="Analyze", style="Accent.TButton", command=run).pack(side="left", padx=3)
            bottom = ttk.Frame(d, padding=8)
            bottom.pack(fill="x")
            ttk.Button(bottom, text="Fill empty profile fields from resume", command=fill).pack(side="left")
            ttk.Button(bottom, text="Show resume-fit jobs (≥60)", command=lambda: (self.show_fit_jobs(), d.destroy())).pack(side="left", padx=6)
            ttk.Button(bottom, text="Close", command=d.destroy).pack(side="right")
            render_all(self.analysis)

        def manual_prompt(self, data):
            if self.manual_dialog:
                return
            dlg = tk.Toplevel(self)
            self.manual_dialog = dlg
            dlg.title("Action needed — verify application")
            dlg.geometry("640x340")
            dlg.transient(self)
            dlg.configure(bg=THEMES[self.settings.theme]["bg"], padx=20, pady=16)
            ttk.Label(dlg, text="Application needs manual verification", font=("Segoe UI", 15, "bold")).pack(anchor="w", pady=(0, 10))
            ttk.Label(dlg, text=data["title"], font=("Segoe UI", 11, "bold"), wraplength=590).pack(anchor="w")
            ttk.Label(dlg, text=data["message"], wraplength=590, justify="left").pack(anchor="w", pady=10)
            if data.get("unknown"):
                ttk.Label(dlg, text="Unanswered: " + "; ".join(data["unknown"]), wraplength=590, foreground="#b45309").pack(anchor="w")
            bar = ttk.Frame(dlg)
            bar.pack(fill="x", pady=14)

            def finish(choice):
                self.worker.manual_action = choice
                self.worker.manual_event.set()
                dlg.destroy()
                self.manual_dialog = None
            ttk.Button(bar, text="Verify & Continue", command=lambda: finish("verify")).pack(side="left", padx=4)
            ttk.Button(bar, text="Skip & Continue", command=lambda: finish("skip")).pack(side="left", padx=4)
            dlg.protocol("WM_DELETE_WINDOW", lambda: finish("skip"))

        # ----- event pump ------------------------------------------------- #
        def poll(self):
            try:
                while True:
                    kind, data = self.events.get_nowait()
                    self._handle_event(kind, data)
            except queue.Empty:
                pass
            self.after(150, self.poll)

        def _handle_event(self, kind, data):
            if kind == "log":
                self.say(data["text"])
            elif kind == "progress":
                self.status.config(text=data["text"])
            elif kind == "idle":
                self.busy = False
            elif kind == "search_done":
                self.busy = False
                self.all_results = self.store.load_jobs()
                scored = {j.key: j for j in data["jobs"]}
                for j in self.all_results:
                    if j.key in scored:
                        j.is_new = scored[j.key].is_new
                        j.score, j.matched = scored[j.key].score, scored[j.key].matched
                self.jobs_by_url = {j.key: j for j in self.all_results}
                self._apply_fit()
                self.render_results()
                self.say(f"Search finished: {len(data['jobs'])} found, {data['new_count']} new. Results come from the real page DOM.")
            elif kind == "job_updated":
                self.busy = False
                j = data["job"]
                if j.key in self.jobs_by_url:
                    self.jobs_by_url[j.key].description = j.description
                    self.jobs_by_url[j.key].tags = j.tags
                    self.jobs_by_url[j.key].score, self.jobs_by_url[j.key].matched = j.score, j.matched
                self._apply_fit()
                self.render_results()
                self.show_detail()
            elif kind == "search_blocked":
                self.busy = False
                self.say(data["message"])
                messagebox.showerror("Website access denied", data["message"])
            elif kind == "login_open":
                self.busy = False
            elif kind == "error":
                self.busy = False
                messagebox.showerror("Browser operation failed", data["message"])
            elif kind == "needs_manual":
                self.manual_prompt(data)
            elif kind == "applying":
                self.status.config(text=f"Applying {data['index']}/{data['total']}: {data['title']}")
            elif kind == "application_result":
                job = data["job"]
                job.status = data["status"]
                if job.status == "CONFIRMED" and job.stage in ("New", "Saved"):
                    job.stage = "Applied"
                self._refresh_rows([job])
                self._refresh_history()
            elif kind == "batch_finished":
                self.busy = False
                self._refresh_history()
                self._refresh_followups()
                self._refresh_analytics()
                self.status.config(text=f"Batch done: {data['confirmed']} confirmed (UI+network), "
                                        f"{data['partial']} partial evidence, {data['skipped']} skipped.")
                self.say("Application queue finished. Read the history for exact confirmation status.")

        # ----- tables ------------------------------------------------------ #
        def _refresh_history(self):
            self.hist.delete(*self.hist.get_children())
            for idx, row in enumerate(self.store.list()):
                self.hist.insert("", "end", iid=str(idx), values=row[:5])

        def _refresh_followups(self):
            self.follow.delete(*self.follow.get_children())
            due = self.store.followups_due(self.settings.followup_days)
            self.follow_label.config(text=f"{len(due)} confirmed application(s) older than {self.settings.followup_days} days "
                                          f"still at stage 'Applied'. Double-click to open; update the stage when you hear back.")
            for i, (title, company, day, url) in enumerate(due):
                self.follow.insert("", "end", iid=url, values=(title, company, day))

        def _follow_open(self, _e=None):
            import webbrowser
            sel = self.follow.selection()
            if sel:
                webbrowser.open(sel[0])

        def _refresh_analytics(self):
            self.analytics_box.configure(state="normal")
            self.analytics_box.delete("1.0", "end")
            self.analytics_box.insert("1.0", stats_text(self.store))
            self.analytics_box.configure(state="disabled")

        # ----- exports ----------------------------------------------------- #
        def export_menu(self):
            menu = tk.Menu(self, tearoff=0)
            menu.add_command(label="Shown results → CSV", command=self.export_results)
            menu.add_command(label="All stored jobs → JSON", command=self.export_json)
            menu.add_command(label="Application history → CSV", command=self.export_history)
            menu.add_command(label="HTML report", command=self.export_report)
            menu.add_separator()
            menu.add_command(label="Backup database + settings (.zip)", command=self.backup_now)
            menu.add_command(label="Remove old untouched jobs (60+ days)", command=self.purge)
            x, y = self.winfo_pointerxy()
            menu.tk_popup(x, y)

        def _ask_save(self, name, ext, kind):
            return filedialog.asksaveasfilename(defaultextension=ext, initialfile=name, filetypes=[(kind, "*" + ext)])

        def export_results(self):
            path = self._ask_save("job_search_results.csv", ".csv", "CSV")
            if not path:
                return
            try:
                write_csv(path, ["score", "fit", "title", "company", "location", "experience", "salary", "posted", "stage",
                                 "status", "favorite", "note", "url", "job_id"],
                          [[j.score, j.fit, j.title, j.company, j.location, j.experience, j.salary, j.posted, j.stage,
                            j.status, int(j.favorite), j.note, j.key, j.job_id] for j in self.visible])
                self.say("Exported to " + path)
            except OSError as exc:
                messagebox.showerror("Export failed", str(exc))

        def export_json(self):
            path = self._ask_save("jobs.json", ".json", "JSON")
            if path:
                try:
                    Path(path).write_text(jobs_to_json(self.all_results), encoding="utf-8")
                    self.say("Exported to " + path)
                except OSError as exc:
                    messagebox.showerror("Export failed", str(exc))

        def export_history(self):
            path = self._ask_save("job_application_history.csv", ".csv", "CSV")
            if path:
                try:
                    write_csv(path, ["timestamp", "title", "company", "status", "evidence", "job_url"], self.store.list())
                    self.say("Exported to " + path)
                except OSError as exc:
                    messagebox.showerror("Export failed", str(exc))

        def export_report(self):
            path = self._ask_save("application_report.html", ".html", "HTML")
            if path:
                try:
                    Path(path).write_text(history_report_html(self.store), encoding="utf-8")
                    self.say("Report written to " + path)
                except OSError as exc:
                    messagebox.showerror("Export failed", str(exc))

        def backup_now(self):
            path = self._ask_save(f"job_auto_apply_backup_{today_utc()}.zip", ".zip", "ZIP")
            if path:
                try:
                    self.store.backup_to(Path(path))
                    self.say("Backup written to " + path)
                except (OSError, sqlite3.Error) as exc:
                    messagebox.showerror("Backup failed", str(exc))

        def purge(self):
            if messagebox.askyesno("Remove old jobs", "Delete stored jobs not seen for 60+ days (never favourites, notes or applied)?"):
                n = self.store.purge_old_jobs(60)
                self._load_stored_jobs()
                self.say(f"Removed {n} old job(s).")

        def on_close(self):
            if self.busy and not messagebox.askyesno("Close", "An operation is running. Stop and close?"):
                return
            self.worker.stop_event.set()
            self.worker.manual_action = "skip"
            self.worker.manual_event.set()
            self.commands.put(("quit", {}))
            self.destroy()

    try:
        app = App()
        app.mainloop()
    except Exception as exc:
        LOG.error("GUI failed: %s\n%s", exc, traceback.format_exc())
        print("Could not start desktop interface:", exc)
        print("Check that Python includes tkinter (standard installer from python.org).")
        return 2
    return 0


# --------------------------------------------------------------------------- #
# Self-test (offline, no browser, no display)
# --------------------------------------------------------------------------- #
def self_test() -> int:
    import tempfile
    import unittest
    from unittest.mock import Mock

    SAMPLE_RESUME = """John Doe
john.doe@example.com | +91 9876543210 | linkedin.com/in/johndoe | github.com/johndoe

Summary
Backend engineer with 4 years of experience building APIs.

Experience
Software Engineer, Acme Corp  Jan 2021 - Present
- Built REST APIs with Python, Django and PostgreSQL serving 50000 requests per day
- Reduced latency by 35% using Redis caching
- Automated deployments with Docker and Jenkins
Junior Developer, Beta Ltd  2020 - 2021
- Developed Flask microservices

Education
B.Tech Computer Science 2016 - 2020

Skills
Python, Django, Flask, SQL, Docker, Redis, Git, AWS
"""

    class Tests(unittest.TestCase):
        def test_safe_domains(self):
            self.assertTrue(naukri_url("https://www.naukri.com/job-listings-123456789012"))
            self.assertFalse(naukri_url("http://www.naukri.com"))
            self.assertFalse(naukri_url("https://www.naukri.com.attacker.example"))

        def test_search_url(self):
            url = search_url("NLP Developer", "Bengaluru", "2", "7 days")
            self.assertIn("k=NLP+Developer", url)
            self.assertIn("experience=2", url)
            self.assertIn("jobAge=7", url)
            with self.assertRaises(ValueError):
                search_url("", "x")
            with self.assertRaises(ValueError):
                search_url("a", "b", "abc")
            with self.assertRaises(ValueError):
                search_url("a", "b", "99")

        def test_job_parser(self):
            j = job_from_dict({"title": "NLP Engineer", "company": "Acme",
                               "url": "https://www.naukri.com/job-listings-xyz-280926008860?src=x"}, "https://www.naukri.com")
            self.assertEqual(j.job_id, "280926008860")
            self.assertNotIn("src=", j.key)
            self.assertIsNone(job_from_dict({"title": "Fake", "url": "https://evil.example"}, "https://www.naukri.com"))

        def test_ranges(self):
            self.assertEqual(parse_year_range("2-5 Yrs"), (2.0, 5.0))
            self.assertIsNone(parse_year_range("Not disclosed"))
            self.assertEqual(parse_salary_range_lpa("6-12 LPA"), (6.0, 12.0))
            self.assertEqual(parse_salary_range_lpa("10 Lacs PA"), (10.0, 10.0))
            self.assertIsNone(parse_salary_range_lpa("Not disclosed"))
            self.assertEqual(parse_posted_days("3 Days Ago"), 3.0)
            self.assertEqual(parse_posted_days("Just now"), 0.0)
            self.assertEqual(parse_posted_days("30+ Days Ago"), 30.0)
            self.assertEqual(parse_posted_days("2 weeks ago"), 14.0)
            self.assertIsNone(parse_posted_days(""))

        def test_scoring(self):
            job = Job("https://www.naukri.com/x", "Senior Python Developer", experience="2-5 Yrs",
                      tags="Django, REST, SQL", description="Build APIs with Python and Django")
            cand = Candidate(skills="python, django, aws", target_titles="python", years_experience="3")
            score, matched = score_job(job, cand)
            self.assertEqual(matched, ["python", "django"])
            self.assertEqual(score, 40 + 25 + 15)
            # 'java' must not match inside 'javascript'
            js = Job("https://www.naukri.com/y", "JavaScript Dev", description="javascript only")
            self.assertEqual(score_job(js, Candidate(skills="java"))[1], [])
            # neutral when nothing configured
            self.assertEqual(score_job(js, Candidate())[0], int(round(30 + 12.5 + 7.5)))

        def test_filters(self):
            job = Job("https://www.naukri.com/x", "Python", company="Acme", salary="6-12 LPA",
                      experience="2-5 Yrs", snippet="Work from Home", score=70, posted="3 days ago")
            self.assertTrue(matches_filters(job, {"min_salary": "5", "candidate_years": "3", "mode": "Remote"}))
            self.assertTrue(matches_filters(job, {"min_salary": "10"}))      # high end still >= 10
            self.assertFalse(matches_filters(job, {"min_salary": "13"}))
            self.assertFalse(matches_filters(job, {"min_score": "80"}))
            self.assertFalse(matches_filters(job, {"max_age_days": "2"}))
            self.assertTrue(matches_filters(job, {"quick": "acme python"}))
            self.assertFalse(matches_filters(job, {"exclude": "foo, acme"}))
            self.assertFalse(matches_filters(job, {"exclude_title": "python"}))
            job.hidden = True
            self.assertFalse(matches_filters(job, {}))
            self.assertTrue(matches_filters(job, {"show_hidden": True}))
            unknown = Job("https://www.naukri.com/z", "T", salary="Not disclosed")
            self.assertTrue(matches_filters(unknown, {"min_salary": "50"}))  # unknown stays visible

        def test_blacklist(self):
            s = Settings(blacklist_companies="Evil Corp", blacklist_title_words="intern")
            self.assertTrue(blacklisted(Job("u", "Python", company="Evil Corp Ltd"), s))
            self.assertTrue(blacklisted(Job("u", "Python Intern", company="Ok"), s))
            self.assertFalse(blacklisted(Job("u", "Internal Tools Dev", company="Ok"), s))

        def test_screening(self):
            c = Candidate(notice_days="30", expected_ctc_lpa="18")
            rules = Settings().screening_rules
            self.assertEqual(screening_answer("What is your notice period?", rules, c), "30")
            self.assertEqual(screening_answer("Expected CTC", rules, c), "18")
            self.assertEqual(screening_answer("Favourite colour", rules, c), "")
            self.assertEqual(screening_answer("x", [{"pattern": "(", "answer": "a"}], c), "")  # bad regex ignored

        def test_block_response(self):
            page = Mock()
            page.locator.return_value.inner_text.return_value = "Access Denied - You don't have permission to access this server"
            page.title.return_value = "Access Denied"
            self.assertTrue(blocked(page, Mock(status=200)))
            self.assertTrue(blocked(page, Mock(status=403)))

        def test_network_confirm(self):
            response = Mock(url="https://www.naukri.com/myapply/saveApply", status=200)
            response.text.return_value = '{"multiApplyResp":{"280926008860":200}}'
            response.request.post_data = "strJobsarr=[280926008860]"
            self.assertIn("Matching", network_confirmation([response], "280926008860"))
            self.assertEqual(network_confirmation([response], "000000000000"), "")
            self.assertEqual(network_confirmation([response], ""), "")

        def test_settings_roundtrip_and_sanitize(self):
            with tempfile.TemporaryDirectory() as d:
                p = Path(d) / "s.json"
                s = Settings(daily_limit=9999, delay_min=0.1, delay_max=0.2, theme="neon")
                save_settings(s, p)
                loaded = load_settings(p)
                self.assertEqual(loaded.daily_limit, 9999)
                self.assertGreaterEqual(loaded.delay_min, 1.0)
                self.assertGreaterEqual(loaded.delay_max, loaded.delay_min)
                self.assertEqual(loaded.theme, "light")
                p.write_text("not json")
                self.assertEqual(load_settings(p).daily_limit, Settings().daily_limit)

        def test_candidate_roundtrip(self):
            with tempfile.TemporaryDirectory() as d:
                p = Path(d) / "c.json"
                save_candidate(Candidate(full_name="A", skills="python"), p)
                self.assertEqual(load_candidate(p).skills, "python")

        def test_database(self):
            with tempfile.TemporaryDirectory() as d:
                store = History(Path(d) / "t.db")
                j = Job("https://www.naukri.com/job-listings-123456789012", "A", company="Acme", job_id="123456789012", score=50)
                self.assertEqual(store.upsert_jobs([j]), 1)
                self.assertTrue(j.is_new)
                self.assertEqual(store.upsert_jobs([j]), 0)           # second scan: not new
                store.update_job(j.key, favorite=True, note="call HR", stage="Saved")
                loaded = store.load_jobs()[0]
                self.assertTrue(loaded.favorite)
                self.assertEqual(loaded.note, "call HR")
                self.assertFalse(store.already_attempted(j))
                store.add(j, "ATTEMPTED", "about to click")
                self.assertTrue(store.already_attempted(j))
                self.assertEqual(store.attempts_today(), 1)
                store.add(j, "CONFIRMED", "ok")
                self.assertEqual(store.load_jobs()[0].stage, "Applied")
                self.assertEqual(store.status_counts()["CONFIRMED"], 1)
                self.assertIn("Confirmed applications : 1", stats_text(store))
                self.assertIn("Acme", history_report_html(store))
                # user data survives re-scan
                j2 = Job(j.key, "A", company="Acme", job_id=j.job_id, score=60)
                store.upsert_jobs([j2])
                self.assertTrue(j2.favorite)
                self.assertEqual(j2.note, "call HR")
                # same job id under a different URL is still a duplicate
                other = Job("https://www.naukri.com/other-123456789012", "A", job_id="123456789012")
                self.assertTrue(store.already_attempted(other))
                self.assertEqual(store.purge_old_jobs(0), 0)          # applied job is never purged
                zpath = store.backup_to(Path(d) / "b.zip")
                with zipfile.ZipFile(zpath) as zf:
                    self.assertIn("history.sqlite3", zf.namelist())
                store.close()

        def test_unbounded_settings_and_history(self):
            with tempfile.TemporaryDirectory() as d:
                path = Path(d) / "s.json"
                save_settings(Settings(daily_limit=10000, default_pages=0), path)
                x = load_settings(path)
                self.assertEqual((x.daily_limit, x.default_pages), (10000, 0))
                store = History(Path(d) / "history.db")
                for i in range(12):
                    j = Job(f"https://www.naukri.com/job-{100000000000+i}", f"Job {i}")
                    store.upsert_jobs([j])
                    store.add(j, "SKIPPED", "test")
                self.assertEqual(len(store.load_jobs(limit=None)), 12)
                self.assertEqual(len(store.list()), 12)
                store.close()

        def test_legacy_limits_migration(self):
            with tempfile.TemporaryDirectory() as d:
                path = Path(d) / "legacy.json"
                path.write_text(json.dumps({"default_pages": 2, "daily_limit": 25, "theme": "dark"}))
                s = load_settings(path)
                self.assertEqual((s.default_pages, s.daily_limit, s.theme), (0, 0, "dark"))
                self.assertTrue(s.limits_migrated_v22)
                s.default_pages, s.daily_limit = 3, 8
                save_settings(s, path)
                self.assertEqual(load_settings(path).daily_limit, 8)

        def test_partial_evidence_not_applied_stage(self):
            with tempfile.TemporaryDirectory() as d:
                store = History(Path(d) / "history.db")
                j = Job("https://www.naukri.com/job-123456789012", "Engineer")
                store.upsert_jobs([j])
                store.add(j, "UI_EVIDENCE_ONLY", "title-only evidence")
                self.assertEqual(store.load_jobs()[0].stage, "New")
                self.assertTrue(store.already_attempted(j))
                store.close()

        def test_click_pending_is_safe_and_counted(self):
            with tempfile.TemporaryDirectory() as d:
                store = History(Path(d) / "history.db")
                j = Job("https://www.naukri.com/job-123456789012", "Engineer")
                store.add(j, "CLICK_PENDING", "in-flight click")
                self.assertEqual(store.attempts_today(), 1)
                self.assertTrue(store.already_attempted(j))
                store.close()

        def test_browser_closed_detection(self):
            self.assertTrue(browser_closed_error(RuntimeError(
                "Page.wait_for_timeout: Target page, context or browser has been closed")))
            self.assertFalse(browser_closed_error(ValueError("ordinary validation problem")))

        def test_dry_run_not_counted(self):
            with tempfile.TemporaryDirectory() as d:
                store = History(Path(d) / "t.db")
                j = Job("https://www.naukri.com/a-123456789012", "A", job_id="123456789012")
                store.add(j, "DRY_RUN", "nothing clicked")
                self.assertEqual(store.attempts_today(), 0)
                self.assertFalse(store.already_attempted(j))
                store.close()

        def test_sort_and_duplicates(self):
            a = Job("u1", "Dev", company="X", score=10, salary="5-8 LPA")
            b = Job("u2", "Dev", company="X", score=90, salary="Not disclosed")
            self.assertGreater(sort_key(b, "score"), sort_key(a, "score"))
            self.assertGreater(sort_key(a, "salary"), sort_key(b, "salary"))
            self.assertEqual(len(duplicate_groups([a, b])), 1)

        def test_csv_helpers(self):
            self.assertEqual(csv_list("a, b;c\nd"), ["a", "b", "c", "d"])
            with tempfile.TemporaryDirectory() as d:
                p = str(Path(d) / "o.csv")
                write_csv(p, ["a", "b"], [[1, "x"]])
                self.assertIn("a,b", Path(p).read_text(encoding="utf-8-sig"))

        def test_skill_boundaries(self):
            sk = extract_skills("Java and JavaScript, C++ & C#, Node.js, Spring Boot, the rest of the team, in spring 2020")
            for name in ("java", "javascript", "c++", "c#", "node.js", "spring boot"):
                self.assertIn(name, sk)
            self.assertNotIn("rest api", sk)
            self.assertNotIn("spring framework", sk)
            self.assertNotIn("java", extract_skills("javascript only"))

        def test_resume_analysis(self):
            a = analyze_resume_text(SAMPLE_RESUME)
            self.assertEqual(a.email, "john.doe@example.com")
            self.assertIn("9876543210", a.phone)
            self.assertIn("python", a.skills)
            self.assertIn("experience", a.sections)
            self.assertEqual(estimate_years(SAMPLE_RESUME, now_year=2026), (6.0, 4.0))
            self.assertGreaterEqual(a.quantified, 2)
            self.assertTrue(any(r in dict(a.roles) for r in ("Python Developer", "Backend Developer")))
            self.assertGreaterEqual(a.score, 60)
            self.assertIn("Resume score".upper(), resume_report_text(a).upper().replace("RESUME SCORE", "RESUME SCORE"))

        def test_resume_fit(self):
            a = analyze_resume_text(SAMPLE_RESUME)
            job = Job("https://www.naukri.com/j-123456789012", "Senior Python Developer", experience="3-6 Yrs",
                      tags="Python, Django, Redis, Kubernetes")
            fit, matched, missing = resume_fit(job, a, 5)
            self.assertEqual(set(matched), {"python", "django", "redis"})
            self.assertEqual(missing, ["kubernetes"])
            self.assertTrue(75 <= fit <= 90, fit)
            chef = Job("https://www.naukri.com/c-123456789013", "Head Chef")
            self.assertLess(resume_fit(chef, a)[0], 60)
            apply_fit([job], a, 5)
            self.assertEqual(job.fit, fit)
            gaps = skill_gaps([job], a)
            self.assertEqual(gaps[0][0], "kubernetes")
            self.assertTrue(matches_filters(job, {"min_fit": "70"}))
            self.assertFalse(matches_filters(job, {"min_fit": "95"}))

        def test_profile_analysis(self):
            a = analyze_resume_text(SAMPLE_RESUME)
            c = Candidate(email="bad", skills="python, kubernetes, rust", years_experience="1",
                          expected_ctc_lpa="5", current_ctc_lpa="10")
            r = analyze_profile(c, a)
            joined = " ".join(r.warnings)
            self.assertIn("kubernetes", joined)
            self.assertIn("Email address", joined)
            self.assertIn("Expected CTC is lower", joined)
            self.assertIn("1 years", joined)
            new, changes = fill_profile_from_resume(Candidate(email="mine@x.com"), a)
            self.assertEqual(new.email, "mine@x.com")          # never overwritten
            self.assertIn("9876543210", new.mobile)
            self.assertTrue(new.skills and new.target_titles)
            self.assertTrue(changes)

        def test_suggestions(self):
            a = analyze_resume_text(SAMPLE_RESUME)
            sug = suggest_searches(a, Candidate(city_pref="Pune", target_titles="Data Engineer"))
            self.assertTrue(sug)
            self.assertEqual(sug[0]["city"], "Pune")
            self.assertTrue(any(s["query"] == "Data Engineer" for s in sug) or len(sug) == 8)

        def test_resume_files(self):
            with tempfile.TemporaryDirectory() as d:
                p = Path(d) / "r.docx"
                paras = "".join(f"<w:p><w:r><w:t>{ln}</w:t></w:r></w:p>" for ln in SAMPLE_RESUME.splitlines())
                with zipfile.ZipFile(p, "w") as zf:
                    zf.writestr("word/document.xml", f"<w:document><w:body>{paras}</w:body></w:document>")
                self.assertIn("python", analyze_resume_file(str(p)).skills)
                t = Path(d) / "r.txt"
                t.write_text(SAMPLE_RESUME, encoding="utf-8")
                self.assertEqual(analyze_resume_file(str(t)).email, "john.doe@example.com")
                with self.assertRaises(ResumeError):
                    extract_resume_text(str(Path(d) / "missing.pdf"))
                bad = Path(d) / "r.xyz"
                bad.write_text("x" * 100)
                with self.assertRaises(ResumeError):
                    extract_resume_text(str(bad))

    suite = unittest.defaultTestLoader.loadTestsFromTestCase(Tests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def main() -> int:
    parser = argparse.ArgumentParser(description="Job Auto Apply PRO — Naukri search, scoring and selective auto-apply")
    parser.add_argument("--self-test", action="store_true", help="run offline tests (no browser, no display)")
    parser.add_argument("--stats", action="store_true", help="print pipeline statistics and exit")
    parser.add_argument("--export-history", metavar="CSV", help="write application history to a CSV file and exit")
    parser.add_argument("--report", metavar="HTML", help="write an HTML application report and exit")
    parser.add_argument("--backup", metavar="ZIP", help="write a backup archive and exit")
    parser.add_argument("--analyze-resume", metavar="FILE", help="analyse a PDF/DOCX/TXT resume and print the report")
    parser.add_argument("--version", action="store_true")
    args = parser.parse_args()
    if args.version:
        print(VERSION)
        return 0
    if args.self_test:
        return self_test()
    if args.analyze_resume:
        try:
            a = analyze_resume_file(args.analyze_resume)
        except ResumeError as exc:
            print("Error:", exc)
            return 1
        print(resume_report_text(a))
        print()
        print(profile_report_text(analyze_profile(load_candidate(), a)))
        return 0
    if args.stats or args.export_history or args.report or args.backup:
        setup_logging()
        store = History()
        try:
            if args.stats:
                print(stats_text(store))
            if args.export_history:
                write_csv(args.export_history, ["timestamp", "title", "company", "status", "evidence", "job_url"], store.list())
                print("Wrote", args.export_history)
            if args.report:
                Path(args.report).write_text(history_report_html(store), encoding="utf-8")
                print("Wrote", args.report)
            if args.backup:
                print("Wrote", store.backup_to(Path(args.backup)))
        finally:
            store.close()
        return 0
    return main_gui()


if __name__ == "__main__":
    sys.exit(main())