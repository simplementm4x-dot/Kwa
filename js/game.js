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

  /**
   * Ce qu une epreuve annonce AVANT les paris.
   *
   * On ne mise pas a l aveugle : savoir que le theme est "les
   * dinosaures" change tout quand on connait le joueur. Une epreuve
   * peut donc s ouvrir en deux temps — ce que tout le monde apprend
   * d abord, puis l epreuve elle-meme — et ce qu elle a tire dans son
   * ouverture lui revient dans ctx.avant.
   */
  K.tileIntro = {};
  K.registerIntro = (type, fn) => { K.tileIntro[type] = fn; };

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

  /**
   * Ce que voient les autres pendant qu un joueur doit agir.
   * Si son telephone a lache, l hote peut jouer a sa place plutot que
   * de laisser la partie suspendue a quelqu un qui ne reviendra pas.
   */
  G.waitingAction = function (p, label, onTakeOver) {
    G.action('<button class="btn btn-xl btn-ghost" disabled>⏳ ' +
      U.esc(p ? p.name : '') + '</button>' +
      '<p class="dim center" style="font-size:12px;margin:0">' + U.esc(label || '') + '</p>' +
      (onTakeOver ? '<button class="btn btn-cyan" id="actTake" style="margin-top:10px">' +
        'Jouer a sa place</button>' : ''));
    if (onTakeOver) {
      U.$('#actTake').addEventListener('click', () => {
        K.audio.tap(); G.clearAction(); onTakeOver();
      }, { once: true });
    }
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
      '<div class="hp' + (i === s.idx ? ' on' : '') + (p.off ? ' off' : '') + '" style="--pc:' + p.hex + '">' +
        '<span class="hp-av">' + K.sprites.avatar(p, 24) + '</span>' +
        '<b>' + U.esc(p.name) + '</b><i>' + p.pos + '</i>' + K.objets.badge(p) + '</div>'
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

  /**
   * Lance n des l un apres l autre et rend le total. Chaque de est
   * diffuse : tous les telephones voient la meme chose rouler.
   */
  G.des = async function (n) {
    let total = 0;
    for (let i = 0; i < (n || 1); i++) {
      const v = 1 + U.rnd(6);
      K.net && K.net.ev('dice', { v });
      await G.diceAnim(v);
      total += v;
    }
    return total;
  };

  const rollDice = () => G.des(1);

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
  /**
   * brut = true : on applique tel quel, sans laisser la regle de foret
   * transformer les gains (sinon la maree de champignons se doublerait
   * elle-meme, et les paris seraient inverses deux fois).
   * Renvoie les resultats reellement appliques.
   */
  G.applyResults = async function (results, brut) {
    if (!results || !results.length) return [];
    results = brut ? results : K.events.apply(results);
    const real = results.filter(r => r && r.delta);
    if (!real.length) {
      await K.kwa.say("Personne ne bouge. La foret retient son souffle.", { auto: 900 });
      return results;
    }
    for (const r of real) {
      const p = K.player(r.id);
      if (!p) continue;
      const target = U.clamp(p.pos + r.delta, 0, K.board.last());
      const eff = target - p.pos;
      if (!eff) continue;
      K.board.focus(p.pos);
      K.pawns.setActive(p.id);
      /* Kwa raconte pendant que le pion bouge : le bordereau chiffre
         qui s ouvrait ici arretait la partie le temps qu on le lise, et
         un tableau de +2/-3 n a jamais fait rire personne. */
      await K.kwa.say(raconte(p, eff, r.why), { auto: 950, mood: eff > 0 ? "happy" : "oh" });
      K.board.floatDelta(p.pos, (eff > 0 ? "+" : "") + eff, eff > 0 ? "#57e08a" : "#ff5757");
      K.pawns.react(p.id, eff > 0 ? "gain" : "perte");
      eff > 0 ? K.audio.up() : K.audio.down();
      if (eff > 0) p.stats.gained += eff; else p.stats.lost += -eff;
      await U.sleep(180);
      await K.pawns.moveTo(p, target);
      hud();
    }
    return results;
  };

  /* Ce que Kwa dit quand un pion bouge. Le "pourquoi" vient de la case
     ou de la regle en cours quand il y en a un : "recule de 3 cases" ne
     dit rien, "repousse par l esprit de la foret" raconte le tour. */
  const GAGNE = [
    "{n} rafle {c} !",
    "Et {c} pour {n}. Merci qui ?",
    "{n} avance de {c}. Ca se voit d ici.",
    "Belle affaire : {c} pour {n}.",
    "{c} de plus pour {n}. Le chemin se raccourcit."
  ];
  const PERD = [
    "Oh non... {n} recule de {c}.",
    "Aie. {n} redescend de {c}.",
    "{c} en arriere pour {n}. La foret n oublie rien.",
    "Et {n} se fait repousser de {c}. Douloureux.",
    "{n} perd {c}. Ca arrive aux meilleurs. Aux autres aussi."
  ];

  function raconte(p, eff, why) {
    const modele = U.pick(eff > 0 ? GAGNE : PERD);
    const phrase = modele.split("{n}").join(p.name).split("{c}").join(U.cases(eff));
    return why ? phrase.replace(/[.!]$/, "") + ", a cause de " + why + "." : phrase;
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

    /* Kwa propose parfois un marche avant meme que le de soit lance */
    const pacte = await K.pacte.maybe(p, s.players, s.idx);
    if (pacte && pacte.results) await G.applyResults(pacte.results);
    if (p.pos >= K.board.last() && K.rules.isTerminus()) { await endGame(p); return true; }

    /* L objet se sort apres le pacte : on sait alors si un de sera
       lance, et le De + n est propose que si c est le cas. */
    const objet = await K.objets.tour(p, { lance: !(pacte && pacte.pas) });
    if (p.pos >= K.board.last() && K.rules.isTerminus()) { await endGame(p); return true; }
    if (K.rules.isTerminus()) {
      const w = s.players.find(x => x.pos >= K.board.last());
      if (w) { await endGame(w); return true; }
    }

    /* Un marche qui fait avancer REMPLACE le de : sinon le joueur
       empochait ses cases puis relancait par-dessus, ce qui faisait du
       pacte un cadeau et non un choix. */
    let pas;
    if (pacte && pacte.pas) {
      pas = pacte.pas;
      await G.button('🤝 PRENDRE MES ' + pas + ' CASES');
      await K.kwa.say(p.name + ' avance de ' + U.cases(pas) + ' sans toucher au de. C etait le marche.',
        { auto: 1400, mood: 'wink' });
    } else {
      await G.button('🎲 LANCER LE DÉ');
      const d = await rollDice();
      pas = d * ((pacte && pacte.diceMult) || 1) + ((objet && objet.bonusDe) || 0);
      await K.kwa.say(K.kwa.line('dice' + d, { name: p.name }) || (p.name + ' fait ' + d + ' !'), { auto: 800, mood: d >= 5 ? 'oh' : 'happy' });
      if (pas !== d) await K.kwa.say('Et ca compte double : ' + pas + ' cases. Marche est marche.', { auto: 1200, mood: 'oh' });
    }

    /* la malediction du Fantome : ce qu il aurait gagne, il le recule */
    if (p.maudit) {
      p.maudit = false;
      pas = -pas;
      K.game.hud();
      await K.kwa.say('Le fantome ne l a pas lache : ' + p.name + ' ne monte pas de ' +
        U.cases(-pas) + ', il les descend.', { auto: 1800, mood: 'what' });
    }

    const before = p.pos;
    await K.pawns.moveTo(p, before + pas);
    hud();

    /* arrivee au bout */
    if (p.pos >= K.board.last() && K.rules.isTerminus()) { await endGame(p); return true; }

    /* la case est peut-etre gardee : le coup de baton passe avant tout,
       et celui qui le prend ne joue pas l epreuve */
    const cueilli = await K.esprit.garde(p);

    const tile = K.board.at(p.pos);
    /* "Kwa a faim" : l epreuve jouee n est pas celle de la case */
    const ev = K.state.event;
    let type = tile.type;
    if (ev && ev.wild && type !== 'start' && type !== 'finish') type = K.board.randomPlayable();

    const handler = K.tiles[type];
    if (cueilli) {
      /* l esprit a deja tout dit et tout applique */
    } else if (pacte && pacte.skipTile) {
      await K.kwa.say('Marche conclu : ' + p.name + ' saute son epreuve. On ne saura jamais.',
        { auto: 1400, mood: 'wink' });
    } else if (handler && type !== 'start' && type !== 'finish') {
      const info = K.TILE_TYPES[type];
      await U.jingle(info.label, type !== tile.type ? 'Choisie par Kwa' : '', 1200);

      /* l ouverture de l epreuve, s il y en a une : elle passe avant les
         paris, sinon on miserait sans savoir sur quoi */
      const ouverture = K.tileIntro[type];
      const avant = ouverture ? await ouverture({ player: p, tile, players: s.players }) : null;

      /* un seul joueur sur scene : les autres misent sur lui */
      const mises = info.pari
        ? await K.bets.collect(p, { type }, s.players, avant && avant.sujet)
        : null;

      const results = await handler({ player: p, tile, players: s.players, avant });
      const faits = await G.applyResults(results);

      if (mises) {
        const gain = (faits || []).filter(r => r.id === p.id)
                                  .reduce((n, r) => n + (r.delta || 0), 0);
        const paris = K.bets.settle(mises, gain, p);
        if (paris.length) {
          await K.bets.recap(mises, gain, p, paris);
          await G.applyResults(paris, true);
        }
      }
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

      /* la foret reagit a ce qui vient de se passer, pas au calendrier */
      await K.events.maybe();
      if (s.over) return;

      /* l esprit change de case pendant que les autres regardent */
      await K.esprit.rode();

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
    K.events.reset();
    s.players.forEach(p => { p.pos = 0; p.stats = { correct: 0, wrong: 0, gained: 0, lost: 0 }; });
    K.objets.reset();
    U.resetBags();
    if (K.net.isActive()) K.net.markStarted();

    K.board.generate(s.settings.boardLength);
    /* les autres telephones reconstruisent exactement le meme plateau.
       Le rideau part avec l evenement du plateau : sur les autres
       ecrans il doit etre en place AVANT que la foret s affiche. */
    K.net.ev('board', { types: K.board.typeList(), settings: s.settings, rideau: true });
    /* l esprit choisit sa case une fois le plateau connu de tous :
       sa position part ensuite dans son propre message */
    K.esprit.reset();
    U.clearSpotlight();
    K.rideau.fermerLocal();
    U.go('game');
    K.kwa.mount();
    K.board.fireflies(20);
    K.board.render();
    K.pawns.renderAll();
    K.esprit.render();
    hud();
    K.events.render();
    K.audio.unlock();

    /* On montre d abord le terrain, pas l animateur : le plateau defile
       du terminus jusqu au depart, et Kwa n entre qu ensuite. */
    /* Kwa fait tout son numero devant le rideau tire. Pendant ce
       temps-la, le navigateur dessine la foret tranquillement : elle
       n apparaitra qu une fois prete. */
    K.kwa.hide();
    await U.sleep(160);
    await K.kwa.entree();

    await K.kwa.say('Bien le bonjour ! Moi c est KWA, votre animateur en 625 lignes.', { mood: 'wink' });
    await K.kwa.say('Bienvenue dans la Foret Enchantee. ' +
      (K.rules.isTerminus()
        ? 'Le premier a atteindre le terminus remporte tout.'
        : 'On joue ' + s.settings.maxTurns + ' tours, et le plus loin gagne.'));
    await K.kwa.say('Regle numero un : on ne triche pas. Regle numero deux : on triche discretement.', { mood: 'wink' });

    /* presentations et tirage de l ordre, toujours devant le rideau */
    await K.intro.run();

    await K.kwa.say('La foret vous attend. Rideau !', { auto: 900, mood: 'oh' });
    /* la camera attend deja sur la case de depart : le rideau s ouvre
       sur une image posee, il n y a plus rien a animer derriere */
    K.board.focus(0, true);
    await K.rideau.ouvrir(1700);
    loop();
  };

  /* ---------------------------------------------------------
     Fin de partie
     --------------------------------------------------------- */
  async function endGame(winner) {
    const s = K.state;
    s.over = true;
    s.event = null;
    K.events.render();
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
    const net = K.net && K.net.isActive() ? K.net : null;
    const absents = K.state.players.filter(p => p.off);

    /* Le code du salon disparaissait avec l ecran de salon. C est
       pourtant la qu on en a besoin : quelqu un a saute, il faut
       pouvoir le lui redonner sans relancer la partie. */
    const codeBloc = net
      ? '<div class="lobby-code" style="margin-bottom:12px"><small>Code du salon</small>' +
        '<div class="code">' + net.code() + '</div>' +
        '<div class="lobby-url">' + U.esc(location.host) + '</div></div>'
      : '';

    const absentsBloc = absents.length
      ? '<div class="rule"><h4><span>😴</span>' +
        (absents.length > 1 ? absents.length + ' joueurs deconnectes' : 'Un joueur deconnecte') + '</h4>' +
        '<p>' + absents.map(p => U.esc(p.name)).join(', ') + ' — leur television dort sur le plateau. ' +
        'Leur place est gardee : ils reviennent tout seuls des que le reseau revient, ou en ' +
        'retapant le code ci-dessus.</p></div>'
      : '';

    U.ovShell('⏸️', 'Pause', '',
      '<p class="hint">La foret ne bouge pas sans toi.</p>' +
      codeBloc + absentsBloc +
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
