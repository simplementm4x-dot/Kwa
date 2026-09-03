/* =========================================================
   KWA — pions television sur pattes
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const P = K.pawns = {};

  const els = {};   /* id joueur -> element */

  P.renderAll = function () {
    const box = U.$('#pawns');
    box.innerHTML = '';
    for (const k in els) delete els[k];
    K.state.players.forEach(p => {
      const el = U.el(
        '<div class="pawn" data-p="' + p.id + '" style="--pc:' + p.hex + '">' +
          '<div class="shadow"></div>' +
          '<div class="bb">' +
            '<div class="nametag">' + U.esc(p.name || '?') + '</div>' +
            K.sprites.tvPawn(p, 0.92) +
          '</div>' +
        '</div>'
      );
      box.appendChild(el);
      els[p.id] = el;
    });
    P.refreshSleep();
    P.layout();
  };

  /** repositionne tous les pions (gere l empilement sur une meme case) */
  P.layout = function () {
    K.net && K.net.ev('pos', { pos: K.state.players.map(p => ({ id: p.id, pos: p.pos })) });
    P.layoutLocal();
  };

  P.layoutLocal = function () {
    const byTile = {};
    K.state.players.forEach(p => { (byTile[p.pos] = byTile[p.pos] || []).push(p); });
    for (const tileIdx in byTile) {
      const group = byTile[tileIdx];
      const t = K.board.at(+tileIdx);
      if (!t) continue;
      group.forEach((p, k) => {
        const off = (k - (group.length - 1) / 2) * 34;
        const el = els[p.id];
        if (!el) return;
        el.style.left = (450 + t.gx + off) + 'px';
        el.style.top = (t.gy + (k % 2 ? 16 : 0)) + 'px';
      });
    }
  };

  P.setActive = function (id) {
    K.net && K.net.ev('active', { id });
    P.setActiveLocal(id);
  };
  P.setActiveLocal = function (id) {
    for (const k in els) els[k].classList.toggle('active', k === id);
  };

  /**
   * Un joueur qui perd le reseau ne disparait pas du plateau : sa
   * television bascule et s endort sur place. Le retour se voit
   * aussi, ce qui evite d avoir a le demander a voix haute.
   */
  P.setAsleep = function (id, on) {
    const el = els[id];
    if (!el) return;
    const deja = el.classList.contains('asleep');
    if (deja === !!on) return;
    el.classList.toggle('asleep', !!on);
    const bb = el.querySelector('.bb');
    if (on) {
      if (bb && !bb.querySelector('.zzz')) {
        bb.insertAdjacentHTML('beforeend', '<span class="zzz">z<i>z</i><b>z</b></span>');
      }
    } else {
      const z = bb && bb.querySelector('.zzz');
      if (z) z.remove();
      el.classList.remove('reveil');
      void el.offsetWidth;
      el.classList.add('reveil');
    }
  };

  /** aligne tous les pions sur l etat reseau des joueurs */
  P.refreshSleep = function () {
    K.state.players.forEach(p => P.setAsleep(p.id, !!p.off));
  };

  /**
   * Le pion que la regle de foret a dans le viseur.
   *
   * Le vent contraire souffle sur celui qui mene, et le meneur change
   * en cours de route : le marqueur suit le classement plutot que de
   * rester colle a celui qui menait quand la carte est tombee.
   */
  P.setVise = function (id, ico) {
    for (const k in els) {
      const el = els[k];
      const vise = k === id;
      el.classList.toggle('vise', vise);
      const bb = el.querySelector('.bb');
      const marque = bb && bb.querySelector('.vise-marque');
      if (vise && bb && !marque) {
        bb.insertAdjacentHTML('beforeend',
          '<span class="vise-marque">' + (ico || '🎯') + '</span>');
      } else if (!vise && marque) {
        marque.remove();
      } else if (vise && marque && ico && marque.textContent !== ico) {
        marque.textContent = ico;
      }
    }
  };

  /** anime la marche sur les ecrans qui suivent (mode multi) */
  P.setWalking = function (id, on) {
    const el = els[id];
    if (el) el.classList.toggle('walking', !!on);
  };

  P.refresh = function (p) {
    const el = els[p.id];
    if (!el) return P.renderAll();
    el.style.setProperty('--pc', p.hex);
    const bb = el.querySelector('.bb');
    bb.innerHTML = '<div class="nametag">' + U.esc(p.name || '?') + '</div>' + K.sprites.tvPawn(p, 0.92);
  };

  /**
   * Un pion qui gagne ou perd des cases le montre : l ecran s illumine
   * ou se met a gresiller. Rien de fonctionnel — mais un plateau ou les
   * pions encaissent sans broncher a l air d un tableur.
   */
  P.react = function (id, quoi) {
    K.net && K.net.ev('react', { id, k: quoi });
    P.reactLocal(id, quoi);
  };
  P.reactLocal = function (id, quoi) {
    const el = els[id];
    if (!el) return;
    const cls = quoi === 'gain' ? 'reagit-gain' : 'reagit-perte';
    el.classList.remove('reagit-gain', 'reagit-perte');
    void el.offsetWidth;                 /* sinon l animation ne repart pas */
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 800);
  };

  P.jump = function (p) {
    const el = els[p.id]; if (!el) return;
    el.classList.remove('jump'); void el.offsetWidth; el.classList.add('jump');
  };

  /* ---------------------------------------------------------
     Deplacement case par case
     --------------------------------------------------------- */
  P.moveTo = async function (p, target, opts) {
    opts = opts || {};
    const last = K.board.last();
    target = U.clamp(target, 0, last);
    const el = els[p.id];
    if (!el) { p.pos = target; return; }
    if (target === p.pos) { K.board.focus(p.pos); return; }

    const dir = target > p.pos ? 1 : -1;
    el.classList.add('walking');
    K.net && K.net.ev('walk', { id: p.id, on: true });
    while (p.pos !== target) {
      p.pos += dir;
      P.layout();
      K.board.focus(p.pos);
      K.audio.step();
      await U.sleep(opts.speed || 270);
    }
    el.classList.remove('walking');
    K.net && K.net.ev('walk', { id: p.id, on: false });
    K.board.hit(p.pos);
    K.audio.pop();
    await U.sleep(120);
  };

  P.el = id => els[id];

})(window.KWA);
