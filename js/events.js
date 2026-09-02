/* =========================================================
   LES EVENEMENTS DE FORET
   A chaque nouveau tour de table, la foret change une regle.
   L interet n est pas l effet lui-meme mais le fait qu il soit
   annonce avant : on joue le tour en sachant que tout compte
   double, ou que gagner veut dire reculer.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const E = K.events = {};

  const CARTES = [
    { id: 'nuit', ico: '🌙', nom: 'LA NUIT TOMBE',
      txt: 'Tout compte double cette manche. Les gains comme les gadins.',
      court: 'Tout compte double', mult: 2 },

    { id: 'inversion', ico: '🔄', nom: 'INVERSION',
      txt: 'Cette manche, gagner c est reculer, et reculer c est avancer. Reflechissez bien avant de briller.',
      court: 'Gagner = reculer', invert: true },

    { id: 'treve', ico: '🕊️', nom: 'LA TREVE',
      txt: 'La foret est de bonne humeur : aucun malus ne s applique cette manche. Personne ne recule.',
      court: 'Aucun malus', treve: true },

    { id: 'vent', ico: '🌬️', nom: 'VENT CONTRAIRE',
      txt: 'Chaque fois que quelqu un gagne des cases, celui qui est en tete en perd une.',
      court: 'Le leader paie', taxe: true },

    { id: 'faim', ico: '😋', nom: 'KWA A FAIM',
      txt: 'Cette manche, l epreuve jouee n est pas celle de votre case. C est moi qui choisis.',
      court: 'Epreuve au hasard', wild: true },

    { id: 'cote', ico: '🎰', nom: 'GROSSE COTE',
      txt: 'Les paris rapportent double cette manche. Les mauvais aussi, evidemment.',
      court: 'Paris doubles', betMult: 2 },

    { id: 'champignons', ico: '🍄', nom: 'MAREE DE CHAMPIGNONS',
      txt: 'Tout le monde avance de 2 cases. Le dernier du classement, lui, avance de 5.',
      court: 'Coup de pouce', immediat: true }
  ];

  /** l effet en cours, ou null */
  E.current = () => K.state.event;

  E.clear = function () {
    K.state.event = null;
    E.render();
  };

  /** le bandeau qui rappelle la regle du moment */
  E.render = function () {
    const el = U.$('#hudEvent');
    if (!el) return;
    const ev = K.state.event;
    if (!ev) { el.hidden = true; el.innerHTML = ''; return; }
    el.innerHTML = '<span class="he-ico">' + ev.ico + '</span>' +
      '<b>' + U.esc(ev.nom) + '</b><small>' + U.esc(ev.court) + '</small>';
    el.hidden = false;
  };

  /** retrouve une carte par son identifiant (les autres ecrans n ont que ca) */
  E.byId = id => CARTES.find(c => c.id === id) || null;

  /**
   * Tire une carte et l annonce. Seul l hote tire : les autres ecrans
   * recoivent l identifiant avec l etat de la partie.
   */
  E.draw = async function () {
    if (K.state.settings.evenements === false) return null;
    const ev = U.draw('evenement', CARTES);
    if (!ev) return null;
    K.state.event = ev;
    E.render();

    await U.jingle(ev.nom, ev.court, 1600);
    await K.kwa.say(ev.txt, { mood: 'oh' });

    /* effet immediat : il s applique au moment de l annonce, pas au fil du tour */
    if (ev.immediat) {
      const rang = K.ranking();
      const dernier = rang[rang.length - 1];
      const res = K.state.players.map(p => ({
        id: p.id, delta: p.id === dernier.id ? 5 : 2
      }));
      /* la maree ne doit pas etre doublee ni inversee par sa propre carte */
      await K.game.applyResults(res, true);
      K.state.event = null;
      E.render();
    }
    return ev;
  };

  /* ---------------------------------------------------------
     Application aux deplacements
     --------------------------------------------------------- */
  /**
   * Transforme les gains d une epreuve selon la regle du moment.
   * Renvoie les resultats modifies, plus l eventuelle taxe du leader.
   */
  E.apply = function (results) {
    const ev = K.state.event;
    if (!ev || !results || !results.length) return results;

    let out = results.map(r => Object.assign({}, r));

    if (ev.invert) out.forEach(r => { r.delta = -r.delta; });
    if (ev.mult) out.forEach(r => { r.delta *= ev.mult; });
    if (ev.treve) out.forEach(r => { if (r.delta < 0) r.delta = 0; });

    /* le vent contraire : celui qui mene paie pour les autres */
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
