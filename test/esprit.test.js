/* =========================================================
   L esprit de la foret : la creature qui garde une case.

   On verifie qu il se pose ou il a le droit, qu il frappe
   celui qui s arrete sur lui, qu il l empeche de jouer son
   epreuve, qu il rode, et qu il disparait quand on le coupe
   dans les reglages.
   ========================================================= */
'use strict';
const { boot, click, sleep } = require('./harness');

/** une partie prete a jouer, plateau dessine, sans passer par les menus */
async function plateau(reglages) {
  const ctx = await boot();
  const K = ctx.K;
  Object.assign(K.state.settings, {
    venue: 'irl', device: 'solo', mode: 'tours', maxTurns: 3,
    boardLength: 24, sound: false, evenements: false, pactes: false, paris: false,
    esprit: true
  }, reglages || {});
  K.state.players = [
    K.newPlayer('Alice', 'rouge'),
    K.newPlayer('Bob', 'bleu'),
    K.newPlayer('Chloe', 'vert')
  ];
  K.board.generate(24);
  K.board.render();
  K.pawns.renderAll();
  /* on coupe la parole a l animateur : ses repliques attendent un doigt,
     et ce test-ci ne teste pas les doigts */
  K.kwa.say = () => Promise.resolve();
  K.kwa.setMood = () => {};
  return ctx;
}

(async () => {
  const fails = [];
  const step = s => console.log('  · ' + s);

  /* =====================================================
     1. Il prend une case, et une case tenable
     ===================================================== */
  {
    const c = await plateau();
    const K = c.K;
    const last = K.board.last();

    /* cent tirages : aucune place interdite ne doit sortir une seule fois */
    let mini = Infinity, maxi = -Infinity, surJoueur = 0;
    for (let n = 0; n < 100; n++) {
      K.esprit.reset();
      const i = K.esprit.at();
      if (i < mini) mini = i;
      if (i > maxi) maxi = i;
      if (K.state.players.some(p => p.pos === i)) surJoueur++;
    }
    if (mini < 2) fails.push('l esprit se pose sur le depart ou juste apres (case ' + mini + ')');
    if (maxi > last - 2) fails.push('l esprit campe la ligne d arrivee (case ' + maxi + ')');
    if (surJoueur) fails.push('l esprit apparait sur un joueur ' + surJoueur + ' fois sur 100');
    step('cent apparitions entre les cases ' + mini + ' et ' + maxi + ', jamais sur un pion');

    if (!c.$('#esprits .esprit')) fails.push('rien ne le represente sur le plateau');
    else step('sa silhouette est bien posee sur le chemin');
  }

  /* =====================================================
     2. Il frappe celui qui s arrete sur sa case
     ===================================================== */
  {
    const c = await plateau();
    const K = c.K;
    K.esprit.reset();
    const garde = K.esprit.at();

    const p = K.state.players[0];
    p.pos = garde;
    K.pawns.layoutLocal();

    const t0 = Date.now();
    const touche = await K.esprit.garde(p);
    if (!touche) fails.push('l esprit laisse passer celui qui s arrete sur lui');
    if (p.pos !== garde - 3) {
      fails.push('le coup de baton ne fait pas reculer de 3 cases (case ' + p.pos +
                 ' au lieu de ' + (garde - 3) + ')');
    } else {
      step('Alice tombe case ' + garde + ' et se retrouve case ' + p.pos +
           ' (' + Math.round((Date.now() - t0) / 100) / 10 + 's d animation)');
    }
    if (K.esprit.at() === garde) fails.push('l esprit reste plante la ou il vient de frapper');
    else step('il a deja change de case : ' + garde + ' -> ' + K.esprit.at());

    /* et il ne touche personne d autre */
    const q = K.state.players[1];
    q.pos = K.esprit.at() === 5 ? 6 : 5;
    if (await K.esprit.garde(q)) fails.push('l esprit frappe un joueur qui n est pas sur sa case');
    else step('celui qui passe a cote ne risque rien');
  }

  /* =====================================================
     3. Celui qui se fait cueillir ne joue pas son epreuve
     Ici on joue une vraie partie : c est le moteur de tour
     qui doit sauter l epreuve, pas l esprit tout seul.
     ===================================================== */
  {
    const c = await plateau({ mode: 'tours', maxTurns: 2, boardLength: 14 });
    const K = c.K;

    /* toute epreuve qui se lancerait se signalerait ici */
    const jouees = [];
    Object.keys(K.tiles).forEach(t => {
      const vrai = K.tiles[t];
      K.tiles[t] = ctx => { jouees.push(t); return vrai(ctx); };
    });

    /* on truque le de pour que chaque joueur atterrisse pile sur lui */
    K.game.des = async () => {
      const p = K.current();
      K.state.esprit = { i: Math.min(p.pos + 2, K.board.last() - 2), depuis: 0 };
      K.esprit.render();
      return 2;
    };

    K.game.start();
    const fini = await (async () => {
      const t0 = Date.now();
      while (Date.now() - t0 < 90000) {
        if (K.state.over) return true;
        const foot = c.win.document.querySelector('.ov-foot button:not([disabled])');
        if (foot) click(c.win, foot, c.errors);
        else {
          const act = c.$('#actBtn');
          if (act) click(c.win, act, c.errors);
          else { const b = c.$('#kwaBubble'); if (b) click(c.win, b, c.errors); }
        }
        await sleep(60);
      }
      return false;
    })();

    if (!fini) fails.push('la partie ou l esprit frappe a chaque tour ne se termine pas');
    else if (jouees.length) {
      fails.push('une epreuve s est jouee malgre le coup de baton : ' + jouees.join(', '));
    } else {
      step('partie entiere ou chaque atterrissage tombe sur lui : aucune epreuve jouee');
    }

    /* deux cases gagnees, trois perdues : on recule d une case par tour */
    const positions = K.state.players.map(p => p.name + ' ' + p.pos).join(', ');
    if (K.state.players.some(p => p.pos > 2)) {
      fails.push('les joueurs avancent alors qu ils se font sortir a chaque tour : ' + positions);
    } else {
      step('personne n a progresse : ' + positions);
    }

    c.errors.forEach(e => fails.push('erreur javascript : ' + e));
  }

  /* =====================================================
     4. Il rode entre les tours
     ===================================================== */
  {
    const c = await plateau();
    const K = c.K;
    K.esprit.reset();

    const depart = K.esprit.at();
    await K.esprit.rode();
    if (K.esprit.at() !== depart) fails.push('l esprit se deplace des le premier tour : il ne se surveille plus');
    await K.esprit.rode();
    const arrivee = K.esprit.at();
    if (arrivee === depart) fails.push('l esprit ne bouge jamais');
    else if (Math.abs(arrivee - depart) > 4) {
      fails.push('il se teleporte a ' + Math.abs(arrivee - depart) + ' cases : on ne peut plus l anticiper');
    } else {
      step('il rode un tour sur deux, de ' + depart + ' a ' + arrivee);
    }
  }

  /* =====================================================
     5. Coupe dans les reglages, il n existe pas
     ===================================================== */
  {
    const c = await plateau({ esprit: false });
    const K = c.K;
    K.esprit.reset();
    if (K.esprit.at() !== -1) fails.push('l esprit apparait alors qu il est coupe dans les reglages');
    else if (c.$('#esprits .esprit')) fails.push('sa silhouette reste sur le plateau une fois coupe');
    else step('coupe dans les reglages : aucune case gardee');

    const p = K.state.players[0];
    p.pos = 5;
    if (await K.esprit.garde(p)) fails.push('il frappe encore alors qu il est coupe');
    await K.esprit.rode();
    step('et plus rien ne rode');

    c.errors.forEach(e => fails.push('erreur javascript : ' + e));
  }

  await sleep(50);
  if (fails.length) {
    console.log('\nECHECS :');
    fails.forEach(f => console.log(' - ' + f));
    process.exit(1);
  }
  console.log('\nL ESPRIT DE LA FORET : OK');
  process.exit(0);
})();
