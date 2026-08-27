# Le personnage principal

Livré. Reste à l'essayer sur la vraie machine.

## Ce qui a changé en route

Huit choses s'écartent du plan d'origine.

Les écrans ne disent plus « étoile », nulle part. Le mot ne dit rien à un
joueur : on désigne un personnage principal, ou on ne l'est plus. Le bouton
garde sa petite étoile, mais elle ne se nomme pas. Le composant est
`main-toggle.tsx`, l'utilitaire de halo `main-lit`.

L'écran Raccourcis ne prévient plus à l'avance que le principal est déconnecté.
La phrase nommait un pseudo au milieu d'une description, et passait la ligne à
deux lignes. `mainShortcutHint` et `mainHint` sont supprimés, l'écran ne reçoit
plus le roster. Le journal dit toujours ce qui s'est passé à la frappe. Une
description tient sur une ligne, et ne parle de personne en particulier.

`Home` s'écrit « Home », et `End` « End ». « Origine » et « Fin » ne se lisent
sur aucun clavier de joueur.

`Roster::set_main(nickname, false)` ne touche que le pseudo nommé, et rend
`true` seulement quand le principal a bougé pour de bon. Le plan éteignait tout
le monde à chaque appel et rendait toujours `true` sur un pseudo connu : le
journal écrivait alors « n'est plus votre personnage principal » pour quelqu'un
qui ne l'a jamais été.

Le bouton allumé porte un halo, l'utilitaire `main-lit` de `index.css`, et la
couleur se fait en 0,2 s. Le plan disait seulement `fill-current text-primary`.
Le halo reprend `sigil-lit` de l'Inversion : dans cette maison, allumé veut dire
éclairé.

`actions-panel.tsx` reçoit `mainHint: string | null`, pas tout le roster.
`index.tsx` appelle `mainShortcutHint` et transmet la phrase : le panneau ne
calcule plus rien et ne connaît plus le type `Character`.

Le sous-titre de l'écran Personnages ne nomme plus la combinaison : « Un
raccourci vous ramène direct sur votre personnage principal. » Les touches sont
écrites sur un seul écran, celui des Raccourcis, et elles bougent.

Les lignes du journal pour le principal désigné et repris sont écrites dans
`helpers/journal.ts`, avec leurs voisines, pas dans `constants/strings`. Le
fichier de chaînes tient ce que l'utilisateur lit dans les écrans.

**Principal** entre dans `CONTEXT.md` après **Inversion**, pas après
**Réintégrer** : Exclu, Réintégrer et Inversion se lisent d'affilée.

## Le raccourci

`Control+Shift+Space`, « Ctrl+Maj+Espace ». `Control+Shift+Home` a tenu deux
jours : « Origine » ne dit rien à un joueur, et un MacBook n'a pas cette touche.
Espace est sur tous les claviers, sous le pouce, et Windows ne se la réserve
nulle part. Si la combinaison gêne, `DEFAULT_MAIN` dans
`src-tauri/src/config/settings.rs` est la seule ligne à changer.

## À vérifier sur la vraie machine

- [ ] Désigner un connecté, frapper le raccourci depuis une autre fenêtre du
      jeu : il passe devant, et le journal le dit
- [ ] En désigner un deuxième : le premier s'éteint tout seul
- [ ] Recliquer le bouton allumé : plus personne n'est principal, et le
      raccourci ne fait rien en le disant
- [ ] Un déconnecté comme principal : la frappe ne bouge rien. Le journal écrit
      alors « la fenêtre de Bravo a disparu », la phrase de Fenêtre suivante.
      Sur un personnage jamais connecté depuis le lancement, elle parle d'une
      fenêtre qui n'a jamais existé : à juger sur pièce, une sortie à part se
      rajoute si elle gêne
- [ ] Un exclu comme principal, ligne barrée en rouge : le bouton garde sa
      couleur, et le raccourci le ramène quand même devant
- [ ] Quitter Multifus et le relancer : le principal est toujours le même
- [ ] Frapper le raccourci en étant déjà sur le principal : rien, et le journal
      le dit
- [ ] Frapper le raccourci hors du jeu : rien, comme Fenêtre suivante
- [ ] Ctrl+Maj+Espace en combat, la barre de sorts ouverte : le jeu ne reçoit
      pas l'espace, et rien ne se lance
- [ ] Retirer le personnage du roster : le principal part avec lui
- [ ] « Remettre les touches d'origine » redonne Ctrl+Maj+Espace
- [ ] Le tirage par la poignée marche toujours sur la ligne du principal
- [ ] Le bouton allumé se voit bien sur une ligne barrée en rouge, et l'éteint
      se voit sans survoler la ligne
- [ ] Les bulles disent « En faire votre personnage principal » et « Ne plus en
      faire votre personnage principal », et le mot étoile n'est nulle part
