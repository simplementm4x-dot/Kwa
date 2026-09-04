/* =========================================================
   VARIANTES — CINEMA (2/4)

   A partir de ce lot : deux variantes par niveau au lieu de
   trois, soit trois questions par niveau avec l originale.
   Il faut donc tomber sur le meme theme AU MEME NIVEAU trois
   fois pour boucler — largement de quoi ne jamais revoir la
   meme question dans une soiree.
   ========================================================= */
window.KWA = window.KWA || {};
KWA.VARIANTES = (KWA.VARIANTES || []).concat([

{ t: 'Jurassic Park', v: {
  1: [
    { q: 'Ou se deroule le film ?', o: ['Dans un parc a dinosaures', 'Dans un zoo classique', 'Dans un musee', 'Sur un bateau'], a: 0 },
    { q: 'Que finissent par faire les dinosaures ?', o: ['Ils s echappent', 'Ils s endorment', 'Ils obeissent', 'Ils disparaissent'], a: 0 }
  ],
  2: [
    { q: 'Quel dinosaure geant carnivore est la vedette du film ?', o: ['Le tyrannosaure', 'Le brachiosaure', 'Le triceratops', 'Le stegosaure'], a: 0 },
    { q: 'Comment devine-t-on que le tyrannosaure approche ?', o: ['L eau du verre tremble', 'Les lumieres s eteignent', 'Les oiseaux s envolent', 'Une alarme sonne'], a: 0 }
  ],
  3: [
    { q: 'Quel est le metier d Alan Grant ?', o: ['Paleontologue', 'Veterinaire', 'Ingenieur', 'Avocat'], a: 0 },
    { q: 'Comment s appelle le milliardaire qui a cree le parc ?', o: ['John Hammond', 'Dennis Nedry', 'Ian Malcolm', 'Robert Muldoon'], a: 0 }
  ],
  4: [
    { q: 'Quel employe sabote le parc pour voler des embryons ?', o: ['Dennis Nedry', 'Robert Muldoon', 'Ray Arnold', 'Henry Wu'], a: 0 },
    { q: 'Quel dinosaure crache un venin aveuglant ?', o: ['Le dilophosaure', 'Le velociraptor', 'Le gallimimus', 'Le compsognathus'], a: 0 }
  ],
  5: [
    { q: 'Quelle theorie Ian Malcolm defend-il ?', o: ['La theorie du chaos', 'La relativite', 'La selection naturelle', 'La derive des continents'], a: 0 },
    { q: 'Comment les dinosaures parviennent-ils a se reproduire ?', o: ['Grace a l ADN de grenouille', 'Par clonage repete', 'Par accident du laboratoire', 'Ils ne se reproduisent pas'], a: 0 }
  ],
  6: [
    { q: 'Quelle phrase le garde Muldoon prononce-t-il face aux raptors ?', o: ['Clever girl', 'Run', 'Hold on', 'They re here'], a: 0 },
    { q: 'Combien de films compte la saga Jurassic au total, trilogies confondues ?', o: ['Six', 'Trois', 'Quatre', 'Huit'], a: 0 }
  ],
  7: [
    { q: 'Comment s appelle l ile du deuxieme film ?', a: 'Isla Sorna' },
    { q: 'Quel est le nom de la generticienne... du genetieien en chef du parc ?', a: 'Le docteur Henry Wu' }
  ],
  8: [
    { q: 'Quel est le titre du deuxieme film de la trilogie originale ?', a: 'Le Monde perdu : Jurassic Park' },
    { q: 'Comment s appelle le dinosaure hybride du film Jurassic World ?', a: 'L Indominus Rex' }
  ],
  9: [
    { q: 'Comment s appelle le velociraptor dresse dans Jurassic World ?', a: 'Blue' },
    { q: 'Quel acteur incarne Alan Grant ?', a: 'Sam Neill' }
  ],
  10: [
    { q: 'Quel insecte fossilise contient l ADN dans le film ?', a: 'Un moustique pris dans l ambre' },
    { q: 'Quelle phrase resume la lecon de Ian Malcolm sur la science ?', a: 'Ils se sont demande s ils pouvaient, pas s ils devaient' }
  ]
}},

{ t: 'Matrix', v: {
  1: [
    { q: 'Dans quoi vivent les humains sans le savoir ?', o: ['Une simulation informatique', 'Un reve collectif', 'Une autre planete', 'Un jeu video'], a: 0 },
    { q: 'De quelle couleur est la teinte de l image dans la Matrice ?', o: ['Verte', 'Bleue', 'Rouge', 'Jaune'], a: 0 }
  ],
  2: [
    { q: 'Quel est le metier de Neo au debut du film ?', o: ['Informaticien', 'Policier', 'Journaliste', 'Medecin'], a: 0 },
    { q: 'Quel est le vrai nom de Neo ?', o: ['Thomas Anderson', 'John Connor', 'Neo Smith', 'Thomas Reeves'], a: 0 }
  ],
  3: [
    { q: 'Quel personnage feminin pilote le vaisseau et aime Neo ?', o: ['Trinity', 'Niobe', 'Switch', 'Persephone'], a: 0 },
    { q: 'Comment s appelle le vaisseau de Morpheus ?', o: ['Le Nabuchodonosor', 'Le Logos', 'Le Mjolnir', 'L Icare'], a: 0 }
  ],
  4: [
    { q: 'Quel personnage trahit l equipage pour retourner dans la Matrice ?', o: ['Cypher', 'Tank', 'Dozer', 'Apoc'], a: 0 },
    { q: 'Quelle femme predit l avenir aux humains ?', o: ['L Oracle', 'La Prophetesse', 'Persephone', 'Niobe'], a: 0 }
  ],
  5: [
    { q: 'Comment s appelle l elu selon la prophetie ?', o: ['L Elu', 'Le Sauveur', 'Le Premier', 'Le Dernier'], a: 0 },
    { q: 'A quoi servent les humains dans la Matrice ?', o: ['De source d energie', 'De main d oeuvre', 'De cobayes', 'De soldats'], a: 0 }
  ],
  6: [
    { q: 'Combien de films compte la saga au total ?', o: ['Quatre', 'Trois', 'Deux', 'Cinq'], a: 0 },
    { q: 'Quel programme jumeau apparait dans Matrix Reloaded ?', o: ['Le Merovingien', 'L Architecte', 'Le Serrurier', 'Le Trainman'], a: 1 }
  ],
  7: [
    { q: 'Quel objet Morpheus tend a Neo pour lui offrir la verite ?', a: 'Deux pilules, une rouge et une bleue' },
    { q: 'Comment s appelle le quatrieme film sorti en 2021 ?', a: 'Matrix Resurrections' }
  ],
  8: [
    { q: 'Quel acteur incarne l agent Smith ?', a: 'Hugo Weaving' },
    { q: 'Quel acteur incarne Morpheus dans la trilogie ?', a: 'Laurence Fishburne' }
  ],
  9: [
    { q: 'Comment s appelle l effet de camera fige popularise par le film ?', a: 'Le bullet time' },
    { q: 'Quel philosophe francais est cite dans le film pour son livre sur le simulacre ?', a: 'Jean Baudrillard' }
  ],
  10: [
    { q: 'Quel est le numero de l appartement de l Oracle ?', a: 'Le 101' },
    { q: 'Que signifie la phrase inscrite dans la cuisine de l Oracle ?', a: 'Connais-toi toi-meme (Temet Nosce)' }
  ]
}},

{ t: 'Retour vers le futur', v: {
  1: [
    { q: 'Que fait la voiture du film ?', o: ['Elle voyage dans le temps', 'Elle vole seulement', 'Elle roule sous l eau', 'Elle se transforme'], a: 0 },
    { q: 'Combien de films compte la trilogie ?', o: ['3', '2', '4', '5'], a: 0 }
  ],
  2: [
    { q: 'Quel est le nom du savant ?', o: ['Emmett Brown', 'Emmett Green', 'Edward Brown', 'Ernest Brown'], a: 0 },
    { q: 'Quel animal accompagne Doc au debut du film ?', o: ['Un chien', 'Un chat', 'Un perroquet', 'Un rat'], a: 0 }
  ],
  3: [
    { q: 'Comment s appelle la ville du film ?', o: ['Hill Valley', 'Hill Town', 'Twin Pines', 'Lone Pine'], a: 0 },
    { q: 'Quel appareil permet le voyage dans le temps ?', o: ['Le convecteur temporel', 'Le reacteur a fusion', 'La capsule', 'Le portail'], a: 0 }
  ],
  4: [
    { q: 'Quel est le nom de la mere de Marty ?', o: ['Lorraine', 'Jennifer', 'Linda', 'Clara'], a: 0 },
    { q: 'Quel est le nom de la petite amie de Marty ?', o: ['Jennifer', 'Lorraine', 'Clara', 'Linda'], a: 0 }
  ],
  5: [
    { q: 'Quelle brute harcele la famille McFly ?', o: ['Biff Tannen', 'Needles', 'Strickland', 'Griff'], a: 0 },
    { q: 'Dans quelle annee future Marty se rend-il dans le deuxieme film ?', o: ['2015', '2000', '2020', '2050'], a: 0 }
  ],
  6: [
    { q: 'A quelle epoque se deroule le troisieme film ?', o: ['Au Far West, en 1885', 'Dans les annees 1920', 'Au Moyen Age', 'En l an 2000'], a: 0 },
    { q: 'Comment s appelle la femme dont Doc tombe amoureux ?', o: ['Clara', 'Lorraine', 'Jennifer', 'Linda'], a: 0 }
  ],
  7: [
    { q: 'Quel modele exact de voiture est la machine a voyager ?', a: 'Une DeLorean DMC-12' },
    { q: 'Quel groupe interprete la chanson "The Power of Love" du film ?', a: 'Huey Lewis and the News' }
  ],
  8: [
    { q: 'Comment s appelle le pere de Marty ?', a: 'George McFly' },
    { q: 'Quel morceau Marty joue-t-il au bal du lycee ?', a: 'Johnny B. Goode' }
  ],
  9: [
    { q: 'Quelle date Marty rejoint-il dans le premier film ?', a: 'Le 5 novembre 1955' },
    { q: 'Quel objet du futur ramene Marty dans le deuxieme film ?', a: 'L almanach des sports' }
  ],
  10: [
    { q: 'Quel acteur devait jouer Marty avant Michael J. Fox ?', a: 'Eric Stoltz' },
    { q: 'Quel carburant remplace le plutonium a la fin du premier film ?', a: 'Des dechets menagers, avec le Mr Fusion' }
  ]
}},

{ t: 'Pulp Fiction', v: {
  1: [
    { q: 'Comment le film est-il raconte ?', o: ['Dans le desordre', 'Dans l ordre chronologique', 'A l envers', 'En temps reel'], a: 0 },
    { q: 'De quel pays vient le film ?', o: ['Les Etats-Unis', 'Le Royaume-Uni', 'La France', 'L Italie'], a: 0 }
  ],
  2: [
    { q: 'Quel acteur incarne Jules Winnfield ?', o: ['Samuel L. Jackson', 'John Travolta', 'Bruce Willis', 'Ving Rhames'], a: 0 },
    { q: 'Quel acteur incarne Vincent Vega ?', o: ['John Travolta', 'Samuel L. Jackson', 'Tim Roth', 'Harvey Keitel'], a: 0 }
  ],
  3: [
    { q: 'Comment s appelle le patron du gang ?', o: ['Marsellus Wallace', 'Vincent Vega', 'Winston Wolf', 'Butch Coolidge'], a: 0 },
    { q: 'Quel personnage est charge de nettoyer les problemes ?', o: ['Monsieur Wolf', 'Jimmie', 'Lance', 'Jody'], a: 0 }
  ],
  4: [
    { q: 'Quel objet de famille Butch refuse-t-il d abandonner ?', o: ['Une montre', 'Une bague', 'Une photo', 'Un couteau'], a: 0 },
    { q: 'Quelle danse Vincent et Mia executent-ils au restaurant ?', o: ['Le twist', 'Le rock', 'Le tango', 'La valse'], a: 0 }
  ],
  5: [
    { q: 'Que fait Vincent pour sauver Mia apres son overdose ?', o: ['Une injection d adrenaline', 'Un massage cardiaque', 'Il appelle un medecin', 'Il la porte dehors'], a: 0 },
    { q: 'Quel passage biblique Jules recite-t-il ?', o: ['Ezechiel 25:17', 'Genese 1:1', 'Matthieu 5:9', 'Psaume 23'], a: 0 }
  ],
  6: [
    { q: 'Comment s appelle le couple qui braque le restaurant ?', o: ['Pumpkin et Honey Bunny', 'Bonnie et Clyde', 'Jack et Jill', 'Vic et Lou'], a: 0 },
    { q: 'Quel realisateur apparait aussi comme acteur dans le film ?', o: ['Quentin Tarantino', 'Robert Rodriguez', 'Steven Soderbergh', 'Wes Anderson'], a: 0 }
  ],
  7: [
    { q: 'Comment s appelle le restaurant retro ou dansent Vincent et Mia ?', a: 'Jack Rabbit Slim s' },
    { q: 'Quelle recompense le film a-t-il obtenue au festival de Cannes ?', a: 'La Palme d Or' }
  ],
  8: [
    { q: 'Comment Vincent dit-il qu on appelle le Quarter Pounder a Paris ?', a: 'Le Royal Cheese' },
    { q: 'Quel acteur joue Butch Coolidge ?', a: 'Bruce Willis' }
  ],
  9: [
    { q: 'Quel morceau de surf rock ouvre le film ?', a: 'Misirlou de Dick Dale' },
    { q: 'Quel est le prenom de la femme de Jimmie, qui ne doit rien voir ?', a: 'Bonnie' }
  ],
  10: [
    { q: 'Que contient la mallette selon le film ?', a: 'On ne le sait jamais : elle brille, c est tout' },
    { q: 'Quel film de Tarantino est sorti juste avant Pulp Fiction ?', a: 'Reservoir Dogs' }
  ]
}},

{ t: 'Le Parrain', v: {
  1: [
    { q: 'De quelle origine est la famille du film ?', o: ['Italienne', 'Irlandaise', 'Russe', 'Grecque'], a: 0 },
    { q: 'Dans quelle ville americaine se deroule l essentiel du film ?', o: ['New York', 'Chicago', 'Las Vegas', 'Boston'], a: 0 }
  ],
  2: [
    { q: 'Quel titre donne-t-on au chef de famille ?', o: ['Le Parrain', 'Le Patron', 'Le Chef', 'Le Grand'], a: 0 },
    { q: 'Quelle celebration ouvre le premier film ?', o: ['Un mariage', 'Un enterrement', 'un bapteme', 'Un anniversaire'], a: 0 }
  ],
  3: [
    { q: 'Quel fils de Vito est le plus impulsif ?', o: ['Sonny', 'Michael', 'Fredo', 'Tom'], a: 0 },
    { q: 'Quel fils de Vito est le plus faible et trahira la famille ?', o: ['Fredo', 'Sonny', 'Michael', 'Carlo'], a: 0 }
  ],
  4: [
    { q: 'Quel personnage est l avocat et fils adoptif de la famille ?', o: ['Tom Hagen', 'Carlo Rizzi', 'Clemenza', 'Tessio'], a: 0 },
    { q: 'Quelle offre est devenue une phrase culte du film ?', o: ['Une offre qu il ne pourra pas refuser', 'Un marche equitable', 'Une derniere chance', 'Un service entre amis'], a: 0 }
  ],
  5: [
    { q: 'Dans quel pays Michael se refugie-t-il apres un meurtre ?', o: ['En Sicile', 'En Suisse', 'Au Mexique', 'A Cuba'], a: 0 },
    { q: 'Quel evenement religieux est monte en parallele d une serie de meurtres ?', o: ['Un bapteme', 'Un mariage', 'Une communion', 'Une messe de minuit'], a: 0 }
  ],
  6: [
    { q: 'Quel acteur incarne le jeune Vito dans le deuxieme film ?', o: ['Robert De Niro', 'Al Pacino', 'Marlon Brando', 'James Caan'], a: 0 },
    { q: 'Combien d Oscars le premier film a-t-il remportes ?', o: ['Trois', 'Cinq', 'Sept', 'Un'], a: 0 }
  ],
  7: [
    { q: 'Comment s appelle le producteur qui retrouve une tete de cheval dans son lit ?', a: 'Jack Woltz' },
    { q: 'Comment s appelle la femme americaine de Michael ?', a: 'Kay Adams' }
  ],
  8: [
    { q: 'Quel est le prenom du fils aine de Vito ?', a: 'Santino, dit Sonny' },
    { q: 'Dans quelle ville sicilienne la famille trouve-t-elle ses racines ?', a: 'Corleone' }
  ],
  9: [
    { q: 'Quel compositeur signe la musique du film ?', a: 'Nino Rota' },
    { q: 'Quelle phrase Michael dit-il a Fredo pour signifier qu il sait ?', a: 'Je sais que c etait toi, Fredo. Tu m as brise le coeur.' }
  ],
  10: [
    { q: 'Quel metier Vito exerce-t-il en arrivant a New York ?', a: 'Il travaille dans une epicerie' },
    { q: 'Quel film raconte les coulisses de la production du Parrain ?', a: 'La serie The Offer' }
  ]
}},

{ t: 'Forrest Gump', v: {
  1: [
    { q: 'Sur quoi Forrest est-il assis quand il raconte sa vie ?', o: ['Un banc', 'Une chaise', 'Un muret', 'Un escalier'], a: 0 },
    { q: 'Que tient Forrest sur ses genoux au debut du film ?', o: ['Une boite de chocolats', 'Un journal', 'Un sac de sport', 'Un carton'], a: 0 }
  ],
  2: [
    { q: 'Que porte Forrest aux jambes quand il est enfant ?', o: ['Des attelles', 'Des rollers', 'Des bottes', 'Rien'], a: 0 },
    { q: 'Quel conseil Jenny donne-t-elle a Forrest quand on l attaque ?', o: ['Cours, Forrest, cours', 'Cache-toi', 'Crie', 'Frappe'], a: 0 }
  ],
  3: [
    { q: 'Dans quel Etat americain Forrest grandit-il ?', o: ['L Alabama', 'La Georgie', 'Le Texas', 'La Louisiane'], a: 0 },
    { q: 'Quel sport de raquette Forrest pratique-t-il en Chine ?', o: ['Le ping-pong', 'Le tennis', 'Le badminton', 'Le squash'], a: 0 }
  ],
  4: [
    { q: 'Quel ami de Forrest meurt au Vietnam ?', o: ['Bubba', 'Dan', 'Jenny', 'Le sergent'], a: 0 },
    { q: 'Quelle entreprise Forrest monte-t-il en hommage a son ami ?', o: ['Une entreprise de crevettes', 'Un restaurant', 'Une usine', 'Une compagnie de bus'], a: 0 }
  ],
  5: [
    { q: 'Dans quelle entreprise informatique Forrest investit-il sans le savoir ?', o: ['Apple', 'IBM', 'Microsoft', 'Intel'], a: 0 },
    { q: 'Combien de temps Forrest court-il a travers le pays ?', o: ['Plus de trois ans', 'Six mois', 'Un an', 'Dix ans'], a: 0 }
  ],
  6: [
    { q: 'Quel president Forrest rencontre-t-il apres le Vietnam ?', o: ['Lyndon Johnson', 'Richard Nixon', 'John Kennedy', 'Les trois'], a: 3 },
    { q: 'Combien d Oscars le film a-t-il remportes ?', o: ['Six', 'Trois', 'Neuf', 'Un'], a: 0 }
  ],
  7: [
    { q: 'Comment s appelle le fils de Forrest ?', a: 'Forrest Junior' },
    { q: 'Quel objet vole au vent ouvre et ferme le film ?', a: 'Une plume' }
  ],
  8: [
    { q: 'Quel grade a le lieutenant Dan ?', a: 'Lieutenant' },
    { q: 'Comment s appelle le bateau de crevettes de Forrest ?', a: 'Le Jenny' }
  ],
  9: [
    { q: 'Quel roman est a l origine du film ?', a: 'Forrest Gump, de Winston Groom' },
    { q: 'Quel scandale politique Forrest declenche-t-il sans le vouloir ?', a: 'Le Watergate' }
  ],
  10: [
    { q: 'Quelle phrase resume la philosophie de sa mere ?', a: 'La vie, c est comme une boite de chocolats' },
    { q: 'Quel acteur joue le lieutenant Dan ?', a: 'Gary Sinise' }
  ]
}},

{ t: 'Inception', v: {
  1: [
    { q: 'Dans quoi les personnages entrent-ils ?', o: ['Les reves', 'Les souvenirs', 'Les ordinateurs', 'Le futur'], a: 0 },
    { q: 'Que volent les personnages ?', o: ['Des idees', 'De l argent', 'Des bijoux', 'Des documents'], a: 0 }
  ],
  2: [
    { q: 'Comment appelle-t-on le vol d une idee dans un reve ?', o: ['L extraction', 'L inception', 'La projection', 'La percee'], a: 0 },
    { q: 'Que se passe-t-il quand on meurt dans un reve ?', o: ['On se reveille', 'On meurt vraiment', 'On change de reve', 'Rien'], a: 0 }
  ],
  3: [
    { q: 'Comment s appelle l architecte des reves recrutee par Cobb ?', o: ['Ariane', 'Mal', 'Saito', 'Eames'], a: 0 },
    { q: 'Quel personnage peut prendre l apparence de quelqu un d autre ?', o: ['Eames', 'Arthur', 'Yusuf', 'Saito'], a: 0 }
  ],
  4: [
    { q: 'Quel objet Cobb utilise-t-il comme totem ?', o: ['Une toupie', 'Un de', 'Une piece', 'Une montre'], a: 0 },
    { q: 'Combien de niveaux de reve l equipe traverse-t-elle ?', o: ['Trois, plus les limbes', 'Deux', 'Cinq', 'Un seul'], a: 0 }
  ],
  5: [
    { q: 'Comment appelle-t-on la secousse qui reveille les dormeurs ?', o: ['Le coup de pied (kick)', 'Le signal', 'La chute', 'L alarme'], a: 0 },
    { q: 'Quel decor sert de theatre au deuxieme niveau de reve ?', o: ['Un hotel', 'Une forteresse enneigee', 'Une ville sous la pluie', 'Une plage'], a: 0 }
  ],
  6: [
    { q: 'Comment s appelle l endroit ou le temps se dilate a l infini ?', o: ['Les limbes', 'Le vide', 'Le puits', 'La marge'], a: 0 },
    { q: 'Quel acteur joue Arthur, le bras droit de Cobb ?', o: ['Joseph Gordon-Levitt', 'Tom Hardy', 'Cillian Murphy', 'Ken Watanabe'], a: 0 }
  ],
  7: [
    { q: 'Quelle chanson d Edith Piaf sert de signal ?', a: 'Non, je ne regrette rien' },
    { q: 'Comment s appelle l heritier dans l esprit duquel il faut planter l idee ?', a: 'Robert Fischer' }
  ],
  8: [
    { q: 'Quel acteur joue Saito ?', a: 'Ken Watanabe' },
    { q: 'Quelle scene celebre se deroule dans un couloir en rotation ?', a: 'Le combat d Arthur dans le couloir de l hotel' }
  ],
  9: [
    { q: 'Quel compositeur signe la musique du film ?', a: 'Hans Zimmer' },
    { q: 'Comment se termine le film ?', a: 'La toupie tourne encore quand l ecran coupe' }
  ],
  10: [
    { q: 'Combien de temps Christopher Nolan a-t-il mis a ecrire le scenario ?', a: 'Une dizaine d annees' },
    { q: 'Quel etait le totem de Mal ?', a: 'La toupie, que Cobb a reprise' }
  ]
}}

]);
