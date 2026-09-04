/* =========================================================
   Maquette de l ecran d ordinateur.

   Faute de navigateur ici, on recompose ce que css/pano.css
   va produire : le ciel, la chaine de montagnes, les falaises,
   les nuages, et la place que prend le plateau au milieu.

   Les positions sont recopiees a la main depuis la feuille de
   style. Si l une bouge la-bas, elle doit bouger ici — c est le
   prix a payer pour pouvoir regarder le resultat avant de le
   mettre en ligne, et ca reste moins cher que de deviner.

   node tools/maquette-pc.js [largeur] [hauteur] [sortie.png]
   ========================================================= */
'use strict';
const path = require('path');
const P = require('./png.js');

const L = +process.argv[2] || 1440;
const H = +process.argv[3] || 900;
const SORTIE = process.argv[4] || 'maquette-pc.png';

const A = f => path.resolve(__dirname, '..', 'assets', f);

/* --- outils de composition --- */
function fondre(dest, src, x, y) {
  for (let j = 0; j < src.h; j++) {
    const dy = Math.round(y) + j;
    if (dy < 0 || dy >= dest.h) continue;
    for (let i = 0; i < src.w; i++) {
      const dx = Math.round(x) + i;
      if (dx < 0 || dx >= dest.w) continue;
      const s = (j * src.w + i) * 4, d = (dy * dest.w + dx) * 4;
      const a = src.px[s + 3] / 255;
      if (!a) continue;
      for (let k = 0; k < 3; k++) {
        dest.px[d + k] = Math.round(src.px[s + k] * a + dest.px[d + k] * (1 - a));
      }
      dest.px[d + 3] = 255;
    }
  }
}

/** l equivalent de filter: brightness() saturate() */
function teinte(img, clair, sat) {
  const out = { w: img.w, h: img.h, px: Buffer.from(img.px) };
  for (let i = 0; i < out.px.length; i += 4) {
    const r = out.px[i], v = out.px[i + 1], b = out.px[i + 2];
    const gris = 0.299 * r + 0.587 * v + 0.114 * b;
    out.px[i]     = Math.min(255, Math.round((gris + (r - gris) * sat) * clair));
    out.px[i + 1] = Math.min(255, Math.round((gris + (v - gris) * sat) * clair));
    out.px[i + 2] = Math.min(255, Math.round((gris + (b - gris) * sat) * clair));
  }
  return out;
}

/** repete une image horizontalement, comme background-repeat:repeat-x */
function bande(dest, src, x0, x1, y) {
  for (let x = x0; x < x1; x += src.w) fondre(dest, src, x, y);
}

/* --- le ciel, recopie du degrade de css/board.css --- */
const ciel = P.vide(L, H, 0, 0, 0, 255);
for (let y = 0; y < H; y++) {
  const t = y / H;
  /* violet en haut, vert sombre en bas */
  let r, v, b;
  if (t < 0.35)      { const k = t / 0.35;        r = 43 + (28 - 43) * k; v = 27 + (17 - 27) * k; b = 87 + (64 - 87) * k; }
  else if (t < 0.70) { const k = (t - 0.35) / 0.35; r = 28 + (18 - 28) * k; v = 17 + (43 - 17) * k; b = 64 + (40 - 64) * k; }
  else               { const k = (t - 0.70) / 0.30; r = 18 + (10 - 18) * k; v = 43 + (26 - 43) * k; b = 40 + (24 - 40) * k; }
  /* le halo violet du haut */
  for (let x = 0; x < L; x++) {
    const dx = (x - L / 2) / (L * 0.35), dy = (y - H * 0.08) / (H * 0.45);
    const halo = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
    const o = (y * L + x) * 4;
    ciel.px[o]     = Math.round(r + halo * 63);
    ciel.px[o + 1] = Math.round(v + halo * 36);
    ciel.px[o + 2] = Math.round(b + halo * 89);
    ciel.px[o + 3] = 255;
  }
}

/* --- les couches, dans l ordre de css/pano.css --- */
const pc = (nom, clair, sat) => teinte(P.decode(A(nom)), clair, sat);

const mont = pc('pano-montagnes.png', 0.52, 0.72);
bande(ciel, mont, 0.18 * L - mont.w * 2, 1.04 * L, H * 0.5 - mont.h);

/* le volcan : pose une fois, il ne se repete jamais */
const volcan = pc('pano-volcan.png', 0.55, 0.78);
fondre(ciel, volcan, 0.03 * L, H * 0.51 - volcan.h);

const boisSrc = P.decode(A('pano-foret.png'));
const bois = teinte(P.resize(boisSrc, Math.round(boisSrc.w * 112 / boisSrc.h), 112), 0.4, 0.55);
bande(ciel, bois, -0.06 * L, 1.06 * L, H * 0.54 - bois.h);

const casc = pc('pano-cascade.png', 0.5, 0.7);
fondre(ciel, casc, 0.01 * L, H * 0.59 - casc.h);

const coll = pc('pano-collines.png', 0.5, 0.7);
fondre(ciel, coll, L - 0.01 * L - coll.w, H * 0.59 - coll.h);

const ile = pc('pano-ile.png', 0.6, 0.75);
fondre(ciel, ile, L - 0.12 * L - ile.w, H * 0.07);

const n1 = pc('pano-nuage-1.png', 0.6, 0.5);
const n2 = pc('pano-nuage-2.png', 0.6, 0.5);
const n3 = pc('pano-nuage-3.png', 0.6, 0.5);
fondre(ciel, n1, L * 0.20, H * 0.09);
fondre(ciel, n2, L * 0.55, H * 0.17);
fondre(ciel, n3, L * 0.78, H * 0.05);

/* --- la place que prend le plateau : un trapeze, pour juger du vide --- */
for (let y = Math.round(H * 0.38); y < H; y++) {
  const t = (y - H * 0.38) / (H * 0.62);
  const demi = (0.16 + 0.30 * t) * L;
  for (let x = Math.round(L / 2 - demi); x < L / 2 + demi; x++) {
    if (x < 0 || x >= L) continue;
    const o = (y * L + x) * 4;
    ciel.px[o]     = Math.round(ciel.px[o] * 0.35 + 24 * 0.65);
    ciel.px[o + 1] = Math.round(ciel.px[o + 1] * 0.35 + 46 * 0.65);
    ciel.px[o + 2] = Math.round(ciel.px[o + 2] * 0.35 + 30 * 0.65);
  }
}

/* --- les cotes, par-dessus --- */
const largeurCote = Math.max(300, Math.min(520, 0.30 * L));
const cote = nom => {
  const im = P.decode(A(nom));
  return teinte(P.resize(im, Math.round(largeurCote), Math.round(im.h * largeurCote / im.w)), 0.46, 0.8);
};
const cg = cote('pano-falaise-1.png');
const cd = cote('pano-falaise-2.png');
/* background-size:100% 100% dans le css : la falaise est etiree, pas
   contenue — elle doit remplir la largeur du cote */

const ep = pc('pano-eperon.png', 0.4, 0.7);
fondre(ciel, ep, 0.06 * L, H * 0.78 - ep.h);
fondre(ciel, P.miroir(ep), L - 0.07 * L - ep.w, H * 0.78 - ep.h);

fondre(ciel, cg, -70, H + 140 - cg.h);
fondre(ciel, cd, L + 90 - cd.w, H + 140 - cd.h);

const cheneSrc = P.decode(A('pano-chene.png'));
const chene = teinte(P.resize(cheneSrc, 198, 312), 0.34, 0.7);
fondre(ciel, chene, 0.02 * L, H + 30 - chene.h);
const grotte = pc('pano-grotte.png', 0.4, 0.75);
fondre(ciel, grotte, L - 0.03 * L - grotte.w, H - 16 - grotte.h);

/* --- la vignette, qui recolle tout --- */
for (let y = 0; y < H; y++) {
  for (let x = 0; x < L; x++) {
    const dx = (x - L / 2) / (L * 0.6), dy = (y - H * 0.45) / (H * 0.45);
    const d = Math.sqrt(dx * dx + dy * dy);
    const v = Math.max(0, Math.min(0.72, (d - 0.4) * 0.9));
    const o = (y * L + x) * 4;
    ciel.px[o]     = Math.round(ciel.px[o] * (1 - v) + 5 * v);
    ciel.px[o + 1] = Math.round(ciel.px[o + 1] * (1 - v) + 0 * v);
    ciel.px[o + 2] = Math.round(ciel.px[o + 2] * (1 - v) + 15 * v);
  }
}

const r = P.encodeIndexed(ciel, SORTIE, 200);
console.log('maquette ' + L + 'x' + H + ' -> ' + SORTIE + '  ' + (r.poids / 1024).toFixed(0) + ' Ko');
