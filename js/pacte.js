/* =========================================================
   LE PACTE DE KWA

   De temps en temps, avant de lancer le de, Kwa propose un
   marche. Il n y a jamais de bonne reponse : c est ce qui rend
   la chose interessante. Refuser ne coute rien, sauf la face.

   Regle d equilibre : un marche qui fait avancer REMPLACE le
   lancer de de. Sinon le joueur empochait ses cases puis
   relancait par-dessus, et le pacte devenait un cadeau au lieu
   d etre un choix. On compare donc toujours l offre a ce qu un
   de aurait donne — 3,5 cases en moyenne.
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
   *   pas      : le joueur avance de tant, sans lancer le de
   *   results  : ce que le marche fait aux AUTRES joueurs
   *   skipTile : le joueur ne fait pas l epreuve de sa case
   *   diceMult : multiplicateur sur le de, quand le de est conserve
   *
   * possible() ecarte les marches qui n auraient pas de sens pour ce
   * joueur-la : offrir au dernier du classement de faire avancer le
   * dernier, par exemple, revient a lui offrir des cases pour rien.
   */
  const MARCHES = [
    {
      id: 'cadeau',
      offre: 'Tu avances de 5 cases sans lancer le de. En echange, le joueur suivant en prend 5 aussi.',
      oui: 'MARCHE CONCLU',
      non: 'JE REFUSE',
      possible: (p, players, idx) => players.length > 1 && players[(idx + 1) % players.length].id !== p.id,
      applique(p, players, idx) {
        const suivant = players[(idx + 1) % players.length];
        return {
          pas: 5,
          results: [{ id: suivant.id, delta: 5 }],
          mot: p.name + ' avance de cinq, et ' + suivant.name + ' encaisse autant sans rien faire.'
        };
      }
    },
    {
      id: 'assurance',
      offre: 'Tu avances de 4 cases sans lancer le de, mais tu sautes ton epreuve. Tu ne sauras jamais ce que tu as rate.',
      oui: 'JE PRENDS LES 4',
      non: 'JE VEUX MON EPREUVE',
      possible: () => true,
      applique(p) {
        return {
          pas: 4,
          skipTile: true,
          mot: p.name + ' avance de quatre et passe son tour d epreuve. La prudence, ce vice.'
        };
      }
    },
    {
      id: 'quitte',
      offre: 'Tu recules de 2 cases maintenant. En echange, ton de compte double.',
      oui: 'QUITTE OU DOUBLE',
      non: 'TROP RISQUE',
      possible: p => p.pos > 0,
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
      offre: 'Le dernier du classement avance de 6 cases. Toi, tu avances de 3 sans lancer le de.',
      oui: 'POUR LA BONNE CAUSE',
      non: 'CHACUN SA ROUTE',
      /* sans ce garde-fou, le dernier se voyait offrir six cases pour
         avoir accepte de s aider lui-meme */
      possible: p => {
        const rang = K.ranking();
        return rang.length > 1 && rang[rang.length - 1].id !== p.id;
      },
      applique(p) {
        const rang = K.ranking();
        const dernier = rang[rang.length - 1];
        return {
          pas: 3,
          results: [{ id: dernier.id, delta: 6 }],
          mot: dernier.name + ' remonte de six cases grace a la generosite calculee de ' + p.name + '.'
        };
      }
    },
    {
      id: 'impot',
      offre: 'Tout le monde recule d une case. Toi, tu avances de 4 sans lancer le de. Tu vas te faire des amis.',
      oui: 'JE SIGNE',
      non: 'JE TIENS A EUX',
      possible: (p, players) => players.length > 1,
      applique(p, players) {
        return {
          pas: 4,
          results: players.filter(x => x.id !== p.id).map(x => ({ id: x.id, delta: -1 })),
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

    const offrables = MARCHES.filter(m => m.possible(p, players, idx));
    if (!offrables.length) return null;
    const m = offrables[U.rnd(offrables.length)];

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
