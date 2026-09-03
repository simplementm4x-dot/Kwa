# Tu joues à Kwa ?

Jeu de plateau mobile-first, animé par **Kwa**, un vieux poste de télé sur pattes
qui pose les vraies questions. Direction artistique HD-2D : sol incliné en 3D,
sprites redressés face caméra, lucioles, brume et grain de vieux tube cathodique.

Première map : la **Forêt Enchantée**, un chemin en serpentin.

---

## Lancer le jeu

### Les images du plateau

Le sol, les cases et le décor viennent de cinq planches papercraft
rangées dans `src/`. Elles pèsent 3 Mo chacune : on ne les sert pas telles
quelles. `node tools/assets.js` les découpe, les réduit et les écrit dans
`assets/` — 34 fichiers, 232 Ko en tout.

Aucun outil d'image n'est installé sur la machine de développement (ni
ImageMagick, ni Python utilisable) et le jeu n'a aucune dépendance :
`tools/png.js` lit et écrit donc le PNG à la main, avec `zlib` pour la
compression. Il fait aussi la quantification en palette — ces planches sont
des aplats, 128 teintes les rendent sans différence visible et divisent le
poids par quatre.

Les éléments détachés (arbres, touffes) sont détourés en cherchant les
paquets de pixels reliés entre eux, pas avec des cadres posés à la main :
ceux-ci coupaient invariablement le bas des brins.

`node tools/maquette.js sortie.png` recompose le sol à plat — carton,
feuille d'herbe, tranche ondulée, décor — pour vérifier les raccords et les
échelles sans navigateur.

### Le jeu libre

Depuis le titre, **JEU LIBRE** met le plateau de côté : on choisit
l'épreuve qu'on veut jouer dans une grille, on la joue, et les cases
gagnées deviennent des points. C'est le mode pour une soirée où personne
n'a envie de faire le tour d'une forêt, ou pour essayer une épreuve sans
attendre qu'elle tombe.

Les cases éclair (Échange, Péage, Roue) n'y figurent pas : ce sont des
mécaniques de plateau — troquer sa position, payer un droit de passage —
qui n'ont aucun sens hors du chemin. Les épreuves qui demandent du monde
restent grisées tant que les joueurs manquent, en disant pourquoi.

Le jeu libre se joue **autour d'un seul téléphone**, qui tourne comme dans
une partie à un écran. Le Duel y est donc toujours disponible : tout le
monde est déjà devant le même écran, ce que cette épreuve demande.

### Régler la partie

Le bouton **JOUER** ne mène pas à un formulaire mais à Kwa, qui pose les
questions une par une : où vous jouez (*in real life* ou *online*), avec
combien de téléphones, en Terminus ou en nombre de tours, et sur quelle
longueur. Le mode épicé est activé d'office.

Le lieu n'est pas qu'une décoration : **online**, les épreuves qui demandent
d'être dans la même pièce ne sont pas tirées sur le plateau — le 21 (qui se
compte à la voix), le mime, et le duel (deux raquettes sur un seul écran).
Le bouton **REJOINDRE**, sous JOUER, va directement au champ du code.

L'écran « Réglages détaillés » reste accessible depuis le titre pour le son
et le duel en écran partagé.

### Ce qui rythme une partie

Au-delà des cases, quatre systèmes tournent en fond :

- **Les cases éclair** (Échange, Péage, Roue de Kwa) se résolvent en dix
  secondes, sans mini-jeu. Elles représentent une case sur cinq et existent
  pour une seule raison : enchaîner trois épreuves de trois minutes épuise
  une table.
- **Les paris** — quand un joueur monte seul sur scène, les autres misent sur
  lui avant qu'il commence. Bon pari +1 case, mauvais -1. C'est ce qui occupe
  ceux qui, sinon, regarderaient.
- **Les événements de forêt** — une règle qui change la manche : tout compte
  double, gagner veut dire reculer, aucun malus ne passe, le meneur paie pour
  les autres. Ils ne tombent pas au métronome : chaque carte est pesée selon
  la situation, et c'est la partie qui les appelle. Un écart de huit cases
  avec le dernier fait pousser la marée de champignons sous ses pieds ; un
  meneur détaché de cinq cases lève le vent contraire. Le reste du temps,
  c'est une surprise. L'annonce se fait sur le plateau — la forêt change à
  vue — pendant que Kwa découvre ça en même temps que la table.
- **Les pactes de Kwa** — de temps en temps, avant le dé, il prend le joueur à
  part et propose un marché. Refuser ne coûte rien.

Chacun se coupe séparément dans « Réglages détaillés ».

### Mode 1 téléphone (le plus simple)
Ouvrir `index.html` dans le navigateur. C'est tout : aucune installation,
aucune connexion, tout tourne hors-ligne.

### Mode multi-téléphones
```bash
node server/server.js
```
Le terminal affiche une adresse du type `http://192.168.1.12:8080`.
Chaque joueur ouvre cette adresse sur son téléphone (même Wi-Fi).
Un joueur **crée le salon**, les autres le rejoignent avec le **code à 3 chiffres**.

Le serveur est en Node pur, sans aucune dépendance (implémentation WebSocket maison).

#### Comment la synchronisation marche

Tous les téléphones affichent **exactement la même chose** : même plateau, mêmes
pions, mêmes répliques de Kwa, même dé qui roule.

- Au lancement, l'hôte envoie la **liste des types de cases**. Chaque téléphone
  reconstruit le plateau avec le même générateur pseudo-aléatoire à graine fixe :
  cases, chemin, arbres et champignons tombent au pixel près au même endroit.
- Ensuite l'hôte diffuse ce qu'il faut afficher : `kwa`, `dice`, `pos`, `walk`,
  `cam`, `jingle`, `drum`, `spot`, `panel`. Les autres rejouent ces événements.
- Ce qui doit rester **privé** ne passe jamais par la diffusion : les mots
  d'Undercover, les consignes de Vérité ou Mensonge, les anecdotes et les votes
  partent en message direct au seul joueur concerné. Les autres voient
  « ⏳ Machin répond sur son téléphone ».
- Le bouton **Lancer le dé** n'apparaît que sur le téléphone du joueur dont c'est
  le tour ; les autres voient son nom grisé.
- Le serveur n'accepte les diffusions que de l'hôte : un joueur ne peut pas
  pousser un affichage aux autres.

---

## Les modes de partie

| Mode | Fin de partie |
|---|---|
| **Terminus** | Le premier arrivé au bout du chemin gagne |
| **Nombre de tours** | Au bout de X tours, le joueur le plus loin gagne |

Longueur du chemin réglable de 20 à 80 cases, 2 à 8 joueurs.

## L'ouverture

Kwa présente les candidats un par un sous un projecteur — pion en grand, nom,
couleur — avec une réplique piochée pour chacun. Puis **roulement de tambour**
plein écran, Kwa passe en tête surprise, et l'**ordre de passage tiré au sort**
se dévoile ligne par ligne. C'est ce tirage qui fixe l'ordre des tours.

## Les pions

Des télés sur jambes bâtons. Chaque joueur choisit une couleur — reprise sur
l'étiquette flottante au-dessus du pion, sur les chaussures et sur le contour de
l'écran — et peut charger **n'importe quelle image**, qui s'affiche dans la télé.
L'image est redimensionnée localement et n'est envoyée qu'aux autres joueurs
du salon en mode multi.

## Les cases

| Case | Ce qui se passe | Gains |
|---|---|---|
| ❓ **Tu te mets combien ?** | 1 thème, 10 niveaux de difficulté. Tu paries ton niveau. | +niveau si juste ; −1 si raté à partir de 8 |
| 🕵️ **Undercover** | Mots distribués en secret, puis débat et vote à la voix ; l'écran ne sert qu'à désigner l'éliminé | équipe gagnante +2, l'autre −2 |
| 📖 **Anecdote** | Chacun écrit, tout le monde vote | le plus voté +5 |
| 🎭 **Vérité ou Mensonge** | Consigne secrète, il faut berner le groupe | +3 / −2 |
| 🍻 **Le 21** | Se joue à la voix ; on désigne ensuite le perdant | −5, ou +5 s'il se désigne lui-même |
| ⚖️ **Le Dilemme** | A ou B, vote secret | majorité +2, minorité −2 |
| 🏓 **Duel** | Pong en un contre un | +3 / −3 |
| 🤾 **Mime en folie** | 30 s, les autres miment | +1 case par mime trouvé |
| 🔤 **Le Mot Raccord** | Une lettre, 5 consignes, 30 s | +1 par mot validé, +1 si carton plein |

Répartition sur un plateau de 40 cases : environ 22 cases de quiz et 2 de chaque
mini-jeu, jamais deux mini-jeux identiques collés.

## Le contenu

- **200 cartes de quiz**, soit **2000 questions** (10 niveaux par thème)
  — séries, cinéma, animés, musique, géo, histoire, sport, sciences, bouffe,
  jeux vidéo, marques, décennies, culture générale.
- 121 dilemmes, 80 paires Undercover, 202 mots à mimer, 85 consignes de Mot Raccord.
- Une banque de répliques pour Kwa (une pioche sans répétition : il ne se
  répète pas tant qu'il n'a pas tout dit).

Le **mode épicé** (réglages) débloque les cartes coquines du Mot Raccord.
Désactivé, le jeu reste tout public.

---

## Structure

```
index.html            écrans + ordre de chargement
css/
  base.css            variables, boutons, overlays, effet CRT
  menu.css            titre, réglages, joueurs, salon
  board.css           scène HD-2D (sol 3D, sprites redressés)
  game.css            HUD, Kwa, dé, classement
  minigames.css       cases spéciales
js/
  util.js             helpers, overlays, chrono, images
  audio.js            bruitages synthétisés (WebAudio, aucun fichier)
  state.js            état de partie, couleurs, règles
  sprites.js          SVG : pions TV, Kwa, arbres, champignons…
  kwa.js              bulles de dialogue, machine à écrire
  board.js            génération du serpentin + décor + caméra
  pawns.js            pions, empilement, déplacement case par case
  config.js           adresse du serveur de salons (le seul fichier à éditer)
  prompt.js           questions posées à un joueur (rendu local OU distant)
  intro.js            présentation des candidats + tirage de l ordre
  menu.js             écrans de réglages et de joueurs
  net.js              salon, code à 3 chiffres, routage des questions
  game.js             moteur : tours, dé, résolution, fin de partie
  tiles/*.js          une case = un fichier
  data/*.js           tout le contenu
server/server.js      serveur statique + relais WebSocket, zéro dépendance
```

### Ajouter une carte de quiz

Dans n'importe quel `js/data/cards-XX.js` :

```js
{ t: 'Mon theme', c: 'Categorie', q: [
  { q: 'Question facile ?', o: ['Bonne', 'Mauvaise', 'Autre', 'Encore'], a: 0 },  // QCM
  /* ... 8 autres, de plus en plus dur ... */
  { q: 'Question tres pointue ?', a: 'La reponse' }                               // réponse libre
]}
```
Exactement 10 questions, de la plus facile (niveau 1) à la plus dure (niveau 10).

### Ajouter une case

Créer `js/tiles/machin.js`, l'ajouter dans `index.html`, déclarer le type dans
`K.TILE_TYPES` (state.js) et l'ajouter à la liste `specials` de `board.js` :

```js
K.registerTile('machin', async function (ctx) {
  const choix = await K.ask(ctx.player, { kind: 'choice', title: '...', a: 'A', b: 'B' });
  return [{ id: ctx.player.id, delta: choix === 'a' ? 2 : -2 }];
});
```

`K.ask` s'occupe de tout : en 1 téléphone il affiche « passe le téléphone à X »
puis la question ; en multi il l'envoie sur le téléphone du joueur concerné et
affiche un écran d'attente sur celui de l'hôte.

---

## Mettre le jeu en ligne

**Le mode 1 téléphone marche sur n'importe quel hébergement.** Ce sont des
fichiers statiques : envoie `index.html`, `css/` et `js/` par FTP, sur GitHub
Pages, Netlify, Vercel, Cloudflare Pages… aucun build, aucune dépendance.

**Le mode multi-téléphones demande un hébergeur qui fait tourner Node** avec un
processus qui reste allumé et qui laisse passer les WebSockets.

| Hébergement | 1 téléphone | Multi-téléphones |
|---|---|---|
| Mutualisé classique (OVH perso, o2switch, Ionos…) | ✅ | ❌ pas de Node |
| GitHub Pages, Netlify, Vercel, Cloudflare Pages (statique) | ✅ | ❌ pas de processus persistant |
| Fonctions serverless (Netlify/Vercel Functions) | ✅ | ❌ pas de WebSocket durable |
| VPS (OVH, Hetzner, Scaleway, DigitalOcean…) | ✅ | ✅ |
| PaaS à processus (Render, Railway, Fly.io, Koyeb, Clever Cloud) | ✅ | ✅ |

### Sur Netlify (ou tout hébergement statique)

Netlify sert très bien le jeu, mais ne peut pas héberger le serveur de salons :
ses fonctions sont *serverless*, elles ne gardent pas de WebSocket ouvert ni la
mémoire des parties en cours. La solution : **le jeu reste sur Netlify, seul le
serveur de salons va ailleurs** (Render, Railway, Fly.io… un plan gratuit suffit).

1. Déploie le dépôt sur Netlify tel quel. Le mode 1 téléphone marche déjà.
2. Déploie le même dépôt sur Render en *Web Service* :
   build `npm install`, start `node server/server.js`. Render fournit `PORT` et
   le certificat. Tu obtiens une adresse du type `kwa-xxxx.onrender.com`.
3. Sur ce service, mets deux variables d'environnement :

   ```
   KWA_ORIGINS = https://monjeu.netlify.app
   KWA_CODE_LEN = 6
   ```

4. Dans **`js/config.js`**, renseigne l'adresse du serveur, en `wss://` :

   ```js
   KWA.CONFIG = {
     server: 'wss://kwa-xxxx.onrender.com'
   };
   ```

5. Redéploie Netlify. C'est tout.

`KWA_ORIGINS` empêche n'importe quel autre site d'utiliser ton serveur (une
origine inconnue reçoit un `403` à la poignée de main). Un site en `https` ne
peut ouvrir que du `wss://` — si tu laisses `ws://`, le jeu te le dit clairement
au lieu d'échouer en silence.

> Sur les plans gratuits, le service s'endort après quelques minutes sans trafic.
> Le premier joueur qui crée un salon attend alors ~30 s le temps du réveil ;
> le jeu affiche un message plutôt que de tourner dans le vide.

### Sur un VPS, derrière nginx

Le serveur écoute sur `PORT` (8080 par défaut) et sert aussi les fichiers.
Il faut que nginx laisse passer l'*upgrade* WebSocket, sinon la connexion est
refusée en silence :

```nginx
location / {
    proxy_pass         http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade    $http_upgrade;   # indispensable
    proxy_set_header   Connection "upgrade";       # indispensable
    proxy_set_header   Host       $host;
    proxy_read_timeout 3600s;
}
```

En HTTPS, le jeu bascule tout seul en `wss://` — un site en https ne peut pas
ouvrir de `ws://`, donc le certificat est obligatoire dès que le site est en https.

### Sur un PaaS

Rien à configurer : la plateforme fournit `PORT`, `npm start` lance le serveur,
et les WebSockets passent par défaut. Vérifie juste que le service est de type
*web / long-running*, pas *serverless*.

### Sous-dossier

Le jeu marche aussi servi sous `https://monsite.fr/kwa/` : le client ouvre son
WebSocket sur le dossier courant, donc `wss://monsite.fr/kwa/`. Il suffit que le
proxy route ce chemin vers Node.

### Réglages pour un site public

```bash
KWA_CODE_LEN=6 PORT=8080 npm start
```

`KWA_CODE_LEN` allonge le code du salon. **Trois chiffres, ça ne fait que 900
combinaisons** : parfait entre amis sur le même Wi-Fi, mais sur un site ouvert
n'importe qui peut tomber sur un salon en tapant au hasard. Six chiffres rendent
ça impossible en pratique. Le client accepte 3 à 8 chiffres sans rien changer.

### Ce qu'il faut savoir avant d'ouvrir au public

- **Pas de reprise de connexion.** Si un téléphone perd le réseau en pleine
  partie, il ne se rebranche pas tout seul : il faut relancer une partie. Un
  battement de cœur toutes les 25 secondes évite les coupures dues aux proxys,
  mais pas une vraie perte de réseau.
- **Les salons vivent en mémoire.** Redémarrer le serveur ferme les parties en
  cours, et un salon disparaît dès que l'hôte s'en va.
- **Les images des joueurs transitent par le serveur** (jusqu'à 400 Ko chacune)
  et sont relayées à tous les joueurs du salon. Rien n'est stocké sur le disque.
- Les trames sont plafonnées à 1 Mo et les connexions muettes sont fermées au
  bout de 70 secondes.

---

## Tests

```bash
npm test
```

Démarre le serveur, puis joue quatre passes : intégrité des 2000 questions,
génération du plateau (et sa reconstruction à l'identique), création d'un salon,
et **une vraie partie à trois téléphones** dans un DOM headless — salon, tirage
de l'ordre, dé chez le bon joueur, positions et bulles de Kwa identiques partout.

## Le mode multi ne marche pas ?

| Symptôme | Cause | Ce qu'il faut faire |
|---|---|---|
| Pas de bouton « Créer un salon », un encart rouge à la place | La page est ouverte depuis le fichier (`file://`) | Lancer `node server/server.js` et ouvrir l'adresse `http://…:8080` affichée |
| « Connexion refusée » | Le serveur n'est plus lancé | Relancer `node server/server.js` |
| « Le serveur ne répond pas » | Mauvais Wi-Fi, ou pare-feu Windows qui bloque Node | Même réseau pour tous ; autoriser Node sur le réseau privé |
| « Aucun salon avec ce code » | Faute de frappe, ou salon fermé quand l'hôte est parti | Refaire créer le salon |
| Les autres téléphones ne chargent même pas la page | Pare-feu Windows | Autoriser `node.exe` sur le réseau privé |

Le bouton reste grisé sur « Connexion… » pendant sept secondes maximum : passé ce
délai, le jeu explique ce qui bloque au lieu d'attendre indéfiniment.
