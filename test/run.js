/* =========================================================
   Lance la suite de tests : contenu, plateau, salon, partie.
   Demarre et arrete le serveur tout seul.
   ========================================================= */
'use strict';
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SUITE = ['content.test.js', 'board.test.js', 'setup.test.js', 'gameplay.test.js', 'libre.test.js', 'lobby.test.js', 'remote.test.js', 'multi.test.js', 'reconnect.test.js'];

const server = spawn(process.execPath, [path.join(ROOT, 'server', 'server.js')],
  { cwd: ROOT, stdio: 'ignore' });

process.on('exit', () => server.kill());
process.on('SIGINT', () => { server.kill(); process.exit(1); });

setTimeout(() => {
  let failed = 0;
  for (const f of SUITE) {
    console.log('\n=== ' + f + ' ===');
    const r = spawnSync(process.execPath, [path.join(__dirname, f)], { cwd: ROOT, stdio: 'inherit' });
    if (r.status !== 0) failed++;
  }
  server.kill();
  console.log('\n' + (failed ? failed + ' TEST(S) EN ECHEC' : 'TOUT PASSE'));
  process.exit(failed ? 1 : 0);
}, 1200);
