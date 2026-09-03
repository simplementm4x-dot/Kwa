/* =========================================================
   Repere chaque arbre de la planche src/lot_arbre.png par
   ses pixels opaques, et sort son cadre.
   ========================================================= */
'use strict';
const P = require('./png.js');

const SEUIL = 70;        /* en dessous, c est le halo, pas l arbre */
const MIN_AIRE = 6000;   /* on ignore les brins isoles */

function composantes(img) {
  const vu = new Uint8Array(img.w * img.h);
  const boites = [];
  const pile = new Int32Array(img.w * img.h);

  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const dep = y * img.w + x;
      if (vu[dep] || img.px[dep * 4 + 3] < SEUIL) continue;
      let n = 0, aire = 0;
      let x0 = x, x1 = x, y0 = y, y1 = y;
      pile[n++] = dep;
      vu[dep] = 1;
      while (n) {
        const p = pile[--n];
        const px = p % img.w, py = (p / img.w) | 0;
        aire++;
        if (px < x0) x0 = px; if (px > x1) x1 = px;
        if (py < y0) y0 = py; if (py > y1) y1 = py;
        for (let d = 0; d < 4; d++) {
          const nx = px + (d === 0 ? 1 : d === 1 ? -1 : 0);
          const ny = py + (d === 2 ? 1 : d === 3 ? -1 : 0);
          if (nx < 0 || ny < 0 || nx >= img.w || ny >= img.h) continue;
          const q = ny * img.w + nx;
          if (vu[q] || img.px[q * 4 + 3] < SEUIL) continue;
          vu[q] = 1;
          pile[n++] = q;
        }
      }
      if (aire >= MIN_AIRE) boites.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, aire });
    }
  }
  return boites;
}

const img = P.decode('src/lot_arbre.png');
const boites = composantes(img).sort((a, b) => (a.y / 300 | 0) - (b.y / 300 | 0) || a.x - b.x);
console.log(boites.length + ' elements trouves :');
boites.forEach((b, i) => {
  console.log('  ' + i + ' : x=' + b.x + ' y=' + b.y + ' ' + b.w + 'x' + b.h + ' (aire ' + b.aire + ')');
});

/* planche de controle : chaque arbre sur fond magenta */
const COL = 5, CASE = 190;
const planche = P.vide(COL * CASE, Math.ceil(boites.length / COL) * CASE, 255, 0, 255);
boites.forEach((b, i) => {
  const ech = Math.min(CASE / b.w, CASE / b.h);
  const im = P.resize(P.crop(img, b.x, b.y, b.w, b.h), Math.round(b.w * ech), Math.round(b.h * ech));
  P.coller(planche, im, (i % COL) * CASE, ((i / COL) | 0) * CASE);
});
const out = process.argv[2] || 'arbres-controle.png';
console.log('planche de controle : ' + P.encode(planche, out) + ' octets -> ' + out);
