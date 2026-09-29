// Film player: a silent video with music and sound effects as separate tracks, played through
// Web Audio so each can be switched on or off with a fade, never a seek. A scrubber shows where you are and lets you drag.
// No dependencies.
//
// <figure class="film" data-film data-wide="wide.mp4" data-tall="tall.mp4" data-wide-poster="…" data-tall-poster="…"
//   data-music="music.m4a" data-sfx="sfx.m4a">
//   <div class="film-frame"><video playsinline muted loop preload="metadata"></video>
//     <button class="film-big" type="button" aria-label="Play the film"></button></div>
//   <div class="film-scrub"><input type="range" min="0" max="1000" value="0" aria-label="Position in the film"><span class="film-time">0:00</span></div>
//   <div class="film-bar">
//     <button type="button" data-toggle="music" aria-pressed="false">Music</button>
//     <button type="button" data-toggle="sfx" aria-pressed="false">Sound effects</button>
//     <button type="button" data-play aria-label="Play">…</button>
//   </div>
// </figure>
//
// root.film.setSources({ video, poster, music, sfx }) swaps any of them and keeps the position.
// root.film.setSpeed(0.5) slows picture and sound together.
(() => {
  const RESYNC = 0.12; // seconds the sound may drift from the picture before it restarts in place
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const AC = window.AudioContext || window.webkitAudioContext;
  // let Web Audio play with the iPhone's silent switch on, like a video would
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}

  function mount(root) {
    const video = root.querySelector('video');
    const big = root.querySelector('.film-big');
    const playBtn = root.querySelector('[data-play]');
    const scrub = root.querySelector('.film-scrub input');
    const time = root.querySelector('.film-time');
    const tall = matchMedia('(max-width: 720px), (max-aspect-ratio: 4/5)').matches;
    let speed = 1, dragging = false, wasPlaying = false, restarts = 0;

    // Audio: one context, a gain per track, sources restarted only on play, seek, loop or a real drift.
    const ctx = AC ? new AC() : null;
    const tracks = {};
    for (const key of ['music', 'sfx']) {
      const gain = ctx ? ctx.createGain() : null;
      if (gain) { gain.gain.value = 0; gain.connect(ctx.destination); }
      tracks[key] = { key, on: false, url: '', buffer: null, gain, button: root.querySelector(`[data-toggle="${key}"]`) };
    }
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
      if (t.url === abs) return;
      t.url = abs; t.buffer = null;
      // keep the old track playing until the new one is decoded, then swap in place
      try {
        const data = await (await fetch(abs)).arrayBuffer();
        const buf = await new Promise((ok, no) => ctx.decodeAudioData(data, ok, no));
        if (t.url === abs) { t.buffer = buf; if (anchor) startTrack(t); else if (!video.paused) start(); }
      } catch (e) {}
    };

    const fade = t => { if (t.gain) t.gain.gain.setTargetAtTime(t.on ? 1 : 0, ctx.currentTime, 0.02); };

    const setState = () => {
      const playing = !video.paused;
      root.classList.toggle('is-playing', playing);
      if (playBtn) playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      for (const t of Object.values(tracks)) if (t.button) t.button.setAttribute('aria-pressed', String(t.on));
    };

    const showTime = () => {
      const d = video.duration || 0;
      if (scrub && !dragging && d) scrub.value = String(Math.round((video.currentTime / d) * 1000));
      if (scrub) scrub.style.setProperty('--p', `${d ? (video.currentTime / d) * 100 : 0}%`);
      if (time) time.textContent = `${fmt(video.currentTime)} / ${fmt(d)}`;
    };

    let raf = 0, last = 0;
    const loop = () => {
      const now = video.currentTime;
      if (now + 0.5 < last) start(); // the video looped
      else if (anchor && Math.abs(drift()) > RESYNC) start();
      else if (!anchor && ctx && ctx.state === 'running' && !video.paused) start();
      last = now; showTime();
      raf = video.paused ? 0 : requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    video.addEventListener('playing', () => { start(); setState(); kick(); });
    video.addEventListener('play', () => { setState(); kick(); });
    video.addEventListener('pause', () => { stop(); setState(); showTime(); });
    video.addEventListener('waiting', stop);
    video.addEventListener('seeked', () => { if (!video.paused) start(); showTime(); });
    video.addEventListener('ratechange', () => { if (!video.paused) start(); });
    video.addEventListener('loadedmetadata', showTime);

    const play = () => video.play().catch(() => {});
    const unlock = () => { if (ctx && ctx.state !== 'running') ctx.resume().then(() => { if (!video.paused) start(); }).catch(() => {}); };
    const toggle = () => { unlock(); root.dataset.userPaused = video.paused ? '' : '1'; video.paused ? play() : video.pause(); };
    video.addEventListener('click', toggle);
    if (big) big.addEventListener('click', () => { unlock(); play(); });
    if (playBtn) playBtn.addEventListener('click', toggle);

    if (scrub) {
      scrub.addEventListener('pointerdown', () => { dragging = true; wasPlaying = !video.paused; video.pause(); });
      scrub.addEventListener('input', () => { const d = video.duration || 0; video.currentTime = (+scrub.value / 1000) * d; scrub.style.setProperty('--p', `${+scrub.value / 10}%`); if (time) time.textContent = `${fmt(video.currentTime)} / ${fmt(d)}`; });
      const end = () => { if (!dragging) return; dragging = false; if (wasPlaying) play(); };
      scrub.addEventListener('pointerup', end); scrub.addEventListener('change', end); scrub.addEventListener('pointercancel', end);
    }

    for (const t of Object.values(tracks)) {
      if (!t.button) continue;
      t.button.addEventListener('click', () => {
        t.on = !t.on;
        unlock(); fade(t);
        if (t.on && video.paused) play();
        else if (t.on && !anchor) start();
        setState(); kick();
      });
    }

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
      new IntersectionObserver(entries => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.5) { if (video.paused && !root.dataset.userPaused && !dragging) play(); }
          else if (!video.paused) video.pause();
        }
      }, { threshold: [0, 0.5] }).observe(root);
    }
    root.film = { video, tracks, setSources, setSpeed, tall, drift, get restarts() { return restarts; } };
    setState();
    root.dispatchEvent(new CustomEvent('film:ready'));
  }

  const start = () => document.querySelectorAll('[data-film]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
