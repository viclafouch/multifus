# multifus

Gestionnaire de fenêtres Dofus Retro en multicompte, macOS et Windows. Tauri v2, interface React et TypeScript, couche système en Rust.

## À lire avant d'écrire du code

Dans cet ordre, sans exception :

1. **[CONTEXT.md](./CONTEXT.md)** — le vocabulaire du domaine. Chaque terme donne son identifiant de code. Employer ces mots-là et pas leurs synonymes, y compris dans les commits et les conversations.
2. **[docs/perimetre.md](./docs/perimetre.md)** — ce que le projet fait et surtout ce qu'il refuse de faire. Plusieurs fonctionnalités de Dracoon ont été supprimées délibérément.
3. **[docs/adr](./docs/adr)** — les quatre décisions structurantes. Elles ont été prises avec des mesures et des arbitrages, ne pas les rejouer.
4. **[docs/plan.md](./docs/plan.md)** — l'étape en cours, et la section « Pièges connus » en fin de fichier.

## Principe directeur

**On lance multifus et on l'oublie.** Une fonctionnalité qui oblige à ouvrir la fenêtre pour être utile doit avoir un raccourci clavier, ou ne pas exister. Ce principe arbitre tous les compromis d'interface.

## Conventions

Le code et les commentaires s'écrivent **en anglais**. L'interface est **en français**, chaînes centralisées dans un seul fichier.

Commits en **conventional commits**, changelog par `standard-version`.

Lint et format par **oxlint et oxfmt**, via `@viclafouch/oxc-config`.

**Aucune donnée personnelle en dur** : ni pseudo, ni nombre de comptes supposé, ni chemin de machine. L'application doit fonctionner au premier lancement pour quelqu'un qui ne l'a jamais ouverte. Le projet est personnel mais peut être partagé, il se code comme s'il était public.

## Architecture

Le cœur métier en Rust est **pur et testable sans système** : roster, défilement, veille, classification des notifications. Il ne connaît ni fenêtre ni notification réelle.

Deux interfaces l'isolent du système, `WindowManager` et `NotificationWatcher`, avec une implémentation par plateforme sous `platform::macos` et `platform::windows`. **Ne jamais appeler d'API système depuis le cœur.**

## Documentation Tauri

Tauri publie sa documentation au format [llmstxt.org](https://llmstxt.org). Ne pas répondre de mémoire sur l'API Tauri, la surface a beaucoup bougé entre la v1 et la v2.

| URL | Contenu | Taille |
|---|---|---|
| `https://v2.tauri.app/llms.txt` | Index des jeux disponibles | 3 ko |
| `https://v2.tauri.app/_llms-txt/guides.txt` | Guides, concepts, tutoriels | ≈235 k tokens |
| `https://v2.tauri.app/_llms-txt/reference.txt` | API JavaScript, schéma de config, CLI, permissions | ≈234 k tokens |
| `https://v2.tauri.app/llms-small.txt` | Documentation abrégée complète | ≈470 k tokens |
| `https://v2.tauri.app/llms-full.txt` | Documentation intégrale | ≈606 k tokens |

Commencer par `llms.txt`, puis ne charger que le sous-ensemble utile. `guides.txt` pour l'architecture et les plugins, `reference.txt` pour le schéma de `tauri.conf.json` et le système de permissions.

Le serveur MCP **context7** est également disponible dans cet environnement et couvre Tauri, ce qui évite de charger un fichier entier pour une question ponctuelle.

## Code de référence

[Dracoon](https://github.com/Slyss42/Dracoon), dont multifus reprend les idées sans en être un fork, se trouve en `~/Desktop/Dracoon`. Deux éléments valent d'être repris tels quels, ils sont vérifiés valides sur les deux systèmes : la regex d'extraction du pseudo `^(.+?)\s*-\s*Dofus`, et la table `NOTIF_TYPES` des patterns de notification en français, anglais et espagnol.

Le reste de Dracoon est du Python Windows monolithique. Ne pas s'en inspirer pour la structure, et lire les pièges de `docs/plan.md` avant de porter quoi que ce soit.
