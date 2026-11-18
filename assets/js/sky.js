/* The sky for sheawilson.uk. The page follows the sun where the visitor is: white while it's up, the eclipse
   after dark, and a slow fade through dusk and dawn rather than a switch. A sun travels along the horizon
   during the day, the ring leans cooler in winter and warmer in summer, and the favicon is a square of the same sky.
   The nav's sky button opens the time bar (Light, Dark, Live and the day to drag). The sun only comes out with it.

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
  // Resolve the visitor's place before painting, including their first visit. Deferring
  // this lookup could show an offset-based dawn briefly before the real local sky.
  const idle = (f) => {
    const queue = () => (window.requestIdleCallback || ((cb) => setTimeout(cb, 200)))(f);
    if (document.readyState === 'complete') queue();
    else addEventListener('load', queue, { once: true });
  };
  const std = Math.max(new Date(2026, 0, 1).getTimezoneOffset(), new Date(2026, 6, 1).getTimezoneOffset());
  let LAT = 50, LON = -std / 4;
  try { const c = JSON.parse(localStorage.getItem('sky-place') || 'null'); if (c && c.std === std) { LAT = c.lat; LON = c.lon; } } catch (e) {}
  try {
    [LAT, LON] = PLACES[Intl.DateTimeFormat().resolvedOptions().timeZone] || [LAT === 50 ? 45 : LAT, -std / 4];
  } catch (e) {}
  idle(() => {
    try { localStorage.setItem('sky-place', JSON.stringify({ std, lat: LAT, lon: LON })); } catch (e) {}
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
  // Reuse parsed colours during sunrise searches and the time-of-day sweep. Bound the cache
  // so a long-running tab cannot retain every interpolated colour it has ever displayed.
  const colours = new Map();
  const hex = (h) => {
    if (!colours.has(h)) {
      if (colours.size >= 2048) colours.clear();
      colours.set(h, [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
    }
    return colours.get(h);
  };
  const mix = (a, b, t) => {
    const A = hex(a), B = hex(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  const lum = (h) => hex(h).map((v) => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0);

  let frozen = params.get('t'), frozenDate = params.get('d');
  root.dataset.top = 'sky'; // project pages open under the homepage's sky
  function now() {
    const w = wall(Date.now());
    const ymd = frozenDate || w.ymd;
    return { min: frozen ? hm(frozen) : w.min, ymd, ...sun(ymd) };
  }

  const ANCHORS = new Map();
  const DAYLIGHT = root.hasAttribute('data-daylight');
  // A page marked data-daylight (/shipped/) keeps midday's colours, but is light or dark when every other page is.
  function lookAt(min, ymd) {
    if (!DAYLIGHT) return look(min, ymd);
    const { rise, set } = sun(ymd);
    return { ...look(Math.round((rise + set) / 2), ymd), theme: look(min, ymd).theme };
  }
  function look(min, ymd) {
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

  /* The sky over the Shipped street and the homepage, after Peng's: a tall gradient from the sky at the top to a
     warm horizon, with a glow where the sun is coming up or going down. It stays blue rather than plum at dusk.
     shipped.js paints it; project pages can wear its top (lab: Project page top). */
  const SKIES = {
    night:   { top: '#0a1631', mid: '#12264b', low: '#1c3159', glow: '#29407a', ga: .25 },
    predawn: { top: '#0f2655', mid: '#27457f', low: '#5d6593', glow: '#c98a8a', ga: .35 },
    dawn:    { top: '#4e7ccc', mid: '#98b1df', low: '#f5b386', glow: '#ff9f6b', ga: .75 },
    sunrise: { top: '#7aa4e2', mid: '#bccff0', low: '#fdd0a6', glow: '#ffbb85', ga: .55 },
    morning: { top: '#91b8e8', mid: '#c8d8ef', low: '#f8e5d3', glow: '#ffe1c2', ga: .2 },
    day:     { top: '#9ec0e9', mid: '#cdd9e9', low: '#f9ede2', glow: '#fff1e2', ga: 0 },
    golden:  { top: '#9fbbe4', mid: '#d6d5dd', low: '#fbdcbc', glow: '#ffc58a', ga: .35 },
    sunset:  { top: '#6886c8', mid: '#b9b4cc', low: '#ffb47f', glow: '#ff9455', ga: .8 },
    dusk:    { top: '#1f3a6e', mid: '#3c5488', low: '#b97c64', glow: '#e08a5a', ga: .45 },
  };
  // mode: 'light' holds it at midday, 'dark' at night, anything else follows the minute.
  function street(min, ymd, mode) {
    if (mode === 'light') return { ...SKIES.day, dark: false };
    const { rise: R, set: S, tw: T } = sun(ymd);
    const A = [['night', R - 2.4 * T], ['predawn', R - 1.1 * T], ['dawn', R - .1 * T], ['sunrise', R + .7 * T], ['morning', R + 2.4 * T],
      ['day', (R + S) / 2], ['golden', S - 1.6 * T], ['sunset', S + .1 * T], ['dusk', S + 1.1 * T], ['night', S + 2.4 * T]];
    if (min < A[0][1]) min += 1440;
    const i = mode === 'dark' ? 0 : A.findIndex((a) => a[1] > min);
    if (i <= 0) return { ...SKIES.night, dark: true };
    const [ak, am] = A[i - 1], [bk, bm] = A[i], k = smooth((min - am) / (bm - am)), a = SKIES[ak], b = SKIES[bk];
    const midC = mix(a.mid, b.mid, k);
    // Words go light once the middle of the sky (where they sit) is darker than about a quarter.
    return { top: mix(a.top, b.top, k), mid: midC, low: mix(a.low, b.low, k), glow: mix(a.glow, b.glow, k), ga: a.ga + (b.ga - a.ga) * k, dark: lum(midC) < .26 };
  }


  /* ───────── Modes ─────────
     Sky (the default), Light or Dark. The toggle clicks through them, always changing what you see first:
     from Sky it goes to the opposite of what's showing, then the other fixed theme, then back to Sky. */
  let mode = 'sky';
  try { const m = localStorage.getItem('sky-mode'); if (m === 'light' || m === 'dark') mode = m; } catch (e) {}
  let barOpen = false;
  const effective = () => mode;

  /* ───────── Painting ───────── */
  const VARS = ['--p1', '--p2', '--p3', '--p4', '--p5', '--p6', '--pale-a', '--pale-b', '--bg', '--sky-glow', '--wash', '--wash-a', '--sun-c', '--sun-a', '--sun-x', '--sun-y', '--moon-x'];
  let last = null;

  // Only the values that changed are written, and a paint in the same minute with nothing new does nothing,
  // so the 10-second tick costs next to nothing between changes.
  const written = new Map();
  const pending = new Map();
  const set = (k, v) => { if (written.get(k) !== v) { written.set(k, v); pending.set(k, v); } };
  const unset = () => { VARS.forEach((v) => { if (written.has(v)) { written.delete(v); pending.set(v, ''); } }); };
  const flush = () => {
    if (!pending.size) return;
    // Build off-document, preserving properties owned by other scripts, then invalidate styles once.
    const style = document.createElement('span').style;
    style.cssText = root.style.cssText;
    pending.forEach((v, k) => v ? style.setProperty(k, v) : style.removeProperty(k));
    root.style.cssText = style.cssText;
    pending.clear();
  };
  let paintFrame = 0, forcePaint = false;
  function paint(force) {
    forcePaint ||= !!force;
    if (paintFrame) return;
    paintFrame = requestAnimationFrame(() => {
      paintFrame = 0;
      const force = forcePaint; forcePaint = false;
      paintNow(force);
    });
  }
  let paintKey = '';
  function paintNow(force) {
    const n = now();
    const m = effective();
    const key = `${n.min}|${n.ymd}|${m}|${barOpen}`;
    if (key === paintKey && !force) return;
    paintKey = key;
    const L = lookAt(n.min, n.ymd);
    const theme = m === 'sky' ? L.theme : m;
    if (root.dataset.mode !== m) root.dataset.mode = m;
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
    // Pages that open under the sky give the browser bar the sky's top colour, not the old plain white or black.
    const st = root.dataset.top === 'sky' ? street(n.min, n.ymd, m) : null;
    if (st) { set('--sky-top', st.top); set('--sky-mid', st.mid); set('--sky-low', st.low); set('--sky-sunglow', st.glow); set('--sky-ga', st.ga.toFixed(2)); }
    const meta = document.querySelector('meta[name="theme-color"]'), metaC = st ? st.top : m === 'sky' ? L.bg : theme === 'dark' ? '#05070b' : '#ffffff';
    if (meta && meta.content !== metaC && !DAYLIGHT) meta.setAttribute('content', metaC); // a daylight page paints its own
    flush();
    last = { n, L, theme, mode: m };
    favicon();
    decorate();
    syncBar();
    report();
    document.dispatchEvent(new Event('sky:paint')); // the street's sky (shipped.js) follows
  }

  /* ───────── The page's extra pieces ───────── */
  function decorate() {
    const hero = document.querySelector('.hero'), eclipse = hero?.querySelector('.eclipse');
    if (eclipse && !eclipse.querySelector('.sun')) {
      const sunEl = document.createElement('div'); sunEl.className = 'sun';
      eclipse.querySelector('.corona').after(sunEl);
      const wash = document.createElement('div'); wash.className = 'sky-wash'; wash.setAttribute('aria-hidden', 'true');
      hero.prepend(wash);
    }
    // The nav's sky button opens the time card. A tile of the sky as it is now (like the favicon): the sun arcs
    // across it from sunrise to sunset and the moon does the same through the night. The lab has two more looks
    // (data-button on <body>): the time on its own, or the time in a soft pill.
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      if (!toggle.querySelector('.sbt-tile')) toggle.innerHTML = `<span class="sbt-tile" aria-hidden="true"><i class="sbt-sun"></i><i class="sbt-moon"></i></span><span class="sbt-time" aria-hidden="true"></span>`;

      if (last) {
        const n = last.n, h = height(n.min, n), time = toggle.querySelector('.sbt-time'), t = fmt(n.min);
        if (time.textContent !== t) time.textContent = t;
        const arc = (k, from, to, up) => {
          const f = clamp(wrap(n.min - from) / (wrap(to - from) || 1), -.1, 1.1);
          toggle.style.setProperty(`--bt-${k}x`, `${(12 + 76 * f).toFixed(1)}%`);
          toggle.style.setProperty(`--bt-${k}y`, `${(84 - 58 * Math.max(0, up)).toFixed(1)}%`);
          toggle.style.setProperty(`--bt-${k}`, clamp((up + .08) / .12, 0, 1).toFixed(2));
        };
        if (h >= 0 || wrap(n.min - n.rise) < wrap(n.set - n.rise)) arc('s', n.rise, n.set, h); else toggle.style.setProperty('--bt-s', '0');
        if (h <= 0 || wrap(n.min - n.set) < wrap(n.rise - n.set)) arc('m', n.set, n.rise, -h); else toggle.style.setProperty('--bt-m', '0');
      }
      const open = String(barOpen);
      if (toggle.getAttribute('aria-label') !== 'Time of day') { toggle.setAttribute('aria-label', 'Time of day'); toggle.setAttribute('aria-haspopup', 'dialog'); toggle.removeAttribute('aria-pressed'); }
      if (toggle.getAttribute('aria-expanded') !== open) toggle.setAttribute('aria-expanded', open);
    }
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
    paint(true);
  }

  function setMode(next, e, quiet) {
    endSweep();
    const before = last?.theme;
    mode = next;
    try { next === 'sky' ? localStorage.removeItem('sky-mode') : localStorage.setItem('sky-mode', next); } catch (err) {}
    switchSound(next);
    const apply = () => paint(true);
    if (next === 'sky' && !quiet && !matchMedia('(prefers-reduced-motion: reduce)').matches) { sweep(); return; }
    const after = next === 'sky' ? lookAt(last.n.min, last.n.ymd).theme : next;
    // The umbra spreads from the middle of the sky button, however the switch happened (D, the card, a click).
    const btn = document.querySelector('.theme-toggle'), tile = btn?.querySelector('.sbt-tile'), from = tile?.getClientRects().length ? tile : btn;
    if (from?.getClientRects().length) {
      const r = from.getBoundingClientRect();
      root.style.setProperty('--vx', `${r.left + r.width / 2}px`);
      root.style.setProperty('--vy', `${r.top + r.height / 2}px`);
    }
    // The same soft umbra as before, whenever what you see actually flips.
    if (before === after || !document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); return; }
    root.classList.add('theme-switching');
    document.startViewTransition(apply).finished.finally(() => root.classList.remove('theme-switching'));
  }
  window.__skyToggle = () => toggleBar(); // site.js hands the nav's sky button to us
  // The theme button is hidden. D flips light and dark; Shift+D goes back to following the sky.
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key === 'd') setMode(root.dataset.theme === 'dark' ? 'light' : 'dark');
    else if (e.key === 'D') setMode('sky');
  });

  /* ───────── Favicon ───────── */
  // The eclipse, drawn in the page's colours: a white disc by day, dark after sunset, ring in the sky's colours.
  // The favicon is a square of the sky as it is right now, painted from the same colours as the page.
  let favKey = '', favLink = null, favReady = false;
  idle(() => { favReady = true; favicon(); });
  function favicon() {
    if (!favReady || !last) return;
    const k = street(last.n.min, last.n.ymd, last.mode), ga = k.ga.toFixed(2);
    const key = `${k.top}${k.mid}${k.low}${k.glow}${ga}`;
    if (key === favKey) return;
    favKey = key;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${k.top}"/><stop offset=".58" stop-color="${k.mid}"/><stop offset="1" stop-color="${k.low}"/></linearGradient><radialGradient id="b" cx=".5" cy="1.02" r=".62"><stop offset="0" stop-color="${k.glow}" stop-opacity="${ga}"/><stop offset="1" stop-color="${k.glow}" stop-opacity="0"/></radialGradient></defs><rect width="64" height="64" rx="14" fill="url(#a)"/><rect width="64" height="64" rx="14" fill="url(#b)"/></svg>`;
    if (!favLink) {
      document.querySelectorAll('link[rel~="icon"]').forEach((l) => l.remove());
      favLink = document.createElement('link'); favLink.rel = 'icon'; favLink.type = 'image/svg+xml';
      document.head.append(favLink);
    }
    favLink.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  /* ───────── The time bar ─────────
     After Peng's (pengzhe.ng). A small glass card that pours out of the nav's sky button like a genie and back into it,
     with Light, Dark and Live along the top and the day drawn underneath as the sun's path. Drag the sun, tap
     anywhere on the path, or tap the little Now dot to go back. The sun springs rather than jumps, the minutes
     roll, and every quarter hour the sun passes plays a music-box note that climbs as the sun rises.
     The path gives more room to sunrise and sunset, where the sky changes most, so they don't flash past.
     Closing it goes back to now. */
  const fmt = (m) => { const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0'); return `${h % 12 || 12}:${mm}${h < 12 ? 'am' : 'pm'}`; };
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const band = (a, b, v) => smooth(clamp((v - a) / (b - a), 0, 1));
  const snap = (m) => clamp(Math.round(m / 15) * 15, 0, 1439);
  const DH = 84, HZ = 54, UP = 30; // the dial's height, where the horizon sits, how far above it noon reaches
  let bar = null, inner = null, dialEl = null, svg = null, timeEl = null;
  // pos is where the sun is drawn (minutes, fractional), to is where it's heading; live means heading for now.
  const dial = { pos: 0, vel: 0, to: 0, live: true, drag: null, hp: null, raf: 0, t: 0, q: -1, key: '', xs: [], ys: [], lens: [] };

  // The sun's height through the day: 1 at noon, 0 on the horizon, -1 at midnight.
  function height(m, n) {
    const noon = (n.rise + n.set) / 2, half = Math.cos(Math.PI * (n.set - n.rise) / 1440), c = Math.cos(2 * Math.PI * (m - noon) / 1440);
    return c >= half ? (c - half) / (1 - half) : -(half - c) / (1 + half);
  }
  function buildBar() {
    bar = document.createElement('div');
    bar.className = 'sky-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Time of day');
    bar.innerHTML = `<div class="sb-in">
      <div class="sb-modes">
        <button type="button" data-m="light">Light</button><button type="button" data-m="dark">Dark</button>
        <button type="button" data-m="sky">Live<i class="sb-live" aria-hidden="true"></i></button>
      </div>
      <div class="sb-dial" role="slider" tabindex="0" aria-label="Time of day" aria-valuemin="0" aria-valuemax="1439">
        <svg aria-hidden="true"><path class="sb-hz"/><path class="sb-curve"/><path class="sb-lit"/><circle class="sb-nowdot" r="2.5"/><circle class="sb-sun" r="6"/></svg>
        <span class="sb-time" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
        <span class="sb-nowtag" aria-hidden="true">Now</span>
      </div></div>`;
    document.body.append(bar);
    inner = bar.firstElementChild; dialEl = bar.querySelector('.sb-dial'); svg = dialEl.firstElementChild; timeEl = bar.querySelector('.sb-time');
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      const m = b.dataset.m;
      if (m === 'sky') { if (mode !== 'sky') setMode('sky', null, true); unlock(); goLive(); return; }
      setMode(m);
      dial.live = true; frozen = null; frozenDate = null; dial.pos = dial.to = now().min; dial.vel = 0;
      paint(true);
    });
    const local = (e) => { const r = svg.getBoundingClientRect(); return { x: clamp(e.clientX - r.left, 0, r.width), y: e.clientY - r.top }; };
    const near = (p, m, r) => { const a = at(m); return Math.hypot(p.x - a.x, p.y - a.y) <= r; };
    const grabR = () => (matchMedia('(pointer: coarse)').matches ? 28 : 18);
    svg.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      unlock();
      const p = local(e), m = toMin(p.x);
      dial.hp = p;
      if (showNow() && near(p, nowMin(), 12) && !near(p, dial.pos, grabR())) { goLive(); return; }
      toSky();
      dial.live = false;
      const grab = near(p, dial.pos, grabR());
      dial.drag = { off: grab ? dial.pos - m : 0 };
      svg.setPointerCapture(e.pointerId);
      dial.to = grab ? dial.pos : snap(m);
      dialEl.classList.add('is-dragging');
      run();
    });
    svg.addEventListener('pointermove', (e) => {
      dial.hp = local(e);
      if (dial.drag) { dial.to = clamp(toMin(dial.hp.x) + dial.drag.off, 0, 1439); run(); } else renderDial();
    });
    const up = () => {
      if (!dial.drag) return;
      dial.drag = null; dial.to = snap(dial.to);
      dialEl.classList.remove('is-dragging');
      run();
    };
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    svg.addEventListener('pointerleave', () => { if (!dial.drag) { dial.hp = null; renderDial(); } });
    dialEl.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 15, ArrowUp: 15, ArrowLeft: -15, ArrowDown: -15, PageUp: 60, PageDown: -60 }[e.key];
      const to = e.key === 'Home' ? 0 : e.key === 'End' ? 1439 : step != null ? clamp(snap(dial.to) + step, 0, 1439) : null;
      if (to == null) return;
      e.preventDefault(); unlock(); toSky();
      dial.live = false; dial.to = to; run();
    });
  }
  // The card hangs under the nav's sky button and pours out of it. Pages without one get it at the bottom.
  const button = () => { const b = document.querySelector('.theme-toggle'); return b && b.getClientRects().length ? b : null; };
  function place() {
    const b = button(), W = bar.offsetWidth;
    if (b) {
      const r = b.getBoundingClientRect();
      bar.classList.remove('is-docked');
      bar.style.left = `${clamp(r.right + 6 - W, 12, innerWidth - W - 12)}px`;
      bar.style.top = `${r.bottom + 8}px`;
    } else { bar.classList.add('is-docked'); bar.style.left = bar.style.top = ''; }
  }
  function source() {
    const b = !bar.classList.contains('is-docked') && button();
    if (b) return b.getBoundingClientRect();
    return { left: innerWidth / 2 - 30, right: innerWidth / 2 + 30, width: 60, top: innerHeight + 20, bottom: innerHeight + 20 };
  }
  function openBar() {
    if (!bar) buildBar();
    if (barOpen) return;
    barOpen = true;
    root.classList.add('sun-on');
    bar.classList.add('is-open');
    place();
    if (!dial.raf) { dial.live = !frozen; dial.pos = dial.to = now().min; dial.vel = 0; }
    dial.key = '';
    paint(true); paintNow(true);
    genie(true);
  }
  function closeBar() {
    if (!bar || !barOpen) return;
    barOpen = false;
    root.classList.remove('sun-on');
    dial.drag = null; dial.hp = null;
    if (frozen || frozenDate) goLive(); // the sky glides back to now as the card pours away
    genie(false);
    decorate();
  }
  const toggleBar = () => (barOpen ? closeBar() : openBar());
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && barOpen) { closeBar(); button()?.focus({ preventScroll: true }); } });
  document.addEventListener('pointerdown', (e) => { if (barOpen && !bar.contains(e.target) && !e.target.closest?.('.theme-toggle')) closeBar(); }, true);
  addEventListener('resize', () => { if (barOpen) { place(); dial.key = ''; renderDial(); } });

  /* ── The path ── */
  // Each 5-minute step gets room for how much the sky changes in it, smoothed, on top of an even share.
  function shape(n, W) {
    const key = `${n.ymd}|${W}|${n.rise}|${n.set}`;
    if (dial.key === key) return;
    dial.key = key;
    const sky = (m) => { const k = street(wrap(m), n.ymd, 'sky'); return [k.top, k.mid, k.low].flatMap(hex); };
    const raw = [];
    let prev = sky(0);
    for (let i = 1; i <= 288; i++) { const c = sky(i * 5); raw.push(Math.hypot(...c.map((v, j) => v - prev[j]))); prev = c; }
    const mean = raw.reduce((a, v) => a + v, 0) / 288;
    const wts = raw.map((_, i) => {
      let s = 0, w = 0;
      for (let j = -10; j <= 10; j++) { const v = raw[i + j]; if (v == null) continue; const g = Math.exp(-j * j / 32); s += v * g; w += g; }
      return s / w + 2.5 * mean;
    });
    const total = wts.reduce((a, v) => a + v, 0);
    dial.xs = [0]; wts.forEach((v, i) => dial.xs.push(dial.xs[i] + v / total * W));
    // Above the horizon the true shape; below it the same slope, eased so the night never dips too deep.
    const noon = (n.rise + n.set) / 2, half = Math.cos(Math.PI * (n.set - n.rise) / 1440);
    dial.ys = dial.xs.map((_, i) => { const d = (Math.cos(2 * Math.PI * (i * 5 - noon) / 1440) - half) / (1 - half); return HZ - UP * (d < 0 ? d / (1 - d) : d); });
    dial.lens = [0];
    for (let i = 1; i <= 288; i++) dial.lens.push(dial.lens[i - 1] + Math.hypot(dial.xs[i] - dial.xs[i - 1], dial.ys[i] - dial.ys[i - 1]));
    svg.setAttribute('viewBox', `0 0 ${W} ${DH}`);
    const d = 'M' + dial.xs.map((x, i) => `${x.toFixed(1)} ${dial.ys[i].toFixed(1)}`).join('L');
    bar.querySelector('.sb-curve').setAttribute('d', d);
    bar.querySelector('.sb-lit').setAttribute('d', d);
    bar.querySelector('.sb-hz').setAttribute('d', `M0 ${HZ}H${W}`);
  }
  function at(m) {
    const i = clamp(m / 5, 0, 288), j = Math.min(287, Math.floor(i)), f = i - j, L = (a) => a[j] + (a[j + 1] - a[j]) * f;
    return { x: L(dial.xs), y: L(dial.ys), l: L(dial.lens) };
  }
  function toMin(x) {
    const xs = dial.xs;
    let j = 0;
    while (j < 287 && xs[j + 1] < x) j++;
    return clamp((j + (x - xs[j]) / ((xs[j + 1] - xs[j]) || 1)) * 5, 0, 1439);
  }
  const nowMin = () => wall(Date.now()).min;
  const showNow = () => !(dial.live && Math.abs(dial.pos - nowMin()) < 8);
  // Stroke only the given stretches of the path (a dash pattern that starts with an empty dash).
  const minus = (from, gaps) => gaps.reduce((out, [a, b]) => out.flatMap(([s, e]) => (b <= s || a >= e ? [[s, e]] : [[s, Math.min(e, a)], [Math.max(s, b), e]].filter(([x, y]) => y > x))), [from]);
  const dashes = (show, T) => { const out = [0]; let p = 0; show.forEach(([s, e]) => { s = clamp(s, p, T); e = clamp(e, s, T); out.push((s - p).toFixed(1), (e - s).toFixed(1)); p = e; }); out.push(T + 50); return out.join(' '); };

  function renderDial() {
    if (!bar || !last || !bar.classList.contains('is-open')) return;
    const W = svg.clientWidth;
    if (!W) return;
    const n = last.n;
    shape(n, W);
    const T = dial.lens[288], P = at(dial.pos), nm = nowMin(), Q = at(nm), hp = dial.hp;
    const sunEl = svg.querySelector('.sb-sun'), nowEl = svg.querySelector('.sb-nowdot'), tag = bar.querySelector('.sb-nowtag');
    sunEl.setAttribute('cx', P.x.toFixed(2)); sunEl.setAttribute('cy', P.y.toFixed(2));
    const seeNow = showNow();
    nowEl.setAttribute('cx', Q.x.toFixed(2)); nowEl.setAttribute('cy', Q.y.toFixed(2));
    nowEl.style.opacity = seeNow ? '' : '0';
    // The path breaks around the sun and the Now dot, like Peng's.
    const gaps = [[P.l - 10, P.l + 10]];
    if (seeNow) gaps.push([Q.l - 5.5, Q.l + 5.5]);
    gaps.sort((a, b) => a[0] - b[0]);
    bar.querySelector('.sb-curve').setAttribute('stroke-dasharray', dashes(minus([0, T], gaps), T));
    const coarse = matchMedia('(pointer: coarse)').matches;
    const onSun = !!hp && Math.hypot(hp.x - P.x, hp.y - P.y) <= (coarse ? 28 : 18);
    const onNow = !!hp && seeNow && !onSun && Math.hypot(hp.x - Q.x, hp.y - Q.y) <= 12;
    dialEl.classList.toggle('is-grab', onSun || !!dial.drag);
    dialEl.classList.toggle('on-now', onNow);
    // Under the pointer, the path darkens a little, so you can see where a tap will land.
    dialEl.classList.toggle('is-near', !!hp && !onNow);
    if (hp) { const l = at(toMin(hp.x)).l; bar.querySelector('.sb-lit').setAttribute('stroke-dasharray', dashes(minus([l - 22, l + 22], gaps), T)); }
    tag.style.translate = `${Q.x.toFixed(1)}px ${(Q.y - 24).toFixed(1)}px`;
    // The time rides above the sun, kept inside the card.
    const shown = dial.live && !dial.raf ? n.min : dial.drag ? snap(dial.pos) : Math.round(clamp(dial.pos, 0, 1439));
    setTime(shown);
    const tw = timeEl.offsetWidth;
    timeEl.style.translate = `${clamp(P.x - tw / 2, -6, W - tw + 6).toFixed(1)}px ${(P.y - 28).toFixed(1)}px`;
    if (dialEl.getAttribute('aria-valuenow') !== String(shown)) { dialEl.setAttribute('aria-valuenow', shown); dialEl.setAttribute('aria-valuetext', fmt(shown)); }
  }
  // Each part of the time rolls on its own, up when the day goes forward, faster when changes come quickly.
  function setTime(m) {
    const parts = /^(\d+:)(\d)(\d)(\D+)$/.exec(fmt(m)).slice(1);
    const prevM = timeEl._m ?? m, t = performance.now(), dur = clamp(t - (timeEl._t || 0), 140, 420);
    if (prevM === m && timeEl.children[0].dataset.v) return;
    timeEl._m = m; timeEl._t = t;
    const dir = Math.sign(m - prevM);
    parts.forEach((txt, i) => roll(timeEl.children[i], txt, dir, dur));
  }
  function roll(el, txt, dir, dur) {
    if (el.dataset.v === txt) return;
    const was = el.dataset.v;
    el.dataset.v = txt;
    if (!dir || was == null || calm()) { el.innerHTML = ''; const i = document.createElement('i'); i.textContent = txt; el.append(i); return; }
    [...el.children].slice(0, -1).forEach((x) => x.remove());
    const out = el.lastElementChild, inn = document.createElement('i');
    inn.textContent = txt; el.append(inn);
    const y = dir * .6, o = { duration: dur, easing: 'cubic-bezier(.2, .7, .2, 1)' }, blur = `blur(${dur < 200 ? 2 : 1.2}px)`;
    out?.animate([{ transform: 'none', filter: 'blur(0)', opacity: 1 }, { transform: `translateY(${-y}em)`, filter: blur, opacity: 0 }], { ...o, fill: 'forwards' }).finished.then(() => out.remove(), () => {});
    inn.animate([{ transform: `translateY(${y}em)`, filter: blur, opacity: 0 }, { transform: 'none', filter: 'blur(0)', opacity: 1 }], o);
  }

  /* ── The sun's movement ── */
  // A spring: stiff and without overshoot while you drag, softer with a little settle when it glides somewhere.
  function run() { if (!dial.raf) { dial.t = performance.now(); dial.raf = requestAnimationFrame(step); } }
  function step(t) {
    dial.raf = 0;
    const dt = Math.min(1 / 30, (t - dial.t) / 1000); dial.t = t;
    if (dial.live) dial.to = nowMin();
    if (calm()) { dial.pos = dial.to; dial.vel = 0; }
    const K = dial.drag ? 900 : 190, C = dial.drag ? 60 : 22;
    dial.vel += (K * (dial.to - dial.pos) - C * dial.vel) * dt;
    dial.pos += dial.vel * dt;
    if (dial.pos < 0 || dial.pos > 1439) { dial.pos = clamp(dial.pos, 0, 1439); dial.vel = 0; }
    const moving = !!dial.drag || Math.abs(dial.to - dial.pos) > .05 || Math.abs(dial.vel) > .5;
    if (moving) {
      frozen = toHM(Math.round(dial.pos));
      const q = Math.floor(dial.pos / 15);
      const crossed = q !== dial.q && dial.q >= 0;
      if (crossed) tap();
      dial.q = q;
      if (last) daySound(height(dial.pos, last.n), Math.abs(dial.vel), crossed ? q : null);
    } else {
      dial.pos = dial.to; dial.vel = 0; dial.q = -1;
      if (dial.live) { frozen = null; frozenDate = null; } else frozen = toHM(Math.round(dial.pos));
      daySound(null);
    }
    paintNow(!moving);
    renderDial();
    if (moving) dial.raf = requestAnimationFrame(step);
  }
  function goLive() { dial.live = true; dial.drag = null; run(); }
  // Touching the day means following the sky again, whatever Light or Dark was showing.
  function toSky() {
    if (mode === 'sky') return;
    mode = 'sky';
    try { localStorage.removeItem('sky-mode'); } catch (e) {}
    paint(true);
  }

  /* ── The sound ──
     A music box: a note every quarter hour the sun passes, climbing a pentatonic scale as the sun rises and falling
     as it sets, with a fifth over it on the hour. Each note rings out on its own. */
  let voice = null;
  function unlock() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) {}
  }
  function daySound(h, speed, q) {
    if (h == null || q == null || !actx || actx.state !== 'running') return;
    (voice ||= musicBox(actx)).quarter(q, h);
  }
  function musicBox(a) {
    const out = a.createGain(), SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    out.gain.value = .45; out.connect(a.destination);
    let at = -1;
    // A struck note that rings away: a short attack and a long exponential fall.
    const strike = (f, t, gain, len) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + len); o.connect(g).connect(out); o.start(t); o.stop(t + len + .05); };
    // A tine: the note, a soft octave, and a bright overtone that dies first.
    const pluck = (f, t, g, len) => { strike(f, t, g, len); strike(f * 2, t, g * .25, len * .6); strike(f * 5.4, t, g * .05, len * .25); };
    return {
      quarter(q, h) {
        if (a.currentTime - at < .05) return; // a fast drag crosses dozens of quarter hours a second
        at = a.currentTime;
        const t = at + .005, f = 294 * 2 ** (SCALE[Math.round(clamp((h + 1) / 2, 0, 1) * (SCALE.length - 1))] / 12), hour = q % 4 === 0;
        pluck(f, t, hour ? .1 : .065, hour ? 1.3 : .75);
        if (hour) pluck(f * 1.5, t + .045, .04, 1);
      },
    };
  }
  // A tick in the hand at every quarter hour on phones: a vibration on Android, the switch trick on iPhone.
  let tapEl = null;
  function tap() {
    if (!bar || !matchMedia('(pointer: coarse)').matches) return;
    if (navigator.vibrate) { navigator.vibrate(4); return; }
    if (!tapEl) { tapEl = document.createElement('label'); tapEl.className = 'sb-tap'; tapEl.setAttribute('aria-hidden', 'true'); tapEl.innerHTML = '<input type="checkbox" switch tabindex="-1">'; bar.append(tapEl); }
    tapEl.click();
  }

  /* ── The genie ──
     While the card moves, its glass is one layer cut to the funnel's outline, and its contents are 6px slices,
     each warped onto its own strip of the funnel. Rows near the button narrow first, then everything pours in.
     The same shape as Peng's genie: bend over the first half, pour over the last three quarters. */
  let gen = null;
  function genie(open) {
    const c0 = gen ? gen.c : open ? 1 : 0;
    if (gen) { cancelAnimationFrame(gen.raf); gen.layer.remove(); }
    if (calm()) { gen = null; bar.classList.remove('is-genie'); if (!open) bar.classList.remove('is-open'); return; }
    bar.classList.add('is-genie');
    const W = bar.offsetWidth, H = bar.offsetHeight, r = bar.getBoundingClientRect(), s = source();
    const cx = (s.left + s.right) / 2 - r.left, neck = Math.max(14, s.width) / 2;
    const G = { W, H, sl: cx - neck, sr: cx + neck, sy: (s.top + s.bottom) / 2 - r.top, R: parseFloat(getComputedStyle(bar).borderTopLeftRadius) || 22 };
    const layer = document.createElement('div'), glass = document.createElement('div');
    layer.className = 'sb-genie'; layer.inert = true; layer.setAttribute('aria-hidden', 'true');
    glass.className = 'sb-glass';
    G.gx = Math.min(0, G.sl); G.gy = Math.min(0, G.sy);
    Object.assign(glass.style, { left: `${G.gx}px`, top: `${G.gy}px`, width: `${Math.max(W, G.sr) - G.gx}px`, height: `${Math.max(H, G.sy) - G.gy}px` });
    layer.append(glass);
    const ys = [];
    for (let y = 0; y < H; y += 6) ys.push(y);
    ys.push(H);
    const slices = ys.slice(0, -1).map((y0, i) => {
      const sl = inner.cloneNode(true);
      sl.classList.add('sb-slice');
      sl.style.clipPath = `inset(${Math.max(0, y0 - .5)}px 0 ${Math.max(0, H - ys[i + 1] - .5)}px 0)`;
      layer.append(sl);
      return sl;
    });
    bar.append(layer);
    gen = { c: c0, layer, raf: 0, t: performance.now() };
    const dur = open ? 450 : 400;
    const tick = (t) => {
      gen.c = clamp(gen.c + (open ? -1 : 1) * (t - gen.t) / dur, 0, 1); gen.t = t;
      drawGenie(G, ys, slices, glass, gen.c);
      if (gen.c === (open ? 0 : 1)) {
        layer.remove(); gen = null;
        bar.classList.remove('is-genie');
        if (!open) bar.classList.remove('is-open');
        return;
      }
      gen.raf = requestAnimationFrame(tick);
    };
    drawGenie(G, ys, slices, glass, c0);
    gen.raf = requestAnimationFrame(tick);
  }
  function drawGenie(G, ys, slices, glass, c) {
    const bend = smooth(clamp(c / .5, 0, 1)), pour = clamp((c - .25) / .75, 0, 1) ** 2;
    const below = G.sy >= G.H / 2, span = below ? G.sy : G.H - G.sy;
    const row = (y) => {
      const s = Math.min((below ? y : G.H - y) + pour * span, span), k = bend * smooth(clamp(s / span, 0, 1));
      return { Y: below ? s : G.H - s, l: k * G.sl, r: G.W + k * (G.sr - G.W) };
    };
    const rows = ys.map(row);
    slices.forEach((sl, i) => {
      const m = quad(G.W, ys[i], ys[i + 1], rows[i], rows[i + 1]);
      sl.style.visibility = m ? '' : 'hidden';
      if (m) sl.style.transform = `matrix3d(${m.join(',')})`;
    });
    // The outline, every 2px, with the card's round corners carried along the warp.
    const L = [], Rt = [];
    for (let y = 0; y <= G.H; y += 2) {
      const w = row(y), e = Math.min(y, G.H - y), inset = e < G.R ? G.R - Math.sqrt(G.R * G.R - (G.R - e) ** 2) : 0, k = (w.r - w.l) / G.W;
      L.push(`${(w.l + inset * k - G.gx).toFixed(1)}px ${(w.Y - G.gy).toFixed(1)}px`);
      Rt.push(`${(w.r - inset * k - G.gx).toFixed(1)}px ${(w.Y - G.gy).toFixed(1)}px`);
    }
    glass.style.clipPath = `polygon(${L.concat(Rt.reverse()).join(',')})`;
  }
  // The perspective transform that lays the strip [0,W]×[y0,y1] onto the four-cornered shape between two rows.
  function quad(W, y0, y1, a, b) {
    const hb = y1 - y0;
    if (!(b.Y - a.Y > .001)) return null;
    const [x0, Y0, x1, Y1, x2, Y2, x3, Y3] = [a.l, a.Y, a.r, a.Y, b.r, b.Y, b.l, b.Y];
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = Y1 - Y2, dy2 = Y3 - Y2, dy3 = Y0 - Y1 + Y2 - Y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den, h = (dx1 * dy3 - dx3 * dy1) / den;
    const A = x1 - x0 + g * x1, B = x3 - x0 + h * x3, D = Y1 - Y0 + g * Y1, E = Y3 - Y0 + h * Y3;
    const m = [A / W, D / W, 0, g / W, B / hb, E / hb, 0, h / hb, 0, 0, 1, 0, x0 - B * y0 / hb, Y0 - E * y0 / hb, 0, 1 - h * y0 / hb];
    return m.every(Number.isFinite) ? m.map((v) => +v.toFixed(6)) : null;
  }
  function syncBar() {
    if (!bar || !last) return;
    bar.querySelectorAll('[data-m]').forEach((b) => { const v = String(b.dataset.m === last.mode); if (b.getAttribute('aria-pressed') !== v) b.setAttribute('aria-pressed', v); });
    bar.classList.toggle('is-live', dial.live && !frozen && last.mode === 'sky');
    bar.classList.toggle('is-fixed', last.mode !== 'sky');
    if (!dial.raf && dial.live && !frozen) dial.pos = dial.to = last.n.min;
    renderDial();
  }

  /* ───────── For the board at /sky/ ───────── */
  window.__sky = {
    sun: (d) => sun(d || wall(Date.now()).ymd),
    now: () => last && { min: last.n.min, ymd: last.n.ymd },
    at: (min, d) => lookAt(wrap(Math.round(min)), d || wall(Date.now()).ymd),
    street: () => last && street(last.n.min, last.n.ymd, last.mode),
    barOpen: () => barOpen,
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

  /* ───────── From a card to its page and back ─────────
     The card you click and the picture at the top of its page share a name, so the browser grows one into the
     other (and back again when you return). Everything else on the page just fades (site.css). */
  const TOP = '.hero-shot, .film-frame, .stage-media, main .card .media';
  const named = (el) => { document.querySelectorAll('[style*="view-transition-name: project"]').forEach((x) => { x.style.viewTransitionName = ''; }); if (el) el.style.viewTransitionName = 'project'; };
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('.work a[href$=".html"], .cs-next a[href$=".html"]');
    if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey) named(a.closest('.item')?.querySelector('.card') || a);
  });
  addEventListener('pagereveal', (e) => {
    if (!e.viewTransition) return;
    const work = document.querySelector('.work'), from = window.navigation?.activation?.from?.url;
    if (!work) return named(document.querySelector(TOP)); // a project page: its top picture
    const file = from && new URL(from).pathname.split('/').pop();
    named(file && work.querySelector(`a[href="${file}"]`)?.closest('.item')?.querySelector('.card'));
  });

  /* Coming from another page (html.hop, set in <head>): what's on the first screen is simply there, without rising in,
     so the crossfade, or the card growing into place, lands on it. Further down still rises as you scroll. */
  const settle = () => document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
    if (el.getBoundingClientRect().top > innerHeight) return;
    el.classList.add('in', 'pg-now'); setTimeout(() => el.classList.remove('pg-now'), 100);
  });
  if (root.classList.contains('hop')) { addEventListener('pagereveal', settle); document.addEventListener('DOMContentLoaded', settle); }

  /* The same thing by hand, for browsers that can't yet carry one page into the next (Firefox, and so Zen). Leaving:
     everything but the card you clicked fades, then the page changes. Arriving: the picture at the top of the new
     page starts where the card was, cropped to its shape, and grows into place while the rest fades in. */
  if (!window.CSSViewTransitionRule && !embed && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let going = false;
    document.addEventListener('click', (e) => {
      const a = e.target.closest?.('a[href]');
      if (!a || going || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
      const to = new URL(a.href);
      if (to.origin !== location.origin || (to.pathname === location.pathname && to.search === location.search)) return; // another site, or a jump within this page
      e.preventDefault(); going = true;
      const item = a.closest('.work .item, .cs-next .item'), card = item?.querySelector('.card'), r = card?.getBoundingClientRect();
      try { sessionStorage.setItem('pg', JSON.stringify({ at: Date.now(), r: r && [r.left, r.top, r.width, r.height, parseFloat(getComputedStyle(card).borderRadius) || 0] })); } catch (err) {}
      item?.classList.add('is-going');
      root.classList.add('pg-out'); root.classList.toggle('pg-card', !!card);
      setTimeout(() => { location.href = a.href; }, 200);
    });
    // Coming back with the back button can bring the old page out of memory exactly as it was left: faded.
    addEventListener('pageshow', () => { going = false; root.classList.remove('pg-out', 'pg-card'); document.querySelector('.is-going')?.classList.remove('is-going'); });
    let pg = null;
    try { pg = JSON.parse(sessionStorage.getItem('pg')); sessionStorage.removeItem('pg'); } catch (err) {}
    if (pg && Date.now() - pg.at < 8000) {
      root.classList.add('pg-in'); // nothing shows until the pieces are in their starting places
      document.addEventListener('DOMContentLoaded', () => {
        const top = pg.r && document.querySelector(TOP), soft = 'cubic-bezier(.22, .8, .2, 1)';
        const fade = (el) => { if (!el.matches('.reveal, script, style')) el.animate([{ opacity: 0, translate: '0 14px' }, { opacity: 1, translate: '0 0' }], { duration: 500, delay: 80, easing: 'cubic-bezier(.2, .7, .2, 1)', fill: 'backwards' }); };
        if (!top) [...document.body.children].forEach(fade);
        else {
          for (let el = top; el !== document.body; el = el.parentElement) {
            if (el.matches('.reveal')) el.classList.add('in', 'pg-now');
            [...el.parentElement.children].forEach((x) => { if (x !== el) fade(x); });
          }
          const t = top.getBoundingClientRect(), [x, y, w, h, rad] = pg.r, sc = Math.max(w / t.width, h / t.height);
          const ix = Math.max(0, (t.width - w / sc) / 2), iy = Math.max(0, (t.height - h / sc) / 2), end = parseFloat(getComputedStyle(top).borderRadius) || 0;
          top.animate([{ transform: `translate(${x + w / 2 - t.left - t.width / 2}px, ${y + h / 2 - t.top - t.height / 2}px) scale(${sc})`, clipPath: `inset(${iy}px ${ix}px round ${rad / sc}px)` },
            { transform: 'translate(0px, 0px) scale(1)', clipPath: `inset(0px 0px round ${end}px)` }], { duration: 620, easing: soft });
        }
        root.classList.remove('pg-in');
      });
    }
  }

  /* ───────── Go ───────── */
  if (embed && params.has('sun')) root.classList.add('sun-on');
  paintNow(); // synchronous: the visitor's sky is set before the first paint
  document.addEventListener('DOMContentLoaded', () => {
    decorate(); // colours are already set; only the page's pieces were missing
    document.dispatchEvent(new Event('sky:paint'));
    if (params.has('bar')) openBar();
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
  });
  setInterval(() => { if (!document.hidden && !frozen) paint(); }, 10000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !frozen) paint(); });
  // Nothing to repaint in a hidden tab.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { endSweep(); daySound(null); } });
})();
