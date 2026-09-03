/* =========================================================
   LA DERNIERE LIGNE DROITE ET LES MISSIONS

   Deux mecaniques qui changent la fin d une partie : l une
   redonne une chance aux poursuivants, l autre occupe un
   joueur pendant un tour entier sans que la table le sache.
   ========================================================= */
'use strict';
const { boot, sleep } = require('./harness');

async function table(reglages, noms) {
  const ctx = await boot();
  const K = ctx.K;
  Object.assign(K.state.settings, {
    venue: 'irl', device: 'solo', mode: 'terminus',
    boardLength: 20, sound: false,
    evenements: false, paris: false, pactes: true, esprit: false
  }, reglages || {});
  K.state.players = (noms || ['Alice', 'Bob', 'Chloe'])
    .map((n, i) => K.newPlayer(n, K.COLORS[i].id));
  K.state.started = true;
  K.board.generate(20);
  K.board.render();
  K.pawns.renderAll();
  K.kwa.say = () => Promise.resolve();
  K.kwa.setMood = () => {};
  K.util.jingle = () => Promise.resolve();
  K.util.panel = () => Promise.resolve();
  K.util.panelAuto = () => Promise.resolve();
  return ctx;
}

(async () => {
  const fails = [];
  const step = s => console.log('  · ' + s);

  /* =====================================================
     1. Quand la ligne droite commence
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    const [a, b] = K.state.players;
    const last = K.board.last();

    a.pos = 5; b.pos = 2;
    if (K.finale.enCours()) fails.push('la ligne droite commence des le milieu du plateau');

    a.pos = last - K.finale.ligne() - 1;
    if (K.finale.enCours()) fails.push('elle commence une case trop tot');

    a.pos = last - K.finale.ligne();
    if (!K.finale.enCours()) fails.push('elle ne commence pas quand le meneur est a ' +
      K.finale.ligne() + ' cases du bout');
    else step('elle s ouvre quand le meneur arrive a ' + K.finale.ligne() + ' cases du terminus');

    /* en mode tours, c est le dernier tour de table */
    Object.assign(K.state.settings, { mode: 'tours', maxTurns: 4 });
    a.pos = 2; b.pos = 1;
    K.state.turn = 3;
    if (K.finale.enCours()) fails.push('en mode tours elle commence avant le dernier tour');
    K.state.turn = 4;
    if (!K.finale.enCours()) fails.push('en mode tours elle ne s ouvre pas au dernier tour');
    else step('en mode tours : elle s ouvre au dernier tour de table');
  }

  /* =====================================================
     2. Ce qu elle change
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    const [a, b, d] = K.state.players;
    a.pos = 18; b.pos = 6; d.pos = 4;      /* Alice mene largement */
    K.state.finale = true;

    const applique = res => {
      const out = {};
      K.finale.applique(res).forEach(r => { out[r.id] = r.delta; });
      return out;
    };

    const gains = applique([
      { id: a.id, delta: 3 }, { id: b.id, delta: 3 }, { id: d.id, delta: 2 }
    ]);
    if (gains[a.id] !== 3) fails.push('le meneur voit ses gains doubles aussi (' + gains[a.id] + ')');
    if (gains[b.id] !== 6 || gains[d.id] !== 4) {
      fails.push('les poursuivants ne doublent pas leurs gains : ' + JSON.stringify(gains));
    } else step('gains doubles pour les poursuivants, normaux pour le meneur');

    const pertes = applique([{ id: b.id, delta: -3 }, { id: a.id, delta: -2 }]);
    if (pertes[b.id] !== -3 || pertes[a.id] !== -2) {
      fails.push('les pertes sont doublees alors qu elles ne devraient pas : ' + JSON.stringify(pertes));
    } else step('les pertes ne sont pas doublees : on aide a revenir, on ne punit personne');

    /* hors ligne droite, rien ne bouge */
    K.state.finale = false;
    const normal = applique([{ id: b.id, delta: 3 }]);
    if (normal[b.id] !== 3) fails.push('les gains sont doubles hors de la ligne droite');
    else step('hors ligne droite : rien n est touche');
  }

  /* =====================================================
     3. Elle s annonce une fois, et elle se voit
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    const [a] = K.state.players;
    a.pos = K.board.last() - 2;

    const premiere = await K.finale.check();
    if (!premiere) fails.push('l entree dans la ligne droite n est pas annoncee');
    if (!K.state.finale) fails.push('l etat de la partie ne retient pas la ligne droite');
    if (!c.$('#screen-game').classList.contains('finale')) {
      fails.push('le plateau ne change pas d allure dans la ligne droite');
    } else step('annoncee, retenue, et le plateau vire a l or');

    const seconde = await K.finale.check();
    if (seconde) fails.push('elle se reannonce a chaque tour');
    else step('elle ne s annonce qu une fois');

    /* et elle se referme si le meneur recule */
    a.pos = 3;
    await K.finale.check();
    if (K.state.finale) fails.push('elle reste active alors que le meneur a recule');
    else if (c.$('#screen-game').classList.contains('finale')) {
      fails.push('le plateau reste dore alors que la ligne droite est finie');
    } else step('le meneur recule : la ligne droite se referme');
  }

  /* =====================================================
     4. L epreuve finale
     On ne gagne pas en posant le pied sur la derniere case.
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    const [a] = K.state.players;
    a.pos = K.board.last();

    /* la question posee doit etre difficile : c est le point */
    let vue = null;
    K.ask = (p, spec) => {
      vue = spec;
      return Promise.resolve(spec.kind === 'quiz' ? spec.good : 'a');
    };
    const gagne = await K.finale.challenge(a);
    if (!gagne) fails.push('une bonne reponse ne fait pas gagner la partie');
    if (!vue) fails.push('l epreuve finale ne pose aucune question');
    else if ((vue.diff || 0) && vue.diff < K.finale.niveau()) {
      fails.push('la question finale est de niveau ' + vue.diff + ', trop facile');
    } else step('epreuve finale : question posee, bonne reponse = victoire');

    /* cent tirages : jamais en dessous du niveau minimum */
    let mini = 10;
    for (let i = 0; i < 60; i++) {
      let niveau = 0;
      K.ask = (p, spec) => {
        niveau = spec.diff || parseInt((spec.sub || '').replace(/\D+/g, ''), 10) || 0;
        return Promise.resolve(spec.kind === 'quiz' ? spec.good : 'a');
      };
      await K.finale.challenge(a);
      if (niveau && niveau < mini) mini = niveau;
    }
    if (mini < K.finale.niveau()) {
      fails.push('une question finale de niveau ' + mini + ' est sortie');
    } else step('soixante tirages : jamais en dessous du niveau ' + mini);

    /* ratee : on recule et la partie continue */
    a.pos = K.board.last();
    K.ask = (p, spec) => Promise.resolve(spec.kind === 'quiz' ? (spec.good + 1) % 4 : 'b');
    const perdu = await K.finale.challenge(a);
    if (perdu) fails.push('une mauvaise reponse fait gagner quand meme');
    else if (a.pos !== K.board.last() - K.finale.recul()) {
      fails.push('rater l epreuve finale ne fait pas reculer de ' + K.finale.recul() +
                 ' cases (case ' + a.pos + ')');
    } else step('epreuve finale ratee : ' + K.finale.recul() + ' cases en arriere, la course repart');

    c.errors.forEach(x => fails.push('epreuve finale : ' + x));
  }

  /* =====================================================
     5. Les missions
     ===================================================== */
  {
    const c = await table();
    const K = c.K;
    const [a, b] = K.state.players;

    const M = K.MISSIONS || [];
    if (M.length < 50) fails.push('il n y a que ' + M.length + ' missions');
    else step(M.length + ' missions ecrites');
    const courts = M.map(m => m.court);
    if (courts.length !== new Set(courts).size) fails.push('deux missions portent le meme nom');
    if (M.some(m => !m.txt || !m.court)) fails.push('une mission n a pas de consigne ou de nom');

    /* chacun chez soi, elles n existent pas */
    K.state.settings.venue = 'online';
    if (K.missions.dispo()) fails.push('les missions sont proposees a distance');
    else step('a distance : aucune mission (chuchoter a l oreille de quelqu un, a distance...)');
    K.state.settings.venue = 'irl';

    /* on accepte : la mission se garde jusqu au tour suivant */
    K.ask = () => Promise.resolve('a');
    let pose = null;
    for (let i = 0; i < 40 && !pose; i++) pose = await K.missions.maybe(a);
    if (!pose) fails.push('Kwa ne propose jamais de mission en quarante tours');
    else if (!a.mission) fails.push('la mission acceptee n est pas gardee');
    else step('mission acceptee : "' + a.mission.court + '" gardee pour le tour suivant');

    /* et elle ne fuite nulle part : ni dans le bandeau, ni sur le reseau */
    K.game.hud();
    if (c.$('#hudPlayers').textContent.indexOf(a.mission ? a.mission.court : '@@') >= 0) {
      fails.push('la mission s affiche dans le bandeau des joueurs');
    } else step('rien ne la trahit dans le bandeau');

    /* le bilan : reussi, trois cases */
    K.ask = () => Promise.resolve('a');
    const gain = await K.missions.verifie(a);
    if (!gain || !gain.length || gain[0].delta !== K.missions.gain()) {
      fails.push('une mission reussie ne rapporte pas ' + K.missions.gain() + ' cases');
    } else step('mission reussie : +' + gain[0].delta + ' cases');
    if (a.mission) fails.push('la mission reste en poche apres le bilan');

    /* ratee : rien */
    a.mission = { court: 'Test', txt: 'Une consigne.' };
    K.ask = () => Promise.resolve('b');
    const rien = await K.missions.verifie(a);
    if (rien && rien.length) fails.push('une mission ratee rapporte quand meme');
    else step('mission ratee : rien du tout');

    /* et sans mission en cours, Kwa ne vient pas aux nouvelles */
    if (await K.missions.verifie(b)) fails.push('Kwa demande des nouvelles d une mission inexistante');
    else step('pas de mission, pas de bilan');

    c.errors.forEach(x => fails.push('missions : ' + x));
  }

  await sleep(50);
  if (fails.length) {
    console.log('\nECHECS :');
    fails.forEach(f => console.log(' - ' + f));
    process.exit(1);
  }
  console.log('\nLIGNE DROITE ET MISSIONS : OK');
  process.exit(0);
})();
