// Render DEVELOPMENT-JOURNEY.md to development-journey.html (site-styled).
// Usage: node generations/make-dev-journey.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const md = readFileSync(new URL('../DEVELOPMENT-JOURNEY.md', import.meta.url), 'utf8')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function inline(s) {
  const codes = []
  s = esc(s).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0001${codes.length - 1}\u0002` })
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  return s.replace(/\u0001(\d+)\u0002/g, (_, i) => `<code>${codes[+i]}</code>`)
}

const lines = md.split('\n')
let html = '', i = 0, title = 'Development Journey'
const isBlock = (l) => /^#{1,3} /.test(l) || /^- /.test(l) || /^\d+\. /.test(l) || /^\| /.test(l) || l.trim() === ''
while (i < lines.length) {
  const l = lines[i]
  if (l.trim() === '') { i++; continue }
  const h = l.match(/^(#{1,3}) (.+)/)
  if (h) {
    const lvl = h[1].length
    if (lvl === 1) { title = h[2]; html += `<h1>${inline(h[2])}</h1>\n` } else html += `<h${lvl}>${inline(h[2])}</h${lvl}>\n`
    i++; continue
  }
  if (/^\| /.test(l)) {
    const rows = []
    while (i < lines.length && /^\| /.test(lines[i])) { rows.push(lines[i]); i++ }
    const cells = (r) => r.replace(/^\| |\s\|$/g, '').split(' | ')
    const head = cells(rows[0]), body = rows.slice(2)
    html += '<div class="scroll"><table><thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>'
      + body.map((r) => '<tr>' + cells(r).map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>\n'
    continue
  }
  const li = l.match(/^(- |\d+\. )/)
  if (li) {
    const ordered = /\d/.test(li[1])
    const tag = ordered ? 'ol' : 'ul'
    html += `<${tag}>\n`
    while (i < lines.length) {
      const m = lines[i].match(/^(- |\d+\. )(.*)/)
      if (m) { html += `<li>${inline(m[2])}`; i++ }
      else if (/^   \S/.test(lines[i]) || /^  \S/.test(lines[i])) { html += ' ' + inline(lines[i].trim()); i++ }
      else break
      if (!(i < lines.length && (/^(- |\d+\. )/.test(lines[i])))) html += '</li>\n'
    }
    html += `</${tag}>\n`
    continue
  }
  const para = [l]; i++
  while (i < lines.length && !isBlock(lines[i])) { para.push(lines[i]); i++ }
  html += `<p>${inline(para.join(' '))}</p>\n`
}

const out = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;1,6..96,500&family=Barlow+Condensed:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { margin:0; background:#101314; color:#ece4d2; font-family:"Barlow Condensed",sans-serif; }
  main { max-width:880px; margin:0 auto; padding:52px 22px 80px; }
  h1 { font-family:"Bodoni Moda",serif; font-style:italic; font-weight:500; font-size:clamp(30px,4.6vw,46px); line-height:1.08; margin:0 0 18px; }
  h2 { font-family:"Bodoni Moda",serif; font-style:italic; font-weight:500; font-size:29px; margin:46px 0 10px; border-top:1px solid rgba(236,228,210,.14); padding-top:26px; }
  h3 { font-family:"Bodoni Moda",serif; font-style:italic; font-weight:500; font-size:24px; margin:32px 0 8px; }
  p, li { font-size:18px; line-height:1.58; color:rgba(236,228,210,.87); }
  li { margin-bottom:7px; }
  code { font-size:.84em; background:rgba(255,255,255,.07); padding:1px 6px; border-radius:4px; word-break:break-word; }
  a { color:#ece4d2; }
  .scroll { overflow-x:auto; margin:18px 0; }
  table { width:100%; min-width:640px; border-collapse:collapse; font-size:16px; }
  th, td { text-align:left; padding:9px 10px; border-bottom:1px solid rgba(236,228,210,.14); vertical-align:top; }
  thead th { letter-spacing:.08em; text-transform:uppercase; font-weight:500; color:rgba(236,228,210,.6); font-size:14px; }
  .back { letter-spacing:.1em; font-size:15px; text-transform:uppercase; }
</style>
</head>
<body>
<main>
  <p class="back"><a href="index.html">&larr; Back to the scenes</a> &middot; <a href="photorealism-journey.html">Photorealism journey</a> &middot; <a href="findings.html">Findings</a></p>
${html}
  <p class="back"><a href="index.html">&larr; Back to the scenes</a></p>
</main>
</body>
</html>`
writeFileSync(new URL('../development-journey.html', import.meta.url), out)
console.log('wrote development-journey.html', out.length)
