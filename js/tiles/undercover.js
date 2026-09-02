/* =========================================================
   CASE — UNDERCOVER
   Tout le monde recoit un mot ; les infiltres en ont un autre.
   Debat et vote se font a la voix : l ecran ne sert qu a
   designer celui qui sort.
   L equipe gagnante avance de 2, la perdante recule de 2.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  K.registerTile('undercover', async function (ctx) {
    const players = ctx.players;
    const pair = U.draw('undercover', K.UNDERCOVER);
    const nUnder = players.length >= 6 ? 2 : 1;
    const unders = U.shuffle(players).slice(0, nUnder).map(p => p.id);

    await K.kwa.say('UNDERCOVER ! ' + nUnder + ' infiltre' + (nUnder > 1 ? 's' : '') +
      ' parmi vous. Chacun son tour, sans regarder par dessus l epaule.', { mood: 'oh' });

    /* --- 1. distribution des mots --- */
    for (const p of players) {
      const isU = unders.indexOf(p.id) >= 0;
      await K.ask(p, {
        kind: 'secret', icon: '🕵️',
        title: p.name, sub: 'Garde ca pour toi',
        word: isU ? pair.u : pair.c,
        label: isU ? 'TON MOT (chut)' : 'TON MOT',
        hint: 'Personne ne sait qui est infiltre. Meme toi tu doutes.',
        btn: 'Vu, je passe'
      });
      U.closeOverlay();
    }

    /* --- 2. tout se joue a la voix --- */
    await U.panel('🗣️', 'A vous de parler', 'Le telephone se repose',
      '<div class="rule"><h4><span>1️⃣</span>Le tour de parole</h4><p>Chacun donne UN mot qui decrit le sien, ' +
      'sans le dire. Premier a parler : <b>' + U.esc(U.pick(players).name) + '</b>.</p></div>' +
      '<div class="rule"><h4><span>2️⃣</span>Le debat</h4><p>On accuse, on se justifie, on retourne sa veste. ' +
      'Trop precis, tu grilles ton camp. Trop vague, on te prend pour l infiltre.</p></div>' +
      '<div class="rule"><h4><span>3️⃣</span>Le vote</h4><p>A main levee, tous en meme temps. ' +
      'Quand le groupe a tranche, on designe l elimine sur l ecran.</p></div>',
      'Le groupe a vote');
    U.closeOverlay();

    /* --- 3. on designe simplement celui qui sort --- */
    const id = await K.ask(ctx.player, {
      kind: 'list', icon: '🚪', noPass: true,
      title: 'Qui sort ?', sub: 'Resultat du vote a la voix',
      intro: 'Designe le joueur elimine par le groupe. En cas d egalite, personne ne sort : ' +
             'choisis alors n importe qui et les infiltres l emportent.',
      items: players.map(x => ({ id: x.id, pid: x.id, label: x.name, color: x.hex }))
    });
    U.closeOverlay();

    const out = K.player(id) || players[0];
    const caught = unders.indexOf(out.id) >= 0;
    const names = players.filter(p => unders.indexOf(p.id) >= 0).map(p => p.name).join(' et ');
    caught ? K.audio.good() : K.audio.bad();

    await U.panel(caught ? '🎯' : '😈',
      caught ? 'Les civils gagnent !' : 'Les infiltres gagnent !',
      out.name + ' quitte la partie',
      U.verdict(caught, caught ? '🎯' : '😈', caught ? 'DEMASQUE' : 'INNOCENT ELIMINE',
        '<b>' + U.esc(out.name) + '</b> etait ' + (caught ? 'bien un infiltre.' : 'un simple civil.') + '<br><br>' +
        'Le mot des civils : <b>' + U.esc(pair.c) + '</b><br>' +
        'Le mot des infiltres : <b>' + U.esc(pair.u) + '</b><br><br>' +
        'Infiltre' + (unders.length > 1 ? 's' : '') + ' : <b>' + U.esc(names) + '</b>'),
      'Distribution des cases');
    U.closeOverlay();

    return players.map(p => {
      const isU = unders.indexOf(p.id) >= 0;
      return { id: p.id, delta: (caught ? !isU : isU) ? 2 : -2 };
    });
  });

})(window.KWA);
