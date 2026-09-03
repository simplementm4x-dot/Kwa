/* =========================================================
   KWA — plateau serpentin de la Foret Enchantee
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const B = K.board = {};

  const COLS = 4;
  const COL_W = 196;
  const ROW_H = 168;
  const START_Y = 300;
  const SVG_OX = 900, SVG_OY = 2600;   /* origine du svg dans le repere sol */

  let tiles = [], props = [], camIdx = 0;

  /* --- pseudo aleatoire deterministe (meme plateau tant qu on ne relance pas) --- */
  let seed = 1;
  function srnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

  /* ---------------------------------------------------------
     Position d une case dans le repere du sol
     --------------------------------------------------------- */
  function layout(i) {
    const row = Math.floor(i / COLS);
    let col = i % COLS;
    if (row % 2 === 1) col = COLS - 1 - col;
    const gx = (col - (COLS - 1) / 2) * COL_W + Math.sin(i * 1.7) * 14;
    const gy = START_Y - row * ROW_H - (i % COLS) * 9;
    return { gx, gy, row };
  }

  /* ---------------------------------------------------------
     Repartition des types de cases
     --------------------------------------------------------- */
  const GROSSES = ['undercover', 'anecdote', 'verite', 'vingtetun',
                   'dilemme', 'mime', 'motraccord', 'duel'];
  const ECLAIRS = ['echange', 'peage', 'roue'];

  /** une epreuve au hasard parmi celles jouables : sert a "Kwa a faim" */
  B.randomPlayable = function () {
    const pool = ['quiz'].concat(GROSSES, ECLAIRS).filter(t => K.rules.tileAllowed(t));
    return pool[U.rnd(pool.length)];
  };

  function pickTypes(len) {
    /* a distance, le 21, le mime et le duel ne peuvent pas se jouer :
       ils ne doivent pas non plus apparaitre sur le chemin */
    const grosses = GROSSES.filter(t => K.rules.tileAllowed(t));
    const eclairs = ECLAIRS.filter(t => K.rules.tileAllowed(t));

    /* Une case sur cinq est une case eclair. C est une question de rythme :
       enchainer trois epreuves de trois minutes epuise une table, il faut
       des cases qui se resolvent le temps d une phrase. */
    const mid = len - 2;
    const nQuiz = Math.max(1, Math.round(mid * 0.42));
    const nEclair = eclairs.length ? Math.round(mid * 0.22) : 0;
    const nGrosses = Math.max(0, mid - nQuiz - nEclair);

    const bag = [];
    let s = 0;
    while (bag.length < nGrosses && grosses.length) bag.push(grosses[s++ % grosses.length]);
    s = 0;
    for (let i = 0; i < nEclair; i++) bag.push(eclairs[s++ % eclairs.length]);
    for (let i = 0; i < nQuiz; i++) bag.push('quiz');

    /* melange puis on evite deux cases speciales identiques collees */
    let arr = U.shuffle(bag);
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] === arr[i - 1] && arr[i] !== 'quiz') {
        for (let j = i + 1; j < arr.length; j++) {
          if (arr[j] !== arr[i] && arr[j] !== (arr[i + 1] || '')) {
            [arr[i], arr[j]] = [arr[j], arr[i]]; break;
          }
        }
      }
    }
    /* les 2 premieres cases jouables sont des quiz : mise en jambe */
    if (arr.length > 2) { arr[0] = 'quiz'; arr[1] = 'quiz'; }
    return ['start'].concat(arr, ['finish']);
  }

  /* ---------------------------------------------------------
     Generation
     --------------------------------------------------------- */
  /** tire un plateau au hasard */
  B.generate = function (len) {
    return B.build(pickTypes(len));
  };

  /** reconstruit un plateau a l identique a partir de la liste des types
      (mode multi : tous les telephones doivent voir exactement le meme) */
  B.build = function (types) {
    seed = 1234567;
    tiles = types.map((t, i) => {
      const p = layout(i);
      return { i, type: t, gx: p.gx, gy: p.gy, row: p.row };
    });
    K.state.board = tiles;
    buildProps(types.length);
    return tiles;
  };

  B.typeList = () => tiles.map(t => t.type);
  B.propList = () => props;

  B.tiles = () => tiles;
  B.length = () => tiles.length;
  B.last = () => tiles.length - 1;
  B.at = i => tiles[U.clamp(i, 0, tiles.length - 1)];

  /* ---------------------------------------------------------
     Decor : on garnit les cotes du chemin
     --------------------------------------------------------- */
  function buildProps(len) {
    props = [];
    const rows = Math.ceil(len / COLS) + 2;
    const halfPath = (COLS - 1) / 2 * COL_W + 120;

    for (let r = -1; r < rows; r++) {
      const baseY = START_Y - r * ROW_H;
      /* grands arbres de part et d autre */
      for (let side = -1; side <= 1; side += 2) {
        const n = 2 + Math.floor(srnd() * 2);
        for (let k = 0; k < n; k++) {
          const dist = halfPath + 40 + srnd() * 340;
          const kind = srnd() < 0.74 ? 'tree' : (srnd() < 0.5 ? 'bush' : 'rock');
          const h = kind === 'tree' ? 150 + srnd() * 130 : 46 + srnd() * 34;
          props.push({
            gx: side * dist,
            gy: baseY + (srnd() - 0.5) * ROW_H,
            kind, h,
            variant: Math.floor(srnd() * 5),
            sway: kind !== 'rock'
          });
        }
      }
      /* petit decor entre les cases */
      const n2 = 2 + Math.floor(srnd() * 3);
      for (let k = 0; k < n2; k++) {
        const r2 = srnd();
        const kind = r2 < 0.4 ? 'mush' : (r2 < 0.72 ? 'flower' : 'crystal');
        props.push({
          gx: (srnd() - 0.5) * (halfPath * 1.9),
          gy: baseY + (srnd() - 0.5) * ROW_H,
          kind,
          h: kind === 'crystal' ? 56 + srnd() * 40 : 36 + srnd() * 26,
          variant: Math.floor(srnd() * 4),
          sway: kind === 'flower'
        });
      }
    }
    /* rangee d arbres tres lointaine derriere le terminus */
    const farY = START_Y - rows * ROW_H;
    for (let k = -6; k <= 6; k++) {
      props.push({ gx: k * 150 + (srnd() - .5) * 60, gy: farY - srnd() * 300, kind: 'tree', h: 200 + srnd() * 90, variant: Math.floor(srnd() * 5), sway: true });
    }
  }

  /* ---------------------------------------------------------
     Rendu
     --------------------------------------------------------- */
  /**
   * Le sol ne couvre que ce qui existe. Un chemin de 20 cases n a pas
   * besoin de la meme feuille qu un chemin de 80, et une couche trop
   * grande finit par ne plus etre dessinee du tout sur telephone.
   */
  function dimensionneSol() {
    const g = U.$('#ground');
    if (!g || !tiles.length) return;
    let hautY = Infinity, basY = -Infinity;
    const voir = o => { if (o.gy < hautY) hautY = o.gy; if (o.gy > basY) basY = o.gy; };
    tiles.forEach(voir);
    props.forEach(voir);
    /* juste ce qu il faut autour du chemin : la camera ne montre
       jamais plus d un millier de pixels de sol a la fois */
    const haut = Math.round(hautY - 420);
    const bas = Math.round(basY + 520);
    g.style.setProperty('--sol-top', haut + 'px');
    g.style.setProperty('--sol-h', (bas - haut) + 'px');
  }

  B.render = function () {
    const tl = U.$('#tiles'), pr = U.$('#props'), svg = U.$('#pathSvg');
    dimensionneSol();

    /* --- chemin --- */
    const pts = tiles.map(t => (t.gx + SVG_OX) + ',' + (t.gy + SVG_OY)).join(' ');
    svg.setAttribute('viewBox', '0 0 1800 5600');
    svg.innerHTML =
      '<polyline points="' + pts + '" fill="none" stroke="#22180f" stroke-width="118" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="#4a3a29" stroke-width="98" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="#67523a" stroke-width="76" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="#8b7052" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".5" stroke-dasharray="18 26"/>';

    /* --- cases --- */
    tl.innerHTML = '';
    tiles.forEach(t => {
      const d = K.TILE_TYPES[t.type];
      const cls = 'tile' + (t.type === 'start' ? ' is-start' : '') + (t.type === 'finish' ? ' is-finish' : '');
      const el = U.el(
        '<div class="' + cls + '" data-i="' + t.i + '" style="--c1:' + d.c1 + ';--c2:' + d.c2 + '">' +
          '<i class="t-paper"></i>' +
          '<span class="t-ico">' + d.icon + '</span>' +
          (t.type === 'start' || t.type === 'finish' ? '' : '<span class="t-num">' + t.i + '</span>') +
        '</div>'
      );
      place(el, t.gx, t.gy);
      tl.appendChild(el);
    });

    /* --- decor --- */
    pr.innerHTML = '';
    props.forEach(p => {
      const el = U.el('<div class="prop' + (p.sway ? ' sway' : '') + '" style="--sw:' + Math.round(p.h * .8) + 'px">' +
        '<div class="shadow"></div><div class="bb">' + K.sprites.propByKind(p.kind, p.variant, p.h) + '</div></div>');
      place(el, p.gx, p.gy);
      pr.appendChild(el);
    });

    B.focus(camIdx, true);
  };

  function place(el, gx, gy) {
    el.style.left = (450 + gx) + 'px';
    el.style.top = gy + 'px';
  }
  B.place = place;

  /** coordonnees ecran approximatives d une case (pour les effets flottants) */
  B.screenPos = function (i) {
    const el = U.$('#tiles .tile[data-i="' + i + '"]');
    if (!el) return { x: innerWidth / 2, y: innerHeight / 2 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  /* ---------------------------------------------------------
     Camera : recentre le sol sur une case
     --------------------------------------------------------- */
  B.focus = function (i, instant) {
    K.net && K.net.ev('cam', { i, instant: !!instant });
    B.focusLocal(i, instant);
  };
  B.focusLocal = function (i, instant) {
    camIdx = U.clamp(i, 0, tiles.length - 1);
    const t = tiles[camIdx];
    const g = U.$('#ground');
    if (!g || !t) return;
    if (instant) g.style.transition = 'none';
    g.style.transform = 'rotateX(var(--rx)) translate3d(' + (-t.gx) + 'px,' + (-t.gy) + 'px,0)';
    if (instant) { void g.offsetWidth; g.style.transition = ''; }
  };

  /**
   * Travelling d ouverture : on part du bout du chemin et on redescend
   * lentement jusqu a la case de depart, en suivant le chemin.
   */
  B.travelling = function (ms) {
    K.net && K.net.ev('travel', { ms });
    return B.travellingLocal(ms);
  };
  B.travellingLocal = function (ms) {
    ms = ms || 3400;
    const g = U.$('#ground');
    if (!g || !tiles.length) return Promise.resolve();
    const fin = tiles[tiles.length - 1];
    const dep = tiles[0];

    /* On se pose au bout du chemin, sans animation. Pas de recul en
       profondeur : le translate est applique APRES la rotation du sol,
       donc un translateZ ne recule pas la camera, il fait glisser tout
       le plateau de travers. */
    camIdx = tiles.length - 1;
    g.style.transition = 'none';
    g.style.transform = 'rotateX(var(--rx)) translate3d(' + (-fin.gx) + 'px,' + (-fin.gy) + 'px,0)';
    void g.offsetWidth;

    /* puis on redescend lentement jusqu au depart */
    g.style.transition = 'transform ' + ms + 'ms cubic-bezier(.42,0,.26,1)';
    camIdx = 0;
    g.style.transform = 'rotateX(var(--rx)) translate3d(' + (-dep.gx) + 'px,' + (-dep.gy) + 'px,0)';
    return U.sleep(ms + 60).then(() => { g.style.transition = ''; });
  };

  B.hit = function (i) {
    K.net && K.net.ev('hit', { i });
    B.hitLocal(i);
  };
  B.hitLocal = function (i) {
    const el = U.$('#tiles .tile[data-i="' + i + '"]');
    if (!el) return;
    el.classList.remove('hl'); void el.offsetWidth; el.classList.add('hl');
  };

  /* ---------------------------------------------------------
     Lucioles (calque 2D par dessus)
     --------------------------------------------------------- */
  B.fireflies = function (n) {
    const box = U.$('#fireflies');
    box.innerHTML = '';
    for (let k = 0; k < (n || 18); k++) {
      const f = document.createElement('i');
      f.className = 'ff';
      f.style.left = Math.random() * 100 + '%';
      f.style.top = (30 + Math.random() * 65) + '%';
      f.style.animationDuration = (5 + Math.random() * 6) + 's';
      f.style.animationDelay = (-Math.random() * 8) + 's';
      box.appendChild(f);
    }
  };

  /* ---------------------------------------------------------
     Nombre flottant (+3 / -2) au dessus d une case
     --------------------------------------------------------- */
  B.floatDelta = function (i, text, color) {
    K.net && K.net.ev('fx', { i, text, color });
    B.floatDeltaLocal(i, text, color);
  };
  B.floatDeltaLocal = function (i, text, color) {
    const p = B.screenPos(i);
    const el = U.el('<div class="float-delta" style="color:' + color + '">' + U.esc(text) + '</div>');
    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  };

})(window.KWA);
