/* =========================================================
   CASE — L ECHELLE

   Une echelle de comparaison est annoncee. Trois joueurs tires
   au sort recoivent chacun un numero de 1 a 10, en secret, et
   doivent donner un exemple qui se situe a ce niveau — sans
   jamais dire le chiffre. Le joueur de la case doit retrouver
   les trois numeros.

   Deux cases par numero trouve pour le devineur, une case pour
   celui dont le numero a ete retrouve : bien faire deviner est
   un talent, pas un accident.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  const COMBIEN = 3;
  const GAIN_DEVINEUR = 2;
  const GAIN_EXEMPLE = 1;

  K.registerTile('echelle', async function (ctx) {
    const p = ctx.player;
    const dispo = ctx.players.filter(x => x.id !== p.id);
    if (dispo.length < COMBIEN) return [];

    const trio = U.shuffle(dispo).slice(0, COMBIEN);
    const echelle = U.draw('echelle', K.ECHELLES);

    await K.kwa.say('L ECHELLE ! L axe du jour : ' + echelle + '.', { mood: 'oh' });
    await K.kwa.say(trio.map(x => x.name).join(', ') + ' recoivent chacun un numero de 1 a 10. ' +
      p.name + ' devra les retrouver.', { auto: 2000 });

    /* --- chacun decouvre son niveau, sans le montrer --- */
    const numeros = {};
    for (const x of trio) {
      numeros[x.id] = 1 + U.rnd(10);
      await K.ask(x, {
        kind: 'secret', icon: '🪜',
        title: x.name, sub: echelle,
        word: String(numeros[x.id]),
        label: 'TON NIVEAU',
        hint: 'Appuie pour decouvrir ton numero. Personne d autre ne doit le voir.',
        hintAfter: '1 = tout en bas de l echelle, 10 = tout en haut. Trouve un exemple qui se situe ' +
                   'exactement a ce niveau, et annonce-le a voix haute — sans jamais dire le chiffre.',
        btn: 'Vu, j ai mon exemple'
      });
      U.closeOverlay();
    }

    /* --- le tour de parole --- */
    await U.panel('🪜', 'A vous de parler', echelle,
      '<div class="rule"><h4><span>🗣️</span>Chacun son exemple</h4><p>' +
      trio.map(x => U.esc(x.name)).join(', ') + ' annoncent chacun leur exemple, a voix haute. ' +
      'Un seul exemple, pas d explication, pas de chiffre.</p></div>' +
      '<div class="rule"><h4><span>🪜</span>L echelle</h4><p><b>1</b> = tout en bas, le minimum absolu. ' +
      '<b>10</b> = tout en haut, on ne fait pas plus fort.</p></div>' +
      '<div class="rule"><h4><span>🎯</span>' + U.esc(p.name) + '</h4><p>A toi de retrouver les trois numeros. ' +
      GAIN_DEVINEUR + ' cases par numero exact. Celui dont le numero est retrouve gagne ' +
      GAIN_EXEMPLE + ' case : c est qu il a bien vise.</p></div>',
      'On a tout entendu');
    U.closeOverlay();

    /* --- le devineur place chacun sur l echelle --- */
    const resultats = [];
    const detail = [];
    let bons = 0;

    for (const x of trio) {
      const dit = await K.ask(p, {
        kind: 'bet', icon: '🪜',
        title: 'Le numero de ' + x.name, sub: echelle,
        cat: echelle, theme: x.name,
        question: 'A quel niveau se situe l exemple de <b>' + U.esc(x.name) + '</b> ?',
        legendeA: '1 · tout en bas', legendeB: '10 · tout en haut',
        note: 'Un numero exact rapporte ' + GAIN_DEVINEUR + ' cases. A cote, rien.',
        passMsg: 'A toi de placer ' + x.name + ' sur l echelle.'
      });
      U.closeOverlay();

      const vrai = numeros[x.id];
      const ok = dit === vrai;
      if (ok) { bons++; resultats.push({ id: x.id, delta: GAIN_EXEMPLE }); }
      detail.push({ p: x, dit, vrai, ok });
    }

    const lignes = detail.map(d =>
      '<div class="res" style="border-left-color:' + (d.ok ? '#57e08a' : '#ff5757') + '">' +
        '<span class="rank-av" style="--pc:' + d.p.hex + '">' + K.sprites.avatar(d.p, 30) + '</span>' +
        '<b>' + U.esc(d.p.name) + '</b>' +
        '<span class="chip">annonce ' + d.dit + '</span>' +
        '<span class="d ' + (d.ok ? 'up' : 'down') + '">' + d.vrai + '</span>' +
      '</div>').join('');

    await U.panel('🪜', bons + ' sur ' + COMBIEN, echelle,
      '<p class="hint center">La colonne de droite donne les vrais numeros.</p>' +
      '<div class="res-list">' + lignes + '</div>');
    U.closeOverlay();

    bons ? K.audio.good() : K.audio.bad();
    await K.kwa.say(
      bons === COMBIEN ? 'Trois sur trois ! ' + p.name + ' lit dans les tetes.'
      : bons === 0 ? p.name + ' n en trouve aucun. Vous ne parlez pas la meme langue.'
      : p.name + ' en trouve ' + bons + ' sur ' + COMBIEN + '. Correct.',
      { auto: 1800, mood: bons === COMBIEN ? 'oh' : 'happy' });

    if (bons) resultats.push({ id: p.id, delta: bons * GAIN_DEVINEUR });
    return resultats;
  });

})(window.KWA);
