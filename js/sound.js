// Friday to Sunday: sound
"use strict";

/* ---------- Sound ---------- */
// All sounds are synthesized in the browser. No audio files.
const Sound = (() => {
  let ctx = null, master = null, amb = null, hornBus = null, noiseBuf = null, muted = false;
  try { muted = localStorage.getItem("friday-to-sunday-sound") === "off"; } catch (e) {}
  function ac() {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ctx = new C(); } catch (e) { return null; }
      // Signal chain: crowd (amb) and horn each feed a compressor, so loud moments stay clean
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = .005; comp.release.value = .25;
      master = ctx.createGain(); master.gain.value = .95;
      comp.connect(master); master.connect(ctx.destination);
      amb = ctx.createGain(); amb.gain.value = 1; amb.connect(comp);
      hornBus = ctx.createGain(); hornBus.gain.value = .8; hornBus.connect(comp);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function noise() {
    if (noiseBuf) return noiseBuf;
    const len = ctx.sampleRate * 4, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * .1848) * .16;
    }
    return (noiseBuf = b);
  }
  function env(g, t, a, peak, hold, rel) {
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(.0001, t + a + hold + rel);
    return t + a + hold + rel + .05;
  }
  function noiseSrc(t, end) { const s = ctx.createBufferSource(); s.buffer = noise(); s.loop = true; s.start(t, Math.random() * 3); s.stop(end); return s; }
  function filt(type, f, q) { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q == null ? .7 : q; return n; }
  function pan(v) {
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = v; return p; }
    return ctx.createGain();
  }
  const R = (a, b) => a + Math.random() * (b - a);

  // Crowd sizes. Each layer adds realism: a wide noise "wash", low rumble, dozens of individual voices, claps and fan whistles.
  const CROWD = {
    roar:   { a: .35, peak: .9,  hold: 3.4, rel: 2.4, rumble: .6, voices: 34, vox: .03,  claps: 140, fanWhistles: 4, rise: 1.18, vowel: [750, 1250] },
    cheer:  { a: .3,  peak: .65, hold: 1.5, rel: 1.6, rumble: .35, voices: 22, vox: .026, claps: 70, fanWhistles: 2, rise: 1.12, vowel: [750, 1250] },
    light:  { a: .25, peak: .32, hold: .7,  rel: 1.0, rumble: .1, voices: 9,  vox: .02,  claps: 25, fanWhistles: 0, rise: 1.06, vowel: [700, 1150] },
    murmur: { a: .25, peak: .16, hold: .4,  rel: .8,  rumble: .08, voices: 0, vox: 0,    claps: 0,  fanWhistles: 0, rise: 1,   vowel: [500, 900] },
    groan:  { a: .22, peak: .42, hold: .9,  rel: 1.4, rumble: .25, voices: 22, vox: .026, claps: 0,  fanWhistles: 0, rise: .78, vowel: [430, 780] }
  };

  const fx = {
    crowd(t, kind) {
      const s = CROWD[kind]; if (!s) return;
      const total = s.a + s.hold + s.rel;
      // 1. Wide wash, split left and right
      [-.7, .7].forEach(p => {
        const g = ctx.createGain(), bp = filt("bandpass", R(800, 1100), .5), pn = pan(p);
        const end = env(g, t + R(0, .08), s.a, s.peak * .5, s.hold, s.rel);
        noiseSrc(t, end).connect(bp); bp.connect(g); g.connect(pn); pn.connect(amb);
        const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = R(2, 5); lg.gain.value = s.peak * .12;
        lfo.connect(lg); lg.connect(g.gain); lfo.start(t); lfo.stop(end);
      });
      // 2. Low rumble (stadium body)
      if (s.rumble) {
        const g = ctx.createGain(), lp = filt("lowpass", 260, .7);
        const end = env(g, t, s.a * 1.3, s.rumble, s.hold, s.rel);
        noiseSrc(t, end).connect(lp); lp.connect(g); g.connect(amb);
      }
      // 3. Individual voices shaped into a vowel ("yeahhh" rising, "ohhh" falling)
      if (s.voices) {
        const f1 = filt("bandpass", s.vowel[0], 3.5), f2 = filt("bandpass", s.vowel[1], 4), vg = ctx.createGain();
        f1.connect(vg); f2.connect(vg); vg.connect(amb);
        const vend = env(vg, t, s.a, 1, s.hold, s.rel);
        for (let i = 0; i < s.voices; i++) {
          const o = ctx.createOscillator(), og = ctx.createGain(), pn = pan(R(-.9, .9));
          const f0 = Math.random() < .55 ? R(110, 190) : R(200, 360), st = t + R(0, .35);
          o.type = "sawtooth";
          o.frequency.setValueAtTime(f0, st);
          o.frequency.exponentialRampToValueAtTime(f0 * s.rise * R(.97, 1.03), st + s.a + s.hold * .6);
          const vib = ctx.createOscillator(), vgn = ctx.createGain(); vib.frequency.value = R(4.5, 7); vgn.gain.value = f0 * .015;
          vib.connect(vgn); vgn.connect(o.frequency);
          og.gain.value = s.vox * R(.6, 1.2);
          o.connect(og); og.connect(pn); pn.connect(f1); pn.connect(f2);
          const stop = Math.min(vend, st + total * R(.75, 1.05));
          o.start(st); vib.start(st); o.stop(stop); vib.stop(stop);
        }
      }
      // 4. Claps scattered across the reaction
      for (let i = 0; i < s.claps; i++) {
        const ct = t + s.a * .5 + Math.random() * (s.hold + s.rel * .5);
        const g = ctx.createGain(), bp = filt("bandpass", R(1400, 2600), 1.4), pn = pan(R(-.9, .9));
        noiseSrc(ct, ct + .05).connect(bp); bp.connect(g); g.connect(pn); pn.connect(amb);
        env(g, ct, .001, R(.08, .2), .004, .03);
      }
      // 5. Fans whistling
      for (let i = 0; i < s.fanWhistles; i++) {
        const st = t + R(.2, 1.2), o = ctx.createOscillator(), g = ctx.createGain(), pn = pan(R(-.8, .8)), f = R(1800, 2600);
        o.type = "sine"; o.frequency.setValueAtTime(f, st); o.frequency.linearRampToValueAtTime(f * R(1.15, 1.3), st + .25); o.frequency.linearRampToValueAtTime(f * R(.9, 1.0), st + .6);
        o.connect(g); g.connect(pn); pn.connect(amb);
        const end = env(g, st, .03, .035, .45, .2); o.start(st); o.stop(end);
      }
    },
    horn(t, len) {
      len = len || 1.76;
      // Duck everything else so the horn is the main sound, then bring the crowd back up underneath
      amb.gain.cancelScheduledValues(t);
      amb.gain.setTargetAtTime(.18, t, .04);
      amb.gain.setTargetAtTime(1, t + len, .35);
      const shaper = ctx.createWaveShaper(), curve = new Float32Array(2048), k = 14;
      for (let i = 0; i < 2048; i++) { const x = i / 1024 - 1; curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); }
      shaper.curve = curve; shaper.oversample = "4x";
      const pre = ctx.createGain(); pre.gain.value = .5;
      const honk = filt("peaking", 900, 1.2); honk.gain.value = 7;
      const lp = filt("lowpass", 3200, .8), g = ctx.createGain();
      pre.connect(shaper); shaper.connect(honk); honk.connect(lp); lp.connect(g); g.connect(hornBus);
      const end = env(g, t, .03, .42, len, .4);
      const flutter = ctx.createOscillator(), fg = ctx.createGain(); flutter.frequency.value = 7; fg.gain.value = .04;
      flutter.connect(fg); fg.connect(g.gain); flutter.start(t); flutter.stop(end);
      [[110, "sawtooth", .5], [138.6, "sawtooth", .42], [164.8, "sawtooth", .38], [220, "sawtooth", .22], [55, "square", .3]].forEach(([f, type, lvl]) =>
        [-7, 7].forEach(dt => {
          const o = ctx.createOscillator(), og = ctx.createGain();
          o.type = type; o.detune.value = dt;
          o.frequency.setValueAtTime(f * .93, t); o.frequency.exponentialRampToValueAtTime(f, t + .14);
          og.gain.value = lvl * .5; o.connect(og); og.connect(pre); o.start(t); o.stop(end);
        }));
    },
    // Home crowd on an opponent's 3rd down: a rising roar with stomps and a "DE-FENSE" chant
    thirdDown(t) {
      const len = 3.4;
      // rising wash under everything
      [-.6, .6].forEach(p => {
        const g = ctx.createGain(), bp = filt("bandpass", R(850, 1050), .5), pn = pan(p);
        g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .4);
        g.gain.linearRampToValueAtTime(.38, t + len - .6); g.gain.exponentialRampToValueAtTime(.0001, t + len + .6);
        noiseSrc(t, t + len + .7).connect(bp); bp.connect(g); g.connect(pn); pn.connect(amb);
      });
      const beat = .52;
      for (let rep = 0; rep < 3; rep++) {
        const t0 = t + .35 + rep * beat * 2.2;
        [[0, "de"], [beat, "fense"]].forEach(([dt, syl]) => {
          const st = t0 + dt;
          // stomp
          const o = ctx.createOscillator(), og = ctx.createGain();
          o.frequency.setValueAtTime(95, st); o.frequency.exponentialRampToValueAtTime(40, st + .18);
          o.connect(og); og.connect(amb); const e1 = env(og, st, .004, .55, .02, .2); o.start(st); o.stop(e1);
          const sg = ctx.createGain(), lp = filt("lowpass", 300, .8);
          noiseSrc(st, st + .25).connect(lp); lp.connect(sg); sg.connect(amb); env(sg, st, .003, .4, .01, .12);
          // many voices on the syllable
          const f1 = filt("bandpass", syl === "de" ? 450 : 560, 3.5), f2 = filt("bandpass", syl === "de" ? 2000 : 1750, 4), vg = ctx.createGain();
          f1.connect(vg); f2.connect(vg); vg.connect(amb);
          const dur = syl === "de" ? .2 : .32;
          const ve = env(vg, st + .02, .03, .9 + rep * .15, dur, .15);
          for (let i = 0; i < 16; i++) {
            const v = ctx.createOscillator(), vgn = ctx.createGain(), pn = pan(R(-.9, .9));
            const f0 = (Math.random() < .6 ? R(120, 180) : R(210, 300)) * (syl === "de" ? 1 : 1.12);
            v.type = "sawtooth"; v.frequency.setValueAtTime(f0, st);
            if (syl === "fense") v.frequency.exponentialRampToValueAtTime(f0 * .9, st + dur + .1);
            vgn.gain.value = .02 * R(.7, 1.2); v.connect(vgn); vgn.connect(pn); pn.connect(f1); pn.connect(f2);
            const s0 = st + R(0, .05); v.start(s0); v.stop(ve);
          }
          // a sharp "-se" hiss at the end of FENSE
          if (syl === "fense") {
            const hg = ctx.createGain(), hp = filt("highpass", 4000, .7);
            noiseSrc(st + dur, st + dur + .25).connect(hp); hp.connect(hg); hg.connect(amb); env(hg, st + dur, .01, .12, .06, .1);
          }
        });
      }
      return len;
    },
    thud(t) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(115, t); o.frequency.exponentialRampToValueAtTime(42, t + .2);
      o.connect(g); g.connect(amb); const end = env(g, t, .004, .7, .02, .25);
      o.start(t); o.stop(end);
      const g2 = ctx.createGain(), lp = filt("lowpass", 380, .8);
      noiseSrc(t, t + .3).connect(lp); lp.connect(g2); g2.connect(amb); env(g2, t, .003, .5, .01, .12);
    },
    kick(t) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(65, t + .07);
      o.connect(g); g.connect(amb); const end = env(g, t, .002, .6, .01, .1);
      o.start(t); o.stop(end);
      const g2 = ctx.createGain(), hp = filt("highpass", 1600, .7);
      noiseSrc(t, t + .1).connect(hp); hp.connect(g2); g2.connect(amb); env(g2, t, .001, .25, .005, .04);
    }
  };
  return {
    muted: () => muted,
    toggle() { muted = !muted; try { localStorage.setItem("friday-to-sunday-sound", muted ? "off" : "on"); } catch (e) {} return !muted; },
    play(cues) {
      if (muted || !cues.length) return;
      const c = ac(); if (!c) return;
      const t0 = c.currentTime + .03;
      cues.forEach(([name, at, arg]) => { try { fx[name](t0 + at, arg); } catch (e) {} });
    }
  };
})();

const HOME = 0;
// Crowd and horn rules: regular games root for the home team; a neutral site (Super Bowl) reacts to the play itself.
function resultCues(r, preScores) {
  const cues = [], neutral = !!S.neutral;
  const homeScored = S.teams[HOME].score > preScores[HOME], awayScored = S.teams[1 - HOME].score > preScores[1 - HOME];
  const isPAT = r.offId === "xp" || r.offId === "two" || !!r.pat;
  // A kickoff returned for a touchdown after the extra point counts as a real score
  const retTD = isPAT && ((r.team !== HOME && homeScored) || (r.team === HOME && awayScored));
  const patOnly = isPAT && !retTD;
  let t = 0;
  if (r.offId === "punt" || r.offId === "fg" || r.offId === "xp") { cues.push(["kick", 0]); t = r.offId === "punt" ? .25 : .7; }
  const stuffed = r.offId !== "kneel" && (r.head === "Sack" || r.tod || r.head === "Fumble" || (r.y != null && r.y < 0));
  if (stuffed) cues.push(["thud", 0]);
  // How good was the play for the team that had the ball?
  let q = r.s;
  if (q == null) {
    if (r.offId === "fg") q = /good/i.test(r.head) && !/No good/.test(r.head) ? 2 : -2;
    else if (r.offId === "punt") q = /Blocked|Return TD/.test(r.head) ? -2 : 0;
    else if (isPAT) q = r.tone === "good" ? 1 : -1;
    else q = 0;
  }
  let crowd = null;
  if (neutral) {
    if (homeScored || awayScored) crowd = "roar";
    else if (Math.abs(q) >= 2) crowd = q > 0 ? "cheer" : "groan";
    else if (q !== 0) crowd = "murmur";
  } else {
    if (homeScored && (!patOnly || r.team !== HOME)) crowd = homeScored && retTD && r.team === HOME ? "groan" : "roar";
    else if (awayScored && !patOnly) crowd = "groan";
    else {
      const hq = r.team === HOME ? q : -q;
      crowd = hq >= 2 ? "cheer" : hq === 1 ? "light" : hq === -1 ? "murmur" : hq <= -2 ? "groan" : null;
    }
  }
  if (crowd) cues.push(["crowd", t + .2, crowd]);
  const hornForScore = neutral ? (!patOnly && (homeScored || awayScored)) : (homeScored && (!isPAT || r.team !== HOME));
  if (hornForScore) cues.push(["horn", t + .45, 1.76]);
  // Made extra point: a shorter horn (half the touchdown horn) for the home team, or for anyone at the Super Bowl
  if (r.offId === "xp" && r.tone === "good" && (neutral || r.team === HOME)) cues.push(["horn", t + .3, 1.1]);
  // Made two-point conversion: the full touchdown-length horn
  if (r.pat === "two" && r.tone === "good" && (neutral || r.team === HOME)) cues.push(["horn", t + .45, 1.76]);
  return cues;
}
function cuesFor(a, pre) {
  if (!S.teams) return [];
  if (a === "mute" || a === "to") return [];
  if (a === "spike" || a === "onside") return [];
  if (S.phase === "penalty" && pre.phase !== "penalty") return [];
  const cues = [];
  if (S.tmwJust) S.tmwJust = false;
  let t = 0;
  // Visiting offense facing 3rd down: the home crowd gets loud
  if (S.snap && S.snap !== pre.snap && S.snap.down === 3 && S.snap.poss !== HOME && !S.twoPt && !S.neutral && S.phase !== "final") {
    cues.push(["thirdDown", t]);
    if (S.phase === "result") t += 3.6;
  }
  if (S.phase === "result" && S.last && S.last.id !== pre.lastId)
    resultCues(S.last, pre.scores).forEach(([n, at, arg]) => cues.push([n, at + t, arg]));
  if (S.phase === "final" && pre.phase !== "final") {
    const homeWin = S.teams[HOME].score > S.teams[1 - HOME].score;
    if (S.neutral) cues.push(["crowd", t + .2, "roar"]);
    else if (homeWin) cues.push(["crowd", t + .2, "roar"]);
    else if (S.teams[HOME].score < S.teams[1 - HOME].score) cues.push(["crowd", t + .2, "groan"]);
    if (homeWin || S.neutral) cues.push(["horn", t + .4, 2.56]);
  }
  return cues;
}
