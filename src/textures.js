import * as THREE from 'three'
import { fbm, ridged, mulberry32 } from './noise.js'

// Every texture is baked on a canvas at load: albedo + a normal map derived
// from a height field. No image files, no downloads — pure procedure.
function canvas(size) { const c = document.createElement('canvas'); c.width = c.height = size; return c }
function toTex(c, srgb = true) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
function normalFromHeight(h, size, strength = 2) {
  const c = canvas(size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const xl = h[y * size + ((x - 1 + size) % size)], xr = h[y * size + ((x + 1) % size)]
    const yu = h[((y - 1 + size) % size) * size + x], yd = h[((y + 1) % size) * size + x]
    let nx = (xl - xr) * strength, ny = (yd - yu) * strength, nz = 1
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l
    const i = (y * size + x) * 4
    img.data[i] = (nx * 0.5 + 0.5) * 255; img.data[i + 1] = (ny * 0.5 + 0.5) * 255; img.data[i + 2] = (nz * 0.5 + 0.5) * 255; img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0); return toTex(c, false)
}
function bake(size, heightFn, colorFn, strength) {
  const h = new Float32Array(size * size)
  const c = canvas(size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const hv = heightFn(x / size, y / size); h[y * size + x] = hv
    const [r, g, b] = colorFn(x / size, y / size, hv)
    const i = (y * size + x) * 4
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return { map: toTex(c), normalMap: normalFromHeight(h, size, strength) }
}
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export function groundTextures() {
  return bake(512, (u, v) => fbm(u * 9, v * 9, 5) * 0.7 + fbm(u * 40, v * 40, 3) * 0.3,
    (u, v, h) => {
      const blade = fbm(u * 90, v * 90, 2)
      let col = mix3([52, 74, 30], [96, 110, 52], blade)
      col = mix3(col, [110, 96, 62], Math.max(0, h - 0.62) * 1.6) // dry patches
      col = mix3(col, [58, 48, 34], Math.max(0, 0.3 - h) * 1.4)    // soil in dips
      return col
    }, 1.6)
}
export function rockTextures() {
  return bake(512, (u, v) => ridged(u * 6, v * 6, 5) * 0.75 + fbm(u * 30, v * 30, 3) * 0.25,
    (u, v, h) => {
      const strata = 0.5 + 0.5 * Math.sin(v * 46 + fbm(u * 4, v * 4, 3) * 6)
      let col = mix3([74, 70, 66], [128, 122, 112], h)
      col = mix3(col, [96, 84, 70], strata * 0.35)
      col = mix3(col, [52, 56, 44], Math.max(0, fbm(u * 14, v * 14, 3) - 0.62) * 1.8) // moss
      return col
    }, 2.6)
}
export function barkTextures() {
  return bake(256, (u, v) => Math.abs(Math.sin(u * 40 + fbm(u * 6, v * 6, 3) * 8)) * 0.6 + fbm(u * 24, v * 60, 3) * 0.4,
    (u, v, h) => mix3([52, 38, 26], [96, 76, 54], h), 2.2)
}
export function sandTextures() {
  return bake(256, (u, v) => fbm(u * 30, v * 30, 3),
    (u, v, h) => mix3([148, 128, 94], [178, 160, 122], h), 0.8)
}
export function snowTextures() {
  return bake(256, (u, v) => fbm(u * 20, v * 20, 4),
    (u, v, h) => mix3([208, 218, 232], [244, 248, 255], h), 0.7)
}
export function lavaRockTextures() {
  return bake(512, (u, v) => ridged(u * 7, v * 7, 5),
    (u, v, h) => {
      let col = mix3([18, 16, 15], [54, 48, 44], h)
      const crack = Math.max(0, 0.55 - Math.abs(fbm(u * 5, v * 5, 4) - 0.5) * 2)
      col = mix3(col, [38, 30, 26], crack * 0.5)
      return col
    }, 2.8)
}
export function softSprite() {
  const c = canvas(64), ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c); return t
}
export function noiseTexture(size = 256) {
  const c = canvas(size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size)
  const rnd = mulberry32(7)
  for (let i = 0; i < img.data.length; i += 4) { const v = rnd() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255 }
  ctx.putImageData(img, 0, 0); return toTex(c, false)
}
