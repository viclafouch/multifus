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

**Toute forme d'automatisation du jeu.** multifus ne lit pas la mémoire du client, ne simule aucune action de jeu, ne modifie aucun fichier. Il ne fait que gérer des fenêtres et lire des notifications système. Les outils de type macro sont interdits par Ankama et restent hors de ce projet.

## Écarts entre les deux systèmes

|                                        | Windows                            | macOS                          |
| -------------------------------------- | ---------------------------------- | ------------------------------ |
| Source des notifications               | `UserNotificationListener` (WinRT) | Bannière lue par Accessibility |
| Autorisation requise                   | Accès aux notifications            | Accessibilité                  |
| Suppression des notifications au focus | oui                                | impossible, pas d'API          |
| Dépendance à l'affichage des bannières | non                                | oui                            |

Le détail et les mesures sont dans [ADR 0002](./adr/0002-notifications-macos-via-accessibility.md).

## Conventions

Le code et les commentaires s'écrivent en anglais. L'interface est en français, avec les chaînes centralisées dans un seul fichier.

La configuration est un fichier JSON dans le dossier standard du système. Aucune donnée personnelle n'est écrite en dur nulle part : ni pseudo, ni nombre de comptes supposé, ni chemin de machine. L'application doit fonctionner au premier lancement pour quelqu'un qui ne l'a jamais ouverte.

Le démarrage automatique à l'ouverture de session est une option, décochée par défaut. Fermer la fenêtre ne quitte pas l'application, qui continue dans la barre système ; on quitte par le menu de l'icône.
