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
   *  En place : le jeu est sur https://kwafr.netlify.app (Netlify) et
   *  les salons tournent sur Render. Netlify sert les fichiers mais ne
   *  peut pas tenir de connexion permanente, d ou les deux adresses.
   *
   *  Depuis un site en https, l adresse DOIT commencer par wss://.
   *  (l adresse Render est en https:// dans le navigateur, wss:// ici :
   *  c est le meme serveur, juste l autre protocole)
   *
   * ---------------------------------------------------------------
   *  Laisser vide ('') quand le serveur est au meme endroit que la
   *  page : c est le cas en local avec "node server/server.js", ou
   *  sur un VPS qui sert le jeu et les salons.
   */
  server: 'wss://kwa-6gp9.onrender.com'
};
