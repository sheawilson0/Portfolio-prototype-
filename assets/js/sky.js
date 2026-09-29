/* The sky for sheawilson.uk. The page follows the sun where the visitor is: white while it's up, the eclipse
   after dark, and a slow fade through dusk and dawn rather than a switch. A sun travels along the horizon
   during the day, the ring leans cooler in winter and warmer in summer, and the favicon matches the page.
   The toggle still wins, until the sky next crosses between light and dark.

   Runs in <head>, before first paint, so there's no flash of the wrong theme.
   On sheawilson.uk and vercel.app it does nothing without ?lab or ?sky, so visitors see today's site.
   URL overrides: ?t=HH:MM freezes the clock, ?d=YYYY-MM-DD the date, ?embed hides the lab bar (the /sky/ board). */
(() => {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const liveHost = /(^|\.)sheawilson\.uk$|\.vercel\.app$/.test(location.hostname);
  if (liveHost && !params.has('lab') && !params.has('sky')) return;
  const embed = params.has('embed');
  const showLab = !embed;
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL('../css/sky.css', document.currentScript.src).href;
  document.head.append(css);

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
  function anchors(R, S) {
    // Light and dark meet in a few saturated minutes (blue hour and first light, afterglow and last light), never a grey.
    const out = [['predawn', R - 55], ['bluehour', R - 26], ['firstlight', R - 10], ['dawn', R + 14], ['morning', R + 90], ['day', R + 160], ['day', S - 150],
      ['golden', S - 50], ['sunset', S + 2], ['afterglow', S + 14], ['lastlight', S + 26], ['dusk', S + 50], ['night', S + 120]];
    const gap = wrap(R - 55 - (S + 120)); // the dark between night falling and the sky starting to lift
    if (gap > 90) out.push(['night', S + 120 + gap * .3], ['small', S + 120 + gap * .6], ['small', R - 90]);
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
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [LAT, LON] = PLACES[tz] || [45, -new Date().getTimezoneOffset() / 4];

  const wall = (ms) => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(ms).map((p) => [p.type, p.value]));
    return { min: +parts.hour * 60 + +parts.minute, ymd: `${parts.year}-${parts.month}-${parts.day}` };
  };

  // Sunrise and sunset from the sunrise equation, as local minutes.
  const rad = Math.PI / 180;
  function sun(ymd) {
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
    const local = (jd) => wall((jd - 2440587.5) * 864e5).min;
    return { rise: local(transit - w / 360), set: local(transit + w / 360) };
  }

  /* ───────── The season ─────────
     A colour that drifts round the year (ice at midwinter, blossom in spring, gold at midsummer, ember in
     autumn) and leans into half the ring, so the site in December isn't the site in June. */
  const SEASONS = [['Winter', '#5fb4ff'], ['Spring', '#ff8fc7'], ['Summer', '#ffb22c'], ['Autumn', '#ff6a1a']];
  function season(ymd) {
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

  function lookAt(min, ymd) {
    const { rise: R, set: S } = sun(ymd);
    const list = anchors(R, S);
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
      key: t < .5 ? ak : bk, name: A.name === B.name || t < .15 ? A.name : t > .85 ? B.name : `${A.name} into ${B.name.toLowerCase()}`,
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
    for (let step = 2; step <= 1440; step += 2) if (lookAt(wrap(n.min + step), n.ymd).theme !== start) return step;
    return 1440;
  }

  /* ───────── Holding the toggle ───────── */
  // A press holds that theme until the sky next crosses over; a frozen lab clock holds only for that minute.
  let hold = null;
  try { hold = JSON.parse(localStorage.getItem('sky-hold') || 'null'); } catch (e) {}
  const heldTheme = () => hold && (frozen ? hold.at === frozen : !hold.at && hold.until > Date.now()) ? hold.theme : null;

  /* ───────── Painting ───────── */
  const VARS = ['--p1', '--p2', '--p3', '--p4', '--p5', '--p6', '--pale-a', '--pale-b', '--bg', '--sky-glow', '--wash', '--wash-a', '--sun-c', '--sun-a', '--sun-x', '--sun-y'];
  let last = null;

  function paint() {
    const n = now();
    const L = lookAt(n.min, n.ymd);
    const held = heldTheme();
    const theme = held || L.theme;
    if (held && held !== L.theme) {
      // Held against the sky: that theme as the site draws it today, no sun.
      VARS.forEach((v) => root.style.removeProperty(v));
      root.dataset.sky = 'held';
    } else {
      root.dataset.sky = L.key;
      const set = (k, v) => root.style.setProperty(k, v);
      L.p.forEach((c, i) => set(`--p${i + 1}`, c));
      set('--pale-a', L.pa); set('--pale-b', L.pb); set('--bg', L.bg); set('--sky-glow', L.glow.toFixed(3));
      set('--wash', L.wash); set('--wash-a', L.wa.toFixed(3)); set('--sun-c', L.sun); set('--sun-a', L.sa.toFixed(3));
      // On the ring's box (the disc plus 9% each side), the rim sits 42.4% out from the centre.
      set('--sun-x', `${(50 + 42.4 * Math.sin(L.angle * rad)).toFixed(2)}%`);
      set('--sun-y', `${(50 - 42.4 * Math.cos(L.angle * rad)).toFixed(2)}%`);
    }
    if (theme === 'dark') root.dataset.theme = 'dark'; else delete root.dataset.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', held && held !== L.theme ? (held === 'dark' ? '#05070b' : '#ffffff') : L.bg);
    last = { n, L, theme, held: !!held && held !== L.theme };
    favicon();
    decorate();
    syncLab();
    report();
  }

  /* ───────── The sun and the glow above the horizon ───────── */
  function decorate() {
    const hero = document.querySelector('.hero'), eclipse = hero?.querySelector('.eclipse');
    if (eclipse && !eclipse.querySelector('.sun')) {
      const sunEl = document.createElement('div'); sunEl.className = 'sun';
      eclipse.querySelector('.corona').after(sunEl);
      const wash = document.createElement('div'); wash.className = 'sky-wash'; wash.setAttribute('aria-hidden', 'true');
      hero.prepend(wash);
    }
    const toggle = document.querySelector('.theme-toggle');
    if (toggle && last) {
      let hint = toggle.querySelector('.tt-hint');
      if (!hint) { hint = document.createElement('span'); hint.className = 'tt-hint'; hint.setAttribute('aria-hidden', 'true'); toggle.append(hint); }
      toggle.setAttribute('aria-pressed', String(last.theme === 'dark'));
      toggle.setAttribute('aria-label', last.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      hint.innerHTML = `<b>${last.theme === 'dark' ? 'Lights on' : 'Lights off'}</b>${hintLine}`;
    }
  }
  // The second line says the page follows the sun. Worked out when the pointer arrives, not every paint.
  let hintLine = '';
  function refreshHint() {
    if (!last) return;
    if (last.held) { hintLine = '<small>Back to the sky at the next change</small>'; decorate(); return; }
    const at = wrap(last.n.min + nextCross(last.n));
    hintLine = `<small>${last.theme === 'dark' ? 'Light again' : 'Goes dark'} about ${fmt(Math.round(at / 5) * 5 % 1440)}</small>`;
    decorate();
  }

  /* ───────── Favicon ───────── */
  // The eclipse, drawn in the page's colours: a white disc by day, dark after sunset, ring in the sky's colours.
  let favKey = '', favAt = 0, favTimer = 0, favLink = null;
  function favicon() {
    const L = last?.L, key = last?.held ? `held-${last.theme}` : `${L.bg}${L.p.join('')}`;
    if (key === favKey) return;
    const wait = 400 - (performance.now() - favAt);
    if (wait > 0) { clearTimeout(favTimer); favTimer = setTimeout(favicon, wait); return; }
    favKey = key; favAt = performance.now();
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const ring = last.held ? BRAND : L.p, disc = last.held ? (last.theme === 'dark' ? '#05070b' : '#ffffff') : L.bg;
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

  /* ───────── Lab bar ───────── */
  const fmt = (m) => { const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0'); return `${h % 12 || 12}:${mm}${h < 12 ? 'am' : 'pm'}`; };
  const DATES = [['', 'Today'], ['12-21', 'Winter'], ['03-20', 'Spring'], ['06-21', 'Summer'], ['09-22', 'Autumn']];
  let lab = null, playing = 0;
  function buildLab() {
    lab = document.createElement('div');
    lab.className = 'sky-lab';
    lab.setAttribute('role', 'toolbar');
    lab.setAttribute('aria-label', 'Sky lab');
    lab.innerHTML = `
      <div class="sl-time">
        <button type="button" class="sl-play" aria-label="Play the day">▶</button>
        <input type="range" min="0" max="1439" step="1" aria-label="Time of day">
        <span class="sl-read"></span>
      </div>
      <div class="sl-row">${DATES.map(([d, t]) => `<button type="button" data-d="${d}">${t}</button>`).join('')}
        <button type="button" class="sl-now">Now</button><a class="sl-board" href="sky/">Compare times →</a></div>`;
    document.body.append(lab);
    lab.addEventListener('click', onLab);
    const range = lab.querySelector('input');
    range.addEventListener('input', () => { stopPlay(); frozen = toHM(+range.value); paint(); });
    syncLab();
  }
  const stopPlay = () => { cancelAnimationFrame(playing); playing = 0; lab?.querySelector('.sl-play')?.replaceChildren('▶'); };
  function play() {
    if (playing) { stopPlay(); return; }
    let m = frozen ? hm(frozen) : now().min, prev = performance.now();
    lab.querySelector('.sl-play').replaceChildren('❚❚');
    const tick = (t) => {
      m = wrap(m + (t - prev) / 1000 * 60); prev = t; // an hour a second: the whole day in 24 s
      frozen = toHM(Math.floor(m));
      paint();
      playing = requestAnimationFrame(tick);
    };
    playing = requestAnimationFrame(tick);
  }
  function onLab(e) {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('sl-play')) return play();
    if (b.classList.contains('sl-now')) { stopPlay(); frozen = null; frozenDate = null; }
    else if ('d' in b.dataset) frozenDate = b.dataset.d ? `${new Date().getFullYear()}-${b.dataset.d}` : null;
    paint();
  }
  function syncLab() {
    if (!lab || !last) return;
    lab.querySelectorAll('[data-d]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.d || '') === (frozenDate ? frozenDate.slice(5) : ''))));
    const { n, L } = last, range = lab.querySelector('input');
    if (document.activeElement !== range) range.value = n.min;
    range.style.setProperty('--rise', `${n.rise / 14.4}%`);
    range.style.setProperty('--set', `${n.set / 14.4}%`);
    lab.querySelector('.sl-read').innerHTML = `<em><b>${fmt(n.min)}</b> ${last.held ? `${last.theme === 'dark' ? 'Dark' : 'Light'}, held` : L.name}</em><span>${L.season} · sun ${fmt(n.rise)}–${fmt(n.set)}</span>`;
  }

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
    paint();
  });

  /* ───────── Go ───────── */
  paint();
  document.addEventListener('DOMContentLoaded', () => {
    if (showLab) buildLab();
    paint();
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    toggle.addEventListener('pointerenter', refreshHint);
    toggle.addEventListener('focus', refreshHint);
    // Capture runs before site.js flips the theme, so `last.theme` is the one being left.
    toggle.addEventListener('click', () => {
      if (!last) return;
      const chosen = last.theme === 'dark' ? 'light' : 'dark';
      const auto = lookAt(last.n.min, last.n.ymd).theme;
      if (chosen === auto) hold = null;
      else hold = frozen ? { theme: chosen, at: frozen } : { theme: chosen, until: Date.now() + nextCross(last.n) * 60000 };
      if (!frozen) try { hold ? localStorage.setItem('sky-hold', JSON.stringify(hold)) : localStorage.removeItem('sky-hold'); } catch (err) {}
      // site.js applies the theme inside a view transition; paint once it has.
      setTimeout(() => { paint(); refreshHint(); }, 60);
    }, true);
  });
  setInterval(() => { if (!frozen) paint(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !frozen) paint(); });
})();
