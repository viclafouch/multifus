# L'accueil

Ce que voit quelqu'un qui vient d'installer Multifus, et pourquoi il repart en
croyant que le logiciel est cassé.

Ce chantier passe en dernier, tranché le 1er septembre 2026. Il est gros, six
étapes et deux systèmes, et tout ce qui l'attend se livre plus vite que lui. Les
relevés qu'il demandait sont pourtant faits, et écrits plus bas : ils ne se
reprennent pas.

## Le problème

Aujourd'hui, Multifus demande une autorisation et une seule. Sur le Mac,
l'Accessibilité. Sur Windows, l'accès des applications aux notifications. Elle
accordée, l'écran d'autorisation disparaît et Multifus se comporte comme si
tout était en place.

Ce n'est pas vrai. L'AutoFocus a besoin de quatre autres choses, et Multifus
n'en dit pas un mot :

- le jeu doit avoir le droit d'envoyer des notifications au système ;
- les notifications du système doivent être allumées ;
- le Mode Concentration, ou Ne pas déranger, doit être éteint ;
- et Dofus Retro doit avoir son propre réglage de notification allumé, dans le
  jeu.

Quatre portes fermées, aucune trace à l'écran, et un joueur qui conclut que
l'AutoFocus ne marche pas. C'est le manque le plus cher de Multifus : il coûte
un utilisateur à chaque installation ratée, et il ne se voit ni dans le code ni
dans les tests.

Le second manque suit le premier. Une autorisation retirée trois mois plus tard
ne se voit pas davantage. Multifus redevient sourd sans le dire.

## Ce que Multifus peut contrôler, et ce qu'il ne peut pas

C'est la contrainte qui décide de tout le dessin. Les deux systèmes ne se
laissent pas lire pareil, et l'accueil ne doit jamais faire semblant.

### Windows

| Ce qu'il faut                            | Multifus peut le lire                                     |
| ---------------------------------------- | --------------------------------------------------------- |
| Accès des applications aux notifications | oui, `UserNotificationListener.GetAccessStatus`           |
| Notifications du système allumées        | oui, `HKCU\...\PushNotifications`, `ToastEnabled`         |
| Notifications autorisées pour Dofus      | oui, `HKCU\...\Notifications\Settings\<AUMID>`, `Enabled` |
| Mode Concentration éteint                | oui, `FocusAssist` puis `NOC_GLOBAL_SETTING_DND`          |
| Notifications allumées dans le jeu       | non                                                       |

Quatre contrôles sur cinq. Dracoon les fait déjà tous les quatre, dans
`src/core/autofocus.py`, et relit le quatrième toutes les 300 ms.

L'AUMID de Dofus est à relever sur une machine Windows : Dracoon parcourt les
sous-clés et retient celles dont le nom contient « dofus ». C'est plus robuste
qu'un identifiant écrit en dur, et c'est ce qu'il faut reprendre.

### macOS

| Ce qu'il faut                             | Multifus peut le lire                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| Accessibilité                             | oui, `AXIsProcessTrustedWithOptions`                                   |
| Notifications autorisées pour Dofus Retro | non, aucune API publique ne donne les réglages d'une autre application |
| Concentration éteinte                     | non, plus d'API publique depuis macOS 12                               |
| Notifications allumées dans le jeu        | non                                                                    |

Un contrôle sur quatre. Le Mac ne laisse pas une application lire les réglages
de notification d'une autre, et l'état de Concentration n'est lisible que par
des fichiers privés qui changent à chaque version : un binaire notarisé n'a rien
à faire là-dedans.

**La Surveillance de la saisie n'est pas demandée**, essayé le 1er septembre 2026. Le tap de Multifus se crée avec `CGEventTapOptions::Default`, un tap actif
qui peut avaler le clic, et macOS ne réclame pour lui que l'Accessibilité. Le
relevé : autorisation retirée par `tccutil reset Accessibility
com.viclafouch.multifus`, l'Accessibilité seule rendue, puis le Déplacement
rapide armé sur deux clients. Le tap s'est créé, le journal ne porte aucun
`CGEventTapCreate` refusé, et Surveillance de la saisie est resté vide. Focus
Retro appelle `CGPreflightListenEventAccess` et demande donc deux autorisations
au joueur ; l'accueil du Mac n'a qu'une porte à faire ouvrir.

## La preuve par l'écoute

C'est ce qui sauve l'accueil sur le Mac, et ce qui le termine sur Windows.

Multifus sait dire une chose que personne d'autre ne sait dire : il a entendu
une notification de jeu. Le journal l'écrit déjà, à chaque fois.

La dernière étape de l'accueil n'est donc pas une case à cocher, c'est un essai
en vrai : « Ouvrez Dofus, connectez un personnage, et faites-vous appeler.
Lancez un combat, ou demandez à un ami de vous écrire. Multifus attend, et cet
écran se terminera tout seul. »

Ce que ça donne :

- Le Mac, qui ne peut rien contrôler, obtient quand même une réponse ferme.
  Une notification entendue prouve les cinq portes d'un coup.
- Windows garde ses quatre contrôles pour dire _laquelle_ est fermée, et
  l'essai final prouve que la chaîne entière tient.
- Le joueur finit l'accueil sur une réussite qu'il a provoquée lui-même, pas sur
  un bouton « Terminer » qui ne promet rien.

L'étape doit pouvoir se sauter, avec ses mots : « Je verrai plus tard. » Un
accueil qui retient quelqu'un en otage est un accueil qu'on quitte.

## Les étapes

Dans cet ordre, parce que chacune dépend de la précédente.

1. **Bienvenue.** Ce que fait Multifus, en trois lignes et une image. Rien à
   faire, un bouton pour commencer.
2. **L'autorisation de Multifus.** L'Accessibilité sur le Mac, l'accès aux
   notifications sur Windows. Celle qui existe déjà. Contrôlée.
3. **Les notifications du système.** Windows seul, deux contrôles en un écran :
   les notifications générales, et celles de Dofus. Sur le Mac, la même étape
   existe mais elle n'est pas contrôlée : elle explique et elle montre.
4. **Le Mode Concentration.** Contrôlé sur Windows, expliqué sur le Mac.
5. **Le réglage dans le jeu.** Aucun contrôle nulle part. Le chemin, relevé le
   1er septembre 2026 : Options, onglet **Général**, section **Divers**, la case
   **Notifications en arrière-plan**. Le client est le même sur les deux
   systèmes, et le libellé aussi. Une capture cadrée sur cette case, et rien
   d'autre.
6. **L'essai.** La preuve par l'écoute.

Une étape porte trois états, et jamais un de plus :

- **vue bonne** : Multifus l'a lue, elle est ouverte ;
- **vue fermée** : Multifus l'a lue, elle est fermée, et il dit quoi faire ;
- **non vérifiable** : Multifus ne peut pas savoir, il montre et il croit sur
  parole.

Le troisième état est celui qui fait la différence entre un accueil honnête et
un accueil qui ment. Il ne doit ressembler ni à un succès vert ni à un échec
rouge. Il doit se lire comme « à vous de voir ».

## Après l'accueil

L'accueil se passe une fois. Le contrôle, lui, ne s'arrête jamais.

Ce qui manque aujourd'hui, c'est un endroit qui porte l'état des autorisations
en permanence, et qui se voit sans être ouvert.

Ce qui est proposé :

- **Une entrée dans la barre de gauche**, à la place de rien, qui reprend les
  mêmes étapes hors de leur ordre : chacune avec son état, son explication et sa
  capture. C'est aussi là qu'on relance l'accueil.
- **Une pastille sur cette entrée** dès qu'un contrôle passe de bon à fermé.
- **Une bannière rouge en haut de l'écran**, mais seulement quand l'AutoFocus
  est vraiment cassé, c'est-à-dire quand un contrôle est fermé et que l'AutoFocus
  est allumé. Pas pour une étape non vérifiable, jamais pour une étape que
  l'utilisateur a sautée.

Le composant existe déjà : `components/config-notice.tsx` porte la même forme
pour les réglages illisibles, avec son titre, son corps, son bouton et son
« J'ai compris ». C'est lui qu'il faut reprendre, pas un deuxième.

La bannière ne se ferme pas définitivement. Un « J'ai compris » la cache jusqu'au
prochain démarrage : le problème, lui, reste dans l'onglet.

## Le ton et les mots

Le lecteur a entre dix et trente ans, il joue à Dofus Retro, et il n'a jamais
lu le mot « autorisation » ailleurs que dans un formulaire.

Ce qui marche :

- Une étape dit ce que le joueur y gagne, pas ce que le système exige.
  « Pour que Multifus vous amène devant la bonne fenêtre quand c'est votre
  tour », et non « Multifus requiert l'accès aux notifications ».
- Le vouvoiement, comme partout ailleurs dans Multifus. Tranché : l'accueil
  suit l'application, il ne parle pas une autre langue qu'elle.
- Un verbe par bouton, et le verbe du système : « Ouvrir les Réglages », parce
  que c'est ce qui est écrit sur l'écran d'en face.
- Le nom exact de chaque réglage, écrit comme le système l'écrit, en gras. Un
  joueur cherche une chaîne de caractères dans une liste, il ne lit pas une
  phrase.

Ce qui ne marche pas, et qu'on ne fera pas : « veuillez », « cliquez ici »,
« il est nécessaire de », une liste à puces de six lignes, et le mot « permission »
qui n'est pas français.

## Les captures d'écran

Une par étape et par système, donc dix au plus, et le moins possible.

Chacune est une dette : elle vieillit à chaque version de macOS et de Windows,
et une capture périmée fait plus de mal qu'aucune capture. Il faut donc :

- cadrer serré sur le réglage, jamais l'écran entier, pour que le cadre survive
  à une refonte des Réglages Système ;
- entourer d'un seul trait, de la couleur d'accent, ce sur quoi il faut cliquer ;
- les ranger dans `apps/desktop/src/assets/`, une par fichier, nommées par
  l'étape et le système ;
- ne jamais en mettre pour une étape que Multifus contrôle et sait ouvrir tout
  seul par un bouton.

Elles pèsent dans le binaire. Du PNG compressé, à la largeur exacte de l'écran
d'accueil, pas plus.

## Ce qu'il faut construire

Dans l'ordre, chaque ligne étant livrable seule.

- [ ] Relever l'AUMID de Dofus sur Windows, et vérifier que le parcours des
      sous-clés le trouve
- [ ] Côté Rust, remplacer `AuthorizationView { granted, listening }` par la
      liste des étapes et de leur état, un état par étape, et le troisième état
      compris
- [ ] Windows : lire les trois réglages du registre, et les relire à chaque
      `ListeningLost` comme au démarrage de l'écoute
- [ ] Journaliser chaque passage d'une étape de bonne à fermée, et l'inverse.
      C'est ce qui répond quand un joueur envoie son journal
- [ ] `/frontend-design` avant de dessiner, puis l'écran d'accueil et ses six
      étapes
- [ ] L'entrée dans la barre de gauche, sa pastille, et l'accueil qu'on relance
- [ ] La bannière rouge, reprise de `config-notice.tsx`
- [ ] Les captures d'écran, une fois les libellés relevés
- [ ] Poser les mots nouveaux dans [CONTEXT.md](../CONTEXT.md) : l'accueil,
      l'étape, le contrôle, la preuve

## Ce qu'on ne fait pas

Multifus ne touche à aucun de ces réglages. Il les lit, il les montre, il ouvre
la bonne page des Réglages, et c'est le joueur qui coche. Un logiciel qui
allume les notifications à la place de quelqu'un est un logiciel qu'on
désinstalle.

Il ne relit pas non plus le Mode Concentration toutes les 300 ms, comme
Dracoon. Le tour passe déjà chaque seconde, et c'est bien assez pour un réglage
qu'on change trois fois par an.

## À trancher

- L'accueil se rejoue-t-il après une mise à jour qui ajoute une étape, ou la
  nouvelle étape apparaît-elle seulement dans l'onglet.
- L'étape 5, le réglage dans le jeu, mérite-t-elle une étape à elle ou une
  ligne dans l'étape 3.
