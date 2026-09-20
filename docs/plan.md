# Plan

- [ ] Créer un certificat Developer ID Application sur developer.apple.com, et l'exporter en `.p12`
- [ ] Poser les huit secrets Apple et Tauri du workflow `release` dans les réglages du dépôt
- [ ] Trancher les Mac Intel : ajouter la cible `x86_64-apple-darwin`, ou s'en tenir au README et à `/mac`
- [ ] Trancher le certificat Authenticode de Windows, une fois la version macOS publiée
- [ ] Vérifier l'attestation de provenance à la première publication, et que `gh attestation verify` répond
- [ ] Vérifier `projectPath: apps/desktop` sur les deux `tauri-action` à la première publication
- [ ] Enregistrer les cinq écrans manquants de la mise en route, `PAGE_SHOTS` n'en portant qu'un
- [ ] Écrire à `contact@ankama.com` le jour où le domaine est acheté
- [ ] Brancher `/journal` sur `apps/desktop/CHANGELOG.md`, que la première release écrira
- [ ] Ouvrir `/journal` depuis À propos, et trancher si le panneau de mise à jour y renvoie
- [ ] Porter `softwareVersion` et `releaseNotes` dans le `SoftwareApplication`, une fois `/journal` branché
- [ ] Retirer `scripts/tidy-build.mjs` le jour où cet espace de noms est corrigé en amont
- [ ] Descendre le LCP mobile sous 2,5 s, mesuré à 4,2 s : la boucle d'accueil tire 780 Ko avant lui, et les posters happés par la marge du chargement différé 530 Ko
- [ ] Passer les pages au Rich Results Test, à `validator.schema.org` et à un valideur de sitemap, une fois en ligne
- [ ] Ouvrir le site dans Firefox, qui ne connaît pas `animation-timeline` : les replis n'ont jamais tourné
- [ ] Repasser le site en ligne sur l'adresse réelle et sur un téléphone : icônes, `robots.txt`, 404

La paire de clés de l'updater existe déjà, dans `~/.tauri/multifus.key` et son
`.pub`, et sa moitié publique est le champ `plugins.updater.pubkey` de
`tauri.conf.json`. En régénérer une rendrait insignables les mises à jour des
versions déjà installées.
