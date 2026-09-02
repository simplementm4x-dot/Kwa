/* =========================================================
   CASE — LE 21
   Le mini-jeu se joue hors de l ecran : jingle, on compte,
   puis le joueur de la case designe qui a pris le 21.
   Celui qui prend le 21 recule de 5 cases.
   S il se designe lui-meme, il avance de 5.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  K.registerTile('vingtetun', async function (ctx) {
    const p = ctx.player;

    await U.jingle('LE JEU DU 21', 'Tout le monde joue !', 2000);
    await K.kwa.say('LE 21 ! Rangez les telephones, on compte a la voix.', { mood: 'oh' });

    await U.panel('🍻', 'Le jeu du 21', 'Ca se joue a la voix, pas sur l ecran',
      '<div class="rule"><h4><span>1️⃣</span>Le principe</h4><p>On compte de 1 a 21 en tournant. ' +
      'Chacun annonce 1, 2 ou 3 nombres a la suite. Celui qui dit 21 a perdu.</p></div>' +
      '<div class="rule"><h4><span>🔄</span>Les regles maison</h4><p>Un seul nombre garde le sens. ' +
      'Deux nombres inversent le sens. Trois nombres sautent le voisin. ' +
      'Ajoutez vos propres regles a chaque manche, c est la tradition.</p></div>' +
      '<div class="rule"><h4><span>💀</span>La sanction</h4><p>Celui qui prend le 21 recule de 5 cases. ' +
      'Mais si c est ' + U.esc(p.name) + ' qui se le prend, il avance de 5 : la foret aime les kamikazes.</p></div>',
      'On y va !');
    U.closeOverlay();

    await K.kwa.say('Quand quelqu un se prend le 21, ' + p.name + ' le designe sur l ecran.', { auto: 1400 });

    const id = await K.ask(p, {
      kind: 'list', icon: '💀', noPass: true,
      title: 'Qui a pris le 21 ?', sub: p.name + ' designe',
      intro: 'Le designe recule de 5 cases. Sauf si ' + p.name + ' se designe : +5.',
      items: ctx.players.map(x => ({ id: x.id, pid: x.id, label: x.name, color: x.hex }))
    });
    U.closeOverlay();

    const loser = K.player(id) || p;
    const self = loser.id === p.id;
    self ? K.audio.fanfare() : K.audio.buzzer();

    await U.panel(self ? '🎖️' : '💀', self ? 'Kamikaze !' : 'Sanction', '',
      U.verdict(self, self ? '🎖️' : '🍻',
        loser.name + ' : ' + (self ? '+5 CASES' : '-5 CASES'),
        self ? 'Tomber sur la case du 21 ET prendre le 21 : ca merite une medaille.'
             : 'Le 21, ca ne pardonne pas.'));
    U.closeOverlay();

    return [{ id: loser.id, delta: self ? 5 : -5 }];
  });

})(window.KWA);
