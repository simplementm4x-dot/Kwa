/* =========================================================
   LES ECRANS DE QUESTION, POUR DE VRAI

   Tous les autres tests remplacent K.ask par un bouchon : ils
   verifient les regles du jeu, jamais les boutons. C est
   exactement par la qu est passe le bug ou plus aucune reponse
   du quiz n etait cliquable — le jeu tournait parfaitement,
   personne ne pouvait plus jouer.

   Ici on fait le contraire : on affiche chaque ecran, on tape
   dessus comme un joueur, et on regarde ce qui revient. Aucun
   bouchon, aucune simulation.
   ========================================================= */
'use strict';
const { boot, click, sleep } = require('./harness');

async function ecran() {
  const ctx = await boot();
  const K = ctx.K;
  Object.assign(K.state.settings, { venue: 'irl', device: 'solo', sound: false });
  K.state.players = [K.newPlayer('Alice', 'rouge'), K.newPlayer('Bob', 'bleu')];
  return ctx;
}

/** affiche un ecran, tape sur ce qu on lui dit, rend la reponse */
function joue(c, spec, selecteur, ms) {
  return new Promise(async (res, rej) => {
    let fini = false;
    c.K.prompt.render(spec).then(v => { fini = true; res(v); });
    await sleep(30);
    const cible = c.win.document.querySelector(selecteur);
    if (!cible) { rej(new Error('rien a cliquer pour "' + selecteur + '"')); return; }
    click(c.win, cible, c.errors);
    setTimeout(() => { if (!fini) rej(new Error('aucune reponse apres le clic sur ' + selecteur)); },
               ms || 2500);
  });
}

(async () => {
  const fails = [];
  const step = s => console.log('  · ' + s);
  const c = await ecran();
  const K = c.K;

  /* chaque ligne : le nom, le spec, ce sur quoi on tape, et ce qu on
     attend en retour */
  const ecrans = [
    ['liste de joueurs', { kind: 'list', title: 'Qui ?', items: [
      { id: 'p1', label: 'Alice' }, { id: 'p2', label: 'Bob' }] },
      '#overlay .pbtn', v => v === 'p1'],

    ['choix A ou B', { kind: 'choice', title: 'A ou B ?', a: 'Le premier', b: 'Le second' },
      '#overlay .dil.b', v => v === 'b'],

    ['echelle 1 a 10', { kind: 'bet', title: 'Combien ?', theme: 'Test', cat: 'Test' },
      '#overlay .bet[data-n="7"]', v => v === 7],

    ['question a choix', { kind: 'quiz', title: 'Test', theme: 'Test', diff: 4,
      text: 'Combien font deux et deux ?', choices: ['4', '3', '5', '6'], good: 0 },
      '#overlay .choice[data-k="0"]', v => v === 0],

    ['question a choix avec chrono', { kind: 'quiz', title: 'Test', theme: 'Test', diff: 9,
      duree: 20, text: 'Et avec une jauge ?', choices: ['4', '3', '5', '6'], good: 2 },
      '#overlay .choice[data-k="2"]', v => v === 2],

    ['information', { kind: 'info', title: 'Les regles', body: [{ ico: '1', t: 'Un', p: 'Deux' }] },
      '#overlay #pInfo', v => v === true],

    ['compteur', { kind: 'counter', title: 'Combien ?', value: 3 },
      '#overlay #cOk', v => v === 3],

    ['le pacte', { kind: 'pacte', title: 'Marche ?', sub: 'Test', intro: 'Une offre.',
      a: 'JE SIGNE', b: 'NON' },
      '#overlay .pk-btn.oui', v => v === 'a'],

    ['le pari, avec la vedette', { kind: 'pacte', title: 'Il s en sort ?', sub: 'Test',
      mood: 'wink', pid: 'p1', intro: 'Bon pari : +1 case.', a: 'IL GAGNE', b: 'IL SE PLANTE' },
      '#overlay .pk-btn.non', v => v === 'b'],

    ['le cliche', { kind: 'photo', title: 'Le Cliche', sub: 'Test', duree: 20,
      url: 'assets/case-quiz.png', choices: ['Un', 'Deux', 'Trois', 'Quatre'], good: 1 },
      '#overlay .choice[data-k="1"]', v => v && v.k === 1 && typeof v.ms === 'number']
  ];

  for (const [nom, spec, sel, attendu] of ecrans) {
    c.errors.length = 0;
    try {
      const v = await joue(c, spec, sel);
      if (attendu && !attendu(v)) {
        fails.push(nom + ' : reponse inattendue (' + JSON.stringify(v) + ')');
      } else {
        step(nom + ' : ' + JSON.stringify(v));
      }
    } catch (e) {
      fails.push(nom + ' : ' + e.message);
    }
    c.errors.forEach(e => fails.push(nom + ' : ' + e));
    K.util.closeOverlay();
  }

  /* --- la question ouverte : on revele, puis le joueur se juge --- */
  {
    c.errors.length = 0;
    let ok = null;
    K.prompt.render({ kind: 'reveal', title: 'Test', theme: 'Test', diff: 8,
      text: 'Une question ouverte ?', answer: 'AUBERGINE' }).then(v => { ok = v; });
    await sleep(30);
    click(c.win, c.$('#pShow'), c.errors);
    if (c.$('#overlay').textContent.indexOf('AUBERGINE') < 0) {
      fails.push('la question ouverte ne montre pas sa reponse');
    }
    const bon = c.$('#pOk2');
    if (!bon) fails.push('pas de bouton "j avais bon" apres la revelation');
    else {
      click(c.win, bon, c.errors);
      await sleep(60);
      if (ok !== true) fails.push('la question ouverte ne rend pas la main');
      else step('question ouverte : reponse revelee, le joueur se juge');
    }
    c.errors.forEach(e => fails.push('reveal : ' + e));
    K.util.closeOverlay();
  }

  /* --- le choix d un nombre : un raccourci, puis on valide --- */
  {
    c.errors.length = 0;
    let n = null;
    K.prompt.render({ kind: 'nombre', title: 'Quelle annee ?', min: 1990, max: 2026,
      value: 2000, presets: [1995, 2005, 2015] }).then(v => { n = v; });
    await sleep(30);
    const chip = c.win.document.querySelector('#overlay .num-chip[data-n="2005"]');
    if (!chip) fails.push('les raccourcis de nombre ne s affichent pas');
    else {
      click(c.win, chip, c.errors);
      if (c.$('#nbVal').textContent !== '2005') {
        fails.push('le raccourci ne change pas le nombre affiche (' + c.$('#nbVal').textContent + ')');
      }
      click(c.win, c.$('#nbOk'), c.errors);
      await sleep(60);
      if (n !== 2005) fails.push('le choix du nombre rend ' + n + ' au lieu de 2005');
      else step('choix d un nombre : raccourci a 2005, valide');
    }
    c.errors.forEach(e => fails.push('nombre : ' + e));
    K.util.closeOverlay();
  }

  /* --- Tic-Tac : deux clics, depart puis stop --- */
  {
    c.errors.length = 0;
    let ms = null;
    K.prompt.render({ kind: 'tictac', title: 'Tic-Tac', sub: '6 s', but: 6 }).then(v => { ms = v; });
    await sleep(30);
    const b = c.$('#ttGo');
    if (!b) fails.push('tic-tac : pas de bouton de depart');
    else {
      click(c.win, b, c.errors);
      if (b.textContent !== 'STOP') fails.push('tic-tac : le bouton ne passe pas en STOP');
      await sleep(260);
      click(c.win, c.$('#ttGo'), c.errors);
      await sleep(60);
      if (typeof ms !== 'number' || ms < 150) {
        fails.push('tic-tac : temps mesure invalide (' + ms + ')');
      } else step('tic-tac : depart, stop, ' + ms + ' ms mesures');
    }
    c.errors.forEach(e => fails.push('tic-tac : ' + e));
    K.util.closeOverlay();
  }

  /* --- le mot secret : il faut le reveler avant de pouvoir valider --- */
  {
    c.errors.length = 0;
    let vu = null;
    K.prompt.render({ kind: 'secret', title: 'Ton mot', word: 'AUBERGINE' }).then(v => { vu = v; });
    await sleep(30);
    const ok = c.$('#pSecOk');
    if (!ok || !ok.disabled) fails.push('le mot secret peut etre valide sans avoir ete revele');
    click(c.win, c.$('#pSec'), c.errors);
    if (c.$('#pWord').textContent !== 'AUBERGINE') fails.push('le mot secret ne s affiche pas');
    if (c.$('#pSecOk').disabled) fails.push('le bouton reste bloque apres la revelation');
    click(c.win, c.$('#pSecOk'), c.errors);
    await sleep(60);
    if (vu !== true) fails.push('le mot secret ne rend pas la main');
    else step('mot secret : cache, revele, valide');
    c.errors.forEach(e => fails.push('secret : ' + e));
    K.util.closeOverlay();
  }

  /* --- le mot raccord : on coche, et on finit avant la fin --- */
  {
    c.errors.length = 0;
    let n = null;
    K.prompt.render({ kind: 'raccord', letter: 'B', duration: 30, sub: 'Test',
      items: ['Un fruit', 'Un pays', 'Un metier', 'Un animal', 'Une marque'] })
      .then(v => { n = v; });
    await sleep(30);
    const cases = c.win.document.querySelectorAll('#overlay .mr-item');
    if (cases.length !== 5) fails.push('le mot raccord n affiche pas ses cinq consignes');
    click(c.win, cases[0], c.errors);
    click(c.win, cases[2], c.errors);
    if (!cases[0].classList.contains('done')) fails.push('cocher un mot ne se voit pas');
    click(c.win, c.$('#rEarly'), c.errors);
    await sleep(80);
    if (n !== 2) fails.push('le mot raccord rend ' + n + ' mots au lieu de 2');
    else step('mot raccord : deux mots coches sur cinq, fin anticipee');
    c.errors.forEach(e => fails.push('raccord : ' + e));
    K.util.closeOverlay();
  }

  await sleep(50);
  if (fails.length) {
    console.log('\nECHECS :');
    fails.forEach(f => console.log(' - ' + f));
    process.exit(1);
  }
  console.log('\nLES ECRANS DE QUESTION : OK');
  process.exit(0);
})();
