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
    quiz:       { icon: '❓', label: 'Tu te mets combien ?', c1: '#7b3fb3', c2: '#4a1f78' },
    undercover: { icon: '🕵️', label: 'Undercover',       c1: '#2f4f7a', c2: '#1b2f4d' },
    anecdote:   { icon: '📖', label: 'Anecdote',          c1: '#a86a2e', c2: '#6b3f16' },
    verite:     { icon: '🎭', label: 'Verite ou Mensonge', c1: '#2f7a5a', c2: '#17402f' },
    vingtetun:  { icon: '🍻', label: 'Le 21',             c1: '#b83a5e', c2: '#6e1e37' },
    dilemme:    { icon: '⚖️', label: 'Le Dilemme',        c1: '#3a6fb8', c2: '#1f3f6e' },
    duel:       { icon: '🏓', label: 'Duel',              c1: '#b8452e', c2: '#6e2418' },
    mime:       { icon: '🤾', label: 'Mime en folie',     c1: '#8a4fb8', c2: '#50276e' },
    motraccord: { icon: '🔤', label: 'Le Mot Raccord',    c1: '#2e9ab8', c2: '#175a6e' },
    finish:     { icon: '🏁', label: 'Terminus',          c1: '#d4a017', c2: '#8a6400' }
  };

  K.state = {
    screen: 'title',
    settings: {
      device: 'solo',        // 'solo' | 'multi'
      mode: 'terminus',      // 'terminus' | 'tours'
      maxTurns: 5,
      boardLength: 40,
      duelSolo: false,
      spicy: true,
      sound: true
    },
    players: [],             // {id,name,color,hex,img,pos,stats}
    board: [],               // [{i,type,x,y}]
    turn: 1,
    idx: 0,                  // index du joueur courant
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
    /** le duel Pong demande soit le multi-telephones, soit l option ecran partage */
    duelAllowed() {
      const s = K.state.settings;
      return s.device === 'multi' || s.duelSolo;
    },
    isTerminus() { return K.state.settings.mode === 'terminus'; },
    lastIndex() { return K.state.settings.boardLength - 1; }
  };

})(window.KWA);
