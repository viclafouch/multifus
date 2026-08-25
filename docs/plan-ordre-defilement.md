# Ordre du défilement : tirer une ligne dans Personnages

## Ce qu'on veut à l'écran

Une ligne de Personnages se prend par sa poignée, monte ou descend, et les autres
lignes s'écartent devant elle. Au relâchement, elle se pose, et le défilement
suit le nouvel ordre. Rien d'autre de la fenêtre ne bouge.

## Ce qui a échoué avant

1. **Glisser-déposer HTML5** (`draggable`, `dataTransfer`, `setDragImage`) :
   WKWebView photographie toute la fenêtre pour l'image de glissement. On voyait
   la barre de navigation et le titre doublés, flous, collés au curseur.
2. **Pointeur à la main** (`setPointerCapture` sur la poignée) : la ligne tirée
   change de place dans le DOM dès que l'ordre bascule, et WebKit rend la capture
   quand le bouton qui la détient est déplacé. Le tirage lâchait tout seul, et se
   posait tout seul, dès que le curseur croisait une autre ligne.
3. **Pointeur à la main, écoute au niveau fenêtre** : plus de capture perdue,
   mais tout le reste restait à écrire à la main, l'index visé, le décalage, le
   clavier, l'annonce au lecteur d'écran. Trop de pièces pour un besoin courant.

## Ce qu'on fait

`@dnd-kit/react` (0.5.x), la bibliothèque du domaine, documentée sur
`https://dndkit.com`. Elle n'emploie pas le glisser-déposer natif : elle écoute
les événements de pointeur et déplace les éléments elle-même. Le clavier vient
avec.

Trois dépendances directes, toutes en `^0.5.0` : `@dnd-kit/react` pour les
crochets, `@dnd-kit/dom` pour le greffon d'accessibilité, `@dnd-kit/abstract`
pour les modificateurs.

- `DragDropProvider` autour de la liste, dans `characters-screen.tsx`.
- `lib/drag.ts` tient la configuration : modificateurs et annonces françaises.
  L'écran orchestre, il n'implémente pas.
- `useSortable({ id, index })` dans `character-row.tsx` : `ref` sur la ligne,
  `handleRef` sur la poignée, `isDragging` pour le style de la ligne soulevée.
- `RestrictToVerticalAxis` : la ligne ne part pas de côté.
- Le nouvel ordre est lu dans `onDragEnd` : la ligne est reconnue par son pseudo
  (`source.id`), et son déplacement par `index` moins `initialIndex`. L'ordre
  part ensuite au noyau par `reorder`.
- `useCycleOrder` fige l'ordre affiché au début du tirage, et le garde jusqu'à ce
  qu'un instantané range le roster de la même façon (`matchIsArranged`). Sans
  cela, un client qui se connecte pendant le tirage, ou juste après le dépôt,
  fait sauter la liste sous le curseur.

## Le clignotement au dépôt

Une ligne posée disparaissait et revenait aussitôt. React déplace le `<li>` pour
écrire le nouvel ordre, et WebKit relance l'animation d'entrée `rise` sur un
élément réinséré : la ligne repartait de `opacity: 0`. L'animation ne joue plus
qu'une fois, au montage : `data-entering` porte la classe, et `onAnimationEnd`
retire l'attribut.

## Clavier

Le clavier passe par le capteur de `@dnd-kit`, pas par un `onKeyDown` à nous :
poignée au clavier, `Espace` pour prendre, flèches pour déplacer, `Espace` pour
poser, `Échap` pour annuler. Les annonces au lecteur d'écran sont en français,
dans `constants/strings/characters.ts`.

## À vérifier sur l'autre machine

- [ ] La ligne suit le curseur et rien d'autre ne bouge dans la fenêtre.
- [ ] Le passage au-dessus d'une autre poignée ne lâche plus le tirage.
- [ ] L'ordre tient après le relâchement, même quand un client se connecte ou se
      ferme dans la seconde qui suit.
- [ ] `Espace`, flèches, `Espace` déplacent une ligne sans la souris.
