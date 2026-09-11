Gestionnaire de fenêtres Dofus Retro en multicompte, macOS et Windows.

Monorepo pnpm et Turborepo : le logiciel dans `apps/desktop`, le site dans
`apps/website`. Ce qu'ils portent tous les deux vit dans `packages/` :
`@multifus/ankama` tient les images d'Ankama, hors licence MIT, et
`@multifus/retro` la matière, `retro.css`, `theme.css`, `cn` et les composants
portables. Chacun a son README.

**Aucun service payant.** La règle tient le site entier : Vercel en plan Hobby,
Vercel Analytics dans son quota gratuit, la Search Console, et rien d'autre. Une
fonctionnalité qui demande une carte bancaire n'existe pas.

- [CONTEXT.md](./CONTEXT.md) : les mots du projet, à employer partout, code
  compris. [apps/website/CONTEXT.md](./apps/website/CONTEXT.md) y ajoute ceux du
  site et les pièges de son i18n.
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

On lance multifus et on l'oublie : une fonctionnalité qui oblige à ouvrir la
fenêtre a un raccourci clavier, ou elle n'existe pas.

Le serveur de dev tourne déjà, je le lance moi-même. Personne n'a multifus
installé : casser est permis, sans migration, et on pousse sur `main`.

`tauri dev` est le seul endroit où le vrai logiciel se voit. Pour l'œil, un
navigateur piloté suffit si `window.__TAURI_INTERNALS__` est bouchonné avant le
chargement de la page : `@tauri-apps/api` n'appelle que son `invoke`. L'instantané
bouchon doit porter les vraies formes, une valeur inventée cassant l'écran sans
rien dire.

La CI audite les dépendances Rust avec `cargo-deny`, qui n'est pas dans le
dépôt : `cargo install cargo-deny --locked` pour lancer `pnpm --filter
@multifus/desktop run deny:rust` ici. Le hook de commit ne le lance pas, il
faudrait le réseau à chaque commit.

Le français est la source et Lingui porte le reste. Le menu de la barre système
a sa propre table, en Rust, parce qu'il doit exister sans fenêtre. Le texte ne se
partage pas entre le logiciel et le site : chacun garde son catalogue, et le
logiciel active une instance globale là où le site en tient trois, une par
langue, parce qu'il prérend les trois en parallèle.

Le skill `/frontend-design` avant de dessiner un écran, et Tauri v2 :
`https://v2.tauri.app/llms.txt`.
