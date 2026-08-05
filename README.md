# multifus

Gestionnaire de fenêtres pour **Dofus Retro** en multicompte, sur macOS et Windows.

Quand une notification de jeu arrive, multifus ramène au premier plan la fenêtre du personnage concerné. On le lance, on l'oublie, et la bonne fenêtre est devant soi sans avoir à la chercher.

## Fonctionnalités

- Passage automatique au premier plan sur sept types d'événements : combat, échange, groupe, craft, message privé, défi, percepteur
- Raccourcis clavier pour circuler entre les fenêtres, dans un ordre qu'on range soi-même
- Mise en veille d'un personnage pour le sortir du défilement, sans le sortir du roster
- Un sexe assigné par personnage, et deux actions groupées pour endormir ou réveiller tout un sexe d'un coup
- Une icône de barre système qui liste les personnages connectés : un clic ramène la fenêtre voulue, sans ouvrir l'application
- Un démarrage à l'ouverture de session, en option et décoché par défaut
- Un journal, pour comprendre le jour où rien ne se passe, et qui se copie d'un clic
- Une mise à jour proposée quand une nouvelle version sort, à installer d'un clic ou à ignorer

Fermer la fenêtre ne quitte pas multifus, qui continue dans la barre système. On le quitte par le menu de son icône.

## Installation

Sur macOS, télécharger le DMG de la [dernière release](https://github.com/viclafouch/multifus/releases/latest) et glisser multifus dans les Applications. Le paquet est signé et notarisé par Apple, il s'ouvre donc sans avertissement.

Au premier lancement, macOS demande l'**Accessibilité**. C'est la seule autorisation dont multifus a besoin, et il ne peut rien faire sans elle : ni lire le titre des fenêtres, ni les amener au premier plan, ni entendre les notifications du jeu. L'écran d'accueil mène directement au bon panneau des Réglages Système.

Les versions suivantes se proposent d'elles-mêmes, depuis l'écran À propos et depuis le menu de la barre système.

## Compatibilité

| Système          | État                                 |
| ---------------- | ------------------------------------ |
| macOS            | Vérifié, demande l'**Accessibilité** |
| Windows          | Prévu                                |
| Linux et mobiles | Hors périmètre                       |

Les notifications en arrière-plan doivent être activées dans le jeu, via Options puis Général. Sur macOS, les bannières de Dofus doivent rester visibles dans les réglages du système, faute de quoi multifus n'a rien à lire.

> En développement. La feuille de route est dans [docs/plan.md](./docs/plan.md).

## Ce que multifus ne fait pas

multifus ne lit pas la mémoire du client, ne simule aucune action de jeu et ne modifie aucun fichier. Il se contente de gérer des fenêtres et de lire des notifications système. Les outils de type macro sont interdits par Ankama et restent hors de ce projet.

Dofus et Dofus Retro sont des marques déposées d'Ankama. Ce projet n'y est pas affilié.

## Développement

Construit avec [Tauri](https://v2.tauri.app), React et TypeScript pour l'interface, Rust pour la couche système.

Prérequis : [Rust](https://www.rust-lang.org/tools/install), Node 24, et les [prérequis Tauri](https://tauri.app/start/prerequisites/) de votre système.

```bash
npm install
npm run dev:app    # lance l'application
npm run build      # vérifie les types et construit l'interface
npm run lint       # oxlint
npm run lint:fix   # corrige et formate
```

`npm install` pose les hooks git via Husky. Chaque commit passe par `npm run lint`, et un lint en échec annule le commit.

Une release se prépare par `npm run release`, qui écrit le changelog et pose le tag, puis se déclenche en poussant ce tag : le workflow compile, signe, notarise et dépose un brouillon de release qu'il reste à relire et à publier.

Le vocabulaire du projet est dans [CONTEXT.md](./CONTEXT.md), ce qu'il refuse de faire dans [docs/perimetre.md](./docs/perimetre.md), et les décisions déjà tranchées dans [docs/adr](./docs/adr).

## Licence

MIT
