// Shared pieces for the 3D and AR versions of the site: the palette, the work, and the objects they're built from.
// Units are millimetres of the printed card (85 x 55), so the same scene sits on the card, on a desk or in the world.
import * as THREE from '../vendor/three/three.module.js';

import { asset, SITE, CARD, SKY, PROJECTS, MORE } from './projects.js';
export { asset, SITE, CARD, SKY, PROJECTS, MORE };

export async function fontsReady() {
  if (!document.fonts) return;
  await Promise.all(['300 40px Spectral', 'italic 300 40px Spectral', '200 40px Spectral', '400 20px "DM Sans"', '500 20px "DM Sans"']
    .map((f) => document.fonts.load(f).catch(() => null)));
}

/* ───────── Canvas textures ───────── */

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

export function toTexture(c, { srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// A soft round light: white in the middle, nothing at the edge. Tint it with the material colour.
export function glowCanvas({ size = 256, falloff = [1, .62, .3, .1, .025, 0] } = {}) {
  const [c, g] = canvas(size, size);
  const r = size / 2;
  const rg = g.createRadialGradient(r, r, 0, r, r, r);
  falloff.forEach((a, k) => rg.addColorStop(k / (falloff.length - 1), `rgba(255,255,255,${a})`));
  g.fillStyle = rg;
  g.fillRect(0, 0, size, size);
  return c;
}

// The site's bleed: three coloured blobs, as one soft texture that fades to nothing well inside its edges
export function bleedCanvas(colors, { w = 512, h = 512 } = {}) {
  const [c, g] = canvas(w, h);
  const spots = [[.5, .45, .34], [.62, .6, .26], [.38, .62, .24]];
  const m = Math.min(w, h);
  colors.forEach((col, k) => {
    const [x, y, s] = spots[k % spots.length];
    const rg = g.createRadialGradient(x * w, y * h, 0, x * w, y * h, s * m);
    rg.addColorStop(0, hexA(col, .9)); rg.addColorStop(.3, hexA(col, .55)); rg.addColorStop(.62, hexA(col, .18)); rg.addColorStop(1, hexA(col, 0));
    g.fillStyle = rg;
    g.fillRect(0, 0, w, h);
  });
  return c;
}

export function shadowCanvas({ size = 256, strength = .5 } = {}) {
  const [c, g] = canvas(size, size);
  const r = size / 2;
  const rg = g.createRadialGradient(r, r, 0, r, r, r);
  rg.addColorStop(0, `rgba(0,0,0,${strength})`); rg.addColorStop(.45, `rgba(0,0,0,${strength * .55})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, size, size);
  return c;
}

export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}

// Type set on a canvas. `runs` is a list of [text, font] so a line can mix upright and italic.
export function textCanvas(lines, { color = '#0a0a0a', lineHeight = 1.1, pad = 8, scale = 2, align = 'left', tracking = 0 } = {}) {
  const [probe, pg] = canvas(4, 4);
  const measured = lines.map((runs) => {
    let w = 0, size = 0;
    for (const [text, font] of runs) { pg.font = font; w += pg.measureText(text).width + tracking * text.length; size = Math.max(size, parseFloat(/(\d+(?:\.\d+)?)px/.exec(font)[1])); }
    return { runs, w, size };
  });
  const width = Math.ceil(Math.max(...measured.map((m) => m.w)) + pad * 2);
  const height = Math.ceil(measured.reduce((s, m) => s + m.size * lineHeight, 0) + pad * 2);
  const [c, g] = canvas(width * scale, height * scale);
  g.scale(scale, scale);
  g.fillStyle = color;
  g.textBaseline = 'alphabetic';
  let y = pad;
  for (const m of measured) {
    y += m.size * lineHeight * .82;
    let x = align === 'center' ? (width - m.w) / 2 : pad;
    for (const [text, font] of m.runs) {
      g.font = font;
      if (tracking) { for (const ch of text) { g.fillText(ch, x, y); x += g.measureText(ch).width + tracking; } }
      else { g.fillText(text, x, y); x += g.measureText(text).width; }
    }
    y += m.size * lineHeight * .18;
  }
  void probe;
  return c;
}

/* ───────── Geometry ───────── */

// Continuous corners, like the site's squircle cards: a superellipse in each corner
export function squircleShape(w, h, r, n = 4.2) {
  const s = new THREE.Shape();
  const x0 = -w / 2, y0 = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  const steps = 14;
  const corner = (cx, cy, a0) => {
    for (let k = 0; k <= steps; k++) {
      const t = a0 + (k / steps) * (Math.PI / 2);
      const ct = Math.cos(t), st = Math.sin(t);
      const px = cx + Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n) * r;
      const py = cy + Math.sign(st) * Math.pow(Math.abs(st), 2 / n) * r;
      if (k === 0 && a0 === 0) s.moveTo(px, py); else s.lineTo(px, py);
    }
  };
  corner(x0 + w - r, y0 + h - r, 0);
  corner(x0 + r, y0 + h - r, Math.PI / 2);
  corner(x0 + r, y0 + r, Math.PI);
  corner(x0 + w - r, y0 + r, Math.PI * 1.5);
  s.closePath();
  return s;
}

// UVs from 0 to 1 across the shape's box, so a picture fills it
function normaliseUVs(geo, w, h) {
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let k = 0; k < pos.count; k++) uv.setXY(k, pos.getX(k) / w + .5, pos.getY(k) / h + .5);
  uv.needsUpdate = true;
  return geo;
}

export function squirclePlane(w, h, r) {
  return normaliseUVs(new THREE.ShapeGeometry(squircleShape(w, h, r), 1), w, h);
}

// A slab with softened edges. Group 0 is the two faces, group 1 the sides.
export function squircleSlab(w, h, r, depth, bevel = Math.min(depth * .45, r * .3)) {
  const geo = new THREE.ExtrudeGeometry(squircleShape(w - bevel * 2, h - bevel * 2, Math.max(r - bevel, .01)), {
    depth: Math.max(depth - bevel * 2, 0.0001), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 1,
  });
  geo.translate(0, 0, -depth / 2 + bevel);
  normaliseUVs(geo, w, h);
  geo.computeVertexNormals();
  return geo;
}

/* ───────── Textures from files ───────── */

const loader = new THREE.TextureLoader();
const cache = new Map();
export function loadTexture(path, { srgb = true } = {}) {
  const key = path + srgb;
  if (!cache.has(key)) {
    cache.set(key, new Promise((resolve, reject) => loader.load(asset(path), (t) => {
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      resolve(t);
    }, undefined, reject)));
  }
  return cache.get(key);
}

export function videoTexture(sources) {
  const v = document.createElement('video');
  Object.assign(v, { muted: true, loop: true, playsInline: true, crossOrigin: 'anonymous', preload: 'auto' });
  v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
  for (const [src, type] of sources) { const s = document.createElement('source'); s.src = asset(src); s.type = type; v.appendChild(s); }
  const t = new THREE.VideoTexture(v);
  t.colorSpace = THREE.SRGBColorSpace;
  return { texture: t, video: v };
}

export function environment(renderer, RoomEnvironment) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return env;
}

/* ───────── The objects ───────── */

// The homepage's hero as an object: a standing slab whose face is the sky (top, middle, horizon) with
// "Always making something." on it. It replaces the old disc and its ring of colour. setSky() repaints it.
export function skyCanvas(s, { w = 1024, h = 640, headline = true, name = false } = {}) {
  const [c, g] = canvas(w, h);
  const lg = g.createLinearGradient(0, 0, 0, h);
  lg.addColorStop(0, s.top); lg.addColorStop(.48, s.mid); lg.addColorStop(.92, s.low); lg.addColorStop(1, s.low);
  g.fillStyle = lg;
  g.fillRect(0, 0, w, h);
  if (s.ga) { // the glow on the horizon at sunrise and sunset
    const rg = g.createRadialGradient(w / 2, h * 1.08, 0, w / 2, h * 1.08, w * .62);
    rg.addColorStop(0, hexA(s.glow, Math.min(1, s.ga))); rg.addColorStop(1, hexA(s.glow, 0));
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
  }
  if (headline) {
    const size = Math.round(h * .17);
    const t = textCanvas([[['Always making ', `300 ${size}px Spectral`], ['something.', `italic 300 ${size}px Spectral`]]], { color: s.ink || '#0a0a0a', scale: 1, tracking: -size * .02 });
    const k = Math.min(1, (w * .84) / t.width);
    g.drawImage(t, (w - t.width * k) / 2, h * (name ? .3 : .36), t.width * k, t.height * k);
    if (name) {
      g.font = `italic 400 ${Math.round(h * .062)}px Spectral`;
      g.fillStyle = s.dark ? 'rgba(242,240,235,.6)' : 'rgba(10,10,10,.5)';
      g.textAlign = 'center';
      g.fillText('Shea Wilson', w / 2, h * .74);
    }
  }
  return c;
}

export function buildSkyPane({ w = 40, h = 25, r = 3.4, depth = 1.6, sky = SKY.day, name = false } = {}) {
  const group = new THREE.Group();
  group.name = 'sky';
  const px = 1024;
  const face = toTexture(skyCanvas(sky, { w: px, h: Math.round(px * h / w), name }));
  const backTex = toTexture(skyCanvas(sky, { w: 256, h: Math.round(256 * h / w), headline: false }));
  const faceMat = new THREE.MeshBasicMaterial({ map: face, toneMapped: false });
  const backMat = new THREE.MeshBasicMaterial({ map: backTex, toneMapped: false });
  const edgeMat = new THREE.MeshStandardMaterial({ color: sky.dark ? '#1c3159' : '#f6f1ea', roughness: .5, metalness: 0 });
  const slab = new THREE.Mesh(squircleSlab(w, h, r, depth), [faceMat, edgeMat]);
  group.add(slab);
  // The front face is the extrusion's top cap; draw the back as its own plane so it isn't mirrored text
  const back = new THREE.Mesh(squirclePlane(w - .2, h - .2, r), backMat);
  back.rotation.y = Math.PI;
  back.position.z = -depth / 2 - .01;
  group.add(back);
  const setSky = (s) => {
    const c = face.image; const nc = skyCanvas(s, { w: c.width, h: c.height, name });
    c.getContext('2d').drawImage(nc, 0, 0); face.needsUpdate = true;
    const b = backTex.image; b.getContext('2d').drawImage(skyCanvas(s, { w: b.width, h: b.height, headline: false }), 0, 0); backTex.needsUpdate = true;
    edgeMat.color.set(s.dark ? '#1c3159' : '#f6f1ea');
  };
  return { group, slab, faceMat, backMat, edgeMat, w, h, setSky };
}

// Pip, the sprite I drew for the PowerPoint add-in: 6 frames across, 12 moods down. Idle is row 3, hello row 2.
// Each frame is copied onto a small canvas of its own, so any material (and any exporter) can show it.
export async function pipTexture({ still = false } = {}) {
  const sheet = (await loadTexture('assets/media/shipped/pip.png')).image;
  const [c, g] = canvas(96 * 4, 104 * 4);
  g.imageSmoothingEnabled = false;
  const t = toTexture(c);
  t.magFilter = THREE.NearestFilter;
  let row = 3, frames = 6, fps = 6 / 5.4, clock = 0, shown = -1;
  const show = (f) => {
    if (f === shown) return;
    shown = f;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(sheet, f * 96, row * 104, 96, 104, 0, 0, c.width, c.height);
    t.needsUpdate = true;
  };
  show(0);
  return {
    texture: t,
    mood(r, n = 6, seconds = 5.4) { row = r; frames = n; fps = n / seconds; clock = 0; shown = -1; show(0); },
    tick(dt) { if (still) return; clock += dt; show(Math.floor(clock * fps) % frames); },
  };
}

// Meridian's butterfly, live: the real mascot engine (assets/js/meridian-line.js) drawn into a texture.
// Falls back to Meridian's icon where the engine isn't on the page (the exported models).
let lineReady = null;
function loadLine() {
  if (typeof Line !== 'undefined') return Promise.resolve(true);
  if (!lineReady) lineReady = new Promise((ok) => { const sc = document.createElement('script'); sc.src = asset('assets/js/meridian-line.js'); sc.onload = () => ok(typeof Line !== 'undefined'); sc.onerror = () => ok(false); document.head.append(sc); });
  return lineReady;
}
export async function butterflyTexture({ size = 512, live = true } = {}) {
  const [c, g] = canvas(size, size);
  const tex = toTexture(c);
  const fallback = async () => ({ texture: await loadTexture('assets/media/shipped/icons/meridian.webp'), tick() {} });
  if (!live || !(await loadLine())) return fallback();
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;width:200px;height:200px;color:#f6c93a;pointer-events:none';
  host.setAttribute('aria-hidden', 'true');
  document.body.append(host);
  // eslint-disable-next-line no-undef
  const m = Line.mount(host, { eyeset: 'pen', mood: 'idle', follow: false, label: 'Meridian' });
  const ser = new XMLSerializer();
  const img = new Image();
  let busy = false, since = 0;
  let first;
  const ready = new Promise((ok) => { first = ok; });
  const draw = () => {
    if (busy) return;
    busy = true;
    const now = performance.now();
    m.draw(now / 1000, now);
    const xml = ser.serializeToString(m.svg)
      .replace(/var\(--head, currentColor\)/g, '#f6c93a').replace(/currentColor/g, '#f6c93a')
      .replace(/var\(--eye, #121214\)/g, '#121214').replace(/var\(--shine, #fff7de\)/g, '#fff7de')
      .replace('<svg', `<svg width="${size}" height="${size}"`);
    img.onload = () => { g.clearRect(0, 0, size, size); g.drawImage(img, 0, 0, size, size); tex.needsUpdate = true; busy = false; first(); };
    img.onerror = () => { busy = false; first(); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  };
  draw();
  await ready;
  return { texture: tex, tick(dt) { since += dt; if (since > 1 / 15) { since = 0; draw(); } } };
}

// A pane of glass for a product: frosted, with a bright edge and the project's light behind it
export function buildPane({ w, h, r = 3.2, depth = 1.2, tone = '#ffffff', map = null, opacity = .5, dark = false } = {}) {
  const group = new THREE.Group();
  const faceMat = new THREE.MeshPhysicalMaterial({
    color: dark ? '#141821' : '#ffffff', map, roughness: .18, metalness: 0, transparent: true, opacity, clearcoat: 1, clearcoatRoughness: .08,
    envMapIntensity: 1.2, depthWrite: false,
  });
  const edgeMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(tone).lerp(new THREE.Color('#ffffff'), .55), roughness: .12, transparent: true, opacity: .95, clearcoat: 1 });
  const slab = new THREE.Mesh(squircleSlab(w, h, r, depth), [faceMat, edgeMat]);
  slab.renderOrder = 1;
  group.add(slab);
  return { group, slab, faceMat, edgeMat };
}

// A flat picture with its own alpha (a phone, a screen) that floats in front of a pane
// `back` gives it a reverse side for when you walk round it: 'phone' is the device's dark silhouette,
// 'screen' a plain satin back. Without one the picture shows on both sides.
export function buildPicture(tex, { w, h, r = 0, back = null } = {}) {
  const geo = r ? squirclePlane(w, h, r) : new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .02, side: back ? THREE.FrontSide : THREE.DoubleSide, toneMapped: false });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 3;
  if (back) {
    const bm = back === 'phone'
      ? new THREE.MeshBasicMaterial({ color: '#16171c', map: tex, transparent: true, alphaTest: .02 })
      : new THREE.MeshStandardMaterial({ color: '#d9d6d0', roughness: .45, metalness: 0 });
    const b = new THREE.Mesh(geo, bm);
    b.rotation.y = Math.PI;
    b.position.z = -.06;
    b.renderOrder = 3;
    b.userData.isBack = true;
    m.add(b);
  }
  return m;
}

export function buildGlow(colors, { w, h, opacity = .7, additive = false } = {}) {
  const tex = toTexture(bleedCanvas(colors, { w: 512, h: Math.round(512 * h / w) }));
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, toneMapped: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.renderOrder = 0;
  return m;
}

export function buildLabel(lines, { height, color = '#0a0a0a', align = 'center', ...opts } = {}) {
  const c = textCanvas(lines, { color, align, ...opts });
  const tex = toTexture(c);
  const w = height * c.width / c.height;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, height), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  m.renderOrder = 4;
  m.userData.width = w;
  return m;
}

export function buildShadow({ w, h, strength = .45 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: toTexture(shadowCanvas({ strength }), { srgb: false }), transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = -3;
  return m;
}

/* ───────── The work, as miniatures ───────── */
// Each returns a Group about 30 mm tall, standing on y = 0, facing +z, with userData.project for taps.

export async function buildPiece(project, { dark = false, video = true, backs = true } = {}) {
  const B = (kind) => (backs ? kind : null);
  const group = new THREE.Group();
  group.name = project.id;
  group.userData.project = project;
  const layers = [];
  const add = (obj, depth) => { obj.userData.depth = depth; obj.userData.baseZ = obj.position.z; layers.push(obj); group.add(obj); return obj; };

  if (project.id === 'snapshot') {
    const [phone, results] = await Promise.all([loadTexture('assets/media/home/snapshot-phone.webp'), loadTexture('assets/media/home/snapshot-results.webp')]);
    const res = add(buildPicture(results, { w: 30, h: 22.5, r: 2.2, back: B('screen') }), -1);
    res.position.set(-6, 17, -3); res.rotation.z = THREE.MathUtils.degToRad(-5);
    const ph = add(buildPicture(phone, { w: 14.5, h: 30, back: B('phone') }), 1);
    ph.position.set(7, 16, 3);
  } else if (project.id === 'jumpstart') {
    const [back, front, exp] = await Promise.all([
      loadTexture(dark ? 'assets/media/home/jumpstart-agency-dark.webp' : 'assets/media/home/jumpstart-agency.webp'),
      loadTexture(dark ? 'assets/media/home/jumpstart-report-dark.webp' : 'assets/media/home/jumpstart-report.webp'),
      loadTexture(dark ? 'assets/media/home/jumpstart-export-dark.webp' : 'assets/media/home/jumpstart-export.webp'),
    ]);
    const a = add(buildPicture(back, { w: 30, h: 18.75, r: 1.6, back: B('screen') }), -1.2);
    a.position.set(-5, 20, -4); a.rotation.z = THREE.MathUtils.degToRad(-4);
    const b = add(buildPicture(front, { w: 23, h: 17.85, r: 1.6, back: B('screen') }), .3);
    b.position.set(3, 15, 0); b.rotation.z = THREE.MathUtils.degToRad(1.5);
    const c = add(buildPicture(exp, { w: 14, h: 10.1, r: 1.2, back: B('screen') }), 1.4);
    c.position.set(10, 8.5, 4); c.rotation.z = THREE.MathUtils.degToRad(4);
  } else if (project.id === 'quit28') {
    // The 28-day calendar pinned behind, the phone on Day 1 in front
    const [cal, phone] = await Promise.all([loadTexture('assets/media/home/quit28-calendar.webp'), loadTexture('assets/media/home/quit28-iphone.webp')]);
    const c = add(buildPicture(cal, { w: 30, h: 24.3, back: B('screen') }), -1.2);
    c.position.set(-6, 18, -3); c.rotation.z = THREE.MathUtils.degToRad(-3);
    const ph = add(buildPicture(phone, { w: 14.5, h: 30.1, back: B('phone') }), 1);
    ph.position.set(7, 16, 3); ph.rotation.z = THREE.MathUtils.degToRad(2);
  } else if (project.id === 'shipped') {
    // Pip, frame by frame, and Meridian's butterfly, live: the two characters from the homepage's Shipped tile
    const [pip, fly] = await Promise.all([pipTexture({ still: !video }), butterflyTexture()]);
    const f = add(buildPicture(fly.texture, { w: 27, h: 27 }), -.8);
    f.position.set(-7, 19, -2);
    const p = add(buildPicture(pip.texture, { w: 20.3, h: 22 }), 1);
    p.position.set(8.5, 11, 2);
    group.userData.tick = (dt) => { pip.tick(dt); fly.tick(dt); };
    group.userData.pip = pip;
  }

  group.userData.layers = layers;

  // An invisible box that catches taps anywhere on the piece
  const hit = new THREE.Mesh(new THREE.BoxGeometry(40, 34, 10), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, 16, 0);
  hit.userData.project = project;
  group.add(hit);
  group.userData.hit = hit;
  return group;
}
