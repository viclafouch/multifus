# Retirer un personnage, et l'étoile du principal

Trois gestes que le monde a rendus muets, vus le 06/09/2026 sur le Mac.

## Ce qui n'allait pas

**La croix des Personnages ne se voit pas.** Elle naît à `opacity-0` et n'apparaît
qu'au survol de la ligne, en kaki à 55 %, un `×` de texte sans cadre. Qui ne
survole pas ne sait pas qu'un personnage se retire.

**L'accueil ne retire rien.** Le dolmen porte les têtes, un vieux personnage
déconnecté y reste pour toujours, et il faut passer par les Personnages pour
l'enlever.

**La marque du principal est un losange.** Le commit du monde a remplacé l'étoile
par un carré de 10 points tourné à 45°, et personne ne lit « principal » dans un
losange blanc.

## Ce qu'on fait

**L'étoile revient, dessinée.** `MainMark` rend une étoile à cinq branches en
SVG, pointe en haut, dans un `viewBox` de 24. Portée, elle est pleine or, cernée
d'or sombre, avec une lueur chaude autour ; libre, elle n'est qu'un trait kaki
qui s'éclaircit quand la souris entre sur le bouton. Pas de retour à
`lucide-react`, que [plan-monde.md](./plan-monde.md) veut sortir du dépôt.

Elle mesure 18 px partout où une ligne la porte, les Personnages et les
Raccourcis, contre 10 pour le losange qu'elle remplace. Sur une tête de
l'accueil, elle suit la tête comme tout le reste, et dans la roue elle remplit
la place que la géométrie lui laisse.

**L'or est une exception, et elle est écrite.** `--gold` est `--amber` éclairci
et tiré vers le jaune. La première étoile était crème, comme le losange : sur un
médaillon clair elle s'effaçait, et rien ne disait qu'elle était allumée plutôt
que blanche. Le document de design écartait l'or, il porte maintenant les deux
endroits où il vit et pourquoi.

**Trois carrés à faire disparaître.** L'ombre de `main-lit` était un `box-shadow`
et dessinait la boîte du SVG : elle devient un `filter: drop-shadow`, qui suit la
forme. Le cerne vient d'un `stroke` posé sous le remplissage, `paint-order:
stroke`, ce que Tailwind ne sait pas dire : c'est l'utilitaire `star` de
`retro.css`. Et le bouton qui porte l'étoile prenait un cadre au survol, comme
tous les `bare` : il passe à `glint`, une face qui ne pose ni bord ni fond, et
laisse l'étoile seule répondre.

**La croix se voit tout le temps.** Plus d'`opacity-0` : sur une ligne de
personnage déconnecté, la croix est là, en kaki, et prend la flamme au survol.
Une nouvelle variante de bouton, `ember`, porte ce repos discret et cette flamme,
plutôt que d'espérer qu'un `hover:text-flame` l'emporte sur celui de `btn-bare`.

Les Réponses rapides prennent le même changement, la croix y étant le même
composant et le défaut le même.

**La croix est dessinée, elle aussi.** C'était le caractère `×`, posé dans un
bouton en Bebas : un glyphe se cale sur la hauteur d'x, jamais au milieu d'un
rond, et il penchait sur les trois écrans qui le portent. Deux traits en SVG,
`stroke-linecap: round`, aux deux tiers du bouton.

Le centrage ne tient plus au flux : le tracé est absolu, `inset-0` et `m-auto`,
donc au milieu de la boîte quoi qu'il arrive. Et l'ombre du jeton, qui tombait de
deux pixels vers le bas, est devenue ronde : une ombre qui descend fait paraître
haut ce qui est centré.

**La croix arrive sur l'accueil.** Une tête déconnectée porte sa croix en haut à
droite, au survol de la tête ou quand le clavier y entre. Elle retire tout de
suite, sans rien demander : c'est déjà la règle des Personnages, et un roster se
remplit tout seul dès que le client rouvre.

`Head` cesse d'être un bouton pour devenir un bloc qui en porte deux, la tête et
la croix. Un bouton dans un bouton n'est pas du HTML.

**Sur l'accueil, la croix est un jeton plein.** La face `ember`, discrète sur la
plaque sombre d'une liste, disparaît sur l'herbe d'un décor : un rouge à 84 % de
transparence et un trait d'un pixel ne se voient pas sur une prairie éclairée.
La croix d'une tête porte donc `token` : disque flamme plein, croix crème, bord
sombre et ombre portée, comme tout ce qui se pose sur un décor. Et elle est rouge
dès que la tête est survolée, sans attendre qu'on la vise.

**Rien, sur une tête, n'a de taille en pixels.** Le dolmen fait maigrir `--head`
à mesure que le roster grossit : 66 px pour un personnage seul, 26 px pour une
foule de neuf. `--spacing-pebble` en tire l'étoile et la croix, et
`--spacing-nook` place la croix à 45° du sommet, centre sur le bord du cercle.
Posée au coin du carré, elle flottait à côté de la tête au lieu de s'y accrocher.

**Le retrait n'est plus écrit deux fois.** `handleRemove` rejoint les autres
gestes dans `lib/character-marks.ts`, et « Retirer ⟨pseudo⟩ du roster » devient
`characterRemoveLabel` dans `helpers/wording.ts`.

## Ce qu'on ne fait pas

Pas de confirmation, pas de corbeille, pas d'annulation.

Rien ne bouge pour un personnage connecté : sa fenêtre est ouverte, le retirer
n'aurait aucun sens, il reviendrait au tour suivant.

## Ce qui reste à regarder

- [ ] Le Mac, l'accueil : survoler une tête déconnectée, la croix paraît en haut
      à droite, le clic la fait disparaître du dolmen et le compte des connectés
      ne bouge pas.
- [ ] Le Mac, l'accueil au clavier : la tabulation atteint la croix, elle se
      montre, l'Entrée retire.
- [ ] Le Mac, les Personnages : la croix se voit sans survoler, et la ligne
      entière reste lisible.
- [ ] Le Mac, l'accueil à neuf personnages : les têtes tombent à 26 px, la croix
      et l'étoile suivent. Le jeton n'y fait plus que 11 px, et c'est sa zone de
      clic élargie de 6 px tout autour qui doit le rattraper.
- [ ] La croix bien au milieu de son rond, sur les trois écrans qui la portent :
      les Personnages, les Réponses rapides, l'accueil.
- [ ] L'étoile, aux trois endroits : la ligne des Personnages, la tête de
      l'accueil, la part de roue. Elle doit se lire comme une étoile à sa plus
      petite taille, et son cerne la détacher du portrait.
- [ ] Windows : les mêmes, jamais lancé.

## Une fois livré

Ce fichier s'efface.
