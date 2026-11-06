#!/usr/bin/env python3
"""Build Board MCP server, written by hand (no packages).

MCP = the plug format Claude uses for outside tools. Over stdio it is JSON-RPC, one
JSON object per line. Claude sends `initialize`, then asks `tools/list`, then calls
`tools/call` whenever it wants a tool. That's all this file does.

Tools:
  board              what the desktop widget sees: every project, progress, next step, pet coins
  steps  project     one project's full step list
  tick   project n   mark a step done (or undo it). The widget feeds the pet on its next refresh
  pet                mood, coins, what it owns, what it can afford, what's in the chest

Register once (then open a new Claude Code chat):
  claude mcp add -s user build-board -- python3 "$HOME/Library/Application Support/Übersicht/widgets/build-board/server.py"
Try it by hand:
  echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python3 server.py
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
BOARD = os.path.join(HERE, "board.py")
TOOLS_JSON = os.path.join(HERE, "tools.json")
SPRITES = os.path.join(HERE, "sprites.jsx")
PROTOCOL = "2025-06-18"


# ── the board ───────────────────────────────────────────────────────────────
def board_data():
    out = subprocess.run([sys.executable, BOARD], capture_output=True, text=True, timeout=20, cwd=HERE)
    return json.loads(out.stdout)


def find_project(data, name):
    """Match a project by id or shown name, loosely ("approval" finds approval-desk)."""
    q = (name or "").strip().lower()
    for p in data["projects"]:
        if q in (p["id"].lower(), p["name"].lower()):
            return p
    for p in data["projects"]:
        if q and (q in p["id"].lower() or q in p["name"].lower()):
            return p
    return None


def summary_line(p):
    if not p.get("ok") or not p.get("total"):
        return f'{p["name"]}: no plan yet'
    done, total = p["done"], p["total"]
    state = "DONE" if done >= total else f"{done}/{total}"
    nxt = f' · next: {p["current"]}' if p.get("current") else ""
    last = f' · last commit {ago(p["commitAt"])}' if p.get("commitAt") else ""
    return f'{p["name"]}: {state}{nxt}{last}'


def ago(ts):
    import time
    s = max(0, int(time.time()) - int(ts))
    if s < 3600: return f"{s // 60}m ago"
    if s < 86400: return f"{s // 3600}h ago"
    return f"{s // 86400}d ago"


# ── tools ───────────────────────────────────────────────────────────────────
def tool_board(args):
    d = board_data()
    lines = [summary_line(p) for p in d["projects"]]
    head = f'{d.get("today", 0)} commits today across {d.get("activeToday", 0)} projects'
    if d.get("streak", 0) >= 2: head += f' · {d["streak"]}-day streak'
    pet = d.get("pet") or {}
    tail = f'pet: {pet.get("coins", 0)} coins, {pet.get("steps", 0)} steps eaten lifetime' if pet else "no pet yet"
    return "\n".join([head, *lines, tail])


def tool_steps(args):
    d = board_data()
    p = find_project(d, args.get("project"))
    if not p: return f'no project called "{args.get("project")}". I know: ' + ", ".join(x["id"] for x in d["projects"])
    if not p.get("steps"): return f'{p["name"]} has no steps (no PLAN.md).'
    mark = {"done": "[x]", "current": "[>]", "pending": "[ ]"}
    return f'{p["name"]} ({p["done"]}/{p["total"]})\n' + "\n".join(f'{mark[s["status"]]} {s["n"]}. {s["name"]}' for s in p["steps"])


def tool_tick(args):
    d = board_data()
    p = find_project(d, args.get("project"))
    if not p: return f'no project called "{args.get("project")}".'
    n = str(args.get("step", "")).strip()
    status = "pending" if args.get("undo") else "done"
    step = next((s for s in p.get("steps", []) if s["n"] == n), None)
    if not step: return f'{p["name"]} has no step {n}. Steps: ' + ", ".join(s["n"] for s in p.get("steps", []))
    if p["id"] == "tools":
        tick_tools_json(n, status)
    else:
        if not tick_plan(p["path"], n, status):
            return f'could not find step {n} in {p["path"]}'
    word = "done" if status == "done" else "back to pending"
    return f'{p["name"]} step {n} ({step["name"]}) marked {word}. The widget picks it up within 30s.'


def tick_tools_json(n, status):
    """The hand-kept track: set the step, reset the rest, first open step becomes current."""
    data = json.load(open(TOOLS_JSON, encoding="utf-8"))
    for s in data["steps"]:
        if str(s["n"]) == n: s["status"] = status
        elif s.get("status") != "done": s["status"] = "pending"
    for s in data["steps"]:
        if s["status"] == "pending": s["status"] = "current"; break
    json.dump(data, open(TOOLS_JSON, "w", encoding="utf-8"), indent=2)


def tick_plan(path, n, status):
    """A repo's PLAN.md: flip the checkbox on '- [ ] **Step N: …**', or the '**Status:**' line under '### N. …'."""
    plan = next((os.path.join(path, f) for f in ("PLAN.md", "docs/PLAN.md") if os.path.isfile(os.path.join(path, f))), None)
    if not plan: return False
    text = open(plan, encoding="utf-8").read()
    box = re.compile(r"^- \[([ xX])\] \*\*Step " + re.escape(n) + r":", re.M)
    if box.search(text):
        text = box.sub(lambda m: f"- [{'x' if status == 'done' else ' '}] **Step {n}:", text, count=1)
    else:
        head = re.search(r"^### " + re.escape(n) + r"\. .*$", text, re.M)
        if not head: return False
        rest = text[head.end():]
        st = re.search(r"\*\*Status:\*\*\s*[a-z-]+", rest)
        if not st: return False
        rest = rest[:st.start()] + f"**Status:** {status if status == 'done' else 'current'}" + rest[st.end():]
        text = text[:head.end()] + rest
    open(plan, "w", encoding="utf-8").write(text)
    return True


def items():
    """id, name, price from sprites.jsx (good enough: one regex over the ITEMS block)."""
    src = open(SPRITES, encoding="utf-8").read()
    out = []
    for m in re.finditer(r'\{ id: "([^"]+)", price: (\d+), name: "([^"]+)", kind: "([^"]+)"', src):
        out.append({"id": m.group(1), "price": int(m.group(2)), "name": m.group(3), "kind": m.group(4)})
    return out


def tool_pet(args):
    d = board_data()
    pet = d.get("pet")
    if not pet: return "no pet yet. Open the widget once and an egg appears."
    import datetime
    today = datetime.date.today().isoformat()
    coins = pet.get("coins", 0)
    owned = set(pet.get("drops", []))
    all_items = items()
    names = {it["id"]: it["name"] for it in all_items}
    afford = [f'{it["name"]} ({it["price"]})' for it in sorted(all_items, key=lambda x: x["price"]) if it["id"] not in owned and it["price"] <= coins]
    lines = [
        f'name: {pet.get("name") or "(unnamed)"} · born {pet.get("born")}',
        f'coins: {coins} · steps today: {pet.get("days", {}).get(today, 0)} · lifetime: {pet.get("steps", 0)}',
        f'owns {len(owned)}/{len(all_items)}: ' + (", ".join(names.get(i, i) for i in pet.get("drops", [])) or "nothing yet"),
        "can afford now: " + (", ".join(afford) if afford else "nothing yet"),
        f'trophies: ' + (", ".join(t["name"] for t in pet.get("trophies", [])) or "none"),
    ]
    return "\n".join(lines)


TOOLS = [
    {"name": "board", "description": "The build board: every project with progress, next step, last commit, plus today's commits, streak and the pet's coins. Call this for 'where am I' / 'what am I on'.",
     "inputSchema": {"type": "object", "properties": {}}, "fn": tool_board},
    {"name": "steps", "description": "One project's full step list with [x] done, [>] current, [ ] pending.",
     "inputSchema": {"type": "object", "properties": {"project": {"type": "string", "description": "project id or name, e.g. approval-desk or tools"}}, "required": ["project"]}, "fn": tool_steps},
    {"name": "tick", "description": "Mark a project's step done (writes its PLAN.md or tools.json). undo=true puts it back. The desktop widget and its pet react on the next refresh.",
     "inputSchema": {"type": "object", "properties": {"project": {"type": "string"}, "step": {"type": "string", "description": "the step number as shown by steps, e.g. \"3\""}, "undo": {"type": "boolean"}}, "required": ["project", "step"]}, "fn": tool_tick},
    {"name": "pet", "description": "The widget's pet: coins, steps today, what it owns, what it can afford in the shop, trophies.",
     "inputSchema": {"type": "object", "properties": {}}, "fn": tool_pet},
]


# ── the protocol: JSON-RPC over stdio, one line per message ─────────────────
def reply(id_, result=None, error=None):
    msg = {"jsonrpc": "2.0", "id": id_}
    if error: msg["error"] = error
    else: msg["result"] = result
    sys.stdout.write(json.dumps(msg) + "\n"); sys.stdout.flush()


def handle(msg):
    method, id_, params = msg.get("method"), msg.get("id"), msg.get("params") or {}
    if method == "initialize":
        reply(id_, {"protocolVersion": params.get("protocolVersion", PROTOCOL), "capabilities": {"tools": {}},
                    "serverInfo": {"name": "build-board", "version": "1.0"}})
    elif method == "ping":
        reply(id_, {})
    elif method == "tools/list":
        reply(id_, {"tools": [{k: t[k] for k in ("name", "description", "inputSchema")} for t in TOOLS]})
    elif method == "tools/call":
        tool = next((t for t in TOOLS if t["name"] == params.get("name")), None)
        if not tool:
            reply(id_, error={"code": -32602, "message": f'unknown tool {params.get("name")}'}); return
        try:
            text = tool["fn"](params.get("arguments") or {})
            reply(id_, {"content": [{"type": "text", "text": text}], "isError": False})
        except Exception as e:
            reply(id_, {"content": [{"type": "text", "text": f"{type(e).__name__}: {e}"}], "isError": True})
    elif id_ is not None:   # a request we don't know
        reply(id_, error={"code": -32601, "message": f"unknown method {method}"})
    # notifications (no id) need no answer


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line: continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        handle(msg)


if __name__ == "__main__":
    main()
