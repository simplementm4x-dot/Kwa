/* =========================================================
   KWA — utilitaires
   ========================================================= */
window.KWA = window.KWA || {};

(function (K) {
  'use strict';

  const U = K.util = {};

  U.$  = (sel, root) => (root || document).querySelector(sel);
  U.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* --- DOM --- */
  U.el = function (html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  U.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  U.on = function (root, evt, sel, fn) {
    root.addEventListener(evt, e => {
      const t = e.target.closest(sel);
      if (t && root.contains(t)) fn(e, t);
    });
  };

  /* --- aleatoire --- */
  U.rnd  = n => Math.floor(Math.random() * n);
  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.sleep = ms => new Promise(r => setTimeout(r, ms));

  /* --- pioche sans repetition (memorisee par cle) --- */
  const bags = {};
  U.draw = function (key, pool) {
    if (!pool || !pool.length) return null;
    if (!bags[key] || !bags[key].length) bags[key] = U.shuffle(pool.map((_, i) => i));
    return pool[bags[key].pop()];
  };
  U.resetBags = function () { for (const k in bags) delete bags[k]; };

  /* --- ecrans --- */
  U.go = function (name) {
    U.$$('.screen').forEach(s => s.classList.toggle('is-active', s.id === 'screen-' + name));
    const sc = U.$('#screen-' + name + ' .scroll');
    if (sc) sc.scrollTop = 0;
    K.state && (K.state.screen = name);
  };

  /* --- toast --- */
  let toastT = null;
  U.toast = function (msg, ms) {
    const t = U.$('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.hidden = true; }, ms || 1800);
  };

  /* --- jingle plein ecran --- */
  U.jingle = function (title, sub, ms) {
    K.net && K.net.ev('jingle', { title, sub, ms });
    return U.jingleLocal(title, sub, ms);
  };
  U.jingleLocal = function (title, sub, ms) {
    return new Promise(res => {
      const j = U.$('#jingle');
      j.className = 'jingle';
      j.innerHTML = '<h2>' + U.esc(title) + '</h2>' + (sub ? '<p>' + U.esc(sub) + '</p>' : '');
      j.hidden = false;
      K.audio && K.audio.jingle();
      setTimeout(() => { j.hidden = true; res(); }, ms || 1500);
    });
  };

  /* --- roulement de tambour plein ecran --- */
  U.drumroll = function (ms, sub) {
    K.net && K.net.ev('drum', { ms, sub });
    return U.drumrollLocal(ms, sub);
  };
  U.drumrollLocal = function (ms, sub) {
    ms = ms || 2600;
    return new Promise(res => {
      const j = U.$('#jingle');
      j.className = 'jingle drum';
      j.innerHTML = '<div class="drum-ico">🥁</div><h2>ROULEMENT DE TAMBOUR</h2>' +
                    '<p>' + U.esc(sub || 'Qui commence ?') + '</p>';
      j.hidden = false;
      K.audio.drumroll(ms / 1000);
      setTimeout(() => {
        K.audio.crash();
        j.hidden = true; j.className = 'jingle'; j.innerHTML = '';
        res();
      }, ms);
    });
  };

  /* --- projecteur : carte affichee sur le plateau, sous la bulle de Kwa --- */
  U.spotlight = function (html) {
    K.net && K.net.ev('spot', { html });
    return U.spotlightLocal(html);
  };
  U.spotlightLocal = function (html) {
    U.clearSpotlightLocal();
    if (!html) return null;
    const el = U.el('<div class="spotlight" id="spotlight">' + html + '</div>');
    U.$('#screen-game').appendChild(el);
    return el;
  };
  U.clearSpotlight = function () {
    K.net && K.net.ev('spot', { html: null });
    U.clearSpotlightLocal();
  };
  U.clearSpotlightLocal = function () {
    const old = U.$('#spotlight');
    if (old) old.remove();
  };

  /* --- overlay ---
     On remplace le noeud a chaque ouverture : les ecouteurs delegues
     poses par l ecran precedent meurent avec l ancien noeud, sinon ils
     s empilent et repondent a la place du nouvel ecran. */
  U.overlay = function (html) {
    const old = U.$('#overlay');
    const o = document.createElement('div');
    o.id = 'overlay';
    o.className = 'overlay';
    o.innerHTML = html;
    old.replaceWith(o);
    return o;
  };
  U.closeOverlay = function () {
    const o = U.$('#overlay');
    o.hidden = true; o.innerHTML = '';
  };
  U.ovIsOpen = () => !U.$('#overlay').hidden;

  /** Squelette d overlay standard : entete + corps + pied */
  U.ovShell = function (ico, title, sub, bodyHtml, footHtml) {
    return U.overlay(
      '<div class="ov-head"><span class="ov-ico">' + ico + '</span>' +
      '<h3>' + U.esc(title) + (sub ? '<span class="ov-sub">' + U.esc(sub) + '</span>' : '') + '</h3></div>' +
      '<div class="ov-body">' + bodyHtml + '</div>' +
      '<div class="ov-foot">' + (footHtml || '') + '</div>'
    );
  };

  /* --- images : redimensionne en dataURL leger --- */
  U.readImage = function (file, size) {
    size = size || 192;
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = rej;
      fr.onload = () => {
        const img = new Image();
        img.onerror = rej;
        img.onload = () => {
          const c = document.createElement('canvas');
          const ratio = Math.min(size / img.width, size / img.height);
          const w = Math.max(1, Math.round(img.width * ratio));
          const h = Math.max(1, Math.round(img.height * ratio));
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          res(c.toDataURL('image/jpeg', 0.82));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  };

  /* --- confettis --- */
  U.confetti = function (colors, n) {
    const box = U.el('<div class="confetti"></div>');
    document.body.appendChild(box);
    const cols = colors && colors.length ? colors : ['#ff3fa4', '#39e7ff', '#ffcf4d', '#57e08a'];
    for (let i = 0; i < (n || 90); i++) {
      const c = document.createElement('i');
      c.className = 'cf';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = cols[i % cols.length];
      c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
      c.style.animationDelay = (Math.random() * 0.7) + 's';
      box.appendChild(c);
    }
    setTimeout(() => box.remove(), 4200);
  };

  /* --- vibration --- */
  U.buzz = function (p) { try { navigator.vibrate && navigator.vibrate(p || 20); } catch (e) {} };

  /* --- compte a rebours reutilisable --- */
  U.countdown = function (seconds, onTick, onEnd) {
    let left = seconds;
    onTick(left, 1);
    const id = setInterval(() => {
      left--;
      onTick(left, left / seconds);
      if (left <= 0) { clearInterval(id); onEnd && onEnd(); }
    }, 1000);
    return () => clearInterval(id);
  };

  /* --- pluriel --- */
  U.cases = n => Math.abs(n) <= 1 ? '1 case' : Math.abs(n) + ' cases';

  /* --- panneau d information avec un seul bouton ---
     C est le seul ecran "public" : en mode multi il s affiche sur tous les
     telephones, mais seul l hote a le bouton pour passer a la suite. */
  U.panel = function (ico, title, sub, bodyHtml, btn) {
    K.net && K.net.ev('panel', { ico, title, sub, body: bodyHtml });
    return new Promise(res => {
      U.ovShell(ico, title, sub, bodyHtml,
        '<button class="btn btn-xl btn-primary" id="panelOk">' + U.esc(btn || 'Continuer') + '</button>');
      U.$('#panelOk').addEventListener('click', () => {
        K.audio.tap();
        K.net && K.net.ev('panelClose', {});
        res();
      }, { once: true });
    });
  };

  /** le meme panneau, en lecture seule, sur les telephones qui suivent */
  U.panelMirror = function (ico, title, sub, bodyHtml) {
    U.ovShell(ico, title, sub, bodyHtml,
      '<div class="center dim" style="font-family:var(--pix);font-size:9px;padding:10px 0">' +
      'EN ATTENTE DE L HOTE...</div>');
  };

  /** bloc "verdict" reutilisable */
  U.verdict = function (win, ico, title, html) {
    return '<div class="verdict ' + (win ? 'win' : 'lose') + '"><div class="vico">' + ico + '</div>' +
      '<h3>' + U.esc(title) + '</h3><p>' + (html || '') + '</p></div>';
  };

  /* --- "passe le telephone a X" (mode 1 telephone) --- */
  U.passPhone = function (player, msg, btnLabel) {
    return new Promise(res => {
      const o = U.overlay(
        '<div class="pass" style="--pc:' + player.hex + '">' +
          '<div class="pass-tv">' + K.sprites.tvPawn(player, 1.5) + '</div>' +
          '<h3>PASSE LE TELEPHONE A</h3><b>' + U.esc(player.name) + '</b>' +
          '<p>' + U.esc(msg || 'Les autres ne regardent pas.') + '</p>' +
          '<button class="btn btn-xl btn-primary" id="passOk">' + U.esc(btnLabel || 'C est moi !') + '</button>' +
        '</div>');
      o.querySelector('#passOk').addEventListener('click', () => { K.audio.tap(); res(); }, { once: true });
    });
  };

})(window.KWA);
