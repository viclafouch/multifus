# @multifus/ankama

Les images, les vidéos et les icônes qui viennent d'Ankama Games, rassemblées ici
et nulle part ailleurs dans le dépôt.

Elles **ne sont pas couvertes par la licence MIT** du dépôt. La
[licence](../../LICENSE) exclut ce dossier, et un `git rm -r packages/ankama` les
retire toutes d'un coup. Aucun droit sur elles n'est concédé, et Multifus n'a
aucun lien avec Ankama.

| Dossier      | Ce qu'il tient                                                      |
| ------------ | ------------------------------------------------------------------- |
| `images/`    | Les décors des maps, les deux messages d'Ankama, la fenêtre Options |
| `loops/`     | Les boucles muettes capturées dans le jeu                           |
| `portraits/` | Les douze classes, deux sexes, pour l'écran                         |
| `icons/`     | Les mêmes en `.ico`, que Rust pose sur la fenêtre du jeu            |

Les trois premiers dossiers s'importent, `@multifus/ankama/images/camp.webp`.
`icons/` n'a pas d'`exports` : il se lit par chemin, depuis `include_bytes!`.
