/* =========================================================
   L ESPRIT DE LA FORET

   Une creature occupe une case du chemin. Elle ne joue pas,
   elle ne parle pas : elle attend. Celui qui tombe sur sa
   case se prend un coup de baton — il recule, et il ne joue
   PAS l epreuve de la case. Puis l esprit repart ailleurs.

   C est la seule chose du plateau qui bouge toute seule. Il
   fallait donc qu on la voie venir : elle rode d une case a
   l autre entre les tours, et on peut la surveiller du coin
   de l oeil pendant qu on choisit d avancer ou pas.

   Comme tout le reste, c est l hote qui decide et les autres
   telephones rejouent : la position de l esprit voyage dans
   l etat de la partie, jamais tiree au sort deux fois.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const E = K.esprit = {};

  /* le coup de baton, en cases */
  const MALUS = 3;
  /* tours de joueur entre deux deplacements */
  const RONDE = 2;
  /* de combien de cases il se decale quand il rode */
  const PORTEE = 4;

  /* ---------------------------------------------------------
     Ou il se trouve
     --------------------------------------------------------- */
  E.actif = () => K.state.settings.esprit !== false;
  E.at = () => (K.state.esprit ? K.state.esprit.i : -1);

  /** les cases ou il a le droit de se poser */
  function terrain() {
    const last = K.board.last();
    const out = [];
    /* ni le depart ni le terminus : on ne campe pas les extremites,
       sinon il devient un peage a l arrivee ou un mur au depart */
    for (let i = 2; i <= last - 2; i++) out.push(i);
    return out;
  }

  /** une case libre, aussi loin que possible des pions */
  function choisit(depuis) {
    const zone = terrain().filter(i => !K.state.players.some(p => p.pos === i));
    if (!zone.length) return -1;
    const proches = depuis >= 0
      ? zone.filter(i => Math.abs(i - depuis) <= PORTEE && i !== depuis)
      : zone;
    const pool = proches.length ? proches : zone;
    return pool[U.rnd(pool.length)];
  }

  /* ---------------------------------------------------------
     Debut de partie
     --------------------------------------------------------- */
  E.reset = function () {
    K.state.esprit = null;
    if (!E.actif() || !K.board.length()) { E.render(); return; }
    const i = choisit(-1);
    if (i < 0) { E.render(); return; }
    K.state.esprit = { i, depuis: 0 };
    E.diffuse('apparait');
    E.render();
  };

  /** l hote pousse sa position aux autres telephones */
  E.diffuse = function (acte) {
    K.net && K.net.ev('esprit', { i: E.at(), a: acte || 'pose' });
  };

  /** cote invite : on se contente de reproduire */
  E.mirror = function (d) {
    if (!d || d.i < 0) { K.state.esprit = null; E.render(); return; }
    K.state.esprit = K.state.esprit || { i: d.i, depuis: 0 };
    K.state.esprit.i = d.i;
    E.render(d.a);
  };

  /* ---------------------------------------------------------
     Le sprite sur le plateau
     --------------------------------------------------------- */
  function el() { return U.$('#esprits .esprit'); }

  /**
   * pose l esprit sur sa case. `acte` change l animation jouee :
   * 'marche' le fait avancer, 'frappe' lui fait lever le baton.
   */
  E.render = function (acte) {
    const box = U.$('#esprits');
    if (!box) return;
    const s = K.state.esprit;
    if (!s) { box.innerHTML = ''; return; }

    let e = el();
    if (!e) {
      box.innerHTML = '<div class="esprit"><div class="shadow"></div>' +
        '<div class="bb"><div class="sp"></div></div></div>';
      e = el();
    }
    const t = K.board.at(s.i);
    if (!t) return;

    /* de quel cote il regarde : vers la case qu il vient de quitter */
    const gauche = parseFloat(e.style.left || '0') > 450 + t.gx;
    e.classList.toggle('mire', gauche);

    K.board.place(e, t.gx, t.gy);
    e.classList.remove('marche', 'frappe');
    if (acte === 'marche' || acte === 'frappe') {
      void e.offsetWidth;                       /* sinon l animation ne repart pas */
      e.classList.add(acte);
      setTimeout(() => { const x = el(); if (x) x.classList.remove(acte); },
                 acte === 'frappe' ? 760 : 900);
    }
  };

  /* ---------------------------------------------------------
     Il rode
     Appele apres chaque tour de joueur.
     --------------------------------------------------------- */
  E.rode = async function () {
    const s = K.state.esprit;
    if (!s || !E.actif()) return;
    s.depuis++;
    if (s.depuis < RONDE) return;
    const cible = choisit(s.i);
    if (cible < 0) return;
    s.depuis = 0;
    s.i = cible;
    E.diffuse('marche');
    E.render('marche');
    K.audio.step();
    await U.sleep(420);
  };

  /* ---------------------------------------------------------
     Il frappe
     Renvoie true si le joueur s est fait cueillir : l epreuve
     de la case ne se joue pas.
     --------------------------------------------------------- */
  E.garde = async function (p) {
    const s = K.state.esprit;
    if (!s || !E.actif() || s.i !== p.pos) return false;

    K.board.focus(p.pos);
    K.kwa.setMood('what');
    E.diffuse('frappe');
    E.render('frappe');
    K.audio.crash();
    U.buzz([30, 60, 30]);
    await U.sleep(760);

    await K.kwa.say('L esprit de la foret dormait sur cette case. ' + p.name +
      ' vient de le reveiller.', { mood: 'what' });

    /* le coup de baton passe avant tout : ni double, ni inverse, ni treve.
       Une regle de foret ne protege pas de ce qui garde le chemin. */
    await K.game.applyResults([{ id: p.id, delta: -MALUS, why: 'esprit de la foret' }], true);
    await K.kwa.say('Et pas d epreuve : on ne joue pas quand on se fait sortir du chemin.',
      { auto: 1400, mood: 'wink' });

    /* il ne reste pas planté la : il repart aussitot */
    const cible = choisit(s.i);
    if (cible >= 0) {
      s.i = cible; s.depuis = 0;
      E.diffuse('marche');
      E.render('marche');
      await U.sleep(500);
    }
    return true;
  };

})(window.KWA);
