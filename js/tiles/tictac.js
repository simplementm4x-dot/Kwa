/* =========================================================
   CASE — TIC-TAC

   Un temps a atteindre, entre 4 et 15 secondes. On lance quand
   on veut, on arrete quand on pense y etre. Aucun chronometre
   a l ecran : c est le principe, on compte dans sa tete et on
   se trompe.

   Dans la meme piece, on joue a tour de role et personne ne
   connait le resultat des autres avant la fin — sinon le
   dernier a jouer saurait exactement quoi battre.

   Chacun chez soi, tout le monde joue en meme temps sur le
   meme temps a atteindre : il n y a plus rien a cacher, et ca
   fait dix secondes ou personne n attend son tour.

   Le classement paie pareil dans les deux cas : le plus proche
   prend 2 cases, le deuxieme 1, le dernier en perd 1.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  /* les bornes du temps a atteindre, en secondes */
  const MINI = 4;
  const MAXI = 15;

  /** le temps vise, tire au hasard, au demi-seconde pres */
  function cible() {
    const pas = (MAXI - MINI) * 2;              /* de 4 a 15 par demi-secondes */
    return MINI + U.rnd(pas + 1) / 2;
  }

  /** l ecart d un joueur au temps vise, en secondes */
  const ecart = (ms, but) => Math.abs(ms / 1000 - but);

  /** deux decimales, sans zeros inutiles */
  const sec = v => (Math.round(v * 100) / 100).toFixed(2).replace(/0$/, '');

  K.registerTile('tictac', async function (ctx) {
    const joueurs = ctx.players.filter(p => !p.off);
    if (joueurs.length < 2) {
      await K.kwa.say('TIC-TAC ! ...il faut etre au moins deux. On passe.', { auto: 1400 });
      return [];
    }

    const but = cible();
    await K.kwa.say('TIC-TAC ! Le temps a atteindre : ' + sec(but) + ' secondes. ' +
      'Vous lancez quand vous voulez, vous arretez quand vous y croyez. ' +
      'Et non, il n y aura pas de chronometre.', { mood: 'oh' });

    const spec = {
      kind: 'tictac', icon: '⏱️', noPass: false,
      title: 'Tic-Tac', sub: sec(but) + ' secondes a atteindre',
      but,
      passMsg: 'A toi. Compte dans ta tete, personne ne verra ton resultat.'
    };

    /* --- les temps de chacun --- */
    const temps = {};
    if (K.simultane.possible()) {
      await K.kwa.say('Tout le monde joue en meme temps. Trois, deux, un...',
        { auto: 1200, mood: 'wink' });
      K.scene.montre(K.scene.liste({
        cat: 'Tic-Tac', texte: sec(but) + ' secondes a atteindre',
        items: ['Lance quand tu veux', 'Arrete quand tu y crois', 'Aucun chronometre'],
        pied: 'Tout le monde joue en meme temps'
      }));
      const rep = await K.simultane.demande(joueurs, spec, { ms: 60000 });
      K.scene.cache();
      Object.keys(rep).forEach(id => { if (rep[id] > 0) temps[id] = rep[id]; });
    } else {
      /* dans la meme piece : chacun son tour, resultats caches */
      for (const p of joueurs) {
        const ms = await K.ask(p, spec);
        U.closeOverlay();
        if (ms > 0) temps[p.id] = ms;
        await K.kwa.say('C est note. Et non, je ne dis rien.', { auto: 900, mood: 'wink' });
      }
    }

    /* --- le classement --- */
    const rangs = joueurs
      .filter(p => temps[p.id])
      .map(p => ({ p, e: ecart(temps[p.id], but) }))
      .sort((a, b) => a.e - b.e);

    if (!rangs.length) {
      await K.kwa.say('Personne n a joue. Bon.', { auto: 1200 });
      return [];
    }

    await U.panelAuto('⏱️', 'Tic-Tac', sec(but) + ' secondes a atteindre',
      '<div class="res-list">' + rangs.map((r, i) =>
        '<div class="res" style="border-left-color:' + r.p.hex + '">' +
          '<span class="rank-pos">' + (i + 1) + '</span>' +
          '<span class="rank-av" style="--pc:' + r.p.hex + '">' +
            K.sprites.avatar(r.p, 30) + '</span>' +
          '<b>' + U.esc(r.p.name) + '</b>' +
          '<span class="tt-temps">' + sec(temps[r.p.id] / 1000) + 's' +
            '<small>' + (temps[r.p.id] / 1000 > but ? '+' : '−') + sec(r.e) + '</small></span>' +
        '</div>').join('') + '</div>',
      1400 + rangs.length * 420);

    const gagnant = rangs[0];
    await K.kwa.say(gagnant.e < 0.3
      ? 'A ' + sec(gagnant.e) + ' seconde ! ' + gagnant.p.name + ', tu as une horloge dans la tete.'
      : gagnant.p.name + ' s en approche le plus, a ' + sec(gagnant.e) + ' seconde pres.',
      { auto: 1800, mood: 'oh' });

    return K.simultane.recompense(rangs.map(r => r.p));
  });

})(window.KWA);
