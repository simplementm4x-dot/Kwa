/* =========================================================
   KWA — sprites SVG (pions TV, animateur, decor foret)
   ========================================================= */
(function (K) {
  'use strict';
  const S = K.sprites = {};
  const esc = s => K.util.esc(s);
  let uid = 0;

  /* ---------------------------------------------------------
     Ecran de tele : image du joueur, sinon mire + initiale
     --------------------------------------------------------- */
  function screenContent(p, id, x, y, w, h) {
    if (p && p.img) {
      return '<image href="' + p.img + '" xlink:href="' + p.img + '" x="' + x + '" y="' + y +
             '" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid slice" ' +
             'clip-path="url(#sc' + id + ')" class="tvscreen-img"/>';
    }
    const initial = p && p.name ? p.name.trim().charAt(0).toUpperCase() : '?';
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#mire' + id + ')"/>' +
           '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + h * 0.19) + '" text-anchor="middle" ' +
           'font-family="Press Start 2P, monospace" font-size="' + (h * 0.5) + '" fill="#ffffff" ' +
           'opacity=".92" style="text-shadow:0 2px 0 #000">' + esc(initial) + '</text>';
  }

  function defs(id, hex) {
    return '<defs>' +
      '<clipPath id="sc' + id + '"><rect x="14" y="14" width="52" height="36" rx="4"/></clipPath>' +
      '<linearGradient id="mire' + id + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#20143a"/><stop offset="50%" stop-color="' + hex + '" stop-opacity=".55"/>' +
        '<stop offset="100%" stop-color="#0a0418"/></linearGradient>' +
      '<linearGradient id="cab' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#6d6a7d"/><stop offset="55%" stop-color="#46435a"/>' +
        '<stop offset="100%" stop-color="#2a2739"/></linearGradient>' +
      '</defs>';
  }

  /* ---------------------------------------------------------
     PION : television sur pattes en batons
     --------------------------------------------------------- */
  S.tvPawn = function (p, scale) {
    const id = 'p' + (++uid);
    const hex = p && p.hex ? p.hex : '#ff3fa4';
    const w = 80 * (scale || 1), h = 104 * (scale || 1);
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 80 104" xmlns="http://www.w3.org/2000/svg" ' +
      'xmlns:xlink="http://www.w3.org/1999/xlink">' + defs(id, hex) +
      /* jambes */
      '<g class="leg-l" style="transform-box:fill-box;transform-origin:50% 0%">' +
        '<rect x="25.5" y="54" width="4" height="34" rx="2" fill="#e9e4f5" stroke="#1a1030" stroke-width="1.6"/>' +
        '<ellipse cx="26" cy="90" rx="10" ry="5.5" fill="' + hex + '" stroke="#1a1030" stroke-width="2"/>' +
        '<ellipse cx="24" cy="88.4" rx="6" ry="2.4" fill="#ffffff" opacity=".35"/>' +
      '</g>' +
      '<g class="leg-r" style="transform-box:fill-box;transform-origin:50% 0%">' +
        '<rect x="50.5" y="54" width="4" height="34" rx="2" fill="#e9e4f5" stroke="#1a1030" stroke-width="1.6"/>' +
        '<ellipse cx="54" cy="90" rx="10" ry="5.5" fill="' + hex + '" stroke="#1a1030" stroke-width="2"/>' +
        '<ellipse cx="52" cy="88.4" rx="6" ry="2.4" fill="#ffffff" opacity=".35"/>' +
      '</g>' +
      /* antennes */
      '<g stroke="#1a1030" stroke-width="2.4" stroke-linecap="round">' +
        '<line x1="26" y1="12" x2="14" y2="1"/><line x1="54" y1="12" x2="66" y2="1"/>' +
      '</g>' +
      '<circle cx="13" cy="1.5" r="3.4" fill="' + hex + '" stroke="#1a1030" stroke-width="1.6"/>' +
      '<circle cx="67" cy="1.5" r="3.4" fill="' + hex + '" stroke="#1a1030" stroke-width="1.6"/>' +
      /* caisson */
      '<g class="tvbody">' +
        '<rect x="6" y="7" width="68" height="50" rx="9" fill="url(#cab' + id + ')" stroke="#1a1030" stroke-width="3"/>' +
        '<rect x="12" y="12" width="56" height="40" rx="6" fill="#07040f" stroke="' + hex + '" stroke-width="2"/>' +
        screenContent(p, id, 14, 14, 52, 36) +
        '<rect x="14" y="14" width="52" height="36" rx="4" fill="url(#glo' + id + ')" opacity=".0"/>' +
        /* reflets ecran */
        '<path d="M16 48 L30 14 L38 14 L22 48 Z" fill="#ffffff" opacity=".07"/>' +
        /* boutons */
        '<circle cx="70.5" cy="20" r="2.2" fill="#f5e6a8" opacity=".8"/>' +
        '<circle cx="70.5" cy="28" r="2.2" fill="#f5e6a8" opacity=".5"/>' +
        '<rect x="24" y="58" width="32" height="4" rx="2" fill="#2a2739" stroke="#1a1030" stroke-width="1.4"/>' +
      '</g>' +
      '</svg>';
  };

  /* ---------------------------------------------------------
     KWA : l animateur robot-TV
     --------------------------------------------------------- */
  S.kwa = function (scale, mood) {
    const s = scale || 1;
    const eye = mood === 'wink'
      ? '<path d="M30 44 q6 -6 12 0" stroke="#39e7ff" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<circle cx="64" cy="43" r="6" fill="#39e7ff"/><circle cx="66" cy="41" r="2" fill="#fff"/>'
      /* "what" : les yeux se dilatent, l ecran vire au blanc autour */
      : mood === 'what'
      ? '<circle cx="36" cy="43" r="9.5" fill="#fff"/><circle cx="36" cy="43" r="5" fill="#39e7ff"/>' +
        '<circle cx="64" cy="43" r="9.5" fill="#fff"/><circle cx="64" cy="43" r="5" fill="#39e7ff"/>'
      : '<circle cx="36" cy="43" r="6.5" fill="#39e7ff"/><circle cx="38" cy="41" r="2.2" fill="#fff"/>' +
        '<circle cx="64" cy="43" r="6.5" fill="#39e7ff"/><circle cx="66" cy="41" r="2.2" fill="#fff"/>';
    const mouth = mood === 'what'
      ? '<ellipse cx="50" cy="63" rx="10" ry="11" fill="#ff3fa4" stroke="#0a0418" stroke-width="2.5"/>'
      : mood === 'oh'
      ? '<ellipse cx="50" cy="62" rx="8" ry="9" fill="#ff3fa4" stroke="#0a0418" stroke-width="2"/>'
      : '<path d="M36 58 q14 14 28 0" stroke="#ff3fa4" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    /* le point d exclamation qui jaillit a cote de la tete */
    const bang = mood === 'what'
      ? '<g class="kbang">' +
          '<rect x="1" y="0" width="10" height="19" rx="4.5" fill="#ffcf4d" stroke="#1a1030" stroke-width="2.5"/>' +
          '<circle cx="6" cy="26" r="5.2" fill="#ffcf4d" stroke="#1a1030" stroke-width="2.5"/>' +
        '</g>'
      : '';
    return '<svg width="' + (100 * s) + '" height="' + (118 * s) + '" viewBox="0 0 100 118" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="kcab" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#7d7a90"/><stop offset="55%" stop-color="#4e4b64"/>' +
        '<stop offset="100%" stop-color="#2b2840"/></linearGradient>' +
      '<radialGradient id="kglow" cx="50%" cy="50%"><stop offset="0%" stop-color="#39e7ff" stop-opacity=".35"/>' +
        '<stop offset="100%" stop-color="#39e7ff" stop-opacity="0"/></radialGradient></defs>' +
      /* antenne + boule */
      '<line x1="50" y1="14" x2="50" y2="2" stroke="#1a1030" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="50" cy="3" r="5" fill="#ffcf4d" stroke="#1a1030" stroke-width="2"/>' +
      /* bras micro */
      '<g stroke="#1a1030" stroke-width="3" stroke-linecap="round">' +
        '<line x1="12" y1="60" x2="1" y2="76"/><line x1="88" y1="60" x2="99" y2="48"/></g>' +
      '<rect x="94" y="38" width="9" height="14" rx="4.5" fill="#ff3fa4" stroke="#1a1030" stroke-width="2"/>' +
      /* corps */
      '<rect x="8" y="14" width="84" height="72" rx="12" fill="url(#kcab)" stroke="#1a1030" stroke-width="3.5"/>' +
      '<rect x="15" y="21" width="70" height="55" rx="8" fill="#07040f" stroke="#39e7ff" stroke-width="2.5"/>' +
      '<rect x="15" y="21" width="70" height="55" rx="8" fill="url(#kglow)"/>' +
      eye + mouth +
      '<path d="M18 74 L34 22 L42 22 L24 74 Z" fill="#ffffff" opacity=".06"/>' +
      /* pieds */
      '<rect x="30" y="86" width="5" height="20" rx="2.5" fill="#e9e4f5" stroke="#1a1030" stroke-width="1.8"/>' +
      '<rect x="65" y="86" width="5" height="20" rx="2.5" fill="#e9e4f5" stroke="#1a1030" stroke-width="1.8"/>' +
      '<ellipse cx="31" cy="108" rx="12" ry="6" fill="#ffcf4d" stroke="#1a1030" stroke-width="2.2"/>' +
      '<ellipse cx="69" cy="108" rx="12" ry="6" fill="#ffcf4d" stroke="#1a1030" stroke-width="2.2"/>' +
      bang +
      '</svg>';
  };

  /* ---------------------------------------------------------
     DECOR : arbres, buissons, champignons, rochers, cristaux
     --------------------------------------------------------- */
  const LEAF = [
    ['#2f7a4e', '#1f5636', '#153f28'],
    ['#3d8f5c', '#276b41', '#17492c'],
    ['#2b6f6a', '#1c4f4c', '#123734'],
    ['#4a7f3a', '#325c27', '#1e3d17'],
    ['#5a4b8a', '#3d3163', '#271f45']
  ];

  /* ---------------------------------------------------------
     Decor decoupe dans du papier
     Les arbres et les buissons viennent des planches de src/,
     decoupees par tools/assets.js. Un arbre sur deux est
     retourne : quatre fichiers suffisent a peupler une foret
     sans que l oeil repere la repetition.
     --------------------------------------------------------- */
  const ARBRES = ['arbre-chene.png', 'arbre-bouleau.png', 'sapin.png', 'arbre-pommier.png'];
  const BUISSONS = ['buisson.png', 'touffe-1.png', 'touffe-2.png', 'touffe-3.png', 'trefle.png'];

  function papier(fichier, h, retourne) {
    return '<img class="pc" src="assets/' + fichier + '" height="' + Math.round(h) + '"' +
      (retourne ? ' style="transform:scaleX(-1)"' : '') + ' alt="">';
  }

  S.tree = function (variant, h) {
    return papier(ARBRES[variant % ARBRES.length], h, variant % 2 === 1);
  };

  S.bush = function (variant, h) {
    return papier(BUISSONS[variant % BUISSONS.length], h * 1.15, variant % 3 === 1);
  };

  S.treeSvg = function (variant, h) {
    const c = LEAF[variant % LEAF.length];
    const W = Math.round(h * 0.72);
    const sc = h / 160;
    const blobs =
      '<ellipse cx="60" cy="66" rx="52" ry="34" fill="' + c[2] + '"/>' +
      '<ellipse cx="60" cy="52" rx="46" ry="30" fill="' + c[1] + '"/>' +
      '<ellipse cx="52" cy="40" rx="34" ry="24" fill="' + c[0] + '"/>' +
      '<ellipse cx="74" cy="44" rx="24" ry="17" fill="' + c[0] + '" opacity=".85"/>' +
      '<ellipse cx="46" cy="32" rx="16" ry="11" fill="#ffffff" opacity=".10"/>';
    return '<svg width="' + W + '" height="' + h + '" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" style="--sc:' + sc + '">' +
      '<path d="M52 158 L52 92 q0 -10 8 -10 q8 0 8 10 l0 66 z" fill="#3a2a1c" stroke="#1a1030" stroke-width="3"/>' +
      '<path d="M56 118 l-16 -14" stroke="#3a2a1c" stroke-width="6" stroke-linecap="round"/>' +
      '<g stroke="#1a1030" stroke-width="3.5">' + blobs + '</g>' +
      '</svg>';
  };

  S.bushSvg = function (variant, h) {
    const c = LEAF[(variant + 1) % LEAF.length];
    return '<svg width="' + Math.round(h * 1.5) + '" height="' + h + '" viewBox="0 0 90 60" xmlns="http://www.w3.org/2000/svg">' +
      '<g stroke="#1a1030" stroke-width="3">' +
      '<ellipse cx="45" cy="44" rx="42" ry="16" fill="' + c[2] + '"/>' +
      '<ellipse cx="30" cy="34" rx="22" ry="16" fill="' + c[1] + '"/>' +
      '<ellipse cx="58" cy="32" rx="24" ry="18" fill="' + c[0] + '"/>' +
      '</g><ellipse cx="52" cy="26" rx="9" ry="5" fill="#fff" opacity=".12"/></svg>';
  };

  S.mushroom = function (variant, h) {
    const caps = ['#e4484f', '#d86bd0', '#f0a83c', '#5fc9e8'];
    const cap = caps[variant % caps.length];
    return '<svg width="' + Math.round(h * 0.9) + '" height="' + h + '" viewBox="0 0 54 60" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="21" y="28" width="12" height="30" rx="5" fill="#f0e6d2" stroke="#1a1030" stroke-width="3"/>' +
      '<path d="M4 30 q23 -32 46 0 z" fill="' + cap + '" stroke="#1a1030" stroke-width="3"/>' +
      '<circle cx="18" cy="20" r="4" fill="#fff" opacity=".85"/><circle cx="34" cy="24" r="3" fill="#fff" opacity=".7"/>' +
      '</svg>';
  };

  S.crystal = function (variant, h) {
    const cols = ['#7ae7ff', '#c58bff', '#8affc0'];
    const c = cols[variant % cols.length];
    return '<svg width="' + Math.round(h * 0.6) + '" height="' + h + '" viewBox="0 0 40 66" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M20 2 L34 30 L26 62 L14 62 L6 30 Z" fill="' + c + '" opacity=".85" stroke="#1a1030" stroke-width="2.5"/>' +
      '<path d="M20 2 L26 62 L14 62 Z" fill="#fff" opacity=".25"/></svg>';
  };

  S.rock = function (variant, h) {
    return '<svg width="' + Math.round(h * 1.4) + '" height="' + h + '" viewBox="0 0 70 50" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M6 46 L14 18 L34 6 L58 20 L64 46 Z" fill="#5a5470" stroke="#1a1030" stroke-width="3"/>' +
      '<path d="M14 18 L34 6 L38 24 Z" fill="#7a7292"/></svg>';
  };

  S.flower = function (variant, h) {
    const cols = ['#ffd6f0', '#ffe9a8', '#c8e8ff'];
    const c = cols[variant % cols.length];
    return '<svg width="' + Math.round(h * 0.8) + '" height="' + h + '" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">' +
      '<line x1="16" y1="38" x2="16" y2="18" stroke="#2f7a4e" stroke-width="3"/>' +
      '<circle cx="16" cy="10" r="5" fill="' + c + '" stroke="#1a1030" stroke-width="2"/>' +
      '<circle cx="9" cy="15" r="4" fill="' + c + '" stroke="#1a1030" stroke-width="2"/>' +
      '<circle cx="23" cy="15" r="4" fill="' + c + '" stroke="#1a1030" stroke-width="2"/>' +
      '<circle cx="16" cy="14" r="2.6" fill="#ffcf4d"/></svg>';
  };

  S.propByKind = function (kind, variant, h) {
    switch (kind) {
      case 'tree': return S.tree(variant, h);
      case 'bush': return S.bush(variant, h);
      case 'mush': return S.mushroom(variant, h);
      case 'crystal': return S.crystal(variant, h);
      case 'rock': return S.rock(variant, h);
      default: return S.flower(variant, h);
    }
  };

  /* --- petite vignette carree (avatars listes) --- */
  S.avatar = function (p, size) {
    const s = size || 36;
    if (p && p.img) return '<img src="' + p.img + '" alt="">';
    return '<span style="font-family:var(--pix);font-size:' + Math.round(s * 0.38) + 'px;color:' + p.hex + '">' +
           esc((p.name || '?').charAt(0).toUpperCase()) + '</span>';
  };

})(window.KWA);
