/* =========================================================
   CASES ECLAIR
   Trois cases qui se resolvent en dix secondes. Elles ne sont
   pas la pour occuper la table mais pour la laisser respirer :
   entre deux epreuves de trois minutes, il faut des moments ou
   il ne se passe presque rien — sauf une trahison.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  /* le registre des animations rejouees a l identique sur tous les ecrans */
  K.anim = K.anim || {};

  /* ---------------------------------------------------------
     ECHANGE — tu prends la place de qui tu veux
     --------------------------------------------------------- */
  K.registerTile('echange', async function (ctx) {
    const p = ctx.player;
    const autres = ctx.players.filter(x => x.id !== p.id);
    if (!autres.length) return [];

    await K.kwa.say('ECHANGE ! ' + p.name + ', tu prends la place de qui ?', { mood: 'wink' });

    const id = await K.ask(p, {
      kind: 'list', icon: '🔀',
      title: 'Tu prends la place de qui ?',
      sub: 'Case Echange',
      intro: 'Vous echangez vos positions sur le chemin. Choisis bien : si tu es devant, ' +
             'tu vas le regretter tout de suite.',
      passMsg: 'A toi de decider qui tu vas contrarier.',
      items: autres.map(x => ({
        id: x.id, pid: x.id, color: x.hex,
        label: x.name + ' — case ' + x.pos + (x.pos > p.pos ? ' (devant toi)' : x.pos < p.pos ? ' (derriere toi)' : ' (a egalite)')
      }))
    });
    U.closeOverlay();

    const q = K.player(id);
    if (!q) return [];
    const ecart = q.pos - p.pos;

    if (!ecart) {
      await K.kwa.say('Vous etiez sur la meme case. Bel echange, tres utile.', { auto: 1400, mood: 'wink' });
      return [];
    }
    await K.kwa.say(ecart > 0
      ? p.name + ' vole ' + U.cases(ecart) + ' a ' + q.name + '. La foret adore ca.'
      : p.name + ' descend de ' + U.cases(-ecart) + ' pour embeter ' + q.name + '. Courageux.',
      { auto: 1600, mood: 'oh' });

    return [{ id: p.id, delta: ecart }, { id: q.id, delta: -ecart }];
  });

  /* ---------------------------------------------------------
     LE PEAGE — on avance, mais on paie
     --------------------------------------------------------- */
  K.registerTile('peage', async function (ctx) {
    const p = ctx.player;
    const autres = ctx.players.filter(x => x.id !== p.id);
    if (!autres.length) return [{ id: p.id, delta: 4 }];

    await K.kwa.say('LE PEAGE ! Quatre cases pour toi, ' + p.name + '. Mais on ne passe pas gratuitement.',
      { mood: 'oh' });

    const id = await K.ask(p, {
      kind: 'list', icon: '🪙',
      title: 'A qui tu offres 2 cases ?',
      sub: 'Le peage',
      intro: 'Tu avances de 4 cases quoi qu il arrive. Le droit de passage, c est 2 cases ' +
             'offertes a quelqu un d autre. A toi de voir qui te fait le moins peur.',
      passMsg: 'Choisis ton oblige.',
      items: autres.map(x => ({
        id: x.id, pid: x.id, color: x.hex,
        label: x.name + ' — case ' + x.pos
      }))
    });
    U.closeOverlay();

    const q = K.player(id);
    await K.kwa.say(q ? p.name + ' arrose ' + q.name + '. On note, on note.' : 'Personne ? Tant pis.',
      { auto: 1500, mood: 'wink' });

    return q ? [{ id: p.id, delta: 4 }, { id: q.id, delta: 2 }] : [{ id: p.id, delta: 4 }];
  });

  /* ---------------------------------------------------------
     LA ROUE DE KWA — pur hasard, dix secondes
     --------------------------------------------------------- */
  /* les valeurs sont repetees pour peser le tirage : beaucoup de petits
     gains, peu de grosses claques, et un +5 qui fait hurler la table */
  const ROUE = [-3, -2, -2, -1, -1, 1, 1, 2, 2, 2, 3, 3, 4, 5];

  function roueHtml(v, fini) {
    const col = v > 0 ? '#57e08a' : (v < 0 ? '#ff5757' : '#ffcf4d');
    return '<div class="roue' + (fini ? ' fini' : '') + '">' +
      '<div class="roue-val" style="color:' + col + '">' + (v > 0 ? '+' + v : v) + '</div>' +
      '<div class="roue-lbl">' + (fini ? U.cases(v) : 'ca tourne...') + '</div>' +
      '</div>';
  }

  /** la meme animation se joue sur tous les telephones */
  K.anim.roue = async function (d) {
    const v = d.v;
    U.overlay('<div class="ov-head"><span class="ov-ico">🎡</span><h3>La Roue de Kwa' +
      '<span class="ov-sub">' + U.esc(d.name || '') + '</span></h3></div>' +
      '<div class="ov-body" id="roueBody">' + roueHtml(ROUE[0], false) + '</div>');

    const body = U.$('#roueBody');
    /* on ralentit progressivement : c est l attente qui fait le suspense */
    let pause = 55;
    for (let i = 0; i < 22; i++) {
      if (!U.$('#roueBody')) return;
      body.innerHTML = roueHtml(ROUE[U.rnd(ROUE.length)], false);
      K.audio.tick();
      await U.sleep(pause);
      pause += 14;
    }
    if (!U.$('#roueBody')) return;
    body.innerHTML = roueHtml(v, true);
    v > 0 ? K.audio.up() : K.audio.down();
    U.buzz(40);
    await U.sleep(1400);
    U.closeOverlay();
  };

  K.registerTile('roue', async function (ctx) {
    const p = ctx.player;
    await K.kwa.say('LA ROUE DE KWA ! Aucune competence, aucun merite. Juste toi et le destin.',
      { mood: 'wink' });

    const v = ROUE[U.rnd(ROUE.length)];
    K.net && K.net.ev('anim', { fn: 'roue', v, name: p.name });
    await K.anim.roue({ v, name: p.name });

    await K.kwa.say(v > 0
      ? (v >= 4 ? 'MAIS QUELLE ROUE ! ' + p.name + ' repart avec ' + U.cases(v) + ' !'
                : p.name + ' prend ' + U.cases(v) + '. Correct.')
      : p.name + ' recule de ' + U.cases(v) + '. La roue ne t aime pas.',
      { auto: 1500, mood: v >= 4 ? 'oh' : 'happy' });

    return [{ id: p.id, delta: v }];
  });

})(window.KWA);
