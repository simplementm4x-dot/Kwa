/* =========================================================
   LE CLICHE

   La banque de photos d abord : elle est generee par un
   script qui parle a internet, donc c est exactement le genre
   de fichier qui se degrade sans qu on s en rende compte.

   Puis l epreuve : ce qu on gagne selon le moment ou on
   repond, et ce qui se passe quand la photo n arrive pas —
   c est le cas ici, jsdom ne charge aucune image, donc ce
   chemin-la est teste pour de vrai.
   ========================================================= */
'use strict';
const { boot, sleep } = require('./harness');

async function table() {
  const ctx = await boot();
  const K = ctx.K;
  Object.assign(K.state.settings, {
    venue: 'irl', device: 'solo', sound: false, esprit: false
  });
  K.state.players = [K.newPlayer('Alice', 'rouge'), K.newPlayer('Bob', 'bleu')];
  K.kwa.say = () => Promise.resolve();
  K.kwa.setMood = () => {};
  /* le panneau de verdict attend un doigt : ici on mesure des cases,
     pas des clics, et une partie entiere le fait deja ailleurs */
  K.util.panel = () => Promise.resolve();
  return ctx;
}

(async () => {
  const fails = [];
  const step = s => console.log('  · ' + s);

  /* =====================================================
     1. La banque
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    const banque = K.CLICHES || [];

    if (banque.length < 100) {
      fails.push('la banque ne contient que ' + banque.length + ' photos, il en faut au moins 100');
    }

    const cats = {};
    const vues = {};
    banque.forEach((x, i) => {
      if (!x.r || !x.c || !x.u) fails.push('photo ' + i + ' incomplete');
      if (!/^https:\/\//.test(x.u || '')) fails.push('photo ' + i + ' : adresse non https (' + x.u + ')');
      if (vues[x.r]) fails.push('la reponse "' + x.r + '" apparait deux fois');
      vues[x.r] = 1;
      cats[x.c] = (cats[x.c] || 0) + 1;
    });

    /* une categorie de moins de quatre photos ne peut pas fournir ses
       propres mauvaises reponses */
    Object.keys(cats).forEach(k => {
      if (cats[k] < 4) fails.push('la categorie "' + k + '" n a que ' + cats[k] + ' photos');
    });

    step(banque.length + ' photos, ' + Object.keys(cats).length + ' categories : ' +
         Object.keys(cats).map(k => k + ' ' + cats[k]).join(', '));
  }

  /* =====================================================
     2. Les quatre reponses
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    K.util.precharge = () => Promise.resolve(true);
    const [a] = K.state.players;

    let memeCat = 0, total = 0;
    for (let n = 0; n < 30; n++) {
      let vu = null;
      K.ask = (p, spec) => { vu = spec; return Promise.resolve({ k: spec.good, phase: 2 }); };
      await K.tiles.cliche({ player: a, tile: {}, players: K.state.players });

      if (!vu) { fails.push('l epreuve ne pose aucune question'); break; }
      if (vu.choices.length !== 4) fails.push('il n y a pas quatre reponses (' + vu.choices.length + ')');
      if (new Set(vu.choices).size !== vu.choices.length) fails.push('deux reponses identiques dans la liste');
      if (vu.good < 0 || vu.good > 3) fails.push('la bonne reponse n est pas dans la liste');

      /* la bonne reponse est celle de la photo montree */
      const photo = (K.CLICHES || []).find(x => x.u === vu.url);
      if (!photo) fails.push('la photo montree ne vient pas de la banque');
      else {
        if (vu.choices[vu.good] !== photo.r) fails.push('la bonne reponse ne correspond pas a la photo');
        if (vu.sub !== photo.c) fails.push('la categorie annoncee n est pas celle de la photo');
        vu.choices.forEach(ch => {
          const src = (K.CLICHES || []).find(x => x.r === ch);
          total++;
          if (src && src.c === photo.c) memeCat++;
        });
      }
    }
    const part = Math.round(memeCat / total * 100);
    if (part < 90) {
      fails.push('seules ' + part + '% des reponses proposees sont de la meme famille : ' +
                 'la photo devient inutile pour trancher');
    } else step('trente tirages : quatre reponses distinctes, ' + part + '% de la meme categorie');
  }

  /* =====================================================
     3. Ce que ca rapporte
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    K.util.precharge = () => Promise.resolve(true);
    const [a] = K.state.players;

    const attendu = { 0: 4, 1: 3, 2: 2 };
    for (const phase of [0, 1, 2]) {
      K.ask = (p, spec) => Promise.resolve({ k: spec.good, phase: +phase });
      const r = await K.tiles.cliche({ player: a, tile: {}, players: K.state.players });
      const d = r[0] && r[0].delta;
      if (d !== attendu[phase]) {
        fails.push('reponse en phase ' + phase + ' : ' + d + ' cases au lieu de ' + attendu[phase]);
      }
    }
    step('bonne reponse : +4 dans le flou, +3 avant la nettete, +2 une fois net');

    /* et une erreur coute une case, quel que soit le moment */
    for (const phase of [0, 2]) {
      K.ask = (p, spec) => Promise.resolve({ k: (spec.good + 1) % 4, phase: +phase });
      const r = await K.tiles.cliche({ player: a, tile: {}, players: K.state.players });
      if (!r[0] || r[0].delta !== -1) {
        fails.push('une erreur en phase ' + phase + ' devrait couter une case');
      }
    }
    step('mauvaise reponse : -1 case, meme en repondant tot');

    const avant = a.stats.correct;
    K.ask = (p, spec) => Promise.resolve({ k: spec.good, phase: 0 });
    await K.tiles.cliche({ player: a, tile: {}, players: K.state.players });
    if (a.stats.correct !== avant + 1) fails.push('les bonnes reponses ne sont pas comptees dans les stats');
    else step('les reponses comptent dans les statistiques de fin de partie');
  }

  /* =====================================================
     4. Quand la photo n arrive pas
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    const [a] = K.state.players;

    /* on ne truque rien : jsdom ne charge aucune image, donc
       U.precharge rend faux comme il le ferait sans reseau */
    let pose = false;
    K.ask = () => { pose = true; return Promise.resolve({ k: 0, phase: 0 }); };
    const t0 = Date.now();
    const r = await K.tiles.cliche({ player: a, tile: {}, players: K.state.players });
    const duree = Date.now() - t0;

    if (pose) fails.push('l epreuve pose la question alors que la photo n est pas la');
    if (r.length) fails.push('sans photo, personne ne devrait bouger');
    if (duree > 9000) fails.push('l attente de la photo bloque la partie ' + Math.round(duree / 1000) + 's');
    else step('photo injoignable : epreuve annulee en ' + Math.round(duree / 100) / 10 + 's, personne ne bouge');

    c.errors.forEach(e => fails.push('erreur javascript : ' + e));
  }

  await sleep(50);
  if (fails.length) {
    console.log('\nECHECS :');
    fails.forEach(f => console.log(' - ' + f));
    process.exit(1);
  }
  console.log('\nLE CLICHE : OK');
  process.exit(0);
})();
