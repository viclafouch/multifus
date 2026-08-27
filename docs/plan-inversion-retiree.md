# L'Inversion s'en va

Le raccourci « Inverser hommes et femmes » et tout ce qui le servait quittent
Multifus.

## Pourquoi

Un raccourci de plus à retenir, pour un geste que les deux interrupteurs de
l'écran Personnages font déjà, et sous les yeux. `Ctrl+Maj+Haut` est rendu aux
autres logiciels.

## Ce qui part

Côté Rust :

- `ShortcutAction::Swap`, et `ALL` passe de six à cinq
- le réglage `shortcuts.swap` et son défaut `Control+Shift+Up`
- les deux `match` de `state.rs` qui aiguillaient l'action
- les issues `Swapped { kept }` et `NoGender` du journal
- `Roster::swap`, `Roster::swap_to`, puis `Roster::has_in_cycle` et
  `Gender::other`, orphelins une fois l'Inversion partie

Côté TypeScript :

- `'swap'` de `ShortcutAction`
- les issues `swapped` et `noGender`, et la table `SWAP_LINES`
- les deux `case` de `helpers/journal.ts`
- l'entrée de l'écran Raccourcis

Dans `CONTEXT.md`, l'entrée **Inversion**, et le mot de trop dans **Principal**,
qui disait « il défile, s'exclut et s'inverse comme les autres ».

## Ce qui reste

L'exclusion par sexe. `GenderToggle` sur l'écran Personnages appelle
`set_gender_excluded`, puis `Roster::set_excluded_for_gender` : un autre chemin,
que l'Inversion ne traversait pas. Les deux interrupteurs sont intacts.

## Décisions

- Les tests qui prenaient `swap` comme action témoin prennent `walk` ou `main` :
  aucun ne l'avait choisie pour ce qu'elle faisait.
- `a_shortcut_that_settles_by_itself_never_touches_a_window` passe à `Main`, qui
  répond `NoMain`. Ce n'est pas le doublon de
  `the_main_shortcut_says_when_no_main_is_chosen` : celui-là éprouve
  `decide_shortcut` seul, celui-ci le chemin complet de `answer`, et il affirme
  qu'aucune fenêtre n'a été touchée alors que trois attendaient.
- `docs/plan-personnage-principal.md` et `docs/plan-exclusion-roster.md` nomment
  encore l'Inversion. Ce sont des plans de travail déjà livrés, qui auraient dû
  disparaître : à effacer, pas à réécrire.
