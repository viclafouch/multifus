# Plan

- [ ] Créer un certificat Developer ID Application sur developer.apple.com, et l'exporter en `.p12`
- [ ] Poser les huit secrets Apple et Tauri du workflow `release` dans les réglages du dépôt
- [ ] Trancher les Mac Intel : ajouter la cible `x86_64-apple-darwin`, ou s'en tenir au README et à `/mac`
- [ ] Trancher le certificat Authenticode de Windows, une fois la version macOS publiée
- [ ] Vérifier l'attestation de provenance à la première publication, et que `gh attestation verify` répond
- [ ] Vérifier `projectPath: apps/desktop` sur les deux `tauri-action` à la première publication
- [ ] Descendre le LCP mobile sous 2,5 s, mesuré à 4,2 s : la boucle d'accueil tire 780 Ko avant lui, et les posters happés par la marge du chargement différé 530 Ko
- [ ] Ouvrir le site dans Firefox, qui ne connaît pas `animation-timeline` : les replis n'ont jamais tourné

La paire de clés de l'updater existe déjà, dans `~/.tauri/multifus.key` et son
`.pub`, et sa moitié publique est le champ `plugins.updater.pubkey` de
`tauri.conf.json`. En régénérer une rendrait insignables les mises à jour des
versions déjà installées.
