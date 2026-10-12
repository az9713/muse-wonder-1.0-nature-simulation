import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { initTextures } from './nature.js'
import { createRiver, createFalls, createAurora, createEruption, createStorm, STORM_PERIOD, STRIKES } from './scenes.js'
import { createAudio } from './audio.js'

initTextures()
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const scenes = [createRiver(), createFalls(), createAurora(), createEruption(), createStorm()]
const audio = createAudio()
const params = new URLSearchParams(location.search)
const qi = scenes.findIndex((s) => s.id === params.get('scene'))
const $ = (id) => document.getElementById(id)
const stage = $('stage'), titleEl = $('title'), placeEl = $('place'), nav = $('nav'), soundBtn = $('sound'), veil = $('veil')
const scopeCtx = $('scope').getContext('2d')

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
renderer.setSize(innerWidth, innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
stage.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x8a97a5, 0.0028)
const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 1600)
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.32, 0.45, 0.82)
composer.addPass(bloom)
// Final photographic grade: gentle lift, saturation, vignette, fine grain.
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec4 c=texture2D(tDiffuse,vUv);
      float lum=dot(c.rgb,vec3(0.299,0.587,0.114));
      c.rgb=mix(vec3(lum),c.rgb,1.07);
      c.rgb=c.rgb*1.03+vec3(0.008,0.006,0.002);
      float d=distance(vUv,vec2(0.5,0.46));
      c.rgb*=smoothstep(0.95,0.42,d)*0.32+0.68;
      c.rgb+=(hash(vUv+fract(uTime*0.13))-0.5)*0.018;
      gl_FragColor=c;
    }`,
})
composer.addPass(grade); composer.addPass(new OutputPass())

// Per-scene atmosphere: fog colour/density follows the active scene.
const ATMOS = {
  river: [0xd9b98c, 0.0026], falls: [0xc4d4dc, 0.003], aurora: [0x0e2238, 0.0016],
  eruption: [0x6b4a3a, 0.0042], storm: [0x59636e, 0.005],
}
let index = qi >= 0 ? qi : 0, active = null, busy = false
let pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0, elapsed = 0, last = performance.now()
let lastStormLocal = 0; const fired = new Set()
const buttons = scenes.map((item, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = item.title.replace(/^The /, '')
  b.addEventListener('click', () => go(i)); nav.appendChild(b); return b
})
function show(n) {
  if (active) scene.remove(active.root)
  active = scenes[n]; index = n; scene.add(active.root)
  camera.fov = active.fov; camera.updateProjectionMatrix()
  bloom.strength = active.bloom; bloom.threshold = active.threshold; bloom.radius = active.radius
  renderer.toneMappingExposure = active.exposure
  const [fc, fd] = ATMOS[active.id]; scene.fog.color.set(fc); scene.fog.density = fd
  titleEl.textContent = active.title; placeEl.textContent = active.place
  document.title = `${active.title} — Phenomena`
  buttons.forEach((b, i) => i === index ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current'))
  audio.setScene(active.id); placeCamera(0)
}
function placeCamera(t) {
  const drift = reduced ? 0 : active.drift, p = active.cameraPos
  camera.position.set(p.x + Math.sin(t * 0.06) * drift + smoothX * active.parallax, p.y + Math.sin(t * 0.045 + 1) * drift * 0.3 - smoothY * active.parallax * 0.3, p.z + Math.cos(t * 0.04) * drift * 0.35)
  camera.lookAt(active.cameraTarget.x + smoothX * 0.6, active.cameraTarget.y - smoothY * 0.3, active.cameraTarget.z)
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function go(n) {
  if (busy || n === index) return; busy = true; veil.classList.add('on'); await wait(reduced ? 0 : 190)
  show(n); requestAnimationFrame(() => veil.classList.remove('on')); await wait(reduced ? 0 : 230); busy = false
}
function drawScope() {
  const w = 280, h = 44; scopeCtx.clearRect(0, 0, w, h)
  scopeCtx.strokeStyle = 'rgba(226,205,170,.9)'; scopeCtx.lineWidth = 1.25; scopeCtx.beginPath()
  if (!audio.started || audio.muted || !audio.analyser) { scopeCtx.moveTo(0, h / 2); scopeCtx.lineTo(w, h / 2); scopeCtx.stroke(); return }
  audio.analyser.getByteTimeDomainData(audio.timeData)
  for (let i = 0; i < audio.timeData.length; i += 5) { const x = i / (audio.timeData.length - 1) * w, y = audio.timeData[i] / 255 * h; i === 0 ? scopeCtx.moveTo(x, y) : scopeCtx.lineTo(x, y) }
  scopeCtx.stroke()
}
function thunder(t) {
  if (active.id !== 'storm' || !audio.started || audio.muted) return
  const local = t % STORM_PERIOD; if (local < lastStormLocal) fired.clear(); lastStormLocal = local
  for (const st of STRIKES) if (local >= st.t && local < st.t + 0.05 && !fired.has(st.t)) { fired.add(st.t); audio.strike(st.meters) }
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; elapsed += dt
  smoothX += (pointerX - smoothX) * 0.04; smoothY += (pointerY - smoothY) * 0.04
  placeCamera(elapsed); active.update(elapsed, dt, camera); audio.update(elapsed); thunder(elapsed)
  grade.uniforms.uTime.value = elapsed; composer.render(); drawScope()
  document.body.classList.add('ready'); requestAnimationFrame(frame)
}
function labelSound() { const on = audio.started && !audio.muted; soundBtn.dataset.on = on; soundBtn.textContent = on ? 'Mute' : 'Hear the scene' }
soundBtn.addEventListener('click', async () => { if (!audio.started) await audio.unlock(); else await audio.setMuted(!audio.muted); labelSound() })
addEventListener('pointermove', (e) => { pointerX = e.clientX / innerWidth * 2 - 1; pointerY = e.clientY / innerHeight * 2 - 1 })
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') go((index + 1) % scenes.length)
  else if (e.key === 'ArrowLeft') go((index + scenes.length - 1) % scenes.length)
  else if (e.key >= '1' && e.key <= '5') go(+e.key - 1)
  else if (e.key.toLowerCase() === 'm') soundBtn.click()
})
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight) })
try { show(index); requestAnimationFrame(frame) } catch (err) { console.error(err); document.body.classList.add('failed'); $('fail').textContent = `This piece needs WebGL. ${err.message}` }
