/* =========================================================
   CASE — LE MOT RACCORD
   Une lettre, 30 secondes, une liste a completer.
   Chaque mot valide par le groupe = 1 case. Carton plein = +1.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const DUREE = 30;
  const NB = 5;

  /**
   * Qui tient le carnet.
   *
   * Le joueur interroge ne peut pas etre son propre jury : cocher ses
   * propres mots pendant qu il les cherche, c est se noter soi-meme, et
   * ca occupe les mains de celui qui devrait parler. Des qu il y a
   * plusieurs ecrans, le carnet passe donc au joueur suivant — chacun
   * se fait juger par son voisin, ce qui reste symetrique.
   *
   * A un seul telephone, personne ne peut cocher sans voir l ecran du
   * joueur : on garde le fonctionnement d avant.
   */
  function jury(p, players) {
    const plusieursEcrans = K.net && K.net.isActive() && players.length > 1;
    if (!plusieursEcrans) return null;
    const i = players.findIndex(x => x.id === p.id);
    for (let k = 1; k < players.length; k++) {
      const q = players[(i + k) % players.length];
      if (q && q.id !== p.id && !q.off) return q;
    }
    return null;
  }

  K.registerTile('motraccord', async function (ctx) {
    const p = ctx.player;
    const data = K.MOTRACCORD;
    const letter = U.draw('mrLetter', data.letters);
    const pool = K.state.settings.spicy ? data.prompts : data.prompts.filter(x => !x.spicy);

    /* cinq consignes differentes */
    const items = [];
    const seen = {};
    let guard = 0;
    while (items.length < NB && guard++ < 200) {
      const it = U.draw('mrPrompt', pool);
      if (!it || seen[it.q]) continue;
      seen[it.q] = 1;
      items.push(it.q);
    }

    const carnet = jury(p, ctx.players);

    await K.kwa.say('LE MOT RACCORD ! La lettre du jour : ' + letter + '. ' + p.name + ' a 30 secondes' +
      (carnet ? ', et c est ' + carnet.name + ' qui tient le carnet.' : '.'), { mood: 'oh' });

    await U.panel('🔤', 'La regle', 'Lettre imposee : ' + letter,
      '<div class="rule"><h4><span>🅰️</span>Un seul principe</h4><p>Chaque reponse doit commencer par la lettre <b>' +
      letter + '</b>. Cinq trucs a completer, 30 secondes pour tout envoyer.</p></div>' +
      '<div class="rule"><h4><span>👥</span>Le jury</h4><p>' +
      (carnet
        ? 'Le groupe decide si le mot passe, et c est <b>' + U.esc(carnet.name) +
          '</b> qui coche sur son telephone. ' + U.esc(p.name) + ' parle, il ne touche a rien.'
        : 'Le groupe decide si le mot passe. On coche au fur et a mesure.') +
      ' Un mot valide = 1 case. Les cinq = 1 case bonus.</p></div>' +
      (K.state.settings.spicy
        ? '<div class="rule"><h4><span>🌶️</span>Mode epice</h4><p>Certaines cartes partent loin. ' +
          'Vous pouvez le desactiver dans les reglages.</p></div>'
        : ''),
      'Chrono !');
    U.closeOverlay();

    /* tout le monde doit voir les consignes et la lettre, y compris
       celui qui cherche : le carnet est chez quelqu un d autre */
    if (carnet) {
      U.spotlight(
        '<div class="mr-public">' +
          '<div class="letter-big">' + U.esc(letter) + '</div>' +
          '<ul>' + items.map(it => '<li>' + U.esc(it) + '</li>').join('') + '</ul>' +
          '<small>' + U.esc(carnet.name) + ' tient le chrono et coche</small>' +
        '</div>');
    }

    const n = await K.ask(carnet || p, {
      kind: 'raccord', icon: '🔤', noPass: true,
      sub: carnet ? 'Tu juges ' + p.name : p.name + ' · tout commence par ' + letter,
      jury: carnet ? p.name : '',
      letter, items, duration: DUREE
    });
    U.closeOverlay();
    if (carnet) U.clearSpotlight();

    const bonus = n >= items.length ? 1 : 0;
    const total = n + bonus;
    total ? K.audio.fanfare() : K.audio.bad();

    await U.panel(total ? '🎉' : '😶', 'Resultat', '',
      U.verdict(!!total, bonus ? '💯' : (total ? '👏' : '😶'),
        '+' + total + (total > 1 ? ' CASES' : ' CASE'),
        n + ' mot' + (n > 1 ? 's valides' : ' valide') + ' sur ' + items.length +
        (bonus ? '<br><b>CARTON PLEIN : +1 case bonus !</b>' : '')));
    U.closeOverlay();

    return [{ id: p.id, delta: total }];
  });

})(window.KWA);
