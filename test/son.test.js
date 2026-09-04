/* =========================================================
   LE BOUTON DU SON

   Couper le son n est pas un reglage qu on va chercher : c est
   un geste qu on fait parce que quelqu un entre dans la piece.
   Ce test verifie qu il y a un bouton la ou on est — chaque
   entete de menu, le HUD de la partie, l angle de l ecran titre
   et jusque dans une question posee en plein ecran — et que les
   trois endroits qui reglent le son racontent tous la meme
   histoire.
   ========================================================= */
'use strict';
const { boot, click, sleep } = require('./harness');

let echecs = 0;
const ok = (c, m) => { console.log('  ' + (c ? '·' : 'X') + ' ' + m); if (!c) echecs++; };

(async function () {
  console.log('LE BOUTON DU SON');
  const ctx = await boot();
  const { K, win } = ctx;
  const $ = s => win.document.querySelector(s);
  const $$ = s => [...win.document.querySelectorAll(s)];

  /* --- 1. il est partout --- */
  ok(!!$('#screen-title .btn-son'), 'l ecran titre a le sien, dans l angle');
  ok($('#screen-title .btn-son').classList.contains('coin'), 'et il se pose tout seul, faute de barre');

  const barres = $$('.topbar');
  const servies = barres.filter(b => b.querySelector('.btn-son')).length;
  ok(servies === barres.length,
    'les ' + barres.length + ' entetes de menu ont le leur (' + servies + ')');
  ok(!!$('.hud-top .btn-son'), 'le HUD de la partie aussi');

  /* --- 2. il suit les questions en plein ecran --- */
  K.util.ovShell('❓', 'Une question', 'sous-titre', '<p>corps</p>', '');
  ok(!!$('#overlay .ov-head .btn-son'), 'une question en plein ecran emmene le bouton avec elle');
  K.util.closeOverlay();

  /* --- 3. il coupe vraiment --- */
  const b = $('#screen-title .btn-son');
  ok(K.audio.enabled() && b.textContent === '🔊', 'au depart le son est actif');
  click(win, b, ctx.errors);
  await sleep(20);
  ok(!K.audio.enabled(), 'un clic coupe les bruitages');
  ok(K.state.settings.sound === false, 'le reglage de la partie suit');
  ok(b.textContent === '🔇' && b.classList.contains('off'), 'le bouton clique passe en rouge');

  /* --- 4. tous les exemplaires racontent la meme chose --- */
  const dissidents = $$('.btn-son').filter(x => x.textContent !== '🔇');
  ok(dissidents.length === 0,
    'les ' + $$('.btn-son').length + ' exemplaires sont d accord entre eux');
  ok($('#optSound').checked === false, 'la case a cocher des reglages suit sans qu on y aille');

  /* --- 5. et la page des reglages parle au meme endroit --- */
  const c = $('#optSound');
  c.checked = true;
  c.dispatchEvent(new win.Event('change', { bubbles: true }));
  await sleep(20);
  ok(K.audio.enabled(), 'rallumer depuis les reglages rallume pour de bon');
  ok($('#screen-title .btn-son').textContent === '🔊', 'et le bouton de l angle le sait');

  /* --- 6. la musique suit le meme interrupteur --- */
  let coupee = null;
  K.music.setEnabled = v => { coupee = !v; };
  K.son.regle(false);
  ok(coupee === true, 'couper le son coupe aussi la musique');

  ok(ctx.errors.length === 0, 'aucune erreur de page' +
    (ctx.errors.length ? ' (' + ctx.errors.join(' | ') + ')' : ''));

  console.log(echecs ? '\nBOUTON DU SON : ' + echecs + ' ECHEC(S)' : '\nBOUTON DU SON : OK');
  process.exit(echecs ? 1 : 0);
})();
