/* =========================================================
   KWA — LE BOUTON DU SON

   Depuis qu il y a de la musique, couper le son n est plus un
   reglage qu on visite : c est un geste qu on fait tout de
   suite, parce que quelqu un arrive, parce qu on est dans le
   train. Le bouton doit donc etre la ou qu on soit — menus,
   plateau, et jusque dans une question posee en plein ecran.

   Il n y a qu un reglage derriere : celui de la page des
   reglages et celui du menu de pause disent la meme chose.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const S = K.son = {};

  const CLASSE = 'btn-son';

  S.actif = () => !!(K.audio && K.audio.enabled());

  /* ---------------------------------------------------------
     Poser un exemplaire
     --------------------------------------------------------- */
  /**
   * Ajoute le bouton dans un conteneur, une seule fois.
   * `coin` : le conteneur n a pas de barre ou l accrocher, le bouton
   * se pose alors lui-meme dans l angle (ecran titre).
   */
  S.pose = function (parent, coin) {
    if (!parent || parent.querySelector('.' + CLASSE)) return null;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = CLASSE + (coin ? ' coin' : '');
    parent.appendChild(b);
    habille(b);
    return b;
  };

  function habille(b) {
    const on = S.actif();
    b.textContent = on ? '🔊' : '🔇';
    b.classList.toggle('off', !on);
    b.setAttribute('aria-label', on ? 'Couper le son' : 'Remettre le son');
    b.setAttribute('aria-pressed', on ? 'false' : 'true');
  }

  /** remet tous les exemplaires d accord, ou qu ils soient */
  S.rafraichit = function () {
    U.$$('.' + CLASSE).forEach(habille);
    const c = U.$('#optSound');
    if (c) c.checked = S.actif();
    const p = U.$('#pzSound');
    if (p) p.textContent = S.actif() ? '🔊 Son actif' : '🔇 Son coupe';
  };

  /* ---------------------------------------------------------
     Le reglage lui-meme
     --------------------------------------------------------- */
  S.regle = function (v) {
    v = !!v;
    if (K.state && K.state.settings) K.state.settings.sound = v;
    K.audio.setEnabled(v);
    K.music && K.music.setEnabled(v);
    /* le clic de confirmation ne se joue qu en rallumant : le couper
       et s entendre faire du bruit, c est raté */
    if (v) K.audio.tap();
    K.save && K.save();
    S.rafraichit();
  };

  S.bascule = () => S.regle(!S.actif());

  /* ---------------------------------------------------------
     Branchement
     --------------------------------------------------------- */
  /** un seul ecouteur pour tous les exemplaires, presents et a venir */
  S.install = function () {
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('.' + CLASSE);
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      S.bascule();
    }, true);
    S.poseTout();
  };

  /** les emplacements fixes de la page */
  S.poseTout = function () {
    U.$$('.topbar').forEach(t => S.pose(t));
    S.pose(U.$('.hud-top'));
    S.pose(U.$('#screen-title'), true);
    S.rafraichit();
  };

  /** appele a chaque overlay monte : une question, un panneau, un secret */
  S.poseOverlay = function () {
    const h = U.$('#overlay .ov-head');
    if (h) { S.pose(h); }
  };

})(window.KWA);
