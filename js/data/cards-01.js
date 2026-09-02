/* =========================================================
   CARTES 001-020 — SERIES TV
   q = question, o = propositions (facultatif), a = index de
   la bonne reponse (QCM) ou texte de la reponse (libre)
   Niveau 1 = cadeau ... Niveau 10 = suicidaire
   ========================================================= */
window.KWA = window.KWA || {};
KWA.CARDS = (KWA.CARDS || []).concat([

{ t: 'Les Simpson', c: 'Serie', q: [
  { q: 'De quelle couleur sont les personnages des Simpson ?', o: ['Jaunes', 'Verts', 'Bleus', 'Roses'], a: 0 },
  { q: 'Comment s appelle le pere de famille ?', o: ['Homer', 'Harold', 'Hector', 'Hugo'], a: 0 },
  { q: 'Dans quelle ville vivent les Simpson ?', o: ['Springfield', 'Shelbyville', 'Quahog', 'Capital City'], a: 0 },
  { q: 'Combien d enfants ont Homer et Marge ?', o: ['3', '2', '4', '5'], a: 0 },
  { q: 'Quel animal de compagnie porte le nom de "Petit Papa Noel" ?', o: ['Un chien', 'Un chat', 'Un hamster', 'Un serpent'], a: 0 },
  { q: 'Quel est le metier d Homer a la centrale nucleaire ?', o: ['Inspecteur de securite', 'Ingenieur', 'Gardien', 'Directeur'], a: 0 },
  { q: 'Comment s appelle le voisin tres croyant des Simpson ?', a: 'Ned Flanders' },
  { q: 'Comment s appelle le bar ou Homer boit sa biere ?', a: 'Le bar de Moe (Moe s Tavern)' },
  { q: 'Qui a cree la serie ?', a: 'Matt Groening' },
  { q: 'En quelle annee a ete diffuse le premier episode de la serie ?', a: '1989' }
]},

{ t: 'Friends', c: 'Serie', q: [
  { q: 'Combien y a-t-il de personnages principaux ?', o: ['6', '4', '5', '7'], a: 0 },
  { q: 'Dans quelle ville se deroule la serie ?', o: ['New York', 'Chicago', 'Boston', 'Los Angeles'], a: 0 },
  { q: 'Comment s appelle le cafe ou ils se retrouvent ?', o: ['Central Perk', 'Central Park', 'Coffee Bay', 'Java House'], a: 0 },
  { q: 'Quel lien unit Ross et Monica ?', o: ['Frere et soeur', 'Cousins', 'Rien', 'Maries'], a: 0 },
  { q: 'Quel est le metier de Ross ?', o: ['Paleontologue', 'Avocat', 'Chef cuisinier', 'Publicitaire'], a: 0 },
  { q: 'Quelle chanson culte Phoebe interprete-t-elle ?', o: ['Smelly Cat', 'Dirty Dog', 'Lonely Bird', 'Crazy Fish'], a: 0 },
  { q: 'Quels animaux Joey et Chandler ont-ils adoptes ?', a: 'Un poussin et un canard' },
  { q: 'Quel acteur joue Chandler Bing ?', a: 'Matthew Perry' },
  { q: 'Combien de saisons compte la serie ?', a: '10' },
  { q: 'En quelle annee a ete diffuse le premier episode ?', a: '1994' }
]},

{ t: 'Game of Thrones', c: 'Serie', q: [
  { q: 'Quel objet tout le monde veut-il conquerir ?', o: ['Le Trone de Fer', 'La Couronne d Or', 'Le Sceptre', 'Le Graal'], a: 0 },
  { q: 'Quel animal figure sur le blason des Stark ?', o: ['Le loup', 'Le lion', 'Le dragon', 'Le cerf'], a: 0 },
  { q: 'Quel animal figure sur le blason des Lannister ?', o: ['Le lion', 'Le loup', 'Le poulpe', 'Le faucon'], a: 0 },
  { q: 'Quelle est la devise de la maison Stark ?', o: ['L hiver vient', 'Le feu monte', 'La nuit tombe', 'Le sang coule'], a: 0 },
  { q: 'Combien de dragons Daenerys fait-elle eclore ?', o: ['3', '2', '4', '1'], a: 0 },
  { q: 'Comment appelle-t-on la gigantesque fortification qui protege le Nord ?', o: ['Le Mur', 'La Barriere', 'Le Rempart', 'La Muraille'], a: 0 },
  { q: 'Comment appelle-t-on les creatures glacees venues du Nord ?', a: 'Les Marcheurs Blancs' },
  { q: 'Qui a ecrit les romans a l origine de la serie ?', a: 'George R. R. Martin' },
  { q: 'Comment s appellent les trois dragons de Daenerys ?', a: 'Drogon, Rhaegal et Viserion' },
  { q: 'En quelle annee a ete diffuse le premier episode ?', a: '2011' }
]},

{ t: 'Breaking Bad', c: 'Serie', q: [
  { q: 'De quelle couleur est la drogue fabriquee par Walter White ?', o: ['Bleue', 'Verte', 'Rouge', 'Jaune'], a: 0 },
  { q: 'Quel etait le metier de Walter White avant tout ca ?', o: ['Professeur de chimie', 'Pharmacien', 'Medecin', 'Comptable'], a: 0 },
  { q: 'Comment s appelle son jeune associe ?', o: ['Jesse Pinkman', 'Jimmy McGill', 'Todd Alquist', 'Skinny Pete'], a: 0 },
  { q: 'Quel pseudonyme Walter se donne-t-il ?', o: ['Heisenberg', 'Schrodinger', 'Einstein', 'Bohr'], a: 0 },
  { q: 'Quelle maladie declenche toute l histoire ?', o: ['Un cancer du poumon', 'Un diabete', 'Une leucemie', 'Un AVC'], a: 0 },
  { q: 'Pour quelle agence travaille le beau-frere de Walter ?', o: ['La DEA', 'Le FBI', 'La CIA', 'La NSA'], a: 0 },
  { q: 'Dans quelle ville se deroule la serie ?', a: 'Albuquerque (Nouveau-Mexique)' },
  { q: 'Comment s appelle l avocat vereux de la serie ?', a: 'Saul Goodman' },
  { q: 'Quelle chaine de restauration sert de couverture a Gus Fring ?', a: 'Los Pollos Hermanos' },
  { q: 'En quelle annee a ete diffuse le premier episode ?', a: '2008' }
]},

{ t: 'Stranger Things', c: 'Serie', q: [
  { q: 'Dans quelle decennie se deroule la serie ?', o: ['Les annees 80', 'Les annees 70', 'Les annees 90', 'Les annees 2000'], a: 0 },
  { q: 'Comment s appelle la fille aux pouvoirs ?', o: ['Eleven', 'Nine', 'Seven', 'Twelve'], a: 0 },
  { q: 'Comment s appelle la ville de la serie ?', o: ['Hawkins', 'Haddonfield', 'Derry', 'Riverdale'], a: 0 },
  { q: 'A quel jeu de societe jouent les garcons ?', o: ['Donjons et Dragons', 'Monopoly', 'Cluedo', 'Risk'], a: 0 },
  { q: 'Quelle friandise Eleven adore-t-elle ?', o: ['Les gaufres', 'Les donuts', 'Les cookies', 'Les pancakes'], a: 0 },
  { q: 'Comment s appelle le monde parallele ?', o: ['Le Monde a l Envers', 'Le Monde d En Bas', 'L Autre Cote', 'La Zone Morte'], a: 0 },
  { q: 'Dans quel Etat americain se situe Hawkins ?', a: 'L Indiana' },
  { q: 'Comment s appelle le chef de la police ?', a: 'Jim Hopper' },
  { q: 'Qui sont les createurs de la serie ?', a: 'Les freres Duffer' },
  { q: 'En quelle annee est sortie la premiere saison ?', a: '2016' }
]},

{ t: 'The Office', c: 'Serie', q: [
  { q: 'Que vend l entreprise de la serie ?', o: ['Du papier', 'Des ordinateurs', 'Des assurances', 'Des voitures'], a: 0 },
  { q: 'Comment s appelle l entreprise ?', o: ['Dunder Mifflin', 'Wernham Hogg', 'Vandelay', 'Sterling Cooper'], a: 0 },
  { q: 'Qui dirige la succursale ?', o: ['Michael Scott', 'Dwight Schrute', 'Jim Halpert', 'Toby Flenderson'], a: 0 },
  { q: 'Quel acteur joue Michael Scott ?', o: ['Steve Carell', 'Will Ferrell', 'Ben Stiller', 'Ricky Gervais'], a: 0 },
  { q: 'Quel personnage cultive des betteraves dans sa ferme ?', o: ['Dwight Schrute', 'Kevin Malone', 'Creed Bratton', 'Stanley Hudson'], a: 0 },
  { q: 'Quel couple emblematique se forme au fil des saisons ?', o: ['Jim et Pam', 'Ryan et Kelly', 'Angela et Andy', 'Michael et Jan'], a: 0 },
  { q: 'Dans quelle ville se deroule la serie ?', a: 'Scranton (Pennsylvanie)' },
  { q: 'De quelle serie britannique est-ce l adaptation ?', a: 'The Office, de Ricky Gervais' },
  { q: 'Combien de saisons compte la version americaine ?', a: '9' },
  { q: 'En quelle annee a ete diffuse le premier episode americain ?', a: '2005' }
]},

{ t: 'La Casa de Papel', c: 'Serie', q: [
  { q: 'De quelle couleur sont les combinaisons des braqueurs ?', o: ['Rouge', 'Bleue', 'Noire', 'Blanche'], a: 0 },
  { q: 'Quel artiste inspire les masques des braqueurs ?', o: ['Salvador Dali', 'Pablo Picasso', 'Andy Warhol', 'Frida Kahlo'], a: 0 },
  { q: 'Comment surnomme-t-on le cerveau de l operation ?', o: ['Le Professeur', 'Le Docteur', 'Le Maitre', 'L Architecte'], a: 0 },
  { q: 'Les noms de code des braqueurs sont des noms de...', o: ['Villes', 'Animaux', 'Planetes', 'Fleurs'], a: 0 },
  { q: 'Quelle chanson est devenue l hymne de la serie ?', o: ['Bella Ciao', 'La Bamba', 'Volare', 'Despacito'], a: 0 },
  { q: 'De quel pays vient la serie ?', o: ['Espagne', 'Italie', 'Mexique', 'Argentine'], a: 0 },
  { q: 'Quel batiment est braque dans la premiere partie ?', a: 'La Fabrique nationale de la monnaie espagnole' },
  { q: 'Quel batiment est braque dans la troisieme partie ?', a: 'La Banque d Espagne' },
  { q: 'Comment s appelle l inspectrice qui negocie au debut ?', a: 'Raquel Murillo' },
  { q: 'En quelle annee la serie a-t-elle ete diffusee pour la premiere fois ?', a: '2017' }
]},

{ t: 'Squid Game', c: 'Serie', q: [
  { q: 'De quel pays vient la serie ?', o: ['Coree du Sud', 'Japon', 'Chine', 'Thailande'], a: 0 },
  { q: 'De quelle couleur sont les survetements des joueurs ?', o: ['Vert', 'Rouge', 'Bleu', 'Blanc'], a: 0 },
  { q: 'Quel est le tout premier jeu de la competition ?', o: ['1-2-3 soleil', 'Le tir a la corde', 'Les billes', 'La marelle'], a: 0 },
  { q: 'Sur quelle plateforme la serie est-elle sortie ?', o: ['Netflix', 'Prime Video', 'Disney+', 'Apple TV+'], a: 0 },
  { q: 'Quelles formes ornent les masques des gardes ?', o: ['Rond, triangle, carre', 'Etoile, lune, soleil', 'Coeur, pique, trefle', 'Croix, cercle, losange'], a: 0 },
  { q: 'Quelle friandise doit-on decouper sans la casser ?', o: ['Le dalgona', 'Le mochi', 'Le kimbap', 'Le tteok'], a: 0 },
  { q: 'Quel est le numero du personnage principal Seong Gi-hun ?', a: '456' },
  { q: 'Combien de joueurs participent au depart ?', a: '456' },
  { q: 'Qui a cree et realise la serie ?', a: 'Hwang Dong-hyuk' },
  { q: 'En quelle annee la premiere saison est-elle sortie ?', a: '2021' }
]},

{ t: 'Peaky Blinders', c: 'Serie', q: [
  { q: 'Dans quelle ville anglaise se deroule la serie ?', o: ['Birmingham', 'Londres', 'Manchester', 'Liverpool'], a: 0 },
  { q: 'Comment s appelle la famille au centre de l histoire ?', o: ['Shelby', 'Peaky', 'Solomons', 'Campbell'], a: 0 },
  { q: 'Quel est le prenom du chef de la famille ?', o: ['Thomas', 'Arthur', 'John', 'Michael'], a: 0 },
  { q: 'Que cachent-ils, selon la legende, dans leurs casquettes ?', o: ['Des lames de rasoir', 'Des pieces d or', 'Des cles', 'Du tabac'], a: 0 },
  { q: 'Quel acteur incarne Thomas Shelby ?', o: ['Cillian Murphy', 'Tom Hardy', 'Sam Neill', 'Paul Anderson'], a: 0 },
  { q: 'Apres quel evenement historique commence la serie ?', o: ['La Premiere Guerre mondiale', 'La Seconde Guerre mondiale', 'La crise de 1929', 'La guerre des Boers'], a: 0 },
  { q: 'Comment s appelle la tante qui dirige la famille avec Tommy ?', a: 'Polly (Elizabeth Gray)' },
  { q: 'Quel groupe interprete le generique "Red Right Hand" ?', a: 'Nick Cave and the Bad Seeds' },
  { q: 'Combien de saisons compte la serie ?', a: '6' },
  { q: 'En quelle annee a ete diffuse le premier episode ?', a: '2013' }
]},

{ t: 'Kaamelott', c: 'Serie', q: [
  { q: 'Quel roi est le heros de la serie ?', o: ['Arthur', 'Lancelot', 'Merlin', 'Karadoc'], a: 0 },
  { q: 'Quel objet tout le monde cherche-t-il ?', o: ['Le Graal', 'Excalibur', 'La couronne', 'Le tresor'], a: 0 },
  { q: 'Qui a cree la serie et joue le roi Arthur ?', o: ['Alexandre Astier', 'Franck Pitiot', 'Thomas Cousseau', 'Jean-Christophe Hembert'], a: 0 },
  { q: 'Sur quelle chaine la serie a-t-elle ete diffusee ?', o: ['M6', 'TF1', 'France 2', 'Canal+'], a: 0 },
  { q: 'Quel duo de chevaliers est celebre pour sa betise ?', o: ['Perceval et Karadoc', 'Lancelot et Bohort', 'Leodagan et Yvain', 'Merlin et Elias'], a: 0 },
  { q: 'Comment s appelle la reine, epouse d Arthur ?', o: ['Guenievre', 'Morgane', 'Demetra', 'Mevanwi'], a: 0 },
  { q: 'Comment appelle-t-on les saisons de la serie ?', a: 'Des Livres (Livre I a Livre VI)' },
  { q: 'Quel est le titre du film sorti au cinema en 2021 ?', a: 'Kaamelott - Premier Volet' },
  { q: 'Comment s appelle le pere de Guenievre, roi de Carmelide ?', a: 'Leodagan' },
  { q: 'En quelle annee la serie a-t-elle ete diffusee pour la premiere fois ?', a: '2005' }
]},

{ t: 'South Park', c: 'Serie', q: [
  { q: 'De quelle couleur est la parka de Kenny ?', o: ['Orange', 'Verte', 'Bleue', 'Rouge'], a: 0 },
  { q: 'Quel personnage meurt dans presque chaque episode des debuts ?', o: ['Kenny', 'Stan', 'Kyle', 'Cartman'], a: 0 },
  { q: 'Dans quel Etat americain se trouve South Park ?', o: ['Le Colorado', 'Le Texas', 'Le Montana', 'L Oregon'], a: 0 },
  { q: 'Quel est le prenom de Cartman ?', o: ['Eric', 'Erik', 'Edward', 'Elliot'], a: 0 },
  { q: 'Comment est realisee la serie a l origine ?', o: ['En papier decoupe', 'En pate a modeler', 'En 3D', 'En prises de vues reelles'], a: 0 },
  { q: 'Comment s appelle le professeur de l ecole primaire ?', o: ['M. Garrison', 'M. Mackey', 'M. Hankey', 'Chef'], a: 0 },
  { q: 'Qui sont les deux createurs de la serie ?', a: 'Trey Parker et Matt Stone' },
  { q: 'Quel est le titre du film sorti en 1999 ?', a: 'South Park, le film' },
  { q: 'Quel conseiller d education repete "M kay" ?', a: 'M. Mackey' },
  { q: 'En quelle annee le premier episode a-t-il ete diffuse ?', a: '1997' }
]},

{ t: 'How I Met Your Mother', c: 'Serie', q: [
  { q: 'Combien d amis composent la bande ?', o: ['5', '4', '6', '7'], a: 0 },
  { q: 'Qui raconte l histoire a ses enfants ?', o: ['Ted', 'Barney', 'Marshall', 'Lily'], a: 0 },
  { q: 'Dans quelle ville se deroule la serie ?', o: ['New York', 'Chicago', 'Seattle', 'Philadelphie'], a: 0 },
  { q: 'Comment s appelle le bar de la bande ?', o: ['MacLaren s', 'Central Perk', 'Paddy s', 'Cheers'], a: 0 },
  { q: 'Quel est le metier de Ted ?', o: ['Architecte', 'Avocat', 'Medecin', 'Journaliste'], a: 0 },
  { q: 'Quel objet jaune symbolise la rencontre ?', o: ['Un parapluie', 'Un taxi', 'Un manteau', 'Un velo'], a: 0 },
  { q: 'Quel acteur joue Barney Stinson ?', a: 'Neil Patrick Harris' },
  { q: 'Quel est le mot fetiche de Barney, coupe en deux ?', a: 'Legen... dary (legendaire)' },
  { q: 'Combien de saisons compte la serie ?', a: '9' },
  { q: 'En quelle annee a ete diffuse le premier episode ?', a: '2005' }
]},

{ t: 'Sherlock (BBC)', c: 'Serie', q: [
  { q: 'Dans quelle ville enquete Sherlock ?', o: ['Londres', 'Edimbourg', 'Dublin', 'Manchester'], a: 0 },
  { q: 'Quel acteur incarne Sherlock Holmes ?', o: ['Benedict Cumberbatch', 'Martin Freeman', 'Tom Hiddleston', 'Andrew Scott'], a: 0 },
  { q: 'Comment s appelle son fidele acolyte ?', o: ['John Watson', 'James Moriarty', 'Greg Lestrade', 'Mycroft'], a: 0 },
  { q: 'Quelle est l adresse de Sherlock ?', o: ['221B Baker Street', '10 Downing Street', '4 Privet Drive', '12 Grimmauld Place'], a: 0 },
  { q: 'Qui est son ennemi jure ?', o: ['Moriarty', 'Magnussen', 'Mycroft', 'Irene Adler'], a: 0 },
  { q: 'Sur quelle chaine la serie est-elle diffusee ?', o: ['BBC', 'ITV', 'Channel 4', 'Sky'], a: 0 },
  { q: 'Combien d episodes compte chaque saison ?', a: '3' },
  { q: 'Comment s appelle le frere de Sherlock ?', a: 'Mycroft Holmes' },
  { q: 'Qui sont les deux createurs de la serie ?', a: 'Steven Moffat et Mark Gatiss' },
  { q: 'En quelle annee a ete diffuse le premier episode ?', a: '2010' }
]},

{ t: 'The Walking Dead', c: 'Serie', q: [
  { q: 'Quelles creatures menacent les survivants ?', o: ['Des zombies', 'Des vampires', 'Des extraterrestres', 'Des robots'], a: 0 },
  { q: 'Quel est le metier du heros Rick avant l apocalypse ?', o: ['Sherif adjoint', 'Pompier', 'Medecin', 'Militaire'], a: 0 },
  { q: 'Comment appelle-t-on les zombies dans la serie ?', o: ['Des rodeurs', 'Des infectes', 'Des errants', 'Des mordus'], a: 0 },
  { q: 'Quelle est l arme fetiche de Daryl ?', o: ['Une arbalete', 'Un katana', 'Une batte', 'Un fusil a pompe'], a: 0 },
  { q: 'Quelle arme Negan utilise-t-il ?', o: ['Une batte de baseball barbelee', 'Une machette', 'Un marteau', 'Une hache'], a: 0 },
  { q: 'Dans quel Etat americain commence la serie ?', o: ['La Georgie', 'La Virginie', 'La Floride', 'Le Texas'], a: 0 },
  { q: 'Comment s appelle la batte de Negan ?', a: 'Lucille' },
  { q: 'De quelle oeuvre la serie est-elle adaptee ?', a: 'Le comics de Robert Kirkman' },
  { q: 'Combien de saisons compte la serie principale ?', a: '11' },
  { q: 'En quelle annee a ete diffuse le premier episode ?', a: '2010' }
]},

{ t: 'Black Mirror', c: 'Serie', q: [
  { q: 'Quel est le grand theme de la serie ?', o: ['La technologie', 'La magie', 'La medecine', 'La politique'], a: 0 },
  { q: 'Quel est le format de la serie ?', o: ['Une anthologie', 'Un feuilleton', 'Un docu-fiction', 'Une sitcom'], a: 0 },
  { q: 'De quel pays vient la serie ?', o: ['Royaume-Uni', 'Etats-Unis', 'Canada', 'Australie'], a: 0 },
  { q: 'Quel episode est interactif ?', o: ['Bandersnatch', 'Nosedive', 'San Junipero', 'Playtest'], a: 0 },
  { q: 'Sur quelle plateforme la serie a-t-elle continue apres ses debuts ?', o: ['Netflix', 'HBO', 'Hulu', 'Amazon'], a: 0 },
  { q: 'Quel episode met en scene une societe ou l on note les gens ?', o: ['Chute libre (Nosedive)', 'White Bear', 'The Entire History of You', 'Shut Up and Dance'], a: 0 },
  { q: 'Qui est le createur de la serie ?', a: 'Charlie Brooker' },
  { q: 'Quel episode se deroule dans une station balneaire virtuelle des annees 80 ?', a: 'San Junipero' },
  { q: 'Sur quelle chaine britannique la serie a-t-elle demarre ?', a: 'Channel 4' },
  { q: 'En quelle annee a ete diffuse le premier episode ?', a: '2011' }
]},

{ t: 'Dr House', c: 'Serie', q: [
  { q: 'Quel accessoire House utilise-t-il pour marcher ?', o: ['Une canne', 'Un fauteuil', 'Des bequilles', 'Une attelle'], a: 0 },
  { q: 'Quel acteur incarne le docteur House ?', o: ['Hugh Laurie', 'Robert Sean Leonard', 'Omar Epps', 'Jesse Spencer'], a: 0 },
  { q: 'Quelle est la specialite de son service ?', o: ['Le diagnostic', 'La chirurgie', 'La pediatrie', 'La cardiologie'], a: 0 },
  { q: 'A quel medicament House est-il accro ?', o: ['La Vicodine', 'La morphine', 'Le Valium', 'La codeine'], a: 0 },
  { q: 'Qui est son meilleur ami a l hopital ?', o: ['Wilson', 'Chase', 'Foreman', 'Cameron'], a: 0 },
  { q: 'Selon la phrase culte, ce n est jamais...', o: ['Un lupus', 'Une grippe', 'Un cancer', 'Une allergie'], a: 0 },
  { q: 'Comment s appelle la directrice de l hopital ?', a: 'Lisa Cuddy' },
  { q: 'Comment s appelle l hopital de la serie ?', a: 'Princeton-Plainsboro' },
  { q: 'Combien de saisons compte la serie ?', a: '8' },
  { q: 'En quelle annee a ete diffuse le premier episode ?', a: '2004' }
]},

{ t: 'Lost', c: 'Serie', q: [
  { q: 'Quel evenement lance la serie ?', o: ['Un crash d avion', 'Un naufrage', 'Un tremblement de terre', 'Une eruption'], a: 0 },
  { q: 'Ou les survivants se retrouvent-ils ?', o: ['Sur une ile', 'Dans un desert', 'En montagne', 'Sur une banquise'], a: 0 },
  { q: 'Quel est le metier du heros Jack ?', o: ['Chirurgien', 'Pilote', 'Policier', 'Professeur'], a: 0 },
  { q: 'Comment appelle-t-on les mysterieux habitants de l ile ?', o: ['Les Autres', 'Les Anciens', 'Les Ombres', 'Les Gardiens'], a: 0 },
  { q: 'Quel est le numero du vol Oceanic ?', o: ['815', '316', '108', '423'], a: 0 },
  { q: 'Comment s appelle le projet scientifique mene sur l ile ?', o: ['La Dharma Initiative', 'Le Projet Hanso', 'Le Programme Widmore', 'La Fondation Oceanic'], a: 0 },
  { q: 'Quelle est la fameuse suite de chiffres de la serie ?', a: '4 8 15 16 23 42' },
  { q: 'Combien de saisons compte la serie ?', a: '6' },
  { q: 'Quel createur de Lost est aussi connu pour Star Wars VII ?', a: 'J. J. Abrams' },
  { q: 'En quelle annee a ete diffuse le premier episode ?', a: '2004' }
]},

{ t: 'Narcos', c: 'Serie', q: [
  { q: 'Quel trafic est au coeur de la serie ?', o: ['La cocaine', 'L heroine', 'Le cannabis', 'Les armes'], a: 0 },
  { q: 'Dans quel pays se deroulent les deux premieres saisons ?', o: ['La Colombie', 'Le Mexique', 'Le Perou', 'Le Venezuela'], a: 0 },
  { q: 'Quel narcotrafiquant celebre est le personnage central ?', o: ['Pablo Escobar', 'El Chapo', 'Amado Carrillo', 'Griselda Blanco'], a: 0 },
  { q: 'De quelle ville Escobar est-il originaire ?', o: ['Medellin', 'Bogota', 'Cali', 'Carthagene'], a: 0 },
  { q: 'Quelle agence americaine traque Escobar ?', o: ['La DEA', 'Le FBI', 'La CIA', 'L ATF'], a: 0 },
  { q: 'Ou se deroule la serie derivee Narcos: Mexico ?', o: ['Au Mexique', 'Au Guatemala', 'Au Panama', 'Au Bresil'], a: 0 },
  { q: 'Quel acteur bresilien incarne Pablo Escobar ?', a: 'Wagner Moura' },
  { q: 'Comment s appelle la prison de luxe construite par Escobar ?', a: 'La Catedral' },
  { q: 'En quelle annee Pablo Escobar est-il mort ?', a: '1993' },
  { q: 'En quelle annee la serie est-elle sortie sur Netflix ?', a: '2015' }
]},

{ t: 'Chernobyl', c: 'Serie', q: [
  { q: 'Quel type de catastrophe la serie raconte-t-elle ?', o: ['Un accident nucleaire', 'Un tsunami', 'Un crash aerien', 'Un incendie de foret'], a: 0 },
  { q: 'Dans quel pays se trouvait la centrale a l epoque ?', o: ['En URSS', 'En Pologne', 'En Roumanie', 'En Allemagne'], a: 0 },
  { q: 'Sur quelle chaine la serie a-t-elle ete diffusee ?', o: ['HBO', 'Netflix', 'AMC', 'Showtime'], a: 0 },
  { q: 'Combien d episodes compte la mini-serie ?', o: ['5', '6', '8', '4'], a: 0 },
  { q: 'Quel reacteur explose ?', o: ['Le numero 4', 'Le numero 1', 'Le numero 2', 'Le numero 3'], a: 0 },
  { q: 'Quelle ville voisine est evacuee ?', o: ['Pripiat', 'Minsk', 'Kiev', 'Gomel'], a: 0 },
  { q: 'Comment s appelle le scientifique au centre de l enquete ?', a: 'Valeri Legassov' },
  { q: 'Comment surnomme-t-on les hommes envoyes deblayer le toit ?', a: 'Les liquidateurs (les bio-robots)' },
  { q: 'En quelle annee la catastrophe a-t-elle eu lieu ?', a: '1986' },
  { q: 'En quelle annee la serie a-t-elle ete diffusee ?', a: '2019' }
]},

{ t: 'Malcolm', c: 'Serie', q: [
  { q: 'Quelle est la particularite de Malcolm ?', o: ['Il est surdoue', 'Il est invisible', 'Il est riche', 'Il est sportif'], a: 0 },
  { q: 'Comment s appelle la mere de famille ?', o: ['Lois', 'Louise', 'Linda', 'Laura'], a: 0 },
  { q: 'Comment s appelle le pere ?', o: ['Hal', 'Hank', 'Harry', 'Hugo'], a: 0 },
  { q: 'Ou est envoye le frere aine Francis au debut ?', o: ['En ecole militaire', 'En prison', 'A l etranger', 'A l universite'], a: 0 },
  { q: 'Comment s appelle le plus jeune frere ?', o: ['Dewey', 'Reese', 'Jamie', 'Francis'], a: 0 },
  { q: 'Quel acteur joue Malcolm ?', o: ['Frankie Muniz', 'Justin Berfield', 'Christopher Masterson', 'Erik Per Sullivan'], a: 0 },
  { q: 'Quel est le titre original de la serie ?', a: 'Malcolm in the Middle' },
  { q: 'Quel groupe interprete la chanson du generique "Boss of Me" ?', a: 'They Might Be Giants' },
  { q: 'Combien de saisons compte la serie ?', a: '7' },
  { q: 'En quelle annee a ete diffuse le premier episode ?', a: '2000' }
]}

]);
