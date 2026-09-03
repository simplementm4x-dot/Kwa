/* =========================================================
   KWA — etat global de la partie
   ========================================================= */
(function (K) {
  'use strict';

  K.COLORS = [
    { id: 'rouge',  hex: '#ff4d5e', name: 'Rouge'   },
    { id: 'bleu',   hex: '#3d8bff', name: 'Bleu'    },
    { id: 'vert',   hex: '#4ade6f', name: 'Vert'    },
    { id: 'jaune',  hex: '#ffd23d', name: 'Jaune'   },
    { id: 'violet', hex: '#a865ff', name: 'Violet'  },
    { id: 'orange', hex: '#ff8c2e', name: 'Orange'  },
    { id: 'rose',   hex: '#ff6fd8', name: 'Rose'    },
    { id: 'cyan',   hex: '#2ee6d6', name: 'Cyan'    }
  ];

  K.TILE_TYPES = {
    start:      { icon: '🏠', label: 'Depart',           c1: '#5b4b8a', c2: '#3b2f63' },
    /* pari: true = un seul joueur est sur scene, les autres peuvent miser */
    /* img : la case est dessinee entierement dans la planche, cadre et
       icone compris. Les autres se contentent du cadre de carton, du
       papier a leur couleur et de leur emoji. */
    quiz:       { icon: '❓', label: 'Tu te mets combien ?', c1: '#7b3fb3', c2: '#4a1f78', pari: true, img: 'case-quiz.png' },
    /* min: nombre de joueurs en dessous duquel l epreuve n a plus de sens.
       A deux, un vote a la majorite n existe pas et un infiltre se devine
       tout seul : ces cases ne doivent pas tomber sur le chemin. */
    undercover: { icon: '🕵️', label: 'Undercover',       c1: '#2f4f7a', c2: '#1b2f4d', min: 3 },
    anecdote:   { icon: '📖', label: 'Anecdote',          c1: '#a86a2e', c2: '#6b3f16', min: 3 },
    verite:     { icon: '🎭', label: 'Verite ou Mensonge', c1: '#2f7a5a', c2: '#17402f', pari: true, img: 'case-verite.png' },
    /* piece: true = il faut etre dans la meme piece (ou devant le meme
       ecran). Ces epreuves sautent quand la partie se joue a distance. */
    /* le 21 se compte en tournant autour d une table : a deux, celui qui
       commence gagne a tous les coups, il n y a plus de jeu */
    vingtetun:  { icon: '🍻', label: 'Le 21',             c1: '#b83a5e', c2: '#6e1e37', piece: true, min: 3 },
    dilemme:    { icon: '⚖️', label: 'Le Dilemme',        c1: '#3a6fb8', c2: '#1f3f6e', min: 3 },
    duel:       { icon: '🏓', label: 'Duel',              c1: '#b8452e', c2: '#6e2418', piece: true, img: 'case-duel.png' },
    mime:       { icon: '🤾', label: 'Mime en folie',     c1: '#8a4fb8', c2: '#50276e', piece: true, pari: true },
    motraccord: { icon: '🔤', label: 'Le Mot Raccord',    c1: '#2e9ab8', c2: '#175a6e', pari: true },
    /* --- les cases eclair : elles se resolvent en dix secondes --- */
    echange:    { icon: '🔀', label: 'Echange',            c1: '#2e8f8a', c2: '#154c49', eclair: true, img: 'case-echange.png' },
    peage:      { icon: '🪙', label: 'Le Peage',           c1: '#8a7a2e', c2: '#4c4215', eclair: true, img: 'case-peage.png' },
    roue:       { icon: '🎡', label: 'La Roue de Kwa',     c1: '#7a3ea8', c2: '#42196b', eclair: true, img: 'case-roue.png' },
    finish:     { icon: '🏁', label: 'Terminus',          c1: '#d4a017', c2: '#8a6400' }
  };

  K.state = {
    screen: 'title',
    settings: {
      venue: 'irl',          // 'irl' = meme piece | 'online' = chacun chez soi
      device: 'solo',        // 'solo' | 'multi'
      mode: 'terminus',      // 'terminus' | 'tours'
      maxTurns: 5,
      boardLength: 40,
      duelSolo: false,
      spicy: true,
      evenements: true,      // la foret change une regle a chaque manche
      paris: true,           // les autres misent sur celui qui est sur scene
      pactes: true,          // Kwa propose parfois un marche avant le de
      sound: true
    },
    players: [],             // {id,name,color,hex,img,pos,stats}
    board: [],               // [{i,type,x,y}]
    turn: 1,
    idx: 0,                  // index du joueur courant
    event: null,             // la regle de foret en cours, ou null
    started: false,
    over: false,
    net: null                // etat reseau (mode multi)
  };

  let nextId = 1;
  K.newPlayer = function (name, colorId) {
    const used = K.state.players.map(p => p.color);
    const col = K.COLORS.find(c => c.id === colorId) ||
                K.COLORS.find(c => used.indexOf(c.id) === -1) || K.COLORS[0];
    return {
      id: 'p' + (nextId++),
      name: name || '',
      color: col.id,
      hex: col.hex,
      img: null,
      pos: 0,
      stats: { correct: 0, wrong: 0, gained: 0, lost: 0 }
    };
  };

  K.player = id => K.state.players.find(p => p.id === id);
  K.current = () => K.state.players[K.state.idx];

  /** classement : le plus loin devant, egalite = ordre de tour */
  K.ranking = function () {
    return K.state.players.slice().sort((a, b) => b.pos - a.pos);
  };

  /* --- persistance des reglages + joueurs (sans images pour rester leger) --- */
  const KEY = 'kwa.save.v1';
  K.save = function () {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        settings: K.state.settings,
        players: K.state.players.map(p => ({ name: p.name, color: p.color, img: p.img }))
      }));
    } catch (e) { /* quota : tant pis */ }
  };
  K.load = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      if (d.settings) Object.assign(K.state.settings, d.settings);
      if (d.players && d.players.length) {
        K.state.players = d.players.map(p => {
          const np = K.newPlayer(p.name, p.color);
          np.img = p.img || null;
          return np;
        });
      }
      return true;
    } catch (e) { return false; }
  };

  /* --- regles derivees des reglages --- */
  K.rules = {
    /** chacun chez soi : les epreuves physiques n ont plus de sens */
    isOnline() { return K.state.settings.venue === 'online'; },

    /**
     * Le duel Pong se joue a deux sur un seul ecran, l un en haut,
     * l autre en bas : il faut donc etre cote a cote, et pas seul.
     */
    duelAllowed() {
      const s = K.state.settings;
      if (s.venue === 'online') return false;
      return s.device === 'multi' || s.duelSolo;
    },

    /** une case peut-elle tomber avec les reglages en cours ? */
    tileAllowed(type) {
      if (type === 'duel') return K.rules.duelAllowed();
      const info = K.TILE_TYPES[type] || {};
      if (info.piece && K.rules.isOnline()) return false;
      /* la table est trop petite pour cette epreuve. Quand aucun joueur
         n est encore inscrit (apercu du plateau, tests), on ne filtre pas. */
      const n = K.state.players.length;
      if (n && info.min && n < info.min) return false;
      return true;
    },
    isTerminus() { return K.state.settings.mode === 'terminus'; },
    lastIndex() { return K.state.settings.boardLength - 1; }
  };

})(window.KWA);
