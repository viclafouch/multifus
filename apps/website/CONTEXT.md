# Les mots du site

Le vocabulaire partagé est [CONTEXT.md](../../CONTEXT.md) à la racine : la roue
des personnages, le tableau des runes, l'AutoFocus, le Déplacement rapide. Le
site les reprend mot pour mot. Il n'y a pas deux modèles, il y a un logiciel et
une vitrine posée dessus.

Ce fichier ne porte que les mots qui naissent ici, et les pièges que le site a
déjà payés.

## Les mots

**Fonctionnalité** : ce que le site vend, une par page. Le logiciel dit « map »
pour un de ses lieux ; le site ne dit jamais « map », et il ne dit jamais
« écran » non plus. Un visiteur n'a rien installé.

**Page** : une adresse du site, et une ligne de `constants/pages.ts`. Son
identifiant est le même dans les trois langues, ses trois adresses sont
différentes. Une page ajoutée sans son espagnol ne compile pas.

**Promesse** : la phrase sous le titre, ce que la fonctionnalité fait pour le
joueur. Elle sert aussi de `meta description` et de légende de la vidéo, donc
elle se lit toute seule, hors de sa page.

**Avant d'installer** : la levée de doute, sur `/telecharger`. Le site ne dit
**pas** « questions fréquentes » : `CONTEXT.md` réserve déjà ce mot à la liste
des pannes pliée dans les Paramètres, pour quelqu'un qui a installé. Deux mots
identiques pour deux choses, c'est ce que `CONTEXT.md` interdit.

**Comparatif** : `/comparatif`. Cinq concurrents au maximum. Aucune case n'est
remplie depuis la page d'accueil d'un concurrent, seulement depuis son code.

**Concurrent** (`Rival`) : une colonne du comparatif, son nom propre et l'adresse
de son dépôt, jamais celle de sa vitrine. Le lien mène là où la case a été lue.
Il n'y a pas de colonne pour un outil qui ne publie rien : on ne saurait pas quoi
y mettre.

**Trait** (`Trait`) : ce que le comparatif compare, entre dix et douze. Cinq
reprennent le nom de leur page, et c'est le même mot des deux côtés. Le code dit
`Trait` parce que `Ligne` est déjà pris par le menu de l'accueil.

**Case** (`Mark`) : `yes`, `half` ou `no`, et rien d'autre. Un disque plein, un
demi-disque, un anneau vide, jamais une couleur. Deux lignes au moins portent
`no` en face de Multifus : un comparatif qu'on gagne partout ne se croit pas.

**Voisines** (`kin`) : les deux ou trois pages vers lesquelles une page renvoie
en bas, choisies à la main dans `constants/pages.ts`. C'est le maillage interne,
et il remplace la barre latérale d'une documentation. Le champ est obligatoire,
donc une page ajoutée sans lui ne compile pas ; il a le droit d'être vide, et
c'est le cas de l'accueil, qui renvoie déjà partout. Vide, la section ne se pose
pas : c'est l'écran qui décide, jamais `PageKin`.

**Bande** (`Band`) : une tranche horizontale d'une page, sa largeur et son
rythme. Une page est une pile de bandes, jamais une grille. `BandTitle` en porte
le titre, `PageHead` porte le nom et la promesse d'une page.

**Prose** (`Prose`) : un paragraphe de corps, à la largeur où il se lit.
`ProseBlock` en groupe plusieurs sous un intertitre.

**Ligne** (`WayLink`) : une entrée de la liste des fonctionnalités de l'accueil,
qui est le menu de l'accueil du logiciel. **Carte** (`PageCard`) est ce qu'une
voisine montre en bas d'une page.

**Affiche** (`poster`) : l'image tirée d'une boucle, posée sur le lecteur tant
que la vidéo ne joue pas, et donnée à Google comme vignette du résultat. Elle
n'est pas la première image de sa boucle : elle se choisit sur la seconde où la
fonctionnalité se voit.

**Fiche** (`SchemaNode`) : un bloc de balisage schema.org. Une page en porte une
à trois, et elles sortent toutes de la table : la fiche du logiciel, la fiche de
la vidéo, le fil d'Ariane.

**Voix** : une instance de Lingui, une par langue. `SPEAKERS.fr`, `SPEAKERS.en`,
`SPEAKERS.es`. Elles ne s'activent pas, elles ne se muent pas, elles parlent.

## Où les imports changent de forme

Presque tout le site importe par l'alias `@/`. Six fichiers ne le font pas :
`constants/pages.ts`, `constants/languages.ts`, `constants/site.ts`,
`helpers/page.ts`, `helpers/language.ts` et les types de `@types/`. Ils importent
**en relatif, avec l'extension `.ts`**, parce que `vite.config.ts` les lit pour
énumérer le prérendu et pour le sitemap, et qu'il les lit avant que l'alias
existe. Aucun d'eux ne touche une image : les vidéos et leurs affiches vivent
dans `constants/loops.ts`, que la config ne lit pas.

## Ce que le site ne dit jamais

Il ne raconte pas comment il s'y prend : ni processus, ni autorisation système,
ni notification système, ni webview. Ça, c'est le logiciel qui le dit, une fois
installé, à quelqu'un qui a un réglage à cocher.

Le mot « fenêtre » reste, parce que c'est ce que le joueur voit et cherche, et
« gestionnaire de fenêtres » avec lui : c'est le nom de la catégorie, c'est ce
qu'Ankama a écrit deux fois en public, et c'est ce qui se tape dans Google. Ce
qui est proscrit, c'est de décrire la plomberie derrière.

Jamais le mot « officiel ». Jamais le logo ni la typographie de Dofus, jamais le
vert et l'orange de l'en-tête d'Ankama. Quatre sites jumeaux se font passer pour
Ankama, et un site de fan qui imite leur bandeau devient indiscernable d'eux.

## Comment une phrase s'écrit

Le français est la source, Lingui porte l'anglais et l'espagnol, et
`pnpm --filter @multifus/website run i18n:extract` suit chaque phrase touchée.

**`msg` au module, jamais `t`.** Un module est évalué avant qu'une voix parle :
un `t` au module figerait le français. La phrase se rend dans le corps du
composant, par `i18n._(...)`, l'`i18n` venant de `useLingui()` de `@lingui/react`.

**`@lingui/react/macro` n'est pas transformé ici.** `<Trans>` sort du build sans
son import et casse le rendu serveur en silence : la page se prérend avec un
corps vide, et seul le HTML livré le montre. Le dépôt entier n'emploie que
`@lingui/core/macro`, et le site fait pareil. Le jour où une phrase a besoin d'un
lien à l'intérieur, c'est l'ordre des greffons Vite qu'il faut reprendre, pas la
phrase.

**Une voix ne se mute jamais.** Le logiciel a `speak()`, qui active une instance
globale, et il a raison : une fenêtre, une langue. Le site prérend quatorze pages
en parallèle dans trois langues ; sur un singleton muté ce sont des pages
mélangées, et le bogue ne se voit qu'à la compilation. Les trois voix vivent dans
`lib/i18n.ts` et passent par `I18nProvider`.
