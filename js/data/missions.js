/* =========================================================
   LES MISSIONS DE KWA

   Un pacte qui ne se resout pas tout de suite. Kwa prend le
   joueur a part, lui donne une consigne a tenir PENDANT son
   tour, et revient aux nouvelles au tour suivant. La table ne
   sait rien : c est tout le sel. Au retour de Kwa, le joueur
   annonce ce qu il devait faire, et le groupe tranche.

   Reserve aux parties dans la meme piece : une mission qui
   consiste a chuchoter dans une oreille n a aucun sens quand
   chacun est chez soi.

   Regles d ecriture d une mission :
   - elle tient dans un tour, sans allonger la partie ;
   - elle se verifie a l oeil ou a l oreille, pas au chronometre ;
   - elle est drole a RACONTER meme quand elle est ratee ;
   - elle ne demande jamais de se moquer de quelqu un.

   court : ce que le joueur annonce a la table au moment du
   bilan. txt : la consigne complete, vue par lui seul.
   spicy : ne sort que si le mode epice est actif.
   min : nombre de joueurs necessaire.
   ========================================================= */
window.KWA = window.KWA || {};
KWA.MISSIONS = [

  /* --- accents, voix et facons de parler --- */
  { court: 'Accent belge', txt: 'Parle avec l accent belge pendant tout ton tour. Si personne ne te le fait remarquer, c est gagne.' },
  { court: 'Accent marseillais', txt: 'Parle avec l accent marseillais pendant tout ton tour, sans que personne ne releve.' },
  { court: 'Accent quebecois', txt: 'Parle avec l accent quebecois pendant tout ton tour, sans te faire griller.' },
  { court: 'Accent anglais', txt: 'Roule tous tes R comme un anglais qui parle francais, pendant tout ton tour.' },
  { court: 'Voix de presentateur', txt: 'Parle comme un presentateur de journal televise pendant tout ton tour. Ton grave, phrases nettes.' },
  { court: 'Voix chuchotee', txt: 'Baisse la voix d un cran a chaque phrase que tu dis pendant ton tour, jusqu a chuchoter.' },
  { court: 'Toujours poli', txt: 'Termine chacune de tes phrases par "s il vous plait" pendant tout ton tour, mine de rien.' },
  { court: 'Parler de soi a la 3e personne', txt: 'Parle de toi a la troisieme personne pendant tout ton tour. "Il reflechit", "il hesite".' },
  { court: 'Aucune negation', txt: 'Ne prononce aucune phrase negative pendant ton tour. Pas de "non", pas de "je ne".' },
  { court: 'Phrases courtes', txt: 'Ne dis aucune phrase de plus de cinq mots pendant tout ton tour.' },

  /* --- mots a placer --- */
  { court: 'Placer "aubergine"', txt: 'Place le mot "aubergine" dans une phrase, naturellement, sans que personne ne tique.' },
  { court: 'Placer "philosophie"', txt: 'Place le mot "philosophie" dans une phrase pendant ton tour, sans que ca sonne force.' },
  { court: 'Placer "tracteur"', txt: 'Place le mot "tracteur" dans une phrase pendant ton tour, sans que personne ne releve.' },
  { court: 'Placer "toboggan"', txt: 'Place le mot "toboggan" dans une phrase pendant ton tour. Naturellement.' },
  { court: 'Placer "moustache"', txt: 'Place le mot "moustache" dans une conversation pendant ton tour, sans te faire griller.' },
  { court: 'Placer "catastrophe"', txt: 'Place le mot "catastrophe" dans une phrase pendant ton tour, sans en faire des tonnes.' },
  { court: 'Placer un proverbe', txt: 'Sors un proverbe, vrai ou invente, pendant ton tour. Si personne ne demande "c est de qui ?", c est gagne.' },
  { court: 'Placer une date', txt: 'Cite une date historique precise pendant ton tour, comme si elle avait un rapport.' },
  { court: 'Placer un chiffre faux', txt: 'Annonce une statistique inventee pendant ton tour, avec assurance. Personne ne doit la contester.' },
  { court: 'Un mot ose', txt: 'Glisse un mot ose dans une phrase pendant ton tour, assez discretement pour que personne ne releve.', spicy: true },

  /* --- chuchotements et confidences --- */
  { court: 'Chuchoter une qualite', txt: 'Va chuchoter a l oreille de quelqu un une qualite que tu lui trouves vraiment. Sans que les autres entendent.', min: 3 },
  { court: 'Chuchoter un defaut', txt: 'Va chuchoter a l oreille de quelqu un un petit defaut que tu lui trouves. Gentiment.', min: 3 },
  { court: 'Chuchoter un secret', txt: 'Va chuchoter un vrai secret a l oreille de quelqu un. Un vrai, pas une blague.', min: 3 },
  { court: 'Chuchoter un mensonge', txt: 'Va chuchoter quelque chose de completement faux a l oreille de quelqu un, avec le plus grand serieux.', min: 3 },
  { court: 'Une confidence a voix haute', txt: 'Raconte a la table un truc que tu n avais jamais dit ici. Court, mais vrai.' },
  { court: 'Un compliment sincere', txt: 'Fais un compliment sincere a la personne a ta gauche, sans annoncer que c est une mission.', min: 3 },
  { court: 'Une excuse inutile', txt: 'Presente des excuses a quelqu un pour quelque chose que tu n as pas fait. Serieusement.', min: 3 },
  { court: 'Un remerciement', txt: 'Remercie quelqu un pour un truc minuscule, avec beaucoup trop d emotion.', min: 3 },

  /* --- gestes et attitudes --- */
  { court: 'Ne jamais croiser un regard', txt: 'Ne regarde personne dans les yeux pendant tout ton tour. Sans que ca se voie.' },
  { court: 'Bras croises', txt: 'Garde les bras croises pendant tout ton tour, quoi qu il arrive.' },
  { court: 'Une main dans le dos', txt: 'Garde une main dans le dos pendant tout ton tour. Meme pour prendre le telephone.' },
  { court: 'Toujours debout', txt: 'Reste debout pendant tout ton tour, sans donner de raison.' },
  { court: 'Se toucher le nez', txt: 'Touche-toi le nez a chaque fois que quelqu un prononce ton prenom, pendant ton tour.' },
  { court: 'Applaudir', txt: 'Applaudis discretement a chaque fois que quelqu un finit une phrase, pendant ton tour.' },
  { court: 'Hocher la tete', txt: 'Approuve de la tete tout ce qui se dit pendant ton tour, meme les betises.' },
  { court: 'Imiter son voisin', txt: 'Copie discretement la posture de ton voisin de droite pendant tout ton tour.', min: 3 },
  { court: 'Un pas en arriere', txt: 'Recule d un pas a chaque fois que quelqu un te parle, pendant ton tour.' },
  { court: 'Sourire fixe', txt: 'Garde un grand sourire pendant tout ton tour, y compris quand tu perds des cases.' },

  /* --- regles de conduite --- */
  { court: 'Interdit de dire "oui"', txt: 'Ne prononce jamais le mot "oui" pendant ton tour. Trouve autre chose.' },
  { court: 'Interdit de dire "je"', txt: 'Ne prononce jamais le mot "je" pendant tout ton tour.' },
  { court: 'Interdit de rire', txt: 'Ne ris pas une seule fois pendant ton tour. Pas meme un sourire sonore.' },
  { court: 'Repondre par une question', txt: 'Reponds a toutes les questions par une autre question pendant ton tour.' },
  { court: 'Toujours d accord', txt: 'Donne raison a tout le monde pendant ton tour, meme quand deux personnes se contredisent.' },
  { court: 'Compliment obligatoire', txt: 'Commence chacune de tes phrases par un compliment a quelqu un, pendant tout ton tour.', min: 3 },
  { court: 'Vouvoyer tout le monde', txt: 'Vouvoie toute la table pendant ton tour, sans expliquer pourquoi.' },

  /* --- interactions imposees --- */
  { court: 'Designer un rival', txt: 'Prends quelqu un a part et annonce-lui, tres serieusement, que c est desormais ton rival.', min: 3 },
  { court: 'Une alliance secrete', txt: 'Propose une alliance a quelqu un, en douce, pendant ton tour. A lui de repondre.', min: 3 },
  { court: 'Faire repeter', txt: 'Fais repeter trois fois la meme phrase a quelqu un, sans avoir l air de te moquer.', min: 3 },
  { court: 'Le prenom interdit', txt: 'Choisis un joueur en secret : ne prononce jamais son prenom pendant ton tour.', min: 3 },
  { court: 'Offrir sa place', txt: 'Propose serieusement a quelqu un d echanger de place avec toi, sans dire pourquoi.', min: 3 },
  { court: 'La question genante', txt: 'Pose une question un peu genante a quelqu un, et ecoute la reponse jusqu au bout.', min: 3, spicy: true },
  { court: 'Le regard appuye', txt: 'Fixe quelqu un du regard pendant cinq secondes, sans rien dire, puis reprends comme si de rien n etait.', min: 3, spicy: true }
];
