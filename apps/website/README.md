# @multifus/website

Le site de Multifus. Un seul but : faire télécharger le logiciel.

TanStack Start, entièrement prérendu, déployé sur Vercel. Aucun serveur ne tourne
en production : `pnpm --filter @multifus/website run build` écrit quarante-deux
fichiers HTML et le `sitemap.xml`.

Ce qui reste à faire est dans [docs/plan-site.md](../../docs/plan-site.md), les
mots dans [CONTEXT.md](./CONTEXT.md).

## La table des pages

`src/constants/pages.ts` est la seule vérité. Elle porte pour chaque page son
identifiant, ses trois adresses, sa vidéo et son type. Tout en sort : le
prérendu, le sitemap, les `hreflang`, le menu. `as const satisfies Record<PageId,
Page>` refuse une page ajoutée sans son espagnol.

Cette table est lue par `vite.config.ts`, donc la chaîne qui y mène,
`constants/pages.ts`, `constants/languages.ts`, `helpers/page.ts` et les types,
s'importe **en relatif avec l'extension** et n'emploie ni l'alias `@/` ni le
moindre import d'image. Le reste du site emploie `@/` normalement. Les vidéos
vivent dans `constants/loops.ts`, que la config ne lit pas.

## Les adresses

Le français à la racine, l'anglais et l'espagnol préfixés. Six fichiers de route,
aucun paramètre optionnel : `index.tsx` et `$slug.tsx`, les mêmes sous `en/` et
sous `es/`. Un segment statique gagne toujours contre un dynamique dans le
classement de TanStack, donc `/en/character-wheel` tombe dans l'arbre anglais
sans discussion.

**Aucune redirection automatique, jamais.** Google explore depuis des adresses
américaines avec `Accept-Language: en`, et une redirection lui cacherait les
autres langues.
