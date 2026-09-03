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
    /* Kwa peut proposer un pacte a l hote lui-meme : un panneau s ouvre
       alors sur SON ecran, et taper sur la bulle derriere ne sert a
       rien. On repond d abord a ce qui est ouvert. */
    const ov = ctx.$('#overlay');
    const bouton = ov && !ov.hidden
      ? [...ov.querySelectorAll('button')].find(x => !x.disabled)
      : null;
    if (bouton) click(ctx.win, bouton, ctx.errors);
    else {
      /* fn() est faux : le bouton d action n est donc pas le de, mais
         un marche accepte qui remplace le lancer. On le prend. */
      const act = ctx.$('#actBtn');
      if (act) click(ctx.win, act, ctx.errors);
      else {
        const b = ctx.$('#kwaBubble');
        if (b) click(ctx.win, b, ctx.errors);
      }
    }
    await sleep(120);
  }
  throw new Error('delai depasse en tapant sur Kwa (ouverture : presentations puis rideau)\n' +
    '        etat des ecrans : ' + etatDesEcrans());
}

/**
 * Ce que montre chaque telephone, en une ligne.
 * Quand la partie se fige, la question est toujours la meme : qui
 * attend quoi ? Sans ca on relance le test en esperant voir passer.
 */
let tousLesEcrans = [];
function etatDesEcrans() {
  return tousLesEcrans.map(c => {
    const ov = c.$('#overlay');
    const ouvert = ov && !ov.hidden;
    const boutons = ouvert
      ? [...ov.querySelectorAll('button')].map(b => (b.disabled ? '[x]' : '[o]') +
          b.textContent.trim().slice(0, 18)).join(' ')
      : '-';
    return '\n          ' + ((c.K.player(c.K.net.meId()) || {}).name || '?') +
      ' | overlay ' + (ouvert ? 'OUVERT : ' + ov.textContent.trim().slice(0, 60) : 'ferme') +
      ' | boutons ' + boutons +
      ' | action "' + c.$('#actionZone').textContent.trim().slice(0, 30) + '"' +
      ' | kwa "' + c.$('#kwaText').textContent.trim().slice(0, 40) + '"';
  }).join('');
}


/**
 * Un pacte de Kwa ou une prise de paris tombe sur le telephone d un
 * invite, et l hote attend sa reponse : sans personne pour repondre
 * la-bas, la partie ne repart jamais. Ce petit automate joue le role
 * des invites — il ne touche jamais a l ecran de l hote.
 */
function repondPour(ctx) {
  const ov = ctx.$('#overlay');
  if (ov && !ov.hidden) {
    const b = [...ov.querySelectorAll('button')].find(x => !x.disabled);
    if (b) { click(ctx.win, b, ctx.errors); return; }
  }
  /* un marche accepte remplace le de : le bouton est alors dans la zone
     d action et personne ne le cliquerait. On ne touche jamais au de,
     que le test lance lui-meme au bon moment. */
  const act = ctx.$('#actBtn');
  if (act && !/DÉ|DE/.test(act.textContent)) click(ctx.win, act, ctx.errors);
}

/** fait repondre les invites en fond de tache tant que la partie tourne */
function autoInvites(ctxs) {
  const t = setInterval(() => ctxs.forEach(repondPour), 200);
  return () => clearInterval(t);
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
  /* le rideau doit etre en place partout avant que la foret s affiche */
  [host].concat(guests).forEach((c, i) => {
    const r = c.$('#rideau');
    if (!r || r.hidden) fails.push('ecran ' + i + ' : le plateau s affiche sans rideau');
  });
  step('rideau tire sur les 3 ecrans');

  const ref = host.K.board.typeList().join(',');
  guests.forEach((g, i) => {
    if (g.K.board.typeList().join(',') !== ref) fails.push('plateau different chez l invite ' + (i + 1));
    const n = g.$('#tiles').children.length;
    if (n !== host.$('#tiles').children.length) fails.push('nombre de cases affichees different (' + n + ')');
  });
  step('plateau identique : ' + host.$('#tiles').children.length + ' cases, ' +
       host.$('#props').children.length + ' decors, ' + host.$('#pawns').children.length + ' pions');

  tousLesEcrans = [host].concat(guests);
  const stop = autoInvites(guests);

  /* --- l ouverture : presentation + tirage de l ordre --- */
  await tapThrough(host, () => host.$('#actionZone').textContent.includes('DÉ') ||
                               host.$('#actionZone').textContent.includes('DE'), 150000);
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

    /* --- il lance, tout le monde voit le meme resultat ---
       Le de ne reste a l ecran qu une seconde et demie : on note au
       passage qui l a vu, plutot que d exiger que les trois ecrans
       l affichent dans la meme fraction de seconde. Sous charge, un
       telephone peut finir son animation avant qu un autre commence. */
    const vuLeDe = {};
    const tousVu = () => [host].concat(guests).every(c => vuLeDe[c.K.net.meId()]);
    const noter = () => {
      [host].concat(guests).forEach(c => { if (c.$('#dice')) vuLeDe[c.K.net.meId()] = true; });
      return tousVu();
    };

    click(holder.win, holder.$('#actBtn'), holder.errors);
    try {
      await until(noter, 8000, 'de affiche partout');
    } catch (e) {
      const etat = [host].concat(guests).map(c =>
        (c.K.player(c.K.net.meId()) || {}).name + ' : "' +
        c.$('#actionZone').textContent.trim().slice(0, 40) + '"').join(' | ');
      fails.push('le de ne roule pas sur tous les ecrans (' + etat + ')');
    }
    if (tousVu()) step('le de roule sur les 3 ecrans');
    await until(() => host.K.state.players.some(p => p.pos > 0), 15000, 'deplacement du pion');
    const posHost = host.K.state.players.map(p => p.pos).join(',');
    await until(() => guests.every(g => g.K.state.players.map(p => p.pos).join() === posHost), 8000, 'positions propagees');
    step('positions identiques partout : ' + posHost);
  }

  /* --- l ecran public de l epreuve arrive sur les trois telephones ---
     C est tout l interet du mode a plusieurs appareils : celui qui ne
     joue pas doit voir ce qui est demande, sinon il regarde quelqu un
     fixer un ecran qu il n a pas. */
  {
    const ecrans = [host].concat(guests);
    host.K.scene.montre(host.K.scene.question({
      cat: 'Test · niveau 4', titre: 'Les pyramides',
      texte: 'Combien de cotes a une pyramide a base carree ?',
      choix: ['Quatre', 'Trois', 'Cinq', 'Six'], duree: 20
    }));
    await until(() => ecrans.every(c => c.$('#spotlight')), 6000, 'carte publique partout');

    const manque = ecrans.filter(c => {
      const sl = c.$('#spotlight');
      return !sl || sl.textContent.indexOf('pyramide a base carree') < 0 ||
             sl.textContent.indexOf('Quatre') < 0;
    });
    if (manque.length) fails.push(manque.length + ' ecran(s) ne montrent pas la question posee');
    else step('la question et ses propositions s affichent sur les 3 telephones');

    if (!host.$('#spotlight .sc-jauge')) fails.push('la jauge de temps ne s affiche pas sur la carte');
    else step('la jauge des 20 secondes est sur la carte publique');

    host.K.scene.cache();
    await until(() => ecrans.every(c => !c.$('#spotlight')), 6000, 'carte publique retiree');
    step('la carte se retire des 3 ecrans en meme temps');
  }

  /* --- texte de Kwa identique --- */
  const kh = host.$('#kwaText').textContent.trim();
  guests.forEach((g, i) => {
    const kg = g.$('#kwaText').textContent.trim();
    if (kg && kh && kg !== kh) fails.push('bulle differente chez l invite ' + (i + 1) + ' : "' + kg + '" vs "' + kh + '"');
  });
  step('bulle de Kwa : "' + kh.slice(0, 60) + '"');

  stop();
  [host].concat(guests).forEach((c, i) => c.errors.forEach(e => fails.push('ecran ' + i + ' : ' + e)));

  console.log('');
  console.log(fails.length ? 'ECHECS :\n - ' + fails.join('\n - ') : 'PARTIE A 3 TELEPHONES : OK');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('\nECHEC : ' + e.message); process.exit(1); });
