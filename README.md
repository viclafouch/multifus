# multifus

Gestionnaire de fenêtres pour **Dofus Retro** en multicompte, sur macOS et Windows.

Quand une notification de jeu arrive, multifus ramène au premier plan la fenêtre du personnage concerné. Changement de tour en combat, proposition d'échange, invitation de groupe : la bonne fenêtre est devant vous sans que vous ayez à la chercher. Deux raccourcis clavier permettent aussi de circuler entre vos fenêtres, en sautant les personnages que vous avez mis en veille.

L'application se lance et s'oublie. Aucune configuration n'est nécessaire au quotidien.

> multifus reprend les idées de [Dracoon](https://github.com/Slyss42/Dracoon) sans en être un fork. Le projet a été réécrit de zéro pour être multiplateforme et pour ne garder que ce qui sert. Voir [docs/perimetre.md](./docs/perimetre.md).

## État

En développement. L'étape de bootstrap est terminée, la feuille de route est dans [docs/plan.md](./docs/plan.md).

## Ce que multifus ne fait pas

multifus ne lit pas la mémoire du client, ne simule aucune action de jeu et ne modifie aucun fichier. Il se contente de gérer des fenêtres et de lire des notifications système. Les outils de type macro sont interdits par Ankama et restent hors de ce projet.

Dofus Retro est une marque déposée d'Ankama. Ce projet n'y est pas affilié et n'est pas officiellement pris en charge.

## Autorisations système

**macOS** demande l'**Accessibilité**, nécessaire pour lire les titres de fenêtres, changer le focus, et lire le texte des bannières de notification. Les bannières Dofus doivent rester actives dans les réglages système, faute de quoi l'AutoFocus ne peut rien détecter.

**Windows** demande l'**accès aux notifications**. Les bannières peuvent y être désactivées sans conséquence, l'écoute passe par l'API et non par l'affichage.

Dans les deux cas, les notifications en arrière-plan doivent être activées dans le jeu, via Options puis Général.

## Développement

Prérequis : [Rust](https://www.rust-lang.org/tools/install), Node 24, et les [prérequis Tauri](https://tauri.app/start/prerequisites/) de votre système.

```bash
npm install
npm run tauri dev     # lance l'application
npm run build         # vérifie les types et construit le front
npm run lint          # oxlint, avec les règles type-aware
npm run lint:fix      # corrige et formate
npm run format:check  # oxfmt en vérification seule
```

Les versions sont posées par `npm run release`, qui lit les conventional commits, écrit le `CHANGELOG.md` et bascule `package.json` comme `src-tauri/tauri.conf.json`.

## Documentation

| Fichier                                  | Contenu                                                  |
| ---------------------------------------- | -------------------------------------------------------- |
| [CONTEXT.md](./CONTEXT.md)               | Le vocabulaire du domaine, français vers anglais du code |
| [docs/perimetre.md](./docs/perimetre.md) | Ce qui entre, ce qui sort, les écarts entre systèmes     |
| [docs/plan.md](./docs/plan.md)           | La feuille de route et les pièges connus                 |
| [docs/adr](./docs/adr)                   | Les décisions structurantes et leurs raisons             |

## Licence

MIT
