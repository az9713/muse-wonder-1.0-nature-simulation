import * as THREE from 'three'
import { fbm, mulberry32, clamp, smoothstep } from './noise.js'
import { groundTextures, rockTextures, barkTextures, softSprite } from './textures.js'

export const TEX = {}
export function initTextures() {
  TEX.ground = groundTextures(); TEX.rock = rockTextures(); TEX.bark = barkTextures(); TEX.sprite = softSprite()
  for (const k of ['ground', 'rock', 'bark']) { TEX[k].map.repeat.set(18, 18); TEX[k].normalMap.repeat.set(18, 18) }
}

// Terrain: displaced plane, PBR standard material, vertex colours blend biomes.
export function terrain({ size = 220, seg = 190, heightFn, colorFn, material }) {
  const geo = new THREE.PlaneGeometry(size, size, seg, seg)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position, colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = heightFn(x, z)
    pos.setY(i, y)
  }
  geo.computeVertexNormals()
  const nrm = geo.attributes.normal
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    colorFn(x, y, z, 1 - nrm.getY(i), c)
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const mat = material || new THREE.MeshStandardMaterial({
    map: TEX.ground.map, normalMap: TEX.ground.normalMap, normalScale: new THREE.Vector2(0.7, 0.7),
    color: new THREE.Color(1.45, 1.45, 1.45), vertexColors: true, roughness: 0.94, metalness: 0,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.receiveShadow = true
  return mesh
}
// Biome colour helper: grass -> dry -> rock (slope) -> snow (height)
export function biome(palette = {}) {
  const grass = new THREE.Color(palette.grass ?? 0x5d7038), dry = new THREE.Color(palette.dry ?? 0x8a7a4e)
  const rock = new THREE.Color(palette.rock ?? 0x77706a), snow = new THREE.Color(palette.snow ?? 0xe8eef6)
  const sand = new THREE.Color(palette.sand ?? 0xa8905e), tmp = new THREE.Color()
  return (x, y, z, slope, out) => {
    const n = fbm(x * 0.08 + 9, z * 0.08, 4)
    out.copy(grass).lerp(dry, clamp((n - 0.42) * 2.2, 0, 1))
    if (palette.wetBelow !== undefined) out.lerp(new THREE.Color(palette.wet ?? 0x4a3d28), smoothstep(palette.wetBelow + 0.6, palette.wetBelow, y))
    if (palette.sandBelow !== undefined) out.lerp(sand, smoothstep(palette.sandBelow + 1.2, palette.sandBelow, y))
    out.lerp(rock, smoothstep(0.18, 0.5, slope))
    if (palette.snowAbove !== undefined) out.lerp(snow, smoothstep(palette.snowAbove, palette.snowAbove + 6, y) * (1 - smoothstep(0.4, 0.7, slope)))
    out.multiplyScalar(0.82 + fbm(x * 0.5, z * 0.5, 3) * 0.36)
    return out
  }
}

export function skyDome({ top, horizon, sunDir, sunColor, night = 0, cloud = 0.35 }) {
  const uniforms = {
    uTime: { value: 0 }, uTop: { value: new THREE.Color(top) }, uHorizon: { value: new THREE.Color(horizon) },
    uSunDir: { value: sunDir.clone().normalize() }, uSunColor: { value: new THREE.Color(sunColor) },
    uNight: { value: night }, uCloud: { value: cloud }, uFlash: { value: 0 },
  }
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms,
    vertexShader: `varying vec3 vDir; void main(){ vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vDir; uniform float uTime,uNight,uCloud,uFlash; uniform vec3 uTop,uHorizon,uSunDir,uSunColor;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float s=0.,a=.5; for(int i=0;i<5;i++){ s+=a*noise(p); p*=2.03; a*=.5; } return s; }
      void main(){
        vec3 d=normalize(vDir);
        float h=max(d.y,0.0);
        vec3 col=mix(uHorizon,uTop,pow(h,0.62));
        float s=max(dot(d,uSunDir),0.0);
        col+=uSunColor*(pow(s,900.0)*18.0+pow(s,90.0)*1.1+pow(s,7.0)*0.28)*(1.0-uNight);
        // procedural cloud deck projected on the dome
        if(d.y>0.015){
          vec2 cp=d.xz/(d.y+0.12);
          float cl=fbm(cp*1.4+vec2(uTime*0.006,uTime*0.002));
          float cover=smoothstep(1.0-uCloud-0.25,1.15-uCloud+0.2,cl)*smoothstep(0.0,0.12,d.y);
          vec3 cloudCol=mix(uHorizon*0.72,uTop*1.15+vec3(0.25),0.45)*(0.55+0.45*pow(s,3.0)+uNight*-0.4);
          cloudCol+=uSunColor*pow(s,5.0)*0.35;
          col=mix(col,cloudCol,cover*0.88);
        }
        // stars
        if(uNight>0.02){
          vec2 sp=d.xz/(d.y+0.4)*38.0;
          vec2 cell=floor(sp); float star=step(0.997,hash(cell));
          float tw=0.6+0.4*sin(uTime*2.0+hash(cell+1.0)*40.0);
          col+=vec3(0.9,0.95,1.0)*star*tw*uNight*smoothstep(0.03,0.25,d.y)*(1.0-uCloud*0.7);
        }
        col+=vec3(0.75,0.82,1.0)*uFlash*(0.35+0.65*pow(max(d.y,0.0),0.5));
        gl_FragColor=vec4(col,1.0);
      }`,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(760, 40, 24), mat)
  mesh.frustumCulled = false; mesh.renderOrder = -20
  return { mesh, uniforms }
}

// Animated water: two scrolling procedural normal fields + fresnel + sun glints.
export function water({ width = 220, length = 220, color = 0x14333a, opacity = 0.9, sunDir, y = 0 }) {
  const uniforms = {
    uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity },
    uSunDir: { value: sunDir.clone().normalize() }, uSunColor: { value: new THREE.Color(0xffd9a0) },
    uCam: { value: new THREE.Vector3() }, uFlow: { value: new THREE.Vector2(0, 1) },
  }
  const mat = new THREE.ShaderMaterial({
    transparent: true, uniforms,
    vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `
      varying vec3 vW; uniform float uTime,uOpacity; uniform vec3 uColor,uSunColor,uSunDir,uCam; uniform vec2 uFlow;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      void main(){
        vec2 p=vW.xz;
        vec2 f1=uFlow*uTime*0.55, f2=uFlow*uTime*0.31+7.0;
        float e=0.12;
        float h0=noise(p*0.9+f1)*0.6+noise(p*2.6+f2)*0.4;
        float hx=noise((p+vec2(e,0.))*0.9+f1)*0.6+noise((p+vec2(e,0.))*2.6+f2)*0.4;
        float hz=noise((p+vec2(0.,e))*0.9+f1)*0.6+noise((p+vec2(0.,e))*2.6+f2)*0.4;
        vec3 n=normalize(vec3((h0-hx)*2.2,1.0,(h0-hz)*2.2));
        vec3 v=normalize(uCam-vW);
        float fres=pow(1.0-max(dot(n,v),0.0),3.0);
        vec3 col=mix(uColor,uColor*1.7+vec3(0.04,0.06,0.07),fres);
        vec3 hv=normalize(v+uSunDir);
        col+=uSunColor*pow(max(dot(n,hv),0.0),240.0)*3.0;
        col+=vec3(0.5,0.65,0.7)*pow(max(dot(n,hv),0.0),24.0)*0.12;
        float foam=smoothstep(0.78,0.95,noise(p*3.0+f1*2.0)+noise(p*7.0-f2)*0.4-0.28);
        col=mix(col,vec3(0.85,0.92,0.94),foam*0.35);
        gl_FragColor=vec4(col,uOpacity);
      }`,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, length, 1, 1), mat)
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = y
  return { mesh, uniforms }
}

// Instanced rocks: displaced icosahedra with rock PBR, random scale/rotation.
export function scatterRocks(root, heightFn, count, seed, area, opts = {}) {
  const geo = new THREE.IcosahedronGeometry(1, 2)
  const p = geo.attributes.position, rnd0 = mulberry32(seed + 99)
  for (let i = 0; i < p.count; i++) {
    const d = 0.72 + fbm(p.getX(i) * 1.4 + seed, p.getZ(i) * 1.4, 3) * 0.55
    p.setXYZ(i, p.getX(i) * d, p.getY(i) * d * 0.78, p.getZ(i) * d)
  }
  geo.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({ map: TEX.rock.map, normalMap: TEX.rock.normalMap, roughness: 0.96 })
  const inst = new THREE.InstancedMesh(geo, mat, count)
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), rnd = mulberry32(seed)
  let placed = 0, guard = 0
  while (placed < count && guard++ < count * 30) {
    const x = (rnd() - 0.5) * area, z = (rnd() - 0.5) * area
    if (opts.reject && opts.reject(x, z)) continue
    const sc = (opts.min ?? 0.3) + Math.pow(rnd(), 2.2) * (opts.max ?? 2.4)
    e.set(rnd() * 0.4, rnd() * Math.PI * 2, rnd() * 0.4); q.setFromEuler(e)
    s.set(sc * (0.8 + rnd() * 0.5), sc * (0.6 + rnd() * 0.5), sc * (0.8 + rnd() * 0.5))
    m.compose(new THREE.Vector3(x, heightFn(x, z) + sc * 0.12, z), q, s)
    inst.setMatrixAt(placed++, m)
  }
  inst.count = placed; inst.castShadow = true; inst.receiveShadow = true
  root.add(inst); return inst
}

// Trees: tapered trunks + noise-displaced foliage blobs (broadleaf) or stacked
// cones (conifer). Instanced foliage/trunks keep the draw calls low.
function foliageGeo(seed) {
  const g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const d = 0.78 + fbm(p.getX(i) * 1.8 + seed, p.getY(i) * 1.8 + p.getZ(i), 3) * 0.5
    p.setXYZ(i, p.getX(i) * d, p.getY(i) * d * 0.82, p.getZ(i) * d)
  }
  g.computeVertexNormals(); return g
}
export function scatterTrees(root, heightFn, count, seed, area, opts = {}) {
  const rnd = mulberry32(seed)
  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.2, 2.6, 7); trunkGeo.translate(0, 1.3, 0)
  const trunkMat = new THREE.MeshStandardMaterial({ map: TEX.bark.map, normalMap: TEX.bark.normalMap, roughness: 1 })
  const leafMat = new THREE.MeshStandardMaterial({ color: opts.leaf ?? 0x49682e, roughness: 0.95, flatShading: false })
  const conifer = opts.conifer
  const folGeo = conifer ? new THREE.ConeGeometry(1.35, 3.6, 8) : foliageGeo(seed)
  if (conifer) folGeo.translate(0, 3.4, 0); else folGeo.translate(0, 3.1, 0)
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count)
  const fols = new THREE.InstancedMesh(folGeo, leafMat, count * 3)
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color()
  let placed = 0, guard = 0
  while (placed < count && guard++ < count * 40) {
    const x = (rnd() - 0.5) * area, z = (rnd() - 0.5) * area
    if (opts.reject && opts.reject(x, z)) continue
    const y = heightFn(x, z); if (opts.maxY !== undefined && y > opts.maxY) continue
    const sc = 0.75 + rnd() * 0.9
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI * 2)
    m.compose(new THREE.Vector3(x, y - 0.1, z), q, new THREE.Vector3(sc, sc * (0.9 + rnd() * 0.3), sc))
    trunks.setMatrixAt(placed, m)
    // three offset canopy masses per tree: irregular, shadowed, never a neat ball
    for (let b = 0; b < 3; b++) {
      const bs = sc * (0.62 + rnd() * 0.55)
      const bm = new THREE.Matrix4().compose(
        new THREE.Vector3(x + (rnd() - 0.5) * 1.7 * sc, y + (conifer ? 0 : (b * 0.45 + rnd() * 0.3) * sc), z + (rnd() - 0.5) * 1.7 * sc),
        q, new THREE.Vector3(bs, bs * (0.75 + rnd() * 0.4), bs))
      // for conifers keep one centred cone; park the other two underground
      if (conifer && b > 0) bm.compose(new THREE.Vector3(x, y - 8, z), q, new THREE.Vector3(0.01, 0.01, 0.01))
      fols.setMatrixAt(placed * 3 + b, bm)
      col.setHSL(0.27 + rnd() * 0.05, 0.38, 0.16 + rnd() * 0.09); fols.setColorAt(placed * 3 + b, col)
    }
    placed++
  }
  trunks.count = placed; fols.count = placed * 3
  trunks.castShadow = fols.castShadow = true
  root.add(trunks, fols); return { trunks, fols }
}

// Soft round particles (spray, rain, ash, embers, snow) with per-point life.
export function particles({ count, color = 0xffffff, size = 0.5, opacity = 0.7, additive = false }) {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  const mat = new THREE.PointsMaterial({
    map: TEX.sprite, color, size, transparent: true, opacity, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true,
  })
  const points = new THREE.Points(geo, mat); points.frustumCulled = false
  return { points, geo, mat }
}
