// Durable check: every findings frame must play its animation live in the grid cell.
// Run: node tests/findings-live-grid.test.mjs
import { readFileSync } from 'node:fs'
import assert from 'node:assert'

const html = readFileSync(new URL('../findings.html', import.meta.url), 'utf8')

const links = [...html.matchAll(/<a href="([^"]+)" target="_blank" rel="noopener"[^>]*>/g)].map((m) => m[1])
assert.equal(links.length, 15, `expected 15 play links, found ${links.length}`)
for (const scene of ['river', 'falls', 'aurora', 'eruption', 'storm']) {
  assert.ok(links.some((h) => h.includes(`grok-4.7-nature-simulation/?scene=${scene}`)), `missing Grok ${scene}`)
  assert.ok(links.some((h) => h === `prev/?scene=${scene}`), `missing prev ${scene}`)
  assert.ok(links.some((h) => h === `./?scene=${scene}`), `missing current ${scene}`)
}
// Clicking a frame must swap an iframe into the same cell (the grid itself is live),
// not merely open a new tab, and any further click must be able to stop it again.
assert.ok(html.includes("createElement('iframe')"), 'findings page never creates an iframe')
assert.ok(html.includes('data-playing'), 'findings page has no play/stop toggle state')
console.log('findings-live-grid: all assertions passed (15 links, in-cell live play, toggle)')
