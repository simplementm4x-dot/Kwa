/* =========================================================
   CASE — DUEL (Pong)
   Le joueur de la case affronte un adversaire. Gagnant +3,
   perdant -3. Reserve au multi-telephones ou a l ecran partage.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;

  const TARGET = 3;   /* premier a 3 points */

  function pong(topP, botP) {
    return new Promise(resolve => {
      U.overlay(
        '<div class="ov-head"><span class="ov-ico">🏓</span><h3>DUEL' +
        '<span class="ov-sub">' + U.esc(topP.name) + ' (haut) vs ' + U.esc(botP.name) + ' (bas) · premier a ' + TARGET + '</span></h3></div>' +
        '<div class="pong-wrap">' +
          '<canvas id="pongCanvas"></canvas>' +
          '<div class="pong-tag top">' + U.esc(topP.name.toUpperCase()) + '</div>' +
          '<div class="pong-tag bot">' + U.esc(botP.name.toUpperCase()) + '</div>' +
          '<div class="pong-score" id="pongScore">0<br>0</div>' +
        '</div>');

      const cv = U.$('#pongCanvas');
      const ctx = cv.getContext('2d');
      const scoreEl = U.$('#pongScore');
      let W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);

      function resize() {
        const r = cv.getBoundingClientRect();
        W = r.width; H = r.height;
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      resize();
      addEventListener('resize', resize);

      const PW = () => Math.max(64, W * 0.24);
      const PH = 14, R = 9;
      let padTop = W / 2, padBot = W / 2;
      let bx = W / 2, by = H / 2, bvx = 0, bvy = 0, speed = 0;
      let sTop = 0, sBot = 0;
      let running = false, dead = false, countdown = 3;

      function serve(dir) {
        bx = W / 2; by = H / 2;
        speed = Math.max(4.2, H * 0.0065);
        const ang = (Math.random() * 0.7 - 0.35);
        bvx = Math.sin(ang) * speed;
        bvy = Math.cos(ang) * speed * dir;
      }

      /* --- controles --- */
      const touches = {};
      function handleTouch(e) {
        e.preventDefault();
        const r = cv.getBoundingClientRect();
        for (const t of e.changedTouches) {
          const y = t.clientY - r.top, x = t.clientX - r.left;
          if (e.type === 'touchstart') touches[t.identifier] = y < H / 2 ? 'top' : 'bot';
          const side = touches[t.identifier];
          if (!side) continue;
          if (side === 'top') padTop = U.clamp(x, PW() / 2, W - PW() / 2);
          else padBot = U.clamp(x, PW() / 2, W - PW() / 2);
          if (e.type === 'touchend' || e.type === 'touchcancel') delete touches[t.identifier];
        }
      }
      cv.addEventListener('touchstart', handleTouch, { passive: false });
      cv.addEventListener('touchmove', handleTouch, { passive: false });
      cv.addEventListener('touchend', handleTouch, { passive: false });
      cv.addEventListener('touchcancel', handleTouch, { passive: false });
      cv.addEventListener('mousemove', e => {
        const r = cv.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        if (y < H / 2) padTop = U.clamp(x, PW() / 2, W - PW() / 2);
        else padBot = U.clamp(x, PW() / 2, W - PW() / 2);
      });
      const keys = {};
      const kd = e => { keys[e.key] = true; };
      const ku = e => { keys[e.key] = false; };
      addEventListener('keydown', kd); addEventListener('keyup', ku);

      function keyMove() {
        const s = W * 0.02;
        if (keys.q || keys.Q || keys.ArrowLeft) padTop = U.clamp(padTop - s, PW() / 2, W - PW() / 2);
        if (keys.d || keys.D || keys.ArrowRight) padTop = U.clamp(padTop + s, PW() / 2, W - PW() / 2);
      }

      /* --- rendu --- */
      function draw() {
        ctx.clearRect(0, 0, W, H);
        /* filet */
        ctx.strokeStyle = 'rgba(255,255,255,.14)';
        ctx.lineWidth = 2; ctx.setLineDash([10, 12]);
        ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
        ctx.setLineDash([]);
        /* raquettes */
        ctx.fillStyle = topP.hex;
        ctx.shadowColor = topP.hex; ctx.shadowBlur = 16;
        ctx.fillRect(padTop - PW() / 2, 22, PW(), PH);
        ctx.fillStyle = botP.hex; ctx.shadowColor = botP.hex;
        ctx.fillRect(padBot - PW() / 2, H - 22 - PH, PW(), PH);
        /* balle */
        ctx.fillStyle = '#fff'; ctx.shadowColor = '#ffcf4d'; ctx.shadowBlur = 22;
        ctx.beginPath(); ctx.arc(bx, by, R, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
        if (!running && countdown > 0) {
          ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(H * 0.12) + 'px Outfit, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(countdown, W / 2, H / 2);
        }
      }

      function step() {
        if (dead) return;
        keyMove();
        if (running) {
          bx += bvx; by += bvy;
          if (bx < R) { bx = R; bvx = -bvx; K.audio.pong(); }
          if (bx > W - R) { bx = W - R; bvx = -bvx; K.audio.pong(); }

          /* raquette haute */
          if (bvy < 0 && by - R < 22 + PH && by - R > 14 && Math.abs(bx - padTop) < PW() / 2 + R) {
            bvy = -bvy; speed *= 1.06;
            bvx += (bx - padTop) / (PW() / 2) * 2.2;
            const n = Math.hypot(bvx, bvy); bvx = bvx / n * speed; bvy = bvy / n * speed;
            by = 22 + PH + R; K.audio.pong(); U.buzz(12);
          }
          /* raquette basse */
          if (bvy > 0 && by + R > H - 22 - PH && by + R < H - 14 && Math.abs(bx - padBot) < PW() / 2 + R) {
            bvy = -bvy; speed *= 1.06;
            bvx += (bx - padBot) / (PW() / 2) * 2.2;
            const n = Math.hypot(bvx, bvy); bvx = bvx / n * speed; bvy = bvy / n * speed;
            by = H - 22 - PH - R; K.audio.pong(); U.buzz(12);
          }
          /* points */
          if (by < -R * 3) { sBot++; point(1); }
          else if (by > H + R * 3) { sTop++; point(-1); }
        }
        draw();
        requestAnimationFrame(step);
      }

      function point(dir) {
        K.audio.buzzer();
        scoreEl.innerHTML = sTop + '<br>' + sBot;
        running = false;
        if (sTop >= TARGET || sBot >= TARGET) { finish(); return; }
        countdown = 2;
        serve(dir);
        tickDown(dir);
      }

      function tickDown(dir) {
        const id = setInterval(() => {
          countdown--;
          K.audio.tick();
          if (countdown <= 0) { clearInterval(id); running = true; }
        }, 700);
      }

      function finish() {
        dead = true;
        removeEventListener('keydown', kd); removeEventListener('keyup', ku);
        removeEventListener('resize', resize);
        const winner = sTop > sBot ? topP : botP;
        setTimeout(() => resolve(winner), 500);
      }

      serve(Math.random() < 0.5 ? 1 : -1);
      scoreEl.innerHTML = '0<br>0';
      tickDown(1);
      requestAnimationFrame(step);
    });
  }

  K.registerTile('duel', async function (ctx) {
    const p = ctx.player;
    const others = ctx.players.filter(x => x.id !== p.id);
    if (!others.length) return [];

    if (!K.rules.duelAllowed()) {
      await K.kwa.say('Le duel demande un ecran chacun. On passe.', { auto: 1200 });
      return [];
    }

    await K.kwa.say('DUEL AU PONG ! ' + p.name + ', choisis ton adversaire. Gagnant +3, perdant -3.', { mood: 'oh' });

    const id = await K.ask(p, {
      kind: 'list', icon: '🏓', noPass: true,
      title: 'Qui tu defies ?', sub: p.name + ' choisit',
      intro: 'Le perdant recule de 3 cases. Reflechis bien.',
      items: others.map(x => ({ id: x.id, pid: x.id, label: x.name, color: x.hex }))
    });
    U.closeOverlay();
    const opp = K.player(id) || others[0];

    await U.panel('🏓', 'Regles du duel', p.name + ' contre ' + opp.name,
      '<div class="rule"><h4><span>📱</span>Un seul ecran</h4><p>Le duel se joue sur cet appareil. ' +
      U.esc(p.name) + ' et ' + U.esc(opp.name) + ', rapprochez-vous.</p></div>' +
      '<div class="rule"><h4><span>👆</span>Les commandes</h4><p>Chacun glisse le doigt dans sa moitie d ecran. ' +
      U.esc(opp.name) + ' en haut, ' + U.esc(p.name) + ' en bas.</p></div>' +
      '<div class="rule"><h4><span>🎯</span>Objectif</h4><p>Premier a ' + TARGET + ' points. ' +
      'La balle accelere a chaque echange.</p></div>',
      'Tenez-vous prets');
    U.closeOverlay();

    const winner = await pong(opp, p);
    U.closeOverlay();
    const loser = winner.id === p.id ? opp : p;
    K.audio.fanfare();

    await U.panel('🏆', 'Fin du duel', '',
      U.verdict(true, '🏓', winner.name + ' GAGNE',
        '+3 cases pour ' + U.esc(winner.name) + ', -3 pour ' + U.esc(loser.name) + '.'));
    U.closeOverlay();

    return [{ id: winner.id, delta: 3 }, { id: loser.id, delta: -3 }];
  });

})(window.KWA);
