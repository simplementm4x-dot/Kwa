/* =========================================================
   KWA — ouverture de partie
   Presentation des candidats, roulement de tambour, puis
   tirage au sort de l ordre de passage.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const I = K.intro = {};

  /* ---------------------------------------------------------
     Un candidat sous le projecteur
     --------------------------------------------------------- */
  function showCandidate(p, n, total) {
    const col = K.COLORS.find(c => c.id === p.color);
    U.spotlight(
      '<div class="sl-card" style="--pc:' + p.hex + '">' +
        '<div class="sl-num">CANDIDAT ' + n + ' / ' + total + '</div>' +
        '<div class="sl-tv">' + K.sprites.tvPawn(p, 1.7) + '</div>' +
        '<div class="sl-name">' + U.esc(p.name.toUpperCase()) + '</div>' +
        '<div class="sl-col">' + U.esc(col ? col.name : '') + '</div>' +
      '</div>');
  }

  /* ---------------------------------------------------------
     La liste de l ordre de passage, revelee un par un
     --------------------------------------------------------- */
  function showOrder(players, upTo) {
    /* seule la ligne qui vient d apparaitre s anime : sinon tout clignote a chaque ajout */
    const rows = players.slice(0, upTo).map((p, i) =>
      '<div class="ol-row" style="--pc:' + p.hex + (i === upTo - 1 ? '' : ';animation:none') + '">' +
        '<span class="ol-pos">' + (i + 1) + '</span>' +
        '<span class="ol-av">' + K.sprites.avatar(p, 34) + '</span>' +
        '<b>' + U.esc(p.name) + '</b>' +
        (i === 0 ? '<span class="ol-tag">DEPART</span>' : '') +
      '</div>').join('');
    U.spotlight('<div class="sl-order"><div class="sl-title">ORDRE DE PASSAGE</div>' + rows + '</div>');
  }

  /* ---------------------------------------------------------
     La sequence complete
     --------------------------------------------------------- */
  I.run = async function () {
    const s = K.state;
    const total = s.players.length;

    /* --- 1. presentation, dans l ordre d inscription --- */
    await K.kwa.say('Avant toute chose, les presentations. Approchez, on vous regarde.', { mood: 'happy' });

    for (let i = 0; i < total; i++) {
      const p = s.players[i];
      showCandidate(p, i + 1, total);
      K.audio.pop();
      await K.kwa.say(
        K.kwa.line('present', { name: p.name, n: i + 1 }) || ('Candidat numero ' + (i + 1) + ' : ' + p.name + ' !'),
        { auto: 1700, mood: 'wink' });
    }
    U.clearSpotlight();

    /* --- 2. le tirage --- */
    await K.kwa.say(K.kwa.line('drum') || 'Place au tirage de l ordre de passage !', { mood: 'happy' });

    s.players = U.shuffle(s.players);
    s.idx = 0;
    K.pawns.renderAll();
    K.game.hud();

    await U.drumroll(2600, 'Qui ouvre le bal ?');

    /* --- 3. la revelation --- */
    K.kwa.setMood('oh');
    await K.kwa.say(K.kwa.line('orderWow') || 'Oh ! Alors la, surprise.', { auto: 1500, mood: 'oh' });

    for (let i = 1; i <= total; i++) {
      showOrder(s.players, i);
      K.audio.blip();
      await U.sleep(i === total ? 260 : 420);
    }
    K.audio.fanfare();

    await K.kwa.say(K.kwa.line('orderFirst', { name: s.players[0].name }) ||
      (s.players[0].name + ' ouvre le bal !'), { mood: 'oh' });

    if (total > 1) {
      await K.kwa.say(K.kwa.line('orderLast', { name: s.players[total - 1].name }) ||
        (s.players[total - 1].name + ' ferme la marche.'), { auto: 1600, mood: 'wink' });
    }

    U.clearSpotlight();
    K.kwa.setMood('happy');
  };

})(window.KWA);
