# Ouvrir le site

Le site de Multifus, `apps/website`. Ce fichier porte tout ce qui a été décidé le
11 septembre 2026, et il remplace la section « Ouvrir le site » de
[plan.md](./plan.md). Il s'efface une fois le site en ligne, et rend à `plan.md`
ce qu'il n'a pas fini.

## Ce que le site doit faire

Un seul but : faire télécharger Multifus. Tout le reste sert celui-là.

La cible est un joueur de dix à trente ans qui arrive d'une recherche, veut
comprendre en dix secondes, et installer. Il ne lit pas d'anglais technique, il
ne sait pas ce qu'est une webview, et il se méfie parce que ce marché est plein
de clones.

La mesure est la chaîne entière : la requête tapée le dit à la Search Console, la
page vue et le clic sur « Télécharger » le disent à Vercel Analytics, et le
fichier pris le dit aux compteurs de GitHub, que le site lit déjà.

## Ce que le référencement peut vraiment prendre

Relevé du 11 septembre 2026, à refaire avant d'écrire les titres.

Sur « multi compte dofus retro », la première page est tenue par Multixi,
Retro Toolbox et Dosoft. Or [concurrents.md](./concurrents.md) range Multixi dans
« À ne pas installer » : quatre sites jumeaux, un dépôt qui ne contient qu'un
README et une archive compilée, 220 téléchargements cumulés. **Le premier
résultat de Google sur la requête cible est une coquille.** Cette page est
prenable.

Sur « dofus retro » sec, c'est Ankama et JeuxOnLine, c'est imprenable, et ça ne
rapporte rien : qui tape ça veut jouer, pas installer un logiciel. On ne le vise
pas.

Sur « forgemagie » et « poids des runes », Xixou et Retro Toolbox tiennent la
place parce qu'ils ont l'outil, pas les mots. D'où `/poids-des-runes`, la seule
page du site qui existe pour elle-même.

La référence à battre est la page de Focus Retro, que `concurrents.md` nomme
déjà : comparatif intégré, captures, avertissement de sécurité, deux systèmes.
Avec sa faute, qui devient notre règle : son comparatif coche « pas d'auto-focus »
en face de Dracoon, dont c'est l'argument principal.

## Les pages

Treize. La barre du haut porte Multifus, un menu déroulant « Fonctionnalités »
qui tient les six du milieu, puis Comparatif, Télécharger. Pas de barre
latérale : c'est le motif d'une documentation de bibliothèque, et on ne vend pas
une documentation.

| Adresse                 | Ce qu'elle fait                                               | Vidéo     |
| ----------------------- | ------------------------------------------------------------- | --------- |
| `/`                     | La promesse, les fonctionnalités en aperçu, le téléchargement | à tourner |
| `/autofocus`            | La fenêtre passe devant sur sept événements                   | existe    |
| `/roue-des-personnages` | Le disque de têtes au maintien d'une combinaison              | existe    |
| `/deplacement-rapide`   | Un clic gauche, la team suit                                  | existe    |
| `/tableau-des-runes`    | Les poids posés par-dessus le jeu                             | existe    |
| `/messages-prives`      | Les messages privés sur le téléphone                          | à tourner |
| `/reponses-rapides`     | Un texte tout prêt sous une combinaison                       | à tourner |
| `/mac`                  | Multifus sur Mac                                              | reprises  |
| `/comparatif`           | Multifus et cinq autres, ligne par ligne                      | aucune    |
| `/poids-des-runes`      | La table des poids, lisible et gratuite                       | aucune    |
| `/telecharger`          | Les deux boutons, et « Avant d'installer »                    | aucune    |
| `/journal`              | Le journal des versions                                       | aucune    |
| `/images`               | D'où vient chaque image, et à quelle condition                | aucune    |

`/mac` n'est pas une fonctionnalité. C'est la page la plus facile à gagner du
site : d'après `concurrents.md`, Focus Retro est le seul autre outil sur Mac, et
il est au ralenti. Personne ne tient « multi compte dofus retro mac ».

**Les raccourcis n'ont plus la leur.** Une touche n'est pas une fonctionnalité,
c'est la porte des autres : la roue s'ouvre à une combinaison, le tableau des
runes se pose à une touche, le Déplacement rapide s'allume à une touche. Chaque
page dit déjà la sienne, et une page de plus ne faisait que les répéter. Tous les
concurrents ont des raccourcis, donc il n'y avait rien à gagner sur ce mot-là non
plus.

Le menu annonce six fonctionnalités, et **les réponses rapides gardent la leur**,
tranché en écrivant la page. Elle tient sans remplissage parce qu'elle a trois
choses à dire qu'aucune autre page ne dit : les phrases qu'on retape vingt fois
par jour, le collage qui n'envoie pas, et la langue du client Dofus qui n'est pas
celle de Multifus.

## Chaque page de fonctionnalité

La vidéo au-dessus de la ligne de flottaison, toujours. Un joueur comprend le
Déplacement rapide en deux secondes de vidéo et jamais en deux paragraphes.

Elle n'est pas en pleine largeur. Les boucles sont tournées à la taille que
[make-loop](../.claude/skills/make-loop/SKILL.md) fixe, et étirées à la largeur
d'un écran elles pixellisent. Une plaque autour, la largeur du texte, et la règle
25 de [design-system.md](./design-system.md) tient toujours : aucun
`backdrop-filter` au-dessus d'une vidéo qui joue.

Sous la vidéo, une page longue et simple. Ce que ça fait pour vous, quand ça
sert, ce que ça ne fait pas. Le référencement demande des mots, et une page de
trois paragraphes ne se range nulle part. Mais on allonge par le contenu, jamais
par le remplissage : on ne parle ni de processus, ni d'autorisations système. Ça,
c'est le logiciel qui le dit, une fois installé. Le mot « fenêtre », lui, reste :
c'est ce que le joueur voit et ce qu'il tape dans Google.

En bas, deux ou trois cartes vers d'autres fonctionnalités, choisies à la main.
C'est le maillage interne, et il fait le même travail qu'une barre latérale sans
donner l'air d'une documentation.

## Les adresses et les langues

Le français à la racine, `/roue-des-personnages`. L'anglais et l'espagnol
préfixés, `/en/...` et `/es/...`. Les `hreflang` sur chaque page, `x-default` sur
le français.

**Aucune redirection automatique, jamais.** Google explore depuis des adresses
américaines avec `Accept-Language: en`, et une redirection lui cache les autres
langues. La détection du navigateur ne fait qu'une chose : poser une ligne
discrète en haut, une fois, qui propose l'autre langue. Les trois drapeaux vivent
dans le cartouche, comme sur toutes les maps de Multifus.

Six fichiers de route, pas de paramètre optionnel. `index.tsx` et `$slug.tsx` à
la racine, les mêmes sous `en/` et sous `es/`, chacun n'appelant que la même page
avec sa langue. Le `{-$locale}` du guide i18n de TanStack Router a été écarté
pour deux raisons : sa propre documentation prévient que sans validation,
`/n-importe-quoi` est lu comme une langue, et avec deux segments dynamiques
d'affilée `/roue-des-personnages` devient ambigu ; et ce guide garde le même slug
dans toutes les langues, `/es/about` et non `/es/acerca-de`, ce qui est
exactement ce qu'on refuse. Un segment statique gagne toujours contre un
dynamique dans le classement de TanStack, donc `/en/character-wheel` tombe dans
l'arbre anglais sans discussion.

Une table unique porte l'identifiant de page, ses trois slugs, sa vidéo et son
type de balisage. Le prérendu énumère ses adresses depuis elle, le sitemap de
TanStack Start les ramasse, les `hreflang` en sortent, et
`as const satisfies Record<PageId, Page>` refuse une page ajoutée sans son
espagnol. C'est `MAP_SCENES` et `MAP_LOOPS`, transposés.

## Le socle

**Posé le 11 septembre 2026, et il tourne.** `pnpm --filter @multifus/website run
build` écrit trente-neuf fichiers HTML, un par page et par langue, et un
`sitemap.xml` de trente-neuf adresses. Chaque page sort avec son contenu dans
le HTML livré, son `lang`, son `canonical` et ses quatre `hreflang`.

TanStack Start, entièrement prérendu, déployé sur Vercel. `sitemap: { enabled,
host }` est dans le greffon Vite, et `prerender.pages` reçoit la table.
`autoStaticPathsDiscovery` et `crawlLinks` sont **éteints** : allumés, ils
ajoutent `/en/` à côté du `/en` de la table, et le sitemap portait deux adresses
de trop. La table énumère, et elle seule.

**Aucun service payant.** Cette règle tient le site entier, et elle est
maintenant dans `apps/website/CLAUDE.md`. Vercel en plan Hobby, Vercel Analytics
dans son quota gratuit, la Search Console, et rien d'autre.

Lingui, la même bibliothèque que le logiciel, avec le même `@rolldown/plugin-babel`
et le même format `.po`.

**`@lingui/react/macro` ne passe pas.** Un `<Trans>` sort du build sans son
import : `ReferenceError: Trans is not defined` au rendu serveur, la page se
prérend avec un corps vide, et rien ne le dit, ni le build, ni un test. On ne le
voit qu'en ouvrant le HTML livré. Le dépôt entier n'emploie que
`@lingui/core/macro`, et le site fait pareil : `msg` au module, `i18n._()` dans
le corps. Le jour où une phrase a besoin d'un lien à l'intérieur, c'est l'ordre
des greffons Vite qu'il faut reprendre, `@vitejs/plugin-react` compilant le JSX
avant que babel ne le voie.

**Le site n'emploie pas le motif de `apps/desktop/src/lib/i18n.ts`.** `speak()`
mute une instance globale. Au prérendu, TanStack Start rend les pages en
parallèle : trois langues sur un singleton muté, ce sont des pages mélangées, et
le bogue ne se voit qu'à la compilation. Le site prend trois
instances isolées par `setupI18n()`, une par langue, jamais mutées, et les passe
par le contexte React, ce que la documentation de Lingui recommande pour le rendu
serveur. Le logiciel garde la sienne, il n'a qu'une fenêtre et qu'une langue à la
fois.

Le texte ne se partage pas entre les deux applications. Les phrases du logiciel
sont des consignes à quelqu'un qui a déjà installé, celles du site sont une
promesse à quelqu'un qui n'a rien. Chaque application garde son catalogue et sa
source française. Ce qui se partage, c'est le vocabulaire, et c'est un document.

`pnpm-workspace.yaml` connaît `apps/*` et `packages/*`, et Turborepo mène
`turbo run check`.

`packages/ankama` tient toutes les images, les vidéos, les portraits et les
`.ico` que Rust embarque. La licence n'exclut plus qu'un chemin au lieu de trois,
et [images.md](./images.md) pointe sur un seul dossier. Rust les lit par chemin
relatif depuis `include_bytes!`, et `rustfmt` reformate le fichier : le chemin
plus long ne tient plus sur une ligne.

`packages/retro` tient `retro.css`, `theme.css`, `cn`, et `Button`, `Panel`,
`Shade`, `Tale`, `Scene`. Pas `map-frame`, `way-list` ni `dolmen`, qui tiennent
aux types de Tauri.

**`MapHeader` et `MapTitle` sont restés dans le logiciel**, contre ce que ce plan
prévoyait. `MapTitle` appelle `useArrival`, qui pose le focus du lecteur d'écran
en arrivant sur une map ; l'extraire demandait de faire remonter une `ref` à
travers `MapHeader` puis `Screen`, pour un site qui défile et n'a pas de maps. La
matière qu'ils portent, `limelight`, `engraved`, `lintel`, `crest`, est dans
`retro.css`, donc le site l'a déjà. `Scene` a été généralisé en échange : il
prend ses décors en props au lieu de connaître la mise en route.

**`retro.css` porte son propre `@source '../components'`.** Sans cette ligne,
Tailwind ne scanne pas les composants du paquet et n'émet pas les classes qui n'y
vivent que là. Rien ne casse, rien ne prévient, l'écran se peint sans style. Avec
elle, le CSS du logiciel est sorti de l'extraction au **même octet et à la même
empreinte** qu'avant, ce qui est la preuve que rien n'a été perdu.

**Le HTML livré est gardé par un script, pas par un test.** `scripts/verify-html.mjs`
tourne après le build, énumère le sitemap et ouvre chaque fichier : corps vide de
Suspense, titre absent, `x-default`, adresse canonique, langue sur la balise
`html`. Un test unitaire ne pouvait pas le faire, il tourne avant le build. C'est
la seule chose qui voit le mode de panne qui a déjà frappé une fois.

**Les fontes se résolvent chez le consommateur.** Tailwind aplatit les `@import`
avant que Vite ne voie les `url()`, donc `@fontsource/bebas-neue` doit être une
dépendance de chaque application qui importe `retro.css`, pas seulement de
`packages/retro`. Sans elle, les fontes partent en 404, le build se tait, et le
mot le plus gros de la page sort en fonte de repli. Elle est en
`peerDependencies` de `packages/retro` pour que pnpm réclame.

**La chaîne lue par `vite.config.ts` a sa contrainte.** La config importe
`everyPath()` pour le prérendu, donc `constants/pages.ts`,
`constants/languages.ts`, `helpers/page.ts` et leurs types s'importent en relatif
et ne touchent aucune image. Les vidéos vivent dans `constants/loops.ts`, que la
config ne lit pas. Le reste du site emploie l'alias `@/` normalement.

## Ce que le site emprunte ailleurs

Relevé du 11 septembre 2026 sur les dépendances d'un autre projet à nous, pour
voir ce qui manquait ici. Une seule est entrée, et la règle qui a tranché est
dans `.claude/rules/documentation.md` : **une dépendance sans consommateur
aujourd'hui ne s'installe pas.**

`schema-dts` est prise, en `devDependencies`, parce qu'elle n'est que des types.
`SchemaNode` était écrit à la main avec `'@type': string` et une signature
d'index qui laissait passer n'importe quelle propriété ; `donwloadUrl` compilait.
Elle ne compile plus. C'est exactement ce que `.claude/rules/typescript.md`
interdit, une union recopiée à la place de celle de la bibliothèque, et le test
du balisage y a gagné un `nodeOf` typé sur le `@type` demandé : une faute de
frappe dans le nom d'une fiche est maintenant une erreur de compilation.

Refusées, avec leur raison : `motion`, parce que le site n'a pas d'animation que
le CSS ne fasse déjà et que `frontend.md` interdit les effets de survol qui
soulèvent ; `lucide-react`, parce que le seul dessin du site est la case du
comparatif, qui est de la matière et non une icône ; `filesize`, parce que
`Intl.NumberFormat` le fait et que `code-style.md` demande l'API native ;
`tw-animate-css`, `zustand`, `sonner`, `vaul`, `cmdk` et les composants Radix,
parce qu'une page prérendue ne doit rien devoir à JavaScript pour s'afficher.
`zod` attend son consommateur, la lecture de l'API GitHub, et la ligne plus bas
le dit. Tout ce qui tient à un service payant ne se discute pas.

`@testing-library/user-event` a été essayée puis retirée : pnpm 12 la résout ici
sans son pair `@testing-library/dom` et pose un lien mort, quatre installations
de suite. Le site clique par `fireEvent`, qui vient déjà de
`@testing-library/react`. Le logiciel garde la sienne, qui est correctement liée.

## Le cadre, l'accueil et le téléchargement

**Posés le 11 septembre 2026.** `PageScreen` n'est plus un gabarit : c'est le
cartouche qui choisit un corps dans une table, `kind` par `kind`, et qui l'ouvre
dans `SiteShell`. Quatre corps, `HomeScreen`, `FeatureScreen`, `DownloadScreen`
et `PlainScreen`. Un `switch` avait été écrit d'abord, et il demandait un
`default` qu'aucune valeur ne peut atteindre : une table
`Record<PageKind, ComponentType>` dit la même chose sans la branche morte, et
c'est le motif du reste du dépôt.

La table des pages porte maintenant `kin`, deux ou trois voisines choisies à la
main. Une page ajoutée sans ses voisines ne compile pas, comme elle ne compilait
pas sans son espagnol. C'est le maillage interne, et il fait le travail d'une
barre latérale sans en avoir l'air.

**La liste des fonctionnalités de l'accueil est le menu de l'accueil du
logiciel**, `btn-way` compris, et la règle 21 de
[design-system.md](./design-system.md) le dit maintenant. Le voile du survol ne
se voit pas sur un fond uni, faute de décor dessous ; le losange qui entre
suffit.

**Le menu déroulant est un `<details>`.** Base UI n'est pas une dépendance du
site, et un menu qui a besoin de JavaScript pour s'ouvrir n'a pas sa place sur
une page prérendue : les six adresses sont dans le HTML livré, robot compris.
`useDismiss` ne rajoute que ce que `<details>` ne sait pas faire, Échap et le
clic dehors. Le losange est celui des questions fréquentes, `askmark`, qui
répond désormais à `[open]` autant qu'à `aria-expanded`.

**L'accueil montre la boucle de l'AutoFocus, et ne porte pourtant pas de
`VideoObject`.** Ce n'est pas une fuite de la table : une vidéo n'a qu'une page
canonique, celle de sa fonctionnalité, et la décrire deux fois la dédoublerait
aux yeux de Google. L'accueil l'emprunte donc, et le dit : la plaque est une
`figure` dont la légende mène à `/autofocus`. Le jour où l'accueil aura sa propre
boucle, la table le dira et le balisage suivra tout seul.

**Le décor ne se pose que sur l'accueil.** Une bande en haut, `village.webp`,
noyée par `hem-deep` : un fond derrière notre mobilier, jamais l'habillage du
site. Sur une page de fonctionnalité, c'est la vidéo qui tient ce rôle, et deux
images à la suite se seraient battues.

`grain` a quitté `apps/desktop/src/index.css` pour `retro.css` : `Scene` l'emploie
et `Scene` est partagé, donc le site l'aurait peint sans son bruit. Trois corps
de texte sont nés avec l'accueil, `--text-banner` pour le nom, `--text-herald`
pour la phrase qui le suit, et `--spacing-horizon` pour la hauteur du décor.

## Le téléchargement

Le site lit l'API GitHub à la compilation, et le workflow `release` appelle un
crochet de déploiement Vercel après avoir publié. Le site reste prérendu d'un
bout à l'autre, et le numéro de version est juste à la seconde où la release
sort. Le nom des paquets portant la version, aucune adresse GitHub fixe ne
pointe sur le bon fichier, donc lire à la compilation est la seule voie propre.

Les deux boutons, Mac et Windows, sont **toujours** dans le HTML livré. Le robot
les voit tous les deux, le visiteur sans JavaScript aussi. Le navigateur ne fait
que mettre en avant celui qui correspond, et cette mise en avant reste à écrire.
Jamais de détection côté serveur : elle casse le prérendu et ne montre qu'un
système au robot.

Chacun porte son système et son extension, et la ligne sous lui porte le plancher
de version. Ils ne tiennent pas sur une ligne en Bebas sur un téléphone : la
pilule grandit au lieu de déborder, et c'est pour ça que leur hauteur est libre.

## Le balisage

**Posé le 11 septembre 2026.** `SoftwareApplication` sur l'accueil et sur
`/telecharger`, une seule et même identité sur les deux pages. `VideoObject` sur
chaque page qui a une boucle : c'est le gain caché, Google pose une vignette dans
le résultat, et aucun concurrent n'a de vidéo. `BreadcrumbList` partout sauf sur
l'accueil, qui en est la première marche : le plan ne le prévoyait que sur les
fonctionnalités, mais il se déduit de la table pour n'importe quelle page, donc
le restreindre coûtait une condition sans rien protéger.

Les trois sortent de `kind` et de `loop`, donc ils ne peuvent pas mentir sur une
page qui a changé. `helpers/schema.ts` les rend, `headOf` les pose dans la tête,
et `scripts/verify-html.mjs` ouvre chaque page livrée, lit le `ld+json` et refuse
un balisage vide ou hors de schema.org.

**Google refuse un `VideoObject` sans `thumbnailUrl`**, et les boucles n'avaient
pas d'affiche. Les quatre sont tirées de leur propre vidéo, et
[images.md](./images.md) dit comment on choisit la seconde. Elles servent deux
fois : `LoopPlate` les pose en `poster`, donc la plaque n'est plus noire pendant
le chargement, ni pour qui a demandé moins d'animations et n'a pas encore appuyé
sur lecture.

`addressOf` a quitté `helpers/head.ts` pour `helpers/page.ts` : le balisage en a
besoin autant que la tête, et les laisser s'importer l'un l'autre faisait un
cycle. `helpers/page.ts` lit donc `constants/site.ts` en relatif, comme le reste
de la chaîne que `vite.config.ts` ouvre.

`FAQPage` ne rapporte plus rien depuis que Google a réservé ses résultats
enrichis aux sites officiels et de santé. `aggregateRating` afficherait des
étoiles et vaudrait une action manuelle, faute de vrais avis. Ni l'un ni l'autre.

## Le comparatif

**Posé le 11 septembre 2026.** Cinq concurrents, Dracoon, Focus Retro, Dosoft,
Retro Toolbox et ROrganizer, choisis parce qu'ils publient assez de code pour
qu'on les lise. nAiO et Xixou n'ont pas de colonne : sans code, une case ne
serait qu'une recopie de leur page d'accueil, et c'est exactement ce que la page
reproche aux autres. Douze traits, tirés du tableau de trente de
[concurrents.md](./concurrents.md), qui reste le tableau d'ingénieur.

**Deux traits portent `no` en face de Multifus**, les fenêtres rangées côte à
côte et les compositions d'équipe. C'est la faute de Focus Retro retournée en
règle, et `constants/rivals.test.ts` la tient : un comparatif sans une seule
défaite ne compile plus. Le test tient aussi le plancher inverse, chaque
concurrent gardant au moins un trait, faute de quoi il n'est là que pour perdre.

**La case porte une couleur depuis le 11 septembre 2026**, et le comparatif est
la seule table qui en porte : jade pour ce qui est fait, miel pour ce qui l'est à
moitié, corail pour ce qui ne l'est pas. La forme reste seule à suffire, disque
plein, demi-disque, anneau vide, et le mot en toutes lettres pour le lecteur
d'écran. Ce qui noyait le bouton du bas dans le premier jet, ce n'était pas la
couleur, c'était le vert d'action employé deux fois ; trois teintes séparées et
sourdes lisent la table d'un coup d'œil sans y toucher. La règle 3 de
[design-system.md](./design-system.md) le dit maintenant.

**Une case à moitié dit pourquoi, dans une bulle.** `HALF_NOTES` en porte une
phrase par case, une seule ligne, et `MarkTip` la lève au survol comme au focus.
La bulle sort du tableau par un portail vers le `body` : le tableau glisse de
côté dans un `overflow-x`, qui coupe aussi ce qui déborde en hauteur, et une
bulle posée dedans serait tranchée. Elle se ferme au défilement, à la sortie du
curseur et sur Échap.

La phrase, elle, n'attend pas le JavaScript : elle est dans le HTML livré, en
`sr-only` sous la case, et `aria-describedby` l'y rattache. Le `title` natif la
redonne au survol si rien n'a chargé. `constants/rivals.test.ts` tient la
bijection : une case à moitié sans note, ou une note sans case, ne compile plus.
Deux cases partagent la même phrase, et c'est un seul `msg`, comme le demande
`code-style.md`.

**Une légende ouvre le tableau**, `MarkKey`, trois pilules qui disent ce que
chaque case veut dire. Sans elle, le demi-disque se devine, et personne ne devine
juste du premier coup.

`/comparatif` a pris une cinquième sorte de page, `kind: 'comparison'`, plutôt
que de se glisser dans `plain` : la table des sortes était déjà là pour ça. Sept
colonnes ne tiennent pas sur un téléphone, donc le tableau glisse de côté dans sa
plaque, la colonne des traits restant collée à gauche.

**Un trait ne fusionne jamais deux lignes de la source.** Le premier jet cochait
« AutoFocus sur les sept appels du jeu », et donnait le même demi-disque à Focus
Retro, qui en couvre un, et à Retro Toolbox, qui en couvre cinq. C'était la faute
de Focus Retro refaite à l'identique. Le trait recopie maintenant la ligne
« AutoFocus sur notification » telle quelle, et les sept appels restent sur
`/autofocus`, qui a la place de les nommer.

**La date du relevé se rend dans le corps du composant, par `i18n._()`.** La
forme avec l'instance disait la même chose et le macro la transforme, mais Lingui
v6 déprécie `t` et oxlint refuse la ligne. Un `msg` au module ne pouvait pas
porter cette phrase : la date se formate avec la langue, et `Intl` ne la connaît
qu'une fois le composant rendu. `.claude/rules/code-style.md` demandait encore
`t` dans un corps ; il dit maintenant pourquoi les deux applications diffèrent,
le logiciel ayant une instance globale et le site trois qui ne le sont pas.

## Le corps des sept fonctionnalités

**Posé le 11 septembre 2026.** Chaque page de fonctionnalité a maintenant, sous
sa vidéo, une amorce, trois passages et une limite. `constants/bodies.ts` porte
le tout, `PAGE_BODIES` valant `null` pour les six autres pages, exactement comme
`loop`.

**La limite est obligatoire, et le test refuse un titre où « ne fait pas » ne
s'écrit pas.** C'est la règle des deux défaites du comparatif ramenée à l'échelle
d'une page, et c'est le conseil de `concurrents.md` pris au mot : Multi-Tofu est
le seul du marché à écrire ce que son outil ne fait pas, et il l'écrit en
intertitre. Trois autres planchers tiennent avec elle : deux passages au moins,
mille deux cents signes de français au moins, parce qu'une page de trois
paragraphes ne se range nulle part, et aucune phrase écrite deux fois dans les
huit pages, qui est le seul garde-fou contre le remplissage.

**Le corps ne dit toujours pas comment Multifus s'y prend.** Ni processus, ni
autorisation, ni notification : les sept appels du jeu sont nommés par ce que le
joueur voit, c'est à votre tour de jouer, on vous invite dans un groupe, votre
percepteur est attaqué.

**« Map » et « écran » reviennent, au sens du joueur.** La team change de map, le
tableau des runes évite le deuxième écran, un personnage déconnecté revient à
l'écran de connexion. `apps/website/CONTEXT.md` disait les deux mots interdits ;
il dit maintenant ce qu'il voulait dire, qu'aucune **page** ne se nomme ainsi.
Les mots du jeu restent les mots du jeu, et la ligne « on ne parle ni de
fenêtres » plus haut dans ce plan est morte de la même façon, le CONTEXT ayant
gardé « fenêtre » parce que c'est ce qui se tape dans Google.

`PlateBlock` est né de l'accueil, qui posait déjà « Ce que Multifus ne fait pas »
sur du verre : la règle 37 de [design-system.md](./design-system.md) en fait la
forme de toute limite. `Opening` porte l'amorce, avec le filet à gauche des
chiffres de l'accueil. `ProseLines` rend une suite de paragraphes et se clé sur
la phrase rendue, un `MessageDescriptor` n'ayant pas d'identifiant garanti.

## Les poids des runes

**Posés le 11 septembre 2026.** La table entière est sur `/poids-des-runes`,
avant toute explication : qui cherche « poids des runes » veut les chiffres, et
il n'y a qu'une amorce de trois phrases entre le titre et elle. Vingt lignes,
cinq familles, la stat puis quatre colonnes de chiffres. Les six passages sont
dessous, où ils ne gênent personne.

**Les chiffres ont pris un paquet à eux**, `@multifus/runes`. C'est la décision
d'architecture que ce plan gardait en attente, et elle s'est tranchée toute
seule : une table recopiée de l'un à l'autre finit par diverger, et le seul
mérite de cette page est d'être juste. Le paquet ne porte que des identifiants,
des chiffres, et l'écriture d'un poids, qui doit tomber au même centième des deux
côtés. Aucune phrase ne le traverse : chaque application nomme
`wisdom` et `heavy` dans son propre catalogue, et `satisfies Record<RuneStatId,
…>` refuse celle qui en oublie un. Les invariants du jeu, la Pa qui pèse trois
fois la simple et la Ra dix fois, sont testés là où vivent les chiffres.

Le logiciel n'a pas bougé à l'écran : il a perdu son type `RuneRow` et lu ses
poids ailleurs, ses noms de stats étant restés chez lui avec sa largeur dessinée
et la constante Rust qui la borne.

**La table du site n'a pas les couleurs de famille du logiciel.** Le tableau
posé sur le jeu tient dans 320 points, et ses cinq tons y font gagner du temps ;
sur une page de vente, cinq bandes de couleur disputeraient l'œil au seul bouton
vert, ce que la règle 2 de [design-system.md](./design-system.md) interdit. La
famille se dit ici en Bebas et en capitales, et un filet sépare les trois
colonnes de runes de la colonne du point, qui ne répond pas à la même question.

**Le site écrit les éléments en toutes lettres**, « Intelligence, Force,
Agilité, Chance », là où le logiciel serre « Ine / Fo / Age / Cha » dans sa
fenêtre. Même table, même ordre, et deux places qui n'ont pas la même largeur.
Les abréviations ne disparaissent pas pour autant : le corps de la page nomme la
Ine, la Pa Ine et la Ra Ine une fois, parce que c'est sous ce nom-là qu'une rune
se cherche et se vend.

`/poids-des-runes` a pris une sixième sorte de page, `kind: 'runes'`, comme
`/comparatif` avait pris la sienne.

## D'où vient chaque image

**Posé le 11 septembre 2026.** `/images` a pris une septième sorte de page,
`kind: 'images'`, et `plain` ne garde plus que le journal. La page est la version
publique de [images.md](./images.md), et elle ne montre aucune image : une
galerie de neuf décors d'Ankama sur un site de fan, c'est exactement ce que la
règle du décor interdit ailleurs. Elle liste, elle n'expose pas.

**Six familles, et une seule question par ligne** : ce que c'est, d'où ça vient.
`PROVENANCES` les porte, `ProvenanceList` les rend en `<dl>` sur une plaque, le
nom en Bebas dans la colonne de gauche et l'origine en prose sur les deux autres.
Les décors, les portraits de classe, les vidéos du site, l'affiche posée sur une
vidéo, les deux messages d'Ankama et la fenêtre Options du client. Le test refuse
une famille absente de la liste ordonnée, deux noms identiques, deux origines
recopiées l'une sur l'autre, et une origine de moins de cent signes.

**Les portraits n'étaient sourcés nulle part.** Ni `images.md`, ni le relevé, ni
un commit : quarante-huit fichiers, les plus visibles du logiciel, sans origine
écrite. Ils viennent des visuels de classe publiés par Ankama, comme les décors,
et `images.md` porte maintenant leur ligne. Une page qui promet « d'où vient
chaque image » ne pouvait pas sauter celle-là.

Le corps dit ensuite ce que le dépôt refuse de prendre, pourquoi créditer ne
donne aucun droit, pourquoi les fichiers vivent tous dans un seul dossier, et ce
qui est dessiné ici. La limite est sur une plaque, et elle est franche : cette
page ne donne aucun droit sur ces images, et le jour où Ankama demande leur
retrait, les fenêtres perdent leur fond, la roue ses portraits et le site ses
vidéos. **Le compte n'était pas bon au premier jet** : le dossier tient aussi les
quarante-huit portraits, donc un `git rm` coûte une fonctionnalité nommée et pas
seulement des fonds. La page le dit maintenant, et ce plan avec elle.

**La page montre ses sources plutôt que de les affirmer.** Le premier jet
écrivait la tolérance d'Ankama sans lien, alors que « montrer la source bat
l'affirmation » est la règle que ce plan a tirée des concurrents et que
`/telecharger` applique déjà. Les deux messages sont maintenant liés des deux
côtés, par `AnkamaSources`, né de ce doublon.

**Deux phrases promettaient ce qui n'existe pas.** Le logo et l'image Open Graph
sont encore à dessiner, et la page en parlait au présent : le paragraphe est
parti, il reviendra avec les images. La capture des options du client, elle,
montre les notifications en arrière-plan et non le mode fenêtré ; elle ne nomme
plus la case, une ligne de provenance disant d'où vient une image et non comment
on s'en sert.

## Les liens internes restent des liens

**Tranché le 11 septembre 2026**, la barre du haut étant dessinée. `PageLink`
garde son `<a href>`, et le site ne navigue pas côté client. Treize pages
prérendues de dix-sept kilo-octets, servies par un cache de bord, avec le CSS et
le JavaScript déjà pris : ce qu'on gagnerait à naviguer dans le routeur se compte
en dizaines de millisecondes. Ce qu'on perdrait se compte en modes de panne, la
langue de la balise `html` que React repeint au vol, la position de défilement,
le focus, et le `render` de Base UI sous le bouton de téléchargement, qui
demanderait une `ref` traversante. Le site promet de ne rien devoir à
JavaScript pour s'afficher ; un lien qui est un lien est cette promesse écrite en
HTML.

## Le cartouche et la proposition de langue

**Posés le 11 septembre 2026.** Les trois drapeaux sont en haut à droite de la
bande qui porte la ligne d'indépendance, et chacun mène à **la même page** dans
sa langue. Le pied de page a perdu sa liste de langues : elle renvoyait à
l'accueil, donc changer de langue faisait perdre sa place, et deux endroits pour
un seul choix ne valent pas mieux qu'un.

`Flag` a quitté le logiciel pour `packages/retro` : c'est du dessin, il ne tient
à rien de Tauri, et sa matière `ensign` était déjà partagée. Son type de langue
se dérive de sa propre table de drapeaux, `keyof typeof FLAGS`, donc une
quatrième langue ajoutée à une application sans son drapeau ne compile plus.
`Cross` a suivi par le même chemin, le tracé de la croix étant écrit deux fois.
`ensign` répond maintenant à `aria-current` autant qu'à `aria-pressed`, comme
`askmark` répond à `[open]` autant qu'à `aria-expanded`, et il est entré dans le
bloc `prefers-reduced-motion`, où il manquait.

**La proposition ne redirige jamais et ne se montre qu'une fois.** `offerOf` lit
`navigator.languages`, saute ce que le site ne parle pas, s'arrête à la première
qu'il parle, et se tait si c'est déjà celle de la page. `useOffer` pose le
souvenir à la seconde où la ligne s'affiche, donc elle ne revient pas. Elle naît
après l'hydratation : au prérendu, les trente-neuf fichiers porteraient la
langue d'un seul visiteur. `setState` dans un effet vaut un `oxlint-disable`, et
sa raison est écrite sur la ligne.

**Et elle ne pousse rien.** Elle pend sous la barre du haut en `absolute
top-full`, donc elle recouvre le début du contenu au lieu de le descendre. Posée
dans le flux, elle décalait la page une fois par visiteur, juste après
l'hydratation, et la seule mesure du site est la recherche. `verify-html.mjs`
refuse maintenant un `data-offer` dans une page livrée, et compte les trois
drapeaux du cartouche et le seul allumé : la promesse du prérendu est gardée par
le script, pas par la mémoire.

**Elle s'écrit dans la langue proposée**, par `SPEAKERS[offered]`, et c'est le
premier endroit où les trois voix isolées servent à autre chose qu'au prérendu.
Sa phrase source nomme le français, et chaque catalogue y nomme sa propre langue :
`apps/website/CONTEXT.md` le dit, parce qu'une relecture la corrigerait.

`recall` et `keep` avalent l'exception de `localStorage` : Safari en « bloquer
tous les cookies » lève, et une levée dans un effet casse l'hydratation de la
page entière. Un souvenir qui n'a pas pu être posé vaut refus, faute de quoi la
ligne reviendrait à chaque page.

## Ce que le site a le droit de montrer

Les images restent celles d'Ankama, avec la même discipline que le dépôt : un
dossier qu'un `git rm` retire, exclu du MIT, et un crédit **une fois par page**,
en bas, comme `scene-credit.tsx` le fait par fenêtre. Cinq mentions sous cinq
images d'une même page alourdissent sans rien protéger de plus.

`/images` est la version publique de [images.md](./images.md) : d'où vient chaque
image, et sous quelle condition. C'est ce qui protège vraiment.

L'image Open Graph et le logo du site sont de la matière à nous, sans fichier
d'Ankama. Ce sont les deux seules images qui quittent le site, se collent dans
Discord et sur X, et se republient sans le crédit qui était sous elles.

L'article 5.3.3 des CGU envisage les sites de fans à la seule discrétion
d'Ankama, ce qu'il n'envisageait pas pour le logiciel : le site est mieux couvert
que Multifus ne l'est. Ça ne dispense pas d'écrire à `contact@ankama.com`, le
seul chemin qui donne un droit plutôt qu'une tolérance.

## Le ton et la forme

On n'est ni dans un jeu ni dans un logiciel. Un site normal, navigable, un menu
en haut, du défilement. Mais on sent l'univers de Dofus.

`packages/retro` donne la matière, jamais la mise en page : les jetons, Bebas
pour les titres et les boutons, Roboto pour tout ce qui se lit, le vert pour
l'action et c'est « Télécharger », l'`iron`, les ombres en courbe. Le site ajoute
`--deep` et `--page`, et ses propres matières pour un fond sans décor.
La règle 32 de `design-system.md` compte double ici : Bebas ne porte pas une
phrase, et un site de vente est fait de phrases.

**Ce n'est pas un site de phishing d'Ankama**, et c'est la contrainte la plus
importante de la page. `concurrents.md` liste quatre sites jumeaux à ne pas
installer, plus `dracoon-dofus.com` qui capte le nom de Dracoon sans lui
appartenir. Un site de fan qui imite le bandeau d'Ankama devient indiscernable de
ceux-là. Donc : jamais le logo ni la typographie de Dofus, jamais le vert et
l'orange de leur en-tête, jamais le mot « officiel ». Multifus est le mot le plus
gros de chaque page, en Bebas, qui n'est pas la fonte du jeu. Les décors restent
des fonds derrière notre mobilier, jamais l'habillage du site. Et une ligne
visible sans défiler, sur toutes les pages : projet indépendant, sans lien avec
Ankama.

Il faut aussi sortir du site d'accueil que tout le monde fait, badge, titre
centré, description, trois cartes. Le skill `/frontend-design` prend la suite
avec ces contraintes.

## Les mots du site

Ils ouvriront `apps/website/CONTEXT.md` au démarrage du projet. `CONTEXT.md` à la
racine reste le vocabulaire partagé : la roue des personnages, le tableau des
runes, l'AutoFocus, le Déplacement rapide, que le site reprend mot pour mot. Il
n'y a pas deux modèles, il y a un logiciel et une vitrine posée dessus.

**Fonctionnalité** : ce que le site vend, une par page. Le logiciel dit « map »
pour un de ses lieux, et le site ne dit jamais « map ».

**Avant d'installer** : la levée de doute posée sur `/telecharger`. Le site ne
dit **pas** « questions fréquentes », que `CONTEXT.md` définit déjà comme la
liste des pannes pliée dans les Paramètres, pour quelqu'un qui a installé. Deux
mots identiques pour deux choses, c'est ce que `CONTEXT.md` interdit. Le contenu
est déjà écrit : la section « Ce qu'il ne fait pas » du README, les deux
citations d'Ankama de l'écran À propos, et ce qu'aucun concurrent ne peut
montrer, un binaire signé et notarisé, le code publié, la commande d'attestation.
D'après le tableau de `concurrents.md`, Dracoon déclenche l'alerte Windows,
Retro Toolbox l'antivirus et ROrganizer SmartScreen. C'est le meilleur argument
du site, et c'est aussi la réponse au piège du site de phishing : une coquille ne
montre pas une attestation GitHub.

**Comparatif** : `/comparatif`. Cinq concurrents au maximum, Multixi écarté parce
que l'y mettre le légitimerait et lui donnerait un lien. Restent Dracoon,
Focus Retro, Dosoft, Retro Toolbox, et ROrganizer ou nAiO. Dix à douze lignes,
pas les trente du tableau de `concurrents.md`, qui est un tableau d'ingénieur.
Chaque concurrent porte un lien vers son site, le tableau porte sa date de
relevé, et aucune case n'est remplie depuis la page d'accueil d'un concurrent,
seulement depuis son code. Une case fausse détruit plus que la page ne rapporte.

## Ce que le texte des concurrents a donné

Le relevé est dans `concurrents.md`, section « Ce que leur texte dit ». Ce que le
site en retient, pour le jour où on écrit les pages :

**Le titre dit la douleur, la balise `title` dit la requête.** « sans la prise de
tête » et « without fighting your windows » gagnent parce qu'ils nomment ce que
le joueur vit. « Logiciel Multi-Compte Dofus Rétro Gratuit » tient pourtant la
première page de Google : ce n'est pas une phrase, c'est une requête recopiée.
Les deux ne s'excluent pas, et c'est la seule façon d'avoir les deux.

**Gratuit ne distingue rien**, tout le monde l'écrit trois fois. Le mot doit
être là, il ne porte pas la page.

**L'attestation est l'argument que personne d'autre ne peut écrire.** Focus Retro
nomme le danger des binaires modifiés sans rien prouver du sien, Retro Toolbox
affirme qu'aucun virus n'a été trouvé, SquadMaster admet que l'antivirus se
méfie. Aucun ne montre une preuve vérifiable. `gh attestation verify` va sous
« Avant d'installer », et c'est le meilleur argument de `/telecharger`.

**Ne jamais reprendre « 100 % CGU Ankama » ni « Toléré par Ankama ».** Les deux
affirment un accord que personne ne produit. Le README cite les deux messages
publics d'Ankama en entier : montrer la source bat l'affirmation.

**Chiffrer ce qu'on promet.** Dosoft retient par « 0ms de délai de switch »,
Xixou par « 6 000+ objets » et « 1 452 lieux ». En face, « Des centaines de
joueurs » est la seule preuve sociale du marché, et elle est vague.

**Écrire ce que le logiciel ne fait pas, en intertitre et non en note.**
Multi-Tofu le fait, personne d'autre. Et il doit expliquer que son application
n'est pas signée : `/mac` gagne exactement là, parce que Multifus n'a pas cette
phrase à écrire, et cette absence doit se voir.

**Les boutons portent le système et l'extension.** « Télécharger le .dmg (Apple
Silicon) », « Télécharger l'installeur .exe ». Le joueur sait où il clique avant
de cliquer.

**« Poids des runes : la référence forgemagie »** est la phrase de Xixou. Le mot
« référence » est à prendre, la table est ce qui le mérite.

## Le dessin du site

**Repris en entier le 11 septembre 2026.** La page d'accueil était terne : un
nom en capitales, un bouton, une vidéo bornée au milieu d'un grand vide, et une
barre dont les liens étaient plus gros que le nom du site.

**La palette du jeu est restée, après un aller-retour.** Une encre bleu-nuit avec
un jade d'accent a été posée puis retirée le même jour. Elle était plus moderne
et elle ne disait plus rien de Dofus Retro, quand c'est tout ce que le site a de
propre ; plusieurs concurrents tiennent déjà ce sombre-froid-accent-vif.
`design-system.md` garde la leçon : ce qui manquait n'était pas la couleur,
c'était l'air.

**La barre du haut ne fait plus qu'une ligne.** La ligne d'indépendance passe
au-dessus, dans le flux, et s'en va au premier défilement ; ce qui colle, c'est
la barre seule. Elle porte le nom, le menu des fonctionnalités, le comparatif,
les trois drapeaux et le bouton « Télécharger ». Elle arrive transparente sur le
décor de l'accueil et se pose en défilant, `animation-timeline: scroll()`. Elle
n'a pas de `backdrop-filter` : la vidéo de l'accueil passe dessous, et la règle
27 de [design-system.md](./design-system.md) a déjà payé ce bug.

**Les tailles de la barre ne dépendent plus de la hauteur de la fenêtre.**
`text-way` est un `clamp` en `vh`, fait pour une fenêtre de 320 points : sur un
écran de bureau il montait les liens à 22 pixels, au-dessus du nom du site. La
barre est en `text-deed` pour les liens et `text-action` pour le nom, et la
hiérarchie se voit.

**On sait enfin où l'on est.** `MastLink` porte `aria-current="page"`, le menu
des fonctionnalités porte `data-here` quand la page en est une, et `tab` tire un
trait de jade sous l'onglet courant. La barre n'avait aucun repère de lieu.

**Le menu des fonctionnalités montre les promesses.** Six entrées sur deux
colonnes, nom en Bebas et promesse dessous. Il reste un `<details>` : les six
adresses sont dans le HTML livré, robot compris.

**L'accueil dit une phrase, pas un nom.** Le titre est « Jouez en multicompte
sans chercher une fenêtre », le second membre en vert, et il est en Roboto gras,
non en Bebas : la règle 32 interdit une phrase en Bebas, qui n'a pas de bas de
casse. Le nom Multifus reste dans la barre et dans le titre de la page. `headline`
porte le corps de ce titre, que le thème n'avait pas.

**Le décor monte sous la barre**, le titre et le bouton tiennent la colonne de
gauche, et la boucle de l'AutoFocus occupe la droite en débordant jusqu'au bord de
la fenêtre, `spill`. Le débordement se mesure depuis `--page`, jamais en
pourcentage : la figure est une case de grille, donc un `50%` y vaut la moitié de
sa colonne et la vidéo se faisait couper. `ebb` l'éteint vers la droite par un
voile posé dessus, jamais par un masque : un masque sur une vidéo qui joue
rejoue le bug de la règle 27.

**Les quatre chiffres de l'accueil sont partis.** Sept, zéro, deux, trois : la
forme se voit sur tous les sites de logiciel, et ce qu'ils disaient est déjà dans
« Ce que Multifus ne fait pas », écrit en phrases.

**Le mouvement se fait au défilement, en CSS seul.** `surface-1` à `surface-5`
échelonnent l'arrivée du hero et des titres de page, `reveal` lève chaque bande
quand elle entre, par `animation-timeline: view()`. Aucun observateur, aucun état
React, rien de monté ni démonté. Les deux vivent dans un `@supports`, et sans lui
la barre arrive posée et les bandes sont là : le repli est écrit, pas espéré.
Chaque `surface-N` porte son animation entière, nom, durée, courbe et délai, la
règle 23 refusant une matière qui ne vaut rien sans une autre. `reveal` ne se pose
pas sur la bande du comparatif, dont la première colonne est collée : un
`transform` sur un ancêtre est exactement ce qui décolle un `sticky`.

## Ce qui reste à faire

- [ ] Acheter `multifus.app`. Libre au 11 septembre 2026, aucun serveur de nom sur `.app`, `.io`, `.gg`, `.net` ni `.org`. Pas de `.fr`, le site parlera trois langues. Jamais « dofus » dans le domaine, l'article 13.3 des CGU demandant une autorisation écrite pour les marques. `HOST` est déjà `https://multifus.app` dans `apps/website/src/constants/site.ts`
- [ ] Écrire à `contact@ankama.com` le jour où le domaine est acheté, pour un logiciel et un site gratuits et ouverts. Un site existant se défend mieux qu'un projet
- [ ] Créer le projet Vercel, racine `apps/website`, et vérifier qu'il sert bien `dist/client`
- [ ] Dessiner l'image Open Graph, et la poser dans `headOf`. `twitter:card` est retombé à `summary` en attendant : annoncer `summary_large_image` sans `og:image` donne une carte vide dans Discord et sur X
- [ ] Brancher `/journal` sur `apps/desktop/CHANGELOG.md`, que la première release écrira. C'est la dernière page de `kind: 'plain'`, elle n'a que son titre et sa promesse, et rien ne dit encore comment le fichier devient la page
- [ ] Donner leur vraie adresse aux deux boutons de `/telecharger`. Ils pointent aujourd'hui sur `releases/latest`, la page, faute de savoir le nom du fichier : c'est la lecture de l'API GitHub à la compilation qui la leur donnera, et `RELEASES` est l'unique endroit à reprendre. C'est là que `zod` entre, et pas avant : une réponse d'API qu'on lit sans la valider casse le build en silence le jour où GitHub change un champ
- [ ] Tourner les boucles qui manquent, les messages privés, les réponses rapides, et celle de l'accueil, avec `make-loop`. La table les attend, `loop: null` les marque
- [ ] Le crochet de déploiement Vercel dans le workflow `release`, et la lecture de l'API GitHub à la compilation
- [ ] Vercel Analytics, un seul événement personnalisé, le clic sur « Télécharger » avec le système dedans
- [ ] Déclarer le site à la Search Console et y déposer le sitemap
- [ ] Revérifier dans le code des concurrents les quatre notes à moitié qui ont été déduites du tableau de [concurrents.md](./concurrents.md) et non lues ligne à ligne : le tableau des runes de Retro Toolbox, le rangement de Dosoft, et les compositions d'équipe de Dosoft et de Retro Toolbox. Les deux autres sont sourcées, l'attestation de Focus Retro et la licence de Retro Toolbox. La page promet une case lue dans le code, donc une note qui ne l'est pas est exactement ce qu'elle reproche aux autres
- [ ] Ouvrir le site dans Firefox, qui ne connaît pas `animation-timeline` : le repli est écrit dans un `@supports`, il n'a pas été vu tourner
- [ ] Relire l'anglais et l'espagnol une fois le français figé. Les trois catalogues sont pleins, et ils portent maintenant le corps des sept fonctionnalités : c'est du texte suivi, et il n'a été relu par personne

## Ce que ce plan rendra à `plan.md`

Le journal des versions publié à une adresse qui ne bougera plus, c'est
`/journal`, et le lien qui l'ouvre dans le navigateur depuis l'écran À propos, à
côté de « Aller voir » et « Aller le dire ». Et la décision de savoir si le
panneau de mise à jour y renvoie quand une version est prête.
