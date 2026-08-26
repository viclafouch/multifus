# Plein écran

Deux clients Dofus Retro mis en vrai plein écran sur un Mac, Déplacement rapide
allumé : les clics passent, la bascule marche, et chaque changement de
personnage fait glisser tout l'écran d'un bureau à l'autre. On a la nausée en
quelques maps. La bannière, elle, ne se montre jamais : macOS ne laisse pas une
fenêtre flottante se poser sur un bureau de plein écran.

Multifus ne peut rien contre ça. On dit au joueur comment jouer.

## Ce qu'on trouve

- Ce que Multifus fait aux fenêtres n'a jamais été le plein écran : `maximize`
  pose la fenêtre sur la zone de travail de son écran, Dock et barre des menus
  en place sur macOS, barre des tâches en place sur Windows
- L'écran des paramètres promettait pourtant « en plein écran », deux fois
- Le vrai plein écran de macOS s'ouvre au bouton vert d'une fenêtre, et il donne
  au client un bureau à lui : c'est ce bureau qui glisse à chaque bascule
- `⌥` + clic sur ce même bouton vert agrandit sans quitter le bureau. C'est la
  sortie qu'on donne au joueur

## Ce qu'on change

- Le mot **plein écran** ne désigne plus que le vrai, celui du bouton vert.
  Ce que Multifus fait s'appelle **agrandir**, partout : `CONTEXT.md`, l'écran
  des paramètres, le README
- Une note dit de rester en fenêtre agrandie, sur l'écran des paramètres sous
  l'interrupteur qui agrandit, et sur l'écran du Déplacement rapide où la
  nausée arrive. Une seule phrase, tirée d'une seule constante
- La note ne se montre que sur un Mac
- L'écran des paramètres passe d'un panneau à deux, coupés à l'endroit où la
  note se pose : ce que Multifus fait aux fenêtres à l'ouverture d'un côté, la
  barre des tâches et l'arrière-plan de l'autre

## Décidé

- La note n'a pas de composant à elle : elle est la `Note` du dossier `layout`
  autour d'une phrase de `constants/strings`, et un composant qui ne ferait que
  les mettre ensemble n'ajouterait qu'un nom. Les deux écrans posent la même
  ligne, et le Mac est demandé chez eux : un enfant qui ne rend rien est
  interdit ici
- Rien sur Windows pour l'instant. Le client s'y met en plein écran aussi, mais
  personne ne le fait d'un clic, et je n'ai pas vérifié ce que devient la
  bascule ni où passe la bannière. Une ligne est posée dans `docs/plan.md` pour
  le regarder sur la machine Windows, et la note viendra si le besoin est là
- La description de l'interrupteur dit ce qui reste à l'écran, Dock sur macOS et
  barre des tâches sur Windows : c'est ce qui distingue l'agrandissement du
  plein écran en un coup d'œil. Elle dit **zone de travail** et non « tout
  l'écran », qui promettait de nouveau le plein écran
- La phrase se range sous `maximize`, le mot de ce qu'elle conseille, et non
  sous le nom du piège dont elle détourne
- Le README ne peut pas importer la constante : il en reprend le texte mot pour
  mot, pour que les deux ne partent pas chacun de leur côté
- `full_screen` dans un test de `banner.rs` nommait l'écran entier, taskbar
  comprise, là où le mot vient d'être réservé au vrai plein écran : il devient
  `whole_screen`

## À vérifier sur l'autre machine

- [ ] Deux clients en fenêtre agrandie, Déplacement rapide allumé : la bascule
      ne fait plus glisser l'écran, et la bannière se pose bien au-dessus
- [ ] `⌥` + clic sur le bouton vert d'un client agrandit sans plein écran
- [ ] La note est là sur les paramètres et sur le Déplacement rapide
