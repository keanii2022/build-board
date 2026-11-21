# Build Board: crew messenger

The pet goes and the crew comes in. Build Board turns into a Y2K messenger, a Yahoo/AIM-style buddy list for the agent crew, sitting under the PLAN.md progress bars. Each agent in `~/.claude/agents/*.md` is a buddy (name · role) with a live status. Click one to open an IM window: their go-to asks as quick replies, plus a text box that really talks to that agent in that project.

Look: Y2K Frutiger Aero glass, light in light mode and dark in dark mode (follows the Mac). Refined, not cute: tight type, mono numbers, no emoji. An original 3D "lil guy" rendered in Blender is the app icon, and he acts out each status. He's our own character, nothing traced from AIM/Yahoo.

### 1. Archive the pet
- **Status:** done
- **Scope:** move all pet code (pet, shop, chest, coins, the 3D room, sprites, voxel) out of `index.jsx`, `stage.jsx`, `sprites.jsx`, `voxel.jsx`, `server.py`, `board.py` into `archive/pet/` with a short README there on how to bring it back. Make sure Übersicht doesn't load the archive as a widget (rename the files if it would). Drop the `pet` MCP tool and stop the widget writing `.pet.json`. Progress bars keep working. Commit and push so the pet is safe on GitHub.
- **Dependencies:** none
- **Out of scope:** any crew UI, hooks, art, README/screenshot refresh (step 8)

### 2. Hook test
- **Status:** done
- **Scope:** temporary SubagentStart/SubagentStop hooks in `~/.claude/settings.json` that just log the raw payloads to a scratch file. Run a couple of real subagents (one that finishes, one that gets stopped) and see what comes through: agent name, cwd, any success/error signal. Write the done/failed/stuck rules into a new project `CLAUDE.md`. Remove the temporary hooks.
- **Dependencies:** none
- **Out of scope:** widget code, the real status script (step 5)

### 3. The lil guy (Blender)
- **Status:** current
- **Scope:** an original glossy Y2K mascot built by a Blender script kept in the repo (`art/lilguy.py`, run headless), so he can be re-rendered any time. Renders to `art/` as transparent @2x PNGs: the main icon, plus a pose for each status: idle (asleep), working (heads-down typing), done (small win), failed (laptop smoking), stuck (scratching his head). One per-agent accent color so buddies tell apart at a glance. He has to read well tiny (16-24px) on both light and dark glass.
- **Dependencies:** none
- **Out of scope:** widget code, chat

### 4. Messenger shell + roster
- **Status:** not-started
- **Scope:** restyle `index.jsx` into the messenger look: slim Build Board strip on top (progress bars kept), a buddy list panel under it, Frutiger Aero glass, auto light/dark, the lil guy in the title bar. `board.py` reads `~/.claude/agents/*.md` frontmatter: name, role, and a new `examples` field (2-3 go-to asks, added to each agent file), falling back to the "Use when" part of the description. Everyone shows as Away/Idle for now.
- **Dependencies:** 1, 3
- **Out of scope:** live status, hooks, chat, vibe/story/catchphrase (not shown)

### 5. Live status hook
- **Status:** not-started
- **Scope:** `crew-hook.py` in this repo, wired into `~/.claude/settings.json` on SubagentStart/SubagentStop. Writes `.crew.json` in the widget folder (gitignored): who, which project (from cwd), started, ended, done/failed/stuck per step 2's rules, plus a short history per agent. `server.py` gets a `crew` MCP tool ("who's working?").
- **Dependencies:** 2
- **Out of scope:** widget UI

### 6. Live buddy list
- **Status:** not-started
- **Scope:** `index.jsx` reads `.crew.json`. Working agents move up to "In the Office" with their status pose and a project tag. Idle agents sit in "Away" as small chips. A status line like "done w/ cli-tool icons · 4m ago" so the crew feels like a team that's been working with you.
- **Dependencies:** 4, 5
- **Out of scope:** chat, hook script

### 7. IM window
- **Status:** not-started
- **Scope:** clicking a buddy opens an IM window: title bar with their name and role, project picker (defaults to their last project), last job line, their `examples` as quick-reply chips, text box + Send. Send runs that agent headless in the chosen project via a small `chat.py` (keeps one thread per agent + project, on a lighter model to protect the budget) and streams the reply into the window. Closing it doesn't kill a running reply.
- **Dependencies:** 4
- **Out of scope:** hook script, status logic

### 8. Refresh the docs
- **Status:** not-started
- **Scope:** `README.md`, `widget.json` description, new screenshots (light + dark), rebuild `build-board.widget.zip`, `.gitignore` (add `.crew.json` and chat threads, drop `.pet.json`).
- **Dependencies:** 6, 7
- **Out of scope:** code changes
