/* =========================================================
   LA ROUE DE KWA

   Une case eclair : elle se resout en dix secondes. Ces cases
   ne sont pas la pour occuper la table mais pour la laisser
   respirer — entre deux epreuves de trois minutes, il faut des
   moments ou il ne se passe presque rien.

   L Echange et le Peage vivaient ici. Ils sont devenus des
   objets (le Vaisseau, le Rocher) : le meme effet, mais garde
   en poche et declenche au moment choisi. Voir js/objets.js.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  /* le registre des animations rejouees a l identique sur tous les ecrans */
  K.anim = K.anim || {};

  /* ---------------------------------------------------------
     LA ROUE DE KWA
     Un vrai disque : douze quartiers, une fleche en haut, et
     le disque ralentit jusqu a poser le bon quartier dessous.
     Comme c est l indice du quartier qui circule sur le reseau,
     tous les telephones voient la roue s arreter au meme endroit.
     --------------------------------------------------------- */
  const QUARTIERS = [3, -1, 5, -2, 2, 1, 4, -3, 2, -1, 1, 3];
  const PAS = 360 / QUARTIERS.length;

  function couleur(v) {
    if (v >= 4) return ['#ffcf4d', '#c99a1c'];
    if (v > 0) return ['#2f7a5a', '#1c4c38'];
    return ['#8a2f3d', '#571d26'];
  }

  /** le disque, dessine une fois pour toutes */
  function disque() {
    const r = 92;
    const pt = a => {
      const rad = (a - 90) * Math.PI / 180;
      return [(100 + r * Math.cos(rad)).toFixed(2), (100 + r * Math.sin(rad)).toFixed(2)];
    };
    let parts = '', chiffres = '';
    QUARTIERS.forEach((v, i) => {
      const [x0, y0] = pt(i * PAS);
      const [x1, y1] = pt((i + 1) * PAS);
      const [clair, sombre] = couleur(v);
      parts += '<path d="M100 100 L' + x0 + ' ' + y0 + ' A' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + y1 + ' Z" ' +
        'fill="' + (i % 2 ? sombre : clair) + '" stroke="#0a0418" stroke-width="2"/>';
      chiffres += '<g transform="rotate(' + (i * PAS + PAS / 2) + ' 100 100)">' +
        '<text x="100" y="38" text-anchor="middle" font-size="20" font-weight="900" ' +
        'fill="#fff" stroke="#0a0418" stroke-width="4.5" paint-order="stroke" ' +
        'font-family="Outfit, system-ui, sans-serif">' + (v > 0 ? '+' + v : v) + '</text></g>';
    });
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="100" cy="100" r="96" fill="#0a0418" stroke="#ffcf4d" stroke-width="4"/>' +
      parts + chiffres +
      '<circle cx="100" cy="100" r="17" fill="#1d1233" stroke="#ffcf4d" stroke-width="4"/>' +
      '<circle cx="100" cy="100" r="6" fill="#ffcf4d"/></svg>';
  }

  /** la meme roue s arrete au meme quartier sur tous les ecrans */
  K.anim.roue = async function (d) {
    const i = d.i % QUARTIERS.length;
    const v = QUARTIERS[i];

    U.overlay('<div class="ov-head"><span class="ov-ico">🎡</span><h3>La Roue de Kwa' +
      '<span class="ov-sub">' + U.esc(d.name || '') + '</span></h3></div>' +
      '<div class="ov-body">' +
        '<div class="roue-wrap">' +
          '<div class="roue-fleche"></div>' +
          '<div class="roue-disc" id="roueDisc">' + disque() + '</div>' +
        '</div>' +
        '<div class="roue-out" id="roueOut">&nbsp;</div>' +
      '</div>');

    const disc = U.$('#roueDisc');
    /* cinq tours complets, puis on amene le centre du quartier sous la fleche */
    const angle = 360 * 5 + (360 - (i * PAS + PAS / 2));

    /* les crans ralentissent comme le disque */
    let quand = 0, ecart = 55;
    for (let k = 0; k < 34 && quand < 3100; k++) {
      setTimeout(() => K.audio.tick(), quand);
      quand += ecart;
      ecart *= 1.14;
    }

    await U.sleep(40);
    if (disc) disc.style.transform = 'rotate(' + angle.toFixed(2) + 'deg)';
    await U.sleep(3300);

    const out = U.$('#roueOut');
    if (out) {
      out.className = 'roue-out fini';
      out.style.color = v > 0 ? '#57e08a' : '#ff5757';
      out.textContent = (v > 0 ? '+' + v : v) + ' — ' + U.cases(v);
    }
    v > 0 ? K.audio.up() : K.audio.down();
    U.buzz(40);
    await U.sleep(1500);
    U.closeOverlay();
  };

  K.registerTile('roue', async function (ctx) {
    const p = ctx.player;
    await K.kwa.say('LA ROUE DE KWA ! Aucune competence, aucun merite. Juste toi et le destin.',
      { mood: 'wink' });

    const i = U.rnd(QUARTIERS.length);
    const v = QUARTIERS[i];
    K.net && K.net.ev('anim', { fn: 'roue', i, name: p.name });
    await K.anim.roue({ i, name: p.name });

    await K.kwa.say(v > 0
      ? (v >= 4 ? 'MAIS QUELLE ROUE ! ' + p.name + ' repart avec ' + U.cases(v) + ' !'
                : p.name + ' prend ' + U.cases(v) + '. Correct.')
      : p.name + ' recule de ' + U.cases(v) + '. La roue ne t aime pas.',
      { auto: 1500, mood: v >= 4 ? 'oh' : 'happy' });

    return [{ id: p.id, delta: v }];
  });

})(window.KWA);
