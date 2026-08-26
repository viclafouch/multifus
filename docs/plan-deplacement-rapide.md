# Déplacement rapide

L'écran parlait comme une notice : deux notes en bas, un paragraphe sur la
bannière, et le mot « Déplacement » nu partout sans jamais dire ce qu'il fait.
On le refait pour un joueur.

## Ce qu'on change

- Le mécanisme s'appelle **Déplacement rapide**, partout : la page, la barre de
  gauche, le menu de la barre système, le raccourci, le journal, la bannière
- Le sous-titre dit le geste, pas le mécanisme : un clic déplace, la fenêtre du
  suivant arrive, la team change de map
- L'interrupteur devient un panneau d'état : une pastille ALLUMÉ / ÉTEINT, et une
  ligne qui dit ce que valent les clics. Il emprunte la pastille des messages
  privés, pas leur titre : le nom de l'écran est déjà au-dessus
- La bannière garde une phrase : quand elle s'affiche, et ce qu'elle dit
- Le choix du coin devient un écran dessiné, 448 px de large au lieu de 208, à la
  forme du moniteur choisi, avec la bannière posée dedans à l'échelle qu'elle
  aura vraiment sur cet écran
- Les deux notes du bas partent
- La barre de gauche passe de 196 à 212 px : « Déplacement rapide » y tenait au
  pixel près, et un nom qui déborde sort de la barre

## Décidé

- « Déplacement » restait notre mot ; « déplacement rapide » se comprend sans
  glossaire, et ne se confond plus avec le déplacement d'une ligne du roster
- La note sur le démarrage éteint et celle sur les clics regardés disent au
  joueur ce qu'il n'a pas demandé : elles partent, le comportement ne change pas
- Le rappel « la bannière se pose deux secondes et demie » disparaît du texte :
  on clique un coin, la bannière apparaît, la phrase ne sert plus
- `BANNER_SIZE` dans `src/constants/banner.ts` redit les 250 × 64 de `WIDTH` et
  `HEIGHT` dans `src-tauri/src/app/banner.rs`. Rien ne les tient ensemble : la
  taille ne passe pas le pont, et un appel pour la lire coûterait plus qu'un
  dessin qui vieillit mal. Changer l'une, changer l'autre
- Le panneau d'état n'a pas de titre visible, contrairement à celui des messages
  privés : le mettre reviendrait à répéter le titre de l'écran, à vingt pixels
  de lui. La pastille tient lieu de titre, et l'interrupteur garde son nom pour
  les lecteurs d'écran

## À vérifier sur l'autre machine

- [ ] Le menu de la barre système dit « Déplacement rapide »
- [ ] Cliquer un coin pose la vraie bannière dans ce coin, deux secondes et demie
- [ ] Sur deux écrans, la pastille de l'écran change la forme de l'écran dessiné,
      et la bannière dessinée rétrécit sur le plus grand des deux
- [ ] La bannière porte « Déplacement rapide » tant qu'on n'est arrivé sur personne
