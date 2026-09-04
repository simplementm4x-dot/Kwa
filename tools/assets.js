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
   2. Le cadre des cases

   Les six cases de la planche portent chacune une icone qui
   couvre presque tout l interieur : impossible de l effacer
   proprement. On ne garde donc que le cadre de carton, et
   c est le CSS qui pose le papier a la couleur du type de
   case — un seul fichier habille les treize.
   ========================================================= */
console.log('cases :');
const casesPl = P.decode('src/cases.png');

/** evide l interieur d une case, avec un fondu de quelques pixels */
function evide(src, marge, fondu) {
  const o = { w: src.w, h: src.h, px: Buffer.from(src.px) };
  const mx = Math.round(src.w * marge), my = Math.round(src.h * marge);
  for (let y = 0; y < o.h; y++) {
    for (let x = 0; x < o.w; x++) {
      const dx = Math.max(mx - x, x - (o.w - 1 - mx), 0);
      const dy = Math.max(my - y, y - (o.h - 1 - my), 0);
      const dist = (dx > 0 && dy > 0) ? Math.hypot(dx, dy) : Math.max(dx, dy);
      const a = dist <= 0 ? 0 : Math.min(1, dist / fondu);
      const i = (y * o.w + x) * 4;
      o.px[i + 3] = Math.round(o.px[i + 3] * a);
    }
  }
  return o;
}

sors(P.resize(evide(P.crop(casesPl, 43, 49, 453, 427), 0.035, 4), 144, 136), 'case-cadre.png', 96);

/* Quatre des six cases de la planche portent une icone qui correspond
   exactement a une epreuve du jeu : le point d interrogation pour le
   quiz, les masques pour Verite ou Mensonge, les fleches croisees pour
   l Echange, la piece pour le Peage. On les sort entieres, cadre et
   papier compris — c est plus beau que du papier colore et un emoji.
   Les deux autres servent a la Roue et au Duel. */
const CASES_ENTIERES = [
  ['case-quiz.png',    43, 49, 453, 427],
  ['case-roue.png',   550, 50, 435, 426],
  ['case-duel.png',  1037, 47, 453, 429],
  ['case-verite.png',  44, 512, 453, 435],
  ['case-echange.png', 550, 512, 439, 434],
  ['case-peage.png', 1037, 512, 454, 435]
];
for (const [nom, x, y, w, h] of CASES_ENTIERES) {
  sors(P.resize(P.crop(casesPl, x, y, w, h), 152, 144), nom, 128);
}

/* La planche cases2 arrive sur fond noir opaque. Un simple seuil sur la
   luminance mangerait les contours, qui sont eux aussi tres sombres :
   on remplit donc depuis les bords, ce qui n atteint que le fond. */
function detourFond(img, seuil) {
  seuil = seuil || 42;
  const vu = new Uint8Array(img.w * img.h);
  const pile = new Int32Array(img.w * img.h);
  let n = 0;
  const sombre = p => {
    const s = p * 4;
    return (img.px[s] + img.px[s + 1] + img.px[s + 2]) / 3 <= seuil;
  };
  const pousse = p => { if (!vu[p] && sombre(p)) { vu[p] = 1; pile[n++] = p; } };
  for (let x = 0; x < img.w; x++) { pousse(x); pousse((img.h - 1) * img.w + x); }
  for (let y = 0; y < img.h; y++) { pousse(y * img.w); pousse(y * img.w + img.w - 1); }
  while (n) {
    const p = pile[--n];
    const x = p % img.w, y = (p / img.w) | 0;
    img.px[p * 4 + 3] = 0;
    if (x > 0) pousse(p - 1);
    if (x < img.w - 1) pousse(p + 1);
    if (y > 0) pousse(p - img.w);
    if (y < img.h - 1) pousse(p + img.w);
  }
  return img;
}

console.log('nouvelles cases :');
const cases2 = detourFond(P.decode('src/cases2.png'), 46);

/* Les quatre cases se touchent par leurs ombres : la recherche de
   paquets relies ne trouve que deux colonnes. On decoupe donc par
   cadres, puis on resserre chaque morceau sur ses pixels visibles. */
const NOUVELLES = [
  ['case-djmix.png',   111, 21, 604, 544],
  ['case-shifumi.png', 730, 21, 605, 544],
  ['case-echelle.png', 111, 578, 604, 493],
  ['case-aveugle.png', 730, 578, 605, 493]
];
for (const [nom, x, y, w, h] of NOUVELLES) {
  sors(P.resize(serre(P.crop(cases2, x, y, w, h)), 152, 144), nom, 128);
}

/* =========================================================
   3. L esprit de la foret

   Trois planches de 8 par 2 frames. On n en garde qu une
   rangee : huit images suffisent a une boucle, et le poids
   compte plus que la fluidite pour un sprite de 90 pixels.

   Toutes les frames sont recadrees sur la MEME boite —
   l union du contenu de la rangee — et non chacune au plus
   juste : recadrer image par image ferait sautiller le
   personnage a chaque changement de frame.
   ========================================================= */
console.log('esprit de la foret :');

/**
 * Une bande d animation, decoupee cellule par cellule.
 *
 * La cellule EST le cadre : on ne recadre pas sur le contenu, sinon le
 * personnage sautille d une frame a l autre. Et toutes les planches
 * dessinent l esprit dans une cellule d environ 220 pixels : ramener
 * chaque cellule a la meme largeur donne donc la meme echelle partout,
 * quelle que soit la taille de la planche.
 */
function bande(fichier, y0, y1, colonnes, largeurCellule, nom) {
  const pl = nettoieHalo(P.decode(fichier), 60);
  const cw = pl.w / colonnes;
  const ech = largeurCellule / cw;
  const fh = Math.round((y1 - y0 + 1) * ech);

  const strip = P.vide(largeurCellule * colonnes, fh, 0, 0, 0, 0);
  for (let i = 0; i < colonnes; i++) {
    const cell = P.crop(pl, Math.round(i * cw), y0, Math.round(cw), y1 - y0 + 1);
    P.coller(strip, P.resize(cell, largeurCellule, fh), i * largeurCellule, 0);
  }
  const poids = sors(strip, nom, 128);
  console.log('    ' + colonnes + ' frames de ' + largeurCellule + 'x' + fh);
  return { n: colonnes, w: largeurCellule, h: fh, poids };
}

const CELLULE = 100;
const ESPRIT = {
  idle: bande('src/soul_idle.png', 97, 390, 8, CELLULE, 'esprit-idle.png'),
  walk: bande('src/soul_walk.png', 172, 428, 7, CELLULE, 'esprit-walk.png'),
  atk:  bande('src/soul_atk.png', 34, 478, 8, CELLULE, 'esprit-atk.png')
};
console.log('  a reporter dans le CSS :');
for (const k of Object.keys(ESPRIT)) {
  const e = ESPRIT[k];
  console.log('    .esprit.' + k + ' -> ' + e.w + 'x' + e.h + ', ' + e.n + ' frames, bande ' + (e.w * e.n) + 'px');
}

/* =========================================================
   4. La route

   Le chemin etait trace a coups de traits epais. Il devient un
   platelage de planches, applique en motif sur le trace SVG.
   La planche d origine ne se raccorde pas d elle-meme : on la
   retourne en miroir, comme l herbe, pour que la repetition ne
   laisse aucune couture.
   ========================================================= */
console.log('route :');
const route = P.decode('src/road.png');
sors(P.miroir(P.resize(P.crop(route, 80, 80, 1094, 1094), 96, 96)), 'route.png', 128);

/* =========================================================
   5. Les arbres
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

/* =========================================================
   6. Plantes, rochers, souches et champignons

   Deux planches de plus, detourees de la meme facon : on
   cherche les paquets de pixels relies entre eux, on trie par
   surface et on prend les plus gros. Les indices sont donc
   stables tant que les planches ne changent pas.
   ========================================================= */
function lot(fichier, prefixe, combien, hauteurs, couleurs) {
  const pl = P.decode(fichier);
  const morceaux = P.composantes(pl, 60, 2500)
    .filter(m => m.w > 40 && m.h > 40)
    .sort((a, b) => b.aire - a.aire)
    .slice(0, combien);
  morceaux.forEach((m, i) => {
    const h = hauteurs[i % hauteurs.length];
    sors(nettoieHalo(hauteur(P.crop(pl, m.x, m.y, m.w, m.h), h)), prefixe + '-' + (i + 1) + '.png', couleurs);
  });
  return morceaux.length;
}

console.log('plantes :');
lot('src/lot_plant.png', 'plante', 10, [92, 86, 80, 74, 96], 96);

console.log('decors :');
lot('src/lot_decors.png', 'decor', 12, [86, 78, 72, 66, 92], 96);

/* =========================================================
   7. Le decor lointain, reserve aux grands ecrans

   Sur un telephone, l ecran est rempli par le chemin : il n y
   a pas de place pour un arriere-plan, et charger des images
   qui ne se verront pas coute de la batterie et du forfait.

   Sur un ecran d ordinateur, le plateau tient au milieu et il
   reste deux tiers de vide de chaque cote. Ces morceaux-la
   remplissent ce vide : une chaine de montagnes a l horizon,
   des falaises qui encadrent le chemin, des bosquets et des
   nuages. Le CSS ne les demande qu au-dela d une certaine
   largeur — un navigateur ne telecharge pas une image de fond
   dont la regle ne s applique pas, donc un telephone ne les
   voit jamais passer.

   Les morceaux sont pris par leur boite : les indices viennent
   de l analyse des paquets de pixels relies, ils sont stables
   tant que les planches ne bougent pas.
   ========================================================= */
console.log('decor lointain (grands ecrans) :');

/** un morceau d une planche, pris a la boite, ramene a une hauteur */
function morceau(pl, x, y, w, h, haut, nom, couleurs) {
  return sors(nettoieHalo(hauteur(P.crop(pl, x, y, w, h), haut), 50), nom, couleurs || 96);
}

const ext2 = P.decode('src/externe2.png');

/* la chaine de montagnes : volcan, sommets enneiges, collines et
   cascades ne font qu un seul tenant sur la planche. Tant mieux —
   c est exactement le bandeau d horizon qu on cherche. On s arrete
   avant le soleil, qui n a rien a faire dans une foret de nuit. */
/* le volcan est un point de repere : repete, il trahit tout de suite le
   motif. On le sort de la chaine et on le pose une seule fois. */
morceau(ext2, 8, 20, 252, 290, 250, 'pano-volcan.png', 96);
morceau(ext2, 300, 8, 886, 396, 300, 'pano-montagnes.png', 128);

/* les bosquets de sapins, poses devant les montagnes */
morceau(ext2, 498, 413, 512, 213, 150, 'pano-foret.png', 96);
/* la falaise a cascade, et la colline rocheuse : deux blocs pleins */
morceau(ext2, 8, 335, 488, 353, 230, 'pano-cascade.png', 96);
morceau(ext2, 1014, 339, 517, 315, 210, 'pano-collines.png', 96);
/* l ile flottante : elle donne de la profondeur, tres haut dans le ciel */
morceau(ext2, 1290, 38, 233, 273, 150, 'pano-ile.png', 96);
/* trois nuages, qui derivent lentement */
morceau(ext2, 322, 15, 214, 122, 70, 'pano-nuage-1.png', 64);
morceau(ext2, 987, 24, 145, 74, 46, 'pano-nuage-2.png', 64);
morceau(ext2, 1120, 119, 106, 62, 38, 'pano-nuage-3.png', 64);
/* et deux gros elements de premier plan, pour habiller les cotes */
morceau(ext2, 1318, 652, 213, 336, 260, 'pano-chene.png', 96);
morceau(ext2, 1070, 664, 257, 200, 170, 'pano-grotte.png', 96);

/* les falaises viennent de l autre planche : ce sont des blocs de
   roche a sommet herbeux, faits pour etre poses cote a cote */
const ext1 = P.decode('src/externe1.png');
morceau(ext1, 14, 25, 255, 234, 300, 'pano-falaise-1.png', 96);
morceau(ext1, 557, 25, 329, 228, 300, 'pano-falaise-2.png', 96);
morceau(ext1, 1727, 19, 276, 247, 300, 'pano-falaise-3.png', 96);
/* et un eperon isole, pour casser la ligne */
morceau(ext1, 1416, 25, 94, 224, 260, 'pano-eperon.png', 96);

console.log('\ntotal : ' + (total / 1024).toFixed(1) + ' Ko');
