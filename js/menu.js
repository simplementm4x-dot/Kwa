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
      K.game.start();
    });
  }

  /* ---------------------------------------------------------
     Ecran regles
     --------------------------------------------------------- */
  const RULES = [
    ['🎲', 'Le principe', "Kwa, votre animateur televise prefere, vous emmene dans la Foret Enchantee. On lance le de, on avance, et la case decide de votre sort. En mode Terminus le premier au bout gagne ; en mode Tours, on compte qui est alle le plus loin."],
    ['❓', 'Tu te mets combien ?', "Un theme tombe. Vous choisissez votre niveau de 1 a 10 : c est le nombre de cases gagnees si vous repondez juste. Plus c est haut, plus c est vicieux. Faux = on ne bouge pas, et a partir de 8 on recule meme d une case."],
    ['🕵️', 'Undercover', "Chacun recoit un mot. Les infiltres en ont un legerement different. Debat, puis vote. L equipe qui gagne avance de 2 cases, l autre recule de 2."],
    ['📖', 'Anecdote', "Chacun ecrit une anecdote vraie. On vote pour la meilleure. Le plus vote avance de 5 cases."],
    ['🎭', 'Verite ou Mensonge', "Le joueur voit un mot en secret. S il tombe sur VERITE il raconte un truc vrai... en essayant de vous faire croire que c est faux. Et inversement. S il vous roule : +3 cases. Sinon : -2."],
    ['🍻', 'Le 21', "Jingle, ambiance, et le joueur designe qui prend le 21 : ce joueur recule de 5 cases. Sauf s il se designe lui-meme : la, il avance de 5."],
    ['⚖️', 'Le Dilemme', "A ou B, il faut choisir. La majorite avance de 2 cases, la minorite recule de 2. En cas d egalite, tout le monde reste."],
    ['🏓', 'Duel', "Un Pong en un contre un. Le gagnant avance de 3 cases, le perdant recule de 3. Reserve au mode multi-telephones (ou a l ecran partage si vous l activez)."],
    ['🤾', 'Mime en folie', "30 secondes. Les autres miment, le joueur devine. Chaque mime trouve vaut 1 case."],
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
  M.init = function () {
    nav(); settings(); players();
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
