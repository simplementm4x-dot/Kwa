/* =========================================================
   La configuration menee par Kwa : on suit le parcours en
   cliquant comme un joueur, et on verifie que les reglages
   qui en sortent changent vraiment la partie.
   ========================================================= */
'use strict';
const { boot, click, sleep } = require('./harness');

const until = async (fn, ms, label) => {
  const t0 = Date.now();
  while (Date.now() - t0 < (ms || 20000)) {
    const v = fn();
    if (v) return v;
    await sleep(100);
  }
  throw new Error('delai depasse : ' + label);
};

/** attend qu une carte de reponse apparaisse, puis tape dessus */
async function repond(ctx, val) {
  const sel = '.setup-card[data-v="' + val + '"]';
  await until(() => {
    const b = ctx.$(sel);
    return b && !b.disabled;
  }, 20000, 'carte "' + val + '"');
  click(ctx.win, ctx.$(sel), ctx.errors);
}

/** le choix d un nombre : une pastille puis on valide */
async function nombre(ctx, n) {
  await until(() => ctx.$('.num-pick'), 20000, 'choix du nombre');
  const chip = ctx.$('.num-chip[data-n="' + n + '"]');
  if (!chip) throw new Error('pas de pastille ' + n);
  click(ctx.win, chip, ctx.errors);
  click(ctx.win, ctx.$('#numOk'), ctx.errors);
}

const ecran = ctx => {
  const s = ctx.win.document.querySelector('.screen.is-active');
  return s ? s.id : '(aucun)';
};

(async () => {
  const fails = [];
  const step = s => console.log('  · ' + s);

  /* =====================================================
     1. ONLINE + terminus
     ===================================================== */
  {
    const c = await boot();
    click(c.win, c.$('#btnPlay'), c.errors);
    await until(() => c.$('#screen-setup').classList.contains('is-active'), 5000, 'ecran de config');

    /* les deux cartes arrivent l une apres l autre */
    await until(() => c.$('.setup-card[data-v="irl"]'), 20000, 'carte IN REAL LIFE');
    if (c.$('.setup-card[data-v="online"]')) fails.push('les deux choix arrivent en meme temps, la mise en scene est perdue');
    step('Kwa presente IN REAL LIFE en premier');

    await repond(c, 'online');
    step('choix ONLINE');

    await repond(c, 'terminus');
    await nombre(c, 20);

    await until(() => ecran(c) === 'screen-lobby', 20000, 'salon');
    const s = c.K.state.settings;
    if (s.venue !== 'online') fails.push('le lieu n est pas retenu : ' + s.venue);
    if (s.device !== 'multi') fails.push('ONLINE devrait imposer un telephone par joueur : ' + s.device);
    if (s.mode !== 'terminus') fails.push('mode non retenu : ' + s.mode);
    if (s.boardLength !== 20) fails.push('longueur non retenue : ' + s.boardLength);
    if (s.spicy !== true) fails.push('le mode epice devrait etre d office');
    step('reglages : ' + s.venue + ' / ' + s.device + ' / ' + s.mode + ' / ' +
         s.boardLength + ' cases / epice=' + s.spicy);

    /* les epreuves physiques ne doivent pas tomber sur le chemin.
       Quatre joueurs : certaines cases demandent du monde, et ce n est
       pas ce qu on teste ici. */
    c.K.state.players = ['Alice', 'Bob', 'Chloe', 'David']
      .map((n, i) => c.K.newPlayer(n, c.K.COLORS[i].id));
    c.K.board.generate(40);
    const types = c.K.board.typeList();
    ['vingtetun', 'mime', 'duel', 'aveugle'].forEach(t => {
      if (types.indexOf(t) >= 0) fails.push('la case "' + t + '" est injouable a distance et se trouve pourtant sur le plateau');
    });
    /* On interroge la regle et non le tirage : le plateau force ses deux
       premieres cases en quiz, ce qui peut effacer un type rare. Une case
       interdite, elle, ne peut jamais apparaitre — ca se verifie au-dessus. */
    ['shifumi', 'djmix', 'echelle'].forEach(t => {
      if (!c.K.rules.tileAllowed(t)) fails.push('la case "' + t + '" se joue tres bien a distance et reste pourtant interdite');
    });
    const restants = [...new Set(types)].filter(t => t !== 'start' && t !== 'finish');
    step('cases retenues a distance : ' + restants.join(', '));
    if (restants.length < 4) fails.push('il ne reste presque plus d epreuves a distance');

    c.errors.forEach(e => fails.push('online : ' + e));
  }

  /* =====================================================
     2. IN REAL LIFE, un seul telephone, en tours
     ===================================================== */
  {
    const c = await boot();
    click(c.win, c.$('#btnPlay'), c.errors);
    await until(() => c.$('#screen-setup').classList.contains('is-active'), 5000, 'ecran de config');

    await repond(c, 'irl');
    step('choix IN REAL LIFE');

    /* Kwa doit alors demander combien de telephones */
    await repond(c, 'solo');
    step('un seul telephone');

    await repond(c, 'tours');
    await nombre(c, 3);

    await until(() => ecran(c) === 'screen-players', 20000, 'ecran des joueurs');
    const s = c.K.state.settings;
    if (s.venue !== 'irl') fails.push('lieu non retenu : ' + s.venue);
    if (s.device !== 'solo') fails.push('un seul telephone non retenu : ' + s.device);
    if (s.mode !== 'tours') fails.push('mode non retenu : ' + s.mode);
    if (s.maxTurns !== 3) fails.push('nombre de tours non retenu : ' + s.maxTurns);
    step('reglages : ' + s.venue + ' / ' + s.device + ' / ' + s.mode + ' / ' + s.maxTurns + ' tours');

    c.K.state.players = ['Alice', 'Bob', 'Chloe', 'David']
      .map((n, i) => c.K.newPlayer(n, c.K.COLORS[i].id));
    c.K.board.generate(40);
    const types = c.K.board.typeList();
    /* Ce qui est autorise se verifie sur la regle : le plateau force ses
       deux premieres cases en quiz et peut effacer un type rare. Ce qui
       est interdit, en revanche, ne peut jamais apparaitre. */
    ['vingtetun', 'mime', 'aveugle'].forEach(t => {
      if (!c.K.rules.tileAllowed(t)) fails.push('"' + t + '" devrait etre jouable en vrai');
    });
    if (c.K.rules.tileAllowed('duel')) fails.push('le duel ne se joue pas a un seul telephone');
    if (types.indexOf('duel') >= 0) fails.push('le duel se trouve pourtant sur le plateau');
    step('en vrai : le 21, le mime et A l aveugle reviennent, le duel reste au vestiaire (1 seul telephone)');

    c.errors.forEach(e => fails.push('irl : ' + e));
  }

  /* =====================================================
     3. Rejoindre directement depuis le titre
     ===================================================== */
  {
    const c = await boot();
    click(c.win, c.$('#btnJoinQuick'), c.errors);
    await until(() => ecran(c) === 'screen-lobby', 5000, 'salon');
    if (!c.$('#netCode')) fails.push('le champ du code n est pas la : rejoindre ne sert a rien');
    if (c.K.state.settings.device !== 'multi') fails.push('rejoindre devrait passer en multi-telephones');
    step('REJOINDRE mene directement au champ du code');
    c.errors.forEach(e => fails.push('rejoindre : ' + e));
  }

  console.log('');
  console.log(fails.length ? 'ECHECS :\n - ' + fails.join('\n - ') : 'CONFIGURATION MENEE PAR KWA : OK');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('\nECHEC : ' + e.message); process.exit(1); });
