# Passer le dépôt en monorepo

Le logiciel descend dans `apps/desktop`, le site prend sa place vide dans
`apps/website`, et pnpm tient les deux. Rien n'est partagé encore : aucun
`packages/` n'existe, parce qu'aucun paquet n'a de deuxième lecteur avant que le
site ne dise ce dont il a besoin.

## Ce qui a été décidé

**pnpm**, et pas npm. Le lockfile se reprend par `pnpm import` pour garder les
versions résolues d'aujourd'hui, puis `package-lock.json` s'efface.

**Pas de Turborepo.** Une seule application a du JavaScript, et le graphe des
tâches n'aurait qu'un nœud. Le temps de la CI part dans `cargo`, qu'aucun cache
de tâches ne rattrape. On l'ajoutera quand le site existera et qu'un paquet
partagé reliera les deux.

**Aucun paquet partagé.** La roue et le tableau des runes sont déjà presque
purs : `wheel-dial.tsx`, `wheel-head.tsx`, `rune-line.tsx`, `rune-sheet.tsx`,
`helpers/wheel.ts`, `helpers/rune.ts`, `constants/wheel.ts` et
`constants/runes.ts` ne connaissent ni Tauri ni les hooks. L'extraction se fera
au premier écran du site qui les demande, et le site dira alors où passe la
coupe. Tout Tauri tient dans deux fichiers de production, `src/lib/multifus.ts`
et `src/hooks/use-copy.ts`.

**Une seule caisse Cargo**, dans `apps/desktop/src-tauri`. Pas d'espace de
travail Cargo à la racine : il n'y a qu'une caisse, et il déplacerait `target/`
et `Cargo.lock` pour rien.

**La configuration vit à côté de ce qu'elle décrit.** `vite.config.ts`,
`tsconfig.json`, `tsconfig.node.json`, `components.json`, `.versionrc.json` et
`scripts/` descendent dans `apps/desktop`. `vite.config.ts` résout tout par
`import.meta.dirname`, donc aucune de ses valeurs ne change en descendant, quand
il aurait fallu en réécrire une quinzaine s'il restait à la racine.

**`oxlint` et `oxfmt` restent à la racine**, parce qu'ils doivent voir le site
aussi. Leurs chemins, eux, se réécrivent. Leurs `overrides` visent
`apps/desktop/src/`, jamais `apps/*/src/` : le site n'a pas de `src/`, et une
exception ouverte pour une arborescence qu'il n'a pas est une exception qu'on ne
saura plus relire.

**La racine ne garde que ses six scripts**, `lint`, `lint:fix`, `format`,
`format:check`, `check` et `prepare`. Elle ne rappelle aucun script de
`apps/desktop` : ce qui appartient au logiciel se lance par
`pnpm --filter @multifus/desktop <script>`.

**`pnpm-workspace.yaml` ne déclare que `apps/*`.** `packages/*` s'ajoutera avec
le premier paquet partagé, et pas avant.

**Le logiciel seul porte une version.** La racine devient un paquet privé sans
version. `commit-and-tag-version` se lance par `pnpm --filter @multifus/desktop
release`, et le journal des versions s'écrit dans `apps/desktop/CHANGELOG.md`,
là où le site ira le lire.

## Ce qui a été vérifié

`pnpm run check` sort en zéro : format, lint, 911 tests sur 57 fichiers, le
build web, puis `cargo fmt`, `clippy` et les tests Rust.

Le lint typé fonctionne depuis la racine. Lancé sur un fichier de sonde,
`oxlint` a levé `typescript(no-unnecessary-condition)`, qui est une règle typée,
donc il retrouve seul le `tsconfig.json` descendu dans `apps/desktop`.
`oxlint.config.ts` reste à la racine.

Les quatre `overrides` d'`oxlint.config.ts` s'appliquent toujours. Un glob qui
ne correspond plus ne lève aucune erreur, les règles cessent simplement de
s'appliquer : chacun a donc été éprouvé sur un fichier de sonde, y compris celui
des tests, qui ajoute les règles `vitest` au lieu d'en retirer.

`vite.config.ts`, `tsconfig.json`, `tsconfig.node.json` et `components.json`
apparaissent en renommage pur dans git, sans une seule ligne modifiée.

`tauri info` retrouve la configuration et lit `frontendDist: ../dist`. Le build
web sort bien dans `apps/desktop/dist`, avec les quatre pages et le `public`.

## Le cache Cargo survit mal au déménagement

Après le déplacement, `cargo test` a réclamé un fichier sous l'ancien chemin,
`multifus/src-tauri/target/...`. Les artefacts de `tauri-build` gardent des
chemins absolus figés à la compilation. Il faut purger, depuis
`apps/desktop/src-tauri` :

```
rm -rf target/debug/build/tauri-* target/debug/build/multifus-*
```

L'autre machine rencontrera la même chose au premier `cargo` après le `git
pull`. `cargo clean` marche aussi, et recompile tout.

## Ce que seule la CI peut confirmer

- La compilation Windows. `cargo check --target x86_64-pc-windows-msvc` échoue
  ici, `ring` demandant un compilateur C pour Windows.
- L'entrée `projectPath: apps/desktop` ajoutée aux deux tâches `tauri-action`
  de `release.yml`. L'action cherche `src-tauri/` sous ce chemin, et elle n'en
  avait pas besoin tant que tout était à la racine.
- Le passage de `npm ci` à `pnpm install --frozen-lockfile` et du cache `npm` au
  cache `pnpm`, dans `checks.yml` et `release.yml`. `ci.yml` n'appelle que
  `checks.yml` et n'installe rien.
