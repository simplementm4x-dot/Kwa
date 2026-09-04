/* =========================================================
   VARIANTES — SERIES TV (1/4)

   Trois questions de plus par niveau, pour les cartes qui
   existent deja. La carte d origine reste la premiere
   variante : on ne touche a aucun des vingt fichiers de
   cartes, on ajoute a cote.

   Le but est simple : retomber sur "Les Simpson, niveau 3"
   ne doit plus vouloir dire retomber sur la meme question.
   Avec quatre variantes par niveau, il faut jouer le meme
   theme quatre fois AU MEME NIVEAU pour boucler.

   Meme regle que les cartes : niveaux 1 a 6 en QCM, 7 a 10
   en reponse libre, et la difficulte doit vraiment monter.
   ========================================================= */
window.KWA = window.KWA || {};
KWA.VARIANTES = (KWA.VARIANTES || []).concat([

{ t: 'Les Simpson', v: {
  1: [
    { q: 'Comment s appelle la mere de famille ?', o: ['Marge', 'Maggie', 'Mona', 'Mabel'], a: 0 },
    { q: 'Quel aliment Homer adore-t-il par-dessus tout ?', o: ['Le donut', 'La salade', 'Le poisson', 'La soupe'], a: 0 },
    { q: 'De quelle couleur sont les cheveux de Marge ?', o: ['Bleus', 'Roux', 'Blonds', 'Verts'], a: 0 }
  ],
  2: [
    { q: 'Comment s appelle le fils de la famille ?', o: ['Bart', 'Bort', 'Brad', 'Ben'], a: 0 },
    { q: 'De quel instrument joue Lisa ?', o: ['Le saxophone', 'La guitare', 'Le piano', 'La flute'], a: 0 },
    { q: 'Comment s appelle le bebe de la famille ?', o: ['Maggie', 'Molly', 'Mandy', 'Mimi'], a: 0 }
  ],
  3: [
    { q: 'Comment s appelle le meilleur ami de Bart ?', o: ['Milhouse', 'Martin', 'Nelson', 'Ralph'], a: 0 },
    { q: 'Quelle expression Homer lance-t-il quand ca tourne mal ?', o: ['D oh !', 'Oups !', 'Aie !', 'Bon sang !'], a: 0 },
    { q: 'Quel clown anime l emission preferee de Bart ?', o: ['Krusty', 'Bozo', 'Pipo', 'Zigoto'], a: 0 }
  ],
  4: [
    { q: 'Combien de doigts les personnages ont-ils a chaque main ?', o: ['Quatre', 'Cinq', 'Trois', 'Six'], a: 0 },
    { q: 'Qui est le patron d Homer a la centrale ?', o: ['Monsieur Burns', 'Monsieur Smithers', 'Monsieur Skinner', 'Monsieur Moe'], a: 0 },
    { q: 'Quel animal est Boule de Neige ?', o: ['Un chat', 'Un chien', 'Un lapin', 'Un hamster'], a: 0 }
  ],
  5: [
    { q: 'Quel est le prenom du grand-pere Simpson ?', o: ['Abraham', 'Alfred', 'Arthur', 'Albert'], a: 0 },
    { q: 'Comment s appelle le directeur de l ecole ?', o: ['Skinner', 'Chalmers', 'Flanders', 'Willie'], a: 0 },
    { q: 'Quel dessin anime Bart et Lisa regardent-ils ?', o: ['Itchy et Scratchy', 'Tom et Jerry', 'Roadrunner', 'Ren et Stimpy'], a: 0 }
  ],
  6: [
    { q: 'Qui tient le Kwik-E-Mart ?', o: ['Apu', 'Moe', 'Carl', 'Lenny'], a: 0 },
    { q: 'Comment s appelle le chef de la police de Springfield ?', o: ['Wiggum', 'Lou', 'Eddie', 'Snake'], a: 0 },
    { q: 'Quelles sont les soeurs de Marge ?', o: ['Patty et Selma', 'Patty et Sonia', 'Sarah et Selma', 'Paula et Sylvie'], a: 0 }
  ],
  7: [
    { q: 'Comment s appelle le jardinier ecossais de l ecole ?', a: 'Willie (le jardinier Willie)' },
    { q: 'Quel est le nom de famille de Patty et Selma ?', a: 'Bouvier' },
    { q: 'Comment s appelle la ville rivale de Springfield ?', a: 'Shelbyville' }
  ],
  8: [
    { q: 'Quelle chaine americaine diffuse la serie ?', a: 'La Fox' },
    { q: 'Quel est le nom complet du patron de la centrale ?', a: 'Charles Montgomery Burns' },
    { q: 'Comment s appelle l assistant devoue de monsieur Burns ?', a: 'Waylon Smithers' }
  ],
  9: [
    { q: 'En quelle annee le film Les Simpson est-il sorti au cinema ?', a: '2007' },
    { q: 'Comment s appelle le demi-frere d Homer, retrouve dans un episode ?', a: 'Herbert Powell' },
    { q: 'Quel est le vrai nom de Tahiti Bob ?', a: 'Robert Underdunk Terwilliger' }
  ],
  10: [
    { q: 'Dans quelle emission les Simpson sont-ils apparus pour la premiere fois ?', a: 'Le Tracey Ullman Show' },
    { q: 'Quel numero porte la maison des Simpson, avenue Evergreen Terrace ?', a: 'Le 742' },
    { q: 'Comment s appelle la mere d Homer ?', a: 'Mona Simpson' }
  ]
}},

{ t: 'Friends', v: {
  1: [
    { q: 'Quel animal Ross garde-t-il un temps dans son appartement ?', o: ['Un singe', 'Un chien', 'Un perroquet', 'Un lapin'], a: 0 },
    { q: 'Combien de fois Ross a-t-il divorce dans la serie ?', o: ['3', '1', '2', '4'], a: 0 },
    { q: 'Quelle couleur est le cadre accroche a la porte de Monica ?', o: ['Jaune', 'Rouge', 'Vert', 'Bleu'], a: 0 }
  ],
  2: [
    { q: 'Qui sont les deux soeurs de la bande ?', o: ['Personne, Ross et Monica sont frere et soeur', 'Rachel et Phoebe', 'Monica et Rachel', 'Phoebe et Ursula'], a: 0 },
    { q: 'Quel est le metier de Rachel au debut de la serie ?', o: ['Serveuse', 'Styliste', 'Actrice', 'Professeure'], a: 0 },
    { q: 'Comment s appelle le singe de Ross ?', o: ['Marcel', 'Coco', 'Bubbles', 'Charlie'], a: 0 }
  ],
  3: [
    { q: 'Quel est le metier de Monica ?', o: ['Chef cuisiniere', 'Photographe', 'Avocate', 'Journaliste'], a: 0 },
    { q: 'Comment s appelle la soeur jumelle de Phoebe ?', o: ['Ursula', 'Amy', 'Jill', 'Emily'], a: 0 },
    { q: 'Que fait Joey dans la vie ?', o: ['Acteur', 'Cuisinier', 'Musicien', 'Vendeur'], a: 0 }
  ],
  4: [
    { q: 'Comment s appelle la fille de Ross et Rachel ?', o: ['Emma', 'Erica', 'Emily', 'Ella'], a: 0 },
    { q: 'Quel plat Rachel rate-t-elle en melangeant deux recettes ?', o: ['Un trifle', 'Une dinde', 'Un gateau', 'Une lasagne'], a: 0 },
    { q: 'Quelle phrase Joey utilise-t-il pour draguer ?', o: ['How you doin ?', 'Hello you', 'Nice to meet you', 'Come here'], a: 0 }
  ],
  5: [
    { q: 'Quel est le metier de Chandler pendant la majeure partie de la serie ?', o: ['Analyste statistique', 'Publicitaire', 'Banquier', 'Architecte'], a: 0 },
    { q: 'Qui epouse Monica a la fin de la saison 7 ?', o: ['Chandler', 'Richard', 'Pete', 'Joey'], a: 0 },
    { q: 'Quel prenom Ross prononce-t-il par erreur a son mariage avec Emily ?', o: ['Rachel', 'Monica', 'Phoebe', 'Carol'], a: 0 }
  ],
  6: [
    { q: 'Combien de saisons compte la serie ?', o: ['10', '8', '9', '12'], a: 0 },
    { q: 'Comment s appelle la premiere femme de Ross ?', o: ['Carol', 'Emily', 'Susan', 'Janice'], a: 0 },
    { q: 'Quel personnage revient sans cesse avec un rire tres reconnaissable ?', o: ['Janice', 'Ursula', 'Estelle', 'Amy'], a: 0 }
  ],
  7: [
    { q: 'Quel est le nom de famille de Chandler ?', a: 'Bing' },
    { q: 'Comment s appelle le fils de Ross et Carol ?', a: 'Ben' },
    { q: 'Quel groupe interprete le generique de la serie ?', a: 'The Rembrandts' }
  ],
  8: [
    { q: 'Quel est le titre du generique de Friends ?', a: 'I ll Be There for You' },
    { q: 'Quel est le nom de famille de Rachel ?', a: 'Green' },
    { q: 'Comment s appelle le voisin bruyant du dessus chez Monica ?', a: 'Monsieur Heckles' }
  ],
  9: [
    { q: 'En quelle annee a ete diffuse le tout premier episode ?', a: '1994' },
    { q: 'Quel est le nom de famille de Phoebe ?', a: 'Buffay' },
    { q: 'Combien d episodes compte la serie au total ?', a: '236' }
  ],
  10: [
    { q: 'Quel est le nom du chien en ceramique offert par Joey ?', a: 'Pat le chien' },
    { q: 'Comment s appelle le mari de Phoebe ?', a: 'Mike Hannigan' },
    { q: 'Quelle actrice joue Rachel Green ?', a: 'Jennifer Aniston' }
  ]
}},

{ t: 'Game of Thrones', v: {
  1: [
    { q: 'Quel animal est l embleme de la maison Stark ?', o: ['Le loup', 'Le lion', 'Le dragon', 'Le cerf'], a: 0 },
    { q: 'Quel animal est l embleme de la maison Lannister ?', o: ['Le lion', 'Le loup', 'L ours', 'Le faucon'], a: 0 },
    { q: 'Que garde le Mur au nord du royaume ?', o: ['Les marcheurs blancs', 'Les dragons', 'Les pirates', 'Les geants du sud'], a: 0 }
  ],
  2: [
    { q: 'Combien de dragons Daenerys fait-elle eclore ?', o: ['3', '2', '4', '1'], a: 0 },
    { q: 'Comment s appelle le trone que tout le monde convoite ?', o: ['Le Trone de Fer', 'Le Trone d Or', 'Le Trone Noir', 'Le Trone de Pierre'], a: 0 },
    { q: 'Quelle phrase est la devise des Stark ?', o: ['L hiver vient', 'Nous ne semons pas', 'Entends-moi rugir', 'Feu et sang'], a: 0 }
  ],
  3: [
    { q: 'Quel personnage est surnome le Lutin ?', o: ['Tyrion Lannister', 'Petyr Baelish', 'Varys', 'Sam Tarly'], a: 0 },
    { q: 'Comment s appelle la capitale des Sept Couronnes ?', o: ['Port-Real', 'Winterfell', 'Villevieille', 'Peyredragon'], a: 0 },
    { q: 'Quel est le nom du chateau des Stark ?', o: ['Winterfell', 'Castel Noir', 'Vivesaigues', 'Accalmie'], a: 0 }
  ],
  4: [
    { q: 'Qui est surnommee la Mere des Dragons ?', o: ['Daenerys', 'Cersei', 'Sansa', 'Melisandre'], a: 0 },
    { q: 'Quel est le nom de l epee de Ned Stark ?', o: ['Glace', 'Grand-Griffe', 'Aiguille', 'Feu'], a: 0 },
    { q: 'Comment s appelle l epee offerte a Arya par Jon ?', o: ['Aiguille', 'Glace', 'Cle', 'Dent'], a: 0 }
  ],
  5: [
    { q: 'Quelle organisation Jon Snow rejoint-il ?', o: ['La Garde de Nuit', 'La Garde Royale', 'Les Immaculés', 'Les Corbeaux d Or'], a: 0 },
    { q: 'Quel evenement marque la fin de la saison 3 ?', o: ['Les Noces Pourpres', 'Les Noces Noires', 'La bataille de la Neronda', 'Le proces de Tyrion'], a: 0 },
    { q: 'Quel est le nom du loup de Jon Snow ?', o: ['Fantome', 'Ete', 'Nymeria', 'Vent Gris'], a: 0 }
  ],
  6: [
    { q: 'Quelle maison porte la devise "Feu et Sang" ?', o: ['Targaryen', 'Baratheon', 'Tyrell', 'Martell'], a: 0 },
    { q: 'Qui est le chef des Immaculés au service de Daenerys ?', o: ['Ver Gris', 'Jorah', 'Daario', 'Missandei'], a: 0 },
    { q: 'Quel personnage est surnomme le Limier ?', o: ['Sandor Clegane', 'Gregor Clegane', 'Bronn', 'Beric'], a: 0 }
  ],
  7: [
    { q: 'Qui a ecrit les romans dont la serie est tiree ?', a: 'George R. R. Martin' },
    { q: 'Comment s appelle la saga de romans a l origine de la serie ?', a: 'Le Trone de Fer (A Song of Ice and Fire)' },
    { q: 'Quel est le nom des trois dragons de Daenerys ?', a: 'Drogon, Rhaegal et Viserion' }
  ],
  8: [
    { q: 'Quelle chaine americaine a produit la serie ?', a: 'HBO' },
    { q: 'Combien de saisons compte la serie ?', a: 'Huit' },
    { q: 'Quel est le vrai nom de Jon Snow, revele dans la serie ?', a: 'Aegon Targaryen' }
  ],
  9: [
    { q: 'En quelle annee la serie a-t-elle ete diffusee pour la premiere fois ?', a: '2011' },
    { q: 'Comment s appelle le royaume au-dela de la mer Etroite ou vit Daenerys au debut ?', a: 'Essos' },
    { q: 'Qui monte finalement sur le trone a la fin de la serie ?', a: 'Bran Stark' }
  ],
  10: [
    { q: 'Comment s appelle le cheval-seigneur qu epouse Daenerys ?', a: 'Khal Drogo' },
    { q: 'Quelle maison a pour devise "Nous ne semons pas" ?', a: 'La maison Greyjoy' },
    { q: 'Quel acteur incarne Tyrion Lannister ?', a: 'Peter Dinklage' }
  ]
}},

{ t: 'Breaking Bad', v: {
  1: [
    { q: 'Quelle matiere enseigne le personnage principal ?', o: ['La chimie', 'La physique', 'Les maths', 'La biologie'], a: 0 },
    { q: 'De quelle couleur est la drogue fabriquee par Walter ?', o: ['Bleue', 'Rouge', 'Verte', 'Jaune'], a: 0 },
    { q: 'Dans quelle ville se deroule la serie ?', o: ['Albuquerque', 'Phoenix', 'Denver', 'Houston'], a: 0 }
  ],
  2: [
    { q: 'Comment s appelle l ancien eleve devenu associe de Walter ?', o: ['Jesse', 'Todd', 'Skinny Pete', 'Badger'], a: 0 },
    { q: 'Quel vehicule sert de premier laboratoire ?', o: ['Un camping-car', 'Un camion', 'Un bus', 'Une caravane a cheval'], a: 0 },
    { q: 'Quel est le prenom de la femme de Walter ?', o: ['Skyler', 'Marie', 'Jane', 'Lydia'], a: 0 }
  ],
  3: [
    { q: 'Quel est le surnom de Walter dans le milieu ?', o: ['Heisenberg', 'Schrodinger', 'Einstein', 'Bohr'], a: 0 },
    { q: 'Quel est le metier du beau-frere de Walter ?', o: ['Agent de la DEA', 'Policier municipal', 'Avocat', 'Medecin'], a: 0 },
    { q: 'Quelle maladie pousse Walter a se lancer ?', o: ['Un cancer du poumon', 'Un cancer du foie', 'Un diabete', 'Une maladie cardiaque'], a: 0 }
  ],
  4: [
    { q: 'Comment s appelle l avocat vereux de Walter et Jesse ?', o: ['Saul Goodman', 'Mike Ehrmantraut', 'Gus Fring', 'Hank Schrader'], a: 0 },
    { q: 'Quelle chaine de restauration rapide sert de couverture a Gus ?', o: ['Los Pollos Hermanos', 'Pollo Loco', 'El Gallo', 'Casa Pollo'], a: 0 },
    { q: 'Quel est le prenom du fils de Walter ?', o: ['Walter Junior', 'Flynn Junior', 'Hank Junior', 'Tom'], a: 0 }
  ],
  5: [
    { q: 'Quel objet Walter cache-t-il derriere le chauffe-eau ?', o: ['De l argent', 'Une arme', 'Un telephone', 'Des dossiers'], a: 0 },
    { q: 'Comment Walter blanchit-il son argent ?', o: ['Une station de lavage', 'Un garage', 'Un restaurant', 'Une laverie'], a: 0 },
    { q: 'Quel personnage est un ancien flic devenu homme de main ?', o: ['Mike', 'Todd', 'Tuco', 'Krazy-8'], a: 0 }
  ],
  6: [
    { q: 'Comment s appelle la soeur de Skyler ?', o: ['Marie', 'Jane', 'Lydia', 'Andrea'], a: 0 },
    { q: 'Quelle couleur Marie porte-t-elle systematiquement ?', o: ['Le violet', 'Le rouge', 'Le vert', 'Le bleu'], a: 0 },
    { q: 'Combien de saisons compte la serie ?', o: ['5', '4', '6', '7'], a: 0 }
  ],
  7: [
    { q: 'Qui a cree la serie ?', a: 'Vince Gilligan' },
    { q: 'Comment s appelle la serie derivee consacree a l avocat ?', a: 'Better Call Saul' },
    { q: 'Quel est le nom de famille de Jesse ?', a: 'Pinkman' }
  ],
  8: [
    { q: 'Quel est le vrai nom de Saul Goodman ?', a: 'James McGill (Jimmy McGill)' },
    { q: 'Quel element chimique ouvre le generique par son symbole ?', a: 'Le brome et le baryum (Br et Ba)' },
    { q: 'Comment s appelle la petite amie de Jesse morte au debut de la saison 2 ?', a: 'Jane' }
  ],
  9: [
    { q: 'En quelle annee la serie a-t-elle commence ?', a: '2008' },
    { q: 'Quel est le nom complet du personnage principal ?', a: 'Walter White' },
    { q: 'Quel film prolonge la serie sur Netflix en 2019 ?', a: 'El Camino' }
  ],
  10: [
    { q: 'Quel physicien allemand a inspire le surnom de Walter ?', a: 'Werner Heisenberg' },
    { q: 'Comment s appelle le patron de la chaine de poulets ?', a: 'Gustavo Fring' },
    { q: 'Quelle chanson accompagne la scene finale de la serie ?', a: 'Baby Blue de Badfinger' }
  ]
}},

{ t: 'Stranger Things', v: {
  1: [
    { q: 'De quelle couleur sont les cheveux d Eleven au debut ?', o: ['Elle est rasee', 'Blonds longs', 'Roux', 'Noirs longs'], a: 0 },
    { q: 'Quel aliment Eleven adore-t-elle ?', o: ['Les gaufres', 'Les frites', 'La pizza', 'Les glaces'], a: 0 },
    { q: 'Sur quelle plateforme la serie est-elle diffusee ?', o: ['Netflix', 'Disney+', 'Prime Video', 'Canal+'], a: 0 }
  ],
  2: [
    { q: 'Quel garcon disparait dans le tout premier episode ?', o: ['Will', 'Mike', 'Dustin', 'Lucas'], a: 0 },
    { q: 'Quel moyen de transport les enfants utilisent-ils partout ?', o: ['Le velo', 'Le skateboard', 'Le bus', 'La trottinette'], a: 0 },
    { q: 'Quel est le prenom du chef de la police ?', o: ['Jim', 'Bob', 'Ted', 'Sam'], a: 0 }
  ],
  3: [
    { q: 'Comment s appelle le monde parallele de la serie ?', o: ['Le Monde a l Envers', 'Le Monde d en Bas', 'L Autre Cote', 'La Zone'], a: 0 },
    { q: 'Quel est le pouvoir principal d Eleven ?', o: ['La telekinesie', 'La teleportation', 'L invisibilite', 'La super force'], a: 0 },
    { q: 'Quel est le metier de Jim Hopper ?', o: ['Chef de la police', 'Pompier', 'Medecin', 'Professeur'], a: 0 }
  ],
  4: [
    { q: 'Comment la mere de Will communique-t-elle avec lui ?', o: ['Avec des guirlandes de Noel', 'Par telephone', 'Par lettres', 'Par la radio'], a: 0 },
    { q: 'Quel centre commercial ouvre dans la saison 3 ?', o: ['Starcourt', 'Hawkins Mall', 'Palace', 'Northside'], a: 0 },
    { q: 'Quel personnage travaille chez Scoops Ahoy ?', o: ['Steve', 'Jonathan', 'Billy', 'Murray'], a: 0 }
  ],
  5: [
    { q: 'Quelle creature attaque au cours de la premiere saison ?', o: ['Le Demogorgon', 'Le Mind Flayer', 'Vecna', 'Les Demodogs'], a: 0 },
    { q: 'Quel est le prenom de la mere de Will ?', o: ['Joyce', 'Karen', 'Nancy', 'Claudia'], a: 0 },
    { q: 'Quel numero est tatoue sur le bras d Eleven ?', o: ['011', '001', '008', '004'], a: 0 }
  ],
  6: [
    { q: 'Quel laboratoire mene les experiences secretes ?', o: ['Le laboratoire de Hawkins', 'Le laboratoire de Roanoke', 'Le centre Owens', 'L institut Brenner'], a: 0 },
    { q: 'Comment s appelle le grand frere de Will ?', o: ['Jonathan', 'Steve', 'Billy', 'Mike'], a: 0 },
    { q: 'Quelle chanson sauve Max dans la saison 4 ?', o: ['Running Up That Hill', 'Master of Puppets', 'Should I Stay or Should I Go', 'Every Breath You Take'], a: 0 }
  ],
  7: [
    { q: 'Qui a cree la serie ?', a: 'Les freres Duffer' },
    { q: 'Comment s appelle le grand mechant de la saison 4 ?', a: 'Vecna' },
    { q: 'Quelle chanson des Clash rassure Will dans la saison 1 ?', a: 'Should I Stay or Should I Go' }
  ],
  8: [
    { q: 'Quel est le vrai prenom d Eleven ?', a: 'Jane' },
    { q: 'Comment s appelle le scientifique qui eleve Eleven ?', a: 'Le docteur Brenner (Papa)' },
    { q: 'Quel morceau de Metallica joue Eddie dans la saison 4 ?', a: 'Master of Puppets' }
  ],
  9: [
    { q: 'En quelle annee la serie est-elle sortie sur Netflix ?', a: '2016' },
    { q: 'En quelle annee se deroule la premiere saison ?', a: '1983' },
    { q: 'Quel etait le titre de travail de la serie avant sa sortie ?', a: 'Montauk' }
  ],
  10: [
    { q: 'Quel est le vrai nom de Vecna, avant sa transformation ?', a: 'Henry Creel (Un)' },
    { q: 'Comment s appelle le club de Donjons et Dragons du lycee ?', a: 'Le Hellfire Club' },
    { q: 'De quel jeu de role vient le nom Vecna ?', a: 'Donjons et Dragons' }
  ]
}}

]);
