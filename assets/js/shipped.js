/* Shipped: everything I've made, from assets/data/shipped.json.
   Homepage: the newest thing stands on the horizon as an object, and "Last shipped …" links to it.
   /shipped/: the things stand in one row, oldest on the left, newest on the right, like a street.
   Scroll, drag or use the arrow keys; the ticks underneath are a scrubber that clicks as you pass.
   Hearts are only kept in the visitor's browser for now; counts and a leaderboard need a small database. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const day = (d) => new Date(`${d}T12:00:00`);
  const short = (d) => { const x = day(d); return `${MONTHS[x.getMonth()]} ${x.getDate()}`; };
  function when(d) {
    const t = new Date(); t.setHours(12, 0, 0, 0);
    const n = Math.round((t - day(d)) / 864e5);
    return n <= 0 ? 'Today' : n === 1 ? 'Yesterday' : short(d);
  }
  const ago = (d) => { const w = when(d); return w === 'Today' || w === 'Yesterday' ? w.toLowerCase() : `on ${w}`; };
  const id = (s) => `${s.d}-${s.t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  const LOCK = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="2.5" y="5.5" width="7" height="5" rx="1.2"/><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5"/></svg>';

  /* Each ship stands as an object: an app icon, a cut-out, a phone, a window, or a lettered tile. */
  // Hand-made objects (assets/js/ship-objects.js) win over the generic ones, keyed by the ship's "obj".
  function object(s) {
    const made = window.SHIP_OBJECTS && (s.wraps ? window.SHIP_OBJECTS.wraps : window.SHIP_OBJECTS[s.obj]);
    if (made) return made(s);
    if (s.wraps) return `<span class="obj obj-tile is-wraps"><span class="obj-blur"></span>${LOCK}</span>`;
    const img = s.img ? `<img src="${esc(s.img)}" alt="" loading="lazy" decoding="async" draggable="false">` : '';
    switch (s.img && s.o) {
      case 'icon': return `<span class="obj obj-icon">${img}</span>`;
      case 'cutout': return `<span class="obj obj-cutout">${img}</span>`;
      case 'phone': return `<span class="obj obj-phone"><span>${img}</span></span>`;
      case 'screen': return `<span class="obj obj-screen"><i></i><span>${img}</span></span>`;
      case 'line': return `<span class="obj obj-line"><span>${img}</span></span>`;
      case 'sprite': return `<span class="obj obj-sprite" style="--sheet:url('${esc(s.img)}')" role="img" aria-label="${esc(s.p)}"></span>`;
      default: return `<span class="obj obj-tile"><b>${esc(s.p.charAt(0))}</b></span>`;
    }
  }

  /* Pip moves with Shea's own sprite sheet: one row per mood, six 96×104 frames a row, frame times from the
     add-in. Away from the middle it sleeps; reach it and it wakes and waves; open it and it gets to work. */
  const MOODS = { sleep: [0, [200, 220, 240, 300, 400, 400]], wake: [1, [360, 200, 240, 200, 320]], greet: [2, [420, 260, 200, 200, 1000]],
    idle: [3, [900, 1100, 1100, 260, 320, 1400]], think: [4, [160, 180, 260, 160, 320]], search: [5, [240, 280, 280, 280, 360, 1100]],
    write: [6, [220, 260, 260, 320, 1100]], celebrate: [7, [260, 120, 180, 120, 160, 900]], nod: [8, [130, 130, 150, 300]],
    thumbs: [9, [140, 140, 160, 320]], shrug: [10, [150, 150, 200, 340]], bye: [11, [150, 180, 180, 180, 300]] };
  const WORK = ['think', 'search', 'write', 'celebrate', 'thumbs', 'shrug', 'nod'];
  function sprite(el) {
    let timer = 0, awake = false, mood = 'far', job = 0;
    const frame = (r, f) => { el.style.setProperty('--r', r); el.style.setProperty('--f', f); };
    // Play a row once, then hand over to what comes next.
    const play = (name, next) => {
      clearTimeout(timer);
      const [r, times] = MOODS[name];
      const step = (f) => { frame(r, f); timer = setTimeout(() => (f + 1 < times.length ? step(f + 1) : next && next()), times[f]); };
      step(0);
    };
    const idle = () => play('idle', idle);
    // Open, it runs through its jobs with a short breath between each.
    const breathe = () => { if (mood !== 'open') return idle(); frame(3, 0); timer = setTimeout(work, 700); };
    const work = () => play(WORK[job++ % WORK.length], breathe);
    frame(0, 5);
    if (reduced) return { set() {}, stop() {} };
    return {
      set(m) {
        if (m === mood) return;
        mood = m;
        if (m === 'far') { if (awake) play('bye', () => play('sleep')); awake = false; return; }
        if (!awake) { awake = true; play('wake', () => play('greet', m === 'open' ? work : idle)); }
        else if (m === 'open') work();
      },
      stop() { clearTimeout(timer); },
    };
  }

  /* Meridian's mascot, live (assets/js/meridian-line.js): asleep away from the middle, awake and watching the
     pointer at it, and open it runs through working, done and needs you. */
  function face(host) {
    if (typeof Line === 'undefined') return null;
    host.textContent = '';
    Line.mount(host, { eyeset: 'pen', mood: 'sleep', follow: true, label: 'Meridian' });
    let timer = 0, mood = 'far', job = 0;
    const JOBS = ['work', 'done', 'need', 'idle'];
    const cycle = () => { Line.set(host, { mood: JOBS[job++ % JOBS.length] }); timer = setTimeout(cycle, 2800); };
    return {
      set(m) {
        if (m === mood) return;
        mood = m; clearTimeout(timer);
        if (m === 'open') cycle(); else Line.set(host, { mood: m === 'near' ? 'idle' : 'sleep' });
      },
      stop() { clearTimeout(timer); },
    };
  }

  /* One quiet sound: a soft tick for each ship you pass. It used to be fresh random noise every time, dropped
     any tick within 45ms of the last, and only woke up on the very first press, so it came and went.
     Now it's one fixed click (made once), every ship you pass counts, and every press or key wakes the sound
     again if the browser has put it to sleep. */
  let ctx = null, clicks = null;
  // A soft detent, like a dial clicking past a notch: a low knock with a gentle click on top and a breath of
  // texture, eased in over half a millisecond so it has no hard edge. Made once and played the same every time.
  function makeClick(tone) {
    const sr = ctx.sampleRate, len = Math.round(sr * .045), buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    let seed = 7, grain = 0, peak = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      seed = (seed * 16807) % 2147483647;
      grain += ((seed / 2147483647) * 2 - 1 - grain) * .3; // softened noise, no hiss
      const ease = t < .0006 ? .5 - .5 * Math.cos(Math.PI * t / .0006) : 1;
      d[i] = ease * (Math.sin(2 * Math.PI * 470 * tone * t) * Math.exp(-t * 150)
        + .5 * Math.sin(2 * Math.PI * 1750 * tone * t) * Math.exp(-t * 480)
        + .35 * grain * Math.exp(-t * 900));
      peak = Math.max(peak, Math.abs(d[i]));
    }
    for (let i = 0; i < len; i++) d[i] *= .11 / peak;
    return buf;
  }
  // Like a dial: stepping one or two ships gives a full click each. On a flick, ships pass faster than a click
  // can ring, so the clicks thin out (never closer than 55ms) and go lighter the faster you go, and one full
  // click marks where it lands.
  let lastPass = -9, lastPlay = -9, missed = false;
  function play(level, month) {
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = month ? clicks.month : clicks.plain; g.gain.value = level;
    src.connect(g).connect(ctx.destination); src.start();
    lastPlay = ctx.currentTime;
  }
  function tick(passed = 1, month = false) {
    if (!ctx || ctx.state !== 'running') return;
    clicks = clicks || { plain: makeClick(1), month: makeClick(.86) };
    const now = ctx.currentTime, each = (now - lastPass) / passed; // seconds per ship
    lastPass = now;
    if (now - lastPlay < .055) { missed = true; return; }
    missed = each < .12; // fast: owe a landing click
    play(each >= .12 ? 1 : Math.max(.28, each / .12), month);
  }
  function land(month) {
    if (!ctx || ctx.state !== 'running' || !missed) return;
    missed = false;
    if (ctx.currentTime - lastPlay < .04) setTimeout(() => play(1, month), 40); else play(1, month);
  }
  // Browsers only allow sound after a press or key, and can put it back to sleep (a tab in the background,
  // Safari after a call), so every press checks it's awake.
  const wakeAudio = () => {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state !== 'running') ctx.resume();
    } catch (e) {}
  };
  ['pointerdown', 'touchend', 'keydown'].forEach((t) => addEventListener(t, wakeAudio, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx) ctx.resume().catch(() => {}); });

  fetch('/assets/data/shipped.json').then((r) => r.json()).then(({ ships }) => {
    ships = ships.filter((s) => !s.draft).sort((a, b) => b.d.localeCompare(a.d));
    if (!ships.length) return;
    home(ships);
    street(ships);
  }).catch(() => {});

  /* ───────── Homepage ───────── */
  function home(ships) {
    const latest = ships.find((s) => !s.wraps) || ships[0];
    const href = `/shipped/#${id(latest)}`;
    const last = document.querySelector('.last');
    if (last) last.innerHTML = `Last shipped <a href="${href}">${esc(latest.t)}</a> ${ago(latest.d)}.`;
    const spot = document.querySelector('[data-latest]');
    if (spot) {
      spot.href = href;
      spot.setAttribute('aria-label', `Last shipped: ${latest.t}. See everything I've shipped`);
      spot.innerHTML = `${object(latest)}<span class="latest-cap"><span>${when(latest.d)}</span>${esc(latest.t)}</span>`;
    }
    document.querySelectorAll('[data-ship-count]').forEach((n) => { n.textContent = ships.length; });
    // The Shipped card's shelf: the latest few with pictures, no picture twice, oldest on the left.
    const seen = new Set(), pick = [];
    for (const s of ships) { if (s.wraps || !s.img || seen.has(s.img)) continue; seen.add(s.img); pick.push(s); if (pick.length === 5) break; }
    const shelfHtml = pick.reverse().map(object).join('');
    document.querySelectorAll('[data-shelf]').forEach((shelf) => { shelf.innerHTML = shelfHtml; });
  }

  /* ───────── /shipped/ ─────────
     Like Peng's timeline: one row, oldest on the left, newest on the right where it opens. The one in the middle
     of the screen is the one in focus; the row has half a screen of room at each end so the first and last can
     reach the middle. Bottom left: a filter menu and search, in frosted squircle buttons. */
  const ICON = {
    all: '<path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" stroke-linejoin="round"/>',
    personal: '<path d="M8 2.5l1.4 3.6 3.6 1.4-3.6 1.4L8 12.5 6.6 8.9 3 7.5l3.6-1.4z" stroke-linejoin="round"/>',
    work: '<rect x="2.5" y="5" width="11" height="8" rx="1.6"/><path d="M6 5V3.8c0-.5.4-.8.8-.8h2.4c.5 0 .8.4.8.8V5M2.5 8.5h11"/>',
    web: '<rect x="2.5" y="3" width="11" height="10" rx="1.8"/><path d="M2.5 6h11"/><circle cx="4.6" cy="4.5" r=".1"/>',
    lock: '<rect x="3.5" y="7" width="9" height="6.5" rx="1.6"/><path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"/>',
    search: '<circle cx="7.2" cy="7.2" r="4.2"/><path d="M10.4 10.4l3 3" stroke-linecap="round"/>',
    chev: '<path d="M4.5 6.5 8 10l3.5-3.5" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  const svg = (k) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">${ICON[k]}</svg>`;
  const longDate = (d) => { const x = day(d); return `${MONTHS[x.getMonth()]} ${x.getDate()}, ${x.getFullYear()}`; };

  /* The sky over the street, after Peng's: a tall gradient from the sky at the top to a warm horizon, a glow
     where the sun is coming up or going down, and a fine grain. It follows the sun where the visitor is (sunrise
     and sunset come from sky.js), stays blue rather than plum at dusk, and the words turn light after dark.
     The theme toggle's Light and Dark hold it at midday or night; ?t=HH:MM previews a time. */
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
  function skyAt(min, sun) {
    const { rise: R, set: S, tw: T } = sun;
    const A = [['night', R - 2.4 * T], ['predawn', R - 1.1 * T], ['dawn', R - .1 * T], ['sunrise', R + .7 * T], ['morning', R + 2.4 * T],
      ['day', (R + S) / 2], ['golden', S - 1.6 * T], ['sunset', S + .1 * T], ['dusk', S + 1.1 * T], ['night', S + 2.4 * T]];
    if (min < A[0][1]) min += 1440;
    let i = A.findIndex((a) => a[1] > min);
    if (i <= 0) return { ...SKIES.night, dark: true };
    const [ak, am] = A[i - 1], [bk, bm] = A[i], t = (min - am) / (bm - am), k = t * t * (3 - 2 * t);
    const a = SKIES[ak], b = SKIES[bk], mix = (x, y) => '#' + [1, 3, 5].map((j) => Math.round(parseInt(x.slice(j, j + 2), 16) * (1 - k) + parseInt(y.slice(j, j + 2), 16) * k).toString(16).padStart(2, '0')).join('');
    const midC = mix(a.mid, b.mid);
    // Words go light once the middle of the sky (where they sit) is darker than about a quarter.
    const lum = [1, 3, 5].map((j) => { const v = parseInt(midC.slice(j, j + 2), 16) / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((t, v, j) => t + v * [.2126, .7152, .0722][j], 0);
    return { top: mix(a.top, b.top), mid: midC, low: mix(a.low, b.low), glow: mix(a.glow, b.glow), ga: a.ga + (b.ga - a.ga) * k, dark: lum < .26 };
  }
  // on(): whether to paint. The homepage only wears this sky with lab: Page sky → Street.
  function streetSky(on = () => true) {
    const html = document.documentElement, body = document.body;
    const t = new URLSearchParams(location.search).get('t');
    function paint() {
      if (!on()) { ['--sky-top', '--sky-mid', '--sky-low', '--sky-sun', '--sky-sun-a'].forEach((k) => body.style.removeProperty(k)); return; }
      const d = new Date(), mode = html.dataset.mode;
      const min = mode === 'dark' ? 0 : t ? +t.split(':')[0] * 60 + +(t.split(':')[1] || 0) : d.getHours() * 60 + d.getMinutes();
      const sun = window.__sky?.sun() || { rise: 450, set: 1020, tw: 38 };
      const L = mode === 'light' ? SKIES.day : skyAt(min, sun);
      [['--sky-top', L.top], ['--sky-mid', L.mid], ['--sky-low', L.low], ['--sky-sun', L.glow], ['--sky-sun-a', L.ga.toFixed(2)]].forEach(([k, v]) => body.style.setProperty(k, v));
      if (!body.classList.contains('is-street')) return;
      body.classList.toggle('is-night', !!L.dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', L.top);
    }
    paint();
    setInterval(paint, 30000);
    new MutationObserver(paint).observe(html, { attributes: true, attributeFilter: ['data-mode'] });
    new MutationObserver(paint).observe(body, { attributes: true, attributeFilter: ['data-skylook'] });
  }
  if (document.body.classList.contains('home')) streetSky(() => document.body.dataset.skylook === 'street');

  function street(all) {
    const root = document.querySelector('[data-street]');
    if (!root) return;
    streetSky();
    const track = root.querySelector('.st-track'), ticks = root.querySelector('.st-ticks');
    const read = () => { try { return new Set(JSON.parse(localStorage.getItem('shipped-hearts') || '[]')); } catch (e) { return new Set(); } };
    const hearts = read();
    const save = () => { try { localStorage.setItem('shipped-hearts', JSON.stringify([...hearts])); } catch (e) {} };
    const shown = () => all.filter((s) => !s.minor); // small updates stay hidden
    let filter = 'all', items = [], marks = [], current = -1;

    // The filter menu: everything, personal or work, and the projects with more than one thing in them.
    function filters() {
      const count = {}, icons = {};
      shown().forEach((s) => { count[s.p] = (count[s.p] || 0) + 1; if (s.o === 'icon' && s.img) icons[s.p] = s.img; });
      const opts = [['all', 'All', svg('all')], ['k:personal', 'Personal', svg('personal')], ['k:work', 'Work', svg('work')]];
      // Client work isn't its own entry: Work already covers it.
      Object.keys(count).filter((p) => count[p] > 1 && p !== 'Client work').sort((a, b) => count[b] - count[a]).forEach((p) => {
        opts.push([`p:${p}`, p, icons[p] ? `<img src="${esc(icons[p])}" alt="">` : svg('web')]);
      });
      return opts;
    }
    const passes = (s) => filter === 'all' || (filter.startsWith('k:') ? s.k === filter.slice(2) : s.p === filter.slice(2));

    function render(focusId) {
      const list = shown().filter(passes).reverse(); // oldest left, newest right
      track.innerHTML = list.map((s) => {
        const key = id(s), on = hearts.has(key), title = s.wraps ? 'Client work' : esc(s.t);
        const open = s.href && !s.wraps ? `<a class="st-open" href="${esc(s.href)}">Open<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg></a>` : '';
        return `<li class="st-item${s.wraps ? ' is-wraps' : ''}${s.minor ? ' is-minor' : ''}" id="${key}">
          <button class="st-hit" type="button" aria-expanded="false" aria-label="${title}, ${short(s.d)}"></button>
          <time datetime="${s.d}">${when(s.d)}</time>
          <span class="st-stand">${object(s)}</span>
          <div class="st-words">
            <h2>${title}</h2>
            <p class="st-p">${esc(s.wraps ? 'Under wraps' : s.p)}</p>
            <div class="st-more">
              <p${s.wraps ? ' class="is-blur" aria-hidden="true"' : ''}>${esc(s.l)}</p>
              <div class="st-acts">${open}<button class="st-heart${on ? ' is-on' : ''}" type="button" data-key="${key}" aria-pressed="${on}" aria-label="Like ${title}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.6S2 10.1 2 6.1A3.1 3.1 0 0 1 8 4.6a3.1 3.1 0 0 1 6 1.5c0 4-6 7.5-6 7.5z"/></svg></button></div>
            </div>
          </div>
        </li>`;
      }).join('');
      items.forEach((el) => el.sprite?.stop());
      items = [...track.children];
      items.forEach((el) => { const o = el.querySelector('.obj-sprite'), f = el.querySelector('.obj-line > span'); el.sprite = o ? sprite(o) : f ? face(f) : null; });
      // One tick per ship; the first of each month stands taller and carries its name.
      let month = '', lastLabel = -9;
      ticks.innerHTML = list.map((s, i) => {
        const m = s.d.slice(0, 7), first = m !== month; month = m;
        const label = first && i - lastLabel > 3; if (label) lastLabel = i;
        return `<i class="st-tick${first ? ' is-month' : ''}">${label ? `<span>${MONTHS[+m.slice(5) - 1]}</span>` : ''}</i>`;
      }).join('');
      marks = [...ticks.children];
      current = -1; opened = null; steer = null;
      track.classList.remove('has-open');
      const target = focusId && items.find((el) => el.id === focusId);
      requestAnimationFrame(() => {
        if (target) { go(target, false); open(target); } else track.scrollLeft = track.scrollWidth;
        onScroll();
      });
    }

    // The focus line is the middle of the screen.
    const line = () => track.scrollLeft + track.clientWidth / 2;
    const mid = (el) => el.offsetLeft + el.offsetWidth / 2;
    let opened = null, steer = null;
    // Going to something by click or key "steers": the open card waits until we arrive.
    const go = (el, smooth = true) => {
      if (!el) return;
      steer = smooth && !reduced ? el : null;
      track.scrollTo({ left: mid(el) - track.clientWidth / 2, behavior: steer ? 'smooth' : 'auto' });
    };
    const mood = (el) => el?.sprite?.set(el === opened ? 'open' : el.classList.contains('is-focus') ? 'near' : 'far');
    function open(el) {
      if (opened === el) return;
      const was = opened;
      opened = el;
      mood(was); mood(el);
      items.forEach((x) => { const on = x === el; x.classList.toggle('is-open', on); x.querySelector('.st-hit').setAttribute('aria-expanded', String(on)); });
      track.classList.toggle('has-open', !!el);
      history.replaceState(null, '', el ? `#${el.id}` : location.pathname + location.search);
    }
    function focusIndex() {
      const at = line();
      let best = 0, bestD = Infinity;
      items.forEach((el, i) => { const d = Math.abs(mid(el) - at); if (d < bestD) { bestD = d; best = i; } });
      return best;
    }

    // Ticks swell in a wave around the focus (or the pointer over the scrubber); things near the focus stand a
    // touch taller. Passing ships makes the soft tick.
    let pointerTick = null, raf = 0, landing = 0;
    function wave() {
      raf = 0;
      const at = line(), w = track.clientWidth * .6;
      items.forEach((el) => {
        const d = Math.min(1, Math.abs(mid(el) - at) / w);
        el.style.setProperty('--near', (1 - d * d).toFixed(3));
      });
      const p = pointerTick ?? current;
      marks.forEach((m, i) => { const k = Math.abs(i - p); m.style.setProperty('--lift', (Math.exp(-(k * k) / 6)).toFixed(3)); });
    }
    const queue = () => { if (!raf) raf = requestAnimationFrame(wave); };
    function onScroll() {
      const best = focusIndex();
      if (best !== current) {
        if (current !== -1) tick(Math.abs(best - current), marks[best]?.classList.contains('is-month'));
        marks[current]?.classList.remove('is-on'); items[current]?.classList.remove('is-focus');
        marks[best]?.classList.add('is-on'); items[best]?.classList.add('is-focus');
        mood(items[current]); mood(items[best]);
        current = best;
      }
      // With a card open, scrolling moves the opening along.
      if (steer && items[best] === steer) steer = null;
      if (opened && !steer && items[best] !== opened) open(items[best]);
      clearTimeout(landing); landing = setTimeout(() => land(marks[current]?.classList.contains('is-month')), 110);
      queue();
    }
    ticks.addEventListener('pointermove', (e) => {
      const r = ticks.getBoundingClientRect();
      pointerTick = Math.max(0, Math.min(marks.length - 1, (e.clientX - r.left) / r.width * (marks.length - 1)));
      queue();
    });
    ticks.addEventListener('pointerleave', () => { pointerTick = null; queue(); });
    track.addEventListener('scroll', onScroll, { passive: true });
    track.addEventListener('scrollend', () => { steer = null; onScroll(); });
    addEventListener('resize', queue);

    // A mouse wheel moves the street sideways, settling on the nearest ship (always at least one along).
    let wheelRest = 0, wheelFrom = null;
    track.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault(); steer = null;
      if (wheelFrom === null) wheelFrom = { left: track.scrollLeft, at: current };
      track.scrollLeft += e.deltaY;
      clearTimeout(wheelRest);
      wheelRest = setTimeout(() => {
        const moved = track.scrollLeft - wheelFrom.left;
        let to = focusIndex();
        if (to === wheelFrom.at && Math.abs(moved) > 12) to += Math.sign(moved);
        wheelFrom = null;
        go(items[Math.max(0, Math.min(items.length - 1, to))]);
      }, 140);
    }, { passive: false });

    // Drag the street with a mouse (touch scrolls on its own).
    let drag = null;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a, .st-heart')) return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: false };
    });
    addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4 && !drag.moved) { drag.moved = true; steer = null; track.classList.add('is-dragging'); }
      if (drag.moved) track.scrollLeft = drag.left - dx;
    });
    addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved; drag = null; track.classList.remove('is-dragging');
      if (moved) { track.dataset.moved = '1'; setTimeout(() => delete track.dataset.moved, 0); }
    });
    track.addEventListener('touchstart', () => { steer = null; }, { passive: true });

    track.addEventListener('click', (e) => {
      if (track.dataset.moved) { e.preventDefault(); return; }
      const heart = e.target.closest('.st-heart');
      if (heart) {
        const k = heart.dataset.key, on = !hearts.has(k);
        on ? hearts.add(k) : hearts.delete(k); save();
        heart.classList.toggle('is-on', on); heart.setAttribute('aria-pressed', String(on));
        if (on && !reduced) { heart.classList.remove('is-pop'); void heart.offsetWidth; heart.classList.add('is-pop'); }
        return;
      }
      const el = e.target.closest('.st-hit')?.parentElement;
      if (!el) return;
      if (el === opened) { open(null); return; } // tapping the open one closes it
      open(el); go(el);
    });
    root.addEventListener('click', (e) => { if (opened && !e.target.closest('.st-item, .st-bar, .st-search, .lab')) open(null); });

    // The scrubber: press or drag along the ticks.
    let scrub = false;
    const scrubTo = (x) => {
      const r = ticks.getBoundingClientRect();
      go(items[Math.round(Math.max(0, Math.min(1, (x - r.left) / r.width)) * (items.length - 1))], false);
    };
    ticks.addEventListener('pointerdown', (e) => { scrub = true; ticks.setPointerCapture(e.pointerId); scrubTo(e.clientX); });
    ticks.addEventListener('pointermove', (e) => { if (scrub) scrubTo(e.clientX); });
    ticks.addEventListener('pointerup', () => { scrub = false; });

    /* ── The filter menu: a split pill ("All ⌄" and search), and a frosted menu that grows out of its corner. ── */
    const menuBtn = root.querySelector('[data-filter-btn]'), menu = root.querySelector('.st-menu'), label = root.querySelector('[data-filter-label]');
    function drawMenu() {
      menu.innerHTML = filters().map(([k, name, icon]) =>
        `<button type="button" role="menuitemradio" aria-checked="${k === filter}" data-f="${esc(k)}"><span class="st-mi">${icon}</span>${esc(name)}</button>`).join('');
    }
    const menuOpen = (on) => {
      if (on) drawMenu();
      menu.classList.toggle('is-open', on); menuBtn.setAttribute('aria-expanded', String(on));
      if (on) menu.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true });
    };
    menuBtn.addEventListener('click', () => menuOpen(!menu.classList.contains('is-open')));
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('[data-f]');
      if (!b) return;
      filter = b.dataset.f;
      label.textContent = filter === 'all' ? 'All' : b.textContent.trim();
      menuOpen(false); menuBtn.focus({ preventScroll: true });
      render();
    });
    addEventListener('pointerdown', (e) => { if (menu.classList.contains('is-open') && !e.target.closest('.st-menu, [data-filter-btn]')) menuOpen(false); });

    /* ── Search: a frosted panel in the middle, the street blurred behind it. ── */
    const search = root.querySelector('.st-search'), input = search.querySelector('input'), results = search.querySelector('.st-results'), found = search.querySelector('[data-found]');
    let hits = [], hit = 0;
    const thumb = (s) => s.wraps ? `<span class="st-thumb is-wraps">${svg('lock')}</span>`
      : s.o === 'sprite' ? `<span class="st-thumb">${object(s)}</span>`
      : s.img ? `<span class="st-thumb"><img src="${esc(s.img)}" alt="" loading="lazy"></span>` : `<span class="st-thumb"><b>${esc(s.p.charAt(0))}</b></span>`;
    function find() {
      const q = input.value.trim().toLowerCase();
      hits = q ? shown().filter((s) => (s.wraps ? 'client work' : `${s.t} ${s.p} ${s.l}`).toLowerCase().includes(q)) : [];
      hit = 0;
      found.textContent = q ? `${hits.length} result${hits.length === 1 ? '' : 's'}` : '';
      results.innerHTML = hits.slice(0, 8).map((s, i) => `<li><button type="button" data-i="${i}" class="${i === hit ? 'is-on' : ''}">${thumb(s)}<span><b>${s.wraps ? 'Client work' : esc(s.t)}</b><small>${esc(s.wraps ? 'Under wraps' : s.p)} · ${longDate(s.d)}</small></span></button></li>`).join('');
    }
    const searchOpen = (on) => {
      menuOpen(false);
      root.classList.toggle('is-searching', on);
      if (on) { input.value = ''; find(); setTimeout(() => input.focus(), 20); } else root.querySelector('[data-search-btn]').focus({ preventScroll: true });
    };
    function choose(s) {
      searchOpen(false);
      if (!s) return;
      if (!passes(s)) { filter = 'all'; label.textContent = 'All'; }
      render(id(s));
    }
    root.querySelector('[data-search-btn]').addEventListener('click', () => searchOpen(true));
    input.addEventListener('input', find);
    results.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) choose(hits[+b.dataset.i]); });
    search.addEventListener('pointerdown', (e) => { if (!e.target.closest('.st-search-panel')) searchOpen(false); });
    input.addEventListener('keydown', (e) => {
      const n = Math.min(hits.length, 8);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!n) return;
        hit = (hit + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
        results.querySelectorAll('button').forEach((b, i) => b.classList.toggle('is-on', i === hit));
      } else if (e.key === 'Enter') { e.preventDefault(); choose(hits[hit]); } // or the Enter carries on to the search button and opens it again
    });

    addEventListener('keydown', (e) => {
      const searching = root.classList.contains('is-searching');
      if (e.key === 'Escape') { if (searching) searchOpen(false); else if (menu.classList.contains('is-open')) { menuOpen(false); menuBtn.focus(); } else if (opened) open(null); return; }
      if (searching || e.target.closest('input, textarea')) return;
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); searchOpen(true); return; }
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step || menu.classList.contains('is-open')) return;
      e.preventDefault();
      go(items[Math.max(0, Math.min(items.length - 1, current + step))]);
    });

    render(decodeURIComponent(location.hash.slice(1)));
  }
})();
