/* sheawilson.uk interactions. Everything pointer-driven eases through one rAF loop,
   uses transforms only, and stops when nothing is moving. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let running = false;

  const pointer = { x: innerWidth / 2, y: innerHeight / 2, seen: false };
  addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true; wake(); }, { passive: true });

  /* ── Theme: a soft umbra spreads from the toggle over a page that has already finished changing ── */
  const toggle = document.querySelector('.theme-toggle');
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const syncToggle = () => {
    const dark = root.dataset.theme === 'dark';
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    metaTheme.setAttribute('content', dark ? '#05070b' : '#ffffff');
  };
  syncToggle();
  toggle.addEventListener('click', (e) => {
    // With the sky on (sky.js), the toggle clicks through Sky, Light and Dark instead.
    if (window.__skyToggle) { window.__skyToggle(e); return; }
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      if (next === 'dark') root.dataset.theme = 'dark'; else delete root.dataset.theme;
      try { localStorage.setItem('theme', next); } catch (err) {}
      syncToggle();
    };
    const r = toggle.getBoundingClientRect();
    root.style.setProperty('--vx', `${e.clientX || r.left + r.width / 2}px`);
    root.style.setProperty('--vy', `${e.clientY || r.top + r.height / 2}px`);
    if (!document.startViewTransition || reduced) { apply(); return; }
    root.classList.add('theme-switching');
    const vt = document.startViewTransition(apply);
    vt.finished.finally(() => root.classList.remove('theme-switching'));
  });

  /* ── Hero scene: the hero stays put while the disc rises and covers it ── */
  // Pages without the hero scene (case studies) still get the nav, theme, tip and cards.
  const scene = document.querySelector('.scene');
  const hero = scene && scene.querySelector('.hero');
  const copy = hero && hero.querySelector('.hero-copy');
  const eclipse = hero && hero.querySelector('.eclipse');
  const disc = hero && hero.querySelector('.disc');
  const corona = hero && hero.querySelector('.corona');
  let sunGlow = null; // added by sky.js once the page has loaded
  const hs = { px: 0, py: 0, p: 0, target: 0, inView: true };
  const geo = { ty: -900, scale: 1, sceneTop: 0, sceneLen: 1 };
  if (hero) new IntersectionObserver((en) => { hs.inView = en[0].isIntersecting; if (hs.inView) wake(); }).observe(hero);

  // Hovering a recent project borrows that project's colours for the ring.
  if (hero) hero.querySelectorAll('[data-palette]').forEach((a) => {
    const on = () => { hero.dataset.palette = a.dataset.palette; };
    const off = () => { delete hero.dataset.palette; };
    a.addEventListener('pointerenter', on); a.addEventListener('focus', on);
    a.addEventListener('pointerleave', off); a.addEventListener('blur', off);
  });

  const nav = document.querySelector('.nav');
  const navInner = nav.querySelector('.nav-inner');
  const measure = () => {
    // The pill hugs what's in it: "SW" (my name without its folds), a gap, the links, and the same room each side.
    const logo = nav.querySelector('.logo'), links = nav.querySelector('.links');
    const sw = logo.offsetWidth - [...logo.querySelectorAll('.fold')].reduce((t, f) => t + f.offsetWidth, 0);
    const w = navInner.clientWidth, pad = 24, pillW = Math.min(w, pad + sw + 30 + links.offsetWidth + pad);
    nav.style.setProperty('--pill-w', `${pillW}px`);
    nav.style.setProperty('--logo-shift', `${(w - pillW) / 2 + pad}px`);
    nav.style.setProperty('--links-shift', `${(w - pillW) / 2 + pad}px`);
    if (!hero) return;
    // Where the disc has to end up: centred on the screen and big enough to cover every corner.
    const H = hero.offsetHeight, W = innerWidth, R = disc.offsetWidth / 2;
    const halfDiag = Math.hypot(W / 2, H / 2) * 1.03;
    geo.scale = Math.max(1, halfDiag / R);
    geo.ty = H / 2 - (eclipse.offsetTop + R);
    geo.sceneTop = scene.offsetTop;
    geo.sceneLen = Math.max(1, scene.offsetHeight - innerHeight);
  };
  measure(); addEventListener('resize', () => { measure(); onScroll(); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(measure);

  let pill = false;
  function onScroll() {
    hs.target = !hero ? 0 : reduced ? 0 : clamp((scrollY - geo.sceneTop) / geo.sceneLen, 0, 1);
    wake();
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const setPill = (on) => { if (on !== pill) { pill = on; nav.classList.toggle('is-scrolled', on); } };

  function heroFrame() {
    let moving = false;
    if (!hero) { setPill(scrollY > 80); return lean(); }
    const p = lerp(hs.p, hs.target, .3);
    if (Math.abs(p - hs.target) > .0005) moving = true;
    hs.p = Math.abs(p - hs.target) < .0005 ? hs.target : p;
    const e = hs.p * hs.p * (3 - 2 * hs.p);
    // The pill forms once the disc has covered the hero, and only lets go well before it uncovers.
    if (!pill && (hs.p > .9 || scrollY > geo.sceneTop + geo.sceneLen + 10)) setPill(true);
    else if (pill && hs.p < .78 && scrollY < geo.sceneTop + geo.sceneLen) setPill(false);
    if (!hs.inView) return moving;

    const nx = fine && !reduced && pointer.seen ? clamp(pointer.x / innerWidth * 2 - 1, -1, 1) : 0;
    const ny = fine && !reduced && pointer.seen ? clamp(pointer.y / innerHeight * 2 - 1, -1, 1) : 0;
    const px = lerp(hs.px, nx, .06), py = lerp(hs.py, ny, .06);
    if (Math.abs(px - hs.px) + Math.abs(py - hs.py) > .0005) moving = true;
    hs.px = px; hs.py = py;
    const drift = 1 - e;
    const y = geo.ty * e, sc = 1 + (geo.scale - 1) * e;
    // The disc drifts against the pointer, so the brighter side of the ring follows you.
    disc.style.translate = `${(-px * 12 * drift).toFixed(2)}px ${(y - py * 8 * drift).toFixed(2)}px`;
    disc.style.scale = sc.toFixed(4);
    corona.style.translate = `${(px * 6 * drift).toFixed(2)}px ${(y + py * 4 * drift).toFixed(2)}px`;
    corona.style.scale = sc.toFixed(4);
    // The sun from the sky (sky.js) rides with the ring.
    sunGlow = sunGlow || eclipse.querySelector('.sun');
    if (sunGlow) { sunGlow.style.translate = corona.style.translate; sunGlow.style.scale = corona.style.scale; }
    // The words come towards you and fade, as if you were moving through them into the page.
    copy.style.transform = `translate3d(0, ${(-24 * e).toFixed(1)}px, 0) scale(${(1 + .22 * e).toFixed(4)})`;
    copy.style.opacity = String(clamp(1 - 1.15 * e, 0, 1));
    return moving;
  }

  // The homepage's arc leans with the pointer, as the first site's did: the disc drifts against it and the ring
  // with it, so the brighter side of the ring follows you.
  const hDisc = document.querySelector('.home .disc'), hRing = document.querySelector('.home .corona');
  function lean() {
    if (!hDisc || !fine || reduced || scrollY > innerHeight) return false;
    const nx = pointer.seen ? clamp(pointer.x / innerWidth * 2 - 1, -1, 1) : 0, ny = pointer.seen ? clamp(pointer.y / innerHeight * 2 - 1, -1, 1) : 0;
    const px = lerp(hs.px, nx, .06), py = lerp(hs.py, ny, .06), moving = Math.abs(px - hs.px) + Math.abs(py - hs.py) > .0005;
    hs.px = px; hs.py = py;
    hDisc.style.setProperty('--lx', `${(-px * 12).toFixed(2)}px`); hDisc.style.setProperty('--ly', `${(-py * 8).toFixed(2)}px`);
    hRing.style.setProperty('--lx', `${(px * 6).toFixed(2)}px`); hRing.style.setProperty('--ly', `${(py * 4).toFixed(2)}px`);
    return moving;
  }
  // Tonight's moon (lab: Horizon, Sun and moon): how much of it is lit, on the right while it's waxing.
  if (hDisc) {
    const syn = 29.530588853, age = ((Date.now() / 864e5 - 10962.76) % syn + syn) % syn, lit = (1 - Math.cos(2 * Math.PI * age / syn)) / 2;
    hDisc.style.setProperty('--moon', ((age < syn / 2 ? -1 : 1) * Math.max(.14, lit)).toFixed(3));
    /* Setting and rising (lab: Sun and moon). sink: 0 is up, .45 has its middle on the horizon, GONE is just out
       of sight. The sun is half down at sunset and gone the minute the page turns dark; the moon starts up that
       same minute and is clear half an hour later (and the reverse before dawn), so one of them is always there.
       What's drawn eases after that on a spring, so a jump in the time bar, or D, still sets and rises; and they
       swap only while hidden: the sun goes all the way down before the moon comes up. */
    const GONE = .84, signed = (m) => ((m + 720) % 1440 + 1440) % 1440 - 720;
    const flips = {}; // per day: the minute the page turns dark after sunset, and light before sunrise
    const flipOf = (ymd, s) => flips[ymd + s.rise] || (flips[ymd + s.rise] = (() => {
      const dark = (m) => window.__sky.at((m + 1440) % 1440, ymd).theme === 'dark';
      let dusk = s.set + 22, dawn = s.rise - 22;
      for (let m = s.set - 10; m < s.set + 120; m++) if (dark(m)) { dusk = m; break; }
      for (let m = s.rise + 10; m > s.rise - 120; m--) if (dark(m)) { dawn = m + 1; break; }
      return { dusk, dawn };
    })());
    const orb = { want: 'sun', is: '', to: 0, s: 0, v: 0, raf: 0, t: 0 };
    const draw = () => { hDisc.style.setProperty('--sink', orb.s.toFixed(4)); if (hDisc.dataset.orb !== orb.is) hDisc.dataset.orb = orb.is; };
    const spring = (t) => {
      const dt = Math.min(.04, (t - orb.t) / 1000 || .016); orb.t = t;
      const swapping = orb.is !== orb.want, goal = swapping ? 1.02 : orb.to;
      // Critically damped: it leaves gently and arrives without overshooting.
      const w = 7; orb.v += (w * w * (goal - orb.s) - 2 * w * orb.v) * dt; orb.s += orb.v * dt;
      if (swapping && orb.s >= GONE + .03) { orb.is = orb.want; orb.v *= .3; }
      const rest = !swapping && Math.abs(goal - orb.s) < .0008 && Math.abs(orb.v) < .004;
      if (rest) { orb.s = goal; orb.v = 0; }
      draw();
      orb.raf = rest ? 0 : requestAnimationFrame(spring);
    };
    document.addEventListener('sky:paint', () => {
      const n = window.__sky?.now?.(), s = n && window.__sky.sun(n.ymd), dark = root.dataset.theme === 'dark';
      orb.want = dark ? 'moon' : 'sun'; orb.to = 0;
      if (s && root.dataset.mode === 'sky') {
        const f = flipOf(n.ymd, s), sq = (x) => x * x, k01 = (x) => clamp(x, 0, 1);
        if (dark) { const up = (x) => { const k = k01(x / 30); return k * k * (3 - 2 * k); }; orb.to = GONE * (1 - Math.min(up((n.min - f.dusk + 2880) % 1440), up((f.dawn - n.min + 2880) % 1440))); } // minutes since dark, minutes until light
        else {
          const a = signed(n.min - s.set), b = signed(s.rise - n.min); // minutes after sunset, minutes before sunrise
          const down = a <= 0 ? .45 * sq(k01(1 + a / 55)) : .45 + (GONE - .45) * k01(a / Math.max(1, f.dusk - s.set));
          const rise = b <= 0 ? .45 * sq(k01(1 + b / 55)) : .45 + (GONE - .45) * k01(b / Math.max(1, s.rise - f.dawn));
          orb.to = Math.max(down, rise);
        }
      }
      // The first paint, and reduced motion: just be there.
      if (!orb.is || reduced) { orb.is = orb.want; orb.s = orb.to; orb.v = 0; draw(); return; }
      if (!orb.raf && (orb.is !== orb.want || Math.abs(orb.to - orb.s) > .0008)) { orb.t = performance.now(); orb.raf = requestAnimationFrame(spring); }
    });
  }

  /* ── Videos loop only while they are on screen; with reduced motion they wait for a press ── */
  document.querySelectorAll('video[data-inview]').forEach((v) => {
    // Decorative loops (data-inview="ambient") just stay on their first frame.
    if (reduced) { if (v.dataset.inview !== 'ambient') v.controls = true; return; }
    let visible = false;
    const sync = () => { if (visible && !document.hidden) v.play().catch(() => {}); else v.pause(); };
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; sync(); }, { threshold: .2 }).observe(v);
    document.addEventListener('visibilitychange', sync);
  });

  const loops = [...document.querySelectorAll('.corona, .ship-pip, .live')];
  const visibleLoops = new Set();
  const syncLoops = () => loops.forEach(el => el.classList.toggle('motion-paused', document.hidden || !visibleLoops.has(el)));
  const loopObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) visibleLoops.add(e.target); else visibleLoops.delete(e.target); });
    syncLoops();
  });
  loops.forEach(el => loopObserver.observe(el));
  document.addEventListener('visibilitychange', syncLoops);

  /* ── Reveal and count-up ── */
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in'); io.unobserve(en.target);
    en.target.querySelectorAll('[data-count]').forEach(countUp);
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  function countUp(el) {
    const end = +el.dataset.count, suffix = el.dataset.suffix || '';
    const fmt = (v) => Math.round(v).toLocaleString('en-GB') + suffix;
    if (reduced) { el.textContent = fmt(end); return; }
    el.style.minWidth = `${el.offsetWidth}px`;
    const t0 = performance.now(), dur = 1600;
    const step = (t) => {
      const p = clamp((t - t0) / dur, 0, 1);
      el.textContent = fmt(end * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(0); requestAnimationFrame(step);
  }

  /* ── Project tip: rides above the cursor, says where a click goes ── */
  // The calm homepage (body.calm) has no tip and no tilting cards.
  const calm = document.body.classList.contains('calm');
  const tip = document.querySelector('.tip');
  const tipText = tip && tip.querySelector('.tip-text');
  const tipPos = { x: pointer.x, y: pointer.y, on: false };
  if (tip && fine && !reduced) {
    document.addEventListener('pointerover', (e) => {
      const item = e.target.closest('[data-cursor]');
      if (!item) { clearTimeout(tipPos.t); tip.classList.remove('is-on'); tipPos.on = false; return; }
      const link = item.matches('a') ? item : item.querySelector('a.card, a.card-link');
      const kind = !link ? 'soon' : link.target === '_blank' ? 'out' : 'in';
      tipText.textContent = item.dataset.cursor;
      tip.querySelector('i').style.display = kind === 'soon' ? '' : 'none';
      tip.querySelector('.tip-arrow').style.display = kind === 'soon' ? 'none' : '';
      tip.querySelector('.tip-arrow').style.rotate = kind === 'in' ? '45deg' : '0deg';
      if (!tipPos.on) { tipPos.x = pointer.x; tipPos.y = pointer.y; }
      tipPos.on = true; wake();
      clearTimeout(tipPos.t); tipPos.t = setTimeout(() => { if (tipPos.on) tip.classList.add('is-on'); }, 220);
    });
    document.addEventListener('pointerleave', () => { tip.classList.remove('is-on'); tipPos.on = false; });
  }

  /* ── Glass cards: tilt with depth between layers, light behind the glass, lit border ── */
  // The card paints an opaque base (so it can light its own border), so its colour layer lives inside it too.
  document.querySelectorAll('.item').forEach((el) => {
    const bleed = el.querySelector(':scope > .bleed'), card = el.querySelector('.card');
    if (bleed && card) card.prepend(bleed.cloneNode(true));
  });
  const items = [...document.querySelectorAll('.item')].map((el) => ({
    el, card: el.querySelector('.card'), media: el.querySelector('.media'),
    blobs: [...el.querySelectorAll('.blob, .blob-img')],
    layers: [...el.querySelectorAll('[data-depth]')].map((l) => ({ el: l, d: +l.dataset.depth })),
    tx: 0, ty: 0, x: 0, y: 0, light: null,
  }));
  items.forEach((it) => {
    if (!fine || reduced || calm) return;
    it.el.addEventListener('pointerenter', () => { it.el.classList.add('is-hot'); wake(); });
    it.el.addEventListener('pointerleave', () => { it.el.classList.remove('is-hot'); it.tx = 0; it.ty = 0; wake(); });
    it.el.addEventListener('pointermove', (e) => {
      const r = it.el.getBoundingClientRect();
      it.tx = clamp((e.clientX - r.left) / r.width - .5, -.5, .5);
      it.ty = clamp((e.clientY - r.top) / r.height - .5, -.5, .5);
      it.light = [e.clientX - r.left, e.clientY - r.top];
      wake();
    });
  });

  function cardsFrame() {
    let moving = false;
    items.forEach((it) => {
      if (it.light) {
        it.el.style.setProperty('--rx', `${it.light[0].toFixed(0)}px`);
        it.el.style.setProperty('--ry', `${it.light[1].toFixed(0)}px`);
        it.light = null;
      }
      const nx = lerp(it.x, it.tx, .08), ny = lerp(it.y, it.ty, .08);
      if (Math.abs(nx - it.x) + Math.abs(ny - it.y) < .0004) { it.x = it.tx; it.y = it.ty; return; }
      it.x = nx; it.y = ny; moving = true;
      // The card stays flat: the light on its edge and the layers sliding are enough.
      // Layers slide by their depth: back layers against the pointer, front layers with it.
      it.layers.forEach((l) => { l.el.style.translate = `${(it.x * 60 * l.d).toFixed(1)}px ${(it.y * 42 * l.d).toFixed(1)}px`; });
      it.blobs.forEach((b, i) => { const k = 50 + i * 22; b.style.transform = `translate3d(${(it.x * k).toFixed(1)}px, ${(it.y * k * .8).toFixed(1)}px, 0)`; });
    });
    return moving;
  }

  /* ── One loop ── */
  function wake() { if (!document.hidden && !running) { running = true; requestAnimationFrame(frame); } }
  function frame() {
    if (document.hidden) { running = false; return; }
    const a = heroFrame(), b = cardsFrame();
    let c = false;
    if (tipPos.on) {
      tipPos.x = lerp(tipPos.x, pointer.x, .16); tipPos.y = lerp(tipPos.y, pointer.y, .16);
      tip.style.transform = `translate3d(${(tipPos.x + 16).toFixed(1)}px, ${(tipPos.y - 46).toFixed(1)}px, 0)`;
      c = Math.abs(tipPos.x - pointer.x) + Math.abs(tipPos.y - pointer.y) > .1;
    }
    if (a || b || c) requestAnimationFrame(frame); else running = false;
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  wake();

  /* ── Brain Dump runs through the app while it is on screen ── */
  const brain = document.querySelector('.t-brain');
  if (brain) {
    const shots = [...brain.querySelectorAll('.shots img')];
    const steps = [...brain.querySelectorAll('.steps i')];
    let i = 0, timer = null;
    const show = (n) => {
      shots.forEach((s, k) => s.classList.toggle('is-on', k === n));
      steps.forEach((s, k) => s.classList.toggle('is-on', k === n));
      brain.classList.toggle('is-listening', shots[n].hasAttribute('data-listen'));
    };
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !reduced) { if (!timer) timer = setInterval(() => { i = (i + 1) % shots.length; show(i); }, 2600); }
      else { clearInterval(timer); timer = null; }
    };
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; sync(); }, { threshold: .35 }).observe(brain);
    document.addEventListener('visibilitychange', sync);
  }

  /* ── Contact: email opens the mail app, copy copies, a gentle pull on hover ── */
  const copyBtn = document.querySelector('.copy');
  if (copyBtn) {
    const label = copyBtn.querySelector('.copy-label');
    copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(copyBtn.dataset.email); } catch (e) { return; }
      label.textContent = 'Copied'; copyBtn.classList.add('is-copied');
      setTimeout(() => { label.textContent = 'Copy'; copyBtn.classList.remove('is-copied'); }, 2200);
    });
  }
})();

/* The Herring Net in the About sentence: click it and it grows out of the line into a pop-up; any click or Esc
   sends it back to its spot. */
(() => {
  const btn = document.querySelector('.in-art-btn'), dlg = document.querySelector('.art-zoom');
  if (!btn || !dlg) return;
  const small = btn.querySelector('img'), big = dlg.querySelector('img');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  let busy = false;
  const fly = (back) => {
    big.getAnimations().forEach((a) => a.cancel());
    const a = small.getBoundingClientRect(), b = big.getBoundingClientRect();
    const from = `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px, ${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(${a.width / b.width}) rotate(-3deg)`;
    const kf = [{ transform: from, borderRadius: '2px' }, { transform: 'none', borderRadius: '8px' }];
    return big.animate(back ? kf.reverse() : kf, { duration: still.matches ? 0 : 480, easing: 'cubic-bezier(.2, .9, .25, 1)', fill: 'both' });
  };
  btn.addEventListener('click', () => {
    dlg.showModal(); small.style.visibility = 'hidden';
    requestAnimationFrame(() => dlg.classList.add('is-open'));
    fly(false);
  });
  const close = async () => {
    if (busy) return; busy = true;
    dlg.classList.remove('is-open');
    await fly(true).finished.catch(() => {});
    dlg.close(); small.style.visibility = ''; busy = false;
  };
  dlg.addEventListener('click', close);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
})();
