/* =========================================================
   LES PARIS
   Le point faible du jeu, c est le moment ou un joueur est sur
   scene et ou les autres regardent. On leur donne quelque chose
   a perdre : ils misent sur lui avant qu il commence.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const B = K.bets = {};

  const MISE = 1;   /* bon pari : +1 case, mauvais : -1 */

  /**
   * Un seul telephone qu il faudrait faire tourner autour de la table
   * pour recueillir les mises avant chaque epreuve : a dix joueurs
   * c est interminable, et ca casse justement le rythme qu on cherche.
   * Les paris demandent donc que chacun ait son ecran.
   */
  B.enabled = function () {
    return K.state.settings.paris !== false && K.state.settings.device === 'multi';
  };

  /**
   * Demande a tous les autres joueurs s ils croient en celui qui monte
   * sur scene. Renvoie { id du parieur -> 'a' (il gagne) | 'b' (il se plante) }
   * ou null quand personne ne peut parier.
   */
  B.collect = async function (star, tile, players, sujet) {
    if (!B.enabled()) return null;
    const autres = players.filter(p => p.id !== star.id);
    if (!autres.length) return null;

    const info = K.TILE_TYPES[tile.type] || {};
    const gros = B.multiplier() > 1;

    /* On mise apres avoir vu le sujet, jamais avant : parier sur
       quelqu un n a de sens que si on sait sur quoi il tombe. */
    await K.kwa.say('Les paris sont ouverts ! ' + star.name + ' s attaque a ' +
      (sujet ? '"' + sujet + '"' : (info.label || 'l epreuve')) +
      '.' + (gros ? ' Et ce tour-ci, ca rapporte double.' : ''), { mood: 'wink' });

    const mises = {};
    for (const p of autres) {
      mises[p.id] = await K.ask(p, {
        kind: 'choice', icon: '🎰',
        title: 'Il s en sort ?',
        sub: sujet ? star.name + ' · ' + sujet : 'Pari sur ' + star.name,
        intro: 'Bon pari : +' + (MISE * B.multiplier()) + ' case(s). Mauvais pari : autant en moins. ' +
               'Tu paries sur le fait qu il gagne des cases, pas sur sa dignite.',
        passMsg: 'Ton pari reste secret jusqu au resultat.',
        a: 'IL GAGNE DES CASES', b: 'IL SE PLANTE'
      });
      U.closeOverlay();
    }
    return mises;
  };

  /** un evenement de foret peut doubler la mise */
  B.multiplier = function () {
    const ev = K.state.event;
    return ev && ev.betMult ? ev.betMult : 1;
  };

  /**
   * Regle les paris une fois l epreuve terminee.
   * On ne juge que sur un point : la vedette a-t-elle gagne des cases ?
   */
  /**
   * Tout le monde a mise pareil : le pari n en etait pas un.
   * A deux joueurs il n y a qu un parieur : il tranche seul, donc il
   * prend un vrai risque — ce n est pas une unanimite.
   */
  B.unanime = function (mises) {
    const ids = Object.keys(mises || {});
    if (ids.length < 2) return false;
    const oui = ids.filter(id => mises[id] === 'a').length;
    return oui === 0 || oui === ids.length;
  };

  /**
   * Regle les paris une fois l epreuve terminee.
   * On ne juge que sur un point : la vedette a-t-elle gagne des cases ?
   *
   * Quand tout le monde a parie pareil, personne ne bouge : sans cela,
   * les joueurs miseraient tous sur la reussite — c est le cas le plus
   * frequent — et le plateau entier deriverait vers le haut sans que
   * personne n ait rien risque.
   */
  B.settle = function (mises, gainStar, star) {
    if (!mises || B.unanime(mises)) return [];
    const reussi = gainStar > 0;
    const m = MISE * B.multiplier();
    return Object.keys(mises).map(id => {
      const bon = (mises[id] === 'a') === reussi;
      return { id, delta: bon ? m : -m, pari: true, bon };
    });
  };

  /** le tableau des paris, montre avant d appliquer les gains */
  B.recap = function (mises, gainStar, star, results) {
    const reussi = gainStar > 0;
    if (!results.length) {
      return U.panel('🎰', 'Les paris', 'Tout le monde a mise pareil',
        '<p class="hint center">Personne n a pris de risque : personne ne bouge. ' +
        'Un pari ou tout le monde est d accord n en est pas un.</p>').then(U.closeOverlay);
    }
    const rows = results.map(r => {
      const p = K.player(r.id);
      if (!p) return '';
      return '<div class="res" style="border-left-color:' + (r.bon ? '#57e08a' : '#ff5757') + '">' +
        '<span class="rank-av" style="--pc:' + p.hex + '">' + K.sprites.avatar(p, 30) + '</span>' +
        '<b>' + U.esc(p.name) + '</b>' +
        '<span class="chip">' + (mises[r.id] === 'a' ? 'il gagne' : 'il se plante') + '</span>' +
        '<span class="d ' + (r.bon ? 'up' : 'down') + '">' + (r.delta > 0 ? '+' + r.delta : r.delta) + '</span>' +
        '</div>';
    }).join('');

    return U.panel('🎰', 'Les paris', reussi
      ? U.esc(star.name) + ' a gagne des cases'
      : U.esc(star.name) + ' n a rien gagne',
      '<div class="res-list">' + rows + '</div>').then(U.closeOverlay);
  };

})(window.KWA);
