/* =========================================================
   LA MUSIQUE

   Pas de navigateur ici : on monte un faux AudioContext et on
   regarde ce que le module en fait. Ce qui compte, c est la
   couture — la fin recousue sur le debut — parce qu une erreur
   d un echantillon s entend a chaque tour de boucle, toute la
   partie durant.
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let echecs = 0;
const ok = (c, m) => { console.log('  ' + (c ? '·' : 'X') + ' ' + m); if (!c) echecs++; };
const proche = (a, b, e) => Math.abs(a - b) < (e || 1e-6);

/* ---------------------------------------------------------
   Un AudioContext de papier
   --------------------------------------------------------- */
function faussetContexte(decode) {
  const ctx = {
    currentTime: 0,
    destination: { nom: 'sortie' },
    lances: [],
    gains: [],
    createGain() {
      const g = {
        gain: {
          value: 0,
          cancelScheduledValues() {}, setValueAtTime() {},
          linearRampToValueAtTime(v) { this.value = v; }
        },
        connect(cible) { g.cible = cible; }
      };
      ctx.gains.push(g);
      return g;
    },
    createBufferSource() {
      const s = { buffer: null, loop: false, connect() {}, stop() { s.arrete = true; },
                  start() { s.demarre = true; ctx.lances.push(s); } };
      return s;
    },
    createBuffer(ch, len, sr) {
      const data = [];
      for (let i = 0; i < ch; i++) data.push(new Float32Array(len));
      return { numberOfChannels: ch, length: len, sampleRate: sr,
               duration: len / sr, getChannelData: i => data[i] };
    },
    decodeAudioData: decode
  };
  return ctx;
}

/** un tampon dont l echantillon i vaut i : toute erreur d indice se voit */
function rampe(ctx, secondes, sr) {
  const n = Math.round(secondes * sr);
  const b = ctx.createBuffer(1, n, sr);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = i;
  return b;
}

/* ---------------------------------------------------------
   Chargement du module dans une page de papier
   --------------------------------------------------------- */
function monte(opts) {
  opts = opts || {};
  const sr = 8000;
  const demandes = [];
  let ctx = null;

  const decode = () => Promise.resolve(rampe(ctx, opts.duree || 20, sr));
  ctx = faussetContexte(decode);

  const K = {
    audio: { enabled: () => true, context: () => (opts.sansContexte ? null : ctx) },
    net: { isActive: () => !!opts.multi, isHost: () => !!opts.hote },
    rules: { isOnline: () => !!opts.enLigne },
    state: { screen: 'title' }
  };

  const sandbox = {
    window: { KWA: K },
    console,
    setTimeout, clearTimeout,
    fetch: url => {
      demandes.push(url);
      /* de quoi eprouver le repli : on peut refuser le .webm */
      if (opts.refuseWebm && /\.webm$/.test(url)) return Promise.resolve({ ok: false });
      return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
    }
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'music.js'), 'utf8'),
    sandbox, { filename: 'music.js' });

  return { K, M: K.music, ctx, sr, demandes };
}

const souffle = () => new Promise(r => setTimeout(r, 30));

/* ---------------------------------------------------------
   Les epreuves
   --------------------------------------------------------- */
(async function () {
  console.log('LA MUSIQUE');

  /* --- 1. la couture --- */
  {
    const { M, ctx, sr } = monte({ duree: 20 });
    await M.joue('plateau');
    await souffle();
    const src = ctx.lances[0];
    ok(!!src && src.demarre, 'la piste de fond demarre');
    ok(src.loop === true, 'elle tourne en boucle');

    const raccord = Math.floor(4.0 * sr);        /* PISTES.plateau.boucle */
    const n = 20 * sr - raccord;
    ok(src.buffer.length === n, 'la boucle est raccourcie du raccord (' + n + ' echantillons)');

    const d = src.buffer.getChannelData(0);
    /* apres le raccord, la piste est intacte */
    ok(d[raccord] === raccord && d[n - 1] === n - 1, 'apres le raccord, rien n a bouge');
    /* dans le raccord : la tete monte, la queue s efface, a puissance constante */
    /* ecart relatif : la rampe monte a 160000 et les tampons sont en
       float32, donc on compare des proportions, pas des valeurs */
    let pire = 0;
    for (let i = 0; i < raccord; i += 137) {
      const t = i / raccord;
      const attendu = i * Math.sin(t * Math.PI / 2) + (n + i) * Math.cos(t * Math.PI / 2);
      pire = Math.max(pire, Math.abs(d[i] - attendu) / (Math.abs(attendu) + 1));
    }
    ok(pire < 1e-5, 'le fondu suit bien la loi a puissance constante (ecart relatif max ' + pire.toExponential(1) + ')');
    /* le premier echantillon de la boucle prolonge le dernier : c est
       toute la raison d etre de la couture */
    ok(proche(d[0], n, 1), 'le debut de la boucle prolonge la fin (pas de claquement)');
  }

  /* --- 2. Opus d abord, AAC en secours --- */
  {
    const { M, demandes } = monte({});
    await M.joue('menu');
    await souffle();
    ok(demandes.length === 1 && /menu\.webm$/.test(demandes[0]), 'on demande l Opus en premier');
  }
  {
    const { M, demandes } = monte({ refuseWebm: true });
    await M.joue('menu');
    await souffle();
    ok(demandes.length === 2 && /menu\.m4a$/.test(demandes[1]), 'si l Opus est refuse, on retombe sur l AAC');
  }

  /* --- 3. changer d ecran change de piste --- */
  {
    const { M, ctx } = monte({});
    M.ecran('title'); await souffle();
    M.ecran('setup'); await souffle();
    ok(ctx.lances.length === 1, 'les ecrans de menu partagent la meme piste, sans la relancer');
    M.ecran('game'); await souffle();
    ok(ctx.lances.length === 2, 'la partie bascule sur le lit du plateau');
    ok(ctx.lances[0].arrete, 'le theme du menu est coupe en fondu');
  }

  /* --- 4. quatre telephones dans le meme salon --- */
  {
    const { M, ctx } = monte({ multi: true, hote: false, enLigne: false });
    await M.joue('plateau'); await souffle();
    ok(ctx.lances.length === 0, 'en vrai-monde multi, un invite ne fait pas de son');
  }
  {
    const { M, ctx } = monte({ multi: true, hote: true, enLigne: false });
    await M.joue('plateau'); await souffle();
    ok(ctx.lances.length === 1, 'l hote, lui, tient la sono de la table');
  }
  {
    const { M, ctx } = monte({ multi: true, hote: false, enLigne: true });
    await M.joue('plateau'); await souffle();
    ok(ctx.lances.length === 1, 'a distance, chacun chez soi a sa musique');
  }

  /* --- 5. le bouton mute --- */
  {
    const { M, ctx } = monte({});
    await M.joue('menu'); await souffle();
    const src = ctx.lances[0];
    const maitre = ctx.gains.find(g => g.cible === ctx.destination);
    ok(!!maitre, 'un gain maitre relie toute la musique a la sortie');

    M.setEnabled(false);
    ok(maitre.gain.value === 0, 'couper le son ferme le robinet tout de suite');
    ok(!src.arrete, 'la piste continue en silence : elle reprendra ou elle en etait');

    M.setEnabled(true);
    await souffle();
    ok(maitre.gain.value === 1, 'remettre le son rouvre le robinet');
    ok(ctx.lances.length === 1, 'et ne lance pas un deuxieme exemplaire par-dessus');
  }

  /* --- 6. deux demandes qui se croisent --- */
  {
    const { M, ctx } = monte({});
    /* sans attendre la premiere : c est ce qui arrive quand un changement
       d ecran et le deverrouillage du son tombent dans la meme seconde */
    M.joue('menu'); M.joue('menu'); M.ecran('title');
    await souffle();
    ok(ctx.lances.length === 1, 'trois demandes rapprochees ne lancent qu une source');
  }

  /* --- 7. le mute pendant un changement d ecran --- */
  {
    const { M, ctx } = monte({});
    await M.joue('menu'); await souffle();
    M.setEnabled(false);
    M.ecran('game'); await souffle();
    ok(ctx.lances.length === 1, 'son coupe, on ne charge pas la piste suivante pour rien');
    M.setEnabled(true); await souffle();
    ok(ctx.lances.length === 2, 'en revanche on rattrape le bon morceau en rallumant');
    ok(ctx.lances[0].arrete, 'et l ancien s efface');
  }

  /* --- 8. sans WebAudio, le jeu ne tombe pas --- */
  {
    const { M } = monte({ sansContexte: true });
    await M.joue('menu');
    M.ecran('game');
    M.baisse(.3, 1);
    M.stop();
    ok(true, 'sans AudioContext, tout se tait sans casser');
  }

  /* --- 9. la racine du bug : le contexte survit a la coupure ---
     K.audio refusait son contexte des que le son etait coupe. La musique,
     qui en a besoin pour aller BAISSER son volume, ne pouvait donc plus
     rien faire au moment precis ou on lui demandait de se taire. */
  {
    const K = { };
    const sandbox = { console, window: { KWA: K, AudioContext: function () { this.state = 'running'; } } };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'audio.js'), 'utf8'),
      sandbox, { filename: 'audio.js' });
    K.audio.setEnabled(false);
    ok(!!K.audio.context(), 'son coupe, la musique obtient quand meme le contexte');
    ok(K.audio.enabled() === false, 'ce qui ne rallume pas les bruitages pour autant');
  }

  console.log(echecs ? '\nMUSIQUE : ' + echecs + ' ECHEC(S)' : '\nMUSIQUE : OK');
  process.exit(echecs ? 1 : 0);
})();
