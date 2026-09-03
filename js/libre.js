/* =========================================================
   JEU LIBRE

   Le plateau, le de et les cases mis de cote : on choisit
   l epreuve qu on veut jouer, on la joue, et les gains
   deviennent des points. C est le mode pour une soiree ou
   personne n a envie de faire le tour d une foret, ou pour
   essayer une epreuve sans attendre qu elle tombe.

   Une seule condition : tout le monde autour du meme
   telephone. Les epreuves se passent l appareil comme dans
   une partie a un ecran.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const L = K.libre = {};

  /* Les cases eclair sont des mecaniques de plateau — ramasser un objet,
     tourner la roue — et n ont aucun sens hors du chemin. */
  const CATALOGUE = [
    'quiz', 'undercover', 'anecdote', 'verite', 'dilemme',
    'shifumi', 'djmix', 'echelle', 'mime', 'motraccord',
    'vingtetun', 'duel', 'aveugle'
  ];

  let scores = {};
  let manches = 0;

  const points = id => scores[id] || 0;

  /** classement de la session, du meilleur au moins bon */
  function classement() {
    return K.state.players.slice().sort((a, b) => points(b.id) - points(a.id));
  }

  /* ---------------------------------------------------------
     Ce qui est jouable ici et maintenant
     --------------------------------------------------------- */
  function jouable(type) {
    const info = K.TILE_TYPES[type];
    if (!info || !K.tiles[type]) return 'Pas encore disponible';
    const n = K.state.players.length;
    if (info.min && n < info.min) return 'Il faut ' + info.min + ' joueurs';
    if (type === 'duel' && n < 2) return 'Il faut 2 joueurs';
    if (info.piece && K.rules.isOnline()) return 'Demande d etre dans la meme piece';
    return null;
  }

  /* ---------------------------------------------------------
     La grille
     --------------------------------------------------------- */
  L.open = function () {
    K.state.settings.libre = true;
    U.go('libre');
    L.render();
  };

  L.render = function () {
    const body = U.$('#libreBody');
    if (!body) return;

    const rang = classement();

    body.innerHTML =
      '<p class="hint">Choisis l epreuve. Les cases gagnees deviennent des points, ' +
      'et tout le monde se passe le telephone.</p>' +

      /* on montre le tableau des qu une manche a ete jouee, et non quand
         la somme des points n est pas nulle : une manche ou l un gagne ce
         que l autre perd donne un total de zero */
      (manches
        ? '<div class="lb-scores">' + rang.map((p, i) =>
            '<div class="rank-row" style="border-left-color:' + p.hex + ';--pc:' + p.hex + '">' +
              '<span class="rank-pos">' + (i + 1) + '</span>' +
              '<span class="rank-av">' + K.sprites.avatar(p, 34) + '</span>' +
              '<span class="rank-info"><b>' + U.esc(p.name) + '</b>' +
              '<small>' + points(p.id) + ' point' + (Math.abs(points(p.id)) > 1 ? 's' : '') + '</small></span>' +
            '</div>').join('') + '</div>' +
          '<button class="btn btn-ghost w-full" id="lbRaz">Remettre les compteurs a zero</button>' +
          '<div class="sep"></div>'
        : '') +

      '<div class="lb-grid">' + CATALOGUE.map(type => {
        const info = K.TILE_TYPES[type] || {};
        const empeche = jouable(type);
        return '<button class="lb-jeu' + (empeche ? ' off' : '') + '" data-jeu="' + type + '"' +
          (empeche ? ' disabled' : '') + ' style="--c1:' + info.c1 + ';--c2:' + info.c2 + '">' +
          (info.img
            ? '<img class="lb-vig" src="assets/' + info.img + '" alt="">'
            : '<span class="lb-ico">' + info.icon + '</span>') +
          '<b>' + U.esc(info.label || type) + '</b>' +
          (empeche ? '<small class="lb-non">' + U.esc(empeche) + '</small>' : '') +
        '</button>';
      }).join('') + '</div>';

    U.on(body, 'click', '[data-jeu]', (e, t) => L.jouer(t.dataset.jeu));
    const raz = U.$('#lbRaz');
    if (raz) raz.addEventListener('click', () => { scores = {}; manches = 0; K.audio.tap(); L.render(); });
  };

  /* ---------------------------------------------------------
     Une epreuve
     --------------------------------------------------------- */
  L.jouer = async function (type) {
    const info = K.TILE_TYPES[type];
    const handler = K.tiles[type];
    if (!handler || jouable(type)) return;

    K.audio.tap();

    /* qui monte sur scene : la plupart des epreuves ont un protagoniste */
    const id = await K.prompt.render({
      kind: 'list', icon: info.icon,
      title: 'Qui monte sur scene ?', sub: info.label,
      intro: 'C est autour de cette personne que l epreuve se joue.',
      items: K.state.players.map(p => ({ id: p.id, pid: p.id, label: p.name, color: p.hex }))
    });
    U.closeOverlay();
    const vedette = K.player(id) || K.state.players[0];

    /* on emprunte l ecran de jeu pour son decor et son animateur, mais
       sans plateau : ni chemin, ni pions, ni tour de jeu */
    U.go('game');
    U.$('#screen-game').classList.add('libre');
    K.kwa.mount();
    K.board.fireflies(14);
    K.audio.unlock();
    K.setHolder(null);

    await U.jingle(info.label, 'Jeu libre', 1200);

    let resultats = [];
    try {
      resultats = await handler({ player: vedette, tile: { type }, players: K.state.players }) || [];
    } catch (e) {
      U.toast('Cette epreuve s est interrompue');
      resultats = [];
    }

    U.closeOverlay();
    U.clearSpotlightLocal();

    const bouges = resultats.filter(r => r && r.delta);
    bouges.forEach(r => { scores[r.id] = points(r.id) + r.delta; });
    manches++;

    if (bouges.length) {
      const rows = bouges.map(r => {
        const p = K.player(r.id);
        if (!p) return '';
        const cls = r.delta > 0 ? 'up' : 'down';
        return '<div class="res" style="border-left-color:' + p.hex + '">' +
          '<span class="rank-av" style="--pc:' + p.hex + '">' + K.sprites.avatar(p, 30) + '</span>' +
          '<b>' + U.esc(p.name) + '</b>' +
          '<span class="d ' + cls + '">' + (r.delta > 0 ? '+' + r.delta : r.delta) + '</span></div>';
      }).join('');
      await U.panelAuto('🎯', 'Points de la manche', info.label,
        '<div class="res-list">' + rows + '</div>', 1200 + bouges.length * 320);
    } else {
      await K.kwa.say('Personne ne marque. Ca arrive.', { auto: 1100 });
    }

    K.kwa.hide();
    U.$('#screen-game').classList.remove('libre');
    L.render();
    U.go('libre');
  };

  L.quitter = function () {
    K.state.settings.libre = false;
    U.$('#screen-game').classList.remove('libre');
    U.go('title');
  };

})(window.KWA);
