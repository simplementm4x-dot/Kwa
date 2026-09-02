/* =========================================================
   Mots a mimer — w = le mot, c = la categorie affichee
   ========================================================= */
window.KWA = window.KWA || {};
KWA.MIMES = [
  /* --- metiers --- */
  { w: 'Coiffeur', c: 'metier' }, { w: 'Dentiste', c: 'metier' }, { w: 'Pompier', c: 'metier' },
  { w: 'Boulanger', c: 'metier' }, { w: 'Chirurgien', c: 'metier' }, { w: 'Pilote de ligne', c: 'metier' },
  { w: 'Serveur', c: 'metier' }, { w: 'Professeur', c: 'metier' }, { w: 'Jardinier', c: 'metier' },
  { w: 'Photographe', c: 'metier' }, { w: 'Chef d orchestre', c: 'metier' }, { w: 'Vétérinaire', c: 'metier' },
  { w: 'Plombier', c: 'metier' }, { w: 'Juge', c: 'metier' }, { w: 'Astronaute', c: 'metier' },
  { w: 'Barman', c: 'metier' }, { w: 'Facteur', c: 'metier' }, { w: 'Peintre en batiment', c: 'metier' },
  { w: 'Arbitre de foot', c: 'metier' }, { w: 'Caissier', c: 'metier' }, { w: 'Mecanicien', c: 'metier' },
  { w: 'Steward', c: 'metier' }, { w: 'Magicien', c: 'metier' }, { w: 'Detective prive', c: 'metier' },
  { w: 'Maitre nageur', c: 'metier' }, { w: 'Dompteur de lions', c: 'metier' }, { w: 'Bucheron', c: 'metier' },
  { w: 'Videur de boite', c: 'metier' }, { w: 'Journaliste sportif', c: 'metier' }, { w: 'Marionnettiste', c: 'metier' },

  /* --- taches du quotidien --- */
  { w: 'Faire le menage', c: 'quotidien' }, { w: 'Passer l aspirateur', c: 'quotidien' },
  { w: 'Etendre le linge', c: 'quotidien' }, { w: 'Faire la vaisselle', c: 'quotidien' },
  { w: 'Repasser une chemise', c: 'quotidien' }, { w: 'Sortir les poubelles', c: 'quotidien' },
  { w: 'Monter un meuble suedois', c: 'quotidien' }, { w: 'Changer une ampoule', c: 'quotidien' },
  { w: 'Faire ses lacets', c: 'quotidien' }, { w: 'Se brosser les dents', c: 'quotidien' },
  { w: 'Faire les courses', c: 'quotidien' }, { w: 'Promener le chien', c: 'quotidien' },
  { w: 'Se maquiller', c: 'quotidien' }, { w: 'Se raser', c: 'quotidien' },
  { w: 'Chercher ses cles', c: 'quotidien' }, { w: 'Faire un lit', c: 'quotidien' },
  { w: 'Deboucher un evier', c: 'quotidien' }, { w: 'Arroser les plantes', c: 'quotidien' },
  { w: 'Deballer un colis', c: 'quotidien' }, { w: 'Se garer en creneau', c: 'quotidien' },
  { w: 'Attendre le bus', c: 'quotidien' }, { w: 'Faire la queue', c: 'quotidien' },
  { w: 'Se peser', c: 'quotidien' }, { w: 'Prendre un selfie', c: 'quotidien' },
  { w: 'Envoyer un vocal', c: 'quotidien' }, { w: 'Faire un virement', c: 'quotidien' },

  /* --- sports & actions --- */
  { w: 'Faire du surf', c: 'sport' }, { w: 'Escalade', c: 'sport' }, { w: 'Boxe', c: 'sport' },
  { w: 'Tir a l arc', c: 'sport' }, { w: 'Natation', c: 'sport' }, { w: 'Ski', c: 'sport' },
  { w: 'Golf', c: 'sport' }, { w: 'Yoga', c: 'sport' }, { w: 'Halterophilie', c: 'sport' },
  { w: 'Patinage artistique', c: 'sport' }, { w: 'Saut a la perche', c: 'sport' }, { w: 'Equitation', c: 'sport' },
  { w: 'Escrime', c: 'sport' }, { w: 'Bowling', c: 'sport' }, { w: 'Ping-pong', c: 'sport' },
  { w: 'Parachutisme', c: 'sport' }, { w: 'Plongee sous-marine', c: 'sport' }, { w: 'Course de haies', c: 'sport' },
  { w: 'Lancer de poids', c: 'sport' }, { w: 'Judo', c: 'sport' },

  /* --- animaux --- */
  { w: 'Girafe', c: 'animal' }, { w: 'Pingouin', c: 'animal' }, { w: 'Kangourou', c: 'animal' },
  { w: 'Serpent', c: 'animal' }, { w: 'Gorille', c: 'animal' }, { w: 'Elephant', c: 'animal' },
  { w: 'Crabe', c: 'animal' }, { w: 'Papillon', c: 'animal' }, { w: 'Poule', c: 'animal' },
  { w: 'Escargot', c: 'animal' }, { w: 'Chauve-souris', c: 'animal' }, { w: 'Grenouille', c: 'animal' },
  { w: 'Araignee', c: 'animal' }, { w: 'Requin', c: 'animal' }, { w: 'Paresseux', c: 'animal' },
  { w: 'Autruche', c: 'animal' }, { w: 'Taureau', c: 'animal' }, { w: 'Dauphin', c: 'animal' },
  { w: 'Hibou', c: 'animal' }, { w: 'Cafard', c: 'animal' },

  /* --- films & series --- */
  { w: 'Titanic', c: 'film' }, { w: 'Jurassic Park', c: 'film' }, { w: 'Le Roi Lion', c: 'film' },
  { w: 'Star Wars', c: 'film' }, { w: 'Harry Potter', c: 'film' }, { w: 'Les Dents de la mer', c: 'film' },
  { w: 'Matrix', c: 'film' }, { w: 'Rocky', c: 'film' }, { w: 'E.T.', c: 'film' },
  { w: 'Le Seigneur des anneaux', c: 'film' }, { w: 'Spider-Man', c: 'film' }, { w: 'Fight Club', c: 'film' },
  { w: 'La Reine des neiges', c: 'film' }, { w: 'Pirates des Caraibes', c: 'film' }, { w: 'Shrek', c: 'film' },
  { w: 'Retour vers le futur', c: 'film' }, { w: 'Le Loup de Wall Street', c: 'film' }, { w: 'Ghostbusters', c: 'film' },
  { w: 'Alien', c: 'film' }, { w: 'Forrest Gump', c: 'film' }, { w: 'Intouchables', c: 'film' },
  { w: 'Ratatouille', c: 'film' }, { w: 'Toy Story', c: 'film' }, { w: 'Les Visiteurs', c: 'film' },
  { w: 'Squid Game', c: 'serie' }, { w: 'Stranger Things', c: 'serie' }, { w: 'Game of Thrones', c: 'serie' },
  { w: 'Breaking Bad', c: 'serie' }, { w: 'Friends', c: 'serie' }, { w: 'La Casa de Papel', c: 'serie' },
  { w: 'Peaky Blinders', c: 'serie' }, { w: 'The Walking Dead', c: 'serie' }, { w: 'Kaamelott', c: 'serie' },
  { w: 'Les Simpson', c: 'serie' }, { w: 'One Piece', c: 'anime' }, { w: 'Dragon Ball', c: 'anime' },
  { w: 'Naruto', c: 'anime' }, { w: 'Pokemon', c: 'anime' }, { w: 'Demon Slayer', c: 'anime' },
  { w: 'L Attaque des Titans', c: 'anime' },

  /* --- objets --- */
  { w: 'Parapluie', c: 'objet' }, { w: 'Machine a coudre', c: 'objet' }, { w: 'Tronconneuse', c: 'objet' },
  { w: 'Micro-ondes', c: 'objet' }, { w: 'Guitare electrique', c: 'objet' }, { w: 'Telescope', c: 'objet' },
  { w: 'Trampoline', c: 'objet' }, { w: 'Aspirateur', c: 'objet' }, { w: 'Reveil', c: 'objet' },
  { w: 'Machine a laver', c: 'objet' }, { w: 'Skateboard', c: 'objet' }, { w: 'Tondeuse a gazon', c: 'objet' },
  { w: 'Distributeur de billets', c: 'objet' }, { w: 'Porte automatique', c: 'objet' }, { w: 'Ascenseur', c: 'objet' },
  { w: 'Chariot de supermarche', c: 'objet' }, { w: 'Baby-foot', c: 'objet' }, { w: 'Boule a facettes', c: 'objet' },
  { w: 'Menottes', c: 'objet' }, { w: 'Sac de couchage', c: 'objet' },

  /* --- situations --- */
  { w: 'Rater son train', c: 'situation' }, { w: 'Se faire piquer par une guepe', c: 'situation' },
  { w: 'Marcher sur un Lego', c: 'situation' }, { w: 'Une demande en mariage', c: 'situation' },
  { w: 'Un accouchement', c: 'situation' }, { w: 'Un entretien d embauche', c: 'situation' },
  { w: 'Un premier rendez-vous', c: 'situation' }, { w: 'Se faire arreter par la police', c: 'situation' },
  { w: 'Perdre son telephone', c: 'situation' }, { w: 'Une panne d ascenseur', c: 'situation' },
  { w: 'Un mal de dents', c: 'situation' }, { w: 'Une gueule de bois', c: 'situation' },
  { w: 'Se noyer dans 40 cm d eau', c: 'situation' }, { w: 'Un fou rire en reunion', c: 'situation' },
  { w: 'Manger trop epice', c: 'situation' }, { w: 'Un dejeuner avec la belle-mere', c: 'situation' },
  { w: 'Rater une marche', c: 'situation' }, { w: 'Se faire voler sa place de parking', c: 'situation' },
  { w: 'Attendre un resultat medical', c: 'situation' }, { w: 'Faire semblant d aimer un cadeau', c: 'situation' },
  { w: 'Une panne de reseau', c: 'situation' }, { w: 'Un embouteillage', c: 'situation' },
  { w: 'Se reveiller en retard', c: 'situation' }, { w: 'Un karaoke rate', c: 'situation' },
  { w: 'Une chute a velo', c: 'situation' }, { w: 'Un discours de mariage', c: 'situation' },

  /* --- personnages & figures --- */
  { w: 'Un zombie', c: 'personnage' }, { w: 'Un vampire', c: 'personnage' }, { w: 'Un cowboy', c: 'personnage' },
  { w: 'Un pirate', c: 'personnage' }, { w: 'Un chevalier', c: 'personnage' }, { w: 'Un robot', c: 'personnage' },
  { w: 'Un fantome', c: 'personnage' }, { w: 'Un mime', c: 'personnage' }, { w: 'Une momie', c: 'personnage' },
  { w: 'Un super-heros', c: 'personnage' }, { w: 'Un bebe', c: 'personnage' }, { w: 'Un vieux monsieur', c: 'personnage' },
  { w: 'Un mannequin', c: 'personnage' }, { w: 'Un ninja', c: 'personnage' }, { w: 'Une sirene', c: 'personnage' },
  { w: 'Un extraterrestre', c: 'personnage' }, { w: 'Un clown', c: 'personnage' }, { w: 'Un roi', c: 'personnage' },
  { w: 'Un touriste perdu', c: 'personnage' }, { w: 'Un influenceur', c: 'personnage' }
];
