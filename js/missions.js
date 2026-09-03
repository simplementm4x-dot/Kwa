/* =========================================================
   LES MISSIONS DE KWA

   Un pacte qui ne se resout pas tout de suite.

   Kwa prend le joueur a part et lui donne une consigne a tenir
   pendant son tour : parler avec un accent, glisser un mot,
   aller chuchoter quelque chose a quelqu un. Le joueur accepte
   ou refuse. Personne d autre n en sait rien — c est tout le
   sel : pendant un tour entier, la table joue normalement et
   une seule personne joue a autre chose.

   Kwa revient au tour SUIVANT de ce joueur. La mission est
   alors annoncee a toute la table, et c est le groupe qui
   tranche : reussi, trois cases ; rate, rien du tout.

   Rien de tout ca ne passe par le reseau. La mission ne
   voyage pas dans l etat de la partie et n apparait sur aucun
   bandeau : la faire fuiter, ce serait la tuer. Elle vit dans
   la memoire de l hote, qui mene la partie de bout en bout.

   Reserve aux parties dans la meme piece. Chuchoter a l oreille
   de quelqu un qui est chez lui, ca ne marche pas.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const M = K.missions = {};

  /* ce que rapporte une mission tenue */
  const GAIN = 3;
  /* chance, par tour de joueur, que Kwa en propose une */
  const CHANCE = 26;

  M.gain = () => GAIN;

  /** les missions ne se jouent que dans la meme piece */
  M.dispo = function () {
    return K.state.settings.pactes !== false &&
           !K.rules.isOnline() &&
           (K.MISSIONS || []).length > 0;
  };

  M.reset = function () {
    K.state.players.forEach(p => { p.mission = null; });
  };

  /** celles que cette table peut jouer */
  function pool() {
    const n = K.state.players.length;
    const epice = K.state.settings.spicy !== false;
    return (K.MISSIONS || []).filter(m =>
      (!m.min || n >= m.min) && (epice || !m.spicy));
  }

  /* ---------------------------------------------------------
     Kwa propose
     --------------------------------------------------------- */
  M.maybe = async function (p) {
    if (!M.dispo() || !p || p.mission) return null;
    if (U.rnd(100) >= CHANCE) return null;
    const dispo = pool();
    if (!dispo.length) return null;
    const m = U.draw('missions', dispo) || dispo[U.rnd(dispo.length)];

    await K.kwa.say('Psst. ' + p.name + '. Viens voir deux secondes, et fais pas cette tete.',
      { mood: 'louche' });

    /* Personne d autre ne doit lire la consigne. A un seul telephone,
       on force le passage de l appareil : sans ca la mission s afficherait
       au milieu de la table, ce qui la vide de tout interet. */
    K.setHolder(null);
    const rep = await K.ask(p, {
      kind: 'pacte', icon: '🤫', mood: 'louche',
      title: 'Mission', sub: 'Personne ne doit savoir',
      intro: m.txt + ' Reussi, tu prends ' + GAIN + ' cases a ton prochain tour.',
      passMsg: 'Kwa a quelque chose a te demander. Les autres regardent ailleurs.',
      a: 'JE PRENDS', b: 'TROP RISQUE'
    });
    U.closeOverlay();
    K.setHolder(p.id);

    if (rep !== 'a') {
      await K.kwa.say('Tant pis. Je garde ca sous le coude.', { auto: 1400, mood: 'wink' });
      return null;
    }

    p.mission = { court: m.court, txt: m.txt };
    await K.kwa.say('Ca marche. Je ne dis rien a personne, et je reviens te voir a ton prochain tour.',
      { auto: 1800, mood: 'wink' });
    return p.mission;
  };

  /* ---------------------------------------------------------
     Kwa revient aux nouvelles
     Renvoie les cases gagnees, ou null s il n y avait rien.
     --------------------------------------------------------- */
  M.verifie = async function (p) {
    const mi = p && p.mission;
    if (!mi) return null;
    p.mission = null;

    await K.kwa.say('Alors, ' + p.name + '... On avait un accord au tour dernier. Raconte.',
      { mood: 'louche' });

    /* la mission devient publique : c est le moment ou la table
       comprend ce qu elle regardait sans le voir */
    K.scene.montre(K.scene.liste({
      cat: 'Mission de ' + p.name,
      texte: mi.txt,
      items: [],
      pied: 'Le groupe tranche : est-ce que c est passe ?'
    }));

    /* Le joueur ne se note pas lui-meme. Des qu il y a plusieurs
       telephones, le verdict part chez son voisin de tour ; a un seul
       appareil, la table repond ensemble sur l ecran. */
    const juge = arbitre(p);
    const rep = await K.ask(juge || p, {
      kind: 'pacte', icon: '🕵️', mood: 'oh', pid: p.id,
      title: 'Mission accomplie ?', sub: p.name + ' · ' + mi.court,
      intro: mi.txt + ' Alors, personne n a rien vu ?',
      passMsg: 'A vous de juger.',
      a: 'REUSSI', b: 'RATE'
    });
    U.closeOverlay();
    K.scene.cache();

    if (rep !== 'a') {
      await K.kwa.say('Rate. C etait beau d essayer.', { auto: 1500, mood: 'wink' });
      return [];
    }
    K.audio.fanfare();
    await K.kwa.say('Sous vos yeux, et personne n a rien vu. ' + p.name + ' prend ' +
      U.cases(GAIN) + '.', { auto: 1800, mood: 'oh' });
    return [{ id: p.id, delta: GAIN, why: 'sa mission' }];
  };

  /** le voisin de tour, quand il y a plusieurs ecrans */
  function arbitre(p) {
    const players = K.state.players;
    if (!K.net || !K.net.isActive() || players.length < 2) return null;
    const i = players.findIndex(x => x.id === p.id);
    for (let k = 1; k < players.length; k++) {
      const q = players[(i + k) % players.length];
      if (q && q.id !== p.id && !q.off) return q;
    }
    return null;
  }

})(window.KWA);
