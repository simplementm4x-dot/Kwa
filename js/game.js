/* =========================================================
   KWA — moteur de partie (tours, de, cases, fin de partie)
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const G = K.game = {};

  /* --- registre des cases --- */
  K.tiles = {};
  K.registerTile = (type, fn) => { K.tiles[type] = fn; };

  /* ---------------------------------------------------------
     Zone d action
     --------------------------------------------------------- */
  G.action = function (html) { U.$('#actionZone').innerHTML = html || ''; };
  G.clearAction = () => G.action('');

  /** bouton unique -> promesse resolue au clic */
  G.localButton = function (label, cls) {
    return new Promise(res => {
      G.action('<button class="btn btn-xl ' + (cls || 'btn-primary') + '" id="actBtn">' + label + '</button>');
      U.$('#actBtn').addEventListener('click', () => { K.audio.tap(); G.clearAction(); res(); }, { once: true });
    });
  };

  /** ce que voient les autres pendant qu un joueur doit agir */
  G.waitingAction = function (p, label) {
    G.action('<button class="btn btn-xl btn-ghost" disabled>⏳ ' +
      U.esc(p ? p.name : '') + '</button>' +
      '<p class="dim center" style="font-size:12px;margin:0">' + U.esc(label || '') + '</p>');
  };

  /**
   * En solo : le bouton s affiche ici.
   * En multi : il s affiche sur le telephone du joueur concerne, les
   * autres voient un bouton grise avec son nom.
   */
  G.button = function (label, cls) {
    if (K.net.isActive() && K.net.isHost()) return K.net.actionButton(K.current(), label, cls);
    return G.localButton(label, cls);
  };

  /* ---------------------------------------------------------
     HUD
     --------------------------------------------------------- */
  function hud() {
    const s = K.state;
    U.$('#hudMode').textContent = s.settings.mode === 'terminus' ? 'TERMINUS' : 'MODE TOURS';
    U.$('#hudTurn').textContent = s.settings.mode === 'terminus'
      ? 'Tour ' + s.turn
      : 'Tour ' + s.turn + '/' + s.settings.maxTurns;

    U.$('#hudPlayers').innerHTML = s.players.map((p, i) =>
      '<div class="hp' + (i === s.idx ? ' on' : '') + '" style="--pc:' + p.hex + '">' +
        '<span class="hp-av">' + K.sprites.avatar(p, 24) + '</span>' +
        '<b>' + U.esc(p.name) + '</b><i>' + p.pos + '</i></div>'
    ).join('');
    K.net && K.net.broadcastState();
    const on = U.$('#hudPlayers .hp.on');
    if (on) on.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
  G.hud = hud;

  /* ---------------------------------------------------------
     Des
     --------------------------------------------------------- */
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  function diceHtml(v) {
    let s = '';
    for (let i = 0; i < 9; i++) s += '<i class="pip' + (PIPS[v].indexOf(i) >= 0 ? ' on' : '') + '"></i>';
    return s;
  }

  async function rollDice() {
    const v = 1 + U.rnd(6);
    K.net && K.net.ev('dice', { v });
    await G.diceAnim(v);
    return v;
  }

  /** l animation du de, identique sur tous les ecrans */
  G.diceAnim = async function (v) {
    G.action('<div class="dice-wrap"><div class="dice rolling" id="dice">' + diceHtml(1) + '</div></div>');
    const d = U.$('#dice');
    K.audio.dice();
    const t0 = Date.now();
    while (Date.now() - t0 < 900) {
      const el = U.$('#dice');
      if (!el) return;
      el.innerHTML = diceHtml(1 + U.rnd(6));
      await U.sleep(70);
    }
    if (!U.$('#dice')) return;
    d.className = 'dice';
    d.innerHTML = diceHtml(v);
    K.audio.good();
    U.buzz(30);
    await U.sleep(520);
    G.clearAction();
  };

  /* ---------------------------------------------------------
     Application des resultats d une case
     results : [{id, delta, why}]
     --------------------------------------------------------- */
  G.applyResults = async function (results) {
    if (!results || !results.length) return;
    const real = results.filter(r => r && r.delta);
    if (!real.length) {
      await K.kwa.say('Personne ne bouge. La foret retient son souffle.', { auto: 900 });
      return;
    }
    /* recapitulatif */
    await showRecap(results);
    for (const r of real) {
      const p = K.player(r.id);
      if (!p) continue;
      const target = U.clamp(p.pos + r.delta, 0, K.board.last());
      const eff = target - p.pos;
      if (!eff) continue;
      K.board.focus(p.pos);
      K.pawns.setActive(p.id);
      K.board.floatDelta(p.pos, (eff > 0 ? '+' : '') + eff, eff > 0 ? '#57e08a' : '#ff5757');
      eff > 0 ? K.audio.up() : K.audio.down();
      if (eff > 0) p.stats.gained += eff; else p.stats.lost += -eff;
      await U.sleep(280);
      await K.pawns.moveTo(p, target);
      hud();
    }
  };

  function showRecap(results) {
    const rows = results.map(r => {
      const p = K.player(r.id); if (!p) return '';
      const d = r.delta;
      const cls = d > 0 ? 'up' : (d < 0 ? 'down' : 'zero');
      const txt = d > 0 ? '+' + d : (d < 0 ? String(d) : '=');
      return '<div class="res" style="border-left-color:' + p.hex + '">' +
        '<span class="rank-av" style="--pc:' + p.hex + '">' + K.sprites.avatar(p, 30) + '</span>' +
        '<b>' + U.esc(p.name) + '</b><span class="d ' + cls + '">' + txt + '</span></div>';
    }).join('');
    return U.panel('📊', 'Resultat de la manche', '',
      '<div class="res-list">' + rows + '</div>', 'On avance !')
      .then(U.closeOverlay);
  }

  /* ---------------------------------------------------------
     Un tour de joueur
     --------------------------------------------------------- */
  async function playTurn() {
    const s = K.state;
    const p = K.current();
    K.setHolder(p.id);
    K.pawns.setActive(p.id);
    K.board.focus(p.pos);
    hud();

    await K.kwa.say(K.kwa.line('turn', { name: p.name }) || ('A toi, ' + p.name + ' !'), { mood: 'happy' });

    await G.button('🎲 LANCER LE DÉ');
    const d = await rollDice();
    await K.kwa.say(K.kwa.line('dice' + d, { name: p.name }) || (p.name + ' fait ' + d + ' !'), { auto: 800, mood: d >= 5 ? 'oh' : 'happy' });

    const before = p.pos;
    await K.pawns.moveTo(p, before + d);
    hud();

    /* arrivee au bout */
    if (p.pos >= K.board.last() && K.rules.isTerminus()) { await endGame(p); return true; }

    const tile = K.board.at(p.pos);
    const handler = K.tiles[tile.type];
    if (handler && tile.type !== 'start' && tile.type !== 'finish') {
      const info = K.TILE_TYPES[tile.type];
      await U.jingle(info.label, '', 1200);
      const results = await handler({ player: p, tile, players: s.players });
      await G.applyResults(results);
    } else if (tile.type === 'finish') {
      await K.kwa.say('Bout du chemin ! ' + p.name + ' campe au terminus.', { auto: 1200 });
    } else {
      await K.kwa.say('Case tranquille. Profites-en, ca ne durera pas.', { auto: 1000 });
    }

    /* quelqu un a pu etre pousse jusqu au bout */
    if (K.rules.isTerminus()) {
      const w = s.players.find(x => x.pos >= K.board.last());
      if (w) { await endGame(w); return true; }
    }
    return false;
  }

  /* ---------------------------------------------------------
     Boucle principale
     --------------------------------------------------------- */
  async function loop() {
    const s = K.state;
    while (!s.over) {
      const finished = await playTurn();
      if (finished) return;

      s.idx++;
      if (s.idx >= s.players.length) {
        s.idx = 0; s.turn++;
        if (s.settings.mode === 'tours' && s.turn > s.settings.maxTurns) {
          await endGame(K.ranking()[0]);
          return;
        }
        await K.kwa.say('Tour ' + s.turn + ' ! On rembobine pas, on avance.', { auto: 900 });
      }
      hud();
    }
  }

  /* ---------------------------------------------------------
     Demarrage
     --------------------------------------------------------- */
  G.start = async function () {
    const s = K.state;
    s.turn = 1; s.idx = 0; s.over = false; s.started = true;
    s.players.forEach(p => { p.pos = 0; p.stats = { correct: 0, wrong: 0, gained: 0, lost: 0 }; });
    U.resetBags();
    if (K.net.isActive()) K.net.markStarted();

    K.board.generate(s.settings.boardLength);
    /* les autres telephones reconstruisent exactement le meme plateau */
    K.net.ev('board', { types: K.board.typeList(), settings: s.settings });
    U.clearSpotlight();
    U.go('game');
    K.kwa.mount();
    K.board.fireflies(20);
    K.board.render();
    K.pawns.renderAll();
    K.board.focus(0, true);
    hud();
    K.audio.unlock();

    await K.kwa.say('Bien le bonjour ! Moi c est KWA, votre animateur en 625 lignes.', { mood: 'wink' });
    await K.kwa.say('Bienvenue dans la Foret Enchantee. ' +
      (K.rules.isTerminus()
        ? 'Le premier a atteindre le terminus remporte tout.'
        : 'On joue ' + s.settings.maxTurns + ' tours, et le plus loin gagne.'));
    await K.kwa.say('Regle numero un : on ne triche pas. Regle numero deux : on triche discretement.', { mood: 'wink' });

    await K.intro.run();
    loop();
  };

  /* ---------------------------------------------------------
     Fin de partie
     --------------------------------------------------------- */
  async function endGame(winner) {
    const s = K.state;
    s.over = true;
    G.clearAction();
    K.kwa.hide();
    K.net && K.net.broadcastState();
    await U.jingle('FIN DE PARTIE', '', 1500);
    const rank = K.ranking();
    const w = winner || rank[0];
    K.audio.fanfare();
    U.confetti([w.hex, '#ffcf4d', '#39e7ff', '#ff3fa4'], 120);

    const rows = rank.map((p, i) =>
      '<div class="rank-row" style="border-left-color:' + p.hex + ';--pc:' + p.hex + '">' +
        '<span class="rank-pos">' + (i + 1) + '</span>' +
        '<span class="rank-av">' + K.sprites.avatar(p, 38) + '</span>' +
        '<span class="rank-info"><b>' + U.esc(p.name) + '</b>' +
          '<small>case ' + p.pos + ' · +' + p.stats.gained + ' / -' + p.stats.lost + '</small>' +
          '<span class="rank-bar"><i style="width:' + Math.round(p.pos / K.board.last() * 100) + '%"></i></span>' +
        '</span></div>'
    ).join('');

    const body =
      '<div class="win-hero"><div class="win-tv">' + K.sprites.tvPawn(w, 1.7) + '</div>' +
      '<h2>' + U.esc(w.name) + ' GAGNE !</h2><p>' +
      (K.rules.isTerminus() ? 'Arrive au terminus le premier.' : 'Le plus loin apres ' + s.settings.maxTurns + ' tours.') +
      '</p></div>' + rows;

    K.net.ev('panel', { ico: '🏆', title: 'Classement final', sub: '', body });

    U.ovShell('🏆', 'Classement final', '', body,
      '<button class="btn btn-xl btn-primary" id="btnAgain">Rejouer</button>' +
      '<button class="btn btn-ghost" id="btnHome">Retour au menu</button>');

    U.$('#btnAgain').addEventListener('click', () => {
      K.net.ev('panelClose', {}); U.closeOverlay(); G.start();
    });
    U.$('#btnHome').addEventListener('click', () => {
      K.net.ev('panelClose', {}); U.closeOverlay(); U.go('title');
    });
  }
  G.endGame = endGame;

  /* ---------------------------------------------------------
     Panneaux HUD (pause / classement)
     --------------------------------------------------------- */
  G.showScores = function () {
    const rank = K.ranking();
    const rows = rank.map((p, i) =>
      '<div class="rank-row" style="border-left-color:' + p.hex + ';--pc:' + p.hex + '">' +
        '<span class="rank-pos">' + (i + 1) + '</span>' +
        '<span class="rank-av">' + K.sprites.avatar(p, 38) + '</span>' +
        '<span class="rank-info"><b>' + U.esc(p.name) + '</b><small>case ' + p.pos + ' / ' + K.board.last() + '</small>' +
        '<span class="rank-bar"><i style="width:' + Math.round(p.pos / K.board.last() * 100) + '%"></i></span></span></div>'
    ).join('');
    U.ovShell('🏆', 'Classement', 'Tour ' + K.state.turn, rows,
      '<button class="btn btn-xl btn-primary" id="clOk">Fermer</button>');
    U.$('#clOk').addEventListener('click', U.closeOverlay, { once: true });
  };

  G.showPause = function () {
    U.ovShell('⏸️', 'Pause', '',
      '<p class="hint">La foret ne bouge pas sans toi.</p>' +
      '<div class="rule"><h4><span>' + (K.rules.isTerminus() ? '🏁' : '⏱️') + '</span>' +
      (K.rules.isTerminus() ? 'Mode Terminus' : 'Mode ' + K.state.settings.maxTurns + ' tours') + '</h4>' +
      '<p>Chemin de ' + K.board.length() + ' cases · ' + K.state.players.length + ' joueurs</p></div>',
      '<button class="btn btn-xl btn-primary" id="pzOk">Reprendre</button>' +
      '<button class="btn btn-ghost" id="pzSound">' + (K.audio.enabled() ? '🔊 Son actif' : '🔇 Son coupe') + '</button>' +
      '<button class="btn btn-ghost" id="pzQuit">Quitter la partie</button>');
    U.$('#pzOk').addEventListener('click', U.closeOverlay, { once: true });
    U.$('#pzSound').addEventListener('click', e => {
      const v = !K.audio.enabled();
      K.audio.setEnabled(v); K.state.settings.sound = v;
      e.target.textContent = v ? '🔊 Son actif' : '🔇 Son coupe';
    });
    U.$('#pzQuit').addEventListener('click', () => {
      K.state.over = true;
      K.net.reset();
      U.closeOverlay(); U.clearSpotlightLocal(); U.go('title');
    });
  };

})(window.KWA);
