/* =========================================================
   Les nouveaux systemes : cases eclair, paris, evenements
   de foret et pactes de Kwa.

   D abord la logique pure, puis une partie entiere menee
   jusqu au classement final — c est le seul moyen de savoir
   que les treize types de cases s enchainent sans casser.
   ========================================================= */
'use strict';
const { boot, click, sleep } = require('./harness');

const until = async (fn, ms, label) => {
  const t0 = Date.now();
  while (Date.now() - t0 < (ms || 20000)) {
    const v = fn();
    if (v) return v;
    await sleep(90);
  }
  throw new Error('delai depasse : ' + label);
};

/** reponse automatique a n importe quelle question posee a un joueur */
function repondeur(K) {
  return (player, spec) => {
    switch (spec.kind) {
      case 'list':    return Promise.resolve(spec.items[0] && spec.items[0].id);
      case 'choice':  return Promise.resolve(Math.random() < 0.5 ? 'a' : 'b');
      case 'text':    return Promise.resolve('Une anecdote parfaitement vraie.');
      case 'secret':  return Promise.resolve(true);
      case 'bet':     return Promise.resolve(1 + Math.floor(Math.random() * 10));
      case 'quiz':    return Promise.resolve(Math.floor(Math.random() * 4));
      case 'reveal':  return Promise.resolve(Math.random() < 0.5);
      case 'info':    return Promise.resolve(true);
      case 'mime':    return Promise.resolve(Math.floor(Math.random() * 5));
      case 'raccord': return Promise.resolve(Math.floor(Math.random() * 4));
      case 'counter': return Promise.resolve(Math.floor(Math.random() * 5));
      default:        return Promise.resolve(null);
    }
  };
}

/** tape sur tout ce qui attend un doigt, jusqu a la fin de la partie */
async function joueJusquAuBout(ctx, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (ctx.K.state.over) return true;
    const foot = ctx.win.document.querySelector('.ov-foot button:not([disabled])');
    if (foot) click(ctx.win, foot, ctx.errors);
    else {
      const act = ctx.$('#actBtn');
      if (act) click(ctx.win, act, ctx.errors);
      else {
        const b = ctx.$('#kwaBubble');
        if (b) click(ctx.win, b, ctx.errors);
      }
    }
    await sleep(60);
  }
  return ctx.K.state.over;
}

/** prepare une partie sans passer par les menus */
async function partie(reglages) {
  const ctx = await boot();
  const K = ctx.K;
  Object.assign(K.state.settings, {
    venue: 'irl', device: 'solo', mode: 'tours', maxTurns: 2,
    boardLength: 20, spicy: true, duelSolo: false,
    evenements: true, paris: true, pactes: true, sound: false
  }, reglages || {});
  K.state.players = [
    K.newPlayer('Alice', 'rouge'),
    K.newPlayer('Bob', 'bleu'),
    K.newPlayer('Chloe', 'vert')
  ];
  K.ask = repondeur(K);
  return ctx;
}

(async () => {
  const fails = [];
  const step = s => console.log('  · ' + s);

  /* =====================================================
     1. Repartition du plateau
     ===================================================== */
  {
    const c = await boot();
    Object.assign(c.K.state.settings, { venue: 'irl', device: 'multi', duelSolo: false });
    c.K.board.generate(60);
    const types = c.K.board.typeList();
    const eclairs = types.filter(t => (c.K.TILE_TYPES[t] || {}).eclair).length;
    const quiz = types.filter(t => t === 'quiz').length;
    const part = Math.round(eclairs / types.length * 100);

    if (eclairs < 6) fails.push('trop peu de cases eclair (' + eclairs + ') : le rythme ne changera pas');
    if (part > 32) fails.push('trop de cases eclair (' + part + '%) : le jeu perd ses epreuves');
    ['echange', 'peage', 'roue'].forEach(t => {
      if (types.indexOf(t) < 0) fails.push('la case "' + t + '" n apparait jamais');
    });
    step('sur 60 cases : ' + quiz + ' quiz, ' + eclairs + ' eclair (' + part + '%), ' +
         (types.length - quiz - eclairs - 2) + ' grosses epreuves');
  }

  /* =====================================================
     2. Les cases eclair, une par une
     ===================================================== */
  {
    const c = await boot();
    const K = c.K;
    K.kwa.say = () => Promise.resolve();
    K.anim.roue = () => Promise.resolve();
    K.state.players = [
      K.newPlayer('Alice', 'rouge'),
      K.newPlayer('Bob', 'bleu')
    ];
    const [a, b] = K.state.players;
    a.pos = 4; b.pos = 11;

    /* echange : Alice choisit Bob, ils troquent leurs positions */
    K.ask = (p, spec) => Promise.resolve(spec.items[0].id);
    let res = await K.tiles.echange({ player: a, tile: {}, players: K.state.players });
    const da = res.find(r => r.id === a.id).delta;
    const db = res.find(r => r.id === b.id).delta;
    if (da !== 7 || db !== -7) fails.push('echange : deltas incoherents (' + da + ' / ' + db + ')');
    if (da + db !== 0) fails.push('echange : les deux joueurs ne se croisent pas');
    step('echange : Alice ' + (da > 0 ? '+' : '') + da + ', Bob ' + db + ' (elle passe de 4 a 11)');

    /* peage : 4 cases pour soi, 2 offertes */
    res = await K.tiles.peage({ player: a, tile: {}, players: K.state.players });
    if (res.find(r => r.id === a.id).delta !== 4) fails.push('peage : le joueur devrait avancer de 4');
    if (res.find(r => r.id === b.id).delta !== 2) fails.push('peage : l oblige devrait avancer de 2');
    step('peage : +4 pour le joueur, +2 pour celui qu il designe');

    /* roue : toujours dans la fourchette annoncee */
    const vus = {};
    for (let i = 0; i < 60; i++) {
      const r = await K.tiles.roue({ player: a, tile: {}, players: K.state.players });
      const v = r[0].delta;
      if (v < -3 || v > 5 || v === 0) fails.push('roue : valeur hors fourchette (' + v + ')');
      vus[v] = 1;
    }
    step('roue : ' + Object.keys(vus).sort((x, y) => x - y).join(', ') + ' sur 60 tirages');
  }

  /* =====================================================
     3. Les evenements de foret
     ===================================================== */
  {
    const c = await boot();
    const K = c.K;
    K.state.players = [K.newPlayer('Alice', 'rouge'), K.newPlayer('Bob', 'bleu')];
    const [a, b] = K.state.players;
    a.pos = 10; b.pos = 2;
    const base = () => [{ id: a.id, delta: 3 }, { id: b.id, delta: -2 }];

    K.state.event = { id: 'nuit', mult: 2 };
    let r = K.events.apply(base());
    if (r[0].delta !== 6 || r[1].delta !== -4) fails.push('la nuit ne double pas tout : ' + JSON.stringify(r));
    step('la nuit tombe : +3/-2 devient +6/-4');

    K.state.event = { id: 'inversion', invert: true };
    r = K.events.apply(base());
    if (r[0].delta !== -3 || r[1].delta !== 2) fails.push('l inversion ne renverse pas les gains');
    step('inversion : +3/-2 devient -3/+2');

    K.state.event = { id: 'treve', treve: true };
    r = K.events.apply(base());
    if (r[0].delta !== 3 || r[1].delta !== 0) fails.push('la treve laisse passer un malus');
    step('treve : le malus est annule, le gain reste');

    /* vent contraire : Alice mene, Bob gagne, Alice paie */
    K.state.event = { id: 'vent', taxe: true };
    r = K.events.apply([{ id: b.id, delta: 2 }]);
    const taxe = r.find(x => x.id === a.id);
    if (!taxe || taxe.delta !== -1) fails.push('vent contraire : le leader ne paie pas');
    step('vent contraire : Bob gagne 2, Alice (en tete) perd 1');

    /* la regle ne doit pas s appliquer quand on demande du brut */
    K.state.event = null;
    if (K.events.apply(base())[0].delta !== 3) fails.push('sans evenement, les gains sont modifies');
    step('sans evenement en cours, rien n est touche');
  }

  /* =====================================================
     3 bis. Quand les evenements se declenchent
     ===================================================== */
  {
    const c = await boot();
    const K = c.K;
    /* on coupe la mise en scene : ici on ne teste que le declenchement */
    K.kwa.say = () => Promise.resolve();
    K.kwa.setMood = () => {};
    K.anim.fx = () => Promise.resolve();
    let applique = null;
    K.game.applyResults = async r => { applique = r; return r; };

    Object.assign(K.state.settings, {
      venue: 'irl', device: 'solo', mode: 'tours', maxTurns: 5,
      evenements: true, paris: true
    });
    K.state.turn = 1;
    K.board.generate(40);
    K.state.players = [
      K.newPlayer('Alice', 'rouge'), K.newPlayer('Bob', 'bleu'), K.newPlayer('Chloe', 'vert')
    ];
    const [a, b, ch] = K.state.players;

    /* --- un gros ecart avec le dernier appelle la maree --- */
    a.pos = 14; b.pos = 12; ch.pos = 2;      /* ecart 12, meneur peu detache */
    K.events.reset();
    const calme = [];
    for (let i = 0; i < 3; i++) calme.push(await K.events.maybe());
    if (calme.some(Boolean)) fails.push('un evenement tombe avant le temps de repos');
    const t3 = await K.events.maybe();
    if (!t3 || t3.id !== 'champignons') {
      fails.push('un ecart de 12 cases devrait appeler la maree de champignons, pas ' +
                 (t3 ? t3.id : 'rien'));
    } else {
      const dCh = (applique || []).find(x => x.id === ch.id);
      const dA = (applique || []).find(x => x.id === a.id);
      if (!dCh || !dA || dCh.delta <= dA.delta) {
        fails.push('la maree ne pousse pas davantage le dernier');
      } else {
        step('ecart de 12 cases -> maree de champignons : ' + ch.name + ' +' + dCh.delta +
             ', les autres +' + dA.delta);
      }
      if (K.state.event) fails.push('un effet immediat ne devrait pas rester actif');
    }
    if (await K.events.maybe()) fails.push('deux evenements s enchainent sans repos');
    step('apres un evenement, la foret se tait pendant plusieurs tours');

    /* --- un meneur qui s echappe appelle le vent --- */
    a.pos = 14; b.pos = 9; ch.pos = 9;       /* avance 5, ecart 5 */
    K.events.reset();
    await K.events.maybe(); await K.events.maybe(); await K.events.maybe();
    const vent = await K.events.maybe();
    if (!vent || vent.id !== 'vent') {
      fails.push('un meneur detache de 5 cases devrait lever le vent contraire, pas ' +
                 (vent ? vent.id : 'rien'));
    } else {
      if (!K.state.event || K.state.event.id !== 'vent') fails.push('le vent ne reste pas actif');
      step('meneur detache de 5 cases -> vent contraire, actif ' + K.state.event.reste + ' tours');
    }

    /* --- la regle expire toute seule --- */
    await K.events.maybe(); await K.events.maybe(); await K.events.maybe();
    if (K.state.event) fails.push('la regle ne s efface pas apres sa duree');
    else step('la regle s efface toute seule au bout de sa duree');

    /* --- coupee dans les reglages, il ne se passe rien --- */
    K.state.settings.evenements = false;
    K.events.reset();
    let rien = true;
    for (let i = 0; i < 12; i++) if (await K.events.maybe()) rien = false;
    if (!rien) fails.push('les evenements se declenchent alors qu ils sont coupes');
    step('coupes dans les reglages : plus aucun evenement');
  }

  /* =====================================================
     4. Les paris
     ===================================================== */
  {
    const c = await boot();
    const K = c.K;
    K.state.players = [K.newPlayer('Alice', 'rouge'), K.newPlayer('Bob', 'bleu')];
    const [a, b] = K.state.players;
    K.state.event = null;

    /* la vedette gagne : celui qui a mise sur elle encaisse */
    let r = K.bets.settle({ [a.id]: 'a', [b.id]: 'b' }, 5, { id: 'star' });
    if (r.find(x => x.id === a.id).delta !== 1) fails.push('bon pari non recompense');
    if (r.find(x => x.id === b.id).delta !== -1) fails.push('mauvais pari non sanctionne');
    step('vedette gagnante : +1 a celui qui y croyait, -1 a l autre');

    /* la vedette se plante : c est l inverse */
    r = K.bets.settle({ [a.id]: 'a', [b.id]: 'b' }, 0, { id: 'star' });
    if (r.find(x => x.id === a.id).delta !== -1) fails.push('pari optimiste non sanctionne sur un echec');
    if (r.find(x => x.id === b.id).delta !== 1) fails.push('pari pessimiste non recompense sur un echec');
    step('vedette qui se plante : les gains s inversent');

    /* un recul compte comme un echec */
    r = K.bets.settle({ [a.id]: 'a' }, -2, { id: 'star' });
    if (r[0].delta !== -1) fails.push('reculer devrait compter comme un echec');

    /* grosse cote : la mise double */
    K.state.event = { id: 'cote', betMult: 2 };
    r = K.bets.settle({ [a.id]: 'a' }, 3, { id: 'star' });
    if (r[0].delta !== 2) fails.push('grosse cote : la mise ne double pas (' + r[0].delta + ')');
    step('grosse cote : la mise passe a 2 cases');
    K.state.event = null;
  }

  /* =====================================================
     5. Une partie entiere, tous systemes allumes
     ===================================================== */
  {
    const c = await partie();
    const K = c.K;
    let evenements = 0, paris = 0;
    const vraiMaybe = K.events.maybe;
    K.events.maybe = async function () {
      const out = await vraiMaybe.apply(this, arguments);
      if (out) evenements++;
      return out;
    };
    const vraiCollect = K.bets.collect;
    K.bets.collect = function () { paris++; return vraiCollect.apply(this, arguments); };

    K.game.start();
    const fini = await joueJusquAuBout(c, 180000);
    if (!fini) fails.push('la partie ne s est pas terminee en 3 minutes');
    else step('partie terminee : ' + evenements + ' evenements de foret, ' + paris + ' series de paris');

    const last = K.board.last();
    K.state.players.forEach(p => {
      if (p.pos < 0 || p.pos > last) fails.push(p.name + ' est hors du plateau (case ' + p.pos + ')');
      if (!Number.isFinite(p.pos)) fails.push(p.name + ' a une position invalide');
    });
    if (K.ranking().length !== 3) fails.push('le classement final ne contient pas 3 joueurs');
    if (K.state.event) fails.push('une regle de foret est encore active apres la fin');
    step('positions finales : ' + K.state.players.map(p => p.name + ' ' + p.pos).join(', '));

    c.errors.forEach(e => fails.push('partie : ' + e));
  }

  /* =====================================================
     6. Une partie ou Kwa propose un pacte a chaque tour
     ===================================================== */
  {
    const c = await partie({ maxTurns: 2 });
    const K = c.K;
    /* rnd toujours a zero : le tirage du pacte tombe a chaque fois */
    K.util.rnd = () => 0;
    let pactes = 0, acceptes = 0;
    const vrai = K.pacte.maybe;
    K.pacte.maybe = async function () {
      pactes++;
      const out = await vrai.apply(this, arguments);
      if (out) acceptes++;
      return out;
    };
    /* on accepte tout ce que Kwa propose */
    const rep = repondeur(K);
    K.ask = (p, spec) => (spec.icon === '🤝' ? Promise.resolve('a') : rep(p, spec));

    K.game.start();
    const fini = await joueJusquAuBout(c, 180000);
    if (!fini) fails.push('la partie a pactes ne s est pas terminee');
    if (!acceptes) fails.push('aucun pacte n a ete conclu alors qu ils etaient forces');
    else step(acceptes + ' pactes conclus sur ' + pactes + ' propositions, partie terminee');

    const last = K.board.last();
    K.state.players.forEach(p => {
      if (p.pos < 0 || p.pos > last) fails.push(p.name + ' est hors du plateau apres un pacte (case ' + p.pos + ')');
    });
    step('positions finales : ' + K.state.players.map(p => p.name + ' ' + p.pos).join(', '));

    c.errors.forEach(e => fails.push('pactes : ' + e));
  }

  console.log('');
  console.log(fails.length ? 'ECHECS :\n - ' + fails.join('\n - ') : 'CASES ECLAIR, PARIS, EVENEMENTS ET PACTES : OK');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('\nECHEC : ' + e.message); process.exit(1); });
