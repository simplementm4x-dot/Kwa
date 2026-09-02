/* =========================================================
   KWA — bruitages synthetises (aucun fichier externe)
   ========================================================= */
(function (K) {
  'use strict';
  const A = K.audio = {};
  let ctx = null, on = true;

  A.setEnabled = v => { on = !!v; };
  A.enabled = () => on;

  function ac() {
    if (!on) return null;
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  A.unlock = () => { ac(); };

  /** une note simple */
  function note(freq, dur, type, vol, delay, slideTo) {
    const c = ac(); if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol == null ? 0.16 : vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function seq(list) { list.forEach(n => note(n[0], n[1], n[2] || 'square', n[3], n[4], n[5])); }

  /** une salve de bruit filtre : percussions */
  function noise(dur, vol, delay, freq, q) {
    const c = ac(); if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const n = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq || 240; f.Q.value = q == null ? 1 : q;
    const g = c.createGain(); g.gain.value = vol == null ? 0.12 : vol;
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(t0);
  }

  /** roulement de tambour qui accelere sur "sec" secondes */
  A.drumroll = function (sec) {
    if (!ac()) return;
    let t = 0, gap = 0.09;
    while (t < sec) {
      noise(0.05, 0.11, t, 240, 1.0);
      noise(0.03, 0.05, t, 1900, 0.8);
      t += gap;
      gap = Math.max(0.026, gap * 0.955);
    }
  };
  A.crash = () => {
    noise(1.2, 0.22, 0, 5200, 0.4);
    note(220, 0.45, 'triangle', 0.12);
    note(110, 0.7, 'sine', 0.13, 0.02);
  };

  A.blip    = () => note(660, 0.05, 'square', 0.09);
  A.type    = () => note(1200 + Math.random() * 200, 0.02, 'square', 0.035);
  A.tap     = () => note(420, 0.06, 'triangle', 0.12);
  A.step    = () => note(180 + Math.random() * 40, 0.05, 'triangle', 0.07);
  A.dice    = () => { for (let i = 0; i < 5; i++) note(300 + i * 90, 0.05, 'square', 0.08, i * 0.06); };
  A.good    = () => seq([[523, .1], [659, .1, 'square', .16, .09], [784, .18, 'square', .16, .18]]);
  A.bad     = () => seq([[300, .14, 'sawtooth', .14], [200, .26, 'sawtooth', .14, .13]]);
  A.up      = () => seq([[440, .07], [660, .07, 'square', .14, .06], [880, .12, 'square', .14, .12]]);
  A.down    = () => seq([[440, .1, 'sawtooth', .12, 0, 160]]);
  A.tick    = () => note(900, 0.035, 'square', 0.07);
  A.buzzer  = () => seq([[160, .5, 'sawtooth', .18]]);
  A.pop     = () => note(880, 0.07, 'sine', 0.14, 0, 1400);
  A.jingle  = () => seq([
    [784, .1], [988, .1, 'square', .15, .1], [1175, .1, 'square', .15, .2],
    [1568, .26, 'square', .17, .3], [1175, .1, 'square', .12, .3]
  ]);
  A.fanfare = () => seq([
    [523, .12], [659, .12, 'square', .16, .12], [784, .12, 'square', .16, .24],
    [1046, .3, 'square', .18, .36], [784, .3, 'triangle', .12, .36], [1318, .4, 'square', .14, .62]
  ]);
  A.pong    = () => note(520, 0.04, 'square', 0.12);
})(window.KWA);
