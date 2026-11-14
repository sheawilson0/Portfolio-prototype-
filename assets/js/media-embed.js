// Keep the real scene's still until the visitor interacts. No Spline code or scene is fetched before then.
(() => {
  const viewer = document.querySelector('spline-viewer[data-url]');
  if (!viewer) return;
  let loading = false;
  const load = async () => {
    if (loading) return;
    loading = true;
    try {
      await import('https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js');
      viewer.addEventListener('load-complete', () => {
        viewer.previousElementSibling.remove();
        viewer.style.opacity = '1';
      }, { once: true });
      viewer.setAttribute('url', viewer.dataset.url);
      removeEventListener('pointerdown', load);
      removeEventListener('keydown', load);
    } catch (e) { loading = false; }
  };
  addEventListener('pointerdown', load, { passive: true });
  addEventListener('keydown', load);
})();
