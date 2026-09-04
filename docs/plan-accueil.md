# La prise en main

Ce que voit quelqu'un qui vient d'installer Multifus, et pourquoi il repartait en
croyant que le logiciel est cassé.

Le nom a été tranché le 4 septembre 2026 : « la prise en main », partout, à
l'écran comme dans le plan. « L'accueil » disait le premier écran, pas la suite,
et une entrée « Accueil » dans la barre de gauche se serait lue comme une page
d'accueil.

## Où on en est

Écrit et vert sur le Mac, tests compris. Le dessin a été repris une fois, du
tout au tout : la description en est plus bas. Rien n'a été regardé à l'écran :
la fenêtre de `tauri dev` est le seul endroit où ça se voit, et le fichier de
réglages n'ayant pas la clé, la prise en main part toute seule au prochain
lancement.

Ce qui reste tient en trois tas : le regard, les images, et Windows. Ils sont
plus bas.

## Le problème

Multifus demandait une autorisation et une seule. Sur le Mac, l'Accessibilité.
Sur Windows, l'accès des applications aux notifications. Elle accordée, l'écran
d'autorisation disparaissait et Multifus se comportait comme si tout était en
place.

Ce n'était pas vrai. L'AutoFocus a besoin de quatre autres choses :

- le jeu doit avoir le droit d'envoyer des notifications au système ;
- les notifications du système doivent être allumées ;
- le Mode Concentration, ou Ne pas déranger, doit être éteint ;
- et Dofus Retro doit avoir son propre réglage de notification allumé, dans le
  jeu.

Quatre portes fermées, aucune trace à l'écran, et un joueur qui conclut que
l'AutoFocus ne marche pas. C'était le manque le plus cher de Multifus : il
coûtait un utilisateur à chaque installation ratée.

## Ce que Multifus peut contrôler, et ce qu'il ne peut pas

C'est la contrainte qui décide de tout le dessin. Les deux systèmes ne se
laissent pas lire pareil, et la prise en main ne fait jamais semblant.

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
au joueur ; la prise en main du Mac n'a qu'une porte à faire ouvrir.

### Windows

| Ce qu'il faut                            | Multifus peut le lire                                     | Écrit  |
| ---------------------------------------- | --------------------------------------------------------- | ------ |
| Accès des applications aux notifications | oui, `UserNotificationListener.GetAccessStatus`           | oui    |
| Notifications du système allumées        | oui, `HKCU\...\PushNotifications`, `ToastEnabled`         | non    |
| Notifications autorisées pour Dofus      | oui, `HKCU\...\Notifications\Settings\<AUMID>`, `Enabled` | non    |
| Mode Concentration éteint                | oui, `FocusAssist` puis `NOC_GLOBAL_SETTING_DND`          | non    |
| Notifications allumées dans le jeu       | non                                                       | jamais |

Dracoon fait les quatre premiers, dans `src/core/autofocus.py`, et relit le
quatrième toutes les 300 ms. Multifus n'en fait qu'un pour l'instant : les trois
autres demandent l'AUMID de Dofus, qui se relève sur une machine Windows.
Dracoon parcourt les sous-clés et retient celles dont le nom contient « dofus »,
ce qui est plus robuste qu'un identifiant écrit en dur, et c'est ce qu'il faudra
reprendre. En attendant, les trois étapes sont **non vérifiables** sur Windows
comme sur le Mac : elles expliquent et elles montrent.

## La preuve par l'écoute

C'est ce qui sauve la prise en main sur le Mac, et ce qui la termine sur
Windows.

Multifus sait dire une chose que personne d'autre ne sait dire : il a entendu
une notification de jeu. La dernière étape n'est donc pas une case à cocher,
c'est un essai en vrai : « Ouvrez Dofus, connectez un personnage, et faites-vous
appeler. »

**Une notification entendue ouvre les étapes qu'elle a traversées.** Aucune ne
l'aurait laissée passer fermée, donc les notifications de Dofus, la
concentration et la case du jeu passent au vert ensemble, avec leur raison :
« C'est en place : le jeu a réussi à vous appeler. » C'est le seul contrôle du
Mac sur ces trois-là, et il vaut mieux qu'une lecture de réglage, ayant vu la
chose arriver. L'autorisation, elle, ne bouge pas : Multifus la lit lui-même, et
un joueur peut très bien la retirer après coup.

Le premier jet ne verdissait que l'étape de l'essai, alors que les deux versions
du plan promettaient les cinq portes. La relecture l'a attrapé.

**Avant la première lecture, Multifus ne dit rien.** `check_of` rendait
`Check::Blocked` pour une autorisation encore à `None`, donc le premier tour de
boucle affichait du rouge et allumait la pastille pour une chose que personne
n'avait encore regardée. Les trois états du Rust sont maintenant les trois états
de `granted` : lue et donnée, lue et refusée, pas encore lue.

**Un contrôle qu'on ne sait pas faire ne s'affiche plus.** Trois étapes sur cinq
disaient « À vous de voir » en gris, ce qui remplissait la page sans rien
apprendre. Elles ne disent maintenant rien du tout : l'état n'apparaît que quand
Multifus a lu quelque chose, en vert s'il tient et **en rouge** s'il est fermé.
Le rouge est mérité : sans l'autorisation, Multifus ne fait rien du tout.

**Ce n'est pas l'écran qui se termine tout seul.** Le plan le promettait ; c'est
faux en pratique, parce que le joueur est dans le jeu au moment où la
notification arrive et ne regarde pas Multifus. L'étape passe au vert et l'attend
là, et son bouton devient « Terminer ». Tant que rien n'a été entendu, le seul
bouton est « Je verrai plus tard ».

Le drapeau vit en mémoire, pas dans les réglages : redémarré, Multifus n'a plus
rien entendu tant que le jeu ne l'a pas rappelé. C'est honnête, et l'écran le dit
avec ses mots.

## Ce qui est écrit

**Côté Rust.** `Step` et `Check` dans `app/view.rs`, `OnboardingView { done,
steps }` dans l'instantané, `settings.onboarding_done` dans le fichier de
réglages, et deux commandes, `finish_onboarding` et `restart_onboarding`.
`AuthorizationView` n'a pas été remplacé comme le plan le disait : les deux
cohabitent, l'un dit si Multifus peut travailler, l'autre où en est le joueur.
Le remplacer aurait fait bouger la barre de gauche et l'écran des personnages
sans rien y gagner.

`open_authorization_settings` a disparu, remplacé par `open_system_page` et son
`SystemPage` dans `app/links.rs`, qui porte les trois pages des deux systèmes.
Les identifiants des panneaux du Mac sont relevés dans les paquets du système,
`/System/Library/ExtensionKit/Extensions`, et non devinés :
`com.apple.Notifications-Settings.extension` et
`com.apple.Focus-Settings.extension`.

**Côté écran.** `screens/onboarding/` : `guide.tsx` couvre la fenêtre entière,
`index.tsx` est l'écran permanent de la barre de gauche. `SystemPageButton` porte
le bouton qui ouvre une page du système, employé par les trois écrans qui en ont
un ; `@utility step-band` porte la taille du cadre d'image, employée par la
figure comme par la liste de l'essai. Les mots sont dans
`helpers/onboarding.ts`, les tables dans `constants/onboarding.ts`, et les mots
exacts des deux systèmes dans `systemWords` de `helpers/wording.ts`, à un seul
endroit pour les deux écrans.

**La prise en main n'a pas d'entrée à elle.** Elle en a eu une, entre Paramètres
et À propos, dans la barre de gauche comme dans la barre système. Onze lignes
faisaient défiler la barre de gauche, et un menu qui défile est un menu raté.
La liste vit donc en bas de l'écran des Paramètres, sous son propre titre, et
`Screen` est revenu à dix membres.

C'est la pastille « À régler » des **Paramètres** qui dit qu'un contrôle est
fermé, c'est-à-dire aujourd'hui que l'autorisation est retirée.

**Deux choses que personne n'avait demandées**, et qui restent. « Passer » saute
tout, là où le plan n'autorisait à sauter que l'essai : un écran qui retient
quelqu'un est un écran qu'on quitte pour de bon. Les pastilles du bas laissent
aller à n'importe quelle étape, ce qui fait d'elles le sommaire qu'on relit
après coup.

## Les six étapes

Dans cet ordre, parce que chacune dépend de la précédente.

1. **Bienvenue.** Ce que fait Multifus, en trois lignes. Rien à vérifier.
2. **L'autorisation.** L'Accessibilité sur le Mac, l'accès aux notifications sur
   Windows. Contrôlée, et le seul contrôle qui existe aujourd'hui.
3. **Les notifications.** Non vérifiable partout pour l'instant. Sur Windows,
   deux réglages en un écran une fois le registre lu.
4. **La concentration.** Non vérifiable partout pour l'instant. **Un seul mot
   partout** : « Concentration » sur le Mac, « Assistant de concentration » sur
   Windows, dans le titre, dans le chemin et sur le bouton. Le premier jet en
   employait trois, dont « Ne pas déranger » et « Centre de contrôle », et le
   chemin ne menait pas là où le bouton mène.
5. **Dans le jeu.** Aucun contrôle nulle part, et une capture. Le chemin, relevé
   le 1er septembre 2026 : Options, onglet **Général**, section **Divers**, la
   case **Notifications en arrière-plan**. Les trois premiers font le chemin, le
   quatrième fait le titre : le chemin dit où aller, le titre dit quoi cocher,
   et aucun des deux ne déborde.
6. **L'essai.** La preuve par l'écoute, et le seul écran vivant. À la place
   d'une image, la liste des personnages que Multifus voit connectés en ce
   moment. Elle marche pour qui n'en a qu'un : « connectez un personnage, il
   apparaît ici » se vérifie tout seul, sans deuxième compte ni ami sous la
   main. Le reste, se faire appeler, vient après.

   **Repris le 4 septembre 2026, la page paraissait vide.** Un cadre de 216
   points portait une pastille de vingt : rien ne se passait, et rien ne disait
   ce qu'on attendait. La bande porte maintenant les deux temps de l'essai, l'un
   sous l'autre et reliés par un trait : Multifus vous voit, puis le jeu vous
   appelle. Le point du temps en cours bat comme un sonar, parce que Multifus
   écoute vraiment, à la seconde ; celui du temps passé porte une coche verte et
   allume le trait. Le deuxième temps dit enfin ce qui déclenche un appel, un
   combat ou un message privé, que le corps de la page ne disait nulle part.

   **La réussite est le seul cadre de l'étape.** Le jeu entendu, la bande devient
   verte, éclôt une grande coche, écrit la phrase en corps de conduite et garde
   les pseudos connectés dessous : le pseudo est la preuve, il ne disparaît pas
   au moment où l'essai réussit. Le titre passe à « Tout est en place » et le
   corps promet la suite. La pastille
   d'état ne s'affiche plus sur cette page, la bande la disant en plus gros.
   `pageTitle` n'a pas bougé, la barre des Paramètres ayant besoin du nom de
   l'étape : c'est `pageHead` qui décide du titre et du corps de l'écran.

## Les mots du jeu, dans les trois langues

Le chemin et le titre de l'étape 5 se traduisent avec les mots du client, pris
dans les fichiers de langue d'Ankama et non devinés. Les trois premiers font le
chemin, le dernier fait le titre :

| Français                      | English                  | Español                         |
| ----------------------------- | ------------------------ | ------------------------------- |
| Options                       | Options                  | Opciones                        |
| Général                       | General                  | General                         |
| Divers                        | Miscellaneous            | Varios                          |
| Notifications en arrière-plan | Background notifications | Notificaciones en segundo plano |

**La limite assumée** : la langue de Multifus n'est pas celle du client. Un
joueur qui lit Multifus en espagnol et joue en français cherchera « Varios » et
trouvera « Divers ». Traduire reste le moindre mal, le cas courant étant les deux
dans la même langue, et la capture montre de toute façon un client français.

## Les images

Quatre emplacements sur six sont vides, et se montrent comme tels : un cadre
pointillé, l'icône de l'étape, et « Image à venir ». L'étape de l'essai n'a pas
de cadre du tout, elle montre les personnages en vrai.

Les seules vraies images sont les deux captures des options de Dofus :
`dofus-background-notifications.png` cadrée sur trois lignes de la section
Divers, et `dofus-options-general.png` qui porte la fenêtre entière, celle du
dialogue. `PAGE_SHOTS` les nomme `crop` et `full`.

**`PAGE_SHOTS` ne porte pas encore d'axe plateforme** : une image par étape, et
pas une par étape et par système. Le jour où les captures Windows arriveront,
c'est la table qu'il faudra ouvrir avant elles.

Ce qu'il faut y mettre, une par étape. Une vidéo courte, sans son, qui tourne en
boucle, ou une capture si le geste ne bouge pas.

1. **Bienvenue.** Trois clients Dofus côte à côte. Une notification de combat
   arrive sur le troisième, sa fenêtre passe devant toute seule. C'est la seule
   qui vend le logiciel, la seule qui mérite d'être filmée en entier, et celle
   qui doit occuper les 216 points en entier.
2. **L'autorisation, Mac.** Réglages Système ouvert sur Accessibilité, le curseur
   descend la liste et coche Multifus. Windows : Paramètres, Confidentialité,
   Notifications, l'interrupteur de Multifus passe à bleu.
3. **Les notifications, Mac.** Réglages Système, Notifications, la ligne Dofus,
   « Autoriser les notifications » s'allume. Windows : la page Notifications du
   système, l'interrupteur du haut, puis Dofus plus bas dans la liste.
4. **La concentration, Mac.** Le Centre de contrôle s'ouvre, la pastille
   Concentration est allumée, un clic l'éteint. Windows : la page de l'Assistant
   de concentration, sur Désactivé.
5. **Dans le jeu.** Faite, en deux tailles. Le cadre montre les trois lignes de
   la section Divers ; un bouton dans son coin ouvre la fenêtre entière des
   Options dans un dialogue, avec un zoom, pour qui ne trouve pas la case.
   `PAGE_SHOTS` porte donc `source` et `full`.
6. **L'essai.** Rien à faire : l'écran montre les personnages en vrai.

Chaque image est une dette : elle vieillit à chaque version de macOS et de
Windows. Il faut donc cadrer serré sur le réglage, jamais l'écran entier, et
compter en PNG compressé à la largeur exacte du cadre, 216 points de haut.

## Le dessin

Refait de fond en comble le 4 septembre 2026. Le premier jet reprenait le cadre
du logiciel, une colonne d'étapes à gauche et le texte à droite : c'était
l'application avec un sommaire de plus, et rien ne disait qu'on venait
d'installer quelque chose.

La prise en main ne ressemble donc à aucun autre écran de Multifus.

- **Pas de colonne.** La fenêtre entière est une scène : un dégradé chaud qui
  monte du haut et remonte du bas, le grain par-dessus, et rien d'autre.
- **Une seule colonne, au milieu.** Tout est centré sur le même axe : le rang de
  l'étape, le titre, le texte, le chemin, l'image, l'état, les boutons.
- **Du grand texte.** Le titre est en Fraunces à `--text-hero`, deux fois
  l'écriture des autres écrans, et le texte qui suit à `--text-lead`, plus grand
  que le corps du logiciel. Rien à lire en petit.
- **Les six pages ont le même squelette**, dans le même ordre, aux mêmes
  espacements. On change de page, pas de dessin.
- **Deux boutons dans les coins**, « Retour » à gauche et « Passer » à droite,
  discrets, hors de la colonne. Ils ne se disputent pas l'attention avec le
  bouton qui fait avancer. « Passer la prise en main » a été raccourci le
  4 septembre 2026 : dans un coin, le verbe suffit.
- **Six pastilles en bas**, une par étape, et on peut cliquer chacune. Elles
  remplacent la colonne : on voit où on en est et on va où on veut, sans qu'un
  sommaire mange le tiers de la fenêtre.

Le décor est le sien : `@utility stage` dans `index.css`, et l'écran ne pose pas
le `Backdrop` du logiciel.

**Rien ne défile aux tailles courantes**, deuxième passe du 4 septembre 2026.
Le `main` garde `overflow-y-auto` en filet : un dépassement est absorbé au lieu
de couper, et c'est pour ça que la vérification à l'œil reste dans la liste. L'étape 2 débordait : le
chemin passait à la ligne, le texte tenait sur trois lignes, et un état gris
disait qu'on ne savait rien. Trois mesures, dans cet ordre :

- Le chemin ne dépasse jamais **trois pastilles**, et chacune tient sur une
  ligne. Le chemin complet du Mac, quatre pastilles dont « Confidentialité et
  sécurité », passait à la ligne à 720 points : le bouton mène droit au panneau,
  le chemin n'est qu'un repli.
- Les titres et les textes visent la **même longueur d'une étape à l'autre**, à
  peu près trente caractères pour un titre et cent pour un texte. Les six pages
  ont alors la même hauteur, et l'œil ne se réajuste pas.
- L'image tient entre 88 et 216 points, `flex-1` entre les deux : elle prend la
  place qui reste et la rend quand il en manque. Sous 640 points de haut, la
  variante `short` rend le titre au corps des autres écrans et lâche le plancher
  de l'image.

## L'écran permanent

Il n'est plus un écran. Onze entrées faisaient défiler la barre de gauche, ce qui
condamnait la onzième : la liste est descendue en bas des Paramètres, sous un
`SectionTitle` à elle. `Screen::Onboarding` a disparu du Rust, de la barre
système et de `NAV_ITEMS`, et un fichier de réglages qui porte encore
`"onboarding"` part en quarantaine, ce que le dépôt autorise.

Refait le 4 septembre 2026, après une capture qui montrait le désordre : des
chemins qui passaient à la ligne, des pastilles à chasse fixe cerclées d'ambre
qui se lisaient comme des boutons, une capture de Dofus en pleine largeur qui
écrasait tout, une carrelette d'icône ambrée par ligne, et l'état posé en gros
médaillon vert sur sa propre ligne. Cinq accents pour cinq lignes.

C'est une **liste à cocher**, et rien d'autre. Une ligne se lit de gauche à
droite, toujours dans le même ordre :

1. **Un jeton rond**, qui porte le rang de l'étape. Il ne verdit jamais.

   La coche verte a été retirée le 4 septembre 2026, et c'est la règle qui
   compte : **une coche crée un binaire que Multifus ne peut pas tenir.** Coché
   contre pas coché, c'est fait contre pas fait, alors que trois étapes sur cinq
   ne sont ni l'un ni l'autre, elles sont illisibles. Un gris à côté d'un vert se
   lit « pas fait », et c'est faux.

   Le jeton ne parle donc que d'un problème : il devient un triangle rouge quand
   Multifus a lu et vu que ça bloque. Le rouge est une connaissance, pas une
   réclamation d'achèvement, et un gris à côté d'un rouge se lit « rien à
   signaler », ce qui est vrai.

   La prise en main plein écran garde son état vert, elle : une page à la fois,
   pas de voisin avec qui se comparer, et le vert y est la récompense de l'étape
   qu'on vient de faire.

2. **Le titre**, sur une ligne, coupé plutôt que passé à la ligne.
3. **Dessous, une seule ligne** : le chemin en gris, sans cadre ni chasse fixe,
   séparé par des chevrons ; ou, si l'étape est fermée, la phrase qui dit ce qui
   ne marche pas, en rouge. Jamais les deux.
4. **À droite, l'action**, une seule, en bouton fantôme : « Ouvrir » la page du
   système, ou « Voir l'image » pour l'étape du jeu.

La capture de Dofus a quitté la ligne : elle vit derrière son bouton, dans le
dialogue. Une image de mille points de large n'a rien à faire dans une liste.

« Revoir » est la dernière ligne de la même liste, dans la même grammaire, au
lieu d'un second panneau avec sa propre icône et sa propre description.

Un état vert ne s'écrit plus à l'écran, le jeton le dit. Il reste en `sr-only`
pour qui lit la page à l'oreille, et la liste est une `<ol>` pour que l'ordre
existe sans le jeton.

## La taille des boutons

`--text-sm` est passé de 14 à 13 points le 4 septembre 2026. C'est la taille que
`buttonVariants` pose sur tous ses boutons, et elle dépassait le texte qu'elle
accompagne : un titre de ligne fait 13,5 points, une note 11,5. Un bouton
d'action pesait donc plus lourd que le titre qu'il sert.

`text-sm` ne vit que dans `components/ui/` : le bouton, le champ, la liste
déroulante et les deux dialogues. Le changer les remet tous dans l'échelle du
logiciel d'un seul geste, sans toucher au texte que le logiciel écrit lui-même.

Dans la liste de la prise en main, les actions sont en plus passées de `sm` à
`xs`, la taille que le reste des lignes du logiciel emploie déjà.

## Les boutons de la prise en main

Repris le 4 septembre 2026. « Continuer » n'engageait à rien : on le clique cinq
fois d'affilée sans rien faire, et on arrive au bout persuadé d'avoir tout réglé.

Deux règles maintenant.

**Le bouton qui avance affirme.** Sur les trois étapes que Multifus ne peut pas
lire, il dit « C'est fait », avec une coche. Le joueur ne passe pas à la suite,
il déclare avoir agi, ce qui n'est pas la même phrase dans sa tête. Rien n'est
enregistré derrière : Multifus ne saura pas plus qu'avant, et n'en fera donc pas
un état à l'écran. C'est une affirmation faite à soi-même, et elle suffit à
faire ouvrir le panneau.

Sur l'étape de l'autorisation, jamais « C'est fait » : Multifus la lit lui-même,
et laisser quelqu'un déclarer faite une chose que l'écran voit fermée serait une
contradiction. Elle garde « Continuer ». La bienvenue dit « C'est parti », et la
dernière étape « Terminer » ou « Je verrai plus tard ».

**L'ambre appartient au bouton qui avance, toujours, et à lui seul.** Tranché le
4 septembre 2026, après un premier jet qui le donnait à l'action à faire.

L'essai des deux dessins a montré ceci : quand « Ouvrir Concentration » est plein
et « C'est fait » en contour, la page a deux chefs. L'œil hésite, et le bouton
ambre change de sens d'une page à l'autre, faute d'une action à ouvrir partout.
Avec l'ambre toujours au même endroit, à droite, on sait d'avance où cliquer pour
avancer, et les actions se rangent derrière.

Le poids croît donc de gauche à droite : le recours en fantôme, l'action en
contour, l'avancée en ambre.

| Page                   | Rangée, de gauche à droite                                   |
| ---------------------- | ------------------------------------------------------------ |
| Bienvenue              | **C'est parti**                                              |
| Autorisation, fermée   | Ouvrir Réglages Système · Autoriser Multifus · **Continuer** |
| Autorisation, ouverte  | Ouvrir Réglages Système · **Continuer**                      |
| Notifications, non lue | Ouvrir Notifications · **C'est fait**                        |
| Notifications, prouvée | Ouvrir Notifications · **Continuer**                         |
| Concentration          | comme les notifications                                      |
| Dans le jeu, non lue   | Voir l'image · **C'est fait**                                |
| Dans le jeu, prouvée   | Voir l'image · **Continuer**                                 |
| L'essai, rien entendu  | Je verrai plus tard                                          |
| L'essai, entendu       | **Terminer**                                                 |

Une action que Multifus a vue faite retombe en fantôme : le bouton reste, pour y
retourner, mais il ne réclame plus rien.

La dernière page est la seule sans ambre tant que Multifus attend, et c'est
voulu : le seul geste utile est d'aller jouer, et rien à l'écran ne le fait. Un
bouton ambre n'y proposerait que de partir.

Le bouton qui agrandit la capture a quitté le coin de l'image pour rejoindre la
rangée : c'est le geste de l'étape 5, il se range donc où se rangent les gestes.
La variante `secondary` ne sert plus qu'à la croix posée sur l'image agrandie,
seul endroit où un bouton doit rester lisible sur une photo.

## Le ton et les mots

Le lecteur a entre dix et trente ans, il joue à Dofus Retro, et il n'a jamais lu
le mot « autorisation » ailleurs que dans un formulaire.

Ce qui marche :

- Une étape dit ce que le joueur y gagne, pas ce que le système exige.
- **Une étape ne dit jamais comment ça marche derrière.** Elle dit ce qui casse
  si on ne la fait pas, et rien d'autre. « Votre Mac ne laisse aucune
  application voir les fenêtres des autres » explique un système d'exploitation
  à quelqu'un qui veut jouer.
- **Un seul fil traverse les quatre étapes du milieu** : Multifus écoute les
  notifications de Dofus, c'est comme ça qu'il sait quel personnage vous appelle.
  Chaque étape est une porte que cette phrase doit franchir, et le texte de
  l'étape dit laquelle.
- **Les mots du jeu.** Un personnage, une fenêtre, un combat, un message privé.
  Jamais « personne », jamais « utilisateur », jamais « application ».
- Le vouvoiement en français, comme partout ailleurs dans Multifus. Le tutoiement
  en espagnol, comme le reste du catalogue.
- Un verbe par bouton, et le verbe du système : « Ouvrir Réglages Système ».
- Le nom exact de chaque réglage, écrit comme le système l'écrit. **Les
  guillemets ne servent que dans les gros titres**, là où le nom du réglage se
  fond dans une phrase et doit s'en détacher : « Coupez « Concentration » ». Dans
  un chemin, tous les mots sont ceux du système : les guillemets y répètent ce
  que la forme dit déjà, et trois paires pour trois mots ne se lisent plus. Le
  chemin s'écrit donc nu, et ce sont les chevrons qui portent la séparation,
  assez gros et assez opaques pour se voir.

Ce qu'on ne fait pas : « veuillez », « cliquez ici », « il est nécessaire de »,
le mot « permission » qui n'est pas français, et **« macOS »**, qui est le nom
d'un système et pas celui de la machine du lecteur. On écrit « votre Mac ».

**Multifus se vend aussi à qui joue seul.** L'écran de bienvenue le dit dans sa
première phrase : « un seul personnage ou dix ». Le Déplacement rapide, le
Tableau des runes et les Réponses rapides n'ont jamais eu besoin d'un deuxième
compte, et promettre le multicompte dès la première ligne fait fermer la fenêtre
à celui qui n'en a qu'un.

**Aucune métaphore**, tranché le 4 septembre 2026. « Le feu vert » disait
l'autorisation dans toute la prise en main et jusque dans l'écran des
personnages ; il ne dit rien à qui ne connaît pas déjà le mot qu'il remplace.
L'écran dit « autorisation », le système dit « autorisation », et les deux se
cherchent avec le même mot.

## Ce qui reste

### À regarder, sur le Mac

- [ ] La prise en main de bout en bout, dans la fenêtre à sa taille d'origine
      puis à sa taille minimale, 720 sur 520 : **aucune page ne doit défiler**,
      et l'image doit rétrécir avant tout le reste.
- [ ] Les six pages : le titre tient sur deux lignes au plus, et le chemin tient
      sur une, à 720 points de large, en français, en anglais et en espagnol.
- [ ] Les pastilles du bas mènent bien à chaque étape, et celle de l'étape
      ouverte se voit du premier coup d'œil.
- [ ] « Ouvrir Notifications » et « Ouvrir Concentration » ouvrent bien les deux
      panneaux de Réglages Système, et pas la racine.
- [ ] « Autoriser Multifus » fait bien monter la fenêtre du système, et pas
      seulement au premier essai.
- [ ] L'image des options s'agrandit et se referme, à l'Échap comme au bouton.
- [ ] L'autorisation accordée pendant que l'écran est ouvert : l'étape passe au
      vert toute seule, à la seconde suivante.
- [ ] L'essai : connecter un personnage, il apparaît dans la liste de l'étape,
      seul et sans rien faire d'autre.
- [ ] L'essai, suite : se faire appeler dans le jeu, revenir sur Multifus,
      l'étape est verte et le bouton dit « Terminer ». Les trois étapes d'avant
      sont vertes elles aussi, et disent que le jeu a réussi à appeler.
- [ ] Retirer l'Accessibilité, Multifus tournant : l'entrée « Paramètres » de la
      barre de gauche prend sa pastille « À régler » dans la seconde.
- [ ] L'écran des personnages sans autorisation dit « Multifus attend votre
      autorisation », et son bouton « Ouvrir Réglages Système ».
- [ ] Terminée, la prise en main ne revient plus, même après un redémarrage.
      « Revoir » la rejoue.

### Les images

- [ ] Les cinq vidéos ou captures décrites plus haut, sur le Mac.
- [ ] Les mêmes sur Windows, pour les étapes 2, 3 et 4, dont le dessin diffère.
      `PAGE_SHOTS` doit d'abord gagner son axe plateforme : aujourd'hui elle ne
      porte qu'une image par étape.
- [ ] Une fois posées, `PAGE_SHOTS` les prend et le cadre pointillé disparaît.

### Windows

**Ce qui est déjà écrit et ne demande rien de plus** : les trois URL
`ms-settings:` de `links.rs`, les branches `IS_APPLE` de chaque titre, de chaque
texte et de chaque chemin, les mots du système dans `systemWords`, et tout le
dessin, qui ne connaît pas la plateforme. Il n'y a donc rien à réécrire, et
seulement à vérifier de l'œil.

**Ce qui demande vraiment Windows**, dans cet ordre, parce que les trois derniers
dépendent du premier :

- [ ] Relever l'AUMID de Dofus, et vérifier que le parcours des sous-clés le
      trouve.
- [ ] Lire les trois réglages du registre, et les relire à chaque
      `ListeningLost` comme au démarrage de l'écoute. Les trois étapes passent
      alors de non vérifiables à contrôlées.
- [ ] Journaliser chaque passage d'une étape de bonne à fermée, et l'inverse.
      Rien n'est écrit pour l'instant : seule l'autorisation peut basculer, et le
      journal la porte déjà sous `JournalEvent::Authorization`. C'est avec le
      registre que la ligne vaut le coup, quand quatre étapes pourront bouger.
- [ ] La bannière rouge en haut de l'écran quand un contrôle est fermé **et**
      que l'AutoFocus est allumé, jamais pour une étape non vérifiable.
      `components/config-notice.tsx` porte déjà la forme, et il lui faut un
      « J'ai compris » qui la cache jusqu'au prochain démarrage. La pastille de
      la barre de gauche, elle, est faite : elle suffit tant que l'autorisation
      est le seul contrôle, et une bannière rouge par-dessus l'écran
      d'autorisation qui dit déjà tout ferait doublon.
- [ ] Vérifier la prise en main sur Windows, écran par écran : les mots ne sont
      pas les mêmes, et rien n'y a jamais été lancé. En particulier le nom du
      mode Concentration, que Windows 11 a renommé en cours de route, et le
      chemin de l'accès aux notifications, qui a bougé de place entre deux
      versions.
- [ ] Les trois `ms-settings:` ouvrent bien la bonne page, et pas la racine des
      Paramètres.

## Le zoom de l'image

Le dialogue de l'étape 5 s'ouvrait en bas à droite avant de sauter au centre, et
se refermait dans un scintillement. Deux causes cumulées, trouvées le 4 septembre
2026 :

- `DialogContent` se centre par `top-1/2 left-1/2 -translate-x-1/2
-translate-y-1/2`, et les `@keyframes enter` de `tw-animate-css` écrivent
  `transform: translate3d(0,0,0) scale3d(…)`. Le temps de l'animation, le
  décalage de moitié disparaît : la fenêtre s'affiche un demi-écran trop bas et
  trop à droite, puis saute quand l'animation rend la main. Le dialogue de
  l'image se centre donc par `inset-0 m-auto h-fit w-fit`, que les `keyframes`
  ne peuvent pas toucher.
- Un `duration-200` et un `zoom-in-75` posés par-dessus les `duration-100` et
  `zoom-in-95` du composant. Deux classes qui écrivent la même variable, l'ordre
  de la feuille de style tranche, et le voile de fond partait avant l'image. Le
  dialogue ne surcharge plus ni la durée ni le zoom.

**La deuxième aussi.** Recentrer par `inset-0 m-auto
h-fit` marche sur le papier et pas dans un navigateur : pour une boîte
positionnée en absolu dont les quatre côtés valent zéro, `fit-content` se résout
en `min(max-content, max(min-content, stretch))`, et `stretch` est la hauteur de
la fenêtre. Une image de mille points de haut donne donc `stretch`, c'est-à-dire
toute la hauteur, avec l'image collée en haut.

La correction de shadcn, ajouter `slide-in-from-top-1/2` pour donner aux
`keyframes` la même translation, ne marche pas non plus ici, et pour une raison
qu'il faut connaître : **Tailwind v4 compile `-translate-x-1/2` vers la propriété
`translate`, pas vers `transform`.**

```
.-translate-x-1\/2 { --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);
                     translate: var(--tw-translate-x) var(--tw-translate-y) }
```

`translate` et `transform` sont deux propriétés indépendantes qui **se
composent**. Le `translate3d` des `keyframes` ne remplace donc pas le centrage,
il s'y ajoute, et les classes `slide-*` doublaient le décalage au lieu de le
rattraper.

La sortie est de ne plus dépendre de cette interaction. La fenêtre couvre
maintenant tout l'écran, transparente et `pointer-events-none`, et centre la
carte de l'image en `flex`. Le `translate` est remis à zéro, donc le zoom des
`keyframes` s'applique à une boîte déjà centrée et la carte grandit sur place.
Le `pointer-events-auto` de la carte laisse le clic hors d'elle atteindre le
voile de fond, donc cliquer à côté ferme toujours.

Les autres dialogues du logiciel portent le même défaut. `components/ui/dialog.tsx`
vient du CLI shadcn et ne s'édite pas à la main : la correction est dans l'appel,
et elle est à refaire à chaque dialogue tant que le fichier généré n'est pas
repris.

## Ce qu'on ne peut pas faire

**Ouvrir les notifications de Dofus Retro directement.** Le Mac n'a pas d'URL qui
désigne la ligne d'une application dans le panneau Notifications :
`com.apple.Notifications-Settings.extension` ouvre la liste, et le joueur y
descend jusqu'à « Dofus Retro ». Le nom exact du client dans cette liste est donc
la dernière pastille du chemin, écrit comme le système l'écrit, faute de pouvoir
l'y amener.

## Ce qu'on ne fait pas

Multifus ne touche à aucun de ces réglages. Il les lit, il les montre, il ouvre
la bonne page des Réglages, et c'est le joueur qui coche. Un logiciel qui allume
les notifications à la place de quelqu'un est un logiciel qu'on désinstalle.

Il ne relit pas le Mode Concentration toutes les 300 ms, comme Dracoon. Le tour
passe déjà chaque seconde, et c'est bien assez pour un réglage qu'on change trois
fois par an.

La prise en main ne se rejoue pas toute seule après une mise à jour qui ajoute
une étape. La nouvelle étape apparaît dans l'écran permanent, et c'est au joueur
de cliquer « Revoir » s'il veut la suite. Réveiller un logiciel installé depuis
six mois avec un tutoriel est une punition, pas un service.

## Une fois livré

Ce fichier s'efface quand les images sont posées et que Windows est passé.
