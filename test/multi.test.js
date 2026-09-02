/* =========================================================
   Une partie a trois telephones, du salon au premier de.
   ========================================================= */
'use strict';
const { boot, click, type, sleep } = require('./harness');

const until = async (fn, ms, label) => {
  const t0 = Date.now();
  while (Date.now() - t0 < (ms || 20000)) {
    if (fn()) return true;
    await sleep(120);
  }
  throw new Error('delai depasse : ' + label);
};

/** tape sur la bulle de Kwa jusqu a ce que la condition soit vraie */
async function tapThrough(ctx, fn, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < (ms || 30000)) {
    if (fn()) return true;
    const b = ctx.$('#kwaBubble');
    if (b) click(ctx.win, b, ctx.errors);
    await sleep(120);
  }
  throw new Error('delai depasse en tapant sur Kwa');
}

async function toLobby(name) {
  const ctx = await boot();
  click(ctx.win, ctx.$('[data-go="mode"]'), ctx.errors);
  click(ctx.win, ctx.$('.opt[data-val="multi"]'), ctx.errors);
  click(ctx.win, ctx.$('#btnToPlayers'), ctx.errors);
  type(ctx.win, ctx.$('#netName'), name);
  return ctx;
}

(async () => {
  const fails = [];
  const step = s => console.log('  · ' + s);

  /* --- le salon --- */
  const host = await toLobby('Maxime');
  click(host.win, host.$('#netCreate'), host.errors);
  await until(() => host.$('#lobbyBody .code'), 5000, 'code du salon');
  const code = host.$('#lobbyBody .code').textContent;
  step('salon cree, code ' + code);

  const guests = [];
  for (const name of ['Alice', 'Bob']) {
    const g = await toLobby(name);
    type(g.win, g.$('#netCode'), code);
    click(g.win, g.$('#netJoin'), g.errors);
    await until(() => g.$('#lobbyBody .code'), 5000, name + ' rejoint');
    guests.push(g);
    step(name + ' a rejoint');
  }
  await until(() => host.K.state.players.length === 3, 4000, 'les 3 joueurs cotes hote');
  step('joueurs vus par l hote : ' + host.K.state.players.map(p => p.name).join(', '));

  /* --- lancement --- */
  click(host.win, host.$('#netStart'), host.errors);
  await until(() => host.$('#screen-game').classList.contains('is-active'), 5000, 'plateau chez l hote');
  await until(() => guests.every(g => g.$('#screen-game').classList.contains('is-active')), 8000, 'plateau chez les invites');
  step('les 3 ecrans sont sur le plateau');

  /* --- meme plateau partout --- */
  const ref = host.K.board.typeList().join(',');
  guests.forEach((g, i) => {
    if (g.K.board.typeList().join(',') !== ref) fails.push('plateau different chez l invite ' + (i + 1));
    const n = g.$('#tiles').children.length;
    if (n !== host.$('#tiles').children.length) fails.push('nombre de cases affichees different (' + n + ')');
  });
  step('plateau identique : ' + host.$('#tiles').children.length + ' cases, ' +
       host.$('#props').children.length + ' decors, ' + host.$('#pawns').children.length + ' pions');

  /* --- l ouverture : presentation + tirage de l ordre --- */
  await tapThrough(host, () => host.$('#actionZone').textContent.includes('DÉ') ||
                               host.$('#actionZone').textContent.includes('DE'), 60000);
  step('ouverture terminee, ordre tire : ' + host.K.state.players.map(p => p.name).join(' > '));

  await until(() => guests.every(g => g.K.state.players.map(p => p.id).join() ===
                                      host.K.state.players.map(p => p.id).join()), 6000, 'ordre propage');
  step('ordre de passage identique sur les 3 telephones');

  /* --- le bouton du de n est que chez le joueur actif --- */
  const actif = host.K.state.players[0];
  const holder = [host].concat(guests).find(c => c.K.net.meId() === actif.id);
  const others = [host].concat(guests).filter(c => c !== holder);
  if (!holder) fails.push('impossible de retrouver le telephone du joueur actif');
  else {
    if (!holder.$('#actBtn')) fails.push('le joueur actif (' + actif.name + ') n a pas le bouton du de');
    others.forEach(o => {
      if (o.$('#actBtn')) fails.push('un autre telephone a aussi le bouton du de');
      if (!o.$('#actionZone').textContent.includes(actif.name)) fails.push('les autres ne voient pas qui doit jouer');
    });
    step('bouton du de : uniquement chez ' + actif.name + ', les autres voient son nom');

    /* --- il lance, tout le monde voit le meme resultat --- */
    click(holder.win, holder.$('#actBtn'), holder.errors);
    await until(() => [host].concat(guests).every(c => c.$('#dice')), 6000, 'de affiche partout');
    step('le de roule sur les 3 ecrans');
    await until(() => host.K.state.players.some(p => p.pos > 0), 15000, 'deplacement du pion');
    const posHost = host.K.state.players.map(p => p.pos).join(',');
    await until(() => guests.every(g => g.K.state.players.map(p => p.pos).join() === posHost), 8000, 'positions propagees');
    step('positions identiques partout : ' + posHost);
  }

  /* --- texte de Kwa identique --- */
  const kh = host.$('#kwaText').textContent.trim();
  guests.forEach((g, i) => {
    const kg = g.$('#kwaText').textContent.trim();
    if (kg && kh && kg !== kh) fails.push('bulle differente chez l invite ' + (i + 1) + ' : "' + kg + '" vs "' + kh + '"');
  });
  step('bulle de Kwa : "' + kh.slice(0, 60) + '"');

  [host].concat(guests).forEach((c, i) => c.errors.forEach(e => fails.push('ecran ' + i + ' : ' + e)));

  console.log('');
  console.log(fails.length ? 'ECHECS :\n - ' + fails.join('\n - ') : 'PARTIE A 3 TELEPHONES : OK');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('\nECHEC : ' + e.message); process.exit(1); });
