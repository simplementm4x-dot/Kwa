/* =========================================================
   KWA — demarrage
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  function boot() {
    K.load();
    K.menu.init();

    U.$('#btnMenu').addEventListener('click', () => { K.audio.tap(); K.game.showPause(); });
    U.$('#btnScores').addEventListener('click', () => { K.audio.tap(); K.game.showScores(); });

    /* deverrouillage audio au premier contact (iOS) */
    const unlock = () => { K.audio.unlock(); document.removeEventListener('touchstart', unlock); document.removeEventListener('click', unlock); };
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
