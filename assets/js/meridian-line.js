// Meridian's mascot, copied as is from ~/Meridian/public/notch/line.js (Shea's own design, 4 Nov 2026) for /shipped/.
// The line, for the logo rules boards (4 Nov 2026), copied from round nine's engine. Round three adds mood 'script':
// the board passes script(t, e) and gets frame-by-frame control of flap, grow, tall (stretches the top wings, as in
// the M), mdraw (writes the M left to right), headK (head size), face (0 hides the eyes) and eyes (which mood's eyes).
// One mirrored line with a head,
// tilted in perspective so it reads as 3D. Eyes sit on the head in 3D and turn with it.
// Added here: face: false (Meridian's mark, no eyes), head (radius), the head's colour from --head, mood 'still'
// (the logo at rest) and mood 'hover' with a move: spin2d (today's sidebar) | flap | flip | turn | fold | draw.
// Line.mount(host, opts); Line.set(host, {...}).
// opts: eyeset (pen | flick | brush | one | pixels | type | shine), mood (still | hover | idle | work | need | done | error | sleep),
//       hover, work (spin | pinwheel), done (flip | side | hop | hopland), eyes3d (default true), grow, follow, zoom, weight, head, face.
const Line = (() => {
  const NS = 'http://www.w3.org/2000/svg', TAU = Math.PI * 2;
  const el = (tag, at = {}) => { const n = document.createElementNS(NS, tag); for (const k in at) n.setAttribute(k, at[k]); return n; };
  const ease = (v, to, k) => v + (to - v) * k;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = v => v * v * (3 - 2 * v);
  const f = n => n.toFixed(2);

  // ── The shape: the ⌘ curve as a butterfly, open at the top
  function cmd(n = 600, gap = .3) {
    const pts = [], t0 = 5 * Math.PI / 4 + gap, t1 = t0 + TAU - 2 * gap;
    for (let i = 0; i <= n; i++) {
      const t = t0 + (t1 - t0) * i / n, x = 3 * Math.cos(t) + 3 * Math.cos(3 * t), y = 3 * Math.sin(t) - 3 * Math.sin(3 * t);
      let X = (x - y) / Math.SQRT2, Y = (x + y) / Math.SQRT2;
      const u = .5 - .5 * Math.tanh(Y * .9); X *= 1 + (u - .5) * .6; Y *= 1 + (u - .5) * .4;
      pts.push([X, Y]);
    }
    let mx = 0; pts.forEach(([x, y]) => { mx = Math.max(mx, Math.abs(x), Math.abs(y)); });
    return pts.map(([x, y]) => [x / mx * .86, y / mx * .86 + .05]);
  }
  const WING = cmd(), MID = .05;
  // the top wings in writing order (left hook, middle, right hook): the M, as m.js draws it
  const TOPIDX = (() => {
    const runs = []; let cur = null;
    WING.forEach((p, i) => { if (p[1] < MID) { if (!cur) runs.push(cur = []); cur.push(i); } else cur = null; });
    const w = runs.filter(r => r.length > 5), side = r => r.reduce((a, i) => a + WING[i][0], 0);
    let [l, r] = side(w[0]) < 0 ? w : [w[1], w[0]];
    const mid = r => Math.abs(WING[r[0]][0]) < Math.abs(WING[r[r.length - 1]][0]);
    if (mid(l)) l = [...l].reverse(); if (!mid(r)) r = [...r].reverse();
    return l.concat(r.slice(1));
  })();
  function mpath(S, cx, cy, s, upto) {
    const last = Math.round(upto * (TOPIDX.length - 1)); let d = '';
    for (let k = 0; k <= last; k++) { const [X, Y] = WING[TOPIDX[k]], [x, y] = place(X, Y, S, cx, cy, s); d += (k ? 'L' : 'M') + f(x) + ' ' + f(y); }
    return d;
  }

  // ── Perspective: wings swing back (flap), the whole thing turns (yaw) and tips (pitch), nearer is bigger
  function place(X, Y, S, cx, cy, s) {
    const g = Y < MID ? S.top : S.bottom;
    X *= g; let y = (Y - MID) * g * (Y < MID ? (S.tall || 1) : 1);
    const a = X < 0 ? S.flap : -S.flap;
    let x = X * Math.cos(a), z = -X * Math.sin(a);
    const x2 = x * Math.cos(S.yaw) + z * Math.sin(S.yaw); z = -x * Math.sin(S.yaw) + z * Math.cos(S.yaw); x = x2;
    const y2 = y * Math.cos(S.pitch) + z * Math.sin(S.pitch); z = -y * Math.sin(S.pitch) + z * Math.cos(S.pitch); y = y2;
    const p = 1 / (1 + z * .55);
    return [cx + x * p * s, cy + (MID + y) * p * s];
  }
  // upto: how much of the line to draw, 0 to 1 (the Draw hover); WebKit ignores pathLength on a changing path, so it's done here
  function path(S, cx, cy, s, upto = 1) {
    let d = '', pen = false;
    const last = Math.round(upto * (WING.length - 1));
    WING.forEach(([X, Y], i) => {
      if (i > last) return;
      if ((Y < MID ? S.top : S.bottom) < .02) { pen = false; return; }
      const [x, y] = place(X, Y, S, cx, cy, s); d += (pen ? 'L' : 'M') + f(x) + ' ' + f(y); pen = true;
    });
    return d;
  }
  // a point on the head, as if the head were a ball turning with the body: returns screen x, y and how much it faces you
  function onHead(lon, lat, S) {
    let x = Math.sin(lon) * Math.cos(lat), y = Math.sin(lat), z = -Math.cos(lon) * Math.cos(lat);
    const x2 = x * Math.cos(S.yaw) + z * Math.sin(S.yaw); z = -x * Math.sin(S.yaw) + z * Math.cos(S.yaw); x = x2;
    const y2 = y * Math.cos(S.pitch) + z * Math.sin(S.pitch); z = -y * Math.sin(S.pitch) + z * Math.cos(S.pitch); y = y2;
    return [x, y, -z];
  }

  // ── Eyes. Each style draws all six moods with one construction, so they read as the same eyes.
  // pen:    one rounded stroke. bend + arches, - curves down; tilt + drops the inner ends (focused), - lifts them
  //         (worried); at tilt 90° the stroke stands upright (Needs you: wide awake); dy nudges the eyes.
  // flick:  the pen with a small lash at the outer end.
  // brush:  the pen's shapes as an ink stroke that swells in the middle and tapers to points.
  // one:    both eyes and a little smile between them, drawn as one line, like the body.
  // pixels: a 3 by 3 grid per eye; each mood lights a different pattern, and the squares fade between them.
  // type:   typed characters, like a kaomoji. They squash and swap, like a blink.
  // shine:  round eight's solid eye with lids and a highlight, kept to compare.
  const UP = Math.PI / 2;
  const PEN = {
    idle:  { len: 1, bend: .85 },
    work:  { len: .8, bend: 0, tilt: .32, dy: .22 },
    need:  { len: .7, bend: 0, tilt: UP, dy: -.1 },
    done:  { len: 1, bend: .85 },
    error: { len: .7, bend: -.25, tilt: -.42, dy: .05 },
    sleep: { len: 1, bend: -.55, dy: .12 },
  };
  const PEN_DIALS = { len: 1, bend: 0, tilt: 0, dy: 0 };
  const LIDS = {
    idle:  { cheek: .45 },
    work:  { lid: .46, tilt: .3, dy: .05 },
    need:  { size: 1.1, dy: -.08 },
    done:  { cheek: .45 },
    error: { lid: .34, tilt: -.42, size: .96, dy: .06 },
    sleep: { shut: .78, dy: .08 },
  };
  const LID_DIALS = { lid: 0, tilt: 0, cheek: 0, shut: 0, size: 1, dy: 0 };
  // pixels, drawn for the right eye (inner side on the left); the left eye is the mirror
  const PIX = {
    idle:  ['010', '101', '000'],
    work:  ['001', '110', '000'],
    need:  ['010', '010', '010'],
    done:  ['010', '101', '000'],
    error: ['100', '011', '000'],
    sleep: ['000', '101', '010'],
  };
  const TYPE = { idle: ['^', '^'], work: ['\\', '/'], need: ['!', '!'], done: ['^', '^'], error: ['>', '<'], sleep: ['-', '-'] };
  const GLYPH_DY = { '^': .42, '-': 0, '!': 0, '>': 0, '<': 0, '\\': 0, '/': 0 };
  const STYLE = {
    pen:    { kind: 'pen' },
    flick:  { kind: 'pen', flick: 1 },
    brush:  { kind: 'brush' },
    one:    { kind: 'one' },
    pixels: { kind: 'pixels' },
    type:   { kind: 'type' },
    shine:  { kind: 'lid', shine: 1 },
  };
  function penGeom(Q, ex, ey, s, sx, side, blink) {
    // an arch blinks by flattening, a straight stroke by shrinking a little
    const bend = Q.bend * (.35 + .65 * blink), straight = 1 - clamp(Math.abs(Q.bend) / .4);
    const h = Q.len * .62 * s * (1 - straight * (1 - blink) * .7), th = Q.tilt * -side, c = Math.cos(th), sn = Math.sin(th);
    const cy = ey + Q.dy * s + bend * h * .5 * c;
    return { x1: ex - h * c * sx, y1: cy - h * sn, x2: ex + h * c * sx, y2: cy + h * sn, qx: ex + bend * h * 1.3 * sn * sx, qy: cy - bend * h * 1.3 * c, h, bend };
  }
  const qpath = G => `M${f(G.x1)} ${f(G.y1)}Q${f(G.qx)} ${f(G.qy)} ${f(G.x2)} ${f(G.y2)}`;
  function lash(G, side, s) {
    const [px, py, tx, ty] = side > 0 ? [G.x2, G.y2, G.x2 - G.qx, G.y2 - G.qy] : [G.x1, G.y1, G.x1 - G.qx, G.y1 - G.qy];
    const n = Math.hypot(tx, ty) || 1, a = -side * 1.15 * (G.bend < -.1 ? -1 : 1), c = Math.cos(a), sn = Math.sin(a);
    const L = .7 * s * clamp((Math.abs(G.bend) - .15) / .3),   // only curved strokes get a lash
    ux = (tx * c - ty * sn) / n, uy = (tx * sn + ty * c) / n;
    return L < .05 ? '' : `M${f(px)} ${f(py)}l${f(ux * L)} ${f(uy * L)}`;
  }
  function brush(G, s) {
    const W = .34 * s, n = 18, A = [], B = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * G.x1 + 2 * u * t * G.qx + t * t * G.x2, y = u * u * G.y1 + 2 * u * t * G.qy + t * t * G.y2;
      let dx = 2 * u * (G.qx - G.x1) + 2 * t * (G.x2 - G.qx), dy = 2 * u * (G.qy - G.y1) + 2 * t * (G.y2 - G.qy);
      const l = Math.hypot(dx, dy) || 1, w = W * (.06 + .94 * Math.sin(Math.PI * t) ** 1.1);
      dx /= l; dy /= l; A.push(`${f(x - dy * w)} ${f(y + dx * w)}`); B.unshift(`${f(x + dy * w)} ${f(y - dx * w)}`);
    }
    return 'M' + A.join('L') + 'L' + B.join('L') + 'Z';
  }
  function drawLid(L, ex, ey, s, sx, side, blink, shine) {
    const rx0 = .72 * s * L.size, rx = rx0 * sx, ry = .86 * s * L.size, cy = ey + L.dy * s;
    const slope = Math.tan(L.tilt * -side), lidTop = cy - ry + L.lid * 2 * ry;
    const shut = Math.max(L.shut, (1 - blink) * (1 - clamp(L.cheek / .4)));
    const thShut = ry * (2 - 1.7 * shut), thCheek = ry * 2.2 * (1 - L.cheek);
    const at = x => {
      const u = clamp((x - ex) / rx, -1, 1), c = Math.sqrt(1 - u * u), top = cy - ry * c, bot = cy + ry * c;
      const up = Math.max(top, lidTop + slope * (x - ex), bot - thShut), lo = Math.min(bot, top + thCheek);
      return lo > up ? [up, lo] : [(up + lo) / 2, (up + lo) / 2];
    };
    const n = 24, U = [], D = [];
    for (let i = 0; i <= n; i++) { const x = ex - rx + 2 * rx * i / n, [up, lo] = at(x); U.push(`${f(x)} ${f(up)}`); D.unshift(`${f(x)} ${f(lo)}`); }
    let sh = '';
    if (shine) {
      const r0 = .27 * rx0, x = ex - .3 * rx, [up, lo] = at(x), y = Math.max(cy - .36 * ry, up + r0 * 1.25);
      const open = (1 - clamp(L.cheek / .35)) * (1 - clamp(L.shut / .45)) * blink;   // no shine on an arch or a closed eye
      const r = r0 * smooth(clamp((lo - y - r0 * .9) / (r0 * .9))) * smooth(open);
      if (r > .05) sh = `M${f(x - r * sx)} ${f(y)}a${f(r * sx)} ${f(r)} 0 1 0 ${f(2 * r * sx)} 0a${f(r * sx)} ${f(r)} 0 1 0 ${f(-2 * r * sx)} 0`;
    }
    return { d: 'M' + U.join('L') + 'L' + D.join('L') + 'Z', sh };
  }
  const blinkAt = (t, seed) => { const p = (t + seed) % 4.3; return p < .16 ? Math.abs(p - .08) / .08 : 1; };
  const wave = (e, n, len) => (1 - Math.cos(clamp(e / len) * n * TAU)) / 2;

  // ── Moves
  const WORK = {
    spin:     (t, e) => ({ flap: .55 + .25 * Math.sin(t * 2 * TAU), yaw: e * 2.4, hard: 1 }),
    pinwheel: (t, e) => ({ flap: .3 + .08 * Math.sin(t * 3 * TAU), roll: e * 3.2 }),
  };
  const DONE = {
    flip:    (t, e) => { const k = smooth(clamp(e / 1)); return { flap: .25 + .3 * wave(e, 1, 1), pitch: -k * TAU, hardPitch: 1, hop: Math.sin(clamp(e) * Math.PI) * 9 }; },
    side:    (t, e) => { const k = smooth(clamp(e / 1)); return { flap: .2 + .25 * wave(e, 1, 1), roll: k * TAU, hop: Math.sin(clamp(e) * Math.PI) * 9 }; },
    hop:     (t, e) => ({ flap: .3, hop: e < 1.4 ? Math.abs(Math.sin(e / 1.4 * 2 * Math.PI)) * 7 : 0 }),
    hopland: (t, e) => {
      if (e < .45) return { flap: .5 * wave(e, 1, .45), hop: Math.sin(e / .45 * Math.PI / 2) * 10 };
      const k = smooth(clamp((e - .45) / 1.5));
      return { flap: .15 + k * .65 + .3 * Math.sin((e - .45) * 8) * (1 - k), hop: 10 * (1 - k), drop: k * 5 };
    },
  };
  const MOODS = {
    idle:  (t)          => ({ flap: .45 + .12 * Math.sin(t * .55 * TAU), glance: 1, bob: 1 }),
    work:  (t, e, st)   => ({ bob: 1.5, ...WORK[st.work || 'spin'](t, e) }),
    need:  (t, e)       => { const p = e % 2.6; return { flap: p < .9 ? .05 + .75 * wave(p, 3, .9) : .05, lift: p < .9 ? 1 : .4 }; },
    done:  (t, e, st)   => DONE[st.done || 'flip'](t, e),
    error: (t, e)       => { const p = e % 2.4; return { flap: .3, yaw: p < 1.2 ? Math.sin(p / 1.2 * 3 * TAU) * .4 * (1 - p / 1.2) : 0, drop: 2 }; },
    sleep: ()           => ({ flap: 1.5, bob: .4 }),
    still: ()           => ({ flap: 0 }),
    script: (t, e, st)  => st.script ? st.script(t, e) : { flap: 0 },
    hover: (t, e, st)   => HOVER[st.hover || 'flap'](t, e),
  };
  // Meridian's mark is flat and still; on hover it plays one move, then settles back to flat.
  const HOVER = {
    spin2d: (t, e) => ({ flap: 0, roll: smooth(clamp(e / .9)) * TAU }),
    flap:   (t, e) => ({ flap: e < .5 ? .95 * wave(e, 1, .5) : .4 * wave(e - .5, 1, .45), lift: e < 1 ? .5 : 0 }),
    flip:   (t, e) => ({ ...DONE.flip(t, e), flap: .45 * Math.sin(clamp(e) * Math.PI) }),
    turn:   (t, e) => { const k = Math.sin(clamp(e / 1.2) * Math.PI); return { yaw: .75 * k, hard: 1, flap: .25 * k }; },
    fold:   (t, e) => ({ flap: 1.45 * wave(e, 1, 1.2) }),
    draw:   (t, e) => ({ flap: 0, draw: e < .2 ? 1 - smooth(e / .2) : smooth(clamp((e - .2) / .85)), headK: smooth(clamp((e - .9) / .25)) * (1 + .25 * Math.sin(clamp((e - .9) / .35) * Math.PI)) }),
  };

  function glanceAt(t, seed) {
    const P = 7.5, i = Math.floor((t + seed * 5) / P), ph = (t + seed * 5) % P;
    if (ph > 1.8) return [0, 0];
    const k = Math.sin(ph / 1.8 * Math.PI) ** 2, h = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453, r = h - Math.floor(h);
    return [(r < .5 ? -1 : 1) * (.35 + r * .3) * k, (r - .5) * .5 * k];
  }
  const P = { x: 0, y: 0, at: -1e9 };
  addEventListener('pointermove', e => { P.x = e.clientX; P.y = e.clientY; P.at = performance.now(); }, { passive: true });

  function mascot(m) {
    const o = m.o, g = el('g');
    const wing = el('path', { fill: 'none', stroke: 'currentColor', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const head = el('circle', { fill: 'var(--head, currentColor)' });
    const fill = el('path', { fill: 'var(--eye, #121214)' });
    const line = el('path', { fill: 'none', stroke: 'var(--eye, #121214)', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const shine = el('path', { fill: 'var(--shine, #fff7de)' });
    const txt = [0, 1].map(() => el('text', { fill: 'var(--eye, #121214)', 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': "'JetBrains Mono', ui-monospace, monospace", 'font-weight': 800, 'font-size': 7 }));
    g.append(wing, head, fill, shine, line, ...txt); m.svg.append(g);
    const px = [new Array(9).fill(0), new Array(9).fill(0)], kao = { cur: null, next: null, at: -9 };
    const S = { flap: .45, yaw: 0, pitch: 0, top: 1, bottom: 1 };
    const Q = { ...PEN_DIALS }, L = { ...LID_DIALS };
    let lift = 0, drop = 0, roll = 0, gr = o.grow ?? 1;
    return (t, now) => {
      const st = m.st, md = MOODS[st.mood](t, t - m.since, st);
      gr = md.grow != null ? md.grow : ease(gr, st.grow ?? 1, .06);
      S.tall = md.tall ?? 1;
      S.top = smooth(clamp(gr * 2)); S.bottom = smooth(clamp(gr * 2 - 1));
      S.flap = ease(S.flap, Math.max(md.flap, (1 - S.top) * .4), .3);
      lift = ease(lift, md.lift || 0, .1); drop = ease(drop, md.drop || 0, .12);
      let ty = 0, tp = 0;
      if ((st.follow ?? true) && now - P.at < 3000) {
        const r = m.host.getBoundingClientRect(), dx = P.x - (r.left + r.width / 2), dy = P.y - (r.top + r.height / 2), reach = Math.max(r.width * 1.3, 200);
        if (Math.hypot(dx, dy) < reach) { ty = -clamp(dx / reach, -1, 1) * .6; tp = -clamp(dy / reach, -1, 1) * .45; }
        else if (md.glance) { const [a, b] = glanceAt(t, m.seed); ty = a; tp = b; }
      } else if (md.glance) { const [a, b] = glanceAt(t, m.seed); ty = a; tp = b; }
      if (md.hard) S.yaw = md.yaw;
      else { S.yaw = Math.atan2(Math.sin(S.yaw), Math.cos(S.yaw)); S.yaw = ease(S.yaw, md.yaw ?? ty, .08); }
      if (md.hardPitch) S.pitch = md.pitch;
      else { S.pitch = Math.atan2(Math.sin(S.pitch), Math.cos(S.pitch)); S.pitch = ease(S.pitch, md.pitch ?? tp, .1); }
      if (md.roll != null) roll = md.roll; else { roll = Math.atan2(Math.sin(roll), Math.cos(roll)); roll = ease(roll, 0, .15); }
      const big = 1 + (1 - gr) * .6, size = 46, cy = 52 + Math.sin(t * 1.3) * (md.bob || 0) - lift * 4 + drop - (md.hop || 0);
      g.setAttribute('transform', `rotate(${f(roll * 180 / Math.PI)} 50 ${f(cy + MID * size)})`);
      wing.setAttribute('d', md.mdraw != null ? (md.mdraw > .002 ? mpath(S, 50, cy, size, md.mdraw) : '') : md.draw == null ? path(S, 50, cy, size) : md.draw > .002 ? path(S, 50, cy, size, md.draw) : ''); wing.setAttribute('stroke-width', o.weight ?? 5);
      const [hx, hy] = place(0, MID - .03, S, 50, cy, size), r = (o.head ?? 10.5) * big * (md.headK ?? 1);
      head.setAttribute('cx', f(hx)); head.setAttribute('cy', f(hy)); head.setAttribute('r', f(r));
      // the eyes' dials ease toward this mood's settings
      const Y = STYLE[st.eyeset] || STYLE.pen, lid = Y.kind === 'lid', Z = lid ? L : Q;
      const T = { ...(lid ? LID_DIALS : PEN_DIALS), ...(lid ? LIDS : PEN)[md.eyes || st.mood] };
      if (m.style !== st.eyeset) { m.style = st.eyeset; Object.assign(Z, T); px.forEach((p, i) => p.fill(0)); kao.cur = null; }
      for (const k in Z) Z[k] = ease(Z[k], T[k], .16);
      const blink = blinkAt(t, m.seed), s = 3 * big * (o.head ?? 10.5) / 10.5;
      // where each eye sits on the head, and how much it's turned away
      const E = [];
      [-1, 1].forEach(side => {
        if (st.eyes3d ?? true) {
          const [x, y, facing] = onHead(side * .4, .02, S);
          if (facing < .08) return;                          // round the back of the head
          E.push({ side, ex: hx + x * r, ey: hy + y * r + .5, sx: clamp(facing * 1.15, .15, 1) });
        } else {
          const facing = Math.cos(S.yaw) * Math.cos(S.pitch); if (facing < .15) return;
          E.push({ side, ex: hx + side * 4.6 * big * (.55 + .45 * facing) - Math.sin(S.yaw) * r * .3, ey: hy + .5, sx: .55 + .45 * facing });
        }
      });
      let fd = '', ld = '', sd = '';
      txt.forEach(n => n.setAttribute('display', 'none'));
      if (o.face === false || md.face === 0) E.length = 0;
      if (Y.kind === 'pen' || Y.kind === 'brush') E.forEach(e => {
        const G = penGeom(Q, e.ex, e.ey, s, e.sx, e.side, blink);
        if (Y.kind === 'brush') fd += brush(G, s); else ld += qpath(G) + (Y.flick ? lash(G, e.side, s) : '');
      });
      else if (Y.kind === 'one') {
        const G = E.map(e => penGeom(Q, e.ex, e.ey, s, e.sx, e.side, blink));
        if (G.length === 2) {
          const [a, b] = G, mx = (a.x2 + b.x1) / 2, my = Math.max(a.y2, b.y1) + s * 1.25;
          ld = qpath(a) + `Q${f(mx)} ${f(my)} ${f(b.x1)} ${f(b.y1)}Q${f(b.qx)} ${f(b.qy)} ${f(b.x2)} ${f(b.y2)}`;
        } else G.forEach(x => { ld += qpath(x); });
      } else if (Y.kind === 'pixels') E.forEach(e => {
        const p = px[e.side > 0 ? 1 : 0], pat = PIX[st.mood], c = .5 * s, q = .21 * s;
        for (let i = 0; i < 9; i++) {
          const row = i / 3 | 0, col = i % 3, on = +pat[row][e.side > 0 ? col : 2 - col];
          p[i] = ease(p[i], on, .2);
          if (p[i] < .04) continue;
          const w = q * p[i] * e.sx, h = q * p[i] * (.25 + .75 * blink);
          const x = e.ex + (col - 1) * c * e.sx, y = e.ey + (row - 1) * c * (.25 + .75 * blink);
          fd += `M${f(x - w)} ${f(y - h)}h${f(2 * w)}v${f(2 * h)}h${f(-2 * w)}Z`;
        }
      });
      else if (Y.kind === 'type') {
        const want = TYPE[st.mood];
        if (!kao.cur) kao.cur = want;
        if (want !== kao.cur && want !== kao.next) { kao.next = want; kao.at = t; }
        const k = clamp((t - kao.at) / .26);
        if (kao.next && k >= .5) { kao.cur = kao.next; kao.next = null; }
        const squash = Math.abs(Math.cos(k * Math.PI)) * (.1 + .9 * blink);
        E.forEach(e => {
          const n = txt[e.side > 0 ? 1 : 0], gl = kao.cur[e.side > 0 ? 1 : 0];
          n.textContent = gl; n.setAttribute('display', '');
          n.setAttribute('font-size', f(8.5 * big));
          n.setAttribute('transform', `translate(${f(e.ex)} ${f(e.ey + (GLYPH_DY[gl] || 0) * s)}) scale(${f(e.sx)} ${f(Math.max(.05, squash))})`);
        });
      } else E.forEach(e => { const x = drawLid(L, e.ex, e.ey, s, e.sx, e.side, blink, Y.shine); fd += x.d; sd += x.sh; });
      fill.setAttribute('d', fd); shine.setAttribute('d', sd); line.setAttribute('d', ld);
      line.setAttribute('stroke-width', f(2.2 * big * (o.head ?? 10.5) / 10.5));
    };
  }

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.target._line) e.target._line.on = e.isIntersecting; }), { rootMargin: '100px' });
  const live = new Set();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function frame(now) { live.forEach(m => { if (!m.host.isConnected) { live.delete(m); io.unobserve(m.host); return; } if (m.on) m.draw(reduce ? 1.2 : now / 1000, now); }); requestAnimationFrame(frame); })(performance.now());

  function mount(host, o = {}) {
    if (host._line) { live.delete(host._line); host.innerHTML = ''; }
    const svg = el('svg', { viewBox: o.zoom ? '31 29 38 38' : '0 0 100 100', role: 'img', 'aria-label': o.label || 'Meridian', style: `display:block;width:100%;height:100%;overflow:${o.zoom ? 'hidden' : 'visible'}` });
    host.appendChild(svg);
    const m = { host, svg, o, st: { mood: o.mood || 'idle', hover: o.hover, eyeset: o.eyeset, work: o.work, done: o.done, eyes3d: o.eyes3d, grow: o.grow, follow: o.follow }, since: performance.now() / 1000, seed: Math.random() * 3, on: true };
    m.draw = mascot(m);
    m.draw(1.2, -1e9);
    host._line = m; live.add(m); io.observe(host);
    return m;
  }
  function set(host, st) {
    const m = host._line;
    if (st.mood && (st.mood !== m.st.mood || st.replay)) m.since = performance.now() / 1000;
    Object.assign(m.st, st);
  }
  return { mount, set };
})();
