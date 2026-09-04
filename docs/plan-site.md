# Le site de Multifus

La place est prise, `apps/website`, et elle est vide. Le paquet n'a qu'un nom,
`@multifus/website`, aucune dépendance et aucun script : rien n'est tranché du
framework, de l'hébergement ni du dessin.

## Ce que le site doit faire

Présenter Multifus à quelqu'un qui ne le connaît pas, en disant ce qu'il fait
pour un joueur de Dofus Retro qui mène plusieurs personnages à la fois.

Donner les deux téléchargements, celui du Mac et celui de Windows, tirés de la
dernière version publiée sur GitHub.

Porter la commande qui vérifie l'attestation de provenance, à côté des deux
téléchargements. Elle dit que le fichier téléchargé a bien été construit par
notre workflow, depuis ce code source public, et n'importe qui la lance sans
nous faire confiance. Le README la porte déjà :

```
gh attestation verify <fichier> --repo viclafouch/multifus
```

Porter le journal des versions, à une adresse qui ne bougera plus.
`commit-and-tag-version` l'écrit dans `apps/desktop/CHANGELOG.md` à chaque
publication, depuis les messages de commit. L'écran À propos y renverra, à côté
de « Aller voir » et « Aller le dire », et le panneau de mise à jour peut-être
aussi.

## Ce qui reste à trancher

- [ ] Le framework, et pourquoi. Rien n'est tranché, et le site est presque
      tout statique.
- [ ] L'hébergement, et le nom de domaine.
- [ ] Ce que le site montre en marche : les vrais composants du logiciel, ou des
      images. La réponse ouvre `packages/` ou la laisse fermée.
- [ ] Comment le site lit `apps/desktop/CHANGELOG.md`, et comment il lit la
      dernière version publiée sur GitHub.

## Ce qui est déjà prêt pour lui

La roue et le tableau des runes sont presque purs. `wheel-dial.tsx`,
`wheel-head.tsx`, `rune-line.tsx`, `rune-sheet.tsx`, `helpers/wheel.ts`,
`helpers/rune.ts`, `constants/wheel.ts` et `constants/runes.ts` ne connaissent ni
Tauri ni les hooks du logiciel. Tout Tauri tient dans deux fichiers de
production, `src/lib/multifus.ts` et `src/hooks/use-copy.ts`.

Le thème est dans `apps/desktop/src/theme.css`, un seul jeu de tokens en oklch,
sans bloc sombre séparé : les pages portent `class="dark"` en dur. Tailwind v4
sans fichier de configuration, tout est en CSS.
