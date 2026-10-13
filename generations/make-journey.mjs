// Build photorealism-journey.html from generations/round-data.json + generation frames.
// Usage: node generations/make-journey.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const data = JSON.parse(readFileSync(new URL('./round-data.json', import.meta.url), 'utf8'))
const scenes = ['river', 'falls', 'aurora', 'eruption', 'storm']
const titles = { river: 'The river', falls: 'The falls', aurora: 'The aurora', eruption: 'The eruption', storm: 'The storm' }

function table(genBefore, genAfter) {
  const rows = scenes.map((s) => `<tr><th scope="row">${titles[s]}</th>
    <td><figure><img src="generations/${genBefore}/${s}.jpg" alt="Before — ${titles[s]}"><figcaption>${genBefore}</figcaption></figure></td>
    <td><figure><img src="generations/${genAfter}/${s}.jpg" alt="After — ${titles[s]}"><figcaption>${genAfter}</figcaption></figure></td></tr>`).join('\n')
  return `<div class="scroll"><table><thead><tr><th>Scene</th><th>Before</th><th>After</th></tr></thead><tbody>${rows}</tbody></table></div>`
}

const roundSections = data.rounds.map((r) => `
<section id="${r.id}">
  <h2>${r.title}</h2>
  <p><strong>Generation artifacts:</strong> <code>generations/${r.before}/</code> &rarr; <code>generations/${r.after}/</code> (five JPG frames each, 1280&times;708).</p>
  <h3>Findings before any change (grounded in the code)</h3>
  <ul>${r.findings.map((f) => `<li>${f}</li>`).join('')}</ul>
  <h3>Changes made</h3>
  <ul>${r.changes.map((f) => `<li>${f}</li>`).join('')}</ul>
  <h3>Verdict, scene by scene</h3>
  <ul>${r.verdicts.map((f) => `<li>${f}</li>`).join('')}</ul>
  ${table(r.before, r.after)}
</section>`).join('\n')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Photorealism journey — five rounds, five scenes</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;1,6..96,500&family=Barlow+Condensed:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { margin:0; background:#101314; color:#ece4d2; font-family:"Barlow Condensed",sans-serif; }
  main { max-width:1080px; margin:0 auto; padding:52px 22px 80px; }
  .kicker { letter-spacing:.16em; text-transform:uppercase; color:rgba(236,228,210,.55); font-size:14px; margin:0 0 6px; }
  h1 { font-family:"Bodoni Moda",serif; font-style:italic; font-weight:500; font-size:clamp(32px,5vw,50px); line-height:1.05; margin:0 0 14px; }
  h2 { font-family:"Bodoni Moda",serif; font-style:italic; font-weight:500; font-size:30px; margin:0 0 8px; }
  h3 { font-size:16px; letter-spacing:.1em; text-transform:uppercase; font-weight:500; color:rgba(236,228,210,.6); margin:22px 0 6px; }
  p, li { font-size:18px; line-height:1.55; color:rgba(236,228,210,.86); }
  ul { max-width:880px; }
  section { margin-top:52px; border-top:1px solid rgba(236,228,210,.14); padding-top:26px; }
  .scroll { overflow-x:auto; margin:18px 0; }
  table { width:100%; min-width:720px; border-collapse:collapse; }
  th, td { padding:9px; border-bottom:1px solid rgba(236,228,210,.14); vertical-align:top; text-align:left; }
  thead th { letter-spacing:.08em; text-transform:uppercase; font-weight:500; color:rgba(236,228,210,.6); font-size:14px; }
  tbody th { font-family:"Bodoni Moda",serif; font-style:italic; font-weight:500; font-size:20px; white-space:nowrap; }
  figure { margin:0; } figure img { width:100%; aspect-ratio:1280/708; object-fit:cover; display:block; border-radius:6px; }
  figcaption { font-size:13px; letter-spacing:.07em; text-transform:uppercase; color:rgba(236,228,210,.55); margin-top:6px; }
  code { font-size:.86em; background:rgba(255,255,255,.07); padding:1px 6px; border-radius:4px; }
  a { color:#ece4d2; }
  .tally { display:inline-block; border:1px solid rgba(236,228,210,.3); border-radius:999px; padding:8px 18px; font-size:17px; letter-spacing:.05em; }
</style>
</head>
<body>
<main>
  <p class="kicker">Phenomena — development journey</p>
  <h1>Five rounds of photorealism, demystified</h1>
  <p>Brief, quoted from the session goal: &ldquo;iterate 5 rounds&hellip; ground your findings with code changes before making changes&hellip; if for each scene that you cannot make an overall improvement, do not make any change for that scene but document the reasoning&hellip; mark clearly the output artifacts of each generation.&rdquo;</p>
  <p>How each round worked: (1) capture the five scenes and name the least photographic element in each frame; (2) trace that element to its exact code constant and write the hypothesis <em>before</em> editing; (3) make the smallest change at that constant; (4) re-capture all five and keep, adjust, or revert per scene. Every generation lives under <code>generations/</code> and is labelled where it is used. Gen0 is the published 5&ndash;0 build this journey started from.</p>
  <p><span class="tally">${data.summary}</span></p>
  ${roundSections}
  <section id="warts">
    <h2>What went wrong along the way</h2>
    <ul>${data.warts.map((f) => `<li>${f}</li>`).join('')}</ul>
  </section>
  <section id="standing">
    <h2>Where things stand</h2>
    <ul>${data.standing.map((f) => `<li>${f}</li>`).join('')}</ul>
    <p>Back to the <a href="index.html">player</a>, the <a href="comparison.html">two-way comparison</a>, or the <a href="findings.html">three-way findings grid</a> (every frame there now plays its animation live in its cell).</p>
  </section>
</main>
</body>
</html>`
writeFileSync(new URL('../photorealism-journey.html', import.meta.url), html)
console.log('wrote photorealism-journey.html', html.length)
