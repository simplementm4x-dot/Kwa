/* =========================================================
   LES PHOTOS DU CLICHE

   Le mini-jeu montre une vraie photo et demande ce que c est.
   Il fallait donc une banque d images libres, sans compte, sans
   cle d API et sans quota : Wikimedia Commons, atteint par
   l API de Wikipedia qui donne une vignette pour n importe
   quel article.

   Ce script tourne une fois, a la main :

       node tools/cliche.js

   Il verifie chaque titre de la liste, ne garde que ceux qui
   ont bien une photo, et ecrit js/data/cliche.js. Le jeu, lui,
   ne fait plus aucun appel d API : il charge des images, c est
   tout. Une banque figee vaut mieux qu un appel reseau au
   milieu d une partie — un article renomme ne casse pas une
   soiree, il casse ce script, et on le relance.

   La liste est ecrite a la main, en paires [titre, reponse] :
   le titre sert a interroger Wikipedia, la reponse est ce qui
   s affiche a l ecran. On ne peut pas se contenter du titre de
   l article — "Avocat (fruit)" n est pas une reponse de jeu.
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SORTIE = path.join(ROOT, 'js', 'data', 'cliche.js');
const LARGEUR = 640;          /* la vignette demandee, en pixels */
/* En dessous de cette taille, l image serait etiree dans le cadre du
   jeu : toutes les photos passent par le meme carre 4/3, une vignette
   de 200 pixels y ressort baveuse a cote des autres. */
const MINI = 400;

/* ---------------------------------------------------------
   La liste
   Chaque categorie fournit aussi les mauvaises reponses de
   ses propres photos : c est ce qui rend le choix difficile.
   Une categorie doit donc contenir au moins quatre entrees.
   --------------------------------------------------------- */
const BANQUE = {
  'Monuments': [
    ['Tour Eiffel', 'La tour Eiffel'],
    ['Statue de la Liberté', 'La statue de la Liberté'],
    ['Colisée', 'Le Colisée'],
    ['Tour de Pise', 'La tour de Pise'],
    ['Taj Mahal', 'Le Taj Mahal'],
    ['Grande Muraille', 'La Grande Muraille de Chine'],
    ['Machu Picchu', 'Le Machu Picchu'],
    ['Sagrada Família', 'La Sagrada Familia'],
    ['Palais de Westminster', 'Big Ben'],
    ["Arc de triomphe de l'Étoile", "L arc de triomphe"],
    ['Mont Saint-Michel', 'Le Mont-Saint-Michel'],
    ['Château de Versailles', 'Le chateau de Versailles'],
    ['Sphinx de Gizeh', 'Le sphinx de Gizeh'],
    ['Pyramide de Khéops', 'La pyramide de Kheops'],
    ['Christ Rédempteur (Rio de Janeiro)', 'Le Christ Redempteur'],
    ['Opéra de Sydney', 'L opera de Sydney'],
    ['Golden Gate Bridge', 'Le Golden Gate'],
    ['Cathédrale Notre-Dame de Paris', 'Notre-Dame de Paris'],
    ['Stonehenge', 'Stonehenge'],
    ["Acropole d'Athènes", "L Acropole d Athenes"],
    ['Alhambra (Grenade)', 'L Alhambra de Grenade'],
    ['Pétra', 'Petra'],
    ['Angkor Vat', 'Angkor Vat'],
    ['Empire State Building', "L Empire State Building"],
    ['Burj Khalifa', 'La Burj Khalifa'],
    ['Tower Bridge', 'Le Tower Bridge'],
    ['Atomium', "L Atomium"],
    ['Basilique Saint-Pierre', 'La basilique Saint-Pierre'],
    ['Moulin-Rouge', 'Le Moulin-Rouge'],
    ['Mur de Berlin', 'Le mur de Berlin'],
    ['Château de Neuschwanstein', 'Le chateau de Neuschwanstein'],
    ['Musée du Louvre', 'Le Louvre'],
    ['Sacré-Cœur de Montmartre', 'Le Sacre-Coeur'],
    ['Kremlin de Moscou', 'Le Kremlin'],
    ['Cathédrale Saint-Basile-le-Bienheureux', 'La cathedrale Saint-Basile']
  ],

  'Animaux': [
    ['Lion', 'Un lion'],
    ['Tigre', 'Un tigre'],
    ["Éléphant d'Afrique", 'Un elephant'],
    ['Girafe', 'Une girafe'],
    ['Zèbre', 'Un zebre'],
    ['Panda géant', 'Un panda'],
    ['Koala', 'Un koala'],
    ['Kangourou', 'Un kangourou'],
    ['Manchot empereur', 'Un manchot'],
    ['Dauphin', 'Un dauphin'],
    ['Rorqual bleu', 'Une baleine bleue'],
    ['Grand requin blanc', 'Un requin blanc'],
    ['Pieuvre', 'Une pieuvre'],
    ['Méduse (animal)', 'Une meduse'],
    ['Hippopotame amphibie', 'Un hippopotame'],
    ['Rhinocéros', 'Un rhinoceros'],
    ['Crocodile du Nil', 'Un crocodile'],
    ['Caméléon', 'Un cameleon'],
    ['Iguane', 'Un iguane'],
    ['Flamant rose', 'Un flamant rose'],
    ['Effraie des clochers', 'Une chouette'],
    ['Aigle royal', 'Un aigle'],
    ['Ara macao', 'Un perroquet'],
    ['Paon bleu', 'Un paon'],
    ['Autruche', 'Une autruche'],
    ['Chameau', 'Un chameau'],
    ['Lama (animal)', 'Un lama'],
    ['Renard roux', 'Un renard'],
    ['Loup gris', 'Un loup'],
    ['Ours blanc', 'Un ours polaire'],
    ['Écureuil roux', 'Un ecureuil'],
    ['Hérisson', 'Un herisson'],
    ['Abeille', 'Une abeille'],
    ['Escargot', 'Un escargot'],
    ['Hippocampe (poisson)', 'Un hippocampe'],
    ['Toucan toco', 'Un toucan'],
    ['Suricate', 'Un suricate'],
    ['Paresseux', 'Un paresseux']
  ],

  'Nourriture': [
    ['Pizza', 'Une pizza'],
    ['Sushi', 'Des sushis'],
    ['Croissant (viennoiserie)', 'Un croissant'],
    ['Baguette (pain)', 'Une baguette'],
    ['Hamburger', 'Un hamburger'],
    ['Paella', 'Une paella'],
    ['Ramen', 'Un ramen'],
    ['Fondue savoyarde', 'Une fondue'],
    ['Raclette (plat)', 'Une raclette'],
    ['Couscous', 'Un couscous'],
    ['Macaron', 'Des macarons'],
    ['Crêpe', 'Une crepe'],
    ['Tiramisu', 'Un tiramisu'],
    ['Cheesecake', 'Un cheesecake'],
    ['Pop-corn', 'Du pop-corn'],
    ['Frite', 'Des frites'],
    ['Hot-dog', 'Un hot-dog'],
    ['Kebab', 'Un kebab'],
    ['Guacamole', 'Du guacamole'],
    ['Houmous', 'Du houmous'],
    ['Lasagnes', 'Des lasagnes'],
    ['Foie gras', 'Du foie gras'],
    ['Camembert (fromage)', 'Un camembert'],
    ['Baklava', 'Un baklava'],
    ['Churro', 'Des churros'],
    ['Doughnut', 'Un donut'],
    ['Bretzel', 'Un bretzel'],
    ['Sandwich', 'Un sandwich'],
    ['Soupe à l\'oignon', 'Une soupe a l oignon'],
    ['Tarte Tatin', 'Une tarte Tatin']
  ],

  'Fruits et légumes': [
    ['Ananas', 'Un ananas'],
    ['Avocat (fruit)', 'Un avocat'],
    ['Banane', 'Une banane'],
    ['Fraise', 'Des fraises'],
    ['Kiwi (fruit)', 'Un kiwi'],
    ['Mangue', 'Une mangue'],
    ['Pastèque', 'Une pasteque'],
    ['Grenade (fruit)', 'Une grenade'],
    ['Citron', 'Un citron'],
    ['Artichaut', 'Un artichaut'],
    ['Aubergine', 'Une aubergine'],
    ['Brocoli', 'Un brocoli'],
    ['Courgette', 'Une courgette'],
    ['Poivron', 'Un poivron'],
    ['Agaricus bisporus', 'Un champignon de Paris'],
    ['Noix de coco', 'Une noix de coco'],
    ['Figue', 'Une figue'],
    ['Datte', 'Des dattes'],
    ['Framboise', 'Des framboises'],
    ['Potiron', 'Un potiron']
  ],

  'Objets': [
    ['Montgolfière', 'Une montgolfiere'],
    ['Sous-marin', 'Un sous-marin'],
    ['Hélicoptère', 'Un helicoptere'],
    ['Locomotive à vapeur', 'Une locomotive a vapeur'],
    ['Tramway', 'Un tramway'],
    ['Gondole (embarcation)', 'Une gondole'],
    ['Bicyclette', 'Un velo'],
    ['Planche à roulettes', 'Un skateboard'],
    ['Machine à écrire', 'Une machine a ecrire'],
    ['Tourne-disque', 'Un tourne-disque'],
    ["Rubik's Cube", 'Un Rubik s Cube'],
    ['Accordéon', 'Un accordeon'],
    ['Violon', 'Un violon'],
    ['Saxophone', 'Un saxophone'],
    ['Harpe', 'Une harpe'],
    ['Cornemuse', 'Une cornemuse'],
    ['Piano', 'Un piano'],
    ['Boussole', 'Une boussole'],
    ['Sablier', 'Un sablier'],
    ['Parachute', 'Un parachute'],
    ['Kayak', 'Un kayak'],
    ['Télescope', 'Un telescope'],
    ['Microscope', 'Un microscope'],
    ['Guitare électrique', 'Une guitare electrique'],
    ['Machine à coudre', 'Une machine a coudre'],
    ['Phare', 'Un phare'],
    ['Moulin à vent', 'Un moulin a vent'],
    ['Grande roue', 'Une grande roue']
  ],

  'Paysages': [
    ['Aurore polaire', 'Une aurore boreale'],
    ['Volcan', 'Un volcan'],
    ['Chutes du Niagara', 'Les chutes du Niagara'],
    ['Sahara', 'Le Sahara'],
    ['Grand Canyon', 'Le Grand Canyon'],
    ['Everest', "L Everest"],
    ['Fjord', 'Un fjord'],
    ['Geyser', 'Un geyser'],
    ['Récif corallien', 'Un recif corallien'],
    ['Banquise', 'La banquise'],
    ['Dune', 'Une dune'],
    ['Forêt tropicale humide', 'Une foret tropicale'],
    ['Arc-en-ciel', 'Un arc-en-ciel'],
    ['Tornade', 'Une tornade'],
    ['Glacier', 'Un glacier'],
    ['Rizière', 'Une riziere'],
    ['Lavande', 'Un champ de lavande'],
    ["Chute d'eau", 'Une cascade']
  ],

  'Sport': [
    ['Football', 'Le football'],
    ['Basket-ball', 'Le basket'],
    ['Tennis', 'Le tennis'],
    ['Escalade', "L escalade"],
    ['Surf', 'Le surf'],
    ['Ski alpin', 'Le ski'],
    ['Judo', 'Le judo'],
    ['Boxe anglaise', 'La boxe'],
    ['Escrime', "L escrime"],
    ['Aviron (sport)', "L aviron"],
    ['Golf', 'Le golf'],
    ['Championnat du monde de Formule 1', 'La Formule 1'],
    ['Rugby à XV', 'Le rugby'],
    ['Handball', 'Le handball'],
    ['Patinage artistique', 'Le patinage artistique'],
    ['Plongeon', 'Le plongeon']
  ]
};

/* ---------------------------------------------------------
   Recuperation

   On interroge l API "action" et non l API REST : elle accepte
   quarante titres par appel, la ou l API REST en demande un par
   requete et repond 429 au bout de vingt. Toute la banque tient
   donc en cinq appels.
   --------------------------------------------------------- */
const API = 'https://fr.wikipedia.org/w/api.php';
const UA = 'TuJouesAKwa/1.0 (jeu de societe ; script de generation ; contact via le depot)';
const PAQUET = 40;

const dodo = ms => new Promise(r => setTimeout(r, ms));

/**
 * La vignette de l article, telle que l API la donne.
 *
 * On ne retouche PAS la largeur dans l url. Wikimedia ne fabrique plus
 * une vignette a la demande pour n importe quelle taille : reecrire
 * "330px-" en "640px-" rend une adresse qui repond 400. C est
 * pithumbsize, dans la requete, qui demande la taille ; le serveur rend
 * ce qu il sait rendre, parfois moins si l original est petit.
 */
function vignette(page) {
  const th = page && page.thumbnail;
  if (!th || !th.source) return null;
  /* Toutes les photos s affichent dans le meme cadre, en 4/3 recadre.
     Une vignette trop petite y serait etiree et floue : on la refuse
     plutot que de melanger des images nettes et des images baveuses. */
  if (Math.min(th.width || 0, th.height || 0) < MINI) return { petite: true };
  return { u: th.source.split('?')[0], w: th.width, h: th.height };
}

/**
 * Rend un dictionnaire titre demande -> url, pour un paquet de titres.
 * Wikipedia normalise les titres et suit les redirections : on
 * remonte ces deux chaines pour retrouver qui repond a quoi.
 */
async function paquet(titres) {
  const url = API + '?action=query&format=json&formatversion=2&redirects=1' +
    '&prop=pageimages&piprop=thumbnail&pithumbsize=' + LARGEUR +
    '&titles=' + encodeURIComponent(titres.join('|'));
  /* Wikipedia limite les appels par adresse IP et repond 429 quand on
     insiste. Ce n est pas une erreur, c est une demande d attendre :
     on attend, de plus en plus longtemps, au lieu de perdre le paquet. */
  let r = null;
  for (let essai = 0; essai < 5; essai++) {
    r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (r.status !== 429) break;
    const attente = 4000 * (essai + 1);
    console.log('    (429 : on patiente ' + (attente / 1000) + 's)');
    await dodo(attente);
  }
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  const q = j.query || {};

  /* de mon titre vers le titre final de l article */
  const suite = {};
  (q.normalized || []).forEach(n => { suite[n.from] = n.to; });
  (q.redirects || []).forEach(n => { suite[n.from] = n.to; });
  const final = t => { let x = t, n = 0; while (suite[x] && n++ < 5) x = suite[x]; return x; };

  const parTitre = {};
  (q.pages || []).forEach(p => { parTitre[p.title] = p; });

  const out = {};
  titres.forEach(t => {
    const p = parTitre[final(t)];
    out[t] = p ? vignette(p) : null;
  });
  return out;
}

(async () => {
  const gardees = [];
  const perdues = [];

  for (const cat of Object.keys(BANQUE)) {
    const entrees = BANQUE[cat];
    let ok = 0;
    for (let i = 0; i < entrees.length; i += PAQUET) {
      const lot = entrees.slice(i, i + PAQUET);
      let rep;
      try {
        rep = await paquet(lot.map(e => e[0]));
      } catch (e) {
        lot.forEach(([t]) => perdues.push(t + ' — ' + e.message));
        continue;
      }
      lot.forEach(([titre, reponse]) => {
        const v = rep[titre];
        if (!v) perdues.push(titre + ' — aucune photo');
        else if (v.petite) perdues.push(titre + ' — vignette trop petite');
        else { gardees.push({ r: reponse, c: cat, u: v.u, w: v.w, h: v.h }); ok++; }
      });
      await dodo(1500);
    }
    console.log('  ' + cat + ' : ' + ok + '/' + entrees.length);
  }

  /* On va chercher chaque image pour de vrai. L API peut donner une
     adresse que le serveur d images refuse ensuite : mieux vaut le
     decouvrir ici que sur le telephone de quelqu un, un vendredi soir,
     au milieu d une partie. */
  console.log('\n  verification des ' + gardees.length + ' images...');
  const valides = [];
  for (const g of gardees) {
    try {
      let r = null;
      for (let essai = 0; essai < 4; essai++) {
        r = await fetch(g.u, { method: 'HEAD', headers: { 'User-Agent': UA } });
        if (r.status !== 429) break;      /* on nous demande d attendre, on attend */
        await dodo(3000 * (essai + 1));
      }
      const type = r.headers.get('content-type') || '';
      if (r.ok && type.startsWith('image/')) valides.push(g);
      else perdues.push(g.r + ' — image injoignable (' + r.status + ' ' + type + ')');
    } catch (e) {
      perdues.push(g.r + ' — image injoignable (' + e.message + ')');
    }
    await dodo(120);
  }
  console.log('  ' + valides.length + '/' + gardees.length + ' images repondent');

  if (perdues.length) {
    console.log('\n  ecartees :');
    perdues.forEach(p => console.log('    - ' + p));
  }

  /* une categorie de moins de quatre photos ne peut pas fournir ses
     propres mauvaises reponses : elle ne sert a rien */
  const parCat = {};
  valides.forEach(g => { parCat[g.c] = (parCat[g.c] || 0) + 1; });
  const retenues = valides.filter(g => parCat[g.c] >= 4);

  const fichier =
`/* =========================================================
   LE CLICHE — la banque de photos

   Genere par tools/cliche.js, ne pas editer a la main.
   Les images viennent de Wikimedia Commons et sont chargees
   directement : aucune cle, aucun appel d API pendant la
   partie. Pour ajouter des photos, completer la liste dans
   tools/cliche.js et relancer le script.

   ${retenues.length} photos · ${Object.keys(parCat).length} categories
   ========================================================= */
window.KWA = window.KWA || {};
KWA.CLICHES = [
${retenues.map(g => '  { r: ' + JSON.stringify(g.r) + ', c: ' + JSON.stringify(g.c) +
                    ', u: ' + JSON.stringify(g.u) + ' }').join(',\n')}
];
`;

  fs.writeFileSync(SORTIE, fichier);
  console.log('\n' + retenues.length + ' photos ecrites dans js/data/cliche.js');
  Object.keys(parCat).forEach(c => console.log('  ' + c + ' : ' + parCat[c]));
})();
