/* =========================================================
   KWA — mode multi-telephones
   Un salon a code numerique. L hote fait tourner la
   partie et le plateau ; chaque joueur repond sur son ecran.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const N = K.net = {};

  let sock = null;
  let code = null, meId = null, hostId = null;
  let connected = false, started = false;
  let pending = {};          /* id de question -> resolve */
  let askSeq = 1;
  let mirrorReady = false;   /* le plateau est monte sur cet ecran */
  let answering = false;     /* une question privee est en cours ici */
  let session = null;        /* de quoi retrouver sa place apres une coupure */
  let resuming = false;

  /* On reste "en partie multi" meme le temps d une coupure : sans ca l hote
     se remettrait a faire tourner le telephone entre les joueurs. */
  N.isActive = () => !!code;
  N.isHost = () => !!code && meId && meId === hostId;
  N.isMe = id => id === meId;
  N.code = () => code;
  N.meId = () => meId;

  /* ---------------------------------------------------------
     Connexion
     --------------------------------------------------------- */
  /**
   * Adresse du WebSocket.
   * On garde le dossier de la page : si le jeu est servi sous /kwa/, on se
   * connecte a wss://site/kwa/ — ce qu un reverse proxy sait router.
   * https impose wss, sinon le navigateur refuse la connexion.
   */
  function remote() {
    return ((K.CONFIG && K.CONFIG.server) || '').trim().replace(/\/+$/, '');
  }

  function url() {
    /* serveur de salons heberge ailleurs (Netlify + Render, par exemple) */
    const r = remote();
    if (r) {
      if (location.protocol === 'https:' && r.indexOf('wss://') !== 0) return 'INSECURE';
      return r;
    }
    if (location.protocol === 'file:') return null;
    const base = location.pathname.replace(/[^/]*$/, '');
    return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + base;
  }

  /** meme serveur, en http : sert a le reveiller avant d ouvrir la socket */
  function wakeUrl() {
    const r = remote();
    return r ? r.replace(/^ws/, 'http') + '/index.html' : null;
  }

  /* Une offre gratuite endort le service apres quelques minutes sans
     visite, et le reveil prend jusqu a une minute. Une requete http
     ordinaire patiente pendant ce demarrage la ou une socket, elle, se
     ferait jeter : on reveille d abord, on branche ensuite. */
  function wake(onSlow) {
    const w = wakeUrl();
    if (!w || typeof fetch !== 'function') return Promise.resolve();
    return new Promise(res => {
      const slow = setTimeout(() => { if (onSlow) onSlow(); }, 2500);
      let done = false;
      const fini = () => { if (done) return; done = true; clearTimeout(slow); clearTimeout(abandon); res(); };
      const abandon = setTimeout(fini, 70000);
      fetch(w, { mode: 'no-cors', cache: 'no-store' }).then(fini, fini);
    });
  }

  function connect(onSlow) {
    const u = url();
    if (!u) return Promise.reject(new Error('file'));
    if (u === 'INSECURE') return Promise.reject(new Error('insecure'));
    if (sock && sock.readyState === 1) return Promise.resolve();

    return wake(onSlow).then(() => new Promise((res, rej) => {
      let s;
      try { s = new WebSocket(u); } catch (e) { rej(new Error('ws')); return; }
      sock = s;

      /* sans delai maximum, un mauvais reseau laisse le joueur devant un
         bouton qui ne repond jamais */
      let settled = false;
      const finish = err => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        err ? rej(new Error(err)) : res();
      };
      const timer = setTimeout(() => {
        try { s.close(); } catch (e) {}
        finish('timeout');
      }, remote() ? 20000 : 7000);

      s.onopen = () => { connected = true; finish(null); };
      s.onmessage = e => {
        if (sock !== s) return;
        try { onMessage(JSON.parse(e.data)); } catch (err) {}
      };
      s.onerror = () => finish('ws');
      s.onclose = () => {
        /* une socket neuve a pris le relais : ce fil-la ne parle plus pour nous */
        if (sock !== s) return;
        connected = false;
        finish('ws');
        /* en pleine partie, une coupure n est pas une fin de partie */
        if (session && code && started) { onLost(); return; }
        if (started) { U.toast('Connexion perdue'); return; }
        code = null;
        renderLobby();
      };
    }));
  }

  function send(obj) {
    if (sock && sock.readyState === 1) sock.send(JSON.stringify(obj));
  }

  /* ---------------------------------------------------------
     Garder sa place
     Le siege est garde par le serveur, le jeton prouve qu il est
     a nous. On le range hors de la page pour survivre a un
     rechargement, a un telephone qui se verrouille, a un onglet
     que le systeme a ferme pour recuperer de la memoire.
     --------------------------------------------------------- */
  const SKEY = 'kwa.seat.v1';
  const SESSION_MAX_MS = 30 * 60000;

  function saveSession() {
    try { localStorage.setItem(SKEY, JSON.stringify(session)); } catch (e) { /* mode prive */ }
  }
  function clearSession() {
    session = null;
    clearTimeout(retryT);
    try { localStorage.removeItem(SKEY); } catch (e) {}
  }
  function readSession() {
    try {
      const raw = localStorage.getItem(SKEY);
      const d = raw ? JSON.parse(raw) : null;
      if (!d || !d.code || !d.id || !d.token) return null;
      return (Date.now() - (d.at || 0) < SESSION_MAX_MS) ? d : null;
    } catch (e) { return null; }
  }

  /* ---------------------------------------------------------
     Bandeau de connexion
     --------------------------------------------------------- */
  let bannerT = null;
  function banner(kind, msg, action) {
    const el = U.$('#netBanner');
    if (!el) return;
    clearTimeout(bannerT);
    el.className = 'net-banner ' + kind;
    el.innerHTML =
      (kind === 'wait' ? '<span class="spin"></span>'
                       : '<span class="ico">' + (kind === 'ok' ? '✅' : '⚠️') + '</span>') +
      '<span>' + U.esc(msg) + '</span>' +
      (action ? '<button class="mini-btn" id="nbAct">' + U.esc(action) + '</button>' : '');
    el.hidden = false;
    if (action) {
      U.$('#nbAct').addEventListener('click', () => {
        tries = 0;
        banner('wait', 'On reessaie...');
        tryResume();
      }, { once: true });
    }
    if (kind === 'ok') bannerT = setTimeout(hideBanner, 2400);
  }
  function hideBanner() {
    const el = U.$('#netBanner');
    if (el) { el.hidden = true; el.innerHTML = ''; }
  }

  /* ---------------------------------------------------------
     Se rebrancher
     --------------------------------------------------------- */
  let retryT = null, resumeT = null, tries = 0;

  function onLost() {
    K.audio.bad();
    banner('wait', 'Connexion perdue. On te rebranche...');
    tries = 0;
    scheduleRetry();
  }

  /** on espace les tentatives : inutile de marteler un reseau absent */
  function scheduleRetry() {
    clearTimeout(retryT);
    if (!session) return;
    if (tries > 24) {
      banner('error', 'Impossible de te rebrancher pour le moment.', 'Reessayer');
      return;
    }
    const wait = Math.min(8000, 800 * Math.pow(2, Math.min(tries, 4)));
    tries++;
    retryT = setTimeout(tryResume, wait);
  }

  function tryResume() {
    if (!session) return;
    resuming = true;
    connect().then(() => {
      send({
        t: 'resume', code: session.code, id: session.id, token: session.token,
        /* l hote ne peut reprendre que si sa page tient encore la partie */
        live: !!(K.state.started && !K.state.over)
      });
      clearTimeout(resumeT);
      resumeT = setTimeout(() => { if (resuming) scheduleRetry(); }, 8000);
    }, () => scheduleRetry());
  }

  /** au chargement de la page : une partie nous attend peut-etre encore */
  N.tryResume = function () {
    session = readSession();
    if (!session) return false;
    banner('wait', 'Reprise de la partie en cours...');
    tries = 0;
    tryResume();
    return true;
  };

  /* ---------------------------------------------------------
     Messages entrants
     --------------------------------------------------------- */
  function onMessage(m) {
    switch (m.t) {

      case 'room': {
        clearTimeout(replyT);
        clearTimeout(resumeT);
        const back = !!m.resumed;
        resuming = false;
        tries = 0;
        code = m.code; meId = m.you; hostId = m.hostId;
        session = { code, id: meId, token: m.token, at: Date.now() };
        saveSession();
        status = null;
        syncPlayers(m.players);
        if (!back) { renderLobby(); K.audio.good(); break; }

        /* --- retour apres coupure --- */
        started = !!m.started;
        K.audio.good();
        if (!started) { banner('ok', 'Reconnecte au salon'); renderLobby(); break; }
        if (N.isHost()) {
          banner('ok', 'Reconnecte. Tout le monde est resynchronise.');
          resyncAll();
        } else {
          /* le plateau va nous etre renvoye par l hote : on repart de zero */
          mirrorReady = false;
          answering = false;
          banner('wait', 'Reconnecte. On te remet a la page...');
        }
        break;
      }

      case 'players':
        hostId = m.hostId || hostId;
        syncPlayers(m.players);
        if (!started) renderLobby(); else K.game.hud();
        break;

      case 'start':
        if (!N.isHost()) {
          syncPlayers(m.players);
          Object.assign(K.state.settings, m.settings || {});
          started = true;
          companion('La partie commence !');
        }
        break;

      /* --- l hote me pose une question --- */
      case 'ask':
        answering = true;
        K.prompt.render(m.spec).then(v => {
          answering = false;
          U.closeOverlay();
          send({ t: 'answer', id: m.id, value: v });
          if (!mirrorReady) companion();
        });
        break;

      case 'unask':
        answering = false;
        U.closeOverlay();
        if (!mirrorReady) companion();
        break;

      /* --- ce que tous les ecrans doivent afficher --- */
      case 'ev':
        onEv(m.ev, m.d);
        break;

      /* --- un joueur a repondu (cote hote) --- */
      case 'answer': {
        const q = pending[m.id];
        if (q) { delete pending[m.id]; q.fn(m.value); }
        break;
      }

      case 'state':
        applyState(m.data);
        break;

      /* --- l hote a saute, mais il peut revenir --- */
      case 'hostoff':
        banner('wait', 'L hote a perdu la connexion. On l attend...');
        break;

      case 'hostback':
        banner('ok', 'L hote est de retour !');
        break;

      /* --- cote hote : un joueur est parti / revenu --- */
      case 'gone':
        onPlayerGone(m.id);
        break;

      case 'back':
        resyncTo(m.id);
        break;

      case 'kicked':
        clearSession();
        started = false; code = null; mirrorReady = false; answering = false;
        U.toast('L hote t a sorti du salon');
        U.go('mode');
        break;

      case 'hostgone':
        clearSession();
        hideBanner();
        started = false; code = null; mirrorReady = false; answering = false;
        U.closeOverlay(); U.clearSpotlightLocal();
        U.toast('L hote a quitte la partie');
        U.go('mode');
        break;

      case 'error':
        clearTimeout(replyT);
        clearTimeout(resumeT);
        resuming = false;
        K.audio.bad();
        /* la place n existe plus : insister ne servirait a rien */
        if (m.fatal) {
          clearSession();
          started = false; code = null; mirrorReady = false; answering = false;
          banner('error', m.msg || 'Partie terminee.');
          U.closeOverlay(); U.clearSpotlightLocal();
          U.go('mode');
          break;
        }
        setStatus('error', m.msg || 'Erreur');
        break;
    }
  }

  /** remplace la liste des joueurs en conservant les positions connues */
  function syncPlayers(list) {
    const old = {};
    const rank = {};
    K.state.players.forEach((p, i) => { old[p.id] = p; rank[p.id] = i; });
    const next = (list || []).map(p => {
      /* On met a jour l objet existant au lieu d en fabriquer un neuf : le
         moteur en garde une reference pendant tout un tour de jeu, et le
         remplacer en cours de route ferait avancer un pion fantome. */
      const cur = old[p.id] || {
        id: p.id, pos: 0, stats: { correct: 0, wrong: 0, gained: 0, lost: 0 }
      };
      cur.name = p.name;
      cur.color = p.color;
      cur.hex = p.hex;
      cur.img = p.img;
      cur.off = !!p.off;
      return cur;
    });
    /* Une fois la partie lancee, l ordre du tableau EST l ordre de passage,
       tire au sort par l ouverture. Le serveur, lui, ne connait que l ordre
       d arrivee : le reprendre ferait sauter des tours a tout le monde. */
    if (started) {
      next.sort((a, b) => (rank[a.id] === undefined ? 99 : rank[a.id]) -
                          (rank[b.id] === undefined ? 99 : rank[b.id]));
    }
    K.state.players = next;
  }

  /* ---------------------------------------------------------
     Miroir d affichage : l hote emet, tous les autres rejouent
     exactement la meme chose a l ecran.
     --------------------------------------------------------- */
  /* Ce qu un ecran qui revient doit retrouver : le dernier mot de Kwa, le
     panneau ouvert, le bouton en attente. On garde donc une trace de ce
     qu on diffuse, y compris pendant une coupure ou rien ne part. */
  const echo = { kwa: null, panel: null, act: null, wait: null };

  function remember(name, d) {
    switch (name) {
      case 'kwa':        echo.kwa = d; break;
      case 'kwaHide':    echo.kwa = null; break;
      case 'panel':      echo.panel = d; break;
      case 'panelClose': echo.panel = null; break;
      case 'act':        echo.act = d.to ? d : null; break;
      case 'wait':       echo.wait = d.id ? d : null; break;
      case 'spot':       echo.panel = null; break;
    }
  }

  N.ev = function (name, d) {
    if (!N.isHost()) return;
    d = d || {};
    remember(name, d);
    if (connected && started) send({ t: 'ev', ev: name, d });
  };

  /* ---------------------------------------------------------
     Remettre un ecran a la page
     Le miroir marche par evenements : qui en rate un est perdu.
     On lui rejoue donc l essentiel — le plateau se reconstruit tout
     seul a partir de la liste des cases, le reste tient en cinq messages.
     --------------------------------------------------------- */
  function stateData() {
    return {
      turn: K.state.turn,
      idx: K.state.idx,
      over: K.state.over,
      last: K.board.last(),
      order: K.state.players.map(p => p.id),
      pos: K.state.players.map(p => ({ id: p.id, pos: p.pos }))
    };
  }

  function replay(sendOne) {
    sendOne({ t: 'ev', ev: 'board', d: { types: K.board.typeList(), settings: K.state.settings } });
    sendOne({ t: 'state', data: stateData() });
    if (echo.kwa) sendOne({ t: 'ev', ev: 'kwa', d: echo.kwa });
    if (echo.panel) sendOne({ t: 'ev', ev: 'panel', d: echo.panel });
    if (echo.act) sendOne({ t: 'ev', ev: 'act', d: echo.act });
    if (echo.wait) sendOne({ t: 'ev', ev: 'wait', d: echo.wait });
  }

  /** un seul joueur revient : on ne derange pas les autres */
  function resyncTo(id) {
    const p = K.player(id);
    if (p) p.off = false;
    if (!N.isHost() || !started) return;
    U.toast((p ? p.name : 'Un joueur') + ' est revenu');
    K.game.hud();
    replay(msg => send({ t: 'to', id, m: msg }));
    /* une question restee sans reponse lui est reposee */
    Object.keys(pending).forEach(qid => {
      const q = pending[qid];
      if (q && q.to === id && q.spec) send({ t: 'ask', to: id, id: qid, spec: q.spec });
    });
  }

  /** c est l hote qui revient : tout le monde a rate le meme bout de partie */
  function resyncAll() {
    if (!N.isHost() || !started) return;
    replay(send.bind(null));
    Object.keys(pending).forEach(qid => {
      const q = pending[qid];
      if (q && q.to && q.spec) send({ t: 'ask', to: q.to, id: qid, spec: q.spec });
    });
  }

  /** un joueur a saute : la partie ne doit pas rester bloquee sur lui */
  function onPlayerGone(id) {
    const p = K.player(id);
    if (p) p.off = true;
    if (!N.isHost()) return;
    U.toast((p ? p.name : 'Un joueur') + ' a perdu la connexion');
    K.game.hud();
    /* il devait appuyer sur un bouton : on propose de le faire a sa place */
    const act = pending.act;
    if (act && act.to === id) K.game.waitingAction(p, 'a perdu la connexion', act.fn);
    /* il devait repondre a une question : le bouton de secours existe deja */
    Object.keys(pending).forEach(qid => {
      const q = pending[qid];
      if (q && q.to === id && q.spec) K.prompt.waitingLost();
    });
  }

  function onEv(name, d) {
    if (N.isHost()) return;
    d = d || {};
    switch (name) {

      /* le plateau : reconstruit a l identique a partir de la liste des types */
      case 'board':
        Object.assign(K.state.settings, d.settings || {});
        K.board.build(d.types || []);
        U.closeOverlay();
        U.go('game');
        K.kwa.mount();
        K.board.fireflies(18);
        K.board.render();
        K.pawns.renderAll();
        K.board.focusLocal(0, true);
        K.game.hud();
        mirrorReady = true;
        break;

      /* l animateur */
      case 'kwa':     K.kwa.mirror(d.text, d.mood); break;
      case 'mood':    K.kwa.setMoodLocal(d.m); break;
      case 'kwaHide': K.kwa.hideLocal(); break;

      /* habillage plein ecran */
      case 'spot':    U.spotlightLocal(d.html); break;
      case 'jingle':  U.jingleLocal(d.title, d.sub, d.ms); break;
      case 'drum':    U.drumrollLocal(d.ms, d.sub); break;

      /* panneaux publics : visibles partout, mais seul l hote les ferme */
      case 'panel':
        if (!answering) U.panelMirror(d.ico, d.title, d.sub, d.body);
        break;
      case 'panelClose':
        if (!answering) U.closeOverlay();
        break;

      /* plateau vivant */
      case 'dice':   K.game.diceAnim(d.v); break;
      case 'cam':    K.board.focusLocal(d.i, d.instant); break;
      case 'hit':    K.board.hitLocal(d.i); break;
      case 'fx':     K.board.floatDeltaLocal(d.i, d.text, d.color); break;
      case 'active': K.pawns.setActiveLocal(d.id); break;
      case 'walk':   K.pawns.setWalking(d.id, d.on); break;
      case 'pos':
        (d.pos || []).forEach(x => { const p = K.player(x.id); if (p) p.pos = x.pos; });
        K.pawns.layoutLocal();
        break;

      /* bouton d action : chez le joueur concerne, grise chez les autres */
      case 'act': onAction(d); break;

      /* un joueur repond a une question privee : les autres patientent */
      case 'wait':
        if (!d.id) { if (!answering) K.game.clearAction(); }
        else if (d.id !== meId) K.game.waitingAction(K.player(d.id), 'repond sur son telephone');
        break;
    }
  }

  function onAction(d) {
    if (!d.to) { K.game.clearAction(); return; }
    if (d.to === meId) {
      U.buzz(30);
      K.game.localButton(d.label).then(() => send({ t: 'answer', id: 'act', value: 1 }));
    } else {
      K.game.waitingAction(K.player(d.to), d.label);
    }
  }

  /**
   * Le bouton d action (lancer le de...) s affiche sur le telephone du
   * joueur dont c est le tour ; les autres voient son nom en attente.
   */
  N.actionButton = function (player, label, cls) {
    return new Promise(resolve => {
      N.ev('act', { to: player.id, label });
      const finish = () => {
        delete pending.act;
        N.ev('act', { to: null });
        K.game.clearAction();
        resolve();
      };
      if (N.isMe(player.id)) K.game.localButton(label, cls).then(finish);
      else {
        pending.act = { fn: finish, to: player.id };
        /* deja hors ligne au moment ou c est son tour : bouton de secours */
        if (player.off) K.game.waitingAction(player, 'a perdu la connexion', finish);
        else K.game.waitingAction(player, label);
      }
    });
  };

  /* ---------------------------------------------------------
     Poser une question a un joueur distant
     --------------------------------------------------------- */
  N.ask = function (player, spec) {
    return new Promise(resolve => {
      const id = 'q' + (askSeq++);
      let done = false;
      const finish = v => { if (done) return; done = true; delete pending[id]; resolve(v); };
      pending[id] = { fn: finish, to: player.id, spec };
      send({ t: 'ask', to: player.id, id, spec });

      K.prompt.waiting(player, player.name + ' repond sur son telephone', () => {
        /* secours : si le telephone du joueur a lache, on repond ici. La
           question cesse d etre en attente, sinon elle lui serait reposee
           au moment ou il se rebranche. */
        if (pending[id]) pending[id].spec = null;
        send({ t: 'unask', to: player.id, id });
        K.prompt.render(spec).then(finish);
      });
      if (player.off) K.prompt.waitingLost();
    });
  };

  /* ---------------------------------------------------------
     Diffusion de l etat (hote -> joueurs)
     --------------------------------------------------------- */
  N.broadcastState = function () {
    if (!N.isHost() || !started) return;
    /* partie finie : plus rien a reprendre, on oublie la place gardee */
    if (K.state.over) clearSession();
    send({ t: 'state', data: stateData() });
  };

  function applyState(d) {
    if (!d) return;
    K.state.turn = d.turn;
    K.state.idx = d.idx;
    K.state.over = d.over;
    /* l hote tire l ordre de passage au sort : on s aligne dessus */
    if (d.order && d.order.length) {
      K.state.players.sort((a, b) => d.order.indexOf(a.id) - d.order.indexOf(b.id));
    }
    (d.pos || []).forEach(x => { const p = K.player(x.id); if (p) p.pos = x.pos; });
    K.state.netLast = d.last;
    if (d.over) clearSession();
    if (mirrorReady) { K.game.hud(); K.pawns.layoutLocal(); }
    else companion();
  }

  N.markStarted = () => { started = true; };

  /* ---------------------------------------------------------
     Ecran compagnon (joueurs non hotes pendant la partie)
     --------------------------------------------------------- */
  function companion(msg) {
    if (U.ovIsOpen()) return;
    const me = K.player(meId);
    const cur = K.state.players[K.state.idx];
    const last = K.state.netLast || K.state.settings.boardLength - 1;
    U.go('lobby');
    U.$('#screen-lobby .topbar h2').textContent = 'Partie en cours';
    U.$('#lobbyBody').innerHTML =
      (msg ? '<p class="hint center">' + U.esc(msg) + '</p>' : '') +
      '<div class="lobby-code" style="border-color:' + (me ? me.hex : '#ffcf4d') + '">' +
        '<small>C EST LE TOUR DE</small>' +
        '<div class="code" style="font-size:20px;letter-spacing:1px;color:' + (cur ? cur.hex : '#fff') + '">' +
          U.esc(cur ? cur.name : '...') + '</div>' +
        '<div class="lobby-url">Tour ' + K.state.turn + ' · regarde le grand ecran</div>' +
      '</div>' +
      (me ? '<div class="rank-row" style="border-left-color:' + me.hex + ';--pc:' + me.hex + '">' +
        '<span class="rank-pos">TOI</span>' +
        '<span class="rank-av">' + K.sprites.avatar(me, 38) + '</span>' +
        '<span class="rank-info"><b>' + U.esc(me.name) + '</b><small>case ' + me.pos + ' / ' + last + '</small>' +
        '<span class="rank-bar"><i style="width:' + Math.round(me.pos / Math.max(1, last) * 100) + '%"></i></span>' +
        '</span></div>' : '') +
      '<div class="sep"></div>' +
      K.ranking().map((p, i) =>
        '<div class="rank-row" style="border-left-color:' + p.hex + ';--pc:' + p.hex + '">' +
          '<span class="rank-pos">' + (i + 1) + '</span>' +
          '<span class="rank-av">' + K.sprites.avatar(p, 38) + '</span>' +
          '<span class="rank-info"><b>' + U.esc(p.name) + '</b><small>case ' + p.pos + '</small></span></div>').join('') +
      '<p class="hint center" style="margin-top:16px">Ton telephone s allumera tout seul quand Kwa aura besoin de toi.</p>';
  }
  N.companion = companion;

  /* ---------------------------------------------------------
     Ecran de salon
     --------------------------------------------------------- */
  let draft = null;     /* le joueur local avant connexion */
  let lastCode = '';    /* ce qui est tape dans le champ code */

  function myDraft() {
    if (!draft) {
      const saved = K.state.players[0];
      draft = {
        /* jamais vide : un champ vide bloquait la creation sans rien dire */
        name: (saved && saved.name.trim()) || 'Joueur',
        color: saved ? saved.color : 'rouge',
        hex: saved ? saved.hex : '#ff4d5e',
        img: saved ? saved.img : null
      };
    }
    return draft;
  }

  /** message d etat sous la carte du joueur */
  function statusBlock() {
    if (!status) return '';
    return '<div class="net-status ' + status.kind + '">' +
      (status.kind === 'wait' ? '<span class="spin"></span>' : '<span class="ico">⚠️</span>') +
      '<span>' + U.esc(status.msg) + '</span></div>';
  }

  N.openLobbyScreen = function () {
    myDraft();
    renderLobby();
  };

  function cardEditor() {
    const d = myDraft();
    const sw = K.COLORS.map(c =>
      '<button class="sw' + (c.id === d.color ? ' on' : '') + '" style="background:' + c.hex +
      '" data-col="' + c.id + '"></button>').join('');
    return '<div class="pcard" style="border-left-color:' + d.hex + '">' +
      '<label class="pcard-tv" style="border-color:' + d.hex + '">' +
        (d.img ? '<img src="' + d.img + '" alt="">' : '<span class="tv-ph">📺</span>') +
        '<input type="file" accept="image/*" hidden id="netImg">' +
      '</label>' +
      '<div class="pcard-main">' +
        '<input type="text" maxlength="14" placeholder="Ton blase" value="' + U.esc(d.name) + '" id="netName">' +
        '<div class="swatches">' + sw + '</div>' +
      '</div>' +
      '<div class="pcard-side"><button class="mini-btn" id="netShot">📷</button></div>' +
    '</div>';
  }

  function renderLobby() {
    const body = U.$('#lobbyBody');
    if (!body) return;
    U.$('#screen-lobby .topbar h2').textContent = 'Salon';

    /* avec un serveur de salons distant, meme une page ouverte en local marche */
    if (location.protocol === 'file:' && !remote()) {
      body.innerHTML =
        '<div class="net-status error"><span class="ico">⚠️</span>' +
        '<span>Cette page a ete ouverte directement depuis le disque (fichier index.html). ' +
        'Le mode multi-telephones ne peut pas fonctionner comme ca.</span></div>' +
        '<div class="rule"><h4><span>1️⃣</span>Lance le serveur</h4>' +
        '<p>Dans un terminal, place-toi dans le dossier du jeu et tape la commande ci-dessous.</p></div>' +
        '<div class="secret" style="border-style:solid;padding:18px 12px">' +
        '<small>COMMANDE</small><h2 style="font-size:13px">node server/server.js</h2></div>' +
        '<div class="rule"><h4><span>2️⃣</span>Ouvre l adresse affichee</h4>' +
        '<p>Le terminal donne une adresse du type <b>http://192.168.x.x:8080</b>. ' +
        'C est celle-la qu il faut ouvrir sur chaque telephone, pas le fichier. ' +
        'Tout le monde doit etre sur le meme Wi-Fi.</p></div>' +
        '<div class="rule"><h4><span>🛡️</span>Si les autres telephones ne chargent rien</h4>' +
        '<p>Windows demande souvent d autoriser Node sur le reseau prive au premier lancement. ' +
        'Si tu as refuse, autorise-le dans le pare-feu.</p></div>' +
        '<p class="hint">Le mode 1 telephone, lui, marche tres bien en ouvrant le fichier.</p>' +
        '<button class="btn btn-xl btn-primary w-full" data-go="mode">Revenir aux reglages</button>';
      return;
    }

    /* --- pas encore dans un salon --- */
    if (!code) {
      const busy = status && status.kind === 'wait';
      body.innerHTML =
        '<p class="hint">Un joueur cree le salon, les autres le rejoignent avec le code affiche sur son ecran.</p>' +
        cardEditor() +
        statusBlock() +
        '<div class="sep"></div>' +
        '<button class="btn btn-xl btn-primary w-full" id="netCreate"' + (busy ? ' disabled' : '') + '>' +
          (busy ? 'Connexion...' : 'Creer un salon') + '</button>' +
        '<div class="sep"></div>' +
        '<label class="hint" for="netCode">Ou rejoindre un salon existant :</label>' +
        '<input class="code-input" id="netCode" inputmode="numeric" maxlength="8" placeholder="000" value="' +
          U.esc(lastCode) + '">' +
        '<button class="btn btn-xl btn-cyan w-full" id="netJoin" style="margin-top:12px"' + (busy ? ' disabled' : '') + '>' +
          'Rejoindre</button>';
      wireEditor();
      const ci = U.$('#netCode');
      ci.addEventListener('input', () => { lastCode = ci.value.replace(/\D/g, '').slice(0, 8); ci.value = lastCode; });
      U.$('#netCreate').addEventListener('click', () => go('create'));
      U.$('#netJoin').addEventListener('click', () => go('join'));
      return;
    }

    /* --- dans le salon --- */
    const isHost = N.isHost();
    const ps = K.state.players;
    body.innerHTML =
      '<div class="lobby-code"><small>Code du salon</small><div class="code">' + code + '</div>' +
      '<div class="lobby-url">' + U.esc(location.host) + '</div></div>' +
      '<p class="hint">' + (isHost
        ? 'Tu es l hote : le plateau s affiche sur ton ecran. Les autres repondent sur le leur.'
        : 'En attente que l hote lance la partie.') + '</p>' +
      '<div class="lobby-players">' + ps.map(p =>
        '<div class="lobby-p" style="border-left-color:' + p.hex + '">' +
          '<span class="rank-av" style="--pc:' + p.hex + '">' + K.sprites.avatar(p, 34) + '</span>' +
          '<b>' + U.esc(p.name) + (p.id === meId ? ' <span class="chip">toi</span>' : '') + '</b>' +
          (p.id === hostId ? '<span class="chip">hote</span>' : '') +
          (p.off ? '<span class="chip off">hors ligne</span>' : '') +
          (isHost && p.id !== meId ? '<button class="mini-btn danger" data-kick="' + p.id + '">✕</button>' : '') +
        '</div>').join('') + '</div>' +
      cardEditor() +
      (isHost
        ? '<button class="btn btn-xl btn-primary w-full" id="netStart"' + (ps.length < 2 ? ' disabled' : '') + '>' +
          (ps.length < 2 ? 'Il manque des joueurs...' : 'LANCER LA PARTIE ▶') + '</button>'
        : '<div class="center dim" style="padding:18px 0;font-family:var(--pix);font-size:10px">EN ATTENTE DE L HOTE...</div>');

    wireEditor();
    U.on(body, 'click', '[data-kick]', (e, t) => send({ t: 'kick', id: t.dataset.kick }));
    const st = U.$('#netStart');
    if (st) st.addEventListener('click', () => {
      started = true;
      send({ t: 'start', settings: K.state.settings });
      K.game.start();
    });
  }

  function wireEditor() {
    const d = myDraft();
    const name = U.$('#netName');
    if (name) name.addEventListener('input', () => { d.name = name.value; pushMe(); });
    U.$$('#lobbyBody .sw').forEach(b => b.addEventListener('click', () => {
      const c = K.COLORS.find(x => x.id === b.dataset.col);
      d.color = c.id; d.hex = c.hex;
      K.audio.blip(); renderLobby(); pushMe();
    }));
    const shot = U.$('#netShot');
    if (shot) shot.addEventListener('click', () => U.$('#netImg').click());
    const img = U.$('#netImg');
    if (img) img.addEventListener('change', async e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try { d.img = await U.readImage(f, 160); K.audio.pop(); renderLobby(); pushMe(); }
      catch (err) { U.toast('Image illisible'); }
    });
  }

  let pushT = null;
  function pushMe() {
    if (!code) return;
    clearTimeout(pushT);
    pushT = setTimeout(() => send({ t: 'me', p: payload() }), 350);
  }

  function payload() {
    const d = myDraft();
    return { name: d.name.trim() || 'Joueur', color: d.color, hex: d.hex, img: d.img };
  }

  /* --- etat affiche sous les boutons du salon --- */
  let status = null, replyT = null;
  function setStatus(kind, msg) {
    status = kind ? { kind, msg } : null;
    renderLobby();
  }

  /** page publique en https sans serveur de salons renseigne : cas typique
      d un jeu mis sur un hebergement statique sans avoir rempli config.js */
  function siteStatique() {
    return !remote() && location.protocol === 'https:' &&
      !/^(localhost$|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);
  }

  function panne(kind) {
    if (kind === 'file') {
      return 'Cette page a ete ouverte directement depuis le disque. Le mode multi ' +
             'demande de passer par l adresse http affichee par le serveur.';
    }
    if (kind === 'insecure') {
      return 'Le site est en https mais l adresse du serveur de salons commence par ws:// ' +
             'dans js/config.js. Un site securise exige wss://.';
    }
    if (siteStatique()) {
      return 'Aucun serveur de salons n est configure. Ce site heberge le jeu mais pas ' +
             'le multi-telephones : renseigne l adresse du serveur (wss://...) dans js/config.js.';
    }
    if (remote()) {
      return kind === 'timeout'
        ? 'Le serveur de salons ne repond pas. Sur une offre gratuite il se met en veille : ' +
          'laisse-lui une minute pour se reveiller et reessaie.'
        : 'Impossible de joindre le serveur de salons (' + remote() + '). Verifie l adresse ' +
          'dans js/config.js et que le service tourne bien.';
    }
    return kind === 'timeout'
      ? 'Le serveur ne repond pas. Verifie qu il tourne encore, que tu es bien sur le meme ' +
        'Wi-Fi, et que le pare-feu Windows autorise Node sur le reseau prive.'
      : 'Connexion refusee. Le serveur s est peut-etre arrete : relance node server/server.js.';
  }

  async function go(action) {
    K.audio.tap();
    const d = myDraft();
    /* un nom vide ne doit jamais bloquer : on en met un par defaut */
    if (!d.name.trim()) {
      d.name = action === 'create' ? 'Hote' : 'Joueur';
      const inp = U.$('#netName');
      if (inp) inp.value = d.name;
    }
    let joinCode = null;
    if (action === 'join') {
      joinCode = (U.$('#netCode').value || '').trim();
      if (!/^\d{3,8}$/.test(joinCode)) {
        setStatus('error', 'Recopie le code affiche sur l ecran de l hote, chiffres uniquement.');
        return;
      }
    }
    setStatus('wait', action === 'create' ? 'Creation du salon...' : 'Connexion au salon ' + joinCode + '...');
    try {
      await connect(() => setStatus('wait',
        'Le serveur de salons se reveille : ca peut prendre une minute la premiere fois.'));
      send(action === 'create'
        ? { t: 'create', p: payload() }
        : { t: 'join', code: joinCode, p: payload() });
      /* le serveur doit repondre : sans reponse on previent au lieu d attendre */
      clearTimeout(replyT);
      replyT = setTimeout(() => {
        if (!code) setStatus('error', 'Le serveur a accepte la connexion mais ne repond pas.');
      }, 6000);
    } catch (e) {
      K.audio.bad();
      setStatus('error', panne(e.message));
    }
  }

  N.reset = function () {
    /* quitter de son plein gre, ce n est pas une coupure : on rend la place */
    if (code) send({ t: 'quit' });
    clearSession();
    hideBanner();
    started = false; code = null; pending = {};
    mirrorReady = false; answering = false;
    echo.kwa = echo.panel = echo.act = echo.wait = null;
    if (sock) { const dead = sock; sock = null; try { dead.close(); } catch (e) {} }
    connected = false;
  };

})(window.KWA);
