/* =========================================================
   CASE — A L AVEUGLE

   Le joueur ferme les yeux. Quelqu un lui fait toucher un objet
   ou gouter quelque chose. S il devine, il avance de 4 cases.

   Cette case demande d etre dans la meme piece : elle ne tombe
   pas quand la partie se joue a distance.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  const GAIN = 4;

  K.registerTile('aveugle', async function (ctx) {
    const p = ctx.player;
    const autres = ctx.players.filter(x => x.id !== p.id);
    if (!autres.length) return [];

    await K.kwa.say('A L AVEUGLE ! ' + p.name + ', tu vas fermer les yeux. Et non, pas le droit de regarder entre les doigts.',
      { mood: 'oh' });

    const id = await K.ask(p, {
      kind: 'list', icon: '🙈',
      title: 'Qui te prepare ca ?', sub: 'A l aveugle',
      intro: 'Cette personne va choisir un objet a toucher, ou quelque chose a gouter ou a sentir. ' +
             'Choisis-la bien : c est elle qui decide si tu as trouve.',
      passMsg: 'Designe qui va te faire deviner.',
      items: autres.map(x => ({ id: x.id, pid: x.id, label: x.name, color: x.hex }))
    });
    U.closeOverlay();

    const q = K.player(id);
    if (!q) return [];

    await U.panel('🙈', 'Ferme les yeux', q.name + ' prepare quelque chose',
      '<div class="rule"><h4><span>1️⃣</span>' + U.esc(p.name) + '</h4><p>Ferme les yeux, ou mieux : ' +
      'qu on te bande les yeux. Pas de coup d oeil, tout le monde te regarde.</p></div>' +
      '<div class="rule"><h4><span>2️⃣</span>' + U.esc(q.name) + '</h4><p>Choisis un objet a lui faire toucher, ' +
      'ou quelque chose a gouter ou a sentir. Rien de dangereux, rien de degoutant : le but est de ' +
      'faire deviner, pas de faire regretter.</p></div>' +
      '<div class="rule"><h4><span>3️⃣</span>La reponse</h4><p>' + U.esc(p.name) + ' annonce a voix haute ' +
      'ce qu il pense reconnaitre. S il trouve, il avance de ' + GAIN + ' cases.</p></div>',
      'C est fait');
    U.closeOverlay();

    const verdict = await K.ask(q, {
      kind: 'choice', icon: '⚖️',
      title: 'Il a trouve ?', sub: 'C est toi qui tranches, ' + q.name,
      intro: 'Sois honnete : approximatif mais juste, ca compte. A cote de la plaque, non.',
      passMsg: 'A toi de dire s il a trouve.',
      a: 'OUI, il a trouve', b: 'NON, rate'
    });
    U.closeOverlay();

    if (verdict !== 'a') {
      K.audio.bad();
      await K.kwa.say('Rate. Les yeux servent a quelque chose, finalement.', { auto: 1600, mood: 'wink' });
      return [];
    }
    K.audio.good();
    await K.kwa.say('Trouve les yeux fermes ! ' + p.name + ' avance de ' + U.cases(GAIN) + '.',
      { auto: 1600, mood: 'happy' });
    return [{ id: p.id, delta: GAIN }];
  });

})(window.KWA);
