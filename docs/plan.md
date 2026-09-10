# Plan

Ce qui reste à faire, une ligne par chose. Une ligne faite se supprime, elle ne
se coche pas. C'est la seule liste : un sujet en cours ouvre son
`plan-<sujet>.md`, qui s'efface une fois livré et rend ici ce qu'il n'a pas fini.

## Publier la première version

- [ ] Dessiner le logo de Multifus. [logo.md](./logo.md) porte le prompt et le test qui tranche, la silhouette noire à 16 pixels. Il remplace `apps/desktop/src/assets/logo.png`, celui du scaffolder Tauri, et `apps/desktop/src-tauri/icons`
- [ ] Créer un certificat **Developer ID Application** sur developer.apple.com, et l'exporter en `.p12`
- [ ] Poser les huit secrets du workflow `release` dans les réglages du dépôt : `APPLE_CERTIFICATE` (le `.p12` en base64), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` (un mot de passe d'application), `APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (vide)
- [ ] Trancher les Mac Intel : le workflow ne compile que `aarch64-apple-darwin`, et le README annonce Apple Silicon. Ajouter la cible `x86_64-apple-darwin`, ou s'en tenir là
- [ ] Trancher le certificat Authenticode de Windows, une fois la version macOS publiée
- [ ] Trancher qui relance Multifus après une mise à jour sur Windows. `tauri-plugin-updater` ouvre `restart_after_install`, vrai par défaut : l'installateur relance lui-même, et le `app.restart()` de `apps/desktop/src-tauri/src/app/update.rs` ne sert plus qu'au Mac. À vérifier sur la machine Windows, une fenêtre ouverte deux fois se voyant
- [ ] Vérifier l'attestation de provenance à la première publication : les chemins des paquets donnés à `actions/attest-build-provenance`, et que `gh attestation verify <fichier> --repo viclafouch/multifus` répond
- [ ] Vérifier `projectPath: apps/desktop` sur les deux `tauri-action` à la première publication : `ci.yml` ne les lance pas, seul un tag `v*` le fait

La paire de clés de l'updater existe déjà, dans `~/.tauri/multifus.key` et son
`.pub`, et sa moitié publique est le champ `plugins.updater.pubkey` de
`tauri.conf.json`. En régénérer une rendrait insignables les mises à jour des
versions déjà installées.

## Ouvrir le site

La place est prise, `apps/website`, et elle est vide : le paquet n'a qu'un nom,
aucune dépendance et aucun script. Le site présente Multifus, donne les deux
téléchargements tirés de la dernière version publiée sur GitHub, porte la
commande d'attestation que le README porte déjà, et publie le journal des
versions que `commit-and-tag-version` écrit dans `apps/desktop/CHANGELOG.md`.

- [ ] Trancher le framework. Le site est presque tout statique
- [ ] Trancher l'hébergement et le nom de domaine
- [ ] Trancher ce que le site montre en marche, les vrais composants du logiciel ou des images. La réponse ouvre `packages/` et Turborepo, ou les laisse fermés. La roue et le tableau des runes sont déjà purs, tout Tauri tenant dans `lib/multifus.ts` et `hooks/use-copy.ts`
- [ ] Publier le journal des versions à une adresse qui ne bougera plus, puis poser dans À propos un lien qui ouvre le navigateur, à côté de « Aller voir » et « Aller le dire »
- [ ] Décider si le panneau de mise à jour renvoie au journal quand une version est prête
