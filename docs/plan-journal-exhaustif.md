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

## Les tables de gabarits, tranchées : elles restent

`journal.test.ts` fait 1623 lignes, dont environ 1200 de tables qui réécrivent
chaque phrase française mot pour mot. La question posée était de savoir si le
compilateur les rendait inutiles.

Non : les deux ne font pas le même travail. Le compilateur tient
l'exhaustivité, que tout genre d'évènement soit traité. Les tables tiennent les
mots, et le journal est ce que l'utilisateur lit le plus. Une phrase qui change
sans qu'on le veuille reste une régression que rien d'autre ne voit.

Elles valent parce qu'elles écrivent la phrase en toutes lettres, à côté du
code qui la compose : deux sources, et le test échoue quand elles divergent.
Deux cas lisaient la phrase dans `strings` au lieu de l'écrire, et ne prouvaient
donc rien de ce qu'elles affichaient. Ils l'écrivent maintenant, et `strings`
n'est plus importé par ce fichier.

1200 lignes de données ne sont pas 1200 lignes de logique : elles se lisent
d'un coup d'œil, elles ne se débuggent jamais, et les 173 cas tournent en une
seconde.
