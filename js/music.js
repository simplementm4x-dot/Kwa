/* =========================================================
   KWA — LA MUSIQUE

   Trois pistes seulement, et une regle : elles ne doivent
   jamais couvrir la table. Le lit du plateau tourne a 14 %
   du volume, le theme du menu a 50 %, et tout se coupe
   pendant que Kwa parle ou qu un jingle passe.

   Les deux fonds ont ete composes comme des morceaux, pas
   comme des boucles : ils s ouvrent et se ferment. On recoud
   donc la queue par-dessus la tete au chargement (voir coud),
   ce qui donne une boucle sans trou ni claquement.
   ========================================================= */
(function (K) {
  'use strict';
  const M = K.music = {};

  const DOSSIER = 'assets/audio/';

  /* volume : le niveau de croisiere de la piste.
     boucle : la longueur du raccord queue-sur-tete, en secondes.
              0 = la piste ne boucle pas (un jingle). */
  const PISTES = {
    menu:    { volume: .50, boucle: 2.5 },
    plateau: { volume: .14, boucle: 4.0 },
    dj:      { volume: .60, boucle: 0 }
  };

  /* quel fond tourne sur quel ecran. Tout ce qui n est pas la partie
     est un ecran de menu : le theme continue sans coupure du titre
     jusqu au lancement, y compris pendant la configuration. */
  const ECRANS = { game: 'plateau' };

  /* le fondu par defaut quand on passe d une piste a l autre */
  const FONDU = 1.4;

  /* Deux gains, et pas un seul : le bouton mute et le jingle qui fait
     baisser le lit ecrivent tous les deux sur le volume. S ils partagent
     le meme noeud, celui qui finit son fondu en dernier ecrase l autre —
     et on se retrouve avec un son qui revient tout seul apres un mute. */
  let maitre = null;            /* le mute */
  let creux = null;             /* la baisse passagere sous un jingle */
  let fond = null;              /* { nom, src, gain } */
  let voulu = null;             /* la piste demandee, meme si le son dort */
  let demarre = null;           /* une piste en cours de chargement */
  let jeton = 0;                /* invalide les demarrages en retard */
  let coupe = false;
  const buffers = {};           /* nom -> Promise<AudioBuffer> */

  function ctx() {
    return K.audio && K.audio.context ? K.audio.context() : null;
  }

  /**
   * A-t-on le droit de jouer de la musique sur cet ecran-ci ?
   *
   * Quatre telephones dans le meme salon qui lancent le meme morceau a
   * quelques secondes d ecart, c est une bouillie. En vrai-monde multi,
   * seul l hote fait le son : c est lui le plateau. A distance, chacun
   * est chez soi et merite sa musique.
   */
  function autorise() {
    if (coupe) return false;
    if (K.audio && !K.audio.enabled()) return false;
    if (K.net && K.net.isActive() && !K.net.isHost() &&
        K.rules && !K.rules.isOnline()) return false;
    return true;
  }

  /* ---------------------------------------------------------
     Chargement
     --------------------------------------------------------- */
  /**
   * Opus d abord, AAC en secours.
   *
   * Plutot que d interroger le navigateur sur ce qu il sait lire, on
   * tente le .webm et on retombe sur le .m4a si le decodage echoue :
   * c est la seule reponse qui ne ment pas.
   */
  async function decode(c, nom) {
    for (const ext of ['webm', 'm4a']) {
      try {
        const r = await fetch(DOSSIER + nom + '.' + ext);
        if (!r.ok) continue;
        const brut = await r.arrayBuffer();
        return await c.decodeAudioData(brut);
      } catch (e) { /* format refuse : on essaie le suivant */ }
    }
    return null;
  }

  /**
   * Recoud la fin sur le debut.
   *
   * On raccourcit la piste du temps du raccord, puis on mixe la queue
   * qu on vient d enlever par-dessus les premieres secondes, en fondu
   * a puissance constante. Le point de bouclage tombe alors au milieu
   * d un enchainement que la piste contenait deja : rien ne claque, et
   * la source peut tourner en loop=true toute la partie.
   */
  function coud(c, buf, secondes) {
    const sr = buf.sampleRate;
    const raccord = Math.min(Math.floor(secondes * sr), Math.floor(buf.length / 3));
    if (raccord < sr / 4) return buf;
    const n = buf.length - raccord;
    const out = c.createBuffer(buf.numberOfChannels, n, sr);
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const src = buf.getChannelData(ch);
      const dst = out.getChannelData(ch);
      dst.set(src.subarray(0, n));
      for (let i = 0; i < raccord; i++) {
        const t = i / raccord;
        dst[i] = src[i] * Math.sin(t * Math.PI / 2) +      /* la tete monte */
                 src[n + i] * Math.cos(t * Math.PI / 2);   /* la queue s efface */
      }
    }
    return out;
  }

  function charge(c, nom) {
    if (!buffers[nom]) {
      buffers[nom] = decode(c, nom).then(buf => {
        if (!buf) return null;
        const p = PISTES[nom] || {};
        return p.boucle ? coud(c, buf, p.boucle) : buf;
      }).catch(() => null);
    }
    return buffers[nom];
  }

  /* ---------------------------------------------------------
     Lecture
     --------------------------------------------------------- */
  /** la chaine : piste -> creux -> maitre -> sortie */
  function sortie(c) {
    if (!maitre) {
      maitre = c.createGain();
      maitre.gain.value = coupe ? 0 : 1;
      maitre.connect(c.destination);
    }
    if (!creux) {
      creux = c.createGain();
      creux.gain.value = 1;
      creux.connect(maitre);
    }
    return creux;
  }

  function eteint(entree, fondu) {
    if (!entree) return;
    const c = ctx();
    /* pas de contexte pour piloter un fondu : on coupe sec plutot que
       de laisser la piste tourner dans le vide */
    if (!c) { try { entree.src.stop(); } catch (e) {} return; }
    const g = entree.gain.gain;
    const t = c.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0, t + fondu);
    try { entree.src.stop(t + fondu + .05); } catch (e) {}
  }

  /**
   * Lance un fond, en fondu enchaine avec celui qui tourne.
   * Redemander la piste deja en cours ne fait rien : c est ce qui permet
   * d appeler ecran() a chaque changement d ecran sans y reflechir.
   */
  M.joue = async function (nom, opts) {
    voulu = nom;
    if (!PISTES[nom]) return;
    if (!autorise()) return;
    const c = ctx();
    if (!c || !c.createBufferSource) return;
    /* deja en place, ou deja en route : deux appels rapproches pour la
       meme piste (un changement d ecran suivi du deverrouillage du son,
       par exemple) doivent lancer UNE source, pas deux */
    if (fond && fond.nom === nom) return;
    if (demarre === nom) return;

    demarre = nom;
    const mien = ++jeton;
    let buf = null;
    try { buf = await charge(c, nom); }
    finally { if (demarre === nom) demarre = null; }

    /* le telechargement dure : l ecran a pu changer, le son a pu etre
       coupe, une autre piste a pu etre demandee entre-temps */
    if (!buf || mien !== jeton || voulu !== nom || !autorise()) return;
    if (fond && fond.nom === nom) return;

    const fondu = (opts && opts.fondu != null) ? opts.fondu : FONDU;
    const p = PISTES[nom];
    const gain = c.createGain();
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = !!p.boucle;
    gain.gain.value = 0;
    src.connect(gain);
    gain.connect(sortie(c));
    src.start();
    gain.gain.linearRampToValueAtTime(p.volume, c.currentTime + fondu);

    eteint(fond, fondu);
    fond = { nom, src, gain };
  };

  M.stop = function (fondu) {
    voulu = null;
    demarre = null;
    jeton++;                    /* annule un demarrage encore en vol */
    eteint(fond, fondu == null ? FONDU : fondu);
    fond = null;
  };

  /* ---------------------------------------------------------
     Jingles et baisse de volume
     --------------------------------------------------------- */
  /**
   * Baisse tout le fond a `part` de son volume pendant `secondes`.
   * Sert au jingle du DJ : le lit du plateau s efface derriere lui
   * puis remonte tout seul.
   */
  M.baisse = function (part, secondes) {
    const c = ctx();
    if (!c || !creux) return;
    const g = creux.gain, t = c.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(part, t + .25);
    g.setValueAtTime(part, t + Math.max(.3, secondes));
    g.linearRampToValueAtTime(1, t + Math.max(.3, secondes) + .8);
  };

  /** un coup unique, par-dessus le fond, qui ne boucle pas */
  M.jingle = async function (nom) {
    if (!autorise()) return;
    const c = ctx();
    if (!c || !c.createBufferSource) return;
    const buf = await charge(c, nom);
    if (!buf || !autorise()) return;
    const p = PISTES[nom] || { volume: .6 };
    const gain = c.createGain();
    gain.gain.value = p.volume;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(gain);
    /* le jingle passe par-dessus le creux, sinon il se baisserait
       lui-meme en meme temps que le lit qu il vient couvrir */
    sortie(c);
    gain.connect(maitre);
    M.baisse(.28, buf.duration);
    src.start();
    return new Promise(res => { src.onended = res; setTimeout(res, buf.duration * 1000 + 400); });
  };

  /* ---------------------------------------------------------
     Branchements
     --------------------------------------------------------- */
  /** appele a chaque changement d ecran par U.go */
  M.ecran = function (nom) {
    M.joue(ECRANS[nom] || 'menu');
  };

  /** le premier geste du joueur debloque le son : on rattrape la piste */
  M.reveille = function () {
    M.joue(voulu || ECRANS[(K.state && K.state.screen) || 'title'] || 'menu', { fondu: 2.5 });
  };

  /**
   * Le bouton mute.
   *
   * On ne coupe pas la source, on ferme le robinet : couper puis
   * relancer redemarrerait le morceau depuis le debut, et surtout
   * laisserait une chance a deux sources de se superposer. Ici, la
   * musique se tait en un dixieme de seconde et reprend exactement
   * la ou elle en etait.
   */
  M.setEnabled = function (v) {
    coupe = !v;
    const c = ctx();
    if (c && maitre) {
      const g = maitre.gain, t = c.currentTime;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(coupe ? 0 : 1, t + (coupe ? .12 : .5));
    }
    /* On a pu changer d ecran pendant le silence : la piste qui tourne
       n est peut-etre plus la bonne. reveille() ne fait rien si c est
       deja celle-la, et enchaine en fondu sinon. */
    if (!coupe) M.reveille();
  };

})(window.KWA);
