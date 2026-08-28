# Une touche de fonction seule, sur Windows

Le champ d'un raccourci refusait toute touche frappée sans `Ctrl`, `Alt` ou
`Maj` : « Ajoutez Ctrl, Alt ou Maj. Seule, cette touche serait prise dans tous
vos logiciels. » La phrase dit vrai d'une lettre, qui partirait de chaque mot
écrit ailleurs. Elle ne dit rien d'une touche de fonction, qui n'écrit rien
nulle part.

Sur Windows, `F1` à `F24` se posent donc seules. Partout ailleurs, la règle ne
bouge pas : une lettre, un chiffre, une flèche demandent toujours un
modificateur.

## Ce que l'écran dit

Le champ ouvert prend `F5` du premier coup, et la ligne porte une seule touche
là où elle en portait trois. Le refus, lui, nomme désormais la porte de sortie :
« Ajoutez Ctrl, Alt ou Maj, ou prenez une touche de fonction : F1, F2, F5…
Seule, cette touche serait prise dans tous vos logiciels. »

Sous les cinq actions, une seconde note ne se montre que sur Windows : une
touche de fonction prise ici ne redescend plus dans le jeu, et celles que les
options de Dofus Retro ont déjà servies sont donc à éviter.

## Ce qui n'a pas bougé

Le Mac. `F1` à `F12` y sont des touches de réglage, prises par le système avant
tout le monde, et il faut tenir `fn` pour les frapper : le refus y garde sa
phrase d'origine, et son écran sa seule note.

Rust ne change pas. `global-hotkey` lit `F5` comme un accélérateur entier, et
`RegisterHotKey` accepte un raccourci sans modificateur, `MOD_NOREPEAT` seul.
Une touche que le système garde pour lui revient comme avant, en
« Refusé : un autre logiciel utilise déjà ces touches. »

## À vérifier sur la machine Windows

- [ ] `F5` posée sur Fenêtre suivante : la ligne porte une seule touche, et la frappe bascule depuis le jeu
- [ ] La même touche posée deux fois : la seconde ligne est refusée par le nom de la première
- [ ] `F1` posée sur une réponse rapide : elle colle son texte
- [ ] Une lettre seule est toujours refusée, et la phrase nomme les touches de fonction
- [ ] Une touche de fonction qu'un autre logiciel tient déjà : la ligne dit « Refusé »
- [ ] Dofus Retro ne reçoit plus la touche prise ici
