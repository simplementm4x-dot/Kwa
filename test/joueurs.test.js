/* =========================================================
   COMBIEN DE JOUEURS TIENNENT A TABLE

   Le plafond n est pas un chiffre isole : il faut autant de
   couleurs distinctes que de sieges, sinon deux pions se
   ressemblent, et le salon en ligne doit compter pareil que
   l ecran des joueurs, sinon on refuse quelqu un qui avait sa
   place.
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const { boot, click, sleep, ROOT } = require('./harness');

let echecs = 0;
const ok = (c, m) => { console.log('  ' + (c ? '·' : 'X') + ' ' + m); if (!c) echecs++; };

(async function () {
  console.log('LA TABLE');
  const ctx = await boot();
  const { K, win } = ctx;
  const $ = s => win.document.querySelector(s);

  const max = K.MAX_JOUEURS;
  ok(max === 10, 'la table monte a ' + max);

  /* --- une couleur par siege, et pas deux fois la meme --- */
  ok(K.COLORS.length >= max, 'il y a au moins ' + max + ' couleurs (' + K.COLORS.length + ')');
  const ids = new Set(K.COLORS.map(c => c.id));
  const hex = new Set(K.COLORS.map(c => c.hex.toLowerCase()));
  ok(ids.size === K.COLORS.length && hex.size === K.COLORS.length,
    'aucune couleur en double, ni de nom ni de teinte');

  /* --- l ecran des joueurs laisse monter jusqu au plafond --- */
  const ajoute = $('#btnAddPlayer');
  for (let i = 0; i < max + 4; i++) click(win, ajoute, ctx.errors);
  await sleep(20);
  ok(K.state.players.length === max,
    'on peut inscrire ' + max + ' joueurs, pas un de plus (' + K.state.players.length + ')');
  ok(ajoute.hidden, 'le bouton d ajout disparait une fois la table pleine');

  /* --- chacun repart avec sa propre couleur --- */
  const prises = K.state.players.map(p => p.color);
  ok(new Set(prises).size === max,
    'les ' + max + ' joueurs ont chacun leur couleur sans qu on y touche');
  ok(K.state.players.every(p => p.hex && /^#[0-9a-f]{6}$/i.test(p.hex)),
    'chacun a bien une teinte de pion');

  /* --- le serveur compte pareil --- */
  const srv = fs.readFileSync(path.join(ROOT, 'server', 'server.js'), 'utf8');
  const m = srv.match(/const MAX_SIEGES = (\d+)/);
  ok(!!m && +m[1] === max,
    'le salon en ligne accepte le meme nombre de sieges (' + (m ? m[1] : 'introuvable') + ')');

  ok(ctx.errors.length === 0, 'aucune erreur de page' +
    (ctx.errors.length ? ' (' + ctx.errors.join(' | ') + ')' : ''));

  console.log(echecs ? '\nLA TABLE : ' + echecs + ' ECHEC(S)' : '\nLA TABLE : OK');
  process.exit(echecs ? 1 : 0);
})();
