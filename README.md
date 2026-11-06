# Build Board widget

A dark glass desktop widget (for Übersicht) showing one bar per project, read live from each project's `PLAN.md`. A pixel pet by the clock eats the steps you tick off, earns coins from your commits, and dies if you stop. Comes with a hand-written MCP server so Claude Code can read and tick the same board.

## Install

Needs macOS, [Übersicht](https://tracesof.net/uebersicht/) and `python3` (ships with Xcode command line tools). Nothing to `pip install`.

```bash
git clone https://github.com/keanii2022/build-board.git "$HOME/Library/Application Support/Übersicht/widgets/build-board"
```

Übersicht picks it up on its own. Your projects are the folders under `~/Projects`; give each one a `PLAN.md` with step checkboxes (formats below) and the bars fill in. Everything you can tune is in `SETTINGS` at the top of `index.jsx`.

## Files

- `index.jsx` — the widget.
- `sprites.jsx` — the pet's pixel art and the shop's 56 things (each with a `price`). **All the knobs are in `SETTINGS` at the top:** position, width, spectrum colours, names, pulse, font, refresh rate. Save and it redraws.
- `board.py` — reads the plans and prints JSON. Try `python3 board.py` to see what the widget sees.
- `tools.json` — the hand-kept AI Engineer Tools track (it has no repo). It sits apart under a TRACK line at the bottom of the board. Hover it and click a step's mark in the card to tick it (click again to undo); that writes this file for you.
- `server.py` — the MCP server (see below). Lets any Claude chat read the board, list steps, tick a step, check the pet.
- `pre-push.hook` — optional git hook that makes the widget say "pushed just now" right after a push.

## Where the projects come from

`board.py` reads every folder in `~/Projects` (set `BOARD_SCAN` to use another folder), with or without a plan or commits. To keep a folder off the board entirely, put its name in a `.skip` file next to `board.py`, one per line (gitignored). The AI Engineer Tools track comes from `tools.json` here.

**The board is yours to curate.** Every folder lives in the chest until you drag it out onto the board, and a new folder lands in the chest the moment it exists. The board keeps the order you drag things into. (The first time this version runs, whatever was on the board stays on the board.) A repo younger than 7 days wears a NEW pill. Rename or hide projects in `SETTINGS.names` / `SETTINGS.hide`.

| Plan style | Read as |
|---|---|
| `- [x] **Step N: …**` boxes | ticked = done, first unticked = current |
| `## N. Name` or `### N. Name` with a `**Status:** done / current / …` line under it | the status line |
| `## Step N — Name` headings (build notes) | "done" or ✓ in the heading = done, first other = current |

It looks for `PLAN.md`, `docs/PLAN.md`, `notes/PLAN.md`, then `NOTES.md`, and uses the first one that has steps.

Anything under a `## Later` heading is ignored.

## Look and behaviour

Dark glass, Inter, one spectrum (blue → purple → pink → orange) that every bar fills with: a bar at 100% shows the whole run.

- **Pulse** (`pulse: "activity"`): the panel edge breathes faster on a day with commits. A project you committed to today gets a quick pink pulse on its dot, one from the last 48h a slow blue one, idle ones sit still. `"soft"` = one slow rate for everything, `"off"` = no motion.
- **Today line**: commits across all repos today, and how many projects.
- **Sparkline**: 14 tiny bars per project, commits per day, oldest left. Hover it: it grows and a tip lists the days with commits and how many.
- **Hover** a project's steps pill (the `7 / 16` box): its full step list opens as a card (✓ done, ● current, ○ pending). On a wide widget (half a screen, say) it opens inside the panel at the right edge, because the widget sits under every window and a card beside it could be covered (`flyInside: false` to always go beside). On a narrow one it opens beside, on the side with room at any text size, and only overlaps the widget when the screen is too small for both. On the TRACK card the marks are buttons: click one to tick the step, click again to undo. It picks the side with room, never runs off the screen, scrolls inside, and lands on the current step. `stepsStyle: "dropdown"` gives the old under-the-project list instead.
- **Two displays**: Übersicht would draw a copy on every screen. The widget only draws on one: `screen: "biggest"` (default) means the monitor when it's plugged in and the laptop when it isn't, `"main"` means the display with the menu bar, `"all"` gives you the copies back. Hover the header and click ⇄ to send it to the other display (it remembers, and unplugging the monitor still sends it home to the laptop). The copies that don't draw also stay quiet: no sounds, no pet writes.
- **Icons**: every project gets its own pixel icon next to its name (rocket, box, flask, bolt, heart, star, leaf, gem, planet, ghost, key, book, controller, coffee, cloud, bug), no two projects share one. Choose your own in `SETTINGS.icons`, e.g. `{ "approval-desk": "rocket" }`.
- **The chest**: the glowing box centered at the bottom. Click it and a card opens beside the widget, like the step card (it scrolls on its own, the board behind it keeps scrolling too). Inside: a TROPHY CASE for stored projects at 100%, STORED projects, the SHOP and your COLLECTED things, with your coins at the top. Click the chest again, or anywhere on the board, to close it.
  - Drag a project's **icon** down onto the chest to put the project away. Drag it back up to the list to pull it out (drop it where you want it), or click ↑. Drag an icon up or down the list to reorder. The board list lives in `build-board.layout` in the widget's localStorage.
  - In the chest, × on a project switches it off: gone from the widget altogether (the folder stays). A small "N switched off" line under the list opens to show them, + brings one back.
  - `cute.chest: false` hides the chest.
- **Drag** the header (the title area) to move the widget anywhere. It remembers the spot. Changing `position` in `SETTINGS` snaps it back there; `draggable: false` locks it.
- **Click** a project: opens a new Claude Code session in that folder (`clickOpens: "claude"`), or the app in `openWith` if you set `clickOpens: "editor"`. Click the title: opens your GitHub (`boardUrl`, any link works).

## Cute layer (`SETTINGS.cute`)

- **The pet**: pixel creature by the timestamp. Born as an egg the day the widget first ran (`.pet.json` here is its memory; delete that file for a fresh egg). It hatches after `hatchAt` steps and eats the steps you tick off across every project.
  - **Hunger**: `fedAt` (2) steps in a day = fed. 1 = peckish. 0 by the afternoon = hungry, sad eyes. Two days of nothing = ghost: see-through, floating, still pokeable, back the moment it eats.
  - **Death** (`diesAfterDays`, 5): five days without a single step and it dies for real. A stone with its name, dates and steps goes in the GRAVEYARD section of the chest, the board goes grey for a minute, and a fresh egg starts with no coins and no things. The pet card counts the days left while it's a ghost. `diesAfterDays: 0` makes it immortal.
  - **Hands**: when it holds something, little arms come out and the thing sits in its hand. The snack goes in the other hand.
  - **Weight**: a running count, steps minus 2 a day. 3+ = thicc, 6+ = fat, 10+ = cooked (sleepy), 14+ = on the scooter. Stop grinding and it slims back down.
  - **Coins** (`coins`): 1 per step ticked, 1 per commit, 10 when a project hits 100%. The number under the pet is its wallet. The thin bar only shows while it's an egg (steps to hatch).
  - **Shop**: in the chest at the bottom of the widget. Every thing is visible with its price, cheapest first; click to buy (a pill lights up when you can afford it). Buying is a moment: the chest pops open, the thing rises out with a burst, the pet says something, the friend walks it over. A new wearable goes straight on, a new holdable goes straight into its hands.
  - **Things are yours to move**: COLLECTED sits at the top of the chest and each thing says where it is (on the pet, with the friend, in the chest). Drag a thing onto your pet and it holds it (hands) or wears it (head, eyes, neck, mouth, body: one per slot). Drag it onto the friend and the friend carries it. Drag it onto the chest to put it away. The thing in the pet's hands and the one on the friend's head can be dragged off too. A fresh snack still takes the hands for `snackHours`.
  - **Alive** (`alive`, default 0.35): every refresh there's a roll. If it hits, the pet or the friend does a bit with something you own for `bitSeconds` (75): sips the cup, tries on the crown, the friend runs off with the skateboard, the disco ball makes the edge rave and the pet bounce, the energy drink gives it the jitters, the polaroid flashes the panel, champagne throws the push party, the duck quacks, the neon sign glows the title, the lamp tints the glass. Then everything goes back to how you left it. `alive: 0` turns it off.
  - **Hover the pet**: its card. Click the name to rename it (Enter saves, Esc cancels). Under it, in plain words: how it feels, its body, what it ate today, its wallet, its stuff, projects finished, steps so far, and when it was born. It never tells you the rules (how much it needs, how long it has): you learn those by watching it. The card waits for you while you cross the board to reach it.
  - **The friend**: one of the drops is a small creature. It is not your pet: it wanders along the bottom of the widget on its own, your pet stays by the timestamp. Once you have it, it does the deliveries: when something drops it walks it across the floor to the pet, and the pet gets it in its hands when the friend arrives (`deliverSeconds` in `cute`, default 6).
  - **Habits**: first push of the day = a random snack in its hands for `snackHours`. A push before 5am = eye bags all day. A project at 100% = a trophy with the project's name. A 7-day streak = a flame on its head. Any step has a 5% roll for a shiny hour and 5% for a coin.
  - **Poke it** (click): it talks back, and what it says depends on how it is doing (egg, hungry, stuffed, ghost, on the scooter, fed up with you). `petVoice: "Bubbles"` makes it speak out loud. Eyes follow the cursor. `petScale: 3` for a bigger pet.
  - **Add your own things**: push a `{ id, price, name, kind, grid, line }` into `ITEMS` (or `SNACKS`, no price) in `sprites.jsx`. A grid is rows of letters, `.` = empty, each letter a colour from `PAL`.
- **Bubbles** drifting up the glass (`bubbles: 7`, 0 = none).
- **Sparkles**: a spectrum burst from the end of the bar when a step lands, a bigger one at 100%.
- **Push party** (`pushParty`): when you push, the whole widget bounces, its edge cycles through the rainbow, the rows do a wave and confetti rains down the glass for a couple of seconds, with the arcade jingle.
- **Streak**: "🔥 4-day streak" in the today line, counted across all repos (still alive if today has no commit yet).
- **Wiggle**: rows lift, dots wiggle and pills pop on hover.

### Sounds

macOS's own system sounds through `afplay`, nothing to install. Pop when the chest opens, Bottle when a project goes in or out, Pop on hover (quiet, and each project at its own pitch so you learn them by ear), Tink on click, Glass when a step gets ticked, a Glass-Glass-Hero jingle when a project hits 100%, an arcade whoosh-pop-pop-pop-fanfare on push, Purr when a new project appears, Frog when you poke the pet (Basso when it's had enough), Pop-Pop-Hero when something drops, Purr-Hero when it hatches, Bottle for the first push of the day.

- Any name from `/System/Library/Sounds` works, or a full path to your own `.aiff` / `.wav` / `.mp3`.
- A list plays as a jingle: `stepSound: ["Tink", "Glass"]`.
- The little pixel speaker at the bottom right of the widget cycles the level: muted → low → mid → loud (it remembers). `volume` is a master multiplier on top. `quietHours: [23, 8]` adds a nightly mute on top if you want one. `sounds: false` removes the speaker and mutes for good. `volume` is the master.
- A sound can carry its own pitch: `"Pop@1.5"` is Pop at 1.5x. The push jingle is `Blow` (whoosh), three rising Pops, `Hero`.

## Resizing

Works like a window. Handles show when you hover the widget.

- Right or left edge: width. Bottom edge: height. Either bottom corner grip: both. Pulling from the left keeps the right side where it is. Double-click a grip to go back to the settings.
- Make it shorter than its content and the project list scrolls inside (the step card still opens beside it).
- Hold ⌥ and scroll over the widget to change the text size.
- Or set `width` / `height` (0 = fit content) / `scale` in `SETTINGS`. Changing those wins over anything you dragged.

## Push flash (installed in approval-desk, agent-hub, life-plan)

```bash
cp "$HOME/Library/Application Support/Übersicht/widgets/build-board/pre-push.hook" ~/Projects/approval-desk/.git/hooks/pre-push && chmod +x ~/Projects/approval-desk/.git/hooks/pre-push
```

Same for `agent-hub` and `life-plan`. The hook only writes a marker file here; it never blocks a push.

## MCP server (`server.py`)

MCP is the plug format Claude uses for outside tools. `server.py` speaks it by hand over stdio (JSON-RPC, one line per message, no packages) and wraps the same `board.py` the widget runs. Registered once, every Claude Code chat gets four tools:

| tool | does |
|---|---|
| `board` | every project with progress, next step, last commit, today's commits, streak, the pet's coins. "where am I?" |
| `steps project` | one project's step list, `[x]` done `[>]` current `[ ]` pending |
| `tick project step` | marks a step done (`undo: true` puts it back). Writes the repo's PLAN.md or `tools.json`; the widget and the pet react within 30s |
| `pet` | coins, steps today, what it owns, what it can afford, trophies |

Register (once, for every project), then open a new chat:

```bash
claude mcp add -s user build-board -- python3 "$HOME/Library/Application Support/Übersicht/widgets/build-board/server.py"
```

Try it without Claude: `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python3 server.py`.
