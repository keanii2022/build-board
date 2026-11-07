// Build Board pet: turns a pixel grid into voxels (little cubes) for the 3D view.
// Plain JS, no JSX. Rows are strings of PAL letters, '.' is empty.
import { PAL } from "./sprites.jsx";

// thickness profile along one line of pixels: filled[i] true/false -> array of thickness (0 where empty)
function profile(filled, depth) {
  const n = filled.length;
  const out = new Array(n).fill(0);
  let first = -1, last = -1;
  for (let i = 0; i < n; i++) if (filled[i]) { if (first < 0) first = i; last = i; }
  if (first < 0) return out;
  const mid = (first + last) / 2, half = (last - first) / 2, cols = last - first + 1;
  for (let i = first; i <= last; i++) {
    if (!filled[i]) continue;
    const u = (i - mid) / (half + 0.5);
    let t = Math.max(1, Math.round(depth * Math.sqrt(Math.max(0, 1 - u * u))));
    out[i] = Math.min(t, cols);            // thin bits (ears, arms, a pendant) stay thin
  }
  return out;
}

export function voxelize(rows, opts = {}) {
  const round = opts.round !== false;
  const hollow = opts.hollow !== false;
  const depth = Math.max(1, Math.floor(opts.depth != null ? opts.depth : (round ? 6 : 2)));
  const h = rows.length;
  let w = 0;
  for (const r of rows) if (r.length > w) w = r.length;

  const colorAt = (x, y) => {
    const ch = rows[y][x];
    return ch && ch !== "." && PAL[ch] ? PAL[ch] : null;
  };

  // thickness per pixel
  const thick = [];
  if (round) {
    const rowT = [];
    for (let y = 0; y < h; y++) {
      const f = [];
      for (let x = 0; x < w; x++) f.push(!!colorAt(x, y));
      rowT.push(profile(f, depth));
    }
    const colT = [];
    for (let x = 0; x < w; x++) {
      const f = [];
      for (let y = 0; y < h; y++) f.push(!!colorAt(x, y));
      colT.push(profile(f, depth));
    }
    for (let y = 0; y < h; y++) {
      const line = [];
      for (let x = 0; x < w; x++) line.push(Math.min(rowT[y][x], colT[x][y]));
      thick.push(line);
    }
  } else {
    for (let y = 0; y < h; y++) {
      const line = [];
      for (let x = 0; x < w; x++) line.push(colorAt(x, y) ? depth : 0);
      thick.push(line);
    }
  }

  // emit
  const all = [];
  let zmin = Infinity, zmax = -Infinity;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = thick[y][x];
      if (!t) continue;
      const c = colorAt(x, y);
      const z0 = -Math.floor((t - 1) / 2);
      for (let z = z0; z < z0 + t; z++) {
        all.push({ x, y, z, c });
        if (z < zmin) zmin = z;
        if (z > zmax) zmax = z;
      }
    }
  }
  if (!all.length) return { voxels: [], w, h, d: 0 };

  let voxels = all;
  if (hollow) {
    const D = zmax - zmin + 3;               // one cell of slack either side
    const key = (x, y, z) => (y * (w + 2) + x + 1) * D + (z - zmin + 1);
    const seen = new Set();
    for (const v of all) seen.add(key(v.x, v.y, v.z));
    voxels = all.filter(v => !(
      v.x > 0 && v.x < w - 1 && v.y > 0 && v.y < h - 1 &&
      seen.has(key(v.x - 1, v.y, v.z)) && seen.has(key(v.x + 1, v.y, v.z)) &&
      seen.has(key(v.x, v.y - 1, v.z)) && seen.has(key(v.x, v.y + 1, v.z)) &&
      seen.has(key(v.x, v.y, v.z - 1)) && seen.has(key(v.x, v.y, v.z + 1))
    ));
  }
  return { voxels, w, h, d: zmax - zmin + 1 };
}

export function bounds(model) {
  const vs = model.voxels;
  if (!vs.length) return { cx: 0, cy: 0, cz: 0, w: 0, h: 0, d: 0 };
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const v of vs) {
    if (v.x < x0) x0 = v.x; if (v.x > x1) x1 = v.x;
    if (v.y < y0) y0 = v.y; if (v.y > y1) y1 = v.y;
    if (v.z < z0) z0 = v.z; if (v.z > z1) z1 = v.z;
  }
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, cz: (z0 + z1) / 2, w: x1 - x0 + 1, h: y1 - y0 + 1, d: z1 - z0 + 1 };
}

export function flatten(rowsList) {
  let h = 0;
  for (const g of rowsList) if (g.length > h) h = g.length;
  const out = new Array(h).fill("");
  rowsList.forEach((g, i) => {
    let gw = 0;
    for (const r of g) if (r.length > gw) gw = r.length;
    for (let y = 0; y < h; y++) {
      const r = y < g.length ? g[y] : "";
      out[y] += (i ? "." : "") + r + ".".repeat(gw - r.length);
    }
  });
  return out;
}
