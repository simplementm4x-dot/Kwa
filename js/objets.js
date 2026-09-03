/* =========================================================
   LES OBJETS

   Une case du chemin ne donne rien tout de suite : elle donne
   un objet. Et un objet, ca se garde.

   C est la seule chose du jeu qui differe une decision. Tout
   le reste se resout dans la seconde ou la case tombe ; la,
   on repart avec un truc dans la poche et le choix de s en
   servir maintenant ou au tour ou ca fera vraiment mal.

   Une seule poche. Ramasser un deuxieme objet oblige donc a
   en abandonner un : c est ce qui empeche d accumuler et de
   tout lacher d un coup a l arrivee.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const O = K.objets = {};

  K.anim = K.anim || {};

  /* ---------------------------------------------------------
     Le catalogue
     --------------------------------------------------------- */
  const LISTE = [
    {
      id: 'vaisseau', ico: '🛸', nom: 'Le Vaisseau', court: 'Echange de place',
      txt: 'Tu changes de place avec un joueur tire au sort. Tu ne choisis pas qui : ' +
           'c est la foret qui decide, et elle a de l humour.'
    },
    {
      id: 'de', ico: '🎲', nom: 'Le De +', court: '+3 au lance',
      txt: 'Trois cases de plus sur ton prochain lance. Rien de spectaculaire, ' +
           'mais c est le seul objet qui ne se retourne jamais contre toi.'
    },
    {
      id: 'fantome', ico: '👻', nom: 'Le Fantome', court: 'Maudit un joueur',
      txt: 'Tu maudis quelqu un. A son prochain tour, tout ce qu il aurait gagne, ' +
           'il le recule. Il le sait, et il devra quand meme lancer.'
    },
    {
      id: 'couleurs', ico: '🌈', nom: 'La Roue des couleurs', court: 'Le hasard en couleurs',
      txt: 'Tu lances la roue sur toi ou sur quelqu un d autre. Chaque couleur fait ' +
           'avancer ou reculer. Viser un adversaire peut tres bien lui offrir cinq cases.'
    },
    {
      id: 'rocher', ico: '🪨', nom: 'Le Rocher', court: 'Pousse un joueur en arriere',
      txt: 'Tu pousses le joueur de ton choix jusqu au joueur le plus proche derriere lui. ' +
           'Plus il menait large, plus la chute est longue.'
    }
  ];

  O.liste = () => LISTE.slice();
  O.byId = id => LISTE.find(o => o.id === id) || null;

  /** l objet qu un joueur a en poche, ou null */
  O.de = p => (p && p.item ? O.byId(p.item) : null);

  O.reset = function () {
    K.state.players.forEach(p => { p.item = null; p.maudit = false; });
  };

  /** la pastille affichee dans le bandeau des joueurs */
  O.badge = function (p) {
    const o = O.de(p);
    return (o ? '<u class="hp-obj" title="' + U.esc(o.nom) + '">' + o.ico + '</u>' : '') +
           (p && p.maudit ? '<u class="hp-obj maudit" title="Maudit">👻</u>' : '');
  };

  /* ---------------------------------------------------------
     La case : on ramasse
     --------------------------------------------------------- */
  K.registerTile('objet', async function (ctx) {
    const p = ctx.player;
    const tire = LISTE[U.rnd(LISTE.length)];

    await K.kwa.say('UNE CAISSE ! Voyons ce que la foret a laisse trainer la...', { mood: 'oh' });

    K.net && K.net.ev('anim', { fn: 'objet', id: tire.id, name: p.name });
    await K.anim.objet({ id: tire.id, name: p.name });

    const ancien = O.de(p);
    if (!ancien) {
      p.item = tire.id;
      await K.kwa.say(p.name + ' empoche ' + tire.nom + '. A utiliser avant le de, ' +
        'au tour de son choix.', { auto: 1700, mood: 'wink' });
      K.game.hud();
      return [];
    }

    /* une seule poche : il faut abandonner quelque chose */
    const choix = await K.ask(p, {
      kind: 'list', icon: '🎒',
      title: 'Une seule poche',
      sub: 'Tu as deja ' + ancien.nom,
      intro: 'Tu ne peux pas porter les deux. Lequel tu gardes ?',
      passMsg: 'A toi de faire le tri.',
      items: [
        { id: tire.id, label: 'Prendre ' + tire.nom + ' — ' + tire.court, img: null, small: true },
        { id: ancien.id, label: 'Garder ' + ancien.nom + ' — ' + ancien.court, img: null, small: true }
      ]
    });
    U.closeOverlay();

    p.item = choix === ancien.id ? ancien.id : tire.id;
    const garde = O.byId(p.item);
    await K.kwa.say(p.name + ' repart avec ' + garde.nom + '.', { auto: 1400, mood: 'happy' });
    K.game.hud();
    return [];
  });

  /** la caisse qui s ouvre, identique sur tous les ecrans */
  K.anim.objet = async function (d) {
    const o = O.byId(d.id);
    if (!o) return;
    U.overlay('<div class="ov-head"><span class="ov-ico">📦</span><h3>Objet trouve' +
      '<span class="ov-sub">' + U.esc(d.name || '') + '</span></h3></div>' +
      '<div class="ov-body"><div class="obj-drop">' +
        '<div class="obj-caisse" id="objCaisse">📦</div>' +
        '<div class="obj-carte" id="objCarte">' +
          '<span class="obj-ico">' + o.ico + '</span>' +
          '<b>' + U.esc(o.nom) + '</b><small>' + U.esc(o.court) + '</small>' +
          '<p>' + U.esc(o.txt) + '</p>' +
        '</div></div></div>');
    K.audio.pop();
    await U.sleep(560);
    const c = U.$('#objCaisse'), k = U.$('#objCarte');
    if (c) c.classList.add('ouverte');
    if (k) k.classList.add('sortie');
    K.audio.fanfare ? K.audio.fanfare() : K.audio.up();
    U.buzz([20, 40, 20]);
    await U.sleep(2600);
    U.closeOverlay();
  };

  /* ---------------------------------------------------------
     Le debut de tour : on s en sert, ou pas
     Renvoie { bonusDe } : ce que l objet ajoute au lance.
     --------------------------------------------------------- */
  O.tour = async function (p, opts) {
    const o = O.de(p);
    if (!o) return null;
    /* le De + n a aucun sens sur un tour ou personne ne lance : on ne le
       propose pas plutot que de le laisser gaspiller */
    if (o.id === 'de' && opts && opts.lance === false) return null;

    const rep = await K.ask(p, {
      kind: 'list', icon: '🎒',
      title: 'Tu sors ' + o.nom + ' ?',
      sub: o.court,
      intro: o.txt,
      passMsg: 'Ton objet, ton moment.',
      items: [
        { id: 'oui', label: 'Maintenant — ' + o.court, small: true },
        { id: 'non', label: 'Je le garde pour plus tard', small: true }
      ]
    });
    U.closeOverlay();
    if (rep !== 'oui') {
      await K.kwa.say(p.name + ' garde ' + o.nom + ' au chaud. On note.', { auto: 1200, mood: 'wink' });
      return null;
    }

    p.item = null;
    K.game.hud();
    await U.jingle(o.nom, 'Objet', 1100);
    return await EFFETS[o.id](p, o);
  };

  /* ---------------------------------------------------------
     Les effets
     Chacun rend { bonusDe } ou rien, et applique lui-meme ses
     deplacements : ce sont des coups d objet, pas des gains
     d epreuve, une regle de foret ne les double pas.
     --------------------------------------------------------- */
  const autres = p => K.state.players.filter(x => x.id !== p.id);

  const EFFETS = {

    /* --- le vaisseau : on permute avec quelqu un, tire au sort --- */
    async vaisseau(p) {
      const gens = autres(p);
      if (!gens.length) {
        await K.kwa.say('Le vaisseau decolle, tourne, et se repose. Il n y a personne d autre.',
          { auto: 1400, mood: 'wink' });
        return null;
      }
      const q = gens[U.rnd(gens.length)];
      await K.kwa.say('Le vaisseau embarque ' + p.name + '... et le repose a la place de ' +
        q.name + ' !', { auto: 1700, mood: 'oh' });
      const ecart = q.pos - p.pos;
      if (!ecart) {
        await K.kwa.say('Vous etiez sur la meme case. Voyage inutile mais joli.', { auto: 1300 });
        return null;
      }
      await K.game.applyResults([{ id: p.id, delta: ecart }, { id: q.id, delta: -ecart }], true);
      return null;
    },

    /* --- le de + : trois cases de plus sur le lance qui suit --- */
    async de(p) {
      await K.kwa.say('Le de est truque, et tout le monde le voit. ' + p.name +
        ' ajoutera 3 cases a son lance.', { auto: 1600, mood: 'wink' });
      return { bonusDe: 3 };
    },

    /* --- le fantome : la malediction frappe au tour suivant --- */
    async fantome(p) {
      const gens = autres(p);
      if (!gens.length) return null;
      const id = await K.ask(p, {
        kind: 'list', icon: '👻',
        title: 'Tu maudis qui ?',
        sub: 'Le Fantome',
        intro: 'A son prochain tour, il reculera de ce qu il aurait avance. ' +
               'Il ne peut rien y faire : il devra lancer quand meme.',
        passMsg: 'Choisis ta victime.',
        items: gens.map(x => ({
          id: x.id, pid: x.id, color: x.hex,
          label: x.name + ' — case ' + x.pos + (x.maudit ? ' (deja maudit)' : '')
        }))
      });
      U.closeOverlay();
      const q = K.player(id);
      if (!q) return null;
      q.maudit = true;
      K.game.hud();
      K.net && K.net.broadcastState();
      await K.kwa.say(q.name + ' est maudit. Son prochain lance le fera reculer d autant. ' +
        'Bonne nuit.', { auto: 1900, mood: 'what' });
      return null;
    },

    /* --- la roue des couleurs : sur soi ou sur un autre --- */
    async couleurs(p) {
      const gens = autres(p);
      let cible = p;
      if (gens.length) {
        const id = await K.ask(p, {
          kind: 'list', icon: '🌈',
          title: 'La roue tourne pour qui ?',
          sub: 'La Roue des couleurs',
          intro: 'Chaque couleur fait avancer ou reculer. Viser quelqu un d autre, ' +
                 'c est aussi risquer de lui offrir cinq cases.',
          passMsg: 'A toi de viser.',
          items: [{ id: p.id, pid: p.id, color: p.hex, label: 'Moi, ' + p.name }]
            .concat(gens.map(x => ({
              id: x.id, pid: x.id, color: x.hex, label: x.name + ' — case ' + x.pos
            })))
        });
        U.closeOverlay();
        cible = K.player(id) || p;
      }

      const i = U.rnd(COULEURS.length);
      const seg = COULEURS[i];
      K.net && K.net.ev('anim', { fn: 'couleurs', i, name: cible.name });
      await K.anim.couleurs({ i, name: cible.name });

      await K.kwa.say(seg.v > 0
        ? seg.nom + ' ! ' + cible.name + ' avance de ' + U.cases(seg.v) + '.'
        : seg.nom + '... ' + cible.name + ' recule de ' + U.cases(-seg.v) + '.',
        { auto: 1600, mood: seg.v > 0 ? 'happy' : 'oh' });
      await K.game.applyResults([{ id: cible.id, delta: seg.v }], true);
      return null;
    },

    /* --- le rocher : la cible degringole jusqu au joueur d en dessous --- */
    async rocher(p) {
      /* on ne propose que des cibles qui ont quelqu un derriere elles :
         un rocher qui n a rien pour l arreter n a aucun sens */
      const cibles = K.state.players.filter(x =>
        K.state.players.some(y => y.id !== x.id && y.pos < x.pos));
      if (!cibles.length) {
        await K.kwa.say('Le rocher devale... et ne trouve personne a pousser. ' +
          p.name + ' le remet dans sa poche.', { auto: 1700, mood: 'wink' });
        p.item = 'rocher';
        K.game.hud();
        return null;
      }
      const id = await K.ask(p, {
        kind: 'list', icon: '🪨',
        title: 'Tu pousses qui ?',
        sub: 'Le Rocher',
        intro: 'Il degringole jusqu a la case du joueur le plus proche derriere lui. ' +
               'Plus il menait large, plus il tombe de haut.',
        passMsg: 'Choisis ta cible.',
        items: cibles.map(x => {
          const sous = derriere(x);
          return {
            id: x.id, pid: x.id, color: x.hex,
            label: x.name + ' — case ' + x.pos + ' (tombe case ' + sous.pos + ')'
          };
        })
      });
      U.closeOverlay();
      const q = K.player(id);
      if (!q) return null;
      const sous = derriere(q);
      const delta = sous.pos - q.pos;
      await K.kwa.say('Le rocher part sur ' + q.name + ' et le pousse jusqu a ' + sous.name + '. ' +
        U.cases(-delta) + ' en arriere.', { auto: 1900, mood: 'oh' });
      await K.game.applyResults([{ id: q.id, delta }], true);
      return null;
    }
  };

  /** le joueur le plus proche derriere celui-la */
  function derriere(x) {
    return K.state.players
      .filter(y => y.id !== x.id && y.pos < x.pos)
      .sort((a, b) => b.pos - a.pos)[0];
  }

  /* ---------------------------------------------------------
     La roue des couleurs
     Meme disque que la Roue de Kwa, mais ce sont les couleurs
     qui portent les valeurs : on lit le resultat avant meme
     de lire le chiffre.
     --------------------------------------------------------- */
  const COULEURS = [
    { nom: 'VERT',   c: '#4ade6f', v: 4 },
    { nom: 'ROUGE',  c: '#ff4d5e', v: -3 },
    { nom: 'BLEU',   c: '#3d8bff', v: 2 },
    { nom: 'NOIR',   c: '#241844', v: -4 },
    { nom: 'JAUNE',  c: '#ffd23d', v: 3 },
    { nom: 'VIOLET', c: '#a865ff', v: -2 },
    { nom: 'ORANGE', c: '#ff8c2e', v: 1 },
    { nom: 'CYAN',   c: '#2ee6d6', v: -1 }
  ];
  const PAS = 360 / COULEURS.length;

  function disque() {
    const r = 92;
    const pt = a => {
      const rad = (a - 90) * Math.PI / 180;
      return [(100 + r * Math.cos(rad)).toFixed(2), (100 + r * Math.sin(rad)).toFixed(2)];
    };
    let parts = '', chiffres = '';
    COULEURS.forEach((s, i) => {
      const [x0, y0] = pt(i * PAS);
      const [x1, y1] = pt((i + 1) * PAS);
      parts += '<path d="M100 100 L' + x0 + ' ' + y0 + ' A' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + y1 + ' Z" ' +
        'fill="' + s.c + '" stroke="#0a0418" stroke-width="2"/>';
      chiffres += '<g transform="rotate(' + (i * PAS + PAS / 2) + ' 100 100)">' +
        '<text x="100" y="40" text-anchor="middle" font-size="22" font-weight="900" ' +
        'fill="#fff" stroke="#0a0418" stroke-width="5" paint-order="stroke" ' +
        'font-family="Outfit, system-ui, sans-serif">' + (s.v > 0 ? '+' + s.v : s.v) + '</text></g>';
    });
    return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="100" cy="100" r="96" fill="#0a0418" stroke="#fff" stroke-width="4"/>' +
      parts + chiffres +
      '<circle cx="100" cy="100" r="17" fill="#1d1233" stroke="#fff" stroke-width="4"/>' +
      '<circle cx="100" cy="100" r="6" fill="#fff"/></svg>';
  }

  K.anim.couleurs = async function (d) {
    const i = d.i % COULEURS.length;
    const s = COULEURS[i];

    U.overlay('<div class="ov-head"><span class="ov-ico">🌈</span><h3>La Roue des couleurs' +
      '<span class="ov-sub">' + U.esc(d.name || '') + '</span></h3></div>' +
      '<div class="ov-body">' +
        '<div class="roue-wrap"><div class="roue-fleche"></div>' +
        '<div class="roue-disc" id="couDisc">' + disque() + '</div></div>' +
        '<div class="roue-out" id="couOut">&nbsp;</div>' +
      '</div>');

    const disc = U.$('#couDisc');
    const angle = 360 * 5 + (360 - (i * PAS + PAS / 2));
    let quand = 0, ecart = 55;
    for (let k = 0; k < 34 && quand < 3100; k++) {
      setTimeout(() => K.audio.tick(), quand);
      quand += ecart;
      ecart *= 1.14;
    }
    await U.sleep(40);
    if (disc) disc.style.transform = 'rotate(' + angle.toFixed(2) + 'deg)';
    await U.sleep(3300);

    const out = U.$('#couOut');
    if (out) {
      out.className = 'roue-out fini';
      out.style.color = s.c;
      out.textContent = s.nom + ' · ' + (s.v > 0 ? '+' + s.v : s.v);
    }
    s.v > 0 ? K.audio.up() : K.audio.down();
    U.buzz(40);
    await U.sleep(1500);
    U.closeOverlay();
  };

  O.couleurs = () => COULEURS.slice();

})(window.KWA);
