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
      /* la carte du retardataire : plus l ecart est grand, plus elle appelle */
      poids: c => c.ecart >= 8 ? 100 : (c.ecart >= 5 ? 45 : 8),
      txt: c => 'Les champignons poussent sous ' + c.dernier.name + ' ! La foret n aime pas ' +
                'voir quelqu un se faire distancer a ce point.',
      effet(c) {
        const pousse = c.ecart >= 12 ? 8 : (c.ecart >= 8 ? 6 : 5);
        return K.state.players.map(p => ({ id: p.id, delta: p.id === c.dernier.id ? pousse : 2 }));
      }
    },
    {
      id: 'vent', ico: '🌬️', nom: 'VENT CONTRAIRE', court: 'Le meneur paie', taxe: true, duree: 3,
      /* elle sort quand quelqu un s echappe en tete */
      poids: c => c.avance >= 5 ? 85 : (c.avance >= 3 ? 35 : 10),
      txt: c => 'Le vent se leve, et il souffle droit sur ' + c.tete.name + '. ' +
                'Chaque fois que quelqu un gagne des cases, le meneur en perd une.'
    },
    {
      id: 'nuit', ico: '🌙', nom: 'LA NUIT TOMBE', court: 'Tout compte double', mult: 2, duree: 3,
      /* la nuit tombe quand la fin approche : c est la que doubler fait mal */
      poids: c => c.finProche ? 75 : 20,
      txt: 'La nuit tombe sur la foret. Tout compte double maintenant : les gains comme les gadins.'
    },
    {
      id: 'inversion', ico: '🔄', nom: 'INVERSION', court: 'Gagner = reculer', invert: true, duree: 3,
      poids: () => 25,
      txt: 'Le chemin se retourne. Gagner, c est reculer. Reculer, c est avancer. ' +
           'Reflechissez bien avant de briller.'
    },
    {
      id: 'treve', ico: '🕊️', nom: 'LA TREVE', court: 'Aucun malus', treve: true, duree: 3,
      /* une treve juste avant la fin ne ferait que geler le classement */
      poids: c => c.finProche ? 5 : 20,
      txt: 'La foret est de bonne humeur. Aucun malus ne passe : personne ne recule, quoi qu il arrive.'
    },
    {
      id: 'faim', ico: '😋', nom: 'KWA A FAIM', court: 'Epreuve au hasard', wild: true, duree: 3,
      poids: () => 18,
      txt: 'J ai faim, et quand j ai faim je choisis. L epreuve que vous jouez ne sera plus ' +
           'celle de votre case. Ce sera la mienne.'
    },
    {
      id: 'cote', ico: '🎰', nom: 'GROSSE COTE', court: 'Paris doubles', betMult: 2, duree: 3,
      poids: c => (!K.bets.enabled() || c.rang.length < 3) ? 0 : 22,
      txt: 'Les paris rapportent double a partir de maintenant. Les mauvais aussi, evidemment.'
    }
  ];

  E.byId = id => CARTES.find(c => c.id === id) || null;
  E.current = () => K.state.event;

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
    if (ev.reste <= 0) { K.state.event = null; E.render(); }
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
      await K.game.applyResults(carte.effet(c), true);
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
     Le bandeau qui rappelle la regle du moment
     --------------------------------------------------------- */
  E.render = function () {
    const el = U.$('#hudEvent');
    if (!el) return;
    const ev = K.state.event;
    if (!ev) { el.hidden = true; el.innerHTML = ''; return; }
    el.innerHTML = '<span class="he-ico">' + ev.ico + '</span>' +
      '<b>' + U.esc(ev.nom) + '</b><small>' + U.esc(ev.court) + '</small>';
    el.hidden = false;
  };

  /* ---------------------------------------------------------
     Application aux deplacements
     --------------------------------------------------------- */
  E.apply = function (results) {
    const ev = K.state.event;
    if (!ev || !results || !results.length) return results;

    const out = results.map(r => Object.assign({}, r));

    if (ev.invert) out.forEach(r => { r.delta = -r.delta; });
    if (ev.mult) out.forEach(r => { r.delta *= ev.mult; });
    if (ev.treve) out.forEach(r => { if (r.delta < 0) r.delta = 0; });

    /* le vent contraire : celui qui mene paie pour ceux qui avancent */
    if (ev.taxe) {
      const gagnants = out.filter(r => r.delta > 0);
      const leader = K.ranking()[0];
      if (gagnants.length && leader && !gagnants.some(r => r.id === leader.id)) {
        const deja = out.find(r => r.id === leader.id);
        if (deja) deja.delta -= gagnants.length;
        else out.push({ id: leader.id, delta: -gagnants.length, why: 'vent contraire' });
      }
    }
    return out;
  };

})(window.KWA);
