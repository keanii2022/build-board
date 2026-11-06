#!/usr/bin/env python3
"""Build board data script.

Finds every project under SCAN_DIRS on its own, reads each one's PLAN.md,
and prints one JSON object sorted by most recent activity (newest first).
The widget (index.jsx) runs this every few seconds.

Every folder under SCAN_DIRS is a project. The widget decides what's on the
board and what sits in the chest; a new folder lands in the chest.

Try it by hand:   python3 board.py
"""
import json, os, re, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
HOME = os.path.expanduser("~")

# ── Settings ────────────────────────────────────────────────────────────────
SCAN_DIRS = [os.environ.get("BOARD_SCAN") or f"{HOME}/Projects"]  # folders whose subfolders are projects
# Folder names never read. Put one name per line in a `.skip` file next to this
# script (it is gitignored, so your list stays yours).
IGNORE = set()
if os.path.exists(f"{HERE}/.skip"):
    IGNORE = {l.strip() for l in open(f"{HERE}/.skip") if l.strip() and not l.startswith("#")}
FRESH_DAYS = 7                        # a repo with no plan still shows if it had a commit this recently
PLAN_FILES = ["PLAN.md", "docs/PLAN.md", "notes/PLAN.md", "NOTES.md"]   # first one that has steps wins
TOOLS_JSON = os.path.join(HERE, "tools.json")   # the hand-kept track with no repo
PUSH_MARKER = os.path.join(HERE, ".last-push")  # a pre-push git hook writes the repo name here
PET_FILE = os.path.join(HERE, ".pet.json")      # the pet's memory, written by the widget


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def stop_at_later(text):
    """Ignore everything after a '## Later' / '## Parked' heading (future ideas, not steps)."""
    m = re.search(r"^## (?:Later|Parked)\b", text, re.M)
    return text[: m.start()] if m else text


STEP_HEAD = re.compile(r"^(?:#{2,3} ([A-Za-z]{0,2}[0-9]+[a-z0-9]*(?:\.[0-9]+)?)\. (.+)|- \[([ xX])\] \*\*Step ([^:*]+): ([^*]+)\*\*|#{2,3} Step ([0-9][0-9.]*)\s*[—:–-]\s*(.+))", re.M)
DONE_WORDS = re.compile(r"\b(done|complete|completed|shipped|finished)\b|✓|✅", re.I)


def parse_plan(text):
    """Works for three styles:
       - '- [x] **Step 3: Gate**' checkboxes (approval-desk)
       - '## 2. Name' / '### 2. Name' or '- [ ] **Step 2: Name**' followed by a '**Status:** done|current|…' line
       - '## Step 6 — name' headings (build notes); 'done' / '✓' in the heading = done
       Status line wins when present; otherwise the checkbox or the heading; the first open step is 'current'."""
    text = stop_at_later(text)
    heads = list(STEP_HEAD.finditer(text))
    steps, any_status = [], False
    for i, h in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else len(text)
        body = text[h.start():end]
        sm = re.search(r"\*\*Status:\*\*\s*([a-z-]+)", body)
        if sm:
            any_status = True
            status = sm.group(1) if sm.group(1) in ("done", "current") else "pending"
        elif h.group(6):
            status = "done" if DONE_WORDS.search(h.group(7)) else "pending"
        else:
            status = "done" if (h.group(3) or "").lower() == "x" else "pending"
        n = (h.group(1) or h.group(4) or h.group(6)).strip()
        name = (h.group(2) or h.group(5) or h.group(7)).strip()
        steps.append({"n": n, "name": name, "status": status})
    if steps and not any_status and not any(s["status"] == "current" for s in steps):
        for s in steps:
            if s["status"] == "pending":
                s["status"] = "current"
                break
    return steps


def git(repo, *args):
    try:
        return subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True, timeout=5).stdout.strip()
    except Exception:
        return ""


def git_info(repo):
    if not os.path.isdir(os.path.join(repo, ".git")):
        return {}
    out = git(repo, "log", "-1", "--format=%ct|%s")
    ts, _, msg = out.partition("|")
    if not ts:
        return {"isRepo": True}
    days_out = git(repo, "log", "--since=14.days", "--format=%cd", "--date=short").split()
    labels = [time.strftime("%Y-%m-%d", time.localtime(time.time() - 86400 * i)) for i in range(13, -1, -1)]
    days = [days_out.count(d) for d in labels]
    first = git(repo, "log", "--reverse", "--format=%ct").split()
    first = int(first[0]) if first else int(ts)
    dates = set(git(repo, "log", "--since=120.days", "--format=%cd", "--date=short").split())
    return {"isRepo": True, "commitAt": int(ts), "commitMsg": msg, "firstCommitAt": first,
            "commitsWeek": sum(days[-7:]), "commitsToday": days[-1], "days": days, "dates": sorted(dates)}


def summarize(steps):
    cur = next((s for s in steps if s["status"] == "current"), None)
    return {"done": sum(1 for s in steps if s["status"] == "done"), "total": len(steps),
            "current": f"{cur['n']}. {cur['name']}" if cur else None, "steps": steps}


def scan():
    now = time.time()
    out = []
    for base in SCAN_DIRS:
        if not os.path.isdir(base):
            continue
        for name in sorted(os.listdir(base)):
            path = os.path.join(base, name)
            if name.startswith(".") or name in IGNORE or not os.path.isdir(path):
                continue
            plan, steps = None, []
            for cand in PLAN_FILES:
                f = os.path.join(path, cand)
                if not os.path.isfile(f):
                    continue
                try:
                    got = parse_plan(read(f))
                except Exception:
                    got = []
                if got or cand.endswith("PLAN.md") and plan is None:
                    plan, steps = f, got
                if got:
                    break
            info = git_info(path)
            entry = {"id": name, "name": name, "path": path, "ok": True, "hasPlan": bool(plan)}
            entry.update(summarize(steps))
            entry.update(info)
            st = os.stat(path)
            born = getattr(st, "st_birthtime", st.st_mtime)
            plan_m = os.stat(plan).st_mtime if plan else 0
            commit_at = info.get("commitAt", 0)
            entry["activityAt"] = int(max(commit_at, plan_m, 0 if commit_at else born))
            entry["isNew"] = (now - info.get("firstCommitAt", born)) < FRESH_DAYS * 86400
            out.append(entry)
    return out


def tools_track():
    try:
        data = json.loads(read(TOOLS_JSON))
        steps = []
        for s in data.get("steps", []):
            st = s.get("status", "pending")
            steps.append({"n": str(s.get("n", "")), "name": s.get("name", ""),
                          "status": st if st in ("done", "current") else "pending"})
        entry = {"id": "tools", "name": data.get("name", "AI Engineer Tools"), "path": TOOLS_JSON,
                 "ok": True, "hasPlan": True, "activityAt": int(os.stat(TOOLS_JSON).st_mtime), "isNew": False}
        entry.update(summarize(steps))
        return entry
    except Exception as e:
        return {"id": "tools", "name": "AI Engineer Tools", "path": TOOLS_JSON, "ok": False, "error": str(e),
                "done": 0, "total": 0, "steps": [], "activityAt": 0, "isNew": False}


def screens():
    """Every display, in points, straight from CoreGraphics (no subprocess). [] if anything fails."""
    try:
        import ctypes
        cg = ctypes.cdll.LoadLibrary("/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics")
        class Rect(ctypes.Structure):
            _fields_ = [("x", ctypes.c_double), ("y", ctypes.c_double), ("w", ctypes.c_double), ("h", ctypes.c_double)]
        cg.CGDisplayBounds.restype = Rect; cg.CGDisplayBounds.argtypes = [ctypes.c_uint32]
        cg.CGDisplayIsMain.restype = ctypes.c_bool; cg.CGDisplayIsMain.argtypes = [ctypes.c_uint32]
        n = ctypes.c_uint32(); ids = (ctypes.c_uint32 * 16)()
        cg.CGGetActiveDisplayList(16, ids, ctypes.byref(n))
        out = []
        for i in range(n.value):
            b = cg.CGDisplayBounds(ids[i])
            out.append({"id": int(ids[i]), "x": int(b.x), "y": int(b.y), "w": int(b.w), "h": int(b.h), "main": bool(cg.CGDisplayIsMain(ids[i]))})
        return out
    except Exception:
        return []


def streak(dates):
    """Days in a row with a commit in any repo, counting back from today.
       A streak is still alive if today has no commit yet (it ended yesterday)."""
    day = time.time()
    if time.strftime("%Y-%m-%d", time.localtime(day)) not in dates:
        day -= 86400
    n = 0
    while time.strftime("%Y-%m-%d", time.localtime(day)) in dates:
        n += 1
        day -= 86400
    return n


def main():
    projects = scan() + [tools_track()]
    projects.sort(key=lambda p: p.get("activityAt", 0), reverse=True)
    result = {"generatedAt": int(time.time()), "projects": projects}
    result["screens"] = screens()
    result["today"] = sum(p.get("commitsToday", 0) for p in projects)
    result["activeToday"] = sum(1 for p in projects if p.get("commitsToday"))
    result["streak"] = streak(set().union(*[set(p.pop("dates", [])) for p in projects]))
    try:
        st = os.stat(PUSH_MARKER)
        result["lastPush"] = {"at": int(st.st_mtime), "repo": read(PUSH_MARKER).strip()}
    except OSError:
        result["lastPush"] = None
    try:
        result["pet"] = json.loads(read(PET_FILE))
    except Exception:
        result["pet"] = None
    json.dump(result, sys.stdout)


if __name__ == "__main__":
    main()
