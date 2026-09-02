/* =========================================================
   CASE — MIME EN FOLIE
   Les autres miment, le joueur de la case devine. 30 secondes.
   Chaque mime trouve = 1 case.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const DUREE = 30;

  K.registerTile('mime', async function (ctx) {
    const p = ctx.player;
    const others = ctx.players.filter(x => x.id !== p.id);
    if (!others.length) return [];

    /* le telephone du chrono reste chez un mimeur, jamais chez celui qui devine */
    const runner = U.pick(others);

    await K.kwa.say('MIME EN FOLIE ! ' + p.name + ' devine, les autres miment. 30 secondes, pas une de plus.', { mood: 'oh' });

    await U.panel('🤾', 'Preparation', 'Chrono chez ' + runner.name,
      '<div class="rule"><h4><span>📱</span>L ecran</h4><p>C est <b>' + U.esc(runner.name) +
      '</b> qui tient le chrono. <b>' + U.esc(p.name) + '</b> ne doit surtout pas voir l ecran.</p></div>' +
      '<div class="rule"><h4><span>🤫</span>La regle</h4><p>Aucun son, aucun mot, aucun bruit de bouche. ' +
      'On mime, point. Chaque trouvaille = 1 case pour ' + U.esc(p.name) + '.</p></div>' +
      '<div class="rule"><h4><span>⏱️</span>Le chrono</h4><p>Bouton vert quand c est trouve, ' +
      '"Passer" si le mot est infaisable.</p></div>',
      'Chrono !');
    U.closeOverlay();

    const found = await K.ask(runner, {
      kind: 'mime', icon: '🤾', passMsg: 'Tu tiens le chrono. Ne montre pas l ecran a ' + p.name + '.',
      sub: p.name + ' devine · ne lui montre pas l ecran',
      duration: DUREE,
      words: U.shuffle(K.MIMES).slice(0, 40)
    });
    U.closeOverlay();

    const n = await K.ask(p, {
      kind: 'counter', icon: '📝', passMsg: 'Combien tu en as trouve ?',
      title: 'Combien de mimes trouves ?', sub: 'Ajuste si besoin',
      value: found, min: 0, max: 15
    });
    U.closeOverlay();

    n > 0 ? K.audio.fanfare() : K.audio.bad();
    return [{ id: p.id, delta: n }];
  });

})(window.KWA);
