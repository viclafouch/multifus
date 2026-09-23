# Plan

- [ ] Trancher le certificat Authenticode de Windows, une fois la version macOS publiée
- [ ] Vérifier l'attestation de provenance à la première publication, et que `gh attestation verify` répond
- [ ] Vérifier `projectPath: apps/desktop` sur les deux `tauri-action` à la première publication
- [ ] Descendre le LCP mobile sous 2,5 s, mesuré à 4,2 s : la boucle d'accueil tire 780 Ko avant lui, et les posters happés par la marge du chargement différé 530 Ko
- [ ] Ouvrir le site dans Firefox, qui ne connaît pas `animation-timeline` : les replis n'ont jamais tourné

La paire de clés de l'updater existe déjà, dans `~/.tauri/multifus.key` et son
`.pub`, et sa moitié publique est le champ `plugins.updater.pubkey` de
`tauri.conf.json`. En régénérer une rendrait insignables les mises à jour des
versions déjà installées. Son mot de passe est vide, et le secret
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD` reste absent : un secret absent vaut la
chaîne vide que la clé attend.

Le certificat Developer ID Application expire le 17 septembre 2031. Sa clé
privée, le `.p12` et son mot de passe sont dans `~/.apple-developer-id/`.
