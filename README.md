# Build Board

**Your projects' PLAN.md files, as a live progress board on your Mac desktop. With a pixel pet that eats the steps you tick, and an MCP server so Claude Code reads the same board.**

![Build Board on a desktop: one bar per project, commits and streak on top, the pet in the corner](demo.gif)

## Why

If you build with Claude Code, you already have PLAN.md files with ticked and unticked steps. Build Board reads them every 30 seconds and draws one bar per project, with today's commits, your streak, and what's next. Glance at the desktop instead of asking Claude "where was I" at the start of every chat. That's tokens you keep.

The pet is the nudge. Tick steps and commit to feed it. Stop for a while and it gets hungry. Push and it throws a party.

## Install

Needs [Übersicht](https://tracesof.net/uebersicht/) (free, draws widgets on the macOS desktop) and `python3`. Nothing to pip install.

```bash
git clone https://github.com/keanii2022/build-board.git "$HOME/Library/Application Support/Übersicht/widgets/build-board"
```

Open Übersicht once if it's not running and the board appears.

### Hook it up to Claude Code (optional, one time)

```bash
claude mcp add -s user build-board -- python3 "$HOME/Library/Application Support/Übersicht/widgets/build-board/server.py"
```

Now any chat can say "what's on my board" or "tick step 3 in my-app".

## Your projects

The board looks at the folders under `~/Projects` (`projectsDir` in `SETTINGS`). Give each one a `PLAN.md` with steps:

```md
- [x] **Step 1: Skeleton**
- [ ] **Step 2: Agent**
```

Tick a box, the bar moves. `## N. Name` headings with a `**Status:** done` line work too, and anything under `## Later` is ignored. Other filenames: `planFiles` in `SETTINGS`.

**No PLAN.md yet?** The project still shows with a NO PLAN pill, and its commits still count toward the streak and the pet. Easiest fix: open Claude Code in that folder and say "write me a PLAN.md with the steps for this".

A `.skip` file next to `board.py` (one folder name per line) keeps a folder off the board. A track with no repo (a course, a reading list): copy `tools.example.json` to `tools.json` and it sits under a TRACK line at the bottom.

## Use it

- Hover a project's steps pill (`7 / 16`) to see its steps. Click a project to open a Claude Code session in it.
- Hover a sparkline for each day's commit count.
- Drag a project's icon onto the chest to store it. Drag it back up to put it on the board.
- Want the widget itself on the board? `ln -s "$HOME/Library/Application Support/Übersicht/widgets/build-board" ~/Projects/build-board`. The HELP pill opens a Claude Code chat in that folder.
- Tick steps and commit to feed the pet and earn coins: only projects with source files count, only commits that touch source, and a step pays once however often a plan gets rewritten. The stats card keeps a ledger. Spend coins in the chest's shop. Push to throw a party.

## Push party

Optional git hook that tells the widget you pushed. Per repo:

```bash
cp "$HOME/Library/Application Support/Übersicht/widgets/build-board/pre-push.hook" ~/Projects/my-repo/.git/hooks/pre-push && chmod +x ~/Projects/my-repo/.git/hooks/pre-push
```

## Make it yours

Every knob (colours, size, sounds, pet rules) is in `SETTINGS` at the top of `index.jsx`, with a comment each. Save and it redraws.

For anything bigger, open Claude Code in the widget folder and tell it what you want: a different pet, no pet, your colours, a new shop item, a second track. It's one JSX file and two small Python files, so Claude can read the whole thing.

## MCP server

`server.py` speaks MCP over stdio by hand (JSON-RPC, no packages) and gives Claude Code four tools: `board`, `steps`, `tick`, `pet`.

Try it without Claude:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python3 server.py
```

## Files

`index.jsx` the widget · `sprites.jsx` pixel art, shop, friends · `voxel.jsx` pixels to cubes · `stage.jsx` the pet in 3D (three.js, vendored in `vendor/`, MIT) · `board.py` reads the plans, prints JSON · `server.py` MCP · `pre-push.hook` · `restart.applescript` quits and relaunches Übersicht when it freezes after sleep (`osacompile -o ~/Applications/"Restart Board.app" restart.applescript`)

MIT.
