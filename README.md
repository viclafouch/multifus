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

Fermer la fenêtre ne quitte pas multifus, qui continue dans la barre système. On le quitte par le menu de son icône.

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
npm run tauri dev  # lance l'application
npm run build      # vérifie les types et construit l'interface
npm run lint       # oxlint
npm run lint:fix   # corrige et formate
```

Le vocabulaire du projet est dans [CONTEXT.md](./CONTEXT.md), ce qu'il refuse de faire dans [docs/perimetre.md](./docs/perimetre.md), et les décisions déjà tranchées dans [docs/adr](./docs/adr).

## Licence

MIT
