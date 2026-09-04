/* =========================================================
   Ce qui se passe quand quelqu un perd le reseau.

   On coupe pour de vrai : la socket est fermee et le
   constructeur WebSocket du telephone concerne se met a
   echouer, comme dans un ascenseur. On regarde ensuite si
   la partie tient, puis si le joueur revient a sa place.
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
  throw new Error('delai depasse en tapant sur Kwa (ouverture : presentations puis rideau)');
}

/** garde la main sur les sockets ouvertes par un ecran */
function trackSockets(ctx) {
  const Base = ctx.win.WebSocket;
  ctx.reseau = true;
  ctx.sockets = [];
  ctx.win.WebSocket = function (u) {
    if (!ctx.reseau) throw new Error('reseau coupe');
    const s = new Base(u);
    ctx.sockets.push(s);
    return s;
  };
}

/** coupe le reseau de cet ecran : la ligne tombe et ne se retablit pas */
function couper(ctx) {
  ctx.reseau = false;
  ctx.sockets.forEach(s => { try { s.close(); } catch (e) {} });
}
const rebrancher = ctx => { ctx.reseau = true; };

async function toLobby(name) {
  const ctx = await boot();
  trackSockets(ctx);
  click(ctx.win, ctx.$('[data-go="mode"]'), ctx.errors);
  click(ctx.win, ctx.$('.opt[data-val="multi"]'), ctx.errors);
  click(ctx.win, ctx.$('#btnToPlayers'), ctx.errors);
  type(ctx.win, ctx.$('#netName'), name);
  return ctx;
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

/** l etat des pions vu par un ecran, pour comparer deux telephones */
const pions = ctx => ctx.K.state.players.map(p => p.id + ':' + p.pos).sort().join(',');

const banniere = ctx => {
  const b = ctx.$('#netBanner');
  return b && !b.hidden ? b.textContent.trim() : '';
};

(async () => {
  const fails = [];
  const step = s => console.log('  · ' + s);

  /* =====================================================
     Mise en place : trois telephones, partie lancee
     ===================================================== */
  const host = await toLobby('Maxime');
  click(host.win, host.$('#netCreate'), host.errors);
  await until(() => host.$('#lobbyBody .code'), 5000, 'code du salon');
  const code = host.$('#lobbyBody .code').textContent;

  const guests = [];
  for (const name of ['Alice', 'Bob']) {
    const g = await toLobby(name);
    type(g.win, g.$('#netCode'), code);
    click(g.win, g.$('#netJoin'), g.errors);
    await until(() => g.$('#lobbyBody .code'), 5000, name + ' rejoint');
    guests.push(g);
  }
  await until(() => host.K.state.players.length === 3, 4000, 'les 3 joueurs');
  click(host.win, host.$('#netStart'), host.errors);
  await until(() => guests.every(g => g.$('#screen-game').classList.contains('is-active')), 8000, 'plateau partout');
  const stop = autoInvites(guests);
  await tapThrough(host, () => host.$('#actionZone').textContent.includes('DÉ') ||
                               host.$('#actionZone').textContent.includes('DE'), 150000);
  step('partie a 3 lancee, ordre : ' + host.K.state.players.map(p => p.name).join(' > '));

  const actif = host.K.state.players[0];
  const tous = [host].concat(guests);
  const porteur = tous.find(c => c.K.net.meId() === actif.id);

  /* =====================================================
     1. Un joueur perd le reseau pendant le tour d un autre
     ===================================================== */
  const victime = guests.find(g => g.K.net.meId() !== actif.id);
  const vid = victime.K.net.meId();
  const vnom = host.K.player(vid).name;

  couper(victime);
  /* on ne se contente pas de l avis du serveur : la socket du telephone
     doit etre reellement fermee avant de juger qu il a rate la suite */
  await until(() => victime.sockets.every(s => s.readyState === 3), 8000, 'socket fermee');
  await until(() => { const p = host.K.player(vid); return p && p.off === true; }, 8000,
              'l hote voit la deconnexion');

  if (host.K.state.players.length !== 3) {
    fails.push('le joueur deconnecte a disparu de la partie (' + host.K.state.players.length + ' restants)');
  }
  const posAvant = host.K.player(vid).pos;
  step(vnom + ' a saute : sa place est gardee, ' + host.K.state.players.length + ' joueurs, case ' + posAvant);

  if (!host.$('#hudPlayers .hp.off')) fails.push('rien ne signale le joueur hors ligne sur le plateau de l hote');

  /* sa television tombe et s endort sur place */
  const pion = host.K.pawns.el(vid);
  if (!pion || !pion.classList.contains('asleep')) {
    fails.push('la television du joueur deconnecte ne s endort pas');
  } else if (!pion.querySelector('.zzz')) {
    fails.push('pas de z qui montent au-dessus du pion endormi');
  } else {
    step('sa television est tombee et dort sur le plateau');
  }

  /* le code du salon doit rester lisible pendant la partie */
  host.K.game.showPause();
  {
    const menu = host.$('#overlay').textContent;
    if (menu.indexOf(code) < 0) fails.push('le code du salon n est pas affiche dans le menu de pause');
    if (menu.indexOf(vnom) < 0) fails.push('le menu ne dit pas qui est deconnecte');
    step('menu de pause : code ' + code + ' affiche, ' + vnom + ' signale absent');
  }
  host.K.util.closeOverlay();

  /* On fait avancer la partie pendant qu il est coupe. Plutot que de
     compter sur un clic precis, on joue jusqu a ce que les pions
     bougent : la boucle de taps peut traverser un tour entier, et
     supposer qu on tombe pile au debut d un tour rend le test
     dependant du hasard. */
  const gele = pions(victime);
  const avance = await (async () => {
    const t0 = Date.now();
    /* Un tour entier peut etre long : carte du theme, ecran public,
       epreuve collective avec son chrono. On laisse le temps qu il faut,
       ce qu on verifie ici c est que la partie AVANCE malgre la coupure,
       pas qu elle avance vite. */
    while (Date.now() - t0 < 180000) {
      if (pions(host) !== gele) return true;
      /* Un panneau ouvert chez l hote bloque tout le reste : on y repond
         d abord. Et on ne le cherche que s il est VISIBLE — l overlay
         garde le contenu du dernier panneau une fois referme, et taper
         sur ces boutons fantomes fait tourner la boucle dans le vide
         pendant que la partie, elle, attend une tape sur Kwa. */
      const ov = host.$('#overlay');
      const foot = ov && !ov.hidden
        ? [...ov.querySelectorAll('button')].find(x => !x.disabled)
        : null;

      /* Le de tombe sur l ecran de celui dont c est le tour, et ce n est
         pas toujours le meme : au deuxieme tour ce n est deja plus le
         joueur de depart. La boucle cherchait le bouton sur un seul
         telephone, et l automate des invites refuse par principe de
         toucher au de — plus personne ne le pressait, et la partie
         attendait pour de bon. On le presse donc partout ou il est,
         sauf chez celui qu on a coupe. */
      const ecrans = [host].concat(guests).filter(c => c !== victime);
      const dispo = ecrans.map(c => ({ c, b: c.$('#actBtn') }))
                          .find(x => x.b && !x.b.disabled);

      if (foot) click(host.win, foot, host.errors);
      else if (dispo) click(dispo.c.win, dispo.b, dispo.c.errors);
      else { const k = host.$('#kwaBubble'); if (k) click(host.win, k, host.errors); }
      await sleep(90);
    }
    return false;
  })();
  if (!avance) fails.push('impossible de faire avancer la partie pendant la coupure');
  else step('la partie a continue pendant la coupure : ' + pions(host));

  /* le telephone coupe est reste fige a l instant de la coupure */
  if (pions(victime) !== gele) {
    fails.push('l ecran coupe a continue de suivre : ' + pions(victime) + ' au lieu de ' + gele);
  } else {
    step('ecran coupe fige sur ' + gele + ' pendant que la partie avance');
  }

  /* =====================================================
     2. Le reseau revient : il doit retrouver la partie
     ===================================================== */
  rebrancher(victime);
  await until(() => { const p = host.K.player(vid); return p && p.off === false; }, 25000,
              'retour du joueur');
  step(vnom + ' est revenu tout seul');

  /* on compare en direct : la partie ne s est pas arretee pendant la coupure */
  await until(() => pions(victime) === pions(host), 15000, 'positions resynchronisees');
  step('positions retrouvees : ' + pions(host));

  if (!victime.$('#screen-game').classList.contains('is-active')) {
    fails.push('le joueur revenu n est pas sur le plateau');
  }
  if (victime.$('#tiles').children.length !== host.$('#tiles').children.length) {
    fails.push('le plateau du joueur revenu n a pas ete reconstruit');
  }
  if (victime.K.state.players.map(p => p.id).join() !== host.K.state.players.map(p => p.id).join()) {
    fails.push('l ordre de passage a change pour le joueur revenu');
  }
  step('plateau reconstruit (' + victime.$('#tiles').children.length + ' cases) et ordre de passage intact');

  const pionReveille = host.K.pawns.el(vid);
  if (pionReveille && pionReveille.classList.contains('asleep')) {
    fails.push('la television ne se redresse pas quand le joueur revient');
  } else if (pionReveille && pionReveille.querySelector('.zzz')) {
    fails.push('les z restent affiches apres le retour du joueur');
  } else {
    step('sa television s est redressee toute seule');
  }

  /* =====================================================
     3. Le bouton de secours quand un joueur ne revient pas
     ===================================================== */
  {
    let repris = false;
    const cible = host.K.player(vid);
    host.K.game.waitingAction(cible, 'a perdu la connexion', () => { repris = true; });
    const b = host.$('#actTake');
    if (!b) fails.push('pas de bouton pour jouer a la place d un joueur absent');
    else {
      click(host.win, b, host.errors);
      if (!repris) fails.push('le bouton de secours ne rend pas la main a l hote');
      else step('l hote peut jouer a la place d un absent');
    }
    host.K.game.clearAction();
  }

  /* =====================================================
     4. C est l hote qui saute
     ===================================================== */
  couper(host);
  await until(() => guests.every(g => /hote|attend/i.test(banniere(g))), 10000,
              'les joueurs sont prevenus');
  step('hote coupe -> les joueurs voient : "' + banniere(guests[0]).slice(0, 60) + '"');

  guests.forEach((g, i) => {
    if (!g.$('#screen-game').classList.contains('is-active')) {
      fails.push('l invite ' + (i + 1) + ' a ete renvoye au menu alors que l hote peut revenir');
    }
  });
  step('personne n est renvoye au menu : on attend');

  rebrancher(host);
  await until(() => host.K.net.isActive() && guests.every(g => !g.K.player(host.K.net.meId()).off),
              25000, 'retour de l hote');
  step('l hote est revenu, la partie reprend');

  await until(() => guests.every(g => pions(g) === pions(host)), 15000, 'tout le monde recale');
  step('les 3 ecrans sont de nouveau d accord');

  /* =====================================================
     5. L hote recharge sa page : la partie n existe plus
        (la page perd le moteur de jeu, rien a reprendre)
     ===================================================== */
  const sess = JSON.parse(host.win.localStorage.getItem('kwa.seat.v1'));
  if (!sess || !sess.token) fails.push('la place de l hote n est pas gardee en local');
  else {
    const ws = new global.WebSocket('ws://localhost:8080/');
    await new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('pas de connexion brute')), 5000);
      ws.onopen = () => { clearTimeout(t); res(); };
      ws.onerror = () => { clearTimeout(t); rej(new Error('connexion brute refusee')); };
    });
    /* live:false = une page fraiche, sans partie en memoire */
    ws.send(JSON.stringify({ t: 'resume', code: sess.code, id: sess.id, token: sess.token, live: false }));

    await until(() => guests.every(g => g.$('#screen-mode').classList.contains('is-active')), 10000,
                'salon ferme proprement');
    step('hote recharge -> le salon se ferme et chacun revient au menu');

    guests.forEach((g, i) => {
      if (g.win.localStorage.getItem('kwa.seat.v1')) {
        fails.push('l invite ' + (i + 1) + ' garde une place dans un salon ferme');
      }
    });
    step('plus aucune place gardee : personne ne tentera de revenir dans le vide');
    try { ws.close(); } catch (e) {}
  }

  stop();
  tous.forEach((c, i) => c.errors.forEach(e => fails.push('ecran ' + i + ' : ' + e)));

  console.log('');
  console.log(fails.length ? 'ECHECS :\n - ' + fails.join('\n - ') : 'COUPURES ET REPRISES : OK');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('\nECHEC : ' + e.message); process.exit(1); });
