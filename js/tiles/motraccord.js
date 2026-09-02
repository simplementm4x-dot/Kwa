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

    await K.kwa.say('LE MOT RACCORD ! La lettre du jour : ' + letter + '. ' + p.name + ' a 30 secondes.', { mood: 'oh' });

    await U.panel('🔤', 'La regle', 'Lettre imposee : ' + letter,
      '<div class="rule"><h4><span>🅰️</span>Un seul principe</h4><p>Chaque reponse doit commencer par la lettre <b>' +
      letter + '</b>. Cinq trucs a completer, 30 secondes pour tout envoyer.</p></div>' +
      '<div class="rule"><h4><span>👥</span>Le jury, c est vous</h4><p>Le groupe decide si le mot passe. ' +
      'Un mot valide = 1 case. Les cinq = 1 case bonus.</p></div>' +
      (K.state.settings.spicy
        ? '<div class="rule"><h4><span>🌶️</span>Mode epice</h4><p>Certaines cartes partent loin. ' +
          'Vous pouvez le desactiver dans les reglages.</p></div>'
        : ''),
      'Chrono !');
    U.closeOverlay();

    const n = await K.ask(p, {
      kind: 'raccord', icon: '🔤', noPass: true,
      sub: p.name + ' · tout commence par ' + letter,
      letter, items, duration: DUREE
    });
    U.closeOverlay();

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
