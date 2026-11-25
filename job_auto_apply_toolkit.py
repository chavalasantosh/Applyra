#!/usr/bin/env python3
"""JOB AUTO APPLY — CAREER TOOLKIT (companion to job_auto_apply_pro.py)

A separate script that adds 32 features on top of job_auto_apply_pro.py (v2.1+).
Keep both files in the same folder. The toolkit shares the same local database,
settings and profile, so jobs you search for in the main app appear here.

Run:
  py job_auto_apply_toolkit.py                 open the Career Toolkit window
  py job_auto_apply_toolkit.py selftest        offline tests (no browser, no display)
  py job_auto_apply_toolkit.py --help          list every command-line tool

The 32 features
  Resume & applications
    1 job-description tailoring        2 cover-letter generator
    3 multiple resume versions         4 resume diff
    5 email templates                  6 role keyword check
  Search & discovery
    7 import jobs from CSV/JSON/RSS    8 scheduled scans
    9 alerts for strong matches       10 company watchlist
   11 search expansion                12 cross-source duplicate detection
   13 job red-flag detection          14 location / commute scoring
  Tracking & organisation
   15 kanban board (drag & drop)      16 interview tracker
   17 calendar (.ics) export          18 recruiter contacts
   19 tags and custom lists           20 offer comparison
   21 rejection log and patterns
  Analytics
   22 charts (SVG + canvas)           23 application funnel
   24 salary insights                 25 skill-demand trends
   26 weekly summary report (HTML, optional SMTP email)
  Reliability & safety
   27 selector health check           28 resumable apply queue
   29 audit trail with undo           30 encrypted vault (needs `cryptography`)
  Convenience
   31 desktop notifications           32 settings bundle import / export

Principles carried over from the main app: you sign in manually, blocks are never
bypassed, nothing is called "applied" without evidence, and auto-apply stays
limited to Naukri. Imported jobs from other sources are tracked here but are not
auto-applied.
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
import base64
import csv
import hashlib
import html
import json
import math
import os
import queue
import random
import re
import smtplib
import ssl
import statistics
import subprocess
import sys
import tempfile
import threading
import time
import traceback
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter, defaultdict
from dataclasses import asdict
from datetime import date, datetime, timedelta, timezone
from difflib import SequenceMatcher
from email.message import EmailMessage
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    import job_auto_apply_pro as core
except ImportError:
    sys.exit("job_auto_apply_toolkit.py needs job_auto_apply_pro.py (v2.1 or newer) in the same folder.")
if not hasattr(core, "analyze_resume_file"):
    sys.exit("Your job_auto_apply_pro.py is too old. Update it to v2.1 or newer (it must include the Resume Analyzer).")

TOOLKIT_VERSION = "1.0.0"
REPORT_DIR = core.HOME / "reports"
SUCCESS_STATUSES = ("CONFIRMED", "UI_EVIDENCE_ONLY", "NETWORK_EVIDENCE_ONLY")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def parse_dt(value: str) -> datetime | None:
    """Accepts 'YYYY-MM-DD HH:MM', 'YYYY-MM-DDTHH:MM' or 'YYYY-MM-DD' (local time, no zone)."""
    s = (value or "").strip().replace("T", " ")
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def money(v) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


# =========================================================================== #
# Database layer (extra tables live in the main app's SQLite file)
# =========================================================================== #
SCHEMA_X = """
CREATE TABLE IF NOT EXISTS x_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL DEFAULT '',
  ref TEXT NOT NULL DEFAULT '', field TEXT NOT NULL DEFAULT '', old TEXT NOT NULL DEFAULT '',
  new TEXT NOT NULL DEFAULT '', undone INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS x_interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT, job_url TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '', round_name TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL DEFAULT 'Technical',
  scheduled_at TEXT NOT NULL DEFAULT '', duration_min INTEGER NOT NULL DEFAULT 60, interviewer TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', outcome TEXT NOT NULL DEFAULT 'Pending',
  created TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS x_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT '', company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', linkedin TEXT NOT NULL DEFAULT '',
  job_url TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', last_contacted TEXT NOT NULL DEFAULT '',
  created TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS x_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, job_url TEXT NOT NULL DEFAULT '', company TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '', fixed_lpa REAL NOT NULL DEFAULT 0, variable_lpa REAL NOT NULL DEFAULT 0,
  joining_bonus_lpa REAL NOT NULL DEFAULT 0, esop_lpa REAL NOT NULL DEFAULT 0, joining_date TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '', remote INTEGER NOT NULL DEFAULT 0, benefits TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '', created TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS x_rejections (
  id INTEGER PRIMARY KEY AUTOINCREMENT, job_url TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '', rejected_on TEXT NOT NULL DEFAULT '', stage TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS x_tags (job_url TEXT NOT NULL, tag TEXT NOT NULL, PRIMARY KEY (job_url, tag));
CREATE TABLE IF NOT EXISTS x_watchlist (company TEXT PRIMARY KEY, note TEXT NOT NULL DEFAULT '', added TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS x_resumes (name TEXT PRIMARY KEY, path TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', added TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS x_jobmeta (job_url TEXT PRIMARY KEY, source TEXT NOT NULL DEFAULT 'naukri', resume_version TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS x_templates (
  name TEXT PRIMARY KEY, kind TEXT NOT NULL DEFAULT 'email', subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '', builtin INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS x_snapshots (
  day TEXT NOT NULL, skill TEXT NOT NULL, n INTEGER NOT NULL, total INTEGER NOT NULL, PRIMARY KEY (day, skill));
CREATE TABLE IF NOT EXISTS x_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT, job_url TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', company TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending', added TEXT NOT NULL DEFAULT '', done_at TEXT NOT NULL DEFAULT '',
  evidence TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS x_scanlog (
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, query TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '',
  found INTEGER NOT NULL DEFAULT 0, new_count INTEGER NOT NULL DEFAULT 0, alerts INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '');
"""
TABLE_NAMES = ("x_audit", "x_interviews", "x_contacts", "x_offers", "x_rejections", "x_tags", "x_watchlist",
               "x_resumes", "x_jobmeta", "x_templates", "x_snapshots", "x_queue", "x_scanlog")
JOB_FIELDS = ("stage", "favorite", "hidden", "note")


class ExtrasDB:
    """Thin, injection-safe CRUD over the toolkit tables, sharing core.History's connection and lock."""

    def __init__(self, store: "core.History"):
        self.store = store
        self.conn = store.connection
        self.lock = store.lock
        with self.lock:
            self.conn.executescript(SCHEMA_X)
            self.conn.commit()
            self._cols = {t: [r[1] for r in self.conn.execute(f"PRAGMA table_info({t})")] for t in TABLE_NAMES}
        self.seed_templates()
        if not hasattr(self.store, "count_jobs"):
            self.store.count_jobs = self.count_jobs

    def count_jobs(self) -> int:
        try:
            with self.lock:
                cur = self.conn.execute("SELECT COUNT(*) FROM jobs")
                row = cur.fetchone()
                return int(row[0]) if row else 0
        except Exception:
            try:
                return len(self.store.load_jobs())
            except Exception:
                return 0

    # ----- generic CRUD ---------------------------------------------------- #
    def _check(self, table: str, cols) -> None:
        if table not in self._cols:
            raise ValueError("Unknown table " + table)
        bad = [c for c in cols if c not in self._cols[table]]
        if bad:
            raise ValueError(f"Unknown column(s) for {table}: {', '.join(bad)}")

    def insert(self, table: str, **cols) -> int:
        self._check(table, cols)
        if "created" in self._cols[table] and "created" not in cols:
            cols["created"] = now_iso()
        names = ",".join(cols)
        marks = ",".join("?" for _ in cols)
        with self.lock:
            cur = self.conn.execute(f"INSERT INTO {table}({names}) VALUES ({marks})", tuple(cols.values()))
            self.conn.commit()
            return int(cur.lastrowid or 0)

    def update(self, table: str, row_id: int, **cols) -> None:
        self._check(table, cols)
        if not cols:
            return
        sets = ",".join(f"{c}=?" for c in cols)
        with self.lock:
            self.conn.execute(f"UPDATE {table} SET {sets} WHERE id=?", (*cols.values(), row_id))
            self.conn.commit()

    def delete(self, table: str, row_id: int) -> None:
        self._check(table, ())
        with self.lock:
            self.conn.execute(f"DELETE FROM {table} WHERE id=?", (row_id,))
            self.conn.commit()

    def rows(self, table: str, where: str = "", params: tuple = (), order: str = "id DESC", limit: int = 5000) -> list[dict]:
        self._check(table, ())
        sql = f"SELECT * FROM {table}" + (f" WHERE {where}" if where else "") + (f" ORDER BY {order}" if order else "") + " LIMIT ?"
        with self.lock:
            cur = self.conn.execute(sql, (*params, limit))
            names = [d[0] for d in cur.description]
            return [dict(zip(names, r)) for r in cur.fetchall()]

    def get(self, table: str, row_id: int) -> dict | None:
        found = self.rows(table, "id=?", (row_id,), order="", limit=1)
        return found[0] if found else None

    # ----- jobs ------------------------------------------------------------ #
    def job_info(self, url: str) -> dict | None:
        with self.lock:
            cur = self.conn.execute("SELECT url,title,company,location,stage,favorite,hidden,note FROM jobs WHERE url=?", (url,))
            r = cur.fetchone()
        if not r:
            return None
        return dict(zip(("url", "title", "company", "location", "stage", "favorite", "hidden", "note"), r))

    # ----- audit trail + undo (feature 29) --------------------------------- #
    def audit(self, action: str, entity: str = "", ref: str = "", field_: str = "", old="", new="") -> None:
        with self.lock:
            self.conn.execute("INSERT INTO x_audit(ts,action,entity,ref,field,old,new) VALUES (?,?,?,?,?,?,?)",
                              (now_iso(), action, entity, ref, field_, str(old), str(new)))
            self.conn.commit()

    def set_job_field(self, url: str, field_: str, value) -> bool:
        """Change stage/favorite/hidden/note and record the old value so it can be undone."""
        if field_ not in JOB_FIELDS:
            raise ValueError("Field must be one of " + ", ".join(JOB_FIELDS))
        if field_ == "stage" and value not in core.PIPELINE_STAGES:
            raise ValueError("Stage must be one of " + ", ".join(core.PIPELINE_STAGES))
        info = self.job_info(url)
        if info is None:
            raise ValueError("Unknown job (it must exist in the main app's job list first).")
        old = info[field_]
        new = int(value) if isinstance(value, bool) else value
        if str(old) == str(new):
            return False
        self.store.update_job(url, **{field_: bool(new) if field_ in ("favorite", "hidden") else new})
        self.audit("job_field", "job", url, field_, old, new)
        return True

    def audit_rows(self, limit: int = 100) -> list[dict]:
        return self.rows("x_audit", order="id DESC", limit=limit)

    def undo_last(self, n: int = 1) -> list[str]:
        done: list[str] = []
        for row in self.rows("x_audit", "action='job_field' AND undone=0", order="id DESC", limit=max(1, n)):
            f = row["field"]
            old = row["old"]
            value = bool(int(old or 0)) if f in ("favorite", "hidden") else old
            self.store.update_job(row["ref"], **{f: value})
            with self.lock:
                self.conn.execute("UPDATE x_audit SET undone=1 WHERE id=?", (row["id"],))
                self.conn.commit()
            done.append(f"{f} of {row['ref'][-40:]} restored to {old!r}")
        return done

    # ----- tags / custom lists (19) ---------------------------------------- #
    @staticmethod
    def _tag(tag: str) -> str:
        t = re.sub(r"\s+", " ", (tag or "").strip().lower())[:30]
        if not t:
            raise ValueError("Tag can't be empty.")
        return t

    def add_tag(self, url: str, tag: str) -> None:
        with self.lock:
            self.conn.execute("INSERT OR IGNORE INTO x_tags(job_url,tag) VALUES (?,?)", (url, self._tag(tag)))
            self.conn.commit()

    def remove_tag(self, url: str, tag: str) -> None:
        with self.lock:
            self.conn.execute("DELETE FROM x_tags WHERE job_url=? AND tag=?", (url, self._tag(tag)))
            self.conn.commit()

    def tags_for(self, url: str) -> list[str]:
        with self.lock:
            return [r[0] for r in self.conn.execute("SELECT tag FROM x_tags WHERE job_url=? ORDER BY tag", (url,))]

    def jobs_with_tag(self, tag: str) -> list[str]:
        with self.lock:
            return [r[0] for r in self.conn.execute("SELECT job_url FROM x_tags WHERE tag=?", (self._tag(tag),))]

    def all_tags(self) -> list[tuple[str, int]]:
        with self.lock:
            return [(r[0], r[1]) for r in self.conn.execute("SELECT tag,COUNT(*) FROM x_tags GROUP BY tag ORDER BY 2 DESC,1")]

    # ----- watchlist (10) --------------------------------------------------- #
    def watch_add(self, company: str, note: str = "") -> None:
        company = core.clean_space(company)
        if not company:
            raise ValueError("Company name is empty.")
        with self.lock:
            self.conn.execute("INSERT OR REPLACE INTO x_watchlist(company,note,added) VALUES (?,?,?)", (company, note, now_iso()))
            self.conn.commit()

    def watch_remove(self, company: str) -> None:
        with self.lock:
            self.conn.execute("DELETE FROM x_watchlist WHERE company=?", (company,))
            self.conn.commit()

    def watch_list(self) -> list[str]:
        with self.lock:
            return [r[0] for r in self.conn.execute("SELECT company FROM x_watchlist ORDER BY company COLLATE NOCASE")]

    # ----- job source / resume version (7, 23) ------------------------------ #
    def set_meta(self, url: str, source: str | None = None, resume_version: str | None = None) -> None:
        with self.lock:
            row = self.conn.execute("SELECT source,resume_version FROM x_jobmeta WHERE job_url=?", (url,)).fetchone()
            src = source if source is not None else (row[0] if row else "naukri")
            rv = resume_version if resume_version is not None else (row[1] if row else "")
            self.conn.execute("INSERT OR REPLACE INTO x_jobmeta(job_url,source,resume_version) VALUES (?,?,?)", (url, src, rv))
            self.conn.commit()

    def meta_map(self) -> dict[str, tuple[str, str]]:
        with self.lock:
            return {r[0]: (r[1], r[2]) for r in self.conn.execute("SELECT job_url,source,resume_version FROM x_jobmeta")}

    # ----- resume versions (3) ----------------------------------------------- #
    def resume_versions(self) -> list[dict]:
        return self.rows("x_resumes", order="name COLLATE NOCASE")

    def add_resume_version(self, name: str, path: str, note: str = "") -> None:
        name = core.clean_space(name)
        if not name:
            raise ValueError("Give the resume version a name.")
        if not Path(path).is_file():
            raise ValueError("Resume file not found.")
        with self.lock:
            self.conn.execute("INSERT OR REPLACE INTO x_resumes(name,path,note,added) VALUES (?,?,?,?)", (name, str(path), note, now_iso()))
            self.conn.commit()

    def remove_resume_version(self, name: str) -> None:
        with self.lock:
            self.conn.execute("DELETE FROM x_resumes WHERE name=?", (name,))
            self.conn.commit()

    # ----- templates (5) ----------------------------------------------------- #
    def seed_templates(self) -> None:
        with self.lock:
            for t in BUILTIN_TEMPLATES:
                self.conn.execute("INSERT OR IGNORE INTO x_templates(name,kind,subject,body,builtin) VALUES (?,?,?,?,1)",
                                  (t["name"], t["kind"], t["subject"], t["body"]))
            self.conn.commit()

    def templates(self, kind: str = "") -> list[dict]:
        if kind:
            with self.lock:
                cur = self.conn.execute("SELECT name,kind,subject,body,builtin FROM x_templates WHERE kind=? ORDER BY name", (kind,))
                return [dict(zip(("name", "kind", "subject", "body", "builtin"), r)) for r in cur.fetchall()]
        with self.lock:
            cur = self.conn.execute("SELECT name,kind,subject,body,builtin FROM x_templates ORDER BY kind,name")
            return [dict(zip(("name", "kind", "subject", "body", "builtin"), r)) for r in cur.fetchall()]

    def get_template(self, name: str) -> dict | None:
        for t in self.templates():
            if t["name"] == name:
                return t
        return None

    def save_template(self, name: str, kind: str, subject: str, body: str) -> None:
        name = core.clean_space(name).replace("|", "/")
        if not name or not body.strip():
            raise ValueError("A template needs a name and a body.")
        with self.lock:
            row = self.conn.execute("SELECT builtin FROM x_templates WHERE name=?", (name,)).fetchone()
            flag = int(row[0]) if row else 0          # editing a built-in keeps it protected from deletion
            self.conn.execute("INSERT OR REPLACE INTO x_templates(name,kind,subject,body,builtin) VALUES (?,?,?,?,?)",
                              (name, kind, subject, body, flag))
            self.conn.commit()

    def delete_template(self, name: str) -> None:
        with self.lock:
            self.conn.execute("DELETE FROM x_templates WHERE name=? AND builtin=0", (name,))
            self.conn.commit()

    def reset_template(self, name: str) -> bool:
        for t in BUILTIN_TEMPLATES:
            if t["name"] == name:
                with self.lock:
                    self.conn.execute("INSERT OR REPLACE INTO x_templates(name,kind,subject,body,builtin) VALUES (?,?,?,?,1)",
                                      (t["name"], t["kind"], t["subject"], t["body"]))
                    self.conn.commit()
                return True
        return False

    # ----- apply queue storage (28) ------------------------------------------ #
    def queue_add(self, jobs) -> int:
        added = 0
        for j in jobs:
            with self.lock:
                exists = self.conn.execute("SELECT 1 FROM x_queue WHERE job_url=? AND status='pending'", (j.key,)).fetchone()
            if exists:
                continue
            self.insert("x_queue", job_url=j.key, title=j.title, company=j.company, status="pending", added=now_iso())
            added += 1
        return added

    def queue_pending(self) -> list[dict]:
        return self.rows("x_queue", "status='pending'", order="id")

    def queue_mark(self, url: str, status: str, evidence: str = "") -> None:
        with self.lock:
            self.conn.execute("UPDATE x_queue SET status=?, done_at=?, evidence=? WHERE job_url=? AND status='pending'",
                              (status, now_iso(), evidence[:500], url))
            self.conn.commit()

    def queue_clear_done(self) -> int:
        with self.lock:
            cur = self.conn.execute("DELETE FROM x_queue WHERE status!='pending'")
            self.conn.commit()
            return cur.rowcount


# =========================================================================== #
# Desktop notifications (31)
# =========================================================================== #
def notify(title: str, message: str) -> bool:
    """Best-effort desktop notification without extra packages. Never blocks, never raises."""
    title, message = str(title)[:80], str(message)[:240]
    try:
        if sys.platform.startswith("win"):
            t, m = title.replace("'", "''"), message.replace("'", "''")
            script = ("Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing;"
                      "$n=New-Object System.Windows.Forms.NotifyIcon; $n.Icon=[System.Drawing.SystemIcons]::Information;"
                      f"$n.Visible=$true; $n.ShowBalloonTip(6000,'{t}','{m}',[System.Windows.Forms.ToolTipIcon]::Info);"
                      "Start-Sleep -Seconds 7; $n.Dispose()")
            subprocess.Popen(["powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", script],
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        if sys.platform == "darwin":
            t, m = title.replace('"', "'"), message.replace('"', "'")
            subprocess.Popen(["osascript", "-e", f'display notification "{m}" with title "{t}"'],
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        exe = __import__("shutil").which("notify-send")
        if exe:
            subprocess.Popen([exe, title, message], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
    except Exception:
        pass
    print(f"\a[notification] {title}: {message}")
    return False


# =========================================================================== #
# Templates (2, 5): email + cover letter
# =========================================================================== #
BUILTIN_TEMPLATES = [
    {"name": "Cover letter — formal", "kind": "cover_letter", "subject": "Application for {title}",
     "body": ("Dear Hiring Manager,\n\n"
              "I am writing to apply for the {title} position at {company}. I bring {years_clause}, including {skills_clause}, "
              "which lines up closely with the requirements of this role.\n\n"
              "<<ADD: one measurable achievement most relevant to this job, e.g. 'cut report generation time by 40%'>>\n\n"
              "I am drawn to {company} because <<ADD: one specific reason about the company or product>>. "
              "I would welcome the chance to discuss how I can contribute to your team.\n\n"
              "Thank you for your time and consideration.\n\nSincerely,\n{name}\n{email} | {mobile}\n")},
    {"name": "Cover letter — short", "kind": "cover_letter", "subject": "{title} — {name}",
     "body": ("Hello,\n\nI'd like to be considered for the {title} role at {company}. I have {years_clause} and {skills_clause}.\n"
              "<<ADD: one-line proof of impact>>\n\nMy resume is attached. I can be reached at {email} or {mobile}.\n\nRegards,\n{name}\n")},
    {"name": "Cover letter — career switch", "kind": "cover_letter", "subject": "Application for {title}",
     "body": ("Dear Hiring Team at {company},\n\nI am moving into {title} work and bringing transferable strengths: {skills_clause}. "
              "<<ADD: the project or course that proves you can do this work>>\n\nI am ready to learn quickly and contribute from the start.\n\n"
              "Best regards,\n{name}\n{email}\n")},
    {"name": "Follow-up after applying", "kind": "email", "subject": "Following up on my application — {title}",
     "body": ("Hello,\n\nI applied for the {title} position at {company} on {applied_on} and wanted to confirm my interest. "
              "I believe my background in {skills_clause_short} is a strong fit.\n\nIs there any update on the process, or anything else I can provide?\n\n"
              "Thank you,\n{name}\n{mobile}\n")},
    {"name": "Thank-you after interview", "kind": "email", "subject": "Thank you — {title} interview",
     "body": ("Hello {recipient},\n\nThank you for taking the time to speak with me about the {title} role at {company}. "
              "<<ADD: one topic from the conversation that excited you>>\n\nI remain very interested and happy to share anything further.\n\n"
              "Best regards,\n{name}\n")},
    {"name": "Notice period reply", "kind": "email", "subject": "Re: {title} — notice period and availability",
     "body": ("Hello {recipient},\n\nMy notice period is {notice_days} days. <<ADD: whether it is negotiable / buyout possible>>\n"
              "My current CTC is {current_ctc} LPA and my expectation is {expected_ctc} LPA, open to discussion based on the role.\n\nRegards,\n{name}\n")},
    {"name": "Referral request", "kind": "email", "subject": "Quick request — referral for {title} at {company}",
     "body": ("Hi {recipient},\n\nI hope you're doing well. I noticed {company} is hiring for {title} and my background in {skills_clause_short} seems relevant. "
              "Would you be comfortable referring me or pointing me to the right person? I'm happy to send my resume and a short summary.\n\nThanks a lot,\n{name}\n")},
    {"name": "Status check", "kind": "email", "subject": "Checking in — {title}",
     "body": ("Hello {recipient},\n\nI wanted to check in on the status of my application for {title}. I'm still very interested "
              "and available at {mobile}.\n\nThank you,\n{name}\n")},
    {"name": "Salary negotiation", "kind": "email", "subject": "Re: Offer for {title}",
     "body": ("Hello {recipient},\n\nThank you for the offer for the {title} position — I'm excited about joining {company}. "
              "<<ADD: your market evidence or competing offer, if any>> Based on my experience and the scope of the role, I was hoping for a fixed component of "
              "<<ADD: number>> LPA. Is there flexibility to discuss this?\n\nThank you,\n{name}\n")},
    {"name": "Withdraw application", "kind": "email", "subject": "Withdrawing my application — {title}",
     "body": ("Hello {recipient},\n\nThank you for your time. I'm withdrawing my application for {title} at {company} as <<ADD: brief reason>>. "
              "I appreciate the opportunity and hope to stay in touch.\n\nRegards,\n{name}\n")},
]


def _join_and(items: list[str]) -> str:
    items = [i for i in items if i]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    return ", ".join(items[:-1]) + " and " + items[-1]


def build_context(candidate: "core.Candidate", job: "core.Job | None" = None, analysis=None, extra: dict | None = None) -> dict:
    skills: list[str] = []
    if job is not None and analysis is not None:
        _fit, matched, _missing = core.resume_fit(job, analysis)
        skills = matched[:4]
    if not skills:
        skills = [s for s in core.csv_list(candidate.skills)][:4]
    if not skills and analysis is not None:
        skills = analysis.top_skills(4)
    years = candidate.years_experience
    if not years and analysis is not None:
        best = max(analysis.years_estimate, analysis.years_stated)
        years = f"{best:g}" if best else ""
    ctx = {
        "name": candidate.full_name or "<<ADD: your name>>", "first_name": (candidate.full_name or "").split(" ")[0],
        "email": candidate.email, "mobile": candidate.mobile, "city": candidate.city_pref, "headline": candidate.headline,
        "years": years, "years_clause": (f"{years} years of experience" if years else "relevant experience"),
        "skills": ", ".join(skills), "skills_clause": ("hands-on experience with " + _join_and(skills)) if skills else "relevant technical skills",
        "skills_clause_short": _join_and(skills) or "this area",
        "notice_days": candidate.notice_days or "<<ADD: days>>", "current_ctc": candidate.current_ctc_lpa or "<<ADD>>",
        "expected_ctc": candidate.expected_ctc_lpa or "<<ADD>>", "today": date.today().isoformat(),
        "company": (job.company if job and job.company else "your company"), "title": (job.title if job else "the role"),
        "location": job.location if job else "", "recipient": "Hiring Team", "applied_on": "<<ADD: date>>",
    }
    if extra:
        ctx.update({k: str(v) for k, v in extra.items()})
    return ctx


def fill_template(text: str, ctx: dict) -> str:
    """Replace {key}. Unknown keys are left visible, never silently dropped."""
    return re.sub(r"\{([a-z_]+)\}", lambda m: str(ctx[m.group(1)]) if m.group(1) in ctx and ctx[m.group(1)] != "" else m.group(0), text or "")


def unresolved_markers(text: str) -> list[str]:
    return re.findall(r"<<ADD:[^>]*>>", text) + re.findall(r"\{[a-z_]+\}", text)


def render_template(db: ExtrasDB, name: str, candidate, job=None, analysis=None, extra: dict | None = None) -> dict:
    t = db.get_template(name)
    if t is None:
        raise ValueError("Unknown template: " + name)
    ctx = build_context(candidate, job, analysis, extra)
    subject = fill_template(t["subject"], ctx)
    body = fill_template(t["body"], ctx)
    return {"subject": subject, "body": body, "todo": unresolved_markers(subject + "\n" + body)}


# =========================================================================== #
# Resume & application features (1, 3, 4, 6)
# =========================================================================== #
_STOP = frozenset("""a an and are as at be by for from has have in is it its of on or that the this to was we will with you your our
their they who which can able must should may per not but also etc job role work working experience years year candidate looking
required requirement responsibilities good strong knowledge skills ability team using use""".split())


def _keywords(text: str) -> Counter:
    words = re.findall(r"[a-z][a-z0-9+#.\-]{2,}", (text or "").lower())
    return Counter(w.strip(".-") for w in words if w.strip(".-") not in _STOP and len(w.strip(".-")) > 2)


def tailor_resume(job_text: str, analysis, extra_resume_text: str = "") -> dict:
    """Feature 1: what to add to the resume for a pasted job description.

    Known skills are matched with the main app's skill index; other frequent terms are
    reported as 'other terms' only when the resume text is available to check against.
    """
    required = core.extract_skills(job_text)
    required = Counter({s: c for s, c in required.items() if s not in core.SOFT_SKILLS})
    have = analysis.skill_set if analysis else frozenset()
    present = sorted((s for s in required if s in have), key=lambda s: -required[s])
    missing = sorted((s for s in required if s not in have), key=lambda s: -required[s])
    other: list[tuple[str, int]] = []
    if extra_resume_text:
        resume_words = set(_keywords(extra_resume_text))
        known_parts = {w for s in required for w in s.split()}
        job_words = _keywords(job_text)
        other = [(w, c) for w, c in job_words.most_common(60) if w not in resume_words and w not in known_parts and c >= 2][:12]
    total = len(required)
    coverage = int(round(100 * len(present) / total)) if total else 0
    advice: list[str] = []
    if missing:
        advice.append("Add these ONLY if you genuinely have the experience: " + ", ".join(missing[:8]) + ".")
    if present:
        advice.append("Move these closer to the top (summary / first bullets): " + ", ".join(present[:6]) + ".")
    if total == 0:
        advice.append("No recognised technical skills in that description. Paste the full text, including the requirements section.")
    if coverage < 50 and total:
        advice.append("Coverage is under 50%. Consider whether this role is a real fit before spending time on it.")
    return {"required": dict(required), "present": present, "missing": missing, "coverage": coverage, "other_terms": other, "advice": advice}


def role_keyword_check(role: str, analysis) -> dict:
    """Feature 6: how well the resume covers a target role's core skills."""
    key = next((r for r in core.ROLE_PROFILES if r.lower() == role.strip().lower()), None)
    if key is None:
        matches = [r for r in core.ROLE_PROFILES if role.strip().lower() in r.lower()]
        key = matches[0] if matches else None
    if key is None:
        raise ValueError("Unknown role. Choose one of: " + ", ".join(sorted(core.ROLE_PROFILES)))
    keywords, core_skills = core.ROLE_PROFILES[key]
    have = analysis.skill_set
    weak = [s for s in core_skills if s in have and analysis.skills.get(s, 0) == 1]
    return {"role": key, "have": [s for s in core_skills if s in have], "missing": [s for s in core_skills if s not in have],
            "weak": weak, "coverage": int(round(100 * sum(1 for s in core_skills if s in have) / len(core_skills))),
            "title_words": list(keywords)}


def compare_resumes(a, b, name_a: str = "A", name_b: str = "B") -> dict:
    """Feature 4: diff two ResumeAnalysis objects."""
    sa, sb = a.skill_set, b.skill_set
    metrics = ("score", "word_count", "quantified", "action_verbs", "bullets")
    return {
        "names": (name_a, name_b),
        "score": (a.score, b.score), "delta_score": b.score - a.score,
        "only_a": sorted(sa - sb), "only_b": sorted(sb - sa), "both": sorted(sa & sb),
        "metrics": {m: (getattr(a, m), getattr(b, m)) for m in metrics},
        "roles_a": a.roles[:3], "roles_b": b.roles[:3],
        "better": name_b if b.score > a.score else (name_a if a.score > b.score else "tie"),
    }


def text_diff(a: str, b: str, limit: int = 200) -> list[str]:
    """Line-level unified diff of two resume texts."""
    import difflib
    return list(difflib.unified_diff((a or "").splitlines(), (b or "").splitlines(), "A", "B", lineterm="", n=1))[:limit]


def best_resume_for_job(job, versions: list[dict]) -> tuple[str, int, list[str]] | None:
    """Feature 3: pick the stored resume version with the highest fit for a job."""
    best = None
    for v in versions:
        try:
            analysis = core.analyze_resume_file(v["path"])
        except core.ResumeError:
            continue
        fit, matched, _m = core.resume_fit(job, analysis)
        if best is None or fit > best[1]:
            best = (v["name"], fit, matched)
    return best


def choose_resume_versions(jobs, versions: list[dict]) -> dict[str, tuple[str, int]]:
    out = {}
    for j in jobs:
        pick = best_resume_for_job(j, versions)
        if pick:
            out[j.key] = (pick[0], pick[1])
    return out


def cover_letter_for(db: ExtrasDB, job, candidate, analysis=None, template: str = "Cover letter — formal") -> dict:
    """Feature 2. Returns subject/body and the list of <<ADD: …>> blanks you still have to write yourself."""
    return render_template(db, template, candidate, job, analysis)


# =========================================================================== #
# Search & discovery (7, 8, 9, 10, 11, 12, 13, 14)
# =========================================================================== #
def _job_from_row(row: dict, source: str) -> "core.Job | None":
    url = (row.get("url") or row.get("link") or row.get("apply_url") or row.get("id") or "").strip()
    title = core.clean_space(row.get("title") or row.get("job_title") or row.get("position") or row.get("role") or "")
    if not title:
        return None
    if urlparse(url).scheme not in ("http", "https"):
        url = f"imported://{source}/{hashlib.sha1((title + str(row.get('company') or '')).encode()).hexdigest()[:16]}"
    parsed = urlparse(url)
    if parsed.scheme in ("http", "https"):
        url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}" + (f"?{parsed.query}" if parsed.netloc and "naukri" not in parsed.netloc and parsed.query else "")
    tags_val = row.get("tags") or row.get("skills") or row.get("matchedskills") or ""
    tags_str = ", ".join(tags_val) if isinstance(tags_val, list) else str(tags_val or "")
    desc = core.clean_space(row.get("description") or row.get("summary") or row.get("shortdescription") or "")
    j = core.Job(
        key=url[:500], title=title[:260], company=core.clean_space(row.get("company") or row.get("employer") or "")[:180],
        location=core.clean_space(row.get("location") or row.get("city") or "")[:260],
        experience=core.clean_space(row.get("experience") or "")[:110], salary=core.clean_space(row.get("salary") or row.get("pay") or "")[:110],
        posted=core.clean_space(row.get("posted") or row.get("date") or row.get("capturedat") or "")[:100],
        description=desc[:4000],
        snippet=core.clean_space(row.get("snippet") or desc)[:1800],
        tags=tags_str[:400])
    status = str(row.get("status") or "").strip()
    if status in ("Applied", "Interview", "Offer", "Saved", "Rejected", "Ignored"):
        j.stage = status
    if row.get("saved"):
        j.favorite = 1
    return j


def import_applyra_workspace(db: ExtrasDB, path: str, candidate=None, analysis=None) -> dict:
    """Import an Applyra exported workspace (JSON) into the Toolkit database.

    Syncs jobs, pipeline stages (Applied, Interview, etc.), candidate profile,
    and interview logs.
    """
    p = Path(path)
    if not p.is_file():
        raise FileNotFoundError(f"Applyra workspace file not found: {path}")
    raw = p.read_text(encoding="utf-8-sig", errors="ignore")
    data = json.loads(raw)

    profile_data = data.get("profile") or {}
    jobs_data = data.get("jobs") or []
    interviews_data = data.get("interviews") or []

    # 1. Update candidate profile if present and candidate object provided
    cand_updated = False
    if candidate is not None and isinstance(profile_data, dict) and profile_data:
        if profile_data.get("fullName"):
            candidate.full_name = profile_data["fullName"]
        if profile_data.get("email"):
            candidate.email = profile_data["email"]
        if profile_data.get("phone"):
            candidate.mobile = profile_data["phone"]
        if profile_data.get("fullTimeYears"):
            candidate.years_experience = str(profile_data["fullTimeYears"])
        if profile_data.get("noticePeriod"):
            candidate.notice_days = str(profile_data["noticePeriod"])
        if profile_data.get("currentCtc"):
            candidate.current_ctc_lpa = str(profile_data["currentCtc"])
        if profile_data.get("expectedCtc"):
            candidate.expected_ctc_lpa = str(profile_data["expectedCtc"])
        if profile_data.get("skills"):
            s_val = profile_data["skills"]
            candidate.skills = ", ".join(s_val) if isinstance(s_val, list) else str(s_val)
        if profile_data.get("roles"):
            r_val = profile_data["roles"]
            candidate.target_titles = ", ".join(r_val) if isinstance(r_val, list) else str(r_val)
        if profile_data.get("targetLocations"):
            l_val = profile_data["targetLocations"]
            candidate.city_pref = ", ".join(l_val) if isinstance(l_val, list) else str(l_val)
        if profile_data.get("headline"):
            candidate.headline = profile_data["headline"]
        core.save_candidate(candidate)
        cand_updated = True

    # 2. Convert and import jobs
    jobs = []
    source_name = "applyra"
    for r in jobs_data:
        if not isinstance(r, dict):
            continue
        title = core.clean_space(r.get("title") or r.get("role") or "")
        if not title:
            continue
        url = (r.get("url") or r.get("id") or "").strip()
        if not url or not (url.startswith("http://") or url.startswith("https://")):
            url = f"applyra://job/{hashlib.sha1((title + str(r.get('company') or '')).encode()).hexdigest()[:16]}"
        company = core.clean_space(r.get("company") or "")
        location = core.clean_space(r.get("location") or "")
        experience = core.clean_space(r.get("experience") or "")
        salary = core.clean_space(r.get("salary") or "")
        desc = core.clean_space(r.get("description") or r.get("shortDescription") or "")
        tags_raw = r.get("matchedSkills") or r.get("skills") or r.get("tags") or ""
        tags = ", ".join(tags_raw) if isinstance(tags_raw, list) else str(tags_raw)

        j = core.Job(
            key=url[:500],
            title=title[:260],
            company=company[:180],
            location=location[:260],
            experience=experience[:110],
            salary=salary[:110],
            posted=core.clean_space(r.get("capturedAt") or r.get("posted") or "")[:100],
            description=desc[:4000],
            snippet=desc[:1800],
            tags=tags[:400]
        )
        status = str(r.get("status") or "").strip()
        if status in ("Applied", "Interview", "Offer", "Rejected", "Saved", "Ignored"):
            j.stage = status
        elif status.lower() == "applied":
            j.stage = "Applied"
        elif status.lower() == "unreviewed" or not status:
            j.stage = "New"
        else:
            j.stage = "New"

        if r.get("saved"):
            j.favorite = 1

        if candidate is not None:
            j.score, m = core.score_job(j, candidate)
            j.matched = ", ".join(m)
        elif r.get("matchScore"):
            try:
                j.score = int(r["matchScore"])
            except Exception:
                pass
        jobs.append(j)

    if analysis is not None:
        core.apply_fit(jobs, analysis)

    new_jobs = db.store.upsert_jobs(jobs)
    for j in jobs:
        db.set_meta(j.key, source=source_name)
        if j.stage != "New" or j.favorite:
            with db.lock:
                db.conn.execute("UPDATE jobs SET stage=?, favorite=? WHERE url=?", (j.stage, j.favorite, j.key))
                db.conn.commit()

    # 3. Import interviews
    interviews_imported = 0
    for it in interviews_data:
        if not isinstance(it, dict):
            continue
        company = core.clean_space(it.get("company") or "")
        title = core.clean_space(it.get("role") or it.get("title") or "")
        round_name = core.clean_space(it.get("stage") or it.get("round_name") or "Round")
        scheduled_at = str(it.get("occurredAt") or it.get("scheduled_at") or now_iso())
        outcome = core.clean_space(it.get("outcome") or "Pending")
        notes = core.clean_space(it.get("notes") or "")
        gaps = it.get("gaps")
        if gaps:
            notes += f" (Gaps: {', '.join(gaps) if isinstance(gaps, list) else gaps})"

        existing = db.rows("x_interviews", "company=? AND scheduled_at=?", (company, scheduled_at))
        if not existing:
            db.insert("x_interviews", company=company, title=title, round_name=round_name,
                      scheduled_at=scheduled_at, outcome=outcome, notes=notes)
            interviews_imported += 1

    return {
        "ok": True,
        "jobs_read": len(jobs_data),
        "jobs_imported": len(jobs),
        "jobs_new": new_jobs,
        "interviews_imported": interviews_imported,
        "profile_updated": cand_updated
    }


def export_applyra_workspace(db: ExtrasDB, candidate=None, out_path: str | None = None) -> dict:
    """Export Toolkit jobs, interview tracking, and candidate profile to Applyra workspace format."""
    profile = {}
    if candidate is not None:
        skills = [s.strip() for s in (candidate.skills or "").split(",") if s.strip()]
        roles = [r.strip() for r in (candidate.target_titles or "").split(",") if r.strip()]
        locs = [c.strip() for c in (candidate.city_pref or "").split(",") if c.strip()]
        profile = {
            "fullName": candidate.full_name or "Applyra Candidate",
            "email": candidate.email or "",
            "phone": candidate.mobile or "",
            "fullTimeYears": candidate.years_experience or "0",
            "internshipYears": "0",
            "noticePeriod": candidate.notice_days or "",
            "currentCtc": candidate.current_ctc_lpa or "",
            "expectedCtc": candidate.expected_ctc_lpa or "",
            "skills": skills,
            "roles": roles,
            "targetLocations": locs,
            "headline": candidate.headline or ""
        }

    with db.lock:
        cursor = db.conn.execute(
            "SELECT url, job_id, title, company, location, experience, salary, posted, description, snippet, tags, score, matched, stage, favorite, note, first_seen "
            "FROM jobs WHERE hidden=0"
        )
        job_rows = cursor.fetchall()

    meta = db.meta_map()
    jobs_out = []
    for r in job_rows:
        url, jid, title, company, loc, exp, sal, posted, desc, snippet, tags, score, matched, stage, fav, note, first_seen = r
        matched_list = [m.strip() for m in (matched or "").split(",") if m.strip()]
        meta_source = meta.get(url, ("naukri" if "naukri" in url else "career-toolkit", ""))[0]
        jobs_out.append({
            "id": jid or url,
            "title": title,
            "company": company,
            "location": loc,
            "experience": exp,
            "salary": sal,
            "url": url if url.startswith("http") else "",
            "description": desc or snippet,
            "shortDescription": snippet or desc[:200],
            "status": stage if stage in ("Applied", "Interview", "Offer", "Saved", "Rejected", "Ignored") else "Unreviewed",
            "matchScore": int(score or 0),
            "opportunityScore": min(100, int((score or 0) * 1.1)),
            "priorityScore": int(score or 0),
            "matchedSkills": matched_list,
            "source": meta_source,
            "saved": bool(fav),
            "capturedAt": first_seen or now_iso()
        })

    int_rows = db.rows("x_interviews", order="scheduled_at DESC")
    interviews_out = []
    for row in int_rows:
        interviews_out.append({
            "id": f"int-{row['id']}",
            "company": row["company"],
            "role": row["title"],
            "stage": row["round_name"],
            "occurredAt": row["scheduled_at"],
            "outcome": row["outcome"],
            "notes": row["notes"]
        })

    workspace = {
        "exportedAt": now_iso(),
        "schemaVersion": 14,
        "profile": profile,
        "jobs": jobs_out,
        "interviews": interviews_out,
        "feedback": [],
        "history": []
    }

    if out_path:
        p = Path(out_path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(workspace, indent=2, ensure_ascii=False), encoding="utf-8")

    return workspace


def run_applyra_server(db: ExtrasDB, candidate, analysis, host: str = "127.0.0.1", port: int = 8765):
    """Run lightweight local REST bridge for Applyra extension."""
    from http.server import HTTPServer, BaseHTTPRequestHandler

    class ApplyraBridgeHandler(BaseHTTPRequestHandler):
        def _set_headers(self, status=200, content_type="application/json"):
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()

        def do_OPTIONS(self):
            self._set_headers(200)

        def do_GET(self):
            parsed = urlparse(self.path)
            if parsed.path in ("/api/health", "/"):
                jobs_count = db.count_jobs()
                self._set_headers(200)
                self.wfile.write(json.dumps({
                    "ok": True,
                    "service": "Applyra Career Toolkit Bridge",
                    "version": TOOLKIT_VERSION,
                    "jobs": jobs_count,
                    "candidate": candidate.full_name if candidate else ""
                }).encode("utf-8"))
            elif parsed.path == "/api/analytics":
                f_data = funnel(db, "overall")
                self._set_headers(200)
                self.wfile.write(json.dumps({
                    "ok": True,
                    "funnel": f_data,
                    "offers": db.rows("x_offers"),
                    "interviews": db.rows("x_interviews")
                }).encode("utf-8"))
            elif parsed.path == "/api/export":
                ws = export_applyra_workspace(db, candidate)
                self._set_headers(200)
                self.wfile.write(json.dumps(ws).encode("utf-8"))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"ok": False, "error": "Not found"}).encode("utf-8"))

        def do_POST(self):
            parsed = urlparse(self.path)
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length) if length > 0 else b"{}"
            try:
                payload = json.loads(body.decode("utf-8"))
            except Exception as e:
                self._set_headers(400)
                self.wfile.write(json.dumps({"ok": False, "error": f"Invalid JSON: {e}"}).encode("utf-8"))
                return

            if parsed.path in ("/api/import", "/api/sync"):
                try:
                    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
                        json.dump(payload, tf)
                        tname = tf.name
                    res = import_applyra_workspace(db, tname, candidate, analysis)
                    os.unlink(tname)
                    self._set_headers(200)
                    self.wfile.write(json.dumps({"ok": True, "result": res}).encode("utf-8"))
                except Exception as e:
                    self._set_headers(500)
                    self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode("utf-8"))
            elif parsed.path == "/api/tailor":
                jd = payload.get("jobDescription") or payload.get("text") or ""
                extra = payload.get("resumeText") or (candidate.headline if candidate else "")
                res = tailor_resume(jd, analysis, extra)
                self._set_headers(200)
                self.wfile.write(json.dumps({
                    "ok": True,
                    "present": res.get("present", []),
                    "missing": res.get("missing", []),
                    "other": res.get("other", [])
                }).encode("utf-8"))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"ok": False, "error": "Endpoint not found"}).encode("utf-8"))

        def log_message(self, format, *args):
            return

    server = HTTPServer((host, port), ApplyraBridgeHandler)
    print(f"Applyra Career Toolkit Bridge running at http://{host}:{port}/")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping bridge server.")
    finally:
        server.server_close()


def read_job_rows(path: str) -> tuple[list[dict], str]:
    """Feature 7 input: CSV (header row), JSON (list or {'jobs': [...]}) or RSS/Atom."""
    p = Path(path)
    if p.stat().st_size > 20_000_000:
        raise ValueError("Import file is larger than 20 MB.")
    raw = p.read_text(encoding="utf-8-sig", errors="ignore")
    ext = p.suffix.lower()
    if ext == ".json":
        data = json.loads(raw)
        if isinstance(data, dict):
            data = data.get("jobs") or data.get("items") or []
        return [d for d in data if isinstance(d, dict)], "json"
    if ext in (".xml", ".rss", ".atom"):
        root = ET.fromstring(raw)
        rows = []
        for item in list(root.iter("item")) + list(root.iter("{http://www.w3.org/2005/Atom}entry")):
            def t(tag):
                el = item.find(tag) if item.find(tag) is not None else item.find("{http://www.w3.org/2005/Atom}" + tag)
                return (el.text or "").strip() if el is not None and el.text else ""
            link = t("link")
            if not link:
                el = item.find("{http://www.w3.org/2005/Atom}link")
                link = el.get("href", "") if el is not None else ""
            rows.append({"title": t("title"), "url": link, "description": re.sub(r"<[^>]+>", " ", t("description") or t("summary")), "posted": t("pubDate") or t("updated")})
        return rows, "rss"
    return list(csv.DictReader(raw.splitlines())), "csv"


def import_jobs(db: ExtrasDB, path: str, source: str = "", candidate=None, analysis=None) -> dict:
    """Feature 7: bring in jobs from other sites so they can be scored, tracked and tagged here.

    Imported jobs are never auto-applied; they have no Naukri apply flow.
    """
    rows, kind = read_job_rows(path)
    source = (source or Path(path).stem)[:30]
    jobs = []
    for r in rows:
        j = _job_from_row({str(k).strip().lower(): v for k, v in r.items() if k}, source)
        if j:
            if candidate is not None:
                j.score, m = core.score_job(j, candidate)
                j.matched = ", ".join(m)
            jobs.append(j)
    if analysis is not None:
        core.apply_fit(jobs, analysis)
    new = db.store.upsert_jobs(jobs)
    for j in jobs:
        db.set_meta(j.key, source=source)
    return {"read": len(rows), "imported": len(jobs), "new": new, "source": source, "format": kind}


def expand_search(analysis, base_query: str, limit: int = 8) -> list[str]:
    """Feature 11: related titles/skills to widen a search, drawn from the resume."""
    base = base_query.strip().lower()
    out: list[str] = []
    base_roles = [r for r in core.ROLE_PROFILES if any(k in base for k in core.ROLE_PROFILES[r][0]) or r.lower() in base]
    pool: list[str] = []
    for role in base_roles:
        pool += [f"{s} developer" for s in core.ROLE_PROFILES[role][1][:4] if s in analysis.skill_set]
    for role, pct in analysis.roles:
        pool.append(role)
    pool += [f"{s} developer" for s in analysis.top_skills(5)]
    for q in pool:
        ql = q.lower()
        if ql != base and ql not in [o.lower() for o in out]:
            out.append(q)
        if len(out) >= limit:
            break
    return out


def _canon_company(name: str) -> str:
    n = re.sub(r"\b(pvt|private|ltd|limited|inc|llp|corp|corporation|technologies|technology|solutions|software|services|india)\b", " ", (name or "").lower())
    return re.sub(r"[^a-z0-9]+", "", n)


def _canon_title(title: str) -> str:
    t = re.sub(r"\b(sr|senior|jr|junior|lead|principal|associate|staff)\b\.?", " ", (title or "").lower())
    t = re.sub(r"\(.*?\)|\bi{1,3}\b|\b\d+\b", " ", t)
    return re.sub(r"[^a-z0-9]+", "", t)


def find_duplicates(jobs, threshold: float = 0.88) -> list[list]:
    """Feature 12: cluster reposts and cross-portal copies (same company, near-identical title, same level)."""
    buckets: dict[str, list] = defaultdict(list)
    for j in jobs:
        buckets[_canon_company(j.company) or "?"].append(j)
    clusters: list[list] = []
    for comp, items in buckets.items():
        if comp == "?" and len(items) > 1:
            items = [j for j in items if j.company]
        used: set[int] = set()
        for i, a in enumerate(items):
            if i in used:
                continue
            group = [a]
            for k in range(i + 1, len(items)):
                if k in used:
                    continue
                b = items[k]
                if a.key == b.key:
                    continue
                same_level = (("senior" in a.title.lower() or "sr" in a.title.lower().split()) ==
                              ("senior" in b.title.lower() or "sr" in b.title.lower().split()))
                ratio = SequenceMatcher(None, _canon_title(a.title), _canon_title(b.title)).ratio()
                if same_level and ratio >= threshold:
                    group.append(b)
                    used.add(k)
            if len(group) > 1:
                clusters.append(group)
    return clusters


RED_FLAGS = [
    (r"\b(unpaid|no stipend|without (?:a )?salary)\b", "high", "Unpaid or no stipend"),
    (r"\b(registration|security|training|refundable)\s+(?:fee|deposit|amount)\b|pay\s+(?:a\s+)?(?:fee|deposit)", "high", "Asks you to pay money (classic scam signal)"),
    (r"\bearn\s+(?:up to\s+)?(?:₹|rs\.?)?\s?\d[\d,]*\s*(?:per day|/day|daily|per week)\b", "high", "Unrealistic daily/weekly earnings promise"),
    (r"\b(?:whatsapp|telegram)\b.*\b\d{10}\b|\bcontact\s+(?:on|via)\s+(?:whatsapp|telegram)\b", "high", "Recruitment through WhatsApp/Telegram only"),
    (r"\b(?:work from home|home based)\b.*\b(?:data entry|typing|form filling|copy paste)\b", "medium", "Generic work-from-home data-entry offer"),
    (r"\bimmediate joiners?\b|\burgent(?:ly)?\s+(?:hiring|required)\b", "low", "Urgency language"),
    (r"\b(?:rockstar|ninja|guru|wizard)\b", "low", "Hype wording instead of a clear role"),
    (r"\bunlimited\s+(?:earning|income|incentives?)\b|\bno\s+target\b.*\bearn\b", "medium", "Vague unlimited-earning promise"),
    (r"\b(?:freshers?|0\s*-?\s*1\s*years?)\b.*\b(?:10|12|15)\+?\s*years\b|\b(?:fresher)\b.*\b(?:senior|lead)\b", "medium", "Contradictory experience requirements"),
    (r"\bmust\s+have\s+own\s+(?:laptop|bike|vehicle)\b", "low", "You must supply your own equipment"),
]
_SEV = {"high": 3, "medium": 2, "low": 1}


def detect_red_flags(job) -> list[dict]:
    """Feature 13. Heuristic warnings only — a flag is a reason to look closer, not proof of a bad job."""
    text = f"{job.title}. {job.description}. {job.snippet}"
    low = text.lower()
    flags = []
    for pattern, sev, label in RED_FLAGS:
        if re.search(pattern, low, re.I | re.S):
            flags.append({"severity": sev, "label": label})
    rng = core.parse_year_range(job.experience)
    sal = core.parse_salary_range_lpa(job.salary)
    if rng and sal and rng[0] >= 8 and sal[1] <= 4:
        flags.append({"severity": "medium", "label": f"Pay ({job.salary}) looks very low for {job.experience} experience"})
    if sal and sal[1] >= 80 and (not rng or rng[1] <= 3):
        flags.append({"severity": "medium", "label": f"Pay ({job.salary}) looks unusually high for the stated experience"})
    if not job.company:
        flags.append({"severity": "low", "label": "No company name shown"})
    stuffed = sum(1 for s in core.extract_skills(low) if s not in core.SOFT_SKILLS)
    if stuffed >= 22:
        flags.append({"severity": "low", "label": f"Asks for {stuffed} different technologies — likely a keyword-stuffed or unfocused role"})
    flags.sort(key=lambda f: -_SEV[f["severity"]])
    return flags


def flag_score(flags: list[dict]) -> int:
    return min(100, sum({"high": 40, "medium": 18, "low": 6}[f["severity"]] for f in flags))


_CITY_ALIASES = {
    "bengaluru": "bangalore", "bangalore": "bangalore", "gurugram": "gurgaon", "gurgaon": "gurgaon", "bombay": "mumbai",
    "navi mumbai": "mumbai", "thane": "mumbai", "madras": "chennai", "calcutta": "kolkata", "noida": "delhi ncr",
    "greater noida": "delhi ncr", "new delhi": "delhi ncr", "delhi": "delhi ncr", "ghaziabad": "delhi ncr", "faridabad": "delhi ncr",
    "pune": "pune", "hyderabad": "hyderabad", "secunderabad": "hyderabad", "chennai": "chennai", "kolkata": "kolkata",
    "mumbai": "mumbai", "ahmedabad": "ahmedabad", "kochi": "kochi", "cochin": "kochi",
}
NEARBY = {"delhi ncr": {"delhi ncr", "gurgaon"}, "gurgaon": {"gurgaon", "delhi ncr"}, "mumbai": {"mumbai", "pune"},
          "pune": {"pune", "mumbai"}, "bangalore": {"bangalore"}, "hyderabad": {"hyderabad"}, "chennai": {"chennai"}}


def _cities_in(text: str) -> set[str]:
    low = (text or "").lower()
    return {canon for alias, canon in _CITY_ALIASES.items() if re.search(r"(?<![a-z])" + re.escape(alias) + r"(?![a-z])", low)}


def location_score(job, home_city: str, want_remote: bool = True, accept_relocation: bool = False) -> dict:
    """Feature 14: 0–100 location fit. Distance is NOT computed (no map data); this uses city names and remote wording."""
    text = f"{job.location} {job.snippet}".lower()
    remote = any(w in text for w in ("remote", "work from home", "wfh", "anywhere in india"))
    hybrid = "hybrid" in text
    home = {_CITY_ALIASES.get(home_city.strip().lower(), home_city.strip().lower())} if home_city.strip() else set()
    cities = _cities_in(job.location) or _cities_in(job.snippet)
    reasons = []
    if remote and want_remote:
        return {"score": 95, "label": "Remote", "reasons": ["Remote / work-from-home wording found"]}
    if not home:
        return {"score": 50, "label": "Unknown", "reasons": ["Set your preferred city in the profile to score location"]}
    if cities & home:
        score = 90 if not hybrid else 85
        reasons.append("Job is in your city" + (" (hybrid)" if hybrid else ""))
        return {"score": score, "label": "Local", "reasons": reasons}
    near = set().union(*(NEARBY.get(h, {h}) for h in home))
    if cities & near:
        return {"score": 65, "label": "Nearby city", "reasons": ["Neighbouring city: " + ", ".join(sorted(cities & near))]}
    if cities:
        return {"score": 40 if accept_relocation else 15, "label": "Other city",
                "reasons": ["Located in " + ", ".join(sorted(cities)) + ("; relocation accepted" if accept_relocation else "; relocation needed")]}
    return {"score": 50, "label": "Unknown", "reasons": ["No recognisable city in the listing"]}


def alert_matches(jobs, min_fit: int = 70, min_score: int = 0, watch: list[str] | None = None, new_only: bool = True) -> list[tuple]:
    """Features 9 and 10: jobs worth an alert. Returns [(job, reason)]."""
    watch_c = [_canon_company(w) for w in (watch or []) if w]
    out = []
    for j in jobs:
        if j.hidden or (new_only and not j.is_new):
            continue
        reasons = []
        if j.fit >= min_fit:
            reasons.append(f"fit {j.fit}")
        elif min_score and j.score >= min_score:
            reasons.append(f"match {j.score}")
        cc = _canon_company(j.company)
        if cc and any(w and (w in cc or cc in w) for w in watch_c):
            reasons.append("watchlist company")
        if reasons:
            out.append((j, ", ".join(reasons)))
    out.sort(key=lambda t: (-t[0].fit, -t[0].score))
    return out


class Scheduler:
    """Feature 8: runs the main app's saved searches on an interval while this window is open.

    It only schedules; the scan itself still goes through your visible, signed-in browser session
    and stops at the first block. Nothing runs when this program is closed.
    """

    def __init__(self, run_scan, interval_min: float = 120.0, quiet_start: int = 23, quiet_end: int = 7):
        self.run_scan = run_scan
        self.interval = max(15.0, interval_min) * 60
        self.quiet = (quiet_start, quiet_end)
        self.next_run = time.time() + 5
        self.enabled = False

    def in_quiet_hours(self, hour: int | None = None) -> bool:
        h = datetime.now().hour if hour is None else hour
        a, b = self.quiet
        return (a <= h or h < b) if a > b else (a <= h < b)

    def tick(self, now: float | None = None) -> bool:
        now = time.time() if now is None else now
        if not self.enabled or now < self.next_run:
            return False
        self.next_run = now + self.interval
        if self.in_quiet_hours():
            return False
        self.run_scan()
        return True


# =========================================================================== #
# Toolkit configuration (alerts, scheduler, optional report e-mail). No secrets stored.
# =========================================================================== #
from dataclasses import dataclass, field, fields as dc_fields  # noqa: E402

TOOLKIT_CONFIG_FILE = core.HOME / "toolkit.json"


@dataclass
class ToolkitConfig:
    alert_min_fit: int = 70
    alert_min_score: int = 0
    notify_enabled: bool = True
    schedule_enabled: bool = False
    schedule_interval_min: float = 180.0
    quiet_start: int = 23
    quiet_end: int = 7
    home_city: str = ""
    want_remote: bool = True
    accept_relocation: bool = False
    smtp_host: str = ""
    smtp_port: int = 465
    smtp_user: str = ""
    report_to: str = ""        # the SMTP password is NEVER stored; set env var JAA_SMTP_PASSWORD when sending
    report_days: int = 7


def load_config(path: Path | None = None) -> ToolkitConfig:
    path = path or TOOLKIT_CONFIG_FILE
    base = ToolkitConfig()
    try:
        obj = json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, ValueError, OSError):
        return base
    if not isinstance(obj, dict):
        return base
    for f in dc_fields(ToolkitConfig):
        if f.name not in obj:
            continue
        default = getattr(base, f.name)
        try:
            v = obj[f.name]
            v = bool(v) if isinstance(default, bool) else int(v) if isinstance(default, int) else float(v) if isinstance(default, float) else str(v)
            setattr(base, f.name, v)
        except (TypeError, ValueError):
            pass
    base.alert_min_fit = max(0, min(100, base.alert_min_fit))
    base.alert_min_score = max(0, min(100, base.alert_min_score))
    base.schedule_interval_min = max(15.0, min(1440.0, base.schedule_interval_min))
    base.quiet_start = max(0, min(23, base.quiet_start))
    base.quiet_end = max(0, min(23, base.quiet_end))
    base.smtp_port = max(1, min(65535, base.smtp_port))
    base.report_days = max(1, min(90, base.report_days))
    return base


def save_config(cfg: ToolkitConfig, path: Path | None = None) -> None:
    core._atomic_write_json(path or TOOLKIT_CONFIG_FILE, asdict(cfg))


# =========================================================================== #
# Kanban (15), interviews (16), calendar export (17)
# =========================================================================== #
def kanban(jobs, show_hidden: bool = False, per_column: int = 200) -> dict[str, list]:
    """Group jobs by pipeline stage, best first. Drag & drop in the GUI calls move_job()."""
    board: dict[str, list] = {s: [] for s in core.PIPELINE_STAGES}
    for j in jobs:
        if j.hidden and not show_hidden:
            continue
        board.setdefault(j.stage if j.stage in board else "New", []).append(j)
    for items in board.values():
        items.sort(key=lambda j: (-j.fit, -j.score, j.title.lower()))
        del items[per_column:]
    return board


def move_job(db: ExtrasDB, url: str, stage: str) -> bool:
    return db.set_job_field(url, "stage", stage)


INTERVIEW_KINDS = ("Phone screen", "HR", "Technical", "System design", "Managerial", "Culture fit", "Assignment", "Final", "Other")
INTERVIEW_OUTCOMES = ("Pending", "Passed", "Failed", "Cancelled", "Rescheduled")


def add_interview(db: ExtrasDB, job_url: str = "", title: str = "", company: str = "", round_name: str = "", kind: str = "Technical",
                  scheduled_at: str = "", duration_min: int = 60, interviewer: str = "", venue: str = "", notes: str = "") -> int:
    if scheduled_at and parse_dt(scheduled_at) is None:
        raise ValueError("Date/time must look like 2026-11-05 14:30 (or just 2026-11-05).")
    duration_min = int(duration_min)
    if not 5 <= duration_min <= 600:
        raise ValueError("Duration must be between 5 and 600 minutes.")
    info = db.job_info(job_url) if job_url else None
    title = title or (info["title"] if info else "")
    company = company or (info["company"] if info else "")
    if not (title or company):
        raise ValueError("Give the interview a job (pick one) or at least a title or company.")
    if kind not in INTERVIEW_KINDS:
        kind = "Other"
    rid = db.insert("x_interviews", job_url=job_url, title=title, company=company, round_name=round_name, kind=kind,
                    scheduled_at=scheduled_at.strip(), duration_min=duration_min, interviewer=interviewer, venue=venue, notes=notes)
    if info and info["stage"] in ("New", "Saved", "Applied"):
        db.set_job_field(job_url, "stage", "Interview")
    db.audit("interview_add", "interview", str(rid), "title", "", f"{title} @ {company}")
    return rid


def set_interview_outcome(db: ExtrasDB, interview_id: int, outcome: str, notes: str | None = None) -> None:
    if outcome not in INTERVIEW_OUTCOMES:
        raise ValueError("Outcome must be one of " + ", ".join(INTERVIEW_OUTCOMES))
    row = db.get("x_interviews", interview_id)
    if not row:
        raise ValueError("Unknown interview.")
    cols = {"outcome": outcome}
    if notes is not None:
        cols["notes"] = notes
    db.update("x_interviews", interview_id, **cols)
    db.audit("interview_outcome", "interview", str(interview_id), "outcome", row["outcome"], outcome)


def upcoming_interviews(db: ExtrasDB, days: int = 14, now: datetime | None = None) -> list[dict]:
    now = now or datetime.now()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=days + 1)
    out = []
    for r in db.rows("x_interviews", "outcome IN ('Pending','Rescheduled')", order="scheduled_at"):
        dt = parse_dt(r["scheduled_at"])
        if dt and start <= dt < end:
            r = dict(r)
            r["when"] = dt
            out.append(r)
    out.sort(key=lambda r: r["when"])
    return out


def interview_stats(db: ExtrasDB) -> dict:
    rows = db.rows("x_interviews")
    outcomes = Counter(r["outcome"] for r in rows)
    by_kind: dict[str, Counter] = defaultdict(Counter)
    for r in rows:
        by_kind[r["kind"]][r["outcome"]] += 1
    decided = {k: (c["Passed"], c["Passed"] + c["Failed"]) for k, c in by_kind.items() if c["Passed"] + c["Failed"]}
    return {"total": len(rows), "outcomes": dict(outcomes),
            "pass_rate_by_kind": {k: (p / d if d else None, d) for k, (p, d) in decided.items()}}


def ics_escape(s: str) -> str:
    return (str(s or "").replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,")
            .replace("\r\n", "\\n").replace("\n", "\\n").replace("\r", "\\n"))


def ics_fold(line: str) -> str:
    """RFC 5545: lines are at most 75 octets; continuations start with a space. Never splits a multibyte character."""
    data = line.encode("utf-8")
    if len(data) <= 75:
        return line
    parts, cur, limit = [], b"", 75
    for ch in line:
        b = ch.encode("utf-8")
        if len(cur) + len(b) > limit:
            parts.append(cur.decode("utf-8"))
            cur, limit = b"", 74
        cur += b
    parts.append(cur.decode("utf-8"))
    return "\r\n ".join(parts)


def make_ics(events: list[dict], name: str = "Job search") -> str:
    """events: {uid, summary, start: datetime|date, end?: datetime, description?, location?, all_day?: bool, alarm_min?: int}"""
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Job Auto Apply Toolkit//EN", "CALSCALE:GREGORIAN",
           "METHOD:PUBLISH", "X-WR-CALNAME:" + ics_escape(name)]
    for e in events:
        start = e["start"]
        uid = e.get("uid") or hashlib.sha1(f"{e['summary']}{start}".encode()).hexdigest()
        out += ["BEGIN:VEVENT", f"UID:{uid}@jobautoapply", f"DTSTAMP:{stamp}", "SUMMARY:" + ics_escape(e["summary"])]
        if e.get("all_day"):
            d0 = start.date() if isinstance(start, datetime) else start
            out += [f"DTSTART;VALUE=DATE:{d0.strftime('%Y%m%d')}", f"DTEND;VALUE=DATE:{(d0 + timedelta(days=1)).strftime('%Y%m%d')}"]
        else:
            end = e.get("end") or (start + timedelta(minutes=60))
            out += [f"DTSTART:{start.strftime('%Y%m%dT%H%M%S')}", f"DTEND:{end.strftime('%Y%m%dT%H%M%S')}"]
        if e.get("description"):
            out.append("DESCRIPTION:" + ics_escape(e["description"]))
        if e.get("location"):
            out.append("LOCATION:" + ics_escape(e["location"]))
        if e.get("alarm_min") is not None:
            out += ["BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + ics_escape(e["summary"]),
                    f"TRIGGER:-PT{int(e['alarm_min'])}M", "END:VALARM"]
        out.append("END:VEVENT")
    out.append("END:VCALENDAR")
    return "\r\n".join(ics_fold(line) for line in out) + "\r\n"


def interview_events(rows: list[dict]) -> list[dict]:
    events = []
    for r in rows:
        dt = parse_dt(r.get("scheduled_at", ""))
        if not dt:
            continue
        desc = [f"Round: {r.get('round_name') or r.get('kind')}", f"Interviewer: {r.get('interviewer') or '—'}"]
        if r.get("notes"):
            desc.append("Notes: " + r["notes"])
        if r.get("job_url", "").startswith("http"):
            desc.append("Job: " + r["job_url"])
        events.append({"uid": f"interview-{r['id']}", "summary": f"Interview: {r['title'] or 'role'} @ {r['company'] or 'company'}",
                       "start": dt, "end": dt + timedelta(minutes=int(r.get("duration_min") or 60)),
                       "description": "\n".join(desc), "location": r.get("venue", ""), "alarm_min": 60,
                       "all_day": len(r["scheduled_at"].strip()) <= 10})
    return events


def followup_events(db: ExtrasDB, days: int = 7, today: date | None = None) -> list[dict]:
    """All-day reminders: follow up on applications with no progress, and contacts you haven't spoken to."""
    today = today or date.today()
    events = []
    for title, company, applied_on, url in db.store.followups_due(days):
        try:
            due = date.fromisoformat(applied_on) + timedelta(days=days)
        except ValueError:
            due = today
        events.append({"uid": "follow-" + hashlib.sha1(url.encode()).hexdigest()[:16], "summary": f"Follow up: {title} @ {company}",
                       "start": max(due, today), "all_day": True,
                       "description": f"Applied {applied_on}; no stage change since. {url}", "alarm_min": None})
    for c in contacts_due(db, 14):
        events.append({"uid": f"contact-{c['id']}", "summary": f"Reach out to {c['name']} ({c['company'] or 'contact'})",
                       "start": today, "all_day": True, "description": c.get("notes", ""), "alarm_min": None})
    return events


# =========================================================================== #
# Contacts (18), offers (20), rejections (21)
# =========================================================================== #
_MAIL_OK = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def add_contact(db: ExtrasDB, name: str, role: str = "", company: str = "", email: str = "", phone: str = "",
                linkedin: str = "", job_url: str = "", notes: str = "") -> int:
    name = core.clean_space(name)
    if not name:
        raise ValueError("A contact needs a name.")
    if email and not _MAIL_OK.match(email.strip()):
        raise ValueError("That email address doesn't look valid.")
    if linkedin and "linkedin.com" not in linkedin.lower():
        raise ValueError("LinkedIn field should be a linkedin.com URL.")
    return db.insert("x_contacts", name=name, role=role, company=company, email=email.strip(), phone=phone.strip(),
                     linkedin=linkedin.strip(), job_url=job_url, notes=notes)


def touch_contact(db: ExtrasDB, contact_id: int, when: str | None = None) -> None:
    db.update("x_contacts", contact_id, last_contacted=when or date.today().isoformat())


def contacts_due(db: ExtrasDB, days: int = 14, today: date | None = None) -> list[dict]:
    today = today or date.today()
    due = []
    for c in db.rows("x_contacts", order="name COLLATE NOCASE"):
        last = c["last_contacted"]
        try:
            age = (today - date.fromisoformat(last)).days if last else None
        except ValueError:
            age = None
        if age is None or age >= days:
            c = dict(c)
            c["days_since"] = age
            due.append(c)
    return due


def contacts_for_job(db: ExtrasDB, job_url: str, company: str = "") -> list[dict]:
    rows = db.rows("x_contacts", "job_url=?", (job_url,), order="name COLLATE NOCASE")
    if company:
        cc = _canon_company(company)
        seen = {r["id"] for r in rows}
        rows += [r for r in db.rows("x_contacts", order="name COLLATE NOCASE") if r["id"] not in seen and _canon_company(r["company"]) == cc and cc]
    return rows


def add_offer(db: ExtrasDB, company: str, title: str = "", fixed_lpa: float = 0, variable_lpa: float = 0, joining_bonus_lpa: float = 0,
              esop_lpa: float = 0, joining_date: str = "", location: str = "", remote: bool = False, benefits: str = "",
              notes: str = "", job_url: str = "") -> int:
    if not core.clean_space(company):
        raise ValueError("An offer needs a company.")
    vals = {k: money(v) for k, v in dict(fixed_lpa=fixed_lpa, variable_lpa=variable_lpa, joining_bonus_lpa=joining_bonus_lpa, esop_lpa=esop_lpa).items()}
    if any(v < 0 or v > 1000 for v in vals.values()):
        raise ValueError("Amounts are in LPA and must be between 0 and 1000.")
    if vals["fixed_lpa"] <= 0:
        raise ValueError("Enter the fixed pay (LPA).")
    if joining_date and parse_dt(joining_date) is None:
        raise ValueError("Joining date must look like 2026-12-01.")
    rid = db.insert("x_offers", job_url=job_url, company=company, title=title, joining_date=joining_date, location=location,
                    remote=int(bool(remote)), benefits=benefits, notes=notes, **vals)
    if job_url and db.job_info(job_url):
        db.set_job_field(job_url, "stage", "Offer")
    return rid


def offer_totals(o: dict, variable_haircut: float = 0.0) -> dict:
    """Annual recurring = fixed + variable. First-year adds joining bonus and the ESOP value you entered.
    variable_haircut (0–1) discounts variable pay, which is usually not guaranteed."""
    fixed, var = money(o["fixed_lpa"]), money(o["variable_lpa"]) * (1 - max(0.0, min(1.0, variable_haircut)))
    annual = fixed + var
    return {"fixed": fixed, "variable": var, "annual": annual, "first_year": annual + money(o["joining_bonus_lpa"]) + money(o["esop_lpa"]),
            "guaranteed": fixed + money(o["joining_bonus_lpa"])}


def compare_offers(offers: list[dict], variable_haircut: float = 0.0, remote_bonus_pct: float = 0.0) -> list[dict]:
    """Rank by annual recurring pay (+ optional % credit for remote roles). Pay is not the only factor — see notes columns."""
    rows = []
    for o in offers:
        t = offer_totals(o, variable_haircut)
        adj = t["annual"] * (1 + (remote_bonus_pct / 100 if o.get("remote") else 0))
        rows.append({**o, **t, "adjusted": adj})
    rows.sort(key=lambda r: -r["adjusted"])
    if rows:
        best = rows[0]["adjusted"]
        for r in rows:
            r["vs_best_pct"] = 0.0 if best == 0 else round(100 * (r["adjusted"] - best) / best, 1)
    return rows


REJECT_REASONS = ("No response", "Not enough experience", "Skills mismatch", "Salary expectation", "Notice period",
                  "Position filled", "Failed technical round", "Failed HR round", "Location", "Other")
REJECT_STAGES = ("Applied", "Screening", "Interview", "Offer")


def log_rejection(db: ExtrasDB, job_url: str = "", reason: str = "Other", stage: str = "Applied", note: str = "",
                  rejected_on: str = "", title: str = "", company: str = "") -> int:
    if reason not in REJECT_REASONS:
        reason = "Other"
    if stage not in REJECT_STAGES:
        stage = "Applied"
    info = db.job_info(job_url) if job_url else None
    title = title or (info["title"] if info else "")
    company = company or (info["company"] if info else "")
    if not (title or company):
        raise ValueError("Pick a job or enter a title or company.")
    if rejected_on and parse_dt(rejected_on) is None:
        raise ValueError("Date must look like 2026-11-05.")
    rid = db.insert("x_rejections", job_url=job_url, title=title, company=company, rejected_on=rejected_on or date.today().isoformat(),
                    stage=stage, reason=reason, note=note)
    if info and info["stage"] != "Rejected":
        db.set_job_field(job_url, "stage", "Rejected")
    return rid


def rejection_patterns(db: ExtrasDB, jobs=None, analysis=None) -> dict:
    rows = db.rows("x_rejections")
    n = len(rows)
    reasons = Counter(r["reason"] for r in rows)
    stages = Counter(r["stage"] for r in rows)
    names: dict[str, str] = {}
    companies: Counter = Counter()
    for r in rows:
        if r["company"]:
            k = _canon_company(r["company"]) or r["company"].lower()
            names.setdefault(k, r["company"])
            companies[k] += 1
    insights: list[str] = []
    if n >= 5:
        top, cnt = reasons.most_common(1)[0]
        if cnt / n >= 0.35:
            insights.append(f"'{top}' accounts for {cnt} of {n} rejections — this is the pattern to fix first.")
        if stages.get("Applied", 0) / n >= 0.6:
            insights.append("Most rejections happen before any interview: improve the resume and the targeting of jobs you apply to.")
        if stages.get("Interview", 0) / n >= 0.4:
            insights.append("Many rejections come after interviews: practise interviews for the roles you reach.")
    elif n:
        insights.append(f"Only {n} rejection(s) logged; patterns appear reliably from about 5.")
    missing_skills: list[tuple[str, int]] = []
    if jobs is not None and analysis is not None:
        by_url = {j.key: j for j in jobs}
        miss: Counter = Counter()
        for r in rows:
            j = by_url.get(r["job_url"])
            if j:
                miss.update(core.job_skills(j) - analysis.skill_set)
        missing_skills = miss.most_common(8)
        if missing_skills and n >= 5:
            insights.append("Skills asked for in rejected jobs that your resume lacks: " + ", ".join(s for s, _ in missing_skills[:5]) + ".")
    return {"total": n, "reasons": dict(reasons), "stages": dict(stages), "repeat_companies": [(names[c], k) for c, k in companies.items() if k > 1],
            "missing_skills": missing_skills, "insights": insights}


# =========================================================================== #
# Analytics (22–26)
# =========================================================================== #
def _svg_wrap(w: int, h: int, body: str, title: str = "") -> str:
    t = f'<text x="{w // 2}" y="18" text-anchor="middle" font-size="13" font-weight="600" fill="#1f2937">{html.escape(title)}</text>' if title else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" font-family="Segoe UI,Arial,sans-serif" role="img" '
            f'aria-label="{html.escape(title)}"><rect width="{w}" height="{h}" fill="#fff"/>{t}{body}</svg>')


def svg_bar_chart(labels: list[str], values: list[float], title: str = "", width: int = 560, height: int = 240, color: str = "#2563eb") -> str:
    if not labels or not any(values):
        return _svg_wrap(width, 80, '<text x="20" y="48" font-size="12" fill="#6b7280">No data yet</text>', title)
    left, right, top, bottom = 36, 12, 34, 44
    inner_w, inner_h = width - left - right, height - top - bottom
    vmax = max(values) or 1
    step = inner_w / len(values)
    bw = max(4, min(48, step * 0.6))
    body = [f'<line x1="{left}" y1="{top + inner_h}" x2="{width - right}" y2="{top + inner_h}" stroke="#d1d5db"/>']
    for i, (lab, v) in enumerate(zip(labels, values)):
        h = inner_h * (v / vmax)
        x = left + i * step + (step - bw) / 2
        y = top + inner_h - h
        body.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw:.1f}" height="{h:.1f}" fill="{color}" rx="2"><title>{html.escape(str(lab))}: {v:g}</title></rect>')
        body.append(f'<text x="{x + bw / 2:.1f}" y="{y - 4:.1f}" text-anchor="middle" font-size="10" fill="#374151">{v:g}</text>')
        body.append(f'<text x="{x + bw / 2:.1f}" y="{top + inner_h + 14}" text-anchor="middle" font-size="10" fill="#6b7280">{html.escape(str(lab)[:10])}</text>')
    return _svg_wrap(width, height, "".join(body), title)


def svg_hbar_chart(items: list[tuple[str, float]], title: str = "", width: int = 560, color: str = "#0f766e", fmt: str = "{:g}") -> str:
    items = [(k, v) for k, v in items if v is not None]
    if not items:
        return _svg_wrap(width, 80, '<text x="20" y="48" font-size="12" fill="#6b7280">No data yet</text>', title)
    row_h, top, left = 24, 32, 150
    height = top + row_h * len(items) + 10
    vmax = max(v for _, v in items) or 1
    body = []
    for i, (k, v) in enumerate(items):
        y = top + i * row_h
        w = (width - left - 60) * (v / vmax)
        body.append(f'<text x="{left - 8}" y="{y + 15}" text-anchor="end" font-size="11" fill="#374151">{html.escape(str(k)[:22])}</text>')
        body.append(f'<rect x="{left}" y="{y + 3}" width="{max(w, 1):.1f}" height="{row_h - 8}" fill="{color}" rx="2"/>')
        body.append(f'<text x="{left + w + 6:.1f}" y="{y + 15}" font-size="11" fill="#374151">{html.escape(fmt.format(v))}</text>')
    return _svg_wrap(width, height, "".join(body), title)


def svg_line_chart(labels: list[str], series: dict[str, list[float]], title: str = "", width: int = 560, height: int = 240) -> str:
    palette = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c"]
    if not labels or not series or not any(any(v for v in vs) for vs in series.values()):
        return _svg_wrap(width, 80, '<text x="20" y="48" font-size="12" fill="#6b7280">No data yet</text>', title)
    left, right, top, bottom = 40, 12, 34, 40
    iw, ih = width - left - right, height - top - bottom
    vmax = max(max(vs) for vs in series.values()) or 1
    n = len(labels)
    xs = [left + (iw * i / (n - 1) if n > 1 else iw / 2) for i in range(n)]
    body = [f'<line x1="{left}" y1="{top + ih}" x2="{width - right}" y2="{top + ih}" stroke="#d1d5db"/>']
    for si, (name, vs) in enumerate(series.items()):
        col = palette[si % len(palette)]
        pts = " ".join(f"{x:.1f},{top + ih - ih * (v / vmax):.1f}" for x, v in zip(xs, vs))
        body.append(f'<polyline points="{pts}" fill="none" stroke="{col}" stroke-width="2"/>')
        body.append(f'<text x="{left + 6 + si * 110}" y="{height - 8}" font-size="11" fill="{col}">● {html.escape(name[:16])}</text>')
    step = max(1, n // 6)
    for i in range(0, n, step):
        body.append(f'<text x="{xs[i]:.1f}" y="{top + ih + 14}" text-anchor="middle" font-size="10" fill="#6b7280">{html.escape(str(labels[i])[-5:])}</text>')
    body.append(f'<text x="{left - 4}" y="{top + 4}" text-anchor="end" font-size="10" fill="#6b7280">{vmax:g}</text>')
    return _svg_wrap(width, height, "".join(body), title)


def funnel(db: ExtrasDB, group_by: str = "overall") -> list[dict]:
    """Feature 23. Counts jobs by evidence: applied (history/stage/interview/offer), interviewed, offered.

    group_by: 'overall' | 'source' | 'resume_version'.
    """
    if group_by not in ("overall", "source", "resume_version"):
        raise ValueError("group_by must be overall, source or resume_version")
    with db.lock:
        hist = {r[0] for r in db.conn.execute("SELECT DISTINCT job_url FROM application_history WHERE status IN (?,?,?)", SUCCESS_STATUSES)}
        stages = {r[0]: r[1] for r in db.conn.execute("SELECT url,stage FROM jobs")}
        ints = {r[0] for r in db.conn.execute("SELECT DISTINCT job_url FROM x_interviews WHERE job_url!=''")}
        offs = {r[0] for r in db.conn.execute("SELECT DISTINCT job_url FROM x_offers WHERE job_url!=''")}
    meta = db.meta_map()
    applied = hist | {u for u, s in stages.items() if s in ("Applied", "Interview", "Offer")} | ints | offs
    interviewed = ints | {u for u, s in stages.items() if s in ("Interview", "Offer")} | offs
    offered = offs | {u for u, s in stages.items() if s == "Offer"}

    def key(url: str) -> str:
        src, rv = meta.get(url, ("naukri", ""))
        return "All" if group_by == "overall" else (src or "naukri") if group_by == "source" else (rv or "(none)")
    groups: dict[str, dict] = {}
    for url in applied:
        g = groups.setdefault(key(url), {"group": key(url), "applied": 0, "interviewed": 0, "offered": 0})
        g["applied"] += 1
        g["interviewed"] += url in interviewed
        g["offered"] += url in offered
    out = []
    for g in sorted(groups.values(), key=lambda g: -g["applied"]):
        g["interview_rate"] = g["interviewed"] / g["applied"] if g["applied"] else None
        g["offer_rate"] = g["offered"] / g["interviewed"] if g["interviewed"] else None
        g["small_sample"] = g["applied"] < 10
        out.append(g)
    return out


def _pct(vals: list[float], q: float) -> float:
    vals = sorted(vals)
    if not vals:
        return 0.0
    pos = (len(vals) - 1) * q
    lo, hi = int(math.floor(pos)), int(math.ceil(pos))
    return vals[lo] + (vals[hi] - vals[lo]) * (pos - lo)


def _role_of(title: str) -> str:
    low = title.lower()
    best, best_len = "Other", 0
    for role, (kws, _core) in core.ROLE_PROFILES.items():
        for k in kws:
            if k in low and len(k) > best_len:
                best, best_len = role, len(k)
    return best


def salary_insights(jobs, group_by: str = "role", min_n: int = 3) -> dict:
    """Feature 24: pay ranges from the jobs you've collected, in LPA. Only jobs that DISCLOSE salary count;
    on Naukri that is often a minority, so read the sample size next to every number."""
    if group_by not in ("role", "city", "experience"):
        raise ValueError("group_by must be role, city or experience")
    groups: dict[str, list[float]] = defaultdict(list)
    total, with_salary = 0, 0
    for j in jobs:
        total += 1
        rng = core.parse_salary_range_lpa(j.salary)
        if not rng:
            continue
        with_salary += 1
        mid = (rng[0] + rng[1]) / 2
        if group_by == "role":
            k = _role_of(j.title)
        elif group_by == "city":
            cities = sorted(_cities_in(j.location))
            k = cities[0].title() if cities else "Unknown"
        else:
            e = core.parse_year_range(j.experience)
            m = (e[0] + e[1]) / 2 if e else None
            k = "Unknown" if m is None else "0–2 yrs" if m < 2 else "2–5 yrs" if m < 5 else "5–9 yrs" if m < 9 else "9+ yrs"
        groups[k].append(mid)
    rows = []
    for k, vals in groups.items():
        if len(vals) >= min_n:
            rows.append({"group": k, "n": len(vals), "p25": round(_pct(vals, .25), 1), "median": round(_pct(vals, .5), 1), "p75": round(_pct(vals, .75), 1)})
    rows.sort(key=lambda r: -r["median"])
    skipped = sorted(((k, len(v)) for k, v in groups.items() if len(v) < min_n), key=lambda kv: -kv[1])
    return {"rows": rows, "jobs": total, "with_salary": with_salary,
            "coverage_pct": round(100 * with_salary / total, 1) if total else 0.0, "too_few": skipped}


def snapshot_skills(db: ExtrasDB, jobs, day: str | None = None) -> int:
    """Feature 25: record today's skill demand across the jobs seen today. Call once per scan; it overwrites the same day."""
    day = day or core.today_utc()
    todays = [j for j in jobs if (j.last_seen or "")[:10] == day and not j.hidden]
    if not todays:
        return 0
    counts: Counter = Counter()
    for j in todays:
        counts.update(core.job_skills(j))
    with db.lock:
        db.conn.execute("DELETE FROM x_snapshots WHERE day=?", (day,))
        db.conn.executemany("INSERT INTO x_snapshots(day,skill,n,total) VALUES (?,?,?,?)", [(day, s, n, len(todays)) for s, n in counts.items()])
        db.conn.commit()
    return len(counts)


def skill_trends(db: ExtrasDB, days: int = 60, top: int = 12, min_days: int = 4) -> dict:
    """Share of scanned jobs mentioning each skill, per day, plus rising/falling by comparing the two halves of the period."""
    since = (date.today() - timedelta(days=days)).isoformat()
    with db.lock:
        rows = db.conn.execute("SELECT day,skill,n,total FROM x_snapshots WHERE day>=? ORDER BY day", (since,)).fetchall()
    day_list = sorted({r[0] for r in rows})
    if len(day_list) < min_days:
        return {"days": day_list, "series": {}, "rising": [], "falling": [], "ready": False,
                "message": f"Need snapshots from at least {min_days} different days (have {len(day_list)}). Scan on several days; trends build up over time."}
    share: dict[str, dict[str, float]] = defaultdict(dict)
    for d, s, n, total in rows:
        share[s][d] = 100.0 * n / total if total else 0.0
    avg = {s: statistics.mean(v.values()) for s, v in share.items()}
    chosen = [s for s, _ in sorted(avg.items(), key=lambda kv: -kv[1])[:top]]
    series = {s: [round(share[s].get(d, 0.0), 1) for d in day_list] for s in chosen}
    half = len(day_list) // 2
    changes = []
    for s in share:
        first = [share[s].get(d, 0.0) for d in day_list[:half]]
        last = [share[s].get(d, 0.0) for d in day_list[half:]]
        changes.append((s, statistics.mean(last) - statistics.mean(first), statistics.mean(last)))
    significant = [c for c in changes if c[2] >= 3.0]
    rising = sorted((c for c in significant if c[1] >= 2.0), key=lambda c: -c[1])[:6]
    falling = sorted((c for c in significant if c[1] <= -2.0), key=lambda c: c[1])[:6]
    return {"days": day_list, "series": series, "rising": [(s, round(d, 1)) for s, d, _ in rising],
            "falling": [(s, round(d, 1)) for s, d, _ in falling], "ready": True, "message": ""}


def build_weekly_report(db: ExtrasDB, days: int = 7, jobs=None, analysis=None, now: datetime | None = None) -> dict:
    now = now or datetime.now(timezone.utc)
    since = (now - timedelta(days=days)).isoformat(timespec="seconds")
    with db.lock:
        ok = db.conn.execute("SELECT DISTINCT job_url,title,company FROM application_history WHERE status IN (?,?,?) AND timestamp>=?", (*SUCCESS_STATUSES, since)).fetchall()
        statuses = Counter({r[0]: r[1] for r in db.conn.execute("SELECT status,COUNT(*) FROM application_history WHERE timestamp>=? GROUP BY status", (since,))})
        per_day = {r[0]: r[1] for r in db.conn.execute(
            "SELECT substr(timestamp,1,10),COUNT(DISTINCT job_url) FROM application_history WHERE status IN (?,?,?) AND timestamp>=? GROUP BY 1", (*SUCCESS_STATUSES, since))}
        new_jobs = db.conn.execute("SELECT COUNT(*) FROM jobs WHERE first_seen>=?", (since,)).fetchone()[0]
        stage_counts = Counter({r[0]: r[1] for r in db.conn.execute("SELECT stage,COUNT(*) FROM jobs WHERE hidden=0 GROUP BY stage")})
    labels = [(now - timedelta(days=i)).date().isoformat() for i in range(days - 1, -1, -1)]
    best = []
    if jobs is not None:
        fresh = [j for j in jobs if (j.first_seen or "") >= since and not j.hidden]
        best = sorted(fresh, key=lambda j: (-j.fit, -j.score))[:8]
    return {"generated": now.isoformat(timespec="seconds"), "days": days, "applied": [dict(zip(("url", "title", "company"), r)) for r in ok],
            "statuses": dict(statuses), "per_day": [(d[5:], per_day.get(d, 0)) for d in labels], "new_jobs": new_jobs,
            "stages": dict(stage_counts), "best_new": best, "interviews": upcoming_interviews(db, 7),
            "followups": db.store.followups_due(7), "contacts_due": contacts_due(db, 14)[:10], "attempts_total": sum(statuses.values())}


def weekly_report_html(rep: dict, analysis=None) -> str:
    e = html.escape
    sec = []
    sec.append(f"<h2>Applications this period: {len(rep['applied'])}</h2>")
    sec.append(svg_bar_chart([d for d, _ in rep["per_day"]], [n for _, n in rep["per_day"]], "Evidence-backed applications per day"))
    if rep["applied"]:
        sec.append("<ul>" + "".join(f"<li>{e(a['title'])} — {e(a['company'])}</li>" for a in rep["applied"][:25]) + "</ul>")
    sec.append(f"<h2>Pipeline</h2>" + svg_hbar_chart([(s, rep["stages"].get(s, 0)) for s in core.PIPELINE_STAGES], "Jobs by stage"))
    sec.append(f"<p>{rep['new_jobs']} new jobs discovered.</p>")
    if rep["best_new"]:
        sec.append("<h2>Best new matches</h2><ol>" + "".join(
            f"<li>{e(j.title)} — {e(j.company)} (fit {j.fit}, match {j.score})</li>" for j in rep["best_new"]) + "</ol>")
    if rep["interviews"]:
        sec.append("<h2>Upcoming interviews</h2><ul>" + "".join(
            f"<li>{e(r['when'].strftime('%a %d %b %H:%M'))} — {e(r['title'])} @ {e(r['company'])} ({e(r['kind'])})</li>" for r in rep["interviews"]) + "</ul>")
    if rep["followups"]:
        sec.append("<h2>Follow-ups due</h2><ul>" + "".join(f"<li>{e(t)} — {e(c)} (applied {e(d)})</li>" for t, c, d, _u in rep["followups"][:15]) + "</ul>")
    if rep["contacts_due"]:
        sec.append("<h2>People to reach out to</h2><ul>" + "".join(f"<li>{e(c['name'])} ({e(c['company'])})</li>" for c in rep["contacts_due"]) + "</ul>")
    return ("<!doctype html><html><head><meta charset='utf-8'><title>Job search report</title><style>"
            "body{font-family:Segoe UI,Arial,sans-serif;max-width:760px;margin:24px auto;color:#1f2937;padding:0 12px}h1{margin-bottom:0}"
            "h2{margin-top:28px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}svg{max-width:100%;height:auto}</style></head><body>"
            f"<h1>Job search report</h1><p>Last {rep['days']} days · generated {e(rep['generated'])} UTC</p>" + "".join(sec) + "</body></html>")


def save_report(html_text: str, path: Path | None = None) -> Path:
    path = path or (REPORT_DIR / f"report-{date.today().isoformat()}.html")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html_text, encoding="utf-8")
    return path


def send_report_email(html_text: str, cfg: ToolkitConfig, subject: str = "Job search report", password: str | None = None) -> str:
    """Optional. Uses your own SMTP server; the password comes from the JAA_SMTP_PASSWORD environment variable and is never saved."""
    if not (cfg.smtp_host and cfg.smtp_user and cfg.report_to):
        raise ValueError("Set SMTP host, user and recipient in the toolkit settings first.")
    password = password or os.environ.get("JAA_SMTP_PASSWORD", "")
    if not password:
        raise ValueError("Set the JAA_SMTP_PASSWORD environment variable (it is never stored on disk).")
    msg = EmailMessage()
    msg["Subject"], msg["From"], msg["To"] = subject, cfg.smtp_user, cfg.report_to
    msg.set_content("Your mail client does not show HTML. Open the saved report file instead.")
    msg.add_alternative(html_text, subtype="html")
    ctx = ssl.create_default_context()
    if cfg.smtp_port == 465:
        with smtplib.SMTP_SSL(cfg.smtp_host, cfg.smtp_port, context=ctx, timeout=30) as s:
            s.login(cfg.smtp_user, password)
            s.send_message(msg)
    else:
        with smtplib.SMTP(cfg.smtp_host, cfg.smtp_port, timeout=30) as s:
            s.starttls(context=ctx)
            s.login(cfg.smtp_user, password)
            s.send_message(msg)
    return f"Sent to {cfg.report_to}"


# =========================================================================== #
# Reliability & safety (27–30, 32)
# =========================================================================== #
HEALTH_CARD_SELECTORS = [s.strip() for s in core.CARD_CSS.split(", ")]
HEALTH_FIELD_SELECTORS = {   # must mirror the selectors inside core.JS_EXTRACT (a self-test enforces this)
    "title link": 'a.title[href], a[href*="job-listings-"]',
    "company": ".comp-name, .subTitle, .companyName, a.comp-name",
    "location": '.locWdth, .location, [class*="locWdth"], [class*="location"]',
    "experience": '.expwdth, .experience, [class*="expwdth"]',
    "salary": '.sal-wrap, [class*="salary"], [class*="sal-wrap"]',
    "posted": '.job-post-day, .type, .postedDate, [class*="posted"]',
}
HEALTH_NEXT = "a[aria-label='Next'], a[title='Next'], a:has-text('Next'), button:has-text('Next')"
JS_HEALTH_SEARCH = r"""(cfg) => {
  const out = {groups: {}, cards: 0, fields: {}, next: 0};
  for (const s of cfg.cards) { try { out.groups[s] = document.querySelectorAll(s).length; } catch (e) { out.groups[s] = -1; } }
  const cards = document.querySelectorAll(cfg.cards.join(', '));
  out.cards = cards.length;
  for (const k in cfg.fields) { let n = 0; cards.forEach(c => { const e = c.querySelector(cfg.fields[k]);
      if (e && (e.textContent || '').trim()) n++; }); out.fields[k] = n; }
  try { out.next = document.querySelectorAll("a[aria-label='Next'], a[title='Next']").length; } catch (e) {}
  return out; }"""
JS_HEALTH_JOB = r"""() => ({
  apply: document.querySelectorAll('button#apply-button').length,
  external: document.querySelectorAll('button#company-site-button').length,
  applied_text: /(^|\s)Applied(\s|$)/.test(document.body ? document.body.innerText.slice(0, 4000) : ''),
  description: document.querySelectorAll('.styles_JDC__dang-inner-html__h0K4t, .job-desc, [class*="dang-inner-html"], [class*="job-desc"], section[class*="JDC"]').length,
  title: document.title })"""


def evaluate_search_health(res: dict) -> dict:
    checks, cards = [], int(res.get("cards", 0))
    fields = res.get("fields", {})

    def add(level, name, detail):
        checks.append({"level": level, "name": name, "detail": detail})
    if cards == 0:
        add("FAIL", "Job cards", "No job cards matched. Naukri's markup may have changed, you may be signed out or blocked, or the search had no results.")
    else:
        add("OK", "Job cards", f"{cards} cards found.")
        for name, floor, level in (("title link", 0.9, "FAIL"), ("company", 0.6, "WARN"), ("location", 0.5, "WARN"), ("experience", 0.4, "WARN")):
            rate = fields.get(name, 0) / cards
            add("OK" if rate >= floor else level, name.title(), f"{fields.get(name, 0)}/{cards} cards ({rate:.0%}).")
        for name in ("salary", "posted"):
            n = fields.get(name, 0)
            if cards >= 10 and n == 0:
                add("WARN", name.title(), "Found on 0 cards. Can be genuine (undisclosed) or a changed selector.")
            else:
                add("OK", name.title(), f"{n}/{cards} cards.")
        dead = [s for s, n in res.get("groups", {}).items() if n == -1]
        if dead:
            add("WARN", "Selector syntax", "Selectors rejected by the browser: " + ", ".join(dead))
    level = "FAIL" if any(c["level"] == "FAIL" for c in checks) else "WARN" if any(c["level"] == "WARN" for c in checks) else "OK"
    return {"level": level, "checks": checks, "advice": _health_advice(level, cards)}


def evaluate_job_health(res: dict) -> dict:
    checks = []
    has_control = res.get("apply", 0) or res.get("external", 0) or res.get("applied_text")
    checks.append({"level": "OK" if has_control else "WARN", "name": "Apply control",
                   "detail": "Found." if has_control else "No Apply / company-site button and no 'Applied' marker. Layout changed, or you are signed out."})
    checks.append({"level": "OK" if res.get("description") else "WARN", "name": "Description block",
                   "detail": "Found." if res.get("description") else "Not found; 'Load details' may return empty text."})
    level = "WARN" if any(c["level"] == "WARN" for c in checks) else "OK"
    return {"level": level, "checks": checks, "advice": _health_advice(level, 1)}


def _health_advice(level: str, cards: int) -> list[str]:
    if level == "OK":
        return ["Selectors look healthy."]
    tips = ["Open the page in the toolkit's browser and check you are signed in and not on an access-denied page."]
    if level == "FAIL":
        tips += ["If the page looks normal, Naukri changed its markup: right-click a job card → Inspect, note its class names, and update CARD_CSS / JS_EXTRACT in job_auto_apply_pro.py.",
                 "Do not retry rapidly; if the page shows 'Access Denied', stop and try later."]
    return tips


def run_health_probe(page, url_kind: str = "search") -> dict:
    """Run the checks on an already-open Playwright page (no navigation here)."""
    if url_kind == "search":
        return evaluate_search_health(page.evaluate(JS_HEALTH_SEARCH, {"cards": HEALTH_CARD_SELECTORS, "fields": HEALTH_FIELD_SELECTORS}))
    return evaluate_job_health(page.evaluate(JS_HEALTH_JOB))


def health_report_text(rep: dict, title: str) -> str:
    L = [f"{title}: {rep['level']}", "-" * 40]
    L += [f"[{c['level']:<4}] {c['name']}: {c['detail']}" for c in rep["checks"]]
    L += [""] + ["→ " + a for a in rep["advice"]]
    return "\n".join(L)


class ToolkitWorker(core.BrowserWorker):
    """The main app's browser worker plus a read-only health check. Same visible browser, same safety rules."""

    def health(self, payload: dict) -> None:
        self.launch()
        url = core.search_url(payload["query"], payload["city"], "", "Any")
        self.log("Health check: opening " + url)
        response = self.goto(self.home, url)
        self.home.wait_for_timeout(2500)
        if core.blocked(self.home, response):
            self.send("health_done", search=None, job=None, blocked=True)
            return
        self.home.evaluate("window.scrollTo(0, Math.round(document.body.scrollHeight*0.65))")
        self.home.wait_for_timeout(700)
        search_rep = run_health_probe(self.home, "search")
        job_rep = None
        first = self.home.evaluate("() => { const a = document.querySelector('a.title[href], a[href*=\"job-listings-\"]'); return a ? a.href : ''; }")
        if first and core.naukri_url(first):
            page = self.context.new_page()
            try:
                resp = self.goto(page, first)
                page.wait_for_timeout(1500)
                job_rep = None if core.blocked(page, resp) else run_health_probe(page, "job")
            finally:
                try:
                    page.close()
                except Exception:
                    pass
        self.send("health_done", search=search_rep, job=job_rep, blocked=False)

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
                    elif kind == "health":
                        self.stop_event.clear()
                        self.health(payload)
                    else:
                        raise ValueError("Unknown job command " + kind)
                except Exception as exc:
                    core.LOG.error("worker error: %s\n%s", exc, traceback.format_exc())
                    self.log("ERROR: " + str(exc))
                    self.send("error", message=str(exc))
        finally:
            for closer in (getattr(self.context, "close", None), getattr(self.pw, "stop", None)):
                if closer:
                    try:
                        closer()
                    except Exception:
                        pass


def resumable_queue_jobs(db: ExtrasDB, all_jobs) -> list:
    """Feature 28: jobs still pending from an interrupted run. Anything already attempted is skipped,
    because the main app records ATTEMPTED before it clicks — so a crash can never cause a double application."""
    by_url = {j.key: j for j in all_jobs}
    out = []
    for row in db.queue_pending():
        j = by_url.get(row["job_url"])
        if j is None:
            db.queue_mark(row["job_url"], "missing", "Job no longer in the stored list")
        elif db.store.already_attempted(j):
            db.queue_mark(row["job_url"], "skipped", "Already attempted before the interruption")
        else:
            out.append(j)
    return out


def sync_queue_with_result(db: ExtrasDB, job_url: str, status: str, evidence: str = "") -> None:
    db.queue_mark(job_url, status.lower(), evidence)


class VaultUnavailable(RuntimeError):
    pass


_VAULT_MAGIC = b"JAAV1"


def _fernet(passphrase: str, salt: bytes):
    try:
        from cryptography.fernet import Fernet
        from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
    except ImportError:
        raise VaultUnavailable("The vault needs the 'cryptography' package:  py -m pip install cryptography")
    key = Scrypt(salt=salt, length=32, n=2 ** 15, r=8, p=1).derive(passphrase.encode("utf-8"))
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt_blob(passphrase: str, data: bytes) -> bytes:
    if len(passphrase) < 8:
        raise ValueError("Use a passphrase of at least 8 characters.")
    salt = os.urandom(16)
    return _VAULT_MAGIC + salt + _fernet(passphrase, salt).encrypt(data)


def decrypt_blob(passphrase: str, blob: bytes) -> bytes:
    if not blob.startswith(_VAULT_MAGIC) or len(blob) < len(_VAULT_MAGIC) + 17:
        raise ValueError("Not a toolkit vault file.")
    salt = blob[len(_VAULT_MAGIC):len(_VAULT_MAGIC) + 16]
    f = _fernet(passphrase, salt)
    try:
        return f.decrypt(blob[len(_VAULT_MAGIC) + 16:])
    except Exception:
        raise ValueError("Wrong passphrase, or the file is damaged.")


VAULT_FILE = core.HOME / "vault.bin"


def vault_load(passphrase: str, path: Path | None = None) -> dict:
    path = path or VAULT_FILE
    if not path.exists():
        return {}
    return json.loads(decrypt_blob(passphrase, path.read_bytes()).decode("utf-8"))


def vault_save(passphrase: str, data: dict, path: Path | None = None) -> None:
    path = path or VAULT_FILE
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_bytes(encrypt_blob(passphrase, json.dumps(data, ensure_ascii=False).encode("utf-8")))
    os.replace(tmp, path)
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass


def encrypted_backup(db: ExtrasDB, out_path: str, passphrase: str) -> Path:
    """Encrypted copy of the database + settings + profile. The live files on disk stay as they are (plain)."""
    with tempfile.TemporaryDirectory() as d:
        z = db.store.backup_to(Path(d) / "b.zip")
        Path(out_path).write_bytes(encrypt_blob(passphrase, z.read_bytes()))
    return Path(out_path)


def decrypt_backup(in_path: str, out_zip: str, passphrase: str) -> Path:
    Path(out_zip).write_bytes(decrypt_blob(passphrase, Path(in_path).read_bytes()))
    return Path(out_zip)


BUNDLE_FORMAT, BUNDLE_VERSION = "jaa-bundle", 1


def _bundle_checksum(payload: dict) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()


def export_bundle(db: ExtrasDB, path: str, include_profile: bool = True, passphrase: str = "") -> dict:
    """Feature 32: settings, saved searches, screening rules, toolkit config, custom templates, watchlist, resume versions.
    The profile contains personal data (name, phone, CTC) — pass a passphrase to encrypt the whole file."""
    custom = [t for t in db.templates() if not t["builtin"]]
    payload = {"settings": asdict(core.load_settings()), "toolkit": asdict(load_config()),
               "templates": custom, "watchlist": [{"company": c} for c in db.watch_list()],
               "resumes": [{"name": r["name"], "path": r["path"], "note": r["note"]} for r in db.resume_versions()]}
    if include_profile:
        payload["candidate"] = asdict(core.load_candidate())
    doc = {"format": BUNDLE_FORMAT, "version": BUNDLE_VERSION, "created": now_iso(), "checksum": _bundle_checksum(payload), "payload": payload}
    raw = json.dumps(doc, indent=2, ensure_ascii=False).encode("utf-8")
    Path(path).write_bytes(encrypt_blob(passphrase, raw) if passphrase else raw)
    return {"path": path, "encrypted": bool(passphrase), "templates": len(custom), "saved_searches": len(payload["settings"].get("saved_searches", [])),
            "rules": len(payload["settings"].get("screening_rules", [])), "has_profile": include_profile}


def import_bundle(db: ExtrasDB, path: str, passphrase: str = "", import_profile: bool = True, overwrite_profile: bool = False) -> list[str]:
    raw = Path(path).read_bytes()
    if raw.startswith(_VAULT_MAGIC):
        if not passphrase:
            raise ValueError("This bundle is encrypted — enter its passphrase.")
        raw = decrypt_blob(passphrase, raw)
    try:
        doc = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        raise ValueError("Not a valid bundle file.")
    if not isinstance(doc, dict) or doc.get("format") != BUNDLE_FORMAT:
        raise ValueError("Not a Job Auto Apply bundle.")
    if doc.get("version", 0) > BUNDLE_VERSION:
        raise ValueError("Bundle was made by a newer version; update the toolkit first.")
    payload = doc.get("payload")
    if not isinstance(payload, dict) or doc.get("checksum") != _bundle_checksum(payload):
        raise ValueError("Bundle is damaged or was edited (checksum mismatch).")
    report: list[str] = []
    s = payload.get("settings")
    if isinstance(s, dict):
        known = {f.name for f in dc_fields(core.Settings)}
        merged = {**asdict(core.load_settings()), **{k: v for k, v in s.items() if k in known}}
        core.save_settings(core.Settings(**merged))
        report.append(f"Settings imported ({len(s.get('saved_searches', []))} saved searches, {len(s.get('screening_rules', []))} screening rules).")
    t = payload.get("toolkit")
    if isinstance(t, dict):
        cfg = load_config()
        for f in dc_fields(ToolkitConfig):
            if f.name in t:
                setattr(cfg, f.name, t[f.name])
        tmp = TOOLKIT_CONFIG_FILE.with_suffix(".import")
        core._atomic_write_json(tmp, asdict(cfg))
        save_config(load_config(tmp))   # re-validated through load_config
        tmp.unlink(missing_ok=True)
        report.append("Toolkit settings imported.")
    n = 0
    for tpl in payload.get("templates", []):
        if isinstance(tpl, dict) and tpl.get("name") and tpl.get("body"):
            db.save_template(str(tpl["name"]), str(tpl.get("kind", "email")), str(tpl.get("subject", "")), str(tpl["body"]))
            n += 1
    report.append(f"{n} custom template(s) imported.")
    for w in payload.get("watchlist", []):
        if isinstance(w, dict) and w.get("company"):
            db.watch_add(str(w["company"]))
    report.append(f"{len(payload.get('watchlist', []))} watchlist compan(ies) imported.")
    skipped = 0
    for r in payload.get("resumes", []):
        try:
            db.add_resume_version(str(r["name"]), str(r["path"]), str(r.get("note", "")))
        except (ValueError, KeyError):
            skipped += 1
    if skipped:
        report.append(f"{skipped} resume version(s) skipped because the file doesn't exist on this computer.")
    cand = payload.get("candidate")
    if import_profile and isinstance(cand, dict):
        cur = core.load_candidate()
        names = [f.name for f in dc_fields(core.Candidate)]
        new = {k: (str(cand.get(k, "")) if (overwrite_profile or not getattr(cur, k)) else getattr(cur, k)) for k in names}
        if new.get("resume") and not Path(new["resume"]).is_file():
            new["resume"] = getattr(cur, "resume", "")
        core.save_candidate(core.Candidate(**new))
        report.append("Profile imported" + (" (existing values overwritten)." if overwrite_profile else " (only empty fields filled)."))
    db.audit("bundle_import", "bundle", Path(path).name)
    return report


# =========================================================================== #
# Plain-text views (used by the window, the command line and the tests)
# =========================================================================== #
def _rate(x) -> str:
    return "—" if x is None else f"{x:.0%}"


def funnel_text(rows: list[dict], group_by: str = "overall") -> str:
    L = [f"APPLICATION FUNNEL — by {group_by}", "-" * 72,
         f"{'Group':<24}{'Applied':>8}{'Interview':>10}{'Offer':>7}{'Int. rate':>11}{'Offer rate':>11}"]
    if not rows:
        return "\n".join(L + ["No applications with evidence yet."])
    for r in rows:
        L.append(f"{r['group'][:23]:<24}{r['applied']:>8}{r['interviewed']:>10}{r['offered']:>7}{_rate(r['interview_rate']):>11}{_rate(r['offer_rate']):>11}"
                 + ("  *" if r["small_sample"] else ""))
    L += ["", "Applied counts jobs with evidence (confirmed/partial in history, or a stage you set).",
          "* fewer than 10 applications — treat the rates as anecdotes, not statistics."]
    return "\n".join(L)


def salary_text(res: dict, group_by: str = "role") -> str:
    L = [f"SALARY INSIGHTS — by {group_by} (LPA, midpoint of each advertised range)", "-" * 72,
         f"Jobs stored: {res['jobs']}   disclosing salary: {res['with_salary']} ({res['coverage_pct']}%)"]
    if res["rows"]:
        L.append(f"{'Group':<26}{'n':>5}{'25th':>8}{'median':>9}{'75th':>8}")
        L += [f"{r['group'][:25]:<26}{r['n']:>5}{r['p25']:>8g}{r['median']:>9g}{r['p75']:>8g}" for r in res["rows"]]
    else:
        L.append("Not enough jobs with a disclosed salary in any group yet (need 3+ per group).")
    if res["too_few"]:
        L.append("Too few to show: " + ", ".join(f"{k} ({n})" for k, n in res["too_few"][:8]))
    L.append("\nOnly jobs that publish a salary are counted, so these figures describe advertised pay, not the whole market.")
    return "\n".join(L)


def trends_text(tr: dict) -> str:
    if not tr["ready"]:
        return "SKILL-DEMAND TRENDS\n" + "-" * 40 + "\n" + tr["message"]
    L = [f"SKILL-DEMAND TRENDS — {tr['days'][0]} to {tr['days'][-1]} ({len(tr['days'])} snapshot days)", "-" * 60]
    L.append("Rising : " + (", ".join(f"{s} (+{d} pts)" for s, d in tr["rising"]) or "none above the noise threshold"))
    L.append("Falling: " + (", ".join(f"{s} ({d} pts)" for s, d in tr["falling"]) or "none above the noise threshold"))
    L.append("\nShare of scanned jobs mentioning each skill (latest day):")
    for s, vals in tr["series"].items():
        L.append(f"  {s:<22}{vals[-1]:>6.1f}%  {text_bar(int(vals[-1]), 100, 25)}")
    L.append("\nShifts reflect what YOUR searches returned, which changes when you change the searches.")
    return "\n".join(L)


text_bar = core.text_bar


def offers_text(rows: list[dict]) -> str:
    if not rows:
        return "No offers recorded."
    L = ["OFFER COMPARISON (LPA)", "-" * 92,
         f"{'Company':<20}{'Fixed':>7}{'Var':>7}{'Annual':>8}{'1st yr':>8}{'Guar.':>7}{'vs best':>9}  {'Remote':<7}{'Joining'}"]
    for r in rows:
        L.append(f"{r['company'][:19]:<20}{r['fixed']:>7g}{r['variable']:>7g}{r['annual']:>8g}{r['first_year']:>8g}{r['guaranteed']:>7g}"
                 f"{r.get('vs_best_pct', 0):>8g}%  {'yes' if r.get('remote') else 'no':<7}{r.get('joining_date') or '—'}")
    L += ["", "Annual = fixed + variable. 1st yr adds joining bonus and the ESOP value you entered. Guar. = fixed + joining bonus.",
          "Pay isn't everything: compare growth, team, location and benefits in each offer's notes."]
    return "\n".join(L)


def patterns_text(p: dict) -> str:
    L = [f"REJECTION LOG — {p['total']} entries", "-" * 50]
    if not p["total"]:
        return "\n".join(L + ["Nothing logged yet."])
    L.append("By reason: " + ", ".join(f"{k} ×{v}" for k, v in sorted(p["reasons"].items(), key=lambda kv: -kv[1])))
    L.append("By stage : " + ", ".join(f"{k} ×{v}" for k, v in sorted(p["stages"].items(), key=lambda kv: -kv[1])))
    if p["repeat_companies"]:
        L.append("Repeat companies: " + ", ".join(f"{c} ×{n}" for c, n in p["repeat_companies"]))
    if p["missing_skills"]:
        L.append("Skills asked for in rejected jobs, missing from your resume: " + ", ".join(f"{s} ×{n}" for s, n in p["missing_skills"]))
    if p["insights"]:
        L += ["", "What this suggests:"] + ["  → " + i for i in p["insights"]]
    return "\n".join(L)


def interviews_text(rows: list[dict]) -> str:
    if not rows:
        return "No upcoming interviews."
    return "\n".join(f"{r['when'].strftime('%a %d %b %H:%M')}  {r['kind']:<14} {r['title'] or '—'} @ {r['company'] or '—'}"
                     + (f"  ({r['interviewer']})" if r["interviewer"] else "") for r in rows)


def tailor_text(res: dict) -> str:
    L = [f"RESUME TAILORING — skill coverage {res['coverage']}%", "-" * 50,
         "Job asks for: " + (", ".join(f"{s}×{c}" for s, c in sorted(res['required'].items(), key=lambda kv: -kv[1])) or "nothing recognised"),
         "Your resume has: " + (", ".join(res["present"]) or "none of them"),
         "Missing: " + (", ".join(res["missing"]) or "nothing")]
    if res["other_terms"]:
        L.append("Other repeated terms in the job not found in your resume: " + ", ".join(w for w, _ in res["other_terms"]))
    L += [""] + ["→ " + a for a in res["advice"]]
    L.append("\nOnly claim skills you really have; recruiters and interviews will test them.")
    return "\n".join(L)


def role_check_text(res: dict) -> str:
    L = [f"ROLE CHECK — {res['role']}: {res['coverage']}% of core skills on your resume", "-" * 50,
         "Have   : " + (", ".join(res["have"]) or "none"), "Missing: " + (", ".join(res["missing"]) or "none")]
    if res["weak"]:
        L.append("Mentioned only once (strengthen with a project or result): " + ", ".join(res["weak"]))
    L.append("Titles recruiters search for: " + ", ".join(res["title_words"]))
    return "\n".join(L)


def red_flags_text(job, flags: list[dict]) -> str:
    if not flags:
        return f"No red flags found in '{job.title}'. (This is a text check only — it can't verify a company.)"
    L = [f"RED FLAGS for '{job.title}' — risk {flag_score(flags)}/100", "-" * 50]
    L += [f"[{f['severity'].upper():<6}] {f['label']}" for f in flags]
    L.append("\nFlags are reasons to look closer, not proof. Never pay money to get a job.")
    return "\n".join(L)


def dupes_text(clusters: list[list]) -> str:
    if not clusters:
        return "No duplicate postings found."
    L = [f"{len(clusters)} duplicate group(s)", "-" * 50]
    for i, g in enumerate(clusters, 1):
        L.append(f"Group {i}: {g[0].company or '—'}")
        L += [f"   • {j.title}  [{j.key[:70]}]" for j in g]
    return "\n".join(L)


def diff_text(c: dict) -> str:
    a, b = c["names"]
    L = [f"RESUME COMPARISON: {a} vs {b}", "-" * 50, f"Score: {c['score'][0]} → {c['score'][1]} ({c['delta_score']:+d}). Better: {c['better']}"]
    for k, (x, y) in c["metrics"].items():
        L.append(f"  {k:<14}{x:>6} → {y:<6}")
    L += [f"Only in {a}: " + (", ".join(c["only_a"]) or "—"), f"Only in {b}: " + (", ".join(c["only_b"]) or "—"),
          "Roles " + a + ": " + (", ".join(f"{r} {p}%" for r, p in c["roles_a"]) or "—"),
          "Roles " + b + ": " + (", ".join(f"{r} {p}%" for r, p in c["roles_b"]) or "—")]
    return "\n".join(L)


def audit_text(rows: list[dict]) -> str:
    if not rows:
        return "No recorded changes yet."
    return "\n".join(f"{r['ts'][:19].replace('T', ' ')}  {r['action']:<16}{r['field']:<9}{str(r['old'])[:18]!r} → {str(r['new'])[:18]!r}"
                     f"{'  (undone)' if r['undone'] else ''}  {r['ref'][-38:]}" for r in rows)


# =========================================================================== #
# Window
# =========================================================================== #
def tag_map(db: ExtrasDB) -> dict[str, list[str]]:
    out: dict[str, list[str]] = defaultdict(list)
    with db.lock:
        for url, tag in db.conn.execute("SELECT job_url,tag FROM x_tags ORDER BY tag"):
            out[url].append(tag)
    return out


def run_gui() -> int:
    import tkinter as tk
    import webbrowser
    from tkinter import filedialog, messagebox, simpledialog, ttk

    THEMES = core.THEMES

    def guarded(fn):
        def wrapper(self, *a, **k):
            try:
                return fn(self, *a, **k)
            except (ValueError, core.ResumeError, VaultUnavailable, OSError, smtplib.SMTPException) as exc:
                messagebox.showerror("Career Toolkit", str(exc))
            except Exception as exc:
                core.LOG.error("toolkit error: %s\n%s", exc, traceback.format_exc())
                messagebox.showerror("Unexpected error", f"{type(exc).__name__}: {exc}\n\nDetails are in {core.LOG_FILE}")
            return None
        wrapper.__name__ = fn.__name__
        return wrapper

    def show_text(parent, title, text, w=860, h=560):
        win = tk.Toplevel(parent)
        win.title(title)
        win.geometry(f"{w}x{h}")
        frame = ttk.Frame(win)
        frame.pack(fill="both", expand=True)
        box = tk.Text(frame, wrap="word", font=("Consolas", 10), padx=10, pady=8)
        sb = ttk.Scrollbar(frame, command=box.yview)
        box.configure(yscrollcommand=sb.set)
        sb.pack(side="right", fill="y")
        box.pack(fill="both", expand=True)
        box.insert("1.0", text)
        box.configure(state="disabled")
        bar = ttk.Frame(win)
        bar.pack(fill="x")

        def copy():
            parent.clipboard_clear()
            parent.clipboard_append(text)
        ttk.Button(bar, text="Copy all", command=copy).pack(side="left", padx=6, pady=6)
        ttk.Button(bar, text="Close", command=win.destroy).pack(side="right", padx=6, pady=6)
        return win

    def ask_form(parent, title, fields, ok_text="Save"):
        """fields: [(key, label, default, kind)], kind = 'text' | 'multi' | 'combo:a|b|c'. Returns dict, or None if cancelled."""
        win = tk.Toplevel(parent)
        win.title(title)
        win.transient(parent)
        win.grab_set()
        vars_: dict = {}
        texts: dict = {}
        for r, (key, label, default, kind) in enumerate(fields):
            ttk.Label(win, text=label).grid(row=r, column=0, sticky="nw", padx=10, pady=5)
            if kind == "multi":
                w = tk.Text(win, width=56, height=7, wrap="word")
                w.insert("1.0", default or "")
                w.grid(row=r, column=1, padx=10, pady=5, sticky="ew")
                texts[key] = w
            elif kind.startswith("combo:"):
                v = tk.StringVar(value=default or "")
                ttk.Combobox(win, textvariable=v, values=kind[6:].split("|"), state="readonly", width=44).grid(row=r, column=1, padx=10, pady=5, sticky="w")
                vars_[key] = v
            else:
                v = tk.StringVar(value=str(default or ""))
                ttk.Entry(win, textvariable=v, width=58).grid(row=r, column=1, padx=10, pady=5, sticky="ew")
                vars_[key] = v
        win.columnconfigure(1, weight=1)
        result: dict = {}

        def ok():
            for k, v in vars_.items():
                result[k] = v.get().strip()
            for k, w in texts.items():
                result[k] = w.get("1.0", "end-1c").strip()
            win.destroy()
        bar = ttk.Frame(win)
        bar.grid(row=len(fields), column=0, columnspan=2, pady=10)
        ttk.Button(bar, text=ok_text, command=ok).pack(side="left", padx=6)
        ttk.Button(bar, text="Cancel", command=win.destroy).pack(side="left", padx=6)
        parent.wait_window(win)
        return dict(result) if result else None

    def draw_bars(cv, labels, values, title):
        cv.delete("all")
        W, H = int(cv["width"]), int(cv["height"])
        cv.create_text(W // 2, 14, text=title, font=("Segoe UI", 10, "bold"))
        if not labels or not any(values):
            cv.create_text(W // 2, H // 2, text="No data yet")
            return
        left, top, bottom = 30, 30, 34
        vmax = max(values) or 1
        step = (W - left - 10) / len(values)
        bw = max(6, min(46, step * 0.6))
        cv.create_line(left, H - bottom, W - 8, H - bottom, fill="#9ca3af")
        for i, (lab, v) in enumerate(zip(labels, values)):
            x = left + i * step + (step - bw) / 2
            h = (H - top - bottom) * v / vmax
            cv.create_rectangle(x, H - bottom - h, x + bw, H - bottom, fill="#2563eb", outline="")
            cv.create_text(x + bw / 2, H - bottom - h - 8, text=f"{v:g}", font=("Segoe UI", 8))
            cv.create_text(x + bw / 2, H - bottom + 12, text=str(lab)[:8], font=("Segoe UI", 8))

    def draw_hbars(cv, items, title, suffix=""):
        cv.delete("all")
        W, H = int(cv["width"]), int(cv["height"])
        cv.create_text(W // 2, 14, text=title, font=("Segoe UI", 10, "bold"))
        items = [(k, v) for k, v in items if v is not None]
        if not items or not any(v for _, v in items):
            cv.create_text(W // 2, H // 2, text="No data yet")
            return
        vmax = max(v for _, v in items) or 1
        row = min(26, (H - 36) / len(items))
        for i, (k, v) in enumerate(items):
            y = 30 + i * row
            w = (W - 220) * v / vmax
            cv.create_text(130, y + row / 2, text=str(k)[:22], anchor="e", font=("Segoe UI", 9))
            cv.create_rectangle(140, y + 3, 140 + max(w, 1), y + row - 3, fill="#0f766e", outline="")
            cv.create_text(146 + w, y + row / 2, text=f"{v:g}{suffix}", anchor="w", font=("Segoe UI", 9))

    def draw_lines(cv, labels, series, title):
        cv.delete("all")
        W, H = int(cv["width"]), int(cv["height"])
        cv.create_text(W // 2, 14, text=title, font=("Segoe UI", 10, "bold"))
        if not labels or not series:
            cv.create_text(W // 2, H // 2, text="No data yet")
            return
        colors = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c", "#0891b2"]
        left, top, bottom = 36, 30, 40
        vmax = max(max(v) for v in series.values()) or 1
        n = len(labels)
        xs = [left + ((W - left - 14) * i / (n - 1) if n > 1 else (W - left - 14) / 2) for i in range(n)]
        cv.create_line(left, H - bottom, W - 8, H - bottom, fill="#9ca3af")
        for si, (name, vals) in enumerate(series.items()):
            col = colors[si % len(colors)]
            pts = []
            for x, v in zip(xs, vals):
                pts += [x, H - bottom - (H - top - bottom) * v / vmax]
            if len(pts) >= 4:
                cv.create_line(*pts, fill=col, width=2)
            cv.create_text(left + 4 + (si % 4) * 135, H - 12 - (si // 4) * 12, text="● " + name[:14], anchor="w", fill=col, font=("Segoe UI", 8))
        cv.create_text(left - 4, top, text=f"{vmax:g}", anchor="e", font=("Segoe UI", 8))
        step = max(1, n // 6)
        for i in range(0, n, step):
            cv.create_text(xs[i], H - bottom + 12, text=str(labels[i])[-5:], font=("Segoe UI", 8))

    class ToolkitApp(tk.Tk):
        def __init__(self):
            super().__init__()
            core.setup_logging()
            self.title(f"Career Toolkit v{TOOLKIT_VERSION} (with Job Auto Apply PRO {core.VERSION})")
            self.geometry("1380x860")
            self.minsize(1080, 680)
            self.settings = core.load_settings()
            self.candidate = core.load_candidate()
            self.cfg = load_config()
            self.store = core.History()
            self.db = ExtrasDB(self.store)
            self.commands: queue.Queue = queue.Queue()
            self.events: queue.Queue = queue.Queue()
            self.worker = ToolkitWorker(self.commands, self.events, self.store, self.settings)
            self.worker.candidate_for_rules = self.candidate
            self.worker.start()
            self.busy = False
            self.jobs: list = []
            self.by_url: dict = {}
            self.analysis = None
            self._drag = None
            self._flag_cache: dict = {}
            self._last_search: dict = {}
            self._sched_queue: list = []
            self._scheduled_scan = False
            self.last_alerts: list = []
            self.manual_dialog = None
            self.scheduler = Scheduler(self.run_scheduled, self.cfg.schedule_interval_min, self.cfg.quiet_start, self.cfg.quiet_end)
            self.scheduler.enabled = self.cfg.schedule_enabled
            self.style = ttk.Style(self)
            if "clam" in self.style.theme_names():
                self.style.theme_use("clam")
            self.option_add("*Font", "{Segoe UI} 10")
            self._build()
            self.apply_theme()
            self.refresh_analysis(silent=True)
            self.reload_jobs()
            self.refresh_all()
            self.after(200, self.poll)
            self.after(30000, self.tick)
            self.protocol("WM_DELETE_WINDOW", self.on_close)

        # ----- infrastructure ------------------------------------------------ #
        def say(self, text):
            self.logbox.insert("end", "[" + datetime.now().strftime("%H:%M:%S") + "] " + str(text) + "\n")
            self.logbox.see("end")

        def apply_theme(self):
            t = THEMES[self.settings.theme]
            self.configure(bg=t["bg"])
            s = self.style
            s.configure(".", background=t["bg"], foreground=t["fg"])
            for w in ("TFrame", "TLabel", "TLabelframe", "TCheckbutton", "TNotebook"):
                s.configure(w, background=t["bg"], foreground=t["fg"])
            s.configure("TLabelframe.Label", background=t["bg"], foreground=t["accent"], font=("Segoe UI", 10, "bold"))
            s.configure("Treeview", rowheight=26, background=t["panel"], fieldbackground=t["panel"], foreground=t["fg"])
            s.map("Treeview", background=[("selected", t["sel"])], foreground=[("selected", t["fg"])])
            s.configure("Treeview.Heading", font=("Segoe UI", 10, "bold"))
            s.configure("TNotebook.Tab", padding=(10, 5))
            s.configure("Accent.TButton", font=("Segoe UI", 10, "bold"))
            self.header.configure(bg=t["header"])
            for w in self.header.winfo_children():
                if isinstance(w, tk.Label):
                    w.configure(bg=t["header"])
            for box in (self.logbox, self.out_text, self.out_text2, self.health_text, self.tpl_body, self.detail_box):
                box.configure(bg=t["panel"], fg=t["fg"], insertbackground=t["fg"])
            self.logbox.configure(bg=t["log_bg"], fg=t["log_fg"])
            for stage, (lb, _u) in self.kb.items():
                lb.configure(bg=t["panel"], fg=t["fg"], selectbackground=t["sel"], selectforeground=t["fg"])
            self.chart.configure(bg=t["panel"])

        def toggle_theme(self):
            self.settings.theme = "dark" if self.settings.theme == "light" else "light"
            core.save_settings(self.settings)
            self.apply_theme()

        def _years(self):
            try:
                return float(self.candidate.years_experience) if self.candidate.years_experience else None
            except ValueError:
                return None

        def refresh_analysis(self, silent=False):
            self.analysis = None
            if self.candidate.resume:
                try:
                    self.analysis = core.analyze_resume_file(self.candidate.resume)
                except core.ResumeError as exc:
                    self.say("Resume: " + str(exc))
                    if not silent:
                        messagebox.showwarning("Resume", str(exc))
                except Exception as exc:
                    core.LOG.error("resume analysis: %s", exc)

        def reload_jobs(self, new_urls: set | None = None):
            self.jobs = self.store.load_jobs()
            for j in self.jobs:
                j.score, m = core.score_job(j, self.candidate)
                j.matched = ", ".join(m)
                j.is_new = bool(new_urls and j.key in new_urls)
            if self.analysis:
                core.apply_fit(self.jobs, self.analysis, self._years())
            self.by_url = {j.key: j for j in self.jobs}

        def refresh_all(self):
            for fn in (self.refresh_jobs, self.refresh_kanban, self.refresh_versions, self.refresh_templates, self.refresh_discover,
                       self.refresh_interviews, self.refresh_contacts, self.refresh_offers, self.refresh_rejections, self.refresh_safety):
                try:
                    fn()
                except Exception as exc:
                    core.LOG.error("refresh %s failed: %s\n%s", fn.__name__, exc, traceback.format_exc())

        def enqueue(self, kind, **kwargs) -> bool:
            if self.busy:
                self.say("Busy — wait for the current browser task or press Stop.")
                return False
            self.busy = True
            self.status.config(text="Running: " + kind)
            self.commands.put((kind, kwargs))
            return True

        def stop(self):
            self._sched_queue.clear()
            self.worker.stop_event.set()
            self.worker.manual_action = "skip"
            self.worker.manual_event.set()
            self.say("Stop requested.")

        # ----- layout ------------------------------------------------------- #
        def _build(self):
            self.header = tk.Frame(self, padx=16, pady=8)
            self.header.pack(fill="x")
            tk.Label(self.header, text="CAREER TOOLKIT", fg="white", font=("Segoe UI", 17, "bold")).pack(side="left")
            tk.Label(self.header, text="pipeline · interviews · analytics · safety", fg="#c7d4e8").pack(side="left", padx=16)
            for text, cmd in (("Stop", self.stop), ("Theme", self.toggle_theme), ("Open Naukri / Sign in", lambda: self.enqueue("login"))):
                ttk.Button(self.header, text=text, command=cmd).pack(side="right", padx=3)
            self.nb = ttk.Notebook(self)
            self.nb.pack(fill="both", expand=True, padx=8, pady=6)
            self.kb: dict = {}
            tabs = (("Pipeline", self._tab_pipeline), ("Jobs", self._tab_jobs), ("Resume lab", self._tab_resume), ("Templates", self._tab_templates),
                    ("Discover", self._tab_discover), ("Interviews & contacts", self._tab_people), ("Offers & rejections", self._tab_offers),
                    ("Analytics", self._tab_analytics), ("Safety & data", self._tab_safety))
            self.logbox = tk.Text(self, height=5, wrap="word")
            self._kb_titles: dict = {}
            for title, builder in tabs:
                frame = ttk.Frame(self.nb, padding=6)
                self.nb.add(frame, text=title)
                builder(frame)
            self.logbox.pack(fill="x", padx=8)
            self.status = ttk.Label(self, text="Ready. Jobs come from the same database as Job Auto Apply PRO.", padding=(12, 3))
            self.status.pack(fill="x")

        def _tree(self, parent, cols, height=10, select="extended"):
            frame = ttk.Frame(parent)
            tree = ttk.Treeview(frame, columns=[c[0] for c in cols], show="headings", height=height, selectmode=select)
            for key, label, width in cols:
                tree.heading(key, text=label)
                tree.column(key, width=width, stretch=True, minwidth=40)
            sb = ttk.Scrollbar(frame, command=tree.yview)
            tree.configure(yscrollcommand=sb.set)
            sb.pack(side="right", fill="y")
            tree.pack(fill="both", expand=True)
            return frame, tree

        def _btns(self, parent, items, side="left"):
            bar = ttk.Frame(parent)
            for text, cmd in items:
                ttk.Button(bar, text=text, command=cmd).pack(side=side, padx=3, pady=2)
            return bar

        def _text_box(self, parent, height=8):
            frame = ttk.Frame(parent)
            box = tk.Text(frame, height=height, wrap="word", font=("Consolas", 10), padx=8, pady=6)
            sb = ttk.Scrollbar(frame, command=box.yview)
            box.configure(yscrollcommand=sb.set)
            sb.pack(side="right", fill="y")
            box.pack(fill="both", expand=True)
            return frame, box

        @staticmethod
        def _set_text(box, text):
            box.configure(state="normal")
            box.delete("1.0", "end")
            box.insert("1.0", text)
            box.configure(state="disabled")

        # ===== 15 Pipeline (kanban) ============================================ #
        def _tab_pipeline(self, p):
            bar = ttk.Frame(p)
            bar.pack(fill="x")
            ttk.Button(bar, text="Refresh", command=self.refresh_kanban).pack(side="left", padx=3)
            self.v_kb_hidden = tk.BooleanVar(value=False)
            ttk.Checkbutton(bar, text="Show hidden", variable=self.v_kb_hidden, command=self.refresh_kanban).pack(side="left", padx=6)
            ttk.Label(bar, text="Drag a card to another column to change its stage. Changes are recorded and can be undone (Safety & data).").pack(side="left", padx=10)
            board = ttk.Frame(p)
            board.pack(fill="both", expand=True, pady=4)
            board.rowconfigure(0, weight=1)
            for i, stage in enumerate(core.PIPELINE_STAGES):
                board.columnconfigure(i, weight=1, uniform="kb")
                col = ttk.Frame(board)
                col.grid(row=0, column=i, sticky="nsew", padx=3)
                title = ttk.Label(col, text=stage, font=("Segoe UI", 10, "bold"))
                title.pack(anchor="w")
                lb = tk.Listbox(col, activestyle="none", exportselection=False, font=("Segoe UI", 9), width=18)
                lb.pack(fill="both", expand=True)
                lb.bind("<ButtonPress-1>", lambda e, s=stage: self._kb_press(e, s))
                lb.bind("<ButtonRelease-1>", self._kb_release)
                lb.bind("<Double-1>", lambda e, s=stage: self._kb_open(s))
                self.kb[stage] = (lb, [])
                self._kb_titles[stage] = title

        def refresh_kanban(self):
            board = kanban(self.jobs, self.v_kb_hidden.get())
            for stage, (lb, urls) in self.kb.items():
                lb.delete(0, "end")
                urls.clear()
                for j in board.get(stage, []):
                    lead = j.fit if self.analysis else j.score
                    lb.insert("end", f"{'★' if j.favorite else ' '}{lead:>3} {j.title[:26]} — {j.company[:14]}")
                    urls.append(j.key)
                self._kb_titles[stage].configure(text=f"{stage} ({len(urls)})")

        def _kb_press(self, e, stage):
            lb, urls = self.kb[stage]
            i = lb.nearest(e.y)
            self._drag = (stage, urls[i]) if 0 <= i < len(urls) else None

        @guarded
        def _kb_release(self, e):
            drag, self._drag = self._drag, None
            if not drag:
                return
            target = self.winfo_containing(e.x_root, e.y_root)
            for stage, (lb, _u) in self.kb.items():
                if target is lb and stage != drag[0]:
                    move_job(self.db, drag[1], stage)
                    self.reload_jobs()
                    self.refresh_all()
                    self.say(f"Moved to {stage}.")
                    return

        def _kb_open(self, stage):
            lb, urls = self.kb[stage]
            sel = lb.curselection()
            if sel and urls[sel[0]].startswith("http"):
                webbrowser.open(urls[sel[0]])

        # ===== Jobs ============================================================ #
        def _tab_jobs(self, p):
            top = ttk.Frame(p)
            top.pack(fill="x")
            self.v_jobq, self.v_tag = tk.StringVar(), tk.StringVar(value="(all)")
            ttk.Label(top, text="Search").pack(side="left")
            e = ttk.Entry(top, textvariable=self.v_jobq, width=24)
            e.pack(side="left", padx=4)
            e.bind("<Return>", lambda _e: self.refresh_jobs())
            ttk.Label(top, text="Tag").pack(side="left", padx=(8, 0))
            self.tag_combo = ttk.Combobox(top, textvariable=self.v_tag, values=["(all)"], state="readonly", width=16)
            self.tag_combo.pack(side="left", padx=4)
            self.tag_combo.bind("<<ComboboxSelected>>", lambda _e: self.refresh_jobs())
            ttk.Button(top, text="Apply", command=self.refresh_jobs).pack(side="left", padx=3)
            self._btns(p, [("Add tag", self.add_tag), ("Remove tag", self.remove_tag), ("★ Favourite", self.toggle_fav), ("Hide", self.hide_job),
                           ("Red flags", self.show_flags), ("Duplicates", self.show_dupes), ("Cover letter", self.make_cover), ("Email template", self.make_email),
                           ("Tailor resume", self.tailor_for_job), ("Best resume version", self.pick_resume), ("Watch company", self.watch_company)]).pack(fill="x")
            self._btns(p, [("Import jobs file…", self.import_file), ("Add to apply queue", self.queue_selected), ("Open in browser", self.open_job)]).pack(fill="x")
            cols = (("fit", "Fit", 48), ("score", "Match", 52), ("title", "Title", 280), ("company", "Company", 150), ("location", "Location", 130),
                    ("loc", "Location fit", 90), ("risk", "Risk", 50), ("tags", "Tags", 120), ("source", "Source", 70), ("stage", "Stage", 80))
            fr, self.jtree = self._tree(p, cols, 12)
            fr.pack(fill="both", expand=True)
            self.jtree.bind("<<TreeviewSelect>>", lambda _e: self.show_job_detail())
            self.jtree.bind("<Double-1>", lambda _e: self.open_job())
            fr2, self.detail_box = self._text_box(p, 8)
            fr2.pack(fill="x")

        def _flags(self, j):
            key = (j.key, len(j.description), len(j.snippet))
            if key not in self._flag_cache:
                if len(self._flag_cache) > 6000:
                    self._flag_cache.clear()
                self._flag_cache[key] = detect_red_flags(j)
            return self._flag_cache[key]

        def _home(self):
            return self.cfg.home_city or self.candidate.city_pref

        def refresh_jobs(self):
            tags = tag_map(self.db)
            all_tags = ["(all)"] + [t for t, _n in self.db.all_tags()]
            self.tag_combo.configure(values=all_tags)
            tag = self.v_tag.get()
            urls = set(self.db.jobs_with_tag(tag)) if tag and tag != "(all)" else None
            q = self.v_jobq.get().strip().lower()
            meta = self.db.meta_map()
            keep = set(self.jtree.selection())            # keep the user's selection across refreshes
            self.jtree.delete(*self.jtree.get_children())
            shown = 0
            for j in sorted(self.jobs, key=lambda j: (-(j.fit if self.analysis else 0), -j.score)):
                if j.hidden or (urls is not None and j.key not in urls):
                    continue
                if q and q not in f"{j.title} {j.company} {j.location}".lower():
                    continue
                if shown >= 1500:
                    break
                shown += 1
                loc = location_score(j, self._home(), self.cfg.want_remote, self.cfg.accept_relocation)
                risk = flag_score(self._flags(j))
                self.jtree.insert("", "end", iid=j.key, values=(j.fit if self.analysis else "", j.score, j.title, j.company, j.location, loc["label"],
                                                              risk or "", ", ".join(tags.get(j.key, [])), meta.get(j.key, ("naukri", ""))[0], j.stage))
            for u in keep:
                if self.jtree.exists(u):
                    self.jtree.selection_add(u)
            self.status.config(text=f"{shown} jobs shown ({len(self.jobs)} stored).")

        def _sel_jobs(self):
            return [self.by_url[u] for u in self.jtree.selection() if u in self.by_url]

        def _one_job(self):
            sel = self._sel_jobs()
            if len(sel) != 1:
                raise ValueError("Select exactly one job first.")
            return sel[0]

        def show_job_detail(self):
            sel = self._sel_jobs()
            if len(sel) != 1:
                self._set_text(self.detail_box, f"{len(sel)} jobs selected." if sel else "")
                return
            j = sel[0]
            loc = location_score(j, self._home(), self.cfg.want_remote, self.cfg.accept_relocation)
            flags = self._flags(j)
            ppl = contacts_for_job(self.db, j.key, j.company)
            lines = [f"{j.title} — {j.company}", f"Location fit: {loc['label']} ({loc['score']}) — {'; '.join(loc['reasons'])}",
                     f"Fit {j.fit if self.analysis else '—'} | You have: {', '.join(j.fit_matched) or '—'} | Missing: {', '.join(j.fit_missing) or '—'}",
                     "Red flags: " + ("; ".join(f['label'] for f in flags) or "none found"),
                     "Contacts: " + (", ".join(c["name"] for c in ppl) or "none"),
                     "Tags: " + (", ".join(self.db.tags_for(j.key)) or "none")]
            self._set_text(self.detail_box, "\n".join(lines))

        @guarded
        def add_tag(self):
            sel = self._sel_jobs()
            if not sel:
                raise ValueError("Select one or more jobs first.")
            tag = simpledialog.askstring("Add tag", "Tag (e.g. dream job, apply later):", parent=self)
            if tag:
                for j in sel:
                    self.db.add_tag(j.key, tag)
                self.refresh_jobs()

        @guarded
        def remove_tag(self):
            sel = self._sel_jobs()
            if not sel:
                raise ValueError("Select one or more jobs first.")
            tag = simpledialog.askstring("Remove tag", "Tag to remove:", parent=self)
            if tag:
                for j in sel:
                    self.db.remove_tag(j.key, tag)
                self.refresh_jobs()

        @guarded
        def toggle_fav(self):
            for j in self._sel_jobs():
                self.db.set_job_field(j.key, "favorite", not j.favorite)
            self.reload_jobs()
            self.refresh_all()

        @guarded
        def hide_job(self):
            for j in self._sel_jobs():
                self.db.set_job_field(j.key, "hidden", True)
            self.reload_jobs()
            self.refresh_all()

        @guarded
        def show_flags(self):
            j = self._one_job()
            show_text(self, "Red flags", red_flags_text(j, self._flags(j)), 640, 320)

        @guarded
        def show_dupes(self):
            show_text(self, "Duplicate postings", dupes_text(find_duplicates([j for j in self.jobs if not j.hidden])), 760, 420)

        def _render(self, kind_label, kind):
            j = self._one_job()
            names = [t["name"] for t in self.db.templates(kind)]
            f = ask_form(self, kind_label, [("t", "Template", names[0] if names else "", "combo:" + "|".join(names)),
                                            ("recipient", "Recipient name", "", "text")], "Create")
            if not f:
                return
            r = render_template(self.db, f["t"], self.candidate, j, self.analysis, {"recipient": f["recipient"]} if f["recipient"] else None)
            todo = ("\n\n⚠ Still to write yourself:\n" + "\n".join(" • " + t for t in r["todo"])) if r["todo"] else ""
            show_text(self, f["t"], f"Subject: {r['subject']}\n\n{r['body']}{todo}", 760, 520)

        @guarded
        def make_cover(self):
            self._render("Cover letter", "cover_letter")

        @guarded
        def make_email(self):
            self._render("Email template", "email")

        def _resume_text(self):
            try:
                return core.extract_resume_text(self.candidate.resume) if self.candidate.resume else ""
            except core.ResumeError:
                return ""

        @guarded
        def tailor_for_job(self):
            if not self.analysis:
                raise ValueError("Set a resume in the main app's Profile / Resume (or Resume lab) first.")
            sel = self._sel_jobs()
            default = ""
            if len(sel) == 1:
                default = f"{sel[0].title}\n{sel[0].tags}\n{sel[0].description or sel[0].snippet}"
            f = ask_form(self, "Tailor resume to a job description", [("jd", "Paste the job description", default, "multi")], "Analyse")
            if f and f["jd"]:
                show_text(self, "Resume tailoring", tailor_text(tailor_resume(f["jd"], self.analysis, self._resume_text())), 760, 460)

        @guarded
        def pick_resume(self):
            j = self._one_job()
            versions = self.db.resume_versions()
            if not versions:
                raise ValueError("Add resume versions in the Resume lab tab first.")
            pick = best_resume_for_job(j, versions)
            if not pick:
                raise ValueError("None of the stored resume files could be read.")
            self.db.set_meta(j.key, resume_version=pick[0])
            show_text(self, "Best resume version", f"Best version for '{j.title}': {pick[0]} (fit {pick[1]})\nMatched skills: {', '.join(pick[2]) or '—'}\n\nRecorded so the funnel can compare versions.", 640, 220)

        @guarded
        def watch_company(self):
            j = self._one_job()
            if not j.company:
                raise ValueError("That job has no company name.")
            self.db.watch_add(j.company)
            self.refresh_discover()
            self.say(f"Watching {j.company}.")

        @guarded
        def import_file(self):
            path = filedialog.askopenfilename(parent=self, filetypes=[("Job lists", "*.csv *.json *.xml *.rss *.atom"), ("All", "*.*")])
            if not path:
                return
            f = ask_form(self, "Import jobs", [("source", "Source name (e.g. linkedin, indeed)", Path(path).stem, "text")], "Import")
            if not f:
                return
            res = import_jobs(self.db, path, f["source"], self.candidate, self.analysis)
            self.reload_jobs()
            self.refresh_all()
            show_text(self, "Import finished", f"Read {res['read']} rows ({res['format']}), imported {res['imported']}, {res['new']} new.\nSource: {res['source']}\n\nImported jobs are tracked, scored and tagged here. They are not auto-applied — apply on that site yourself.", 640, 240)

        @guarded
        def queue_selected(self):
            sel = self._sel_jobs()
            ok = [j for j in sel if core.naukri_url(j.key)]
            if not ok:
                raise ValueError("Select Naukri jobs (imported jobs from other sites can't be auto-applied).")
            n = self.db.queue_add(ok)
            self.refresh_safety()
            self.say(f"{n} job(s) added to the apply queue ({len(sel) - len(ok)} non-Naukri skipped). Start it from Safety & data.")

        def open_job(self):
            sel = self._sel_jobs()
            if sel and sel[0].key.startswith("http"):
                webbrowser.open(sel[0].key)

        # ===== Resume lab ====================================================== #
        def _tab_resume(self, p):
            left = ttk.LabelFrame(p, text="Resume versions", padding=6)
            left.pack(side="left", fill="both", expand=True, padx=(0, 4))
            fr, self.vtree = self._tree(left, (("name", "Name", 120), ("score", "Score", 50), ("roles", "Top role", 140), ("path", "File", 240)), 8)
            fr.pack(fill="both", expand=True)
            self._btns(left, [("Add version…", self.add_version), ("Remove", self.remove_version), ("Compare two selected", self.compare_versions)]).pack(fill="x")
            right = ttk.LabelFrame(p, text="Role check · search expansion", padding=6)
            right.pack(side="left", fill="both", expand=True, padx=(4, 0))
            self.v_role, self.v_expand = tk.StringVar(value="Python Developer"), tk.StringVar()
            r1 = ttk.Frame(right)
            r1.pack(fill="x")
            ttk.Combobox(r1, textvariable=self.v_role, values=sorted(core.ROLE_PROFILES), state="readonly", width=30).pack(side="left", padx=3)
            ttk.Button(r1, text="Check resume against role", command=self.role_check).pack(side="left", padx=3)
            r2 = ttk.Frame(right)
            r2.pack(fill="x", pady=6)
            ttk.Entry(r2, textvariable=self.v_expand, width=30).pack(side="left", padx=3)
            ttk.Button(r2, text="Expand this search", command=self.expand).pack(side="left", padx=3)
            ttk.Button(right, text="Tailor to a pasted job description…", command=self.tailor_for_job).pack(anchor="w", padx=3, pady=4)
            fr2, self.out_text = self._text_box(right, 14)
            fr2.pack(fill="both", expand=True)

        def refresh_versions(self):
            self.vtree.delete(*self.vtree.get_children())
            for v in self.db.resume_versions():
                try:
                    a = core.analyze_resume_file(v["path"])
                    score, role = a.score, (a.roles[0][0] if a.roles else "—")
                except core.ResumeError:
                    score, role = "unreadable", "—"
                self.vtree.insert("", "end", iid=v["name"], values=(v["name"], score, role, v["path"]))

        @guarded
        def add_version(self):
            path = filedialog.askopenfilename(parent=self, filetypes=[("Resumes", "*.pdf *.docx *.txt"), ("All", "*.*")])
            if not path:
                return
            core.analyze_resume_file(path)   # fails early if unreadable
            f = ask_form(self, "Name this version", [("name", "Name (e.g. Backend, Data)", Path(path).stem, "text"), ("note", "Note", "", "text")], "Add")
            if f:
                self.db.add_resume_version(f["name"], path, f["note"])
                self.refresh_versions()

        @guarded
        def remove_version(self):
            for n in self.vtree.selection():
                self.db.remove_resume_version(n)
            self.refresh_versions()

        @guarded
        def compare_versions(self):
            sel = list(self.vtree.selection())
            if len(sel) != 2:
                raise ValueError("Select exactly two resume versions.")
            paths = {v["name"]: v["path"] for v in self.db.resume_versions()}
            a, b = (core.analyze_resume_file(paths[n]) for n in sel)
            body = diff_text(compare_resumes(a, b, sel[0], sel[1]))
            try:
                ta, tb = core.extract_resume_text(paths[sel[0]]), core.extract_resume_text(paths[sel[1]])
                body += "\n\nTEXT DIFF (- only in A, + only in B)\n" + "\n".join(text_diff(ta, tb))
            except core.ResumeError:
                pass
            show_text(self, "Resume comparison", body, 900, 620)

        @guarded
        def role_check(self):
            if not self.analysis:
                raise ValueError("Set a resume first.")
            self._set_text(self.out_text, role_check_text(role_keyword_check(self.v_role.get(), self.analysis)))

        @guarded
        def expand(self):
            if not self.analysis:
                raise ValueError("Set a resume first.")
            ideas = expand_search(self.analysis, self.v_expand.get())
            self._set_text(self.out_text, "Related searches to try:\n" + ("\n".join(" • " + i for i in ideas) or "(none — add more skills to your resume)"))

        # ===== Templates ======================================================= #
        def _tab_templates(self, p):
            left = ttk.Frame(p)
            left.pack(side="left", fill="y", padx=(0, 6))
            fr, self.ttree = self._tree(left, (("name", "Template", 220), ("kind", "Kind", 80)), 16, "browse")
            fr.pack(fill="y", expand=True)
            self.ttree.bind("<<TreeviewSelect>>", lambda _e: self.load_template())
            self._btns(left, [("New", self.new_template), ("Save", self.save_template), ("Delete", self.delete_template), ("Reset built-in", self.reset_template)]).pack(fill="x")
            right = ttk.Frame(p)
            right.pack(side="left", fill="both", expand=True)
            self.v_tsubj, self.v_tkind = tk.StringVar(), tk.StringVar(value="email")
            r = ttk.Frame(right)
            r.pack(fill="x")
            ttk.Label(r, text="Subject").pack(side="left")
            ttk.Entry(r, textvariable=self.v_tsubj, width=60).pack(side="left", padx=4)
            ttk.Combobox(r, textvariable=self.v_tkind, values=["email", "cover_letter"], state="readonly", width=12).pack(side="left")
            fr2 = ttk.Frame(right)
            fr2.pack(fill="both", expand=True, pady=4)
            self.tpl_body = tk.Text(fr2, wrap="word", font=("Consolas", 10), padx=8, pady=6)
            self.tpl_body.pack(fill="both", expand=True)
            ttk.Label(right, text="Placeholders: {name} {email} {mobile} {title} {company} {years_clause} {skills_clause} {skills_clause_short} {notice_days} {current_ctc} {expected_ctc} {recipient} {today}\n"
                                  "Text like <<ADD: …>> marks something only you can write — the generator never invents achievements.").pack(anchor="w")

        def refresh_templates(self):
            keep = self.ttree.selection()
            self.ttree.delete(*self.ttree.get_children())
            for tpl in self.db.templates():
                self.ttree.insert("", "end", iid=tpl["name"], values=(tpl["name"] + ("" if tpl["builtin"] else " ✎"), tpl["kind"]))
            for name in keep:
                if self.ttree.exists(name):
                    self.ttree.selection_set(name)

        def load_template(self):
            sel = self.ttree.selection()
            t = self.db.get_template(sel[0]) if sel else None
            if t:
                self.v_tsubj.set(t["subject"])
                self.v_tkind.set(t["kind"])
                self.tpl_body.delete("1.0", "end")
                self.tpl_body.insert("1.0", t["body"])

        @guarded
        def new_template(self):
            name = simpledialog.askstring("New template", "Template name:", parent=self)
            if name:
                self.db.save_template(name, self.v_tkind.get(), self.v_tsubj.get(), self.tpl_body.get("1.0", "end-1c") or "Hello {recipient},\n\n")
                self.refresh_templates()

        @guarded
        def save_template(self):
            sel = self.ttree.selection()
            if not sel:
                raise ValueError("Select a template (or use New).")
            self.db.save_template(sel[0], self.v_tkind.get(), self.v_tsubj.get(), self.tpl_body.get("1.0", "end-1c"))
            self.refresh_templates()
            self.say("Template saved (built-ins become your own edited copy).")

        @guarded
        def delete_template(self):
            for n in self.ttree.selection():
                t = self.db.get_template(n)
                if t and t["builtin"]:
                    raise ValueError("Built-in templates can't be deleted; reset them instead.")
                self.db.delete_template(n)
            self.refresh_templates()

        @guarded
        def reset_template(self):
            sel = self.ttree.selection()
            if sel and self.db.reset_template(sel[0]):
                self.load_template()

        # ===== Discover ======================================================== #
        def _tab_discover(self, p):
            left = ttk.LabelFrame(p, text="Alerts & scheduled scans", padding=8)
            left.pack(side="left", fill="y", padx=(0, 6))
            c = self.cfg
            self.cv = {"alert_min_fit": tk.StringVar(value=str(c.alert_min_fit)), "alert_min_score": tk.StringVar(value=str(c.alert_min_score)),
                       "schedule_interval_min": tk.StringVar(value=str(c.schedule_interval_min)), "quiet_start": tk.StringVar(value=str(c.quiet_start)),
                       "quiet_end": tk.StringVar(value=str(c.quiet_end)), "home_city": tk.StringVar(value=c.home_city)}
            self.cb = {"notify_enabled": tk.BooleanVar(value=c.notify_enabled), "schedule_enabled": tk.BooleanVar(value=c.schedule_enabled),
                       "want_remote": tk.BooleanVar(value=c.want_remote), "accept_relocation": tk.BooleanVar(value=c.accept_relocation)}
            for r, (k, label) in enumerate((("alert_min_fit", "Alert when resume fit ≥"), ("alert_min_score", "…or match score ≥ (0 = off)"),
                                            ("schedule_interval_min", "Scan every (minutes, ≥15)"), ("quiet_start", "Quiet hours start (0–23)"),
                                            ("quiet_end", "Quiet hours end (0–23)"), ("home_city", "Home city (location fit)"))):
                ttk.Label(left, text=label).grid(row=r, column=0, sticky="w", pady=3)
                ttk.Entry(left, textvariable=self.cv[k], width=14).grid(row=r, column=1, padx=6)
            for r, (k, label) in enumerate((("notify_enabled", "Desktop notifications"), ("schedule_enabled", "Run saved searches on a schedule while this window is open"),
                                            ("want_remote", "Count remote jobs as a good location fit"), ("accept_relocation", "Open to relocating")), 6):
                ttk.Checkbutton(left, text=label, variable=self.cb[k]).grid(row=r, column=0, columnspan=2, sticky="w")
            ttk.Button(left, text="Save", style="Accent.TButton", command=self.save_cfg).grid(row=10, column=0, pady=8, sticky="w")
            ttk.Button(left, text="Scan saved searches now", command=self.run_scheduled).grid(row=10, column=1, pady=8)
            ttk.Label(left, text="Scheduled scans use your visible, signed-in browser,\nlimited to 3 pages per search, with pauses between searches.\nNothing runs when this window is closed.", foreground="#6b7280").grid(row=11, column=0, columnspan=2, sticky="w")
            ttk.Label(left, text="Watchlist companies").grid(row=12, column=0, sticky="w", pady=(10, 0))
            self.wlist = tk.Listbox(left, height=6, exportselection=False)
            self.wlist.grid(row=13, column=0, columnspan=2, sticky="ew")
            self._btns(left, [("Add", self.watch_add), ("Remove", self.watch_remove)]).grid(row=14, column=0, columnspan=2, sticky="w")
            right = ttk.Frame(p)
            right.pack(side="left", fill="both", expand=True)
            ttk.Label(right, text="Latest alerts").pack(anchor="w")
            fr, self.atree = self._tree(right, (("job", "Job", 300), ("company", "Company", 160), ("why", "Why", 160)), 5)
            fr.pack(fill="x")
            ttk.Label(right, text="Scan log").pack(anchor="w", pady=(6, 0))
            fr, self.stree = self._tree(right, (("ts", "When (UTC)", 150), ("query", "Search", 180), ("found", "Found", 60), ("new", "New", 50), ("alerts", "Alerts", 55)), 5)
            fr.pack(fill="x")
            r = ttk.Frame(right)
            r.pack(fill="x", pady=6)
            ttk.Button(r, text="Run selector health check", command=self.health_check).pack(side="left", padx=3)
            ttk.Label(r, text="(opens one search and one job page, read-only)").pack(side="left")
            fr3, self.health_text = self._text_box(right, 9)
            fr3.pack(fill="both", expand=True)

        @guarded
        def save_cfg(self):
            c = self.cfg
            c.alert_min_fit, c.alert_min_score = int(self.cv["alert_min_fit"].get()), int(self.cv["alert_min_score"].get())
            c.schedule_interval_min, c.quiet_start, c.quiet_end = float(self.cv["schedule_interval_min"].get()), int(self.cv["quiet_start"].get()), int(self.cv["quiet_end"].get())
            c.home_city = self.cv["home_city"].get().strip()
            for k, v in self.cb.items():
                setattr(c, k, bool(v.get()))
            save_config(c)
            self.cfg = load_config()
            self.scheduler.interval = self.cfg.schedule_interval_min * 60
            self.scheduler.quiet = (self.cfg.quiet_start, self.cfg.quiet_end)
            self.scheduler.enabled = self.cfg.schedule_enabled
            self.scheduler.next_run = time.time() + 5
            self.refresh_jobs()
            self.say("Toolkit settings saved.")

        @guarded
        def watch_add(self):
            name = simpledialog.askstring("Watch company", "Company name:", parent=self)
            if name:
                self.db.watch_add(name)
                self.refresh_discover()

        @guarded
        def watch_remove(self):
            for i in self.wlist.curselection():
                self.db.watch_remove(self.wlist.get(i))
            self.refresh_discover()

        def refresh_discover(self):
            self.wlist.delete(0, "end")
            for c in self.db.watch_list():
                self.wlist.insert("end", c)
            self.atree.delete(*self.atree.get_children())
            for i, (j, why) in enumerate(self.last_alerts[:50]):
                self.atree.insert("", "end", iid=f"a{i}", values=(j.title, j.company, why))
            self.stree.delete(*self.stree.get_children())
            for r in self.db.rows("x_scanlog", limit=40):
                self.stree.insert("", "end", iid=str(r["id"]), values=(r["ts"][:19].replace("T", " "), r["query"], r["found"], r["new_count"], r["alerts"]))

        def tick(self):
            try:
                self.scheduler.tick()
            except Exception as exc:
                core.LOG.error("scheduler: %s", exc)
            self.after(30000, self.tick)

        def run_scheduled(self):
            if self.busy:
                self.scheduler.next_run = time.time() + 300
                return
            searches = list(self.settings.saved_searches)
            if not searches:
                self.say("No saved searches. Save one in Job Auto Apply PRO (Save this search) and it will run here.")
                return
            self._sched_queue = searches
            self._scheduled_scan = True
            self._next_scheduled()

        def _next_scheduled(self):
            if not self._sched_queue or self.busy:
                return
            s = self._sched_queue.pop(0)
            try:
                pages = max(1, min(3, int(s.get("pages", 2))))
                core.search_url(s.get("query", ""), s.get("city", ""), str(s.get("experience", "")), s.get("days", "Any"))
            except (ValueError, TypeError) as exc:
                self.say(f"Skipped invalid saved search '{s.get('name')}': {exc}")
                self.after(100, self._next_scheduled)
                return
            self._last_search = s
            self.enqueue("search", candidate=self.candidate, query=s["query"], city=s.get("city", ""), experience=str(s.get("experience", "")),
                         days=s.get("days", "Any"), pages=pages)

        @guarded
        def health_check(self):
            q = self._last_search.get("query") or (self.candidate.target_titles.split(",")[0].strip() if self.candidate.target_titles else "Python Developer")
            if self.enqueue("health", query=q, city=self._last_search.get("city", "")):
                self._set_text(self.health_text, "Running… watch the browser window.")

        # ===== Interviews & contacts =========================================== #
        def _tab_people(self, p):
            left = ttk.LabelFrame(p, text="Interviews", padding=6)
            left.pack(side="left", fill="both", expand=True, padx=(0, 4))
            fr, self.itree = self._tree(left, (("when", "When", 120), ("job", "Job", 170), ("kind", "Round", 90), ("who", "Interviewer", 100), ("out", "Outcome", 80)), 12, "browse")
            fr.pack(fill="both", expand=True)
            self._btns(left, [("Add", self.add_interview_dialog), ("Set outcome", self.interview_outcome), ("Delete", self.delete_interview),
                              ("Export .ics", self.export_ics)]).pack(fill="x")
            self.upcoming_lbl = ttk.Label(left, text="")
            self.upcoming_lbl.pack(anchor="w")
            right = ttk.LabelFrame(p, text="Recruiters & referrals", padding=6)
            right.pack(side="left", fill="both", expand=True, padx=(4, 0))
            fr, self.ctree = self._tree(right, (("name", "Name", 130), ("company", "Company", 120), ("role", "Role", 100), ("email", "Email", 150), ("last", "Last contact", 90)), 12, "browse")
            fr.pack(fill="both", expand=True)
            self._btns(right, [("Add", self.add_contact_dialog), ("Contacted today", self.touch_selected), ("Delete", self.delete_contact),
                               ("Export reminders .ics", self.export_followups)]).pack(fill="x")

        def refresh_interviews(self):
            self.itree.delete(*self.itree.get_children())
            for r in self.db.rows("x_interviews", order="scheduled_at DESC"):
                self.itree.insert("", "end", iid=str(r["id"]), values=(r["scheduled_at"] or "unscheduled", f"{r['title']} @ {r['company']}"[:40], r["kind"], r["interviewer"], r["outcome"]))
            up = upcoming_interviews(self.db, 7)
            self.upcoming_lbl.config(text=f"Next 7 days: {len(up)} interview(s)" + (f" — next: {up[0]['when'].strftime('%a %d %b %H:%M')} {up[0]['company']}" if up else ""))

        @guarded
        def add_interview_dialog(self):
            sel = self.jtree.selection() if hasattr(self, "jtree") else ()
            url = sel[0] if sel and sel[0] in self.by_url else ""
            f = ask_form(self, "Add interview", [("title", "Job title", self.by_url[url].title if url else "", "text"), ("company", "Company", self.by_url[url].company if url else "", "text"),
                                                ("kind", "Round type", "Technical", "combo:" + "|".join(INTERVIEW_KINDS)), ("round_name", "Round name", "", "text"),
                                                ("scheduled_at", "Date & time (2026-11-05 14:30)", "", "text"), ("duration_min", "Duration (minutes)", "60", "text"),
                                                ("interviewer", "Interviewer", "", "text"), ("venue", "Venue / link", "", "text"), ("notes", "Notes", "", "multi")], "Add")
            if f:
                self.add_interview(url, f)

        def add_interview(self, url, f):
            add_interview(self.db, job_url=url, title=f["title"], company=f["company"], round_name=f["round_name"], kind=f["kind"],
                          scheduled_at=f["scheduled_at"], duration_min=int(f["duration_min"] or 60), interviewer=f["interviewer"], venue=f["venue"], notes=f["notes"])
            self.reload_jobs()
            self.refresh_all()

        @guarded
        def interview_outcome(self):
            sel = self.itree.selection()
            if not sel:
                raise ValueError("Select an interview.")
            f = ask_form(self, "Interview outcome", [("o", "Outcome", "Passed", "combo:" + "|".join(INTERVIEW_OUTCOMES)), ("notes", "Notes (optional)", "", "multi")], "Save")
            if f:
                set_interview_outcome(self.db, int(sel[0]), f["o"], f["notes"] or None)
                self.refresh_interviews()

        @guarded
        def delete_interview(self):
            for i in self.itree.selection():
                self.db.delete("x_interviews", int(i))
            self.refresh_interviews()

        @guarded
        def export_ics(self):
            path = filedialog.asksaveasfilename(defaultextension=".ics", initialfile="interviews.ics", filetypes=[("Calendar", "*.ics")])
            if path:
                ev = interview_events(self.db.rows("x_interviews"))
                Path(path).write_text(make_ics(ev, "Interviews"), encoding="utf-8", newline="")
                self.say(f"Exported {len(ev)} interview(s) to {path}")

        @guarded
        def export_followups(self):
            path = filedialog.asksaveasfilename(defaultextension=".ics", initialfile="followups.ics", filetypes=[("Calendar", "*.ics")])
            if path:
                ev = followup_events(self.db, self.settings.followup_days)
                Path(path).write_text(make_ics(ev, "Follow-ups"), encoding="utf-8", newline="")
                self.say(f"Exported {len(ev)} reminder(s) to {path}")

        def refresh_contacts(self):
            self.ctree.delete(*self.ctree.get_children())
            for c in self.db.rows("x_contacts", order="name COLLATE NOCASE"):
                self.ctree.insert("", "end", iid=str(c["id"]), values=(c["name"], c["company"], c["role"], c["email"], c["last_contacted"] or "never"))

        @guarded
        def add_contact_dialog(self):
            f = ask_form(self, "Add contact", [("name", "Name", "", "text"), ("company", "Company", "", "text"), ("role", "Role", "Recruiter", "text"), ("email", "Email", "", "text"),
                                              ("phone", "Phone", "", "text"), ("linkedin", "LinkedIn URL", "", "text"), ("notes", "Notes", "", "multi")], "Add")
            if f:
                add_contact(self.db, **f)
                self.refresh_contacts()

        @guarded
        def touch_selected(self):
            for i in self.ctree.selection():
                touch_contact(self.db, int(i))
            self.refresh_contacts()

        @guarded
        def delete_contact(self):
            for i in self.ctree.selection():
                self.db.delete("x_contacts", int(i))
            self.refresh_contacts()

        # ===== Offers & rejections ============================================= #
        def _tab_offers(self, p):
            left = ttk.LabelFrame(p, text="Offers", padding=6)
            left.pack(side="left", fill="both", expand=True, padx=(0, 4))
            fr, self.otree = self._tree(left, (("company", "Company", 120), ("title", "Role", 110), ("fixed", "Fixed", 55), ("var", "Var", 50), ("join", "Joining", 85)), 8)
            fr.pack(fill="both", expand=True)
            self.v_haircut = tk.StringVar(value="100")
            row = ttk.Frame(left)
            row.pack(fill="x")
            ttk.Label(row, text="Variable pay counted at (%)").pack(side="left")
            ttk.Entry(row, textvariable=self.v_haircut, width=5).pack(side="left", padx=4)
            self._btns(left, [("Add offer", self.add_offer_dialog), ("Compare all", self.compare_offers_dialog), ("Delete", self.delete_offer)]).pack(fill="x")
            right = ttk.LabelFrame(p, text="Rejection log", padding=6)
            right.pack(side="left", fill="both", expand=True, padx=(4, 0))
            fr, self.rtree = self._tree(right, (("on", "Date", 85), ("job", "Job", 170), ("stage", "Stage", 70), ("reason", "Reason", 140)), 8)
            fr.pack(fill="both", expand=True)
            self._btns(right, [("Log rejection", self.log_rejection_dialog), ("Patterns", self.show_patterns), ("Delete", self.delete_rejection)]).pack(fill="x")

        def refresh_offers(self):
            self.otree.delete(*self.otree.get_children())
            for o in self.db.rows("x_offers"):
                self.otree.insert("", "end", iid=str(o["id"]), values=(o["company"], o["title"], o["fixed_lpa"], o["variable_lpa"], o["joining_date"] or "—"))

        @guarded
        def add_offer_dialog(self):
            f = ask_form(self, "Add offer (amounts in LPA)", [("company", "Company", "", "text"), ("title", "Role", "", "text"), ("fixed_lpa", "Fixed", "", "text"),
                                                              ("variable_lpa", "Variable", "0", "text"), ("joining_bonus_lpa", "Joining bonus", "0", "text"),
                                                              ("esop_lpa", "ESOP value per year (your estimate)", "0", "text"), ("joining_date", "Joining date (2026-12-01)", "", "text"),
                                                              ("location", "Location", "", "text"), ("remote", "Remote?", "no", "combo:no|yes"), ("benefits", "Benefits", "", "text"),
                                                              ("notes", "Notes", "", "multi")], "Add")
            if f:
                f["remote"] = f["remote"] == "yes"
                add_offer(self.db, **f)
                self.reload_jobs()
                self.refresh_all()

        @guarded
        def compare_offers_dialog(self):
            counted = self.v_haircut.get().strip()
            pct = max(0.0, min(100.0, money(counted) if counted else 100.0))
            rows = compare_offers(self.db.rows("x_offers"), variable_haircut=1 - pct / 100)
            show_text(self, "Offer comparison", offers_text(rows), 900, 380)

        @guarded
        def delete_offer(self):
            for i in self.otree.selection():
                self.db.delete("x_offers", int(i))
            self.refresh_offers()

        def refresh_rejections(self):
            self.rtree.delete(*self.rtree.get_children())
            for r in self.db.rows("x_rejections"):
                self.rtree.insert("", "end", iid=str(r["id"]), values=(r["rejected_on"], f"{r['title']} @ {r['company']}"[:40], r["stage"], r["reason"]))

        @guarded
        def log_rejection_dialog(self):
            sel = self.jtree.selection() if hasattr(self, "jtree") else ()
            url = sel[0] if sel and sel[0] in self.by_url else ""
            f = ask_form(self, "Log rejection", [("title", "Job title", self.by_url[url].title if url else "", "text"), ("company", "Company", self.by_url[url].company if url else "", "text"),
                                                ("stage", "Rejected at", "Applied", "combo:" + "|".join(REJECT_STAGES)), ("reason", "Reason", "No response", "combo:" + "|".join(REJECT_REASONS)),
                                                ("rejected_on", "Date (blank = today)", "", "text"), ("note", "Note", "", "multi")], "Log")
            if f:
                log_rejection(self.db, job_url=url, **f)
                self.reload_jobs()
                self.refresh_all()

        @guarded
        def show_patterns(self):
            show_text(self, "Rejection patterns", patterns_text(rejection_patterns(self.db, self.jobs, self.analysis)), 760, 380)

        @guarded
        def delete_rejection(self):
            for i in self.rtree.selection():
                self.db.delete("x_rejections", int(i))
            self.refresh_rejections()

        # ===== Analytics ======================================================= #
        def _tab_analytics(self, p):
            bar = ttk.Frame(p)
            bar.pack(fill="x")
            self.v_group = tk.StringVar(value="source")
            self.v_sgroup = tk.StringVar(value="role")
            self._btns(bar, [("Applications / day", self.chart_days), ("Pipeline stages", self.chart_stages), ("Funnel", self.show_funnel), ("Salary", self.show_salary),
                             ("Skill trends", self.show_trends), ("Interview stats", self.show_interview_stats)]).pack(side="left")
            ttk.Combobox(bar, textvariable=self.v_group, values=["overall", "source", "resume_version"], state="readonly", width=14).pack(side="left", padx=(8, 2))
            ttk.Combobox(bar, textvariable=self.v_sgroup, values=["role", "city", "experience"], state="readonly", width=11).pack(side="left", padx=2)
            bar2 = ttk.Frame(p)
            bar2.pack(fill="x")
            self._btns(bar2, [("Weekly report (HTML)", self.weekly_report), ("E-mail the report…", self.email_report)]).pack(side="left")
            self.chart = tk.Canvas(p, width=720, height=240, highlightthickness=1)
            self.chart.pack(pady=6)
            fr, self.out_text2 = self._text_box(p, 12)
            fr.pack(fill="both", expand=True)

        @guarded
        def chart_days(self):
            rep = build_weekly_report(self.db, 14)
            draw_bars(self.chart, [d for d, _ in rep["per_day"]], [n for _, n in rep["per_day"]], "Evidence-backed applications per day (14 days)")
            self._set_text(self.out_text2, f"{len(rep['applied'])} application(s) with evidence in the last 14 days; {rep['new_jobs']} new jobs found.")

        @guarded
        def chart_stages(self):
            counts = Counter(j.stage for j in self.jobs if not j.hidden)
            draw_hbars(self.chart, [(s, counts.get(s, 0)) for s in core.PIPELINE_STAGES], "Jobs by pipeline stage")

        @guarded
        def show_funnel(self):
            rows = funnel(self.db, self.v_group.get())
            draw_hbars(self.chart, [(r["group"] + " – applied", r["applied"]) for r in rows[:4]] + [(r["group"] + " – interviews", r["interviewed"]) for r in rows[:2]], "Funnel")
            self._set_text(self.out_text2, funnel_text(rows, self.v_group.get()))

        @guarded
        def show_salary(self):
            res = salary_insights(self.jobs, self.v_sgroup.get())
            draw_hbars(self.chart, [(r["group"], r["median"]) for r in res["rows"][:9]], "Median advertised salary (LPA)")
            self._set_text(self.out_text2, salary_text(res, self.v_sgroup.get()))

        @guarded
        def show_trends(self):
            tr = skill_trends(self.db)
            if tr["ready"]:
                draw_lines(self.chart, tr["days"], dict(list(tr["series"].items())[:6]), "Share of jobs mentioning each skill (%)")
            else:
                draw_lines(self.chart, [], {}, "Skill trends")
            self._set_text(self.out_text2, trends_text(tr))

        @guarded
        def show_interview_stats(self):
            st = interview_stats(self.db)
            lines = [f"Interviews logged: {st['total']}", "Outcomes: " + (", ".join(f"{k} ×{v}" for k, v in st["outcomes"].items()) or "—")]
            for k, (rate, n) in st["pass_rate_by_kind"].items():
                lines.append(f"  {k}: pass rate {_rate(rate)} over {n} decided round(s)")
            self._set_text(self.out_text2, "\n".join(lines) + "\n\n" + interviews_text(upcoming_interviews(self.db, 14)))

        def _report_html(self):
            rep = build_weekly_report(self.db, self.cfg.report_days, self.jobs, self.analysis)
            return weekly_report_html(rep, self.analysis)

        @guarded
        def weekly_report(self):
            path = save_report(self._report_html())
            webbrowser.open(path.as_uri())
            self.say("Report saved to " + str(path))

        @guarded
        def email_report(self):
            if not (self.cfg.smtp_host and self.cfg.smtp_user and self.cfg.report_to):
                f = ask_form(self, "Report e-mail (your own SMTP account)", [("smtp_host", "SMTP host", self.cfg.smtp_host, "text"), ("smtp_port", "Port (465 or 587)", str(self.cfg.smtp_port), "text"),
                                                                          ("smtp_user", "Username / from address", self.cfg.smtp_user, "text"), ("report_to", "Send to", self.cfg.report_to, "text")], "Save")
                if not f:
                    return
                self.cfg.smtp_host, self.cfg.smtp_port, self.cfg.smtp_user, self.cfg.report_to = f["smtp_host"], int(f["smtp_port"] or 465), f["smtp_user"], f["report_to"]
                save_config(self.cfg)
            pw = os.environ.get("JAA_SMTP_PASSWORD") or simpledialog.askstring("SMTP password", "Password (used once, never saved):", show="*", parent=self)
            if pw:
                self.say(send_report_email(self._report_html(), self.cfg, password=pw))

        # ===== Safety & data =================================================== #
        def _tab_safety(self, p):
            left = ttk.LabelFrame(p, text="Change history (undo)", padding=6)
            left.pack(side="left", fill="both", expand=True, padx=(0, 4))
            fr, self.audit_tree = self._tree(left, (("ts", "When", 130), ("what", "Change", 260), ("undone", "Undone", 55)), 10)
            fr.pack(fill="both", expand=True)
            self._btns(left, [("Undo last change", self.undo_one), ("Undo last 5", lambda: self.undo_one(5))]).pack(fill="x")
            right = ttk.Frame(p)
            right.pack(side="left", fill="both", expand=True, padx=(4, 0))
            q = ttk.LabelFrame(right, text="Apply queue (survives restarts)", padding=6)
            q.pack(fill="both", expand=True)
            fr, self.qtree = self._tree(q, (("job", "Job", 230), ("company", "Company", 110), ("status", "Status", 80)), 6)
            fr.pack(fill="both", expand=True)
            self._btns(q, [("Start / resume queue", self.run_queue), ("Clear finished", self.clear_queue)]).pack(fill="x")
            d = ttk.LabelFrame(right, text="Backups, vault, settings bundle", padding=6)
            d.pack(fill="x", pady=(6, 0))
            self._btns(d, [("Encrypted backup…", self.enc_backup), ("Restore encrypted…", self.enc_restore), ("Private notes (vault)…", self.vault_notes)]).pack(fill="x")
            self._btns(d, [("Export settings bundle…", self.bundle_export), ("Import settings bundle…", self.bundle_import)]).pack(fill="x")
            ttk.Label(d, text="The vault and encrypted backups protect private notes and exports. The live profile and database stay readable\n"
                              "on disk because Job Auto Apply PRO reads them directly.", foreground="#6b7280").pack(anchor="w")
            ap = ttk.LabelFrame(right, text="Applyra Extension Integration", padding=6)
            ap.pack(fill="x", pady=(6, 0))
            self._btns(ap, [("Import Applyra JSON…", self.import_applyra), ("Export Applyra JSON…", self.export_applyra), ("Toggle Applyra Bridge", self.toggle_applyra_bridge)]).pack(fill="x")
            ttk.Label(ap, text="Sync jobs, candidate profile, and interviews bidirectionally with the Applyra Chrome/Brave extension.", foreground="#6b7280").pack(anchor="w")

        def refresh_safety(self):
            self.audit_tree.delete(*self.audit_tree.get_children())
            for r in self.db.audit_rows(80):
                what = f"{r['action']}: {r['field']} {str(r['old'])[:14]!r}→{str(r['new'])[:14]!r} {r['ref'][-26:]}"
                self.audit_tree.insert("", "end", iid=str(r["id"]), values=(r["ts"][:19].replace("T", " "), what, "yes" if r["undone"] else ""))
            self.qtree.delete(*self.qtree.get_children())
            for r in self.db.rows("x_queue", order="id DESC", limit=200):
                self.qtree.insert("", "end", iid=str(r["id"]), values=(r["title"], r["company"], r["status"]))

        @guarded
        def undo_one(self, n=1):
            done = self.db.undo_last(n)
            if not done:
                raise ValueError("Nothing to undo.")
            self.reload_jobs()
            self.refresh_all()
            self.say("; ".join(done))

        @guarded
        def run_queue(self):
            jobs = [j for j in resumable_queue_jobs(self.db, self.jobs) if core.naukri_url(j.key)]
            if not jobs:
                raise ValueError("The queue is empty (or everything in it was already attempted).")
            s = self.settings
            remaining = max(0, s.daily_limit - self.store.attempts_today())
            mode = "DRY RUN — nothing will be clicked" if s.dry_run else "REAL applications"
            if not messagebox.askyesno("Confirm", f"{mode}\n\n{len(jobs)} queued job(s). Daily allowance left: {remaining} of {s.daily_limit}.\n\n"
                                       "This clicks Naukri's internal Apply button and can submit applications. Unknown questions pause for you; "
                                       "only job-specific confirmation counts as proof.\n\nContinue?", icon="warning"):
                return
            self.worker.settings = self.settings
            self.enqueue("apply", jobs=jobs, candidate=self.candidate)

        @guarded
        def clear_queue(self):
            n = self.db.queue_clear_done()
            self.refresh_safety()
            self.say(f"Cleared {n} finished queue entries.")

        def _pass(self, prompt):
            pw = simpledialog.askstring("Passphrase", prompt, show="*", parent=self)
            if not pw:
                raise ValueError("Cancelled.")
            return pw

        @guarded
        def enc_backup(self):
            path = filedialog.asksaveasfilename(defaultextension=".jaabak", initialfile=f"career_backup_{core.today_utc()}.jaabak")
            if path:
                encrypted_backup(self.db, path, self._pass("New passphrase (min 8 characters). There is NO recovery if you forget it:"))
                self.say("Encrypted backup written to " + path)

        @guarded
        def enc_restore(self):
            src = filedialog.askopenfilename(filetypes=[("Encrypted backup", "*.jaabak"), ("All", "*.*")])
            if src:
                out = filedialog.asksaveasfilename(defaultextension=".zip", initialfile="restored_backup.zip")
                if out:
                    decrypt_backup(src, out, self._pass("Passphrase:"))
                    self.say("Decrypted to " + out + " (unzip it to inspect or restore files manually).")

        @guarded
        def vault_notes(self):
            pw = self._pass("Vault passphrase (min 8 characters; no recovery):")
            data = vault_load(pw)
            f = ask_form(self, "Private notes (encrypted)", [("notes", "Anything private: negotiation limits, references, account hints (not passwords you can avoid storing)", data.get("notes", ""), "multi")], "Encrypt & save")
            if f is not None:
                data["notes"] = f["notes"]
                vault_save(pw, data)
                self.say("Vault saved.")

        @guarded
        def bundle_export(self):
            path = filedialog.asksaveasfilename(defaultextension=".jaabundle", initialfile="career_settings.jaabundle")
            if path:
                pw = ""
                if messagebox.askyesno("Encrypt bundle?", "The bundle contains your profile (name, phone, CTC). Encrypt it with a passphrase?"):
                    pw = self._pass("Passphrase (min 8 characters):")
                res = export_bundle(self.db, path, True, pw)
                self.say(f"Bundle written: {res['saved_searches']} saved searches, {res['rules']} rules, {res['templates']} templates, encrypted={res['encrypted']}.")

        @guarded
        def bundle_import(self):
            path = filedialog.askopenfilename(filetypes=[("Bundle", "*.jaabundle"), ("All", "*.*")])
            if path:
                raw = Path(path).read_bytes()
                pw = self._pass("Bundle passphrase:") if raw.startswith(b"JAAV1") else ""
                report = import_bundle(self.db, path, pw)
                self.settings, self.candidate, self.cfg = core.load_settings(), core.load_candidate(), load_config()
                self.worker.settings, self.worker.candidate_for_rules = self.settings, self.candidate
                self.refresh_analysis(silent=True)
                self.reload_jobs()
                self.refresh_all()
                show_text(self, "Bundle imported", "\n".join(report), 640, 300)

        @guarded
        def import_applyra(self):
            path = filedialog.askopenfilename(filetypes=[("Applyra Workspace", "*.json"), ("All", "*.*")])
            if path:
                res = import_applyra_workspace(self.db, path, self.candidate, self.analysis)
                self.settings, self.candidate = core.load_settings(), core.load_candidate()
                self.reload_jobs()
                self.refresh_all()
                show_text(self, "Applyra Workspace Imported",
                          f"Jobs read: {res['jobs_read']}\nJobs imported: {res['jobs_imported']} ({res['jobs_new']} new)\n"
                          f"Interviews imported: {res['interviews_imported']}\n"
                          f"Candidate profile updated: {res['profile_updated']}\n\n"
                          f"All imported Applyra opportunities, tracked statuses, and interview schedules are now active in Career Toolkit.", 600, 240)

        @guarded
        def export_applyra(self):
            path = filedialog.asksaveasfilename(defaultextension=".json",
                                                filetypes=[("Applyra Workspace", "*.json")],
                                                initialfile="applyra-toolkit-workspace.json")
            if path:
                export_applyra_workspace(self.db, self.candidate, path)
                show_text(self, "Applyra Workspace Exported",
                          f"Saved full workspace to:\n{path}\n\nYou can load this directly into your Applyra Chrome/Brave extension via 'Import CSV / JSON' in your dashboard.", 620, 200)

        @guarded
        def toggle_applyra_bridge(self):
            if hasattr(self, "_applyra_server_thread") and self._applyra_server_thread and self._applyra_server_thread.is_alive():
                messagebox.showinfo("Applyra Bridge", "Applyra Bridge server is already running on http://127.0.0.1:8765/\n\nYour Applyra extension can connect directly.")
                return
            def _runner():
                try:
                    run_applyra_server(self.db, self.candidate, self.analysis, "127.0.0.1", 8765)
                except Exception as e:
                    core.LOG.error("Applyra bridge server stopped: %s", e)
            self._applyra_server_thread = threading.Thread(target=_runner, daemon=True)
            self._applyra_server_thread.start()
            messagebox.showinfo("Applyra Bridge Started", "Applyra Career Toolkit Bridge is now listening on:\nhttp://127.0.0.1:8765/\n\nOpen Applyra in your browser to sync live data and analytics.")

        # ===== worker events =================================================== #
        def poll(self):
            try:
                while True:
                    kind, data = self.events.get_nowait()
                    try:
                        self.handle_event(kind, data)
                    except Exception as exc:
                        core.LOG.error("event %s: %s\n%s", kind, exc, traceback.format_exc())
            except queue.Empty:
                pass
            self.after(200, self.poll)

        def handle_event(self, kind, data):
            if kind == "log":
                self.say(data["text"])
            elif kind == "progress":
                self.status.config(text=data["text"])
            elif kind in ("idle", "login_open"):
                self.busy = False
            elif kind == "error":
                self.busy = False
                self._sched_queue.clear()
                messagebox.showerror("Browser operation failed", data["message"])
            elif kind == "search_blocked":
                self.busy = False
                self._sched_queue.clear()
                self.say(data["message"])
                messagebox.showerror("Website access denied", data["message"])
            elif kind == "search_done":
                self._on_search_done(data)
            elif kind == "job_updated":
                self.busy = False
            elif kind == "needs_manual":
                self._manual_prompt(data)
            elif kind == "applying":
                self.status.config(text=f"Applying {data['index']}/{data['total']}: {data['title']}")
            elif kind == "application_result":
                job = data["job"]
                sync_queue_with_result(self.db, job.key, data["status"], data["evidence"])
                self.refresh_safety()
            elif kind == "batch_finished":
                self.busy = False
                self.reload_jobs()
                self.refresh_all()
                self.status.config(text=f"Batch done: {data['confirmed']} confirmed, {data['partial']} partial, {data['skipped']} skipped.")
                if self.cfg.notify_enabled:
                    notify("Apply queue finished", f"{data['confirmed']} confirmed, {data['partial']} partial evidence.")
            elif kind == "health_done":
                self.busy = False
                if data.get("blocked"):
                    self._set_text(self.health_text, "ACCESS DENIED: Naukri blocked the page. Stop and try later; nothing is bypassed.")
                else:
                    txt = health_report_text(data["search"], "Search page")
                    if data.get("job"):
                        txt += "\n\n" + health_report_text(data["job"], "Job page")
                    self._set_text(self.health_text, txt)

        def _on_search_done(self, data):
            self.busy = False
            new_urls = {j.key for j in data["jobs"] if j.is_new}
            self.reload_jobs(new_urls)
            found_urls = {j.key for j in data["jobs"]}
            fresh = [j for j in self.jobs if j.key in found_urls]
            alerts = alert_matches(fresh, self.cfg.alert_min_fit if self.analysis else 101, self.cfg.alert_min_score, self.db.watch_list(), True)
            self.last_alerts = alerts
            snapshot_skills(self.db, self.jobs)
            s = self._last_search or {}
            self.db.insert("x_scanlog", ts=now_iso(), query=s.get("query") or data.get("searched_url", "")[:60], city=s.get("city", ""),
                           found=len(data["jobs"]), new_count=data["new_count"], alerts=len(alerts))
            self.refresh_all()
            self.say(f"Scan finished: {len(data['jobs'])} found, {data['new_count']} new, {len(alerts)} alert(s).")
            if alerts and self.cfg.notify_enabled:
                top = alerts[0][0]
                notify(f"{len(alerts)} job alert(s)", f"{top.title} — {top.company} ({alerts[0][1]})")
            if self._sched_queue:
                self.after(random.randint(45000, 90000), self._next_scheduled)
            else:
                self._scheduled_scan = False

        def _manual_prompt(self, data):
            if self.manual_dialog:
                return
            if self.cfg.notify_enabled:
                notify("Action needed", f"Application needs you: {data['title'][:60]}")
            dlg = tk.Toplevel(self)
            self.manual_dialog = dlg
            dlg.title("Action needed — verify application")
            dlg.geometry("620x300")
            dlg.transient(self)
            ttk.Label(dlg, text="Application needs manual verification", font=("Segoe UI", 14, "bold")).pack(anchor="w", padx=16, pady=(14, 6))
            ttk.Label(dlg, text=data["title"], font=("Segoe UI", 11, "bold"), wraplength=580).pack(anchor="w", padx=16)
            ttk.Label(dlg, text=data["message"], wraplength=580, justify="left").pack(anchor="w", padx=16, pady=10)
            if data.get("unknown"):
                ttk.Label(dlg, text="Unanswered: " + "; ".join(data["unknown"]), wraplength=580, foreground="#b45309").pack(anchor="w", padx=16)
            bar = ttk.Frame(dlg)
            bar.pack(fill="x", padx=16, pady=14)

            def finish(choice):
                self.worker.manual_action = choice
                self.worker.manual_event.set()
                dlg.destroy()
                self.manual_dialog = None
            ttk.Button(bar, text="Verify & Continue", command=lambda: finish("verify")).pack(side="left", padx=4)
            ttk.Button(bar, text="Skip & Continue", command=lambda: finish("skip")).pack(side="left", padx=4)
            dlg.protocol("WM_DELETE_WINDOW", lambda: finish("skip"))

        def on_close(self):
            if self.busy and not messagebox.askyesno("Close", "A browser task is running. Stop and close?"):
                return
            self.worker.stop_event.set()
            self.worker.manual_action = "skip"
            self.worker.manual_event.set()
            self.commands.put(("quit", {}))
            self.destroy()

    try:
        app = ToolkitApp()
        app.mainloop()
    except Exception as exc:
        core.LOG.error("toolkit GUI failed: %s\n%s", exc, traceback.format_exc())
        print("Could not start the toolkit window:", exc)
        print("Check that Python includes tkinter (standard installer from python.org).")
        return 2
    return 0


# =========================================================================== #
# Command line
# =========================================================================== #
def _open(db_path: str | None = None):
    store = core.History(Path(db_path)) if db_path else core.History(core.DB_FILE)
    db = ExtrasDB(store)
    cand = core.load_candidate()
    analysis = None
    if cand.resume:
        try:
            analysis = core.analyze_resume_file(cand.resume)
        except core.ResumeError:
            analysis = None
    jobs = store.load_jobs()
    for j in jobs:
        j.score, m = core.score_job(j, cand)
        j.matched = ", ".join(m)
    if analysis:
        try:
            years = float(cand.years_experience) if cand.years_experience else None
        except ValueError:
            years = None
        core.apply_fit(jobs, analysis, years)
    return store, db, cand, analysis, jobs


def _passphrase(args) -> str:
    if not getattr(args, "encrypt", False):
        return ""
    pw = os.environ.get("JAA_PASSPHRASE", "")
    if not pw:
        import getpass
        pw = getpass.getpass("Passphrase (min 8 characters, no recovery if lost): ")
    return pw


def cli_main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="job_auto_apply_toolkit.py", description="Career Toolkit — companion to Job Auto Apply PRO")
    p.add_argument("--db", help="use a different database file (default: the main app's)")
    p.add_argument("--version", action="store_true")
    sub = p.add_subparsers(dest="cmd")
    sub.add_parser("gui", help="open the window (default)")
    sub.add_parser("selftest", help="run offline tests")
    r = sub.add_parser("report", help="weekly report as HTML")
    r.add_argument("--days", type=int, default=7)
    r.add_argument("--out")
    r.add_argument("--email", action="store_true", help="send it via your SMTP settings (password from JAA_SMTP_PASSWORD)")
    for name, choices, default in (("funnel", ["overall", "source", "resume_version"], "overall"), ("salary", ["role", "city", "experience"], "role")):
        s = sub.add_parser(name)
        s.add_argument("--by", choices=choices, default=default)
    sub.add_parser("trends", help="skill-demand trends from daily snapshots")
    ic = sub.add_parser("ics", help="calendar export")
    ic.add_argument("kind", choices=["interviews", "followups"])
    ic.add_argument("out")
    im = sub.add_parser("import", help="import jobs from CSV / JSON / RSS")
    im.add_argument("file")
    im.add_argument("--source", default="")
    t = sub.add_parser("template", help="render an e-mail / cover-letter template")
    t.add_argument("name", nargs="?", help="template name (omit to list)")
    t.add_argument("--job", default="", help="part of the job URL or title to fill the template with")
    f = sub.add_parser("flags", help="jobs with red flags")
    f.add_argument("--top", type=int, default=20)
    sub.add_parser("dupes", help="duplicate postings")
    o = sub.add_parser("offers", help="compare recorded offers")
    o.add_argument("--variable-counted", type=float, default=100.0, help="percent of variable pay to count (default 100)")
    a = sub.add_parser("audit", help="recent recorded changes")
    a.add_argument("--limit", type=int, default=30)
    u = sub.add_parser("undo", help="undo recorded changes")
    u.add_argument("n", nargs="?", type=int, default=1)
    sub.add_parser("queue", help="show the resumable apply queue")
    be = sub.add_parser("bundle-export", help="export settings bundle")
    be.add_argument("file")
    be.add_argument("--encrypt", action="store_true")
    be.add_argument("--no-profile", action="store_true")
    bi = sub.add_parser("bundle-import", help="import settings bundle")
    bi.add_argument("file")
    bi.add_argument("--overwrite-profile", action="store_true")
    ai = sub.add_parser("applyra-import", help="import Applyra workspace JSON (jobs, profile, interviews)")
    ai.add_argument("file")
    ae = sub.add_parser("applyra-export", help="export Toolkit database to Applyra workspace JSON")
    ae.add_argument("file")
    asv = sub.add_parser("applyra-serve", help="run local HTTP bridge for Applyra extension (default port 8765)")
    asv.add_argument("--port", type=int, default=8765)
    asv.add_argument("--host", default="127.0.0.1")
    args = p.parse_args(argv)
    if args.version:
        print(TOOLKIT_VERSION)
        return 0
    if args.cmd in (None, "gui"):
        return run_gui()
    if args.cmd == "selftest":
        return self_test()
    store, db, cand, analysis, jobs = _open(args.db)
    try:
        if args.cmd == "report":
            rep = build_weekly_report(db, args.days, jobs, analysis)
            page = weekly_report_html(rep, analysis)
            path = save_report(page, Path(args.out) if args.out else None)
            print("Report written to", path)
            if args.email:
                print(send_report_email(page, load_config()))
        elif args.cmd == "funnel":
            print(funnel_text(funnel(db, args.by), args.by))
        elif args.cmd == "salary":
            print(salary_text(salary_insights(jobs, args.by), args.by))
        elif args.cmd == "trends":
            print(trends_text(skill_trends(db)))
        elif args.cmd == "ics":
            ev = interview_events(db.rows("x_interviews")) if args.kind == "interviews" else followup_events(db, core.load_settings().followup_days)
            Path(args.out).write_text(make_ics(ev, args.kind.title()), encoding="utf-8", newline="")
            print(f"Wrote {len(ev)} event(s) to {args.out}")
        elif args.cmd == "import":
            res = import_jobs(db, args.file, args.source, cand, analysis)
            print(f"Read {res['read']} rows ({res['format']}); imported {res['imported']} ({res['new']} new) from source '{res['source']}'. Imported jobs are never auto-applied.")
        elif args.cmd == "template":
            if not args.name:
                for tpl in db.templates():
                    print(f"{tpl['kind']:<13}{tpl['name']}")
            else:
                job = next((j for j in jobs if args.job and (args.job in j.key or args.job.lower() in j.title.lower())), None)
                out = render_template(db, args.name, cand, job, analysis)
                print("Subject:", out["subject"], "\n\n" + out["body"])
                if out["todo"]:
                    print("\nStill to write yourself:\n" + "\n".join(" - " + x for x in out["todo"]))
        elif args.cmd == "flags":
            rows = sorted(((flag_score(fl), j, fl) for j in jobs for fl in [detect_red_flags(j)] if fl), key=lambda t: -t[0])[:args.top]
            print(f"{len(rows)} job(s) with red flags" if rows else "No red flags found.")
            for score, j, fl in rows:
                print(f"\n[{score:>3}] {j.title} — {j.company}\n      " + "; ".join(x["label"] for x in fl))
        elif args.cmd == "dupes":
            print(dupes_text(find_duplicates([j for j in jobs if not j.hidden])))
        elif args.cmd == "offers":
            hc = 1 - max(0.0, min(100.0, args.variable_counted)) / 100
            print(offers_text(compare_offers(db.rows("x_offers"), variable_haircut=hc)))
        elif args.cmd == "audit":
            print(audit_text(db.audit_rows(args.limit)))
        elif args.cmd == "undo":
            done = db.undo_last(args.n)
            print("\n".join(done) if done else "Nothing to undo.")
        elif args.cmd == "queue":
            rows = db.queue_pending()
            print(f"{len(rows)} pending" if rows else "Queue is empty.")
            for r_ in rows:
                print(f" - {r_['title']} @ {r_['company']}")
        elif args.cmd == "bundle-export":
            res = export_bundle(db, args.file, not args.no_profile, _passphrase(args))
            print(f"Wrote {res['path']} (encrypted={res['encrypted']}, saved searches={res['saved_searches']}, rules={res['rules']}, templates={res['templates']}).")
        elif args.cmd == "bundle-import":
            pw = ""
            if Path(args.file).read_bytes().startswith(b"JAAV1"):
                pw = os.environ.get("JAA_PASSPHRASE", "") or __import__("getpass").getpass("Bundle passphrase: ")
            print("\n".join(import_bundle(db, args.file, pw, True, args.overwrite_profile)))
        elif args.cmd == "applyra-import":
            res = import_applyra_workspace(db, args.file, cand, analysis)
            print(f"Applyra workspace imported: {res['jobs_imported']} jobs ({res['jobs_new']} new), {res['interviews_imported']} interviews. Profile updated: {res['profile_updated']}.")
        elif args.cmd == "applyra-export":
            export_applyra_workspace(db, cand, args.file)
            print(f"Applyra workspace exported to {args.file}")
        elif args.cmd == "applyra-serve":
            run_applyra_server(db, cand, analysis, args.host, args.port)
    except (ValueError, core.ResumeError, VaultUnavailable, OSError, smtplib.SMTPException) as exc:
        print("Error:", exc)
        return 1
    finally:
        store.close()
    return 0


# =========================================================================== #
# Self-test (offline: no browser, no display, never touches your real data)
# =========================================================================== #
def self_test() -> int:
    import inspect
    import io
    import unittest
    from contextlib import redirect_stdout
    from unittest import mock

    this = sys.modules[__name__]
    SAMPLE = """Asha Rao
asha@example.com | +91 9876543210 | linkedin.com/in/asharao | github.com/asharao

Summary
Backend engineer with 4 years of experience building APIs.

Experience
Software Engineer, Acme Corp  Jan 2021 - Present
- Built REST APIs with Python, Django and PostgreSQL serving 50000 requests per day
- Reduced latency by 35% using Redis caching
- Automated deployments with Docker and Jenkins

Education
B.Tech Computer Science 2016 - 2020

Skills
Python, Django, Flask, SQL, Docker, Redis, Git, AWS
"""

    def mkjob(i, **kw):
        base = dict(key=f"https://www.naukri.com/job-listings-x-{100000000000 + i}", title=f"Job {i}", company=f"Co{i}", job_id=str(100000000000 + i))
        base.update(kw)
        return core.Job(**base)

    class Base(unittest.TestCase):
        def setUp(self):
            self.tmp = tempfile.TemporaryDirectory()
            self.addCleanup(self.tmp.cleanup)
            d = Path(self.tmp.name)
            self.d = d
            for obj, name, val in ((core, "SETTINGS_FILE", d / "settings.json"), (core, "PROFILE_FILE", d / "candidate.json"), (core, "HOME", d),
                                   (core, "LOG_FILE", d / "app.log"), (this, "TOOLKIT_CONFIG_FILE", d / "toolkit.json"),
                                   (this, "VAULT_FILE", d / "vault.bin"), (this, "REPORT_DIR", d / "reports")):
                pt = mock.patch.object(obj, name, val)
                pt.start()
                self.addCleanup(pt.stop)
            self.store = core.History(d / "t.db")
            self.addCleanup(self.store.close)
            self.db = ExtrasDB(self.store)
            self.analysis = core.analyze_resume_text(SAMPLE)

        def seed(self, *jobs):
            self.store.upsert_jobs(list(jobs))

    class TestFoundation(Base):
        def test_crud_rejects_unknown_columns(self):
            with self.assertRaises(ValueError):
                self.db.insert("x_contacts", name="a", evil="1")
            with self.assertRaises(ValueError):
                self.db.rows("jobs; DROP TABLE jobs")
            rid = self.db.insert("x_contacts", name="Ravi")
            self.db.update("x_contacts", rid, role="Recruiter")
            self.assertEqual(self.db.get("x_contacts", rid)["role"], "Recruiter")
            self.db.delete("x_contacts", rid)
            self.assertIsNone(self.db.get("x_contacts", rid))

        def test_audit_and_undo_29(self):
            j = mkjob(1)
            self.seed(j)
            self.assertTrue(self.db.set_job_field(j.key, "stage", "Saved"))
            self.assertFalse(self.db.set_job_field(j.key, "stage", "Saved"))
            self.assertTrue(self.db.set_job_field(j.key, "favorite", True))
            self.assertEqual(self.db.job_info(j.key)["favorite"], 1)
            with self.assertRaises(ValueError):
                self.db.set_job_field(j.key, "stage", "Nonsense")
            with self.assertRaises(ValueError):
                self.db.set_job_field(j.key, "title", "x")
            with self.assertRaises(ValueError):
                self.db.set_job_field("https://www.naukri.com/none", "stage", "Saved")
            self.assertEqual(len(self.db.undo_last(1)), 1)
            self.assertEqual(self.db.job_info(j.key)["favorite"], 0)
            self.db.undo_last(1)
            self.assertEqual(self.db.job_info(j.key)["stage"], "New")
            self.assertEqual(self.db.undo_last(1), [])
            self.assertIn("(undone)", audit_text(self.db.audit_rows()))

        def test_tags_19(self):
            j = mkjob(1)
            self.seed(j)
            self.db.add_tag(j.key, "  Dream   Job ")
            self.db.add_tag(j.key, "dream job")
            self.assertEqual(self.db.tags_for(j.key), ["dream job"])
            self.assertEqual(self.db.jobs_with_tag("DREAM JOB"), [j.key])
            self.assertEqual(self.db.all_tags(), [("dream job", 1)])
            self.db.remove_tag(j.key, "dream job")
            self.assertEqual(self.db.tags_for(j.key), [])
            with self.assertRaises(ValueError):
                self.db.add_tag(j.key, "  ")

        def test_watchlist_10_and_resume_versions_3(self):
            self.db.watch_add(" Acme Ltd ")
            self.assertEqual(self.db.watch_list(), ["Acme Ltd"])
            with self.assertRaises(ValueError):
                self.db.watch_add("")
            with self.assertRaises(ValueError):
                self.db.add_resume_version("x", str(self.d / "nope.txt"))
            p = self.d / "r.txt"
            p.write_text(SAMPLE, encoding="utf-8")
            self.db.add_resume_version("Backend", str(p))
            self.assertEqual([v["name"] for v in self.db.resume_versions()], ["Backend"])

        def test_config_clamps(self):
            TOOLKIT_CONFIG_FILE.write_text(json.dumps({"alert_min_fit": 999, "schedule_interval_min": 1, "quiet_start": -4, "smtp_port": "x"}))
            c = load_config()
            self.assertEqual((c.alert_min_fit, c.schedule_interval_min, c.quiet_start), (100, 15.0, 0))
            self.assertEqual(c.smtp_port, 465)
            TOOLKIT_CONFIG_FILE.write_text("garbage")
            self.assertEqual(load_config().alert_min_fit, 70)

    class TestResumeAndTemplates(Base):
        def test_templates_2_5(self):
            cand = core.Candidate(full_name="Asha Rao", email="asha@example.com", mobile="9876543210")
            job = mkjob(1, title="Python Developer", company="Acme", tags="Python, Django, Kubernetes")
            r = render_template(self.db, "Cover letter — formal", cand, job, self.analysis)
            self.assertIn("Python Developer", r["body"])
            self.assertIn("Acme", r["body"])
            self.assertIn("Asha Rao", r["body"])
            self.assertIn("python", r["body"].lower())
            self.assertTrue(any(x.startswith("<<ADD") for x in r["todo"]))
            self.assertNotIn("{title}", r["body"])
            r2 = render_template(self.db, "Notice period reply", core.Candidate(), job)
            self.assertTrue(any("your name" in x for x in r2["todo"]))
            with self.assertRaises(ValueError):
                render_template(self.db, "No such", cand)
            self.db.save_template("My|note", "email", "Hi {foo}", "Hello {recipient}, {foo}")
            self.assertIsNotNone(self.db.get_template("My/note"))
            r3 = render_template(self.db, "My/note", cand, job)
            self.assertIn("{foo}", r3["todo"])
            self.db.delete_template("Cover letter — formal")            # built-ins are protected
            self.assertIsNotNone(self.db.get_template("Cover letter — formal"))
            self.db.delete_template("My/note")
            self.assertIsNone(self.db.get_template("My/note"))
            self.assertGreaterEqual(len(self.db.templates("cover_letter")), 3)
            self.db.save_template("Cover letter — short", "cover_letter", "x", "edited body")
            self.db.delete_template("Cover letter — short")
            self.assertEqual(self.db.get_template("Cover letter — short")["body"], "edited body")   # an edited built-in stays protected
            self.assertTrue(self.db.reset_template("Cover letter — short"))
            self.assertIn("I'd like to be considered", self.db.get_template("Cover letter — short")["body"])
            self.assertEqual(cover_letter_for(self.db, job, cand, self.analysis, "Cover letter — short")["subject"].split(" — ")[0], "Python Developer")

        def test_tailor_1_and_role_check_6(self):
            jd = "We need Python, Django, Kubernetes and Terraform. Kubernetes experience is a must. Observability and tracing a plus. Tracing tools."
            res = tailor_resume(jd, self.analysis, SAMPLE)
            self.assertEqual(res["present"], ["python", "django"])
            self.assertEqual(res["missing"], ["kubernetes", "terraform"])
            self.assertEqual(res["coverage"], 50)
            self.assertIn("tracing", dict(res["other_terms"]))
            self.assertIn("kubernetes", tailor_text(res))
            self.assertEqual(tailor_resume("Chef wanted", self.analysis)["coverage"], 0)
            rc = role_keyword_check("python developer", self.analysis)
            self.assertEqual(rc["role"], "Python Developer")
            self.assertIn("flask", rc["have"])
            self.assertIn("fastapi", rc["missing"])
            self.assertEqual(role_keyword_check("devops", self.analysis)["role"], "DevOps Engineer")
            with self.assertRaises(ValueError):
                role_keyword_check("astronaut", self.analysis)

        def test_compare_3_4_and_best_version(self):
            weak = core.analyze_resume_text("Bob\nbob@x.com\nSkills\nExcel, SQL\n" + "filler words " * 30)
            c = compare_resumes(weak, self.analysis, "weak", "strong")
            self.assertEqual(c["better"], "strong")
            self.assertIn("python", c["only_b"])
            self.assertIn("sql", c["both"])
            self.assertIn("weak", diff_text(c))
            self.assertTrue(any(line.startswith("+") for line in text_diff("a\nb", "a\nc")))
            p1, p2 = self.d / "backend.txt", self.d / "data.txt"
            p1.write_text(SAMPLE, encoding="utf-8")
            p2.write_text("Dee\ndee@x.com\nSkills\nPython, Pandas, SQL, Tableau, Power BI, Excel, Statistics, Machine Learning\n", encoding="utf-8")
            self.db.add_resume_version("Backend", str(p1))
            self.db.add_resume_version("Data", str(p2))
            job = mkjob(5, title="Data Analyst", tags="SQL, Tableau, Power BI, Pandas")
            name, fit, matched = best_resume_for_job(job, self.db.resume_versions())
            self.assertEqual(name, "Data")
            self.assertIn("tableau", matched)
            self.assertEqual(choose_resume_versions([job], self.db.resume_versions())[job.key][0], "Data")

    class TestDiscovery(Base):
        def test_import_7(self):
            csv_path = self.d / "li.csv"
            csv_path.write_text('title,company,location,url,description,skills\n'
                                'Python Developer,Acme,Pune,https://example.com/jobs/1?utm=x,Build APIs,"python, django"\n'
                                ',NoTitle,,,,\nData Analyst,Beta,Mumbai,,sql excel,\n', encoding="utf-8")
            res = import_jobs(self.db, str(csv_path), "linkedin", core.Candidate(skills="python"), self.analysis)
            self.assertEqual((res["read"], res["imported"], res["new"]), (3, 2, 2))
            keys = [j.key for j in self.store.load_jobs()]
            self.assertTrue(any(k.startswith("https://example.com/jobs/1?utm=x") for k in keys))
            self.assertTrue(any(k.startswith("imported://linkedin/") for k in keys))
            self.assertFalse(any(core.naukri_url(k) for k in keys))              # never auto-appliable
            self.assertEqual(set(v[0] for v in self.db.meta_map().values()), {"linkedin"})
            self.assertEqual(import_jobs(self.db, str(csv_path), "linkedin")["new"], 0)
            js = self.d / "x.json"
            js.write_text(json.dumps({"jobs": [{"title": "X", "company": "Y", "link": "https://example.com/x"}, "junk"]}))
            self.assertEqual(import_jobs(self.db, str(js))["imported"], 1)
            rss = self.d / "f.xml"
            rss.write_text('<rss><channel><item><title>RSS Job</title><link>https://example.com/r</link><description>&lt;p&gt;hi&lt;/p&gt;</description></item></channel></rss>')
            self.assertEqual(import_jobs(self.db, str(rss))["imported"], 1)

        def test_expand_11(self):
            ideas = expand_search(self.analysis, "Python Developer")
            self.assertTrue(ideas)
            self.assertNotIn("python developer", [i.lower() for i in ideas])

        def test_duplicates_12(self):
            a = mkjob(1, title="Python Developer", company="Acme Technologies Pvt Ltd")
            b = mkjob(2, title="Python Developer", company="ACME Technologies Private Limited")
            c = mkjob(3, title="Senior Python Developer", company="Acme")
            d = mkjob(4, title="Python Developer", company="Other Corp")
            groups = find_duplicates([a, b, c, d])
            self.assertEqual(len(groups), 1)
            self.assertEqual({j.key for j in groups[0]}, {a.key, b.key})
            self.assertIn("Group 1", dupes_text(groups))
            self.assertEqual(dupes_text([]), "No duplicate postings found.")

        def test_red_flags_13(self):
            bad = mkjob(1, title="Data Entry", description="Registration fee of 5000 required. Earn up to Rs 5000 per day. Contact on WhatsApp 9876543210")
            labels = " ".join(f["label"] for f in detect_red_flags(bad))
            self.assertIn("pay money", labels)
            self.assertIn("daily", labels)
            self.assertIn("WhatsApp", labels)
            self.assertGreaterEqual(flag_score(detect_red_flags(bad)), 80)
            low = mkjob(2, title="Architect", experience="8-12 Yrs", salary="2-3 LPA", company="Acme")
            self.assertTrue(any("very low" in f["label"] for f in detect_red_flags(low)))
            clean = mkjob(3, title="Backend Engineer", company="Acme", description="Build services with Python and Postgres.", experience="3-5 Yrs", salary="12-18 LPA")
            self.assertEqual(detect_red_flags(clean), [])
            self.assertIn("No red flags", red_flags_text(clean, []))

        def test_location_14(self):
            home = "Bangalore"
            self.assertEqual(location_score(mkjob(1, location="Bengaluru"), home)["label"], "Local")
            self.assertEqual(location_score(mkjob(2, location="Remote"), home)["score"], 95)
            self.assertEqual(location_score(mkjob(3, location="Gurugram"), "Delhi")["label"], "Nearby city")
            self.assertEqual(location_score(mkjob(4, location="Chennai"), "Pune")["score"], 15)
            self.assertEqual(location_score(mkjob(5, location="Chennai"), "Pune", accept_relocation=True)["score"], 40)
            self.assertEqual(location_score(mkjob(6, location="Somewhere"), home)["label"], "Unknown")
            self.assertEqual(location_score(mkjob(7, location="Pune"), "")["label"], "Unknown")
            self.assertEqual(location_score(mkjob(8, location="Hybrid - Pune"), "Pune")["score"], 85)

        def test_alerts_9_10(self):
            a, b, c, d = (mkjob(i, company=n) for i, n in enumerate(["Acme", "Beta", "Gamma", "Delta"], 1))
            a.fit, b.fit, c.fit, d.fit = 90, 50, 40, 95
            for j in (a, b, c):
                j.is_new = True
            d.is_new, d.hidden = True, True
            got = alert_matches([a, b, c, d], min_fit=80, watch=["beta inc"])
            self.assertEqual([j.company for j, _ in got], ["Acme", "Beta"])
            self.assertIn("watchlist", dict((j.company, r) for j, r in got)["Beta"])
            a.is_new = False
            self.assertEqual([j.company for j, _ in alert_matches([a, b], 80, 0, [], True)], [])
            self.assertEqual(len(alert_matches([a], 80, 0, [], False)), 1)

        def test_scheduler_8(self):
            calls = []
            s = Scheduler(lambda: calls.append(1), interval_min=1, quiet_start=23, quiet_end=7)
            self.assertEqual(s.interval, 15 * 60)                       # clamped to 15 minutes
            self.assertFalse(s.tick(now=s.next_run + 1))               # disabled
            s.enabled = True
            self.assertTrue(s.in_quiet_hours(23) and s.in_quiet_hours(3) and not s.in_quiet_hours(12))
            with mock.patch.object(Scheduler, "in_quiet_hours", return_value=True):
                self.assertFalse(s.tick(now=s.next_run + 1))
            self.assertEqual(calls, [])
            with mock.patch.object(Scheduler, "in_quiet_hours", return_value=False):
                t = s.next_run + 1
                self.assertTrue(s.tick(now=t))
                self.assertFalse(s.tick(now=t + 5))                   # not due again yet
                self.assertTrue(s.tick(now=t + s.interval + 1))
            self.assertEqual(len(calls), 2)

    class TestTracking(Base):
        def test_kanban_15(self):
            a, b, c = mkjob(1, title="A", fit=50), mkjob(2, title="B", fit=90), mkjob(3, title="C", hidden=True)
            a.stage = b.stage = "Saved"
            board = kanban([a, b, c])
            self.assertEqual([j.title for j in board["Saved"]], ["B", "A"])
            self.assertEqual(board["New"], [])
            self.assertEqual(len(kanban([a, b, c], show_hidden=True)["New"]), 1)
            self.seed(a)
            self.assertTrue(move_job(self.db, a.key, "Interview"))
            self.assertEqual(self.db.job_info(a.key)["stage"], "Interview")

        def test_interviews_16_17(self):
            j = mkjob(1, title="Python Dev", company="Acme")
            self.seed(j)
            with self.assertRaises(ValueError):
                add_interview(self.db, j.key, scheduled_at="tomorrow")
            with self.assertRaises(ValueError):
                add_interview(self.db, j.key, duration_min=2)
            with self.assertRaises(ValueError):
                add_interview(self.db)
            rid = add_interview(self.db, j.key, round_name="R1", kind="System design", scheduled_at="2026-11-05 14:30", interviewer="Meera", notes="Bring laptop; docs, links")
            self.assertEqual(self.db.job_info(j.key)["stage"], "Interview")
            up = upcoming_interviews(self.db, 14, now=datetime(2026, 11, 1, 9, 0))
            self.assertEqual(len(up), 1)
            self.assertEqual(upcoming_interviews(self.db, 2, now=datetime(2026, 11, 1)), [])
            self.assertIn("Python Dev", interviews_text(up))
            ics = make_ics(interview_events(self.db.rows("x_interviews")), "Interviews")
            self.assertTrue(ics.startswith("BEGIN:VCALENDAR\r\n") and ics.endswith("END:VCALENDAR\r\n"))
            self.assertIn("DTSTART:20261105T143000", ics)
            self.assertIn("DTEND:20261105T153000", ics)
            self.assertIn("Bring laptop\\; docs\\, links", ics.replace("\r\n ", ""))      # unfold first: long lines are folded at 75 bytes
            self.assertIn("TRIGGER:-PT60M", ics)
            set_interview_outcome(self.db, rid, "Passed")
            self.assertEqual(upcoming_interviews(self.db, 14, now=datetime(2026, 11, 1)), [])
            with self.assertRaises(ValueError):
                set_interview_outcome(self.db, rid, "Maybe")
            st = interview_stats(self.db)
            self.assertEqual(st["pass_rate_by_kind"]["System design"], (1.0, 1))

        def test_ics_format_17(self):
            long_summary = "Interview — " + "é" * 120
            ics = make_ics([{"uid": "u1", "summary": long_summary, "start": datetime(2026, 1, 2, 3, 4), "description": "a\nb"},
                            {"uid": "u2", "summary": "Day", "start": date(2026, 1, 2), "all_day": True}])
            lines = ics.split("\r\n")
            self.assertTrue(all(len(line.encode("utf-8")) <= 75 for line in lines))
            self.assertIn("SUMMARY:" + long_summary, ics.replace("\r\n ", ""))
            self.assertIn("DTSTART;VALUE=DATE:20260102", ics)
            self.assertIn("DTEND;VALUE=DATE:20260103", ics)
            self.assertIn("DESCRIPTION:a\\nb", ics)
            self.assertEqual(ics.count("BEGIN:VEVENT"), 2)
            self.assertNotIn("\n\n", ics.replace("\r\n", "\n"))

        def test_followup_events_17(self):
            j = mkjob(1, title="Dev", company="Acme")
            self.seed(j)
            self.store.add(j, "CONFIRMED", "ok")
            with self.store.lock:
                self.store.connection.execute("UPDATE application_history SET timestamp=? WHERE job_url=?", ("2026-10-01T00:00:00+00:00", j.key))
                self.store.connection.commit()
            self.db.set_job_field(j.key, "stage", "Applied")
            cid = add_contact(self.db, "Ravi", company="Acme")
            ev = followup_events(self.db, 7, today=date(2026, 11, 2))
            self.assertEqual({e["summary"].split(":")[0] if e["summary"].startswith("Follow") else "contact" for e in ev}, {"Follow up", "contact"})
            self.assertTrue(all(e["all_day"] for e in ev))

        def test_contacts_18(self):
            with self.assertRaises(ValueError):
                add_contact(self.db, " ")
            with self.assertRaises(ValueError):
                add_contact(self.db, "A", email="nope")
            with self.assertRaises(ValueError):
                add_contact(self.db, "A", linkedin="https://evil.example/in/a")
            j = mkjob(1, company="Acme Technologies")
            c1 = add_contact(self.db, "Ravi", company="ACME Technologies Pvt Ltd", email="r@acme.com", linkedin="https://linkedin.com/in/ravi")
            c2 = add_contact(self.db, "Sia", company="Beta")
            self.assertEqual({c["name"] for c in contacts_due(self.db, 14, today=date(2026, 11, 2))}, {"Ravi", "Sia"})
            touch_contact(self.db, c1, "2026-11-01")
            self.assertEqual([c["name"] for c in contacts_due(self.db, 14, today=date(2026, 11, 2))], ["Sia"])
            self.assertEqual([c["name"] for c in contacts_for_job(self.db, j.key, j.company)], ["Ravi"])

        def test_offers_20(self):
            j = mkjob(1, company="A")
            self.seed(j)
            with self.assertRaises(ValueError):
                add_offer(self.db, "A", fixed_lpa=0)
            with self.assertRaises(ValueError):
                add_offer(self.db, "A", fixed_lpa=20, joining_date="soon")
            add_offer(self.db, "A", "Dev", fixed_lpa=20, variable_lpa=10, job_url=j.key)
            add_offer(self.db, "B", "Dev", fixed_lpa=28, remote=True, joining_bonus_lpa=2)
            self.assertEqual(self.db.job_info(j.key)["stage"], "Offer")
            offers = self.db.rows("x_offers")
            r = compare_offers(offers)
            self.assertEqual([x["company"] for x in r], ["A", "B"])
            self.assertEqual(r[0]["annual"], 30)
            self.assertEqual(r[1]["first_year"], 30)
            self.assertEqual([x["company"] for x in compare_offers(offers, variable_haircut=1.0)], ["B", "A"])
            self.assertEqual([x["company"] for x in compare_offers(offers, remote_bonus_pct=10)], ["B", "A"])
            self.assertIn("OFFER COMPARISON", offers_text(r))
            self.assertEqual(offers_text([]), "No offers recorded.")

        def test_rejections_21(self):
            j = mkjob(1, title="Dev", company="Acme", tags="Kubernetes, Terraform")
            self.seed(j)
            log_rejection(self.db, j.key, "Skills mismatch", "Interview")
            self.assertEqual(self.db.job_info(j.key)["stage"], "Rejected")
            for i in range(4):
                log_rejection(self.db, "", "Skills mismatch", "Applied", title=f"T{i}", company="Acme Inc")
            with self.assertRaises(ValueError):
                log_rejection(self.db, "")
            pat = rejection_patterns(self.db, [j], self.analysis)
            self.assertEqual(pat["total"], 5)
            self.assertEqual(len(pat["repeat_companies"]), 1)                    # "Acme" and "Acme Inc" are the same company
            self.assertEqual(pat["repeat_companies"][0][1], 5)
            self.assertTrue(any("Skills mismatch" in i for i in pat["insights"]))
            self.assertIn("kubernetes", [s for s, _ in pat["missing_skills"]])
            self.assertIn("REJECTION LOG", patterns_text(pat))
            empty_store = core.History(self.d / "empty.db")
            self.addCleanup(empty_store.close)
            self.assertIn("Nothing logged", patterns_text(rejection_patterns(ExtrasDB(empty_store))))

    class TestAnalytics(Base):
        def test_charts_22(self):
            for svg in (svg_bar_chart(["a", "b"], [1, 3], "T"), svg_hbar_chart([("x", 2.5), ("y", 1)], "H"), svg_line_chart(["d1", "d2", "d3"], {"s": [1, 2, 3]}, "L"),
                        svg_bar_chart([], [], "empty"), svg_hbar_chart([], "e"), svg_line_chart([], {}, "e")):
                ET.fromstring(svg)
            evil = svg_bar_chart(["<script>alert(1)</script>"], [1], "<b>x</b>")
            ET.fromstring(evil)
            self.assertNotIn("<script>", evil)
            self.assertIn("&lt;script&gt;", evil)

        def test_funnel_23(self):
            a, b, c, d, e = (mkjob(i) for i in range(1, 6))
            e.key = "imported://linkedin/abc"
            self.seed(a, b, c, d, e)
            self.store.add(a, "CONFIRMED", "x")
            self.store.add(b, "UI_EVIDENCE_ONLY", "x")
            self.store.add(c, "ATTEMPTED", "x")                          # click only: not counted
            self.db.set_meta(a.key, resume_version="Backend")
            self.db.set_meta(b.key, resume_version="Data")
            self.db.set_meta(e.key, source="linkedin")
            self.db.set_job_field(e.key, "stage", "Applied")
            add_interview(self.db, a.key, scheduled_at="2026-11-05")
            add_offer(self.db, "Co1", fixed_lpa=20, job_url=a.key)
            overall = funnel(self.db)[0]
            self.assertEqual((overall["applied"], overall["interviewed"], overall["offered"]), (3, 1, 1))
            self.assertTrue(overall["small_sample"])
            by_rv = {r["group"]: r for r in funnel(self.db, "resume_version")}
            self.assertEqual(by_rv["Backend"]["interviewed"], 1)
            self.assertEqual(by_rv["Data"]["interviewed"], 0)
            self.assertEqual(by_rv["Data"]["interview_rate"], 0.0)
            self.assertIsNone(by_rv["Data"]["offer_rate"])
            by_src = {r["group"]: r["applied"] for r in funnel(self.db, "source")}
            self.assertEqual(by_src, {"naukri": 2, "linkedin": 1})
            with self.assertRaises(ValueError):
                funnel(self.db, "bogus")
            self.assertIn("treat the rates as anecdotes", funnel_text(funnel(self.db)))
            self.assertIn("No applications", funnel_text([]))

        def test_salary_24(self):
            jobs = [mkjob(i, title="Python Developer", salary="10-20 LPA", location="Pune", experience="3-5 Yrs") for i in range(3)]
            jobs += [mkjob(10 + i, title="Data Analyst", salary="6-8 LPA") for i in range(2)]
            jobs += [mkjob(20, title="Python Developer", salary="Not disclosed")]
            res = salary_insights(jobs, "role")
            self.assertEqual([(r["group"], r["n"], r["median"]) for r in res["rows"]], [("Python Developer", 3, 15.0)])
            self.assertEqual(res["too_few"], [("Data Analyst", 2)])
            self.assertEqual((res["jobs"], res["with_salary"]), (6, 5))
            self.assertEqual(salary_insights(jobs, "city")["rows"][0]["group"], "Pune")
            self.assertEqual(salary_insights(jobs, "experience")["rows"][0]["group"], "2–5 yrs")
            with self.assertRaises(ValueError):
                salary_insights(jobs, "x")
            self.assertIn("advertised pay", salary_text(res))
            self.assertIn("Not enough", salary_text(salary_insights([])))

        def test_trends_25(self):
            self.assertFalse(skill_trends(self.db)["ready"])
            self.assertIn("at least 4", trends_text(skill_trends(self.db)))
            today = date.today()
            for k in range(5):
                day = (today - timedelta(days=4 - k)).isoformat()
                jobs = []
                for i in range(10):
                    hot = i < (2 if k < 2 else 6)
                    jobs.append(mkjob(1000 * k + i, tags="Kubernetes" if hot else "", title="Engineer", last_seen=day + "T00:00:00+00:00"))
                self.assertGreater(snapshot_skills(self.db, jobs, day), 0)
            tr = skill_trends(self.db)
            self.assertTrue(tr["ready"])
            self.assertEqual(tr["rising"][0][0], "kubernetes")
            self.assertGreater(tr["rising"][0][1], 20)
            self.assertEqual(tr["series"]["kubernetes"][-1], 60.0)
            self.assertEqual(snapshot_skills(self.db, [], "2020-01-01"), 0)
            self.assertIn("Rising", trends_text(tr))

        def test_weekly_report_26(self):
            j = mkjob(1, title="<b>Evil</b> Dev", company="Acme & Co")
            self.seed(j)
            self.store.add(j, "CONFIRMED", "ok")
            j.fit, j.first_seen = 88, core.utcnow()
            rep = build_weekly_report(self.db, 7, [j], self.analysis)
            self.assertEqual(len(rep["applied"]), 1)
            self.assertEqual(len(rep["per_day"]), 7)
            self.assertEqual(sum(n for _, n in rep["per_day"]), 1)
            page = weekly_report_html(rep)
            self.assertIn("&lt;b&gt;Evil&lt;/b&gt;", page)
            self.assertNotIn("<b>Evil</b>", page)
            self.assertIn("Acme &amp; Co", page)
            path = save_report(page)
            self.assertTrue(path.exists())
            ET.fromstring("<root>" + re.search(r"<svg.*?</svg>", page, re.S).group(0) + "</root>")
            with self.assertRaises(ValueError):
                send_report_email(page, ToolkitConfig())
            with mock.patch.dict(os.environ, {}, clear=False):
                os.environ.pop("JAA_SMTP_PASSWORD", None)
                with self.assertRaises(ValueError):
                    send_report_email(page, ToolkitConfig(smtp_host="h", smtp_user="u@x.com", report_to="v@x.com"))

        def test_text_views_empty(self):
            for txt in (trends_text(skill_trends(self.db)), offers_text([]), interviews_text([]), audit_text([]),
                        patterns_text(rejection_patterns(self.db)), funnel_text([]), salary_text(salary_insights([]))):
                self.assertIsInstance(txt, str)
                self.assertTrue(txt)

    class TestReliability(Base):
        def test_health_27(self):
            good = {"cards": 20, "groups": {"a": 20}, "fields": {"title link": 20, "company": 20, "location": 18, "experience": 15, "salary": 10, "posted": 20}}
            self.assertEqual(evaluate_search_health(good)["level"], "OK")
            self.assertEqual(evaluate_search_health({"cards": 0, "fields": {}})["level"], "FAIL")
            warn = dict(good, fields=dict(good["fields"], company=5))
            self.assertEqual(evaluate_search_health(warn)["level"], "WARN")
            fail = dict(good, fields=dict(good["fields"], **{"title link": 10}))
            self.assertEqual(evaluate_search_health(fail)["level"], "FAIL")
            nosal = dict(good, fields=dict(good["fields"], salary=0))
            self.assertEqual(evaluate_search_health(nosal)["level"], "WARN")
            self.assertEqual(evaluate_job_health({"apply": 1, "description": 1})["level"], "OK")
            self.assertEqual(evaluate_job_health({"apply": 0, "external": 0, "applied_text": False, "description": 0})["level"], "WARN")

            class FakePage:
                def evaluate(self, js, arg=None):
                    return good if arg is not None else {"apply": 1, "external": 0, "applied_text": False, "description": 1}
            self.assertEqual(run_health_probe(FakePage(), "search")["level"], "OK")
            self.assertEqual(run_health_probe(FakePage(), "job")["level"], "OK")
            self.assertIn("Search page: OK", health_report_text(evaluate_search_health(good), "Search page"))

        def test_selectors_mirror_main_app_27(self):
            for name, sel in HEALTH_FIELD_SELECTORS.items():
                self.assertIn(sel, core.JS_EXTRACT, f"health check selector for '{name}' drifted from the main app")
            for sel in HEALTH_CARD_SELECTORS:
                self.assertIn(sel, core.CARD_CSS)
            self.assertIn("button#apply-button", inspect.getsource(core.BrowserWorker.apply_one))

        def test_queue_28(self):
            a, b, c = mkjob(1), mkjob(2), mkjob(3)
            self.seed(a, b)
            self.assertEqual(self.db.queue_add([a, b, c]), 3)
            self.assertEqual(self.db.queue_add([a]), 0)                   # no duplicates
            self.store.add(a, "ATTEMPTED", "clicked, then the app crashed")
            todo = resumable_queue_jobs(self.db, self.store.load_jobs())
            self.assertEqual([j.key for j in todo], [b.key])             # a: attempted → never re-clicked; c: unknown job
            statuses = {r["job_url"]: r["status"] for r in self.db.rows("x_queue")}
            self.assertEqual(statuses[a.key], "skipped")
            self.assertEqual(statuses[c.key], "missing")
            sync_queue_with_result(self.db, b.key, "CONFIRMED", "ok")
            self.assertEqual(self.db.queue_pending(), [])
            self.assertEqual(self.db.queue_clear_done(), 3)

        def test_worker_is_subclass_and_safe(self):
            self.assertTrue(issubclass(ToolkitWorker, core.BrowserWorker))
            w = ToolkitWorker(queue.Queue(), queue.Queue(), self.store, core.Settings())
            w.jobs.put(("nonsense", {}))
            w.jobs.put(("quit", {}))
            with mock.patch.object(core.LOG, "error"):
                w.run()                                                 # unknown command reports an error, then exits cleanly
            kinds = []
            while not w.events.empty():
                kinds.append(w.events.get()[0])
            self.assertIn("error", kinds)

        def test_vault_30(self):
            try:
                blob = encrypt_blob("correct horse", b"secret notes")
            except VaultUnavailable:
                self.skipTest("cryptography not installed")
            self.assertNotIn(b"secret", blob)
            self.assertEqual(decrypt_blob("correct horse", blob), b"secret notes")
            with self.assertRaises(ValueError):
                decrypt_blob("wrong passphrase", blob)
            with self.assertRaises(ValueError):
                decrypt_blob("correct horse", blob[:-3] + b"xyz")
            with self.assertRaises(ValueError):
                decrypt_blob("correct horse", b"not a vault")
            with self.assertRaises(ValueError):
                encrypt_blob("short", b"x")
            vault_save("correct horse", {"notes": "floor 18 LPA"})
            self.assertEqual(vault_load("correct horse")["notes"], "floor 18 LPA")
            self.assertNotIn(b"18 LPA", VAULT_FILE.read_bytes())
            with self.assertRaises(ValueError):
                vault_load("nope nope nope")
            out = self.d / "b.jaabak"
            encrypted_backup(self.db, str(out), "correct horse")
            zpath = decrypt_backup(str(out), str(self.d / "b.zip"), "correct horse")
            with zipfile.ZipFile(zpath) as zf:
                self.assertIn("history.sqlite3", zf.namelist())

        def test_bundle_32(self):
            core.save_settings(core.Settings(daily_limit=7, saved_searches=[{"name": "py", "query": "python", "city": "Pune", "experience": "", "days": "Any", "pages": 2}]))
            core.save_candidate(core.Candidate(full_name="Asha", email="a@x.com"))
            self.db.save_template("Mine", "email", "S", "Body {name}")
            self.db.watch_add("Acme")
            path = self.d / "b.jaabundle"
            res = export_bundle(self.db, str(path))
            self.assertEqual((res["saved_searches"], res["templates"]), (1, 1))
            core.save_settings(core.Settings())
            core.save_candidate(core.Candidate(full_name="Someone Else"))
            self.db.delete_template("Mine")
            self.db.watch_remove("Acme")
            report = import_bundle(self.db, str(path))
            self.assertTrue(report)
            s = core.load_settings()
            self.assertEqual((s.daily_limit, s.saved_searches[0]["query"]), (7, "python"))
            self.assertIsNotNone(self.db.get_template("Mine"))
            self.assertEqual(self.db.watch_list(), ["Acme"])
            c = core.load_candidate()
            self.assertEqual((c.full_name, c.email), ("Someone Else", "a@x.com"))      # only EMPTY fields filled
            import_bundle(self.db, str(path), overwrite_profile=True)
            self.assertEqual(core.load_candidate().full_name, "Asha")
            doc = json.loads(path.read_text())
            doc["payload"]["settings"]["daily_limit"] = 999
            bad = self.d / "bad.jaabundle"
            bad.write_text(json.dumps(doc))
            with self.assertRaises(ValueError):
                import_bundle(self.db, str(bad))
            doc2 = json.loads(path.read_text())
            doc2["version"] = 99
            newer = self.d / "newer.jaabundle"
            newer.write_text(json.dumps(doc2))
            with self.assertRaises(ValueError):
                import_bundle(self.db, str(newer))
            junk = self.d / "junk.jaabundle"
            junk.write_text("hello")
            with self.assertRaises(ValueError):
                import_bundle(self.db, str(junk))
            try:
                export_bundle(self.db, str(self.d / "enc.jaabundle"), True, "correct horse")
            except VaultUnavailable:
                return
            self.assertTrue((self.d / "enc.jaabundle").read_bytes().startswith(b"JAAV1"))
            with self.assertRaises(ValueError):
                import_bundle(self.db, str(self.d / "enc.jaabundle"))
            self.assertTrue(import_bundle(self.db, str(self.d / "enc.jaabundle"), "correct horse"))

        def test_notify_31_never_raises(self):
            with mock.patch.object(subprocess, "Popen", side_effect=OSError("boom")), mock.patch("builtins.print"):
                self.assertFalse(notify("t", "m" * 1000))

    class TestCli(Base):
        def run_cli(self, *args):
            buf = io.StringIO()
            with redirect_stdout(buf):
                code = cli_main(["--db", str(self.d / "cli.db"), *args])
            return code, buf.getvalue()

        def test_commands(self):
            for cmd in (["funnel"], ["salary"], ["trends"], ["flags"], ["dupes"], ["offers"], ["audit"], ["queue"], ["template"]):
                code, out = self.run_cli(*cmd)
                self.assertEqual(code, 0, (cmd, out))
                self.assertTrue(out.strip())
            code, out = self.run_cli("template", "Status check")
            self.assertIn("Subject: Checking in", out)
            code, out = self.run_cli("template", "Nope")
            self.assertEqual(code, 1)
            self.assertIn("Unknown template", out)
            code, out = self.run_cli("report", "--out", str(self.d / "r.html"))
            self.assertEqual(code, 0)
            self.assertTrue((self.d / "r.html").exists())
            code, out = self.run_cli("ics", "interviews", str(self.d / "i.ics"))
            self.assertIn("Wrote 0 event(s)", out)
            csvp = self.d / "j.csv"
            csvp.write_text("title,company\nPython Dev,Acme\n")
            code, out = self.run_cli("import", str(csvp), "--source", "indeed")
            self.assertIn("imported 1", out)
            code, out = self.run_cli("bundle-export", str(self.d / "x.jaabundle"))
            self.assertEqual(code, 0)
            code, out = self.run_cli("bundle-import", str(self.d / "x.jaabundle"))
            self.assertEqual(code, 0)
            exp_p = self.d / "applyra_ws.json"
            code, out = self.run_cli("applyra-export", str(exp_p))
            self.assertEqual(code, 0)
            self.assertTrue(exp_p.exists())
            code, out = self.run_cli("applyra-import", str(exp_p))
            self.assertEqual(code, 0)
            self.assertIn("Applyra workspace imported", out)
            code, out = self.run_cli("undo")
            self.assertIn("Nothing to undo", out)

    loader = unittest.defaultTestLoader
    suite = unittest.TestSuite()
    for case in (TestFoundation, TestResumeAndTemplates, TestDiscovery, TestTracking, TestAnalytics, TestReliability, TestCli):
        suite.addTests(loader.loadTestsFromTestCase(case))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


def main(argv: list[str] | None = None) -> int:
    return cli_main(argv)


if __name__ == "__main__":
    sys.exit(main())
