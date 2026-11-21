# Build Board

Übersicht desktop widget: PLAN.md progress bars plus, in progress, a Y2K crew messenger (see PLAN.md). `index.jsx` is the widget, `board.py` feeds it JSON every refresh, `server.py` is the MCP server. Übersicht skips any path with `/src/`, `/lib/` or `/node_modules/` in it; that's why the archived pet lives in `archive/pet/src/`.

## Crew status: what the hooks actually send

Tested 2026-11-21 on Claude Code 2.1.304 with temporary SubagentStart/SubagentStop hooks in `~/.claude/settings.json`: one agent that finished, one stopped with TaskStop.

**SubagentStart** (stdin JSON): `agent_id`, `agent_type` (the agent's name, e.g. `mello`), `cwd`, `session_id`, `transcript_path`, `prompt_id`. No description, no prompt.

**SubagentStop**: same ids plus `agent_transcript_path` and `background_tasks` (every running background task with `description`, `status`, `agent_type`). No success or error field.

**A stopped agent (TaskStop or the user interrupting it) sends no SubagentStop at all.**

Per-agent files sit next to the session transcript: `<transcript_path minus .jsonl>/subagents/agent-<agent_id>.meta.json` and `.jsonl`.
- `meta.json` has `agentType`, `description` (the 3-5 word task name), `model`, `effort`, and `"finished": true` once the agent finishes on its own. A stopped agent never gets `finished`.
- The `.jsonl` transcript of a stopped agent ends with a user line containing `[Request interrupted`.

## Status rules (for crew-hook.py and the widget)

- **working**: SubagentStart seen, no SubagentStop yet. Task line = `description` from meta.json. Project = the repo name for `cwd` (use the git common dir's parent so worktrees map to their repo; fall back to the cwd folder name).
- **done**: SubagentStop seen and the transcript's last assistant message isn't an API error.
- **failed**: SubagentStop seen but the last assistant message is an API error (`isApiErrorMessage`); untested, no error was forced. Also: an open "working" entry whose transcript ends in `[Request interrupted` gets **failed** with reason "stopped". Nothing fires for that, so a sweep has to check (on every hook event, and from board.py each refresh).
- **stuck**: still working, but the agent's transcript hasn't been written to in 15 minutes.

## Gotchas

- Two agents starting in the same second wrote into the log at once and their lines interleaved. crew-hook.py must lock (`fcntl.flock`) and write `.crew.json` atomically (temp file + rename).
- Hooks in the global settings fire for every session in every project, so `.crew.json` sees the whole crew, not just this repo.
- Built-in agent types (`Explore`, `general-purpose`, `Plan`, `claude-code-guide`…) show up too. Only names with a file in `~/.claude/agents/` are crew.
