/* =========================================================
   CASE — "Tu te mets combien ?"
   1 theme, 10 niveaux. Le niveau choisi = le nombre de cases
   gagnees si la reponse est bonne.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  /* le temps laisse pour repondre a une question fermee */
  const SECONDES = 20;

  /**
   * L ouverture : la carte se tire au milieu de l ecran.
   *
   * Elle passe avant les paris, et c est tout l interet : on ne mise
   * pas sur quelqu un, on mise sur quelqu un SUR UN THEME. Savoir que
   * la carte est "les dinosaures" vaut tous les discours.
   *
   * Le projecteur est diffuse tel quel : l animation est en CSS et part
   * a l affichage, donc elle se joue pareil sur tous les telephones
   * sans un seul message de plus.
   */
  K.registerIntro('quiz', async function () {
    const card = U.draw('cards', K.CARDS);
    if (!card) return null;

    U.spotlight(
      '<div class="tirage">' +
        '<div class="tir-pile"><i></i><i></i><i></i></div>' +
        '<div class="tir-carte">' +
          '<div class="tir-dos">?</div>' +
          '<div class="tir-face">' +
            '<small>THEME</small><b>' + U.esc(card.t) + '</b>' +
            '<i>' + U.esc(card.c) + '</i>' +
          '</div>' +
        '</div>' +
      '</div>');
    K.audio.blip();
    await U.sleep(900);
    K.audio.pop();
    U.buzz(25);
    await U.sleep(1900);
    U.clearSpotlight();
    return { card, sujet: card.t };
  });

  K.registerTile('quiz', async function (ctx) {
    const p = ctx.player;
    /* la carte a deja ete tiree par l ouverture ; en jeu libre ou en
       secours, on en tire une ici */
    const card = (ctx.avant && ctx.avant.card) || U.draw('cards', K.CARDS);
    if (!card) return [];

    await K.kwa.say('Theme : ' + card.t + '. ' + (K.kwa.line('quiz') || 'Tu te mets combien ?'),
      { auto: 1100 });

    /* --- la mise --- */
    const n = await K.ask(p, {
      kind: 'bet', icon: '❓', noPass: true,
      title: 'Tu te mets combien ?', sub: p.name + ' choisit sa difficulte',
      theme: card.t, cat: card.c
    });
    U.closeOverlay();

    await K.kwa.say(
      K.kwa.line('bet' + (n >= 8 ? 'High' : n <= 3 ? 'Low' : 'Mid'), { name: p.name, n }) ||
      (p.name + ' se met ' + n + '.'),
      { auto: 950, mood: n >= 8 ? 'oh' : 'wink' });

    /* --- la question --- */
    const q = K.question(card, n);
    if (!q) return [];
    let ok, tempsEcoule = false;
    if (q.o && q.o.length) {
      const order = U.shuffle(q.o.map((txt, i) => ({ txt, i })));
      const good = order.findIndex(o => o.i === q.a);

      /* la table voit la question et les propositions pendant qu il
         cherche : sans ca, neuf personnes sur dix regardent un joueur
         fixer son telephone */
      K.scene.montre(K.scene.question({
        cat: card.c + ' · niveau ' + n, titre: card.t, texte: q.q,
        choix: order.map(o => o.txt), duree: SECONDES
      }));

      const k = await K.ask(p, {
        kind: 'quiz', icon: '❓', noPass: true, duree: SECONDES,
        title: card.t, sub: 'Niveau ' + n + ' · ' + card.c,
        theme: card.t, diff: n, text: q.q,
        choices: order.map(o => o.txt), good
      });
      K.scene.cache();
      tempsEcoule = k === -1;
      ok = k === good;
    } else {
      K.scene.montre(K.scene.question({
        cat: card.c + ' · niveau ' + n, titre: card.t, texte: q.q
      }));
      ok = await K.ask(p, {
        kind: 'reveal', icon: '❓', noPass: true,
        title: card.t, sub: 'Niveau ' + n + ' · reponse libre',
        theme: card.t, diff: n, text: q.q, answer: q.a
      });
      K.scene.cache();
    }
    U.closeOverlay();

    const delta = ok ? n : (n >= 8 ? -1 : 0);
    if (ok) p.stats.correct++; else p.stats.wrong++;

    await U.panel(ok ? '🎉' : (tempsEcoule ? '⏱️' : '💀'),
      ok ? 'Bien joue !' : (tempsEcoule ? 'Trop tard !' : 'Rate...'), card.t,
      U.verdict(ok, ok ? '🎉' : (tempsEcoule ? '⏱️' : '💀'),
        ok ? '+' + delta + ' CASES' : (delta < 0 ? delta + ' CASE' : 'ZERO CASE'),
        ok ? 'Niveau ' + n + ' encaisse sans trembler.'
           : (tempsEcoule ? 'Les vingt secondes sont passees. La foret n attend pas.'
              : delta < 0 ? 'Niveau ' + n + ' rate : la foret te reprend une case.'
                          : 'Ce sera pour la prochaine fois.')));
    U.closeOverlay();

    return [{ id: p.id, delta }];
  });

})(window.KWA);
