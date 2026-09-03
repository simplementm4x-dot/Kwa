/* =========================================================
   Maquette du sol, a plat.

   Faute de navigateur ici, on recompose ce que le CSS va
   produire — carton, feuille d herbe, tranche ondulee, decor
   decoupe — pour verifier les raccords et les echelles avant
   de mettre quoi que ce soit en ligne.

   node tools/maquette.js sortie.png
   ========================================================= */
'use strict';
const P = require('./png.js');

/** collage avec transparence, contrairement a coller() qui ecrase */
function fondre(dest, src, x, y) {
  for (let j = 0; j < src.h; j++) {
    const dy = y + j;
    if (dy < 0 || dy >= dest.h) continue;
    for (let i = 0; i < src.w; i++) {
      const dx = x + i;
      if (dx < 0 || dx >= dest.w) continue;
      const s = (j * src.w + i) * 4, d = (dy * dest.w + dx) * 4;
      const a = src.px[s + 3] / 255;
      if (!a) continue;
      for (let k = 0; k < 3; k++) dest.px[d + k] = Math.round(src.px[s + k] * a + dest.px[d + k] * (1 - a));
      dest.px[d + 3] = 255;
    }
  }
}

/** repete une image sur une zone, comme background-repeat */
function tapisser(dest, src, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y += src.h) {
    for (let x = x0; x < x0 + w; x += src.w) {
      for (let j = 0; j < src.h && y + j < y0 + h; j++) {
        if (y + j < 0 || y + j >= dest.h) continue;
        for (let i = 0; i < src.w && x + i < x0 + w; i++) {
          if (x + i < 0 || x + i >= dest.w) continue;
          const s = (j * src.w + i) * 4, d = ((y + j) * dest.w + (x + i)) * 4;
          src.px.copy(dest.px, d, s, s + 4);
        }
      }
    }
  }
}

const A = f => P.decode('assets/' + f);
const W = 900, H = 620;
const vue = P.vide(W, H, 20, 12, 32);

/* le carton, sur toute la largeur */
tapisser(vue, A('carton.png'), 0, 0, W, H);

/* la feuille d herbe, plus etroite : le carton depasse de chaque cote */
const GX = 150, GW = 600;
tapisser(vue, A('herbe.png'), GX, 0, GW, H);

/* la tranche ondulee sur les deux bords de la feuille */
const tr = A('carton-tranche.png');
for (let y = 0; y < H; y += tr.h) {
  fondre(vue, tr, GX - tr.w, y);
  fondre(vue, tr, GX + GW, y);
}

/* le decor : arbres sur le carton, touffes sur l herbe */
const arbres = ['arbre-chene.png', 'arbre-bouleau.png', 'sapin.png', 'arbre-pommier.png'].map(A);
[[10, 300], [-60, 560], [700, 250], [760, 520]].forEach(([x, y], i) => {
  const a = arbres[i % arbres.length];
  fondre(vue, a, x, y - a.h);
});
const touffes = ['touffe-1.png', 'touffe-2.png', 'trefle.png', 'buisson.png'].map(A);
[[200, 180], [420, 300], [300, 470], [560, 590], [250, 600]].forEach(([x, y], i) => {
  const t = touffes[i % touffes.length];
  fondre(vue, t, x, y - t.h);
});

const out = process.argv[2] || 'maquette.png';
console.log('maquette : ' + P.encode(vue, out) + ' octets -> ' + out);
