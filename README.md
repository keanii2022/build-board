# Build Board

A dark glass desktop widget for macOS (Übersicht) that turns your projects' `PLAN.md` files into a live board. One bar per project, commits and streak on top, a pixel pet that eats the steps you tick off and dies if you stop. A hand-written MCP server lets Claude Code read and tick the same board.

## Install

Needs [Übersicht](https://tracesof.net/uebersicht/) and `python3`. Nothing to pip install.

```bash
git clone https://github.com/keanii2022/build-board.git "$HOME/Library/Application Support/Übersicht/widgets/build-board"
```

Your projects are the folders under `~/Projects` (`BOARD_SCAN=/other/folder` to change). Give each one a `PLAN.md` with steps and the bar fills in:

```md
- [x] **Step 1: Skeleton**
- [ ] **Step 2: Agent**
```

**No PLAN.md yet?** The project still shows, with a NO PLAN pill, and its commits still count toward the streak and the pet. The bar only moves once there are steps to tick, so write the plan first: a few `- [ ] **Step N: name**` lines is enough. `## N. Name` headings with a `**Status:** done` line work too. Anything under `## Later` is ignored. A `.skip` file next to `board.py` (one folder name per line) keeps a folder off the board.

## Use it

- Hover a project's pill to see its steps. Click a project to open a Claude Code session in it.
- Drag a project's icon onto the chest to store it. Drag it back up to put it on the board.
- Tick steps and commit to feed the pet and earn coins. Spend them in the chest's shop. Push to throw a party.
- Every knob (colours, size, sounds, pet rules) is in `SETTINGS` at the top of `index.jsx`, with a comment each. Save and it redraws.

## Push party

Optional git hook that tells the widget you pushed. Per repo:

```bash
cp "$HOME/Library/Application Support/Übersicht/widgets/build-board/pre-push.hook" ~/Projects/my-repo/.git/hooks/pre-push && chmod +x ~/Projects/my-repo/.git/hooks/pre-push
```

## MCP server

`server.py` speaks MCP over stdio by hand (JSON-RPC, no packages) and gives Claude Code four tools: `board`, `steps`, `tick`, `pet`. Register once:

```bash
claude mcp add -s user build-board -- python3 "$HOME/Library/Application Support/Übersicht/widgets/build-board/server.py"
```

Try it without Claude: `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python3 server.py`

## Files

`index.jsx` the widget · `sprites.jsx` pixel art and shop · `board.py` reads the plans, prints JSON · `server.py` MCP · `pre-push.hook`

A track with no repo (a course, a reading list): copy `tools.example.json` to `tools.json` and it sits under a TRACK line at the bottom.

MIT.
