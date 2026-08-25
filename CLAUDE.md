Gestionnaire de fenêtres Dofus Retro en multicompte, macOS et Windows. À lire avant de coder :

- [CONTEXT.md](./CONTEXT.md) — le vocabulaire. L'employer partout, code compris.
- [docs/perimetre.md](./docs/perimetre.md) — ce que le projet refuse de faire.
- [docs/adr](./docs/adr) — décisions déjà tranchées, ne pas les rejouer.
- [docs/plan.md](./docs/plan.md) — le chantier en cours, un seul à la fois, sur
  les deux systèmes. Aucun aujourd'hui : il ne porte que ce qui attend.
- [docs/pieges.md](./docs/pieges.md) — ce qui mord partout, propre à aucun
  chantier ni à aucun système.
- [docs/macos.md](./docs/macos.md) et [docs/windows.md](./docs/windows.md) —
  archives à relire quand un comportement surprend, jamais un travail à
  reprendre.

On lance multifus et on l'oublie : une fonctionnalité qui oblige à ouvrir la fenêtre pour être utile doit avoir un raccourci clavier, ou ne pas exister.

Ne démarre jamais le serveur de dev (e.g: `npm run tauri dev`). L'utilisateur le fait lui-même.

Personne n'a multifus installé, donc rien à préserver : un changement cassant est accepté, sans couche de compatibilité ni migration. Quand on te demande de commiter ou de pousser, fais-le directement sur `main`, sans branche et sans pull request.

Toujours démarrer le skill `/frontend-design` avant une session de design, et toujours implémenter avec l'API Tauri v2 : `https://v2.tauri.app/llms.txt`.
