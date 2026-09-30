/* sheawilson.uk/links
   One list of links, five ways to show it. The lab bar switches between them; on the live site it only
   appears with ?lab, so visitors see whichever style is set as DEFAULT_STYLE. */
(() => {
  const root = document.documentElement;
  const app = document.getElementById('app');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEFAULT_STYLE = 'eclipse';

  /* ───────── Links ─────────
     hidden: kept here, never shown (YouTube waits until there's something on it).
     extra: suggestions, switchable from the lab bar so they can be judged with and without. */
  const LINKS = [
    { id: 'portfolio', label: 'Portfolio', short: 'Portfolio', sub: 'sheawilson.uk', href: 'https://sheawilson.uk', icon: 'ring', palette: 'portfolio', featured: true, status: 'Boarding' },
    { id: 'linkedin', label: 'LinkedIn', short: 'LinkedIn', sub: 'in/sheawilson0', href: 'https://www.linkedin.com/in/sheawilson0/', icon: 'linkedin', palette: 'linkedin', tone: '#0a66c2', status: 'On time' },
    { id: 'instagram', label: 'Instagram', short: 'Instagram', sub: '@sheawilson0', href: 'https://www.instagram.com/sheawilson0/', icon: 'instagram', palette: 'instagram', tone: '#e1306c', status: 'On time' },
    { id: 'x', label: 'X', short: 'X', sub: '@sheawilson0', href: 'https://x.com/sheawilson0', icon: 'x', palette: 'x', tone: 'var(--ink)', status: 'On time' },
    { id: 'github', label: 'GitHub', short: 'GitHub', sub: '@sheawilson0', href: 'https://github.com/sheawilson0', icon: 'github', palette: 'github', tone: 'var(--ink)', status: 'On time' },
    { id: 'threads', label: 'Threads', short: 'Threads', sub: '@sheawilson0', href: 'https://www.threads.net/@sheawilson0', icon: 'threads', palette: 'x', tone: 'var(--ink)', status: 'Soon', hidden: true },
    { id: 'youtube', label: 'YouTube', short: 'YouTube', sub: '@sheawilson0', href: 'https://www.youtube.com/@sheawilson0', icon: 'youtube', palette: 'youtube', tone: '#ff0033', status: 'Soon', hidden: true },
    { id: 'email', label: 'Email me', short: 'Email', sub: 'design@sheawilson.uk', href: 'mailto:design@sheawilson.uk', icon: 'mail', palette: 'email', tone: '#ff6a1a', status: 'Open', extra: true },
    { id: 'world', label: 'Walk through my work in 3D', short: 'In 3D', sub: 'sheawilson.uk/ar', href: 'https://sheawilson.uk/ar/world.html', icon: 'cube', palette: 'world', tone: '#8a3cff', status: 'Open', extra: true },
  ];
  const CONTACT = '/links/shea-wilson.vcf';
  const PHOTO = '/links/shea.jpg';

  const ICONS = {
    x: { fill: 'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z' },
    instagram: { fill: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077' },
    youtube: { fill: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
    linkedin: { fill: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
    github: { fill: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' },
    threads: { fill: 'M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z' },
    mail: { stroke: 'M3.5 6.5h17v11h-17z M4 7l8 6 8-6' },
    cube: { stroke: 'M12 3l8 4.5v9L12 21l-8-4.5v-9z M4 7.5l8 4.5 8-4.5 M12 12v9' },
    ring: { ring: true },
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const attrs = (l) => `href="${esc(l.href)}"${/^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : ''}`;
  const icon = (name, cls = 'ico') => {
    const i = ICONS[name];
    if (i.ring) return `<span class="${cls} ring-mark" aria-hidden="true"></span>`;
    if (i.stroke) return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="${i.stroke}"/></svg>`;
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${i.fill}"/></svg>`;
  };
  const ARROW = '<svg class="arr" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l5-5M4.5 3.5h4v4"/></svg>';
  const pad2 = (n) => String(n).padStart(2, '0');
  const RECENT = [['#ed1652', 'Smoking Snapshot'], ['#4fae86', 'JumpStart'], ['#43d9ff', 'Heart Health'], ['#8a3cff', 'Brain Dump']];

  /* ───────── Theme: light while the sun is up where the visitor is, dark after sunset ─────────
     No toggle. Same sunrise maths as the homepage's sky lab (assets/js/sky.js). */
  const PLACES = {
    'Europe/London': [53.5, -2.5], 'Europe/Dublin': [53.35, -6.26], 'Europe/Paris': [48.86, 2.35], 'Europe/Berlin': [52.52, 13.4],
    'Europe/Madrid': [40.42, -3.7], 'Europe/Rome': [41.9, 12.5], 'Europe/Amsterdam': [52.37, 4.9], 'Europe/Stockholm': [59.33, 18.07],
    'Europe/Lisbon': [38.72, -9.14], 'Europe/Warsaw': [52.23, 21.01], 'America/New_York': [40.71, -74], 'America/Chicago': [41.88, -87.63],
    'America/Denver': [39.74, -104.99], 'America/Los_Angeles': [34.05, -118.24], 'America/Toronto': [43.65, -79.38], 'America/Vancouver': [49.28, -123.12],
    'America/Sao_Paulo': [-23.55, -46.63], 'Asia/Tokyo': [35.68, 139.69], 'Asia/Singapore': [1.35, 103.82], 'Asia/Dubai': [25.2, 55.27],
    'Asia/Kolkata': [19.08, 72.88], 'Asia/Shanghai': [31.23, 121.47], 'Australia/Sydney': [-33.87, 151.21], 'Australia/Melbourne': [-37.81, 144.96],
    'Pacific/Auckland': [-36.85, 174.76], 'Africa/Johannesburg': [-26.2, 28.05],
  };
  const rad = Math.PI / 180;
  function sunIsUp() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const [lat, lon] = PLACES[tz] || [45, -new Date().getTimezoneOffset() / 4];
    const wall = (ms) => {
      const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        .formatToParts(ms).map((x) => [x.type, x.value]));
      return { min: +p.hour * 60 + +p.minute, y: +p.year, m: +p.month, d: +p.day };
    };
    const w = wall(Date.now());
    const n = Math.ceil(Date.UTC(w.y, w.m - 1, w.d, 12) / 864e5 + 2440587.5 - 2451545 + .0008);
    const J = n - lon / 360;
    const M = (357.5291 + .98560028 * J) % 360;
    const C = 1.9148 * Math.sin(M * rad) + .02 * Math.sin(2 * M * rad) + .0003 * Math.sin(3 * M * rad);
    const L = (M + C + 180 + 102.9372) % 360;
    const transit = 2451545 + J + .0053 * Math.sin(M * rad) - .0069 * Math.sin(2 * L * rad);
    const dec = Math.asin(Math.sin(L * rad) * Math.sin(23.44 * rad));
    const cosW = (Math.sin(-.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
    const h = Math.acos(Math.max(-1, Math.min(1, cosW))) / rad / 360;
    const at = (jd) => wall((jd - 2440587.5) * 864e5).min;
    const rise = at(transit - h), set = at(transit + h);
    return rise <= set ? w.min >= rise && w.min < set : w.min >= rise || w.min < set;
  }
  const deviceDark = matchMedia('(prefers-color-scheme: dark)');
  function isDark() {
    if (state.theme === 'light') return false;
    if (state.theme === 'dark') return true;
    if (state.theme === 'device') return deviceDark.matches;
    return !sunIsUp();
  }
  // Returns true when the theme changed, so styles that paint canvases can redraw.
  function applyTheme() {
    const dark = isDark(), was = root.dataset.theme === 'dark';
    if (dark) root.dataset.theme = 'dark'; else delete root.dataset.theme;
    return dark !== was;
  }
  function syncMeta() {
    const s = STYLES[state.style], dark = root.dataset.theme === 'dark';
    const colour = s.themed ? (dark ? '#05070b' : '#ffffff') : typeof s.meta === 'function' ? s.meta(dark) : s.meta;
    document.querySelector('meta[name="theme-color"]').setAttribute('content', colour);
  }

  /* ───────── Save my contact ─────────
     Safari and Chrome open a .vcf as a contact card ("Create New Contact" on iPhone). The browsers inside
     Instagram, X, LinkedIn and TikTok can't, and that's where most taps will come from, so they get a note instead. */
  const IN_APP = /Instagram|FBAN|FBAV|LinkedInApp|Twitter|TikTok|musical_ly|Snapchat|Threads|BytedanceWebview/i.test(navigator.userAgent);
  const APP_NAME = (navigator.userAgent.match(/Instagram|LinkedIn|Twitter|TikTok|Snapchat|Threads|FBAN|FBAV/i) || [''])[0].replace(/FBA[NV]/i, 'Facebook').replace(/Twitter/i, 'X').replace(/LinkedIn/i, 'LinkedIn');
  const PERSON = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="8" r="3.5"/><path d="M3.5 19.5c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5M18.5 8v6M15.5 11h6"/></svg>';
  function wireSave(scope) {
    scope.querySelectorAll('[data-save]').forEach((a) => a.addEventListener('click', (e) => {
      if (!IN_APP && !params.has('inapp')) return;
      e.preventDefault();
      openSheet();
    }));
  }
  function openSheet() {
    document.querySelector('.sheet')?.remove();
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.innerHTML = `<div class="sheet-card" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <img src="${PHOTO}" alt="" width="64" height="64">
      <h2 id="sheet-title">Save Shea to your contacts</h2>
      <p>${APP_NAME || 'This app'}’s browser can’t add contacts. Tap <b>•••</b> and choose <b>Open in browser</b>, then tap Save contact again.</p>
      <div class="sheet-actions"><button type="button" class="sheet-copy">Copy page link</button><a href="${CONTACT}" class="sheet-try">Try anyway</a></div>
      <button type="button" class="sheet-close">Close</button></div>`;
    document.body.append(sheet);
    const close = () => { sheet.classList.remove('is-open'); setTimeout(() => sheet.remove(), 300); };
    requestAnimationFrame(() => sheet.classList.add('is-open'));
    sheet.addEventListener('click', (e) => { if (e.target === sheet || e.target.closest('.sheet-close')) close(); });
    sheet.querySelector('.sheet-copy').addEventListener('click', async (e) => {
      try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}`); e.target.textContent = 'Copied'; } catch (err) { e.target.textContent = location.host + location.pathname; }
    });
  }

  /* ───────── Easter eggs ─────────
     Tap the name three times (or type the Konami code) for the arcade. In the arcade, Insert coin prints a
     receipt. The receipt's "Come again" goes back. On the live site none of this changes the saved style. */
  function wireName(scope) {
    const name = scope.querySelector('[data-egg]');
    if (!name) return;
    let taps = 0, timer;
    name.addEventListener('click', () => {
      taps++; clearTimeout(timer); timer = setTimeout(() => { taps = 0; }, 700);
      if (taps >= 3) { taps = 0; go('arcade'); }
    });
  }
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konami = 0;
  addEventListener('keydown', (e) => {
    konami = e.key === KONAMI[konami] ? konami + 1 : e.key === KONAMI[0] ? 1 : 0;
    if (konami === KONAMI.length) { konami = 0; if (state.style !== 'arcade') go('arcade'); }
  });

  // Hovering a link borrows its colours for the ring (the homepage does this with its projects).
  function wirePalette(scope, target) {
    scope.querySelectorAll('[data-palette]').forEach((a) => {
      const on = () => { target.dataset.palette = a.dataset.palette; };
      const off = () => { delete target.dataset.palette; };
      a.addEventListener('pointerenter', on); a.addEventListener('focus', on);
      a.addEventListener('pointerleave', off); a.addEventListener('blur', off);
    });
  }

  /* ═════════ 1. Eclipse: the portfolio, as a link page ═════════ */
  const eclipse = {
    name: 'Eclipse', themed: true,
    render: (links) => `
      <div class="ec-sky" aria-hidden="true"><div class="ec-eclipse"><div class="corona"></div><div class="disc"></div></div></div>
      <main class="ec is-${state.align}${state.photo === 'none' ? ' no-photo' : ''}">
        <header class="ec-head">
          ${state.photo === 'none' ? '' : `<span class="ec-photo${state.photo === 'ring' ? ' has-ring' : ''}"><img src="${PHOTO}" alt="Shea Wilson" width="240" height="240"></span>`}
          <div class="ec-id">
            <h1 data-egg>Shea Wilson</h1>
            <p class="ec-role"><span>Design engineer.</span> <span>Always making <em>something.</em></span></p>
          </div>
          <a class="ec-save" href="${CONTACT}" data-save>${PERSON}<span>Save contact</span></a>
        </header>
        <ul class="ec-list">
          ${links.map((l, i) => `<li style="--i:${i}"><a class="ec-link${l.featured ? ' is-featured' : ''}" ${attrs(l)} data-palette="${l.palette}" style="--tone:${l.tone || '#ed1652'}">
            <span class="ec-ico">${icon(l.icon)}</span>
            <span class="ec-txt"><b>${esc(l.label)}</b><span>${esc(l.sub)}</span>
              ${l.featured ? `<span class="ec-recent">${RECENT.map(([c, n]) => `<span><i style="--c:${c}"></i>${n}</span>`).join('')}</span>` : ''}</span>
            ${ARROW}</a></li>`).join('')}
        </ul>
        <footer class="ec-foot">© ${new Date().getFullYear()} Shea Wilson</footer>
      </main>`,
    mount(el) { wirePalette(el, el.querySelector('.ec-sky')); wireSave(el); wireName(el); },
  };

  /* ═════════ 2. Arcade: a start menu ═════════ */
  const SPECTRUM = ['#ed1652', '#ff6a1a', '#ffb22c', '#43d9ff', '#8a3cff', '#3a17e0'];
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

  // Brand icons redrawn on a 16px grid, stored as a crisp 128px mask so they stay square on any screen.
  const pixelCache = {};
  function pixelIcon(name) {
    if (pixelCache[name]) return pixelCache[name];
    const N = 16, S = 8, i = ICONS[name];
    const c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d');
    x.fillStyle = x.strokeStyle = '#fff';
    if (i.ring) { x.lineWidth = 3; x.beginPath(); x.arc(8, 8, 5.5, 0, Math.PI * 2); x.stroke(); }
    else {
      x.scale(N / 24, N / 24);
      const p = new Path2D(i.stroke || i.fill);
      if (i.stroke) { x.lineWidth = 2.6; x.lineJoin = 'miter'; x.stroke(p); } else x.fill(p);
    }
    const src = x.getImageData(0, 0, N, N).data;
    const big = document.createElement('canvas'); big.width = big.height = N * S;
    const b = big.getContext('2d'); b.fillStyle = '#000';
    for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) if (src[(py * N + px) * 4 + 3] > 110) b.fillRect(px * S, py * S, S, S);
    return (pixelCache[name] = big.toDataURL());
  }

  // Browsers only allow sound after a tap or key press, so the first one wakes the audio up.
  // Until then hovering is silent; after it every move blips.
  let audio = null;
  const wakeAudio = () => {
    try { audio = audio || new AudioContext(); if (audio.state === 'suspended') audio.resume(); } catch (e) {}
  };
  ['pointerdown', 'keydown', 'touchend'].forEach((t) => addEventListener(t, () => { if (state.style === 'arcade') wakeAudio(); }, { capture: true }));
  const arcadeSound = () => saved('links-arcade-sound') !== 'off';
  function beep(notes) {
    if (!arcadeSound() || !audio || audio.state !== 'running') return;
    const t0 = audio.currentTime;
    notes.forEach(([f, at, len]) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(.045, t0 + at); g.gain.exponentialRampToValueAtTime(.0001, t0 + at + len);
      o.connect(g).connect(audio.destination); o.start(t0 + at); o.stop(t0 + at + len);
    });
  }
  const SFX = {
    move: [[880, 0, .045]],
    pick: [[523, 0, .07], [659, .07, .07], [784, .14, .07], [1047, .21, .16]],
    on: [[660, 0, .08], [990, .08, .12]],
    coin: [[988, 0, .08], [1319, .08, .3]],
  };

  const arcade = {
    // Night is the starfield round the eclipse; day is a banded blue sky with clouds and a white disc,
    // the same swap the homepage makes.
    name: 'Arcade', meta: (dark) => (dark ? '#0b0a1f' : '#2f6fe8'),
    render: (links) => `
      <canvas class="ar-stars" aria-hidden="true"></canvas>
      <main class="ar">
        <canvas class="ar-sun" width="48" height="48" aria-hidden="true"></canvas>
        <h1 class="ar-title">Shea<br>Wilson</h1>
        <p class="ar-class">Class: design engineer</p>
        <p class="ar-quest">Quest: always making something</p>
        <p class="ar-select">Select a link</p>
        <ul class="ar-menu">
          ${links.map((l, i) => `<li><a class="ar-item${i === 0 ? ' is-sel' : ''}" ${attrs(l)}>
            <span class="ar-cur" aria-hidden="true">▶</span>
            <span class="ar-ico" style="--m:url(${pixelIcon(l.icon)})" aria-hidden="true"></span>
            <span class="ar-label">${esc(l.short)}</span><span class="ar-handle">${esc(l.sub)}</span></a></li>`).join('')}
        </ul>
        <p class="ar-hint"><span class="ar-blink">Press start</span><span class="ar-keys">↑ ↓ move · enter select</span></p>
        <footer class="ar-foot"><a href="${CONTACT}" data-save>Save contact</a><button class="ar-coin" type="button">Insert coin</button><button class="ar-sound" type="button"></button></footer>
      </main>`,
    mount(el) {
      const items = [...el.querySelectorAll('.ar-item')];
      const night = root.dataset.theme === 'dark';
      let sel = 0;
      wireSave(el);
      const soundBtn = el.querySelector('.ar-sound');
      const syncSound = () => { const on = arcadeSound(); soundBtn.textContent = `Sound: ${on ? 'on' : 'off'}`; soundBtn.setAttribute('aria-pressed', String(on)); };
      syncSound();
      soundBtn.addEventListener('click', () => {
        store('links-arcade-sound', arcadeSound() ? 'off' : 'on'); syncSound(); wakeAudio();
        setTimeout(() => beep(SFX.on), 30);
      });
      el.querySelector('.ar-coin').addEventListener('click', () => { wakeAudio(); setTimeout(() => beep(SFX.coin), 30); setTimeout(() => go('receipt'), 380); });
      const select = (i, focus) => {
        i = (i + items.length) % items.length;
        if (i !== sel) beep(SFX.move);
        items[sel].classList.remove('is-sel'); sel = i; items[sel].classList.add('is-sel');
        if (focus) items[sel].focus();
      };
      items.forEach((a, i) => {
        a.addEventListener('pointerenter', () => select(i));
        a.addEventListener('focus', () => select(i));
        a.addEventListener('click', () => beep(SFX.pick));
      });
      const onKey = (e) => {
        if (e.target.closest('.lab')) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); select(sel + 1, true); }
        if (e.key === 'ArrowUp') { e.preventDefault(); select(sel - 1, true); }
        if (e.key === 'Enter' && !e.target.closest('a, button')) { e.preventDefault(); items[sel].click(); }
      };
      addEventListener('keydown', onKey);

      // The eclipse again, at 48 pixels: a dithered corona round a disc (black by night, white by day), turning a notch at a time.
      const sun = el.querySelector('.ar-sun'), sx = sun.getContext('2d');
      const img = sx.createImageData(48, 48), cols = SPECTRUM.map(hex), disc = night ? [0, 0, 0] : [255, 255, 255];
      let turn = 0;
      const drawSun = () => {
        const d = img.data;
        for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) {
          const dx = x - 23.5, dy = y - 23.5, r = Math.hypot(dx, dy), k = (y * 48 + x) * 4;
          let c = null;
          if (r < 13) c = disc;
          else if (r < 23.5) {
            const glow = Math.pow(1 - (r - 13) / 10.5, 1.4);
            if (glow > BAYER[(y % 4) * 4 + (x % 4)]) {
              const a = ((Math.atan2(dy, dx) / (Math.PI * 2) + 1 + turn) % 1) * cols.length;
              c = cols[Math.floor(a) % cols.length];
            }
          }
          if (c) { d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255; } else d[k + 3] = 0;
        }
        sx.putImageData(img, 0, 0);
      };

      // Night: stars on a coarse grid, twinkling in steps. Day: blocky clouds drifting a pixel at a time.
      const sky = el.querySelector('.ar-stars'), kx = sky.getContext('2d');
      let stars = [], clouds = [];
      const sizeSky = () => {
        sky.width = Math.ceil(innerWidth / 4); sky.height = Math.ceil(innerHeight / 4);
        const W = sky.width, H = sky.height;
        stars = Array.from({ length: Math.round(W * H / 260) }, () => ({ x: Math.random() * W | 0, y: Math.random() * H | 0, p: Math.random() * 6, c: Math.random() < .15 ? SPECTRUM[Math.random() * 6 | 0] : '#ffffff' }));
        clouds = Array.from({ length: Math.max(4, Math.round(W / 40)) }, () => ({ x: Math.random() * W, y: 6 + Math.random() * H * .8 | 0, w: 14 + Math.random() * 22 | 0, v: .15 + Math.random() * .25 }));
      };
      const cloud = (c, W) => {
        const x = Math.round(c.x) % (W + c.w * 2) - c.w, y = c.y, w = c.w;
        kx.fillStyle = '#ffffff';
        kx.fillRect(x, y, w, 4); kx.fillRect(x + 3, y - 3, w * .45 | 0, 3); kx.fillRect(x + (w * .4 | 0), y - 5, w * .35 | 0, 5);
        kx.fillStyle = '#cfe4ff'; kx.fillRect(x, y + 4, w, 2);
      };
      const drawSky = (t) => {
        kx.clearRect(0, 0, sky.width, sky.height);
        if (night) for (const s of stars) {
          const on = Math.sin(t / 900 + s.p * 3) > -.3;
          kx.globalAlpha = on ? .9 : .25; kx.fillStyle = s.c; kx.fillRect(s.x, s.y, 1, 1);
        } else { kx.globalAlpha = .92; for (const c of clouds) { c.x += c.v; cloud(c, sky.width); } }
        kx.globalAlpha = 1;
      };
      sizeSky(); addEventListener('resize', sizeSky);
      let raf, last = 0;
      const loop = (t) => {
        raf = requestAnimationFrame(loop);
        if (t - last < 110) return; // about nine frames a second: the steps are the point
        last = t; turn = (turn + 1 / 48) % 1; drawSun(); drawSky(t);
      };
      drawSun(); drawSky(0);
      if (!reduced) raf = requestAnimationFrame(loop);
      return () => { cancelAnimationFrame(raf); removeEventListener('keydown', onKey); removeEventListener('resize', sizeSky); };
    },
  };

  /* ═════════ 3. Departures: a split-flap board ═════════ */
  const DRUM = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:-/@→';
  const flaps = (text, width, cls = '') => `<span class="flaps ${cls}" data-w="${width}" aria-label="${esc(text)}">${'<span class="f" aria-hidden="true"> </span>'.repeat(width)}</span>`;
  // Each tile steps forward round the drum to its letter, like the real thing, so tiles land at different times.
  function setFlaps(el, text, delay = 0) {
    const w = Number(el.dataset.w), target = text.toUpperCase().padEnd(w).slice(0, w);
    el.setAttribute('aria-label', text);
    [...el.children].forEach((tile, i) => {
      clearTimeout(tile._t);
      const to = DRUM.indexOf(target[i]) < 0 ? 0 : DRUM.indexOf(target[i]);
      if (reduced) { tile.textContent = DRUM[to]; return; }
      const step = () => {
        const at = DRUM.indexOf(tile.textContent);
        if (at === to) return;
        tile.textContent = DRUM[(at + 1) % DRUM.length];
        tile.classList.remove('go'); void tile.offsetWidth; tile.classList.add('go');
        tile._t = setTimeout(step, 34);
      };
      tile._t = setTimeout(step, delay + i * 28);
    });
  }
  const departures = {
    name: 'Departures', meta: '#0a0a0a',
    render: (links) => `
      <main class="dp">
        <header class="dp-head">
          <div><p class="dp-kicker" data-egg>Shea Wilson · Design engineer</p><h1 class="dp-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 19h19M3 13.2l2.2-.6 2.3 2 4.4-1.2L8 7.3l2.3-.6 6.4 5.1 4-1.1a1.6 1.6 0 1 1 .8 3.1L5.8 18z" fill="currentColor"/></svg>Departures</h1></div>
          ${flaps('00:00', 5, 'dp-clock')}
        </header>
        <div class="dp-board">
          <div class="dp-cols" aria-hidden="true"><span>Gate</span><span>Destination</span><span>Status</span></div>
          ${links.map((l, i) => `<a class="dp-row" ${attrs(l)} data-status="${esc(l.status)}">
            ${flaps(pad2(i + 1), 2, 'dp-gate')}
            <span class="dp-dest">${flaps(l.short, 9)}<span class="dp-via">${esc(l.sub)}</span></span>
            ${flaps(l.status, 8, `dp-status${l.featured ? ' is-boarding' : ''}`)}</a>`).join('')}
        </div>
        <footer class="dp-foot"><span>Always making something.</span><a href="${CONTACT}" data-save>Save my contact</a></footer>
      </main>`,
    mount(el) {
      wireSave(el); wireName(el);
      const clock = el.querySelector('.dp-clock');
      const tick = (d) => { const n = new Date(); setFlaps(clock, `${pad2(n.getHours())}:${pad2(n.getMinutes())}`, d); };
      tick(200);
      const timer = setInterval(() => tick(0), 15000);
      el.querySelectorAll('.dp-row').forEach((row, r) => {
        const [gate, dest, status] = row.querySelectorAll('.flaps');
        setFlaps(gate, gate.getAttribute('aria-label'), 150 + r * 90);
        setFlaps(dest, dest.getAttribute('aria-label'), 250 + r * 90);
        setFlaps(status, row.dataset.status, 400 + r * 90);
        const go = () => setFlaps(status, 'Go now');
        const back = () => setFlaps(status, row.dataset.status);
        row.addEventListener('pointerenter', go); row.addEventListener('focus', go);
        row.addEventListener('pointerleave', back); row.addEventListener('blur', back);
      });
      return () => { clearInterval(timer); el.querySelectorAll('.f').forEach((t) => clearTimeout(t._t)); };
    },
  };

  /* ═════════ 4. Receipt: printed on arrival ═════════ */
  function barcode(seed) {
    let h = 2166136261, bars = '';
    for (let n = 0; n < 46; n++) {
      h ^= seed.charCodeAt(n % seed.length) + n; h = Math.imul(h, 16777619) >>> 0;
      bars += `<i style="--w:${1 + (h % 3)}px;--g:${1 + ((h >> 3) % 3)}px"></i>`;
    }
    return bars;
  }
  const receipt = {
    name: 'Receipt', meta: '#dcdcdf',
    render: (links) => {
      const n = new Date();
      const date = `${pad2(n.getDate())}/${pad2(n.getMonth() + 1)}/${n.getFullYear()}`;
      const time = `${pad2(n.getHours())}:${pad2(n.getMinutes())}`;
      return `
      <main class="rc">
        <div class="rc-printer" aria-hidden="true"></div>
        <div class="rc-clip"><div class="rc-paper">
          <header class="rc-head"><h1 data-egg>Shea Wilson</h1><p>Design engineer</p><p>sheawilson.uk</p></header>
          <p class="rc-meta"><span>${date}</span><span>${time}</span></p>
          <p class="rc-meta"><span>Visitor</span><span>#${String(1000 + (Math.random() * 9000 | 0))}</span></p>
          <p class="rc-cols" aria-hidden="true"><span>Qty</span><span>Item</span><span>Where</span></p>
          <ul class="rc-items">
            ${links.map((l) => `<li><a class="rc-item" ${attrs(l)}><span>1</span><span class="rc-name">${esc(l.short)}</span><span class="rc-sub">${esc(l.sub)}</span></a></li>`).join('')}
          </ul>
          <p class="rc-total"><span>Items</span><span>${links.length}</span></p>
          <p class="rc-total is-big"><span>Total</span><span>£0.00</span></p>
          <p class="rc-total"><span>Paid with</span><span>Curiosity</span></p>
          <p class="rc-line">* Always making something *</p>
          <a class="rc-bar" href="https://sheawilson.uk" target="_blank" rel="noopener" aria-label="Portfolio">${barcode('SHEAWILSON')}</a>
          <a class="rc-save" href="${CONTACT}" data-save>Save my contact</a>
          <button class="rc-thanks" type="button">Thank you. Come again.</button>
        </div></div>
      </main>`;
    },
    mount(el) {
      wireSave(el); wireName(el);
      el.querySelector('.rc-thanks').addEventListener('click', () => go(DEFAULT_STYLE === 'receipt' ? 'eclipse' : DEFAULT_STYLE));
    },
  };

  /* ═════════ 5. Specimen: the links as a type sheet ═════════ */
  const specimen = {
    name: 'Specimen', themed: true,
    render: (links) => `
      <div class="sp-glow" aria-hidden="true"></div>
      <main class="sp">
        <header class="sp-head"><span class="sp-name" data-egg>Shea Wilson</span><span class="sp-role">Design engineer</span></header>
        <ol class="sp-list">
          ${links.map((l, i) => `<li style="--i:${i}"><a class="sp-row" ${attrs(l)} data-palette="${l.palette}">
            <span class="sp-n">${pad2(i + 1)}</span><span class="sp-word">${esc(l.short)}</span><span class="sp-sub">${esc(l.sub)} ${ARROW}</span></a></li>`).join('')}
        </ol>
        <footer class="sp-foot"><p>Always making <em>something.</em></p><a href="${CONTACT}" data-save>Save my contact</a></footer>
      </main>`,
    mount(el) { wirePalette(el, el.querySelector('.sp-glow')); wireSave(el); wireName(el); },
  };

  const STYLES = { eclipse, arcade, departures, receipt, specimen };

  /* ───────── State and the lab bar ───────── */
  const params = new URLSearchParams(location.search);
  const saved = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const live = /(^|\.)sheawilson\.(uk|vercel\.app)$/.test(location.hostname);
  const showLab = !live || params.has('lab');

  // Options: [value, label]. DEFAULTS are my picks (the green dots in the lab) and what visitors get.
  const OPTIONS = {
    style: Object.keys(STYLES).map((k) => [k, STYLES[k].name]),
    photo: [['photo', 'Photo'], ['ring', 'Photo + ring'], ['none', 'No photo']],
    align: [['left', 'Left'], ['centre', 'Centre']],
    theme: [['sun', 'Sun'], ['device', 'Device'], ['light', 'Light'], ['dark', 'Dark']],
    extras: [['1', 'On'], ['0', 'Off']],
  };
  const DEFAULTS = { style: DEFAULT_STYLE, photo: 'photo', align: 'left', theme: 'sun', extras: '1' };
  const LABELS = { style: 'Style', photo: 'Photo', align: 'Align', theme: 'Theme', extras: 'Email + 3D' };
  const valid = (k, v) => OPTIONS[k].some(([o]) => o === v);
  let savedLab = {};
  try { savedLab = showLab ? JSON.parse(saved('links-lab') || '{}') : {}; } catch (e) {}
  const state = { ...DEFAULTS };
  for (const k of Object.keys(OPTIONS)) {
    if (valid(k, params.get(k))) state[k] = params.get(k);
    else if (valid(k, savedLab[k])) state[k] = savedLab[k];
  }
  let teardown = null;

  function draw() {
    teardown?.(); teardown = null;
    applyTheme();
    const s = STYLES[state.style];
    document.body.dataset.style = state.style;
    app.innerHTML = s.render(LINKS.filter((l) => !l.hidden && (state.extras === '1' || !l.extra)));
    teardown = s.mount?.(app) || null;
    syncMeta();
    syncLab();
  }
  const transition = (fn) => { if (!document.startViewTransition || reduced) fn(); else document.startViewTransition(fn); };
  function set(patch) {
    Object.assign(state, patch);
    if (showLab) {
      store('links-lab', JSON.stringify(state));
      const q = new URLSearchParams(location.search);
      for (const k of Object.keys(OPTIONS)) q.set(k, state[k]);
      history.replaceState(null, '', `?${q}`);
    }
    transition(draw);
  }
  // Easter eggs move between styles without touching what the lab has saved.
  function go(style) {
    if (showLab) { set({ style }); return; }
    state.style = style;
    transition(draw);
    scrollTo(0, 0);
  }

  // The sun moves on without a reload; the device setting can change under us too.
  const recheck = () => { if (applyTheme()) transition(draw); };
  setInterval(recheck, 60000);
  deviceDark.addEventListener('change', recheck);
  addEventListener('visibilitychange', () => { if (!document.hidden) recheck(); });

  let lab = null;
  function syncLab() {
    if (!lab) return;
    lab.querySelectorAll('button[data-k]').forEach((b) => b.setAttribute('aria-pressed', String(state[b.dataset.k] === b.dataset.v)));
    lab.querySelectorAll('[data-only]').forEach((row) => { row.hidden = row.dataset.only !== state.style; });
  }
  if (showLab) {
    lab = document.createElement('div');
    lab.className = 'lab';
    lab.setAttribute('role', 'toolbar');
    lab.setAttribute('aria-label', 'Try a style');
    const group = (k) => `<span class="lab-group"${k === 'photo' || k === 'align' ? ' data-only="eclipse"' : ''}><span class="lab-tag">${LABELS[k]}</span>${OPTIONS[k].map(([v, name], i) =>
      `<button type="button" data-k="${k}" data-v="${v}"${v === DEFAULTS[k] ? ' class="rec"' : ''}${k === 'style' ? ` title="${name} (${i + 1})"` : ''}>${name}</button>`).join('')}</span>`;
    lab.innerHTML = `<div class="lab-row">${group('style')}</div><div class="lab-row is-sub">${group('photo')}${group('align')}${group('theme')}${group('extras')}</div>`;
    document.body.append(lab);
    lab.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-k]');
      if (b) set({ [b.dataset.k]: b.dataset.v });
    });
    const keys = Object.keys(STYLES);
    addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= keys.length) set({ style: keys[n - 1] });
    });
  }
  draw();
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('boot')));
})();
