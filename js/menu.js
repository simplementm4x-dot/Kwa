/* =========================================================
   KWA — menus : reglages, joueurs, regles
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const M = K.menu = {};
  const S = () => K.state.settings;

  /* ---------------------------------------------------------
     Navigation
     --------------------------------------------------------- */
  function nav() {
    U.on(document, 'click', '[data-go]', (e, t) => {
      K.audio.tap();
      const dest = t.dataset.go;
      if (dest === 'rules') M.renderRules();
      U.go(dest);
    });
  }

  /* ---------------------------------------------------------
     Ecran reglages
     --------------------------------------------------------- */
  function syncOptions() {
    U.$$('.opt').forEach(o => o.classList.toggle('sel', S()[o.dataset.set] === o.dataset.val));
    U.$('#rowTurns').hidden = S().mode !== 'tours';
    U.$('#turnsRange').value = S().maxTurns;
    U.$('#turnsVal').textContent = S().maxTurns;
    U.$('#lenRange').value = S().boardLength;
    U.$('#lenVal').textContent = S().boardLength;
    U.$('#optDuelSolo').checked = !!S().duelSolo;
    U.$('#optSpicy').checked = !!S().spicy;
    U.$('#optEvents').checked = S().evenements !== false;
    U.$('#optBets').checked = S().paris !== false;
    U.$('#optPacts').checked = S().pactes !== false;
    U.$('#optSound').checked = !!S().sound;
    U.$('#optDuelSolo').closest('.switch-row').style.opacity = S().device === 'multi' ? '.45' : '1';
  }

  function settings() {
    U.on(document, 'click', '.opt', (e, t) => {
      K.audio.tap();
      S()[t.dataset.set] = t.dataset.val;
      syncOptions();
    });
    U.$('#turnsRange').addEventListener('input', e => {
      S().maxTurns = +e.target.value; U.$('#turnsVal').textContent = S().maxTurns;
    });
    U.$('#lenRange').addEventListener('input', e => {
      S().boardLength = +e.target.value; U.$('#lenVal').textContent = S().boardLength;
    });
    U.$('#optDuelSolo').addEventListener('change', e => { S().duelSolo = e.target.checked; });
    U.$('#optSpicy').addEventListener('change', e => { S().spicy = e.target.checked; });
    U.$('#optEvents').addEventListener('change', e => { S().evenements = e.target.checked; });
    U.$('#optBets').addEventListener('change', e => { S().paris = e.target.checked; });
    U.$('#optPacts').addEventListener('change', e => { S().pactes = e.target.checked; });
    U.$('#optSound').addEventListener('change', e => {
      S().sound = e.target.checked; K.audio.setEnabled(e.target.checked);
    });
    U.$('#btnToPlayers').addEventListener('click', () => {
      K.audio.tap(); K.save();
      if (S().device === 'multi') { K.net.openLobbyScreen(); U.go('lobby'); }
      else { M.renderPlayers(); U.go('players'); }
    });
  }

  /* ---------------------------------------------------------
     Ecran joueurs
     --------------------------------------------------------- */
  M.renderPlayers = function () {
    const list = U.$('#playerList');
    const taken = K.state.players.map(p => p.color);
    list.innerHTML = K.state.players.map((p, i) => {
      const sw = K.COLORS.map(c =>
        '<button class="sw' + (c.id === p.color ? ' on' : '') + (taken.indexOf(c.id) >= 0 && c.id !== p.color ? ' taken' : '') +
        '" style="background:' + c.hex + '" data-col="' + c.id + '" data-p="' + p.id + '" aria-label="' + c.name + '"></button>'
      ).join('');
      return '<div class="pcard" style="border-left-color:' + p.hex + '">' +
        '<label class="pcard-tv" style="border-color:' + p.hex + '">' +
          (p.img ? '<img src="' + p.img + '" alt="">' : '<span class="tv-ph">📺</span>') +
          '<input type="file" accept="image/*" hidden data-img="' + p.id + '">' +
        '</label>' +
        '<div class="pcard-main">' +
          '<input type="text" maxlength="14" placeholder="Joueur ' + (i + 1) + '" value="' + U.esc(p.name) + '" data-name="' + p.id + '">' +
          '<div class="swatches">' + sw + '</div>' +
        '</div>' +
        '<div class="pcard-side">' +
          '<button class="mini-btn" data-shot="' + p.id + '">📷</button>' +
          '<button class="mini-btn danger" data-del="' + p.id + '">✕</button>' +
        '</div>' +
      '</div>';
    }).join('');
    U.$('#btnAddPlayer').hidden = K.state.players.length >= 8;
    const depart = U.$('#btnStart');
    if (depart) depart.textContent = S().libre ? 'CHOISIR UNE EPREUVE ▶' : "C'EST PARTI ▶";
  };

  function players() {
    U.$('#btnAddPlayer').addEventListener('click', () => {
      if (K.state.players.length >= 8) return;
      K.audio.tap();
      K.state.players.push(K.newPlayer());
      M.renderPlayers();
    });

    U.on(U.$('#playerList'), 'input', 'input[data-name]', (e, t) => {
      const p = K.player(t.dataset.name); if (p) p.name = t.value;
    });
    U.on(U.$('#playerList'), 'click', '.sw', (e, t) => {
      const p = K.player(t.dataset.p); if (!p) return;
      K.audio.blip();
      const c = K.COLORS.find(x => x.id === t.dataset.col);
      p.color = c.id; p.hex = c.hex;
      M.renderPlayers();
    });
    U.on(U.$('#playerList'), 'click', '[data-shot]', (e, t) => {
      const inp = U.$('input[data-img="' + t.dataset.shot + '"]');
      inp && inp.click();
    });
    U.on(U.$('#playerList'), 'click', '[data-del]', (e, t) => {
      if (K.state.players.length <= 2) { U.toast('Il faut au moins 2 joueurs'); return; }
      K.audio.tap();
      K.state.players = K.state.players.filter(p => p.id !== t.dataset.del);
      M.renderPlayers();
    });
    U.on(U.$('#playerList'), 'change', 'input[type=file]', async (e, t) => {
      const f = t.files && t.files[0]; if (!f) return;
      const p = K.player(t.dataset.img); if (!p) return;
      try {
        p.img = await U.readImage(f, 192);
        M.renderPlayers(); K.audio.pop();
      } catch (err) { U.toast('Image illisible'); }
    });

    U.$('#btnStart').addEventListener('click', () => {
      const ps = K.state.players;
      if (ps.length < 2) { U.toast('Il faut au moins 2 joueurs'); return; }
      ps.forEach((p, i) => { if (!p.name.trim()) p.name = 'Joueur ' + (i + 1); });
      K.save();
      K.audio.tap();
      if (S().libre) K.libre.open();
      else K.game.start();
    });
  }

  /* ---------------------------------------------------------
     Ecran regles
     --------------------------------------------------------- */
  const RULES = [
    ['🎲', 'Le principe', "Kwa, votre animateur televise prefere, vous emmene dans la Foret Enchantee. On lance le de, on avance, et la case decide de votre sort. En mode Terminus le premier au bout gagne ; en mode Tours, on compte qui est alle le plus loin."],
    ['❓', 'Tu te mets combien ?', "Un theme tombe. Vous choisissez votre niveau de 1 a 10 : c est le nombre de cases gagnees si vous repondez juste. Plus c est haut, plus c est vicieux. Faux = on ne bouge pas, et a partir de 8 on recule meme d une case."],
    ['👥', 'A deux, c est plus court', "Undercover, Anecdote, Le Dilemme et Le 21 demandent du monde : un vote a la majorite, un infiltre a demasquer, ou un tour de table. A deux joueurs ils n ont plus de sens — celui qui commence Le 21 gagne meme a tous les coups — et Kwa ne les met pas sur le chemin. Le plateau se remplit alors de quiz, de cases eclair et d epreuves en solo. A partir de trois joueurs, tout revient."],
    ['🕵️', 'Undercover', "Chacun recoit un mot. Les infiltres en ont un legerement different. Debat, puis vote. L equipe qui gagne avance de 2 cases, l autre recule de 2."],
    ['📖', 'Anecdote', "Chacun ecrit une anecdote vraie. On vote pour la meilleure. Le plus vote avance de 5 cases."],
    ['🎭', 'Verite ou Mensonge', "Le joueur voit un mot en secret. S il tombe sur VERITE il raconte un truc vrai... en essayant de vous faire croire que c est faux. Et inversement. S il vous roule : +3 cases. Sinon : -2."],
    ['🌍', 'In real life ou online', "Kwa demande d abord ou vous jouez. Dans la meme piece, tout le plateau est disponible. Chacun chez soi, les epreuves qui demandent des corps dans une piece disparaissent du chemin : le 21, le mime et le duel. Gardez un appel vocal ouvert, le reste se joue tres bien a distance."],
    ['🍻', 'Le 21', "Jingle, ambiance, et le joueur designe qui prend le 21 : ce joueur recule de 5 cases. Sauf s il se designe lui-meme : la, il avance de 5."],
    ['⚖️', 'Le Dilemme', "A ou B, il faut choisir. La majorite avance de 2 cases, la minorite recule de 2. En cas d egalite, tout le monde reste."],
    ['🏓', 'Duel', "Un Pong en un contre un, les deux joueurs autour du meme ecran : une raquette en haut, une en bas. Le gagnant avance de 3 cases, le perdant recule de 3. Il faut donc etre cote a cote : la case ne tombe pas a distance, ni quand vous n avez qu un seul telephone (sauf si vous activez l ecran partage dans les reglages)."],
    ['🤾', 'Mime en folie', "30 secondes. Les autres miment, le joueur devine. Chaque mime trouve vaut 1 case."],
    ['✊', 'Shifumi', "Le joueur designe un adversaire. Dans la meme piece on joue a la main et on designe le gagnant sur l ecran. A distance, chacun choisit son coup sur son telephone, un decompte tombe et les deux coups se revelent ensemble. Gagnant +2 cases, perdant -2. Trois egalites d affilee et personne ne bouge."],
    ['🎧', 'DJ Mix', "Le joueur choisit son DJ parmi les autres. Le DJ decouvre en secret une annee entre 1990 et 2026, puis fait deviner cette annee en musique : il chante, fredonne, passe un morceau. Interdit de dire l annee, le titre ou l artiste. Trouve a deux ans pres : 4 cases pour le joueur, 1 pour le DJ."],
    ['🪜', 'L Echelle', "Une echelle de comparaison est annoncee — la puissance des personnages de Naruto, le prix d un objet, la dangerosite d un animal. Trois joueurs tires au sort recoivent un numero de 1 a 10 en secret et donnent chacun un exemple qui se situe a ce niveau, sans jamais dire le chiffre. Le joueur de la case doit retrouver les trois numeros : 2 cases par numero exact, et 1 case pour celui qui s est bien fait comprendre. Il faut etre au moins quatre."],
    ['🙈', 'A l aveugle', "Le joueur ferme les yeux. La personne qu il a designee lui fait toucher un objet, gouter ou sentir quelque chose. S il reconnait, il avance de 4 cases — et c est celui qui a prepare le piege qui tranche. Reserve aux parties dans la meme piece."],
    ['🔀', 'Les cases eclair', "Echange, Peage et Roue de Kwa se resolvent en dix secondes, sans mini-jeu. L Echange vous fait troquer votre position avec le joueur de votre choix. Le Peage vous donne 4 cases mais vous oblige a en offrir 2 a quelqu un. La Roue, elle, ne demande aucun talent : entre -3 et +5, et bon courage."],
    ['🎰', 'Les paris', "Quand un joueur monte seul sur scene (quiz, mime, verite, mot raccord), les autres misent sur lui avant qu il commence : il gagne des cases, ou il se plante. Bon pari : +1 case. Mauvais : -1. Plus personne ne regarde passer le train. Reserve au multi-telephones : faire tourner un seul appareil pour recueillir dix mises casserait justement le rythme qu on cherche."],
    ['🌙', 'Les evenements de foret', "A chaque nouvelle manche, la foret change une regle et Kwa l annonce avant que vous jouiez : tout compte double, gagner veut dire reculer, aucun malus ne passe, le leader paie pour les autres, ou c est Kwa qui choisit votre epreuve."],
    ['🤝', 'Le pacte de Kwa', "De temps en temps, avant le de, Kwa vous prend a part et propose un marche : des cases tout de suite contre un cadeau au suivant, un de qui compte double contre deux cases en arriere, votre epreuve sautee contre 4 cases. Refuser ne coute rien. Sauf la face."],
    ['🔤', 'Le Mot Raccord', "Une lettre, 30 secondes, une liste de trucs a completer. Chaque mot valide par le groupe = 1 case, et si vous faites carton plein, 1 case bonus."]
  ];
  M.renderRules = function () {
    U.$('#rulesBody').innerHTML = RULES.map(r =>
      '<div class="rule"><h4><span>' + r[0] + '</span>' + U.esc(r[1]) + '</h4><p>' + U.esc(r[2]) + '</p></div>'
    ).join('');
  };

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  /** le titre : Kwa mene la configuration, ou on rejoint directement */
  function title() {
    U.$('#btnPlay').addEventListener('click', () => {
      K.audio.tap();
      S().libre = false;
      K.setup.run();
    });

    /* Le jeu libre n a besoin ni de plateau ni de reglages : juste des
       joueurs et un telephone qui tourne. On passe donc directement par
       l ecran des joueurs. */
    U.$('#btnLibre').addEventListener('click', () => {
      K.audio.tap();
      S().libre = true;
      S().device = 'solo';
      M.renderPlayers();
      U.go('players');
    });
    U.$('#btnLibreQuit').addEventListener('click', () => { K.audio.tap(); K.libre.quitter(); });
    U.$('#btnJoinQuick').addEventListener('click', () => {
      K.audio.tap();
      /* rejoindre, c est forcement avoir son propre telephone */
      S().device = 'multi';
      K.net.openLobbyScreen();
      U.go('lobby');
      const inp = U.$('#netCode');
      if (inp) { inp.focus(); }
    });
  }

  M.init = function () {
    nav(); settings(); players(); title();
    U.$('#titleHost').innerHTML = K.sprites.kwa(1.5, 'wink');
    if (!K.state.players.length) {
      K.state.players.push(K.newPlayer('', 'rouge'));
      K.state.players.push(K.newPlayer('', 'bleu'));
    }
    K.audio.setEnabled(S().sound);
    syncOptions();
    M.renderPlayers();
  };
  M.syncOptions = syncOptions;

})(window.KWA);
