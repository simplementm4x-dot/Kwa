/* =========================================================
   CASE — SHIFUMI

   Dans la meme piece, on joue a la main et on designe le
   gagnant : l ecran ne sert qu a compter. A distance, chacun
   choisit son coup sur son telephone, un decompte tombe, et
   les deux coups se revelent en meme temps.

   Gagnant +2, perdant -2. Le hasard pur ne merite pas un
   ecart plus large que ca.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  const COUPS = [
    { id: 'pierre',  nom: 'Pierre',  ico: '✊', bat: 'ciseaux' },
    { id: 'feuille', nom: 'Feuille', ico: '✋', bat: 'pierre' },
    { id: 'ciseaux', nom: 'Ciseaux', ico: '✌️', bat: 'feuille' }
  ];
  const coup = id => COUPS.find(c => c.id === id) || COUPS[0];

  const MISE = 2;
  const MANCHES = 3;   /* on rejoue les egalites, mais pas indefiniment */

  function specCoup(joueur, adversaire) {
    return {
      kind: 'list', icon: '✊',
      title: 'Ton coup', sub: 'Contre ' + adversaire.name,
      intro: 'Choisis sans reflechir trop longtemps : ton adversaire ne verra rien avant le decompte.',
      passMsg: 'A toi de choisir ton coup, sans le montrer.',
      items: COUPS.map(c => ({ id: c.id, label: c.ico + '  ' + c.nom, color: joueur.hex }))
    };
  }

  /** le tableau des deux coups, montre a tout le monde */
  function tableau(a, ca, b, cb, verdict) {
    return '<div class="dil-grid" style="margin-bottom:12px">' +
      '<div class="dil a" style="text-align:center"><span class="tagA">' + U.esc(a.name) + '</span>' +
        '<div style="font-size:44px;line-height:1.2">' + ca.ico + '</div>' + ca.nom + '</div>' +
      '<div class="vs">— CONTRE —</div>' +
      '<div class="dil b" style="text-align:center"><span class="tagB">' + U.esc(b.name) + '</span>' +
        '<div style="font-size:44px;line-height:1.2">' + cb.ico + '</div>' + cb.nom + '</div>' +
      '</div><p class="hint center" style="font-size:15px">' + U.esc(verdict) + '</p>';
  }

  K.registerTile('shifumi', async function (ctx) {
    const p = ctx.player;
    const autres = ctx.players.filter(x => x.id !== p.id);
    if (!autres.length) return [];

    await K.kwa.say('SHIFUMI ! ' + p.name + ', designe ton adversaire. Pas de reflexion, pas de strategie, juste du nerf.',
      { mood: 'oh' });

    const id = await K.ask(p, {
      kind: 'list', icon: '✊',
      title: 'Tu defies qui ?', sub: 'Shifumi',
      intro: 'Le gagnant avance de ' + MISE + ' cases, le perdant recule d autant.',
      passMsg: 'Choisis ton adversaire.',
      items: autres.map(x => ({ id: x.id, pid: x.id, label: x.name + ' — case ' + x.pos, color: x.hex }))
    });
    U.closeOverlay();

    const q = K.player(id);
    if (!q) return [];

    /* --- a distance : chacun sur son telephone --- */
    if (K.rules.isOnline()) {
      for (let manche = 1; manche <= MANCHES; manche++) {
        const cp = coup(await K.ask(p, specCoup(p, q)));
        U.closeOverlay();
        const cq = coup(await K.ask(q, specCoup(q, p)));
        U.closeOverlay();

        await U.drumroll(1500, 'Pierre... feuille... ciseaux !');

        if (cp.id === cq.id) {
          await U.panel('✊', 'Egalite', 'Manche ' + manche,
            tableau(p, cp, q, cq, 'Les memes. On recommence.'));
          U.closeOverlay();
          continue;
        }
        const gagne = cp.bat === cq.id ? p : q;
        const perd = gagne === p ? q : p;
        await U.panel('✊', gagne.name + ' l emporte', '',
          tableau(p, cp, q, cq, cp.nom + ' contre ' + cq.nom + ' : ' + gagne.name + ' gagne.'));
        U.closeOverlay();
        K.audio.good();
        return [{ id: gagne.id, delta: MISE }, { id: perd.id, delta: -MISE }];
      }
      await K.kwa.say('Trois egalites d affilee. Vous etes faits du meme bois, personne ne bouge.',
        { auto: 1600, mood: 'wink' });
      return [];
    }

    /* --- dans la meme piece : on joue a la main --- */
    await U.panel('✊', 'A vous de jouer', p.name + ' contre ' + q.name,
      '<div class="rule"><h4><span>1️⃣</span>En rythme</h4><p>Pierre, feuille, ciseaux — sur trois temps, ' +
      'les deux mains sortent en meme temps. Pas de retard, pas de triche.</p></div>' +
      '<div class="rule"><h4><span>2️⃣</span>Deux manches gagnantes</h4><p>La pierre casse les ciseaux, ' +
      'les ciseaux coupent la feuille, la feuille enveloppe la pierre.</p></div>' +
      '<div class="rule"><h4><span>3️⃣</span>Le verdict</h4><p>Quand c est plie, ' + U.esc(p.name) +
      ' designe le gagnant sur l ecran. Le gagnant avance de ' + MISE + ' cases, le perdant recule d autant.</p></div>',
      'C est joue');
    U.closeOverlay();

    const vainqueur = await K.ask(p, {
      kind: 'list', icon: '🏅', noPass: true,
      title: 'Qui a gagne ?', sub: p.name + ' contre ' + q.name,
      items: [
        { id: p.id, pid: p.id, label: p.name, color: p.hex },
        { id: q.id, pid: q.id, label: q.name, color: q.hex },
        { id: 'nul', label: 'Egalite, personne ne bouge', color: '#7a6f8f' }
      ]
    });
    U.closeOverlay();

    if (vainqueur === 'nul') {
      await K.kwa.say('Egalite. Vous vous connaissez trop bien.', { auto: 1400, mood: 'wink' });
      return [];
    }
    const gagne = K.player(vainqueur);
    const perd = gagne.id === p.id ? q : p;
    K.audio.good();
    await K.kwa.say(gagne.name + ' l emporte. ' + perd.name + ', il faudra revoir le poignet.',
      { auto: 1600, mood: 'happy' });
    return [{ id: gagne.id, delta: MISE }, { id: perd.id, delta: -MISE }];
  });

})(window.KWA);
