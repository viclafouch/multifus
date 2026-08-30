# Plan

Ce qui reste à faire, une ligne par chose. Une ligne faite se supprime, elle ne
se coche pas.

## Publier la première version

- [ ] Remplacer le logo du scaffolder Tauri, dans `src-tauri/icons`
- [ ] Créer un certificat **Developer ID Application** sur developer.apple.com, et l'exporter en `.p12`
- [ ] Poser les huit secrets du workflow `release` dans les réglages du dépôt : `APPLE_CERTIFICATE` (le `.p12` en base64), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` (un mot de passe d'application), `APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (vide)
- [ ] Trancher le certificat Authenticode de Windows, une fois la version macOS publiée
- [ ] Confirmer `crate-type = ["rlib"]` par un `cargo build` sur le Mac
- [ ] Trancher les Mac Intel : le workflow ne compile que `aarch64-apple-darwin`, et le README annonce Apple Silicon. Ajouter la cible `x86_64-apple-darwin`, ou s'en tenir là

La paire de clés de l'updater existe déjà, dans `~/.tauri/multifus.key` et son
`.pub`, et sa moitié publique est le champ `plugins.updater.pubkey` de
`tauri.conf.json`. En régénérer une rendrait insignables les mises à jour des
versions déjà installées.

## Rattraper Dracoon sur la vitesse

Les trois points Windows sont faits, et mesurés : la scrutation des
notifications répond en 99 ms de moyenne à 100 ms d'intervalle.

Rien n'a été mesuré sur le Mac. La bascule y paie plusieurs allers-retours
Accessibilité vers un client qui rend peut-être un combat, et aucun banc ne dit
ce qu'elle coûte.

- [ ] Faire tourner `cargo run --release --example switch-latency` sur le Mac, six clients ouverts, et écrire le chiffre ici
- [ ] Chronométrer l'ouverture de la roue sur le Mac : elle lit le curseur par la boucle d'évènements, puis fait le tour des écrans. `monitor_from_point` ferait moins de travail, mais tao y compare des points logiques à un curseur physique, et il ne trouve rien sur un écran Retina

## Vérifier sur une vraie soirée, sur les deux machines

### Ce que le tour de la documentation Tauri a changé

Une capacité refusée ne se lit ni dans le journal ni à l'écran : l'appel échoue et
Multifus se tait. Ça se voit comme un écran qui reste vide ou un réglage qui ne
prend pas, jamais comme une ligne. Au moindre doute, `tauri build --debug` ouvre la
console.

- [ ] Une soirée entière, les quatre fenêtres ouvertes : la politique de sécurité du contenu ne casse ni une police, ni une image, ni un appel
- [ ] La roue, la bannière et le tableau des runes répondent avec `core:event:default` pour seule capacité
- [ ] Le lancement : le Dock rebondit, rien ne s'affiche, puis la fenêtre arrive peinte, sans passer par le brun
- [ ] Le lancement à la session, la barre système présente : rien ne s'ouvre, comme avant
- [ ] Le presse-papiers copie encore, depuis l'écran des messages privés et depuis À propos
- [ ] La mise à jour installée depuis Windows rend les titres, les têtes de classe, les boutons de la barre des tâches et le délai du premier plan

### Ce que la montée des dépendances laisse ouvert

- [ ] Le code Windows n'a pas été compilé ici : `cargo check --target x86_64-pc-windows-msvc` échoue, `ring` demandant un compilateur C pour Windows. La CI le compile sur `windows-latest`, et la publication en dépend
- [ ] Tirer une ligne du roster par sa poignée, sur les deux machines : `@dnd-kit/react` suit le geste par des signaux, et le compilateur React mémoïse maintenant la ligne. Les tests la voient à travers un double, pas la vraie bibliothèque
- [ ] Une soirée entière avec le compilateur React allumé : la roue, la bannière et le tableau des runes redessinent à chaque tour, et c'est là que le gain se verrait

### L'écran À propos

- [ ] Le panneau du haut dit la vraie version, le vrai système et le vrai chemin, sur le Mac comme sur Windows
- [ ] Le bouton du dossier ouvre le Finder sur `config.json`, l'Explorateur sur Windows
- [ ] « Aller voir » et « Aller le dire » ouvrent le navigateur par défaut, Multifus restant où il est
- [ ] Le navigateur absent ou refusé : le journal porte une ligne, et rien ne casse
- [ ] La ligne de démarrage du journal se lit « sur macOS 26.0.0 (arm64) »

### Les personnages, l'exclusion et le principal

- [ ] Un combat sur un personnage exclu : aucune fenêtre ne bouge, et le journal porte « personnage exclu, sa fenêtre reste où elle est »
- [ ] Le même réintégré : le combat suivant le ramène devant
- [ ] Deux hommes connectés, un exclu : le sigil homme reste allumé, et le dernier homme exclu l'éteint
- [ ] Un clic sur le sigil éteint réintègre tous les hommes, et le rang se renumérote
- [ ] Un personnage sans sexe : les deux sigils répondent, et l'infobulle le nomme
- [ ] Un exclu qui se déconnecte garde son rouge, en plus pâle, et le retrouve entier à son retour
- [ ] Le rouge tient au survol, et le tirage par la poignée marche sur une ligne exclue
- [ ] La barre système écrit « Bravo (exclu) »
- [ ] Le raccourci Exclure agit sur la fenêtre du dessus, et le journal le dit
- [ ] Désigner un principal connecté, frapper le raccourci depuis une autre fenêtre du jeu : il passe devant, et le journal le dit
- [ ] En désigner un deuxième : le premier s'éteint tout seul
- [ ] Recliquer le bouton allumé : plus personne n'est principal, et le raccourci ne fait rien en le disant
- [ ] Un déconnecté comme principal : la frappe ne bouge rien, et le journal écrit « la fenêtre de Bravo a disparu ». Sur un personnage jamais connecté depuis le lancement, elle parle d'une fenêtre qui n'a jamais existé : à juger sur pièce
- [ ] Un exclu comme principal : le bouton garde sa couleur sur la ligne barrée, et le raccourci le ramène quand même devant
- [ ] Quitter Multifus et le relancer : le principal est le même
- [ ] Frapper le raccourci en étant déjà sur le principal : rien, et le journal le dit
- [ ] Ctrl+Maj+Espace en combat, la barre de sorts ouverte : le jeu ne reçoit pas l'espace, et rien ne se lance
- [ ] Retirer le personnage du roster : le principal part avec lui
- [ ] Le bouton allumé se voit sur une ligne barrée en rouge, et l'éteint se voit sans survoler la ligne

### Le Déplacement rapide

- [ ] Le menu de la barre système dit « Déplacement rapide »
- [ ] Cliquer un coin pose la vraie bannière dans ce coin, deux secondes et demie
- [ ] Sur deux écrans, la pastille change la forme de l'écran dessiné, et la bannière dessinée rétrécit sur le plus grand des deux
- [ ] La bannière porte « Déplacement rapide » tant qu'on n'est arrivé sur personne
- [ ] Deux clients ouverts, Déplacement rapide allumé, fermer les deux : la case se décoche seule, la barre système dit ÉTEINT, la bannière part
- [ ] Rouvrir un client : le Déplacement rapide reste éteint, et le raccourci le rallume
- [ ] Le raccourci du Déplacement rapide frappé dans un traitement de texte : rien, et la touche arrive au texte
- [ ] Laisser la team se déconnecter toute seule, les clients ouverts sur l'écran de connexion : le Déplacement rapide s'éteint, et la ligne du journal se lit sans mentir
- [ ] Le tour ne marque pas d'à-coup pendant l'extinction

### Les raccourcis

- [ ] Sur Windows, une bascule au raccourci répond aussi vite qu'avant, six clients ouverts
- [ ] Multifus quitté proprement : le délai du premier plan revient à ce qu'il était, `HKCU\Control Panel\Desktop\ForegroundLockTimeout`

- [ ] La même combinaison frappée hors du jeu ne fait rien, Déplacement rapide et Agrandir tout compris
- [ ] « Remettre les touches d'origine » redonne les huit combinaisons
- [ ] Ctrl+Maj+A n'est pris ni par Dofus Retro ni par un autre logiciel, et agrandit les clients depuis le jeu
- [ ] Une touche posée sur un personnage le ramène devant, et « Remettre les touches d'origine » n'y touche pas

### La roue

- [ ] Maintenir la combinaison de la roue hors du jeu : rien ne s'ouvre
- [ ] Maintenir dans le jeu, ne pas bouger la souris, lâcher : personne ne bouge
- [ ] Maintenir, aller sur une part, lâcher : la fenêtre passe devant, et le journal porte une ligne
- [ ] Lâcher au centre, et lâcher hors du disque : rien, et le journal se tait
- [ ] Le curseur dans un coin de l'écran : la roue s'ouvre quand même au milieu, la souris ne bouge pas, et aucune part ne s'allume tant qu'on n'est pas sur le disque
- [ ] Sur deux écrans, la roue s'ouvre au milieu de celui où est la souris
- [ ] Un seul personnage connecté : la roue s'ouvre sur une part
- [ ] Aucun personnage connecté : la roue s'ouvre vide et le dit
- [ ] La part de la fenêtre du dessus est peinte d'un ambre pâle, et le principal porte son étoile
- [ ] La roue par-dessus la barre de sorts : rien ne s'allume dans le jeu derrière le disque, et tout y répond de nouveau la roue fermée
- [ ] Un clic sur une part, Déplacement rapide éteint puis allumé : la fenêtre passe devant, Multifus reste derrière, et le jeu n'a rien vu du clic
- [ ] Un clic droit pendant la roue fait la même chose qu'un clic gauche
- [ ] Un clic au centre du disque, puis hors du disque : la roue se ferme et personne ne bouge
- [ ] Après le clic, le personnage cliqué reçoit le clic suivant, et il marche
- [ ] Deux roues coup sur coup, un clic dans chacune : les deux ramènent la bonne fenêtre
- [ ] La bannière se pose sur l'arrivée par la roue comme sur l'arrivée par un clic
- [ ] Cmd+Tab pendant le maintien : la roue part au tour suivant
- [ ] Sur le Mac, lâcher la lettre en gardant Ctrl et Maj : la roue se ferme
- [ ] La jauge d'un bout à l'autre, 280 puis 360 : le dessin suit, et le bouton pose la vraie roue à la bonne taille au milieu de l'écran
- [ ] La toute première ouverture après le lancement tombe au milieu, à la même place que les suivantes, et le survol y allume les parts dès ce premier coup
- [ ] Deux ouvertures de suite avec deux équipes différentes : la seconde ne montre à aucun moment celle d'avant
- [ ] Un diamètre de 720 hérité d'une version d'avant revient à 360 au démarrage
- [ ] Le dessin de l'écran montre six faux personnages même sans un client ouvert, et la jauge Personnages les compte de un à huit sans rien enregistrer
- [ ] « Voir en vrai » pose les faux personnages même avec toute la team connectée, et le survol y allume les parts comme dans le jeu
- [ ] La jauge Personnages à trois, puis « Voir en vrai » : la vraie roue en porte trois
- [ ] Relâcher sur une part de l'aperçu ne ramène aucune fenêtre devant, et le journal se tait
- [ ] Vider la combinaison dans l'écran Raccourcis : l'écran Roue le dit en tête, et le maintien ne fait plus rien

### Le tableau des runes

- [ ] La combinaison frappée dans le jeu pose le tableau, et la même le retire
- [ ] Frappée hors du jeu, elle ne pose rien
- [ ] Le tableau se prend n'importe où, sauf sur sa croix, et le jeu garde le premier plan pendant tout le geste
- [ ] Un clic sec ne déplace rien et n'enregistre rien
- [ ] La fenêtre du jeu déplacée, le tableau suit sans traîner à l'œil
- [ ] Le tableau poussé hors de l'écran y reste, et le bouton « Remettre » le ramène en haut à droite du client
- [ ] La ligne de la barre système le ramène aussi, sans que Multifus se fige
- [ ] La barre système montre et cache le tableau, et sa coche dit l'état
- [ ] Les deux jauges bougent l'aperçu à chaque cran, et n'écrivent qu'une fois lâchées
- [ ] La jauge de taille poussée à fond : le tableau tient entier à l'écran, la dernière rune comprise
- [ ] À 100 de transparence, le tableau se lit encore et prend toujours les clics
- [ ] Tous les poids portent le même blanc, et aucune ligne ne ressort
- [ ] Le tableau ne se pose pas sur un client en plein écran, et reste sur un client simplement agrandi
- [ ] Sur un écran Retina et sur deux écrans d'échelles différentes, le tableau n'est ni deux fois trop grand ni deux fois trop petit
- [ ] L'interrupteur des autres personnages bougé aperçu ouvert tient une fois l'aperçu fermé
- [ ] Le tableau posé, on passe sur une autre fenêtre du jeu puis sur un navigateur : il suit l'interrupteur, et revient au retour
- [ ] L'aperçu se ferme à Échap et à la croix, depuis n'importe quel écran de Multifus
- [ ] Vider la combinaison dans l'écran Raccourcis : l'écran Tableau des runes le dit en tête

### Agrandir tout

- [ ] Six clients ouverts avant Multifus, un clic sur la ligne de la barre système : les six couvrent l'écran, et le journal dit « demandé à 6 clients ». Le journal ne prouve rien de ce qui a bougé, c'est l'écran qu'il faut regarder
- [ ] Le panneau des Paramètres dit « 6 clients en petit » avant le geste, puis « Tout est agrandi » après
- [ ] Rester sur l'écran Paramètres et remettre une fenêtre en petit à la main : le panneau le voit dans la seconde, sans changer d'écran
- [ ] Quitter l'écran Paramètres, remettre une fenêtre en petit : Multifus ne lit plus rien, et le compte est juste au retour
- [ ] Retirer l'autorisation d'Accessibilité, écran Paramètres ouvert : le panneau dit « Fenêtres illisibles », pas « Aucun client ouvert »
- [ ] Cliquer le bouton avec six clients ouverts : l'interface ne se fige pas le temps des six allers Accessibilité
- [ ] Le même geste sans un seul client ouvert : le journal dit qu'aucun client n'est ouvert, et rien ne casse
- [ ] Un client sur l'écran de connexion s'agrandit comme les autres
- [ ] Le bouton des Paramètres écrit la même ligne de journal que la barre système, la porte près

### Le clavier

- [ ] Mac AZERTY : l'écran Raccourcis écrit « Z » pour la roue, et la touche Z l'ouvre
- [ ] Mac AZERTY : enregistrer un raccourci en appuyant sur W écrit « W », et la touche W le déclenche
- [ ] Mac AZERTY : les signes suivent aussi, `Semicolon` s'écrit « M »
- [ ] Mac QWERTY et Windows : les lettres restent celles d'avant
- [ ] Une disposition non latine, grec ou cyrillique : les lettres s'écrivent, et rien ne casse
- [ ] Changer de disposition sans quitter Multifus garde les lettres d'avant, la table ne partant qu'au démarrage

### Les réponses rapides

- [ ] La barre de gauche et la barre système ouvrent toutes deux « Réponses rapides »
- [ ] Une réponse rapide sans combinaison ne fait rien, et l'écran le dit
- [ ] Une réponse rapide sans texte non plus, et l'écran le dit aussi
- [ ] Une combinaison déjà prise par le Défilement est refusée par son nom
- [ ] Le texte copié avant un collage revient dans le presse-papiers après
- [ ] Le journal porte une ligne par collage

### Les fenêtres et les notifications

- [ ] Trente notifications d'une autre application en attente : Multifus ne chauffe pas, et l'AutoFocus répond encore
- [ ] Multifus lancé avec trois clients déjà ouverts n'agrandit rien
- [ ] Une fenêtre remise en petit à la main reste en petit
- [ ] Sur deux écrans, une fenêtre s'agrandit sur celui où elle est
- [ ] Un personnage laissé inactif un quart d'heure repasse déconnecté comme avant
- [ ] Le robot relié puis « Tout réinitialiser » : l'écran des messages privés redemande un jeton, et le trousseau du système ne garde plus le sien

## Vérifier sur le Mac

- [ ] Deux clients en fenêtre agrandie, Déplacement rapide allumé : la bascule ne fait plus glisser l'écran, et la bannière se pose bien au-dessus
- [ ] `⌥` + clic sur le bouton vert d'un client agrandit sans plein écran
- [ ] La note est là sur les paramètres et sur le Déplacement rapide
- [ ] Une soirée entière : ce que devient le centre de notifications, `dismiss` ne faisant rien sur le Mac là où Windows vide la file
- [ ] Une soirée avec l'écran Paramètres ouvert : ce que la lecture par seconde coûte, six clients ouverts
- [ ] Une fenêtre passée en vrai plein écran : ce qu'Agrandir tout en fait, et si le journal ment
- [ ] Ctrl+Maj+Espace, Ctrl+Maj+Gauche, Ctrl+Maj+Droite et Ctrl+Maj+A ne sont pris ni par Mission Control ni par la source de saisie

## Vérifier sur la machine Windows

- [ ] Lancer Multifus deux fois et regarder ce qui casse : deux icônes dans la barre système, un raccourci qui refuse de s'armer, deux écrivains sur le même fichier de réglages. Si ça casse, prendre le greffon `single-instance`, que Tauri demande d'enregistrer avant tous les autres
- [ ] Deux clients ouverts : le roster les voit, les huit raccourcis et l'AutoFocus répondent
- [ ] Un combat sur un personnage exclu : sa notification disparaît du centre de notifications, et aucune fenêtre ne bouge
- [ ] Un type décoché dans l'AutoFocus : même chose
- [ ] Une soirée entière : le centre de notifications ne garde rien de Dofus
- [ ] Un client passé en vrai plein écran : ce que devient la bascule, et où passe la bannière
- [ ] Un client qui s'ouvre pendant qu'on joue ailleurs prend le premier plan sur Windows, et pas sur macOS
- [ ] Six clients connectés : six pseudos dans la barre des tâches, et quitter Multifus rend les six titres
- [ ] Une tête de classe posée puis Multifus tué au `Ctrl+C` : au démarrage suivant, la classe remise à vide rend l'icône de Dofus Retro
- [ ] Un personnage changé sans quitter le client : le titre court suit
