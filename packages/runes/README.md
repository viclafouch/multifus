# @multifus/runes

Le poids des runes de Dofus Retro : vingt stats, cinq familles, et les quatre
chiffres de chacune. Le logiciel les pose sur la fenêtre du jeu, le site les
publie en entier sur `/poids-des-runes`, et les deux lisent la même table.

| Ce qu'il tient      | Ce que c'est                                                       |
| ------------------- | ------------------------------------------------------------------ |
| `RUNE_FAMILY_IDS`   | Les cinq familles, dans l'ordre où le tableau les montre           |
| `RUNE_FAMILY_STATS` | Les stats de chaque famille, dans l'ordre où le tableau les montre |
| `RUNE_WEIGHTS`      | La simple, la Pa, la Ra et le point, par stat                      |
| `RUNE_STAT_IDS`     | Les vingt stats à plat, déduites des deux tables au-dessus         |
| `formatWeight`      | Un poids écrit, au centième et à la virgule de la langue donnée    |

**Il ne tient aucun mot.** « Sagesse », « Les lourdes », « Simple » sont du texte
d'écran, et le texte ne se partage pas entre le logiciel et le site : chacun
garde son catalogue. Chaque application nomme les mêmes identifiants dans le
sien, et `satisfies Record<RuneStatId, …>` refuse celle qui en oublie un.

Il ne tient pas non plus de mise en page : la largeur à laquelle le logiciel
dessine son tableau vit chez lui, avec la constante Rust qui la borne.

Les invariants du jeu sont tenus ici, à côté des chiffres : la Pa pèse trois fois
la simple, la Ra dix fois, et la vitalité et les pods sont les deux endroits où
le jeu arrondit vers le haut.
