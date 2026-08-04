# multifus

Gestionnaire de fenêtres Dofus Retro en multicompte, macOS et Windows.
Tauri v2, interface React et TypeScript, couche système en Rust.

## À lire avant de coder

1. [CONTEXT.md](./CONTEXT.md) — le vocabulaire. L'employer partout, code compris.
2. [docs/perimetre.md](./docs/perimetre.md) — ce que le projet refuse de faire.
3. [docs/adr](./docs/adr) — décisions déjà tranchées, ne pas les rejouer.
4. [docs/plan.md](./docs/plan.md) — l'étape en cours et les pièges connus.

## Principe directeur

On lance multifus et on l'oublie. Une fonctionnalité qui oblige à ouvrir la
fenêtre pour être utile doit avoir un raccourci clavier, ou ne pas exister.

# Design / UX / UI

Toujours démarrer le skill `/frontend-design` sans exception avant de démarrer une session de design. Les choix d'intégration et de style viennent de lui.

## Conventions

- Code et commentaires en anglais, interface en français, chaînes centralisées.
- Conventional commits, changelog par `standard-version`.
- Étape terminée quand `npm run lint:fix`, `npm run lint` et `npm run build`
  sortent en zéro, plus `cargo fmt`, `clippy` et `test` si le Rust bouge.
- Ne jamais lancer `npm run tauri dev`, c'est le mainteneur qui le fait ; les
  autres commandes de vérification restent libres.
- Après chaque modification de code, passer en revue tous les markdown du dépôt,
  `git ls-files '*.md'`, README compris, et remettre d'accord ceux que le
  changement a démentis. C'est là que la doc décroche sans que personne le voie.
- Aucune donnée personnelle en dur : ni pseudo, ni nombre de comptes supposé,
  ni chemin de machine. Projet perso, codé comme s'il était public.

## Architecture

Le cœur métier Rust est pur et testable sans système : roster, défilement,
veille, classification des notifications. Deux interfaces l'isolent de l'OS,
`WindowManager` et `NotificationWatcher`, avec une implémentation par plateforme
sous `platform::macos` et `platform::windows`.

Ne jamais appeler d'API système depuis le cœur.

## Documentation Tauri

Ne pas répondre de mémoire, la surface a beaucoup bougé entre la v1 et la v2.
Index sur `https://v2.tauri.app/llms.txt`, puis ne charger que le sous-ensemble
utile : `/_llms-txt/guides.txt` ou `/_llms-txt/reference.txt`, environ 235 k
tokens chacun. Le MCP context7 couvre aussi Tauri pour une question ponctuelle.

## Référence

multifus reprend les idées de [Dracoon](https://github.com/Slyss42/Dracoon)
sans en être un fork, et n'en partage aucun code. Deux éléments en ont été repris
tels quels, dans `src-tauri/src/domain` : la regex d'extraction du pseudo
`^(.+?)\s*-\s*Dofus`, et la table `NOTIF_TYPES` des patterns de notification en
français, anglais et espagnol. Ne pas les réécrire, ils sont testés.
