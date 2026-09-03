/* =========================================================
   KWA — l animateur : bulles de dialogue facon jeu de plateau
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const Kw = K.kwa = {};

  let zone, bot, bubble, txt, nextArr;
  let typing = null, resolveTap = null, mood = 'happy';

  Kw.mount = function () {
    zone = U.$('#kwaZone');
    bot = U.$('#kwaBot');
    bubble = U.$('#kwaBubble');
    txt = U.$('#kwaText');
    nextArr = U.$('#kwaNext');
    Kw.setMood('happy');
    if (!bubble.querySelector('.kwa-name')) {
      bubble.insertAdjacentHTML('afterbegin', '<span class="kwa-name">KWA</span>');
    }
    bubble.addEventListener('click', onTap);
  };

  Kw.setMood = function (m) {
    K.net && K.net.ev('mood', { m });
    Kw.setMoodLocal(m);
  };
  Kw.setMoodLocal = function (m) {
    mood = m;
    if (!bot) return;
    bot.innerHTML = K.sprites.kwa(0.86, m);
    /* la surprise se voit aussi dans le corps, pas seulement dans les yeux */
    bot.classList.toggle('is-what', m === 'what');
  };

  function onTap() {
    if (typing) { typing.skip(); return; }
    if (resolveTap) { const r = resolveTap; resolveTap = null; nextArr.hidden = true; r(); }
  }

  /** machine a ecrire.
      Une nouvelle replique interrompt la precedente : sans ca, deux
      animations ecrivent dans la meme bulle et les lettres s emmelent. */
  function type(text) {
    if (typing) typing.stop();
    return new Promise(res => {
      let i = 0, dead = false, handle;
      txt.textContent = '';
      nextArr.hidden = true;

      const finish = () => {
        if (dead) return;
        dead = true;
        if (typing === handle) typing = null;
        res();
      };
      handle = {
        skip() { txt.textContent = text; finish(); },
        stop() { finish(); }
      };
      typing = handle;

      const step = () => {
        if (dead) return;
        if (i >= text.length) { finish(); return; }
        txt.textContent += text[i++];
        if (i % 3 === 0) K.audio.type();
        setTimeout(step, 18);
      };
      step();
    });
  }

  /**
   * Kwa parle.
   * opts.auto = ms -> passe tout seul ; sinon il faut taper la bulle.
   * opts.mood = 'happy' | 'wink' | 'oh'
   */
  Kw.say = async function (text, opts) {
    opts = opts || {};
    K.net && K.net.ev('kwa', { text, mood: opts.mood });
    if (!zone) Kw.mount();
    Kw.show();
    if (opts.mood && opts.mood !== mood) Kw.setMoodLocal(opts.mood);
    await type(text);
    if (opts.auto) { await U.sleep(opts.auto); return; }
    nextArr.hidden = false;
    return new Promise(res => { resolveTap = res; });
  };

  /** ce que Kwa dit, repete sur les telephones qui suivent la partie */
  Kw.mirror = function (text, m) {
    if (!zone) Kw.mount();
    Kw.show();
    if (m) Kw.setMoodLocal(m);
    type(text);
    nextArr.hidden = true;
  };

  Kw.sayAll = async function (lines, opts) {
    for (const l of lines) await Kw.say(l, opts);
  };

  Kw.show = function () { zone && zone.classList.remove('hidden'); };
  Kw.hide = function () {
    K.net && K.net.ev('kwaHide', {});
    zone && zone.classList.add('hidden');
  };
  Kw.hideLocal = function () { zone && zone.classList.add('hidden'); };

  /** phrase piochee dans la banque (js/data/kwalines.js) */
  Kw.line = function (key, vars) {
    const pool = (K.LINES && K.LINES[key]) || null;
    if (!pool) return '';
    let s = U.draw('kwa:' + key, pool);
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  };

  Kw.sayLine = function (key, vars, opts) {
    const s = Kw.line(key, vars);
    return s ? Kw.say(s, opts) : Promise.resolve();
  };

})(window.KWA);
