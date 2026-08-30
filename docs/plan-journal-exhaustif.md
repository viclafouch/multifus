# Le journal exhaustif

Seize `switch` de `journal.ts` et `wording.ts` finissaient par un `default`. Cinq
rendaient la chaîne vide : un genre d'évènement oublié posait une ligne blanche
dans le journal de l'utilisateur, et rien ne le disait. Les onze autres
rendaient un repli poli, le sujet seul ou une phrase générique.

## Ce qui a été fait

Les seize `default` deviennent `return sujet satisfies never`. Le compilateur
refuse alors de passer si le sujet n'est pas `never`, c'est-à-dire si une
variante de l'union n'est pas traitée. Un genre d'évènement ajouté côté Rust
casse la compilation au lieu de poser une ligne vide à l'écran.

Le motif était déjà dans le dépôt : `constants/journal.ts` garde vingt-cinq
genres par `as const satisfies Record<Kind, …>`. Les seize `default` étaient les
trente autres, sans garde.

## Ce que la conversion a appris

**Les seize étaient du code mort.** Chaque `switch` couvrait déjà toute son
union ; aucun repli n'avait jamais servi. `tsc` passe sans qu'une seule branche
ait été ajoutée. Le repli ne rattrapait rien, il empêchait seulement le
compilateur de parler.

## Ce qu'on n'a pas fait

`journal.test.ts` fait 1623 lignes, dont environ 1340 de tables de gabarits qui
réécrivent chaque phrase française mot pour mot. Ces tables ne prouvent pas
qu'une phrase est juste, seulement qu'elle n'a pas changé d'un seul côté. Elles
gardaient aussi l'exhaustivité, que le compilateur tient maintenant.

Les supprimer se discute, et ce n'est pas une conséquence mécanique de ce
changement : une phrase vue par l'utilisateur qui change sans qu'on le veuille
reste une régression, et la table la voit. À trancher à part.
