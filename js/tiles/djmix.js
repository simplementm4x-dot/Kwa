/* =========================================================
   CASE — DJ MIX

   Le joueur choisit son DJ. Le DJ decouvre en secret une annee
   entre 1990 et 2026, puis fait deviner cette annee en chantant,
   fredonnant ou passant un morceau qui en vient.

   Trouve a deux ans pres : le joueur avance de 4 cases et le DJ
   de 1, parce qu un DJ qui ne se fait jamais deviner ne joue pas
   le jeu.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  const DEBUT = 1990, FIN = 2026;
  const MARGE = 2;          /* a deux ans pres, c est trouve */
  const GAIN_JOUEUR = 4;
  const GAIN_DJ = 1;

  K.registerTile('djmix', async function (ctx) {
    const p = ctx.player;
    const autres = ctx.players.filter(x => x.id !== p.id);
    if (!autres.length) return [];

    /* le jingle part sans qu on l attende : il tourne pendant que Kwa
       annonce l epreuve, comme un generique sous une voix off */
    K.music && K.music.jingle('dj');
    await K.kwa.say('DJ MIX ! ' + p.name + ', il te faut quelqu un aux platines.', { mood: 'oh' });

    const id = await K.ask(p, {
      kind: 'list', icon: '🎧',
      title: 'Qui sera ton DJ ?', sub: 'DJ Mix',
      intro: 'Ton DJ va recevoir une annee en secret et te faire deviner laquelle, en musique. ' +
             'Choisis quelqu un qui connait tes gouts... ou pas.',
      passMsg: 'Designe ton DJ.',
      items: autres.map(x => ({ id: x.id, pid: x.id, label: x.name, color: x.hex }))
    });
    U.closeOverlay();

    const dj = K.player(id);
    if (!dj) return [];

    const annee = DEBUT + U.rnd(FIN - DEBUT + 1);

    await K.ask(dj, {
      kind: 'secret', icon: '🎧',
      title: dj.name, sub: 'Personne d autre ne doit voir cet ecran',
      word: String(annee),
      label: 'TON ANNEE',
      hint: 'Appuie pour decouvrir l annee qui t est tombee dessus.',
      hintAfter: 'Choisis un morceau sorti cette annee-la et fais-le deviner a ' + U.esc(p.name) +
                 ' : chante, fredonne, passe-le, imite la basse. Interdit de dire l annee ou le titre.',
      btn: 'Vu, je mixe'
    });
    U.closeOverlay();

    await U.panel('🎛️', 'A toi de mixer', dj.name + ' aux platines',
      '<div class="rule"><h4><span>🎵</span>Le DJ</h4><p>' + U.esc(dj.name) + ' a une annee en tete. ' +
      'Il choisit un morceau de cette annee-la et le fait deviner comme il peut : en chantant, ' +
      'en fredonnant, en le passant, en imitant le refrain.</p></div>' +
      '<div class="rule"><h4><span>🚫</span>Interdit</h4><p>Dire l annee, le titre, le nom de l artiste, ' +
      'ou tout ce qui reviendrait a donner la reponse.</p></div>' +
      '<div class="rule"><h4><span>🎯</span>Le joueur</h4><p>' + U.esc(p.name) + ' devra situer l annee ' +
      'entre ' + DEBUT + ' et ' + FIN + '. A ' + MARGE + ' ans pres, c est gagne : ' +
      GAIN_JOUEUR + ' cases pour lui, ' + GAIN_DJ + ' pour le DJ.</p></div>',
      'On a ecoute');
    U.closeOverlay();

    const devine = await K.ask(p, {
      kind: 'nombre', icon: '🎯',
      title: 'C etait quelle annee ?', sub: 'Mixe par ' + dj.name,
      intro: 'Glisse jusqu a ton estimation. Tu as droit a ' + MARGE + ' ans d ecart.',
      passMsg: 'A toi de situer l annee.',
      min: DEBUT, max: FIN, value: 2008, unite: '',
      presets: [1995, 2000, 2005, 2010, 2015, 2020],
      btn: 'C est mon dernier mot'
    });
    U.closeOverlay();

    const ecart = Math.abs(devine - annee);
    const trouve = ecart <= MARGE;

    await U.panel(trouve ? '🎉' : '💿', trouve ? 'Dans le mille' : 'A cote de la plaque',
      dj.name + ' avait ' + annee,
      U.verdict(trouve, trouve ? '🎯' : '📻',
        trouve ? p.name + ' situe a ' + devine : p.name + ' a dit ' + devine,
        trouve
          ? '<b>' + annee + '</b> — ' + (ecart === 0 ? 'pile poil.' : ecart + ' an' + (ecart > 1 ? 's' : '') + ' d ecart, ca passe.') +
            '<br>+' + GAIN_JOUEUR + ' pour ' + U.esc(p.name) + ', +' + GAIN_DJ + ' pour ' + U.esc(dj.name) + '.'
          : 'La bonne reponse etait <b>' + annee + '</b>, soit ' + ecart + ' ans d ecart. Personne ne bouge.'));
    U.closeOverlay();

    if (!trouve) {
      await K.kwa.say('Rate. ' + dj.name + ', ton mix etait peut-etre trop pointu.', { auto: 1600, mood: 'wink' });
      return [];
    }
    K.audio.good();
    await K.kwa.say('Trouve ! ' + p.name + ' a l oreille, et ' + dj.name + ' a fait son travail.',
      { auto: 1600, mood: 'happy' });
    return [{ id: p.id, delta: GAIN_JOUEUR }, { id: dj.id, delta: GAIN_DJ }];
  });

})(window.KWA);
