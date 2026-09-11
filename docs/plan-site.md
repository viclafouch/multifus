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

Quatorze. La barre du haut porte Multifus, un menu déroulant « Fonctionnalités »
qui tient les sept du milieu, puis Comparatif, Télécharger. Pas de barre
latérale : c'est le motif d'une documentation de bibliothèque, et on ne vend pas
une documentation.

| Adresse                 | Ce qu'elle fait                                               | Vidéo     |
| ----------------------- | ------------------------------------------------------------- | --------- |
| `/`                     | La promesse, les fonctionnalités en aperçu, le téléchargement | à tourner |
| `/autofocus`            | La fenêtre passe devant sur sept événements                   | existe    |
| `/roue-des-personnages` | Le disque de têtes au maintien d'une combinaison              | existe    |
| `/deplacement-rapide`   | Un clic gauche, la team suit                                  | existe    |
| `/tableau-des-runes`    | Les poids posés par-dessus le jeu                             | existe    |
| `/raccourcis`           | Une touche par personnage, suivant, précédent, principal      | à tourner |
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

Le menu annonce sept fonctionnalités, et six suffiraient si les réponses rapides
rejoignaient les raccourcis. À trancher en écrivant la page : si elle tient en
trois paragraphes, elle n'est pas une page.

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
par le remplissage : on ne parle ni de fenêtres, ni de processus, ni
d'autorisations système. Ça, c'est le logiciel qui le dit, une fois installé.

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
build` écrit quarante-deux fichiers HTML, un par page et par langue, et un
`sitemap.xml` de quarante-deux adresses. Chaque page sort avec son contenu dans
le HTML livré, son `lang`, son `canonical` et ses quatre `hreflang`.

TanStack Start, entièrement prérendu, déployé sur Vercel. `sitemap: { enabled,
host }` est dans le greffon Vite, et `prerender.pages` reçoit la table.
`autoStaticPathsDiscovery` et `crawlLinks` sont **éteints** : allumés, ils
ajoutent `/en/` à côté du `/en` de la table, et le sitemap comptait
quarante-quatre adresses pour quarante-deux pages. La table énumère, et elle
seule.

**Aucun service payant.** Cette règle tient le site entier, et elle est
maintenant dans `CLAUDE.md`. Vercel en plan Hobby, Vercel Analytics dans son
quota gratuit, la Search Console, et rien d'autre.

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
mute une instance globale. Au prérendu, TanStack Start lance quatorze rendus en
parallèle par défaut : trois langues sur un singleton muté, ce sont des pages
mélangées, et le bogue ne se voit qu'à la compilation. Le site prend trois
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
logiciel**, `btn-way` compris, et la règle 19 de
[design-system.md](./design-system.md) le dit maintenant. Le voile du survol ne
se voit pas sur un fond uni, faute de décor dessous ; le losange qui entre
suffit.

**Le menu déroulant est un `<details>`.** Base UI n'est pas une dépendance du
site, et un menu qui a besoin de JavaScript pour s'ouvrir n'a pas sa place sur
une page prérendue : les sept adresses sont dans le HTML livré, robot compris.
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
pour les titres et les boutons, Roboto pour tout ce qui se lit, le vert pour un
seul bouton par page et c'est « Télécharger », l'`iron`, les ombres en courbe.
La règle 30 de `design-system.md` compte double ici : Bebas ne porte pas une
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

## Ce qui reste à faire

- [ ] Acheter `multifus.app`. Libre au 11 septembre 2026, aucun serveur de nom sur `.app`, `.io`, `.gg`, `.net` ni `.org`. Pas de `.fr`, le site parlera trois langues. Jamais « dofus » dans le domaine, l'article 13.3 des CGU demandant une autorisation écrite pour les marques. `HOST` est déjà `https://multifus.app` dans `apps/website/src/constants/site.ts`
- [ ] Écrire à `contact@ankama.com` le jour où le domaine est acheté, pour un logiciel et un site gratuits et ouverts. Un site existant se défend mieux qu'un projet
- [ ] Créer le projet Vercel, racine `apps/website`, et vérifier qu'il sert bien `dist/client`
- [ ] Dessiner l'image Open Graph, et la poser dans `headOf`. `twitter:card` est retombé à `summary` en attendant : annoncer `summary_large_image` sans `og:image` donne une carte vide dans Discord et sur X
- [ ] Brancher `/journal` sur `apps/desktop/CHANGELOG.md`. La page existe, elle est vide, et rien ne dit d'où son contenu viendra
- [ ] Trancher les liens internes. `PageLink` pose un `<a href>`, parce que le `to` de `Link` est typé sur l'arbre des routes et qu'une adresse calculée n'y entre pas. Un site statique de quatorze pages s'en accommode, mais on perd le préchargement : à reprendre en dessinant la barre du haut
- [ ] Écrire le corps des pages en français. Simple, long, aucun point technique. L'accueil et `/telecharger` sont écrits ; les quatre pages de `kind: 'plain'`, le comparatif, les poids des runes, le journal et les images, n'ont que leur titre et leur promesse, et les huit fonctionnalités n'ont que leur titre, leur promesse et leur vidéo
- [ ] Donner leur vraie adresse aux deux boutons de `/telecharger`. Ils pointent aujourd'hui sur `releases/latest`, la page, faute de savoir le nom du fichier : c'est la lecture de l'API GitHub à la compilation qui la leur donnera, et `RELEASES` est l'unique endroit à reprendre
- [ ] Dessiner le comparatif. `/comparatif` est annoncé depuis l'accueil et depuis la barre du haut, et il n'a rien à montrer
- [ ] Poser la ligne discrète qui propose l'autre langue, une fois, sans jamais rediriger. Les trois drapeaux dans le cartouche, comme sur les maps
- [ ] Tourner les boucles qui manquent, les raccourcis, les messages privés, les réponses rapides, et celle de l'accueil, avec `make-loop`. La table les attend, `loop: null` les marque
- [ ] Le crochet de déploiement Vercel dans le workflow `release`, et la lecture de l'API GitHub à la compilation
- [ ] Vercel Analytics, un seul événement personnalisé, le clic sur « Télécharger » avec le système dedans
- [ ] Déclarer le site à la Search Console et y déposer le sitemap
- [ ] Relire l'anglais et l'espagnol une fois le français figé. Les trois catalogues sont pleins, mais les quarante-deux phrases d'aujourd'hui ne sont que des titres et des promesses

## Ce que ce plan rendra à `plan.md`

Le journal des versions publié à une adresse qui ne bougera plus, c'est
`/journal`, et le lien qui l'ouvre dans le navigateur depuis l'écran À propos, à
côté de « Aller voir » et « Aller le dire ». Et la décision de savoir si le
panneau de mise à jour y renvoie quand une version est prête.
