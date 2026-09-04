/* =========================================================
   CASE — MIME EN FOLIE
   Les autres miment, le joueur de la case devine. 30 secondes.
   Un mime trouve = une case, jusqu a quatre.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const DUREE = 30;

  /* Le plafond. Sans lui, un bon binome sortait huit cases d un seul
     tour — plus que le niveau 10 du quiz, et sans le moindre risque.
     Il en faut un pour reussir, quatre suffisent pour tout rafler. */
  const PLAFOND = 4;

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
      'On mime, point. Chaque trouvaille = 1 case pour ' + U.esc(p.name) + ', ' +
      '<b>' + PLAFOND + ' cases au maximum</b>. Un seul suffit a sauver la case.</p></div>' +
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

    const delta = Math.min(n, PLAFOND);
    delta ? K.audio.fanfare() : K.audio.bad();

    await U.panel(delta ? '🎉' : '😶', delta ? 'Bien vu !' : 'Rien du tout', '',
      U.verdict(!!delta, delta >= PLAFOND ? '💯' : (delta ? '👏' : '😶'),
        '+' + delta + (delta > 1 ? ' CASES' : ' CASE'),
        n + ' mime' + (n > 1 ? 's trouves' : ' trouve') +
        (n > PLAFOND ? '<br>Le plafond est a ' + PLAFOND + ' : le reste, c est pour l honneur.'
                     : (delta ? '' : '<br>Il en fallait un seul.'))));
    U.closeOverlay();

    return [{ id: p.id, delta }];
  });

})(window.KWA);
