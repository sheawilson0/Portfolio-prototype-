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
  function object(s) {
    if (s.wraps) return `<span class="obj obj-tile is-wraps"><span class="obj-blur"></span>${LOCK}</span>`;
    const img = s.img ? `<img src="${esc(s.img)}" alt="" loading="lazy" decoding="async" draggable="false">` : '';
    switch (s.img && s.o) {
      case 'icon': return `<span class="obj obj-icon">${img}</span>`;
      case 'cutout': return `<span class="obj obj-cutout">${img}</span>`;
      case 'phone': return `<span class="obj obj-phone"><span>${img}</span></span>`;
      case 'screen': return `<span class="obj obj-screen"><i></i><span>${img}</span></span>`;
      default: return `<span class="obj obj-tile"><b>${esc(s.p.charAt(0))}</b></span>`;
    }
  }

  /* One quiet sound: a soft tick, for passing a mark on the scrubber. */
  let ctx = null, lastTick = 0;
  function tick(pitch = 1) {
    const now = performance.now();
    if (now - lastTick < 45) return; lastTick = now;
    try {
      if (!ctx || ctx.state !== 'running') return;
      const len = ctx.sampleRate * .025, buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
      const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      bp.type = 'bandpass'; bp.frequency.value = 3200 * pitch; bp.Q.value = 1.4; g.gain.value = .05;
      src.buffer = buf; src.connect(bp).connect(g).connect(ctx.destination); src.start();
    } catch (e) {}
  }
  // Browsers only allow sound after a press, so the first press or key wakes it.
  const wakeAudio = () => { try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); } catch (e) {} };
  addEventListener('pointerdown', wakeAudio, { once: true, capture: true });
  addEventListener('keydown', wakeAudio, { once: true, capture: true });

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

  /* ───────── /shipped/ ───────── */
  function street(all) {
    const root = document.querySelector('[data-street]');
    if (!root) return;
    const track = root.querySelector('.st-track'), ticks = root.querySelector('.st-ticks');
    const read = () => { try { return new Set(JSON.parse(localStorage.getItem('shipped-hearts') || '[]')); } catch (e) { return new Set(); } };
    const hearts = read();
    const save = () => { try { localStorage.setItem('shipped-hearts', JSON.stringify([...hearts])); } catch (e) {} };
    let kind = 'all', items = [], marks = [], current = -1;

    function render(focusId) {
      const hideSmall = document.body.dataset.small === 'hide';
      const list = all.filter((s) => (kind === 'all' || s.k === kind) && !(hideSmall && s.minor)).slice().reverse(); // oldest left, newest right
      track.innerHTML = list.map((s) => {
        const key = id(s), on = hearts.has(key), title = s.wraps ? 'Client work' : esc(s.t);
        const open = s.href && !s.wraps ? `<a class="st-open" href="${esc(s.href)}">Open<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg></a>` : '';
        return `<li class="st-item${s.wraps ? ' is-wraps' : ''}${s.minor ? ' is-minor' : ''}" id="${key}">
          <button class="st-hit" type="button" aria-expanded="false" aria-label="${title}, ${short(s.d)}"></button>
          <time datetime="${s.d}">${when(s.d)}</time>
          <span class="st-stand">${object(s)}</span>
          <h2>${title}</h2>
          <p class="st-p">${esc(s.wraps ? 'Under wraps' : s.p)}</p>
          <div class="st-more">
            <p${s.wraps ? ' class="is-blur" aria-hidden="true"' : ''}>${esc(s.l)}</p>
            <div class="st-acts">${open}<button class="st-heart${on ? ' is-on' : ''}" type="button" data-key="${key}" aria-pressed="${on}" aria-label="Like ${title}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.6S2 10.1 2 6.1A3.1 3.1 0 0 1 8 4.6a3.1 3.1 0 0 1 6 1.5c0 4-6 7.5-6 7.5z"/></svg></button></div>
          </div>
        </li>`;
      }).join('');
      items = [...track.children];
      // One tick per ship; the first of each month stands taller and carries its name.
      let month = '';
      let lastLabel = -9;
      ticks.innerHTML = list.map((s, i) => {
        const m = s.d.slice(0, 7), first = m !== month; month = m;
        const label = first && i - lastLabel > 3; if (label) lastLabel = i;
        return `<i class="st-tick${first ? ' is-month' : ''}">${label ? `<span>${MONTHS[+m.slice(5) - 1]}</span>` : ''}</i>`;
      }).join('');
      marks = [...ticks.children];
      current = -1;
      const target = focusId && items.find((el) => el.id === focusId);
      requestAnimationFrame(() => {
        if (target) { centre(target, false); select(target); }
        else if (document.body.dataset.newest === 'middle') centre(items[items.length - 1], false);
        else track.scrollLeft = track.scrollWidth;
        onScroll();
      });
    }

    const centre = (el, smooth = true) => track.scrollTo({ left: el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2, behavior: smooth && !reduced ? 'smooth' : 'auto' });
    function select(el) {
      const open = !el.classList.contains('is-open');
      items.forEach((x) => { const on = x === el && open; x.classList.toggle('is-open', on); x.querySelector('.st-hit').setAttribute('aria-expanded', String(on)); });
      track.classList.toggle('has-open', open);
      history.replaceState(null, '', open ? `#${el.id}` : location.pathname);
    }

    // Which ship is in focus: the one nearest the middle, or (newest on the right edge) how far along you are.
    // Ticks swell in a wave around it, and around the pointer when it's over the scrubber; objects near
    // the middle stand a touch taller. Passing a ship makes the soft tick sound.
    let pointerTick = null, raf = 0;
    function focusIndex() {
      if (document.body.dataset.newest === 'middle') {
        const mid = track.scrollLeft + track.clientWidth / 2;
        let best = 0, bestD = Infinity;
        items.forEach((el, i) => { const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
        return best;
      }
      const max = track.scrollWidth - track.clientWidth;
      return max > 0 ? Math.round(track.scrollLeft / max * (items.length - 1)) : items.length - 1;
    }
    function wave() {
      raf = 0;
      const mid = track.scrollLeft + track.clientWidth / 2, w = track.clientWidth / 2;
      items.forEach((el) => {
        const d = Math.min(1, Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid) / w);
        el.style.setProperty('--near', (1 - d * d).toFixed(3));
      });
      const at = pointerTick ?? current;
      marks.forEach((m, i) => { const k = Math.abs(i - at); m.style.setProperty('--lift', (Math.exp(-(k * k) / 6)).toFixed(3)); });
    }
    const queue = () => { if (!raf) raf = requestAnimationFrame(wave); };
    function onScroll() {
      const best = focusIndex();
      if (best !== current) {
        if (current !== -1) tick(marks[best]?.classList.contains('is-month') ? .75 : 1);
        marks[current]?.classList.remove('is-on'); marks[best]?.classList.add('is-on'); current = best;
      }
      queue();
    }
    ticks.addEventListener('pointermove', (e) => {
      const r = ticks.getBoundingClientRect();
      pointerTick = Math.max(0, Math.min(marks.length - 1, (e.clientX - r.left) / r.width * (marks.length - 1)));
      queue();
    });
    ticks.addEventListener('pointerleave', () => { pointerTick = null; queue(); });
    track.addEventListener('scroll', onScroll, { passive: true });

    // A mouse wheel moves the street sideways.
    track.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault(); track.scrollLeft += e.deltaY;
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
      if (Math.abs(dx) > 4 && !drag.moved) { drag.moved = true; track.classList.add('is-dragging'); }
      if (drag.moved) track.scrollLeft = drag.left - dx;
    });
    addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved; drag = null; track.classList.remove('is-dragging');
      if (moved) { track.dataset.moved = '1'; setTimeout(() => delete track.dataset.moved, 0); }
    });

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
      if (el) { select(el); centre(el); }
    });

    // The scrubber: press or drag along the ticks.
    let scrub = false;
    const scrubTo = (x) => {
      const r = ticks.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (x - r.left) / r.width));
      if (document.body.dataset.newest === 'middle') centre(items[Math.round(p * (items.length - 1))], false);
      else track.scrollLeft = p * (track.scrollWidth - track.clientWidth);
    };
    ticks.addEventListener('pointerdown', (e) => { scrub = true; ticks.setPointerCapture(e.pointerId); scrubTo(e.clientX); });
    ticks.addEventListener('pointermove', (e) => { if (scrub) scrubTo(e.clientX); });
    ticks.addEventListener('pointerup', () => { scrub = false; });

    addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step || e.target.closest('input, textarea')) return;
      e.preventDefault();
      centre(items[Math.max(0, Math.min(items.length - 1, current + step))]);
    });

    const filters = document.querySelector('[data-filters]');
    filters?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-kind]');
      if (!b) return;
      kind = b.dataset.kind;
      filters.querySelectorAll('[data-kind]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    });
    new MutationObserver(() => render()).observe(document.body, { attributes: true, attributeFilter: ['data-newest', 'data-small'] });
    render(decodeURIComponent(location.hash.slice(1)));
  }
})();
