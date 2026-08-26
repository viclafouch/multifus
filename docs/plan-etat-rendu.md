# Rendre les fenêtres du jeu comme on les a trouvées

Multifus quitté, il ne doit rien rester de lui à l'écran. Ni tête de classe dans
la barre des tâches, ni titre raccourci, ni bouton mis à part. Et « quitté » veut
dire aussi tué : `Ctrl+C` sur le serveur de dev, un plantage, la machine qui
s'éteint.

## Le bug qui a ouvert le sujet

Une tête de classe posée, Multifus fermé, rouvert, la classe remise à vide : la
barre des tâches garde la tête de classe. Deux causes, mesurées sur la machine.

Le client Retro ne pose aucune icône sur sa fenêtre — ses trois emplacements
`WM_GETICON` sont vides, son image vient de la classe de fenêtre. Rendre l'icône
en envoyant `WM_SETICON` à `NULL` vide donc un emplacement déjà vide : la barre
des tâches n'a aucune raison de redessiner, et garde la dernière image reçue.

Et la mémoire de ce qui est posé ne vit qu'en RAM : `painted_windows`. Multifus
tué, elle part avec lui, et plus personne ne sait qu'il faut rendre quoi que ce
soit.

## Ce que Multifus pose hors de lui

| Ce qu'on pose | Par quoi | Ce qui reste si Multifus meurt |
| --- | --- | --- |
| La tête de classe | `WM_SETICON` sur la fenêtre du jeu | l'image, jusqu'à la fermeture du client |
| Le titre court | `WM_SETTEXT` | le titre raccourci |
| Le bouton à part | `PKEY_AppUserModel_ID` sur la fenêtre | le bouton séparé |
| La fenêtre agrandie | `ShowWindow` | agrandie, et c'est voulu : on ne la rend pas |

Le reste meurt avec le processus, et n'a rien à rendre : les raccourcis, la
bannière, l'écran tenu éveillé, la Porte du Déplacement, l'icône du menu.

## La trace

**Trace** (`Trace`) : ce que Multifus a posé sur une fenêtre du jeu et n'a pas
encore repris. Elle s'écrit dans les réglages au moment où on pose, elle
s'efface au moment où on rend. Multifus tué la retrouve au démarrage suivant, et
rend ce qui n'avait pas été rendu.

```json
"traces": {
  "portraits": ["Dj-blop-[ART]"],
  "ungrouped": [],
  "short_titles": true
}
```

Les pseudos, jamais des poignées de fenêtre ni des chemins : une poignée écrite
hier ne veut plus rien dire demain.

La trace n'élargit que la question « faut-il écrire ? », elle ne la rétrécit
jamais. Une fenêtre rouverte entre deux lancements ne porte plus rien, et doit
être repeinte : c'est la mémoire du tour en cours, `painted_windows`, qui décide
de ne rien réécrire, jamais la trace.

## Rendre l'icône

Rendre, c'est reposer l'icône de la classe de fenêtre — `GCLP_HICON` et
`GCLP_HICONSM`, lues sur la fenêtre au moment où on rend. Rien n'est retenu d'un
lancement à l'autre, rien n'est écrit en dur : le client se met à jour, on lit sa
nouvelle icône sans le savoir.

Cette poignée appartient au client. L'invariant qui interdit de la détruire :
`icons` ne retient que ce que Multifus a créé. Rendre y écrit `NO_ICON`, et
`destroy_icon` ne voit donc jamais une poignée du jeu.

Si un jour un client posait sa propre icône de fenêtre, on lui reposerait celle
de sa classe : la même image dans les faits. Le jour où ce ne serait plus vrai,
la couche d'après est l'icône tirée de son exécutable, `ExtractIconExW` sur le
chemin lu sur le processus de la fenêtre — vérifié, `Dofus Retro.exe` en porte
une.

## Ce qui est posé

`Traces` dans les réglages, écrite à chaque pose et à chaque rendue.
`looks_to_paint` parcourt les fenêtres vues et non plus le roster : un
personnage retiré du roster rend aussi ce qu'il portait. Rendre l'icône repose
celle de la classe de fenêtre. Le gestionnaire de fenêtres apprend au démarrage
si les titres sont courts, sans quoi il refusait de les rendre. La Trace est dans
`CONTEXT.md`.

## Ce qui reste imparfait

Une trace dont le client s'est fermé pendant que Multifus était éteint reste dans
`config.json` : la fenêtre n'existe plus, il n'y a rien à rendre, et le pseudo
s'efface au retour du client. On ne l'efface pas quand un personnage passe
déconnecté : Retro déconnecte tout seul au bout d'un quart d'heure, la fenêtre
reste à l'écran de connexion et garde sa tête de classe.

## Ce que les tests tiennent

Un test ouvre une fenêtre à lui, de sa propre classe et de sa propre icône, lui
pose un portrait, le lui reprend, et vérifie qu'elle porte à nouveau l'icône de
sa classe et pas rien. Il tombe sur l'ancien `WM_SETICON` à `NULL`, vérifié.

Windows dérive la petite icône d'une classe qui n'en donne qu'une grande : les
deux emplacements ne portent pas le même handle, et le test lit chaque
emplacement pour lui-même.

## À vérifier sur la machine Windows

- [ ] Une tête de classe posée, la classe remise à vide : l'icône de Dofus Retro
      revient dans la barre des tâches, tout de suite
- [ ] Une tête de classe posée, Multifus tué au `Ctrl+C`, relancé, la classe
      remise à vide : l'icône revient
- [ ] Une tête de classe posée, Multifus quitté par le menu : l'icône revient
      sans rien faire de plus
- [ ] Les boutons mis à part, Multifus tué, relancé, les boutons regroupés : les
      fenêtres retrouvent leur bouton commun
- [ ] Les titres courts, Multifus tué, relancé, les titres courts éteints : les
      titres reprennent leur suffixe
- [ ] Un client fermé et rouvert pendant que Multifus tourne : il retrouve sa
      tête de classe
- [ ] Une mule laissée se déconnecter toute seule, puis Multifus quitté : sa
      fenêtre à l'écran de connexion a repris l'icône de Dofus Retro
- [ ] `config.json` ne porte plus aucune trace des fenêtres encore ouvertes une
      fois tout rendu
