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

**Relais.** On quitte son bureau, on active le relais depuis la barre système ou depuis l'écran Relais, et chaque message privé reçu par un personnage relayé arrive dans un salon Telegram sur le téléphone. Un des quatre raccourcis frappé signifie qu'on est revenu et coupe le relais. Tant qu'un personnage relayé est connecté, l'écran est tenu éveillé, sans quoi le verrouillage de session couperait la lecture des bannières et le relais deviendrait muet sans le dire. Le pseudo et le type partent toujours, le texte du message seulement si l'utilisateur l'a coché.

Le relais dit aussi quand il cesse d'entendre, et c'est un avis et non une notification de jeu. La raison est le quart d'heure : **Dofus déconnecte un client resté inactif**, et multifus n'a pas le droit d'y remédier, voir plus bas. Une absence d'une heure est donc une absence où le relais devient sourd au bout de quinze minutes, et un téléphone muet se lit « personne ne m'a écrit ». L'avis est ce qui empêche ce contresens.

## Raccourcis

| Raccourci | Effet                                            |
| --------- | ------------------------------------------------ |
| Suivant   | Passe au personnage suivant, hors veille         |
| Précédent | Passe au personnage précédent, hors veille       |
| Veille    | Endort ou réveille le personnage au premier plan |
| Bascule   | Endort un sexe et réveille l'autre               |

Tous restent inertes tant qu'une fenêtre Dofus n'est pas au premier plan. Sans cette garde, un raccourci du type `ctrl+flèche` casserait la navigation par mot dans tous les éditeurs de texte.

## Ce que multifus ne fait pas

**L'ordre d'initiative et le réordonnancement de la barre des tâches.** Voir [ADR 0003](./adr/0003-abandon-ordre-initiative.md).

**Les réglages d'AutoFocus par personnage.** Dracoon propose une grille de sept icônes par personnage, soit quarante-deux boutons pour six comptes, avec la logique de synchronisation global/local qui va avec. Fonctionnalité jamais utilisée, contraire au principe directeur, supprimée. Les sept types restent réglables globalement.

**Le personnage principal et le retour direct.** Deux raccourcis de Dracoon sans usage réel, supprimés au profit des deux nouveaux.

**La popup de bienvenue.** Dracoon affiche au premier lancement un avertissement modal impossible à fermer pendant trente secondes. Les mentions légales figurent dans l'écran À propos, sans blocage.

**La mise à jour silencieuse.** multifus cherche une version plus récente au démarrage et la propose, dans la barre système et dans l'écran À propos. Il ne l'installe jamais tout seul : installer relance l'application, ce qui en pleine soirée revient à couper le gestionnaire de fenêtres de tous les clients d'un coup. La proposer sans l'imposer est le seul comportement compatible avec le principe directeur.

**Toute forme d'automatisation du jeu.** multifus ne lit pas la mémoire du client, ne simule aucune action de jeu, ne modifie aucun fichier. Il ne fait que gérer des fenêtres et lire des notifications système. Les outils de type macro sont interdits par Ankama et restent hors de ce projet.

**Répondre depuis le téléphone.** Le relais va dans un seul sens. Répondre à un message privé demanderait d'écrire dans le jeu, ce que le paragraphe précédent interdit. Le relais dit s'il faut revenir, il ne remplace pas le retour.

**Empêcher la déconnexion pour inactivité.** Dofus ferme la session d'un client resté inactif un quart d'heure, et le titre de la fenêtre perd alors le pseudo. C'est la vraie limite du relais : une absence d'une heure est une absence où plus personne n'est joignable après quinze minutes. La corriger demanderait de simuler une action de jeu, ce que l'automatisation refuse deux paragraphes plus haut. multifus ne rallonge pas l'absence, il dit quand elle est finie. Ne pas rouvrir : un anti-inactivité est exactement l'outil qu'Ankama interdit.

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

Le détail et les mesures sont dans [ADR 0002](./adr/0002-notifications-macos-via-accessibility.md).

Le relais hérite de tout ce tableau. Sur macOS il ne peut relayer que ce qu'une bannière a affiché, donc il tient l'écran éveillé pour que le verrouillage de session ne le rende pas muet. Sur Windows il fonctionnerait même bannières coupées, et l'écran tenu éveillé y reste utile pour une autre raison : la machine endormie n'exécute plus le client.

La ligne du corps complet a été mesurée et non supposée, ce qui décide de ce que l'écran Relais a le droit de promettre : la bannière ne montre que deux lignes, l'arbre d'accessibilité porte le texte entier. Le détail est à l'étape 11 du plan.

## Conventions

Le code et les commentaires s'écrivent en anglais. L'interface est en français, avec les chaînes centralisées dans un seul endroit, `src/constants/strings`, un fichier par écran et un index qui les compose.

La configuration est un fichier JSON dans le dossier standard du système. Aucune donnée personnelle n'est écrite en dur nulle part : ni pseudo, ni nombre de comptes supposé, ni chemin de machine. L'application doit fonctionner au premier lancement pour quelqu'un qui ne l'a jamais ouverte.

Le démarrage automatique à l'ouverture de session est une option, décochée par défaut. Fermer la fenêtre ne quitte pas l'application, qui continue dans la barre système ; on quitte par le menu de l'icône.
