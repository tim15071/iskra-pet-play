// Iskra's stationary workshop guide. Body and feet are fixed at the ground root;
// the wings, head and tail each use their own anatomical attachment and matrix.
(function (root) {
  'use strict';

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const finite = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;
  const smooth = (v) => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
  const hash = (v) => { const n = Math.sin(v * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
  const copy = (v) => JSON.parse(JSON.stringify(v));

  // Default view-space measurements are provisional until configure() receives
  // measurements from the actual prepared art. No texture-resolution multiplier.
  const config = {
    id: 'iskra',
    parts: {
      body:  { tex: 'iskra_body',   w: 218, h: 236, pivot: [109, 236], at: [0, 0] },
      head:  { tex: 'iskra_head',   w: 200, h: 172, pivot: [100, 145], at: [0, -180] },
      wingL: { tex: 'iskra_wing_l', w: 95,  h: 175, pivot: [76, 22],  at: [-72, -171] },
      wingR: { tex: 'iskra_wing_r', w: 95,  h: 175, pivot: [19, 22],  at: [72, -171] },
      tail:  { tex: 'iskra_tail',   w: 80,  h: 115, pivot: [40, 12],  at: [0, -96] },
      blink: { tex: 'iskra_blink',  w: 200, h: 172, pivot: [100, 145], at: [0, -180] }
    },
    anchors: {
      // Body/root points are model-relative. Other tips are local image pixels.
      footL: [-39, 0], footR: [39, 0], hip: [0, -78],
      headCentre: [100, 76], headTop: [100, 6],
      wingTipL: [12, 143], wingTipR: [83, 143], tailTip: [40, 107]
    }
  };

  function configure(spec = {}) {
    if (typeof spec.id === 'string') config.id = spec.id;
    if (spec.parts) {
      for (const key of Object.keys(config.parts)) {
        if (spec.parts[key]) Object.assign(config.parts[key], copy(spec.parts[key]));
      }
    }
    if (spec.anchors) Object.assign(config.anchors, copy(spec.anchors));
    return copy(config);
  }

  function textureAvailable(name) {
    if (!root.G || typeof root.G.tex !== 'function') return false;
    try { root.G.tex(name); return true; } catch (_) { return false; }
  }

  function isReady() {
    return ['body', 'head', 'wingL', 'wingR', 'tail'].every((key) => textureAvailable(config.parts[key].tex));
  }

  // A compact, finite event curve: no accumulated render state or per-frame
  // integration. A single find produces two little wing beats, then settles.
  function latestAge(S, kinds, t) {
    let age = Infinity;
    for (const e of S.ev || []) {
      if (!kinds.includes(e.k)) continue;
      const a = t - e.t;
      if (a >= 0 && a < age) age = a;
    }
    return age;
  }

  function pulse(age, duration) {
    if (age < 0 || age >= duration) return 0;
    const u = age / duration;
    // Raised cosine starts and ends with zero velocity.
    return Math.sin(Math.PI * u) ** 2;
  }

  function target(S, x, y) {
    if (Array.isArray(S.rigTarget)) return S.rigTarget;
    const sim = root.SIM;
    if (S.hint && S.hint.until > S.t && sim && typeof sim.items === 'function') {
      const hinted = sim.items(S).find((o) => o.id === S.hint.id);
      if (hinted) return [hinted.x, hinted.y];
    }
    // Pointer attention is quiet enough to leave a clear front-facing silhouette.
    return [finite(S.x, x), finite(S.y, y - 200)];
  }

  function isBlinking(t, neutral) {
    if (neutral || !textureAvailable(config.parts.blink.tex)) return false;
    const slot = Math.floor(t / 4.7);
    const start = slot * 4.7 + 1.1 + hash(slot + 7) * 2.7;
    const age = t - start;
    return age >= 0 && age < 0.10 || hash(slot + 19) > 0.73 && age > 0.19 && age < 0.27;
  }

  function pose(S = {}, time = 0, x = 0, y = 0, scale = 1) {
    const t = finite(time), neutral = !!S.neutral;
    if (neutral) return { head: 0, wingL: 0, wingR: 0, tail: 0, headX: 1, blink: false, joy: 0, curious: 0 };
    const R = S.reaction || {};
    const joy = clamp(finite(R.joy) * 2.2, -0.20, 1);
    const curious = clamp(finite(R.curious) * 2.8, -0.15, 1);
    const world = finite(S.wt0) + t;
    const findAge = latestAge(S, ['find', 'win'], t);
    const beatAge = Number.isFinite(findAge) ? findAge : 0;
    const clueAge = latestAge(S, ['hint', 'focus', 'distractor'], t);
    const celebrate = pulse(findAge, 1.12);
    const winAge = S.mode === 'win' && finite(S.wonAt, -1) >= 0 ? t - S.wonAt : Infinity;
    const finale = pulse(winAge, 1.75);
    const look = target(S, x, y);
    const unit = Math.max(0.05, finite(scale, 1));
    const gazeX = Math.tanh((look[0] - x) / (440 * unit));
    const gazeY = Math.tanh((look[1] - y + 220 * unit) / (360 * unit));
    const idleL = 0.065 * Math.sin(world * TAU / 4.9 + 0.3);
    const idleR = 0.048 * Math.sin(world * TAU / 5.7 + 1.9);
    // Independent wing beats: the right wing begins slightly after the left.
    const waveL = celebrate * (0.29 + 0.16 * Math.sin(beatAge * 16 - 0.8));
    const waveR = pulse(findAge - 0.09, 1.06) * (0.24 + 0.16 * Math.sin((beatAge - 0.09) * 16 - 0.8));
    const inspect = pulse(clueAge, 1.7);
    return {
      head: 0.075 * gazeX - 0.035 * gazeY + 0.040 * Math.sin(world * TAU / 6.8 + 0.5)
        + 0.16 * inspect + 0.16 * curious - 0.12 * joy - 0.07 * finale,
      headX: 1 - 0.025 * Math.abs(gazeX),
      wingL: idleL + 0.40 * joy + waveL + 0.035 * curious + 0.18 * finale,
      wingR: idleR - 0.29 * joy - waveR - 0.10 * inspect - 0.22 * finale,
      tail: 0.11 * Math.sin(world * TAU / 4.1 + 1.3) + 0.28 * joy
        + 0.15 * celebrate * Math.sin(Math.max(0, beatAge - 0.13) * 12),
      blink: isBlinking(world, false), joy, curious
    };
  }

  function geometry(S, t, x, y, scale) {
    scale = Math.max(0.01, finite(scale, 1));
    const L = root.LIB, M = L.M, P = config.parts, A = config.anchors;
    const p = pose(S, t, x, y, scale);
    const rootMatrix = M.of(M.t(x, y), M.s(scale, scale));
    const partMatrix = (part, angle, sx = 1) => M.of(rootMatrix, M.t(part.at[0], part.at[1]), M.r(angle + finite(part.restRot)), M.s(sx, 1));
    const matrices = {
      body: partMatrix(P.body, 0),
      head: partMatrix(P.head, p.head, p.headX),
      wingL: partMatrix(P.wingL, p.wingL),
      wingR: partMatrix(P.wingR, p.wingR),
      tail: partMatrix(P.tail, p.tail)
    };
    const bodyPoint = (point) => M.ap(rootMatrix, point);
    const onPart = (key, point) => M.ap(matrices[key], [point[0] - P[key].pivot[0], point[1] - P[key].pivot[1]]);
    const j = {
      ground: [x, y], groundL: bodyPoint(A.footL), groundR: bodyPoint(A.footR),
      heelL: bodyPoint(A.footL), heelR: bodyPoint(A.footR),
      hip: bodyPoint(A.hip), neck: bodyPoint(P.head.at),
      head: onPart('head', A.headCentre), top: onPart('head', A.headTop),
      shL: bodyPoint(P.wingL.at), shR: bodyPoint(P.wingR.at),
      handL: onPart('wingL', A.wingTipL), handR: onPart('wingR', A.wingTipR),
      tailBase: bodyPoint(P.tail.at), tailTip: onPart('tail', A.tailTip)
    };
    return { pose: p, matrices, joints: j };
  }

  function joints(S = {}, time = 0, x = 0, y = 0, scale = 1) {
    return geometry(S, finite(time), finite(x), finite(y), finite(scale, 1)).joints;
  }

  function draw(S = {}, time = 0, x = 0, y = 0, scale = 1) {
    if (!root.LIB || !isReady()) return false;
    x = finite(x); y = finite(y); scale = Math.max(0.01, finite(scale, 1));
    const L = root.LIB, P = config.parts, g = geometry(S, finite(time), x, y, scale);
    const part = (key, texture) => {
      const p = P[key];
      L.sprite(texture || p.tex, 0, 0, {
        m: g.matrices[key], w: p.w, h: p.h, pivot: p.pivot,
        u: { alpha: 1 }
      });
    };
    // Tail and shoulders begin under the torso so the visible seams stay covered.
    part('tail');
    part('wingL');
    part('wingR');
    part('body');
    part('head', g.pose.blink ? P.blink.tex : P.head.tex);
    if (typeof L.joint === 'function' && !L.sp) {
      for (const [name, point] of Object.entries(g.joints)) L.joint(config.id, name, point);
    }
    return true;
  }

  // This is an idle/gesture loop, deliberately not a locomotion cycle. The model
  // contains no distance, step phase, root translation or moving foot targets.
  function qaLoop(base, duration = 6.8, frames = 32) {
    const source = copy(base || {}), t0 = finite(source.t);
    return Array.from({ length: frames }, (_, i) => Object.assign(copy(source), {
      t: t0 + duration * i / frames,
      neutral: false,
      ev: [],
      reaction: { joy: 0, joyV: 0, curious: 0, curiousV: 0 }
    }));
  }

  root.ISKRA_RIG = { configure, isReady, draw, joints, pose, qaLoop,
    get textures() { return Object.values(config.parts).map((p) => p.tex); } };
})(typeof window !== 'undefined' ? window : globalThis);
