// ╭──────────────────────────────────────────────────────────────────────────╮
// │  BUILD BOARD  ·  desktop widget for Übersicht                             │
// │                                                                           │
// │  Everything you'd want to change is in SETTINGS right below.              │
// │  Save the file and Übersicht redraws it on its own.                       │
// │  Numbers come from each project's PLAN.md (and tools.json in this folder) │
// │  via board.py. Run `python3 board.py` here to see the raw data.           │
// │                                                                           │
// │  Hover a project to see its steps. Click it: new Claude Code session.     │
// │  Click the title: your GitHub. Drag the header to move it, the corner     │
// │  grip to resize it.                                                       │
// ╰──────────────────────────────────────────────────────────────────────────╯

import { run, React } from "uebersicht";
import { PAL, ITEMS, SNACKS, EXTRA, FRIENDS, drawPet, drawEgg, shadow, size } from "./sprites.jsx";
import { voxelize } from "./voxel.jsx";
import { loadThree, mountStage, renderThumb } from "./stage.jsx";

const SETTINGS = {
  // ── Where it sits on the desktop ──────────────────────────────────────────
  // Use top OR bottom, and left OR right. Numbers are pixels from that edge.
  position: { top: 48, right: 28 },
  width: 340,
  height: 0,                   // 0 = as tall as its content. Any number = fixed height, the list scrolls inside.
                               // On the desktop: drag the right edge (width), the bottom edge (height) or the
                               // corner grip (both). Double-click the grip to reset. Remembered like the position.
  scale: 1,                    // text size. Hold ⌥ and scroll over the widget to change it.
  draggable: true,             // grab the header and drop it anywhere. It remembers the spot
  projectsDir: "~/Projects",   // every folder in here is a project (with or without a plan or commits)
  planFiles: ["PLAN.md", "docs/PLAN.md", "notes/PLAN.md", "NOTES.md"],   // where a project's steps live; the first file with steps wins
  rowTint: 0.14,               // each row wears a faint wash of its icon's colour, so no two rows read the same. 0 = plain glass
  icons: {},                   // a pixel icon per project, e.g. { "approval-desk": "rocket" }. Names: rocket cube flask bolt heart star leaf gem planet ghost key book. Unset = picked for you
  screen: "biggest",           // with more than one display: "biggest" (the monitor when it's plugged in, the laptop when not),
                               // "main" (the one with the menu bar in System Settings), "all" (a copy on every display).
                               // Hover the header and click ⇄ to send it to the other display; it remembers that too.
                               // until you change `position` above, which snaps it back.

  // ── Words ─────────────────────────────────────────────────────────────────
  eyebrow: "BUILD BOARD",      // small blue label at the top. "" hides it.
  title: "Projects",           // the heading. "" hides it.
  titleGradientWord: "",       // a word in the title to paint with the spectrum, e.g. "Projects". "" = none.

  // ── The spectrum: the colours every bar fills with, left to right ─────────
  // A bar at 100% shows the whole run. Add, remove or reorder freely.
  spectrum: ["#2E7CF6", "#6A5BFF", "#B54CFF", "#F04AA6", "#FF7A45"],
  accent: "#5B8DEF",           // eyebrow, "next" label, small links

  // ── Panel ─────────────────────────────────────────────────────────────────
  panel: "rgba(8, 8, 11, 0.93)",       // background of the glass panel: near black, the room he lives in
  edge: "rgba(255, 255, 255, 0.09)",   // 1px border
  text: "#F4F2EF",
  muted: "rgba(244, 242, 239, 0.55)",
  track: "rgba(255, 255, 255, 0.08)",  // empty part of a bar
  glass: 24,                   // blur behind the panel (0 = none)
  radius: 18,
  barHeight: 3,

  // ── Motion ────────────────────────────────────────────────────────────────
  // "activity": the panel breathes faster on days you commit; a project you
  //             committed to today pulses quick, one from the last 48h pulses
  //             slow, idle ones sit still.
  // "soft":     everything breathes at one slow rate.   "off": no motion.
  pulse: "activity",
  pulseSeconds: 4,             // the slow breath. The quick one is half of this.
  activeHours: 48,             // "recent" means a commit this recent

  // ── Cute ──────────────────────────────────────────────────────────────────
  // Sounds are macOS's own (names from /System/Library/Sounds: Pop, Tink, Glass,
  // Hero, Purr, Submarine, Bottle, Frog, Ping, Blow, Morse, Funk, Sosumi, Basso).
  cute: {
    sounds: true,
    volume: 1,                 // master multiplier; the speaker at the bottom right picks the level (off, low, mid, loud)
    hoverSound: "Pop",         // moving onto a project. "" = silent
    hoverVolume: 0.12,
    clickSound: "Tink",        // opening a project
    chestSound: "Pop",         // the chest opening / closing
    storeSound: "Bottle",      // a project dropped into the chest (or pulled out)
    stepSound: "Glass",        // a step got ticked
    doneSound: ["Glass", "Glass", "Hero"],   // a project hit 100% (a list plays as a little jingle)
    pushSound: ["Blow", "Pop@0.8", "Pop@1.1", "Pop@1.5", "Hero"],   // you pushed: whoosh, three rising pops, fanfare ("Name@1.5" = that sound at 1.5x pitch)
    pushParty: true,           // and the whole widget dances: bounce, rainbow edge, rows do a wave, confetti
    newSound: "Purr",          // a new project showed up
    petSound: "Frog",          // poking the pet
    petMadSound: "Basso",      // poking it too much
    petVoice: "",              // make it actually talk when poked: a voice name from `say -v ?`, e.g. "Bubbles", "Junior", "Flo". "" = speech bubble only
    hoverPitch: true,          // each project's hover pop has its own pitch, so you learn them by ear
    quietHours: null,          // e.g. [23, 8] = no sounds from 23:00 to 08:00. null = the little speaker at the bottom right decides
    sparkles: true,            // spectrum sparkles when a step lands (bigger burst at 100%)
    pet: true,                 // the creature by the timestamp: sleeps when idle, sways after a recent commit, hops on a commit day. Poke it.
    eyesFollow: true,          // its eyes follow your cursor while you're over the widget
    // The pet eats steps. Everything it owns is in sprites.jsx (don't peek). See README "The pet".
    fedAt: 2,                  // steps in a day to count as fed. 1 = peckish, 0 = hungry, two days of 0 = ghost
    diesAfterDays: 5,          // days without a single step and it dies: new egg, coins and things gone, a stone in the graveyard. 0 = immortal
    stuffedAt: 5,              // steps in a day that leave it stuffed and sleepy. Keep that up and it gets fat.
    coins: { step: 3, commit: 2, push: 5, project: 18 },   // what the pet earns: per step ticked, per commit, per push, per project at 100%
    shopEvery: 5,              // minutes: the shop shows a new shelf this often
    shopSize: 4,               // things on the shelf at a time
    shopDeal: true,            // one of them half price
    alive: 0.35,               // each refresh, the chance the pet or the friend does a bit with something you own (0 = never)
    bitSeconds: 75,            // how long a bit lasts   // what the pet earns: per step ticked, per commit, per project at 100%. Spend them in the shop (hover the pet)
    hatchAt: 5,                // steps from the egg until it hatches
    snackHours: 2,             // first push of the day: how long it holds the snack
    petScale: 2,               // pixel size of the pet. 2 = about 48px, 3 = big
    stage: true,               // him in 3D: his pixels as little cubes, turning, breathing, blinking, drag to spin
    stageStyle: "side",        // "side": he lives in a column beside the list. "popup": click the corner pet and a card opens
    stageWidth: 0.46,          // the column's share of the panel (0.46 = almost half), or a px number
    stageHeight: 250,          // the 3D view's height in px (shrinks to fit the screen)
    stageDepth: 7,             // how thick he is in cubes
    treatSound: ["Pop", "Pop", "Hero"],   // bought something
    hatchSound: ["Purr", "Hero"],
    snackSound: "Bottle",
    bubbles: 7,                // bubbles drifting up the glass. 0 = none
    streak: true,              // "🔥 4-day streak" in the today line
    wiggle: true,              // rows lift, dots wiggle, pills pop on hover
  },

  // ── What shows ────────────────────────────────────────────────────────────
  showToday: true,             // "3 commits today · 2 projects" under the title
  showNext: true,              // "NEXT  5. Agent"
  showActivity: true,          // "3 this week · 12h ago"
  showSparkline: true,         // 14 tiny bars: commits per day, oldest left
  hoverSteps: true,            // hover a project to see its full step list
  stepsStyle: "flyout",        // "flyout": a card beside the widget, sized to fit the screen, scrolls, lands on the current step.
  flyInside: true,             // on a wide widget the card opens inside the panel (right edge) instead of beside it, so windows can't cover it
  chestStyle: "overlay",       // "overlay" = the chest opens over the board itself, full width under the header. "beside" = a card next to the widget
                               // "dropdown": opens under the project (can run off the bottom of the screen).

  // ── Clicks ────────────────────────────────────────────────────────────────
  lock: { idleMinutes: 10, onOpen: true, reset: false },   // one password for the whole board (set when first asked, kept hashed in this widget's own storage, never in a file): asked after idleMinutes without a touch (0 = never), and before any project opens. reset: true forgets it on the next refresh
  clickOpens: "claude",       // "claude" = a new Claude Code session in that folder. "editor" = the app below. "" = nothing.
  openWith: "Visual Studio Code",
  boardUrl: "https://github.com/keanii2022",   // opens when you click the title (your GitHub)

  // ── Timing ────────────────────────────────────────────────────────────────
  refreshSeconds: 30,

  // ── Projects ──────────────────────────────────────────────────────────────
  // Found on their own: every folder in ~/Projects with a PLAN.md, or with a
  // commit in the last 7 days (board.py has those knobs). Newest activity on top.
  names: { "data-ops-ampd": "data-ops" },   // folder name → display name, optional
  hide: [],                                 // folder names to leave off, e.g. ["boxcutter"]
  parkAfterDays: 21,          // idle this long → folded into one "parked" line at the bottom. 0 = never fold.
  newForDays: 7,              // a repo younger than this wears a NEW pill

  font: '"Inter", -apple-system, "Helvetica Neue", Arial, sans-serif',
};

// ════════════════════════════════════════════════════════════════════════════
//  Engine. You shouldn't need to touch anything below this line.
// ════════════════════════════════════════════════════════════════════════════

// Where this widget lives. A git clone is "build-board", a gallery install is "build-board.widget":
// FIND_DIR is a shell snippet that sets $W to whichever one exists. Every shell command starts with it.
const FIND_DIR = `D="$HOME/Library/Application Support/Übersicht/widgets"; W="$D/build-board.widget"; [ -d "$W" ] || W="$D/build-board"`;
const WIDGET_DIR = '"$W"';
export const command = `${FIND_DIR}; cd ${WIDGET_DIR} 2>/dev/null || cd build-board.widget 2>/dev/null || cd build-board; BOARD_SCAN=${sh(SETTINGS.projectsDir)} BOARD_PLANS=${sh((SETTINGS.planFiles || []).join(","))} /usr/bin/env python3 board.py`;
export const refreshFrequency = SETTINGS.refreshSeconds * 1000;

const pos = SETTINGS.position;
export const className = `
  ${pos.top !== undefined ? `top: ${pos.top}px;` : ""}
  ${pos.bottom !== undefined ? `bottom: ${pos.bottom}px;` : ""}
  ${pos.left !== undefined ? `left: ${pos.left}px;` : ""}
  ${pos.right !== undefined ? `right: ${pos.right}px;` : ""}
  width: ${SETTINGS.width}px;
`;

const S = SETTINGS;
const SPECTRUM = `linear-gradient(90deg, ${S.spectrum.join(", ")})`;
const memory = { done: {}, bumpAt: {}, seen: null, arrivedAt: {}, pos: null, dragging: false, dragEndAt: 0,
                 full: {}, doneAt: {}, pushSeen: null, soundAt: 0, scale: 0, width: 0,
                 pokes: 0, pokeAt: 0, lastLine: "", sayT: null, pokedT: null, height: 0, stepsById: {}, flyT: null,
                 pet: null, petSaved: "", view: null, dropAt: 0, hatchAt: 0, lineQ: "", closetT: null, pin: null, locked: false, lastActive: Date.now() };

// ── Sounds (macOS system sounds through afplay) ─────────────────────────────
const SOUNDS = "/System/Library/Sounds/";
// The speaker button at the bottom right. Remembered in localStorage, so it survives restarts.
const MUTE_KEY = "build-board.mute";
const SPK_ON  = ["...Y....t.", "..YY..t..t", "YYYY.t.t.t", "YYYY.t.t.t", "..YY..t..t", "...Y....t."];
const SPK_OFF = ["...Y......", "..YY..r.r.", "YYYY...r..", "YYYY..r.r.", "..YY......", "...Y......"];
const VOL_KEY = "build-board.volume";
const LEVELS = [0, 0.2, 0.45, 0.9], LEVEL_WORDS = ["muted", "low", "mid", "loud"];
const SPK_1 = ["...Y......", "..YY.t....", "YYYY..t...", "YYYY..t...", "..YY.t....", "...Y......"];
const SPK_3 = ["...Y....t.t.", "..YY..t..t.t", "YYYY.t.t.t.t", "YYYY.t.t.t.t", "..YY..t..t.t", "...Y....t.t."];
function level() {
  if (memory.level === undefined) {
    try { const v = localStorage.getItem(VOL_KEY); memory.level = v !== null ? Number(v) : (localStorage.getItem(MUTE_KEY) === "1" ? 0 : 2); }
    catch (e) { memory.level = 2; }
  }
  return memory.level;
}
function soundOn() { return level() > 0; }
function levelTitle() { return `sound: ${LEVEL_WORDS[level()]} · click to change`; }
function toggleSound(e) {   // click the speaker: off → low → mid → loud → off
  e.stopPropagation();
  memory.level = (level() + 1) % LEVELS.length;
  try { localStorage.setItem(VOL_KEY, String(memory.level)); } catch (err) {}
  const el = e.currentTarget;
  LEVELS.forEach((_, i) => el.classList.toggle("lv" + i, i === memory.level));
  el.title = levelTitle();
  if (memory.level) play("Tink");
}
function quietNow() {
  const q = S.cute.quietHours; if (!q) return false;
  const h = new Date().getHours();
  return q[0] < q[1] ? (h >= q[0] && h < q[1]) : (h >= q[0] || h < q[1]);
}
function soundPath(name) { return name.includes("/") ? name : SOUNDS + name + ".aiff"; }
function play(name, vol, rate) {
  if (!S.cute.sounds || !name || !soundOn() || quietNow()) return;
  const t = Date.now();
  if (t - memory.soundAt < 100) return;   // never machine-gun
  memory.soundAt = t;
  const v = (vol === undefined ? LEVELS[level()] : vol * LEVELS[level()] / LEVELS[2]) * S.cute.volume;
  const r = rate ? ` -r ${rate} -q 1` : "";
  const names = Array.isArray(name) ? name : [name];
  const cmd = names.map((n) => {
    const [file, pitch] = String(n).split("@");   // "Pop@1.5" = Pop at 1.5x speed/pitch
    return `afplay -v ${v}${pitch ? ` -r ${pitch} -q 1` : r} ${sh(soundPath(file))}`;
  }).join(" ; ");
  run(`( ${cmd} ) >/dev/null 2>&1 &`);
}
function speak(line) {
  if (!S.cute.petVoice || !soundOn() || quietNow()) return;
  const clean = line.replace(/[^\w\s'!?.,]/g, "").trim();
  if (clean) run(`say -v ${sh(S.cute.petVoice)} ${sh(clean)} >/dev/null 2>&1 &`);
}

function ago(ts, now) {
  if (!ts) return "";
  const s = Math.max(0, now - ts);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function sh(s) { return "'" + String(s).replace(/'/g, "'\\''") + "'"; }
// ── The lock: a password over the glass. Click the field and type; enter submits. ─────────
const PIN_KEY = "build-board.pin";
async function pinHash(p) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("bb:" + p)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
function pinStored() { try { return localStorage.getItem(PIN_KEY) || ""; } catch (e) { return ""; } }
function askPin(reason, then, cancellable) { memory.pin = { mode: pinStored() ? "enter" : "set", reason, then, entry: "", first: "", err: false, cancellable }; redraw(); }
function pinSubmit(code) {
  const P = memory.pin; if (!P) return;
  P.err = false; P.entry = "";
  if (!code || code.length < 4) { P.err = "at least 4 characters."; redraw(); return; }
  if (P.mode === "set") { P.first = code; P.mode = "confirm"; redraw(); return; }
  if (P.mode === "confirm") {
    if (code !== P.first) { P.mode = "set"; P.first = ""; P.err = "didn't match. again."; redraw(); return; }
    pinHash(code).then((h) => { try { localStorage.setItem(PIN_KEY, h); } catch (e) {} pinDone(); });
    return;
  }
  pinHash(code).then((h) => { if (h === pinStored()) pinDone(); else { P.err = "no."; play(S.cute.petMadSound, undefined, 1.2); redraw(); } });
}
function pinDone() { const P = memory.pin; memory.pin = null; memory.locked = false; memory.lastActive = Date.now(); play(S.cute.clickSound); if (P && P.then) P.then(); redraw(); }
function pinCancel() { if (memory.pin && memory.pin.cancellable) { memory.pin = null; redraw(); } }
function touch() { memory.lastActive = Date.now(); }
function checkIdle() {
  const m = S.lock && S.lock.idleMinutes;
  if (!m || memory.locked || memory.pin) return;
  if (Date.now() - (memory.lastActive || 0) > m * 60000) { memory.locked = true; askPin("locked", null, false); }
}
function guarded(fn, what) { if (S.lock && S.lock.onOpen) askPin(what ? `open ${what}` : "open", fn, true); else fn(); }
function focusLock(el) { if (el && document.activeElement !== el) setTimeout(() => { try { el.focus(); } catch (e) {} }, 30); }
function LockPad() {
  const P = memory.pin; if (!P) return null;
  const title = P.mode === "set" ? "set a password" : P.mode === "confirm" ? "once more" : P.reason === "locked" ? "locked" : P.reason;
  const onKey = (e) => {
    e.stopPropagation();
    if (e.key === "Enter") { pinSubmit(e.currentTarget.value); e.currentTarget.value = ""; }
    else if (e.key === "Escape") pinCancel();
  };
  const onInput = (e) => {   // when it's the right one, it just opens: no enter, no attempt counted
    const v = e.currentTarget.value, el = e.currentTarget;
    if (P.mode !== "enter" || v.length < 4) return;
    pinHash(v).then((h) => { if (memory.pin === P && el.value === v && h === pinStored()) { el.value = ""; pinDone(); } });
  };
  return (
    <div className={"bb-lock" + (P.err ? " err" : "")} onClick={(e) => { e.stopPropagation(); const i = e.currentTarget.querySelector("input"); if (i) i.focus(); }}
         onMouseDown={(e) => e.stopPropagation()} onMouseMove={(e) => e.stopPropagation()}>
      <div className="bb-lock-card">
        <div className="t">{title}</div>
        <input className="bb-lock-in" type="password" placeholder="password" autoComplete="off" spellCheck={false} ref={focusLock} onKeyDown={onKey} onInput={onInput} onMouseDown={(e) => e.stopPropagation()} />
        <div className="row">
          <span className="go" onClick={(e) => { const i = e.currentTarget.closest(".bb-lock-card").querySelector("input"); pinSubmit(i.value); i.value = ""; }}>enter</span>
          {P.cancellable ? <span className="go dim" onClick={pinCancel}>cancel</span> : null}
        </div>
        <div className="e">{P.err || "\u00a0"}</div>
      </div>
    </div>
  );
}
function openPath(p) {
  if (!S.clickOpens || !p) return;
  play(S.cute.clickSound);
  if (S.clickOpens === "claude") {
    const folder = p.endsWith(".json") ? p.replace(/\/[^/]+$/, "") : p;
    run(`open ${sh("claude://code/new?folder=" + encodeURIComponent(folder) + "&source=build-board")}`);
  } else if (S.openWith) {
    run(`open -a ${sh(S.openWith)} ${sh(p)}`);
  }
}
// ── Which display ───────────────────────────────────────────────────────────
// Übersicht runs one copy of the widget per display. Each copy looks at the list of displays board.py
// sends, works out which one it is on, and only the chosen one draws (the others render nothing and
// skip every side effect: sounds, pet writes, parties).
const SCREEN_KEY = "build-board.screen";
function screenPick() {
  if (memory.screenPick === undefined) { try { memory.screenPick = Number(localStorage.getItem(SCREEN_KEY)) || 0; } catch (e) { memory.screenPick = 0; } }
  return memory.screenPick;
}
function myScreen(screens) {
  const sx = window.screenX, sy = window.screenY, sw = window.screen.width, sh = window.screen.height;
  return screens.find((d) => Math.abs(d.x - sx) < 2 && Math.abs(d.y - sy) < 2)
      || screens.find((d) => d.w === sw && d.h === sh) || null;
}
function targetScreen(screens) {
  const pick = screenPick();
  if (pick && screens.some((d) => d.id === pick)) return pick;
  if (S.screen === "main") return (screens.find((d) => d.main) || screens[0]).id;
  return screens.slice().sort((a, b) => b.w * b.h - a.w * a.h)[0].id;
}
function shownHere(data) {   // true = this copy is the one that draws
  const screens = data && data.screens;
  if (S.screen === "all" || !screens || screens.length < 2) return true;
  const me = myScreen(screens);
  return !me || me.id === targetScreen(screens);
}
function swapScreen(e) {   // ⇄ in the header: send the widget to the other display
  e.stopPropagation();
  const screens = memory.screens || [], me = myScreen(screens);
  const next = screens.find((d) => !me || d.id !== me.id);
  if (!next) return;
  memory.screenPick = next.id;
  try { localStorage.setItem(SCREEN_KEY, String(next.id)); } catch (err) {}
  play("Tink");
  const wrap = wrapperOf(e.currentTarget.closest(".bb")); if (wrap) wrap.style.display = "none";
}
if (typeof window !== "undefined" && !window.__bbScreenHook) {   // the other copy hears the swap and redraws
  window.__bbScreenHook = true;
  window.addEventListener("storage", (ev) => { if (ev.key === SCREEN_KEY) location.reload(); });
}
// ── Layout: your order, and what's in the chest ─────────────────────────────
const LAYOUT_KEY = "build-board.layout";
function layout() {
  if (!memory.layout) {
    try { memory.layout = JSON.parse(localStorage.getItem(LAYOUT_KEY)) || {}; } catch (e) { memory.layout = {}; }
    memory.layout.order = memory.layout.order || []; memory.layout.stored = memory.layout.stored || [];
  }
  return memory.layout;
}
function saveLayout() { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout())); } catch (e) {} }
function redraw() { if (memory.redraw) memory.redraw(); }
// The board is the list in layout.board, in that order. Everything else in ~/Projects sits in the chest,
// so a new folder lands in the chest until you drag it out. The track ("tools") stays at the bottom when it's on the board.
function setBoard(repoIds, withTrack) { layout().board = withTrack ? [...repoIds, "tools"] : repoIds; saveLayout(); }
function storeProject(id) {
  const L = layout();
  L.board = (L.board || []).filter((x) => x !== id);
  saveLayout(); play(S.cute.storeSound); redraw();
}
function unstoreProject(id, index) {
  const L = layout(), had = (L.board || []).includes("tools");
  const ids = (L.board || []).filter((x) => x !== id && x !== "tools");
  if (id === "tools") setBoard(ids, true);
  else { ids.splice(index === undefined ? ids.length : Math.min(index, ids.length), 0, id); setBoard(ids, had); }
  play(S.cute.storeSound); redraw();
}
function reorderProject(id, index, visibleIds) {   // index = where it lands among the rows on screen
  const ids = visibleIds.filter((x) => x !== id);
  ids.splice(Math.min(index, ids.length), 0, id);
  setBoard(ids, (layout().board || []).includes("tools")); redraw();
}
function hideProject(id) {   // × in the chest: gone from the widget until you bring it back
  const L = layout(); L.hidden = (L.hidden || []).filter((x) => x !== id).concat(id); L.board = (L.board || []).filter((x) => x !== id);
  saveLayout(); play(S.cute.storeSound, undefined, 0.8); redraw();
}
function unhideProject(id) { const L = layout(); L.hidden = (L.hidden || []).filter((x) => x !== id); saveLayout(); play(S.cute.storeSound); redraw(); }
function toggleChest(e) {
  if (e) e.stopPropagation();
  const L = layout(); L.open = !L.open; saveLayout(); play(S.cute.chestSound, undefined, L.open ? 0.9 : 0.7);
  if (L.open) closeStage(false);
  redraw();
}
// ── The stage: the pet in 3D, over the board ────────────────────────────────
function toggleStage(e) {
  if (e) e.stopPropagation();
  if (S.cute.stageStyle === "side") return;   // he's already out
  if (memory.stageOpen) { closeStage(true); return; }
  const L = layout(); if (L.open) { L.open = false; saveLayout(); }
  memory.stageOpen = true; redraw();
}
function closeStage(draw) { if (S.cute.stageStyle === "side" || !memory.stageOpen) return; memory.stageOpen = false; if (memory.stageCtrl) { memory.stageCtrl.dispose(); memory.stageCtrl = null; } memory.stageKey = ""; if (draw) redraw(); }
function petModel() {   // the same drawing the corner pet uses, as cubes
  const v = memory.view, petEl = document.querySelector(".bb-pet");
  if (!v || !v.hatched) return null;
  const d = drawPet({ stage: v.stage, face: v.face, wear: v.wear, bags: v.bags, flame: v.flame, sleepy: !!(petEl && petEl.classList.contains("sleep")),
                      arms: { right: !!v.held, left: !!v.snack } });
  const key = d.body.join("|") + "/" + d.pupils.join("|");
  if (memory.stageModel && memory.stageModel.key === key) return memory.stageModel;
  const body = voxelize(d.body, { depth: S.cute.stageDepth || 7 });
  const skin = new Set([PAL.s, PAL.d, PAL.w, PAL.k, PAL.p, PAL.x, PAL.y, PAL.Y]);   // him, his eyes and mouth, the scooter
  (v.wear || []).forEach((it) => { if (it.swap) Object.values(it.swap).forEach((l) => skin.add(PAL[l])); });   // a hoodie recolours the skin, it is not a thing on him
  const tops = new Map();
  body.voxels.forEach((vx) => { const k = vx.x + "," + vx.y; if (!tops.has(k) || tops.get(k).z < vx.z) tops.set(k, vx); });
  tops.forEach((vx) => { if (!skin.has(vx.c)) for (let i = 1; i <= 2; i++) body.voxels.push({ x: vx.x, y: vx.y, z: vx.z + i, c: vx.c }); });
  const front = new Map();   // the pupils sit on the face, one cube proud of the eye whites, so they can slide about
  body.voxels.forEach((v) => { const k = v.x + "," + v.y; if (!front.has(k) || front.get(k) < v.z) front.set(k, v.z); });
  const pupils = { voxels: [], w: body.w, h: body.h, d: 1 };
  d.pupils.forEach((row, y) => [...row].forEach((ch, x) => { if (PAL[ch]) pupils.voxels.push({ x, y, z: (front.has(x + "," + y) ? front.get(x + "," + y) : 0) + 1, c: PAL[ch] }); }));
  memory.stageModel = { key, body, pupils };
  return memory.stageModel;
}
function placeStage() {   // after every draw: mount him in the side column, or lay the popup card over the board
  const bb = document.querySelector(".bb");
  if (!bb) return;
  if (S.cute.stageStyle === "side") {
    const col = bb.querySelector(".bb-stagecol"), canvas = col && col.querySelector(".bb-stage");
    if (!canvas || !memory.view) { if (memory.stageCtrl) { memory.stageCtrl.dispose(); memory.stageCtrl = null; memory.stageKey = ""; } return; }
    memory.stageOpen = true;
    mountStageIn(canvas, col);
    return;
  }
  const fly = bb.querySelector(".bb-stagecard");
  if (!fly) return;
  if (!memory.stageOpen || !memory.view) { fly.classList.remove("show"); return; }
  const z = loadScale(), br = bb.getBoundingClientRect(), grab = bb.querySelector(".bb-grab");
  const top = grab ? (grab.getBoundingClientRect().bottom - br.top) / z + 6 : 16;
  fly.classList.remove("in", "left", "right"); fly.classList.add("over", "show");
  fly.style.marginLeft = ""; fly.style.marginRight = ""; fly.style.top = Math.round(top) + "px";
  const bar = bb.querySelector(".bb-chestbar"), floor = bar ? (bar.getBoundingClientRect().top - br.top) / z - 8 : br.height / z - 16;
  const head = fly.querySelector(".bb-fly-head"), headH = head ? head.getBoundingClientRect().height / z : 36;
  const things = fly.querySelector(".bb-stage-things"), thingsH = things ? things.getBoundingClientRect().height / z + 8 : 0;
  const canvas = fly.querySelector(".bb-stage");
  canvas.style.height = Math.max(120, Math.min(S.cute.stageHeight || 250, floor - top - headH - thingsH - 34)) + "px";
  mountStageIn(canvas, fly);
}
function mountStageIn(canvas, host) {   // first time: load three and build him; after: swap the model when he changes
  const m = petModel();
  if (!m) return;
  if (!memory.stageCtrl) {
    if (memory.stageLoading) return;
    memory.stageLoading = true;
    loadThree().then(() => {
      memory.stageLoading = false;
      if (!memory.stageOpen || memory.stageCtrl) return;
      memory.stageCtrl = mountStage(canvas, m.body, { pupils: m.pupils, accent: S.spectrum[1] || S.accent, roll: memory.view.stage >= 5,
        onDizzy: () => { say(DIZZY_LINES[Math.floor(Math.random() * DIZZY_LINES.length)], 2600); play(S.cute.petMadSound, undefined, 0.6);
          if (memory.pet) { memory.pet.dizzy = (memory.pet.dizzy || 0) + 1; savePet(); checkFriends(memory.pet, memory.data, memory.view, Math.floor(Date.now() / 1000)); } } });
      memory.stageKey = m.key;
      redraw();   // the column turns "live": the sprite steps aside
    }).catch((e) => { memory.stageLoading = false; const el = host.querySelector(".bb-stage-err"); if (el) el.textContent = "3D didn't load: " + String((e && e.message) || e); });
  } else if (m.key !== memory.stageKey) { memory.stageKey = m.key; memory.stageCtrl.setModel(m.body, m.pupils); memory.stageCtrl.setRoll(memory.view.stage >= 5); }
  const fkey = friendsOf(memory.pet).map((f) => f.id).join(",");
  if (memory.stageCtrl && memory.stageCtrl.setFriends && fkey !== memory.friendsKey) {
    memory.friendsKey = fkey;
    memory.stageCtrl.setFriends(friendsOf(memory.pet).map((f) => { const d = FRIENDS.find((x) => x.id === f.id); return d ? { id: d.id, model: voxelize(d.grid, { depth: 5 }) } : null; }).filter(Boolean));
  }
}
function stageLook(e) {
  if (!memory.stageCtrl) return;
  const r = e.currentTarget.getBoundingClientRect();
  memory.stageCtrl.look(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2);   // the stage wants +1 at the top
}
const DIZZY_LINES = ["the room is spinning.", "ok. ok. put me down.", "i see three of you.", "that was the whole step budget.", "why."];
function stagePoke(e) {
  e.stopPropagation();
  if (memory.stageCtrl && memory.stageCtrl.wasDrag()) return;   // a spin is not a poke
  const petEl = document.querySelector(".bb-pet");
  if (petEl) poke({ currentTarget: petEl, stopPropagation() {}, preventDefault() {} });
  if (memory.stageCtrl) memory.stageCtrl.poke();
}
function Thumb({ item }) {   // a reward as a little 3D object (rendered once, then cached)
  memory.thumbs = memory.thumbs || {};
  const src = memory.thumbs[item.id];
  if (!src && !memory.thumbs["_" + item.id]) {
    memory.thumbs["_" + item.id] = true;
    const flat = item.kind === "wear" && item.proc === "hat";
    loadThree().then(() => renderThumb(voxelize(item.grid, flat ? { round: false, depth: 2 } : { depth: 4 }), 88))
      .then((url) => { memory.thumbs[item.id] = url; redraw(); }).catch(() => {});
  }
  const on = memory.pet ? whereIs(memory.pet, item.id) : null;
  return src ? <img src={src} className={on ? "" : "off"} data-item={item.id} onMouseDown={dragItem} onClick={(e) => { e.stopPropagation(); toggleThing(item.id); }}
                    title={`${item.name} · ${item.line} · click: ${on ? "take it off" : "put it on"}`} alt={item.name} />
             : <span style={{ width: 44, height: 44 }} />;
}
function StageCol({ view, pet, mood, now }) {   // he lives here, beside the list
  const nm = pet && pet.name, hatched = view && view.hatched;
  const owned = pet && hatched ? pet.drops.map((id) => ITEMS.find((it) => it.id === id)).filter((it) => it && it.grid && it.id !== "friend") : [];
  return (
    <div className={"bb-stagecol" + (memory.stageCtrl ? " live" : "") + (owned.length ? " has-things" : "")} onClick={(e) => e.stopPropagation()}>
      <div className="bb-stage-top"><b>{nm || (hatched ? "the pet" : "an egg")}</b><span>{hatched ? `${view.faceWord} · ${view.stageWord}` : ""}</span></div>
      <Pet view={view} mood={mood} now={now} />
      {hatched ? <div className="bb-stage-box"><canvas className="bb-stage" onMouseMove={stageLook} onClick={stagePoke} title="poke · drag to spin" /></div> : null}
      <div className="bb-stage-err" />
      {owned.length ? <div className="bb-stage-things">{owned.map((it) => <Thumb key={it.id} item={it} />)}</div> : null}
    </div>
  );
}
function StageCard({ view, pet }) {
  if (S.cute.stageStyle === "side") return null;
  if (!S.cute.pet || S.cute.stage === false) return null;
  const nm = pet && pet.name;
  const owned = pet ? pet.drops.map((id) => ITEMS.find((it) => it.id === id)).filter((it) => it && it.grid) : [];
  return (
    <div className="bb-fly bb-stagecard" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <div className="bb-fly-card">
        <div className="bb-fly-head"><b>{nm || "the pet"}</b><span>{view && view.hatched ? `${view.faceWord} · ${view.stageWord}` : ""}<i className="x" onClick={toggleStage} title="close">×</i></span></div>
        <canvas className="bb-stage" onMouseMove={stageLook} onClick={stagePoke} title="poke · drag to spin" />
        <div className="bb-stage-err" />
        {owned.length ? <div className="bb-stage-things">{owned.map((it) => <Thumb key={it.id} item={it} />)}</div> : null}
      </div>
    </div>
  );
}
function closeChest() { if (Date.now() - memory.dragEndAt < 400) return; closeStage(true); const L = layout(); if (L.open) { L.open = false; saveLayout(); redraw(); } }
// Pixel icons for projects (10×10). Each project gets its own; pick one by name in SETTINGS.icons.
const ICONS = {
  rocket:     ["....kk....", "...kwwk...", "...kwwk...", "..kwbbwk..", "..kwbbwk..", ".kkwwwwkk.", ".krkwwkrk.", ".krkkkkrk.", "...kook...", "....oo...."],
  box:        ["..kkkkkk..", ".kaaaaaak.", "kaaaaaaaak", "kkkkkkkkkk", "kNNNNNNNNk", "kNNNkkNNNk", "kNNNNNNNNk", "kNNNNNNNNk", "kNNNNNNNNk", ".kkkkkkkk."],
  flask:      ["...kkkk...", "...kwwk...", "...kwwk...", "...kwwk...", "..kwwwwk..", ".kwtttwwk.", "kwtttttwwk", "kttttttttk", "kttttttttk", ".kkkkkkkk."],
  bolt:       ["....kkkk..", "...kggk...", "..kggk....", ".kgggkkkk.", "kgggggggk.", "kkkkkgggk.", "....kggk..", "...kggk...", "..kgk.....", "..kk......"],
  heart:      [".kkk..kkk.", "kpppkkpppk", "kppppppppk", "kppwpppppk", "kppppppppk", ".kpppppk..", "..kppppk..", "...kppk...", "....kk....", ".........."],
  star:       ["....kk....", "...kggk...", "kkkkggkkkk", "kggggggggk", ".kggggggk.", "..kggggk..", "..kggggk..", ".kggkkggk.", "kgk....kgk", "kk......kk"],
  leaf:       ["......kkk.", "....kkeeek", "...keeeeek", "..keeEeeek", ".keeEeeek.", "keeEeeek..", "kEEeeek...", ".kEek.....", "..kk......", ".........."],
  gem:        ["..kkkkkk..", ".kswwsssk.", "kssssssdsk", "kssssssssk", ".kssssssk.", "..kssssk..", "...kssk...", "....kk....", "..........", ".........."],
  planet:     ["...kkkk...", "..kooook..", ".kooooook.", "kkkkkkkkkk", "kYYYYYYYYk", "kkkkkkkkkk", ".kooooook.", "..kooook..", "...kkkk...", ".........."],
  ghost:      ["..kkkkkk..", ".kwwwwwwk.", "kwwkwwkwwk", "kwwkwwkwwk", "kwwwwwwwwk", "kwwwwwwwwk", "kwwwwwwwwk", "kwkwwkwwkk", "kk.kk.kk..", ".........."],
  key:        ["..kkkk....", ".kggggk...", "kgkkkkgk..", "kgk..kgkkk", "kgkkkkgggk", ".kggggkgkk", "..kkkk.kgk", ".......kkk", "..........", ".........."],
  book:       ["kkkkkkkkk.", "kuuuuuuuuk", "kukwwwwkuk", "kukwwwwkuk", "kukwwwwkuk", "kukwwwwkuk", "kuuuuuuuuk", "kkkkkkkkk.", "..........", ".........."],
  controller: ["..kkkkkk..", ".kxxxxxxk.", "kxxkxxxrxk", "kxkkkxbxbk", "kxxkxxxgxk", "kxxxxxxxxk", ".kkkxxkkk.", "...kk.kk..", "..........", ".........."],
  coffee:     ["..k.k.....", "...k.k....", ".kkkkkkk..", ".kwwwwwkk.", ".kwnnnwkak", ".kwnnnwkak", ".kwwwwwkk.", "..kkkkk...", ".kkkkkkk..", ".........."],
  cloud:      ["....kkk...", "...kwwwk..", "..kkwwwwkk", ".kwwwwwwwk", "kwwwwwwwwk", "kwwwwwwwwk", ".kkkkkkkk.", "..........", "..........", ".........."],
  bug:        ["..k....k..", "...k..k...", "..kkkkkk..", ".kkeeeekk.", "kkeeeeeekk", ".kkeekeek.", "kkeeeeeekk", ".kkkkkkkk.", "..k....k..", ".........."],
};
const ICON_NAMES = Object.keys(ICONS);
function hashOf(id) { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
function assignIcons(ids) {   // every project its own icon: hash picks a start, then the next free one
  const map = {}, taken = new Set();
  ids.slice().sort().forEach((id) => {
    if (S.icons[id] && ICONS[S.icons[id]]) { map[id] = S.icons[id]; taken.add(S.icons[id]); }
  });
  ids.slice().sort().forEach((id) => {
    if (map[id]) return;
    let i = hashOf(id) % ICON_NAMES.length, tries = 0;
    while (taken.has(ICON_NAMES[i]) && tries++ < ICON_NAMES.length) i = (i + 1) % ICON_NAMES.length;
    map[id] = ICON_NAMES[i]; taken.add(ICON_NAMES[i]);
  });
  return map;
}
function iconOf(id) {
  const name = (memory.iconMap && memory.iconMap[id]) || (S.icons[id] && ICONS[S.icons[id]] ? S.icons[id] : ICON_NAMES[hashOf(id) % ICON_NAMES.length]);
  return ICONS[name];
}
function tintOf(id) {   // the row's colour: the icon's main colour (not its outline or white), else a spectrum colour by name
  const count = {};
  for (const row of iconOf(id)) for (const ch of row) if (!".kxyYw".includes(ch)) count[ch] = (count[ch] || 0) + 1;
  const top = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
  return (top && PAL[top]) || S.spectrum[hashOf(id) % S.spectrum.length];
}
const CHEST_CLOSED = ["..kkkkkkkkkkkk..", ".kNNNNNNNNNNNNk.", "kNnnnnnnnnnnnnNk", "kNnnnnnnnnnnnnNk", "kggggggggggggggk", "kNnnnnngGgnnnnNk",
                      "kNnnnnngggnnnnNk", "kNnnnnnnnnnnnnNk", "kNnnnnnnnnnnnnNk", "kNNNNNNNNNNNNNNk", ".kkkkkkkkkkkkkk."];
const CHEST_OPEN = [".kkkkkkkkkkkkkk.", "kNnnnnnnnnnnnnNk", "kNnnnnnnnnnnnnNk", "kNNNNNNNNNNNNNNk", "kkkkkkkkkkkkkkkk", "kggggggggggggggk",
                    "kNgGgGgGgGgGgGNk", "kNnnnnngGgnnnnNk", "kNnnnnngggnnnnNk", "kNnnnnnnnnnnnnNk", "kNNNNNNNNNNNNNNk", ".kkkkkkkkkkkkkk."];
// Drag a project's icon: into the chest to store it, out of the chest back to the list, or between rows to reorder.
function dragItem(e) {   // a thing: from the chest card, or out of the pet's hands / off the friend
  if (e.button !== 0) return;
  const el = e.currentTarget.closest("[data-item]"); if (!el) return;
  dragIcon(e, { item: el.dataset.item });
}
function dragIcon(e, what) {
  if (e.button !== 0) return;
  e.stopPropagation(); e.preventDefault();
  const icon = e.currentTarget, bb = icon.closest(".bb");
  if (!bb) return;
  const item = what && what.item;
  const row = item ? null : icon.closest("[data-id]");
  if (!item && !row) return;
  const id = item || row.dataset.id, fromChest = !item && !!row.closest(".bb-chest");
  const z = loadScale();
  const ghost = document.createElement("span"); ghost.className = "bb-ghost";   // a wrapper, so the sprite keeps its own .px class
  ghost.appendChild(((item && icon.querySelector(".px")) || icon).cloneNode(true));
  ghost.style.transform = `translate(-50%, -50%) scale(${1.4 * z})`;   // plain screen pixels, no zoom tricks
  const wrap = wrapperOf(bb) || document.body;   // the widget's own (unzoomed) box: sits above the panel, nothing can cover it
  wrap.appendChild(ghost);
  icon.classList.add("lifting");

  bb.classList.add("bb-dnd"); if (item) bb.classList.add("bb-dnd-thing"); hideFly(); memory.dragging = true;
  const chest = bb.querySelector(".bb-chestbar"), list = bb.querySelector(".bb-list"), petEl = bb.querySelector(".bb-petwrap"), buddy = bb.querySelector(".bb-buddy"), stageEl = bb.querySelector(".bb-stage");
  const inside = (el, ev, pad = 0) => { if (!el) return false; const r = el.getBoundingClientRect(); return ev.clientX >= r.left - pad && ev.clientX <= r.right + pad && ev.clientY >= r.top - pad && ev.clientY <= r.bottom + pad; };
  let target = null, index = null;
  const sx = e.clientX, sy = e.clientY; let moved = false;
  const move = (ev) => {
    if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return;
    moved = true;
    const wr = wrap.getBoundingClientRect();
    ghost.style.left = (ev.clientX - wr.left) + "px"; ghost.style.top = (ev.clientY - wr.top) + "px";
    bb.querySelectorAll(".ins-before, .ins-after").forEach((el) => el.classList.remove("ins-before", "ins-after"));
    target = null; index = null;
    if (item) {   // a thing: onto the pet, the friend, or back in the chest
      if (inside(petEl, ev, 6) || inside(stageEl, ev)) target = "pet"; else if (inside(buddy, ev, 10)) target = "friend"; else if (inside(chest, ev)) target = "chest";
      if (petEl) petEl.classList.toggle("over", target === "pet");
      if (buddy) buddy.classList.toggle("over", target === "friend");
      if (chest) chest.classList.toggle("over", target === "chest");
      return;
    }
    if (!fromChest && inside(chest, ev)) target = "chest";
    else if (inside(list, ev) || (fromChest && inside(bb.querySelector(".bb-body"), ev) && !inside(chest, ev))) {
      const rows = [...list.querySelectorAll(":scope > .bb-proj")];
      let i = rows.findIndex((r) => { const rr = r.getBoundingClientRect(); return ev.clientY < rr.top + rr.height / 2; });
      if (i < 0) i = rows.length;
      if (rows[i]) rows[i].classList.add("ins-before"); else if (rows[i - 1]) rows[i - 1].classList.add("ins-after");
      target = "list"; index = i;
    }
    if (chest) chest.classList.toggle("over", target === "chest");
  };
  const up = () => {
    document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up);
    ghost.remove(); icon.classList.remove("lifting"); bb.classList.remove("bb-dnd", "bb-dnd-thing"); [chest, petEl, buddy].forEach((el) => el && el.classList.remove("over"));
    bb.querySelectorAll(".ins-before, .ins-after").forEach((el) => el.classList.remove("ins-before", "ins-after"));
    memory.dragging = false; if (moved) memory.dragEndAt = Date.now();
    if (item) {
      if (target && memory.pet) { equip(memory.pet, id, target); play(target === "chest" ? S.cute.storeSound : S.cute.clickSound); if (memory.bit && memory.bit.id === id) memory.bit = null; }
      return;
    }
    const visible = [...bb.querySelectorAll(".bb-list > .bb-proj")].map((r) => r.dataset.id);
    if (target === "chest") storeProject(id);
    else if (target === "list" && fromChest) unstoreProject(id, index);
    else if (target === "list") reorderProject(id, index, visible);
  };
  document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
}
function openBoard() {
  if (Date.now() - memory.dragEndAt < 400) return;   // that was a drag, not a click
  if (S.boardUrl) run(`open ${sh(S.boardUrl)}`);
}

// ── Drag to move ────────────────────────────────────────────────────────────
// Übersicht places the widget with the CSS in `className` (top/right above).
// Dragging writes left/top straight onto that outer box and remembers them.
// The memory key includes SETTINGS.position, so editing it there wins again.
const POS_KEY = "build-board.pos:" + JSON.stringify(S.position);
function wrapperOf(el) { return (el && (el.closest("[id]") || el.parentElement)) || null; }
function loadPos() {
  if (memory.pos) return memory.pos;
  try { const v = localStorage.getItem(POS_KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function savePos(p) { memory.pos = p; try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch (e) {} }
function applyPos(wrap, p) {
  if (!wrap || !p) return;
  wrap.style.left = p.left + "px"; wrap.style.top = p.top + "px";
  wrap.style.right = "auto"; wrap.style.bottom = "auto";
}
function keepOnScreen(p, wrap) {   // whole width on screen, and at least the header visible
  const w = wrap ? wrap.offsetWidth : S.width;
  return { left: Math.min(Math.max(0, p.left), Math.max(0, window.innerWidth - w)),
           top: Math.min(Math.max(0, p.top), window.innerHeight - 60) };
}
// ── Resize ──────────────────────────────────────────────────────────────────
// Corner grip or ⌥+scroll = scale (CSS zoom on the panel). Right edge = width.
// Double-click the grip = back to SETTINGS. Both remembered in localStorage.
const SCALE_KEY = "build-board.scale:" + S.scale;
const WIDTH_KEY = "build-board.width:" + S.width;
const HEIGHT_KEY = "build-board.height:" + S.height;
function stored(key, mem, fallback) {
  if (memory[mem]) return memory[mem];
  try { const v = localStorage.getItem(key); return v !== null ? Number(v) : fallback; } catch (e) { return fallback; }
}
function store(key, mem, v) { memory[mem] = v; try { localStorage.setItem(key, String(v)); } catch (e) {} }
function loadScale() { return stored(SCALE_KEY, "scale", S.scale); }
function loadWidth() { return stored(WIDTH_KEY, "width", S.width); }
function loadHeight() { return stored(HEIGHT_KEY, "height", S.height); }
function saveScale(z) { store(SCALE_KEY, "scale", z); }
function saveWidth(w) { store(WIDTH_KEY, "width", w); }
function saveHeight(h) { store(HEIGHT_KEY, "height", h); }
function applySize(bb) {
  if (!bb) return;
  const z = loadScale(), w = loadWidth(), h = loadHeight();
  bb.style.zoom = z;
  bb.style.height = h ? h + "px" : "";
  // Never taller than the screen it's on: a board that fit the monitor must still fit the laptop.
  // The list scrolls inside instead of running off the bottom (same as a fixed height).
  const wrap = wrapperOf(bb);
  const top = wrap ? Math.max(0, wrap.getBoundingClientRect().top) : 0;
  const cap = Math.floor((window.innerHeight - top - 16) / z);
  bb.style.maxHeight = cap > 100 ? cap + "px" : "";
  bb.classList.add("bb-fixed");
  if (wrap) wrap.style.width = Math.round(w * z) + "px";
  if (!memory.sizeListener) { memory.sizeListener = true; window.addEventListener("resize", () => applySize(document.querySelector(".bb"))); }
}
function mountPos(el) {
  if (!el || memory.dragging) return;
  applySize(el);
  applyPos(wrapperOf(el), loadPos());
}
function pinTopLeft(wrap) {   // switch from "28px from the right" to a fixed top-left, so growing goes right/down
  if (loadPos()) return;
  const r = wrap.getBoundingClientRect();
  const p0 = { left: Math.round(r.left), top: Math.round(r.top) };
  applyPos(wrap, p0); savePos(p0);
}
function clampScale(z) { return Math.round(Math.min(2, Math.max(0.6, z)) * 100) / 100; }
function clampW(w) { return Math.round(Math.min(720, Math.max(240, w))); }
function clampH(h) { return Math.round(Math.min(window.innerHeight, Math.max(150, h))); }
function trackMouse(wrap, onMove) {
  memory.dragging = true; wrap.classList.add("bb-dragging"); hideFly();
  const up = () => {
    document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", up);
    wrap.classList.remove("bb-dragging"); memory.dragging = false; memory.dragEndAt = Date.now();
  };
  document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", up);
}
function startResize(e, axis) {       // axis: "w", "h", "wh" (right side) or "l", "lh" (left side)
  if (e.button !== 0) return;
  const bb = e.currentTarget.closest(".bb"), wrap = wrapperOf(bb);
  if (!wrap) return;
  pinTopLeft(wrap);
  const sx = e.clientX, sy = e.clientY, z = loadScale(), w0 = loadWidth(), h0 = loadHeight() || bb.offsetHeight;
  const p0 = loadPos() || { left: wrap.getBoundingClientRect().left, top: wrap.getBoundingClientRect().top };
  trackMouse(wrap, (ev) => {
    if (axis.includes("w")) saveWidth(clampW(w0 + (ev.clientX - sx) / z));
    if (axis.includes("l")) {           // left side: the right edge stays put, the box grows leftwards
      const w = clampW(w0 - (ev.clientX - sx) / z);
      saveWidth(w);
      const p = { left: Math.round(p0.left + (w0 - w) * z), top: p0.top };
      applyPos(wrap, p); savePos(p);
    }
    if (axis.includes("h")) saveHeight(clampH(h0 + (ev.clientY - sy) / z));
    applySize(bb);
  });
  e.preventDefault(); e.stopPropagation();
}
function resetSize(e) {
  const bb = e.currentTarget.closest(".bb");
  try { [SCALE_KEY, WIDTH_KEY, HEIGHT_KEY].forEach((k) => localStorage.removeItem(k)); } catch (err) {}
  memory.scale = 0; memory.width = 0; memory.height = 0; applySize(bb);
}
function wheelScale(e) {
  if (!e.altKey) return;
  e.preventDefault();
  const bb = e.currentTarget, wrap = wrapperOf(bb);
  pinTopLeft(wrap);
  saveScale(clampScale(loadScale() * (e.deltaY < 0 ? 1.04 : 0.96))); applySize(bb);
}
function startDrag(e) {
  if (!S.draggable || e.button !== 0) return;
  const wrap = wrapperOf(e.currentTarget);
  if (!wrap) return;
  const r = wrap.getBoundingClientRect();
  const sx = e.clientX, sy = e.clientY, ox = r.left, oy = r.top;
  let moved = false;
  const move = (ev) => {
    const dx = ev.clientX - sx, dy = ev.clientY - sy;
    if (!moved && Math.hypot(dx, dy) < 4) return;
    if (!moved) { moved = true; memory.dragging = true; wrap.classList.add("bb-dragging"); }
    const p = keepOnScreen({ left: Math.round(ox + dx), top: Math.round(oy + dy) }, wrap);
    applyPos(wrap, p); savePos(p);
  };
  const up = () => {
    document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up);
    wrap.classList.remove("bb-dragging"); memory.dragging = false;
    if (moved) memory.dragEndAt = Date.now();
  };
  document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
  e.preventDefault();
}

function styles(busy) {
  const off = S.pulse === "off";
  const slow = S.pulseSeconds, quick = S.pulseSeconds / 2;
  // panel breath: quicker and brighter on a day with commits (activity mode)
  const breathS = S.pulse === "activity" ? (busy ? slow * 0.75 : slow * 1.5) : slow;
  const breathHi = S.pulse === "activity" && busy ? 0.75 : 0.55;
  return `
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
    .bb { font-family: ${S.font}; color: ${S.text}; font-size: 11px; line-height: 1.4;
      background: ${S.panel};
      -webkit-backdrop-filter: blur(${S.glass}px) saturate(1.3); backdrop-filter: blur(${S.glass}px) saturate(1.3);
      border-radius: ${S.radius}px; padding: 16px 18px 14px; position: relative;
      box-shadow: inset 0 0 0 1px ${S.edge}, 0 16px 48px rgba(0,0,0,0.45);
      -webkit-font-smoothing: antialiased; font-feature-settings: "tnum"; -webkit-user-select: none; user-select: none; }
    .bb::before { content: ""; position: absolute; inset: -1px; border-radius: ${S.radius + 1}px; padding: 1px;
      background: ${SPECTRUM}; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude; opacity: 0.18; pointer-events: none;
      animation: ${off ? "none" : `bb-breathe ${breathS}s ease-in-out infinite`}; }
    .bb-grab { cursor: ${S.draggable ? "grab" : "default"}; margin: -16px -18px 0; padding: 16px 18px 0; }
    .bb-dragging .bb-grab, .bb-dragging .bb-title { cursor: grabbing; }
    .bb-dragging .bb { box-shadow: inset 0 0 0 1px ${S.edge}, 0 28px 70px rgba(0,0,0,0.6); }
    .bb-dragging .bb::before { opacity: 0.7; animation: none; }
    .bb-grip { position: absolute; right: 5px; bottom: 5px; width: 14px; height: 14px; cursor: nwse-resize; opacity: 0;
      transition: opacity .2s; border-radius: 0 0 ${S.radius - 6}px 0;
      background: linear-gradient(135deg, transparent 55%, ${S.muted} 55%, ${S.muted} 63%, transparent 63%,
        transparent 76%, ${S.muted} 76%, ${S.muted} 84%, transparent 84%); }
    .bb-grip.l { right: auto; left: 5px; cursor: nesw-resize; transform: scaleX(-1); border-radius: 0 0 ${S.radius - 6}px 0; }
    .bb:hover .bb-grip { opacity: 0.6; }
    .bb-edge { position: absolute; top: ${S.radius}px; bottom: ${S.radius}px; right: -3px; width: 8px; cursor: ew-resize; border-radius: 4px; }
    .bb-edge:hover, .bb-dragging .bb-edge { background: linear-gradient(90deg, transparent, ${S.edge}); }
    .bb-edge.l { right: auto; left: -3px; }
    .bb-edge.l:hover, .bb-dragging .bb-edge.l { background: linear-gradient(270deg, transparent, ${S.edge}); }
    .bb-bubbles { position: absolute; inset: 0; overflow: hidden; border-radius: ${S.radius}px; pointer-events: none; z-index: 0; }
    .bb > .bb-grab, .bb > .bb-body { position: relative; z-index: 1; }
    .bb-grip, .bb-edge, .bb-edge-b { z-index: 2; }
    .bb-mute { position: absolute; right: 22px; bottom: 9px; z-index: 3; cursor: pointer; line-height: 0; opacity: 0.45;
      transition: opacity .2s, transform .2s cubic-bezier(.3,1.5,.4,1); }
    .bb-mute:hover { opacity: 1; transform: scale(1.2); }
    .bb-mute .px { display: none; }
    .bb-mute.lv0 .px.lv0, .bb-mute.lv1 .px.lv1, .bb-mute.lv2 .px.lv2, .bb-mute.lv3 .px.lv3 { display: inline-block; }
    .bb-mute.lv0 { opacity: 0.7; }
    .bb.bb-party { animation: bb-dance 1.5s cubic-bezier(.3,1.3,.4,1) 1; }
    .bb.bb-party::before { animation: bb-rave .6s linear 4; opacity: 1; }
    .bb.bb-party .bb-proj { animation: bb-wave .7s cubic-bezier(.3,1.5,.4,1) 1; animation-delay: calc(var(--i, 0) * 80ms); }
    .bb-confetti { position: absolute; inset: 0; overflow: hidden; border-radius: ${S.radius}px; pointer-events: none; z-index: 4; }
    .bb-confetti i { position: absolute; left: var(--x); top: -14px; width: 6px; height: 10px; border-radius: 1px; background: var(--c);
      opacity: 0; transform: scale(var(--s)); animation: bb-fall var(--t) cubic-bezier(.3,.5,.7,1) var(--d) forwards; }
    @keyframes bb-fall { 0% { top: -14px; transform: scale(var(--s)) rotate(0); opacity: 1 } 80% { opacity: 1 }
      100% { top: 104%; transform: scale(var(--s)) rotate(var(--r)); opacity: 0 } }
    @keyframes bb-dance { 0% { transform: none } 12% { transform: translateY(-16px) rotate(-1.6deg) scale(1.03) }
      28% { transform: translateY(3px) rotate(1.6deg) } 44% { transform: translateY(-9px) rotate(-1deg) scale(1.015) }
      60% { transform: translateY(0) rotate(.8deg) } 78% { transform: translateY(-4px) } 100% { transform: none } }
    @keyframes bb-rave { from { filter: hue-rotate(0deg) brightness(1.8) } to { filter: hue-rotate(360deg) brightness(1.8) } }
    @keyframes bb-wave { 0% { transform: none } 35% { transform: translateY(-8px) scale(1.02) } 70% { transform: translateY(2px) } 100% { transform: none } }
    .bb-edge-b { position: absolute; left: ${S.radius}px; right: ${S.radius}px; bottom: -3px; height: 8px; cursor: ns-resize; border-radius: 4px; }
    .bb-edge-b:hover, .bb-dragging .bb-edge-b { background: linear-gradient(180deg, transparent, ${S.edge}); }
    .bb-body { flex: 1 1 auto; min-height: 0; }
    .bb.bb-fixed { display: flex; flex-direction: column; box-sizing: border-box; }
    .bb.bb-fixed .bb-body { overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; margin: 0 -18px; padding: 0 18px 6px;
      -webkit-mask-image: linear-gradient(#000 calc(100% - 22px), transparent); mask-image: linear-gradient(#000 calc(100% - 22px), transparent); }
    .bb.bb-fixed .bb-body::-webkit-scrollbar { display: none; }
    .bb-bubbles i { position: absolute; left: var(--x); bottom: -24px; width: var(--s); height: var(--s); border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.32); box-shadow: inset -1px -1px 2px rgba(255,255,255,0.22);
      animation: bb-rise var(--t) linear infinite; animation-delay: var(--dl); opacity: 0; }
    .bb-grip:hover, .bb-dragging .bb-grip { opacity: 1 !important; }
    .bb-eyebrow { font-size: 8px; font-weight: 600; letter-spacing: 0.16em; color: ${S.accent}; text-transform: uppercase; }
    .bb-head { display: flex; align-items: flex-end; justify-content: space-between; margin: 2px 0 8px; }
    .bb-title { font-size: 15px; font-weight: 600; letter-spacing: -0.015em; cursor: ${S.boardUrl ? "pointer" : "default"}; }
    .bb-title:hover { opacity: 0.8; }
    .bb-swap { display: inline-block; margin-left: 8px; margin-right: auto; font-size: 12px; color: ${S.muted}; opacity: 0; cursor: pointer; vertical-align: 2px;
      transition: opacity .2s, transform .2s cubic-bezier(.3,1.5,.4,1); }
    .bb:hover .bb-swap { opacity: 0.5; }
    .bb-swap:hover { opacity: 1 !important; transform: scale(1.25); }
    .bb-title .g { background: ${SPECTRUM}; -webkit-background-clip: text; background-clip: text; color: transparent; }
    .bb-stamp { color: ${S.muted}; font-size: 9px; }
    .bb-today { color: ${S.muted}; font-size: 9.5px; margin: 0 0 8px; }
    .bb-today b { color: ${S.text}; font-weight: 600; }
    .bb-rule { height: 1px; background: ${SPECTRUM}; opacity: 0.7; margin: 0 0 12px; }
    .bb-list { display: grid; gap: 5px; container-type: inline-size; }
    .bb-track { container-type: inline-size; }
    .bb-proj { display: grid; gap: 5px; cursor: ${S.clickOpens ? "pointer" : "default"}; border-radius: 8px; padding: 7px 10px 8px; min-width: 0;
      box-shadow: inset 0 0 0 1px ${S.edge}; transition: background .15s, box-shadow .15s; }
    ${S.rowTint > 0 ? `.bb-proj { background: color-mix(in srgb, var(--tint) ${Math.round(S.rowTint * 22)}%, rgba(0,0,0,0.45)); }   /* a shade darker than the panel, the faintest hint of the icon's colour; the edge stays neutral */
    .bb-proj:hover { background: color-mix(in srgb, var(--tint) ${Math.round(S.rowTint * 50)}%, rgba(0,0,0,0.45)); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.13); }` : `.bb-proj { background: rgba(0,0,0,0.45); } .bb-proj:hover { background: rgba(0,0,0,0.3); }`}
    @container (max-width: 330px) { .bb-proj .bb-new, .bb-proj .bb-spark { display: none; } .bb-proj .bb-sub .r { gap: 5px; } }   /* a narrow list drops the extras instead of spilling */
    .bb-proj.arrived { animation: bb-arrive 1.2s cubic-bezier(.2,.8,.2,1) both; }
    .bb-new { font-size: 7.5px; font-weight: 700; letter-spacing: 0.14em; padding: 1px 6px; border-radius: 999px; flex: none;
      border: 1px solid rgba(255,255,255,0.14); background: ${SPECTRUM}; -webkit-background-clip: text; background-clip: text; color: transparent; }
    .bb-parked { margin-top: 12px; padding-top: 9px; border-top: 1px solid ${S.edge}; color: ${S.muted}; font-size: 10px; }
    .bb-parked b { font-weight: 600; font-size: 9px; letter-spacing: 0.12em; margin-right: 6px; color: ${S.muted}; }
    .bb-track { margin-top: 14px; padding-top: 10px; border-top: 1px solid ${S.edge}; }
    .bb-track > b { display: block; font-weight: 600; font-size: 9px; letter-spacing: 0.12em; color: ${S.muted}; margin-bottom: 9px; }
    .bb-track > b i { font-style: normal; font-weight: 400; letter-spacing: 0; margin-left: 7px; opacity: 0.75; }
    .bb-steps.ticks div { grid-template-columns: 26px 1fr 18px; }
    .bb-steps.ticks .m { cursor: pointer; border-radius: 5px; text-align: center; transition: background .15s, transform .15s, color .15s; }
    .bb-steps.ticks .m:hover { background: rgba(255,255,255,0.14); color: ${S.text}; transform: scale(1.3); }
    .bb-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .bb-dot { width: 4px; height: 4px; border-radius: 50%; background: ${S.muted}; opacity: 0.35; flex: none; }
    .bb-proj.warm .bb-dot, .bb-proj.hot .bb-dot { background: ${S.spectrum[0]}; opacity: 1; }
    .bb-proj.warm .bb-dot { animation: ${off ? "none" : `bb-ping ${slow}s ease-out infinite`}; }
    .bb-proj.hot .bb-dot { background: ${S.spectrum[3] || S.spectrum[0]}; animation: ${off ? "none" : `bb-ping ${quick}s ease-out infinite`}; }
    .bb-name { font-weight: 500; font-size: 11px; letter-spacing: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
    .bb-pill { font-size: 7.5px; font-weight: 600; letter-spacing: 0.05em; padding: 1px 6px; border-radius: 999px; flex: none; max-width: 46%;
      border: 1px solid rgba(255,255,255,0.12); color: ${S.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: .85; font-variant-numeric: tabular-nums; }
    .bb-proj.full .bb-pill { border-color: transparent; background: ${SPECTRUM}; color: #fff; }
    .bb-proj.asleep .bb-pill { color: ${S.muted}; border-color: transparent; padding-right: 0; opacity: .8; }   /* a status, not a badge */
    .bb-bar { height: ${S.barHeight}px; border-radius: 999px; background: ${S.track}; overflow: hidden; }
    .bb-bar i { display: block; height: 100%; width: var(--w); min-width: ${S.barHeight}px; border-radius: 999px;
      background: ${SPECTRUM}; background-size: calc(100% / var(--f)) 100%;
      transition: width 1s cubic-bezier(.2,.8,.2,1); }
    .bb-proj.full .bb-bar i { animation: bb-sheen 3s linear infinite; background-size: 200% 100%;
      background-image: linear-gradient(90deg, ${S.spectrum.join(", ")}, ${S.spectrum[0]}); }
    .bb-sub { display: flex; justify-content: space-between; align-items: center; gap: 10px; color: ${S.muted}; font-size: 9px; min-width: 0; }
    .bb-sub .l { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bb-sub .r { white-space: nowrap; display: flex; align-items: center; gap: 7px; flex: none; }
    .bb-sub b { color: ${S.accent}; font-weight: 600; font-size: 7.5px; letter-spacing: 0.08em; margin-right: 4px; opacity: .9; }
    .bb-spark { display: flex; align-items: flex-end; gap: 2px; height: 8px; }
    .bb-spark i { display: block; width: 3px; border-radius: 1px; background: ${S.muted}; opacity: 0.35; height: var(--h); min-height: 1px; }
    .bb-spark i.on { background: ${SPECTRUM}; background-size: 42px 100%; opacity: 0.95; }
    .bb-spark { position: relative; cursor: default; padding: 4px 0; margin: -4px 0; transition: transform .2s cubic-bezier(.2,.8,.2,1); transform-origin: right bottom; }
    .bb-spark:hover { transform: scale(1.6); z-index: 3; }
    .bb-spark:hover i { opacity: 1; }
    .bb-sparktip { position: absolute; right: 0; bottom: calc(100% + 2px); transform: scale(.625); transform-origin: right bottom;
      display: none; flex-direction: column; gap: 3px; min-width: 128px; padding: 7px 9px; border-radius: 8px; white-space: nowrap;
      background: rgba(18,19,26,0.96); border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 8px 24px rgba(0,0,0,0.45);
      color: ${S.text}; font-size: 10.5px; line-height: 1.3; pointer-events: none; }
    .bb-spark:hover .bb-sparktip { display: flex; }
    .bb-sparktip b { color: ${S.muted}; font-weight: 600; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 2px; }
    .bb-sparktip > span { display: flex; justify-content: space-between; gap: 14px; }
    .bb-sparktip em { font-style: normal; font-weight: 600; background: ${SPECTRUM}; -webkit-background-clip: text; color: transparent; }
    .bb-bump { color: ${S.spectrum[3] || S.accent}; font-weight: 600; animation: bb-fade 4s ease-out forwards; }
    .bb-push { color: ${S.text}; font-weight: 600; }
    .bb-err { color: ${S.muted}; }
    .bb-lock { position: absolute; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; border-radius: ${S.radius}px; cursor: default;
      background: rgba(0,0,0,0.5); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px); }
    .bb-lock-card { text-align: center; }
    .bb-lock .t { font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: ${S.muted}; margin-bottom: 14px; }
    .bb-lock-in { display: block; width: 200px; box-sizing: border-box; padding: 9px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.14); outline: none;
      background: rgba(255,255,255,0.06); color: ${S.text}; font: inherit; font-size: 13px; letter-spacing: 0.08em; text-align: center; caret-color: ${S.text}; }
    .bb-lock-in:focus { border-color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.09); }
    .bb-lock-in::placeholder { color: ${S.muted}; letter-spacing: 0; }
    .bb-lock .row { display: flex; gap: 8px; justify-content: center; margin-top: 10px; }
    .bb-lock .go { font-size: 10px; letter-spacing: .1em; text-transform: uppercase; padding: 6px 14px; border-radius: 999px; background: rgba(255,255,255,0.08); cursor: pointer; color: ${S.text}; user-select: none; -webkit-user-select: none; }
    .bb-lock .go:hover { background: rgba(255,255,255,0.15); }
    .bb-lock .go.dim { background: transparent; color: ${S.muted}; }
    .bb-lock .e { margin-top: 10px; font-size: 10px; color: ${S.spectrum[3] || S.accent}; min-height: 14px; }
    .bb-lock.err .bb-lock-in { animation: bb-shake .4s ease; }
    @keyframes bb-shake { 0%, 100% { transform: none; } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
    .bb-proj { position: relative; }
    ${S.stepsStyle === "flyout" ? `
    .bb-fly { position: absolute; top: 0; z-index: 5; width: ${S.flyWidth || 300}px; visibility: hidden; opacity: 0;
      pointer-events: none; transition: opacity .18s ease, transform .18s ease; cursor: default; }
    .bb-fly.right { left: 100%; padding-left: 14px; transform: translateX(-6px); }
    .bb-fly.left { right: 100%; padding-right: 14px; transform: translateX(6px); }
    .bb-fly.in { left: auto; right: 0; padding: 0; transform: translateY(-4px); }
    .bb-fly.over { left: 10px; right: 10px; width: auto !important; padding: 0; transform: translateY(6px); }
    .bb-fly.over .bb-fly-card { width: auto; background: ${S.panel.replace(/[\d.]+\)\s*$/, "0.92)")}; }   /* more opaque than the panel so the rows don't bleed through. CSS here, so no // comments */
    .bb-fly.show { visibility: visible; opacity: 1; transform: none; pointer-events: auto; }
    .bb-fly-card { background: ${S.panel}; border-radius: ${S.radius - 4}px; padding: 12px 14px;
      -webkit-backdrop-filter: blur(${S.glass}px) saturate(1.3); backdrop-filter: blur(${S.glass}px) saturate(1.3);
      box-shadow: inset 0 0 0 1px ${S.edge}, 0 16px 48px rgba(0,0,0,0.5); }
    .bb-fly-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 6px;
      padding-bottom: 6px; border-bottom: 1px solid ${S.edge}; }
    .bb-fly-head b { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bb-fly-head span { color: ${S.muted}; font-size: 10px; white-space: nowrap; }
    .bb-steps { overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
    .bb-steps::-webkit-scrollbar { display: none; }
    ` : `
    .bb-steps { max-height: 0; overflow: hidden; transition: max-height .35s ease, margin .35s ease; margin: 0; }
    .bb-proj:hover .bb-steps { max-height: 520px; margin-top: 2px; }
    `}
    .bb-steps div { display: grid; grid-template-columns: 26px 1fr 10px; gap: 6px; font-size: 10.5px; color: ${S.muted}; padding: 2px 0; }
    .bb-steps .n { font-weight: 600; font-feature-settings: "tnum"; }
    .bb-steps .done { color: ${S.text}; opacity: 0.55; }
    .bb-steps .cur { color: ${S.text}; }
    .bb-steps .cur .n { color: ${S.accent}; }
    .bb-steps .m { text-align: right; }
    .bb-steps .cur .m { color: ${S.accent}; }
    .bb-burst { position: absolute; left: var(--w); top: 28px; width: 0; height: 0; pointer-events: none; z-index: 3; }
    .bb-burst.done { left: 50%; }
    .bb-burst i { position: absolute; left: -2px; top: -2px; width: 4px; height: 4px; border-radius: 50%; background: var(--c);
      box-shadow: 0 0 6px var(--c); animation: bb-spark var(--t) cubic-bezier(.1,.8,.3,1) forwards; }
    .bb-burst.done i { width: 5px; height: 5px; }
    .bb-petwrap { position: relative; display: inline-flex; align-items: flex-end; gap: 4px; vertical-align: bottom; margin-left: 10px; padding-bottom: 5px; cursor: pointer; }
    .px { position: relative; display: inline-block; overflow: visible; flex: none; }
    .px i { position: absolute; display: block; }
    .bb-pet { position: relative; display: inline-block; transform-origin: 50% 100%; animation: bb-idle 3s ease-in-out infinite; --px: 0px; --py: 0px; }
    .bb-pupils { position: absolute; left: 0; top: 0; transform: translate(var(--px), var(--py)); transition: transform .08s steps(1); }
    .bb-pet b { position: absolute; right: -2px; top: 2px; font-size: 8px; font-weight: 700; color: ${S.text}; opacity: 0; font-style: normal; }
    .bb-pet.sleep b, .bb-pet.stuffed b { animation: bb-zzz 2.4s ease-in-out infinite; }
    .bb-pet.warm { animation: bb-sway 2.6s ease-in-out infinite; }
    .bb-pet.hot { animation: bb-hop 1.1s cubic-bezier(.3,0,.2,1) infinite; }
    .bb-pet.w3, .bb-pet.w4, .bb-pet.stuffed { animation: bb-idle 3.6s ease-in-out infinite; }
    .bb-pet.hungry { filter: saturate(.55); animation: bb-idle 4s ease-in-out infinite; }
    .bb-pet.ghost { opacity: .5; filter: saturate(.15) brightness(1.3); animation: bb-float 3.2s ease-in-out infinite; }
    .bb-pet.egg { animation: bb-wobble 5s ease-in-out infinite; }
    .bb-pet.shiny .px { animation: bb-hue 2.4s linear infinite; }
    .bb-pet.hatch { animation: bb-squish .7s cubic-bezier(.3,1.6,.4,1) 3 !important; }
    .bb-pet:hover { opacity: 1; }
    .bb-statsbtn { display: inline-block; margin-left: 3px; padding-bottom: 1px; opacity: .5; cursor: pointer; transition: opacity .15s ease, transform .15s ease; }
    .bb-statsbtn:hover { opacity: 1; transform: translateY(-1px); }
    .bb-pet.poked { animation: bb-squish .45s cubic-bezier(.3,1.6,.4,1) !important; }
    .bb-held, .bb-friend, .bb-snack { animation: bb-pop .5s cubic-bezier(.2,1.4,.4,1); }
    .bb-held { margin-left: -5px; margin-bottom: 7px; }     /* sits in the hand, not floating */
    .bb-snack { margin-right: -5px; margin-bottom: 7px; }
    .bb-treat { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; border-radius: 2px; background: ${S.track}; overflow: hidden; }
    .bb-treat i { display: block; height: 100%; background: ${SPECTRUM}; background-size: 200% 100%; transition: width .8s ease; }
    .bb-petwrap.drop .bb-treat i { box-shadow: 0 0 6px ${S.spectrum[3] || S.accent}; }
    .bb-say { position: absolute; right: 0; bottom: calc(100% + 4px); max-width: 200px; white-space: nowrap; font-size: 10px; font-weight: 600;
      color: ${S.text}; background: rgba(20,19,26,0.96); padding: 4px 8px; border-radius: 10px 10px 2px 10px;
      box-shadow: inset 0 0 0 1px ${S.edge}, 0 6px 18px rgba(0,0,0,0.4); opacity: 0; transform: translateY(4px) scale(.9); transform-origin: 100% 100%;
      transition: opacity .18s ease, transform .18s cubic-bezier(.2,1.4,.4,1); pointer-events: none; z-index: 6; }
    .bb-say.show { opacity: 1; transform: none; }
    .bb-closet { width: 290px; }
    .bb-closet .name { cursor: text; border-bottom: 1px dashed transparent; }
    .bb-closet .name:hover { border-bottom-color: ${S.muted}; }
    .bb-closet input { font: inherit; font-size: 12px; font-weight: 600; color: ${S.text}; background: transparent; border: 0;
      border-bottom: 1px solid ${S.accent}; outline: 0; width: 130px; padding: 0; -webkit-user-select: text; user-select: text; }
    .bb-closet .stats { display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 4px 10px; align-items: baseline; font-size: 10.5px; }
    .bb-closet .stats span { color: ${S.muted}; font-size: 8.5px; letter-spacing: 0.1em; text-transform: uppercase; }
    .bb-closet .stats b { font-weight: 600; color: ${S.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bb .sec { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px solid ${S.edge};
      font-size: 8.5px; letter-spacing: 0.12em; text-transform: uppercase; color: ${S.muted}; }
    .bb .items { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 6px; margin-top: 8px; }
    .bb .it { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; cursor: default; }
    .bb .it .sp { height: 52px; display: flex; align-items: flex-end; justify-content: center; }
    .bb .it b { display: block; max-width: 100%; font-size: 9.5px; font-weight: 500; color: ${S.muted}; text-align: center;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bb .empty { margin-top: 8px; font-size: 10px; color: ${S.muted}; }
    .bb-closet-body { overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
    .bb-closet-body::-webkit-scrollbar { display: none; }
    .bb .sec .wallet { color: ${S.spectrum[1] || S.accent}; font-weight: 700; }
    .bb .it.buy { cursor: pointer; border-radius: 8px; padding: 4px 2px; margin: -4px -2px; transition: background .15s, transform .15s; }
    .bb .it.buy:hover { background: rgba(255,255,255,0.06); transform: translateY(-2px); }
    .bb .it.buy.deal .pr { color: ${S.spectrum[3] || S.accent}; }
    .bb .it.buy.deal .pr em { font-style: normal; font-size: 7.5px; letter-spacing: 0.1em; text-transform: uppercase; margin-left: 3px; opacity: .85; }
    .bb .it .pr { font-style: normal; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 8px; color: ${S.muted};
      border: 1px solid rgba(255,255,255,0.14); }
    .bb .it .pr.ok { color: #fff; border-color: transparent; background: ${SPECTRUM}; background-size: 200% 100%; }
    .bb-icon { display: inline-flex; line-height: 0; cursor: grab; flex: none; border-radius: 4px; opacity: .85; transition: transform .2s cubic-bezier(.3,1.5,.4,1), opacity .2s; }
    .bb-proj:hover .bb-icon { opacity: 1; }
    .bb-icon:hover { transform: scale(1.2); }
    .bb-dnd, .bb-dnd * { cursor: grabbing !important; }
    .bb-dnd-thing .bb-chestcard { opacity: 0.08; pointer-events: none; transition: opacity .15s; }
    .bb-dnd-thing .bb-petwrap, .bb-dnd-thing .bb-buddy { z-index: 40; }
    .bb-ghost .px { display: inline-block; }
    .bb-ghost { position: absolute; left: 0; top: 0; z-index: 9999; pointer-events: none; opacity: 0.95; display: inline-block;
      filter: drop-shadow(0 6px 10px rgba(0,0,0,0.5)); line-height: 0; }
    .bb-ghost .px { display: inline-block; }
    .lifting { opacity: 0.35; }
    .bb-proj.ins-before::after, .bb-proj.ins-after::after { content: ""; position: absolute; left: 0; right: 0; height: 2px; border-radius: 2px;
      background: ${SPECTRUM}; background-size: 200% 100%; top: -7px; }
    .bb-proj.ins-after::after { top: auto; bottom: -7px; }
    .bb-chestbar { flex: none; position: relative; display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin: 2px -6px 0; padding: 6px 6px 0;
      border-top: 1px solid ${S.edge}; border-radius: 12px; transition: background .2s; }   /* a thin footer under the list: the chest is always in reach */
    .bb-chestbar.over { background: rgba(244,198,79,0.08); }
    .bb-chestbar.over .bb-chestbtn { transform: translateY(-5px) scale(1.15); filter: drop-shadow(0 0 14px rgba(244,198,79,0.9)); animation: none; }
    .bb-chestbtn { display: inline-flex; line-height: 0; cursor: pointer; transition: transform .25s cubic-bezier(.3,1.5,.4,1), filter .25s;
      filter: drop-shadow(0 0 5px rgba(244,198,79,0.35)); }
    .bb-chestbtn:hover { transform: translateY(-3px) scale(1.08); }
    .bb-chestbtn.open { filter: drop-shadow(0 0 12px rgba(244,198,79,0.85)); animation: none; }
    @keyframes bb-glow { 0%, 100% { filter: drop-shadow(0 0 5px rgba(244,198,79,0.35)); } 50% { filter: drop-shadow(0 0 12px rgba(244,198,79,0.75)); } }
    .bb-chest-sum { font-size: 9px; color: ${S.muted}; display: inline-flex; align-items: center; gap: 4px; }
    .bb-chest-sum b { font-weight: 600; font-size: 8px; letter-spacing: 0.12em; }
    .bb-chest-sum .wallet, .bb .sec .wallet, .bb-fly-head .wallet { display: inline-flex; align-items: center; gap: 4px; color: ${S.spectrum[1] || S.accent}; font-weight: 700; margin-left: 6px; }
    .bb-chestcard { width: 340px; }
    .bb-stagecard .bb-fly-card { padding: 10px 12px 12px; }
    .bb-stagecard .bb-fly-head .x { cursor: pointer; margin-left: 8px; font-style: normal; font-size: 14px; line-height: 1; opacity: .7; }
    .bb-stagecard .bb-fly-head .x:hover { opacity: 1; }
    .bb-stage { display: block; width: 100%; height: ${S.cute.stageHeight || 250}px; cursor: pointer; border-radius: 12px;
      background: radial-gradient(ellipse at 50% 72%, rgba(255,255,255,0.06), transparent 70%); }
    .bb-stage-err { color: ${S.muted}; font-size: 10px; }
    .bb-split { display: flex; gap: 14px; min-height: 0; flex: 1; align-items: stretch; }
    .bb-split.plain { display: contents; }
    .bb-side .bb-body { flex: 1; min-width: 0; margin-right: 0; padding-right: 10px; }
    .bb-stagecol { position: relative; flex: 0 0 ${(S.cute.stageWidth || 0.46) < 1 ? Math.round((S.cute.stageWidth || 0.46) * 100) + "%" : S.cute.stageWidth + "px"}; max-width: 60%; min-height: 260px; margin-bottom: 6px; border-radius: ${S.radius - 4}px;
      background: radial-gradient(ellipse at 50% 72%, rgba(255,255,255,0.06), transparent 70%), rgba(0, 0, 0, 0.35); box-shadow: inset 0 0 0 1px ${S.edge}; }   /* a shade deeper than the panel, with a little light on the floor */
    .bb-stagecol .bb-stage-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 9px 12px 0; font-size: 10px; color: ${S.muted}; position: relative; z-index: 2; }
    .bb-stagecol .bb-stage-top b { color: ${S.text}; font-size: 11px; font-weight: 600; }
    .bb-stagecol .bb-stage-box { position: absolute; left: 0; right: 0; top: 34px; bottom: 10px; }   /* a canvas won't stretch between top and bottom on its own, a box will */
    .bb-stagecol.has-things .bb-stage-box { bottom: 58px; }
    .bb-stagecol .bb-stage { display: block; width: 100% !important; height: 100% !important; border-radius: 0; background: none; }   /* !important: the renderer writes its first measurement inline */
    .bb-stagecol .bb-stage-things { position: absolute; left: 8px; right: 8px; bottom: 8px; margin: 0; justify-content: center; }
    .bb-stagecol .bb-stage-things img { width: 40px; height: 40px; }
    .bb-stagecol .bb-stage-err { position: absolute; left: 12px; right: 12px; top: 50%; text-align: center; }
    .bb-stagecol .bb-petwrap { position: absolute; right: 10px; top: 30px; z-index: 3; margin: 0; padding: 0; }
    .bb-stagecol.live .bb-petwrap .bb-pet, .bb-stagecol.live .bb-petwrap .bb-held, .bb-stagecol.live .bb-petwrap .bb-snack { display: none; }   /* the 3D one is him now; the sprite stays for the egg, and if 3D can't load */
    .bb-stage-things { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
    .bb-stage-things img { width: 44px; height: 44px; border-radius: 10px; background: rgba(255,255,255,0.04); }
    .bb-stage-things img:hover { background: rgba(255,255,255,0.09); }
    .bb .it.friend { cursor: pointer; }
    .bb .it.friend img { width: 44px; height: 44px; border-radius: 10px; }
    .bb .it.friend:hover img { transform: translateY(-2px); }
    .bb-stage-things img { cursor: pointer; transition: opacity .2s, transform .2s; }
    .bb-stage-things img.off { opacity: .38; filter: saturate(.4); }   /* in the chest, not on him */
    .bb-stage-things img:hover { transform: translateY(-2px); }
    .bb-chestcard .bb-chest-body { overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; padding-right: 2px; }
    .bb-chestcard .bb-chest-body::-webkit-scrollbar { display: none; }
    .bb-stored { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-radius: 6px; }
    .bb-stored .bb-name { flex: 1; font-size: 12px; }
    .bb-stored .out { cursor: pointer; color: ${S.muted}; font-size: 12px; padding: 0 4px; transition: color .15s, transform .15s; }
    .bb-stored .out:hover { color: ${S.text}; transform: translateY(-2px); }
    .bb-stored .out.x:hover { color: ${S.spectrum[3] || "#ff8a3d"}; }
    .bb-off { margin-top: 6px; }
    .bb-off .toggle { font-size: 9.5px; color: ${S.muted}; cursor: pointer; opacity: 0.7; }
    .bb-off .toggle:hover { opacity: 1; color: ${S.text}; }
    .bb-stored.dim { opacity: 0.5; margin-top: 4px; }
    .bb-stored.dim .bb-name { text-decoration: line-through; text-decoration-color: ${S.muted}; }
    .bb-stored.dim:hover { opacity: 0.9; }
    .bb-icon.still { cursor: default; }
    .bb-icon.still:hover { transform: none; }
    .bb-case { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
    .bb-case .it .sp { height: 44px; width: 100%; background: linear-gradient(transparent, rgba(244,198,79,0.14)); border-bottom: 2px solid #b8871b;
      border-radius: 4px 4px 0 0; }
    .bb-petwrap.over .bb-pet, .bb-buddy.over > .px { transform: scale(1.18); filter: drop-shadow(0 0 8px ${S.spectrum[2] || S.accent}); }
    .bb-held.thing, .bb-carry.thing { cursor: grab; pointer-events: auto; }
    .bb-held.thing:hover, .bb-carry.thing:hover { transform: translateY(-2px) scale(1.1); }
    .bb-unbox { position: absolute; left: 50%; bottom: 60%; transform: translateX(-50%); line-height: 0; pointer-events: none; z-index: 6;
      animation: bb-unbox 2.6s cubic-bezier(.2,.9,.3,1) forwards; }
    .bb-unbox .bb-burst { left: 50%; top: 50%; }
    @keyframes bb-unbox { 0% { transform: translate(-50%, 30px) scale(.4); opacity: 0; } 25% { transform: translate(-50%, -26px) scale(1.25); opacity: 1; }
      70% { transform: translate(-50%, -22px) scale(1.1); opacity: 1; } 100% { transform: translate(-50%, -60px) scale(.9); opacity: 0; } }
    .bb-chestbtn.pop { animation: bb-chestpop .6s cubic-bezier(.3,1.6,.4,1); filter: drop-shadow(0 0 16px rgba(244,198,79,0.95)); }
    @keyframes bb-chestpop { 0% { transform: scale(1); } 40% { transform: scale(1.25) translateY(-6px) rotate(-3deg); } 100% { transform: scale(1); } }
    .bb .items.big { grid-template-columns: repeat(4, 1fr); }
    .bb .it.thing { cursor: grab; }
    .bb .it .where { font-style: normal; font-size: 8px; letter-spacing: 0.06em; color: ${S.muted}; opacity: 0.75; }
    .bb .it.pet .where, .bb .it.friend .where { color: ${S.spectrum[1] || S.accent}; opacity: 1; }
    .bb-trick-skate .bb-buddy { animation-duration: 14s; }
    .bb-trick-disco .bb::before, .bb-trick-disco.bb::before { animation: bb-rave .6s linear infinite; opacity: 1; }
    .bb-trick-disco .bb-pet { animation: bb-hop .5s ease-in-out infinite; }
    .bb-trick-jitter .bb-pet { animation: bb-jitter .12s linear infinite; }
    @keyframes bb-jitter { 0% { transform: translate(0,0) } 25% { transform: translate(1px,-1px) } 50% { transform: translate(-1px,1px) } 75% { transform: translate(1px,1px) } 100% { transform: translate(0,0) } }
    .bb-trick-flash { animation: bb-flash 1.2s steps(1) 3; }
    @keyframes bb-flash { 0% { filter: brightness(1) } 8% { filter: brightness(2.2) } 16% { filter: brightness(1) } 100% { filter: brightness(1) } }
    .bb-trick-neon .bb-title { text-shadow: 0 0 10px ${S.spectrum[2] || "#ff8ab8"}, 0 0 22px ${S.spectrum[2] || "#ff8ab8"}; }
    .bb-trick-mood { background: linear-gradient(160deg, rgba(123,63,209,0.18), transparent 60%), ${S.panel}; }
    .bb-trick-slash .bb-held { animation: bb-slash 1.4s ease-in-out infinite; transform-origin: 20% 80%; }
    @keyframes bb-slash { 0%, 100% { transform: rotate(0) } 30% { transform: rotate(-35deg) } 45% { transform: rotate(25deg) } }
    .bb-graves { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
    .bb-graves .it .sp { height: 40px; }
    .bb-graves .it b { color: ${S.text}; }
    .bb-mourn { filter: grayscale(0.7); transition: filter 2s; }
    .bb-wallet { position: absolute; left: 0; bottom: -4px; display: inline-flex; align-items: center; gap: 3px; font-style: normal; font-size: 9px;
      font-weight: 700; color: ${S.spectrum[1] || S.accent}; white-space: nowrap; animation: bb-pop .4s cubic-bezier(.2,1.4,.4,1); }
    .bb-floor { padding-bottom: 34px; }   /* a strip of floor for the friend to walk on */
    .bb-buddy { position: absolute; left: 8%; bottom: 8px; z-index: 2; pointer-events: none; transform-origin: center;
      animation: bb-wander 70s linear infinite; }
    .bb-buddy > .px { animation: bb-idle 1.4s ease-in-out infinite; }
    .bb-buddy.deliver { animation: bb-deliver ${S.cute.deliverSeconds || 6}s ease-in-out forwards; }
    .bb-buddy.deliver > .px { animation: bb-hop .5s ease-in-out infinite; }
    .bb-carry { position: absolute; bottom: calc(100% + 2px); left: 50%; transform: translateX(-50%); }
    .bb-held.late { animation: bb-pop .5s cubic-bezier(.2,1.4,.4,1) ${S.cute.deliverSeconds || 6}s backwards; }
    @keyframes bb-deliver { from { left: 8%; transform: scaleX(1); } to { left: 72%; transform: scaleX(1); } }
    @keyframes bb-wander { 0% { left: 8%; transform: scaleX(1); } 47% { left: 70%; transform: scaleX(1); } 50% { left: 70%; transform: scaleX(-1); }
      97% { left: 8%; transform: scaleX(-1); } 100% { left: 8%; transform: scaleX(1); } }
    .bb .plaque { margin-top: 10px; padding-top: 8px; border-top: 1px solid ${S.edge}; font-size: 10px; color: ${S.muted}; line-height: 1.5; }
    .bb .plaque b { color: ${S.text}; font-weight: 600; }
    @keyframes bb-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
    @keyframes bb-wobble { 0%, 100% { transform: rotate(0); } 46% { transform: rotate(0); } 50% { transform: rotate(-6deg); } 54% { transform: rotate(6deg); } 58% { transform: rotate(0); } }
    @keyframes bb-hue { to { filter: hue-rotate(360deg); } }
    @keyframes bb-pop { from { transform: scale(0); opacity: 0; } to { transform: none; opacity: 1; } }
    ${S.cute.wiggle ? `
    .bb-proj { transition: transform .25s cubic-bezier(.2,.8,.2,1); }
    .bb-proj:hover { transform: translateX(3px); }
    .bb-proj:hover .bb-dot { animation: bb-wiggle .5s ease-in-out; }
    .bb-pill { transition: transform .2s cubic-bezier(.2,.8,.2,1); }
    .bb-proj:hover .bb-pill { transform: scale(1.08); }
    .bb-proj:hover .bb-bar i { filter: brightness(1.15); }
    ` : ""}
    @keyframes bb-spark { 0% { transform: rotate(var(--a)) translateX(0) scale(1); opacity: 1 }
      100% { transform: rotate(var(--a)) translateX(var(--d)) scale(0); opacity: 0 } }
    @keyframes bb-rise { 0% { transform: translate(0, 0); opacity: 0 } 8% { opacity: .55 } 50% { transform: translate(7px, -300px) }
      92% { opacity: .35 } 100% { transform: translate(-3px, -620px); opacity: 0 } }
    @keyframes bb-squish { 0% { transform: scale(1.3, .7) } 40% { transform: scale(.85, 1.15) } 100% { transform: scale(1, 1) } }
    @keyframes bb-idle { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(.94) scaleX(1.03) } }
    @keyframes bb-blink { 0%,92%,100% { transform: scaleY(1) } 95% { transform: scaleY(.1) } }
    @keyframes bb-zzz { 0% { opacity: 0; transform: translate(0,0) } 30% { opacity: 1 } 100% { opacity: 0; transform: translate(6px,-9px) } }
    @keyframes bb-hop { 0%,100% { transform: translateY(0) scaleY(1) } 25% { transform: translateY(0) scaleY(.85) scaleX(1.1) }
      50% { transform: translateY(-5px) scaleY(1.08) scaleX(.95) } 75% { transform: translateY(0) } }
    @keyframes bb-sway { 0%,100% { transform: rotate(-7deg) } 50% { transform: rotate(7deg) } }
    @keyframes bb-wiggle { 0%,100% { transform: rotate(0) } 25% { transform: rotate(-12deg) } 75% { transform: rotate(12deg) } }
    @keyframes bb-breathe { 0%,100% { opacity: 0.18 } 50% { opacity: ${breathHi} } }
    @keyframes bb-ping { 0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.35) } 70% { box-shadow: 0 0 0 7px rgba(255,255,255,0) } 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0) } }
    @keyframes bb-sheen { from { background-position: 0 0 } to { background-position: 200% 0 } }
    @keyframes bb-fade { 0%,60% { opacity: 1 } 100% { opacity: 0 } }
    @keyframes bb-arrive { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: none } }
  `;
}

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function Spark({ days }) {   // 14 bars, oldest left. Hover: the bars grow and a tip lists the days with commits
  if (!days || !days.length) return null;
  const max = Math.max(1, ...days), total = days.reduce((a, b) => a + b, 0);
  const label = (i) => { const d = new Date(); d.setDate(d.getDate() - (days.length - 1 - i)); return i === days.length - 1 ? "today" : i === days.length - 2 ? "yesterday" : `${DAY[d.getDay()]} ${d.getDate()}`; };
  const hits = days.map((n, i) => n ? [label(i), n] : null).filter(Boolean);
  return (
    <span className="bb-spark">
      {days.map((n, i) => (
        <i key={i} className={n ? "on" : ""} style={{ "--h": `${Math.max(1, Math.round((n / max) * 10))}px`,
          backgroundPosition: `${-i * 3}px 0` }} />
      ))}
      <span className="bb-sparktip">
        <b>{total ? `${total} commit${total === 1 ? "" : "s"} · last 14 days` : "no commits in 14 days"}</b>
        {hits.map(([d, n]) => <span key={d}><span>{d}</span><em>{n}</em></span>)}
      </span>
    </span>
  );
}

function Steps({ steps }) {   // the "dropdown" style; "flyout" uses the shared card below
  if (!S.hoverSteps || S.stepsStyle === "flyout" || !steps || !steps.length) return null;
  return (
    <div className="bb-steps">
      {steps.map((st, i) => (
        <div key={i} className={st.status === "done" ? "done" : st.status === "current" ? "cur" : ""}>
          <span className="n">{st.n}</span><span>{st.name}</span>
          <span className="m">{st.status === "done" ? "✓" : st.status === "current" ? "●" : "○"}</span>
        </div>
      ))}
    </div>
  );
}

// One shared step card, kept outside the scrolling list so nothing clips it.
// On hover it's filled with that project's steps and placed so it never leaves
// the screen: side with room, capped to the screen, scrolled to the current step.
function esc(t) { return String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function hideFly() { document.querySelectorAll(".bb-fly:not(.bb-chestcard):not(.bb-stagecard)").forEach((f) => f.classList.remove("show")); clearTimeout(memory.closetT); }
function scheduleHide() { clearTimeout(memory.flyT); clearTimeout(memory.closetT); memory.flyT = setTimeout(hideFly, 160); }
function scheduleHideCloset() { clearTimeout(memory.flyT); clearTimeout(memory.closetT); memory.flyT = setTimeout(hideFly, 700); }   // time to cross to the card
function closetShowing() { const c = document.querySelector(".bb-closet"); return !!(c && c.classList.contains("show")); }
function keepFly() { clearTimeout(memory.flyT); }
function placeFly(fly, bb, anchor, list) {   // beside the widget, on the side with room, never off screen
  const z = loadScale(), margin = 16, W = window.innerWidth, H = window.innerHeight;
  const br = bb.getBoundingClientRect(), pr = anchor.getBoundingClientRect();
  fly.classList.add("show");
  fly.style.marginLeft = ""; fly.style.marginRight = "";
  fly.classList.remove("in", "left", "right");
  const width = fly.getBoundingClientRect().width || ((S.flyWidth || 300) + 14) * z;
  // The widget sits under every window, so a card beside it can be covered. When the panel is wide
  // enough to hold the card, open it inside instead, hugging the right edge.
  const inside = S.flyInside !== false && br.width >= width + 48 * z;
  const fitsRight = br.right + width <= W - margin, fitsLeft = br.left - width >= margin;
  const left = !inside && !fitsRight && (fitsLeft || br.left > W - br.right);   // all in screen pixels, so the zoom can't fool it
  fly.classList.toggle("in", inside); fly.classList.toggle("left", left); fly.classList.toggle("right", !inside && !left);
  const headBottom = inside && bb.querySelector(".bb-grab") ? bb.querySelector(".bb-grab").getBoundingClientRect().bottom + 6 : margin;
  if (list) list.style.maxHeight = Math.max(80, (H - margin - headBottom - 60) / z) + "px";
  const top = (pr.top - br.top) / z;
  fly.style.top = top + "px";
  let r = fly.getBoundingClientRect();
  if (list && r.height > H - margin * 2) {   // still too tall (zoomed): trim the list by the overflow
    list.style.maxHeight = Math.max(80, list.clientHeight - (r.height - (H - margin * 2)) / z) + "px";
    r = fly.getBoundingClientRect();
  }
  let shift = 0;
  if (r.bottom > H - margin) shift = (H - margin) - r.bottom;
  if (r.top + shift < headBottom) shift = headBottom - r.top;
  fly.style.top = Math.round(top + shift / z) + "px";
  let dx = 0;   // and never off the sides: slide it over the widget if it has to
  if (r.left < margin) dx = margin - r.left;
  if (r.right + dx > W - margin) dx = (W - margin) - r.right;
  if (dx) { if (left) fly.style.marginRight = Math.round(-dx / z) + "px"; else fly.style.marginLeft = Math.round(dx / z) + "px"; }
}
function showFly(proj) {
  if (S.stepsStyle !== "flyout" || !S.hoverSteps) return;
  const bb = proj.closest(".bb"), fly = bb && bb.querySelector(".bb-fly:not(.bb-closet)");
  const info = memory.stepsById[proj.dataset.id];
  if (!fly || !info || !info.steps.length) { hideFly(); return; }
  hideFly(); keepFly();
  fly.querySelector(".bb-fly-head b").textContent = info.name;
  fly.querySelector(".bb-fly-head span").textContent = `${info.done} / ${info.total} steps`;
  const list = fly.querySelector(".bb-steps");
  const ticks = info.id === "tools";   // the hand-kept track: its marks are buttons that write tools.json
  list.classList.toggle("ticks", ticks);
  list.innerHTML = info.steps.map((st) =>
    `<div class="${st.status === "done" ? "done" : st.status === "current" ? "cur" : ""}"><span class="n">${esc(st.n)}</span><span>${esc(st.name)}</span><span class="m"${ticks ? ` data-n="${esc(st.n)}" title="${st.status === "done" ? "undo" : "mark done"}"` : ""}>${st.status === "done" ? "✓" : st.status === "current" ? "●" : "○"}</span></div>`
  ).join("");
  memory.flyProj = proj;
  list.onclick = ticks ? (e) => { const m = e.target.closest(".m[data-n]"); if (m) tickStep(memory.stepsById[info.id] || info, m.dataset.n); } : null;
  placeFly(fly, bb, proj, list);
  const cur = list.querySelector(".cur");
  if (cur) list.scrollTop = Math.max(0, cur.offsetTop - list.clientHeight / 2 + cur.offsetHeight / 2);
}
// Click a mark in the track's card: flips that step, re-picks the current one, writes tools.json.
const TICK_PY = `import json,sys
p,n,st=sys.argv[1:4]
d=json.load(open(p))
for s in d["steps"]:
    if str(s["n"])==n: s["status"]=st
o=[s for s in d["steps"] if s["status"]!="done"]
for s in o: s["status"]="pending"
if o: o[0]["status"]="current"
json.dump(d,open(p,"w"),indent=2,ensure_ascii=False); open(p,"a").write("\\n")`;
function tickStep(info, n) {
  const st = info.steps.find((s) => String(s.n) === String(n));
  if (!st || !info.path) return;
  st.status = st.status === "done" ? "pending" : "done";
  const open = info.steps.filter((s) => s.status !== "done");
  open.forEach((s) => { s.status = "pending"; });
  if (open[0]) open[0].status = "current";
  info.done = info.steps.filter((s) => s.status === "done").length;
  run(`/usr/bin/env python3 -c ${sh(TICK_PY)} ${sh(info.path)} ${sh(String(n))} ${sh(st.status)} >/dev/null 2>&1`);
  if (st.status === "done") play(S.cute.stepSound);
  if (memory.flyProj) showFly(memory.flyProj);   // redraw the card right away; the bar follows on the next refresh
}
function pxHTML(rows, s) {
  const [w, h] = size(rows);
  return `<span class="px" style="width:${w * s}px;height:${h * s}px"><i style="left:${-s}px;top:${-s}px;width:${s}px;height:${s}px;box-shadow:${shadow(rows, s)}"></i></span>`;
}
function petName(pet, v) { return pet.name || (v.hatched ? "the pet" : "the egg"); }
function closetHead(fly, pet, v) {
  const b = fly.querySelector(".bb-fly-head b");
  b.innerHTML = `<span class="name" title="click to rename">${esc(petName(pet, v))}</span>`;
  b.querySelector(".name").onclick = () => renamePet(fly, pet, v);
  fly.querySelector(".bb-fly-head > span").textContent = v.hatched ? `${v.age + 1} day${v.age ? "s" : ""} old` : "an egg";   // "> span": the name is a span too
}
function renamePet(fly, pet, v) {   // the name in the card turns into a box; Enter or click away saves, Esc cancels
  const b = fly.querySelector(".bb-fly-head b");
  b.innerHTML = `<input maxlength="20" spellcheck="false" placeholder="name it">`;
  const inp = b.querySelector("input");
  inp.value = pet.name || "";
  let done = false;
  const finish = (save) => {
    if (done) return; done = true;
    if (save) { pet.name = inp.value.trim().slice(0, 20); savePet(); }
    closetHead(fly, pet, v);
    if (!fly.matches(":hover")) scheduleHide();
  };
  inp.onkeydown = (e) => { if (e.key === "Enter") finish(true); else if (e.key === "Escape") finish(false); e.stopPropagation(); };
  inp.onblur = () => finish(true);
  inp.focus(); inp.select();
}
function toggleCloset(e) {   // the little chart beside the pet: open the stats card, click again to close it
  e.stopPropagation(); e.preventDefault();
  const wrap = e.currentTarget.closest(".bb-petwrap"), bb = wrap && wrap.closest(".bb"), fly = bb && bb.querySelector(".bb-closet");
  if (!fly || !memory.pet || !memory.view) return;
  if (closetShowing()) { hideFly(); return; }
  hideFly(); keepFly(); buildCloset(fly, bb, wrap);
  play(S.cute.clickSound);
}
function buildCloset(fly, bb, wrap) {   // stats, the shop, what's collected
  const pet = memory.pet, v = memory.view, c = S.cute.coins;
  if (!pet || !v) return;
  const s = 2, coins = pet.coins || 0;
  closetHead(fly, pet, v);
  const owned = pet.drops.map((id) => ITEMS.find((it) => it.id === id)).filter(Boolean).reverse();
  const shop = ITEMS.filter((it) => !pet.drops.includes(it.id)).sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
  const row = (k, val) => `<span>${k}</span><b>${val}</b>`;
  const left = S.cute.diesAfterDays ? S.cute.diesAfterDays - idleDays(pet, Math.floor(Date.now() / 1000)) : 0;
  const feelsLine = { fed: "full and happy", peckish: "could eat", hungry: "hungry",
    ghost: left === 1 ? "a ghost. barely here" : "a ghost. fading", stuffed: "stuffed. nap time" }[v.face] || v.faceWord;
  const stats = v.hatched
    ? row("feels", esc(feelsLine)) + row("body", esc(v.stageWord)) +
      row("ate today", `${v.today} step${v.today === 1 ? "" : "s"}`) +
      row("wallet", `${coins} coin${coins === 1 ? "" : "s"}`) + row("stuff", `${owned.length} of ${ITEMS.length}`) +
      row("finished", `${pet.trophies.length} project${pet.trophies.length === 1 ? "" : "s"}`) + row("steps so far", `${pet.steps}`)
    : row("inside", pet.steps ? "something's moving" : "quiet so far") + row("laid", esc(pet.born)) +
      row("wallet", `${coins} coins`) + row("warm", "yes");
  const sprite = (it) => pxHTML(it.proc && !it.grid ? wearPreview(it) : it.grid, 3);   // things at 3x so you can tell what they are
  const card = (px, name, title, extra = "", attrs = "") => `<div class="it${extra ? " buy" : ""}" title="${esc(title)}"${attrs}><div class="sp">${px}</div><b>${esc(name)}</b>${extra}</div>`;
  const trophies = pet.trophies.map((t) => card(pxHTML(EXTRA.trophy, s), t.name, "100%. framed.")).join("");
  const snack = pet.snack && SNACKS.find((x) => x.id === pet.snack.id);
  const body = fly.querySelector(".bb-closet-body");
  body.innerHTML =
    `<div class="stats">${stats}</div>` +
    (trophies ? `<div class="sec"><span>trophies</span><span>${pet.trophies.length}</span></div><div class="items">${trophies}</div>` : "") +
    `<div class="plaque">${snack ? `last snack: ${esc(snack.name)}.<br>` : ""}born ${esc(pet.born)}, after <b>${pet.plaque} steps</b> of yours. click the name to change it.</div>`;
  placeFly(fly, bb, wrap, body);
}
function wearPreview(it) { return drawPet({ stage: 0, face: "fed", wear: [it] }).body; }
function Confetti() {   // 48 bits of the spectrum raining down the glass, once, when you push
  return (
    <span className="bb-confetti">
      {Array.from({ length: 48 }, (_, i) => (
        <i key={i} style={{ "--x": `${(i * 37) % 100}%`, "--c": S.spectrum[i % S.spectrum.length], "--d": `${(i * 53) % 700}ms`,
          "--t": `${1.3 + ((i * 7) % 5) * 0.15}s`, "--r": `${((i * 97) % 720) - 360}deg`, "--s": `${(i % 3) ? 1 : 1.5}` }} />
      ))}
    </span>
  );
}
function Burst({ kind, at }) {
  if (!S.cute.sparkles || !kind) return null;
  const n = kind === "done" ? 24 : 10;
  return (
    <span className={"bb-burst " + kind} key={at}>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} style={{ "--a": `${(360 / n) * i + (i % 2) * 11}deg`, "--d": `${(kind === "done" ? 30 : 16) + ((i * 7) % 22)}px`,
          "--c": S.spectrum[i % S.spectrum.length], "--t": `${0.7 + (i % 3) * 0.15}s` }} />
      ))}
    </span>
  );
}

const LINES = {
  any: ["ouch!", "hey!!", "stop that", "ok ow", "that tickles", "again?!", "i'm a widget, not a button", "go commit something",
        "poke the plan instead", "i felt that", "rude", "hi :)", "boop received"],
  sleep: ["zzz… huh?", "five more minutes", "i was dreaming of green CI", "no commits, no pokes", "wha— oh. hi.", "*yawn*"],
  warm: ["chillin', you?", "nice commit yesterday", "we could ship something", "poke me when it's green"],
  hot: ["we're cooking!!", "ouch, but proud", "look at us go", "streak's alive", "another one!", "ship ship ship"],
  mad: ["OUCH.", "STOP POKING ME", "i will log this", "that's it, i'm asleep", "…", "ok. rude.", "do you poke your plants too"],
  egg: ["…", "not yet.", "it's warm in here.", "knock knock? rude.", "*muffled*", "tick a step. i'm bored."],
  ghost: ["i saw the light. it was a 404.", "feed me or lose me.", "haunting your TODOs now.", "boo. commit.", "i'm not dead, i'm async."],
  hungry: ["i have not eaten since tuesday.", "is that a step? no? ok.", "one tick. please.", "the plan has steps. tick one.", "starving. dramatically."],
  peckish: ["half a meal. ok.", "more.", "that was an appetizer.", "one more and we're good."],
  stuffed: ["do not perceive me.", "i can't see my feet.", "put the steps down.", "*burp*", "full. so full."],
  scooter: ["the scooter is medical.", "beep beep.", "i earned this.", "don't look at me. look at the board.", "it has a horn."],
};
const DROP_LINES = ["oh? a package.", "finally. for me?", "unboxing…", "ok this one's good.", "*gasp*", "say less."];
const STAGE_WORDS = ["slim", "thicc", "fat", "cooked", "on the scooter", "obese", "a ball"];
const FACE_WORDS = { fed: "fed", peckish: "peckish", hungry: "hungry", ghost: "ghost", stuffed: "stuffed" };

// ── The pet's memory lives in .pet.json next to the widget ──────────────────
const PET_FILE = WIDGET_DIR + "/.pet.json";
function dayKey(t) {
  const d = new Date(t === undefined ? Date.now() : t * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysBetween(a, b) { return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000); }
function idleDays(pet, now) {   // days since it last ate a step (or since it was born)
  const today = dayKey(now);
  const fed = Object.keys(pet.days).filter((d) => pet.days[d] > 0).sort().pop() || pet.born;
  return Math.max(0, daysBetween(fed, today));
}
function petDies(pet, all, now) {   // permadeath: a stone in the graveyard, then a fresh egg with nothing
  const name = pet.name || "the pet";
  const stone = { name, born: pet.born, died: dayKey(now), steps: pet.steps, things: pet.drops.length, trophies: pet.trophies.length };
  const fresh = newPet(all);
  fresh.graveyard = (pet.graveyard || []).concat(stone).slice(-12);
  fresh.plaque = pet.plaque + pet.steps;
  memory.pet = fresh; memory.bit = null; memory.deathAt = Date.now();
  play(S.cute.petMadSound, undefined, 0.6);
  queueLine(`${name} is gone. a new egg.`);
}
function newPet(all) {
  const seen = {}; all.forEach((p) => { if (p.ok) seen[p.id] = p.done || 0; });
  return { born: dayKey(), plaque: all.reduce((n, p) => n + (p.done || 0), 0), seen, days: {}, steps: 0,
           drops: [], trophies: [], pushDays: {}, snack: null, late: "", shinyUntil: 0, coins: 0, log: [], graveyard: [], friends: [], dizzy: 0 };
}
function savePet() {
  if (!memory.pet) return;
  const json = JSON.stringify(memory.pet);
  if (json === memory.petSaved) return;
  memory.petSaved = json;
  run(`${FIND_DIR}; printf '%s' ${sh(json)} > ${PET_FILE}`);
}
function say(line, ms) {
  const el = document.querySelector(".bb-say");
  if (!el || !line) return;
  el.textContent = line; el.classList.add("show");
  clearTimeout(memory.sayT); memory.sayT = setTimeout(() => el.classList.remove("show"), ms || 2600);
  speak(line);
}
function queueLine(l) { memory.lineQ = l; }
// ── Things: where they are, and the bits they do on their own ───────────────
const SLOT_OF = { hat: "head", shades: "eyes", cartier: "eyes", chain: "neck", grill: "mouth", swap: "body", belly: "body", wrist: "wrist", lip: "lip" };
function equipOf(pet) {
  if (!pet.equip) pet.equip = { hold: null, wear: {}, friend: null }; if (!pet.equip.wear) pet.equip.wear = {};
  const held = pet.equip.hold && ITEMS.find((x) => x.id === pet.equip.hold);   // a thing that became wearable moves from the hand to its slot
  if (held && held.kind === "wear" && held.proc) { pet.equip.wear[SLOT_OF[held.proc] || "head"] = held.id; pet.equip.hold = null; }
  if (!pet.equip.dressed) {   // once: these used to be hand things; if they're owned and sitting in the chest, they go on
    for (const id of ["rolex", "blunt"]) {
      const it = ITEMS.find((x) => x.id === id), slot = it && SLOT_OF[it.proc];
      if (it && slot && pet.drops.includes(id) && !pet.equip.wear[slot] && !Object.values(pet.equip.wear).includes(id)) pet.equip.wear[slot] = id;
    }
    pet.equip.dressed = true;
  }
  return pet.equip;
}
function toggleThing(id) {   // click on a thing: off him into the chest, or out of the chest onto him
  const pet = memory.pet; if (!pet || id === "friend" || Date.now() - memory.dragEndAt < 400) return;
  const on = whereIs(pet, id);
  equip(pet, id, on ? "chest" : "pet");
  play(on ? S.cute.storeSound : S.cute.clickSound);
  const it = ITEMS.find((x) => x.id === id);
  say(on ? `${it ? it.name : "that"}: off.` : `${it ? it.name : "that"}: on.`, 1600);
}
// ── Friends: secret unlocks. Each rule reads what the pet already remembers. No hints anywhere. ──
const FRIEND_RULES = {
  friend: ({ pet }) => pet.drops.includes("friend") || (pet.friends || []).length === 0 && pet.steps >= 1,   // the first one comes with the first step
  owl: ({ pet }) => !!pet.nightPush,
  lark: ({ pet }) => !!pet.earlyPush,
  ember: ({ data }) => data && data.streak >= 7,
  closer: ({ pet }) => pet.trophies.length >= 1,
  courier: ({ pet }) => Object.values(pet.pushDays || {}).some((n) => n >= 5),
  weekender: ({ pet, now }) => { const d = new Date(now * 1000), dow = d.getDay(); const sat = now - ((dow + 1) % 7) * 86400, sun = sat + 86400; return (pet.days[dayKey(sat)] || 0) > 0 && (pet.days[dayKey(sun)] || 0) > 0; },
  hoarder: ({ pet }) => pet.drops.length >= 20,
  spinner: ({ pet }) => (pet.dizzy || 0) >= 10,
  revenant: ({ pet, view }) => !!pet.wasGhost && view && view.face === "fed",
};
function friendsOf(pet) { return (pet && pet.friends) || []; }
function checkFriends(pet, data, view, now) {   // after every view: anyone new?
  if (!pet || !view || !view.hatched) return;
  if (!pet.friends) pet.friends = [];
  if (view.face === "ghost") pet.wasGhost = true;
  const ctx = { pet, data, view, now };
  for (const f of FRIENDS) {
    if (pet.friends.some((x) => x.id === f.id)) continue;
    let ok = false; try { ok = !!FRIEND_RULES[f.id](ctx); } catch (e) { ok = false; }
    if (!ok) continue;
    pet.friends.push({ id: f.id, at: now });
    if (f.id !== "friend" || pet.friends.length > 1) { queueLine(`${f.name} showed up. ${f.line}`); play(S.cute.hatchSound); memory.partyAt = Date.now(); }
    savePet();
  }
}
function pokeFriend(id) {
  const f = FRIENDS.find((x) => x.id === id); if (!f) return;
  if (memory.stageCtrl && memory.stageCtrl.pokeFriend) memory.stageCtrl.pokeFriend(id);
  say(f.line, 2400); play(S.cute.petSound, undefined, 1.3);
}
function FriendCard({ f }) {   // one earned friend in the chest: its 3D self, click and it hops
  memory.thumbs = memory.thumbs || {};
  const key = "f:" + f.id, src = memory.thumbs[key];
  if (!src && !memory.thumbs["_" + key]) {
    memory.thumbs["_" + key] = true;
    loadThree().then(() => renderThumb(voxelize(f.grid, { depth: 5 }), 88)).then((url) => { memory.thumbs[key] = url; redraw(); }).catch(() => {});
  }
  return (
    <div className="it friend" title={f.line} onClick={(e) => { e.stopPropagation(); pokeFriend(f.id); }}>
      <div className="sp">{src ? <img src={src} alt={f.name} /> : <span style={{ width: 44, height: 44, display: "inline-block" }} />}</div><b>{f.name}</b>
    </div>
  );
}
function whereIs(pet, id) {   // "pet" | "friend" | null (in the chest)
  const eq = equipOf(pet);
  if (eq.hold === id || Object.values(eq.wear).includes(id)) return "pet";
  if (eq.friend === id) return "friend";
  return null;
}
function unequip(pet, id) {
  const eq = equipOf(pet);
  if (eq.hold === id) eq.hold = null;
  if (eq.friend === id) eq.friend = null;
  for (const k of Object.keys(eq.wear)) if (eq.wear[k] === id) delete eq.wear[k];
}
function equip(pet, id, where) {   // where: "pet" | "friend" | "chest"
  const it = ITEMS.find((x) => x.id === id); if (!it || !pet.drops.includes(id) || id === "friend") return;
  unequip(pet, id);
  const eq = equipOf(pet);
  if (where === "pet") { if (it.kind === "wear" && it.proc) eq.wear[SLOT_OF[it.proc] || "head"] = id; else if (it.grid) eq.hold = id; }
  else if (where === "friend" && it.grid) eq.friend = id;
  savePet(); if (memory.data) memory.view = petView(pet, memory.data, Math.floor(Date.now() / 1000)); redraw();
}
// Item-specific bits. Anything else just gets held, worn, or carried, with its one-liner.
const TRICKS = {
  skate: { kind: "friend", trick: "skate", line: "the friend took the board." },
  disco: { kind: "hold", trick: "disco", line: "disco. obviously." },
  energy: { kind: "hold", trick: "jitter", line: "400mg. i can see time." },
  camera: { kind: "hold", trick: "flash", line: "say commit." },
  neon: { kind: "shelf", trick: "neon", line: "SHIP. it says SHIP." },
  champagne: { kind: "hold", trick: "party", line: "pop. green CI, allegedly." },
  duck: { kind: "hold", line: "quack." },
  plushie: { kind: "hold", line: "soft." },
  cat: { kind: "friend", line: "the cat's on the keyboard again." },
  katana: { kind: "hold", trick: "slash", line: "one PR, four PRs." },
  cup: { kind: "hold", line: "*sips*" },
  blunt: { kind: "wear", line: "medicinal." },
  lamp: { kind: "shelf", trick: "mood", line: "mood." },
};
function pickBit(pet, now) {   // maybe start a bit: pet or friend does something with a thing you own
  if (memory.bit && now < memory.bit.until) return;
  memory.bit = null;
  if (!S.cute.alive || Math.random() >= S.cute.alive) return;
  const owned = pet.drops.map((id) => ITEMS.find((x) => x.id === id)).filter((it) => it && it.id !== "friend" && it.grid && it.kind !== "wear");   // he picks things up on his own, he doesn't put on what you took off
  if (!owned.length) return;
  const it = owned[Math.floor(Math.random() * owned.length)];
  const t = TRICKS[it.id] || {};
  let kind = t.kind || (it.kind === "wear" ? "wear" : Math.random() < 0.5 && pet.drops.includes("friend") ? "friend" : "hold");
  if (kind === "friend" && !pet.drops.includes("friend")) kind = "hold";
  memory.bit = { id: it.id, kind, trick: t.trick || "", until: now + (S.cute.bitSeconds || 75) };
  if (t.trick === "party") memory.partyAt = Date.now();
  queueLine(t.line || it.line);
}
function petTick(data, all, now) {   // once per refresh: credit new steps, drop treats, build the view
  if (!S.cute.pet || !data) return null;
  if (!memory.pet) {
    const saved = data.pet && data.pet.born ? data.pet : null;
    memory.pet = saved || newPet(all);
    memory.petSaved = saved ? JSON.stringify(saved) : "";
  }
  const pet = memory.pet, today = dayKey();
  let credit = 0;
  all.forEach((p) => {
    if (!p.ok) return;
    const prev = pet.seen[p.id];
    if (prev !== undefined && p.done > prev) credit += p.done - prev;
    pet.seen[p.id] = p.done || 0;
  });
  if (credit) {
    const was = pet.steps;
    pet.steps += credit; pet.days[today] = (pet.days[today] || 0) + credit;
    for (let i = 0; i < credit; i++) if (Math.random() < 0.05) { pet.shinyUntil = now + 3600; queueLine("ooh. shiny."); }
    if (was < S.cute.hatchAt && pet.steps >= S.cute.hatchAt) { memory.hatchAt = now; play(S.cute.hatchSound); queueLine("…hi."); }
    earn(pet, credit * (S.cute.coins.step || 0), `+${credit * (S.cute.coins.step || 0)} coins`);
  }
  // coins for commits: data.today is every commit today across the repos; pay for the ones not paid yet
  const tc = data.today || 0;
  // seen never beats today's real count: a squash or amend lowers the count, and the next commit must still pay
  const seen = Math.min(tc, pet.commitsSeen && pet.commitsSeen.day === today ? pet.commitsSeen.n : 0);
  if (tc > seen) earn(pet, (tc - seen) * (S.cute.coins.commit || 0), `+${(tc - seen) * (S.cute.coins.commit || 0)} coins for committing`);
  pet.commitsSeen = { day: today, n: Math.max(seen, tc) };
  if (pet.steps >= S.cute.hatchAt && S.cute.diesAfterDays && idleDays(pet, now) >= S.cute.diesAfterDays) petDies(pet, all, now);
  else if (pet.steps >= S.cute.hatchAt) pickBit(pet, now);
  savePet();
  memory.view = petView(memory.pet, data, now); checkFriends(memory.pet, data, memory.view, now);
  return memory.view;
}
function petPush(now) {   // a push just happened
  const pet = memory.pet; if (!pet) return;
  const today = dayKey(), h = new Date().getHours();
  if (h < 5) pet.late = today;
  if (h < 5) pet.nightPush = true; else if (h < 7) pet.earlyPush = true;
  if (!pet.pushDays[today]) {
    const sn = SNACKS[Math.floor(Math.random() * SNACKS.length)];
    pet.snack = { id: sn.id, at: now }; play(S.cute.snackSound); queueLine(sn.line);
  }
  pet.pushDays[today] = (pet.pushDays[today] || 0) + 1;
  savePet();
}
function petTrophy(name, now) {   // a project just hit 100%
  const pet = memory.pet; if (!pet) return;
  pet.trophies.unshift({ name, at: now }); pet.trophies = pet.trophies.slice(0, 20);
  queueLine(`${name}. done. framed. +${S.cute.coins.project || 0} coins.`);
  pet.coins = (pet.coins || 0) + (S.cute.coins.project || 0);
  savePet();
}
function earn(pet, n, line) { if (n > 0) { pet.coins = (pet.coins || 0) + n; if (line) queueLine(line); } }
// The shelf: a few things at a time, reshuffled every shopEvery minutes (seeded by the clock, so every refresh agrees), one of them half price.
function shopNow(pet, now = Date.now()) {
  const every = Math.max(1, S.cute.shopEvery || 5) * 60000, slot = Math.floor(now / every);
  const pool = ITEMS.filter((it) => !pet.drops.includes(it.id) && it.id !== "friend");   // friends aren't for sale
  let seed = (slot * 2654435761) >>> 0;
  const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const n = Math.max(1, S.cute.shopSize || 4), dealAt = S.cute.shopDeal === false ? -1 : slot % n;
  const items = pool.slice(0, n).map((it, i) => (i === dealAt ? { ...it, price: Math.ceil(it.price / 2), was: it.price, deal: true } : { ...it, deal: false }));
  return { items, left: pool.length, until: (slot + 1) * every };
}
function buyItem(id) {   // click in the shop (inside the chest)
  const pet = memory.pet, it = ITEMS.find((x) => x.id === id);
  if (!pet || !it || pet.drops.includes(id)) return;
  const offer = shopNow(pet).items.find((x) => x.id === id), price = offer ? offer.price : it.price;
  if ((pet.coins || 0) < price) { play(S.cute.petMadSound, undefined, 1.3); say(`${price - (pet.coins || 0)} more coins.`, 1800); return; }
  const now = Math.floor(Date.now() / 1000);
  pet.coins -= price;
  pet.drops.push(id); pet.log.unshift({ id, at: now }); pet.log = pet.log.slice(0, 40);
  memory.dropAt = now; memory.unbox = { id, at: Date.now() }; play(S.cute.treatSound);
  const eq = equipOf(pet);
  if (it.kind === "wear" && it.proc) eq.wear[SLOT_OF[it.proc] || "head"] = id; else if (it.kind === "hold") eq.hold = id;   // new things go straight on
  say(DROP_LINES[Math.floor(Math.random() * DROP_LINES.length)] + " " + it.name + ".", 3400);
  setTimeout(() => { if (memory.view) say(it.line, 2600); }, 3600);
  savePet();
  if (memory.data) memory.view = petView(pet, memory.data, now);
  checkFriends(pet, memory.data, memory.view, now);
  redraw();
}
function petView(pet, data, now) {
  const today = dayKey(), yest = dayKey(now - 86400), h = new Date().getHours();
  const t = pet.days[today] || 0, y = pet.days[yest] || 0, age = daysBetween(pet.born, today);
  const hatched = pet.steps >= S.cute.hatchAt;
  let face = "fed";
  if (t === 0 && y === 0 && age >= 2) face = "ghost";
  else if (t === 0 && (h >= 14 || (age >= 1 && y < S.cute.fedAt))) face = "hungry";
  else if (t < S.cute.fedAt) face = "peckish";
  else if (t >= S.cute.stuffedAt) face = "stuffed";
  let weight = 0;
  for (let i = age; i >= 1; i--) weight = Math.max(0, weight + (pet.days[dayKey(now - i * 86400)] || 0) - S.cute.fedAt);
  weight += t;
  const stage = weight >= 30 ? 6 : weight >= 21 ? 5 : weight >= 14 ? 4 : weight >= 10 ? 3 : weight >= 6 ? 2 : weight >= 3 ? 1 : 0;
  const eq = equipOf(pet), own = (id) => id && pet.drops.includes(id) ? ITEMS.find((x) => x.id === id) : null;
  const bit = memory.bit && now < memory.bit.until ? memory.bit : null;
  const slots = {};
  Object.entries(eq.wear).forEach(([slot, id]) => { const it = own(id); if (it && it.kind === "wear") slots[slot] = it; });
  if (bit && bit.kind === "wear") { const it = own(bit.id); if (it) slots[SLOT_OF[it.proc] || "head"] = it; }   // trying something on
  const flame = S.cute.streak && data.streak >= 7;
  if (flame) delete slots.head;
  const wear = Object.values(slots);
  const snack = pet.snack && now - pet.snack.at < S.cute.snackHours * 3600 && SNACKS.find((x) => x.id === pet.snack.id);
  const fresh = pet.log[0] && now - pet.log[0].at < 60 && pet.log[0].id !== "friend" && ITEMS.find((x) => x.id === pet.log[0].id);
  const carry = fresh ? (fresh.grid || EXTRA.box) : null;   // the friend walks this over to the pet
  const lastTrophy = pet.trophies[0] && now - pet.trophies[0].at < 86400;
  const bitHold = bit && bit.kind === "hold" ? own(bit.id) : null, eqHold = own(eq.hold);
  let held = null, heldId = null;   // the snack gets the other hand, so a thing in the hands stays draggable
  if (bitHold && bitHold.grid) { held = bitHold.grid; heldId = bitHold.id; }
  else if (eqHold && eqHold.grid) { held = eqHold.grid; heldId = eqHold.id; }
  else if (lastTrophy) held = EXTRA.trophy;
  const friend = hatched && pet.drops.includes("friend") ? ITEMS.find((x) => x.id === "friend").grid : null;
  const bitFriend = bit && bit.kind === "friend" ? own(bit.id) : null, eqFriend = own(eq.friend);
  const friendItem = friend && !carry ? (bitFriend && bitFriend.grid ? bitFriend : eqFriend && eqFriend.grid ? eqFriend : null) : null;
  return { hatched, face, stage, wear, held: hatched ? held : null, heldId, snack: hatched && snack ? snack.grid : null, friend, carry, friendItem, trick: bit ? bit.trick : "", flame,
           bags: pet.late === today, shiny: now < (pet.shinyUntil || 0),
           sleepy: false, steps: pet.steps, today: t, age, weight, stageWord: STAGE_WORDS[stage], faceWord: FACE_WORDS[face] };
}

function poke(e) {
  e.stopPropagation(); e.preventDefault();
  const pet = e.currentTarget, v = memory.view || {};
  const now = Date.now();
  if (now - memory.pokeAt > 5000) memory.pokes = 0;
  memory.pokes++; memory.pokeAt = now;
  const mood = ["sleep", "warm", "hot"].find((m) => pet.classList.contains(m));
  const r = Math.random();
  const pool = !v.hatched ? LINES.egg
             : memory.pokes >= 4 ? LINES.mad
             : v.stage === 4 && r < 0.5 ? LINES.scooter
             : LINES[v.face] && v.face !== "fed" && r < 0.6 ? LINES[v.face]
             : (LINES[mood] && r < 0.45) ? LINES[mood] : LINES.any;
  let line = pool[Math.floor(Math.random() * pool.length)];
  if (line === memory.lastLine) line = pool[(pool.indexOf(line) + 1) % pool.length];
  memory.lastLine = line;
  say(line, 1900);
  pet.classList.remove("poked"); void pet.offsetWidth; pet.classList.add("poked");
  clearTimeout(memory.pokedT); memory.pokedT = setTimeout(() => pet.classList.remove("poked"), 500);
  play(memory.pokes >= 4 ? S.cute.petMadSound : !v.hatched ? "Pop" : S.cute.petSound, undefined, memory.pokes >= 4 ? 0.8 : 1 + Math.min(memory.pokes - 1, 3) * 0.12);
}
function followEyes(e) {
  if (!S.cute.eyesFollow) return;
  const pet = e.currentTarget.querySelector(".bb-pet");
  if (!pet) return;
  const r = pet.getBoundingClientRect(), s = S.cute.petScale || 2;
  const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  pet.style.setProperty("--px", (Math.abs(dx) > 14 ? Math.sign(dx) * s : 0) + "px");
  pet.style.setProperty("--py", (Math.abs(dy) > 14 ? Math.sign(dy) * s : 0) + "px");
}
function restEyes(e) {
  const pet = e.currentTarget.querySelector(".bb-pet");
  if (pet) { pet.style.setProperty("--px", "0px"); pet.style.setProperty("--py", "0px"); }
}

function Px({ rows, s, className }) {
  const [w, h] = size(rows);
  return <span className={"px " + (className || "")} style={{ width: w * s, height: h * s }}><i style={{ left: -s, top: -s, width: s, height: s, boxShadow: shadow(rows, s) }} /></span>;
}
function Pet({ view, mood, now }) {
  if (!S.cute.pet || !view) return null;
  const s = S.cute.petScale || 2, egg = !view.hatched;
  const d = egg ? drawEgg(view.steps, S.cute.hatchAt)
                : drawPet({ stage: view.stage, face: view.face, wear: view.wear, bags: view.bags, flame: view.flame, sleepy: mood === "sleep",
                            arms: { right: !!view.held, left: !!view.snack } });
  const cls = ["bb-pet", egg ? "egg" : mood, egg ? "" : view.face, "w" + view.stage, view.shiny ? "shiny" : "",
               memory.hatchAt && now - memory.hatchAt < 5 ? "hatch" : ""].join(" ");
  const bar = egg ? view.steps / S.cute.hatchAt : 0;   // the bar only counts to the hatch now; after that the wallet shows
  const nm = memory.pet && memory.pet.name, coins = (memory.pet && memory.pet.coins) || 0;
  const hR = d.hand && d.hand.R, hL = d.hand && d.hand.L;   // [row, col] of each hand: things sit in them
  const inHand = (h, rows, side) => h ? { marginBottom: Math.max(0, (d.h - h[0] - rows.length / 2) * s) + "px",
    [side === "R" ? "marginLeft" : "marginRight"]: -((side === "R" ? d.w - h[1] - 1 : h[1]) * s + 2) + "px" } : undefined;
  const tip = egg ? `${nm || "an egg"} · ${S.cute.hatchAt - view.steps} steps to hatch` : `${nm ? nm + " · " : ""}${view.faceWord} · ${view.stageWord} · ${coins} coins · the chart opens the stats`;
  return (
    <span className={"bb-petwrap" + (memory.dropAt && now - memory.dropAt < 60 ? " drop" : "")} onMouseLeave={scheduleHideCloset} title={tip}>
      {view.snack ? <span className="bb-snack" style={inHand(hL, view.snack, "L")} key={view.snack.join("")}><Px rows={view.snack} s={s} /></span> : null}
      <span className={cls} onClick={(e) => { poke(e); if (S.cute.stage !== false) toggleStage(); }}>
        <Px rows={d.body} s={s} />
        {d.pupils.length ? <Px rows={d.pupils} s={s} className="bb-pupils" /> : null}
        <b>z</b>
      </span>
      {view.held ? <span className={"bb-held" + (view.carry && view.friend ? " late" : "") + (view.heldId ? " thing" : "")} key={view.held.join("")}
          data-item={view.heldId || undefined} onMouseDown={view.heldId ? dragItem : undefined} title={view.heldId ? "drag it off, onto the friend, or into the chest" : undefined} style={inHand(hR, view.held, "R")}>
          <Px rows={view.held} s={s} /></span> : null}
      <span className="bb-statsbtn" onClick={toggleCloset} onMouseDown={(e) => e.stopPropagation()} title="stats"><Px rows={EXTRA.chart} s={1.5} /></span>
      {egg ? <i className="bb-treat"><i style={{ width: `${Math.round(bar * 100)}%` }} /></i>
           : <i className="bb-wallet" key={coins}><Px rows={EXTRA.coin} s={1.5} />{coins}</i>}
      <span className="bb-say" />
    </span>
  );
}

function Bubbles() {
  const n = S.cute.bubbles | 0;
  if (!n) return null;
  return (
    <span className="bb-bubbles">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} style={{ "--x": `${6 + (i * 37) % 86}%`, "--s": `${5 + (i * 3) % 9}px`,
          "--t": `${12 + (i * 5) % 9}s`, "--dl": `${-((i * 3.7) % 14)}s` }} />
      ))}
    </span>
  );
}

function enterProj(e) {   // the row: just the sound. The card opens from the steps pill (enterPill)
  if (memory.dragging || closetShowing()) return;   // crossing a row on the way to the pet's card shouldn't swap cards
  const i = Number(e.currentTarget.dataset.i || 0);
  play(S.cute.hoverSound, S.cute.hoverVolume, S.cute.hoverPitch ? (0.85 + (i % 6) * 0.13).toFixed(2) : 0);
}
function enterPill(e) {
  if (memory.dragging || closetShowing()) return;
  keepFly();
  showFly(e.currentTarget.closest(".bb-proj"));
}

function Project({ data, now, lastPush, index }) {
  const cfg = { id: data.id, name: S.names[data.id] || data.name, path: data.path };
  const ok = data && data.ok && data.total > 0;
  const frac = ok ? data.done / data.total : 0;
  const pct = Math.round(frac * 100);
  const full = ok && data.done >= data.total;
  const asleep = ok && data.done === 0;
  const hot = S.pulse === "activity" && data && data.commitsToday > 0;
  const warm = !hot && data && data.commitAt && now - data.commitAt < S.activeHours * 3600;

  if (ok) {
    const prev = memory.done[cfg.id];
    if (prev !== undefined && data.done > prev) { memory.bumpAt[cfg.id] = now; if (!full) play(S.cute.stepSound); }
    memory.done[cfg.id] = data.done;
    const wasFull = memory.full[cfg.id];
    if (wasFull === false && full) { memory.doneAt[cfg.id] = now; play(S.cute.doneSound); petTrophy(cfg.name, now); }
    memory.full[cfg.id] = full;
  }
  const burst = memory.doneAt[cfg.id] && now - memory.doneAt[cfg.id] < 5 ? ["done", memory.doneAt[cfg.id]]
              : memory.bumpAt[cfg.id] && now - memory.bumpAt[cfg.id] < 5 ? ["step", memory.bumpAt[cfg.id]] : null;
  const bumped = memory.bumpAt[cfg.id] && now - memory.bumpAt[cfg.id] < 60;
  const pushed = lastPush && lastPush.repo === cfg.id && now - lastPush.at < 90;

  const arrived = memory.arrivedAt[cfg.id] && now - memory.arrivedAt[cfg.id] < 120;
  const cls = ["bb-proj", full ? "full" : "", asleep ? "asleep" : "", hot ? "hot" : warm ? "warm" : "", arrived ? "arrived" : ""].join(" ");
  const pill = !data.ok ? "?" : !data.hasPlan ? "NO PLAN" : !ok ? "PLAN" : full ? "DONE" : asleep ? "NOT STARTED" : `${data.done} / ${data.total}`;
  memory.stepsById[cfg.id] = { id: cfg.id, path: cfg.path, name: cfg.name, done: data.done, total: data.total, steps: data.steps || [] };
  const isNew = data.isNew && data.firstCommitAt && now - data.firstCommitAt < S.newForDays * 86400;

  let right = null;
  if (pushed) right = <span className="bb-push">pushed {ago(lastPush.at, now)}</span>;
  else if (bumped) right = <span className="bb-bump">+1 step</span>;
  else if (S.showActivity && data && data.commitAt)
    right = <span>{data.commitsWeek ? `${data.commitsWeek} this week · ` : ""}{ago(data.commitAt, now)}</span>;

  return (
    <div className={cls} style={{ "--w": `${pct}%`, "--f": Math.max(frac, 0.02), "--i": index, "--tint": tintOf(cfg.id) }}
         onClick={() => { if (Date.now() - memory.dragEndAt > 300 && S.clickOpens && cfg.path) guarded(() => openPath(cfg.path), cfg.name); }} onMouseEnter={enterProj} onMouseLeave={scheduleHide} data-i={index} data-id={cfg.id} title={cfg.path ? `open ${cfg.path}` : ""}>
      <div className="bb-row">
        <span className="bb-dot" />
        <span className="bb-icon" onMouseDown={dragIcon} onClick={(e) => e.stopPropagation()} title="drag me: into the chest, or up and down the list"><Px rows={iconOf(cfg.id)} s={1.5} /></span>
        <span className="bb-name">{cfg.name}</span>
        {isNew ? <span className="bb-new">NEW</span> : null}
        <span className="bb-pill" onMouseEnter={enterPill}>{pill}</span>
      </div>
      <div className="bb-bar"><i /></div>
      {S.showNext || S.showActivity || S.showSparkline ? (
        <div className="bb-sub">
          <span className="l">{S.showNext && ok
            ? (full ? "all steps done" : data.current ? <span><b>NEXT</b>{data.current}</span> : "")
            : data && data.error ? <span className="bb-err">can't read plan</span>
            : data && !data.hasPlan ? <span className="bb-err">no PLAN.md yet</span> : ""}</span>
          <span className="r">{S.showSparkline && data ? <Spark days={data.days} /> : null}{right}</span>
        </div>
      ) : null}
      <Steps steps={data && data.steps} />
      {burst ? <Burst kind={burst[0]} at={burst[1]} /> : null}
    </div>
  );
}

function Chest({ stored, pet, view }) {   // the chest itself: a glowing button at the bottom of the board
  const L = layout(), open = !!L.open, coins = (pet && pet.coins) || 0, hatched = view && view.hatched;
  const owned = pet ? pet.drops.length : 0;
  const sum = [stored.length ? `${stored.length} project${stored.length === 1 ? "" : "s"}` : "", owned ? `${owned} thing${owned === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ");
  const unbox = memory.unbox && Date.now() - memory.unbox.at < 3000 ? ITEMS.find((it) => it.id === memory.unbox.id) : null;
  return (
    <div className="bb-chestbar">
      <span className="bb-chest-sum"><b>CHEST</b>{sum ? ` · ${sum}` : ""}{hatched ? <span className="wallet"><Px rows={EXTRA.coin} s={1.5} />{coins}</span> : null}</span>
      <span className={"bb-chestbtn" + (open || unbox ? " open" : "") + (unbox ? " pop" : "")} onClick={toggleChest} title={open ? "close the chest" : "open the chest · drop a project's icon here to put it away"}>
        <Px rows={open || unbox ? CHEST_OPEN : CHEST_CLOSED} s={2} />
        {unbox ? <span className="bb-unbox" key={memory.unbox.at}><Px rows={unbox.proc && !unbox.grid ? wearPreview(unbox) : unbox.grid} s={3} /><Burst kind="done" at={memory.unbox.at} /></span> : null}
      </span>
    </div>
  );
}
function ChestCard({ stored, hidden, pet, view }) {   // the window the chest opens: trophy case, stored projects, shop, collection
  const L = layout(), open = !!L.open, coins = (pet && pet.coins) || 0, hatched = view && view.hatched;
  const owned = pet ? pet.drops.map((id) => ITEMS.find((it) => it.id === id)).filter((it) => it && it.id !== "friend").reverse() : [];
  const friends = friendsOf(pet).map((f) => FRIENDS.find((x) => x.id === f.id)).filter(Boolean).reverse();
  const shelf = pet ? shopNow(pet) : { items: [], left: 0, until: 0 }, shop = shelf.items;
  const mins = Math.max(1, Math.ceil((shelf.until - Date.now()) / 60000));
  const done = stored.filter((p) => p.ok && p.total > 0 && p.done >= p.total), kept = stored.filter((p) => !done.includes(p));
  const name = (p) => S.names[p.id] || p.name;
  const sprite = (it) => <Px rows={it.proc && !it.grid ? wearPreview(it) : it.grid} s={3} />;
  const row = (p) => (
    <div className="bb-stored" key={p.id} data-id={p.id} title="drag it back up to the board, or click ↑">
      <span className="bb-icon" onMouseDown={dragIcon}><Px rows={iconOf(p.id)} s={2} /></span>
      <span className="bb-name">{name(p)}</span>
      <span className="bb-pill">{p.ok && p.total ? (p.done >= p.total ? "DONE" : `${p.done} / ${p.total}`) : "NO PLAN"}</span>
      <span className="out" onClick={(e) => { e.stopPropagation(); unstoreProject(p.id); }} title="put it on the board">↑</span>
      <span className="out x" onClick={(e) => { e.stopPropagation(); hideProject(p.id); }} title="switch it off (the folder stays)">×</span>
    </div>
  );
  return (
      <div className={"bb-fly bb-chestcard right" + (open ? " show" : "")} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <div className="bb-fly-card">
          <div className="bb-fly-head"><b>the chest</b><span>{hatched ? <span className="wallet"><Px rows={EXTRA.coin} s={1.5} />{coins} coins</span> : "egg"}</span></div>
          <div className="bb-chest-body">
            {pet && hatched ? (
              <div>
                <div className="sec"><span>friends</span><span>{friends.length} / {FRIENDS.length}</span></div>
                {friends.length ? <div className="items big">{friends.map((f) => <FriendCard key={f.id} f={f} />)}</div>
                  : <div className="empty">no one yet. they find you.</div>}
                <div className="sec"><span>collected</span><span>{owned.length} / {ITEMS.length - 1}</span></div>
                {owned.length ? (
                  <div className="items big">{owned.map((it) => { const w = whereIs(pet, it.id); return (
                    <div className={"it thing" + (w ? " " + w : "")} key={it.id} data-item={it.id} onMouseDown={it.id === "friend" ? undefined : dragItem}
                         onClick={it.id === "friend" ? undefined : (e) => { e.stopPropagation(); toggleThing(it.id); }}
                         title={it.id === "friend" ? it.line : `${it.line} · click: ${w ? "take it off" : "put it on"} · or drag it onto your pet, the friend, or the chest`}>
                      <div className="sp">{sprite(it)}</div><b>{it.name}</b><i className="where">{it.id === "friend" ? "wandering" : w === "pet" ? "on the pet" : w === "friend" ? "with the friend" : "in the chest"}</i>
                    </div>); })}
                  </div>
                ) : <div className="empty">nothing yet. {S.cute.coins.step} coins per step, {S.cute.coins.commit} per commit, {S.cute.coins.push} per push, {S.cute.coins.project} per finished project.</div>}
              </div>
            ) : null}
            {pet && pet.graveyard && pet.graveyard.length ? (
              <div>
                <div className="sec"><span>graveyard</span><span>{pet.graveyard.length}</span></div>
                <div className="bb-graves">{pet.graveyard.slice().reverse().map((g, i) => (
                  <div className="it grave" key={i} title={`${g.name} · ${g.born} to ${g.died} · ate ${g.steps} steps · ${g.things} things · ${g.trophies} projects`}>
                    <div className="sp"><Px rows={EXTRA.grave} s={3} /></div><b>{g.name}</b><i className="where">{g.born.slice(5)} – {g.died.slice(5)} · {g.steps} steps</i>
                  </div>))}
                </div>
              </div>
            ) : null}
            {done.length ? (
              <div>
                <div className="sec"><span>trophy case</span><span>{done.length}</span></div>
                <div className="bb-case">{done.map((p) => (
                  <div className="it" key={p.id} data-id={p.id} title={`${name(p)} · 100% · drag it back up to add steps`}>
                    <div className="sp"><span className="bb-icon" onMouseDown={dragIcon}><Px rows={iconOf(p.id)} s={3} /></span></div><b>{name(p)}</b>
                  </div>))}
                </div>
              </div>
            ) : null}
            <div className="sec"><span>projects</span><span>{kept.length} in the chest</span></div>
            {kept.length ? kept.map(row) : (!hidden || !hidden.length) ? <div className="empty">drag a project's icon onto the chest to put it away.</div> : null}
            {hidden && hidden.length ? (
              <div className="bb-off">
                <span className="toggle" onClick={(e) => { e.stopPropagation(); memory.showOff = !memory.showOff; redraw(); }}>
                  {hidden.length} switched off {memory.showOff ? "▴" : "▾"}</span>
                {memory.showOff ? hidden.map((p) => (
                  <div className="bb-stored dim" key={p.id}>
                    <span className="bb-icon still"><Px rows={iconOf(p.id)} s={2} /></span>
                    <span className="bb-name">{name(p)}</span>
                    <span className="out" onClick={(e) => { e.stopPropagation(); unhideProject(p.id); }} title="bring it back">+</span>
                  </div>)) : null}
              </div>
            ) : null}
            {pet ? (
              <div>
                <div className="sec"><span>shop</span><span>{shelf.left} to find · new shelf in {mins} min</span></div>
                {!hatched ? <div className="empty">the shop opens when the egg hatches.</div>
                  : shop.length ? (
                    <div className="items">{shop.map((it) => (
                      <div className={"it buy" + (it.deal ? " deal" : "")} key={it.id} title={`${it.line} · ${it.price} coins${it.deal ? ` (was ${it.was})` : ""}`} onClick={() => buyItem(it.id)}>
                        <div className="sp">{sprite(it)}</div><b>{it.name}</b><i className={"pr" + (coins >= it.price ? " ok" : "")}>{it.price}{it.deal ? <em>sale</em> : null}</i>
                      </div>))}
                    </div>
                  ) : <div className="empty">sold out. you own it all.</div>}
              </div>
            ) : null}
          </div>
        </div>
      </div>
  );
}
function placeChest() {   // after every draw: the card sits beside the chest (or inside a wide widget), scrolls on its own
  const bb = document.querySelector(".bb"), fly = bb && bb.querySelector(".bb-chestcard"), btn = bb && bb.querySelector(".bb-chestbtn");
  if (!fly || !btn) return;
  const body = fly.querySelector(".bb-chest-body");
  if (!layout().open) { fly.classList.remove("show"); return; }
  if (S.chestStyle === "beside") { placeFly(fly, bb, btn, body); return; }
  // Overlay: the card lies over the board, under the header, as wide as the panel, and never past its bottom.
  const z = loadScale(), br = bb.getBoundingClientRect(), grab = bb.querySelector(".bb-grab");
  const top = grab ? (grab.getBoundingClientRect().bottom - br.top) / z + 6 : 16;
  fly.classList.remove("in", "left", "right"); fly.classList.add("over", "show");
  fly.style.marginLeft = ""; fly.style.marginRight = ""; fly.style.top = Math.round(top) + "px";
  const head = fly.querySelector(".bb-fly-head"), headH = head ? head.getBoundingClientRect().height / z : 36;
  const bar = bb.querySelector(".bb-chestbar");   // the card ends above the footer, so the chest stays clickable
  const floor = bar ? (bar.getBoundingClientRect().top - br.top) / z - 8 : br.height / z - 16;
  if (body) body.style.maxHeight = Math.max(80, floor - top - headH - 30) + "px";   // 30 = the card's padding and its 6px lift
}

function Title() {
  if (!S.title) return null;
  const w = S.titleGradientWord;
  const inner = w && S.title.includes(w)
    ? (() => { const [a, b] = S.title.split(w); return <span>{a}<span className="g">{w}</span>{b}</span>; })()
    : S.title;
  return <span className="bb-title" onClick={openBoard} title={S.boardUrl ? "open the board" : ""}>{inner}</span>;
}

function renderBoard({ output, error }) {
  let data = null, parseError = null;
  try { data = output ? JSON.parse(output) : null; } catch (e) { parseError = e.message; }
  const now = Math.floor(Date.now() / 1000);
  const today = data ? data.today || 0 : 0;
  const hiddenIds = layout().hidden || [];
  if (data) memory.iconMap = assignIcons(data.projects.map((p) => p.id));
  const all = data ? data.projects.filter((p) => !S.hide.includes(p.id) && !hiddenIds.includes(p.id)) : [];
  const hidden = data ? data.projects.filter((p) => hiddenIds.includes(p.id)) : [];
  if (data) memory.screens = data.screens || [];
  if (!shownHere(data)) return <span className="bb-off" style={{ display: "none" }} />;   // another display has it
  memory.data = data;
  const view = petTick(data, all, now);
  // a project that shows up after the first read slides in from the top
  if (data) {
    const ids = all.map((p) => p.id);
    if (memory.seen) {
      const fresh = ids.filter((id) => !memory.seen.has(id));
      fresh.forEach((id) => { memory.arrivedAt[id] = now; });
      if (fresh.length) play(S.cute.newSound);
    }
    memory.seen = new Set(ids);
    const pushAt = data.lastPush ? data.lastPush.at : null;
    if (memory.pushSeen !== null && pushAt && pushAt !== memory.pushSeen && now - pushAt < 90) {
      play(S.cute.pushSound); petPush(now); memory.partyAt = Date.now();
      if (memory.pet && S.cute.coins.push) earn(memory.pet, S.cute.coins.push, `+${S.cute.coins.push} coins for pushing`);
    }
    memory.pushSeen = pushAt;
  }
  const anyWarm = all.some((p) => p.commitAt && now - p.commitAt < S.activeHours * 3600);
  const mood = today > 0 ? "hot" : anyWarm ? "warm" : "sleep";
  const side = !!(S.cute.pet && S.cute.stage !== false && S.cute.stageStyle === "side");
  const L = layout();
  if (!L.board && data) {   // first run with a chest: what was on the board stays on the board, the rest goes in the chest
    const parkLine = S.parkAfterDays * 86400;
    const live = all.filter((p) => (!parkLine || p.id === "tools" || now - (p.activityAt || 0) < parkLine) && !(L.stored || []).includes(p.id)
                                   && (p.hasPlan || (p.commitAt && now - p.commitAt < 7 * 86400)));
    const ordered = live.filter((p) => p.id !== "tools").sort((a, b) => { const ia = L.order.indexOf(a.id), ib = L.order.indexOf(b.id);
      if (ia < 0 && ib < 0) return 0; if (ia < 0) return 1; if (ib < 0) return -1; return ia - ib; });
    setBoard(ordered.map((p) => p.id), live.some((p) => p.id === "tools"));
  }
  const board = L.board || [];
  const parked = [];
  const stored = all.filter((p) => !board.includes(p.id)).sort((a, b) => (b.activityAt || 0) - (a.activityAt || 0));   // the chest
  const track = all.find((p) => p.id === "tools" && board.includes("tools"));   // hand-kept, no repo: sits apart at the bottom
  const repos = board.map((id) => all.find((p) => p.id === id)).filter((p) => p && p.id !== "tools");
  if (memory.lineQ) { const l = memory.lineQ; memory.lineQ = ""; setTimeout(() => say(l, 3200), 400); }
  const party = S.cute.pushParty && memory.partyAt && Date.now() - memory.partyAt < 4000;   // just pushed: the whole panel celebrates

  return (
    <div className={"bb" + (view && view.friend && !side ? " bb-floor" : "") + (party ? " bb-party" : "") + " bb-fixed" + (side ? " bb-side" : "") + (view && view.trick ? " bb-trick-" + view.trick : "") + (memory.deathAt && Date.now() - memory.deathAt < 60000 ? " bb-mourn" : "")} ref={mountPos} onMouseMove={(e) => { touch(); followEyes(e); }} onMouseLeave={restEyes} onWheel={wheelScale} onClick={closeChest}>
      {party ? <Confetti key={memory.partyAt} /> : null}
      <style>{styles(today > 0)}</style>
      <Bubbles />
      {view && view.friend && !side ? (
        <span className={"bb-buddy" + (view.carry ? " deliver" : "") + (view.friendItem ? " holding" : "")} title={view.carry ? "delivery." : "a friend. not your pet."}>
          {view.carry ? <Px rows={view.carry} s={S.cute.petScale || 2} className="bb-carry" /> : null}
          {view.friendItem ? <span className="bb-carry thing" data-item={view.friendItem.id} onMouseDown={dragItem} title={`${view.friendItem.name} · drag it off`}><Px rows={view.friendItem.grid} s={S.cute.petScale || 2} /></span> : null}
          <Px rows={view.friend} s={S.cute.petScale || 2} />
        </span>
      ) : null}
      <div className="bb-grab" onMouseDown={startDrag} title={S.draggable ? "drag to move" : ""}>
        {S.eyebrow ? <div className="bb-eyebrow">{S.eyebrow}</div> : null}
        <div className="bb-head">
          <Title />
          {memory.screens && memory.screens.length > 1 && S.screen !== "all"
            ? <span className="bb-swap" onClick={swapScreen} onMouseDown={(e) => e.stopPropagation()} title="send to the other display">⇄</span> : null}
          <span className="bb-stamp">{data ? ago(data.generatedAt, now) : "…"}{side ? null : <Pet view={view} mood={mood} now={now} />}</span>
        </div>
        {S.showToday && data ? (
          <div className="bb-today">
            {today ? <span><b>{today} commit{today === 1 ? "" : "s"} today</b> · {data.activeToday} project{data.activeToday === 1 ? "" : "s"}</span>
                   : <span>no commits yet today</span>}
            {S.cute.streak && data.streak >= 2 ? <span> · 🔥 {data.streak}-day streak</span> : null}
          </div>
        ) : null}
        <div className="bb-rule" />
      </div>
      <div className={"bb-split" + (side ? "" : " plain")}>
      <div className="bb-body" onScroll={hideFly}>
        {error || parseError ? (
          <div className="bb-err">board.py didn't answer: {String(error || parseError)}</div>
        ) : (
          <div>
            <div className="bb-list">
              {repos.map((p, i) => <Project key={p.id} data={p} now={now} lastPush={data && data.lastPush} index={i} />)}
            </div>
            {track ? (
              <div className="bb-track"><b>TRACK<i>hand-kept · no repo · tick steps in the card</i></b>
                <Project key="tools" data={track} now={now} lastPush={null} index={repos.length} />
              </div>
            ) : null}
            {parked.length ? (
              <div className="bb-parked"><b>PARKED</b>{parked.map((p) => S.names[p.id] || p.name).join(" · ")}</div>
            ) : null}
          </div>
        )}
      </div>
      {side ? <StageCol view={view} pet={memory.pet} mood={mood} now={now} /> : null}
      </div>
      {S.cute.chest !== false && !(error || parseError) ? <Chest stored={stored} pet={memory.pet} view={view} /> : null}
      {S.hoverSteps && S.stepsStyle === "flyout" ? (
        <div className="bb-fly right" onMouseEnter={keepFly} onMouseLeave={scheduleHide} onClick={(e) => e.stopPropagation()}>
          <div className="bb-fly-card">
            <div className="bb-fly-head"><b /><span /></div>
            <div className="bb-steps" />
          </div>
        </div>
      ) : null}
      {S.cute.pet ? (
        <div className="bb-fly bb-closet right" onMouseEnter={keepFly} onMouseLeave={scheduleHideCloset} onClick={(e) => e.stopPropagation()}>
          <div className="bb-fly-card">
            <div className="bb-fly-head"><b /><span /></div>
            <div className="bb-closet-body" />
          </div>
        </div>
      ) : null}
      {S.cute.chest !== false ? <ChestCard stored={stored} hidden={hidden} pet={memory.pet} view={view} /> : null}
      <StageCard view={view} pet={memory.pet} />
      <LockPad />
      {S.cute.sounds ? (
        <span className={"bb-mute lv" + level()} onClick={toggleSound} title={levelTitle()}>
          <Px rows={SPK_OFF} s={2} className="lv0" /><Px rows={SPK_1} s={2} className="lv1" /><Px rows={SPK_ON} s={2} className="lv2" /><Px rows={SPK_3} s={2} className="lv3" />
        </span>
      ) : null}
      <span className="bb-edge" onMouseDown={(e) => startResize(e, "w")} title="drag for width" />
      <span className="bb-edge l" onMouseDown={(e) => startResize(e, "l")} title="drag for width" />
      <span className="bb-grip l" onMouseDown={(e) => startResize(e, "lh")} onDoubleClick={resetSize} title="drag to resize · double-click to reset" />
      <span className="bb-edge-b" onMouseDown={(e) => startResize(e, "h")} title="drag for height" />
      <span className="bb-grip" onMouseDown={(e) => startResize(e, "wh")} onDoubleClick={resetSize} title="drag to resize · double-click to reset" />
    </div>
  );
}
// A stateful root so the widget can redraw itself at once (a buy, a drag, a tick) instead of waiting for the next refresh.
class Board extends React.Component {
  componentDidMount() {
    memory.redraw = () => this.forceUpdate(); placeChest(); placeStage();
    if (S.lock && S.lock.reset) { try { localStorage.removeItem(PIN_KEY); } catch (e) {} }
    if (!memory.idleT) memory.idleT = setInterval(checkIdle, 15000);
    if (!memory.keyT) { memory.keyT = true; window.addEventListener("keydown", (e) => { if (!memory.pin) return; const i = document.querySelector(".bb-lock-in"); if (i && document.activeElement !== i && e.key.length === 1) { i.focus(); } if (e.key === "Escape") pinCancel(); }); }
  }
  componentDidUpdate() { placeChest(); placeStage(); }
  componentWillUnmount() { memory.redraw = null; }
  render() { return renderBoard(this.props); }
}
export const render = (props) => <Board {...props} />;
