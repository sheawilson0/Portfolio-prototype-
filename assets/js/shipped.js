/* Shipped: everything I've made, from assets/data/shipped.json.
   On the homepage it's the stack of cards on the horizon (drag, flick, arrows or keys), the "Last shipped"
   line and the Shipped tile. On /shipped/ it's the timeline. Hearts are only kept in the visitor's browser
   for now; counts and a leaderboard need a small database. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const day = (d) => new Date(`${d}T12:00:00`);
  const short = (d) => { const x = day(d); return `${x.getDate()} ${MONTHS[x.getMonth()]}`; };
  function ago(d) {
    const t = new Date(); t.setHours(12, 0, 0, 0);
    const n = Math.round((t - day(d)) / 864e5);
    return n <= 0 ? 'today' : n === 1 ? 'yesterday' : n < 7 ? `${n} days ago` : `on ${short(d)}`;
  }
  const id = (s) => `${s.d}-${s.t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  const link = (s) => s.wraps ? `/shipped/#${id(s)}` : s.href || `/shipped/#${id(s)}`;
  const LOCK = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="2.5" y="5.5" width="7" height="5" rx="1.2"/><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5"/></svg>';

  /* One quiet sound: a card leaving the stack. Short filtered noise, made on the spot. */
  let ctx = null;
  function flick() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const len = ctx.sampleRate * .07, buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = .8; g.gain.value = .07;
      src.buffer = buf; src.connect(bp).connect(g).connect(ctx.destination); src.start();
    } catch (e) {}
  }

  fetch('/assets/data/shipped.json').then((r) => r.json()).then(({ ships }) => {
    ships = ships.filter((s) => !s.draft).sort((a, b) => b.d.localeCompare(a.d));
    if (!ships.length) return;
    home(ships);
    timeline(ships);
  }).catch(() => {});

  /* ───────── Homepage ───────── */
  function home(ships) {
    const latest = ships.find((s) => !s.wraps) || ships[0];
    const last = document.querySelector('.last');
    if (last) last.innerHTML = `Last shipped <a href="${esc(link(latest))}">${esc(latest.t)}</a> ${ago(latest.d)}.`;
    const count = document.querySelector('[data-ship-count]');
    if (count) count.textContent = ships.length;
    const list = document.querySelector('[data-ship-list]');
    if (list) list.innerHTML = ships.slice(0, 6).map((s) => `<span class="st-row${s.wraps ? ' is-wraps' : ''}"><time>${short(s.d)}</time><span>${esc(s.t)}</span></span>`).join('');
    const stack = document.querySelector('.stack');
    if (stack) makeStack(stack, ships);
  }

  function card(s) {
    const media = s.img && !s.wraps
      ? `<img src="${esc(s.img)}" alt="" loading="lazy" decoding="async" draggable="false">`
      : `<span class="ship-word">${esc(s.t)}</span>${s.wraps ? `<span class="wraps-tag">${LOCK}Under wraps</span>` : ''}`;
    return `<span class="ship-top"><b>${esc(s.p)}</b><span>${ago(s.d).replace(/^on /, '')}</span></span>
      <span class="ship-media">${media}</span>
      <span class="ship-text">${s.img || s.wraps ? `<h3>${esc(s.wraps ? 'Client work' : s.t)}</h3>` : ''}<p>${esc(s.wraps ? 'Out soon. It unblurs when it launches.' : s.l)}</p></span>`;
  }

  function makeStack(stack, ships) {
    const els = ships.map((s, i) => {
      const a = document.createElement('a');
      a.className = `ship${s.wraps ? ' is-wraps' : ''}`;
      a.href = link(s); a.draggable = false; a.tabIndex = -1;
      a.setAttribute('aria-label', `${s.wraps ? 'Client work, under wraps' : s.t}, shipped ${ago(s.d)}`);
      a.innerHTML = card(s);
      stack.append(a);
      return a;
    });
    stack.tabIndex = 0;
    const hint = document.createElement('div');
    hint.className = 'stack-hint';
    hint.innerHTML = `<button type="button" data-step="-1" aria-label="Previous"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 3l-3 3 3 3"/></svg></button><output aria-live="polite"></output><button type="button" data-step="1" aria-label="Next"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 3l3 3-3 3"/></svg></button>`;
    stack.append(hint);
    const out = hint.querySelector('output');
    // Open on the newest thing people can actually see; under-wraps cards are one flick back.
    let top = Math.max(0, ships.findIndex((s) => !s.wraps));

    // The three behind fan up and back, so it reads as a pile you can go through.
    function layout() {
      els.forEach((el, i) => {
        const k = (i - top + els.length) % els.length;
        el.classList.toggle('is-top', k === 0);
        el.style.zIndex = String(els.length - k);
        el.style.opacity = k < 4 ? '1' : '0';
        el.style.transform = k === 0 ? 'none' : `translateY(${-k * 12}px) scale(${1 - k * .05}) rotate(${(k % 2 ? -1 : 1) * k * 1.6}deg)`;
      });
      out.textContent = `${top + 1} / ${els.length}`;
    }
    function step(dir, flung) {
      const el = els[top];
      if (dir > 0) {
        const x = flung || 1;
        el.style.transform = `translate(${x * 120}%, -6%) rotate(${x * 14}deg)`;
        el.style.opacity = '0';
        top = (top + 1) % els.length;
        setTimeout(layout, reduced ? 0 : 260);
      } else {
        top = (top - 1 + els.length) % els.length;
        const back = els[top];
        back.style.transition = 'none'; back.style.transform = 'translate(-120%, -6%) rotate(-14deg)'; back.style.opacity = '0'; back.style.zIndex = String(els.length + 1);
        void back.offsetWidth; back.style.transition = '';
        layout();
      }
      flick();
    }
    hint.addEventListener('click', (e) => { const b = e.target.closest('[data-step]'); if (b) step(+b.dataset.step); });
    stack.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      if (e.key === 'Enter') location.href = els[top].href;
    });

    // Drag the top card. A short tap opens it; a throw sends it to the back.
    let drag = null;
    stack.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.ship.is-top');
      if (!el || e.button !== 0) return;
      drag = { el, x: e.clientX, y: e.clientY, dx: 0, t: performance.now(), vx: 0, lx: e.clientX, lt: performance.now() };
      el.setPointerCapture(e.pointerId);
    });
    stack.addEventListener('pointermove', (e) => {
      if (!drag) return;
      drag.dx = e.clientX - drag.x;
      const dy = (e.clientY - drag.y) * .25, now = performance.now();
      drag.vx = (e.clientX - drag.lx) / Math.max(1, now - drag.lt); drag.lx = e.clientX; drag.lt = now;
      if (Math.abs(drag.dx) > 4) drag.el.classList.add('is-dragging');
      drag.el.style.transform = `translate(${drag.dx}px, ${dy}px) rotate(${drag.dx * .05}deg)`;
    });
    const end = () => {
      if (!drag) return;
      const { el, dx, vx } = drag; drag = null;
      el.classList.remove('is-dragging');
      if (Math.abs(dx) > 4) el.dataset.moved = '1';
      if (Math.abs(dx) > 90 || Math.abs(vx) > .6) step(1, Math.sign(dx || vx));
      else el.style.transform = 'none';
    };
    stack.addEventListener('pointerup', end);
    stack.addEventListener('pointercancel', end);
    // A drag shouldn't count as a click.
    stack.addEventListener('click', (e) => {
      const el = e.target.closest('.ship');
      if (el && (el.dataset.moved || el.classList.contains('is-dragging'))) { e.preventDefault(); delete el.dataset.moved; }
    }, true);
    layout();
  }

  /* ───────── /shipped/ ───────── */
  function timeline(ships) {
    const root = document.querySelector('[data-timeline]');
    if (!root) return;
    const read = () => { try { return new Set(JSON.parse(localStorage.getItem('shipped-hearts') || '[]')); } catch (e) { return new Set(); } };
    const hearts = read();
    const save = () => { try { localStorage.setItem('shipped-hearts', JSON.stringify([...hearts])); } catch (e) {} };
    const first = ships[ships.length - 1];
    document.querySelectorAll('[data-ship-count]').forEach((n) => { n.textContent = ships.length; });
    document.querySelectorAll('[data-ship-since]').forEach((n) => { n.textContent = LONG[day(first.d).getMonth()]; });
    const filters = document.querySelector('[data-filters]');
    let kind = 'all';

    function render() {
      const list = ships.filter((s) => kind === 'all' || s.k === kind);
      let month = '', html = '';
      list.forEach((s) => {
        const m = s.d.slice(0, 7);
        if (m !== month) { if (month) html += '</ol>'; month = m; html += `<h2 class="tl-month">${LONG[+m.slice(5) - 1]} ${m.slice(0, 4)}</h2><ol class="tl-list">`; }
        const key = id(s), on = hearts.has(key);
        const title = s.wraps ? 'Client work' : esc(s.t);
        const body = s.wraps ? `<p class="tl-line is-blur" aria-hidden="true">${esc(s.l)}</p><p class="tl-wraps">${LOCK}Under wraps until it launches</p>` : `<p class="tl-line">${esc(s.l)}</p>`;
        const thumb = s.img && !s.wraps ? `<img class="tl-thumb" src="${esc(s.img)}" alt="" loading="lazy" decoding="async">` : '';
        const open = s.href && !s.wraps ? `<a class="tl-open" href="${esc(s.href)}">Open<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg></a>` : '';
        html += `<li class="tl-item${s.wraps ? ' is-wraps' : ''}" id="${key}">
          <time datetime="${s.d}">${short(s.d)}</time>
          <div class="tl-body"><p class="tl-project">${esc(s.p)}</p><h3>${title}</h3>${body}${open}</div>
          ${thumb}
          <button class="tl-heart${on ? ' is-on' : ''}" type="button" data-key="${key}" aria-pressed="${on}" aria-label="Like ${title}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.6S2 10.1 2 6.1A3.1 3.1 0 0 1 8 4.6a3.1 3.1 0 0 1 6 1.5c0 4-6 7.5-6 7.5z"/></svg></button>
        </li>`;
      });
      root.innerHTML = html + (month ? '</ol>' : '');
      if (location.hash) document.getElementById(location.hash.slice(1))?.classList.add('is-target');
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('.tl-heart');
      if (!b) return;
      const k = b.dataset.key, on = !hearts.has(k);
      on ? hearts.add(k) : hearts.delete(k); save();
      b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
      if (on && !reduced) { b.classList.remove('is-pop'); void b.offsetWidth; b.classList.add('is-pop'); }
    });
    filters?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-kind]');
      if (!b) return;
      kind = b.dataset.kind;
      filters.querySelectorAll('[data-kind]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    });
    render();
  }
})();
