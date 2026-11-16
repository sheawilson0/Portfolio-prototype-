# Portfolio startup performance, 16 November 2026

Baseline: shipped-lab (first performance round included). Changes: perf-startup.

## Measurements

Three cold runs per page per version, medians of each metric. Lighthouse 13.6.0,
Chrome 157 headless, mobile preset, simulated network, 4× CPU slowdown. Each run
used a fresh Chrome profile. The same Node static server on port 8768 served both
versions, including byte ranges for media. All 18 retained runs had zero failed
resource requests. Earlier Python-server runs with failed resources were discarded.
Local uncompressed transfers; these are comparisons, not predictions of Vercel scores.

| Page | Score before → after | LCP before → after | TBT before → after | Bytes before → after |
| --- | --- | --- | --- | --- |
| / | 80 → 79 | 4.60 → 4.66 s | 0 → 0 ms | 984,851 → 986,015 |
| snapshot.html | 78 → 89 | 3.98 → 3.50 s | 267 → 0 ms | 5,420,920 → 4,323,588 |
| quit28.html | 84 → 92 | 3.57 → 3.12 s | 190 → 0 ms | 5,060,403 → 3,650,004 |

The supplied ~2,060 ms sky cost was not reproduced. Homepage median Lighthouse
sky CPU attribution was 94.61 → 94.80 ms, effectively unchanged; its script
evaluation attribution was 52.20 → 59.84 ms. Unattributable CPU was
163.28 → 131.97 ms. The homepage score/LCP differences are within run variation.
Film-player CPU attribution fell from 683 ms (Snapshot) / 643 ms (Quit28) to below
the audit's reporting threshold, rather than literally zero work.

## DevTools traces

The first retained Lighthouse run for each page/version includes a Chrome DevTools
trace. Raw EvaluateScript durations below are measured trace times, without the
simulated 4× multiplier. They are not directly comparable to Lighthouse's modelled
CPU attribution above.

| Page/script | Initial script evaluation before → after |
| --- | --- |
| Homepage sky.js | 2.44 → 5.92 ms |
| Snapshot film-player.js | 135.93 → 1.48 ms |
| Quit28 film-player.js | 105.56 → 0.95 ms |

The film's synchronous AudioContext construction dominated its original startup.
Sky now resolves the visitor's actual time-zone place before first paint instead
of painting an offset-based approximation and correcting it later. That small
initial cost is retained deliberately to prevent a wrong-sky flash.

Raw reports, traces, measurement scripts and functional evidence are at
`/tmp/portfolio-perf-startup/` on Home. Trace filenames are
`{before,after}-{home,snapshot,quit28}-1.trace.json`, suitable for loading into
Chrome DevTools Performance. Lighthouse reports use the same prefix and run
numbers 1–3, with `.json`. `measure.mjs` records the exact methodology.

## Implementation

- Sky: cache colour parsing, publish one set of root custom properties per frame,
  remove the duplicate DOM-ready colour paint, and queue favicon/storage work
  after load and idle. Keep the existing async favicon encoder.
- Film: construct Web Audio only on a film tap or sound-button activation. Stream
  the two tracks through the existing gains instead of fetching and decoding whole
  files at startup. Synchronise each track to the current picture when ready and
  after buffering, seeking, rate changes or loops. No audio sync animation runs
  during initial muted playback. Unrelated page interactions keep audio off.

## Checks

Chrome with a 390×844 viewport and Europe/London time zone:

- Silent films advance with zero audio contexts, zero explicit decodes and zero
  audio requests. Posters and matching tall films each have one selected URL.
- At 1440×1000, only matching wide posters and wide films are requested.
- At reduced motion, neither video nor audio is fetched before activation.
- First sound, with a 1.6 Mbps / 150 ms connection: Snapshot 1.13 s, Quit28 1.77 s.
  Subsequent toggles: 33 / 30 ms. Cold sound is network-dependent, not instantaneous.
- Both streamed tracks produce non-zero audio signals. Normal-speed sampled drift
  stays below 4 ms; after seeking through the loop it stays below 3 ms. At half
  speed both tracks follow 0.5×, with sampled drift around 33 ms (within the existing
  120 ms resync tolerance). Mute/unmute works and no page errors were recorded.
- Every minute's calculated sky colours match the baseline. At `?t=06:30`,
  `?t=13:00`, and `?t=21:00`, the sky variables set synchronously in the head match
  those after load. Time-bar scrubbing reaches 06:30, and Shift+D's sweep returns
  to the live clock in Sky mode.
- JavaScript syntax checks and git diff whitespace checks pass.

Checks use desktop Chrome with mobile emulation, not physical iPhone/Safari audio.

## Left alone

HTML/CSS, copy, effects, film files and audio levels are unchanged. Both case pages
already use `preload="none"` and responsive high-priority poster preloads; the
player already waits for the poster to draw before autoplay. Their 3.5/2.9 MB tall
films still download when visible because autoplay is part of the existing effect.
No Shipped files were edited. Nothing was pushed or deployed.
