/* =========================================================
   Parcours "creer un salon", exactement comme un joueur.
   ========================================================= */
'use strict';
const { boot, click, type, sleep } = require('./harness');

(async () => {
  const { win, K, errors, $ } = await boot();
  const fails = [];
  const step = s => console.log('  · ' + s);

  if (!K) { console.log('LE JEU NE SE CHARGE PAS'); console.log(errors.join('\n')); process.exit(1); }
  console.log('chargement : ' + (errors.length ? errors.length + ' ERREUR(S)' : 'ok'));
  errors.forEach(e => console.log('    ! ' + e));
  errors.length = 0;

  /* --- ecran titre --- */
  step('clic sur JOUER');
  click(win, $('[data-go="mode"]'), errors);
  if (!$('#screen-mode').classList.contains('is-active')) fails.push('l ecran des reglages ne s ouvre pas');

  /* --- choix du mode multi --- */
  step('choix "Chacun le sien"');
  click(win, $('.opt[data-val="multi"]'), errors);
  if (K.state.settings.device !== 'multi') fails.push('le mode multi n est pas retenu');

  /* --- suivant --- */
  step('clic sur Suivant');
  click(win, $('#btnToPlayers'), errors);
  if (!$('#screen-lobby').classList.contains('is-active')) fails.push('l ecran du salon ne s ouvre pas');

  const body = $('#lobbyBody').innerHTML;
  step('contenu du salon : ' + (body.trim() ? body.length + ' caracteres' : 'VIDE'));
  if (!$('#netCreate')) {
    fails.push('le bouton "Creer un salon" est absent');
    console.log('\n--- ce que le salon affiche ---\n' + body.slice(0, 700) + '\n---');
  }

  /* --- saisie du blase --- */
  if ($('#netName')) {
    step('saisie du nom');
    type(win, $('#netName'), 'Maxime');
    if (K.net && K.net.draftName && K.net.draftName() !== 'Maxime') fails.push('le nom saisi n est pas retenu');
  }

  /* --- creation du salon --- */
  step('clic sur "Creer un salon"');
  click(win, $('#netCreate'), errors);
  await sleep(1200);

  const toast = $('#toast');
  if (toast && !toast.hidden) step('message affiche : "' + toast.textContent + '"');

  const code = $('#lobbyBody .code');
  if (code) step('CODE DU SALON : ' + code.textContent);
  else fails.push('aucun code de salon apres le clic');

  errors.forEach(e => fails.push('exception : ' + e));

  console.log('');
  console.log(fails.length ? 'ECHECS :\n - ' + fails.join('\n - ') : 'CREATION DE SALON : OK');
  process.exit(fails.length ? 1 : 0);
})();
