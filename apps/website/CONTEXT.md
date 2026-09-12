# Les mots du site

Le vocabulaire partagé est [CONTEXT.md](../../CONTEXT.md) à la racine : la roue
des personnages, le tableau des runes, l'AutoFocus, le Déplacement rapide. Le
site les reprend mot pour mot. Il n'y a pas deux modèles, il y a un logiciel et
une vitrine posée dessus.

Ce fichier ne porte que les mots qui naissent ici, et les pièges que le site a
déjà payés.

## Les mots

**Fonctionnalité** : ce que le site vend, une par page. Le logiciel dit « map »
pour un de ses lieux et « écran » pour ce qu'on y lit ; le site ne nomme jamais
une de ses pages ainsi. Un visiteur n'a rien installé, et les lieux de Multifus
ne lui disent rien.

Les deux mots gardent en revanche leur sens de joueur, et le corps des pages s'en
sert : la map qu'une team traverse, l'écran sur lequel on joue, l'écran de
connexion où revient un personnage déconnecté. Ce sont les mots du jeu, et le
site les emploie comme le jeu les emploie.

**Page** : une adresse du site, et une ligne de `constants/pages.ts`. Son
identifiant est le même dans les trois langues, ses trois adresses sont
différentes. Une page ajoutée sans son espagnol ne compile pas.

**Promesse** : la phrase sous le titre, ce que la fonctionnalité fait pour le
joueur. Elle sert aussi de `meta description` et de légende de la vidéo, donc
elle se lit toute seule, hors de sa page.

**Avant d'installer** : la levée de doute, sur `/telecharger`. Quatre points, en
colonne, et deux d'entre eux portent en plus ce qui les prouve, la commande
d'attestation et un lien. Le site ne dit **pas** « questions fréquentes » :
`CONTEXT.md` réserve déjà ce mot à la liste des pannes pliée dans les
Paramètres, pour quelqu'un qui a installé. Deux mots identiques pour deux
choses, c'est ce que `CONTEXT.md` interdit.

**Point** (`Point`) : une amorce en gras de quatre à six mots, puis une phrase.
C'est la forme du corps de toute page du site, sans exception. `Point` en rend
un et peut lui accrocher ce qui le prouve, une commande ou un lien ; `PointList`
en rend une suite quand aucun n'a rien à accrocher, et il passe par `Point`. Le
gras n'existe nulle part ailleurs. L'amorce et la phrase sont deux `msg`
séparés, parce que `<Trans>` ne passe pas ici et que c'est la seule façon
d'avoir du gras dans une phrase traduite.

**Geste** (`SYSTEM_MOVES`) : une des trois choses à faire pour installer Multifus, une
liste par système. Le logiciel dit « étape » (`Step`) pour ce qui se coche dans
la mise en route, et le site n'emploie jamais ce mot-là : un geste se fait une
fois, avant d'avoir lancé quoi que ce soit, et il n'a pas d'état.

**Prise** (`DownloadTake`) : le bouton de `/telecharger`, et lui seul. Il porte
le système du visiteur, que le navigateur reconnaît après l'hydratation ; avant,
et sans JavaScript, c'est `SOURCE_SYSTEM` qui tient la place. L'autre système
pend dessous en une ligne, jamais en second bouton : deux boutons de même poids
se comparent au lieu de se choisir.

**Plaque** (`Plate`) : le verre sur lequel le site pose un bloc, et il n'y en a
qu'une sorte. C'est son titre qui la décide : un titre court en Bebas,
`nameplate`, et elle porte son filet de jade en haut, comme les trois gestes et
les deux messages d'Ankama ; un titre de bande, `BandTitle`, qui porte déjà son
filet, et la plaque se pose **nue**, `isBare`, faute de quoi deux filets verts
se répondent à quarante pixels. `glass` reste la matière du seul bloc qui n'a
pas de titre du tout, le tableau du comparatif.

**Comparatif** : `/comparatif`. Cinq concurrents au maximum. Aucune case n'est
remplie depuis la page d'accueil d'un concurrent, seulement depuis son code.

**Concurrent** (`Rival`) : une colonne du comparatif, son nom propre et l'adresse
de son dépôt, jamais celle de sa vitrine. Le lien mène là où la case a été lue.
Il n'y a pas de colonne pour un outil qui ne publie rien : on ne saurait pas quoi
y mettre.

**Trait** (`Trait`) : ce que le comparatif compare, entre dix et douze. Cinq
reprennent le nom de leur page, et c'est le même mot des deux côtés. Le code dit
`Trait` parce que `Ligne` est déjà pris par le menu de l'accueil.

**Case** (`Mark`) : `yes`, `half` ou `no`, et rien d'autre. Un disque plein en
vert feuille, un demi-disque en ambre, un anneau vide en flamme. Un SVG, jamais
un fond CSS : en contraste forcé, le tracé survit et trois fonds deviendraient
trois cercles identiques. La forme suffit seule, la
couleur ne fait que presser le pas, et `MARK_NAMES` donne le mot au lecteur
d'écran. Deux lignes au moins portent `no` en face de Multifus : un comparatif
qu'on gagne partout ne se croit pas.

**Note** (`HalfNote`) : une phrase par case à moitié, une seule ligne, qui dit ce
qui manque à l'outil. `MarkTip` la lève en bulle au survol et au focus, par un
portail vers le `body` : dans le tableau, l'`overflow-x` la trancherait. Elle est
aussi dans le HTML livré, en `sr-only`, donc elle ne dépend pas du JavaScript.
`constants/rivals.test.ts` tient la bijection : une case à moitié sans note, ou
une note sans case, ne compile plus.

**Voisines** (`kin`) : les deux ou trois pages vers lesquelles une page renvoie
en bas, choisies à la main dans `constants/pages.ts`. C'est le maillage interne,
et il remplace la barre latérale d'une documentation. Le champ est obligatoire,
donc une page ajoutée sans lui ne compile pas ; il a le droit d'être vide, et
c'est le cas de l'accueil, qui renvoie déjà partout. Vide, la section ne se pose
pas : c'est l'écran qui décide, jamais `PageKin`.

**Bande** (`Band`) : une tranche horizontale d'une page, sa largeur et son
rythme. Une page est une pile de bandes, jamais une grille. `BandTitle` en porte
le titre, `PageHead` porte le nom et la promesse d'une page.

**Décor** (`PAGE_DECORS`) : le décor du jeu posé derrière une page, celui de la
map où la fonctionnalité vit dans le logiciel. Il ne bouge pas avec le
défilement, il couvre la fenêtre entière, et une page qui montre des documents
plutôt que le jeu vaut `null` : le journal et les messages d'Ankama n'en ont
pas. La table couvre les douze pages, donc ajouter une page force à dire si elle
a un décor. Il reste **net** et bien présent, comme dans le logiciel : ce qui le
sépare de la vidéo, c'est le cadre de celle-ci, son ombre et sa taille, jamais un
flou, qui ne ferait que le rendre invisible. Le logiciel monte ses neuf décors
d'un coup et fait glisser leurs opacités ; le site n'en charge qu'un par page et
laisse le navigateur croiser les deux documents, ce qui donne le même fondu pour
un neuvième du poids.

**Feuille** (`Sheet`) : le fond uni sur lequel une page pose ce qui se lit. Elle
commence là où le décor s'arrête, d'un fondu de quatre rem, et elle va jusqu'au
pied de page. Tout texte de corps vit dessus, parce que le gris du site ne tient
pas son contraste au-dessus d'une herbe verte. Ce qui reste sur le décor est
soit un titre en crème avec son ombre, soit une plaque opaque.

**Scène** (`FeatureStage`) : la vidéo en grand et le blason posé sur sa bande du
bas. Rien d'autre : l'appel au téléchargement et l'amorce se lisent dessous, sur
la feuille. Sa largeur se prend à la hauteur de la fenêtre, en `svh` et jamais
en `vh` : sur un téléphone, `vh` compte la barre d'adresse rétractée, et le bas
de la vidéo passe sous le bord de l'écran. La scène tient dans le premier écran,
et il reste de quoi voir qu'on peut défiler.

**Blason** (`Blazon`) : le nom, le filet et la promesse, posés sur la bande du
bas de la vidéo. Ils se lisent sur un voile (`scrim`) qui descend vers l'encre :
la vidéo se voit en entier, et le texte tient son contraste quelle que soit
l'image. Sous 640 points, le blason passe sous la vidéo, dans le flux : un voile
de cent cinquante points sur une vidéo qui en fait deux cents la couvrirait.
Une fonctionnalité sans vidéo n'a pas de blason, elle garde le titre de page.

**Prose** (`Prose`) : un paragraphe de corps, à la largeur où il se lit.
`ProseBlock` en groupe plusieurs sous un intertitre.

**Corps** (`Body`) : ce qu'une page de fonctionnalité dit de sa scène, dans
`constants/bodies.ts`. Une amorce, deux ou trois passages, et la limite.
`PAGE_BODIES` vaut `null` pour une page qui n'en a pas, comme `loop` : le test
refuse un corps ailleurs que sur une fonctionnalité, et une fonctionnalité sans
corps.

**Passage** (`Passage`) : un intertitre et ses points. Le mot est celui du
texte, `Bande` étant déjà la tranche d'une page.

**Amorce** (`Opening`) : le premier paragraphe d'un corps. Il raconte la scène
que la vidéo montre, il se lit donc juste dessous, à droite de l'appel au
téléchargement, et il porte un filet à sa gauche pour qu'on le distingue des
passages, qui expliquent.

**Limite** (`limit`) : le passage qui dit ce que la fonctionnalité ne fait pas.
Il est obligatoire, `LimitPlate` le pose sur une plaque, le titre à gauche et
les points à droite, et `constants/bodies.test.ts`
refuse un titre où « ne fait pas » ne s'écrit pas. C'est la règle du comparatif
tournée vers une seule page : ce qui se donne sans manque ne se croit pas.

**Vignette** (`Vignette`) : ce qu'une page montre d'une autre page, son affiche,
son nom et sa promesse, et le tout mène là-bas. C'est la seule carte du site :
les six de l'accueil et les deux voisines du bas d'une page sont la même chose.
Elle ne joue pas la vidéo : six lecteurs sur l'accueil coûteraient plus que la
page entière, et la vidéo est le sujet de la page où l'on va. Une page sans
vidéo n'a pas d'affiche, et la vignette montre alors ses deux phrases seules.
Les six de l'accueil se posent en **mosaïque** (`mosaic`), qui alterne les
largeurs pour que six vignettes ne fassent pas une grille de catalogue.

**Ligne** (`WayLink`) : le menu de l'accueil du logiciel posé sur le site. Il
portait les six fonctionnalités, il ne porte plus que le comparatif. **Onglet**
(`MastLink`) est un lien de la barre du haut, et il sait dire qu'on est déjà sur
sa page.

**Affiche** (`poster`) : l'image tirée d'une boucle, posée sur le lecteur tant
que la vidéo ne joue pas, et donnée à Google comme vignette du résultat. Elle
n'est pas la première image de sa boucle : elle se choisit sur la seconde où la
fonctionnalité se voit.

**Fiche** (`SchemaNode`) : un bloc de balisage schema.org. Une page en porte une
à trois, et elles sortent toutes de la table : la fiche du logiciel, la fiche de
la vidéo, le fil d'Ariane. Sa forme vient de `schema-dts`, pas de nous : une
propriété mal tapée ne compile plus, et `Addressed` n'ajoute que ce que le site
exige en plus, l'adresse chez nous sur chaque fiche.

**Message** (`AnkamaWord`) : une des deux réponses publiques d'Ankama sur les
gestionnaires de fenêtres, et il n'y en a que deux. `/ankama` les montre en
entier, en capture, avec la phrase qui tranche citée au-dessus. **Une citation
d'Ankama ne se traduit pas** : elle est en clair dans `constants/ankama.ts`,
jamais un `msg`, parce que la capture est en français et qu'une citation
traduite n'est plus la citation. Ce qui l'entoure passe par Lingui comme le
reste.

**Cartouche** (`Cartouche`) : les trois drapeaux, dans la barre du haut, entre le
comparatif et le bouton. C'est le cartouche des maps du logiciel, moins le numéro
de version, que le site n'a pas. Il a quitté la bande d'indépendance le jour où
cette bande a cessé de coller : la langue se change à tout moment, pas seulement
en haut de page. Chaque drapeau est un lien vers **la
même page** dans sa langue, jamais vers l'accueil : changer de langue ne fait pas
perdre sa place. Celui de la langue en cours porte `aria-current` et reste seul en
couleur.

**Proposition** (`LanguageOffer`) : la ligne discrète qui pend sous la barre du
haut, et qui propose l'autre langue à qui arrive dans la mauvaise. Elle ne
redirige jamais, et elle ne se montre qu'**une fois** : `useOffer` pose le
souvenir à la seconde où elle s'affiche. Elle naît après l'hydratation et jamais
au prérendu, sinon les trente-neuf fichiers livrés porteraient la langue d'un
seul visiteur, et `verify-html.mjs` refuse son `data-offer` dans une page livrée.
Elle recouvre le début du contenu au lieu de le pousser : dans le flux, elle
décalait la page une fois par visiteur.

Elle s'écrit dans la langue **proposée**, pas dans celle de la page : c'est
`SPEAKERS[offered]` qui la rend, et c'est à ça que servent les trois voix. Sa
phrase source est « Lire cette page en français » et chaque catalogue y nomme sa
propre langue, l'anglais « in English », l'espagnol « en español ». Une relecture
qui la corrigerait en « in French » casserait la seule chose qu'elle fait.

**Souvenir** (`keepsake`) : ce que le navigateur garde d'une visite, `recall` et
`keep`. Les deux avalent l'exception : Safari en « bloquer tous les cookies »
lève sur `localStorage`, et une levée dans un effet casse l'hydratation de toute
la page. Un souvenir qui n'a pas pu être posé vaut refus, donc la proposition ne
se montre pas plutôt que de se montrer à chaque page.

**Voix** : une instance de Lingui, une par langue. `SPEAKERS.fr`, `SPEAKERS.en`,
`SPEAKERS.es`. Elles ne s'activent pas, elles ne se muent pas, elles parlent.

## Comment on passe d'une page à l'autre

Chaque lien interne est une vraie navigation, `<a href>`, et le site reste douze
documents prérendus. Ce qui rend le passage fluide est du navigateur, pas du
JavaScript à nous.

**Le fondu** vient de `@view-transition { navigation: auto }`, dans
`styles.css`. Le document entier se croise, décor compris, et deux
choses traversent sans se croiser : la barre du haut, qui ne bouge pas, et la
scène, qui garde la place de la vidéo d'une page à l'autre. Elles portent pour
cela un `view-transition-name`, et **deux éléments d'une même page ne peuvent
pas porter le même nom**, sinon le navigateur annule toute la transition.
Chrome et Safari le font, Firefox ne le fait pas encore et navigue sans fondu,
ce qui est exactement ce que le site faisait avant. Une préférence de mouvement
réduit repasse `navigation: none`.

**Le fondu attend le contenu.** Chaque page porte
`<link rel="expect" href="#ouverture" blocking="render">`, et `#ouverture`
(`FOLD_ANCHOR`) est l'identifiant de la première bande de chaque écran. Sans
lui, le navigateur croise l'ancienne page avec une page encore vide.
`verify-html.mjs` refuse une page livrée sans les deux.

**Le préchargement** vient des règles de spéculation, dans `__root.tsx` : le
navigateur va chercher le document d'un lien survolé, et rien de plus. C'est
`prefetch` et non `prerender`, parce qu'une page prérendue exécuterait son
JavaScript sans être vue, et la proposition de langue brûlerait son souvenir
pour un écran que personne n'a regardé.

## Où les imports changent de forme

Presque tout le site importe par l'alias `@/`. Six fichiers ne le font pas :
`constants/pages.ts`, `constants/languages.ts`, `constants/site.ts`,
`helpers/page.ts`, `helpers/language.ts` et les types de `@types/`. Ils importent
**en relatif, avec l'extension `.ts`**, parce que `vite.config.ts` les lit pour
énumérer le prérendu et pour le sitemap, et qu'il les lit avant que l'alias
existe. Aucun d'eux ne touche une image : les vidéos et leurs affiches vivent
dans `constants/loops.ts`, que la config ne lit pas. `scripts/verify-html.mjs`
en est le second lecteur : Node retire les types lui-même, et le script prend
`FOLD_ANCHOR` à `constants/site.ts` plutôt que de le recopier.

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
globale, et il a raison : une fenêtre, une langue. Le site prérend ses pages en
parallèle dans trois langues ; sur un singleton muté ce sont des pages
mélangées, et le bogue ne se voit qu'à la compilation. Les trois voix vivent dans
`lib/i18n.ts` et passent par `I18nProvider`.
