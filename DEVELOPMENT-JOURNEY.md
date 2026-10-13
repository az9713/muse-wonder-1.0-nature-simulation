# Development Journey — Phenomena, from a Grok reference to a five-round photorealism study

**Date:** 2026-10-12 to 2026-10-13
**Deliverable:** https://az9713.github.io/muse-wonder-1.0-nature-simulation/ (source: https://github.com/az9713/muse-wonder-1.0-nature-simulation)
**Brief:** "Refer to https://github.com/az9713/grok-4.7-nature-simulation" — followed by: "i want you to rebuild the same natural scenes with synthesized sound but much more photorealistic than those created by Grok 4.7. AMIAQ=ask me if any question"
**Final render/artifact:** `docs/previews/` (five scene frames), `photorealism-journey.html`, `generations/gen5-final/`

## 1. The brief — what was actually being asked

The user pointed at someone else's finished piece — az9713/grok-4.7-nature-simulation,
five code-drawn natural scenes (river, falls, aurora, eruption, storm) with
synthesized sound, built by Grok 4.7 — and asked for the same five scenes,
rebuilt to be "much more photorealistic", with AMIAQ (ask me if any question).

Three ambiguities were resolved by asking, not guessing (structured questions
were used repeatedly across the whole project):

- Scope: all five scenes, not a subset.
- Assets: pure procedural, code-only — no photographs, no sampled audio, in
  the same spirit as the original.
- Quality target: cinematic desktop.

That interpretation governed everything after. The original was never forked
as code; it was read as a reference — scene list, page structure, README style,
GitHub Pages pattern — and reimplemented. Calling the result "the same scenes"
is accurate at the level of subjects and site shape, not code lineage.

Invisible constraints that shaped the output: the user's standing preference
for honest verdicts over flattering ones (they repeatedly asked "which is more
photorealistic, explain why" and accepted answers that scored our own work
worse), and the rule adopted mid-project that every visual claim must be
checked against a captured frame before it is stated.

## 2. Cold start — how the sessions got to a working state

This project spans more than one agent session, and the seams matter.

The first session (Muse Code 1.0.2, model muse-spark-1.3-contributor) died
on contact with the environment: its very first shell command failed with
`sandbox enforcement unavailable: embedded Linux executable image /proc/self/exe
cannot be resolved during initialization: No such file or directory (os error 2)`,
file reads for `package.json` and `README.md` returned "No such file or
directory", and the agent correctly reported an empty workspace instead of
inventing output. That transcript survives in the workspace and was later
recovered from the session store (`01a13195-3430-7a71-9ad6-ca44d25ee354`).

The main build session ran on Muse Code 1.4.6 / muse-wonder-1.0 in
`the workspace folder`, an empty folder at the start. Node,
Vite 6 and Three.js 0.170 were already usable; textures and sound had to be
procedural by the brief, so no asset pipeline was needed.

That session stalled once, hard: a provider failure —
`model_stream_first_event_timeout`, "no model output arrived" over 35m1s —
killed it mid-task (an aurora improvement) and a `/handoff-after-clear` was
interrupted. Recovery in the next session did not rely on memory: it read the
dead session's own log in Muse's session store
(`01a13197-326d-78c1-833f-e66572d23578`, 89 MB, 10,220 lines), found the exact
uncommitted state — a half-finished aurora using Three.js `Reflector` for a
true mirror lake — and continued from there. Rule learned: a prior session's
log in the agent's own store is evidence; a summary of it is not.

At minute zero of the final session (the five rounds, Section 4), the state
was: repo pushed at `f52b936`, a Vite dev server already running on port 5180,
a headless Chrome shell binary present under `/tmp/browsers/` (though not on
PATH — `command -v chrome-headless-shell` returns 127, a probe result that
had to be respected and worked around by using the known binary path), and an
open user complaint with a screenshot: clicking the findings grid did nothing.

What was reused instead of re-derived: the Grok repo's README and Pages
patterns, the project's own capture tooling pattern (headless Chrome at
1280×708 with `--virtual-time-budget=12000`), the jpeg-js/pngjs encoder pair
kept outside the repo, and every prior verdict — the comparisons were never
re-litigated, only extended.

## 3. Design decisions

**Stack: Three.js 0.170 + custom GLSL + Web Audio API + Vite 6.** Chosen
because the reference used it (same stack makes the comparison honest), and
because procedural GLSL and canvas-baked textures satisfy the no-assets brief.
Rejected: copying the Grok code as a base (the brief was a rebuild, and reuse
would have made "more photorealistic" a claim about someone else's shaders);
external image/sound assets (against the brief); a game engine (absurd for a
browser piece).

**True 3D landscapes instead of the reference's flat shader scenes.** Heightfield
terrain (`src/nature.js` `terrain()`), instanced rocks and trees, shadow-casting
lights, per-scene fog — because "photorealistic" was judged in stills, depth
and shadow were the cheapest believable cues. The cost, discovered later, is
that real geometry exposes itself (facets, stylised cones) in a way flat
gradients never do. That trade drives the whole middle of this document.

**A photographic post chain for every scene:** ACES tone mapping, UnrealBloom,
BokehPass depth-of-field, then a final grade ShaderPass (desaturation to 0.94,
vignette, film grain) — all in `src/main.js`. If one mechanism carries the
project's look, it is this chain, not any single scene.

**Sound fully synthesized, started only on a user gesture** ("Hear the scene"),
because browsers block audio before interaction. Per-scene Web Audio graphs in
`src/audio.js`: filtered noise beds, sub-oscillators for eruption/storm, aurora
shimmer, scheduled birdsong on the river, and thunder delayed by scripted
lightning distance (`STRIKES` in `src/scenes.js`).

**Site shape mirrors the reference exactly:** README with a clickable preview
table, `docs/previews/`, `.github/workflows/pages.yml`, Vite base path set only
under `GITHUB_PAGES=true`. Pages serves only the build output — a fact that
bit twice (see Section 6, items 5 and 7).

**Comparisons published as self-contained HTML pages** (`comparison.html`,
`findings.html`, `photorealism-journey.html`) with frames embedded as base64
JPEG, so each page can be opened standalone and its claims checked without the
repo. The findings page's fifteen frames later became playable in place
(Section 6, item 6).

**What was deliberately not built:** no external assets, no backend, no user
accounts, no settings UI, no mobile-specific rendering path (quality target
was cinematic desktop, stated in the brief answers). Each absence is a choice
from Section 1, not an oversight.

## 4. The photograph problem — the core of this project

The project's crux arrived disguised as a compliment. After the first rebuild
was published (`db73c72`), the user asked for a scene-by-scene photorealism
comparison against Grok 4.7. The honest answer was **Grok wins 5–0**.

That verdict, checked frame by frame, is the most valuable artifact in the
repo, because it named the actual mechanism of photographic realism in this
medium: Grok's frames are simple, but softness, haze, blur and restrained
colour hide every synthetic cue, while the rebuild's real terrain, trees and
rocks exposed theirs — lollipop trees, hard facets, a giant black foreground
boulder on the river, a waterfall rendered as a flat white rectangle. More
scene, less photograph. Every later improvement is that sentence applied:

- Cinematic rebuild (`08c8915`): low, close cameras composed like photographs;
  clean foregrounds; foliage masses instead of stylised trees; real
  depth-of-field; muted filmic grade. Took the river. Tally 1–4.
- Gap-closing round (`914738f`), then falls/eruption/storm (`7ab63df`):
  long-exposure falls close-up, cracked-crust lava, storm seascape with
  visible streak rain. Tally 4–1, aurora still Grok's.
- Aurora (`554a8e2`, recovered from the stalled session): the frozen lake
  became a true planar mirror (`Reflector`) under a translucent water layer,
  curtains gained a violet crown. Tally 5–0 — published with all frames
  re-shot, each win described as narrow, because they are.

The same discipline produced the three-way findings page (`findings.html`,
Grok | first Muse build | current Muse build, fifteen fresh frames), built
so a human can audit the 5–0 claim in seconds — and, once it was clickable,
audit it by *playing* each version (Section 6, item 6).

The final session's five rounds then pushed past the comparison, asking of
each scene: what is the single least photographic element in this frame, and
at which exact code constant does it live? Method per round: capture five
frames; write the hypothesis *before* editing; change the smallest constant;
re-capture; keep, adjust, or revert per scene. Results: the falls improved
clearly (its spray, long the worst element in any scene, became a mist plume);
the river clearly (haze without cotton patches, contained sun); eruption and
storm mildly (highlight and rain control); aurora not at all after Round 1 —
which is a result, and is documented as one, alongside a reverted river colour
change and three documented no-change stops. The full record is Section 4A below and
`photorealism-journey.html`, generated from `generations/round-data.json`;
every generation's frames are under `generations/`, labelled.

## 4A. The five rounds in full

Each round below follows the same contract: findings grounded in exact code constants, written *before* any edit; the smallest change at those constants; a fresh five-scene capture; and a verdict per scene — including the scenes where the honest verdict was *no change*. Generation labels name the frame folders under `generations/` (five JPGs each, 1280×708); the same tables with frames are in `photorealism-journey.html`. Working notes as written at the time are in `generations/round-notes.md`; this section is generated from `generations/round-data.json`.


### Round 1 — Light & colour: taming blown highlights


**Generation artifacts:** `generations/gen0-baseline/` → `generations/gen3-true/` (labelled in the journey tables as gen0-baseline → gen3-true).


**Findings before any change (grounded in the code):**

- River: the sun disc is blown to white (exposure 1.12 in createRiver, src/scenes.js) and water 0x24382e reads teal against the warm sky; valley mist (size 7, opacity 0.05) is too faint to soften the banks.
- Falls: spray (900 points, size 0.34, opacity 0.42) renders as white polka dots — the least photographic element in any scene; the sheet itself is pale.
- Aurora: snow (size 0.15, opacity 0.50) sparkles as artifacts over the lake; the translucent lake (opacity 0.34) dilutes the true Reflector mirror; bloom 0.55 halos the curtains.
- Eruption: lava is blown neon — crust shader multiplier 1.9, bloom 0.65 at threshold 0.50, crater glow up to about 1250 (src/scenes.js createEruption) — and the cone is a featureless silhouette.
- Storm: rain (opacity 0.34, 0.55-long LineSegments streaks) reads as bright dashes against a flat grey sky (fog density 0.0068 in ATMOS, src/main.js).


**Changes made:**

- River: exposure 1.12→1.05 (later 1.00 in Round 4), water 0x24382e→0x33473a, mist opacity 0.05→0.07 as part of the combined first implementation.
- Falls: spray size 0.34→0.20, opacity 0.42→0.30 (Round 1 step; superseded by the Round 3 mist plume).
- Aurora: snow size 0.15→0.11, opacity 0.50→0.36; lake opacity 0.34→0.26 so the mirror shows through; bloom 0.55→0.48.
- Eruption: bloom 0.65→0.48, threshold 0.50→0.55, exposure 1.08→1.02, crust multiplier 1.9→1.45.
- Storm: rain opacity 0.34→0.26, streak length 0.55→0.75 at both spawn and update sites, fog 0.0068→0.0078.


**Verdict, scene by scene:**

- Honest status: the gen1-round1 frames captured in this round were later found to be stale-server re-renders (see the wart section below), so Round 1 has no standalone frame verdict. Its changes are judged cumulatively in the Round 3 true capture.
- Combined Rounds 1–3 verdict (gen0-baseline → gen3-true): the falls improved clearly, the river mixed, the eruption not yet, the storm mildly, the aurora stable. Full scene verdicts are under Round 3.


### Round 2 — Surface detail: spray, lanes, rays, crust


**Generation artifacts:** `generations/gen0-baseline/` → `generations/gen3-true/` (labelled in the journey tables as gen0-baseline → gen3-true).


**Findings before any change (grounded in the code):**

- Falls: shrinking spray points in Round 1 could not fix the dots, because src/nature.js particles() uses PointsMaterial with a soft sprite — small points stay hard-edged; the lever is size × opacity in the other direction.
- Falls sheet: lanes are quantised by floor(vUv.x*9.0) in the fall shader, giving nine broad stripes instead of broken ribbons.
- Aurora: curtain rays use noise at vUv.x*64 — coarse; the Reflector renders at 1024², softening the treeline reflection.
- Eruption: crust detail is quantised at vUv*vec2(6,22) with plates at vec2(10,30); the point glow (900, then 650+pulse·600) washes it out.
- Storm: 2200 rain streaks are sparse at 1280×708; the sea colour 0x111e26 is a touch bright against the sky.


**Changes made:**

- River: aperture 0.0016→0.0022 for stronger depth-of-field on the foreground trees; water opacity 0.88→0.84.
- Falls: spray 900→1400 points (interim step toward the Round 3 plume); lanes floor(vUv.x*9.0)→*13.0; dark-lane base vec3(0.09,0.16,0.19)→vec3(0.06,0.12,0.15).
- Aurora: rays 64→80; curtain alpha 1.7→1.55; Reflector 1024→2048.
- Eruption: crust vec2(6,22)→vec2(8,30); plates vec2(10,30)→vec2(14,40); glow 900→700 and 650+pulse·600→500+pulse·400.
- Storm: rain 2200→2800 streaks; sea 0x111e26→0x0e1a22.


**Verdict, scene by scene:**

- Same honest status as Round 1: gen2-round2 frames were stale-server re-renders and are preserved as artifacts of the mistake, not as evidence. The changes above stand or fall in the Round 3 true capture.
- Lesson recorded at the time and kept: a capture only proves something about the code the server actually served — verify the served module before believing a frame.


### Round 3 — Atmosphere & depth (and the stale-server wart)


**Generation artifacts:** `generations/gen0-baseline/` → `generations/gen3-true/` (labelled in the journey tables as gen0-baseline → gen3-true).


**Findings before any change (grounded in the code):**

- Falls: the spray must become a mist plume — 1800 large (0.90), very faint (0.08) soft sprites — reversing Round 2's failed shrink direction, as the particles() implementation requires.
- River: fog 0.0042 and mist at opacity 0.07 leave the banks hard; depth needs air, not more objects.
- Aurora: ATMOS fog is already the lowest of the five (0.0018); more haze would dim the curtains and mirror that carry the scene — a grounded reason to leave it alone this round.
- Eruption: ash (size 0.5, opacity 0.45) reads as specks; as a larger, fainter veil (0.7 / 0.32) it should read as air.
- Storm: the scud cloud planes (nearest opacity 0.42) barely register under fog 0.0078; the nearest plane needs 0.52.


**Changes made:**

- Falls: spray → 1800 / size 0.90 / opacity 0.08.
- River: fog 0.0042→0.0052; mist size 7→9, opacity 0.07→0.09 (later corrected in Round 4).
- Aurora: NO CHANGE this round — documented reasoning above, no edit made.
- Eruption: fog 0.0052→0.0060; ash size 0.5→0.7, opacity 0.45→0.32.
- Storm: fog 0.0078→0.0088; nearest scud opacity 0.42→0.52.
- Process fix (the important change): the dev server was restarted and the served src/scenes.js was grepped for the new constants before the gen3-true capture — the check that now precedes every capture.


**Verdict, scene by scene:**

- Falls — IMPROVED, clearly. The plunge-pool spray finally reads as mist; the polka dots are gone. This is the single biggest gain of the five rounds.
- River — MIXED. Mist at size 9 / opacity 0.09 shows as cotton patches on the banks (corrected in Round 4); water still teal against the warm sky.
- Aurora — stable by design (no change); mirror and curtains continue to carry the scene.
- Eruption — NOT improved overall yet. Glow reductions are invisible next to the sky dome's sun (pow(s,900)·18 in skyDome, src/nature.js), which is shared by all scenes.
- Storm — mildly improved mood; rain still reads as dashes in stills, a LineSegments geometry limit rather than a constant problem.


### Round 4 — Motion & the stubborn highlights


**Generation artifacts:** `generations/gen3-true/` → `generations/gen4-round4/` (labelled in the journey tables as gen3-true → gen4-round4).


**Findings before any change (grounded in the code):**

- River: cotton-patch mist (Round 3 overshoot) — the sprites need to be larger and fainter still: size 12, opacity 0.06; exposure 1.05 still blows the sun, 1.00 is the floor that keeps the glitter.
- Falls: the crest mixes 0.4 white at vUv.y>0.92 exactly where the sheet rises into the sky, washing the top of the falls; 0.15 keeps the lip without the glare.
- Aurora: snowfall speed 0.7+(i%5)·0.12 is brisk for a still night; 0.55+(i%5)·0.09 calms the motion. A motion-only change — no still-frame claim is made for it.
- Eruption: the dome sun can be dimmed per-scene through skyDome's sunColor (0xff8a4a→0xe07a42) without touching the shared shader; bloom 0.48→0.38 trims the remaining halo.
- Storm: rain opacity 0.26→0.20 is the last constant-level dimming before the dashes become a geometry rewrite.


**Changes made:**

- River: mist size 9→12, opacity 0.09→0.06; exposure 1.05→1.00.
- Falls: crest mix 0.4→0.15 in the fall shader.
- Aurora: snowfall speed 0.7+(i%5)·0.12 → 0.55+(i%5)·0.09 (motion only).
- Eruption: bloom 0.48→0.38; dome sun colour 0xff8a4a→0xe07a42.
- Storm: rain opacity 0.26→0.20.
- Served code verified (mist size 12, bloom 0.38 grepped from the live module) before the gen4-round4 capture.


**Verdict, scene by scene:**

- River — IMPROVED. The cotton patches are gone; the banks are haze, and the sun is contained without losing the glitter path.
- Falls — kept. Crest wash reduced, mist plume stable; no regression.
- Aurora — still-equivalent by design (motion-only change); reported as such, not as a visual win.
- Eruption — MILDLY IMPROVED. The sun disc is smaller and dimmer and the halo is trimmed; the flow stays bright because the flow is the subject.
- Storm — MILDLY IMPROVED. Dimmer rain reads more like weather; the dash texture remains the known geometry limit.


### Round 5 — Final polish, and knowing when to stop


**Generation artifacts:** `generations/gen4-round4/` → `generations/gen5-round5/` (labelled in the journey tables as gen4-round4 → gen5-round5).


**Findings before any change (grounded in the code):**

- River: the water colour constant (uColor in the water shader, src/nature.js) is dominated by its fresnel and sun-glint terms, so a warmer base (0x33473a→0x3a4a3c) was predicted to be weak — worth one measured attempt, honestly reported either way.
- Falls: sheet, lanes, crest and mist plume are balanced; the next lever would be crest geometry, which risks the composition that already carries the scene.
- Aurora: curtains, 2048² mirror, snow and bloom sit at their balance point; every lever from Rounds 1–4 is either active or documented as neutral. Further change would be churn, not improvement.
- Eruption: highlight headroom remains only at exposure (1.02→0.98) and the crust multiplier (1.45→1.30) without bending the shared skyDome sun term for one scene.
- Storm: the rain dashes are inherent to LineSegments geometry; the real fix (textured quads) is a rewrite with performance risk for a marginal still-frame gain.


**Changes made:**

- River: water 0x33473a→0x3a4a3c attempted, measured, and REVERTED (see verdicts) — final river code is the Gen4 state.
- Falls: NO CHANGE — documented stop (crest-geometry risk outweighs remaining gain).
- Aurora: NO CHANGE — documented stop (balance point reached in Rounds 1–4).
- Eruption: exposure 1.02→0.98; crust multiplier 1.45→1.30.
- Storm: NO CHANGE — documented stop (LineSegments rewrite out of proportion to the gain).
- Served code verified (0x3a4a3c and crust 1.30 grepped live) before the gen5-round5 capture; all five scenes re-captured fresh, including the three unchanged ones.


**Verdict, scene by scene:**

- River — NO overall improvement from the colour attempt: the Gen5 frame is indistinguishable from Gen4, exactly as the shader reading predicted. Per the goal's rule the change was reverted, so the shipped river is the Gen4 frame (left column of this round's table).
- Eruption — MILDLY IMPROVED, kept. At exposure 0.98 and crust 1.30 the crust texture reads through the glow instead of drowning in it.
- Falls, Aurora, Storm — no change, by documented decision. Their Gen5 frames are fresh captures of unchanged code and match Gen4, which is the point: the process stopped where the evidence stopped.
- End state after five rounds: falls and river clearly better than Gen0, eruption and storm mildly better, aurora held at its best — and no scene made worse. That is where constant-level iteration runs out; the next gains would need new geometry or shaders, a different project, honestly out of scope here.

## 5. Tools and features used

| Tool | What it did in this project |
|---|---|
| Muse Code (1.0.2 → 1.4.6; muse-spark-1.3 → muse-wonder-1.0) | All implementation, capture, verification, publishing across sessions |
| Muse session store (`~/.local/share/muse/sessions/`) | Recovery of the stalled session's exact uncommitted state after the provider failure |
| `gh` CLI | Authenticated pushes, Pages deployment watching, live verification (`gh run watch`) |
| Headless Chrome shell (`/tmp/browsers/chrome-headless-shell-linux64/`) | Every screenshot in the project: scene frames, page smoke checks, the live-grid playback proof |
| Vite 6 (port 5179/5180 dev; Pages build) | Dev server and production builds for the five pages |
| Three.js 0.170 (`Reflector`, BokehPass, UnrealBloomPass) | Rendering, the aurora's true mirror, depth-of-field and bloom |
| Web Audio API | Fully synthesized per-scene sound; distance-delayed thunder |
| jpeg-js + pngjs (kept outside the repo) | PNG→JPG conversion for every committed preview frame |
| Python 3 + Node scripts in `generations/` | `capture.mjs` (frames), `make-journey.mjs` + `round-data.json` (the journey report) |
| Node test (`tests/findings-live-grid.test.mjs`) | Durable regression check that all 15 findings frames play live in-cell |

Subagents and advisor tools: this work was done inline in the main sessions;
no delegated agent produced any part of the deliverable. Structured user-input
questions were used at scope forks (Section 1, findings-page choices, and the
playable-grid choices) — each answer is a human decision recorded in the
transcript, not an agent inference.

## 6. What went wrong, and the fixes

1. **Dead first session.** `sandbox enforcement unavailable: … /proc/self/exe
   cannot be resolved` plus empty-workspace reads. The agent reported the
   failure instead of fabricating output; the project simply restarted under
   a fixed environment after `muse` updated 1.0.2-R2040.1 → 1.4.6-R6000.1.
2. **Provider death mid-aurora.** `model_stream_first_event_timeout` — "the
   model service did not start responding … (2 failed attempts over 35m1s)".
   The aurora's `Reflector` rework sat uncommitted. Fixed by recovering from
   the session log and finishing it; the commit landed as part of `554a8e2`.
3. **Wrong conclusions from the first river frames.** A huge black foreground
   boulder and teal water nearly defined the scene's verdict before the frames
   were re-read side by side; the re-read changed the river text (not the
   verdict) and directly motivated the cinematic rebuild. Lesson, applied ever
   since: inspect the actual frame's pixels before writing a sentence about it.
4. **Lava flow invisible.** The eruption's glowing river was missing in frame:
   backface culling on the ribbon (`side: THREE.DoubleSide` was the fix). It
   had been "verified" by code reading alone. Lesson: a shader you have not
   screenshotted does not exist.
5. **Captures from the wrong root.** During the findings build, two extra Vite
   servers started with `npx --prefix` served the *current* workspace on all
   three ports, so the first "three-way" capture set was three copies of one
   build. Caught only because the frames looked identical; fixed by starting
   each server from its own root and checking frame hashes. A second version
   of this trap: the Vite dev server fell back to the current player for
   `/prev/`, so the hosted prev build had to be verified from the production
   `dist` output — which exposed the real prev (lollipop trees and all).
6. **The grid that wasn't live (the user's screenshot).** The findings frames
   were `target="_blank"` links; from the user's seat, clicking did nothing
   useful and the table was not "live". Fix, in two acts: first every frame
   was made to play its animation (Grok live, current live, and the initial
   build rebuilt and hosted under `public/prev/` — 540 KB — because it existed
   nowhere live); then, after the user's screenshot proved links still weren't
   the ask, each frame was made to swap a live `<iframe>` player into its own
   grid cell on click (label click stops it) — one WebGL context per click, so
   the browser context limit is never hit. Covered by
   `tests/findings-live-grid.test.mjs`, which failed before the fix
   (`AssertionError: findings page never creates an iframe`) and passes after.
7. **Pages serves only `dist`.** The journey report's generation frames
   initially lived only in `generations/`, which GitHub Pages never serves;
   the live page would have shipped with broken images. Fixed by mirroring the
   JPGs to `public/generations/` (4.1 MB) so the build output carries them.
8. **The stale-server rounds (the expensive one).** In the five-round session,
   the port-5180 dev server served the Gen0 module for three rounds: the Vite
   watcher on the Windows-mounted workspace filesystem missed the edits,
   so `gen1-round1`, `gen2-round2` and the first `gen3-round3` captures are
   re-renders of old code with animation variance. The giveaway was grepping
   the served module and finding the falls spray still at
   `count: 900, size: 0.34, opacity: 0.42` after Round 3 supposedly changed
   it. Disposition: the frames are kept, labelled as stale-server artifacts
   (`generations/gen1-round1/` etc.), the original "kept" verdicts were
   withdrawn in `generations/round-notes.md`, the server was restarted, and
   every later capture was preceded by a served-code grep. Rule learned,
   verbatim-worthy: grep the served code before believing any frame.
9. **Spray fixed in the wrong direction, twice.** The falls' polka-dot spray
   was attacked by shrinking `PointsMaterial` points (Rounds 1–2) — which made
   the dots *harder*. Only reading `particles()` in `src/nature.js` (soft sprite,
   `sizeAttenuation`) showed the fix was the opposite: 1800 points at size 0.90
   and opacity 0.08, blurred by depth-of-field into mist. Wrong twice, then
   right, for a stated reason each time.
10. **A test harness bug that looked like a product bug.** The automated
    live-grid check first "proved" clicks navigated away — because the
    synthetic `MouseEvent` was dispatched with `cancelable` unset (false), so
    `preventDefault()` could not apply. Real mouse clicks are cancelable; the
    product was fine, the probe was wrong. The corrected probe
    (`cancelable:true`) shows the live cell playing. Lesson: when a check
    disagrees with the code's real behaviour, the check is the first suspect.
11. **Minor and honest.** The bundled `chrome-headless-shell` runner is absent
    from PATH (`command -v chrome-headless-shell` → 127); browser verification
    used the known binary path instead of installing anything. One commit
    (`554a8e2` → push) raced `gh run list`, which returned the *previous*
    deployment as "success"; the correct run (38427780491 for the final push)
    was identified and watched explicitly.

Human-in-the-loop moments, for reproducibility: the initial scope answers
(all five scenes, procedural-only, cinematic desktop); "commit and push …
use gh cli … exactly the same [style] as the grok repo"; the request to
compare honestly; the three-way findings choices (initial build as "prev",
fresh captures, new live page); the playable-grid choices (host prev inside
the site, open in new tab — later superseded by in-cell play after the
user's screenshot); the five-round goal itself; and this document ("yes. then
commit and push").

## 7. Verification

Nothing in the "it works" column rests on an exit code alone.

- **Builds:** `npm run build` passed after every published change, most
  recently producing all five pages (`index`, `journey`, `comparison`,
  `findings`, `photorealism-journey`).
- **Frames:** every visual verdict in the comparisons and the five rounds was
  read from inspected screenshots (1280×708, headless Chrome, swiftshader) —
  roughly 60 captures across the project. From Round 3 onward each capture was
  preceded by a grep of the *served* module for the round's new constants.
- **Live grid:** instrumented DOM check (`after:iframes=1 playing=1`) plus an
  inspected screenshot of the Grok river playing inside its findings cell.
- **Durable test:** `node tests/findings-live-grid.test.mjs` — asserts 15
  correctly-addressed play links, in-cell iframe creation and the stop toggle;
  observed failing before the fix and passing after.
- **Deployments:** each push's Pages run was watched to success with `gh`
  (final run 38427780491, build 26s), followed by HTTP 200 checks on the live
  pages and their image assets, and content greps on the live HTML.
- **Not verified:** aurora's slower snowfall (Round 4) is a motion change
  judged from code — stills cannot show it, and the journey says so; real-user
  GPU performance (all captures are software-rendered); audio, which requires
  a human click and ears. The findings page's three "current" *stills* predate
  the five rounds; the live cells and the journey tables are the current record.

Costs and limits: no quotas or rate limits were hit at any point. Wall-clock
was dominated by screenshot budgets (`--virtual-time-budget=12000` per frame)
and one 35-minute provider outage (item 2). Agent token usage is not metered
in this document because no budget was set for the sessions.

## 8. Where things stand

Live and current: the player, comparison (5–0), three-way findings with the
live grid, and the five-round journey are all published from `main` at
`593ba8b` plus this document. Working tree: clean except the user's own
`README.txt` and `.ignore/`, untracked since the first day and never committed
by design.

Knowledge captured durably: the comparisons and round record
(`comparison.html`, `findings.html`, `photorealism-journey.html` +
`generations/round-data.json` and `round-notes.md`), the regression test in
`tests/`, the capture tooling in `generations/capture.mjs` and
`make-journey.mjs`, and this file. Nothing of substance lives only in a chat
transcript anymore.

Unfinished business, honestly stated: the falls' crest is still geometry, not
water (the next fix is shape, and was declined in Round 5 as out of
proportion); storm rain is still `LineSegments` (a textured-quad rewrite was
considered and declined on the same grounds); the eruption's sun lives in a
shared dome shader and was only ever tamed per-scene; and roughly forty
intermediate PNG captures sit untracked in `generations/` — kept because this
project does not delete files, at about 1.3 MB each they were simply never
worth committing next to their JPG twins. The deliverable stands without all
of these; each is an option, not a promise: (a) commit the PNG masters,
(b) rebuild falls crest geometry / storm rain quads as a sixth round,
(c) re-shoot the findings page's three current-column stills from Gen5-final.

One-line summary for a future session: **read the frame, grep the served code,
change one constant, and write down why you stopped.**
