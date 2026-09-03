/* =========================================================
   LE RIDEAU

   Kwa ouvre devant un rideau tire. Ce n est pas qu un effet
   de scene : le plateau est construit derriere pendant les
   presentations, et le navigateur a tout le temps de le
   dessiner. Quand le rideau s ecarte, la foret est prete,
   posee sur la case de depart — plus de premiere image qui
   saccade ni de pans de decor qui arrivent en retard.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const R = K.rideau = {};

  const DUREE = 1700;

  function el() { return U.$('#rideau'); }

  /* --- tirer le rideau --- */
  R.fermer = function () {
    K.net && K.net.ev('rideau', { ouvre: false });
    R.fermerLocal();
  };
  R.fermerLocal = function () {
    const r = el();
    if (!r) return;
    r.classList.remove('ouvert');
    r.hidden = false;
  };

  /* --- l ecarter --- */
  R.ouvrir = function (ms) {
    K.net && K.net.ev('rideau', { ouvre: true, ms: ms || DUREE });
    return R.ouvrirLocal(ms);
  };
  R.ouvrirLocal = function (ms) {
    const r = el();
    if (!r || r.hidden) return Promise.resolve();
    ms = ms || DUREE;
    r.style.setProperty('--rid-ms', ms + 'ms');
    /* on laisse un souffle avant de tirer : sinon la transition part
       dans la meme image que la pose de la duree et ne s anime pas */
    void r.offsetWidth;
    r.classList.add('ouvert');
    K.audio.jingle();
    return U.sleep(ms + 140).then(() => {
      r.hidden = true;
      r.classList.remove('ouvert');
    });
  };

  R.estFerme = function () {
    const r = el();
    return !!r && !r.hidden;
  };

})(window.KWA);
