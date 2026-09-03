/* =========================================================
   CASE — LE CLICHE

   Une photo arrive completement floue et se resout en six
   secondes. Quatre reponses, toutes de la meme famille. Plus
   on repond tot, plus on gagne : +4 tant que c est illisible,
   +3 quand ca se devine, +2 quand c est net et que n importe
   qui aurait trouve.

   Toute la tension est la. Attendre la nettete, c est jouer
   pour deux cases ; se lancer sur une tache verte, c est en
   viser quatre et se planter devant tout le monde.

   Les photos viennent de Wikimedia Commons via js/data/cliche.js,
   fige a l avance par tools/cliche.js : le jeu ne fait aucun
   appel d API, il charge des images.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  /* ce que rapporte une bonne reponse selon le moment ou elle tombe */
  const GAINS = [4, 3, 2];
  /* et ce que coute une mauvaise, quel que soit le moment */
  const RATE = -1;

  /**
   * Trois mauvaises reponses. On les prend d abord dans la meme
   * categorie : proposer un koala entre une tour Eiffel et un
   * saxophone donnerait la reponse sans regarder la photo.
   */
  function leurres(bonne, banque) {
    const meme = banque.filter(x => x.c === bonne.c && x.r !== bonne.r);
    const reste = banque.filter(x => x.c !== bonne.c && x.r !== bonne.r);
    return U.shuffle(meme).concat(U.shuffle(reste)).slice(0, 3);
  }

  K.registerTile('cliche', async function (ctx) {
    const p = ctx.player;
    const banque = K.CLICHES || [];
    if (banque.length < 4) {
      await K.kwa.say('Mon appareil photo est vide. On passe.', { auto: 1200, mood: 'wink' });
      return [];
    }

    const bonne = U.draw('cliches', banque);
    const choix = U.shuffle([bonne].concat(leurres(bonne, banque)));
    const good = choix.findIndex(x => x.r === bonne.r);

    await K.kwa.say('LE CLICHE ! Une photo, encore floue. Plus tu reponds tot, plus tu prends.',
      { mood: 'oh' });

    /* la photo vient d internet : on ne lance pas l epreuve sur une
       image qui n arrivera pas */
    const arrivee = await U.precharge(bonne.u, 6000);
    if (!arrivee) {
      await K.kwa.say('...et la photo n arrive pas. Pas de reseau, pas de cliche. ' +
        'Personne ne bouge.', { auto: 1800, mood: 'what' });
      return [];
    }

    const rep = await K.ask(p, {
      kind: 'photo', icon: '📷',
      title: 'Le Cliche', sub: bonne.c,
      intro: 'Quatre reponses. La photo se precise, mais le gain fond.',
      passMsg: 'A toi de reconnaitre la photo.',
      url: bonne.u, choices: choix.map(x => x.r), good, gains: GAINS
    });
    U.closeOverlay();

    const ok = !!rep && rep.k === good;
    const delta = ok ? (GAINS[rep.phase] || GAINS[GAINS.length - 1]) : RATE;
    if (ok) p.stats.correct++; else p.stats.wrong++;

    const quand = ok
      ? (rep.phase === 0 ? 'Dans le flou complet. Enorme.'
        : rep.phase === 1 ? 'Avant que ce soit net. Propre.'
        : 'Une fois nette. Ca compte quand meme.')
      : 'C etait ' + bonne.r + '.';

    await U.panel(ok ? '📸' : '💀', ok ? 'Trouve !' : 'Rate...', bonne.c,
      '<div class="ph-verdict"><img src="' + U.esc(bonne.u) + '" alt=""><b>' +
        U.esc(bonne.r) + '</b></div>' +
      U.verdict(ok, ok ? '📸' : '💀',
        ok ? '+' + delta + ' ' + U.cases(delta).toUpperCase() : RATE + ' CASE', quand));
    U.closeOverlay();

    await K.kwa.say(ok
      ? p.name + ' a l oeil. ' + U.cases(delta) + '.'
      : p.name + ' voyait autre chose. Une case en arriere.',
      { auto: 1400, mood: ok ? 'happy' : 'wink' });

    return [{ id: p.id, delta }];
  });

})(window.KWA);
