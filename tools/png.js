/* =========================================================
   Un PNG minimal en Node, pour decouper les planches de src/.

   Aucun outil d image n est installe sur la machine (ni
   ImageMagick, ni Python utilisable), et le jeu n a aucune
   dependance : plutot que d en ajouter une, on lit et on
   ecrit le PNG a la main. zlib fait le gros du travail.
   ========================================================= */
'use strict';
const fs = require('fs');
const zlib = require('zlib');

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/* ---------------------------------------------------------
   Lecture
   --------------------------------------------------------- */
function decode(file) {
  const b = fs.readFileSync(file);
  if (!b.slice(0, 8).equals(SIG)) throw new Error(file + ' : ce n est pas un PNG');

  let pos = 8, w = 0, h = 0, prof = 0, type = 0;
  let plte = null, trns = null;
  const morceaux = [];
  while (pos < b.length) {
    const len = b.readUInt32BE(pos);
    const nom = b.toString('ascii', pos + 4, pos + 8);
    const data = b.slice(pos + 8, pos + 8 + len);
    if (nom === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      prof = data[8]; type = data[9];
      if (prof !== 8) throw new Error('profondeur ' + prof + ' non geree');
      if (type !== 2 && type !== 6 && type !== 3) throw new Error('type de couleur ' + type + ' non gere');
      if (data[12] !== 0) throw new Error('image entrelacee non geree');
    } else if (nom === 'PLTE') plte = data;
    else if (nom === 'tRNS') trns = data;
    else if (nom === 'IDAT') morceaux.push(data);
    else if (nom === 'IEND') break;
    pos += 12 + len;
  }

  const canaux = type === 6 ? 4 : (type === 3 ? 1 : 3);
  const brut = zlib.inflateSync(Buffer.concat(morceaux));
  const ligne = w * canaux;
  const px = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(ligne);

  for (let y = 0; y < h; y++) {
    const filtre = brut[y * (ligne + 1)];
    const src = brut.slice(y * (ligne + 1) + 1, (y + 1) * (ligne + 1));
    const cur = Buffer.alloc(ligne);
    for (let i = 0; i < ligne; i++) {
      const a = i >= canaux ? cur[i - canaux] : 0;
      const hb = prev[i];
      const c = i >= canaux ? prev[i - canaux] : 0;
      let v = src[i];
      switch (filtre) {
        case 1: v += a; break;
        case 2: v += hb; break;
        case 3: v += (a + hb) >> 1; break;
        case 4: {
          const p = a + hb - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - hb), pc = Math.abs(p - c);
          v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? hb : c);
          break;
        }
      }
      cur[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const s = x * canaux, d = (y * w + x) * 4;
      if (type === 3) {
        const k = cur[s];
        px[d] = plte[k * 3]; px[d + 1] = plte[k * 3 + 1]; px[d + 2] = plte[k * 3 + 2];
        px[d + 3] = trns && k < trns.length ? trns[k] : 255;
      } else {
        px[d] = cur[s]; px[d + 1] = cur[s + 1]; px[d + 2] = cur[s + 2];
        px[d + 3] = canaux === 4 ? cur[s + 3] : 255;
      }
    }
    prev = cur;
  }
  return { w, h, px };
}

/* ---------------------------------------------------------
   Ecriture
   --------------------------------------------------------- */
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(nom, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const corps = Buffer.concat([Buffer.from(nom, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corps));
  return Buffer.concat([len, corps, crc]);
}

/**
 * On essaie les cinq filtres sur chaque ligne et on garde celui dont
 * la somme des ecarts est la plus faible : c est l heuristique de la
 * specification, et elle divise le poids par deux sur ces textures.
 */
function filtrer(px, w, h, canaux) {
  const ligne = w * canaux;
  const out = Buffer.alloc(h * (ligne + 1));
  const brut = Buffer.alloc(ligne);
  let prev = Buffer.alloc(ligne);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4, d = x * canaux;
      brut[d] = px[s]; brut[d + 1] = px[s + 1]; brut[d + 2] = px[s + 2];
      if (canaux === 4) brut[d + 3] = px[s + 3];
    }
    let meilleur = null, meilleurScore = Infinity, meilleurType = 0;
    for (let f = 0; f <= 4; f++) {
      const essai = Buffer.alloc(ligne);
      let score = 0;
      for (let i = 0; i < ligne; i++) {
        const a = i >= canaux ? brut[i - canaux] : 0;
        const hb = prev[i];
        const c = i >= canaux ? prev[i - canaux] : 0;
        let v;
        switch (f) {
          case 0: v = brut[i]; break;
          case 1: v = brut[i] - a; break;
          case 2: v = brut[i] - hb; break;
          case 3: v = brut[i] - ((a + hb) >> 1); break;
          default: {
            const p = a + hb - c;
            const pa = Math.abs(p - a), pb = Math.abs(p - hb), pc = Math.abs(p - c);
            v = brut[i] - ((pa <= pb && pa <= pc) ? a : (pb <= pc ? hb : c));
          }
        }
        essai[i] = v & 255;
        score += essai[i] < 128 ? essai[i] : 256 - essai[i];
      }
      if (score < meilleurScore) { meilleurScore = score; meilleur = essai; meilleurType = f; }
    }
    out[y * (ligne + 1)] = meilleurType;
    meilleur.copy(out, y * (ligne + 1) + 1);
    prev = Buffer.from(brut);
  }
  return out;
}

/** opaque : on ecrit en RVB, ce qui enleve un quart du poids */
function opaque(px) {
  for (let i = 3; i < px.length; i += 4) if (px[i] !== 255) return false;
  return true;
}

function encode(img, file) {
  const canaux = opaque(img.px) ? 3 : 4;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.w, 0);
  ihdr.writeUInt32BE(img.h, 4);
  ihdr[8] = 8;
  ihdr[9] = canaux === 4 ? 6 : 2;
  const data = zlib.deflateSync(filtrer(img.px, img.w, img.h, canaux), { level: 9 });
  fs.writeFileSync(file, Buffer.concat([
    SIG, chunk('IHDR', ihdr), chunk('IDAT', data), chunk('IEND', Buffer.alloc(0))
  ]));
  return fs.statSync(file).size;
}

/* ---------------------------------------------------------
   Operations
   --------------------------------------------------------- */
function crop(img, x, y, w, h) {
  const px = Buffer.alloc(w * h * 4);
  for (let j = 0; j < h; j++) {
    const sy = Math.min(img.h - 1, y + j);
    for (let i = 0; i < w; i++) {
      const sx = Math.min(img.w - 1, x + i);
      img.px.copy(px, (j * w + i) * 4, (sy * img.w + sx) * 4, (sy * img.w + sx) * 4 + 4);
    }
  }
  return { w, h, px };
}

/** reduction par moyenne de bloc : propre pour descendre en taille */
function resize(img, w, h) {
  const px = Buffer.alloc(w * h * 4);
  const rx = img.w / w, ry = img.h / h;
  for (let j = 0; j < h; j++) {
    const y0 = Math.floor(j * ry), y1 = Math.max(y0 + 1, Math.floor((j + 1) * ry));
    for (let i = 0; i < w; i++) {
      const x0 = Math.floor(i * rx), x1 = Math.max(x0 + 1, Math.floor((i + 1) * rx));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let y = y0; y < y1 && y < img.h; y++) {
        for (let x = x0; x < x1 && x < img.w; x++) {
          const s = (y * img.w + x) * 4;
          const al = img.px[s + 3] / 255;
          r += img.px[s] * al; g += img.px[s + 1] * al; b += img.px[s + 2] * al;
          a += img.px[s + 3]; n++;
        }
      }
      const d = (j * w + i) * 4;
      const am = a / n;                       /* alpha moyen du bloc */
      const k = am > 0 ? 255 / am : 0;        /* on retire la premultiplication */
      px[d]     = Math.min(255, Math.round((r / n) * k));
      px[d + 1] = Math.min(255, Math.round((g / n) * k));
      px[d + 2] = Math.min(255, Math.round((b / n) * k));
      px[d + 3] = Math.round(am);
    }
  }
  return { w, h, px };
}

/** une tuile 2x2 en miroir : sans couture, quelle que soit la texture */
function miroir(img) {
  const w = img.w * 2, h = img.h * 2;
  const px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const sy = y < img.h ? y : (img.h * 2 - 1 - y);
    for (let x = 0; x < w; x++) {
      const sx = x < img.w ? x : (img.w * 2 - 1 - x);
      img.px.copy(px, (y * w + x) * 4, (sy * img.w + sx) * 4, (sy * img.w + sx) * 4 + 4);
    }
  }
  return { w, h, px };
}

/** colle une image dans une autre (les zones transparentes recouvrent) */
function coller(dest, src, x, y) {
  for (let j = 0; j < src.h; j++) {
    const dy = y + j;
    if (dy < 0 || dy >= dest.h) continue;
    for (let i = 0; i < src.w; i++) {
      const dx = x + i;
      if (dx < 0 || dx >= dest.w) continue;
      src.px.copy(dest.px, (dy * dest.w + dx) * 4, (j * src.w + i) * 4, (j * src.w + i) * 4 + 4);
    }
  }
  return dest;
}

/** une image vide, opaque et sombre pour voir les bords des decoupes */
function vide(w, h, r, g, b, a) {
  const px = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    px[i * 4] = r || 0; px[i * 4 + 1] = g || 0; px[i * 4 + 2] = b || 0;
    px[i * 4 + 3] = a === undefined ? 255 : a;
  }
  return { w, h, px };
}

/* ---------------------------------------------------------
   Palette
   Ces planches sont des illustrations : quelques dizaines de
   teintes suffisent a les rendre. Un PNG indexe divise le
   poids par trois ou quatre sans difference visible, ce qui
   compte quand le jeu s ouvre sur un telephone en 4G.
   --------------------------------------------------------- */
function histogramme(px) {
  const h = new Map();
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    /* tout ce qui est invisible se confond en une seule entree */
    const cle = a === 0 ? 0 : ((px[i] << 24) | (px[i + 1] << 16) | (px[i + 2] << 8) | a) >>> 0;
    h.set(cle, (h.get(cle) || 0) + 1);
  }
  return [...h.entries()].map(([cle, n]) => ({
    r: (cle >>> 24) & 255, g: (cle >>> 16) & 255, b: (cle >>> 8) & 255, a: cle & 255, n
  }));
}

/** decoupage median : on coupe toujours la boite la plus etalee */
function medianCut(couleurs, max) {
  let boites = [couleurs];
  const etendue = b => {
    let e = 0, canal = 'r';
    for (const c of ['r', 'g', 'b', 'a']) {
      let mn = 255, mx = 0;
      for (const x of b) { if (x[c] < mn) mn = x[c]; if (x[c] > mx) mx = x[c]; }
      const d = (mx - mn) * (c === 'a' ? 1.6 : 1);   /* l alpha se voit plus */
      if (d > e) { e = d; canal = c; }
    }
    return { e, canal };
  };
  while (boites.length < max) {
    let idx = -1, best = 0, canal = 'r';
    boites.forEach((b, i) => {
      if (b.length < 2) return;
      const { e, canal: c } = etendue(b);
      const poids = e * Math.log(1 + b.reduce((s, x) => s + x.n, 0));
      if (poids > best) { best = poids; idx = i; canal = c; }
    });
    if (idx < 0) break;
    const b = boites[idx].slice().sort((x, y) => x[canal] - y[canal]);
    const total = b.reduce((s, x) => s + x.n, 0);
    let acc = 0, coupe = 1;
    for (let i = 0; i < b.length - 1; i++) { acc += b[i].n; if (acc >= total / 2) { coupe = i + 1; break; } }
    boites.splice(idx, 1, b.slice(0, coupe), b.slice(coupe));
  }
  return boites.filter(b => b.length).map(b => {
    let r = 0, g = 0, bl = 0, a = 0, n = 0;
    for (const x of b) { r += x.r * x.n; g += x.g * x.n; bl += x.b * x.n; a += x.a * x.n; n += x.n; }
    return [Math.round(r / n), Math.round(g / n), Math.round(bl / n), Math.round(a / n)];
  });
}

function encodeIndexed(img, file, maxCouleurs) {
  const couleurs = histogramme(img.px);
  const palette = medianCut(couleurs, Math.min(256, maxCouleurs || 256));
  /* l entree totalement invisible doit exister telle quelle */
  if (couleurs.some(c => c.a === 0) && !palette.some(p => p[3] === 0)) palette[palette.length - 1] = [0, 0, 0, 0];

  const cache = new Map();
  const idx = Buffer.alloc(img.w * img.h);
  for (let i = 0, p = 0; i < img.px.length; i += 4, p++) {
    const a = img.px[i + 3];
    const cle = a === 0 ? 0 : ((img.px[i] << 24) | (img.px[i + 1] << 16) | (img.px[i + 2] << 8) | a) >>> 0;
    let k = cache.get(cle);
    if (k === undefined) {
      let best = 0, bd = Infinity;
      for (let j = 0; j < palette.length; j++) {
        const dr = img.px[i] - palette[j][0], dg = img.px[i + 1] - palette[j][1];
        const db = img.px[i + 2] - palette[j][2], da = a - palette[j][3];
        const d = a === 0 ? da * da * 8 : dr * dr + dg * dg + db * db + da * da * 3;
        if (d < bd) { bd = d; best = j; }
      }
      k = best;
      cache.set(cle, k);
    }
    idx[p] = k;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.w, 0);
  ihdr.writeUInt32BE(img.h, 4);
  ihdr[8] = 8; ihdr[9] = 3;
  const plte = Buffer.alloc(palette.length * 3);
  palette.forEach((p, i) => { plte[i * 3] = p[0]; plte[i * 3 + 1] = p[1]; plte[i * 3 + 2] = p[2]; });

  /* on n ecrit tRNS que si des entrees sont translucides */
  let dernier = -1;
  palette.forEach((p, i) => { if (p[3] < 255) dernier = i; });
  const morceaux = [SIG, chunk('IHDR', ihdr), chunk('PLTE', plte)];
  if (dernier >= 0) {
    const trns = Buffer.alloc(dernier + 1);
    for (let i = 0; i <= dernier; i++) trns[i] = palette[i][3];
    morceaux.push(chunk('tRNS', trns));
  }

  /* les images indexees se filtrent ligne par ligne comme les autres */
  const brut = Buffer.alloc(img.h * (img.w + 1));
  for (let y = 0; y < img.h; y++) idx.copy(brut, y * (img.w + 1) + 1, y * img.w, (y + 1) * img.w);
  morceaux.push(chunk('IDAT', zlib.deflateSync(brut, { level: 9 })));
  morceaux.push(chunk('IEND', Buffer.alloc(0)));
  fs.writeFileSync(file, Buffer.concat(morceaux));
  return { poids: fs.statSync(file).size, couleurs: palette.length };
}

/**
 * Repere les elements detaches d une planche : chaque paquet de pixels
 * opaques relies entre eux devient un cadre. C est plus sur que des
 * coordonnees a la main, qui coupent toujours un bout de feuille.
 */
function composantes(img, seuil, minAire) {
  seuil = seuil || 70;
  minAire = minAire || 800;
  const vu = new Uint8Array(img.w * img.h);
  const pile = new Int32Array(img.w * img.h);
  const boites = [];
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const dep = y * img.w + x;
      if (vu[dep] || img.px[dep * 4 + 3] < seuil) continue;
      let n = 0, aire = 0, x0 = x, x1 = x, y0 = y, y1 = y;
      pile[n++] = dep; vu[dep] = 1;
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
          if (vu[q] || img.px[q * 4 + 3] < seuil) continue;
          vu[q] = 1; pile[n++] = q;
        }
      }
      if (aire >= minAire) boites.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, aire });
    }
  }
  return boites;
}

module.exports = { decode, encode, encodeIndexed, crop, resize, miroir, coller, vide, composantes };
