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

  N.isActive = () => connected && !!code;
  N.isHost = () => connected && meId && meId === hostId;
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
      try { sock = new WebSocket(u); } catch (e) { rej(new Error('ws')); return; }

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
        try { sock.close(); } catch (e) {}
        finish('timeout');
      }, remote() ? 20000 : 7000);

      sock.onopen = () => { connected = true; finish(null); };
      sock.onmessage = e => { try { onMessage(JSON.parse(e.data)); } catch (err) {} };
      sock.onerror = () => finish('ws');
      sock.onclose = () => {
        connected = false;
        finish('ws');
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
     Messages entrants
     --------------------------------------------------------- */
  function onMessage(m) {
    switch (m.t) {

      case 'room':
        clearTimeout(replyT);
        code = m.code; meId = m.you; hostId = m.hostId;
        status = null;
        syncPlayers(m.players);
        renderLobby();
        K.audio.good();
        break;

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
        const fn = pending[m.id];
        if (fn) { delete pending[m.id]; fn(m.value); }
        break;
      }

      case 'state':
        applyState(m.data);
        break;

      case 'kicked':
        started = false; code = null; mirrorReady = false; answering = false;
        U.toast('L hote t a sorti du salon');
        U.go('mode');
        break;

      case 'hostgone':
        started = false; code = null; mirrorReady = false; answering = false;
        U.closeOverlay(); U.clearSpotlightLocal();
        U.toast('L hote a quitte la partie');
        U.go('mode');
        break;

      case 'error':
        clearTimeout(replyT);
        K.audio.bad();
        setStatus('error', m.msg || 'Erreur');
        break;
    }
  }

  /** remplace la liste des joueurs en conservant les positions connues */
  function syncPlayers(list) {
    const old = {};
    K.state.players.forEach(p => { old[p.id] = p; });
    K.state.players = (list || []).map(p => {
      const prev = old[p.id];
      return {
        id: p.id, name: p.name, color: p.color, hex: p.hex, img: p.img,
        pos: prev ? prev.pos : 0,
        stats: prev ? prev.stats : { correct: 0, wrong: 0, gained: 0, lost: 0 }
      };
    });
  }

  /* ---------------------------------------------------------
     Miroir d affichage : l hote emet, tous les autres rejouent
     exactement la meme chose a l ecran.
     --------------------------------------------------------- */
  N.ev = function (name, d) {
    if (!connected || !started || !N.isHost()) return;
    send({ t: 'ev', ev: name, d: d || {} });
  };

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
      else { K.game.waitingAction(player, label); pending.act = finish; }
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
      pending[id] = finish;
      send({ t: 'ask', to: player.id, id, spec });

      K.prompt.waiting(player, player.name + ' repond sur son telephone', () => {
        /* secours : si le telephone du joueur a lache, on repond ici */
        send({ t: 'unask', to: player.id, id });
        K.prompt.render(spec).then(finish);
      });
    });
  };

  /* ---------------------------------------------------------
     Diffusion de l etat (hote -> joueurs)
     --------------------------------------------------------- */
  N.broadcastState = function () {
    if (!N.isHost() || !started) return;
    send({
      t: 'state',
      data: {
        turn: K.state.turn,
        idx: K.state.idx,
        over: K.state.over,
        last: K.board.last(),
        order: K.state.players.map(p => p.id),
        pos: K.state.players.map(p => ({ id: p.id, pos: p.pos }))
      }
    });
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
    started = false; code = null; pending = {};
    mirrorReady = false; answering = false;
    if (sock) { try { sock.close(); } catch (e) {} sock = null; }
    connected = false;
  };

})(window.KWA);
