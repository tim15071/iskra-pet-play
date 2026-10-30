// Measurements from iskra_parts_clean.png (1536x1024), recorded in study/iskra-crops.json.
// Coordinates below refer to the extracted source rectangles, before prep trim.
(function () {
  'use strict';
  const raw = {
    iskra_body: [420, 482], iskra_head: [408, 528],
    iskra_wing_l: [405, 414], iskra_wing_r: [430, 436],
    iskra_tail: [431, 434], iskra_blink: [408, 528]
  };
  function measurement(name, artScale) {
    const a = (window.ASSETS || {})[name] || {}, crop = a.crop || [0, 0, ...raw[name]],
      prepScale = a.scale || 1;
    return {
      w: (a.w || raw[name][0]) / prepScale * artScale,
      h: (a.h || raw[name][1]) / prepScale * artScale,
      point: (p) => [(p[0] - crop[0]) * artScale, (p[1] - crop[1]) * artScale]
    };
  }
  function part(name, artScale, pivot, at, restRot = 0) {
    const a = measurement(name, artScale);
    return { tex: name, w: a.w, h: a.h, pivot: a.point(pivot), at, restRot };
  }
  const head = measurement('iskra_head', .36), left = measurement('iskra_wing_r', .30),
    right = measurement('iskra_wing_l', .34), tail = measurement('iskra_tail', .29);
  window.ISKRA_RIG.configure({
    parts: {
      body: part('iskra_body', .50, [208, 474], [0, 0]),
      head: part('iskra_head', .36, [249, 480], [0, -215]),
      // The atlas labels use the bird's anatomical side. Joint L/R are viewer sides.
      wingL: part('iskra_wing_r', .30, [352, 48], [-61, -207], -.58),
      wingR: part('iskra_wing_l', .34, [80, 42], [61, -207], .58),
      tail: part('iskra_tail', .29, [355, 39], [-30, -119], .23),
      // The generated closed-eye drawing changes the crest and its lighting.
      // Keep the extracted asset for inspection, but use the registered open head
      // for both states so an automated blink cannot flash a different silhouette.
      blink: part('iskra_head', .36, [249, 480], [0, -215])
    },
    anchors: {
      footL: [-54, 0], footR: [52, 0], hip: [0, -62],
      headCentre: head.point([234, 325]), headTop: head.point([156, 8]),
      wingTipL: left.point([20, 418]), wingTipR: right.point([384, 391]),
      tailTip: tail.point([18, 384])
    }
  });
  window.ISKRA_RIG_BLINK_ENABLED = false;
})();
