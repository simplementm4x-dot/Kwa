/* =========================================================
   Le jeu libre : on choisit son epreuve, on la joue, les
   gains deviennent des points.
   ========================================================= */
'use strict';
const { boot, click, sleep } = require('./harness');

const until = async (fn, ms, label) => {
  const t0 = Date.now();
  while (Date.now() - t0 < (ms || 15000)) {
    const v = fn();
    if (v) return v;
    await sleep(90);
  }
  throw new Error('delai depasse : ' + label);
};

const ecran = ctx => {
  const s = ctx.win.document.querySelector('.screen.is-active');
  return s ? s.id : '(aucun)';
};

/** repond a tout ce qui s ouvre, jusqu a ce que la condition tombe */
async function joueJusqua(ctx, fn, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < (ms || 60000)) {
    if (fn()) return true;
    const ov = ctx.$('#overlay');
    const b = ov && !ov.hidden ? [...ov.querySelectorAll('button')].find(x => !x.disabled) : null;
    if (b) click(ctx.win, b, ctx.errors);
    else {
      const k = ctx.$('#kwaBubble');
      if (k) click(ctx.win, k, ctx.errors);
    }
    await sleep(70);
  }
  return false;
}

async function ouvre(nb) {
  const ctx = await boot();
  const K = ctx.K;
  click(ctx.win, ctx.$('#btnLibre'), ctx.errors);
  await until(() => ecran(ctx) === 'screen-players', 5000, 'ecran des joueurs');
  K.state.players = ['Alice', 'Bob', 'Chloe', 'David'].slice(0, nb)
    .map((n, i) => K.newPlayer(n, K.COLORS[i].id));
  K.menu.renderPlayers();
  click(ctx.win, ctx.$('#btnStart'), ctx.errors);
  await until(() => ecran(ctx) === 'screen-libre', 5000, 'grille du jeu libre');
  return ctx;
}

(async () => {
  const fails = [];
  const step = s => console.log('  · ' + s);

  /* =====================================================
     1. La grille : ce qui est jouable et ce qui ne l est pas
     ===================================================== */
  {
    const c = await ouvre(2);
    const carte = t => c.win.document.querySelector('.lb-jeu[data-jeu="' + t + '"]');

    if (!c.$('.lb-grid')) fails.push('la grille des epreuves ne s affiche pas');
    const total = c.win.document.querySelectorAll('.lb-jeu').length;
    if (total < 10) fails.push('trop peu d epreuves proposees (' + total + ')');
    step(total + ' epreuves proposees');

    /* les cases de plateau n ont rien a faire ici */
    ['echange', 'peage', 'roue'].forEach(t => {
      if (carte(t)) fails.push('"' + t + '" est une mecanique de plateau et ne devrait pas etre proposee');
    });
    step('les cases eclair restent au plateau');

    /* a deux, L Echelle demande du monde */
    if (!carte('echelle') || !carte('echelle').disabled) {
      fails.push('L Echelle devrait etre grisee a deux joueurs');
    } else step('a deux joueurs : L Echelle grisee, ' + carte('echelle').querySelector('.lb-non').textContent);

    /* le duel se joue autour d un seul telephone : c est le cas ici */
    if (!carte('duel') || carte('duel').disabled) fails.push('le duel devrait etre jouable en jeu libre');
    else step('le duel est jouable : tout le monde est autour du meme ecran');

    c.errors.forEach(e => fails.push('grille : ' + e));
  }

  /* =====================================================
     2. A quatre, tout se debloque
     ===================================================== */
  {
    const c = await ouvre(4);
    const ech = c.win.document.querySelector('.lb-jeu[data-jeu="echelle"]');
    if (!ech || ech.disabled) fails.push('L Echelle reste grisee a quatre joueurs');
    else step('a quatre joueurs : L Echelle se debloque');
    c.errors.forEach(e => fails.push('quatre joueurs : ' + e));
  }

  /* =====================================================
     3. Jouer une epreuve et marquer des points
     ===================================================== */
  {
    const c = await ouvre(4);
    const K = c.K;

    /* on repond mecaniquement : ce qui compte est le trajet, pas le score */
    K.ask = (p, spec) => Promise.resolve(
      spec.kind === 'list' ? spec.items[0].id :
      spec.kind === 'bet' ? 1 :
      spec.kind === 'nombre' ? spec.min :
      spec.kind === 'secret' ? true :
      spec.kind === 'text' ? 'Une anecdote vraie.' :
      spec.kind === 'quiz' ? 0 :
      spec.kind === 'reveal' ? true :
      spec.kind === 'mime' || spec.kind === 'raccord' || spec.kind === 'counter' ? 2 : 'a');
    /* le choix de la vedette passe par prompt.render : on prend le premier */
    K.prompt.render = spec => Promise.resolve(
      spec.kind === 'list' ? spec.items[0].id : 'a');

    click(c.win, c.win.document.querySelector('.lb-jeu[data-jeu="shifumi"]'), c.errors);

    /* l ecran de jeu sert de decor, sans plateau */
    await until(() => ecran(c) === 'screen-game', 10000, 'ecran de jeu');
    if (!c.$('#screen-game').classList.contains('libre')) {
      fails.push('l ecran de jeu ne passe pas en mode libre');
    } else step('l epreuve se joue sur l ecran de jeu, sans plateau');

    const revenu = await joueJusqua(c, () => ecran(c) === 'screen-libre', 90000);
    if (!revenu) fails.push('on ne revient pas a la grille apres l epreuve');
    else step('retour a la grille une fois l epreuve finie');

    if (c.$('#screen-game').classList.contains('libre')) {
      fails.push('le mode libre reste colle a l ecran de jeu');
    }

    /* le shifumi donne +2 et -2 : le tableau des points doit apparaitre */
    const scores = c.$('.lb-scores');
    if (!scores) fails.push('aucun tableau de points apres une epreuve');
    else {
      const lignes = scores.querySelectorAll('.rank-row').length;
      if (lignes !== 4) fails.push('le tableau ne montre pas les 4 joueurs (' + lignes + ')');
      else step('tableau des points affiche : ' + scores.textContent.replace(/\s+/g, ' ').trim().slice(0, 60));
    }

    /* et on peut remettre a zero */
    const raz = c.$('#lbRaz');
    if (!raz) fails.push('pas de remise a zero des points');
    else {
      click(c.win, raz, c.errors);
      if (c.$('.lb-scores')) fails.push('la remise a zero ne vide pas le tableau');
      else step('remise a zero des compteurs');
    }

    c.errors.forEach(e => fails.push('epreuve : ' + e));
  }

  console.log('');
  console.log(fails.length ? 'ECHECS :\n - ' + fails.join('\n - ') : 'JEU LIBRE : OK');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('\nECHEC : ' + e.message); process.exit(1); });
