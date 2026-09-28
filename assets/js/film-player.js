// Film player: a silent video with music and sound effects as separate, synced tracks,
// so each can be switched on or off on its own. A scrubber shows where you are and lets you drag.
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
  const JUMP = 0.1; // beyond this a track jumps back to the picture
  const NUDGE = 0.02; // beyond this it runs slightly fast or slow until it catches up
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

  function mount(root) {
    const video = root.querySelector('video');
    const big = root.querySelector('.film-big');
    const playBtn = root.querySelector('[data-play]');
    const scrub = root.querySelector('.film-scrub input');
    const time = root.querySelector('.film-time');
    const tall = matchMedia('(max-width: 720px), (max-aspect-ratio: 4/5)').matches;
    let speed = 1, dragging = false, wasPlaying = false;

    const tracks = {};
    for (const key of ['music', 'sfx']) {
      const a = new Audio(); a.preload = 'auto';
      tracks[key] = { audio: a, on: false, button: root.querySelector(`[data-toggle="${key}"]`) };
    }

    const setState = () => {
      const playing = !video.paused;
      root.classList.toggle('is-playing', playing);
      if (playBtn) playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      for (const t of Object.values(tracks)) if (t.button) t.button.setAttribute('aria-pressed', String(t.on));
    };

    const syncTrack = t => {
      const a = t.audio;
      if (!t.on || video.paused || !a.src) { if (!a.paused) a.pause(); return; }
      const want = video.currentTime;
      if (want >= (a.duration || Infinity)) { if (!a.paused) a.pause(); return; }
      const d = a.currentTime - want;
      if (Math.abs(d) > JUMP * Math.max(1, speed)) { a.currentTime = want; a.playbackRate = speed; }
      else if (Math.abs(d) > NUDGE) a.playbackRate = speed * (1 - Math.max(-0.06, Math.min(0.06, d * 1.5)));
      else if (a.playbackRate !== speed) a.playbackRate = speed;
      if (a.paused) a.play().catch(() => {});
    };

    const showTime = () => {
      const d = video.duration || 0;
      if (scrub && !dragging && d) scrub.value = String(Math.round((video.currentTime / d) * 1000));
      if (scrub) scrub.style.setProperty('--p', `${d ? (video.currentTime / d) * 100 : 0}%`);
      if (time) time.textContent = `${fmt(video.currentTime)} / ${fmt(d)}`;
    };

    let raf = 0;
    const loop = () => { Object.values(tracks).forEach(syncTrack); showTime(); raf = video.paused ? 0 : requestAnimationFrame(loop); };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    video.addEventListener('play', () => { setState(); kick(); });
    video.addEventListener('pause', () => { setState(); Object.values(tracks).forEach(syncTrack); showTime(); });
    video.addEventListener('seeked', () => { Object.values(tracks).forEach(t => { if (t.on) t.audio.currentTime = video.currentTime; }); showTime(); });
    video.addEventListener('loadedmetadata', showTime);

    const play = () => video.play().catch(() => {});
    const toggle = () => { root.dataset.userPaused = video.paused ? '' : '1'; video.paused ? play() : video.pause(); };
    video.addEventListener('click', toggle);
    if (big) big.addEventListener('click', play);
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
        // switching sound on is a gesture, so start the track inside it
        if (t.on) { t.audio.currentTime = video.currentTime; t.audio.playbackRate = speed; if (video.paused) play(); t.audio.play().catch(() => {}); }
        else t.audio.pause();
        setState(); kick();
      });
    }

    const setSources = ({ video: v, poster, music, sfx }) => {
      const at = video.currentTime, playing = !video.paused;
      if (music !== undefined && tracks.music.audio.src !== new URL(music, location.href).href) { tracks.music.audio.src = music; }
      if (sfx !== undefined && tracks.sfx.audio.src !== new URL(sfx, location.href).href) { tracks.sfx.audio.src = sfx; }
      if (v && video.src !== new URL(v, location.href).href) {
        if (poster) video.poster = poster;
        video.src = v;
        video.addEventListener('loadedmetadata', () => { video.currentTime = Math.min(at, (video.duration || at) - 0.05); if (playing) play(); }, { once: true });
      } else if (playing) { Object.values(tracks).forEach(t => { if (t.on) { t.audio.currentTime = video.currentTime; t.audio.play().catch(() => {}); } }); }
      video.playbackRate = speed;
    };
    const setSpeed = r => { speed = r; video.playbackRate = r; Object.values(tracks).forEach(t => (t.audio.playbackRate = r)); };

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
    root.film = { video, tracks, setSources, setSpeed, tall };
    setState();
    root.dispatchEvent(new CustomEvent('film:ready'));
  }

  const start = () => document.querySelectorAll('[data-film]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
