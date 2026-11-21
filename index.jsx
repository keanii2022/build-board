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

  // ── Look ──────────────────────────────────────────────────────────────────
  title: "Build Board",        // the top window's title bar. Click it to open boardUrl.
  crewTitle: "Crew",           // the buddy list window. "" hides the crew.
  crewOrder: ["hexx", "carmina", "mello", "jig", "sora", "maya", "mars", "neo", "big-bro", "benjamin"],   // buddy order; anyone not listed comes after
  theme: "auto",               // "light", "dark", or "auto" (follows the Mac). The switch in the title bar overrides this and is remembered.
  // The colours every bar fills with, left to right. A bar at 100% shows the whole run.
  spectrum: ["#2E7CF6", "#6A5BFF", "#B54CFF", "#F04AA6", "#FF7A45"],
  radius: 12,                  // window corners
  activeHours: 48,             // a project with a commit this recent gets a slow pulse on its dot; today's commits pulse quick

  // ── Cute ──────────────────────────────────────────────────────────────────
  // Sounds are macOS's own (names from /System/Library/Sounds: Pop, Tink, Glass,
  // Hero, Purr, Submarine, Bottle, Frog, Ping, Blow, Morse, Funk, Sosumi, Basso).
  cute: {
    sounds: true,
    volume: 1,                 // master multiplier; the speaker at the bottom right picks the level (off, low, mid, loud)
    hoverSound: "Pop",         // moving onto a project. "" = silent
    hoverVolume: 0.12,
    clickSound: "Tink",        // opening a project
    lockSound: "Bottle",       // the widget locking
    lockInSound: ["Purr", "Hero"],   // LOCK IN picked a project
    wrongSound: "Basso",       // wrong password
    stepSound: "Glass",        // a step got ticked
    doneSound: ["Glass", "Glass", "Hero"],   // a project hit 100% (a list plays as a little jingle)
    pushSound: ["Blow", "Pop@0.8", "Pop@1.1", "Pop@1.5", "Hero"],   // you pushed: whoosh, three rising pops, fanfare ("Name@1.5" = that sound at 1.5x pitch)
    pushParty: true,           // and the whole widget dances: bounce, rainbow edge, rows do a wave, confetti
    newSound: "Purr",          // a new project showed up
    hoverPitch: true,          // each project's hover pop has its own pitch, so you learn them by ear
    quietHours: null,          // e.g. [23, 8] = no sounds from 23:00 to 08:00. null = the little speaker at the bottom right decides
    sparkles: true,            // spectrum sparkles when a step lands (bigger burst at 100%)
    streak: true,              // "4-day streak" in the today line
    wiggle: true,              // rows nudge and dots wiggle on hover
    jelly: true,               // drag the widget and the windows wobble like jelly, then spring back
  },

  // ── What shows ────────────────────────────────────────────────────────────
  showToday: true,             // "3 commits today · 2 projects" under the title bar
  hoverSteps: true,            // rest on a project to see its full step list in a card beside the widget
  flyInside: true,             // on a wide widget the card opens inside the panel (right edge) instead of beside it, so windows can't cover it

  // ── Clicks ────────────────────────────────────────────────────────────────
  lock: { idleMinutes: 10, onOpen: true, reset: false },   // two passwords, set when first asked, kept hashed in this widget's own storage, never in a file: a quick one (idle lock after idleMinutes, 0 = never; before any project opens; the lock button) and a company one (shift-click or double-click the lock button; only it opens that lock, and it opens the quick lock too). reset: true forgets both on the next refresh
  lockInPrompt: "/step",     // the LOCK IN button: a random project from the board opens in Claude Code with this already typed. "" = just open it
  helpPrompt: "Help with the Build Board widget, this folder. Read README.md and run git status, then ask me what's bugging me or what to improve.",   // the HELP pill: a fresh Claude Code chat inside the widget's own folder
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
  parkAfterDays: 21,          // idle this long → off the board, unless you've dragged it into your order. 0 = never.
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

// ── Theme: Light / Dark / Auto, Auto follows the Mac ────────────────────────
const THEME_KEY = "build-board.theme";
function themePick() { try { return localStorage.getItem(THEME_KEY) || S.theme || "auto"; } catch (e) { return S.theme || "auto"; } }
function darkMac() { try { return window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) { return true; } }
function themeNow() { const p = themePick(); return p === "auto" ? (darkMac() ? "dark" : "light") : p; }
function setTheme(e, pick) {
  e.stopPropagation();
  try { localStorage.setItem(THEME_KEY, pick); } catch (err) {}
  play(S.cute.clickSound); redraw();
}
function watchMacTheme() {   // Auto flips the moment the Mac does, not on the next refresh
  if (memory.themeWatch) return;
  memory.themeWatch = true;
  try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => redraw()); } catch (e) {}
}
function ThemeSwitch() {
  const p = themePick();
  const opt = (k, glyph, tip) => <span className={"o" + (p === k ? " on" : "")} onClick={(e) => setTheme(e, k)} onMouseDown={(e) => e.stopPropagation()} title={tip}>{glyph}</span>;
  const sun = <svg width="9" height="9" viewBox="0 0 16 16"><circle cx="8" cy="8" r="3.4" fill="currentColor" /><g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9L13 13M3 13l1.1-1.1M11.9 4.1L13 3" /></g></svg>;
  const moon = <svg width="9" height="9" viewBox="0 0 16 16"><path d="M13.6 10.4A6 6 0 0 1 5.6 2.4a6 6 0 1 0 8 8z" fill="currentColor" /></svg>;
  return <span className="bb-theme">{opt("light", sun, "light")}{opt("auto", "A", "auto: follows your Mac")}{opt("dark", moon, "dark")}</span>;
}

// ── The lil guy: sprite strips rendered by art/lilguy.py (8 frames, side by side) ─
const LOOP = { icon: "1.2s", idle: "2.4s", working: "0.7s", done: "1s", failed: "1.4s", stuck: "1.4s" };
function LilGuy({ who, pose, size, play: playing, className }) {
  const dir = (memory.data && memory.data.dir) || "build-board";
  const pt = size <= 24 ? 24 : size <= 32 ? 32 : 48;
  return <span className={"lg" + (playing ? " play" : "") + (className ? " " + className : "")}
               style={{ "--s": size + "px", "--d": LOOP[pose] || "1.2s", backgroundImage: `url(${dir}/art/${who}/${pose}-anim-${pt}@2x.png)` }} />;
}
const memory = { done: {}, bumpAt: {}, seen: null, arrivedAt: {}, pos: null, dragging: false, dragEndAt: 0,
                 full: {}, doneAt: {}, pushSeen: null, soundAt: 0, scale: 0, width: 0, height: 0, stepsById: {}, flyT: null,
                 pin: null, locked: false, lastActive: Date.now() };

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
const PIN_KEY = "build-board.pin", PIN2_KEY = "build-board.pin2", LOCK_KEY = "build-board.locked";   // quick password, company password, and whether we're locked
const LOCK_PX = ["..YYY..", ".Y...Y.", ".Y...Y.", "YYYYYYY", "YYYYYYY", "YYYkYYY", "YYYYYYY", ".YYYYY."];
function refreshWidget() { try { location.reload(); } catch (e) {} }   // the widgets page reloads itself: no AppleScript, nothing gets activated or un-minimized
async function pinHash(p) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("bb:" + p)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
function pinStored(strong) { try { return localStorage.getItem(strong ? PIN2_KEY : PIN_KEY) || ""; } catch (e) { return ""; } }
function askPin(reason, then, cancellable, strong) { memory.pin = { mode: pinStored(strong) ? "enter" : "set", reason, then, entry: "", first: "", err: false, cancellable, strong: !!strong }; redraw(); }
function lockNow(strong) {   // the lock button, the idle timer, or a reload while locked
  if (memory.pin && memory.locked) return;
  memory.locked = true; try { localStorage.setItem(LOCK_KEY, strong ? "2" : "1"); } catch (e) {}
  askPin("locked", null, false, strong); play(S.cute.lockSound);
}
function pinMatches(h, P) { return P.strong ? h === pinStored(true) : (h === pinStored(false) || (pinStored(true) && h === pinStored(true))); }   // the company password opens everything
function pinSubmit(code) {
  const P = memory.pin; if (!P) return;
  P.err = false; P.entry = "";
  if (!code || code.length < 4) { P.err = "at least 4 characters."; redraw(); return; }
  if (P.mode === "set") { P.first = code; P.mode = "confirm"; redraw(); return; }
  if (P.mode === "confirm") {
    if (code !== P.first) { P.mode = "set"; P.first = ""; P.err = "didn't match. again."; redraw(); return; }
    pinHash(code).then((h) => { try { localStorage.setItem(P.strong ? PIN2_KEY : PIN_KEY, h); } catch (e) {} pinDone(); });
    return;
  }
  pinHash(code).then((h) => { if (pinMatches(h, P)) pinDone(); else { P.err = "no."; play(S.cute.wrongSound, undefined, 1.2); redraw(); } });
}
function pinDone() { const P = memory.pin; memory.pin = null; memory.locked = false; memory.lastActive = Date.now(); try { localStorage.removeItem(LOCK_KEY); } catch (e) {} play(S.cute.clickSound); if (P && P.then) P.then(); redraw(); }
function pinCancel() { if (memory.pin && memory.pin.cancellable) { memory.pin = null; redraw(); } }
function touch() { memory.lastActive = Date.now(); }
function checkIdle() {
  const m = S.lock && S.lock.idleMinutes;
  if (!m || memory.locked || memory.pin) return;
  if (Date.now() - (memory.lastActive || 0) > m * 60000) lockNow(false);
}
function guarded(fn, what) { if (S.lock && S.lock.onOpen) askPin(what ? `open ${what}` : "open", fn, true); else fn(); }
function focusLock(el) { if (el && document.activeElement !== el) setTimeout(() => { try { window.focus(); el.focus(); el.select && el.select(); } catch (e) {} }, 30); }
function LockPad() {
  const P = memory.pin; if (!P) return null;
  const title = P.mode === "set" ? (P.strong ? "set the company password" : "set your quick password") : P.mode === "confirm" ? "once more"
              : P.reason === "locked" ? (P.strong ? "locked · company" : "locked") : P.reason;
  const onKey = (e) => {
    e.stopPropagation();
    if (e.key === "Enter") { pinSubmit(e.currentTarget.value); e.currentTarget.value = ""; }
    else if (e.key === "Escape") pinCancel();
  };
  const onInput = (e) => {   // when it's the right one, it just opens: no enter, no attempt counted
    const v = e.currentTarget.value, el = e.currentTarget;
    if (P.mode !== "enter" || v.length < 4) return;
    pinHash(v).then((h) => { if (memory.pin === P && el.value === v && pinMatches(h, P)) { el.value = ""; pinDone(); } });
  };
  return (
    <div className={"bb-lock" + (P.err ? " err" : "")} onClick={(e) => { e.stopPropagation(); const i = e.currentTarget.querySelector("input"); if (i) i.focus(); }}
         onMouseDown={(e) => e.stopPropagation()}>   {/* never stop mousemove here: Übersicht watches it bubble to window to know the mouse is over a widget; stopping it makes clicks and keys fall through to the desktop */}
      <div className="bb-lock-card">
        <div className="t">{title}</div>
        <input className="bb-lock-in" type="password" placeholder="password" autoComplete="off" spellCheck={false} ref={focusLock} onKeyDown={onKey} onInput={onInput} onMouseDown={(e) => e.stopPropagation()} />
        <div className="row">
          <span className="go" onClick={(e) => { const i = e.currentTarget.closest(".bb-lock-card").querySelector("input"); pinSubmit(i.value); i.value = ""; }}>enter</span>
          {P.cancellable ? <span className="go dim" onClick={pinCancel}>cancel</span> : null}
        </div>
        <span className="bb-refresh" onClick={refreshWidget} title="reload the widget (stays locked)">↻</span>
        <div className="e">{P.err || "\u00a0"}</div>
      </div>
    </div>
  );
}
function helpChat() {   // the HELP pill: Claude Code opens in this widget's folder, so bugs and ideas have a home that isn't some other project's chat
  guarded(() => {
    play(S.cute.clickSound);
    const q = "&prompt=" + encodeURIComponent(S.helpPrompt || "") + "&source=build-board";
    const pd = (S.projectsDir || "~/Projects").replace(/^~/, "$HOME"), link = `[ -d "${pd}/build-board" ] && W="${pd}/build-board"`;   // a symlink in the projects folder puts the widget on its own board; prefer that path, it's what the app knows
    run(`${FIND_DIR}; ${link}; open "claude://code/new?folder=$(printf %s "$W" | python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.stdin.read()))')${q}"`);
  }, "help");
}
function openPath(p, prompt) {
  if (!S.clickOpens || !p) return;
  play(S.cute.clickSound);
  if (S.clickOpens === "claude") {
    const folder = p.endsWith(".json") ? p.replace(/\/[^/]+$/, "") : p;
    run(`open ${sh("claude://code/new?folder=" + encodeURIComponent(folder) + (prompt ? "&prompt=" + encodeURIComponent(prompt) : "") + "&source=build-board")}`);
  } else if (S.openWith) {
    run(`open -a ${sh(S.openWith)} ${sh(p)}`);
  }
}
// ── Which display ───────────────────────────────────────────────────────────
// Übersicht runs one copy of the widget per display. Each copy looks at the list of displays board.py
// sends, works out which one it is on, and only the chosen one draws (the others render nothing and
// skip every side effect: sounds, parties).
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
// ── Layout: your order ──────────────────────────────────────────────────────
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
// layout.board is your order. Everything in it stays on the board; any other project joins on its own once it's
// active (isActive). The track ("tools") stays at the bottom when it's on the board.
function setBoard(repoIds, withTrack) { layout().board = withTrack ? [...repoIds, "tools"] : repoIds; saveLayout(); }
function isActive(p, now) {   // has a plan or a commit this week, and hasn't sat idle past parkAfterDays
  const parkLine = S.parkAfterDays * 86400;
  return (!parkLine || now - (p.activityAt || 0) < parkLine) && (p.hasPlan || (p.commitAt && now - p.commitAt < 7 * 86400));
}
function reorderProject(id, index, visibleIds) {   // index = where it lands among the rows on screen
  const ids = visibleIds.filter((x) => x !== id);
  ids.splice(Math.min(index, ids.length), 0, id);
  setBoard(ids, (layout().board || []).includes("tools")); redraw();
}
// The pixel palette: one letter per colour in the icon drawings below.
const PAL = {
  k: "#15161a", x: "#2a2d36", y: "#5c606b", Y: "#a9adb8", w: "#f2f2f4", c: "#f1dcb4",
  s: "#cfc9ff", d: "#8a80e6", p: "#ff8ab8", g: "#f4c64f", G: "#b8871b", r: "#e4453a",
  u: "#7b3fd1", b: "#4f8df7", o: "#ff8a3d", t: "#39d0c4", n: "#8a5a2b", e: "#4cc26b",
  a: "#d9a066", N: "#5a3a1b", E: "#2f8a4a", B: "#2f5fb0", R: "#9b2a24",
};
// One CSS box-shadow per pixel: cheap, crisp, no canvas.
function shadow(rows, s) {
  const out = [];
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (PAL[ch]) out.push(`${x * s}px ${y * s}px 0 0 ${PAL[ch]}`); }));
  return out.join(",");
}
function size(rows) { return [Math.max(0, ...rows.map((r) => r.length)), rows.length]; }
// Pixel icons for projects (10×10).
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
// Drag a project's icon up and down the list to reorder.
function dragIcon(e) {
  if (e.button !== 0) return;
  e.stopPropagation(); e.preventDefault();
  const icon = e.currentTarget, bb = icon.closest(".bb"), row = icon.closest("[data-id]");
  if (!bb || !row) return;
  const id = row.dataset.id;
  const z = loadScale();
  const ghost = document.createElement("span"); ghost.className = "bb-ghost";   // a wrapper, so the sprite keeps its own .px class
  ghost.appendChild(icon.cloneNode(true));
  ghost.style.transform = `translate(-50%, -50%) scale(${1.4 * z})`;   // plain screen pixels, no zoom tricks
  const wrap = wrapperOf(bb) || document.body;   // the widget's own (unzoomed) box: sits above the panel, nothing can cover it
  wrap.appendChild(ghost);
  icon.classList.add("lifting");

  bb.classList.add("bb-dnd"); hideFly(); memory.dragging = true;
  const list = bb.querySelector(".bb-list");
  const inside = (el, ev) => { if (!el) return false; const r = el.getBoundingClientRect(); return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom; };
  let index = null;
  const sx = e.clientX, sy = e.clientY; let moved = false;
  const move = (ev) => {
    if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return;
    moved = true;
    const wr = wrap.getBoundingClientRect();
    ghost.style.left = (ev.clientX - wr.left) + "px"; ghost.style.top = (ev.clientY - wr.top) + "px";
    bb.querySelectorAll(".ins-before, .ins-after").forEach((el) => el.classList.remove("ins-before", "ins-after"));
    index = null;
    if (!inside(list, ev)) return;
    const rows = [...list.querySelectorAll(":scope > .bb-proj")];
    let i = rows.findIndex((r) => { const rr = r.getBoundingClientRect(); return ev.clientY < rr.top + rr.height / 2; });
    if (i < 0) i = rows.length;
    if (rows[i]) rows[i].classList.add("ins-before"); else if (rows[i - 1]) rows[i - 1].classList.add("ins-after");
    index = i;
  };
  const up = () => {
    document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up);
    ghost.remove(); icon.classList.remove("lifting"); bb.classList.remove("bb-dnd");
    bb.querySelectorAll(".ins-before, .ins-after").forEach((el) => el.classList.remove("ins-before", "ins-after"));
    memory.dragging = false; if (moved) memory.dragEndAt = Date.now();
    if (index !== null) reorderProject(id, index, [...bb.querySelectorAll(".bb-list > .bb-proj")].map((r) => r.dataset.id));
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
// ── Jelly: drag the widget and the windows lag, wobble and spring back ───────
function jelly(wrap) {
  if (!S.cute.jelly) return;
  if (memory.jelly) { memory.jelly.wrap = wrap; return; }
  const wins = [...wrap.querySelectorAll(".bb-win")];
  if (!wins.length) return;
  const J = memory.jelly = { wrap, last: wrap.getBoundingClientRect(), t: performance.now(),
    bodies: wins.map((el, i) => ({ el, x: 0, y: 0, vx: 0, vy: 0, k: i ? 120 : 170 })) };   // the lower window is softer, so the two slosh out of step
  const clamp = (v, m) => Math.max(-m, Math.min(m, v));
  const step = (now) => {
    const dt = Math.min(0.033, (now - J.t) / 1000); J.t = now;
    const r = J.wrap.getBoundingClientRect(), dx = r.left - J.last.left, dy = r.top - J.last.top;
    J.last = r;
    let moving = memory.dragging;
    for (const b of J.bodies) {
      b.x = clamp(b.x - dx, 34); b.y = clamp(b.y - dy, 34);   // the gel stays put for a beat...
      b.vx += (-b.k * b.x - 9 * b.vx) * dt; b.vy += (-b.k * b.y - 9 * b.vy) * dt;   // ...then springs home, overshooting a little
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (Math.abs(b.x) + Math.abs(b.y) + Math.abs(b.vx) + Math.abs(b.vy) > 0.08) moving = true;
      const squash = clamp(b.y * 0.004, 0.09);
      b.el.style.transform = `translate(${(b.x * 0.18).toFixed(2)}px, ${(b.y * 0.18).toFixed(2)}px) skewX(${clamp(b.x * 0.3, 9).toFixed(2)}deg) scale(${(1 - squash * 0.6).toFixed(4)}, ${(1 + squash).toFixed(4)})`;
    }
    if (moving) requestAnimationFrame(step);
    else { J.bodies.forEach((b) => { b.el.style.transform = ""; }); memory.jelly = null; }
  };
  requestAnimationFrame(step);
}
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
    if (!moved) { moved = true; memory.dragging = true; wrap.classList.add("bb-dragging"); jelly(wrap); }
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

function styles() {
  const R = S.radius;
  return `
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
    .bb[data-theme="light"] {
      --win: linear-gradient(180deg, rgba(255,255,255,0.84), rgba(234,243,253,0.78));
      --win-edge: rgba(255,255,255,0.95); --win-line: rgba(36,78,140,0.20);
      --shadow: 0 14px 34px rgba(24,56,108,0.22), 0 2px 6px rgba(24,56,108,0.10);
      --tb: linear-gradient(180deg, #92dcff 0%, #4fb8f8 46%, #1f93ea 54%, #3cb3fb 100%);
      --tb-line: rgba(8,82,160,0.55); --tb-text: #fff; --tb-shadow: 0 1px 1px rgba(0,48,110,0.45);
      --text: #13213a; --muted: rgba(19,33,58,0.58); --faint: rgba(19,33,58,0.34);
      --row: rgba(255,255,255,0.62); --row-hover: rgba(255,255,255,0.96); --row-line: rgba(36,78,140,0.12); --row-mix: #ffffff;
      --track: rgba(28,66,124,0.12); --accent: #1683ee;
      --chip: rgba(255,255,255,0.72); --chip-line: rgba(36,78,140,0.15);
      --card: rgba(250,253,255,0.97); --card-line: rgba(36,78,140,0.18); --lock-bg: rgba(214,230,250,0.62); --input: rgba(255,255,255,0.8);
    }
    .bb[data-theme="dark"] {
      --win: linear-gradient(180deg, rgba(24,30,46,0.92), rgba(12,16,26,0.9));
      --win-edge: rgba(255,255,255,0.08); --win-line: rgba(0,0,0,0.55);
      --shadow: 0 18px 44px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.35);
      --tb: linear-gradient(180deg, #5e9dff 0%, #3172ef 46%, #1b4fcf 54%, #2a62e6 100%);
      --tb-line: rgba(0,0,0,0.55); --tb-text: #fff; --tb-shadow: 0 1px 1px rgba(0,10,40,0.6);
      --text: #edf2fb; --muted: rgba(237,242,251,0.56); --faint: rgba(237,242,251,0.3);
      --row: rgba(255,255,255,0.035); --row-hover: rgba(255,255,255,0.085); --row-line: rgba(255,255,255,0.06); --row-mix: #0c1018;
      --track: rgba(255,255,255,0.09); --accent: #5ab8ff;
      --chip: rgba(255,255,255,0.05); --chip-line: rgba(255,255,255,0.09);
      --card: rgba(18,22,32,0.97); --card-line: rgba(255,255,255,0.1); --lock-bg: rgba(0,0,0,0.5); --input: rgba(255,255,255,0.06);
    }
    .bb { font-family: ${S.font}; color: var(--text); font-size: 11px; line-height: 1.35; position: relative;
      display: flex; flex-direction: column; gap: 8px;
      -webkit-font-smoothing: antialiased; font-feature-settings: "tnum"; -webkit-user-select: none; user-select: none; }
    .bb-win { position: relative; border-radius: ${R}px; background: var(--win);
      -webkit-backdrop-filter: blur(22px) saturate(1.5); backdrop-filter: blur(22px) saturate(1.5);
      box-shadow: inset 0 0 0 1px var(--win-edge), 0 0 0 1px var(--win-line), var(--shadow); }

    .bb-board { display: flex; flex-direction: column; min-height: 0; }
    .bb.bb-fixed .bb-board { flex: 1 1 auto; }   /* fills the height you drag it to; the list scrolls when it's shorter than the rows */
    .bb-win { transform-origin: 50% 0; }   /* the jelly hangs from the title bar you're holding */
    .bb-crew { flex: none; z-index: 4; }   /* its hover cards drop down over the board */

    .bb-tb { display: flex; align-items: center; gap: 7px; height: 24px; padding: 0 6px 0 6px; border-radius: ${R}px ${R}px 0 0;
      background: var(--tb); color: var(--tb-text); text-shadow: var(--tb-shadow); border-bottom: 1px solid var(--tb-line);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.5); cursor: ${S.draggable ? "grab" : "default"}; flex: none; }
    .bb-dragging .bb-tb { cursor: grabbing; }
    .bb-tb .sp, .bb-foot .sp { flex: 1; }
    .bb-title { font-size: 11.5px; font-weight: 600; letter-spacing: 0.01em; white-space: nowrap; }
    .bb-board .bb-title { cursor: ${S.boardUrl ? "pointer" : "inherit"}; }
    .bb-board .bb-title:hover { text-decoration: underline; text-underline-offset: 2px; }
    .bb-online { font-size: 9px; font-weight: 600; opacity: 0.9; letter-spacing: 0.02em; }
    .bb-swap { font-size: 11px; opacity: 0; cursor: pointer; transition: opacity .2s; }
    .bb:hover .bb-swap { opacity: 0.75; }
    .bb-swap:hover { opacity: 1 !important; }
    .bb-theme { display: inline-flex; padding: 1px; gap: 1px; border-radius: 999px; background: rgba(0,24,70,0.22); box-shadow: inset 0 1px 1px rgba(0,0,0,0.18); }
    .bb-theme .o { width: 16px; height: 15px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px;
      font-size: 10px; font-weight: 700; line-height: 1; cursor: pointer; text-shadow: none; color: rgba(255,255,255,0.92); transition: background .15s, color .15s; }
    .bb-theme .o:hover { color: #fff; background: rgba(255,255,255,0.18); }
    .bb-theme .o.on { background: rgba(255,255,255,0.95); color: #1b5fc4; box-shadow: 0 1px 2px rgba(0,0,0,0.25); }
    .bb-lockin { font-size: 8px; font-weight: 700; letter-spacing: .14em; padding: 2px 8px; border-radius: 999px; cursor: pointer;
      background: linear-gradient(180deg, rgba(255,255,255,0.38), rgba(255,255,255,0.12)); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5);
      transition: background .15s, transform .15s; }
    .bb-lockin:hover { background: linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.22)); }
    .bb-lockin:active { transform: scale(.95); }

    .lg { display: inline-block; flex: none; width: var(--s); height: var(--s); background-repeat: no-repeat;
      background-size: calc(var(--s) * 8) var(--s); background-position: 0 0; }
    .lg.play, .bb-tb:hover .lg.hov { animation: bb-play var(--d) steps(8) infinite; }
    @keyframes bb-play { from { background-position: 0 0; } to { background-position: calc(var(--s) * -8) 0; } }

    .bb-today { display: flex; gap: 0; padding: 6px 11px 0; color: var(--muted); font-size: 9.5px; white-space: nowrap; overflow: hidden; }
    .bb-today b { color: var(--text); font-weight: 600; }
    .bb-today .l { overflow: hidden; text-overflow: ellipsis; }
    .bb-today .stamp { margin-left: auto; padding-left: 8px; color: var(--faint); }
    .bb-body { padding: 6px 7px 8px; min-height: 0; }
    .bb.bb-fixed .bb-body { flex: 1 1 auto; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
    .bb.bb-fixed .bb-body::-webkit-scrollbar { display: none; }
    .bb-list { display: grid; gap: 3px; }
    .bb-err { color: var(--muted); padding: 4px; }

    .bb-proj { position: relative; display: grid; grid-template-columns: 5px 12px minmax(0, 1fr) minmax(64px, 36%) 34px; align-items: center; gap: 7px;
      padding: 5px 8px 5px 7px; border-radius: 7px; cursor: ${S.clickOpens ? "pointer" : "default"};
      background: ${S.rowTint > 0 ? `color-mix(in srgb, var(--tint) ${Math.round(S.rowTint * 30)}%, var(--row))` : "var(--row)"};
      box-shadow: inset 0 0 0 1px var(--row-line); transition: background .15s, transform .25s cubic-bezier(.2,.8,.2,1); }
    .bb-proj:hover { background: ${S.rowTint > 0 ? `color-mix(in srgb, var(--tint) ${Math.round(S.rowTint * 45)}%, var(--row-hover))` : "var(--row-hover)"}; }
    .bb-proj.arrived { animation: bb-arrive 1.2s cubic-bezier(.2,.8,.2,1) both; }
    .bb-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--faint); opacity: 0.6; }
    .bb-proj.warm .bb-dot, .bb-proj.hot .bb-dot { background: ${S.spectrum[0]}; opacity: 1; }
    .bb-proj.warm .bb-dot { animation: bb-ping 4s ease-out infinite; }
    .bb-proj.hot .bb-dot { background: ${S.spectrum[3] || S.spectrum[0]}; animation: bb-ping 2s ease-out infinite; }
    .bb-icon { display: inline-flex; line-height: 0; cursor: grab; border-radius: 3px; opacity: .9; transition: transform .2s cubic-bezier(.3,1.5,.4,1); }
    .bb-icon:hover { transform: scale(1.25); opacity: 1; }
    .bb-name { display: flex; align-items: center; gap: 5px; min-width: 0; font-weight: 500; font-size: 11px; }
    .bb-name > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bb-new { font-style: normal; font-size: 7px; font-weight: 700; letter-spacing: 0.12em; padding: 1px 5px; border-radius: 999px; flex: none;
      color: #fff; background: ${SPECTRUM}; }
    .bb-bar { position: relative; height: 6px; border-radius: 999px; background: var(--track); box-shadow: inset 0 1px 1px rgba(0,0,0,0.12); overflow: hidden; }
    .bb-bar i { position: relative; display: block; height: 100%; width: var(--w); min-width: 6px; border-radius: 999px;
      background: ${SPECTRUM}; background-size: calc(100% / var(--f)) 100%; transition: width 1s cubic-bezier(.2,.8,.2,1); }
    .bb-bar i::after { content: ""; position: absolute; left: 2px; right: 2px; top: 1px; height: 2px; border-radius: 999px;
      background: linear-gradient(90deg, rgba(255,255,255,0.75), rgba(255,255,255,0.35)); }
    .bb-proj.noplan .bb-bar i { display: none; }
    .bb-proj.full .bb-bar i { animation: bb-sheen 3s linear infinite; background-size: 200% 100%;
      background-image: linear-gradient(90deg, ${S.spectrum.join(", ")}, ${S.spectrum[0]}); }
    .bb-count { text-align: right; font-size: 9.5px; font-weight: 600; color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
    .bb-proj.full .bb-count { font-size: 8px; letter-spacing: 0.1em; background: ${SPECTRUM}; -webkit-background-clip: text; background-clip: text; color: transparent; }
    .bb-proj.noplan .bb-count, .bb-proj.asleep .bb-count { color: var(--faint); font-weight: 500; }
    .bb-proj.pushed .bb-count { color: var(--accent); }
    .bb-track { margin-top: 8px; padding-top: 7px; border-top: 1px solid var(--row-line); }
    .bb-track > b { display: block; font-weight: 700; font-size: 8px; letter-spacing: 0.12em; color: var(--muted); margin: 0 0 5px 4px; }
    .bb-track > b i { font-style: normal; font-weight: 400; letter-spacing: 0; margin-left: 6px; color: var(--faint); }
    .bb-proj.ins-before::after, .bb-proj.ins-after::after { content: ""; position: absolute; left: 0; right: 0; height: 2px; border-radius: 2px;
      background: ${SPECTRUM}; top: -3px; }
    .bb-proj.ins-after::after { top: auto; bottom: -3px; }
    .bb-dnd, .bb-dnd * { cursor: grabbing !important; }
    .bb-ghost { position: absolute; left: 0; top: 0; z-index: 9999; pointer-events: none; opacity: 0.95; display: inline-block;
      filter: drop-shadow(0 6px 10px rgba(0,0,0,0.4)); line-height: 0; }
    .bb-ghost .px { display: inline-block; }
    .lifting { opacity: 0.35; }
    .px { position: relative; display: inline-block; overflow: visible; flex: none; }
    .px i { position: absolute; display: block; }
    ${S.cute.wiggle ? `
    .bb-proj:hover { transform: translateX(2px); }
    .bb-proj:hover .bb-dot { animation: bb-wiggle .5s ease-in-out; }
    ` : ""}

    .bb-grp { display: flex; align-items: center; gap: 5px; padding: 7px 10px 3px; font-size: 8.5px; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: var(--muted); cursor: pointer; }
    .bb-grp span { color: var(--faint); letter-spacing: 0.04em; }
    .bb-grp i { width: 0; height: 0; border-left: 3.5px solid transparent; border-right: 3.5px solid transparent; border-top: 5px solid currentColor;
      transition: transform .15s; }
    .bb-grp.shut i { transform: rotate(-90deg); }
    .bb-grp:hover { color: var(--text); }
    .bb-empty { padding: 1px 10px 3px 22px; font-size: 9.5px; color: var(--faint); font-style: italic; }
    .bb-chips { display: flex; flex-wrap: wrap; gap: 4px; padding: 3px 8px 8px; }
    .bb-chip { position: relative; display: inline-flex; align-items: center; gap: 3px; padding: 1px 8px 1px 2px; border-radius: 999px;
      background: var(--chip); box-shadow: inset 0 0 0 1px var(--chip-line); font-size: 10px; cursor: default; transition: background .15s; }
    .bb-chip > b { font-weight: 500; opacity: 0.8; }
    .bb-chip:hover { background: var(--row-hover); }
    .bb-chip:hover > b { opacity: 1; }
    .bb-tip { position: absolute; top: calc(100% + 6px); left: 0; z-index: 20; width: 186px; display: flex; flex-direction: column; gap: 3px;
      padding: 8px 10px 9px; border-radius: 9px; background: var(--card); box-shadow: inset 0 0 0 1px var(--card-line), 0 10px 26px rgba(0,0,0,0.28);
      opacity: 0; visibility: hidden; transform: translateY(-4px); transition: opacity .15s, transform .15s; pointer-events: none; }
    .bb-chip.r .bb-tip { left: auto; right: 0; }
    .bb-chip:hover .bb-tip { opacity: 1; visibility: visible; transform: none; }
    .bb-tip .who { font-size: 11px; color: var(--muted); }
    .bb-tip .who b { color: var(--text); font-weight: 600; }
    .bb-tip .sub { font-size: 8px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); margin: 2px 0 1px; }
    .bb-tip .ex { font-size: 10px; color: var(--text); padding-left: 9px; position: relative; }
    .bb-tip .ex::before { content: ""; position: absolute; left: 1px; top: 6px; width: 3px; height: 3px; border-radius: 50%; background: var(--accent); }

    .bb-foot { display: flex; align-items: center; gap: 8px; padding: 5px 8px 6px; border-top: 1px solid var(--row-line); }
    .bb-mute { cursor: pointer; line-height: 0; opacity: 0.55; transition: opacity .2s; }
    .bb-mute:hover { opacity: 1; }
    .bb-mute .px { display: none; }
    .bb-mute.lv0 .px.lv0, .bb-mute.lv1 .px.lv1, .bb-mute.lv2 .px.lv2, .bb-mute.lv3 .px.lv3 { display: inline-block; }
    .bb-refresh { font-size: 12px; line-height: 1; color: var(--muted); opacity: .6; cursor: pointer; transition: opacity .2s, transform .3s; }
    .bb-refresh:hover { opacity: 1; transform: rotate(90deg); }
    .bb-btn { display: inline-flex; align-items: center; gap: 5px; height: 18px; padding: 0 8px; border-radius: 999px; cursor: pointer;
      font-size: 8px; font-weight: 700; letter-spacing: .14em; color: var(--muted); box-shadow: inset 0 0 0 1px var(--chip-line); background: var(--chip);
      transition: color .15s, background .15s; }
    .bb-btn:hover { color: var(--text); background: var(--row-hover); }

    .bb-grip { position: absolute; right: 4px; bottom: 4px; width: 12px; height: 12px; cursor: nwse-resize; opacity: 0; transition: opacity .2s; z-index: 6;
      background: linear-gradient(135deg, transparent 55%, var(--faint) 55%, var(--faint) 63%, transparent 63%, transparent 76%, var(--faint) 76%, var(--faint) 84%, transparent 84%); }
    .bb-grip.l { right: auto; left: 4px; cursor: nesw-resize; transform: scaleX(-1); }
    .bb:hover .bb-grip { opacity: 0.8; }
    .bb-edge { position: absolute; top: ${R}px; bottom: ${R}px; right: -3px; width: 7px; cursor: ew-resize; z-index: 6; }   /* above the crew window, which sits at 4 */
    .bb-edge.l { right: auto; left: -3px; }
    .bb-edge:hover, .bb-edge-b:hover { background: rgba(120,170,255,0.35); border-radius: 4px; }
    .bb-edge-b { position: absolute; left: ${R}px; right: ${R}px; bottom: -3px; height: 7px; cursor: ns-resize; z-index: 6; }

    .bb-lock { position: absolute; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; border-radius: ${R}px; cursor: default;
      background: var(--lock-bg); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px); }
    .bb-lock-card { position: relative; text-align: center; }
    .bb-lock .t { font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; }
    .bb-lock-in { display: block; width: 200px; box-sizing: border-box; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--chip-line); outline: none;
      background: var(--input); color: var(--text); font: inherit; font-size: 13px; letter-spacing: 0.08em; text-align: center; caret-color: var(--text); }
    .bb-lock-in:focus { border-color: var(--accent); }
    .bb-lock-in::placeholder { color: var(--faint); letter-spacing: 0; }
    .bb-lock .row { display: flex; gap: 8px; justify-content: center; margin-top: 10px; }
    .bb-lock .go { font-size: 10px; letter-spacing: .1em; text-transform: uppercase; padding: 6px 14px; border-radius: 999px; background: var(--chip);
      box-shadow: inset 0 0 0 1px var(--chip-line); cursor: pointer; color: var(--text); }
    .bb-lock .go:hover { background: var(--row-hover); }
    .bb-lock .go.dim { background: transparent; box-shadow: none; color: var(--muted); }
    .bb-lock .e { margin-top: 10px; font-size: 10px; color: ${S.spectrum[3] || "#f04aa6"}; min-height: 14px; }
    .bb-lock .bb-refresh { position: absolute; left: 50%; bottom: -28px; transform: translateX(-50%); }
    .bb-lock.err .bb-lock-in { animation: bb-shake .4s ease; }

    .bb-fly { position: absolute; top: 0; z-index: 5; width: ${S.flyWidth || 300}px; visibility: hidden; opacity: 0;
      pointer-events: none; transition: opacity .18s ease, transform .18s ease; cursor: default; }
    .bb-fly.right { left: 100%; padding-left: 12px; transform: translateX(-6px); }
    .bb-fly.left { right: 100%; padding-right: 12px; transform: translateX(6px); }
    .bb-fly.in { left: auto; right: 6px; padding: 0; transform: translateY(-4px); }
    .bb-fly.show { visibility: visible; opacity: 1; transform: none; pointer-events: auto; }
    .bb-fly-card { background: var(--card); border-radius: ${R - 2}px; padding: 10px 12px;
      -webkit-backdrop-filter: blur(22px); backdrop-filter: blur(22px); box-shadow: inset 0 0 0 1px var(--card-line), 0 14px 36px rgba(0,0,0,0.3); }
    .bb-fly-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid var(--row-line); }
    .bb-fly-head b { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bb-fly-head span { color: var(--muted); font-size: 9.5px; white-space: nowrap; }
    .bb-steps { overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
    .bb-steps::-webkit-scrollbar { display: none; }
    .bb-steps div { display: grid; grid-template-columns: 26px 1fr 10px; gap: 6px; font-size: 10.5px; color: var(--muted); padding: 2px 0; }
    .bb-steps .n { font-weight: 600; font-feature-settings: "tnum"; }
    .bb-steps .done { color: var(--text); opacity: 0.5; }
    .bb-steps .cur { color: var(--text); }
    .bb-steps .cur .n, .bb-steps .cur .m { color: var(--accent); }
    .bb-steps .m { text-align: right; }
    .bb-steps.ticks div { grid-template-columns: 26px 1fr 18px; }
    .bb-steps.ticks .m { cursor: pointer; border-radius: 5px; text-align: center; transition: background .15s, transform .15s; }
    .bb-steps.ticks .m:hover { background: var(--row-hover); color: var(--text); transform: scale(1.3); }

    .bb-burst { position: absolute; right: 22px; top: 50%; width: 0; height: 0; pointer-events: none; z-index: 3; }
    .bb-burst i { position: absolute; left: -2px; top: -2px; width: 4px; height: 4px; border-radius: 50%; background: var(--c);
      box-shadow: 0 0 6px var(--c); animation: bb-spark var(--t) cubic-bezier(.1,.8,.3,1) forwards; }
    .bb-burst.done i { width: 5px; height: 5px; }
    .bb.bb-party { animation: bb-dance 1.5s cubic-bezier(.3,1.3,.4,1) 1; }
    .bb.bb-party .bb-tb { animation: bb-rave .6s linear 4; }
    .bb.bb-party .bb-proj { animation: bb-wave .7s cubic-bezier(.3,1.5,.4,1) 1; animation-delay: calc(var(--i, 0) * 80ms); }
    .bb-confetti { position: absolute; inset: 0; overflow: hidden; border-radius: ${R}px; pointer-events: none; z-index: 40; }
    .bb-confetti i { position: absolute; left: var(--x); top: -14px; width: 6px; height: 10px; border-radius: 1px; background: var(--c);
      opacity: 0; transform: scale(var(--s)); animation: bb-fall var(--t) cubic-bezier(.3,.5,.7,1) var(--d) forwards; }
    @keyframes bb-fall { 0% { top: -14px; transform: scale(var(--s)) rotate(0); opacity: 1 } 80% { opacity: 1 }
      100% { top: 104%; transform: scale(var(--s)) rotate(var(--r)); opacity: 0 } }
    @keyframes bb-dance { 0% { transform: none } 12% { transform: translateY(-14px) rotate(-1.4deg) scale(1.03) }
      28% { transform: translateY(3px) rotate(1.4deg) } 44% { transform: translateY(-8px) rotate(-.9deg) scale(1.015) }
      60% { transform: translateY(0) rotate(.7deg) } 78% { transform: translateY(-3px) } 100% { transform: none } }
    @keyframes bb-rave { from { filter: hue-rotate(0deg) brightness(1.2) } to { filter: hue-rotate(360deg) brightness(1.2) } }
    @keyframes bb-wave { 0% { transform: none } 35% { transform: translateY(-6px) scale(1.02) } 70% { transform: translateY(2px) } 100% { transform: none } }
    @keyframes bb-shake { 0%, 100% { transform: none; } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
    @keyframes bb-spark { 0% { transform: rotate(var(--a)) translateX(0) scale(1); opacity: 1 }
      100% { transform: rotate(var(--a)) translateX(var(--d)) scale(0); opacity: 0 } }
    @keyframes bb-wiggle { 0%,100% { transform: rotate(0) } 25% { transform: rotate(-12deg) } 75% { transform: rotate(12deg) } }
    @keyframes bb-ping { 0% { box-shadow: 0 0 0 0 rgba(120,170,255,0.45) } 70% { box-shadow: 0 0 0 6px rgba(120,170,255,0) } 100% { box-shadow: 0 0 0 0 rgba(120,170,255,0) } }
    @keyframes bb-sheen { from { background-position: 0 0 } to { background-position: 200% 0 } }
    @keyframes bb-arrive { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: none } }
  `;
}


function esc(t) { return String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function hideFly() { document.querySelectorAll(".bb-fly").forEach((f) => f.classList.remove("show")); }
function scheduleHide() { clearTimeout(memory.flyT); memory.flyT = setTimeout(hideFly, 160); }
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
  const boardBar = bb.querySelector(".bb-board .bb-tb");   // the card stays under the board's title bar, off the crew
  const headBottom = inside && boardBar ? boardBar.getBoundingClientRect().bottom + 6 : margin;
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
  if (!S.hoverSteps) return;
  const bb = proj.closest(".bb"), fly = bb && bb.querySelector(".bb-fly");
  const info = memory.stepsById[proj.dataset.id];
  if (!fly || !info || !info.steps.length) { hideFly(); return; }
  hideFly(); keepFly();
  fly.querySelector(".bb-fly-head b").textContent = info.name;
  fly.querySelector(".bb-fly-head span").textContent = `${info.done} / ${info.total} steps` + (info.ago ? ` · ${info.ago}` : "");
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

function dayKey(t) {
  const d = new Date(t === undefined ? Date.now() : t * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysBetween(a, b) { return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000); }
function Px({ rows, s, className }) {
  const [w, h] = size(rows);
  return <span className={"px " + (className || "")} style={{ width: w * s, height: h * s }}><i style={{ left: -s, top: -s, width: s, height: s, boxShadow: shadow(rows, s) }} /></span>;
}

function enterProj(e) {   // a pop right away; the step card if you rest on the row
  if (memory.dragging) return;
  const row = e.currentTarget, i = Number(row.dataset.i || 0);
  play(S.cute.hoverSound, S.cute.hoverVolume, S.cute.hoverPitch ? (0.85 + (i % 6) * 0.13).toFixed(2) : 0);
  clearTimeout(memory.flyOpenT); keepFly();
  memory.flyOpenT = setTimeout(() => { if (!memory.dragging) showFly(row); }, 320);
}
function leaveProj() { clearTimeout(memory.flyOpenT); scheduleHide(); }

function Project({ data, now, lastPush, index }) {
  const cfg = { id: data.id, name: S.names[data.id] || data.name, path: data.path };
  const ok = data && data.ok && data.total > 0;
  const frac = ok ? data.done / data.total : 0;
  const pct = Math.round(frac * 100);
  const full = ok && data.done >= data.total;
  const asleep = ok && data.done === 0;
  const hot = data && data.commitsToday > 0;
  const warm = !hot && data && data.commitAt && now - data.commitAt < S.activeHours * 3600;

  if (ok) {
    const prev = memory.done[cfg.id];
    if (prev !== undefined && data.done > prev) { memory.bumpAt[cfg.id] = now; if (!full) play(S.cute.stepSound); }
    memory.done[cfg.id] = data.done;
    const wasFull = memory.full[cfg.id];
    if (wasFull === false && full) { memory.doneAt[cfg.id] = now; play(S.cute.doneSound); }
    memory.full[cfg.id] = full;
  }
  const burst = memory.doneAt[cfg.id] && now - memory.doneAt[cfg.id] < 5 ? ["done", memory.doneAt[cfg.id]]
              : memory.bumpAt[cfg.id] && now - memory.bumpAt[cfg.id] < 5 ? ["step", memory.bumpAt[cfg.id]] : null;
  const pushed = lastPush && lastPush.repo === cfg.id && now - lastPush.at < 90;
  const arrived = memory.arrivedAt[cfg.id] && now - memory.arrivedAt[cfg.id] < 120;
  const cls = ["bb-proj", full ? "full" : "", asleep ? "asleep" : "", !ok ? "noplan" : "", hot ? "hot" : warm ? "warm" : "", arrived ? "arrived" : "", pushed ? "pushed" : ""].join(" ");
  const count = !data.ok ? "?" : !data.hasPlan ? "no plan" : !ok ? "plan" : full ? "DONE" : `${data.done}/${data.total}`;
  const last = data.commitAt ? ago(data.commitAt, now) : "";
  memory.stepsById[cfg.id] = { id: cfg.id, path: cfg.path, name: cfg.name, done: data.done, total: data.total, steps: data.steps || [], ago: last };
  const isNew = data.isNew && data.firstCommitAt && now - data.firstCommitAt < S.newForDays * 86400;
  const tip = [cfg.name, ok && !full && data.current ? `next: ${data.current}` : "", last ? `last commit ${last}` : ""].filter(Boolean).join("\n");

  return (
    <div className={cls} style={{ "--w": `${pct}%`, "--f": Math.max(frac, 0.02), "--i": index, "--tint": tintOf(cfg.id) }}
         onClick={() => { if (Date.now() - memory.dragEndAt > 300 && S.clickOpens && cfg.path) guarded(() => openPath(cfg.path), cfg.name); }}
         onMouseEnter={enterProj} onMouseLeave={leaveProj} data-i={index} data-id={cfg.id} title={tip}>
      <span className="bb-dot" />
      <span className="bb-icon" onMouseDown={dragIcon} onClick={(e) => e.stopPropagation()} title="drag me up and down the list"><Px rows={iconOf(cfg.id)} s={1.2} /></span>
      <span className="bb-name"><span>{cfg.name}</span>{isNew ? <em className="bb-new">NEW</em> : null}</span>
      <span className="bb-bar"><i /></span>
      <span className="bb-count">{pushed ? "pushed" : count}</span>
      {burst ? <Burst kind={burst[0]} at={burst[1]} /> : null}
    </div>
  );
}

function lockIn(e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  const all = (memory.boardRepos || []).filter((p) => p.path);
  if (!all.length) return;
  let pool = all.filter((p) => p.ok && p.total > 0 && p.done < p.total);
  if (!pool.length) pool = all;
  if (pool.length > 1 && memory.lockInLast) pool = pool.filter((p) => p.id !== memory.lockInLast);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  memory.lockInLast = pick.id;
  const name = S.names[pick.id] || pick.name;
  guarded(() => { play(S.cute.lockInSound); openPath(pick.path, S.lockInPrompt || ""); }, `lock in: ${name}`);
}
function Title() {
  return <span className="bb-title" onClick={openBoard} title={S.boardUrl ? "open the board" : ""}>{S.title}</span>;
}

// ── The crew: a buddy list ──────────────────────────────────────────────────
const GROUPS_KEY = "build-board.groups";
function groupsOpen() {
  if (!memory.groups) { try { memory.groups = JSON.parse(localStorage.getItem(GROUPS_KEY)) || {}; } catch (e) { memory.groups = {}; } }
  return memory.groups;
}
function toggleGroup(e, key) {
  e.stopPropagation();
  const G = groupsOpen(); G[key] = G[key] === false;
  try { localStorage.setItem(GROUPS_KEY, JSON.stringify(G)); } catch (err) {}
  play(S.cute.clickSound, 0.5); redraw();
}
function crewSorted(crew) {
  const rank = (id) => { const i = S.crewOrder.indexOf(id); return i < 0 ? 999 : i; };
  return (crew || []).slice().sort((a, b) => rank(a.id) - rank(b.id) || a.name.localeCompare(b.name));
}
function placeTip(e) {   // the card opens toward the middle of the window, so it never hangs off the edge
  const chip = e.currentTarget, win = chip.closest(".bb-win");
  if (!win) return;
  const c = chip.getBoundingClientRect(), w = win.getBoundingClientRect();
  chip.classList.toggle("r", c.left + c.width / 2 > w.left + w.width / 2);
}
function Buddy({ p }) {
  return (
    <span className="bb-chip" onMouseEnter={placeTip}>
      <LilGuy who={p.id} pose="idle" size={22} play />
      <b>{p.name}</b>
      <span className="bb-tip">
        <span className="who"><b>{p.name}</b> · {p.role}</span>
        <span className="sub">away · ask them to</span>
        {p.examples.map((x, i) => <span key={i} className="ex">{x}</span>)}
      </span>
    </span>
  );
}
function Footer() {
  return (
    <footer className="bb-foot">
        {S.cute.sounds ? (
          <span className={"bb-mute lv" + level()} onClick={toggleSound} title={levelTitle()}>
            <Px rows={SPK_OFF} s={1.6} className="lv0" /><Px rows={SPK_1} s={1.6} className="lv1" /><Px rows={SPK_ON} s={1.6} className="lv2" /><Px rows={SPK_3} s={1.6} className="lv3" />
          </span>
        ) : null}
        <span className="bb-refresh" onClick={(e) => { e.stopPropagation(); refreshWidget(); }} onMouseDown={(e) => e.stopPropagation()} title="reload the widget">↻</span>
        <span className="sp" />
        <span className="bb-btn" onClick={(e) => { e.stopPropagation(); lockNow(e.shiftKey); }} onDoubleClick={(e) => { e.stopPropagation(); lockNow(true); }} onMouseDown={(e) => e.stopPropagation()}
              title="lock · shift-click or double-click: lock for company"><Px rows={LOCK_PX} s={1.2} />LOCK</span>
        <span className="bb-btn" onClick={(e) => { e.stopPropagation(); helpChat(); }} onMouseDown={(e) => e.stopPropagation()}
              title="a Claude Code chat in the widget's own folder: bugs, ideas, tweaks">HELP</span>
    </footer>
  );
}
function Crew({ crew }) {
  if (!S.crewTitle || !crew || !crew.length) return null;
  const G = groupsOpen(), people = crewSorted(crew);
  const working = [], away = people;   // live status comes in with the hook; for now everyone's away
  const head = (key, label, n) => (
    <div className={"bb-grp" + (G[key] === false ? " shut" : "")} onClick={(e) => toggleGroup(e, key)}><i />{label} <span>({n})</span></div>
  );
  return (
    <section className="bb-win bb-crew">
      <header className="bb-tb" onMouseDown={startDrag}>
        <LilGuy who="base" pose="idle" size={18} />
        <span className="bb-title">{S.crewTitle}</span>
        <span className="sp" />
        <span className="bb-online">{working.length}/{people.length} online</span>
        <ThemeSwitch />
      </header>
      {head("office", "In the Office", working.length)}
      {G.office === false ? null : <div className="bb-empty">nobody's on the clock</div>}
      {head("away", "Away", away.length)}
      {G.away === false ? null : <div className="bb-chips">{away.map((p) => <Buddy key={p.id} p={p} />)}</div>}
    </section>
  );
}

function renderBoard({ output, error }) {
  let data = null, parseError = null;
  try { data = output ? JSON.parse(output) : null; } catch (e) { parseError = e.message; }
  const now = Math.floor(Date.now() / 1000);
  const today = data ? data.today || 0 : 0;
  const hiddenIds = layout().hidden || [];   // hidden back when the chest existed: they stay hidden
  if (data) memory.iconMap = assignIcons(data.projects.map((p) => p.id));
  const all = data ? data.projects.filter((p) => !S.hide.includes(p.id) && !hiddenIds.includes(p.id)) : [];
  if (data) memory.screens = data.screens || [];
  if (!shownHere(data)) return <span className="bb-off" style={{ display: "none" }} />;   // another display has it
  memory.data = data;
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
    if (memory.pushSeen !== null && pushAt && pushAt !== memory.pushSeen && now - pushAt < 90) { play(S.cute.pushSound); memory.partyAt = Date.now(); }
    memory.pushSeen = pushAt;
  }
  const L = layout(), board = L.board || [];
  const place = (p) => { const i = board.indexOf(p.id); return i < 0 ? board.length : i; };
  const repos = all.filter((p) => p.id !== "tools" && (board.includes(p.id) || isActive(p, now)))
                   .sort((a, b) => place(a) - place(b) || (b.activityAt || 0) - (a.activityAt || 0));
  const track = all.find((p) => p.id === "tools" && (board.includes("tools") || !L.board));   // hand-kept, no repo: sits apart at the bottom
  memory.boardRepos = repos;   // for LOCK IN
  const party = S.cute.pushParty && memory.partyAt && Date.now() - memory.partyAt < 4000;   // just pushed: the whole panel celebrates

  const theme = themeNow();

  return (
    <div className={"bb" + (party ? " bb-party" : "") + " bb-fixed"} data-theme={theme} ref={mountPos} onMouseMove={touch} onWheel={wheelScale}>
      {party ? <Confetti key={memory.partyAt} /> : null}
      <style>{styles()}</style>
      <Crew crew={data && data.crew} />
      <section className="bb-win bb-board">
        <header className="bb-tb" onMouseDown={startDrag} title={S.draggable ? "drag to move" : ""}>
          <LilGuy who="base" pose="icon" size={18} className="hov" />
          <Title />
          {memory.screens && memory.screens.length > 1 && S.screen !== "all"
            ? <span className="bb-swap" onClick={swapScreen} onMouseDown={(e) => e.stopPropagation()} title="send to the other display">⇄</span> : null}
          <span className="sp" />
          {S.crewTitle ? null : <ThemeSwitch />}
          {S.clickOpens ? <span className="bb-lockin" onClick={lockIn} onMouseDown={(e) => e.stopPropagation()} title="a random project from the board opens in Claude Code, /step already typed">LOCK IN</span> : null}
        </header>
        {S.showToday && data ? (
          <div className="bb-today">
            <span className="l">
              {today ? <span><b>{today} commit{today === 1 ? "" : "s"} today</b> · {data.activeToday} project{data.activeToday === 1 ? "" : "s"}</span>
                     : <span>no commits yet today</span>}
              {S.cute.streak && data.streak >= 2 ? <span> · {data.streak}-day streak</span> : null}
            </span>
            <span className="stamp">{ago(data.generatedAt, now)}</span>
          </div>
        ) : null}
        <div className="bb-body" onScroll={hideFly}>
          {error || parseError ? (
            <div className="bb-err">board.py didn't answer: {String(error || parseError)}</div>
          ) : (
            <div>
              <div className="bb-list">
                {repos.map((p, i) => <Project key={p.id} data={p} now={now} lastPush={data && data.lastPush} index={i} />)}
              </div>
              {track ? (
                <div className="bb-track"><b>TRACK<i>hand-kept · no repo</i></b>
                  <Project key="tools" data={track} now={now} lastPush={null} index={repos.length} />
                </div>
              ) : null}
            </div>
          )}
        </div>
        <Footer />
      </section>
      {S.hoverSteps ? (
        <div className="bb-fly right" onMouseEnter={keepFly} onMouseLeave={scheduleHide} onClick={(e) => e.stopPropagation()}>
          <div className="bb-fly-card">
            <div className="bb-fly-head"><b /><span /></div>
            <div className="bb-steps" />
          </div>
        </div>
      ) : null}
      <LockPad />
      <span className="bb-edge" onMouseDown={(e) => startResize(e, "w")} title="drag for width" />
      <span className="bb-edge l" onMouseDown={(e) => startResize(e, "l")} title="drag for width" />
      <span className="bb-grip l" onMouseDown={(e) => startResize(e, "lh")} onDoubleClick={resetSize} title="drag to resize · double-click to reset" />
      <span className="bb-edge-b" onMouseDown={(e) => startResize(e, "h")} title="drag for height" />
      <span className="bb-grip" onMouseDown={(e) => startResize(e, "wh")} onDoubleClick={resetSize} title="drag to resize · double-click to reset" />
    </div>
  );
}

// A stateful root so the widget can redraw itself at once (a drag, a tick) instead of waiting for the next refresh.
class Board extends React.Component {
  componentDidMount() {
    memory.redraw = () => this.forceUpdate(); watchMacTheme();
    if (S.lock && S.lock.reset) { try { localStorage.removeItem(PIN_KEY); localStorage.removeItem(PIN2_KEY); localStorage.removeItem(LOCK_KEY); } catch (e) {} }
    if (!memory.idleT) memory.idleT = setInterval(checkIdle, 15000);
    try { const L = localStorage.getItem(LOCK_KEY); if (L && pinStored(L === "2") && !memory.pin) lockNow(L === "2"); } catch (e) {}   // locked before the refresh, locked after
    if (!memory.keyT) { memory.keyT = true; window.addEventListener("keydown", (e) => { if (!memory.pin) return; const i = document.querySelector(".bb-lock-in"); if (i && document.activeElement !== i && e.key.length === 1) { i.focus(); } if (e.key === "Escape") pinCancel(); }); }
  }
  componentWillUnmount() { memory.redraw = null; }
  render() { return renderBoard(this.props); }
}
export const render = (props) => <Board {...props} />;
