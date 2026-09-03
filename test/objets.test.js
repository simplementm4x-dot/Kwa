/* =========================================================
   LES OBJETS

   La case Caisse ne fait avancer personne : elle remplit une
   poche. On verifie donc surtout ce qui se passe apres — le
   moment ou le joueur decide de s en servir, et l effet exact
   de chacun des cinq objets.

   Les deux derniers blocs jouent de vraies parties : le De +
   et la malediction du Fantome se branchent dans le moteur de
   tour, pas dans le module, et c est la que ca peut casser.
   ========================================================= */
'use strict';
const { boot, click, sleep } = require('./harness');

/** une partie prete a jouer, sans menus et sans animateur bavard */
async function table(reglages, noms) {
  const ctx = await boot();
  const K = ctx.K;
  Object.assign(K.state.settings, {
    venue: 'irl', device: 'solo', mode: 'tours', maxTurns: 2,
    boardLength: 20, sound: false,
    evenements: false, paris: false, pactes: false, esprit: false
  }, reglages || {});
  K.state.players = (noms || ['Alice', 'Bob', 'Chloe'])
    .map((n, i) => K.newPlayer(n, K.COLORS[i].id));
  K.board.generate(20);
  K.board.render();
  K.pawns.renderAll();
  K.objets.reset();
  K.kwa.say = () => Promise.resolve();
  K.kwa.setMood = () => {};
  K.anim.objet = () => Promise.resolve();
  K.anim.couleurs = () => Promise.resolve();
  return ctx;
}

/** un plateau ou aucune case ne fait rien : on ne mesure que le de */
function plateauNeutre(K, len) {
  const types = ['start'];
  for (let i = 1; i < len - 1; i++) types.push('start');
  types.push('finish');
  K.board.generate = () => K.board.build(types);
}

/** joue jusqu au classement final en tapant sur ce qui attend */
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
     1. Le catalogue
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    const liste = K.objets.liste();
    if (liste.length !== 5) fails.push('il ne reste que ' + liste.length + ' objets sur cinq');
    ['vaisseau', 'de', 'fantome', 'couleurs', 'rocher'].forEach(id => {
      const o = K.objets.byId(id);
      if (!o) fails.push('l objet "' + id + '" a disparu du catalogue');
      else if (!o.ico || !o.nom || !o.txt) fails.push('"' + id + '" n a pas de quoi s afficher');
    });
    step('cinq objets : ' + liste.map(o => o.ico + ' ' + o.nom).join(', '));

    /* la roue des couleurs ne doit favoriser personne sur la duree */
    const somme = K.objets.couleurs().reduce((n, s) => n + s.v, 0);
    if (somme !== 0) fails.push('la roue des couleurs penche de ' + somme + ' cases');
    else step('roue des couleurs : ' + K.objets.couleurs().length + ' quartiers, somme nulle');
  }

  /* =====================================================
     2. Une seule poche
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    K.game.hud = () => {};
    const [a] = K.state.players;

    /* on garde toujours ce qu on avait : le second choix de la liste */
    K.ask = (p, spec) => Promise.resolve(spec.items[spec.items.length - 1].id);
    await K.tiles.objet({ player: a, tile: {}, players: K.state.players });
    const premier = a.item;
    for (let i = 0; i < 8; i++) {
      await K.tiles.objet({ player: a, tile: {}, players: K.state.players });
    }
    if (a.item !== premier) {
      fails.push('refuser le nouvel objet finit quand meme par remplacer l ancien');
    } else step('huit caisses refusees : elle garde ' + K.objets.byId(premier).nom);

    /* et l inverse : on prend toujours le nouveau */
    K.ask = (p, spec) => Promise.resolve(spec.items[0].id);
    await K.tiles.objet({ player: a, tile: {}, players: K.state.players });
    if (!a.item) fails.push('prendre le nouvel objet vide la poche');
    else step('caisse acceptee : la poche contient ' + K.objets.byId(a.item).nom);
  }

  /* =====================================================
     3. Les cinq effets, un par un
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    K.game.hud = () => {};
    const [a, b, d] = K.state.players;

    /* "oui" a la question d usage, et la premiere cible ensuite */
    const repond = cible => (p, spec) => {
      if (spec.items.some(i => i.id === 'oui')) return Promise.resolve('oui');
      const trouve = spec.items.find(i => i.id === cible);
      return Promise.resolve(trouve ? trouve.id : spec.items[0].id);
    };

    /* --- le de + --- */
    a.item = 'de';
    K.ask = repond();
    let r = await K.objets.tour(a, { lance: true });
    if (!r || r.bonusDe !== 3) fails.push('le De + n ajoute pas 3 cases (' + JSON.stringify(r) + ')');
    if (a.item) fails.push('le De + reste en poche apres usage');
    else step('De + : +3 annonces au moteur, poche videe');

    /* et il ne se propose meme pas quand aucun de ne sera lance */
    a.item = 'de';
    if (await K.objets.tour(a, { lance: false })) fails.push('le De + s utilise sur un tour sans de');
    if (a.item !== 'de') fails.push('le De + se perd sur un tour sans de');
    else step('De + : ni propose ni perdu quand le de ne sera pas lance');
    a.item = null;

    /* --- le vaisseau : les deux positions se croisent --- */
    a.pos = 3; b.pos = 12; d.pos = 12;
    a.item = 'vaisseau';
    K.ask = repond();
    await K.objets.tour(a, { lance: true });
    if (a.pos !== 12) fails.push('le vaisseau ne pose pas le joueur a la place de sa cible (case ' + a.pos + ')');
    else if (b.pos !== 3 && d.pos !== 3) fails.push('la cible du vaisseau n a pas pris sa place');
    else step('vaisseau : Alice passe de 3 a ' + a.pos + ', sa cible descend a 3');

    /* --- le fantome --- */
    a.item = 'fantome';
    K.ask = repond(b.id);
    await K.objets.tour(a, { lance: true });
    if (!b.maudit) fails.push('le fantome ne maudit personne');
    else step('fantome : Bob est maudit');
    b.maudit = false;

    /* --- le rocher : la cible degringole jusqu au joueur d en dessous --- */
    a.pos = 2; b.pos = 17; d.pos = 9;
    a.item = 'rocher';
    K.ask = repond(b.id);
    await K.objets.tour(a, { lance: true });
    if (b.pos !== 9) {
      fails.push('le rocher ne pousse pas jusqu au joueur le plus proche derriere (case ' + b.pos + ' au lieu de 9)');
    } else step('rocher : Bob tombe de 17 a 9, la case de Chloe');

    /* personne derriere : le rocher ne roule pas et reste en poche */
    a.pos = 0; b.pos = 0; d.pos = 0;
    a.item = 'rocher';
    K.ask = repond();
    await K.objets.tour(a, { lance: true });
    if (a.item !== 'rocher') fails.push('le rocher se consomme alors qu il n a personne a pousser');
    else step('rocher : personne derriere, il reste en poche');
    a.item = null;

    /* --- la roue des couleurs --- */
    const valeurs = K.objets.couleurs().map(s => s.v);
    a.pos = 10; b.pos = 10; d.pos = 10;
    const vus = {};
    for (let i = 0; i < 40; i++) {
      b.pos = 10;
      a.item = 'couleurs';
      K.ask = repond(b.id);
      await K.objets.tour(a, { lance: true });
      const delta = b.pos - 10;
      if (valeurs.indexOf(delta) < 0) {
        fails.push('la roue des couleurs sort ' + delta + ', qui n est sur aucun quartier');
        break;
      }
      vus[delta] = 1;
    }
    step('roue des couleurs sur une cible : ' +
         Object.keys(vus).map(Number).sort((x, y) => x - y).join(', ') + ' sur 40 tirages');

    c.errors.forEach(e => fails.push('erreur javascript : ' + e));
  }

  /* =====================================================
     4. Le De + dans une vraie partie
     ===================================================== */
  {
    const c = await table({ mode: 'tours', maxTurns: 1, boardLength: 16 });
    const K = c.K;
    plateauNeutre(K, 16);
    /* tout le monde demarre avec le De +, et tout le monde le sort */
    K.objets.reset = () => K.state.players.forEach(p => { p.item = 'de'; p.maudit = false; });
    K.ask = (p, spec) => Promise.resolve(spec.items[0].id);
    K.game.des = async () => 1;

    K.game.start();
    if (!await jusquAuBout(c, 90000)) fails.push('la partie au De + ne se termine pas');
    const cases = K.state.players.map(p => p.pos);
    if (cases.some(v => v !== 4)) {
      fails.push('un de a 1 plus le De + devrait faire 4 cases, on lit : ' + cases.join(', '));
    } else step('De + dans une partie : 1 au de + 3 = 4 cases pour chacun');
    c.errors.forEach(e => fails.push('erreur javascript : ' + e));
  }

  /* =====================================================
     5. La malediction dans une vraie partie
     ===================================================== */
  {
    const c = await table({ mode: 'tours', maxTurns: 2, boardLength: 16 });
    const K = c.K;
    plateauNeutre(K, 16);
    K.objets.reset = () => K.state.players.forEach(p => { p.item = null; p.maudit = false; });

    /* chaque joueur est maudit juste avant de lancer */
    K.game.des = async () => { K.current().maudit = true; return 3; };
    K.ask = (p, spec) => Promise.resolve(spec.items[0].id);

    K.game.start();
    if (!await jusquAuBout(c, 90000)) fails.push('la partie maudite ne se termine pas');
    const cases = K.state.players.map(p => p.pos);
    if (cases.some(v => v !== 0)) {
      fails.push('un joueur maudit avance quand meme : ' + cases.join(', '));
    } else step('malediction : trois au de, trois cases en arriere, personne ne quitte le depart');
    if (K.state.players.some(p => p.maudit)) {
      fails.push('la malediction ne se consomme pas : elle collerait au joueur toute la partie');
    } else step('elle ne frappe qu une fois : plus personne n est maudit a la fin');
    c.errors.forEach(e => fails.push('erreur javascript : ' + e));
  }

  await sleep(50);
  if (fails.length) {
    console.log('\nECHECS :');
    fails.forEach(f => console.log(' - ' + f));
    process.exit(1);
  }
  console.log('\nLES OBJETS : OK');
  process.exit(0);
})();
