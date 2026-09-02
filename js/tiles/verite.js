/* =========================================================
   CASE — VERITE OU MENSONGE
   Le joueur voit un mot en secret. VERITE : il raconte un truc
   vrai en essayant de le faire passer pour faux. MENSONGE :
   l inverse. Il gagne s il a berne la majorite.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  const THEMES = [
    'un souvenir d enfance', 'une histoire de vacances', 'un truc sur ta famille',
    'une rencontre improbable', 'un exploit sportif', 'une histoire de boulot',
    'un accident domestique', 'une histoire d amour', 'une histoire d argent',
    'un truc que tu sais faire', 'une histoire d animal', 'une bagarre', 'une histoire de fete'
  ];

  K.registerTile('verite', async function (ctx) {
    const p = ctx.player;
    const isTruth = Math.random() < 0.5;
    const theme = U.draw('vom', THEMES);

    await K.kwa.say('VERITE OU MENSONGE ! ' + p.name + ', la consigne est pour toi seul. ' +
      'Les autres, regardez le plafond.', { mood: 'oh' });

    await K.ask(p, {
      kind: 'secret', icon: '🎭',
      title: p.name, sub: 'Personne d autre ne regarde',
      word: isTruth ? 'VERITE' : 'MENSONGE',
      label: 'TA CONSIGNE',
      tone: isTruth ? 'truth' : 'lie',
      hint: 'Le sujet impose : ' + theme,
      hintAfter: isTruth
        ? 'Raconte un truc VRAI sur ' + theme + ', mais fais-le sonner faux.'
        : 'Invente un truc FAUX sur ' + theme + ', mais fais-le sonner vrai.',
      btn: 'J ai compris, je raconte'
    });
    U.closeOverlay();

    await K.kwa.say(p.name + ' a une minute pour raconter son histoire. Les autres, cuisinez-le.', { auto: 1400 });

    const v = await K.ask(p, {
      kind: 'choice', icon: '⚖️', noPass: true,
      title: 'Verdict du public', sub: 'Les autres ont annonce vrai ou faux',
      intro: 'La consigne etait ' + (isTruth ? 'VERITE' : 'MENSONGE') + '. Tu gagnes si ' +
        (isTruth ? 'la majorite a cru que c etait FAUX.' : 'la majorite a cru que c etait VRAI.'),
      a: '😎 Je les ai eus', b: '😐 Ils ont devine'
    });
    U.closeOverlay();

    const won = v === 'a';
    won ? K.audio.good() : K.audio.bad();

    await U.panel(won ? '🎭' : '🔍', won ? 'Bien joue !' : 'Grille.', '',
      U.verdict(won, won ? '🎭' : '🔍', won ? '+3 CASES' : '-2 CASES',
        'C etait bien ' + (isTruth ? 'une VERITE' : 'un MENSONGE') + '.'));
    U.closeOverlay();

    return [{ id: p.id, delta: won ? 3 : -2 }];
  });

})(window.KWA);
