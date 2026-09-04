/* =========================================================
   LES EVENEMENTS DE FORET

   Deux principes.

   Le declenchement n est pas un metronome : un evenement qui
   tombe a chaque manche devient du decor. Il arrive quand la
   partie l appelle — un ecart qui se creuse, un meneur qui
   s echappe, une fin de course — ou par surprise.

   L annonce n est pas un bandeau : c est la foret elle-meme
   qui change sous les pieds des joueurs, pendant que Kwa
   decouvre ca en meme temps qu eux.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const E = K.events = {};

  K.anim = K.anim || {};

  /* tours de joueur minimum entre deux evenements : une regle dure 3 tours,
     ce repos garantit donc au moins un tour de jeu normal entre deux */
  const REPOS = 4;
  /* au-dela de ce poids, la situation reclame la carte : elle tombe */
  const APPEL = 60;
  /* sinon, chance par tour de joueur qu il se passe quelque chose */
  const SURPRISE = 22;

  let depuis = 0;

  /* ---------------------------------------------------------
     Les cartes
     poids(ctx) : 0 = impossible, >= APPEL = la partie la reclame
     --------------------------------------------------------- */
  const CARTES = [
    {
      id: 'champignons', ico: '🍄', nom: 'MAREE DE CHAMPIGNONS', court: 'Coup de pouce',
      immediat: true,
      desc: 'Le dernier lance des des — un de plus par palier d ecart — et avance du total. ' +
            'Tous les autres gagnent une case. Se resout tout de suite et ne dure pas.',
      /* la carte du retardataire : plus l ecart est grand, plus elle appelle */
      poids: c => c.ecart >= 8 ? 100 : (c.ecart >= 5 ? 45 : 8),
      txt: c => 'Les champignons poussent sous ' + c.dernier.name + ' ! La foret n aime pas ' +
                'voir quelqu un se faire distancer a ce point.',
      /**
       * Le dernier ne recoit pas un nombre de cases decide d avance : il
       * lance des des, un de plus par palier d ecart. Un coup de pouce
       * qui se joue vaut mieux qu un coup de pouce qui s annonce, et le
       * hasard evite qu un retard se rattrape mecaniquement.
       */
      async effet(c) {
        const combien = c.ecart >= 12 ? 3 : (c.ecart >= 8 ? 2 : 1);
        await K.kwa.say(c.dernier.name + ' lance ' + combien + ' de' + (combien > 1 ? 's' : '') +
          ' : les champignons le portent d autant de cases.', { auto: 1500, mood: 'oh' });
        const total = await K.game.des(combien);
        await K.kwa.say(c.dernier.name + ' gagne ' + U.cases(total) + '. Les autres profitent d une case.',
          { auto: 1600 });
        return K.state.players.map(p => ({ id: p.id, delta: p.id === c.dernier.id ? total : 1 }));
      }
    },
    {
      id: 'vent', ico: '🌬️', nom: 'VENT CONTRAIRE', court: 'Le meneur paie', taxe: true, duree: 3,
      desc: 'Chaque fois qu un ou plusieurs joueurs gagnent des cases, celui qui mene ' +
            'en perd autant qu il y a de gagnants. Il ne perd rien quand il gagne lui-meme. ' +
            'Le vent souffle sur le pion de tete : s il se fait doubler, il change de cible.',
      /* elle sort quand quelqu un s echappe en tete */
      poids: c => c.avance >= 5 ? 85 : (c.avance >= 3 ? 35 : 10),
      txt: c => 'Le vent se leve, et il souffle droit sur ' + c.tete.name + '. ' +
                'Chaque fois que quelqu un gagne des cases, le meneur en perd une.'
    },
    {
      id: 'nuit', ico: '🌙', nom: 'LA NUIT TOMBE', court: 'Tout compte double', mult: 2, duree: 3,
      desc: 'Tous les deplacements sont multiplies par deux, dans les deux sens. ' +
            'Une bonne reponse rapporte le double, un gadin coute le double.',
      /* la nuit tombe quand la fin approche : c est la que doubler fait mal */
      poids: c => c.finProche ? 75 : 20,
      txt: 'La nuit tombe sur la foret. Tout compte double maintenant : les gains comme les gadins.'
    },
    {
      id: 'inversion', ico: '🔄', nom: 'INVERSION', court: 'Gagner = reculer', invert: true, duree: 3,
      desc: 'Le signe de chaque deplacement est retourne. Reussir une epreuve vous fait ' +
            'reculer d autant, et la rater vous fait avancer. Le dé, lui, n est pas touche.',
      poids: () => 25,
      txt: 'Le chemin se retourne. Gagner, c est reculer. Reculer, c est avancer. ' +
           'Reflechissez bien avant de briller.'
    },
    {
      id: 'treve', ico: '🕊️', nom: 'LA TREVE', court: 'Aucun malus', treve: true, duree: 3,
      desc: 'Aucune perte ne passe : tout deplacement negatif est ramene a zero. ' +
            'On peut tenter n importe quoi sans rien risquer — sauf le temps.',
      /* une treve juste avant la fin ne ferait que geler le classement */
      poids: c => c.finProche ? 5 : 20,
      txt: 'La foret est de bonne humeur. Aucun malus ne passe : personne ne recule, quoi qu il arrive.'
    },
    {
      id: 'faim', ico: '😋', nom: 'KWA A FAIM', court: 'Epreuve au hasard', wild: true, duree: 3,
      desc: 'L epreuve jouee n est plus celle de la case ou vous tombez : Kwa en tire une ' +
            'au hasard parmi celles que votre table peut jouer.',
      poids: () => 18,
      txt: 'J ai faim, et quand j ai faim je choisis. L epreuve que vous jouez ne sera plus ' +
           'celle de votre case. Ce sera la mienne.'
    },
    {
      /* La plus dure des regles : elle ferme les niveaux faciles ET
         rabote les gains. On ne peut plus prendre trois cases tranquille
         en se mettant 3 — il faut viser haut et repondre juste. */
      id: 'lune', ico: '🩸', nom: 'LUNE DE SANG', court: 'Que du haut niveau',
      mini: 6, demi: true, duree: 3,
      desc: 'Les niveaux 1 a 5 sont fermes : sur un quiz, il faut se mettre au moins 6, ' +
            'donc repondre aux questions les plus dures. Et tout gain de plus d une case ' +
            'est divise par deux, arrondi au-dessus. Les pertes, elles, tombent entier.',
      poids: c => c.finProche ? 10 : 22,
      txt: 'La lune vire au rouge. Sous cette lumiere-la, les questions faciles ' +
           'ne comptent plus : il faudra se mettre au moins 6. Et tout ce que vous ' +
           'gagnerez au-dela d une case sera coupe en deux.'
    },
    {
      id: 'cote', ico: '🎰', nom: 'GROSSE COTE', court: 'Paris doubles', betMult: 2, duree: 3,
      desc: 'Les paris rapportent et coutent deux cases au lieu d une. Ne touche que les ' +
            'parieurs, pas celui qui est sur scene.',
      poids: c => (!K.bets.enabled() || c.rang.length < 3) ? 0 : 22,
      txt: 'Les paris rapportent double a partir de maintenant. Les mauvais aussi, evidemment.'
    }
  ];

  E.byId = id => CARTES.find(c => c.id === id) || null;
  E.current = () => K.state.event;

  /**
   * Le niveau le plus bas qu une epreuve a echelle accepte en ce moment.
   * La lune de sang ferme le bas du tableau : on ne peut plus se mettre
   * 2 et repartir avec deux cases sans avoir rien risque.
   */
  E.niveauMini = function () {
    const ev = K.state.event;
    return (ev && ev.mini) || 1;
  };

  E.reset = function () {
    depuis = 0;
    K.state.event = null;
    E.render();
  };

  /* ---------------------------------------------------------
     Lecture de la situation
     --------------------------------------------------------- */
  function lecture() {
    const rang = K.ranking();
    const tete = rang[0];
    const dernier = rang[rang.length - 1];
    const second = rang[1] || dernier;
    const last = K.board.last();
    return {
      rang, tete, dernier, second, last,
      ecart: tete.pos - dernier.pos,
      avance: tete.pos - second.pos,
      finProche: K.rules.isTerminus()
        ? (last - tete.pos) <= 6
        : K.state.turn >= K.state.settings.maxTurns
    };
  }

  function tirage(cartes) {
    const total = cartes.reduce((n, x) => n + x.w, 0);
    let r = Math.random() * total;
    for (const x of cartes) { r -= x.w; if (r <= 0) return x.c; }
    return cartes[cartes.length - 1].c;
  }

  /** fait vieillir l evenement en cours d un tour de joueur */
  function vieillit() {
    const ev = K.state.event;
    if (!ev) return;
    ev.reste = (ev.reste || 1) - 1;
    if (ev.reste <= 0) K.state.event = null;
    /* on redessine meme quand la regle tient encore : c est le compteur
       de tours restants qui vient de bouger, et c est la seule chose qui
       dit quand ca va s arreter */
    E.render();
  }

  /* ---------------------------------------------------------
     Le declenchement
     --------------------------------------------------------- */
  /**
   * Appele apres chaque tour de joueur. Renvoie l evenement
   * declenche, ou null s il ne se passe rien.
   */
  E.maybe = async function () {
    if (K.state.settings.evenements === false) return null;
    depuis++;
    vieillit();
    if (K.state.event) return null;      /* un seul a la fois */
    if (depuis < REPOS) return null;

    const c = lecture();
    const pesees = CARTES.map(carte => ({ c: carte, w: carte.poids(c) })).filter(x => x.w > 0);
    if (!pesees.length) return null;

    const reclamees = pesees.filter(x => x.w >= APPEL);
    const carte = reclamees.length ? tirage(reclamees)
                : (U.rnd(100) < SURPRISE ? tirage(pesees) : null);
    if (!carte) return null;

    return E.fire(carte, c);
  };

  /** declenche une carte donnee (sert aussi aux tests) */
  E.fire = async function (carte, c) {
    c = c || lecture();
    depuis = 0;

    /* on ne touche jamais a la carte d origine : elle resservira */
    const ev = Object.assign({}, carte, { reste: carte.duree || 1 });
    if (!carte.immediat) { K.state.event = ev; E.render(); }

    await annonce(ev, c);

    if (carte.immediat) {
      /* la maree ne doit pas etre doublee ni inversee par une autre regle */
      await K.game.applyResults(await carte.effet(c), true);
      K.state.event = null;
      E.render();
    }
    return ev;
  };

  async function annonce(ev, c) {
    /* Kwa decouvre ca en meme temps que la table */
    K.kwa.setMood('what');
    const d = { fn: 'fx', id: ev.id, nom: ev.nom, court: ev.court };
    K.net && K.net.ev('anim', d);
    await K.anim.fx(d);
    await K.kwa.say(typeof ev.txt === 'function' ? ev.txt(c) : ev.txt, { mood: 'what' });
  }

  /* ---------------------------------------------------------
     L animation sur le plateau
     Chaque regle a sa propre maniere d envahir la foret.
     --------------------------------------------------------- */
  const DECORS = {
    champignons: { cls: 'fx-champi', emo: ['🍄', '🍄', '🟤'], n: 16 },
    vent:        { cls: 'fx-vent',   emo: ['🍃', '🌿', '🍂'], n: 18 },
    nuit:        { cls: 'fx-nuit',   emo: ['✨', '⭐', '🌙'], n: 20 },
    inversion:   { cls: 'fx-inv',    emo: ['🔄', '↔️', '🔃'], n: 12 },
    treve:       { cls: 'fx-treve',  emo: ['🕊️', '✨', '🤍'], n: 14 },
    faim:        { cls: 'fx-faim',   emo: ['🍽️', '🍖', '😋'], n: 12 },
    cote:        { cls: 'fx-cote',   emo: ['🪙', '💰', '🎰'], n: 18 }
  };

  K.anim.fx = async function (d) {
    const el = U.$('#boardFx');
    if (!el) return;
    const deco = DECORS[d.id] || DECORS.nuit;

    let bits = '';
    for (let i = 0; i < deco.n; i++) {
      bits += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;' +
              'top:' + (Math.random() * 100).toFixed(1) + '%;' +
              'animation-delay:' + (Math.random() * 0.9).toFixed(2) + 's;' +
              'font-size:' + (16 + Math.random() * 22).toFixed(0) + 'px">' +
              deco.emo[i % deco.emo.length] + '</i>';
    }

    el.className = 'board-fx ' + deco.cls;
    el.innerHTML = '<div class="fx-parts">' + bits + '</div>' +
      '<div class="fx-plaque"><span class="fx-ico">' + (E.byId(d.id) || {}).ico + '</span>' +
      '<b>' + U.esc(d.nom) + '</b><small>' + U.esc(d.court) + '</small></div>';
    el.hidden = false;

    K.audio.crash();
    U.buzz([25, 45, 25]);
    await U.sleep(2200);
    el.hidden = true;
    el.innerHTML = '';
    el.className = 'board-fx';
  };

  /* ---------------------------------------------------------
     La pastille en haut a droite

     Une regle qui dure trois tours doit rester sous les yeux :
     l ancien bandeau pleine largeur se faisait oublier des la
     premiere epreuve. La pastille reste dans le coin, affiche
     combien de tours de joueur il reste, et s ouvre au clic pour
     rappeler exactement ce que la regle fait.
     --------------------------------------------------------- */
  E.render = function () {
    const el = U.$('#hudEvent');
    if (!el) return;
    const ev = K.state.event;

    if (!ev) {
      el.hidden = true;
      el.innerHTML = '';
      el.classList.remove('neuf');
      delete el.dataset.ouvert;
      ambiance(null);
      majCible();
      return;
    }

    const reste = ev.reste || 1;
    el.innerHTML =
      '<span class="he-ico">' + ev.ico + '</span>' +
      '<i class="he-reste">' + reste + '</i>' +
      '<span class="he-bulle"><b>' + U.esc(ev.nom) + '</b>' +
        '<small>' + U.esc(ev.court) + ' · ' + tours(reste) + '</small></span>';
    el.hidden = false;

    /* une regle qui vient de tomber ouvre sa bulle toute seule quelques
       secondes : au survol ensuite, et au clic pour le detail. Sur les
       telephones il n y a pas de survol — c est ce moment-la qui dit ce
       que la pastille signifie. */
    if (el.dataset.ouvert !== ev.id) {
      el.dataset.ouvert = ev.id;
      el.classList.add('neuf');
      setTimeout(() => {
        const x = U.$('#hudEvent');
        if (x && x.dataset.ouvert === ev.id) x.classList.remove('neuf');
      }, 4200);
    }
    ambiance(ev);
    majCible();
  };

  /** "encore 2 tours" : des tours de joueur, pas des tours de table */
  function tours(n) {
    return n <= 1 ? 'dernier tour' : 'encore ' + n + ' tours';
  }

  /**
   * Le panneau de rappel, au clic sur la pastille.
   * Il dit ce que la regle fait, combien de joueurs doivent encore
   * passer avant qu elle tombe, et qui elle vise en ce moment.
   */
  E.detail = function () {
    const ev = K.state.event;
    if (!ev) return;
    const vise = cibleId();
    const p = vise ? K.player(vise) : null;
    const reste = ev.reste || 1;

    K.audio.tap();
    U.ovShell(ev.ico, ev.nom, ev.court,
      '<div class="ev-reste"><b>' + reste + '</b>' +
        '<small>tour' + (reste > 1 ? 's' : '') + ' de joueur avant la fin</small></div>' +
      '<p class="hint">' + U.esc(ev.desc || ev.court) + '</p>' +
      (p
        ? '<div class="rule"><h4><span>' + ev.ico + '</span>Vise en ce moment</h4>' +
          '<p><b style="color:' + p.hex + '">' + U.esc(p.name) + '</b> — case ' + p.pos +
          '. Ca change des que le classement change.</p></div>'
        : ''),
      '<button class="btn btn-xl btn-primary" id="evOk">Compris</button>');
    const b = U.$('#evOk');
    if (b) b.addEventListener('click', U.closeOverlay, { once: true });
  };

  /* ---------------------------------------------------------
     L ambiance sur le terrain

     La regle ne se lit pas seulement dans un coin de l ecran :
     elle se voit sur la foret pendant toute sa duree. Peu
     d elements, et rien d autre que transform et opacity — il y a
     deja cent decors qui balancent derriere.
     --------------------------------------------------------- */
  const AMBIANCES = {
    vent:      { cls: 'amb-vent',  emo: ['🍃', '🌿', '🍂'], n: 7 },
    nuit:      { cls: 'amb-nuit',  emo: ['✨', '⭐', '🌙'], n: 9 },
    inversion: { cls: 'amb-inv',   emo: ['🔄', '↩️'],       n: 7 },
    treve:     { cls: 'amb-treve', emo: ['🕊️', '🤍'],       n: 7 },
    faim:      { cls: 'amb-faim',  emo: ['🍽️', '🍖', '🥄'], n: 7 },
    cote:      { cls: 'amb-cote',  emo: ['🪙', '💰'],       n: 8 },
    lune:      { cls: 'amb-lune',  emo: ['🌑', '🩸', '🕸️'], n: 9 }
  };

  function ambiance(ev) {
    const el = U.$('#ambiance');
    if (!el) return;
    const deco = ev && AMBIANCES[ev.id];
    if (!deco) {
      el.hidden = true;
      el.innerHTML = '';
      el.className = 'ambiance';
      delete el.dataset.ev;
      return;
    }
    /* deja en place : on ne relance pas les animations a chaque tour */
    if (el.dataset.ev === ev.id) return;
    el.dataset.ev = ev.id;

    let bits = '';
    for (let i = 0; i < deco.n; i++) {
      bits += '<i style="--v:' + i + ';left:' + ((i * 97) % 100) + '%;' +
        'top:' + (18 + ((i * 61) % 66)) + '%;' +
        'animation-delay:-' + (i * 0.9).toFixed(2) + 's;' +
        'font-size:' + (17 + (i % 4) * 6) + 'px">' + deco.emo[i % deco.emo.length] + '</i>';
    }
    el.className = 'ambiance ' + deco.cls;
    el.innerHTML = bits;
    el.hidden = false;
  }

  /* ---------------------------------------------------------
     Qui la regle vise
     --------------------------------------------------------- */
  /** l id du joueur sur qui la regle en cours s acharne, ou null */
  function cibleId() {
    const ev = K.state.event;
    if (!ev || !ev.taxe) return null;      /* seul le vent contraire vise */
    const tete = K.ranking()[0];
    return tete ? tete.id : null;
  }
  E.cible = cibleId;

  /** repose le marqueur sur le bon pion : le meneur peut changer */
  function majCible() {
    const ev = K.state.event;
    K.pawns.setVise(cibleId(), ev ? ev.ico : '');
  }
  E.majCible = majCible;

  /* ---------------------------------------------------------
     Application aux deplacements
     --------------------------------------------------------- */
  E.apply = function (results) {
    const ev = K.state.event;
    if (!ev || !results || !results.length) return results;

    const out = results.map(r => Object.assign({}, r));

    if (ev.invert) out.forEach(r => { r.delta = -r.delta; });
    if (ev.mult) out.forEach(r => { r.delta *= ev.mult; });
    /* la lune de sang coupe les avancees en deux, jamais les reculs :
       arrondi au-dessus, pour qu un gain de 3 rapporte encore 2 et
       qu on ne rentre jamais bredouille d une bonne reponse */
    if (ev.demi) out.forEach(r => { if (r.delta > 1) r.delta = Math.ceil(r.delta / 2); });
    if (ev.treve) out.forEach(r => { if (r.delta < 0) r.delta = 0; });

    /* le vent contraire : celui qui mene paie pour ceux qui avancent */
    if (ev.taxe) {
      const gagnants = out.filter(r => r.delta > 0);
      const leader = K.ranking()[0];
      if (gagnants.length && leader && !gagnants.some(r => r.id === leader.id)) {
        const deja = out.find(r => r.id === leader.id);
        if (deja) deja.delta -= gagnants.length;
        else out.push({ id: leader.id, delta: -gagnants.length, why: 'du vent contraire' });
      }
    }
    return out;
  };

})(window.KWA);
