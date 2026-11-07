// stage.jsx — three.js stage for build-board voxel pets.
// Plain JS (no JSX). Übersicht bundles this as a module; three itself is
// loaded at runtime from vendor/three.module.min.mjs via an injected
// <script type="module"> because the bundler can't import it.
//
// Exports:
//   loadThree(opts?)                 -> Promise<THREE>
//   mountStage(canvas, model, opts?) -> { look, poke, wasDrag, isDizzy, setRoll, setFriends, pokeFriend, getFriends, setModel, dispose, ready }
//     opts: pupils, scale, bg, accent, roll (ball mode), onDizzy()
//   renderThumb(model, size?, opts?) -> Promise<dataURL>
//
// Model: { voxels: [{ x, y, z, c }], w, h, d }  (y = row from the TOP)
// look(nx, ny): nx -1..1 left→right, ny -1..1 bottom→top (so ny=+1 is the
// top of the canvas; callers using screen coords should flip Y).

const VENDOR_PATHS = [
  "/build-board/vendor/three.module.min.mjs",
  "/build-board.widget/vendor/three.module.min.mjs",
];
const LOAD_TIMEOUT = 8000;

let threePromise = null;

async function pickThreeUrl(opts) {
  if (opts && opts.threeUrl) return opts.threeUrl;
  if (typeof window !== "undefined" && window.__BB_THREE_URL) return window.__BB_THREE_URL;
  const origin = location.origin;
  const primary = origin + VENDOR_PATHS[0];
  // Übersicht's server answers 403 to HEAD and 200 (its index page) to any missing path, so probe with a
  // one-byte GET and trust only a JavaScript content type.
  const isJs = async (url) => {
    try { const r = await fetch(url, { headers: { Range: "bytes=0-0" } }); return r.ok && /javascript/i.test(r.headers.get("content-type") || ""); }
    catch (e) { return false; }
  };
  if (await isJs(primary)) return primary;
  return origin + VENDOR_PATHS[1];
}

export function loadThree(opts = {}) {
  if (typeof window !== "undefined" && window.__BB_THREE) return Promise.resolve(window.__BB_THREE);
  if (threePromise) return threePromise;
  threePromise = new Promise((resolve, reject) => {
    let url = "(unresolved)";
    let script = null;
    let timer = null;
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("bb-three", onReady);
    };
    const onReady = () => {
      cleanup();
      if (window.__BB_THREE) resolve(window.__BB_THREE);
      else { threePromise = null; reject(new Error("three.js module ran but window.__BB_THREE is empty")); }
    };
    const fail = (msg) => {
      cleanup();
      if (script && script.parentNode) script.parentNode.removeChild(script);
      threePromise = null;
      reject(new Error(msg));
    };
    timer = setTimeout(() => fail("three.js did not load within " + (LOAD_TIMEOUT / 1000) + " s from " + url), LOAD_TIMEOUT);
    window.addEventListener("bb-three", onReady);
    pickThreeUrl(opts).then((u) => {
      url = u;
      script = document.createElement("script");
      script.type = "module";
      script.setAttribute("data-bb-three", "1");
      script.textContent =
        'import * as T from ' + JSON.stringify(url) + ';\n' +
        'window.__BB_THREE = T;\n' +
        'window.dispatchEvent(new Event("bb-three"));\n';
      script.addEventListener("error", () => fail("three.js module failed to load from " + url));
      document.head.appendChild(script);
    }, (e) => fail("could not resolve three.js url: " + (e && e.message)));
  });
  return threePromise;
}

// ---------------------------------------------------------------- helpers

const CUBE = 0.94;
const TAU = Math.PI * 2;

function hex(c) {
  return typeof c === "string" ? c : "#" + (c >>> 0).toString(16).padStart(6, "0");
}

function modelBounds(model, s) {
  const vx = model.voxels || [];
  let w = model.w, h = model.h, d = model.d;
  if (!(w > 0) || !(h > 0) || !(d > 0)) {
    let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity, minz = Infinity, maxz = -Infinity;
    for (const v of vx) {
      minx = Math.min(minx, v.x); maxx = Math.max(maxx, v.x);
      miny = Math.min(miny, v.y); maxy = Math.max(maxy, v.y);
      minz = Math.min(minz, v.z || 0); maxz = Math.max(maxz, v.z || 0);
    }
    if (!vx.length) { minx = maxx = miny = maxy = minz = maxz = 0; }
    if (!(w > 0)) w = maxx - minx + 1;
    if (!(h > 0)) h = maxy - miny + 1;
    if (!(d > 0)) d = maxz - minz + 1;
  }
  return {
    w, h, d,
    hx: w * s / 2, hy: h * s / 2, hz: d * s / 2,
    cy: h * s / 2,
    r: Math.hypot(w * s / 2, h * s / 2, d * s / 2),
  };
}

// voxel -> world: x centred, y flipped so y=0 (top row) is highest, feet at y=0
function voxelPos(v, model, s, out) {
  out.set((v.x - (model.w - 1) / 2) * s, (model.h - 1 - v.y + 0.5) * s, (v.z || 0) * s);
  return out;
}

function makeInstanced(THREE, model, s, anchorAtCentroid) {
  const vox = model.voxels || [];
  const geo = new THREE.BoxGeometry(CUBE * s, CUBE * s, CUBE * s);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0 });
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(vox.length, 1));
  mesh.count = vox.length;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const col = new THREE.Color();
  const centroid = new THREE.Vector3();
  if (anchorAtCentroid && vox.length) {
    for (const v of vox) centroid.add(voxelPos(v, model, s, p));
    centroid.multiplyScalar(1 / vox.length);
  }
  for (let i = 0; i < vox.length; i++) {
    voxelPos(vox[i], model, s, p).sub(centroid);
    m.makeTranslation(p.x, p.y, p.z);
    mesh.setMatrixAt(i, m);
    col.set(hex(vox[i].c || "#ffffff"));
    mesh.setColorAt(i, col);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return { mesh, centroid };
}

function disposeMesh(mesh) {
  if (!mesh) return;
  if (mesh.parent) mesh.parent.remove(mesh);
  if (mesh.geometry) mesh.geometry.dispose();
  if (mesh.material) mesh.material.dispose();
  if (mesh.dispose) mesh.dispose();
}

// Scene with lights + shadow-catching ground. fit(bounds) re-aims it.
function makeScene(THREE, accent) {
  const scene = new THREE.Scene();
  const hemi = new THREE.HemisphereLight(0xffffff, 0x3a3a55, 0.9);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  key.shadow.radius = 4;
  scene.add(key);
  scene.add(key.target);

  const rim = new THREE.DirectionalLight(new THREE.Color(hex(accent || "#8a80e6")), 1.4);
  scene.add(rim);
  scene.add(rim.target);

  const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1, 48), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const fit = (b) => {
    const r = Math.max(b.r, 0.001);
    key.position.set(r * 1.1, b.cy + r * 2.0, r * 1.5);
    key.target.position.set(0, b.cy, 0);
    const sc = key.shadow.camera;
    sc.left = -r * 1.5; sc.right = r * 1.5; sc.top = r * 1.5; sc.bottom = -r * 1.5;
    sc.near = 0.1; sc.far = r * 8;
    sc.updateProjectionMatrix();
    rim.position.set(-r * 1.4, b.cy + r * 1.2, -r * 1.6);
    rim.target.position.set(0, b.cy, 0);
    ground.scale.set(r * 1.4, r * 1.4, 1);
    ground.position.y = -0.01 * r;
  };
  return { scene, key, rim, hemi, ground, fit };
}

function fitCamera(camera, b, aspect, elev) {
  const r = Math.max(b.r, 0.001) * 1.04; // a little headroom
  const vfov = (camera.fov * Math.PI) / 180;
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
  let dist = r / Math.sin(Math.min(vfov, hfov) / 2);
  if (b.flat) {
    // wide, floor-hugging scene (pet + friends ring): fit width and the visible vertical span
    // instead of the bounding sphere, so the pet stays a decent size
    const half = Math.max(b.cy * Math.cos(elev) + b.hz * Math.sin(elev), b.hy * Math.cos(elev) + b.hz * Math.sin(elev));
    dist = Math.max((b.hx * 1.08) / Math.tan(hfov / 2), (half * 1.12) / Math.tan(vfov / 2));
  }
  camera.aspect = aspect;
  camera.position.set(0, b.cy + dist * Math.sin(elev), dist * Math.cos(elev));
  camera.lookAt(0, b.cy, 0);
  camera.near = Math.max(dist * 0.05, 0.01);
  camera.far = dist * 6;
  camera.updateProjectionMatrix();
}

function makeRenderer(THREE, canvas, extra) {
  const renderer = new THREE.WebGLRenderer(Object.assign({ canvas, alpha: true, antialias: true }, extra || {}));
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

// Group tree for one pet:
//   root (bob + yaw) > tilt (pitch about model centre) > body (scale, feet-anchored)
//     > bodyMesh, pupilGroup (offset/blink, anchored at pupil centroid) > pupilMesh
function makePet(THREE, model, pupils, s) {
  const b = modelBounds(model, s);
  const root = new THREE.Group();
  const tilt = new THREE.Group();
  const body = new THREE.Group();
  tilt.position.y = b.cy;
  body.position.y = -b.cy;
  root.add(tilt);
  tilt.add(body);
  const { mesh: bodyMesh } = makeInstanced(THREE, model, s, false);
  body.add(bodyMesh);
  let pupilGroup = null, pupilMesh = null, pupilBase = null;
  if (pupils && pupils.voxels && pupils.voxels.length) {
    const pm = { voxels: pupils.voxels, w: pupils.w || model.w, h: pupils.h || model.h, d: pupils.d || model.d };
    const { mesh, centroid } = makeInstanced(THREE, pm, s, true);
    pupilGroup = new THREE.Group();
    pupilGroup.position.copy(centroid);
    pupilGroup.add(mesh);
    pupilMesh = mesh;
    body.add(pupilGroup);
    // base local position + side (-1 left / +1 right) per pupil cube, for the dizzy orbit
    const tmp = new THREE.Matrix4(), v = new THREE.Vector3();
    pupilBase = [];
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, tmp);
      v.setFromMatrixPosition(tmp);
      pupilBase.push({ x: v.x, y: v.y, z: v.z, side: v.x < 0 ? -1 : 1 });
    }
  }
  const dispose = () => {
    disposeMesh(bodyMesh);
    disposeMesh(pupilMesh);
    if (root.parent) root.parent.remove(root);
  };
  return { root, tilt, body, bodyMesh, pupilGroup, pupilMesh, pupilBase, bounds: b, dispose };
}

function easeOutCubic(k) { return 1 - Math.pow(1 - k, 3); }
// squash / stretch / overshoot + jump for a hop; hp = elapsed / HOP_MS (0..1)
function hopPose(hp) {
  const o = { sx: 1, sy: 1, jump: 0 };
  if (!(hp >= 0 && hp < 1)) return o;
  if (hp < 0.3) {
    const k = easeOutCubic(hp / 0.3);
    o.sx = lerp(1, 1.15, k); o.sy = lerp(1, 0.85, k);
  } else if (hp < 0.6) {
    const k = easeInOut((hp - 0.3) / 0.3);
    o.sx = lerp(1.15, 0.9, k); o.sy = lerp(0.85, 1.2, k);
  } else {
    const k = easeOutBack((hp - 0.6) / 0.4);
    o.sx = lerp(0.9, 1, k); o.sy = lerp(1.2, 1, k);
  }
  if (hp > 0.3) o.jump = Math.sin((Math.PI * (hp - 0.3)) / 0.7);
  return o;
}
function easeInOut(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
function easeOutBack(k) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); }
function lerp(a, b, k) { return a + (b - a) * k; }
function damp(cur, target, lambda, dt) { return lerp(cur, target, 1 - Math.exp(-lambda * dt)); }

// ---------------------------------------------------------------- stage

export function mountStage(canvas, model, opts = {}) {
  const s = opts.scale || 1;
  const accent = opts.accent || "#8a80e6";
  const SPIN = 0.25;          // rad/s turntable
  const LOOK_HOLD = 2000;     // ms after last look() before spin resumes
  const DRAG_HOLD = 2000;     // ms after a drag before look/spin resume
  const HOP_MS = 450;
  const DRAG_K = 0.01;        // rad per px
  const INERTIA_DAMP = 2.5;   // 1/s
  const DIZZY_W = 9;          // rad/s
  const DIZZY_MS = 3500;
  const CLICK_MS = 200, CLICK_PX = 4;

  const st = {
    THREE: null, renderer: null, scene: null, camera: null, pet: null, sceneKit: null,
    model, pupils: opts.pupils || null,
    mounted: true, raf: 0, last: 0, t: 0,
    yaw: 0, pitch: 0, yawT: 0, pitchT: 0, lastLook: -Infinity,
    yawVel: 0, pitchVel: 0,
    px: 0, py: 0, pxT: 0, pyT: 0,
    nextBlink: 0, blinkAt: -Infinity,
    hopAt: -Infinity,
    roll: !!opts.roll,
    drag: null, dragEnd: -Infinity, wasDrag: false, dx: 0, dy: 0,
    dizzyAt: -Infinity, dizzy: false,
    friends: [], room: null, pendingFriends: null,
    ro: null,
  };
  const now = () => performance.now();
  st.nextBlink = now() + 3000 + Math.random() * 3000;

  const fit = () => {
    if (!st.renderer) return;
    const w = Math.max(canvas.clientWidth || canvas.width || 1, 1);
    const h = Math.max(canvas.clientHeight || canvas.height || 1, 1);
    st.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    st.renderer.setSize(w, h, false);
    fitCamera(st.camera, frameBounds(), w / h, 0.28);
  };

  // pet bounds, widened to the friends' ring when there are friends
  const frameBounds = () => {
    const b = st.pet.bounds;
    if (!st.friends.length) return b;
    const ring = ringRadii();
    let fw = 0;
    for (const f of st.friends) fw = Math.max(fw, f.bounds.hx, f.bounds.hz);
    const hx = ring.max + fw, hz = ring.max + fw;
    return { w: b.w, h: b.h, d: b.d, hx, hy: b.hy, hz, cy: b.cy, r: Math.hypot(hx, b.hy, hz), flat: true };
  };

  const build = (m, p) => {
    if (st.pet) st.pet.dispose();
    st.model = m; st.pupils = p || null;
    st.pet = makePet(st.THREE, m, p, s);
    const g = st.pet.pupilGroup;
    if (g) g.userData = { cx: g.position.x, cy: g.position.y, cz: g.position.z };
    st.scene.add(st.pet.root);
    if (!st.room) { st.room = new st.THREE.Group(); st.scene.add(st.room); }
    if (st.pendingFriends) { const l = st.pendingFriends; st.pendingFriends = null; applyFriends(l); }
    st.sceneKit.fit(frameBounds());
    if (st.roll) enterRoll();
    fit();
  };

  // ---- roll mode: free trackball on tilt.quaternion, root yaw unused
  const AX = { x: null, y: null, q: null };
  const enterRoll = () => {
    const T = st.THREE, pet = st.pet;
    if (!T || !pet) return;
    if (!AX.x) { AX.x = new T.Vector3(1, 0, 0); AX.y = new T.Vector3(0, 1, 0); AX.q = new T.Quaternion(); }
    pet.tilt.quaternion.setFromAxisAngle(AX.y, st.yaw).multiply(AX.q.setFromAxisAngle(AX.x, st.pitch));
    pet.root.rotation.y = 0;
    st.yaw = 0; st.pitch = 0; st.pitchT = 0;
  };
  const exitRoll = () => {
    const pet = st.pet;
    if (!pet) return;
    pet.tilt.quaternion.identity();
    pet.tilt.rotation.set(0, 0, 0);
    st.yaw = 0; st.pitch = 0; st.pitchVel = 0;
  };
  const spinBy = (dYaw, dPitch) => {
    const pet = st.pet;
    if (st.roll) {
      pet.tilt.quaternion.premultiply(AX.q.setFromAxisAngle(AX.x, dPitch));
      pet.tilt.quaternion.premultiply(AX.q.setFromAxisAngle(AX.y, dYaw));
    } else {
      st.yaw += dYaw;
      st.pitch = Math.max(-0.5, Math.min(0.5, st.pitch + dPitch));
      pet.root.rotation.y = st.yaw;
      pet.tilt.rotation.x = st.pitch;
    }
  };

  // ---- pointer drag
  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    st.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, t0: now(), lastMove: now(), moved: false };
    st.dx = 0; st.dy = 0;
    st.yawVel = 0; st.pitchVel = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  };
  const onMove = (e) => {
    const d = st.drag;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.lx, dy = e.clientY - d.ly;
    d.lx = e.clientX; d.ly = e.clientY;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > CLICK_PX) d.moved = true;
    const t = now(), dt = Math.max((t - d.lastMove) / 1000, 0.004);
    d.lastMove = t;
    st.dx += dx; st.dy += dy;
    const k = st.roll ? DRAG_K : DRAG_K * 0.5;
    st.yawVel = lerp(st.yawVel, (dx * DRAG_K) / dt, 0.5);
    st.pitchVel = lerp(st.pitchVel, (dy * k) / dt, 0.5);
  };
  const onUp = (e) => {
    const d = st.drag;
    if (!d || e.pointerId !== d.id) return;
    st.drag = null;
    st.dragEnd = now();
    st.wasDrag = d.moved || now() - d.t0 >= CLICK_MS;
    if (now() - d.lastMove > 80) { st.yawVel = 0; st.pitchVel = 0; } // held still before release
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.style.touchAction = "none";

  // ---- friends: small creatures wandering a ring around the pet
  const FRIEND_K = 0.55, POP_MS = 500, FSPIN_MS = 500;
  const ringRadii = () => {
    const b = st.pet.bounds;
    let fw = 0;
    for (const f of st.friends) fw = Math.max(fw, f.fw);
    const foot = Math.hypot(b.hx, b.hz) + fw * 0.6;   // never inside the pet's footprint
    return { min: Math.max(1.2 * b.hx, foot), max: Math.max(2.0 * b.hx, foot + fw * 1.5) };
  };
  const pickTarget = (f) => {
    const ring = ringRadii();
    let best = null;
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * TAU, r = lerp(ring.min, ring.max, Math.random());
      const t = { x: Math.cos(a) * r, z: Math.sin(a) * r };
      let clash = false;
      for (const o of st.friends) {
        if (o === f) continue;
        const d = Math.min(Math.hypot(o.target.x - t.x, o.target.z - t.z), Math.hypot(o.pos.x - t.x, o.pos.z - t.z));
        if (d < Math.max(f.fw, o.fw)) { clash = true; break; }
      }
      best = t;
      if (!clash) break;
    }
    f.target = best;
  };
  const makeFriend = (id, model, tNow) => {
    const fs = s * FRIEND_K;
    const b = modelBounds(model, fs);
    const { mesh } = makeInstanced(st.THREE, model, fs, false);
    const group = new st.THREE.Group();
    group.add(mesh);
    st.room.add(group);
    const f = {
      id, model, mesh, group, bounds: b, fw: b.w * fs, fs,
      pos: { x: 0, z: 0 }, target: { x: 0, z: 0 }, face: 0,
      state: "pause", pauseUntil: tNow + 300 + Math.random() * 1200,
      bornAt: tNow, hopAt: -Infinity, spinAt: -Infinity, walked: 0,
    };
    return f;
  };
  const disposeFriend = (f) => {
    disposeMesh(f.mesh);
    if (f.group.parent) f.group.parent.remove(f.group);
  };
  const applyFriends = (list) => {
    const tNow = now();
    const keep = new Map();
    for (const it of list || []) if (it && it.id != null && it.model) keep.set(String(it.id), it.model);
    const next = [];
    for (const f of st.friends) {
      if (keep.has(f.id)) { next.push(f); keep.delete(f.id); } else disposeFriend(f);
    }
    st.friends = next;
    for (const [id, model] of keep) {
      const f = makeFriend(id, model, tNow);
      st.friends.push(f);
      pickTarget(f);
      f.pos.x = f.target.x; f.pos.z = f.target.z;
      f.face = Math.random() * TAU;
      f.group.position.set(f.pos.x, 0, f.pos.z);
      f.group.scale.set(0.001, 0.001, 0.001);
    }
    st.sceneKit.fit(frameBounds());
    fit();
  };
  const updateFriends = (tNow, dt) => {
    if (!st.room) return;
    st.room.rotation.y = st.pet.root.rotation.y;   // the room turns with the pet
    for (const f of st.friends) {
      const fs = f.fs;
      if (f.state === "pause") {
        if (tNow >= f.pauseUntil) { pickTarget(f); f.state = "walk"; }
      } else {
        const dx = f.target.x - f.pos.x, dz = f.target.z - f.pos.z;
        const dist = Math.hypot(dx, dz);
        const step = 2.0 * fs * dt;   // slow amble: ~2 friend-voxels per second
        if (dist <= step) {
          f.pos.x = f.target.x; f.pos.z = f.target.z;
          f.state = "pause"; f.pauseUntil = tNow + 1000 + Math.random() * 3000;
        } else {
          f.pos.x += (dx / dist) * step; f.pos.z += (dz / dist) * step;
          f.walked += step;
          let want = Math.atan2(dx, dz);
          let diff = want - f.face;
          diff = ((diff + Math.PI) % TAU + TAU) % TAU - Math.PI;
          f.face += diff * (1 - Math.exp(-8 * dt));
        }
      }
      const walking = f.state === "walk";
      const stepBob = walking ? Math.abs(Math.sin((f.walked / fs) * Math.PI * 0.9)) * 0.22 * fs : 0;
      const pop = easeOutBack(Math.min(1, (tNow - f.bornAt) / POP_MS));
      const hop = hopPose((tNow - f.hopAt) / HOP_MS);
      const sp = (tNow - f.spinAt) / FSPIN_MS;
      const spin = sp >= 0 && sp < 1 ? TAU * easeOutCubic(sp) : 0;
      f.group.position.set(f.pos.x, stepBob + 0.9 * fs * hop.jump, f.pos.z);
      f.group.rotation.y = f.face + spin;
      f.group.scale.set(pop * hop.sx, pop * hop.sy, pop * hop.sx);
    }
  };

  const frame = () => {
    if (!st.mounted) return;
    st.raf = requestAnimationFrame(frame);
    const tNow = now();
    let dt = (tNow - st.last) / 1000;
    if (!(dt > 0)) dt = 0.016;
    dt = Math.min(dt, 0.25);   // throttled / backgrounded tabs still progress, big gaps don't jump
    st.last = tNow;
    st.t += dt;
    const pet = st.pet;
    const sv = s;

    // ---- rotation
    let dYaw = 0, dPitch = 0;
    const dragging = !!st.drag;
    const dragFresh = tNow - st.dragEnd < DRAG_HOLD;
    const velDamp = Math.exp(-(st.dizzy ? INERTIA_DAMP * 2.4 : INERTIA_DAMP) * dt);
    if (dragging) {
      const k = st.roll ? DRAG_K : DRAG_K * 0.5;
      dYaw = st.dx * DRAG_K; dPitch = st.dy * k;
      st.dx = 0; st.dy = 0;
      if (tNow - st.drag.lastMove > 80) { st.yawVel *= Math.exp(-20 * dt); st.pitchVel *= Math.exp(-20 * dt); }
    } else if (dragFresh || Math.abs(st.yawVel) > 0.05 || Math.abs(st.pitchVel) > 0.05) {
      dYaw = st.yawVel * dt; dPitch = st.pitchVel * dt;
      st.yawVel *= velDamp; st.pitchVel *= velDamp;
      if (!dragFresh && !st.roll) dPitch += (0 - st.pitch) * (1 - Math.exp(-3 * dt));
    } else if (!st.roll && tNow - st.lastLook < LOOK_HOLD) {
      dYaw = (st.yawT - st.yaw) * (1 - Math.exp(-6 * dt));
      dPitch = (st.pitchT - st.pitch) * (1 - Math.exp(-6 * dt));
    } else {
      dYaw = SPIN * dt;
      if (!st.roll) dPitch = (0 - st.pitch) * (1 - Math.exp(-3 * dt));
    }
    if (!st.roll && !dragging && Math.abs(st.pitch + dPitch) > 0.5) st.pitchVel = 0;
    spinBy(dYaw, dPitch);

    // ---- dizzy
    const omega = Math.hypot(dYaw, dPitch) / dt;
    if (!st.dizzy && omega > DIZZY_W) {
      st.dizzy = true; st.dizzyAt = tNow;
      if (typeof opts.onDizzy === "function") { try { opts.onDizzy(); } catch (err) { console.error(err); } }
    }
    if (st.dizzy && tNow - st.dizzyAt >= DIZZY_MS) st.dizzy = false;
    const dizzyAmp = st.dizzy ? Math.min(1, (DIZZY_MS - (tNow - st.dizzyAt)) / 500) : 0;

    // ---- breathing + bob (+ dizzy wobble)
    const breath = 1 + 0.025 * Math.sin((st.t * TAU) / 2.6);
    let bob = 0.15 * sv * Math.sin((st.t * TAU) / 3.0);
    bob += dizzyAmp * 0.2 * sv * Math.sin((st.t * TAU) / 0.45);
    pet.body.rotation.z = dizzyAmp * 0.12 * Math.sin((st.t * TAU) / 0.6);

    // ---- poke: squash / stretch / overshoot + small jump
    const hop = hopPose((tNow - st.hopAt) / HOP_MS);
    bob += 0.9 * sv * hop.jump;
    pet.body.scale.set(hop.sx, hop.sy * breath, hop.sx);
    pet.root.position.y = bob;

    // ---- friends
    updateFriends(tNow, dt);

    // ---- pupils: follow pointer, blink, dizzy orbit
    if (pet.pupilGroup) {
      st.px = damp(st.px, st.pxT, 10, dt);
      st.py = damp(st.py, st.pyT, 10, dt);
      const ud = pet.pupilGroup.userData;
      pet.pupilGroup.position.set(ud.cx + st.px, ud.cy + st.py, ud.cz);
      if (tNow >= st.nextBlink) {
        st.blinkAt = tNow;
        st.nextBlink = tNow + 3000 + Math.random() * 3000;
      }
      const bk = tNow - st.blinkAt;
      pet.pupilGroup.scale.y = bk >= 0 && bk < 120 ? 0.1 : 1;
      if (dizzyAmp > 0 || ud.orbiting) {
        const m = pet.pupilMesh, base = pet.pupilBase, M = st.THREE.Matrix4;
        if (!ud.mat) ud.mat = new M();
        const th = st.t * TAU * 2, r = dizzyAmp * 0.6 * sv;
        for (let i = 0; i < base.length; i++) {
          const bp = base[i];
          ud.mat.makeTranslation(bp.x + r * Math.cos(th * bp.side), bp.y + r * Math.sin(th * bp.side), bp.z);
          m.setMatrixAt(i, ud.mat);
        }
        m.instanceMatrix.needsUpdate = true;
        ud.orbiting = dizzyAmp > 0;
      }
    }

    st.renderer.render(st.scene, st.camera);
  };

  const start = () => {
    if (!st.mounted || st.raf || !st.renderer || document.hidden) return;
    st.last = now();
    st.raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    if (st.raf) cancelAnimationFrame(st.raf);
    st.raf = 0;
  };
  const onVis = () => (document.hidden ? stop() : start());

  const ready = loadThree(opts).then((THREE) => {
    if (!st.mounted) return;
    st.THREE = THREE;
    st.renderer = makeRenderer(THREE, canvas);
    st.sceneKit = makeScene(THREE, accent);
    st.scene = st.sceneKit.scene;
    if (opts.bg) st.scene.background = new THREE.Color(hex(opts.bg));
    st.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    build(st.model, st.pupils);
    if (typeof ResizeObserver !== "undefined") {
      st.ro = new ResizeObserver(fit);
      st.ro.observe(canvas);
    }
    document.addEventListener("visibilitychange", onVis);
    start();
  });
  ready.catch((e) => console.error("[build-board stage]", e));

  return {
    ready,
    look(nx, ny) {
      nx = Math.max(-1, Math.min(1, +nx || 0));
      ny = Math.max(-1, Math.min(1, +ny || 0));
      st.yawT = nx * 0.6;
      st.pitchT = -ny * 0.25;
      st.pxT = nx * 0.8 * s;
      st.pyT = ny * 0.5 * s;
      // enter look mode from wherever the spin left off, wrapped to the near side
      if (!st.roll && now() - st.lastLook >= LOOK_HOLD) {
        st.yaw = ((st.yaw + Math.PI) % TAU + TAU) % TAU - Math.PI;
      }
      st.lastLook = now();
    },
    poke() {
      st.hopAt = now();
    },
    wasDrag() {
      return st.wasDrag;
    },
    isDizzy() {
      return st.dizzy;
    },
    setRoll(on) {
      on = !!on;
      if (on === st.roll) return;
      st.roll = on;
      if (!st.pet) return;
      if (on) enterRoll(); else exitRoll();
    },
    setModel(m, p) {
      st.model = m; st.pupils = p || null;
      if (st.THREE) build(m, p);
    },
    setFriends(list) {
      if (st.pet && st.room) applyFriends(list);
      else st.pendingFriends = list || [];
    },
    getFriends() {
      return st.friends.map((f) => ({ id: f.id, x: f.pos.x, z: f.pos.z, walking: f.state === "walk" }));
    },
    pokeFriend(id) {
      const f = st.friends.find((x) => x.id === String(id));
      if (f) { f.hopAt = now(); f.spinAt = now(); }
    },
    dispose() {
      st.mounted = false;
      stop();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      if (st.ro) st.ro.disconnect();
      if (st.pet) st.pet.dispose();
      for (const f of st.friends) disposeFriend(f);
      st.friends = [];
      if (st.sceneKit) {
        st.sceneKit.ground.geometry.dispose();
        st.sceneKit.ground.material.dispose();
      }
      if (st.renderer) st.renderer.dispose();
      st.pet = st.scene = st.renderer = null;
    },
  };
}

// ---------------------------------------------------------------- thumbs

let thumbKit = null;
const thumbCache = new Map();

function thumbKey(model, size) {
  const vx = model.voxels || [];
  const first = vx.length ? JSON.stringify(vx[0]) : "";
  const last = vx.length ? JSON.stringify(vx[vx.length - 1]) : "";
  return JSON.stringify(vx).length + "|" + first + "|" + last + "|" + size;
}

export async function renderThumb(model, size = 64, opts = {}) {
  const key = thumbKey(model, size);
  if (!opts.nocache && thumbCache.has(key)) return thumbCache.get(key);
  const THREE = await loadThree(opts);
  if (!thumbKit) {
    const canvas = document.createElement("canvas");
    const renderer = makeRenderer(THREE, canvas, { preserveDrawingBuffer: true });
    const kit = makeScene(THREE, opts.accent || "#8a80e6");
    kit.key.shadow.mapSize.set(512, 512);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    thumbKit = { canvas, renderer, kit, camera };
  }
  const { canvas, renderer, kit, camera } = thumbKit;
  const s = opts.scale || 1;
  renderer.setSize(size, size, false);
  const pet = makePet(THREE, model, opts.pupils || null, s);
  pet.root.rotation.y = 0.6;
  kit.scene.add(pet.root);
  kit.fit(pet.bounds);
  fitCamera(camera, pet.bounds, 1, 0.35);
  renderer.render(kit.scene, camera);
  const url = canvas.toDataURL("image/png");
  pet.dispose();
  if (!opts.nocache) thumbCache.set(key, url);
  return url;
}
