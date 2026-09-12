# Les pages de fonctionnalité

Les sept pages sont redessinées : `/autofocus`, `/roue-des-personnages`,
`/deplacement-rapide`, `/tableau-des-runes`, `/messages-prives`,
`/reponses-rapides` et `/mac`. Le texte n'a pas bougé, les trois catalogues sont
donc intacts, à deux mots près, « Pause » et « Lire ».

Les mots sont dans [apps/website/CONTEXT.md](../apps/website/CONTEXT.md) :
décor, feuille, scène, blason, vignette, et comment on passe d'une page à
l'autre.

## Le décor reste net, et ça a coûté deux allers-retours

Deux captures de jeu l'une sur l'autre, la vidéo et le décor de la map, et
l'œil ne sait plus où s'arrête l'une. Le premier essai a flouté le décor :
le décor devient invisible, donc il ne sert plus à rien, et ce n'est pas ce que
fait le logiciel.

Ce qui sépare vraiment les deux, c'est la taille. La vidéo prend toute la
largeur de la bande, elle porte son cadre et son ombre, et le décor n'est plus
qu'un tour d'image. Il reste net et bien présent, comme dans le logiciel.

La plaque posée sur le coin de la vidéo a sauté avec : une carte opaque sur une
vidéo cache ce qu'on est venu voir. Le nom et la promesse se lisent maintenant
sur la bande du bas de la vidéo, sur un voile qui descend vers l'encre.

La plongée du décor au défilement ne joue que sur son opacité, jamais sur sa
taille : redimensionner une image à chaque image de l'animation fait saccader
le défilement.

## Ce qui a changé ailleurs

Le décor et la feuille valent pour tout le site, donc l'accueil, le
téléchargement et le comparatif les portent aussi. Le fond de bande qu'ils
avaient est supprimé. Sur l'accueil et le téléchargement, le texte du haut vit
maintenant sur un voile sombre, parce que le gris du site ne tient pas son
contraste au-dessus d'un décor clair.

La barre du haut ne débordait plus sous 480 points une fois le menu déplié
ancré sur la barre et non sur son bouton. La ligne du plan qui le demandait est
donc partie.

## À trancher

- La navigation reste une vraie navigation, et le fondu vient du navigateur.
  L'autre voie est de passer les liens internes par `Link` de TanStack Router :
  le décor vivrait alors dans le `__root` et changerait d'opacité sans changer
  de document, Firefox compris. Ça oblige tout lien interne à connaître la route
  et ses paramètres, et ça met la navigation sous la dépendance du JavaScript.
  Le gain visible est pour Firefox seul

## À vérifier sur l'autre machine

- Le fondu entre deux fonctionnalités, sur Chrome puis sur Safari, et la place
  de la vidéo qui doit se garder d'une page à l'autre
- Firefox, qui n'a ni fondu entre documents ni animation liée au défilement :
  la page doit s'afficher d'un coup, sans manque
- Le préchargement au survol, dans l'onglet réseau de Chrome
- « Réduire les animations » du système : plus de fondu, plus de plongée du
  décor, tout arrive d'un coup, la vidéo ne part pas seule et porte les
  commandes du navigateur
- Le bouton « Pause » au coin de la vidéo, à la souris et au clavier. Une boucle
  de treize secondes qui tourne sans fin doit pouvoir s'arrêter, et c'est la
  seule raison pour laquelle il existe
- Le site sans JavaScript : la vidéo ne part pas toute seule, elle montre son
  affiche et ne bouge pas. C'est voulu : le départ se demande depuis le code,
  jamais depuis la balise, faute de quoi une boucle sans fin tournerait sans
  personne pour l'arrêter
- Sur un téléphone, que la scène et le blason tiennent dans le premier écran,
  barre d'adresse déployée
- La page `/tableau-des-runes` : le blason couvre le coin bas-gauche de la
  vidéo, là où la boucle montre le tableau. À trancher une fois la vraie boucle
  tournée
