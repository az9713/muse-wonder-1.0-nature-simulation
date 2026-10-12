// Fully synthesized scene sound with the Web Audio API. No samples.
// One looping noise source is re-filtered per scene; oscillators add
// sub-rumble (eruption/storm), shimmer (aurora) and scheduled bird song (river).
export function createAudio() {
  const api = { ctx: null, started: false, muted: false, analyser: null, timeData: null, scene: 'river' }
  let master, noiseGain, lp, bp, hp, subOsc, subGain, shimGain, timer = null

  function noiseBuffer(ctx) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const d = buf.getChannelData(0); let last = 0
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = (last * 3.2 + w * 0.28) * 0.7 }
    return buf
  }
  api.unlock = async () => {
    if (!api.ctx) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      api.ctx = ctx
      master = ctx.createGain(); master.gain.value = 0
      api.analyser = ctx.createAnalyser(); api.analyser.fftSize = 2048
      api.timeData = new Uint8Array(api.analyser.fftSize)
      master.connect(api.analyser); api.analyser.connect(ctx.destination)
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx); src.loop = true
      lp = ctx.createBiquadFilter(); lp.type = 'lowpass'
      bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.7
      hp = ctx.createBiquadFilter(); hp.type = 'highpass'
      noiseGain = ctx.createGain()
      src.connect(lp); lp.connect(bp); bp.connect(hp); hp.connect(noiseGain); noiseGain.connect(master)
      src.start()
      subOsc = ctx.createOscillator(); subOsc.type = 'sine'; subOsc.frequency.value = 34
      subGain = ctx.createGain(); subGain.gain.value = 0; subOsc.connect(subGain); subGain.connect(master); subOsc.start()
      shimGain = ctx.createGain(); shimGain.gain.value = 0; shimGain.connect(master)
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = [1244, 1866, 2489][i]
        const g = ctx.createGain(); g.gain.value = 0.012 / (i + 1); o.connect(g); g.connect(shimGain); o.start()
      }
      api.started = true
      applyScene(api.scene, true)
      timer = setInterval(() => ambientEvent(), 900)
    }
    await api.ctx.resume()
    master.gain.setTargetAtTime(api.muted ? 0 : 0.85, api.ctx.currentTime, 0.4)
  }
  function ambientEvent() {
    if (!api.ctx || api.muted || !api.started) return
    const ctx = api.ctx, t = ctx.currentTime
    if (api.scene === 'river' && Math.random() < 0.55) { // bird chirp: falling sine sweeps
      const o = ctx.createOscillator(), g = ctx.createGain()
      const f = 2400 + Math.random() * 1400
      o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.62, t + 0.14)
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.25)
    }
    if (api.scene === 'eruption' && Math.random() < 0.5) { // crackle pop
      const o = ctx.createBufferSource(); o.buffer = noiseBuffer(ctx)
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600 + Math.random() * 1800; f.Q.value = 6
      const g = ctx.createGain(); g.gain.setValueAtTime(0.1 + Math.random() * 0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
      o.connect(f); f.connect(g); g.connect(master); o.start(t, Math.random()); o.stop(t + 0.1)
    }
  }
  function applyScene(id, instant = false) {
    if (!api.ctx) return
    const t = api.ctx.currentTime, T = instant ? 0.05 : 1.2
    const cfg = {
      river:    { lp: 900,  bp: 520,  hp: 180,  ng: 0.5,  sub: 0,    shim: 0,    subF: 34 },
      falls:    { lp: 2600, bp: 700,  hp: 120,  ng: 0.95, sub: 0.1,  shim: 0,    subF: 30 },
      aurora:   { lp: 500,  bp: 320,  hp: 90,   ng: 0.16, sub: 0,    shim: 0.5,  subF: 34 },
      eruption: { lp: 300,  bp: 160,  hp: 40,   ng: 0.42, sub: 0.55, shim: 0,    subF: 27 },
      storm:    { lp: 3200, bp: 1100, hp: 500,  ng: 0.8,  sub: 0.12, shim: 0,    subF: 38 },
    }[id]
    if (!cfg) return
    lp.frequency.setTargetAtTime(cfg.lp, t, T); bp.frequency.setTargetAtTime(cfg.bp, t, T)
    hp.frequency.setTargetAtTime(cfg.hp, t, T); noiseGain.gain.setTargetAtTime(cfg.ng, t, T)
    subGain.gain.setTargetAtTime(cfg.sub, t, T); subOsc.frequency.setTargetAtTime(cfg.subF, t, T)
    shimGain.gain.setTargetAtTime(cfg.shim, t, T)
  }
  api.setScene = (id) => { api.scene = id; applyScene(id) }
  api.setMuted = async (m) => { api.muted = m; if (api.ctx) master.gain.setTargetAtTime(m ? 0 : 0.85, api.ctx.currentTime, 0.25) }
  api.strike = (meters = 600) => { // thunder: delayed, low-passed noise burst
    if (!api.ctx || api.muted) return
    const ctx = api.ctx, delay = meters / 343, t = ctx.currentTime + delay
    const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx)
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'
    f.frequency.setValueAtTime(420, t); f.frequency.exponentialRampToValueAtTime(55, t + 1.8)
    const g = ctx.createGain(); const vol = Math.min(0.9, 700 / Math.max(meters, 120))
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4)
    src.connect(f); f.connect(g); g.connect(master); src.start(t, Math.random()); src.stop(t + 2.6)
  }
  api.update = (time) => { // slow LFO life on the noise bed
    if (!api.ctx || !api.started) return
    const s = 0.5 + 0.5 * Math.sin(time * 0.4) * Math.sin(time * 0.13 + 2)
    if (api.scene === 'river') noiseGain.gain.setTargetAtTime(0.38 + s * 0.22, api.ctx.currentTime, 0.3)
    if (api.scene === 'aurora') bp.frequency.setTargetAtTime(260 + s * 180, api.ctx.currentTime, 0.5)
    if (api.scene === 'eruption') subGain.gain.setTargetAtTime(0.4 + s * 0.3, api.ctx.currentTime, 0.3)
    if (api.scene === 'storm') noiseGain.gain.setTargetAtTime(0.62 + s * 0.34, api.ctx.currentTime, 0.4)
  }
  return api
}
