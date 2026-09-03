/* =========================================================
   POSER LA MEME QUESTION A TOUT LE MONDE EN MEME TEMPS

   Le reste du jeu fonctionne au tour par tour : un joueur sur
   scene, les autres qui regardent. C est ce qui donne son
   rythme a une partie, et c est aussi son plafond — a dix
   joueurs, chacun joue un tour sur dix.

   Ici, tous les telephones s allument ensemble. Chacun repond
   chez lui, personne n attend son tour, et le classement se
   fait sur ce qui compte pour l epreuve : la vitesse, la
   precision, ou les deux.

   Ca ne marche evidemment qu avec plusieurs appareils. A un
   seul telephone, il n y a rien de simultane a organiser :
   l epreuve doit prevoir sa version qui tourne autour de la
   table.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const S = K.simultane = {};

  /** peut-on faire jouer tout le monde en meme temps ? */
  S.possible = function () {
    return !!(K.net && K.net.isActive() && K.state.settings.device === 'multi' &&
              K.state.players.length > 1);
  };

  /**
   * Pose la question a tous les joueurs a la fois.
   *
   * spec peut etre un objet (la meme question pour tous) ou une
   * fonction qui recoit le joueur et rend sa question.
   *
   * Rend { id du joueur -> reponse }. Un joueur qui n a pas repondu
   * avant la limite n a simplement pas d entree : une epreuve ne doit
   * jamais rester suspendue a quelqu un parti aux toilettes.
   */
  S.demande = function (players, spec, opts) {
    opts = opts || {};
    const net = K.net;
    const reponses = {};
    const limite = opts.ms || 45000;

    const jobs = players.map(p => {
      const s = typeof spec === 'function' ? spec(p) : spec;
      const question = (net && net.isActive() && net.isHost() && !net.isMe(p.id))
        ? net.ask(p, s, { muet: true })
        : K.prompt.render(s);

      /* chaque reponse arrive quand elle arrive ; la limite ne coupe
         que l attente, pas la question */
      return Promise.race([
        question.then(v => { reponses[p.id] = v; }),
        U.sleep(limite)
      ]);
    });

    return Promise.all(jobs).then(() => {
      U.closeOverlay();
      return reponses;
    });
  };

  /**
   * Le classement d une epreuve simultanee, et ce qu il rapporte.
   *
   * Premier deux cases, deuxieme une, dernier une en moins, les
   * autres rien. A deux joueurs il n y a pas de deuxieme place a
   * recompenser : c est gagne ou c est perdu.
   *
   * `rangs` : les joueurs deja tries, du meilleur au moins bon.
   * Ceux qui n ont pas joue ne sont pas dans la liste et ne prennent
   * donc ni gain ni malus.
   */
  S.recompense = function (rangs) {
    const n = rangs.length;
    if (!n) return [];
    if (n === 1) return [{ id: rangs[0].id, delta: 2 }];
    return rangs.map((p, i) => {
      let delta = 0;
      if (i === 0) delta = 2;
      else if (i === 1 && n > 2) delta = 1;
      if (i === n - 1) delta = -1;      /* le dernier paie, meme s il est deuxieme */
      return { id: p.id, delta };
    }).filter(r => r.delta);
  };

})(window.KWA);
