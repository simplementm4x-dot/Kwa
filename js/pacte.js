/* =========================================================
   LE PACTE DE KWA
   De temps en temps, avant de lancer le de, Kwa propose un
   marche. Il n y a jamais de bonne reponse : c est ce qui rend
   la chose interessante. Refuser ne coute rien, sauf la face.
   ========================================================= */
(function (K) {
  'use strict';
  const U = K.util;
  const P = K.pacte = {};

  /* une proposition tous les cinq ou six tours de joueur : assez rare
     pour rester un evenement, assez frequent pour qu on l attende */
  const CHANCE = 18;

  /**
   * Chaque marche renvoie ce qu il change :
   *   results  : deplacements immediats
   *   skipTile : le joueur ne fait pas l epreuve de sa case
   *   diceMult : multiplicateur sur le deplacement du de
   */
  const MARCHES = [
    {
      id: 'cadeau',
      offre: 'Je te donne 3 cases tout de suite. En echange, le joueur suivant en prend 5.',
      oui: 'MARCHE CONCLU',
      non: 'JE REFUSE',
      applique(p, players, idx) {
        const suivant = players[(idx + 1) % players.length];
        return {
          results: suivant.id === p.id
            ? [{ id: p.id, delta: 3 }]
            : [{ id: p.id, delta: 3 }, { id: suivant.id, delta: 5 }],
          mot: suivant.id === p.id
            ? 'Tu joues tout seul ou quoi ? Prends tes 3 cases.'
            : p.name + ' se sert, et ' + suivant.name + ' encaisse 5 cases sans rien faire.'
        };
      }
    },
    {
      id: 'assurance',
      offre: 'Je t offre 4 cases, mais tu sautes ton epreuve ce tour-ci. Tu ne sauras jamais ce que tu as rate.',
      oui: 'JE PRENDS LES 4',
      non: 'JE VEUX MON EPREUVE',
      applique(p) {
        return {
          results: [{ id: p.id, delta: 4 }],
          skipTile: true,
          mot: p.name + ' encaisse et passe son tour d epreuve. La prudence, ce vice.'
        };
      }
    },
    {
      id: 'quitte',
      offre: 'Tu recules de 2 cases maintenant. En echange, je double ton deplacement au de.',
      oui: 'QUITTE OU DOUBLE',
      non: 'TROP RISQUE',
      applique(p) {
        return {
          results: [{ id: p.id, delta: -2 }],
          diceMult: 2,
          mot: 'Deux cases en arriere, et un de qui compte double. Bonne chance, ' + p.name + '.'
        };
      }
    },
    {
      id: 'charite',
      offre: 'Le dernier du classement avance de 6 cases. Toi, tu en prends 3. Genereux, non ?',
      oui: 'POUR LA BONNE CAUSE',
      non: 'CHACUN SA ROUTE',
      applique(p, players) {
        const rang = K.ranking();
        const dernier = rang[rang.length - 1];
        return {
          results: dernier.id === p.id
            ? [{ id: p.id, delta: 6 }]
            : [{ id: p.id, delta: 3 }, { id: dernier.id, delta: 6 }],
          mot: dernier.id === p.id
            ? 'Le dernier, c est toi. Tu viens de t offrir 6 cases, bravo.'
            : dernier.name + ' remonte de 6 cases grace a la generosite calculee de ' + p.name + '.'
        };
      }
    },
    {
      id: 'impot',
      offre: 'Tout le monde recule d une case. Toi, tu avances de 4. Tu vas te faire des amis.',
      oui: 'JE SIGNE',
      non: 'JE TIENS A EUX',
      applique(p, players) {
        return {
          results: players.map(x => x.id === p.id ? { id: p.id, delta: 4 } : { id: x.id, delta: -1 }),
          mot: 'Signe. ' + p.name + ' avance, la table recule. On s en souviendra.'
        };
      }
    }
  ];

  /* refus : Kwa n insiste jamais, il commente */
  const REFUS = [
    'Refuse. Tu as sans doute raison. Sans doute.',
    'Non ? Note que je ne repropose jamais deux fois la meme chose.',
    'La sagesse. Ennuyeuse, mais la sagesse.',
    'Tres bien, tres bien. On oublie. Enfin, moi j oublie pas.'
  ];

  /**
   * Propose peut-etre un marche au joueur dont c est le tour.
   * Renvoie null si rien ne s est passe, sinon ce que le marche change.
   */
  P.maybe = async function (p, players, idx) {
    if (K.state.settings.pactes === false) return null;
    if (U.rnd(100) >= CHANCE) return null;

    const m = U.draw('pacte', MARCHES);
    if (!m) return null;

    await K.kwa.say('Attends, ' + p.name + '. J ai une proposition.', { mood: 'wink' });

    const rep = await K.ask(p, {
      kind: 'choice', icon: '🤝',
      title: 'Le pacte de Kwa',
      sub: 'Rien que pour toi, ' + p.name,
      intro: m.offre,
      passMsg: 'Kwa a quelque chose a te proposer. Entre quatre yeux.',
      a: m.oui, b: m.non
    });
    U.closeOverlay();

    if (rep !== 'a') {
      await K.kwa.say(U.pick(REFUS), { auto: 1500, mood: 'happy' });
      return null;
    }

    const out = m.applique(p, players, idx);
    K.audio.good();
    await K.kwa.say(out.mot, { auto: 1800, mood: 'oh' });
    return out;
  };

})(window.KWA);
