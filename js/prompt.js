/* =========================================================
   KWA — questions posees a un joueur.
   Le meme "spec" est rendu localement (1 telephone) ou envoye
   au telephone du joueur concerne (mode multi).
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const P = K.prompt = {};

  /* ---------------------------------------------------------
     Rendu d un spec -> promesse de la reponse
     --------------------------------------------------------- */
  P.render = function (spec) {
    switch (spec.kind) {
      case 'list':   return list(spec);
      case 'choice': return choice(spec);
      case 'text':   return text(spec);
      case 'secret': return secret(spec);
      case 'bet':    return bet(spec);
      case 'quiz':   return quiz(spec);
      case 'reveal': return reveal(spec);
      case 'info':   return info(spec);
      case 'mime':   return mime(spec);
      case 'raccord': return raccord(spec);
      case 'counter': return counter(spec);
      default:       return Promise.resolve(null);
    }
  };

  function head(spec, body, foot) {
    return U.ovShell(spec.icon || '❓', spec.title || '', spec.sub || '',
      (spec.intro ? '<p class="hint">' + U.esc(spec.intro) + '</p>' : '') + body, foot || '');
  }

  /* --- liste de joueurs / d options --- */
  function list(spec) {
    return new Promise(res => {
      head(spec, '<div class="plist">' + spec.items.map(it =>
        '<button class="pbtn" data-v="' + U.esc(it.id) + '" style="--pc:' + (it.color || '#7b3fb3') + '">' +
          '<span class="pav" style="--pc:' + (it.color || '#7b3fb3') + '">' + avatarOf(it) + '</span>' +
          '<span style="flex:1;' + (it.small ? 'font-size:14px;font-weight:600;line-height:1.4' : '') + '">' +
            U.esc(it.label) + '</span>' +
          '<span class="tick">✓</span></button>').join('') + '</div>');
      U.on(U.$('#overlay'), 'click', '.pbtn', (e, t) => {
        K.audio.blip();
        U.$$('.pbtn').forEach(b => b.classList.remove('sel'));
        t.classList.add('sel');
        setTimeout(() => res(t.dataset.v), 240);
      });
    });
  }

  function avatarOf(it) {
    if (it.img) return '<img src="' + it.img + '" alt="">';
    const p = it.pid ? K.player(it.pid) : null;
    if (p) return K.sprites.avatar(p, 36);
    return '<span style="font-family:var(--pix);font-size:12px">' + U.esc((it.label || '?').charAt(0).toUpperCase()) + '</span>';
  }

  /* --- A ou B --- */
  function choice(spec) {
    return new Promise(res => {
      head(spec,
        '<div class="dil-grid">' +
          '<button class="dil a" data-v="a"><span class="tagA">CHOIX A</span>' + U.esc(spec.a) + '</button>' +
          '<div class="vs">— OU —</div>' +
          '<button class="dil b" data-v="b"><span class="tagB">CHOIX B</span>' + U.esc(spec.b) + '</button>' +
        '</div>');
      U.on(U.$('#overlay'), 'click', '.dil', (e, t) => {
        K.audio.blip(); U.buzz(20);
        t.style.filter = 'brightness(1.5)';
        setTimeout(() => res(t.dataset.v), 220);
      });
    });
  }

  /* --- saisie de texte --- */
  function text(spec) {
    return new Promise(res => {
      const max = spec.max || 280;
      head(spec,
        '<textarea class="ta" id="pTa" rows="' + (spec.rows || 7) + '" maxlength="' + max + '" placeholder="' +
        U.esc(spec.placeholder || '') + '"></textarea>' +
        '<div class="counter"><span id="pCount">0</span>/' + max + '</div>',
        '<button class="btn btn-xl btn-primary" id="pOk" disabled>' + U.esc(spec.btn || 'Valider') + '</button>');
      const ta = U.$('#pTa');
      ta.addEventListener('input', () => {
        U.$('#pCount').textContent = ta.value.length;
        U.$('#pOk').disabled = ta.value.trim().length < (spec.min || 5);
      });
      U.$('#pOk').addEventListener('click', () => { K.audio.tap(); res(ta.value.trim()); }, { once: true });
      setTimeout(() => ta.focus(), 150);
    });
  }

  /* --- mot secret a reveler --- */
  function secret(spec) {
    return new Promise(res => {
      head(spec,
        '<div class="secret" id="pSec"><small>APPUIE POUR REVELER</small><h2 id="pWord">• • • • •</h2></div>' +
        '<p class="hold-hint" id="pHint">' + U.esc(spec.hint || 'Personne d autre ne doit voir cet ecran.') + '</p>',
        '<button class="btn btn-xl btn-primary" id="pSecOk" disabled>' + U.esc(spec.btn || 'Vu, je continue') + '</button>');
      let shown = false;
      U.$('#pSec').addEventListener('click', () => {
        if (shown) return;
        shown = true;
        K.audio.pop(); U.buzz(40);
        const box = U.$('#pSec');
        if (spec.tone) box.classList.add(spec.tone);
        box.querySelector('small').textContent = spec.label || 'TON MOT';
        U.$('#pWord').textContent = spec.word;
        if (spec.hintAfter) U.$('#pHint').innerHTML = U.esc(spec.hintAfter);
        U.$('#pSecOk').disabled = false;
      });
      U.$('#pSecOk').addEventListener('click', () => { K.audio.tap(); res(true); }, { once: true });
    });
  }

  /* --- echelle 1 a 10 --- */
  const diffColor = n => 'hsl(' + Math.round(140 - (n - 1) * 15.5) + ' 78% 58%)';
  P.diffColor = diffColor;

  function bet(spec) {
    return new Promise(res => {
      let grid = '';
      for (let n = 1; n <= 10; n++) {
        grid += '<button class="bet" data-n="' + n + '" style="background:linear-gradient(180deg,' +
          diffColor(n) + ',hsl(' + Math.round(140 - (n - 1) * 15.5) + ' 78% 44%))">' + n + '</button>';
      }
      head(spec,
        '<div class="bet-theme"><div class="cat">' + U.esc(spec.cat || '') + '</div><h2>' + U.esc(spec.theme) + '</h2></div>' +
        '<p class="bet-q">Tu te mets combien en <b>' + U.esc(spec.theme) + '</b> ?</p>' +
        '<div class="bet-grid">' + grid + '</div>' +
        '<div class="bet-legend"><span>1 · cadeau</span><span>10 · suicidaire</span></div>' +
        '<p class="hint" style="margin-top:14px">Bonne reponse = tu avances du nombre choisi. ' +
        'A partir de 8, une erreur te fait reculer d une case.</p>');
      U.on(U.$('#overlay'), 'click', '.bet', (e, t) => { K.audio.blip(); res(+t.dataset.n); });
    });
  }

  /* --- question a choix multiples : renvoie l index choisi --- */
  function quiz(spec) {
    return new Promise(res => {
      const letters = 'ABCDEF';
      head(spec,
        '<div class="q-head"><span class="q-diff" style="background:' + diffColor(spec.diff || 1) + '">NIVEAU ' +
        (spec.diff || 1) + '</span><span class="chip">' + U.esc(spec.theme || '') + '</span></div>' +
        '<p class="q-text">' + U.esc(spec.text) + '</p>' +
        '<div class="q-choices">' + spec.choices.map((txt, k) =>
          '<button class="choice" data-k="' + k + '"><span class="k">' + letters[k] + '</span>' + U.esc(txt) + '</button>'
        ).join('') + '</div>');
      U.on(U.$('#overlay'), 'click', '.choice', (e, t) => {
        if (t.dataset.done) return;
        U.$$('.choice').forEach(c => { c.dataset.done = '1'; });
        const k = +t.dataset.k;
        const ok = k === spec.good;
        t.classList.add(ok ? 'good' : 'bad');
        if (!ok) {
          const g = U.$$('.choice').find(c => +c.dataset.k === spec.good);
          g && g.classList.add('good');
        }
        ok ? K.audio.good() : K.audio.bad();
        U.buzz(ok ? 30 : [40, 60, 40]);
        setTimeout(() => res(k), 1300);
      });
    });
  }

  /* --- question ouverte : le joueur juge lui-meme --- */
  function reveal(spec) {
    return new Promise(res => {
      head(spec,
        '<div class="q-head"><span class="q-diff" style="background:' + diffColor(spec.diff || 1) + '">NIVEAU ' +
        (spec.diff || 1) + '</span><span class="chip">' + U.esc(spec.theme || '') + '</span></div>' +
        '<p class="q-text">' + U.esc(spec.text) + '</p>' +
        '<p class="hint">Reponds a voix haute, puis decouvre la reponse. C est le groupe qui tranche.</p>',
        '<button class="btn btn-xl btn-gold" id="pShow">Voir la reponse</button>');
      U.$('#pShow').addEventListener('click', () => {
        K.audio.blip();
        U.$('.ov-body').insertAdjacentHTML('beforeend',
          '<div class="open-answer"><small>LA REPONSE</small>' + U.esc(spec.answer) + '</div>');
        U.$('.ov-foot').innerHTML =
          '<button class="btn btn-xl btn-green" id="pOk2">✔ J avais bon</button>' +
          '<button class="btn btn-red" id="pKo2">✘ Rate</button>';
        U.$('#pOk2').addEventListener('click', () => { K.audio.good(); res(true); }, { once: true });
        U.$('#pKo2').addEventListener('click', () => { K.audio.bad(); res(false); }, { once: true });
      }, { once: true });
    });
  }

  /* --- simple information a valider --- */
  function info(spec) {
    return new Promise(res => {
      head(spec,
        (spec.body || []).map(b => '<div class="rule"><h4><span>' + (b.ico || '•') + '</span>' + U.esc(b.t) + '</h4>' +
          '<p>' + U.esc(b.p) + '</p></div>').join(''),
        '<button class="btn btn-xl btn-primary" id="pInfo">' + U.esc(spec.btn || 'Compris') + '</button>');
      U.$('#pInfo').addEventListener('click', () => { K.audio.tap(); res(true); }, { once: true });
    });
  }

  /* --- chrono du mime : renvoie le nombre de mots trouves --- */
  function mime(spec) {
    return new Promise(res => {
      const dur = spec.duration || 30;
      let found = 0, i = 0;
      const words = spec.words || [];

      U.overlay(
        '<div class="ov-head"><span class="ov-ico">🤾</span><h3>MIME EN FOLIE' +
        '<span class="ov-sub">' + U.esc(spec.sub || '') + '</span></h3></div>' +
        '<div class="ov-body" style="display:flex;flex-direction:column;justify-content:center">' +
          '<div class="timer" id="mTimer">' + dur + '</div>' +
          '<div class="timer-bar"><i id="mBar" style="width:100%"></i></div>' +
          '<div class="secret" style="border-style:solid;margin-top:18px">' +
            '<small>A MIMER</small><h2 id="mWord">—</h2>' +
            '<p class="dim" id="mCat" style="margin:10px 0 0;font-size:12px;font-weight:700"></p>' +
          '</div>' +
          '<p class="center" style="margin-top:14px;font-family:var(--pix);font-size:13px;color:var(--green)">' +
            'TROUVES : <span id="mScore">0</span></p>' +
        '</div>' +
        '<div class="ov-foot">' +
          '<button class="btn btn-xl btn-green" id="mOk">✓ TROUVE</button>' +
          '<button class="btn btn-ghost" id="mSkip">Passer</button>' +
        '</div>');

      const next = () => {
        const w = words[i++ % words.length] || { w: '...', c: '' };
        U.$('#mWord').textContent = w.w;
        U.$('#mCat').textContent = w.c ? '(' + w.c + ')' : '';
      };
      next();
      U.$('#mOk').addEventListener('click', () => {
        found++; U.$('#mScore').textContent = found; K.audio.good(); U.buzz(25); next();
      });
      U.$('#mSkip').addEventListener('click', () => { K.audio.bad(); next(); });

      U.countdown(dur, (left, ratio) => {
        const t = U.$('#mTimer'); if (!t) return;
        t.textContent = Math.max(0, left);
        t.classList.toggle('warn', left <= 5);
        if (left <= 5 && left > 0) K.audio.tick();
        U.$('#mBar').style.width = Math.max(0, ratio * 100) + '%';
      }, () => { K.audio.buzzer(); res(found); });
    });
  }

  /* --- chrono du mot raccord : renvoie le nombre de mots valides --- */
  function raccord(spec) {
    return new Promise(res => {
      const dur = spec.duration || 30;
      U.overlay(
        '<div class="ov-head"><span class="ov-ico">🔤</span><h3>LE MOT RACCORD' +
        '<span class="ov-sub">' + U.esc(spec.sub || '') + '</span></h3></div>' +
        '<div class="ov-body">' +
          '<div class="letter-big">' + U.esc(spec.letter) + '</div>' +
          '<div class="timer" id="rTimer" style="font-size:30px">' + dur + '</div>' +
          '<div class="timer-bar"><i id="rBar" style="width:100%"></i></div>' +
          '<div style="margin-top:16px">' + spec.items.map((it, k) =>
            '<div class="mr-item" data-i="' + k + '"><span class="mr-q">' + U.esc(it) + '</span>' +
            '<button class="mr-ok">✓</button></div>').join('') + '</div>' +
          '<p class="hint" style="margin-top:10px">Le groupe valide ou refuse chaque mot. On coche au fur et a mesure.</p>' +
        '</div>' +
        '<div class="ov-foot"><button class="btn btn-ghost" id="rEarly">J ai fini avant la fin</button></div>');

      U.on(U.$('#overlay'), 'click', '.mr-item', (e, t) => {
        t.classList.toggle('done');
        t.classList.contains('done') ? K.audio.good() : K.audio.blip();
      });

      let over = false;
      const finish = () => {
        if (over) return;
        over = true; stop();
        K.audio.buzzer();
        res(U.$$('.mr-item.done').length);
      };
      const stop = U.countdown(dur, (left, ratio) => {
        const t = U.$('#rTimer'); if (!t) return;
        t.textContent = Math.max(0, left);
        t.classList.toggle('warn', left <= 5);
        if (left <= 5 && left > 0) K.audio.tick();
        U.$('#rBar').style.width = Math.max(0, ratio * 100) + '%';
      }, finish);
      U.$('#rEarly').addEventListener('click', finish, { once: true });
    });
  }

  /* --- compteur ajustable --- */
  function counter(spec) {
    return new Promise(res => {
      let n = spec.value || 0;
      head(spec,
        '<div class="center" style="padding:18px 0">' +
          '<div class="big-num" id="cVal" style="font-size:60px">' + n + '</div>' +
          '<p class="hint" id="cSub" style="margin-top:8px">' + U.cases(n) + '</p></div>' +
        '<div style="display:flex;gap:12px;justify-content:center">' +
          '<button class="btn btn-red" id="cMinus" style="flex:1;font-size:24px">−</button>' +
          '<button class="btn btn-green" id="cPlus" style="flex:1;font-size:24px">+</button></div>',
        '<button class="btn btn-xl btn-primary" id="cOk">Valider</button>');
      const upd = () => { U.$('#cVal').textContent = n; U.$('#cSub').textContent = U.cases(n); };
      U.$('#cMinus').addEventListener('click', () => { n = Math.max(spec.min || 0, n - 1); K.audio.blip(); upd(); });
      U.$('#cPlus').addEventListener('click', () => { n = Math.min(spec.max || 20, n + 1); K.audio.blip(); upd(); });
      U.$('#cOk').addEventListener('click', () => { K.audio.tap(); res(n); }, { once: true });
    });
  }

  /* ---------------------------------------------------------
     Ecran d attente cote hote pendant qu un joueur repond
     --------------------------------------------------------- */
  P.waiting = function (player, label, onTakeOver) {
    U.ovShell('⏳', 'En attente', label || (player.name + ' repond sur son telephone'),
      '<div class="pass" style="--pc:' + player.hex + '">' +
        '<div class="pass-tv">' + K.sprites.tvPawn(player, 1.3) + '</div>' +
        '<h3>' + U.esc(player.name.toUpperCase()) + '</h3>' +
        '<p>Regardez-le transpirer, ca fait partie du jeu.</p>' +
      '</div>',
      onTakeOver ? '<button class="btn btn-ghost" id="pTake">Repondre depuis cet ecran</button>' : '');
    if (onTakeOver) U.$('#pTake').addEventListener('click', onTakeOver, { once: true });
  };

  /** le joueur attendu a perdu la connexion : on met le secours en avant */
  P.waitingLost = function () {
    const sub = U.$('#overlay .ov-sub');
    if (sub) sub.textContent = 'Il a perdu la connexion';
    const b = U.$('#pTake');
    if (b) { b.className = 'btn btn-xl btn-primary'; b.textContent = 'Repondre a sa place'; }
  };

  /* ---------------------------------------------------------
     K.ask : pose la question au bon endroit
     --------------------------------------------------------- */
  /** en mode 1 telephone, qui tient l appareil en ce moment */
  let holder = null;
  K.setHolder = id => { holder = id; };

  K.ask = function (player, spec) {
    const net = K.net;
    /* mode multi : le joueur repond sur son telephone, les autres
       voient son nom pendant qu il reflechit */
    if (net && net.isActive() && net.isHost()) {
      net.ev('wait', { id: player.id, label: spec.title || '' });
      const done = v => { net.ev('wait', { id: null }); return v; };
      return (net.isMe(player.id) ? P.render(spec) : net.ask(player, spec)).then(done);
    }
    /* mode 1 telephone : on ne fait tourner l appareil que s il change de main */
    const solo = !net || !net.isActive();
    if (solo && K.state.players.length > 1 && !spec.noPass && holder !== player.id) {
      return U.passPhone(player, spec.passMsg || 'Les autres regardent ailleurs.', 'Je suis ' + player.name)
        .then(() => { holder = player.id; return P.render(spec); });
    }
    if (solo) holder = player.id;
    return P.render(spec);
  };

})(window.KWA);
