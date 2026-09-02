/* =========================================================
   Banc d essai : charge le vrai jeu dans un DOM headless
   pour cliquer dessus comme un joueur le ferait.
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');

/** ordre de chargement, lu directement dans index.html */
function scriptList(html) {
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
}

function boot(opts) {
  opts = opts || {};
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    url: opts.url || 'http://localhost:8080/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const win = dom.window;
  const errors = [];

  win.WebSocket = global.WebSocket;
  win.onerror = (msg) => errors.push(String(msg));
  win.addEventListener('error', e => errors.push(String(e.message || e.error)));

  /* jsdom ne fournit pas ces API : on les neutralise proprement */
  win.eval('window.scrollTo = function(){};');
  win.HTMLElement.prototype.scrollIntoView = function () {};

  scriptList(html).forEach(src => {
    const file = path.join(ROOT, src);
    try {
      win.eval(fs.readFileSync(file, 'utf8'));
      /* config.js est le premier charge : on peut le surcharger tout de suite */
      if (src.endsWith('config.js') && opts.config) Object.assign(win.KWA.CONFIG, opts.config);
    } catch (e) {
      errors.push(src + ' : ' + e.message);
    }
  });

  /* boot.js s abonne a DOMContentLoaded si le document charge encore :
     on attend que ce soit fait avant de rendre la main, sinon on cliquerait
     sur une interface pas encore branchee. */
  const ctx = { dom, win, K: win.KWA, errors, $: s => win.document.querySelector(s) };

  if (win.document.readyState !== 'loading') {
    try { win.document.dispatchEvent(new win.Event('DOMContentLoaded')); }
    catch (e) { errors.push('DOMContentLoaded : ' + e.message); }
    return Promise.resolve(ctx);
  }
  return new Promise(res => {
    win.document.addEventListener('DOMContentLoaded', () => setTimeout(() => res(ctx), 0));
  });
}

/** clic qui remonte les exceptions au lieu de les avaler */
function click(win, el, errors) {
  if (!el) { errors.push('element introuvable pour le clic'); return; }
  const prev = win.onerror;
  try {
    el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));
  } catch (e) {
    errors.push('clic : ' + e.message);
  }
  win.onerror = prev;
}

function type(win, el, value) {
  el.value = value;
  el.dispatchEvent(new win.Event('input', { bubbles: true }));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = { boot, click, type, sleep, ROOT };
