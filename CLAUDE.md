Gestionnaire de fenêtres Dofus Retro en multicompte, macOS et Windows. À lire avant de coder :

- [CONTEXT.md](./CONTEXT.md) — le vocabulaire. L'employer partout, code compris.
- [docs/perimetre.md](./docs/perimetre.md) — ce que le projet refuse de faire.
- [docs/adr](./docs/adr) — décisions déjà tranchées, ne pas les rejouer.
- [docs/plan.md](./docs/plan.md) — l'étape en cours et les pièges connus.

On lance multifus et on l'oublie : une fonctionnalité qui oblige à ouvrir la fenêtre pour être utile doit avoir un raccourci clavier, ou ne pas exister.

Ne démarre jamais le serveur de dev (e.g: `npm run tauri dev`). L'utilisateur le fait lui-même.

Toujours démarrer le skill `/frontend-design` avant une session de design, et toujours implémenter avec l'API Tauri v2 : `https://v2.tauri.app/llms.txt`.
