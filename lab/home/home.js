// Only visitor-driven motion, shared across the three studies.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelector('.light-switch')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('sky-mode', next);
    location.reload();
  });
  const rows = [...document.querySelectorAll('.work-row')];
  const show = row => {
    rows.forEach(r => r.classList.toggle('active', r === row));
    document.querySelectorAll('.index-image').forEach(img => img.classList.toggle('active', img.dataset.image === row.dataset.project));
  };
  rows.forEach(row => {
    row.addEventListener('pointerenter', () => show(row));
    row.addEventListener('focus', () => show(row));
  });
  document.querySelectorAll('.case-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const opening = button.getAttribute('aria-expanded') !== 'true';
      document.querySelectorAll('.case-toggle').forEach(b => {
        const open = b === button && opening;
        b.setAttribute('aria-expanded', String(open));
        b.closest('.case').classList.toggle('is-open', open);
        document.getElementById(b.getAttribute('aria-controls')).inert = !open;
      });
    });
  });
  if (!reduced && matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.gallery-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--x', `${(e.clientX - rect.left - rect.width / 2) / rect.width * 9}px`);
        card.style.setProperty('--y', `${(e.clientY - rect.top - rect.height / 2) / rect.height * 9}px`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--x', '0px'); card.style.setProperty('--y', '0px');
      });
    });
  }
})();
