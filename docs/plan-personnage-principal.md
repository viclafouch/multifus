# Le personnage principal

Livré. Reste à l'essayer sur la vraie machine.

## Ce qui a changé en route

Six choses s'écartent du plan d'origine.

`Roster::set_main(nickname, false)` ne touche que le pseudo nommé, et rend
`true` seulement quand l'étoile a bougé pour de bon. Le plan éteignait tout le
monde à chaque appel et rendait toujours `true` sur un pseudo connu : le journal
écrivait alors « n'est plus votre personnage principal » pour quelqu'un qui ne
l'a jamais été.

L'étoile allumée porte un halo, l'utilitaire `star-lit` de `index.css`, et la
couleur se fait en 0,2 s. Le plan disait seulement `fill-current text-primary`.
Le halo reprend `sigil-lit` de l'Inversion : dans cette maison, allumé veut dire
éclairé.

`actions-panel.tsx` reçoit `mainHint: string | null`, pas tout le roster.
`index.tsx` appelle `mainShortcutHint` et transmet la phrase : le panneau ne
calcule plus rien et ne connaît plus le type `Character`.

Le sous-titre de l'écran Personnages ne nomme plus la combinaison : « L'étoile
marque le personnage qu'un raccourci ramène devant. » Les touches sont écrites
sur un seul écran, celui des Raccourcis, et elles bougent.

Les lignes du journal pour l'étoile posée et reprise sont écrites dans
`helpers/journal.ts`, avec leurs voisines, pas dans `constants/strings`. Le
fichier de chaînes tient ce que l'utilisateur lit dans les écrans.

**Principal** entre dans `CONTEXT.md` après **Inversion**, pas après
**Réintégrer** : Exclu, Réintégrer et Inversion se lisent d'affilée.

## Le point à trancher à l'essai

`Control+Shift+Home` s'écrit « Ctrl+Maj+Origine ». Un clavier de MacBook n'a pas
de touche Origine : il faut `Fn` et la flèche gauche, ce qui fait quatre touches.
Sur un clavier complet, macOS comme Windows, la frappe est directe. Si la
combinaison gêne, `DEFAULT_MAIN` dans `src-tauri/src/config/settings.rs` est la
seule ligne à changer.

## À vérifier sur la vraie machine

- [ ] Poser l'étoile sur un connecté, frapper le raccourci depuis une autre
      fenêtre du jeu : il passe devant, et le journal le dit
- [ ] Poser l'étoile sur un deuxième : la première s'éteint toute seule
- [ ] Recliquer l'étoile allumée : plus personne ne l'a, et le raccourci ne fait
      rien en le disant
- [ ] Étoile posée sur un déconnecté : l'écran Raccourcis le dit à l'avance, et
      la frappe ne bouge rien. Le journal écrit alors « la fenêtre de Bravo a
      disparu », la phrase de Fenêtre suivante. Sur un personnage jamais
      connecté depuis le lancement, elle parle d'une fenêtre qui n'a jamais
      existé : à juger sur pièce, une sortie à part se rajoute si elle gêne
- [ ] Étoile posée sur un exclu, ligne barrée en rouge : l'étoile garde sa
      couleur, et le raccourci le ramène quand même devant
- [ ] Quitter Multifus et le relancer : l'étoile est toujours à sa place
- [ ] Frapper le raccourci en étant déjà sur le principal : rien, et le journal
      le dit
- [ ] Frapper le raccourci hors du jeu : rien, comme Fenêtre suivante
- [ ] Retirer le personnage du roster : l'étoile part avec lui
- [ ] « Remettre les touches d'origine » redonne Ctrl+Maj+Origine
- [ ] Le tirage par la poignée marche toujours sur une ligne qui porte l'étoile
- [ ] L'étoile allumée se voit bien sur une ligne barrée en rouge, et la
      creuse se voit sans survoler la ligne
