/* =========================================================
   CE QUI SE PASSE AVANT L EPREUVE

   Deux choses qui ne se voient pas dans le code d une case et
   qui pourtant decident de son interet :

   - le theme du quiz se decouvre AVANT que les paris s ouvrent,
     sinon on mise a l aveugle sur une tete ;
   - au Mot Raccord, ce n est pas celui qui cherche ses mots qui
     coche ce qu il trouve.
   ========================================================= */
'use strict';
const { boot, click, sleep } = require('./harness');

async function table(reglages, noms) {
  const ctx = await boot();
  const K = ctx.K;
  Object.assign(K.state.settings, {
    venue: 'irl', device: 'solo', mode: 'tours', maxTurns: 1,
    boardLength: 14, sound: false, spicy: true,
    evenements: false, paris: false, pactes: false, esprit: false
  }, reglages || {});
  K.state.players = (noms || ['Alice', 'Bob', 'Chloe'])
    .map((n, i) => K.newPlayer(n, K.COLORS[i].id));
  return ctx;
}

/** un plateau ou toutes les cases jouables sont des quiz */
function plateauQuiz(K, len) {
  const types = ['start'];
  for (let i = 1; i < len - 1; i++) types.push('quiz');
  types.push('finish');
  K.board.generate = () => K.board.build(types);
}

async function jusquAuBout(c, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < (ms || 60000)) {
    if (c.K.state.over) return true;
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
}

(async () => {
  const fails = [];
  const step = s => console.log('  · ' + s);

  /* =====================================================
     1. La carte du theme
     ===================================================== */
  {
    const c = await table();
    const K = c.K;

    if (!K.tileIntro || !K.tileIntro.quiz) {
      fails.push('le quiz n a pas d ouverture : le theme ne se tire pas');
    } else {
      const p = K.state.players[0];
      const avant = await K.tileIntro.quiz({ player: p, tile: {}, players: K.state.players });
      if (!avant || !avant.card) fails.push('l ouverture du quiz ne tire aucune carte');
      else if (!K.CARDS.some(x => x.t === avant.card.t)) fails.push('la carte tiree ne vient pas du paquet');
      else if (avant.sujet !== avant.card.t) fails.push('le sujet annonce n est pas le theme de la carte');
      else step('ouverture du quiz : carte "' + avant.card.t + '" (' + avant.card.c + ')');

      /* le projecteur se referme derriere lui */
      if (c.$('#spotlight')) fails.push('la carte reste affichee apres l ouverture');
      else step('le projecteur se referme une fois la carte lue');

      /* et l epreuve joue CETTE carte, elle n en retire pas une autre */
      let vu = null;
      K.kwa.say = () => Promise.resolve();
      K.util.panel = () => Promise.resolve();
      K.ask = (pl, spec) => {
        if (!vu && spec.kind === 'bet') { vu = spec; return Promise.resolve(1); }
        return Promise.resolve(spec.kind === 'quiz' ? spec.good : true);
      };
      await K.tiles.quiz({ player: p, tile: {}, players: K.state.players, avant });
      if (!vu) fails.push('le quiz ne demande pas son niveau au joueur');
      else if (vu.theme !== avant.card.t) {
        fails.push('l epreuve joue "' + vu.theme + '" alors que la carte montree etait "' + avant.card.t + '"');
      } else step('l epreuve joue bien la carte qui a ete montree');
    }
  }

  /* =====================================================
     2. L ordre : carte, paris, epreuve
     ===================================================== */
  {
    const c = await table({ device: 'multi', paris: true, maxTurns: 1 }, ['Alice', 'Bob']);
    const K = c.K;
    plateauQuiz(K, 14);

    /* on repond a tout automatiquement : ce test-ci mesure un ordre,
       pas des doigts */
    K.ask = (pl, spec) => Promise.resolve(
      spec.kind === 'bet' ? 3 :
      spec.kind === 'quiz' ? spec.good :
      spec.kind === 'choice' ? 'a' :
      spec.kind === 'reveal' ? true : null);

    const ordre = [];
    const vraieCarte = K.tileIntro.quiz;
    K.tileIntro.quiz = async ctx => { ordre.push('carte'); return vraieCarte(ctx); };
    const vraisParis = K.bets.collect;
    K.bets.collect = async (star, tile, players, sujet) => {
      ordre.push('paris' + (sujet ? ':' + sujet : ':rien'));
      return vraisParis(star, tile, players, sujet);
    };
    const vraiQuiz = K.tiles.quiz;
    K.tiles.quiz = async ctx => { ordre.push('epreuve'); return vraiQuiz(ctx); };

    K.game.start();
    if (!await jusquAuBout(c, 120000)) fails.push('la partie ne se termine pas');

    const trois = ordre.slice(0, 3);
    if (trois.join('|').indexOf('carte|paris') !== 0) {
      fails.push('les paris ne passent pas apres la carte : ' + trois.join(' > '));
    } else if (trois[1] === 'paris:rien') {
      fails.push('les paris s ouvrent sans annoncer le theme');
    } else if (trois[2] !== 'epreuve') {
      fails.push('l epreuve ne vient pas en dernier : ' + trois.join(' > '));
    } else {
      step('ordre respecte : ' + trois.join(' > '));
    }
    c.errors.forEach(e => fails.push('erreur javascript : ' + e));
  }

  /* =====================================================
     3. Le carnet du Mot Raccord
     ===================================================== */
  {
    const c = await table({}, ['Alice', 'Bob', 'Chloe']);
    const K = c.K;
    K.kwa.say = () => Promise.resolve();
    K.util.panel = () => Promise.resolve();

    const [a, b] = K.state.players;

    /* a un seul telephone, celui qui cherche coche : personne d autre
       ne peut voir l ecran */
    let cible = null;
    K.ask = (pl, spec) => { cible = pl; return Promise.resolve(3); };
    await K.tiles.motraccord({ player: a, tile: {}, players: K.state.players });
    if (!cible || cible.id !== a.id) {
      fails.push('a un seul telephone, le carnet devrait rester chez le joueur');
    } else step('un seul telephone : ' + a.name + ' coche ses propres mots');

    /* des qu il y a plusieurs ecrans, le carnet passe au voisin */
    K.net.isActive = () => true;
    cible = null;
    let spec = null;
    K.ask = (pl, sp) => { cible = pl; spec = sp; return Promise.resolve(3); };
    await K.tiles.motraccord({ player: a, tile: {}, players: K.state.players });
    if (!cible) fails.push('personne ne recoit le carnet');
    else if (cible.id === a.id) fails.push('le joueur interroge coche encore ses propres mots');
    else if (cible.id !== b.id) fails.push('le carnet ne va pas au voisin de tour mais a ' + cible.name);
    else step('plusieurs ecrans : ' + b.name + ' tient le carnet de ' + a.name);
    if (spec && spec.jury !== a.name) fails.push('l ecran du jury ne dit pas qui il juge');

    /* et le voisin absent est saute : un carnet chez quelqu un de
       deconnecte bloquerait la partie */
    b.off = true;
    cible = null;
    await K.tiles.motraccord({ player: a, tile: {}, players: K.state.players });
    if (!cible || cible.id !== K.state.players[2].id) {
      fails.push('le carnet part chez un joueur deconnecte');
    } else step('voisin deconnecte : le carnet passe au suivant');
    b.off = false;

    /* la lettre et les consignes restent visibles pour tout le monde */
    if (c.$('#spotlight')) fails.push('la liste publique reste affichee apres l epreuve');
    else step('la liste publique se referme avec l epreuve');

    c.errors.forEach(e => fails.push('erreur javascript : ' + e));
  }

  /* =====================================================
     4. Chacun voit ce qui est demande
     Un joueur repond sur son telephone ; les autres doivent
     voir la question, sinon ils regardent quelqu un fixer un
     ecran. Et jamais ce qui est secret.
     ===================================================== */
  {
    const c = await table({}, ['Alice', 'Bob', 'Chloe']);
    const K = c.K;
    K.kwa.say = () => Promise.resolve();
    K.util.panel = () => Promise.resolve();
    K.util.precharge = () => Promise.resolve(true);
    K.anim.objet = () => Promise.resolve();

    /* on espionne l ecran public sans casser son fonctionnement */
    const vus = [];
    const vraiMontre = K.scene.montre;
    K.scene.montre = html => { vus.push(html); return vraiMontre(html); };

    const [a] = K.state.players;

    /* --- le quiz --- */
    vus.length = 0;
    let question = null;
    K.ask = (p, spec) => {
      if (spec.kind === 'bet') return Promise.resolve(4);
      if (spec.kind === 'quiz') { question = spec; return Promise.resolve(spec.good); }
      return Promise.resolve(true);
    };
    const avant = await K.tileIntro.quiz({ player: a, tile: {}, players: K.state.players });
    await K.tiles.quiz({ player: a, tile: {}, players: K.state.players, avant });

    if (!vus.length) fails.push('le quiz ne montre rien a la table');
    else if (question && vus.join('').indexOf(question.text) < 0) {
      fails.push('la question du quiz n est pas affichee publiquement');
    } else if (question && question.choices.some(ch => vus.join('').indexOf(ch) < 0)) {
      fails.push('les propositions ne sont pas affichees a la table');
    } else {
      step('quiz : la question et ses ' + question.choices.length + ' propositions sont publiques');
    }
    if (c.$('#spotlight')) fails.push('la carte publique du quiz reste affichee apres l epreuve');

    /* --- le cliche --- */
    vus.length = 0;
    let photo = null;
    K.ask = (p, spec) => {
      if (spec.kind === 'photo') { photo = spec; return Promise.resolve({ k: spec.good, phase: 1 }); }
      return Promise.resolve(4);
    };
    await K.tiles.cliche({ player: a, tile: {}, players: K.state.players });
    if (!photo) fails.push('le cliche ne pose pas sa question');
    else if (!vus.length || vus.join('').indexOf(photo.url) < 0) {
      fails.push('la photo du Cliche n est pas montree a la table');
    } else step('cliche : la photo et ses propositions passent sur tous les ecrans');
    if (c.$('#spotlight')) fails.push('la carte publique du Cliche reste affichee apres l epreuve');

    /* --- le mot raccord, y compris a un seul telephone --- */
    vus.length = 0;
    let raccord = null;
    K.ask = (p, spec) => { raccord = spec; return Promise.resolve(3); };
    await K.tiles.motraccord({ player: a, tile: {}, players: K.state.players });
    if (!raccord) fails.push('le mot raccord ne pose pas sa question');
    else if (!vus.length) {
      fails.push('le mot raccord ne montre la lettre a personne');
    } else if (raccord.items.some(it => vus.join('').indexOf(it) < 0)) {
      fails.push('les consignes du mot raccord ne sont pas publiques');
    } else step('mot raccord : la lettre et les cinq consignes sont publiques');

    /* --- et ce qui est secret le reste --- */
    vus.length = 0;
    let mot = null;
    K.ask = (p, spec) => {
      if (spec.kind === 'secret') { mot = spec.word; return Promise.resolve(true); }
      if (spec.kind === 'list') return Promise.resolve(spec.items[0].id);
      return Promise.resolve(true);
    };
    await K.tiles.verite({ player: a, tile: {}, players: K.state.players });
    if (mot && vus.join('').indexOf(mot) >= 0) {
      fails.push('le mot secret de Verite ou Mensonge est affiche a toute la table');
    } else step('rien de secret ne passe par l ecran public');

    K.scene.montre = vraiMontre;
    c.errors.forEach(e => fails.push('erreur javascript : ' + e));
  }

  await sleep(50);
  if (fails.length) {
    console.log('\nECHECS :');
    fails.forEach(f => console.log(' - ' + f));
    process.exit(1);
  }
  console.log('\nAVANT L EPREUVE : OK');
  process.exit(0);
})();
