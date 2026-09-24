---
name: changelog
description: Writes the patch notes line of a change a player sees in Multifus. Use before a feat, fix or perf commit touching apps/desktop/, or when the commit-msg hook asks for patch notes.
---

One line per change in each `apps/desktop/CHANGELOG.<language>.md`, under
`## Unreleased` (create it above the newest version), in one of three sections,
in this order, each written only when it holds a line:

| fr                  | en             | es                 |
| ------------------- | -------------- | ------------------ |
| `### Nouveautés`    | `### New`      | `### Novedades`    |
| `### Améliorations` | `### Improved` | `### Mejoras`      |
| `### Corrections`   | `### Fixed`    | `### Correcciones` |

A line is one or two short sentences in plain words, naming each thing it talks
about: the button, the window of Dofus, the rune table. A fix says what went
wrong, then what happens now:

- `Corrige la position de départ du tableau des runes, en haut à droite. Il s’ouvre désormais au milieu de la fenêtre de Dofus.`
- `Le tableau des runes ne s’affichait que si la fenêtre de Dofus était au premier plan. Il reste maintenant visible.`
- `Fermer Dofus ferme aussi son tableau des runes.`

Read the section aloud once the line is in: neighbouring lines open on different
words, so the list reads like a person wrote it.

The readers are players aged 10 to 30: take the words a gamer uses (FPS,
fluide, lag). The game is Dofus, in every line and every language.
French first. English and Spanish take the words of `apps/desktop/src/locales/`.
A change on something `## Unreleased` already says rewrites that line.
A change no player sees gets no line: its commit message ends with
`Changelog: none`.

Done means Victor approved the lines. Show him the French ones, ask whether they
are validated, and wait for his yes before the commit. A correction from him
rewrites the three languages, then asks again.
