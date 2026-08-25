# Plan

Ce qui reste à faire, une ligne par chose. Une ligne faite se supprime, elle ne
se coche pas.

## Publier la première version

- [ ] Remplacer le logo du scaffolder Tauri, dans `src-tauri/icons`
- [ ] Créer un certificat **Developer ID Application** sur developer.apple.com, et l'exporter en `.p12`
- [ ] Poser les huit secrets du workflow `release` dans les réglages du dépôt : `APPLE_CERTIFICATE` (le `.p12` en base64), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` (un mot de passe d'application), `APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (vide)
- [ ] Trancher le certificat Authenticode de Windows, une fois la version macOS publiée
- [ ] Confirmer `crate-type = ["rlib"]` par un `cargo build` sur le Mac

La paire de clés de l'updater existe déjà, dans `~/.tauri/multifus.key` et son
`.pub`, et sa moitié publique est le champ `plugins.updater.pubkey` de
`tauri.conf.json`. En régénérer une rendrait insignables les mises à jour des
versions déjà installées.

## Vérifier sur une vraie soirée

- [ ] Windows, deux clients ouverts : le roster les voit, les quatre raccourcis et l'AutoFocus répondent
- [ ] Une réponse rapide sans combinaison ne fait rien, et l'écran le dit
- [ ] Une combinaison déjà prise par le Défilement est refusée par son nom
- [ ] La même combinaison frappée hors du jeu ne fait rien
- [ ] Le texte copié avant un collage revient dans le presse-papiers après
- [ ] Le journal porte une ligne par collage
- [ ] Multifus lancé avec trois clients déjà ouverts n'agrandit rien
- [ ] Une fenêtre remise en petit à la main reste en petit
- [ ] Sur deux écrans, une fenêtre remplit celui où elle est
- [ ] Un client qui s'ouvre pendant qu'on joue ailleurs prend le premier plan sur Windows, et pas sur macOS
- [ ] Windows, six clients connectés : six pseudos dans la barre des tâches, et quitter Multifus rend les six titres
- [ ] Windows, un personnage changé sans quitter le client : le titre court suit
- [ ] Une mule laissée inactive un quart d'heure repasse déconnectée comme avant
