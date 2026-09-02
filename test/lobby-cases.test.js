/* =========================================================
   Les facons dont "creer un salon" peut echouer en vrai.
   ========================================================= */
'use strict';
const { boot, click, type, sleep } = require('./harness');

async function toLobby(url) {
  const ctx = await boot({ url });
  const { win, errors, $ } = ctx;
  click(win, $('[data-go="mode"]'), errors);
  click(win, $('.opt[data-val="multi"]'), errors);
  click(win, $('#btnToPlayers'), errors);
  return ctx;
}

function look(ctx) {
  const t = ctx.$('#toast');
  return {
    bouton: !!ctx.$('#netCreate'),
    code: ctx.$('#lobbyBody .code') ? ctx.$('#lobbyBody .code').textContent : null,
    toast: t && !t.hidden ? t.textContent : null,
    texte: ctx.$('#lobbyBody').textContent.replace(/\s+/g, ' ').trim().slice(0, 150)
  };
}

(async () => {
  console.log('=== 1. page ouverte en file:// (double-clic sur index.html) ===');
  {
    const ctx = await toLobby('file:///C:/Users/maxim/Desktop/Kwa/index.html');
    const r = look(ctx);
    console.log('  bouton Creer present :', r.bouton);
    console.log('  affiche :', r.texte);
  }

  console.log('\n=== 2. servi en http, mais sans avoir saisi de nom ===');
  {
    const ctx = await toLobby();
    click(ctx.win, ctx.$('#netCreate'), ctx.errors);
    await sleep(800);
    const r = look(ctx);
    console.log('  code obtenu :', r.code);
    console.log('  message     :', r.toast);
    console.log('  affiche     :', r.texte);
  }

  console.log('\n=== 3. servi en http, nom saisi, serveur injoignable ===');
  {
    const ctx = await toLobby('http://localhost:9/');   /* port mort */
    type(ctx.win, ctx.$('#netName'), 'Maxime');
    click(ctx.win, ctx.$('#netCreate'), ctx.errors);
    await sleep(2500);
    const r = look(ctx);
    console.log('  code obtenu :', r.code);
    console.log('  message     :', r.toast);
    console.log('  affiche     :', r.texte);
  }

  console.log('\n=== 4. cas nominal ===');
  {
    const ctx = await toLobby();
    type(ctx.win, ctx.$('#netName'), 'Maxime');
    click(ctx.win, ctx.$('#netCreate'), ctx.errors);
    await sleep(900);
    const r = look(ctx);
    console.log('  code obtenu :', r.code);
    console.log('  erreurs     :', ctx.errors.length ? ctx.errors.join(' | ') : 'aucune');
  }
  process.exit(0);
})();
