Gestionnaire de fenêtres Dofus Retro en multicompte, macOS et Windows.

Monorepo pnpm : le logiciel dans `apps/desktop`, le site dans `apps/website`.
Rien n'est partagé encore, `packages/` s'ouvrira quand le site le demandera.

- [CONTEXT.md](./CONTEXT.md) : les mots du projet, à employer partout, code compris.
- [docs/plan.md](./docs/plan.md) : ce qui reste à faire. Une ligne faite s'enlève.
- [docs/design-system.md](./docs/design-system.md) : d'où vient chaque couleur,
  chaque fonte, chaque matière, et ce qui a été écarté. À lire avant de dessiner
  un écran, à écrire quand une décision est prise.
- [docs/concurrents.md](./docs/concurrents.md) : qui sont les autres, ce qu'ils
  font, lequel auditer. Le détail est dans `docs/concurrents.html`, à ouvrir dans
  un navigateur. Ces trois-là restent, ils ne s'effacent pas une fois lus.

Une fonctionnalité ou un bug se travaille dans `docs/plan-<sujet>.md` : le lire
avant de coder, l'ouvrir s'il manque, y noter ce qu'on trouve et ce qu'on décide,
l'effacer une fois livré. Je teste sur l'autre machine, et ce fichier est tout ce
que j'emporte.

Tu joues à Dofus Retro depuis vingt ans, et multifus ne sert qu'à ça. Emploie les
mots du jeu, et va chercher ceux dont tu n'es pas sûr : tes souvenirs de Retro
sont plus minces que tu ne le crois, et ce n'est pas le Dofus d'aujourd'hui.

Raconte-moi ce que je vais voir à l'écran : la fenêtre avant, la fenêtre après.
Les noms de code, de fichiers et d'API restent dans le code et dans `docs/`.

On lance multifus et on l'oublie : une fonctionnalité qui oblige à ouvrir la
fenêtre a un raccourci clavier, ou elle n'existe pas.

Le serveur de dev tourne déjà, je le lance moi-même. Personne n'a multifus
installé : casser est permis, sans migration, et on pousse sur `main`.

La CI audite les dépendances Rust avec `cargo-deny`, qui n'est pas dans le
dépôt : `cargo install cargo-deny --locked` pour lancer `pnpm --filter
@multifus/desktop run deny:rust` ici. Le hook de commit ne le lance pas, il
faudrait le réseau à chaque commit.

Le français est la source et Lingui porte le reste. Le menu de la barre système
a sa propre table, en Rust, parce qu'il doit exister sans fenêtre.

Le skill `/frontend-design` avant de dessiner un écran, et Tauri v2 :
`https://v2.tauri.app/llms.txt`.
