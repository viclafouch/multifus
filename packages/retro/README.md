# @multifus/retro

La matière de Multifus : les jetons, les fontes, les matières, et les composants
que le logiciel et le site portent tous les deux.

Elle donne la matière, jamais la mise en page. Ce que chaque règle a coûté est
dans [docs/design-system.md](../../docs/design-system.md), et les mots sont dans
[CONTEXT.md](../../CONTEXT.md).

| Chemin                 | Ce qu'il tient                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `src/styles/retro.css` | Le système entier : Bebas, les jetons du `:root`, les corps, les matières `@utility` |
| `src/styles/theme.css` | Le pont vers shadcn et Base UI, chaque jeton de couleur pointant sur `retro.css`     |
| `src/cn.ts`            | `tailwind-merge` étendu des tailles et des conteneurs du thème                       |
| `src/components/`      | `Button`, `Panel`, `Shade`, `Tale`, `Scene`, `Flag`, `Cross`                         |

`retro.css` porte son propre `@source` : qui l'importe fait scanner les
composants d'ici par Tailwind, sans rien déclarer. Sans cette ligne, une classe
qui ne vit que dans ce paquet ne serait jamais émise, et ça ne se verrait qu'à
l'écran.

**Qui importe `retro.css` doit avoir `@fontsource/bebas-neue` dans ses propres
dépendances.** Tailwind aplatit les `@import` avant que Vite ne voie les `url()`,
donc c'est depuis le paquet **consommateur** que `@fontsource/bebas-neue/files/…`
se résout, jamais depuis ici. Sans cette dépendance, rien ne casse : les fontes
partent en 404, le build se tait, et le titre le plus gros de la page sort en
fonte de repli. C'est pour cela qu'elle est en `peerDependencies` ici, pour que
pnpm réclame.

Ce qui n'est **pas** ici tient aux types de Tauri ou au cadre d'une map :
`MapFrame`, `WayList`, `Dolmen`, `MapTitle` et `MapHeader` restent dans le
logiciel. `MapTitle` pose le focus du lecteur d'écran à l'arrivée sur une map,
ce qu'un site qui défile n'a pas à faire.
