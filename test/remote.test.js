/* =========================================================
   Jeu heberge sur un site statique (Netlify) + serveur de
   salons ailleurs : c est js/config.js qui fait le lien.
   ========================================================= */
'use strict';
const http = require('http');
const { boot, click, type, sleep } = require('./harness');

async function lobby(url, config) {
  const ctx = await boot({ url, config });
  click(ctx.win, ctx.$('[data-go="mode"]'), ctx.errors);
  click(ctx.win, ctx.$('.opt[data-val="multi"]'), ctx.errors);
  click(ctx.win, ctx.$('#btnToPlayers'), ctx.errors);
  return ctx;
}
const etat = ctx => {
  const s = ctx.$('.net-status');
  return {
    code: ctx.$('#lobbyBody .code') ? ctx.$('#lobbyBody .code').textContent : null,
    msg: s ? s.textContent.trim() : null
  };
};

/** poignee de main WebSocket brute, pour tester le filtrage par origine */
function handshake(origin) {
  return new Promise(res => {
    const req = http.request({
      host: 'localhost', port: 8080, path: '/',
      headers: {
        Connection: 'Upgrade', Upgrade: 'websocket',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
        'Sec-WebSocket-Version': '13',
        Origin: origin
      }
    });
    req.on('upgrade', () => res(101));
    req.on('response', r => res(r.statusCode));
    req.on('error', () => res(0));
    req.end();
  });
}

(async () => {
  const fails = [];
  const step = s => console.log('  · ' + s);

  /* --- 1. site en https + adresse ws:// : refus explicite --- */
  {
    const ctx = await lobby('https://monjeu.netlify.app/', { server: 'ws://localhost:8080' });
    type(ctx.win, ctx.$('#netName'), 'Maxime');
    click(ctx.win, ctx.$('#netCreate'), ctx.errors);
    await sleep(500);
    const e = etat(ctx);
    if (!e.msg || !/wss/.test(e.msg)) fails.push('le melange https + ws:// n est pas signale');
    step('https + ws:// -> "' + (e.msg || 'rien').slice(0, 70) + '"');
  }

  /* --- 2. site statique sur un autre domaine + serveur distant --- */
  {
    const ctx = await lobby('http://monjeu.example/', { server: 'ws://localhost:8080' });
    type(ctx.win, ctx.$('#netName'), 'Maxime');
    click(ctx.win, ctx.$('#netCreate'), ctx.errors);
    await sleep(1200);
    const e = etat(ctx);
    if (!e.code) fails.push('pas de salon avec un serveur distant : ' + (e.msg || 'aucun message'));
    else step('site sur un autre domaine -> salon ' + e.code);
  }

  /* --- 3. page ouverte en local, serveur distant : ca doit marcher --- */
  {
    const ctx = await lobby('file:///C:/jeu/index.html', { server: 'ws://localhost:8080' });
    if (!ctx.$('#netCreate')) fails.push('le bouton Creer est masque alors qu un serveur distant est configure');
    else {
      type(ctx.win, ctx.$('#netName'), 'Maxime');
      click(ctx.win, ctx.$('#netCreate'), ctx.errors);
      await sleep(1200);
      const e = etat(ctx);
      if (!e.code) fails.push('pas de salon depuis un fichier local : ' + (e.msg || 'aucun message'));
      else step('page locale + serveur distant -> salon ' + e.code);
    }
  }

  /* --- 4. filtrage par origine --- */
  {
    const libre = await handshake('https://nimporte-qui.fr');
    if (libre !== 101) fails.push('sans KWA_ORIGINS, la connexion devrait passer (recu ' + libre + ')');
    step('sans KWA_ORIGINS : toute origine acceptee (' + libre + ')');
  }

  /* --- 5. site public sans serveur configure : message explicite --- */
  {
    const ctx = await lobby('https://kwafr.netlify.app/', { server: '' });
    type(ctx.win, ctx.$('#netName'), 'Maxime');
    click(ctx.win, ctx.$('#netCreate'), ctx.errors);
    await sleep(9000);
    const e = etat(ctx);
    if (!e.msg || !/config.js/.test(e.msg)) fails.push('le site statique sans serveur ne renvoie pas vers config.js : ' + e.msg);
    step('Netlify sans config.js -> "' + (e.msg || 'rien').slice(0, 90) + '"');
  }

  console.log('');
  console.log(fails.length ? 'ECHECS :\n - ' + fails.join('\n - ') : 'HEBERGEMENT SEPARE : OK');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('ECHEC : ' + e.message); process.exit(1); });
