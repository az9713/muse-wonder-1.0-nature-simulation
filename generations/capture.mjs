// Capture the five scenes from a running player and save JPG frames.
// Usage: node generations/capture.mjs <out-dir> [base-url]
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const outDir = process.argv[2]
const base = process.argv[3] || 'http://localhost:5180/'
if (!outDir) { console.error('usage: capture.mjs <out-dir> [base-url]'); process.exit(1) }
mkdirSync(outDir, { recursive: true })
const CHROME = '/tmp/browsers/chrome-headless-shell-linux64/chrome-headless-shell'
const require2 = createRequire('/tmp/imgtool/package.json')
const { PNG } = require2('pngjs')
const jpeg = require2('jpeg-js')

for (const scene of ['river', 'falls', 'aurora', 'eruption', 'storm']) {
  const pngPath = `${outDir}/${scene}.png`
  execFileSync(CHROME, ['--headless', '--disable-gpu', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--hide-scrollbars', '--window-size=1280,708', '--virtual-time-budget=12000',
    `--screenshot=${pngPath}`, `${base}?scene=${scene}`], { stdio: 'ignore' })
  const png = PNG.sync.read(readFileSync(pngPath))
  const jpg = jpeg.encode({ data: png.data, width: png.width, height: png.height }, 84)
  writeFileSync(`${outDir}/${scene}.jpg`, jpg.data)
  console.log(scene, png.width + 'x' + png.height, jpg.data.length)
}
console.log('done', outDir)
