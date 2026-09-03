/* =========================================================
   LES EPREUVES OU TOUT LE MONDE JOUE

   Tic-Tac et Le Cliche en course. Ce qui se teste ici, ce sont
   les regles de classement : qui gagne quoi, et surtout qui
   perd. Une epreuve collective mal payee se remarque tout de
   suite a table.
   ========================================================= */
'use strict';
const { boot, sleep } = require('./harness');

async function table(reglages, noms) {
  const ctx = await boot();
  const K = ctx.K;
  Object.assign(K.state.settings, {
    venue: 'irl', device: 'solo', mode: 'tours', maxTurns: 3,
    boardLength: 20, sound: false,
    evenements: false, paris: false, pactes: false, esprit: false
  }, reglages || {});
  K.state.players = (noms || ['Alice', 'Bob', 'Chloe', 'David'])
    .map((n, i) => K.newPlayer(n, K.COLORS[i].id));
  K.kwa.say = () => Promise.resolve();
  K.kwa.setMood = () => {};
  K.util.panel = () => Promise.resolve();
  K.util.panelAuto = () => Promise.resolve();
  K.util.jingle = () => Promise.resolve();
  return ctx;
}

(async () => {
  const fails = [];
  const step = s => console.log('  · ' + s);

  /* =====================================================
     1. Ce que paie un classement
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    const [a, b, d, e] = K.state.players;

    const paie = rangs => {
      const out = {};
      K.simultane.recompense(rangs).forEach(r => { out[r.id] = r.delta; });
      return out;
    };

    const quatre = paie([a, b, d, e]);
    if (quatre[a.id] !== 2) fails.push('le premier ne prend pas 2 cases');
    if (quatre[b.id] !== 1) fails.push('le deuxieme ne prend pas 1 case');
    if (quatre[d.id] !== undefined) fails.push('le troisieme devrait ne rien prendre');
    if (quatre[e.id] !== -1) fails.push('le dernier ne perd pas 1 case');
    else step('a quatre : +2, +1, rien, -1');

    const trois = paie([a, b, d]);
    if (trois[a.id] !== 2 || trois[b.id] !== 1 || trois[d.id] !== -1) {
      fails.push('a trois joueurs le classement paie mal : ' + JSON.stringify(trois));
    } else step('a trois : +2, +1, -1');

    /* a deux, le deuxieme EST le dernier : il paie, il ne touche pas */
    const deux = paie([a, b]);
    if (deux[a.id] !== 2 || deux[b.id] !== -1) {
      fails.push('a deux joueurs : ' + JSON.stringify(deux) + ' au lieu de +2 / -1');
    } else step('a deux : +2 pour le gagnant, -1 pour le perdant, pas de lot de consolation');

    /* la somme ne doit jamais gonfler le plateau sans raison */
    const total = Object.keys(quatre).reduce((n, k) => n + quatre[k], 0);
    if (total > 2) fails.push('un classement distribue ' + total + ' cases : c est trop');
    else step('une manche distribue ' + total + ' cases au total');
  }

  /* =====================================================
     2. Tic-Tac : le plus proche gagne
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    const [a, b, d, e] = K.state.players;
    K.board.generate(20);

    /* Chaque joueur rend un temps calcule sur le but de CE tirage : le
       temps a atteindre change a chaque partie, un ecart fige serait
       mesure contre le mauvais objectif. Alice tombe pile, Bob a une
       demi-seconde, Chloe a deux, David a cinq. */
    let but = 0;
    const ecarts = {};
    ecarts[a.id] = 0;
    ecarts[b.id] = 500;
    ecarts[d.id] = -2000;
    ecarts[e.id] = 5000;
    K.ask = (p, spec) => {
      but = spec.but;
      const dec = ecarts[p.id];
      return Promise.resolve(dec === null ? 0 : Math.round(spec.but * 1000) + dec);
    };

    const res = await K.tiles.tictac({ player: a, tile: {}, players: K.state.players });

    const par = {};
    res.forEach(r => { par[r.id] = r.delta; });
    if (but < 4 || but > 15) fails.push('le temps a atteindre sort de l intervalle 4-15 (' + but + ')');
    if (par[a.id] !== 2) fails.push('le plus proche ne gagne pas 2 cases');
    if (par[b.id] !== 1) fails.push('le deuxieme ne gagne pas 1 case');
    if (par[e.id] !== -1) fails.push('le plus loin ne perd pas 1 case');
    if (par[d.id] !== undefined) fails.push('le troisieme ne devrait rien prendre');
    if (!fails.length) {
      step('tic-tac : but ' + but + 's, Alice pile (+2), Bob a 0.5s (+1), David a 5s (-1)');
    }

    /* celui qui ne joue pas ne prend rien, ni dans un sens ni dans l autre */
    ecarts[e.id] = null;
    const res2 = await K.tiles.tictac({ player: a, tile: {}, players: K.state.players });
    if (res2.some(r => r.id === e.id)) fails.push('un joueur qui n a pas joue est classe quand meme');
    else step('celui qui n a pas joue n est pas classe');

    c.errors.forEach(x => fails.push('tic-tac : ' + x));
  }

  /* =====================================================
     3. Le Cliche en course
     ===================================================== */
  {
    const c = await table({ device: 'multi' });
    const K = c.K;
    const [a, b, d, e] = K.state.players;
    K.util.precharge = () => Promise.resolve(true);

    /* on simule "chacun son ecran" sans reseau : c est le classement
       qu on veut verifier, pas le transport */
    K.simultane.possible = () => true;

    /* Les reponses se fabriquent a partir de la question POSEE : la
       bonne case change a chaque photo, une reponse figee tomberait
       juste une fois sur quatre.

       Bob trouve en 2s dans le flou complet, Alice trouve en 5s mais
       trop tard, Chloe se trompe, David ne repond pas. */
    K.simultane.demande = (joueurs, s) => {
      const rep = {};
      rep[b.id] = { k: s.good, phase: 0, ms: 2000 };
      rep[a.id] = { k: s.good, phase: 1, ms: 5000 };
      rep[d.id] = { k: (s.good + 1) % 4, phase: 1, ms: 3000 };
      return Promise.resolve(rep);
    };
    const res = await K.tiles.cliche({ player: a, tile: {}, players: K.state.players });

    const par = {};
    res.forEach(r => { par[r.id] = r.delta; });
    if (par[b.id] !== 4) {
      fails.push('le plus rapide devrait prendre les 4 cases du flou complet (recu ' + par[b.id] + ')');
    }
    if (par[a.id] !== undefined) fails.push('celui qui trouve trop tard ne devrait rien prendre');
    if (par[d.id] !== -2) fails.push('une mauvaise reponse devrait couter 2 cases (recu ' + par[d.id] + ')');
    if (par[e.id] !== undefined) fails.push('celui qui n a pas repondu ne devrait rien prendre');
    if (!fails.length) step('cliche en course : Bob le plus rapide +4, Chloe se trompe -2, les autres rien');

    /* et personne ne parie sur une epreuve ou tout le monde joue */
    const info = K.TILE_TYPES.cliche;
    if (!info.tous) fails.push('la case Cliche n est pas marquee comme collective');
    else step('marquee collective : les paris ne s ouvrent pas dessus a plusieurs ecrans');

    c.errors.forEach(x => fails.push('cliche : ' + x));
  }

  await sleep(50);
  if (fails.length) {
    console.log('\nECHECS :');
    fails.forEach(f => console.log(' - ' + f));
    process.exit(1);
  }
  console.log('\nEPREUVES COLLECTIVES : OK');
  process.exit(0);
})();
