#!/usr/bin/env python3
"""Who on the crew is working: Claude Code's SubagentStart/SubagentStop hooks feed this, it keeps .crew.json.

Wired in ~/.claude/settings.json as `crew-hook.py start` / `crew-hook.py stop`, reading the hook's JSON on stdin.
`crew-hook.py sweep` just tidies (what board.py and the MCP server do before reading). The status rules, and why a
sweep is needed at all, are in CLAUDE.md.

.crew.json:
  open    {agent_id: run}           agents running right now (several Hexx copies can run at once)
  agents  {who: {"history": [run]}} finished runs, newest first
  run = {id, who, task, project, cwd, started, ended, status, reason, transcript}
"""
import fcntl, json, os, subprocess, sys, tempfile, time

HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.environ.get("CREW_STATE") or os.path.join(HERE, ".crew.json")
AGENTS_DIR = os.path.expanduser("~/.claude/agents")
STUCK_AFTER = 15 * 60
LOST_AFTER = 3 * 3600      # open, silent this long, no transcript telling us why: the session died with it running
HISTORY = 8


def is_crew(who):   # built-in agents (Explore, Plan, general-purpose...) have no file here
    return bool(who) and os.path.isfile(os.path.join(AGENTS_DIR, who + ".md"))


def agent_files(transcript_path, agent_id):
    base = os.path.join(transcript_path[:-len(".jsonl")] if transcript_path.endswith(".jsonl") else transcript_path,
                        "subagents", "agent-" + agent_id)
    return base + ".meta.json", base + ".jsonl"


def read_meta(path):
    try: return json.load(open(path, encoding="utf-8"))
    except Exception: return {}


def project_of(cwd):   # the repo, not the worktree: the git common dir's parent
    try:
        out = subprocess.run(["git", "-C", cwd, "rev-parse", "--path-format=absolute", "--git-common-dir"],
                             capture_output=True, text=True, timeout=3)
        if out.returncode == 0 and out.stdout.strip():
            return os.path.basename(os.path.dirname(out.stdout.strip().rstrip("/")))
    except Exception: pass
    return os.path.basename(os.path.normpath(cwd or "")) or "?"


def last_turn(path):
    """The transcript's last user/assistant line (attachments and the like come after it), read from the tail."""
    try:
        with open(path, "rb") as f:
            f.seek(0, 2); f.seek(max(0, f.tell() - 65536))
            lines = f.read().decode("utf-8", "replace").splitlines()
    except Exception: return None
    for line in reversed(lines):
        try: o = json.loads(line)
        except Exception: continue
        if o.get("type") in ("user", "assistant"): return o
    return None


def interrupted(o):
    if not o or o.get("type") != "user": return False
    content = (o.get("message") or {}).get("content")
    text = content if isinstance(content, str) else " ".join(c.get("text", "") for c in content or [] if isinstance(c, dict))
    return "[Request interrupted" in text


def outcome(path):   # status, reason for an agent that stopped on its own
    o = last_turn(path)
    if interrupted(o): return "failed", "stopped"
    if o and o.get("type") == "assistant" and o.get("isApiErrorMessage"): return "failed", "api error"
    return "done", None


# ── state ───────────────────────────────────────────────────────────────────
class Locked:
    """Two agents starting in the same second used to interleave their writes, so every change holds a lock."""
    def __enter__(self):
        self.f = open(STATE + ".lock", "w"); fcntl.flock(self.f, fcntl.LOCK_EX)
        try: self.data = json.load(open(STATE, encoding="utf-8"))
        except Exception: self.data = {}
        self.data.setdefault("open", {}); self.data.setdefault("agents", {})
        return self.data

    def __exit__(self, *exc):
        if not exc[0]:
            self.data["updated"] = int(time.time())
            fd, tmp = tempfile.mkstemp(dir=os.path.dirname(STATE), prefix=".crew.", suffix=".tmp")
            with os.fdopen(fd, "w", encoding="utf-8") as f: json.dump(self.data, f, indent=1)
            os.replace(tmp, STATE)
        fcntl.flock(self.f, fcntl.LOCK_UN); self.f.close()


def close(data, agent_id, status, reason=None):
    run = data["open"].pop(agent_id, None)
    if not run: return
    run.update(status=status, reason=reason, ended=int(time.time()))
    hist = data["agents"].setdefault(run["who"], {}).setdefault("history", [])
    hist.insert(0, run); del hist[HISTORY:]


def sweep(data):
    """Close runs that ended without a SubagentStop (stopped agents send none) and fill in late task names."""
    now = time.time()
    for agent_id, run in list(data["open"].items()):
        if not run.get("task") and run.get("meta"):
            run["task"] = read_meta(run["meta"]).get("description", "")
        path = run.get("transcript", "")
        if interrupted(last_turn(path)): close(data, agent_id, "failed", "stopped"); continue
        if read_meta(run.get("meta", "")).get("finished"): close(data, agent_id, *outcome(path)); continue
        try: quiet = now - os.path.getmtime(path)
        except OSError: quiet = now - run["started"]
        if quiet > LOST_AFTER: close(data, agent_id, "failed", "lost")


def on_start(p):
    who = p.get("agent_type", "")
    if not is_crew(who) or not p.get("agent_id"): return
    meta, transcript = agent_files(p.get("transcript_path", ""), p["agent_id"])
    with Locked() as data:
        data["open"][p["agent_id"]] = {
            "id": p["agent_id"], "who": who, "task": read_meta(meta).get("description", ""),   # meta.json may not exist yet; sweep fills it
            "project": project_of(p.get("cwd", "")), "cwd": p.get("cwd", ""), "started": int(time.time()),
            "status": "working", "meta": meta, "transcript": transcript}
        sweep(data)


def on_stop(p):
    agent_id = p.get("agent_id")
    if not is_crew(p.get("agent_type", "")): return
    with Locked() as data:
        run = data["open"].get(agent_id)
        if run:
            path = p.get("agent_transcript_path") or run["transcript"]
            if not run.get("task"): run["task"] = read_meta(run["meta"]).get("description", "")
            close(data, agent_id, *outcome(path))
        sweep(data)


# ── reading it (board.py and server.py load this file) ──────────────────────
def load(tidy=True):
    if tidy and os.path.exists(STATE):
        with Locked() as data: sweep(data)
    try: return json.load(open(STATE, encoding="utf-8"))
    except Exception: return {"open": {}, "agents": {}}


def status_of(run, now=None):   # an open run is working, or stuck once its transcript has gone quiet
    if run.get("ended"): return run["status"]
    try: quiet = (now or time.time()) - os.path.getmtime(run["transcript"])
    except OSError: quiet = (now or time.time()) - run["started"]
    return "stuck" if quiet > STUCK_AFTER else "working"


def roster(data=None):
    """{who: {status, runs: [open runs], last: newest finished run}} for every agent that has done anything."""
    data = data or load()
    out = {}
    for run in data["open"].values():
        out.setdefault(run["who"], {"runs": []})["runs"].append(dict(run, status=status_of(run)))
    for who, a in data["agents"].items():
        out.setdefault(who, {"runs": []})["last"] = (a.get("history") or [None])[0]
    for who, a in out.items():
        live = [r["status"] for r in a["runs"]]
        a["status"] = ("working" if "working" in live else "stuck") if live else (a["last"] or {}).get("status", "idle")
    return out


if __name__ == "__main__":
    try:
        cmd = sys.argv[1] if len(sys.argv) > 1 else ""
        if cmd == "sweep": load()
        else:
            payload = json.loads(sys.stdin.read() or "{}")
            {"start": on_start, "stop": on_stop}.get(cmd, lambda p: None)(payload)
    except Exception as e:   # a hook must never get in Claude's way
        print(f"crew-hook: {e}", file=sys.stderr)
    sys.exit(0)
