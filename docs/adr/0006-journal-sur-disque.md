# Le journal vit sur le disque, en JSON, sans les corps de notification

Le journal était en mémoire, plafonné à 200 entrées, et mourait avec le processus. Cette décision le remplace.

## Le problème

200 entrées, c'est quelques minutes de jeu actif. Un défilement entre deux personnages écrit une ligne par appui, et `push_unless_repeated` ne dédoublonne que des événements strictement identiques : deux appuis qui alternent entre Alpha et Bravo sont deux lignes différentes. Une soirée de six clients en combat remplit le tampon plusieurs fois par heure.

Or la question à laquelle ce journal répond n'est presque jamais posée dans la minute. Le principe du projet est qu'on lance multifus et qu'on l'oublie : on constate le lendemain qu'une fenêtre n'est pas remontée. À ce moment-là, ce qui l'explique est sorti du tampon depuis longtemps, ou le processus a redémarré et il n'y a plus rien du tout.

## La décision

Chaque entrée est écrite sur le disque au moment où elle est créée, en plus d'être gardée en mémoire.

**Le plugin `tauri-plugin-log` du catalogue officiel**, plutôt que du code d'écriture de fichier. Il apporte la rotation, le plafond de taille et la résolution du dossier de logs de chaque système. Écrire ces trois choses à la main aurait été réécrire ce qui existe.

**L'emplacement est le `LogDir` du plugin**, qui est la convention de chaque système :

| Système | Où                                            |
| ------- | --------------------------------------------- |
| macOS   | `~/Library/Logs/com.viclafouch.multifus`      |
| Windows | `%LOCALAPPDATA%\com.viclafouch.multifus\logs` |

Sur macOS, c'est le dossier où l'on dit à un utilisateur d'aller chercher ses logs, et Console.app le lit. Sur Windows, c'est `LocalAppData` et non `Roaming` : un journal décrit ce qui s'est passé sur une machine et n'a rien à faire à suivre un profil sur une autre.

**Le format est du JSON, une ligne par entrée, en anglais.** L'événement est structuré et le reste : l'interface est la seule à posséder les mots français, et écrire des phrases dans `app::journal` aurait mis le français dans un module dont la langue est l'anglais, en double de `src/lib/strings.ts`. Le fichier se relit à l'œil, l'heure et la date devant, et se reparse si besoin.

**Un seul niveau de log, `info`, pour tout.** La gravité d'un événement est une lecture que fait l'interface, à partir de l'événement lui-même. Une table de gravité côté Rust serait une seconde source de vérité pour la même question. Le prix est un `[INFO]` sur chaque ligne du fichier, qui est du bruit et qui coûte moins que ce doublon.

**Rien d'autre que le journal n'entre dans le fichier**, grâce à un filtre sur la cible `journal`. Tauri, l'updater et la pile HTTP parlent tous à la même façade `log`, et un journal enterré sous leurs poignées de main est un journal que personne ne lit jusqu'au bout.

**Le webview n'a aucun accès en écriture.** Le plugin expose une commande de log, et la capacité ne l'accorde pas. Le journal est le compte-rendu que multifus fait de lui-même, pas un canal où React écrit.

## Ce que ça coûte en écriture disque

Un plafond de 1 Mo par fichier et huit fichiers gardés, soit un plafond de neuf mégaoctets. Une entrée pèse de l'ordre de 150 octets, donc un fichier vaut environ 7 000 entrées : plusieurs jours de jeu ordinaire.

La rotation se fait à la taille et pas à la date. « Plusieurs semaines » est donc une conséquence de combien on joue, et pas une promesse. Ce qui est promis, c'est le plafond.

L'écriture est synchrone et se produit sous le verrou de `app::state`, comme l'enregistrement de la configuration le fait déjà. C'est un ajout dans un fichier, pas l'une des trois choses que la règle de ce module interdit de faire sous ce verrou.

## Ce que ça coûte en vie privée, et la limite qui ne bouge pas

Le fichier porte des pseudos, des sexes assignés, l'ordre du défilement et les heures auxquelles on a joué. C'est assumé : ce sont les faits sans lesquels le journal ne diagnostique rien, ils restent sur la machine, ils ne partent nulle part tout seuls, et l'utilisateur peut supprimer le dossier depuis l'article « Montrer le journal ».

**Aucun corps de notification n'entre dans le journal, sous aucune forme.** Ni le texte, ni une version tronquée, ni une version masquée. Le corps est lu par `domain::classify` pour en déduire un des sept types, et seul le type voyage.

C'est une limite et pas une précaution. Un message privé est une personne réelle qui écrit à l'utilisateur, et ce journal est désormais un fichier qui vit des semaines et qui se colle dans un rapport de bug. Aucune valeur de diagnostic ne justifie ça.

Le coût est réel et il est accepté : quand aucun motif de `NOTIF_TYPES` ne reconnaît un corps, le journal écrit « type non reconnu » sans pouvoir dire quel était le texte, donc sans permettre d'ajouter le motif manquant depuis le seul journal. La bannière est à l'écran au moment où ça arrive, c'est là qu'on la lit.

Ce qui a été fait à la place, c'est de distinguer deux pannes qui se ressemblaient : `KindUnknown` est une formulation qu'aucun motif ne couvre, `BodyUnread` est un corps que multifus n'a pas lu. La première se répare dans `domain::notification`, la seconde dans la marche d'arbre de `platform::macos`. Confondre les deux envoyait le lecteur dans le mauvais fichier.

Un test verrouille la règle : `app::journal` sérialise l'événement d'une notification de message privé et compare la liste exacte de ses champs. Ajouter un corps fait échouer ce test, plutôt que de dépendre de la mémoire de qui relit le code.

## Ce qui reste en mémoire, et pourquoi

Les 200 entrées restent, et le plafond ne change pas. Elles sont ce que le tiroir de la fenêtre dessine et ce que chaque snapshot transporte, snapshot qui part à chaque tour de balayage. Transporter des semaines d'entrées dans chaque émission serait payer le stockage deux fois pour une fenêtre que personne ne lit en entier.

D'où deux exports et pas un. Le bouton copier emporte ce qui est en mémoire, avec un en-tête qui le rend lisible seul : version, système, autorisation, raccourcis posés, chemin de la configuration, période couverte. « Montrer le journal » ouvre le fichier, qui va plus loin en arrière. Ils répondent à deux distances différentes de la panne, et le presse-papiers dit lui-même que le fichier existe.

## Conséquence sur une panne qui était invisible

L'échec de `emit_snapshot` ne pouvait pas se diagnostiquer depuis la fenêtre, puisque le journal voyage à l'intérieur de la charge utile qui n'est pas arrivée : le tableau de bord restait figé sur un roster périmé et rien ne le disait. Il est maintenant dans le fichier. C'est l'argument le plus simple en faveur d'un journal qui ne dépend pas du canal qu'il décrit.
