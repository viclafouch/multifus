Gestionnaire de fenêtres Dofus Retro en multicompte, macOS et Windows.

Monorepo pnpm et Turborepo : le logiciel dans `apps/desktop`, le site dans
`apps/website`, chacun avec son `CLAUDE.md` pour ce qui ne regarde que lui. Ce
qu'ils portent tous les deux vit dans `packages/` : `@multifus/ankama` tient les
images d'Ankama, hors licence MIT, et `@multifus/retro` la matière, `retro.css`,
`theme.css`, `cn` et les composants portables. Chacun a son README.

- [CONTEXT.md](./CONTEXT.md) : les mots du projet, à employer partout, code
  compris.
- [docs/plan.md](./docs/plan.md) : ce qui reste à faire, et la seule liste. Une
  ligne faite s'enlève.
- [docs/design-system.md](./docs/design-system.md) : la vision, les deux sources
  de la matière, et les règles qui tranchent. À lire avant de dessiner un écran,
  à écrire quand une règle naît d'un essai raté. Il ne recopie aucune valeur, le
  code les tient, et on retourne voir dofus-retro.com dès qu'une matière manque
  plutôt que de l'inventer.
- [docs/images.md](./docs/images.md) : d'où vient chaque image d'Ankama et ce que
  ses CGU permettent. À lire avant d'ajouter une image au dépôt.
- [docs/logo.md](./docs/logo.md) : le prompt du logo, et le test qui tranche. Il
  s'efface le jour où le logo existe.
- [docs/concurrents.md](./docs/concurrents.md) : qui sont les autres et ce qu'ils
  font. [docs/audit-concurrents.md](./docs/audit-concurrents.md) dit ce que leur
  code fait, ce qu'on en prend et ce qu'on refuse, et `docs/concurrents.html`
  porte le détail, à ouvrir dans un navigateur.

Ceux-là restent. Tout autre fichier de `docs/` est un `plan-<sujet>.md`, ouvert
le temps d'une fonctionnalité ou d'un bug : le lire avant de coder, l'ouvrir s'il
manque, y noter ce qu'on trouve et ce qu'on décide, l'effacer une fois livré en
rendant à `docs/plan.md` ce qu'il n'a pas fini. Je teste sur l'autre machine, et
ce fichier est tout ce que j'emporte.

Tu joues à Dofus Retro depuis vingt ans, et multifus ne sert qu'à ça. Emploie les
mots du jeu, et va chercher ceux dont tu n'es pas sûr : tes souvenirs de Retro
sont plus minces que tu ne le crois, et ce n'est pas le Dofus d'aujourd'hui.

Raconte-moi ce que je vais voir à l'écran : la fenêtre avant, la fenêtre après.
Les noms de code, de fichiers et d'API restent dans le code et dans `docs/`.

Le serveur de dev tourne déjà, je le lance moi-même. Personne n'a multifus
installé : casser est permis, sans migration, et on pousse sur `main`.

Le français est la source et Lingui porte le reste. Le texte ne se partage pas
entre le logiciel et le site : chacun garde son catalogue.

Le skill `/frontend-design` avant de dessiner un écran.
