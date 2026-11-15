/* The lab bar on the case pages (Snapshot, Quit28, JumpStart, Brain Dump). Same look as the homepage's lab.js, kept
   separate so the two can change apart. Each row sets a data attribute on <body>; case.css does the rest. */
(() => {
  const live = /(^|\.)sheawilson\.uk$|\.vercel\.app$/.test(location.hostname);
  if (live && !new URLSearchParams(location.search).has('lab')) return;
  // [attribute, label, options, the recommended one]
  const ROWS = [
    ['credits', 'Credits', [['all', 'Role, client, team, when'], ['two', 'Role and team'], ['team', 'Team only']], 'all'],
    ['next', 'Next project', [['glass', 'Glass card'], ['name', 'Just the name']], 'glass'],
  ].filter(([k]) => k !== 'credits' || document.querySelector('.facts'));
  if (!ROWS.length) return; // nothing open just now
  const KEY = 'case-lab-1'; // 15 Nov: credits and next project
  const get = (k) => { try { return JSON.parse(localStorage.getItem(KEY) || '{}')[k]; } catch (e) { return null; } };
  const set = (k, v) => { try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); o[k] = v; localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  // A row lives wherever index.html put its default: on <html> (set before anything paints) or on <body>.
  const el = (k) => (k in document.documentElement.dataset ? document.documentElement : document.body);
  const apply = (k, v) => { el(k).dataset[k] = v; };
  // A saved choice that's no longer an option falls back to my pick.
  ROWS.forEach(([k, , opts]) => { const v = get(k); if (opts.some((o) => o[0] === v)) apply(k, v); });


  const css = document.createElement('style');
  css.textContent = `.lab{position:fixed;z-index:90;left:16px;bottom:16px;width:268px;max-height:calc(100svh - 32px);overflow:auto;padding:12px 12px 6px;border-radius:18px;font:400 12px/1.3 var(--sans);color:var(--ink);background:var(--glass-strong);border:1px solid var(--glass-line);box-shadow:0 20px 50px rgba(0,0,0,.18);-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6)}
.lab.is-shut .lab-row{display:none}.lab-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.lab-head b{font-weight:500}.lab-head button{color:var(--whisper)}
.lab-row{margin-bottom:8px}.lab-row p{color:var(--whisper);margin-bottom:4px}.lab-opts{display:flex;flex-wrap:wrap;gap:4px}
.lab-opts button{position:relative;height:26px;padding:0 10px;border-radius:999px;background:color-mix(in srgb,var(--ink) 6%,transparent);color:var(--ink-2)}
.lab-opts button[aria-pressed="true"]{background:var(--ink);color:var(--bg)}.lab-opts button.is-pick::after{content:"";position:absolute;top:2px;right:2px;width:5px;height:5px;border-radius:50%;background:#2fd67b}`;
  document.head.append(css);
  const bar = document.createElement('aside');
  bar.className = 'lab'; bar.setAttribute('aria-label', 'Lab');
  bar.innerHTML = `<div class="lab-head"><b>Lab</b><button type="button" data-shut>Hide</button></div>` + ROWS.map(([k, label, opts, rec]) =>
    `<div class="lab-row"><p>${label}</p><div class="lab-opts">${opts.map(([v, name]) =>
      `<button type="button" data-k="${k}" data-v="${v}" class="${v === rec ? 'is-pick' : ''}" aria-pressed="${el(k).dataset[k] === v}">${name}</button>`).join('')}</div></div>`).join('');
  document.body.append(bar);
  bar.addEventListener('click', (e) => {
    if (e.target.closest('[data-shut]')) { bar.classList.toggle('is-shut'); e.target.textContent = bar.classList.contains('is-shut') ? 'Show' : 'Hide'; return; }
    const b = e.target.closest('[data-k]');
    if (!b) return;
    apply(b.dataset.k, b.dataset.v); set(b.dataset.k, b.dataset.v);
    bar.querySelectorAll(`[data-k="${b.dataset.k}"]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
})();
