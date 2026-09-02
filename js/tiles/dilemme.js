/* =========================================================
   CASE — LE DILEMME
   A ou B. La majorite avance de 2, la minorite recule de 2.
   Egalite : tout le monde reste plante la.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  K.registerTile('dilemme', async function (ctx) {
    const players = ctx.players;
    const d = U.draw('dilemme', K.DILEMMES);

    await K.kwa.say('LE DILEMME ! Tu preferes... ' + d.a + ' ... ou ... ' + d.b + ' ?', { mood: 'oh' });

    const votes = {};
    for (const p of players) {
      votes[p.id] = await K.ask(p, {
        kind: 'choice', icon: '⚖️',
        title: 'Tu preferes ?', sub: 'Au tour de ' + p.name,
        intro: 'Vote sans regarder les autres. La majorite avance de 2 cases, la minorite recule de 2.',
        passMsg: 'Ton choix reste secret jusqu au depouillement.',
        a: d.a, b: d.b
      });
      U.closeOverlay();
    }

    const nA = players.filter(p => votes[p.id] === 'a').length;
    const nB = players.length - nA;
    const tie = nA === nB;
    const win = nA > nB ? 'a' : 'b';
    const col = s => s === 'a' ? '#2b7fa6' : '#a62b83';

    await U.panel('📣', 'Depouillement', tie ? 'Egalite parfaite' : 'La majorite a parle',
      '<div class="dil-grid" style="margin-bottom:14px">' +
        '<div class="dil a" style="opacity:' + (tie || win === 'a' ? 1 : .45) + '">' +
          '<span class="tagA">A · ' + nA + ' voix</span>' + U.esc(d.a) + '</div>' +
        '<div class="vs">— OU —</div>' +
        '<div class="dil b" style="opacity:' + (tie || win === 'b' ? 1 : .45) + '">' +
          '<span class="tagB">B · ' + nB + ' voix</span>' + U.esc(d.b) + '</div>' +
      '</div><div class="res-list">' + players.map(p =>
        '<div class="res" style="border-left-color:' + col(votes[p.id]) + '">' +
          '<span class="rank-av" style="--pc:' + p.hex + '">' + K.sprites.avatar(p, 30) + '</span>' +
          '<b>' + U.esc(p.name) + '</b>' +
          '<span class="chip" style="background:' + col(votes[p.id]) + ';color:#fff">' +
          (votes[p.id] === 'a' ? 'A' : 'B') + '</span></div>').join('') + '</div>');
    U.closeOverlay();

    if (tie) {
      await K.kwa.say('Egalite. Personne ne bouge, tout le monde se regarde.', { auto: 1200 });
      return players.map(p => ({ id: p.id, delta: 0 }));
    }
    K.audio.good();
    return players.map(p => ({ id: p.id, delta: votes[p.id] === win ? 2 : -2 }));
  });

})(window.KWA);
