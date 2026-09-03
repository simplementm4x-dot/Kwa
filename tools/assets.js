/* =========================================================
   Fabrique les images du jeu a partir des planches de src/.

   Les planches font 3 Mo chacune : on ne les sert pas telles
   quelles. On decoupe, on reduit, et on surveille le poids —
   c est un jeu qui se charge sur un telephone en 4G.

   node tools/assets.js
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const P = require('./png.js');

const SORTIE = path.resolve(__dirname, '..', 'assets');
if (!fs.existsSync(SORTIE)) fs.mkdirSync(SORTIE);

let total = 0;

/* Ces planches sont des illustrations a plat : 128 teintes les rendent
   sans difference visible et divisent le poids par quatre ou cinq.
   Sur un jeu qu on ouvre en 4G, ca compte plus que le dernier pixel. */
function sors(img, nom, couleurs) {
  const f = path.join(SORTIE, nom);
  const r = P.encodeIndexed(img, f, couleurs || 128);
  total += r.poids;
  console.log('  ' + nom.padEnd(22) + (img.w + 'x' + img.h).padEnd(10) +
              r.couleurs + ' couleurs  ' + (r.poids / 1024).toFixed(1) + ' Ko');
  return r.poids;
}

/**
 * Les petits decors de la planche baignent dans un lavis clair a demi
 * transparent. Le supprimer d un seuil sec laisserait des bords en
 * escalier : on retire le lavis ET on reetale l alpha restant, ce qui
 * garde des contours nets sans rectangle fantome autour du sprite.
 */
function nettoieHalo(img, seuil) {
  const s = seuil || 22;
  for (let i = 3; i < img.px.length; i += 4) {
    const a = img.px[i];
    img.px[i] = a <= s ? 0 : Math.min(255, Math.round((a - s) * 255 / (255 - s)));
  }
  return img;
}

/** recadre au plus juste sur les pixels visibles */
function serre(img) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (img.px[(y * img.w + x) * 4 + 3] === 0) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return img;
  return P.crop(img, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
}

/** met l image a une hauteur donnee, largeur proportionnelle */
const hauteur = (img, h) => P.resize(img, Math.max(1, Math.round(img.w * h / img.h)), h);

/* =========================================================
   1. Le sol et le carton
   ========================================================= */
console.log('sol et bordures :');
const sol = P.decode('src/sol_bordure.png');

/* L herbe doit se repeter sans couture sur tout le plateau. Plutot
   que de raccorder les bords a la main, on prend un quart de tuile et
   on le retourne en miroir : le raccord devient exact par
   construction, et sur un feuillage organique la symetrie ne saute
   pas aux yeux. */
sors(P.miroir(P.resize(P.crop(sol, 40, 40, 690, 690), 128, 128)), 'herbe.png');

/* le carton des bordures, en bande verticale repetable */
sors(P.resize(P.crop(sol, 840, 130, 660, 600), 220, 200), 'carton.png', 96);

/* Le bord ondule horizontal et le feston d herbe sont prets mais ne sont
   pas encore poses : on ne les sort pas, un fichier non utilise reste un
   fichier telecharge. Les remettre est une ligne.
   sors(P.resize(P.crop(sol, 1240, 18, 290, 68), 232, 54), 'carton-ondule.png', 96);
   sors(nettoieHalo(P.resize(P.crop(sol, 8, 786, 752, 96), 376, 48), 60), 'feston.png');
*/

/* la tranche du carton, vue de cote : elle borde la feuille d herbe */
sors(P.resize(P.crop(sol, 1468, 776, 62, 244), 31, 122), 'carton-tranche.png', 64);

/* Touffes et trefles : on les detoure en cherchant les paquets de
   pixels relies entre eux, plutot qu avec des cadres poses a la main —
   ceux-ci coupaient invariablement le bas des brins. Les morceaux sont
   tries par surface, ce qui rend le choix reproductible. */
const zoneHerbes = P.crop(sol, 780, 770, 470, 254);
const morceaux = P.composantes(zoneHerbes, 60, 1000)
  .filter(m => m.w > 30 && m.h > 30)      /* ecarte la tranche du carton, tout en hauteur */
  .sort((a, b) => b.aire - a.aire);

const petit = (i, nom, h, couleurs) => sors(
  nettoieHalo(hauteur(P.crop(zoneHerbes, morceaux[i].x, morceaux[i].y, morceaux[i].w, morceaux[i].h), h)),
  nom, couleurs);

petit(0, 'touffe-1.png', 84);
petit(3, 'touffe-2.png', 80);
petit(5, 'touffe-3.png', 70);
petit(1, 'trefle.png', 58, 64);

/* =========================================================
   2. Les arbres
   ========================================================= */
console.log('arbres :');
const planche = P.decode('src/lot_arbre.png');

/* Trois arbres suffisent : ils sont retournes et redimensionnes au
   hasard sur le plateau, ce qui donne largement de quoi peupler une
   foret sans multiplier les fichiers a telecharger. */
const ARBRES = [
  ['arbre-chene.png',   24, 16,  629, 645, 260],
  ['arbre-bouleau.png', 699, 128, 446, 524, 250],
  ['sapin.png',        1164, 87,  352, 561, 262],
  ['arbre-pommier.png', 1151, 655, 301, 351, 190],
  ['buisson.png',       861, 747, 181, 248, 120]
];
for (const [nom, x, y, w, h, ht] of ARBRES) {
  sors(nettoieHalo(hauteur(serre(P.crop(planche, x, y, w, h)), ht)), nom);
}

console.log('\ntotal : ' + (total / 1024).toFixed(1) + ' Ko');
