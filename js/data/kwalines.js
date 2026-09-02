/* =========================================================
   Les repliques de KWA, l animateur
   {name} = nom du joueur, {n} = niveau choisi
   ========================================================= */
window.KWA = window.KWA || {};
KWA.LINES = {

  turn: [
    "A toi de jouer, {name}. Fais-nous rever.",
    "{name} ! La foret t attend, et elle n a pas que ca a faire.",
    "C est le tour de {name}. Silence dans les buissons.",
    "{name}, le de te tend les bras.",
    "Roulement de tambour... {name} entre en scene.",
    "{name}, montre-nous de quoi tu es capable.",
    "Attention, {name} s avance. Ca sent le grand moment.",
    "{name} ! On t a garde la meilleure case. Enfin, on croit.",
    "Le public reclame {name}. Enfin, moi surtout.",
    "{name}, c est maintenant ou jamais. Bon, surtout maintenant.",
    "Mesdames, messieurs : {name}.",
    "{name}, la foret a faim. Nourris-la de tes decisions.",
    "Allez {name}, un petit lancer et on n en parle plus.",
    "{name} au micro... pardon, au de.",
    "On accueille {name} avec la ferveur qu il merite. Ou pas."
  ],

  dice1: [
    "Un. UN. J ai vu des escargots plus ambitieux.",
    "Un petit un. C est mignon.",
    "Un. Le de a decide de te punir personnellement.",
    "Un ! On appelle ca de la gestion prudente."
  ],
  dice2: [
    "Deux. On ne va pas s enflammer.",
    "Deux petites cases. C est deja ca de pris.",
    "Deux. Le minimum syndical du deplacement."
  ],
  dice3: [
    "Trois ! Le milieu, le confort, la mediocrite.",
    "Trois. Ni gloire ni honte.",
    "Trois cases, tranquille."
  ],
  dice4: [
    "Quatre ! Ca commence a ressembler a quelque chose.",
    "Quatre cases, on progresse.",
    "Quatre. Le de t aime bien aujourd hui."
  ],
  dice5: [
    "Cinq ! La foret s ecarte sur ton passage.",
    "Cinq cases ! On applaudit dans les fourres.",
    "Cinq ! Attention, ca sent le champion."
  ],
  dice6: [
    "SIX ! Le de a parle, et il a crie.",
    "Six ! Les arbres se levent pour t applaudir.",
    "SIX ! Quelqu un a graisse ce de ou quoi ?",
    "Six cases d un coup. Les autres, vous notez ?"
  ],

  /* --- presentation des candidats en debut de partie --- */
  present: [
    "Candidat numero {n} : {name} ! Un profil qui ne rassure personne.",
    "Voici {name}. Il parait qu il a des choses a prouver. On verra ca.",
    "{name} ! Applaudissements simules, je n ai pas de public.",
    "Numero {n} : {name}. Sourire confiant, ca ne durera pas.",
    "{name} nous vient de tres loin. Enfin, de la piece d a cote.",
    "Accueillons {name}, qui a jure de ne pas tricher. On a note.",
    "{name} ! Grand favori d apres {name} lui-meme.",
    "Candidat {n} : {name}. Aucune preparation, beaucoup d ambition.",
    "{name} entre dans la foret. La foret n a rien demande.",
    "{name} ! Deja vu meilleur, deja vu pire. Surtout pire.",
    "On enchaine avec {name}, qui a l air de decouvrir les regles.",
    "{name}, numero {n}. Un vrai mystere, meme pour ses amis."
  ],

  /* --- avant le roulement de tambour --- */
  drum: [
    "Et maintenant, le moment que personne n attendait : le tirage de l ordre de passage !",
    "L ordre de passage, c est le hasard qui decide. Et le hasard, lui, ne s excuse jamais.",
    "Place au tirage ! Un algorithme impartial, contrairement a moi.",
    "Tirage de l ordre de passage. Je n y suis pour rien, je precise."
  ],

  /* --- annonce de l ordre --- */
  orderWow: [
    "Oh ! Alors la, je ne m y attendais pas du tout.",
    "Non mais... vous avez vu ca ? Meme moi je suis surpris.",
    "Incroyable ! Enfin, statistiquement banal. Mais incroyable quand meme.",
    "Ooooh ! Le destin vient de faire un choix tres discutable.",
    "Attendez... le tambour a parle, et il a du gout."
  ],
  orderFirst: [
    "{name} ouvre le bal !",
    "{name} commence. Bon courage, personne n a d echauffement.",
    "C est {name} qui essuie les platres.",
    "{name} passe en premier. Ni honneur ni privilege : juste le hasard."
  ],
  orderLast: [
    "Et {name} ferme la marche. Le temps de reflechir, ou de paniquer.",
    "{name} passe dernier. Le meilleur pour la fin, on verra.",
    "{name} termine le tour. Il aura tout vu avant de jouer."
  ],

  quiz: [
    "Alors, tu te mets combien ?",
    "L heure de verite. Tu te mets combien ?",
    "Sois honnete avec toi-meme : tu te mets combien ?",
    "Choisis bien. Tu te mets combien ?",
    "Le grand moment de solitude. Tu te mets combien ?"
  ],
  betLow: [
    "{n}. La prudence incarnee.",
    "{n} seulement ? On respecte la modestie.",
    "{n}. Tu joues pour ne pas perdre. C est une strategie.",
    "{n}. Meme ma grand-mere se mettait plus."
  ],
  betMid: [
    "{n}. Raisonnable. Presque suspect.",
    "{n}, le choix de la maturite.",
    "{n}. Ni fou ni lache. Bref, quelconque."
  ],
  betHigh: [
    "{n} !! {name} a decide de vivre dangereusement.",
    "{n} ! Mais quel courage. Ou quelle inconscience.",
    "{n} ?! On a un heros dans la place.",
    "{n}. Si ca passe, on en parle encore dans dix ans."
  ]
};
