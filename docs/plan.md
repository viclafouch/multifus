# Plan

Ce qui reste à faire, une ligne par chose. Une ligne faite se supprime, elle ne
se coche pas.

## Publier la première version

- [ ] Remplacer le logo du scaffolder Tauri, dans `src-tauri/icons`
- [ ] Créer un certificat **Developer ID Application** sur developer.apple.com, et l'exporter en `.p12`
- [ ] Poser les huit secrets du workflow `release` dans les réglages du dépôt : `APPLE_CERTIFICATE` (le `.p12` en base64), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` (un mot de passe d'application), `APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (vide)
- [ ] Trancher le certificat Authenticode de Windows, une fois la version macOS publiée
- [ ] Confirmer `crate-type = ["rlib"]` par un `cargo build` sur le Mac
- [ ] Trancher les Mac Intel : le workflow ne compile que `aarch64-apple-darwin`, et le README annonce macOS 10.13, que seul un Mac Intel porte. Ajouter la cible, ou remonter le plancher à macOS 11

La paire de clés de l'updater existe déjà, dans `~/.tauri/multifus.key` et son
`.pub`, et sa moitié publique est le champ `plugins.updater.pubkey` de
`tauri.conf.json`. En régénérer une rendrait insignables les mises à jour des
versions déjà installées.

## Rattraper Dracoon sur la vitesse

Ce qui reste de [plan-performances.md](./plan-performances.md), la scrutation
des notifications étant faite. Les deux sont du Windows seul.

- [ ] Déverrouiller le premier plan une fois au démarrage, `SPI_SETFOREGROUNDLOCKTIMEOUT` à zéro, et le rendre en quittant : chaque bascule cesse de payer `AttachThreadInput`
- [ ] Mettre en cache le lien entre un identifiant de process et « c'est un client », pour cesser d'ouvrir un process par fenêtre visible à chaque tour

Rien n'a été mesuré sur le Mac. La bascule y paie plusieurs allers-retours
Accessibilité vers un client qui rend peut-être un combat, et aucun banc ne dit
ce qu'elle coûte.

- [ ] Chronométrer une bascule sur le Mac, six clients ouverts, comme `toast-latency` chronomètre une notification sur Windows
- [ ] Chronométrer l'ouverture de la roue sur le Mac : elle lit le curseur par la boucle d'évènements, puis fait le tour des écrans. `monitor_from_point` ferait moins de travail, mais tao y compare des points logiques à un curseur physique, et il ne trouve rien sur un écran Retina

## Vérifier sur une vraie soirée, sur les deux machines

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
- [ ] L'allumer au raccourci sans un seul client ouvert : il reste allumé
- [ ] Laisser la team se déconnecter toute seule, les clients ouverts sur l'écran de connexion : le Déplacement rapide s'éteint, et la ligne du journal se lit sans mentir
- [ ] Le tour ne marque pas d'à-coup pendant l'extinction

### Les raccourcis

- [ ] La même combinaison frappée hors du jeu ne fait rien
- [ ] « Remettre les touches d'origine » redonne les sept combinaisons
- [ ] Ctrl+Maj+A n'est pris ni par Dofus Retro ni par un autre logiciel, et agrandit les clients depuis le bureau comme depuis le jeu
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
- [ ] Le Déplacement rapide allumé : un clic gauche pendant la roue est mangé, et le clic d'après part du personnage choisi
- [ ] La bannière se pose sur l'arrivée par la roue comme sur l'arrivée par un clic
- [ ] Cmd+Tab pendant le maintien : la roue part au tour suivant
- [ ] Sur le Mac, lâcher la lettre en gardant Ctrl et Maj : la roue se ferme
- [ ] La jauge d'un bout à l'autre, 280 puis 360 : le dessin suit, et le bouton pose la vraie roue à la bonne taille au milieu de l'écran
- [ ] La toute première ouverture après le lancement tombe au milieu, à la même place que les suivantes
- [ ] Deux ouvertures de suite avec deux équipes différentes : la seconde ne montre à aucun moment celle d'avant
- [ ] Un diamètre de 720 hérité d'une version d'avant revient à 360 au démarrage
- [ ] Le dessin de l'écran montre six faux personnages même sans un client ouvert, et la jauge Personnages les compte de un à huit sans rien enregistrer
- [ ] « Voir en vrai » pose les faux personnages même avec toute la team connectée, et le survol y allume les parts comme dans le jeu
- [ ] La jauge Personnages à trois, puis « Voir en vrai » : la vraie roue en porte trois
- [ ] Relâcher sur une part de l'aperçu ne ramène aucune fenêtre devant, et le journal se tait
- [ ] Vider la combinaison dans l'écran Raccourcis : l'écran Roue le dit en tête, et le maintien ne fait plus rien

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

- [ ] Deux clients ouverts : le roster les voit, les sept raccourcis et l'AutoFocus répondent
- [ ] Un combat sur un personnage exclu : sa notification disparaît du centre de notifications, et aucune fenêtre ne bouge
- [ ] Un type décoché dans l'AutoFocus : même chose
- [ ] Une soirée entière : le centre de notifications ne garde rien de Dofus
- [ ] Un client passé en vrai plein écran : ce que devient la bascule, et où passe la bannière
- [ ] Un client qui s'ouvre pendant qu'on joue ailleurs prend le premier plan sur Windows, et pas sur macOS
- [ ] Six clients connectés : six pseudos dans la barre des tâches, et quitter Multifus rend les six titres
- [ ] Une tête de classe posée puis Multifus tué au `Ctrl+C` : au démarrage suivant, la classe remise à vide rend l'icône de Dofus Retro
- [ ] Un personnage changé sans quitter le client : le titre court suit
