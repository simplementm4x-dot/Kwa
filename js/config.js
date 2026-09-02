/* =========================================================
   TU JOUES A KWA ? — configuration
   Le seul fichier a toucher pour mettre le jeu en ligne.
   ========================================================= */
window.KWA = window.KWA || {};

KWA.CONFIG = {

  /**
   * Adresse du serveur de salons (mode multi-telephones).
   *
   * ---------------------------------------------------------------
   *  A REMPLIR pour jouer en ligne depuis https://kwafr.netlify.app
   * ---------------------------------------------------------------
   *  Netlify heberge le jeu mais ne peut pas tenir les salons.
   *  Deploie ce depot sur Render (fichier render.yaml a la racine :
   *  New > Blueprint), recupere l adresse qu il te donne, et colle-la
   *  ici en remplacant http par wss :
   *
   *      server: 'wss://kwa-server-xxxx.onrender.com'
   *
   *  Depuis un site en https, l adresse DOIT commencer par wss://.
   *
   * ---------------------------------------------------------------
   *  Laisser vide ('') quand le serveur est au meme endroit que la
   *  page : c est le cas en local avec "node server/server.js", ou
   *  sur un VPS qui sert le jeu et les salons. Rien a changer alors.
   */
  server: ''
};
