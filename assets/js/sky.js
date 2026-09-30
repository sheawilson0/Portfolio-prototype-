/* The sky for sheawilson.uk. The page follows the sun where the visitor is: white while it's up, the eclipse
   after dark, and a slow fade through dusk and dawn rather than a switch. A sun travels along the horizon
   during the day, the ring leans cooler in winter and warmer in summer, and the favicon matches the page.
   The toggle clicks through Sky, Light and Dark. The sun only comes out with the time bar (tap the full stop).

   Runs in <head>, before first paint, so there's no flash of the wrong theme. Its styles are assets/css/sky.css.
   The /sky/ board is linked from the time bar everywhere except sheawilson.uk and vercel.app (add ?lab there).
   URL overrides: ?t=HH:MM freezes the clock, ?d=YYYY-MM-DD the date, ?bar opens the time bar,
   ?embed is a frame on the /sky/ board (add &sun to show the sun). */
(() => {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const liveHost = /(^|\.)sheawilson\.uk$|\.vercel\.app$/.test(location.hostname);
  const embed = params.has('embed');

  /* ───────── The looks ─────────
     Each is the sky at its fullest: page colour, ring colours (--p1…--p6 and the two pale fills), how bright
     the ring is, the glow above the horizon, and the sun. Day and Night are the site as it is today. */
  const BRAND = ['#ed1652', '#ff6a1a', '#ffb22c', '#43d9ff', '#8a3cff', '#3a17e0'];
  const LOOKS = {
    small:    { name: 'Small hours', bg: '#04050c', p: ['#5b2bff', '#3a17e0', '#43d9ff', '#2f67ff', '#7de8ff', '#8a3cff'], pa: '#16203a', pb: '#1f1938', glow: .6,  wash: '#0d1a45', wa: .35, sun: '#ff8a5c', sa: 0 },
    predawn:  { name: 'Before dawn', bg: '#080a1d', p: ['#3a17e0', '#5b2bff', '#8a3cff', '#2f67ff', '#c52bd6', '#43d9ff'], pa: '#1c2140', pb: '#2a1c3a', glow: .8,  wash: '#3a1f6e', wa: .5,  sun: '#ff7a8a', sa: .15 },
    firstlight: { name: 'First light', bg: '#d9a3bd', p: ['#ff6f9c', '#c77dff', '#ffa07a', '#8fb8ff', '#a58bff', '#ff9ec4'], pa: '#f3d6e4', pb: '#d9dcf6', glow: 1, wash: '#ff8fb0', wa: .55, sun: '#ff8a7a', sa: .5 },
    dawn:     { name: 'Dawn',        bg: '#f7ecf2', p: ['#ff6f9c', '#ffa07a', '#ffcf9e', '#8fb8ff', '#a58bff', '#ff9ec4'], pa: '#ffe2e8', pb: '#e2e8ff', glow: 1,   wash: '#ffb3c1', wa: .5,  sun: '#ff9a7a', sa: .95 },
    morning:  { name: 'Morning',     bg: '#ffffff', p: BRAND,                                                           pa: '#fde9cf', pb: '#e3ebff', glow: 1,   wash: '#e3efff', wa: .4,  sun: '#ffb86b', sa: .9 },
    day:      { name: 'Day',         bg: '#ffffff', p: BRAND,                                                           pa: '#fde9cf', pb: '#e3ebff', glow: 1,   wash: '#e6f0ff', wa: .3,  sun: '#ffc65c', sa: .85 },
    golden:   { name: 'Golden hour', bg: '#fef7f4', p: ['#ff6a1a', '#ffb22c', '#ffd76a', '#ff9448', '#ed1652', '#ffc24d'], pa: '#ffe0bd', pb: '#ffe8dd', glow: 1,   wash: '#ffc07a', wa: .55, sun: '#ff9a2e', sa: 1 },
    sunset:   { name: 'Sunset',      bg: '#f4dae1', p: ['#ff4f6d', '#ff6a1a', '#ffb22c', '#ff5f8f', '#c52bd6', '#ff8a3d'], pa: '#ffd2c4', pb: '#f5d0e6', glow: 1,   wash: '#ff7a4d', wa: .65, sun: '#ff5a3a', sa: 1 },
    afterglow: { name: 'Afterglow', bg: '#d98a9c', p: ['#ff4f6d', '#ff6a1a', '#ffb22c', '#ff5f8f', '#c52bd6', '#ff8a3d'], pa: '#ffc2b8', pb: '#e9b3d6', glow: 1, wash: '#ff6a4d', wa: .6,  sun: '#ff5a3a', sa: .7 },
    bluehour: { name: 'Blue hour',   bg: '#1d1a3e', p: ['#5b2bff', '#8a3cff', '#ff6f9c', '#2f67ff', '#c52bd6', '#43d9ff'], pa: '#2a2350', pb: '#3a2448', glow: .9,  wash: '#6a3f8e', wa: .5,  sun: '#ff7a8a', sa: .25 },
    lastlight: { name: 'Last light', bg: '#3b2040', p: ['#ff4f6d', '#ff8a3d', '#ffb45c', '#c52bd6', '#ff5f8f', '#8a3cff'], pa: '#4a2418', pb: '#3a1830', glow: 1,   wash: '#ff5a4d', wa: .5,  sun: '#ff5a4d', sa: .4 },
    dusk:     { name: 'Dusk',        bg: '#110a1d', p: ['#ff4f6d', '#ff8a3d', '#d23bd6', '#5b2bff', '#3a17e0', '#a04bff'], pa: '#3d1f33', pb: '#1e1b44', glow: 1,   wash: '#6a2a6a', wa: .45, sun: '#ff5a4d', sa: 0 },
    night:    { name: 'Night',       bg: '#05070b', p: BRAND,                                                           pa: '#3a2a22', pb: '#1c2436', glow: .92, wash: '#0b1030', wa: .25, sun: '#ff8a5c', sa: 0 },
  };

  // The moment each look is at its fullest, from that day's sunrise R and sunset S (local minutes).
  // T is that day's civil twilight in minutes; the spacing below was tuned at T = 38 (Belfast, late September).
  function anchors(R, S, T) {
    // Light and dark meet in a few saturated minutes (blue hour and first light, afterglow and last light), never a grey.
    const out = [['predawn', R - 1.45 * T], ['bluehour', R - .68 * T], ['firstlight', R - .26 * T], ['dawn', R + .37 * T], ['morning', R + Math.max(90, 2 * T)],
      ['day', R + 160], ['day', S - 150], ['golden', S - 1.3 * T], ['sunset', S + 2], ['afterglow', S + .37 * T], ['lastlight', S + .68 * T],
      ['dusk', S + 1.3 * T], ['night', S + 3.2 * T]];
    const gap = wrap(R - 1.45 * T - (S + 3.2 * T)); // the dark between night falling and the sky starting to lift
    if (gap > 90) out.push(['night', S + 3.2 * T + gap * .3], ['small', S + 3.2 * T + gap * .6], ['small', R - 1.45 * T - 35]);
    return out.map(([k, m]) => [k, wrap(m)]).sort((a, b) => a[1] - b[1]);
  }

  /* ───────── Where the sun is ───────── */
  // Rough centres for common time zones, so the sun is close without asking for the visitor's location.
  const PLACES = {
    'Europe/London': [53.5, -2.5], 'Europe/Dublin': [53.35, -6.26], 'Europe/Paris': [48.86, 2.35], 'Europe/Berlin': [52.52, 13.4],
    'Europe/Madrid': [40.42, -3.7], 'Europe/Rome': [41.9, 12.5], 'Europe/Amsterdam': [52.37, 4.9], 'Europe/Stockholm': [59.33, 18.07],
    'Europe/Lisbon': [38.72, -9.14], 'Europe/Warsaw': [52.23, 21.01], 'America/New_York': [40.71, -74], 'America/Chicago': [41.88, -87.63],
    'America/Denver': [39.74, -104.99], 'America/Los_Angeles': [34.05, -118.24], 'America/Toronto': [43.65, -79.38], 'America/Vancouver': [49.28, -123.12],
    'America/Sao_Paulo': [-23.55, -46.63], 'Asia/Tokyo': [35.68, 139.69], 'Asia/Singapore': [1.35, 103.82], 'Asia/Dubai': [25.2, 55.27],
    'Asia/Kolkata': [19.08, 72.88], 'Asia/Shanghai': [31.23, 121.47], 'Australia/Sydney': [-33.87, 151.21], 'Australia/Melbourne': [-37.81, 144.96],
    'Pacific/Auckland': [-36.85, 174.76], 'Africa/Johannesburg': [-26.2, 28.05],
  };
  // Asking the browser for its time zone name costs about 7 ms the first time, too much before first paint.
  // So the first paint uses the place saved last visit, or a guess from the UTC offset, and the name is looked
  // up once the page is idle (a repaint follows only if the place turns out different).
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
  const std = Math.max(new Date(2026, 0, 1).getTimezoneOffset(), new Date(2026, 6, 1).getTimezoneOffset());
  let LAT = 50, LON = -std / 4;
  try { const c = JSON.parse(localStorage.getItem('sky-place') || 'null'); if (c && c.std === std) { LAT = c.lat; LON = c.lon; } } catch (e) {}
  idle(() => {
    const [lat, lon] = PLACES[Intl.DateTimeFormat().resolvedOptions().timeZone] || [LAT === 50 ? 45 : LAT, -std / 4];
    try { localStorage.setItem('sky-place', JSON.stringify({ std, lat, lon })); } catch (e) {}
    if (lat === LAT && lon === LON) return;
    LAT = lat; LON = lon;
    SUNS.clear(); ANCHORS.clear(); SEASON_BY_DATE.clear();
    paint(true);
  });

  // The clock is the visitor's own, so the browser's local time is enough (no Intl formatting, which is slow).
  const pad = (v) => String(v).padStart(2, '0');
  const wall = (ms) => {
    const d = new Date(ms);
    return { min: d.getHours() * 60 + d.getMinutes(), ymd: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` };
  };

  // Sunrise and sunset from the sunrise equation, as local minutes. Worked out once per date.
  const rad = Math.PI / 180;
  const SUNS = new Map();
  function sun(ymd) {
    if (!SUNS.has(ymd)) SUNS.set(ymd, sunFor(ymd));
    return SUNS.get(ymd);
  }
  function sunFor(ymd) {
    const [y, m, d] = ymd.split('-').map(Number);
    const n = Math.ceil(Date.UTC(y, m - 1, d, 12) / 864e5 + 2440587.5 - 2451545 + .0008);
    const J = n - LON / 360;
    const M = (357.5291 + .98560028 * J) % 360;
    const C = 1.9148 * Math.sin(M * rad) + .02 * Math.sin(2 * M * rad) + .0003 * Math.sin(3 * M * rad);
    const L = (M + C + 180 + 102.9372) % 360;
    const transit = 2451545 + J + .0053 * Math.sin(M * rad) - .0069 * Math.sin(2 * L * rad);
    const dec = Math.asin(Math.sin(L * rad) * Math.sin(23.44 * rad));
    const cosW = (Math.sin(-.833 * rad) - Math.sin(LAT * rad) * Math.sin(dec)) / (Math.cos(LAT * rad) * Math.cos(dec));
    const w = Math.acos(Math.max(-1, Math.min(1, cosW))) / rad;
    // Civil twilight (the sun 6° below the horizon) sets how long dusk and dawn last where the visitor is:
    // about 40 minutes in Belfast in autumn, an hour at midsummer, 20-odd near the equator.
    const cos6 = (Math.sin(-6 * rad) - Math.sin(LAT * rad) * Math.sin(dec)) / (Math.cos(LAT * rad) * Math.cos(dec));
    const w6 = Math.acos(Math.max(-1, Math.min(1, cos6))) / rad;
    const local = (jd) => wall((jd - 2440587.5) * 864e5).min;
    return { rise: local(transit - w / 360), set: local(transit + w / 360), tw: Math.max(20, Math.min(90, (w6 - w) * 4)) };
  }

  /* ───────── The season ─────────
     A colour that drifts round the year (ice at midwinter, blossom in spring, gold at midsummer, ember in
     autumn) and leans into half the ring, so the site in December isn't the site in June. */
  const SEASONS = [['Winter', '#5fb4ff'], ['Spring', '#ff8fc7'], ['Summer', '#ffb22c'], ['Autumn', '#ff6a1a']];
  const SEASON_BY_DATE = new Map();
  function season(ymd) {
    if (!SEASON_BY_DATE.has(ymd)) SEASON_BY_DATE.set(ymd, seasonFor(ymd));
    return SEASON_BY_DATE.get(ymd);
  }
  function seasonFor(ymd) {
    const [y, m, d] = ymd.split('-').map(Number);
    const doy = (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 864e5;
    let q = wrap((doy + 11) / 365.25 * 1440) / 360; // 0 at midwinter, 1 at the spring equinox…
    if (LAT < 0) q = (q + 2) % 4; // the southern hemisphere has its summer in December
    const i = Math.floor(q), t = q - i;
    return { name: SEASONS[Math.round(q) % 4][0], tint: mix(SEASONS[i % 4][1], SEASONS[(i + 1) % 4][1], t) };
  }

  /* ───────── Working out the sky ───────── */
  const hm = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); };
  const toHM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const wrap = (m) => ((m % 1440) + 1440) % 1440;
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  const smooth = (t) => t * t * (3 - 2 * t);
  const lum = (h) => hex(h).map((v) => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0);

  let frozen = params.get('t'), frozenDate = params.get('d');
  function now() {
    const w = wall(Date.now());
    const ymd = frozenDate || w.ymd;
    return { min: frozen ? hm(frozen) : w.min, ymd, ...sun(ymd) };
  }

  const ANCHORS = new Map();
  function lookAt(min, ymd) {
    const { rise: R, set: S, tw } = sun(ymd);
    if (!ANCHORS.has(ymd)) ANCHORS.set(ymd, anchors(R, S, tw));
    const list = ANCHORS.get(ymd);
    let i = list.findIndex((a) => a[1] > min);
    if (i === -1) i = 0;
    const [bk, bm] = list[i], [ak, am] = list[(i - 1 + list.length) % list.length];
    const t = smooth(wrap(min - am) / (wrap(bm - am) || 1));
    const A = LOOKS[ak], B = LOOKS[bk];
    const s = season(ymd);
    const bg = mix(A.bg, B.bg, t);
    // The sun walks the rim of the disc from the left at sunrise to the right at sunset.
    const dayFrac = (wrap(min - R) <= wrap(S - R) + 60 ? wrap(min - R) : wrap(min - R) - 1440) / (wrap(S - R) || 1);
    return {
      key: t < .5 ? ak : bk, name: (t < .5 ? A : B).name,
      bg, theme: lum(bg) < .18 ? 'dark' : 'light', // where black and white text read equally well
      p: A.p.map((c, j) => mix(mix(c, B.p[j], t), s.tint, j % 2 ? .38 : .12)),
      pa: mix(A.pa, B.pa, t), pb: mix(A.pb, B.pb, t), glow: A.glow + (B.glow - A.glow) * t,
      wash: mix(A.wash, B.wash, t), wa: A.wa + (B.wa - A.wa) * t,
      sun: mix(mix(A.sun, B.sun, t), s.tint, .15), sa: A.sa + (B.sa - A.sa) * t, angle: Math.max(-72, Math.min(72, -52 + 104 * dayFrac)),
      season: s.name, rise: R, set: S,
    };
  }

  // The next time the page crosses between light and dark, in minutes from now.
  function nextCross(n) {
    const start = lookAt(n.min, n.ymd).theme;
    for (let step = 5; step <= 1440; step += 5) if (lookAt(wrap(n.min + step), n.ymd).theme !== start) return step;
    return 1440;
  }

  /* ───────── Modes ─────────
     Sky (the default), Light or Dark. The toggle clicks through them, always changing what you see first:
     from Sky it goes to the opposite of what's showing, then the other fixed theme, then back to Sky. */
  let mode = 'sky';
  try { const m = localStorage.getItem('sky-mode'); if (m === 'light' || m === 'dark') mode = m; } catch (e) {}
  let barOpen = false; // the time bar always shows the sky
  const effective = () => (barOpen ? 'sky' : mode);

  /* ───────── Painting ───────── */
  const VARS = ['--p1', '--p2', '--p3', '--p4', '--p5', '--p6', '--pale-a', '--pale-b', '--bg', '--sky-glow', '--wash', '--wash-a', '--sun-c', '--sun-a', '--sun-x', '--sun-y', '--moon-x'];
  let last = null;

  // Only the values that changed are written, and a paint in the same minute with nothing new does nothing,
  // so the 10-second tick costs next to nothing between changes.
  const written = new Map();
  const set = (k, v) => { if (written.get(k) !== v) { written.set(k, v); root.style.setProperty(k, v); } };
  const unset = () => { VARS.forEach((v) => root.style.removeProperty(v)); written.clear(); };
  let paintKey = '';
  function paint(force) {
    const n = now();
    const m = effective();
    const key = `${n.min}|${n.ymd}|${m}|${barOpen}`;
    if (key === paintKey && !force) return;
    paintKey = key;
    const L = lookAt(n.min, n.ymd);
    const theme = m === 'sky' ? L.theme : m;
    root.dataset.mode = m;
    if (m !== 'sky') {
      // A fixed theme is the site as it's drawn today.
      unset();
      root.dataset.sky = 'fixed';
    } else {
      if (root.dataset.sky !== L.key) root.dataset.sky = L.key;
      L.p.forEach((c, i) => set(`--p${i + 1}`, c));
      set('--pale-a', L.pa); set('--pale-b', L.pb); set('--bg', L.bg); set('--sky-glow', L.glow.toFixed(3));
      set('--wash', L.wash); set('--wash-a', L.wa.toFixed(3)); set('--sun-c', L.sun); set('--sun-a', L.sa.toFixed(3));
      // On the ring's box (the disc plus 9% each side), the rim sits 42.4% out from the centre.
      set('--sun-x', `${(50 + 42.4 * Math.sin(L.angle * rad)).toFixed(2)}%`);
      set('--sun-y', `${(50 - 42.4 * Math.cos(L.angle * rad)).toFixed(2)}%`);
      // The toggle's moon covers as much of its disc as the sky is dark, so twilight shows a crescent.
      const dark = Math.max(0, Math.min(1, (.62 - lum(L.bg)) / .6));
      set('--moon-x', `${(-115 * (1 - dark)).toFixed(1)}%`);
    }
    if (theme === 'dark') { if (root.dataset.theme !== 'dark') root.dataset.theme = 'dark'; } else delete root.dataset.theme;
    const meta = document.querySelector('meta[name="theme-color"]'), metaC = m === 'sky' ? L.bg : theme === 'dark' ? '#05070b' : '#ffffff';
    if (meta && meta.content !== metaC) meta.setAttribute('content', metaC);
    last = { n, L, theme, mode: m };
    favicon();
    decorate();
    syncBar();
    report();
  }

  /* ───────── The page's extra pieces ───────── */
  function decorate() {
    const hero = document.querySelector('.hero'), eclipse = hero?.querySelector('.eclipse');
    if (eclipse && !eclipse.querySelector('.sun')) {
      const sunEl = document.createElement('div'); sunEl.className = 'sun';
      eclipse.querySelector('.corona').after(sunEl);
      const wash = document.createElement('div'); wash.className = 'sky-wash'; wash.setAttribute('aria-hidden', 'true');
      hero.prepend(wash);
      // The easter egg: the headline's full stop is a little sun. Tap it and the time bar opens.
      const em = hero.querySelector('h1 em');
      if (em && em.lastChild?.nodeType === 3 && em.lastChild.data.endsWith('.')) {
        em.lastChild.data = em.lastChild.data.slice(0, -1);
        const dot = document.createElement('span');
        dot.className = 'sky-dot'; dot.textContent = '.'; dot.tabIndex = 0;
        dot.setAttribute('role', 'button'); dot.setAttribute('aria-label', 'Play with the time of day');
        dot.addEventListener('click', () => openBar());
        dot.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBar(); } });
        em.append(dot);
      }
    }
    const foot = document.querySelector('footer nav');
    if (foot && !foot.querySelector('.sky-open')) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'sky-open'; b.textContent = 'Change the time of day';
      b.addEventListener('click', () => openBar());
      foot.prepend(b);
    }
    const toggle = document.querySelector('.theme-toggle');
    if (toggle && last) {
      let hint = toggle.querySelector('.tt-hint');
      if (!hint) { hint = document.createElement('span'); hint.className = 'tt-hint'; hint.setAttribute('aria-hidden', 'true'); toggle.append(hint); }
      const next = nextMode();
      const label = next === 'sky' ? 'Follow the sun' : next === 'dark' ? 'Lights off' : 'Lights on';
      const pressed = String(last.theme === 'dark'), aria = next === 'sky' ? 'Follow the time of day' : `Switch to ${next} mode`, html = `<b>${label}</b>${hintLine}`;
      if (toggle.getAttribute('aria-pressed') !== pressed) toggle.setAttribute('aria-pressed', pressed);
      if (toggle.getAttribute('aria-label') !== aria) toggle.setAttribute('aria-label', aria);
      if (hint.innerHTML !== html) hint.innerHTML = html;
    }
  }
  const nextMode = () => {
    if (!last) return 'dark';
    const auto = lookAt(last.n.min, last.n.ymd).theme;
    if (last.mode === 'sky') return last.theme === 'dark' ? 'light' : 'dark';
    return last.mode === auto ? 'sky' : auto;
  };
  // The hint's second line: what's happening now. Worked out when the pointer arrives, not every paint.
  let hintLine = '';
  function refreshHint() {
    if (!last) return;
    if (last.mode === 'sky') {
      const at = wrap(last.n.min + nextCross(last.n));
      hintLine = `<small>Following the sun, ${last.theme === 'dark' ? 'light' : 'dark'} about ${fmt(Math.round(at / 5) * 5 % 1440)}</small>`;
    } else hintLine = `<small>Lights ${last.mode === 'dark' ? 'off' : 'on'} for now</small>`;
    decorate();
  }

  /* ───────── The switch ───────── */
  // A tactile light switch, made in Web Audio: a sharp snap and a low knock on the press, a lighter tick on the
  // release. Off sits a little lower than on; back to the sky is softer, with a small bright ring.
  let actx = null;
  function switchSound(kind) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const t0 = actx.currentTime + .005, out = actx.destination;
      const snap = (at, freq, gain, len) => {
        const buf = actx.createBuffer(1, Math.ceil(actx.sampleRate * len), actx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 4;
        const src = actx.createBufferSource(); src.buffer = buf;
        const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 1.2;
        const g = actx.createGain(); g.gain.value = gain;
        src.connect(bp).connect(g).connect(out); src.start(at);
      };
      const tone = (at, f0, f1, gain, len, type = 'sine') => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f1, at + len);
        g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + .003); g.gain.exponentialRampToValueAtTime(.0001, at + len);
        o.connect(g).connect(out); o.start(at); o.stop(at + len + .02);
      };
      const k = kind === 'dark' ? .82 : 1;
      const soft = kind === 'sky' ? .55 : 1;
      snap(t0, 3000 * k, .7 * soft, .016); tone(t0, 170 * k, 70, .32 * soft, .06);
      snap(t0 + .075, 4400 * k, .28 * soft, .01);
      if (kind === 'sky') {
        // The day going by: a soft breath of air that rises and falls with the sweep, and a small bright ring.
        tone(t0 + .02, 1568, 1480, .05, .5);
        const len = SWEEP / 1000, buf = actx.createBuffer(1, Math.ceil(actx.sampleRate * len), actx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = actx.createBufferSource(); src.buffer = buf;
        const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2;
        bp.frequency.setValueAtTime(380, t0); bp.frequency.exponentialRampToValueAtTime(2600, t0 + len * .5); bp.frequency.exponentialRampToValueAtTime(420, t0 + len);
        const g = actx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.09, t0 + len * .45); g.gain.linearRampToValueAtTime(0, t0 + len);
        src.connect(bp).connect(g).connect(out); src.start(t0);
      }
    } catch (e) {}
  }

  // Back to the sky: the page runs through a whole day in a few seconds and lands on now. The toggle's
  // moon crosses its disc as night comes and goes, and the ring spins once.
  const SWEEP = 3400;
  let sweepRaf = 0;
  function sweep() {
    const start = now().min, t0 = performance.now();
    root.classList.add('sky-sweep');
    const step = (t) => {
      // Sine easing: it leaves and arrives gently rather than snapping through the middle.
      const k = Math.min(1, (t - t0) / SWEEP), e = (1 - Math.cos(Math.PI * k)) / 2;
      frozen = k < 1 ? toHM(Math.floor(wrap(start + 1440 * e))) : null;
      paint();
      if (k < 1) sweepRaf = requestAnimationFrame(step); else endSweep();
    };
    sweepRaf = requestAnimationFrame(step);
  }
  function endSweep() {
    if (!root.classList.contains('sky-sweep')) return;
    cancelAnimationFrame(sweepRaf); frozen = null;
    root.classList.remove('sky-sweep');
    paint(true); refreshHint();
  }

  function setMode(next, e) {
    endSweep();
    const before = last?.theme;
    mode = next;
    try { next === 'sky' ? localStorage.removeItem('sky-mode') : localStorage.setItem('sky-mode', next); } catch (err) {}
    switchSound(next);
    const apply = () => { paint(true); refreshHint(); };
    if (next === 'sky' && !matchMedia('(prefers-reduced-motion: reduce)').matches) { sweep(); return; }
    const after = next === 'sky' ? lookAt(last.n.min, last.n.ymd).theme : next;
    const toggle = document.querySelector('.theme-toggle');
    if (e && toggle) {
      const r = toggle.getBoundingClientRect();
      root.style.setProperty('--vx', `${e.clientX || r.left + r.width / 2}px`);
      root.style.setProperty('--vy', `${e.clientY || r.top + r.height / 2}px`);
    }
    // The same soft umbra as before, whenever what you see actually flips.
    if (before === after || !document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); return; }
    root.classList.add('theme-switching');
    document.startViewTransition(apply).finished.finally(() => root.classList.remove('theme-switching'));
  }
  window.__skyToggle = (e) => { if (barOpen) closeBar(); setMode(nextMode(), e); };

  /* ───────── Favicon ───────── */
  // The eclipse, drawn in the page's colours: a white disc by day, dark after sunset, ring in the sky's colours.
  let favKey = '', favAt = 0, favTimer = 0, favLink = null, favReady = false;
  idle(() => { favReady = true; favicon(); });
  function favicon() {
    if (!favReady || !last) return;
    const L = last.L, fixed = last.mode !== 'sky';
    const key = fixed ? `fixed-${last.theme}` : `${L.bg}${L.p.join('')}`;
    if (key === favKey) return;
    const wait = 400 - (performance.now() - favAt);
    if (wait > 0) { clearTimeout(favTimer); favTimer = setTimeout(favicon, wait); return; }
    favKey = key; favAt = performance.now();
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const ring = fixed ? BRAND : L.p, disc = fixed ? (last.theme === 'dark' ? '#05070b' : '#ffffff') : L.bg;
    if (g.createConicGradient) {
      const cg = g.createConicGradient(-Math.PI / 2, 32, 32);
      [...ring, ring[0]].forEach((col, i) => cg.addColorStop(i / 6, col));
      g.fillStyle = cg;
    } else g.fillStyle = ring[0];
    g.beginPath(); g.arc(32, 32, 31, 0, Math.PI * 2); g.fill();
    // Soften the outside of the ring, like the corona on the page.
    g.globalCompositeOperation = 'destination-in';
    const soft = g.createRadialGradient(32, 32, 18, 32, 32, 32);
    soft.addColorStop(0, '#000'); soft.addColorStop(.55, '#000'); soft.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = soft; g.fillRect(0, 0, 64, 64);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = disc; g.beginPath(); g.arc(32, 32, 17, 0, Math.PI * 2); g.fill();
    if (lum(disc) > .5) { g.strokeStyle = 'rgba(10,10,10,.12)'; g.lineWidth = 1; g.stroke(); }
    if (!favLink) {
      document.querySelectorAll('link[rel~="icon"]').forEach((l) => l.remove());
      favLink = document.createElement('link'); favLink.rel = 'icon'; favLink.type = 'image/png';
      document.head.append(favLink);
    }
    favLink.href = c.toDataURL('image/png');
  }

  /* ───────── The time bar ─────────
     For visitors: opened from the full stop or the footer. Scrub or play the day, try a season, and the sun
     comes out to show where it is. Closing it goes back to now. */
  const fmt = (m) => { const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0'); return `${h % 12 || 12}:${mm}${h < 12 ? 'am' : 'pm'}`; };
  const SEASON_DAYS = [['12-21', 'Winter'], ['03-20', 'Spring'], ['06-21', 'Summer'], ['09-22', 'Autumn']];
  let bar = null, playing = 0;
  function buildBar() {
    bar = document.createElement('div');
    bar.className = 'sky-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Time of day');
    bar.innerHTML = `
      <div class="sb-time">
        <button type="button" class="sb-play" aria-label="Play the day"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4L10 6z" fill="currentColor"/></svg></button>
        <input type="range" min="0" max="1439" step="1" aria-label="Time of day">
        <button type="button" class="sb-now">Now</button>
        <button type="button" class="sb-close" aria-label="Close and go back to now"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="sb-row">
        <span class="sb-read"></span>
        <span class="sb-seasons">${SEASON_DAYS.map(([d, t]) => `<button type="button" data-d="${d}">${t}</button>`).join('')}</span>
        ${liveHost && !params.has('lab') ? '' : '<a class="sb-board" href="sky/">Compare times</a>'}
      </div>`;
    document.body.append(bar);
    bar.addEventListener('click', onBar);
    const range = bar.querySelector('input');
    range.addEventListener('input', () => { stopPlay(); frozen = toHM(+range.value); paint(); });
  }
  function openBar() {
    if (!bar) buildBar();
    if (barOpen) return;
    barOpen = true;
    root.classList.add('sun-on');
    bar.classList.add('is-open');
    paint(true);
    // Opening it plays the day straight away; touching the slider or pause stops it.
    play();
  }
  function closeBar() {
    if (!bar) return;
    stopPlay(); barOpen = false; frozen = null; frozenDate = null;
    root.classList.remove('sun-on');
    bar.classList.remove('is-open');
    paint(true);
  }
  const PLAY = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4L10 6z" fill="currentColor"/></svg>';
  const PAUSE = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor"/></svg>';
  const stopPlay = () => { cancelAnimationFrame(playing); playing = 0; const b = bar?.querySelector('.sb-play'); if (b) { b.innerHTML = PLAY; b.setAttribute('aria-label', 'Play the day'); } };
  function play() {
    if (playing) { stopPlay(); return; }
    let m = frozen ? hm(frozen) : now().min, prev = performance.now();
    const b = bar.querySelector('.sb-play'); b.innerHTML = PAUSE; b.setAttribute('aria-label', 'Pause');
    const tick = (t) => {
      m = wrap(m + (t - prev) / 1000 * 60); prev = t; // an hour a second: the whole day in 24 s
      frozen = toHM(Math.floor(m));
      paint();
      playing = requestAnimationFrame(tick);
    };
    playing = requestAnimationFrame(tick);
  }
  function onBar(e) {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('sb-play')) return play();
    if (b.classList.contains('sb-close')) return closeBar();
    if (b.classList.contains('sb-now')) { stopPlay(); frozen = null; frozenDate = null; }
    // A season sets the date to its solstice or equinox; pressing it again goes back to today.
    else if (b.dataset.d) { const d = `${new Date().getFullYear()}-${b.dataset.d}`; frozenDate = frozenDate === d ? null : d; }
    paint(true);
  }
  function syncBar() {
    if (!bar || !last) return;
    bar.querySelectorAll('[data-d]').forEach((b) => b.setAttribute('aria-pressed', String(!!frozenDate && frozenDate.slice(5) === b.dataset.d)));
    bar.querySelector('.sb-now').hidden = !frozen && !frozenDate;
    const { n, L } = last, range = bar.querySelector('input');
    if (document.activeElement !== range || playing) range.value = n.min;
    range.style.setProperty('--rise', `${n.rise / 14.4}%`);
    range.style.setProperty('--set', `${n.set / 14.4}%`);
    const read = bar.querySelector('.sb-read');
    if (!read.firstChild) read.innerHTML = '<b class="sb-clock"></b><span class="sb-name"></span>';
    read.firstChild.textContent = fmt(n.min);
    const name = read.lastChild;
    if (name.textContent !== L.name) { name.textContent = L.name; name.classList.remove('is-new'); void name.offsetWidth; name.classList.add('is-new'); }
  }
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && barOpen) closeBar(); });

  /* ───────── For the board at /sky/ ───────── */
  window.__sky = {
    sun: (d) => sun(d || wall(Date.now()).ymd),
    at: (min, d) => lookAt(wrap(Math.round(min)), d || wall(Date.now()).ymd),
  };
  function report() {
    if (!embed || parent === window || !last) return;
    parent.postMessage({ skyInfo: { id: params.get('embed'), name: last.L.name, min: last.n.min } }, location.origin);
  }
  addEventListener('message', (e) => {
    const m = e.data && e.data.sky;
    if (!m || e.origin !== location.origin) return;
    if ('t' in m) frozen = m.t;
    if ('d' in m) frozenDate = m.d;
    if (m.sun != null) root.classList.toggle('sun-on', !!m.sun);
    paint(true);
  });

  /* ───────── Go ───────── */
  if (embed && params.has('sun')) root.classList.add('sun-on');
  paint();
  document.addEventListener('DOMContentLoaded', () => {
    paint(true); // the same minute, but now the page's pieces exist
    if (params.has('bar')) openBar();
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    toggle.addEventListener('pointerenter', refreshHint);
    toggle.addEventListener('focus', refreshHint);
  });
  setInterval(() => { if (!frozen) paint(); }, 10000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !frozen) paint(); });
  // Nothing to repaint in a hidden tab.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') stopPlay(); });
})();
