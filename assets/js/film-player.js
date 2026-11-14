// Film player: a silent looping video with its music and its sound effects as separate tracks, played through
// Web Audio so they can fade in and out. No player controls: the film plays while it's on screen and loops.
// Tapping the film, or the corner sound button, turns the sound on or off. Browsers only allow sound after a
// tap, so it starts with the first tap or key press anywhere on the page. Both tracks are fetched and decoded
// as soon as the film first plays, so they're ready the moment that tap comes. No dependencies.
//
// <figure class="film" data-film data-wide="wide.mp4" data-tall="tall.mp4" data-wide-poster="…" data-tall-poster="…"
//   data-music="music.m4a" data-sfx="sfx.m4a">
//   <div class="film-frame"><video playsinline muted loop preload="metadata"></video>
//     <button class="film-sound" type="button" data-mute>…</button></div>
// </figure>
//
// root.film.setSources({ video, poster, music, sfx }) swaps any of them and keeps the position.
// root.film.setSpeed(0.5) slows picture and sound together.
(() => {
  const RESYNC = 0.12; // seconds the sound may drift from the picture before it restarts in place
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AC = window.AudioContext || window.webkitAudioContext;
  // let Web Audio play with the iPhone's silent switch on, like a video would
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}

  function mount(root) {
    const video = root.querySelector('video');
    const tall = matchMedia('(max-width: 720px), (max-aspect-ratio: 4/5)').matches;
    let speed = 1, restarts = 0;

    // Audio: one context, a gain per track, sources restarted only on play, seek, loop or a real drift.
    const ctx = AC ? new AC() : null;
    const tracks = {};
    for (const key of ['music', 'sfx']) {
      const gain = ctx ? ctx.createGain() : null;
      if (gain) { gain.gain.value = 0; gain.connect(ctx.destination); }
      tracks[key] = { key, on: true, level: key === 'music' ? 1 : .8, url: '', buffer: null, gain }; // effects a touch under the music so the two never clip
      if (gain) gain.gain.value = tracks[key].level;
    }
    let armed = false; // the sound files wait for the film's first frame, so they don't hold up the page
    let anchor = null; // the context time and film time the sounds started from

    const latency = () => (ctx ? (ctx.outputLatency || 0) + (ctx.baseLatency || 0) : 0);
    const stopTrack = t => { if (t.source) { try { t.source.stop(); } catch (e) {} t.source.disconnect(); t.source = null; } };
    const stop = () => { Object.values(tracks).forEach(stopTrack); anchor = null; };
    // one track joins the running sounds at the anchor's position, so the other is untouched
    const startTrack = t => {
      stopTrack(t);
      if (!anchor || !t.buffer) return;
      const at = anchor.film + (ctx.currentTime - anchor.ctx) * speed;
      if (at >= t.buffer.duration) return;
      const s = ctx.createBufferSource(); s.buffer = t.buffer; s.playbackRate.value = speed; s.connect(t.gain);
      s.start(0, Math.max(0, at)); t.source = s;
    };
    const start = () => {
      stop();
      if (!ctx || video.paused || ctx.state !== 'running') return;
      // start a touch ahead of the picture so the sound is heard on time
      anchor = { ctx: ctx.currentTime, film: video.currentTime + latency() * speed };
      Object.values(tracks).forEach(startTrack);
      restarts++;
    };
    const audioTime = () => (anchor ? anchor.film + (ctx.currentTime - anchor.ctx) * speed - latency() * speed : null);
    const drift = () => { const a = audioTime(); return a === null ? 0 : a - video.currentTime; };

    const load = async (t, url) => {
      if (!url || !ctx) return;
      const abs = new URL(url, location.href).href;
      if (t.url !== abs) { t.url = abs; t.buffer = null; }
      if (t.buffer || t.loading === abs || !armed) return;
      t.loading = abs;
      // keep the old track playing until the new one is decoded, then swap in place
      try {
        const data = await (await fetch(abs)).arrayBuffer();
        const buf = await new Promise((ok, no) => ctx.decodeAudioData(data, ok, no));
        if (t.url === abs) { t.buffer = buf; if (anchor) startTrack(t); else if (!video.paused) start(); }
      } catch (e) {}
      finally { if (t.loading === abs) t.loading = ''; }
    };

    const fade = t => { if (t.gain) t.gain.gain.setTargetAtTime(t.on ? t.level : 0, ctx.currentTime, 0.02); };

    const muteBtn = root.querySelector('[data-mute]');
    const setState = () => {
      const playing = !video.paused;
      const muted = !ctx || ctx.state !== 'running' || !tracks.music.on;
      root.classList.toggle('is-playing', playing);
      root.classList.toggle('is-muted', muted);
      if (muteBtn) { muteBtn.setAttribute('aria-pressed', String(muted)); muteBtn.setAttribute('aria-label', muted ? 'Turn sound on' : 'Mute'); }
    };

    let raf = 0, last = 0;
    const loop = () => {
      const now = video.currentTime;
      if (now + 0.5 < last) start(); // the video looped
      else if (anchor && Math.abs(drift()) > RESYNC) start();
      else if (!anchor && ctx && ctx.state === 'running' && !video.paused) start();
      last = now;
      raf = video.paused ? 0 : requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    const arm = () => { armed = true; Object.values(tracks).forEach(t => load(t, t.url)); };
    video.addEventListener('playing', () => { arm(); start(); setState(); kick(); });
    video.addEventListener('play', () => { setState(); kick(); });
    video.addEventListener('pause', () => { stop(); setState(); });
    video.addEventListener('waiting', stop);
    video.addEventListener('seeked', () => { if (!video.paused) start(); });
    video.addEventListener('ratechange', () => { if (!video.paused) start(); });

    const play = () => video.play().catch(() => {});
    const unlock = () => {
      if (!ctx) return;
      const ready = () => { arm(); if (!video.paused) start(); };
      if (ctx.state !== 'running') ctx.resume().then(ready).catch(() => {}); else ready();
    };
    // The first tap or key press anywhere lets the music start; the sound button mutes and unmutes.
    if (ctx) ctx.addEventListener('statechange', setState);
    // Which event counts as a press differs by browser and by mouse or finger, so listen to them all until one works.
    const WAKES = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
    const wake = (e) => {
      if (ctx.state === 'running') return WAKES.forEach(t => removeEventListener(t, wake, true));
      if (!root.contains(e.target)) unlock();
    };
    if (ctx) WAKES.forEach(t => addEventListener(t, wake, true));
    const sound = (e) => {
      if (e) e.stopPropagation();
      const on = ctx && ctx.state !== 'running' ? true : !tracks.music.on;
      Object.values(tracks).forEach(t => { t.on = on; });
      unlock(); Object.values(tracks).forEach(fade);
      if (on && video.paused) play();
      else if (on && !anchor) start();
      setState(); kick();
    };
    if (muteBtn) muteBtn.addEventListener('click', sound);
    video.addEventListener('click', sound);

    const setSources = ({ video: v, poster, music, sfx }) => {
      load(tracks.music, music); load(tracks.sfx, sfx);
      if (v && video.src !== new URL(v, location.href).href) {
        const at = video.currentTime, playing = !video.paused;
        stop();
        if (poster) video.poster = poster;
        video.src = v;
        video.addEventListener('loadedmetadata', () => { video.currentTime = Math.min(at, (video.duration || at) - 0.05); video.playbackRate = speed; if (playing) play(); }, { once: true });
      }
    };
    const setSpeed = r => { if (r === speed) return; speed = r; video.playbackRate = r; };

    root.classList.toggle('is-tall', tall);
    video.muted = true;
    setSources({ video: tall ? root.dataset.tall : root.dataset.wide, poster: tall ? root.dataset.tallPoster : root.dataset.widePoster, music: root.dataset.music, sfx: root.dataset.sfx });

    // play (silently) while on screen, rest when scrolled away
    if (!reduce && 'IntersectionObserver' in window) {
      // On case pages, let the poster draw before the film competes for the connection.
      const posterReady = document.body.classList.contains('case') && video.poster
        ? Object.assign(new Image(), { src: video.poster }).decode().catch(() => {})
            .then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        : Promise.resolve();
      let visible = false;
      new IntersectionObserver(entries => {
        for (const e of entries) {
          visible = e.isIntersecting && e.intersectionRatio >= 0.5;
          if (visible) posterReady.then(() => { if (visible && !document.hidden && video.paused) play(); });
          else if (!video.paused) video.pause();
        }
      }, { threshold: [0, 0.5] }).observe(root);
    }
    let resume = false;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { resume = !video.paused; video.pause(); }
      else if (resume) {
        resume = false;
        const r = root.getBoundingClientRect();
        if (Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) >= r.height * .5) play();
      }
    });
    root.film = { video, tracks, setSources, setSpeed, tall, drift, get restarts() { return restarts; } };
    setState();
    root.dispatchEvent(new CustomEvent('film:ready'));
  }

  const start = () => document.querySelectorAll('[data-film]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
