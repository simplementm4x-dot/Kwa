/* =========================================================
   VARIANTES — SERIES TV (2/4)

   Trois questions de plus par niveau. Meme regle que partout :
   niveaux 1 a 6 en QCM, 7 a 10 en reponse libre, et la
   difficulte doit vraiment monter d un niveau a l autre.

   Une variante ne reprend jamais l enonce de la carte
   d origine — test/content.test.js le verifie.
   ========================================================= */
window.KWA = window.KWA || {};
KWA.VARIANTES = (KWA.VARIANTES || []).concat([

{ t: 'The Office', v: {
  1: [
    { q: 'Dans quel type de lieu se deroule la serie ?', o: ['Un bureau', 'Un hopital', 'Un commissariat', 'Un lycee'], a: 0 },
    { q: 'Sous quelle forme la serie est-elle filmee ?', o: ['Un faux documentaire', 'Un dessin anime', 'Une piece filmee', 'Un journal televise'], a: 0 },
    { q: 'De quel pays vient la version originale de la serie ?', o: ['Le Royaume-Uni', 'Les Etats-Unis', 'Le Canada', 'L Australie'], a: 0 }
  ],
  2: [
    { q: 'Quel est le prenom de la receptionniste ?', o: ['Pam', 'Erin', 'Angela', 'Kelly'], a: 0 },
    { q: 'Quel commercial fait des blagues a Dwight en permanence ?', o: ['Jim', 'Ryan', 'Andy', 'Stanley'], a: 0 },
    { q: 'Quel est le metier de Toby dans l entreprise ?', o: ['Ressources humaines', 'Comptable', 'Commercial', 'Livreur'], a: 0 }
  ],
  3: [
    { q: 'Dans quel animal Dwight cache-t-il une arme au bureau ?', o: ['Dans le distributeur de boissons', 'Dans la plante verte', 'Dans le tiroir de Jim', 'Dans le plafond'], a: 1 },
    { q: 'Quel objet de Dwight finit regulierement dans de la gelatine ?', o: ['Son agrafeuse', 'Son telephone', 'Sa tasse', 'Ses lunettes'], a: 0 },
    { q: 'Quel instrument Andy joue-t-il ?', o: ['Le banjo', 'La batterie', 'Le piano', 'Le violon'], a: 0 }
  ],
  4: [
    { q: 'Quel personnage renverse son chili par terre dans un episode culte ?', o: ['Kevin', 'Creed', 'Oscar', 'Stanley'], a: 0 },
    { q: 'Quel gerant remplace Michael apres son depart ?', o: ['Andy Bernard', 'Dwight Schrute', 'Jim Halpert', 'Robert California'], a: 0 },
    { q: 'Quel personnage repond toujours par le mot "Bears" ?', o: ['Dwight', 'Kevin', 'Creed', 'Toby'], a: 0 }
  ],
  5: [
    { q: 'Quelle entreprise rachete Dunder Mifflin ?', o: ['Sabre', 'Vandelay', 'Prince Paper', 'Staples'], a: 0 },
    { q: 'Quel est le nom du groupe de Kevin ?', o: ['Scrantonicity', 'The Office Band', 'Papermates', 'Dunder Boys'], a: 0 },
    { q: 'Quel titre Dwight vise-t-il pendant toute la serie ?', o: ['Directeur regional', 'Comptable en chef', 'Chef de la securite', 'Vice-president'], a: 0 }
  ],
  6: [
    { q: 'Quelle est la couleur du chat de Angela ?', o: ['Gris', 'Roux', 'Noir', 'Blanc'], a: 3 },
    { q: 'Quel personnage a un passe trouble et vole tout ce qu il trouve ?', o: ['Creed', 'Stanley', 'Oscar', 'Meredith'], a: 0 },
    { q: 'Quel evenement annuel Michael organise-t-il avec des recompenses ?', o: ['Les Dundies', 'Les Scrantonies', 'Les Mifflies', 'Les Papers'], a: 0 }
  ],
  7: [
    { q: 'Quel acteur britannique a cree la version originale ?', a: 'Ricky Gervais' },
    { q: 'Comment s appelle la fille de Jim et Pam ?', a: 'Cecelia (Cece)' },
    { q: 'Quel est le nom de famille de Michael ?', a: 'Scott' }
  ],
  8: [
    { q: 'Quel est le nom de la ferme de Dwight ?', a: 'Schrute Farms' },
    { q: 'Comment s appelle la superieure de Michael au siege ?', a: 'Jan Levinson' },
    { q: 'Quel est le nom du personnage joue par Rainn Wilson ?', a: 'Dwight Schrute' }
  ],
  9: [
    { q: 'Quel scenario de film Michael ecrit-il pendant des annees ?', a: 'Threat Level Midnight' },
    { q: 'Quel est le vrai metier de Creed dans l entreprise ?', a: 'Responsable du controle qualite' },
    { q: 'Dans quel etat americain se trouve Scranton ?', a: 'La Pennsylvanie' }
  ],
  10: [
    { q: 'Quel personnage joue le role d Agent Michael Scarn ?', a: 'Michael Scott, dans son propre film' },
    { q: 'Comment s appelle le patron excentrique de la saison 8 ?', a: 'Robert California' },
    { q: 'Quel produit Michael tente-t-il de vendre en creant sa propre societe ?', a: 'Du papier, avec la Michael Scott Paper Company' }
  ]
}},

{ t: 'La Casa de Papel', v: {
  1: [
    { q: 'Que font les personnages principaux de la serie ?', o: ['Un braquage', 'Une enquete', 'Un tour du monde', 'Un concours'], a: 0 },
    { q: 'Que portent les braqueurs sur le visage ?', o: ['Un masque', 'Une cagoule de laine', 'Des lunettes noires', 'Rien'], a: 0 },
    { q: 'Sur quelle plateforme la serie a-t-elle explose ?', o: ['Netflix', 'Prime Video', 'Disney+', 'Hulu'], a: 0 }
  ],
  2: [
    { q: 'Quel nom de code porte la narratrice de la serie ?', o: ['Tokyo', 'Nairobi', 'Berlin', 'Lisbonne'], a: 0 },
    { q: 'Quel braqueur porte le nom d une ville allemande ?', o: ['Berlin', 'Moscou', 'Rio', 'Helsinki'], a: 0 },
    { q: 'Quelle langue parlent les personnages ?', o: ['L espagnol', 'L italien', 'Le portugais', 'Le francais'], a: 0 }
  ],
  3: [
    { q: 'Quel lien unit Berlin au Professeur ?', o: ['Ils sont freres', 'Ils sont cousins', 'Ils sont amis d enfance', 'Aucun'], a: 0 },
    { q: 'Quel personnage est le pere de Denver ?', o: ['Moscou', 'Helsinki', 'Oslo', 'Bogota'], a: 0 },
    { q: 'Quel duo de braqueurs vient de Serbie ?', o: ['Helsinki et Oslo', 'Rio et Denver', 'Nairobi et Tokyo', 'Marseille et Bogota'], a: 0 }
  ],
  4: [
    { q: 'Que fabrique la Fabrique nationale de la monnaie ?', o: ['Des billets', 'Des lingots', 'Des bijoux', 'Des pieces de collection'], a: 0 },
    { q: 'Quel nom de code prend l inspectrice quand elle rejoint la bande ?', o: ['Lisbonne', 'Stockholm', 'Manille', 'Marseille'], a: 0 },
    { q: 'Quel personnage devient Stockholm apres le premier braquage ?', o: ['Monica', 'Alison', 'Raquel', 'Alicia'], a: 0 }
  ],
  5: [
    { q: 'Que vole la bande dans la Banque d Espagne ?', o: ['De l or', 'Des tableaux', 'Des documents', 'Des diamants'], a: 0 },
    { q: 'Quelle inspectrice enceinte traque la bande dans la saison 4 ?', o: ['Alicia Sierra', 'Raquel Murillo', 'Monica Gaztambide', 'Amanda'], a: 0 },
    { q: 'Ou le Professeur cache-t-il son quartier general au debut ?', o: ['Dans un hangar', 'Dans une eglise', 'Dans un hotel', 'Dans un bateau'], a: 0 }
  ],
  6: [
    { q: 'Quel personnage est un expert en dynamitage ?', o: ['Bogota', 'Palerme', 'Nairobi', 'Denver'], a: 1 },
    { q: 'Quel personnage prend la tete du braquage apres Berlin ?', o: ['Palerme', 'Denver', 'Rio', 'Helsinki'], a: 0 },
    { q: 'Combien de parties compte la serie sur Netflix ?', o: ['5', '3', '4', '6'], a: 0 }
  ],
  7: [
    { q: 'Quel est le vrai prenom du Professeur ?', a: 'Sergio Marquina' },
    { q: 'Quelle chanson italienne de resistance sert d hymne a la bande ?', a: 'Bella Ciao' },
    { q: 'Comment s appelle la serie en espagnol ?', a: 'La Casa de Papel' }
  ],
  8: [
    { q: 'Quel peintre a inspire les masques de la bande ?', a: 'Salvador Dali' },
    { q: 'Comment s appelle la serie derivee consacree a un personnage ?', a: 'Berlin' },
    { q: 'Quel est le vrai nom de Tokyo ?', a: 'Silene Oliveira' }
  ],
  9: [
    { q: 'Sur quelle chaine espagnole la serie a-t-elle ete diffusee avant Netflix ?', a: 'Antena 3' },
    { q: 'Qui a cree la serie ?', a: 'Alex Pina' },
    { q: 'Quelle adaptation coreenne de la serie est sortie en 2022 ?', a: 'La Casa de Papel : Coree' }
  ],
  10: [
    { q: 'Quel personnage est le frere de Berlin et du Professeur ?', a: 'Ils sont demi-freres : Andres et Sergio' },
    { q: 'Comment s appelle la maladie dont souffre Berlin ?', a: 'La myopathie de Helmer' },
    { q: 'Combien de milliards d euros la bande imprime-t-elle dans la premiere partie ?', a: '2,4 milliards' }
  ]
}},

{ t: 'Squid Game', v: {
  1: [
    { q: 'Que gagnent les joueurs s ils survivent a tous les jeux ?', o: ['Beaucoup d argent', 'Une maison', 'Une voiture', 'La liberte'], a: 0 },
    { q: 'A quoi ressemblent les jeux de la competition ?', o: ['Des jeux d enfants', 'Des epreuves sportives', 'Des enigmes', 'Des combats'], a: 0 },
    { q: 'Que risquent les joueurs qui perdent ?', o: ['La mort', 'Une amende', 'La prison', 'Rien'], a: 0 }
  ],
  2: [
    { q: 'Quelle poupee geante surveille le premier jeu ?', o: ['Une poupee de petite fille', 'Un robot', 'Un soldat', 'Un clown'], a: 0 },
    { q: 'De quelle couleur sont les combinaisons des gardes ?', o: ['Rose fuchsia', 'Vert', 'Noir', 'Blanc'], a: 0 },
    { q: 'Ou dorment les joueurs entre les epreuves ?', o: ['Dans un dortoir geant', 'Dans des chambres', 'Dehors', 'Dans un bus'], a: 0 }
  ],
  3: [
    { q: 'Quel jeu consiste a decouper une forme dans un bonbon ?', o: ['Le dalgona', 'Les billes', 'La corde', 'Le pont de verre'], a: 0 },
    { q: 'Quel jeu se joue sur un pont fait de dalles ?', o: ['Le pont de verre', 'La marelle', 'Le tir a la corde', 'Le calamar'], a: 0 },
    { q: 'Que representent les formes sur les masques des gardes ?', o: ['Leur rang', 'Leur nom', 'Leur age', 'Leur jeu'], a: 0 }
  ],
  4: [
    { q: 'Quel est le metier de Seong Gi-hun avant les jeux ?', o: ['Chauffeur, apres avoir ete licencie', 'Medecin', 'Policier', 'Professeur'], a: 0 },
    { q: 'Quel personnage est un ancien camarade de classe de Gi-hun ?', o: ['Cho Sang-woo', 'Ali', 'Deok-su', 'Il-nam'], a: 0 },
    { q: 'Quel personnage vient du Pakistan ?', o: ['Ali', 'Sae-byeok', 'Deok-su', 'Mi-nyeo'], a: 0 }
  ],
  5: [
    { q: 'D ou vient la joueuse Kang Sae-byeok ?', o: ['De Coree du Nord', 'De Chine', 'Du Japon', 'De Russie'], a: 0 },
    { q: 'Quel personnage se fait passer pour un garde afin d enqueter ?', o: ['Le policier Hwang Jun-ho', 'Le Front Man', 'Le recruteur', 'Sang-woo'], a: 0 },
    { q: 'Comment les joueurs sont-ils recrutes au depart ?', o: ['Par un jeu de ddakji dans le metro', 'Par une annonce', 'Par un ami', 'Par la poste'], a: 0 }
  ],
  6: [
    { q: 'Quel numero porte Kang Sae-byeok ?', o: ['067', '456', '218', '199'], a: 0 },
    { q: 'Quel numero porte Cho Sang-woo ?', o: ['218', '456', '067', '001'], a: 0 },
    { q: 'Qui regarde les jeux depuis une salle privee ?', o: ['Les VIP', 'La police', 'Les familles', 'Personne'], a: 0 }
  ],
  7: [
    { q: 'Comment s appelle le chef masque qui dirige les jeux ?', a: 'Le Front Man' },
    { q: 'Quel numero porte le vieil homme Oh Il-nam ?', a: '001' },
    { q: 'Quel jeu donne son titre a la serie ?', a: 'Le jeu du calamar (ojingeo)' }
  ],
  8: [
    { q: 'Quel acteur joue Seong Gi-hun ?', a: 'Lee Jung-jae' },
    { q: 'Quel lien unit le Front Man au policier Jun-ho ?', a: 'Ils sont freres' },
    { q: 'Quelle valse classique reveille les joueurs chaque matin ?', a: 'Le Beau Danube bleu de Strauss' }
  ],
  9: [
    { q: 'Quelle recompense en wons est en jeu ?', a: '45,6 milliards de wons' },
    { q: 'Quelle emission derivee de tele-realite Netflix a-t-il tiree de la serie ?', a: 'Squid Game : Le Defi' },
    { q: 'Quelle recompense majeure la serie a-t-elle remportee aux Emmy Awards ?', a: 'Le prix du meilleur acteur dramatique pour Lee Jung-jae' }
  ],
  10: [
    { q: 'Combien d annees Hwang Dong-hyuk a-t-il mis a monter le projet ?', a: 'Plus de dix ans' },
    { q: 'Quelle est la revelation finale sur le joueur 001 ?', a: 'C est le createur des jeux' },
    { q: 'De quelle couleur Gi-hun teint-il ses cheveux a la fin de la saison 1 ?', a: 'En rouge' }
  ]
}},

{ t: 'Peaky Blinders', v: {
  1: [
    { q: 'A quelle epoque se deroule la serie ?', o: ['Les annees 1920', 'Les annees 1950', 'Les annees 1980', 'Le Moyen Age'], a: 0 },
    { q: 'Quel accessoire les hommes de la famille portent-ils tous ?', o: ['Une casquette', 'Un chapeau haut de forme', 'Un beret', 'Une echarpe'], a: 0 },
    { q: 'De quel pays vient la serie ?', o: ['Le Royaume-Uni', 'L Irlande', 'Les Etats-Unis', 'L Australie'], a: 0 }
  ],
  2: [
    { q: 'Quelle activite illegale rapporte le plus a la famille au debut ?', o: ['Les paris clandestins', 'La contrebande d armes', 'Le vol de voitures', 'La fausse monnaie'], a: 0 },
    { q: 'Comment s appelle le frere aine impulsif de Tommy ?', o: ['Arthur', 'John', 'Michael', 'Finn'], a: 0 },
    { q: 'Quel animal Tommy garde-t-il et fait-il courir ?', o: ['Un cheval', 'Un chien', 'Un faucon', 'Un taureau'], a: 0 }
  ],
  3: [
    { q: 'Quel inspecteur est envoye pour faire tomber les Shelby ?', o: ['Chester Campbell', 'Thomas Gold', 'Alfie Solomons', 'Billy Kimber'], a: 0 },
    { q: 'Comment s appelle le pub tenu par la famille ?', o: ['The Garrison', 'The Crown', 'The Anchor', 'The Bell'], a: 0 },
    { q: 'De quelle origine est en partie la famille Shelby ?', o: ['Gitane (romani)', 'Italienne', 'Polonaise', 'Ecossaise'], a: 0 }
  ],
  4: [
    { q: 'Quel gangster juif de Londres devient un allie encombrant ?', o: ['Alfie Solomons', 'Darby Sabini', 'Luca Changretta', 'Billy Kimber'], a: 0 },
    { q: 'Quelle famille italienne vient se venger dans la saison 4 ?', o: ['Les Changretta', 'Les Solomons', 'Les Sabini', 'Les Gold'], a: 0 },
    { q: 'Quel poste politique Tommy finit-il par occuper ?', o: ['Depute', 'Maire', 'Ministre', 'Juge'], a: 0 }
  ],
  5: [
    { q: 'Quelle guerre les freres Shelby ont-ils faite ?', o: ['La Premiere Guerre mondiale', 'La guerre des Boers', 'La Seconde Guerre mondiale', 'La guerre de Crimee'], a: 0 },
    { q: 'Quel etait leur role dans les tranchees ?', o: ['Tunneliers', 'Aviateurs', 'Cavaliers', 'Medecins'], a: 0 },
    { q: 'Quelle femme dirige les comptes de la famille ?', o: ['Polly', 'Ada', 'Linda', 'Lizzie'], a: 0 }
  ],
  6: [
    { q: 'Comment s appelle la soeur des freres Shelby ?', o: ['Ada', 'Polly', 'Esme', 'Linda'], a: 0 },
    { q: 'Quel homme politique reel Tommy affronte-t-il dans la saison 5 ?', o: ['Oswald Mosley', 'Winston Churchill', 'Neville Chamberlain', 'Clement Attlee'], a: 0 },
    { q: 'Quel est le nom de l entreprise officielle de la famille ?', o: ['Shelby Company Limited', 'Peaky Ltd', 'Garrison Corp', 'Small Heath Trading'], a: 0 }
  ],
  7: [
    { q: 'Dans quel quartier de Birmingham vit la famille ?', a: 'Small Heath' },
    { q: 'Qui a cree la serie ?', a: 'Steven Knight' },
    { q: 'Comment s appelle la premiere femme de Tommy ?', a: 'Grace' }
  ],
  8: [
    { q: 'Quel acteur incarne Alfie Solomons ?', a: 'Tom Hardy' },
    { q: 'Comment s appelle le fils de Tommy ?', a: 'Charles (Charlie)' },
    { q: 'Quelle chaine britannique a diffuse la serie ?', a: 'La BBC' }
  ],
  9: [
    { q: 'De quel vrai gang de Birmingham le nom est-il tire ?', a: 'Les Peaky Blinders, un gang de la fin du 19e siecle' },
    { q: 'Quel film prolonge la serie apres la saison 6 ?', a: 'Un long-metrage Peaky Blinders' },
    { q: 'Quelle maladie emporte Polly... ou plutot, comment meurt-elle ?', a: 'Assassinee par un tireur a la fin de la saison 5' }
  ],
  10: [
    { q: 'Quel est le nom complet de la tante Polly ?', a: 'Elizabeth Gray' },
    { q: 'Quelle chanson de Nick Cave ouvre chaque episode ?', a: 'Red Right Hand' },
    { q: 'Quel titre honorifique Tommy recoit-il pour services rendus ?', a: 'Officier de l Ordre de l Empire britannique (OBE)' }
  ]
}},

{ t: 'Kaamelott', v: {
  1: [
    { q: 'De quel pays vient la serie ?', o: ['La France', 'Le Royaume-Uni', 'La Belgique', 'Le Canada'], a: 0 },
    { q: 'Quelle est la duree d un episode des premiers livres ?', o: ['Environ 3 minutes', 'Environ 20 minutes', 'Une heure', 'Dix secondes'], a: 0 },
    { q: 'Autour de quelle table se reunissent les chevaliers ?', o: ['La Table Ronde', 'La Table Carree', 'La Table Longue', 'La Table Haute'], a: 0 }
  ],
  2: [
    { q: 'Quel chevalier est obsede par le gras et la nourriture ?', o: ['Karadoc', 'Bohort', 'Yvain', 'Gauvain'], a: 0 },
    { q: 'Quel chevalier est celebre pour ses phrases incomprehensibles ?', o: ['Perceval', 'Lancelot', 'Leodagan', 'Merlin'], a: 0 },
    { q: 'Quel personnage est le beau-pere d Arthur ?', o: ['Leodagan', 'Loth', 'Merlin', 'Karadoc'], a: 0 }
  ],
  3: [
    { q: 'Quel enchanteur sert le roi Arthur avec beaucoup de ratages ?', o: ['Merlin', 'Elias', 'Le Repurgateur', 'Dagonet'], a: 0 },
    { q: 'Quel royaume Leodagan dirige-t-il ?', o: ['La Carmelide', 'L Orcanie', 'La Vannes', 'Le Vannes'], a: 0 },
    { q: 'Quel chevalier tres peureux s evanouit souvent ?', o: ['Bohort', 'Yvain', 'Gauvain', 'Calogrenant'], a: 0 }
  ],
  4: [
    { q: 'Quel personnage tient la taverne du village ?', o: ['Le tavernier', 'Le maitre d armes', 'Guethenoc', 'Roparzh'], a: 0 },
    { q: 'Quels deux paysans se disputent en permanence ?', o: ['Guethenoc et Roparzh', 'Karadoc et Perceval', 'Loth et Dagonet', 'Yvain et Gauvain'], a: 0 },
    { q: 'Quel titre porte Arthur dans la serie ?', o: ['Roi de Bretagne', 'Empereur des Gaules', 'Duc de Kaamelott', 'Prince de Logres'], a: 0 }
  ],
  5: [
    { q: 'Quel personnage est le roi d Orcanie, beau-frere d Arthur ?', o: ['Loth', 'Leodagan', 'Lancelot', 'Bohort'], a: 0 },
    { q: 'Quelle divinite le pere d Arthur represente-t-il ?', o: ['Aucune, c est Uther Pendragon', 'Jupiter', 'Belenos', 'Odin'], a: 0 },
    { q: 'Quel chevalier finit par trahir Arthur ?', o: ['Lancelot', 'Bohort', 'Karadoc', 'Gauvain'], a: 0 }
  ],
  6: [
    { q: 'Quel jeu de societe Perceval et Karadoc inventent-ils ?', o: ['Le Sloubi', 'Le Cul de Chouette', 'Le Pichenotte', 'Le Trou du Cul'], a: 1 },
    { q: 'Comment s appelle la maitresse d Arthur, femme de Karadoc ?', o: ['Mevanwi', 'Demetra', 'Aelis', 'Anna'], a: 0 },
    { q: 'Quel personnage est charge de traquer les heretiques ?', o: ['Le Repurgateur', 'Le Tavernier', 'Le Maitre d armes', 'Venec'], a: 0 }
  ],
  7: [
    { q: 'Comment s appelle le pere d Arthur ?', a: 'Uther Pendragon' },
    { q: 'Comment s appelle la Dame du Lac dans la serie ?', a: 'Viviane' },
    { q: 'Quel personnage joue Perceval ?', a: 'Franck Pitiot' }
  ],
  8: [
    { q: 'Comment s appelle le trafiquant qui vend de tout a Arthur ?', a: 'Venec' },
    { q: 'Quel est le prenom de la soeur de Guenievre ?', a: 'Anna' },
    { q: 'Quel acteur incarne Leodagan ?', a: 'Lionnel Astier' }
  ],
  9: [
    { q: 'Combien de Livres compte la serie televisee ?', a: 'Six' },
    { q: 'Quel titre porte le jeu de des invente par Perceval et Karadoc ?', a: 'Le Cul de Chouette' },
    { q: 'Quel compositeur signe la musique de la serie ?', a: 'Alexandre Astier lui-meme' }
  ],
  10: [
    { q: 'Quel nom porte le royaume d Arthur dans la serie ?', a: 'La Bretagne (Logres)' },
    { q: 'Quelle serie Alexandre Astier a-t-il realisee avant Kaamelott ?', a: 'Aucune : Kaamelott est sa premiere serie, apres le court-metrage Dies Irae' },
    { q: 'Quel personnage historique romain apparait dans les Livres tardifs ?', a: 'Jules Cesar' }
  ]
}}

]);
