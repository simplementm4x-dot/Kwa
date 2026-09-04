/* =========================================================
   LA DERNIERE LIGNE DROITE

   Le probleme d une course : quand quelqu un prend dix cases
   d avance, la fin est jouee et les autres continuent par
   politesse. Une demi-heure de partie se termine sur un quart
   d heure ou plus personne ne joue vraiment.

   A partir du moment ou le meneur entre dans les dernieres
   cases — ou dans le dernier tour, selon le mode — tout ce que
   gagnent les POURSUIVANTS compte double. Pas les pertes : on
   accelere ceux qui reviennent, on ne punit personne. Et pas
   le meneur : il a deja son avance, il n a pas besoin d aide.

   C est volontairement brutal. Une fin de partie doit se jouer
   jusqu au dernier lance, quitte a ce que le meneur regarde
   fondre son avance en trois epreuves.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const F = K.finale = {};

  /* a combien de cases du terminus la derniere ligne droite commence */
  const LIGNE = 5;
  /* ce que gagnent les poursuivants, en multiple */
  const COEF = 2;

  F.ligne = () => LIGNE;

  /**
   * Sommes-nous dans la derniere ligne droite ?
   *
   * En terminus, c est une affaire de distance : le meneur voit
   * l arrivee. En mode tours, c est le dernier tour de table — la
   * derniere fois que chacun jouera.
   */
  F.enCours = function () {
    if (!K.state.started || K.state.over) return false;
    if (K.rules.isTerminus()) {
      const tete = K.ranking()[0];
      return !!tete && (K.board.last() - tete.pos) <= LIGNE;
    }
    return K.state.turn >= K.state.settings.maxTurns;
  };

  F.reset = function () {
    K.state.finale = false;
    peint(false);
  };

  /**
   * Appele a chaque tour. Annonce l entree dans la derniere ligne
   * droite, une seule fois, et rend true si c est ce tour-ci.
   */
  F.check = async function () {
    const dedans = F.enCours();
    if (dedans === !!K.state.finale) { peint(dedans); return false; }
    K.state.finale = dedans;
    peint(dedans);
    K.net && K.net.broadcastState();
    if (!dedans) return false;

    const tete = K.ranking()[0];
    K.audio.fanfare();
    await U.jingle('DERNIERE LIGNE DROITE', '', 1500);
    await K.kwa.say(K.rules.isTerminus()
      ? tete.name + ' voit l arrivee. A partir de maintenant, tout ce que gagnent les ' +
        'autres compte double. Les pertes, elles, restent normales.'
      : 'Dernier tour ! Tout ce que gagnent ceux qui ne menent pas compte double. ' +
        'C est maintenant ou jamais.',
      { mood: 'oh' });
    return true;
  };

  /**
   * Double les gains des poursuivants.
   * Ne touche ni les pertes, ni le meneur : on aide a revenir, on ne
   * punit pas celui qui a bien joue.
   */
  F.applique = function (results) {
    if (!K.state.finale || !results || !results.length) return results;
    const tete = K.ranking()[0];
    return results.map(r => {
      if (!r || r.delta <= 0) return r;
      if (tete && r.id === tete.id) return r;
      return Object.assign({}, r, { delta: r.delta * COEF });
    });
  };

  /* ---------------------------------------------------------
     L EPREUVE FINALE

     Arriver au terminus ne suffit pas. Une partie d une heure
     ne peut pas se terminer sur un lance de de a trois : il
     faut un dernier moment ou toute la table retient son
     souffle, et une derniere chance de tout perdre.

     Une carte au hasard, une question de niveau 8 minimum —
     donc les plus dures du paquet — et une reponse a donner
     devant tout le monde. Ratee, on recule de trois cases et
     la course repart : ceux qui suivaient ont une ouverture,
     et celui qui menait doit revenir la chercher.
     --------------------------------------------------------- */
  const RECUL = 3;
  /* les questions ouvertes du paquet commencent au niveau 7 : au-dela,
     ce sont celles ou il faut vraiment savoir */
  const NIVEAU_MINI = 8;

  F.recul = () => RECUL;
  F.niveau = () => NIVEAU_MINI;

  /**
   * Le dernier obstacle. Rend true si le joueur a gagne la partie.
   * Un echec le fait reculer, et la partie continue.
   */
  F.challenge = async function (p) {
    const card = U.draw('cards', K.CARDS || []);
    if (!card) return true;                 /* pas de contenu : on ne bloque personne */

    const niveau = NIVEAU_MINI + U.rnd(card.q.length - NIVEAU_MINI + 1);
    const q = K.question(card, niveau);
    if (!q) return true;

    await U.jingle('EPREUVE FINALE', p.name + ' est au bout du chemin', 1800);
    await K.kwa.say('Une derniere chose, ' + p.name + '. On ne franchit pas cette ligne ' +
      'sans repondre a une question. Niveau ' + niveau + ' sur 10.', { mood: 'oh' });

    const juste = q.o && q.o.length
      ? await ferme(p, card, q, niveau)
      : await ouverte(p, card, q, niveau);

    if (juste) {
      K.audio.fanfare();
      await K.kwa.say('EXACT ! ' + p.name + ' passe la ligne. La foret vous laisse partir.',
        { auto: 2000, mood: 'oh' });
      return true;
    }

    await K.kwa.say('Non. Et au bout du chemin, une erreur se paie : ' + p.name +
      ' recule de ' + U.cases(RECUL) + '. La course repart.', { mood: 'what' });
    await K.game.applyResults([{ id: p.id, delta: -RECUL, why: 'l epreuve finale' }], true);
    return false;
  };

  /** question a choix : le joueur repond seul, avec le chrono */
  async function ferme(p, card, q, niveau) {
    const ordre = U.shuffle(q.o.map((txt, i) => ({ txt, i })));
    const bonne = ordre.findIndex(o => o.i === q.a);
    K.scene.montre(K.scene.question({
      cat: 'EPREUVE FINALE · ' + card.c, titre: card.t, texte: q.q,
      choix: ordre.map(o => o.txt), duree: 20
    }));
    const k = await K.ask(p, {
      kind: 'quiz', icon: '🏁', noPass: true, duree: 20,
      title: card.t, sub: 'Epreuve finale · niveau ' + niveau,
      theme: card.t, diff: niveau, text: q.q,
      choices: ordre.map(o => o.txt), good: bonne
    });
    U.closeOverlay();
    K.scene.cache();
    return k === bonne;
  }

  /**
   * Question ouverte : il repond a voix haute devant tout le monde, la
   * reponse s affiche, et c est la table qui tranche. Le joueur ne peut
   * pas se declarer vainqueur tout seul.
   */
  async function ouverte(p, card, q, niveau) {
    K.scene.montre(K.scene.question({
      cat: 'EPREUVE FINALE · ' + card.c, titre: card.t, texte: q.q
    }));
    await K.kwa.say('La question est affichee. ' + p.name + ', on t ecoute. A voix haute.',
      { mood: 'oh' });

    K.scene.montre(K.scene.liste({
      cat: 'EPREUVE FINALE · ' + card.c,
      texte: q.q,
      items: ['La reponse : ' + q.a],
      pied: 'La table tranche'
    }));

    const juge = arbitre(p);
    const rep = await K.ask(juge || p, {
      kind: 'pacte', icon: '🏁', mood: 'oh', pid: p.id,
      title: 'Il a bon ?', sub: card.t + ' · niveau ' + niveau,
      intro: q.q + ' La reponse etait : ' + q.a,
      passMsg: 'A vous de trancher.',
      a: 'IL A BON', b: 'A COTE'
    });
    U.closeOverlay();
    K.scene.cache();
    return rep === 'a';
  }

  /** le voisin de tour tranche, quand il y a plusieurs ecrans */
  function arbitre(p) {
    const players = K.state.players;
    if (!K.net || !K.net.isActive() || players.length < 2) return null;
    const i = players.findIndex(x => x.id === p.id);
    for (let k = 1; k < players.length; k++) {
      const q = players[(i + k) % players.length];
      if (q && q.id !== p.id && !q.off) return q;
    }
    return null;
  }

  /** le plateau vire a l or quand la fin approche */
  function peint(on) {
    const el = U.$('#screen-game');
    if (el) el.classList.toggle('finale', !!on);
  }
  F.peint = peint;

})(window.KWA);
