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
  /* ---------------------------------------------------------
     Decor decoupe dans du papier
     Les arbres et les buissons viennent des planches de src/,
     decoupees par tools/assets.js. Un arbre sur deux est
     retourne : quatre fichiers suffisent a peupler une foret
     sans que l oeil repere la repetition.
     --------------------------------------------------------- */
  const ARBRES = ['arbre-chene.png', 'arbre-bouleau.png', 'sapin.png', 'arbre-pommier.png'];
  const BUISSONS = ['buisson.png', 'plante-1.png', 'plante-3.png', 'plante-2.png', 'plante-6.png'];
  const ROCHERS = ['decor-4.png', 'decor-5.png', 'decor-6.png', 'decor-9.png', 'decor-10.png', 'decor-12.png'];
  const CHAMPIS = ['plante-5.png', 'plante-7.png', 'plante-8.png', 'decor-11.png'];
  const FLEURS = ['plante-10.png', 'plante-4.png', 'plante-9.png', 'touffe-1.png', 'touffe-2.png', 'touffe-3.png', 'trefle.png'];
  /* la foret n a plus de cristaux : a la place, des souches et des troncs */
  const BOIS = ['decor-2.png', 'decor-1.png', 'decor-7.png', 'decor-3.png', 'decor-8.png'];

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

  S.rockPapier = (variant, h) => papier(ROCHERS[variant % ROCHERS.length], h * 1.1, variant % 2 === 1);
  S.mushPapier = (variant, h) => papier(CHAMPIS[variant % CHAMPIS.length], h * 1.2, variant % 2 === 0);
  S.flowerPapier = (variant, h) => papier(FLEURS[variant % FLEURS.length], h * 1.2, variant % 3 === 2);
  S.boisPapier = (variant, h) => papier(BOIS[variant % BOIS.length], h * 1.1, variant % 2 === 1);

  /* Les arbres, buissons, rochers, champignons et fleurs etaient
     dessines en SVG. Ils viennent maintenant des planches papier :
     le code correspondant a ete retire plutot que garde en reserve,
     il n aurait fait que diverger du rendu reel. */

  S.propByKind = function (kind, variant, h) {
    switch (kind) {
      case 'tree': return S.tree(variant, h);
      case 'bush': return S.bush(variant, h);
      case 'mush': return S.mushPapier(variant, h);
      case 'crystal': return S.boisPapier(variant, h);
      case 'rock': return S.rockPapier(variant, h);
      default: return S.flowerPapier(variant, h);
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
