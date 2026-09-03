/* =========================================================
   L ECRAN PUBLIC DE L EPREUVE

   Un joueur repond sur son telephone, et les huit autres
   regardent quelqu un fixer un ecran qu ils ne voient pas.
   C est le trou noir des jeux a plusieurs appareils.

   Ce module montre a TOUTE la table ce qui est en train
   d etre demande : la question et ses propositions, la photo
   qui se devoile, la lettre du Mot Raccord. Sur tous les
   telephones a la fois, par le meme canal que le projecteur —
   donc rien de plus a synchroniser.

   Une seule regle, et elle n a pas d exception : on ne montre
   jamais ce qui est secret. Le mot de l Undercover, le numero
   de L Echelle, l annee du DJ n ont rien a faire ici. Ce qui
   passe par cet ecran, c est ce que la table aurait de toute
   facon entendu si on jouait autour d une table.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const S = K.scene = {};

  /** affiche la carte publique sur tous les ecrans */
  S.montre = html => U.spotlight(html);

  /** et la retire */
  S.cache = () => U.clearSpotlight();

  /**
   * Une question et ses propositions.
   * Les propositions sont montrees sans rien marquer : la table joue
   * avec, mais c est le joueur sur scene qui tranche.
   */
  S.question = function (o) {
    const lettres = 'ABCDEF';
    return '<div class="sc-carte">' +
      (o.duree ? '<i class="sc-jauge" style="--t:' + o.duree + 's"></i>' : '') +
      '<small>' + U.esc(o.cat || '') + '</small>' +
      (o.titre ? '<b>' + U.esc(o.titre) + '</b>' : '') +
      '<p>' + U.esc(o.texte || '') + '</p>' +
      (o.choix && o.choix.length
        ? '<ul class="sc-choix">' + o.choix.map((c, i) =>
            '<li><span>' + lettres[i] + '</span>' + U.esc(c) + '</li>').join('') + '</ul>'
        : '') +
    '</div>';
  };

  /**
   * Une photo qui se devoile, avec les memes propositions.
   * Le flou part au meme moment que sur le telephone du joueur : les
   * deux animations sont en CSS et demarrent a l affichage.
   */
  S.photo = function (o) {
    const lettres = 'ABCDEF';
    return '<div class="sc-carte sc-photo">' +
      (o.duree ? '<i class="sc-jauge" style="--t:' + o.duree + 's"></i>' : '') +
      '<small>' + U.esc(o.cat || '') + '</small>' +
      '<div class="sc-img"><img class="ph-img nette" src="' + U.esc(o.url) + '" alt=""></div>' +
      (o.choix && o.choix.length
        ? '<ul class="sc-choix">' + o.choix.map((c, i) =>
            '<li><span>' + lettres[i] + '</span>' + U.esc(c) + '</li>').join('') + '</ul>'
        : '') +
    '</div>';
  };

  /** une liste de consignes : le Mot Raccord, et tout ce qui s y prete */
  S.liste = function (o) {
    return '<div class="sc-carte">' +
      (o.duree ? '<i class="sc-jauge" style="--t:' + o.duree + 's"></i>' : '') +
      '<small>' + U.esc(o.cat || '') + '</small>' +
      (o.lettre ? '<div class="letter-big">' + U.esc(o.lettre) + '</div>' : '') +
      (o.texte ? '<p>' + U.esc(o.texte) + '</p>' : '') +
      '<ul class="sc-liste">' + (o.items || []).map(it =>
        '<li>' + U.esc(it) + '</li>').join('') + '</ul>' +
      (o.pied ? '<small class="sc-pied">' + U.esc(o.pied) + '</small>' : '') +
    '</div>';
  };

})(window.KWA);
