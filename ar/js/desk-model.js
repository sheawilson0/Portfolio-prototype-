// The desk version: the card's scene as a small sculpture, about 25 cm across, built for export to GLB (web,
// Android) and USDZ (iPhone Quick Look). Quick Look has no stencils, clipping, additive light or double-sided
// materials, so everything here is real geometry: the pockets are holes in the base, the disc stands in a slot,
// and every picture has a back. Built in millimetres, returned in metres.
import * as THREE from 'three';
import { PROJECTS, SKY, buildSkyPane, buildPiece, squircleShape, toTexture, fontsReady } from './kit.js';

const BASE = { w: 250, d: 170, h: 20, r: 24 };
const POCKET = { size: 46, r: 9, z: 18, depth: 13, xs: [-84, -28, 28, 84] };
const PANE = { w: 168, h: 104, z: -48, t: 7, sink: 12 }; // the sky, standing in its slot at the back

// The base in the sky's colours: warm like the horizon by day, the night's blue after dark
const tone = (dark) => (dark ? { top: '#16294f', edge: '#13244a', ink: 'rgba(242,240,235,.66)', name: 'rgba(242,240,235,.48)', rim: '#1d3561', deep: '#0b1733', floor: SKY.night }
  : { top: '#fbf3ea', edge: '#f4ebe1', ink: 'rgba(10,10,10,.6)', name: 'rgba(10,10,10,.44)', rim: '#e3d6c8', deep: '#9fb4d3', floor: SKY.day });

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

// What's printed on the base: a name under each pocket and mine along the front
function baseTopCanvas(dark) {
  const k = 10; // px per mm
  const T = tone(dark);
  const [c, g] = canvas(BASE.w * k, BASE.d * k);
  g.fillStyle = T.top;
  g.fillRect(0, 0, c.width, c.height);
  const X = (mm) => (mm + BASE.w / 2) * k, Y = (mm) => (mm + BASE.d / 2) * k; // z grows towards the front
  g.fillStyle = T.ink;
  g.font = '400 50px "DM Sans"';
  g.textAlign = 'center';
  PROJECTS.forEach((p, i) => g.fillText(p.name, X(POCKET.xs[i]), Y(POCKET.z + POCKET.size / 2 + 8)));
  g.fillStyle = T.name;
  g.font = 'italic 400 64px Spectral';
  g.fillText('Shea Wilson', X(0), Y(73));
  return c;
}

// The inside of a pocket: the base's own colour at the rim, going dark, with the work's light coming up
// from the floor so the walls and the glow blend into one
function linerCanvas(dark) {
  const T = tone(dark);
  const [c, g] = canvas(8, 256);
  const lg = g.createLinearGradient(0, 0, 0, 256);
  lg.addColorStop(0, T.rim); lg.addColorStop(.55, T.deep); lg.addColorStop(1, T.floor.low);
  g.fillStyle = lg;
  g.fillRect(0, 0, 8, 256);
  return c;
}

// The floor of a pocket: a little patch of horizon, warm in the middle
function floorCanvas(dark) {
  const S = tone(dark).floor;
  const [c, g] = canvas(256, 256);
  g.fillStyle = S.low;
  g.fillRect(0, 0, 256, 256);
  const rg = g.createRadialGradient(128, 128, 0, 128, 128, 150);
  rg.addColorStop(0, S.glow); rg.addColorStop(1, S.low);
  g.fillStyle = rg;
  g.fillRect(0, 0, 256, 256);
  return c;
}

// Walls facing inwards round a closed outline, from y = 0 down to -depth. v runs 0 at the rim to 1 at the floor.
function linerGeometry(points, depth) {
  const pos = [], uv = [], idx = [];
  const n = points.length;
  let len = 0;
  const along = [0];
  for (let i = 1; i <= n; i++) { len += points[i % n].distanceTo(points[i - 1]); along.push(len); }
  for (let i = 0; i <= n; i++) {
    const p = points[i % n];
    pos.push(p.x, 0, p.y, p.x, -depth, p.y);
    uv.push(along[i] / len, 1, along[i] / len, 0);
  }
  for (let i = 0; i < n; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, c, b, b, c, d); // wound so the faces point inwards for an outline running this way
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// Quick Look adds emission without fading it by the alpha, so soft light turns into hard-edged discs.
// For the USDZ, bake the fade in: colour times alpha, worked out in linear light and stored as sRGB.
const premultiplied = new Map();
const toLin = (c) => (c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4));
const toSrgb = (c) => (c <= .0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - .055);
function overBlack(tex) {
  if (!tex?.image) return tex;
  if (!premultiplied.has(tex)) {
    const img = tex.image;
    const w = img.width || img.naturalWidth, h = img.height || img.naturalHeight;
    const [c, g] = canvas(w, h);
    g.drawImage(img, 0, 0, w, h);
    const data = g.getImageData(0, 0, w, h);
    const px = data.data;
    for (let k = 0; k < px.length; k += 4) {
      const a = px[k + 3] / 255;
      for (let j = 0; j < 3; j++) px[k + j] = Math.round(toSrgb(toLin(px[k + j] / 255) * a) * 255);
      px[k + 3] = 255;
    }
    g.putImageData(data, 0, 0);
    const t = toTexture(c);
    t.userData.mimeType = 'image/jpeg';
    premultiplied.set(tex, t);
  }
  return premultiplied.get(tex);
}

// Unlit look that survives export: black diffuse, the picture as emission, its alpha as opacity
let quickLook = false;
function glowing(src) {
  const see = src.transparent || src.alphaTest > 0;
  const m = new THREE.MeshStandardMaterial({
    color: 0x000000, map: src.map, emissive: 0xffffff, emissiveMap: see && quickLook ? overBlack(src.map) : src.map, roughness: 1, metalness: 0,
    transparent: src.transparent, opacity: src.opacity, alphaTest: src.alphaTest || 0, depthWrite: src.depthWrite,
  });
  m.name = src.name;
  return m;
}

// Pictures without transparency go out as JPEG, which keeps the files small enough for a phone
function preferJpeg(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      const opaque = !m.transparent && !(m.alphaTest > 0);
      for (const key of ['map', 'emissiveMap']) if (m[key] && opaque) m[key].userData.mimeType = 'image/jpeg';
    }
  });
}

// One material per mesh: Quick Look's validator rejects the subsets three.js writes for multi-material meshes
function splitGroups(root) {
  const todo = [];
  root.traverse((o) => { if (o.isMesh && Array.isArray(o.material)) todo.push(o); });
  for (const o of todo) {
    const src = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    const parts = new THREE.Group();
    parts.name = o.name;
    parts.position.copy(o.position); parts.quaternion.copy(o.quaternion); parts.scale.copy(o.scale);
    src.groups.forEach((grp, gi) => {
      const mat = o.material[grp.materialIndex ?? gi];
      if (!mat || mat.visible === false) return;
      const g = new THREE.BufferGeometry();
      for (const [name, attr] of Object.entries(src.attributes)) {
        const size = attr.itemSize;
        g.setAttribute(name, new THREE.BufferAttribute(attr.array.slice(grp.start * size, (grp.start + grp.count) * size), size, attr.normalized));
      }
      const m = new THREE.Mesh(g, mat);
      m.name = `${o.name || 'part'}_${mat.name || gi}`;
      m.renderOrder = o.renderOrder;
      parts.add(m);
    });
    [...o.children].forEach((c) => parts.add(c));
    o.parent.add(parts);
    o.parent.remove(o);
  }
}

// Soft light (the corona, the glows) doesn't need big textures; redraw those canvases smaller
function shrinkSoftTextures(root, max = 384) {
  const done = new Set();
  root.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      for (const key of ['map', 'emissiveMap']) {
        const t = m[key];
        const img = t?.image;
        if (!t || done.has(t) || !(img instanceof HTMLCanvasElement) || !/Glow/.test(m.name)) continue;
        if (Math.max(img.width, img.height) <= max) continue;
        const k = max / Math.max(img.width, img.height);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        t.image = c;
        t.needsUpdate = true;
        done.add(t);
      }
    }
  });
}

export async function buildDeskModel({ dark = false, forQuickLook = false } = {}) {
  await fontsReady();
  quickLook = forQuickLook;
  premultiplied.clear();
  const model = new THREE.Group();
  model.name = 'SheaWilsonDesk';
  const mm = new THREE.Group(); // everything in millimetres, lifted so the base sits on the floor
  mm.position.y = BASE.h;
  model.add(mm);

  /* The base, with the pockets and the slot cut through it */
  const shape = squircleShape(BASE.w, BASE.d, BASE.r);
  const pocketShapes = POCKET.xs.map((x) => ({ x, z: POCKET.z, shape: squircleShape(POCKET.size, POCKET.size, POCKET.r) }));
  const slotShape = { x: 0, z: PANE.z, shape: squircleShape(PANE.w + 6, PANE.t + 4, 3.5) };
  for (const { x, z, shape: s } of [...pocketShapes, slotShape]) {
    const hole = new THREE.Path(s.getPoints(8).map((p) => new THREE.Vector2(p.x + x, p.y - z)).reverse());
    shape.holes.push(hole);
  }
  const bevel = 1.4;
  const baseGeo = new THREE.ExtrudeGeometry(shape, { depth: BASE.h - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 6 });
  baseGeo.translate(0, 0, -(BASE.h - bevel)); // top face at z = 0 before turning flat, bottom at -h
  baseGeo.rotateX(-Math.PI / 2); // shape y becomes -z, extrusion becomes up
  // Caps get UVs across the base so the print lands in the right place
  const uvs = baseGeo.attributes.uv, P = baseGeo.attributes.position;
  const capCount = baseGeo.groups[0].count;
  const capIndex = baseGeo.index ? baseGeo.index.array : null;
  const seen = new Set();
  for (let k = 0; k < capCount; k++) {
    const vi = capIndex ? capIndex[k] : k;
    if (seen.has(vi)) continue;
    seen.add(vi);
    uvs.setXY(vi, P.getX(vi) / BASE.w + .5, 1 - (P.getZ(vi) / BASE.d + .5));
  }
  uvs.needsUpdate = true;
  const topTex = toTexture(baseTopCanvas(dark));
  const base = new THREE.Mesh(baseGeo, [
    new THREE.MeshStandardMaterial({ name: 'BasePrint', color: 0xffffff, map: topTex, roughness: dark ? .62 : .82 }),
    new THREE.MeshStandardMaterial({ name: 'BaseEdge', color: tone(dark).edge, roughness: dark ? .6 : .85 }),
  ]);
  base.name = 'Base';
  mm.add(base);

  /* Inside the pockets: dark walls and the work's own colour at the floor */
  const linerMat = (name) => new THREE.MeshStandardMaterial({ name, color: 0xffffff, map: toTexture(linerCanvas(dark)), roughness: .9 });
  PROJECTS.forEach((p, i) => {
    const s = squircleShape(POCKET.size - .6, POCKET.size - .6, POCKET.r);
    const pts = s.getPoints(8);
    pts.pop();
    const liner = new THREE.Mesh(linerGeometry(pts.map((q) => new THREE.Vector2(q.x, -q.y)), POCKET.depth), linerMat(`Pocket_${p.id}`));
    liner.position.set(POCKET.xs[i], 0, POCKET.z);
    liner.name = `Pocket_${p.id}`;
    mm.add(liner);

    const floorGeo = new THREE.ShapeGeometry(s, 1);
    const fp = floorGeo.attributes.position, fu = floorGeo.attributes.uv;
    for (let k = 0; k < fp.count; k++) fu.setXY(k, fp.getX(k) / POCKET.size + .5, fp.getY(k) / POCKET.size + .5);
    const floorTex = toTexture(floorCanvas(dark));
    const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ name: `Glow_${p.id}`, color: 0x000000, emissive: 0xffffff, emissiveMap: floorTex, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(POCKET.xs[i], -POCKET.depth + .2, POCKET.z);
    mm.add(floor);
  });

  // The slot's inside, so the sky goes down into the base
  {
    const pts = slotShape.shape.getPoints(8);
    pts.pop();
    const liner = new THREE.Mesh(linerGeometry(pts.map((q) => new THREE.Vector2(q.x, -q.y)), BASE.h - 2), linerMat('Slot'));
    liner.position.set(0, 0, PANE.z);
    mm.add(liner);
  }

  /* The sky, standing in its slot: the homepage's hero as an object */
  const pane = buildSkyPane({ w: PANE.w, h: PANE.h, r: 12, depth: PANE.t, sky: dark ? SKY.night : SKY.day });
  pane.group.position.set(0, PANE.h / 2 - PANE.sink, PANE.z);
  pane.faceMat.name = 'SkyFace';
  pane.backMat.name = 'SkyBack';
  pane.edgeMat.name = 'SkyEdge';
  pane.group.traverse((o) => {
    if (!o.isMesh) return;
    if (Array.isArray(o.material)) o.material = o.material.map((m) => (m.isMeshBasicMaterial ? glowing(m) : m));
    else if (o.material.isMeshBasicMaterial) o.material = glowing(o.material);
  });
  mm.add(pane.group);

  /* The work, hovering over the pockets it came out of */
  const turn = [.2, .07, -.07, -.2];
  for (let i = 0; i < PROJECTS.length; i++) {
    const p = PROJECTS[i];
    const piece = await buildPiece(p, { video: false, dark, backs: false });
    piece.remove(piece.userData.hit);
    piece.scale.setScalar(1.5);
    piece.position.set(POCKET.xs[i], 10, POCKET.z - 2);
    piece.rotation.y = turn[i];
    const extra = [];
    piece.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      if (Array.isArray(m)) return;
      if (m.isMeshBasicMaterial) {
        // Screenshots are opaque (their corners are geometry); only the phones and canvases carry alpha
        const src = m.map?.image?.src || '';
        if (src && !/snapshot-phone|quit28-iphone|quit28-calendar|pip/.test(src)) { m.transparent = false; m.alphaTest = 0; m.depthWrite = true; }
        o.material = glowing(m);
        o.material.name = `${p.id}_picture`;
        if (m.map) {
          // A back for every picture: its silhouette, in a dark satin
          const b = new THREE.Mesh(o.geometry, new THREE.MeshStandardMaterial({ name: `${p.id}_back`, color: dark ? '#1a1c22' : '#2a2c33', map: m.map, transparent: m.transparent, alphaTest: m.alphaTest, roughness: .45 }));
          b.rotation.y = Math.PI;
          b.position.z = -.25;
          extra.push([o, b]);
        }
      }
    });
    for (const [o, b] of extra) o.add(b);
    mm.add(piece);
  }

  preferJpeg(model);
  // Exporters write userData into the file; ours holds references to other objects, so clear it
  model.traverse((o) => {
    o.userData = {};
    if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.userData = {};
  });
  shrinkSoftTextures(model);
  splitGroups(model);
  model.scale.setScalar(.001);
  model.updateMatrixWorld(true);
  return model;
}
