/* =========================================================
   KWA — demarrage
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  function boot() {
    /* les variantes de questions rejoignent leurs cartes avant la
       premiere partie : elles arrivent par paquets, dans leurs propres
       fichiers, et designent leur carte par son theme */
    K.fusionneVariantes();
    K.load();
    K.menu.init();

    /* Telephone verrouille, onglet ferme par le systeme, metro sans reseau :
       si une place nous attend encore dans un salon, on s y rassoit. */
    K.net.tryResume();

    U.$('#btnMenu').addEventListener('click', () => { K.audio.tap(); K.game.showPause(); });
    U.$('#btnScores').addEventListener('click', () => { K.audio.tap(); K.game.showScores(); });
    /* la pastille de la regle en cours : on clique dessus pour relire ce
       qu elle fait et voir combien de joueurs doivent encore passer */
    U.$('#hudEvent').addEventListener('click', () => K.events.detail());
    K.son.install();

    /* deverrouillage audio au premier contact (iOS) */
    const unlock = () => {
      K.audio.unlock();
      /* le navigateur interdit le son avant un geste : le theme du menu
         ne peut donc demarrer qu ici, au premier contact avec l ecran */
      K.music && K.music.reveille();
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock, { passive: true });
    document.addEventListener('click', unlock);

    /* empeche le zoom double-tap */
    let lastTouch = 0;
    document.addEventListener('touchend', e => {
      const now = Date.now();
      if (now - lastTouch < 300) e.preventDefault();
      lastTouch = now;
    }, { passive: false });

    /* garde la hauteur reelle du viewport mobile */
    const vh = () => document.documentElement.style.setProperty('--vh', innerHeight * 0.01 + 'px');
    vh(); addEventListener('resize', vh);

    console.log('%cTu joues a KWA ?%c v1.0 — ' + (K.CARDS ? K.CARDS.length : 0) + ' cartes chargees',
      'font-weight:bold;color:#ff3fa4', 'color:#39e7ff');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window.KWA);
