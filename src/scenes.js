import * as THREE from 'three'
import { fbm, ridged, mulberry32, clamp, smoothstep, lerp } from './noise.js'
import { TEX, terrain, biome, skyDome, water, scatterRocks, scatterTrees, particles } from './nature.js'
import { lavaRockTextures, snowTextures } from './textures.js'

function sunLight(color, intensity, pos, shadowSize = 60) {
  const l = new THREE.DirectionalLight(color, intensity)
  l.position.copy(pos); l.castShadow = true
  l.shadow.mapSize.set(2048, 2048)
  l.shadow.camera.left = -shadowSize; l.shadow.camera.right = shadowSize
  l.shadow.camera.top = shadowSize; l.shadow.camera.bottom = -shadowSize
  l.shadow.camera.far = 260; l.shadow.bias = -0.0004; l.shadow.normalBias = 0.6
  return l
}
const V3 = (x, y, z) => new THREE.Vector3(x, y, z)
function base(id, title, place, opts) {
  return { id, title, place, fov: 46, bloom: 0.32, threshold: 0.82, radius: 0.45, exposure: 1.05, drift: 1.1, parallax: 1.4, focus: 30, aperture: 0.0012, root: new THREE.Group(), ...opts }
}
function moveParticles(p, dt, fn) {
  const a = p.geo.attributes.position
  for (let i = 0; i < a.count; i++) { fn(a, i, dt) }
  a.needsUpdate = true
}

/* ---------------- THE RIVER — golden hour valley ---------------- */
export function createRiver() {
  const s = base('river', 'The river', 'Low water, late light', { cameraPos: V3(12, 2.6, 24), cameraTarget: V3(1, 2.2, -18), exposure: 1.12, focus: 26, aperture: 0.0016 })
  const sunDir = V3(-0.45, 0.38, -0.8)
  const sky = skyDome({ top: 0x3a6ea8, horizon: 0xf2b879, sunDir, sunColor: 0xffb36b, cloud: 0.32 })
  s.root.add(sky.mesh)
  s.root.add(new THREE.HemisphereLight(0xbcd6ff, 0x4a5a34, 1.0))
  s.root.add(sunLight(0xffc07a, 2.6, V3(-38, 34, -60)))
  const center = (z) => Math.sin(z * 0.045) * 9 + Math.sin(z * 0.013 + 1) * 4
  const h = (x, z) => {
    const d = Math.abs(x - center(z))
    const hills = Math.pow(smoothstep(4, 42, d), 1.4) * (5 + fbm(x * 0.03, z * 0.03, 4) * 13)
    return -1.1 + hills + fbm(x * 0.12, z * 0.12, 4) * smoothstep(3, 10, d) * 1.6
  }
  s.root.add(terrain({ heightFn: h, colorFn: biome({ wetBelow: 0.4 }) }))
  const w = water({ sunDir, y: -0.15, color: 0x24382e, opacity: 0.88 })
  w.uniforms.uFlow.value.set(0, 1); s.root.add(w.mesh)
  scatterTrees(s.root, h, 260, 11, 190, { reject: (x, z) => Math.abs(x - center(z)) < 5.5 || Math.hypot(x - 12, z - 25) < 11, maxY: 15 })
  scatterRocks(s.root, h, 130, 21, 180, { reject: (x, z) => Math.abs(x - center(z)) < 2.2 || Math.hypot(x - 12, z - 25) < 12 })
  // drifting valley mist
  const mist = particles({ count: 240, color: 0xf6e3c2, size: 7, opacity: 0.05 })
  { const a = mist.geo.attributes.position, r = mulberry32(5)
    for (let i = 0; i < a.count; i++) a.setXYZ(i, (r() - 0.5) * 90, 0.6 + r() * 2.4, (r() - 0.5) * 140) }
  s.root.add(mist.points)
  s.update = (t, dt, cam) => {
    sky.uniforms.uTime.value = t; w.uniforms.uTime.value = t; w.uniforms.uCam.value.copy(cam.position)
    moveParticles(mist, dt, (a, i) => { let x = a.getX(i) + dt * 0.55; if (x > 50) x = -50; a.setX(i, x) })
  }
  return s
}

/* ---------------- THE FALLS — cliff, plunge pool, spray ---------------- */
export function createFalls() {
  const s = base('falls', 'The falls', 'Cold spray, basalt columns', { cameraPos: V3(4, 3.0, 11), cameraTarget: V3(0, 8, -16), bloom: 0.22, focus: 19, aperture: 0.0018 })
  const sunDir = V3(0.5, 0.62, -0.6)
  const sky = skyDome({ top: 0x4a7db5, horizon: 0xd9e4e8, sunDir, sunColor: 0xffe3b0, cloud: 0.4 })
  s.root.add(sky.mesh)
  s.root.add(new THREE.HemisphereLight(0xcfe4ff, 0x3d4a3a, 1.05))
  s.root.add(sunLight(0xfff0d0, 2.4, V3(28, 42, 34)))
  const h = (x, z) => {
    const cliff = smoothstep(-8, -20, -z) // rises behind z=-14
    const back = smoothstep(-14, -26, z) * 17
    const walls = Math.pow(smoothstep(13, 46, Math.abs(x)), 1.5) * 11
    const basin = fbm(x * 0.08, z * 0.08, 4) * 2.2
    return -0.8 + basin * (1 - back / 18) + back + walls + fbm(x * 0.2, z * 0.2, 3) * 0.7
  }
  const rockMat = new THREE.MeshStandardMaterial({ map: TEX.rock.map, normalMap: TEX.rock.normalMap, vertexColors: true, roughness: 0.97 })
  TEX.rock.map.repeat.set(10, 10)
  s.root.add(terrain({ heightFn: h, colorFn: biome({ wetBelow: 1.2, snowAbove: 60 }), material: rockMat }))
  const pool = water({ width: 90, length: 80, sunDir, y: 0.15, color: 0x16333a, opacity: 0.92 })
  pool.mesh.position.z = 8; s.root.add(pool.mesh)
  // falling sheet: scrolling foam shader on a curved ribbon
  const fallUniforms = { uTime: { value: 0 } }
  const fallMat = new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide, uniforms: fallUniforms,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uTime;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      void main(){
        float streak=noise(vec2(vUv.x*26.0, vUv.y*7.0+uTime*1.7))*0.6+noise(vec2(vUv.x*60.0, vUv.y*14.0+uTime*2.6))*0.4;
        float body=smoothstep(0.05,0.9,streak*1.15);
        float edge=smoothstep(0.0,0.14,vUv.x)*smoothstep(1.0,0.86,vUv.x);
        float foot=smoothstep(0.22,0.0,vUv.y);
        vec3 col=mix(vec3(0.32,0.44,0.50),vec3(0.72,0.80,0.84),body*0.8+foot*0.4);
        gl_FragColor=vec4(col,(0.22+0.55*body)*edge*(0.7+foot*0.3));
      }`,
  })
  const fallGeo = new THREE.PlaneGeometry(9.5, 17.5, 24, 24)
  { const p = fallGeo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, Math.sin((y + 8.75) / 17.5 * Math.PI) * 1.1) } fallGeo.computeVertexNormals() }
  const fall = new THREE.Mesh(fallGeo, fallMat); fall.position.set(0, 9.2, -15.5); s.root.add(fall)
  scatterTrees(s.root, h, 170, 31, 190, { reject: (x, z) => (z < -10 && Math.abs(x) < 12) || Math.abs(x) < 13, maxY: 24 })
  scatterRocks(s.root, h, 150, 41, 170, { min: 0.5, max: 3.4 })
  const spray = particles({ count: 900, color: 0xeaf6ff, size: 0.55, opacity: 0.5 })
  const sv = new Float32Array(spray.geo.attributes.position.count * 3), sr = mulberry32(9)
  const reset = (a, i, randomY) => { a.setXYZ(i, (sr() - 0.5) * 11, randomY ? sr() * 6 : 0.3, -14 + (sr() - 0.5) * 3); sv[i * 3] = (sr() - 0.5) * 1.4; sv[i * 3 + 1] = 2.4 + sr() * 4.2; sv[i * 3 + 2] = 0.6 + sr() * 1.6 }
  { const a = spray.geo.attributes.position; for (let i = 0; i < a.count; i++) reset(a, i, true) }
  s.root.add(spray.points)
  s.update = (t, dt, cam) => {
    sky.uniforms.uTime.value = t; pool.uniforms.uTime.value = t; pool.uniforms.uCam.value.copy(cam.position); fallUniforms.uTime.value = t
    moveParticles(spray, dt, (a, i) => {
      sv[i * 3 + 1] -= dt * 3.4
      a.setXYZ(i, a.getX(i) + sv[i * 3] * dt, a.getY(i) + sv[i * 3 + 1] * dt, a.getZ(i) + sv[i * 3 + 2] * dt)
      if (a.getY(i) < 0.1 || a.getY(i) > 9) reset(a, i, false)
    })
  }
  return s
}

/* ---------------- THE AURORA — snowfield, frozen lake, night sky ---------------- */
function auroraCurtain(width, height, hue, seed, y, z, tilt) {
  const uniforms = { uTime: { value: 0 }, uSeed: { value: seed }, uHue: { value: hue } }
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms,
    vertexShader: `varying vec2 vUv; uniform float uTime,uSeed;
      void main(){ vUv=uv; vec3 p=position;
        p.z+=sin(uv.x*9.0+uSeed+uTime*0.14)*3.2*(0.3+uv.y);
        p.x+=sin(uv.x*4.0+uSeed*2.0+uTime*0.07)*2.0;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uTime,uSeed,uHue;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      void main(){
        float rays=noise(vec2(vUv.x*36.0+uSeed*10.0+uTime*0.22, vUv.x*6.0-uTime*0.05));
        rays=0.45+0.55*rays;
        float curtain=sin(vUv.x*7.0+uSeed+uTime*0.18+noise(vUv*3.0+uSeed)*2.2)*0.5+0.5;
        float vert=pow(1.0-vUv.y,1.7)*smoothstep(0.0,0.24,vUv.y);
        vec3 low=mix(vec3(0.1,0.95,0.42),vec3(0.1,0.7,0.8),uHue);
        vec3 col=mix(low,vec3(0.55,0.25,0.95),pow(vUv.y,1.6)*0.8+uHue*0.2);
        float a=vert*(0.25+0.75*curtain)*rays*0.75;
        gl_FragColor=vec4(col*a*1.7,a);
      }`,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 48, 12), mat)
  mesh.position.set(0, y, z); mesh.rotation.x = tilt
  return { mesh, uniforms }
}
export function createAurora() {
  const s = base('aurora', 'The aurora', 'Frozen lake, solar wind', { cameraPos: V3(0, 1.7, 17), cameraTarget: V3(0, 10, -42), exposure: 1.0, bloom: 0.55, threshold: 0.55, focus: 55, aperture: 0.0007 })
  const moonDir = V3(0.42, 0.52, -0.5)
  const sky = skyDome({ top: 0x060b26, horizon: 0x14304a, sunDir: moonDir, sunColor: 0xaac4ff, night: 1, cloud: 0.12 })
  s.root.add(sky.mesh)
  s.root.add(new THREE.HemisphereLight(0x35507a, 0x1c2733, 0.5))
  const moon = sunLight(0xaac8ff, 0.85, V3(46, 58, -55), 70); s.root.add(moon)
  const snowTex = snowTextures(); snowTex.map.repeat.set(20, 20)
  const h = (x, z) => { const b = fbm(x * 0.035 + 4, z * 0.035, 4) * 5 + Math.pow(smoothstep(18, 60, Math.abs(x)), 1.5) * 7; return lerp(b, -0.55, smoothstep(13, 4, Math.abs(x))) }
  const snowMat = new THREE.MeshStandardMaterial({ map: snowTex.map, normalMap: snowTex.normalMap, vertexColors: true, roughness: 0.82 })
  s.root.add(terrain({ heightFn: h, colorFn: biome({ grass: 0xdfe9f5, dry: 0xcdd9e8, rock: 0x8b9bb2, snowAbove: -10 }), material: snowMat }))
  const lake = water({ width: 46, length: 170, sunDir: moonDir, y: 0.05, color: 0x0a1c30, opacity: 0.94 })
  lake.uniforms.uSunColor.value.set(0x9fd8ff); s.root.add(lake.mesh)
  scatterTrees(s.root, h, 220, 51, 200, { conifer: true, leaf: 0x2c4a34, reject: (x) => Math.abs(x) < 13, maxY: 9 })
  scatterRocks(s.root, h, 60, 61, 180, { reject: (x) => Math.abs(x) < 10 })
  const curtains = [auroraCurtain(190, 44, 0, 1.7, 34, -95, 0.22), auroraCurtain(150, 34, 0.45, 4.2, 40, -120, 0.3), auroraCurtain(220, 52, 0.15, 8.9, 30, -70, 0.14)]
  curtains.forEach((c) => s.root.add(c.mesh))
  const snow = particles({ count: 700, color: 0xffffff, size: 0.28, opacity: 0.65 })
  { const a = snow.geo.attributes.position, r = mulberry32(3); for (let i = 0; i < a.count; i++) a.setXYZ(i, (r() - 0.5) * 110, r() * 26, (r() - 0.5) * 110) }
  s.root.add(snow.points)
  s.update = (t, dt, cam) => {
    sky.uniforms.uTime.value = t; lake.uniforms.uTime.value = t * 0.4; lake.uniforms.uCam.value.copy(cam.position)
    curtains.forEach((c) => { c.uniforms.uTime.value = t })
    moveParticles(snow, dt, (a, i) => { let y = a.getY(i) - dt * (0.7 + (i % 5) * 0.12); if (y < 0) y = 26; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t + i) * dt * 0.4) })
  }
  return s
}

/* ---------------- THE ERUPTION — stratovolcano at dusk ---------------- */
export function createEruption() {
  const s = base('eruption', 'The eruption', 'Basalt, ash, living fire', { cameraPos: V3(20, 19, 38), cameraTarget: V3(0, 13, -18), exposure: 1.08, bloom: 0.65, threshold: 0.5, focus: 58, aperture: 0.0009 })
  const sunDir = V3(-0.6, 0.2, -0.55)
  const sky = skyDome({ top: 0x2c2326, horizon: 0x9a5638, sunDir, sunColor: 0xff8a4a, cloud: 0.62 })
  s.root.add(sky.mesh)
  s.root.add(new THREE.HemisphereLight(0x8a6a58, 0x241a16, 0.5))
  s.root.add(sunLight(0xff9a5c, 1.5, V3(-52, 22, -48), 90))
  const glow = new THREE.PointLight(0xff5a18, 900, 90, 1.8); glow.position.set(0, 24, -18); s.root.add(glow)
  const lavaTex = lavaRockTextures(); lavaTex.map.repeat.set(16, 16); lavaTex.normalMap.repeat.set(16, 16)
  const cone = (x, z) => { const d = Math.hypot(x, z + 18); return Math.exp(-d * d / 520) * 23 + ridged(x * 0.05, z * 0.05, 4) * smoothstep(4, 26, d) * 3 }
  const h = (x, z) => cone(x, z) + fbm(x * 0.04, z * 0.04, 4) * 2.4 - smoothstep(3, 0, Math.hypot(x, z + 18)) * 2.2
  const mat = new THREE.MeshStandardMaterial({ map: lavaTex.map, normalMap: lavaTex.normalMap, vertexColors: true, roughness: 1 })
  s.root.add(terrain({ heightFn: h, colorFn: biome({ grass: 0x3b332c, dry: 0x55483c, rock: 0x6b5f56 }), material: mat }))
  // crater lake of lava + a glowing flow down the near slope
  const lavaMat = new THREE.MeshStandardMaterial({ color: 0x1a0c06, emissive: 0xff4d00, emissiveIntensity: 2.6, roughness: 0.6 })
  const crater = new THREE.Mesh(new THREE.CircleGeometry(4.6, 28), lavaMat)
  crater.rotation.x = -Math.PI / 2; crater.position.set(0, h(0, -18) + 0.35, -18); s.root.add(crater)
  const flowPts = []; for (let i = 0; i <= 20; i++) { const t = i / 20, z = -18 + t * 30, x = Math.sin(t * 5) * 2.2 * t; flowPts.push(new THREE.Vector3(x, h(x, z) + 0.28, z)) }
  const flow = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(flowPts), 32, 0.85, 7), lavaMat)
  s.root.add(flow)
  scatterRocks(s.root, h, 170, 71, 190, { min: 0.4, max: 3 })
  scatterTrees(s.root, h, 90, 81, 200, { conifer: true, leaf: 0x35402c, reject: (x, z) => Math.hypot(x, z + 18) < 30, maxY: 4 })
  const embers = particles({ count: 500, color: 0xffa030, size: 0.4, opacity: 0.9, additive: true })
  const ash = particles({ count: 800, color: 0x9a8f88, size: 0.5, opacity: 0.45 })
  const er = mulberry32(13), ar = mulberry32(14)
  { const a = embers.geo.attributes.position; for (let i = 0; i < a.count; i++) a.setXYZ(i, (er() - 0.5) * 7, 22 + er() * 14, -18 + (er() - 0.5) * 7) }
  { const a = ash.geo.attributes.position; for (let i = 0; i < a.count; i++) a.setXYZ(i, (ar() - 0.5) * 150, ar() * 34, (ar() - 0.5) * 150) }
  s.root.add(embers.points, ash.points)
  s.update = (t, dt) => {
    sky.uniforms.uTime.value = t
    const pulse = 0.75 + 0.25 * Math.sin(t * 1.7) * Math.sin(t * 0.43)
    lavaMat.emissiveIntensity = 3.1 + pulse * 1.6; glow.intensity = 650 + pulse * 600
    moveParticles(embers, dt, (a, i) => { let y = a.getY(i) + dt * (2 + (i % 7) * 0.4); if (y > 40) y = 23; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t * 2 + i) * dt * 0.8) })
    moveParticles(ash, dt, (a, i) => { let y = a.getY(i) - dt * 0.9; if (y < 0) y = 34; a.setY(i, y); a.setX(i, a.getX(i) + dt * 1.1) })
  }
  return s
}


/* ---------------- THE STORM — moor, driving rain, lightning ---------------- */
export const STORM_PERIOD = 36
export const STRIKES = [
  { t: 1.4, meters: 520 }, { t: 7.2, meters: 1280 }, { t: 7.7, meters: 340 },
  { t: 15.1, meters: 1700 }, { t: 22.0, meters: 240 }, { t: 22.45, meters: 860 }, { t: 30.2, meters: 980 },
]
export function lightningFlash(time) {
  const local = time % STORM_PERIOD; let flash = 0
  for (const st of STRIKES) { const d = local - st.t; if (d >= 0 && d < 1.15) flash = Math.max(flash, Math.exp(-d * 7.5) * 1.15 + Math.exp(-d * 1.5) * 0.4) }
  return Math.min(flash, 1.35)
}
export function createStorm() {
  const s = base('storm', 'The storm', 'Driving rain, near thunder', { cameraPos: V3(0, 4.6, 25), cameraTarget: V3(0, 3.0, -30), exposure: 0.92, bloom: 0.3, threshold: 0.7, focus: 48, aperture: 0.0008 })
  s.flash = 0
  const sunDir = V3(0.3, 0.5, -0.6)
  const sky = skyDome({ top: 0x232a33, horizon: 0x5a6672, sunDir, sunColor: 0x9fb4c8, cloud: 0.92 })
  s.root.add(sky.mesh)
  s.root.add(new THREE.HemisphereLight(0x6a7a8c, 0x2e332a, 0.65))
  const key = sunLight(0xaebfd2, 1.1, V3(26, 44, -52), 80); s.root.add(key)
  const bolt = new THREE.DirectionalLight(0xcfe0ff, 0); bolt.position.set(-30, 60, -80); s.root.add(bolt)
  const h = (x, z) => fbm(x * 0.04 + 7, z * 0.04, 4) * 4.5 + Math.pow(smoothstep(20, 62, Math.abs(x)), 1.4) * 8 + fbm(x * 0.15, z * 0.15, 3) * 0.8
  s.root.add(terrain({ heightFn: h, colorFn: biome({ grass: 0x46543a, dry: 0x5f5c42, rock: 0x5e6166, wetBelow: 1 }) }))
  const sea = water({ sunDir, y: 0.32, color: 0x1a2c34, opacity: 0.94 }); sea.mesh.position.z = 6; sea.uniforms.uSunColor.value.set(0xb9c9d6); s.root.add(sea.mesh)
  scatterTrees(s.root, h, 150, 91, 190, { reject: (x, z) => Math.abs(x) < 20 || z > 2, maxY: 8 })
  scatterRocks(s.root, h, 120, 95, 180, { reject: (x, z) => Math.abs(x) < 30 })
  const rain = particles({ count: 2600, color: 0xcfe2f2, size: 0.32, opacity: 0.55 })
  { const a = rain.geo.attributes.position, r = mulberry32(17); for (let i = 0; i < a.count; i++) a.setXYZ(i, (r() - 0.5) * 100, r() * 30, (r() - 0.5) * 100) }
  s.root.add(rain.points)
  s.update = (t, dt, cam) => {
    const flash = lightningFlash(t); s.flash = flash
    sky.uniforms.uTime.value = t * 2.2; sky.uniforms.uFlash.value = flash
    bolt.intensity = flash * 5; key.intensity = 1.1 + flash * 1.5
    sea.uniforms.uTime.value = t * 1.6; sea.uniforms.uCam.value.copy(cam.position)
    moveParticles(rain, dt, (a, i) => { let y = a.getY(i) - dt * 26; let x = a.getX(i) + dt * 7; if (y < 0) { y = 30; x = (Math.sin(i * 91.7) * 0.5) * 100 } a.setY(i, y); a.setX(i, x) })
  }
  return s
}
