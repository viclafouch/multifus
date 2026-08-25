# Périmètre

Ce document fixe ce que multifus fait et ce qu'il ne fait pas. Il est issu d'une session de cadrage menée avant la première ligne de code, en repartant de [Dracoon](https://github.com/Slyss42/Dracoon) dont multifus reprend les idées sans en être un fork.

Le vocabulaire employé ici est défini dans [CONTEXT.md](../CONTEXT.md). Les décisions structurantes sont détaillées dans [docs/adr](./adr).

## Principe directeur

**On lance multifus et on l'oublie.** L'application ne demande aucune configuration au quotidien. On ouvre ses clients Dofus, et tout fonctionne. La fenêtre principale est un tableau de bord que l'on consulte, pas un panneau de réglages que l'on visite.

Ce principe arbitre tous les compromis. Une fonctionnalité qui exige d'ouvrir l'application pour être utile a un raccourci clavier, ou n'existe pas.

## Ce que fait multifus

**AutoFocus.** Une notification de jeu ramène au premier plan la fenêtre du personnage concerné. Sept types reconnus : combat, échange, groupe, craft, message privé, défi, percepteur. Activables ou non, globalement.

**Défilement.** Deux raccourcis parcourent les fenêtres dans un ordre que l'on range au drag and drop. Les personnages en veille sont sautés.

**Veille.** On retire un personnage du défilement d'un clic, ou au raccourci depuis le jeu. L'AutoFocus continue de s'appliquer à lui, pour qu'un échange proposé à une mule la fasse remonter.

**Sexe et actions groupées.** Chaque personnage se voit assigner un sexe une fois pour toutes. Deux boutons endorment ou réveillent tous les hommes ou toutes les femmes. Un raccourci bascule d'un ensemble à l'autre.

**Réponses rapides.** On range sous une combinaison un texte qu'on écrit souvent, « prix libre », « de rien ». La combinaison frappée depuis le jeu colle ce texte dans le chat, et s'arrête là : l'envoi reste un geste de l'utilisateur. Le presse-papiers d'avant est rendu. C'est la seule chose que multifus écrive vers le jeu, et elle a son [ADR 0012](./adr/0012-une-reponse-rapide-se-colle-dans-le-jeu.md).

**Agrandissement au lancement.** Un client qui s'ouvre remplit l'écran tout seul, une seule fois, dès l'écran de connexion et sans attendre qu'un personnage soit choisi. Réglage décoché par défaut : multifus ne déplace aucune fenêtre sans qu'on le lui ait demandé. Une fois coché, il ne s'applique qu'aux clients ouverts ensuite, et jamais à ceux qui sont déjà là.

**Titre court, sur Windows.** Une fenêtre de client ne porte plus que le pseudo du personnage, `Alpha` au lieu de `Alpha - Dofus Retro v1.48.21`. Six clients deviennent lisibles d'un coup d'œil dans la barre des tâches et au Alt+Tab. Réglage décoché par défaut, et le pseudo n'apparaît qu'une fois le personnage choisi, l'écran de connexion n'en portant aucun. Sur macOS, l'interrupteur est grisé et dit `Windows uniquement` : le refus est plus bas.

Deux gestes rendent leur titre aux fenêtres, et les deux marchent : décocher, et quitter multifus. Quitter n'est pas décocher, le réglage reste coché et le lancement suivant raccourcit à nouveau ; ce que ça laisse, c'est un bureau tel qu'on l'a trouvé. Une fin que multifus ne voit pas venir, une coupure de courant, laisse les fenêtres courtes, et le lancement suivant sait toujours les lire et les rendre.

**Relais.** On quitte son bureau, on active le relais depuis la barre système ou depuis l'écran Relais, et chaque message privé reçu par un personnage relayé arrive dans un salon Telegram sur le téléphone. Un des quatre raccourcis frappé signifie qu'on est revenu et coupe le relais. Tant qu'un personnage relayé est connecté, l'écran est tenu éveillé, sans quoi le verrouillage de session couperait la lecture des bannières et le relais deviendrait muet sans le dire. Le pseudo et le type partent toujours, le texte du message seulement si l'utilisateur l'a coché.

Le relais dit aussi quand il cesse d'entendre, et c'est un avis et non une notification de jeu. La raison est le quart d'heure : **Dofus déconnecte un client resté inactif**, et multifus n'a pas le droit d'y remédier, voir plus bas. Une absence d'une heure est donc une absence où le relais devient sourd au bout de quinze minutes, et un téléphone muet se lit « personne ne m'a écrit ». L'avis est ce qui empêche ce contresens.

## Raccourcis

| Raccourci | Effet                                                 |
| --------- | ----------------------------------------------------- |
| Suivant   | Passe au personnage suivant, hors veille              |
| Précédent | Passe au personnage précédent, hors veille            |
| Veille    | Endort ou réveille le personnage au premier plan      |
| Bascule   | Endort un sexe et réveille l'autre                    |
| Réponse   | Colle un texte tout prêt, une combinaison par réponse |

Tous restent inertes tant qu'une fenêtre Dofus n'est pas au premier plan. Sans cette garde, un raccourci du type `ctrl+flèche` casserait la navigation par mot dans tous les éditeurs de texte.

## Ce que multifus ne fait pas

**L'ordre d'initiative et le réordonnancement de la barre des tâches.** Voir [ADR 0003](./adr/0003-abandon-ordre-initiative.md).

**Les réglages d'AutoFocus par personnage.** Dracoon propose une grille de sept icônes par personnage, soit quarante-deux boutons pour six comptes, avec la logique de synchronisation global/local qui va avec. Fonctionnalité jamais utilisée, contraire au principe directeur, supprimée. Les sept types restent réglables globalement.

**Le personnage principal et le retour direct.** Deux raccourcis de Dracoon sans usage réel, supprimés au profit des deux nouveaux.

**La popup de bienvenue.** Dracoon affiche au premier lancement un avertissement modal impossible à fermer pendant trente secondes. Les mentions légales figurent dans l'écran À propos, sans blocage.

**La mise à jour silencieuse.** multifus cherche une version plus récente au démarrage et la propose, dans la barre système et dans l'écran À propos. Il ne l'installe jamais tout seul : installer relance l'application, ce qui en pleine soirée revient à couper le gestionnaire de fenêtres de tous les clients d'un coup. La proposer sans l'imposer est le seul comportement compatible avec le principe directeur.

**Le plein écran de macOS.** Agrandir remplit la zone utile de l'écran, comme le fait le bouton du système, et n'emploie jamais `AXFullScreen`. La barre des menus et le Dock restent donc visibles, ce qui a été demandé une fois puis laissé tel quel le 25 août 2026 : un client rangé dans un bureau à lui ferait changer de bureau à chaque raccourci du défilement et à chaque notification, ce qui coûterait plus cher que la place gagnée.

**Rejouer l'agrandissement.** Une fenêtre est agrandie la première fois que multifus la voit, jamais une seconde. Remise en petit à la main, elle reste en petit : forcer serait un gestionnaire de fenêtres qui se dispute avec l'utilisateur. La déconnexion du quart d'heure et le retour à l'écran des personnages ne la rendent pas neuve.

**Passer au premier plan en agrandissant.** Agrandir n'est pas focus. Un client qui s'ouvre pendant qu'on joue dans une autre fenêtre remplit son écran là où il est et ne prend rien. C'est pour ça que Windows n'emploie pas `ShowWindow`, dont le `SW_MAXIMIZE` active.

**Le titre court sur macOS.** Le client Retro est le launcher Electron d'Ankama, `com.dofus.d1elauncher`, et Chromium possède la barre de titre de sa fenêtre. `AXUIElementSetAttributeValue` sur `AXTitle` répond `kAXErrorSuccess` et ne change rien : ni la barre de titre, ni Mission Control. Mesuré le 25 août 2026 sur un client en jeu, et le détail est dans [macos.md](./macos.md). Aucune API publique ne renomme la fenêtre d'un autre processus sur ce système, donc il n'y a pas de seconde porte à essayer. L'interrupteur reste visible et grisé plutôt que caché : un réglage qui disparaît d'un système se lit comme un oubli, un réglage grisé qui dit `Windows uniquement` se lit comme une décision.

**Renommer une fenêtre qui n'a pas encore de personnage.** L'écran de connexion et l'écran de sélection ne portent aucun pseudo, et un titre court n'y aurait rien à mettre. Contrairement à l'agrandissement, qui part dès l'ouverture du client, celui-ci attend l'entrée en jeu. C'est aussi ce qui le rend sûr : la fenêtre renommée est celle d'un client qui répond, jamais celle d'un client en train de charger.

**Inventer un titre que personne n'a écrit.** Décocher rend son titre à une fenêtre courte, et le fait à partir de ce qu'un client a été vu écrire après un pseudo, ` - Dofus Retro v1.48.21`, appris et jamais deviné. Tant que multifus n'a rien vu de tel, il laisse la fenêtre courte : un titre laissé tel quel vaut mieux qu'un titre inventé, et le client réécrira le sien au changement de personnage.

**Renommer autre chose que le titre.** Ni l'icône de la fenêtre, que Dracoon change par personnage, ni l'ordre des boutons de la barre des tâches, que l'[ADR 0003](./adr/0003-abandon-ordre-initiative.md) a déjà refusé. Un titre suffit à distinguer six clients, et c'est déjà la seule chose que Windows accepte de laisser écrire.

**Toute forme d'automatisation du jeu, à une exception écrite.** multifus ne lit pas la mémoire du client, ne modifie aucun fichier, ne joue à la place de personne et n'empêche pas la déconnexion pour inactivité. Les outils de type macro sont interdits par Ankama et restent hors de ce projet.

L'exception est le collage d’une réponse rapide, qui pose une combinaison et une seule vers la fenêtre du jeu, sur un appui de l'utilisateur, pour un texte qu'il a écrit lui-même, et qui n'envoie rien. C'est le point le plus discutable du projet, et il est écrit dans l'[ADR 0012](./adr/0012-une-reponse-rapide-se-colle-dans-le-jeu.md) plutôt que caché dans une fonction. Rien d'autre n'est jamais posé sur le système : ni touche Entrée, ni séquence, ni frappe parasite pour contourner une restriction de focus, ce que Dracoon fait et que le plan garde comme un piège.

**L’envoi d’une réponse rapide.** Coller n'est pas envoyer. multifus ne frappe pas Entrée, n'ouvre pas le chat et ne choisit pas le canal. Trois touches posées sur le système au lieu d'une pour économiser un appui, et un message qui part sans relecture le jour où le collage rate : le prix est trop haut. La touche Entrée reste celle de l'utilisateur.

**Le texte d’une réponse rapide sur plusieurs lignes.** Un saut de ligne collé dans le chat envoie le message, ce qui ferait rentrer le refus ci-dessus par la porte de derrière. Le champ tient sur une ligne.

**Les réponses rapides par personnage.** Même refus que les réglages d'AutoFocus par personnage, avec le motif d'origine. Une réponse rapide est globale.

**Lire les combinaisons que le bureau tient déjà.** Aucun système ne rend cette liste. multifus pose la combinaison et rapporte ce que le système répond, ce que l'écran Raccourcis affiche ligne par ligne. Une liste noire écrite à la main serait une demi-vérité qui ne couvrirait jamais les applications de l'utilisateur.

**Répondre depuis le téléphone.** Le relais va dans un seul sens. Une réponse rapide ne rouvre pas cette porte et l'ADR 0012 l'écrit : elle se frappe au clavier, devant le jeu, sur une fenêtre au premier plan. Rien ne se déclenche depuis le téléphone, jamais. Le relais dit s'il faut revenir, il ne remplace pas le retour.

**Empêcher la déconnexion pour inactivité.** Dofus ferme la session d'un client resté inactif un quart d'heure, et le titre de la fenêtre perd alors le pseudo. C'est la vraie limite du relais : une absence d'une heure est une absence où plus personne n'est joignable après quinze minutes. La corriger demanderait de jouer à la place du joueur, ce que l'automatisation refuse plus haut et que l'exception du collage ne couvre pas : une réponse rapide répond à un appui, un anti-inactivité répond à une horloge. multifus ne rallonge pas l'absence, il dit quand elle est finie. Ne pas rouvrir : un anti-inactivité est exactement l'outil qu'Ankama interdit.

**Relayer capot fermé.** L'écran tenu éveillé pose `PreventUserIdleDisplaySleep`, et le mot qui compte est **Idle** : l'assertion empêche l'écran de s'éteindre faute d'activité, elle ne s'oppose pas à un geste explicite. Fermer le capot endort la machine entière, et aucune assertion d'énergie ne bloque ça. Le balayage s'arrête, plus aucune bannière n'est dessinée, et l'avis de déconnexion part au moment où l'on rouvre, c'est-à-dire au seul moment où il ne sert plus à rien. On laisse donc le Mac ouvert, ce qui est le cas d'usage prévu, ou on branche un écran externe et l'alimentation. Le quart d'heure limite l'absence utile de toute façon, et l'assertion se relâche dès que le dernier personnage relayé tombe : l'écran ne reste pas allumé une heure pour rien.

**Relayer les six autres types de notification.** Le message privé seul, codé en dur. Combat, échange, groupe et défi sont sans usage à distance : le temps de revenir, le tour est passé ou l'échange est annulé. Le percepteur attaqué et le craft terminé ont un vrai sens, et ils sont refusés quand même pour l'instant, parce que sept interrupteurs de plus doubleraient la surface de réglages pour un besoin qui ne s'est pas encore présenté. À rouvrir sur usage constaté, et pas avant.

**Un catalogue d'intégrations.** Un seul destinataire, Telegram, et les raisons de l'avoir préféré à WhatsApp, ntfy, Gotify, Bark et Pushover sont dans l'[ADR 0007](./adr/0007-telegram-plutot-que-whatsapp-ou-ntfy.md). Ce n'est pas un écran extensible, c'est un relais.

**Un historique de conversation.** Le relais pousse, il ne tient pas un fil qu'on relit. Ce qui est arrivé sur le téléphone y reste, multifus n'en garde rien et le journal ne porte aucun corps.

**Les réglages de relais par type de notification.** Même refus que pour l'AutoFocus par personnage, et pour la même raison : sept interrupteurs de plus pour un besoin qui ne s'est pas présenté.

Le relais **par personnage**, lui, a été refusé puis rouvert, et c'est [ADR 0011](./adr/0011-relais-par-personnage.md). Ce n'est pas la même grandeur qu'une grille de sept types : c'est une case par ligne, sur un écran qui dessine déjà une ligne par personnage, et le besoin est réel. On relaie son principal et pas ses mules.

## Deux systèmes, et seulement deux

multifus vise **macOS et Windows**. Ni iOS, ni Android, ni Linux, que Tauri sait pourtant viser. Ce n'est pas un manque de temps, c'est le périmètre : Dofus Retro se joue sur ces deux systèmes, et une dépendance qui ne les couvre pas tous les deux est écartée plutôt qu'ajoutée sous condition.

## Écarts entre les deux systèmes

|                                        | Windows                            | macOS                                                      |
| -------------------------------------- | ---------------------------------- | ---------------------------------------------------------- |
| Source des notifications               | `UserNotificationListener` (WinRT) | Bannière lue par Accessibility                             |
| Autorisation requise                   | Accès aux notifications            | Accessibilité                                              |
| Suppression des notifications au focus | oui                                | impossible, pas d'API                                      |
| Dépendance à l'affichage des bannières | non                                | oui                                                        |
| Corps de notification complet          | oui                                | oui, mesuré : la bannière tronque à l'écran, `AXValue` non |
| Écran tenu éveillé                     | `PowerSetRequest`                  | `IOPMAssertionCreateWithName`                              |
| Collage d’une réponse                  | `SendInput`, `Control+V`           | `CGEventPost`, `Super+V`                                   |
| Agrandissement d’une fenêtre           | `SetWindowPos` sur le `rcWork`     | `AXPosition` et `AXSize` sur le `visibleFrame`             |
| Titre court                            | `WM_SETTEXT`, barre des tâches     | refusé, le client ignore l'écriture `AXTitle`              |

Le détail et les mesures sont dans [ADR 0002](./adr/0002-notifications-macos-via-accessibility.md).

Le relais hérite de tout ce tableau. Sur macOS il ne peut relayer que ce qu'une bannière a affiché, donc il tient l'écran éveillé pour que le verrouillage de session ne le rende pas muet. Sur Windows il fonctionnerait même bannières coupées, et l'écran tenu éveillé y reste utile pour une autre raison : la machine endormie n'exécute plus le client.

La ligne du corps complet a été mesurée et non supposée, ce qui décide de ce que l'écran Relais a le droit de promettre : la bannière ne montre que deux lignes, l'arbre d'accessibilité porte le texte entier. Le détail est dans [macos.md](./macos.md).

## Conventions

Le code et les commentaires s'écrivent en anglais. L'interface est en français, avec les chaînes centralisées dans un seul endroit, `src/constants/strings`, un fichier par écran et un index qui les compose.

La configuration est un fichier JSON dans le dossier standard du système. Aucune donnée personnelle n'est écrite en dur nulle part : ni pseudo, ni nombre de comptes supposé, ni chemin de machine. L'application doit fonctionner au premier lancement pour quelqu'un qui ne l'a jamais ouverte.

Le démarrage automatique à l'ouverture de session est une option, décochée par défaut. Fermer la fenêtre ne quitte pas l'application, qui continue dans la barre système ; on quitte par le menu de l'icône.
