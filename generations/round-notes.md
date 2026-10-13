# Photorealism journey — working notes (Gen0 = pushed 5-0 build)

## Gen0 baseline findings (frames: generations/gen0-baseline/)
- River: sun disc blown to white (exposure 1.12 in createRiver); water 0x24382e reads teal against the warm sky; mist (size 7, opacity 0.05) too faint to soften banks.
- Falls: spray particles (size 0.34, opacity 0.42, 900) render as white polka dots — the least photographic element in any scene; the sheet is pale and low-contrast.
- Aurora: snow particles (size 0.15, opacity 0.5) sparkle as artifacts over the lake; translucent lake (opacity 0.34) dilutes the Reflector mirror; bloom 0.55 halos the curtains.
- Eruption: lava is blown neon (crust shader multiplier 1.9 + bloom 0.65 @ threshold 0.5 + glow up to 1250); the cone reads as a featureless silhouette.
- Storm: rain (opacity 0.34, 0.55-long streaks) reads as bright dashes; flat grey sky has no depth (fog 0.0068).

## Round 1 — light & colour (hypothesis before editing)
Tame every blown highlight and artifact particle at its code constant; do not move cameras or geometry.
- River: exposure 1.12->1.05, water 0x24382e->0x33473a, mist opacity 0.05->0.07.
- Falls: spray size 0.34->0.20, opacity 0.42->0.30.
- Aurora: snow size 0.15->0.11, opacity 0.50->0.36; lake opacity 0.34->0.26; bloom 0.55->0.48.
- Eruption: bloom 0.65->0.48, threshold 0.50->0.55, exposure 1.08->1.02; crust multiplier 1.9->1.45.
- Storm: rain opacity 0.34->0.26; streak length 0.55->0.75 (both spawn and update); fog storm 0.0068->0.0078 (src/main.js ATMOS).

## Round 1 verdict (gen0-baseline -> gen1-round1)
- River: kept. Sun still blown but water is less teal; mist softens banks slightly.
- Falls: kept, marginal. Spray dots smaller yet still read as polka dots (size 0.20/opacity 0.30 not enough); sheet unchanged pale.
- Aurora: kept. Fewer sparkle artifacts, mirror slightly clearer.
- Eruption: kept. Crust mottling now visible inside the flow; sun/lava still blown.
- Storm: kept. Longer, dimmer rain streaks and darker sky read more like weather.

## Round 2 — surface detail (hypothesis before editing)
The remaining fakes are surface-scale: spray points, fall lane width, curtain ray frequency, crust crack scale, rain density.
- River: aperture 0.0016->0.0022 (stronger photographic DOF on foreground trees); water opacity 0.88->0.84.
- Falls: spray 900/0.20/0.30 -> 1400/0.14/0.18 (mist, not dots); fall lanes floor(vUv.x*9.0) -> *13.0; dark lane base vec3(0.09,0.16,0.19) -> vec3(0.06,0.12,0.15).
- Aurora: curtain rays noise x*64 -> x*80; alpha 1.7 -> 1.55; Reflector texture 1024 -> 2048.
- Eruption: crust p vUv*vec2(6,22) -> vec2(8,30); plates vec2(10,30) -> vec2(14,40); point glow 900 -> 700 and update 650+pulse*600 -> 500+pulse*400.
- Storm: rain 2200 -> 2800 streaks (same material); sea colour 0x111e26 -> 0x0e1a22.

## Round 2 verdict (gen1-round1 -> gen2-round2)
- River: kept. Stronger DOF softens foreground trees; frame otherwise stable (not worse).
- Falls: kept but spray STILL reads as dots. Root cause found in src/nature.js particles(): PointsMaterial with a soft sprite — shrinking points made them harder, not softer. Direction must reverse: large, very faint points.
- Aurora: kept. Curtains finer, less blown; mirror stable at 2048.
- Eruption: kept, marginal. Crust scale finer; flow still bright by design, cone still silhouette.
- Storm: kept. Denser rain, darker sea; sky still flat — atmosphere is the remaining lever.

## Round 3 — atmosphere & depth (hypothesis before editing)
- River: ATMOS fog 0.0042->0.0052; valley mist opacity 0.07->0.09, size 7->9.
- Falls: spray 1400/0.14/0.18 -> 1800/0.90/0.08 — a soft mist plume instead of dots (reverses Round 2's failed direction, documented above).
- Aurora: NO CHANGE this round. ATMOS aurora fog is already the lowest (0.0018); more haze would dim curtains and the mirror that carry the scene. Reasoning documented, no edit.
- Eruption: ATMOS fog 0.0052->0.0060; ash size 0.5->0.7, opacity 0.45->0.32 (veil, not specks).
- Storm: ATMOS fog 0.0078->0.0088; nearest scud plane opacity 0.42->0.52 so cloud mass registers.

## WART discovered after Round 3 (affects Gen1-Gen3)
The 5180 dev server still served the Gen0 module (`curl /src/scenes.js` showed spray count 900 / size 0.34 / opacity 0.42 after Round 3 edits). The Vite watcher on the Windows-mounted filesystem missed the edits, so gen1-round1, gen2-round2 and gen3-round3 frames are re-renders of Gen0 code with animation variance — NOT evidence for the Round 1-3 hypotheses. Their per-round "kept" verdicts above are therefore withdrawn. Gen0 remains valid (captured before any edit). Fix: restart the dev server, verify the served module contains the new constants, then capture the cumulative Round 1+2+3 state as the true Gen3. Rounds 4-5 verify served code before every capture.

## True Gen3 verdict (gen0-baseline -> gen3-true, cumulative Rounds 1-3, verified served code)
- Falls: IMPROVED, clearly. Large faint spray sprites + DOF finally read as mist at the plunge pool; the polka dots are gone.
- River: MIXED. Mist (size 9, opacity 0.09) now shows as cotton patches on the banks; water still teal against warm sky.
- Aurora: stable (no Round 3 change, as documented); mirror and curtains carry it.
- Eruption: NOT improved overall. Glow reductions are invisible next to the sky-dome sun disc (pow(s,900)*18 in skyDome) and the still-neon flow.
- Storm: mildly improved mood; rain still reads as bright dashes in stills.

## Round 4 — motion & the stubborn highlights (hypothesis before editing)
- River: mist size 9->12, opacity 0.09->0.06 (haze, not patches); exposure 1.05->1.00.
- Falls: crest wash — fall shader mixes 0.4 white at vUv.y>0.92 where the sheet rises into sky; reduce to 0.15.
- Aurora (motion only): snowfall speed 0.7+(i%5)*0.12 -> 0.55+(i%5)*0.09; a calmer fall reads more photographic in motion, stills unchanged by design.
- Eruption: bloom 0.48->0.38; sky sun colour 0xff8a4a->0xe07a42 (dims the dome sun for this scene only).
- Storm: rain opacity 0.26->0.20.
Server will be restarted and served code verified before capture (lesson of the wart).

## Round 4 verdict (gen3-true -> gen4-round4, verified served code)
- River: IMPROVED. Cotton-patch mist is gone (size 12 / opacity 0.06); banks are hazy, sun less blown at exposure 1.00.
- Falls: kept. Crest wash reduced; mist plume stable.
- Aurora: motion-only change (slower snow); still equivalent by design — no still verdict claimed.
- Eruption: MILDLY IMPROVED. Sun disc smaller/dimmer (0xe07a42), less bloom halo at 0.38; flow still bright, which is the subject.
- Storm: MILDLY IMPROVED. Rain dimmer at opacity 0.20; dashes remain a geometry limit (LineSegments), not a constant problem.

## Round 5 — final polish, and knowing when to stop (hypothesis before editing)
- River: one last colour attempt — water 0x33473a->0x3a4a3c to sit warmer against the sky. Judged on the Gen5 frame; will be reported either way.
- Falls: NO CHANGE. Sheet, lanes and mist plume are balanced; the next lever would be geometry (crest shape), which risks the composition that already wins. Documented stop.
- Aurora: NO CHANGE. Curtains, mirror, snow and bloom are at their balance point; every lever tried in Rounds 1-4 either did nothing visible or was documented stable. Further change would be churn. Documented stop.
- Eruption: exposure 1.02->0.98 and crust multiplier 1.45->1.30 — the last highlight headroom without touching the shared skyDome shader (pow(s,900)*18), which serves all five scenes and must not be bent for one.
- Storm: NO CHANGE. Rain dashes are inherent to LineSegments; fixing them means textured quads — a rewrite, not a polish — with perf risk for a marginal still-frame gain. Documented stop.

## Round 5 verdict (gen4-round4 -> gen5-round5, verified served code)
- River: NO overall improvement from water 0x33473a->0x3a4a3c — the fresnel/sun-glint terms in the water shader dominate uColor, so the frame is indistinguishable. Per the goal rule, this change is REVERTED; final river = Gen4 state.
- Eruption: MILDLY IMPROVED, kept. Exposure 0.98 + crust 1.30 — flow texture reads through the glow.
- Falls / Aurora / Storm: no change this round (documented stops above); Gen5 frames are fresh captures of unchanged code.
