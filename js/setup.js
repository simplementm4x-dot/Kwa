/* =========================================================
   KWA — la configuration, menee par l animateur

   Regler une partie, c est deja jouer : Kwa pose les
   questions, les reponses arrivent une par une, et le choix
   du lieu (meme piece ou chacun chez soi) decide ensuite des
   epreuves qui tombent sur le plateau.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const S = K.setup = {};
  const St = () => K.state.settings;

  let stage, botEl, txtEl, choiceEl, typing = null;

  function mount() {
    stage = U.$('#setupStage');
    botEl = U.$('#setupBot');
    txtEl = U.$('#setupText');
    choiceEl = U.$('#setupChoices');
    choiceEl.innerHTML = '';
    txtEl.textContent = '';
  }

  function mood(m) {
    if (botEl) botEl.innerHTML = K.sprites.kwa(1.25, m || 'happy');
  }

  /* ---------------------------------------------------------
     Kwa parle
     Une replique en interrompt une autre : sans ca, deux
     machines a ecrire melangent leurs lettres dans la bulle.
     --------------------------------------------------------- */
  function say(text, hold) {
    if (typing) typing.stop();
    return new Promise(res => {
      let i = 0, dead = false, handle;
      txtEl.textContent = '';
      const finish = () => {
        if (dead) return;
        dead = true;
        if (typing === handle) typing = null;
        setTimeout(res, hold === undefined ? 260 : hold);
      };
      handle = { stop() { dead = true; if (typing === handle) typing = null; } };
      typing = handle;
      const step = () => {
        if (dead) return;
        if (i >= text.length) { finish(); return; }
        txtEl.textContent += text[i++];
        if (i % 3 === 0) K.audio.type();
        setTimeout(step, 20);
      };
      step();
    });
  }

  /* ---------------------------------------------------------
     Les cartes de reponse
     --------------------------------------------------------- */
  function cardHtml(c) {
    return '<button class="setup-card ' + (c.cls || '') + '" data-v="' + c.val + '">' +
      '<span class="sc-ico">' + c.ico + '</span>' +
      '<b>' + U.esc(c.title) + '</b>' +
      (c.sub ? '<small>' + U.esc(c.sub) + '</small>' : '') +
      '</button>';
  }

  /** attend qu une carte deja affichee soit choisie */
  function pick() {
    return new Promise(res => {
      const onClick = e => {
        const b = e.target.closest('.setup-card');
        if (!b || !choiceEl.contains(b)) return;
        choiceEl.removeEventListener('click', onClick);
        K.audio.tap();
        U.buzz(20);
        /* on eteint les autres pour que le choix se voie */
        U.$$('#setupChoices .setup-card').forEach(x => {
          x.classList.toggle('chosen', x === b);
          x.classList.toggle('faded', x !== b);
          x.disabled = true;
        });
        res(b.dataset.v);
      };
      choiceEl.addEventListener('click', onClick);
    });
  }

  /* On se met a l ecoute AVANT d afficher quoi que ce soit : sinon un
     joueur qui tape des l apparition de la carte tape dans le vide. */
  /** cartes presentees d un coup */
  function choose(cards) {
    const choix = pick();
    choiceEl.innerHTML = cards.map(cardHtml).join('');
    K.audio.pop();
    return choix;
  }

  /**
   * Cartes amenees une par une, avec une replique entre chaque.
   * C est ce qui donne le "tu joues... IN REAL LIFE... ou... ONLINE".
   */
  async function reveal(steps) {
    choiceEl.innerHTML = '';
    const choix = pick();
    for (const s of steps) {
      if (s.line) await say(s.line, 120);
      choiceEl.insertAdjacentHTML('beforeend', cardHtml(s.card));
      if (s.sound) s.sound();
      else K.audio.pop();
      await U.sleep(s.wait === undefined ? 460 : s.wait);
    }
    return choix;
  }

  /* ---------------------------------------------------------
     Choisir un nombre
     --------------------------------------------------------- */
  function number(presets, min, max, cur, unite) {
    return new Promise(res => {
      let v = U.clamp(cur, min, max);
      choiceEl.innerHTML =
        '<div class="num-pick">' +
          '<div class="num-big"><b id="numVal">' + v + '</b><small>' + U.esc(unite) + '</small></div>' +
          '<div class="num-presets">' +
            presets.map(n => '<button class="num-chip' + (n === v ? ' on' : '') + '" data-n="' + n + '">' + n + '</button>').join('') +
          '</div>' +
          '<input type="range" class="num-range" id="numRange" min="' + min + '" max="' + max + '" value="' + v + '">' +
          '<button class="btn btn-xl btn-primary w-full" id="numOk">C\'EST PARTI ▶</button>' +
        '</div>';

      const val = U.$('#numVal'), range = U.$('#numRange');
      const show = () => {
        val.textContent = v;
        range.value = v;
        U.$$('#setupChoices .num-chip').forEach(c => c.classList.toggle('on', +c.dataset.n === v));
      };
      U.on(choiceEl, 'click', '.num-chip', (e, t) => { v = +t.dataset.n; K.audio.blip(); show(); });
      range.addEventListener('input', () => { v = +range.value; K.audio.tick(); show(); });
      U.$('#numOk').addEventListener('click', () => { K.audio.tap(); res(v); }, { once: true });
    });
  }

  /* ---------------------------------------------------------
     Les deux effets d annonce
     --------------------------------------------------------- */
  async function effetFeu() {
    K.audio.crash();
    U.buzz([30, 40, 60]);
    U.confetti(['#ff6a00', '#ffcf4d', '#ff3fa4', '#ff2d2d'], 110);
    const j = U.$('#jingle');
    j.className = 'jingle fire';
    j.innerHTML = '<div class="fire-row">🔥🔥🔥</div><h2>IN REAL LIFE</h2><p>Tout feu tout flamme</p>';
    j.hidden = false;
    K.audio.fanfare();
    await U.sleep(1500);
    j.hidden = true; j.className = 'jingle'; j.innerHTML = '';
  }

  async function effetRobot() {
    K.audio.buzzer();
    U.buzz([20, 30, 20, 30]);
    const j = U.$('#jingle');
    j.className = 'jingle robot';
    j.innerHTML = '<div class="robot-scan"></div><h2 class="glitch">ONLINE</h2><p>BZZZ. BZZZ. MODE ROBOT.</p>';
    j.hidden = false;
    await U.sleep(1400);
    j.hidden = true; j.className = 'jingle'; j.innerHTML = '';
  }

  /* ---------------------------------------------------------
     Le parcours
     --------------------------------------------------------- */
  S.run = async function () {
    U.go('setup');
    mount();
    K.audio.unlock();
    mood('happy');

    await say('On va regler ca en trente secondes. Premiere question.');
    mood('wink');

    /* --- ou se joue la partie --- */
    const venue = await reveal([
      { line: 'Tu joues...', wait: 700,
        card: { val: 'irl', cls: 'card-fire', ico: '🔥', title: 'IN REAL LIFE',
                sub: 'Tous dans la meme piece' } },
      { line: 'ou...', wait: 500, sound: () => K.audio.buzzer(),
        card: { val: 'online', cls: 'card-robot', ico: '🤖', title: 'ONLINE',
                sub: 'Chacun chez soi. Bzzz.' } }
    ]);
    St().venue = venue;

    if (venue === 'irl') {
      await effetFeu();
      mood('oh');
      await say('AH ! Les vrais ! Rien ne remplace une table et des gens qui crient.');
    } else {
      await effetRobot();
      mood('wink');
      await say('Bzzz. Mode robot enclenche. Bzz.');
      await say('Je retire les epreuves qui demandent d etre dans la meme piece : ' +
                'le 21, le mime et le duel restent au vestiaire.');
      await say('Gardez un appel vocal ouvert, le reste se joue tres bien a distance.');
    }

    /* --- combien de telephones --- */
    if (venue === 'irl') {
      mood('happy');
      await say('Avec 1 telephone ?');
      const un = await choose([
        { val: 'solo', cls: 'card-yes', ico: '📱', title: 'OUI',
          sub: 'On se passe l appareil, tout marche hors-ligne' },
        { val: 'multi', cls: 'card-no', ico: '📶', title: 'NON',
          sub: 'Chacun le sien, salon a code. Debloque le duel.' }
      ]);
      St().device = un;
      await U.sleep(320);
      mood('wink');
      await say(un === 'solo'
        ? 'Un seul telephone : preparez vos poignets, ca va tourner.'
        : 'Chacun le sien. Je vous donne un code de salon dans un instant.');
    } else {
      /* a distance, chacun a forcement son ecran */
      St().device = 'multi';
    }

    /* --- condition de victoire --- */
    mood('happy');
    await say('T es plutot un rapide ou...');
    const mode = await choose([
      { val: 'tours', cls: 'card-quick', ico: '⏱️', title: 'NOMBRE DE TOURS',
        sub: 'On compte les tours, le plus loin gagne' },
      { val: 'terminus', cls: 'card-long', ico: '🏁', title: 'TERMINUS',
        sub: 'Le premier au bout du chemin' }
    ]);
    St().mode = mode;
    await U.sleep(320);

    if (mode === 'terminus') {
      mood('oh');
      await say('Jusqu au bout, toi !');
      await say('Et combien de cases ?');
      St().boardLength = await number([20, 30, 40, 60, 80], 20, 80, St().boardLength, 'cases');
    } else {
      mood('wink');
      await say('On est sur un quicky alors...');
      await say('Combien de tours ?');
      St().maxTurns = await number([3, 5, 8, 12, 20], 3, 20, St().maxTurns, 'tours');
    }

    /* --- ce qui ne se demande pas --- */
    St().spicy = true;
    mood('wink');
    await say('Et j active le mode epice, evidemment. On ne se refait pas.');

    K.save();
    K.audio.good();

    if (St().device === 'multi') { K.net.openLobbyScreen(); U.go('lobby'); }
    else { K.menu.renderPlayers(); U.go('players'); }
  };

})(window.KWA);
