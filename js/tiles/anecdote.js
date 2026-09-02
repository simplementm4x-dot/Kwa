/* =========================================================
   CASE — ANECDOTE
   Chacun ecrit une anecdote, tout le monde vote, le plus vote
   avance de 5 cases.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  const SUJETS = [
    'la fois ou tu as eu le plus honte',
    'ton pire souvenir d ecole',
    'la chose la plus stupide que tu aies achetee',
    'ton plus gros mensonge jamais decouvert',
    'la fois ou tu as failli mourir (ou presque)',
    'ton pire rendez-vous',
    'la chose la plus bizarre que tu aies mangee',
    'ton plus beau moment de gloire',
    'la fois ou tu t es fait griller',
    'ton talent parfaitement inutile',
    'la pire coupe de cheveux de ta vie',
    'ta plus grosse gaffe au travail',
    'un truc que personne ici ne sait sur toi',
    'la fois ou tu as menti a tes parents',
    'ton pire voyage'
  ];

  K.registerTile('anecdote', async function (ctx) {
    const players = ctx.players;
    const sujet = U.draw('anecdote', SUJETS);

    await K.kwa.say('ANECDOTE ! Sujet du jour : ' + sujet + '. Chacun ecrit la sienne.', { mood: 'wink' });

    /* --- ecriture --- */
    const entries = [];
    for (const p of players) {
      const text = await K.ask(p, {
        kind: 'text', icon: '📖',
        title: p.name, sub: 'Sujet : ' + sujet,
        intro: 'Ecris ton anecdote. Vraie de preference, drole obligatoirement. Elle sera lue sans ton nom.',
        placeholder: 'Un jour, j ai...', max: 280, min: 5,
        btn: 'Valider et cacher',
        passMsg: 'Ecris ton anecdote sans que les autres voient.'
      });
      entries.push({ id: p.id, text });
      U.closeOverlay();
    }

    /* --- vote --- */
    const shuffled = U.shuffle(entries);
    const votes = {};
    for (const p of players) {
      const id = await K.ask(p, {
        kind: 'list', icon: '🗳️',
        title: 'Vote', sub: p.name + ' choisit la meilleure',
        intro: 'Anonyme. Tu ne peux pas voter pour la tienne.',
        passMsg: 'A toi de voter pour la meilleure.',
        items: shuffled.filter(e => e.id !== p.id).map((e, i) =>
          ({ id: e.id, label: e.text, color: '#7b3fb3', small: true }))
      });
      votes[id] = (votes[id] || 0) + 1;
      U.closeOverlay();
    }

    let max = 0;
    players.forEach(p => { max = Math.max(max, votes[p.id] || 0); });
    const winners = players.filter(p => (votes[p.id] || 0) === max && max > 0);

    const rows = shuffled.map(e => {
      const p = K.player(e.id);
      const v = votes[e.id] || 0;
      return '<div class="res" style="border-left-color:' + p.hex + '">' +
        '<span class="rank-av" style="--pc:' + p.hex + '">' + K.sprites.avatar(p, 30) + '</span>' +
        '<b style="font-size:13.5px;font-weight:600">' + U.esc(e.text) +
        '<br><span class="dim" style="font-size:12px">— ' + U.esc(p.name) + '</span></b>' +
        '<span class="d ' + (v === max && max > 0 ? 'up' : 'zero') + '">' + v + '</span></div>';
    }).join('');

    K.audio.fanfare();
    await U.panel('🏅', 'Les anecdotes',
      winners.length ? 'Gagnant : ' + winners.map(w => w.name).join(', ') : '',
      '<div class="res-list">' + rows + '</div>');
    U.closeOverlay();

    return winners.map(w => ({ id: w.id, delta: 5 }));
  });

})(window.KWA);
