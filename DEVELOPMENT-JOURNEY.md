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
change and three documented no-change stops. The full record is
`photorealism-journey.html`, generated from `generations/round-data.json`;
every generation's frames are under `generations/`, labelled.

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
