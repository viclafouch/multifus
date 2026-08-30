# Plan

Ce qui reste à faire, une ligne par chose. Une ligne faite se supprime, elle ne
se coche pas.

## Publier la première version

- [ ] Dessiner le logo de Multifus, et remplacer celui du scaffolder Tauri dans `src-tauri/icons`
- [ ] Créer un certificat **Developer ID Application** sur developer.apple.com, et l'exporter en `.p12`
- [ ] Poser les huit secrets du workflow `release` dans les réglages du dépôt : `APPLE_CERTIFICATE` (le `.p12` en base64), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` (un mot de passe d'application), `APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (vide)
- [ ] Trancher les Mac Intel : le workflow ne compile que `aarch64-apple-darwin`, et le README annonce Apple Silicon. Ajouter la cible `x86_64-apple-darwin`, ou s'en tenir là
- [ ] Trancher le certificat Authenticode de Windows, une fois la version macOS publiée
- [ ] Revoir le dessin du logo, une fois la première version publiée sur les deux systèmes

La paire de clés de l'updater existe déjà, dans `~/.tauri/multifus.key` et son
`.pub`, et sa moitié publique est le champ `plugins.updater.pubkey` de
`tauri.conf.json`. En régénérer une rendrait insignables les mises à jour des
versions déjà installées.

Le code Windows ne se compile pas ici : `cargo check --target
x86_64-pc-windows-msvc` échoue, `ring` demandant un compilateur C pour Windows.
La CI le compile sur `windows-latest`, et la publication en dépend.

## Passer le dépôt en monorepo

Le site web présentera Multifus et donnera les deux téléchargements, celui du Mac
et celui de Windows. Il vivra dans ce dépôt, à côté du logiciel. Le site lui-même
aura son plan, dans `docs/plan-site.md` : ici, on prépare seulement la place où
il se posera.

- [ ] Choisir l'outil de monorepo, et la raison : les espaces de travail npm suffisent peut-être, un orchestrateur de tâches se justifie s'il fait gagner du temps sur la CI
- [ ] Descendre le logiciel dans son propre paquet, `src`, `src-tauri`, `index.html`, `banner.html`, `wheel.html`, `rune-table.html`, `public` et `scripts` compris
- [ ] Suivre le déménagement partout où un chemin est écrit : `vite.config.ts`, `tsconfig.json`, `components.json`, `oxlint.config.ts`, `oxfmt.config.ts`, `.versionrc.json`, `.husky` et les trois workflows
- [ ] Trancher la version : `commit-and-tag-version` numérote le logiciel, et le site n'a pas de version. Le `package.json` de la racine ne doit plus porter celle du logiciel
- [ ] Ouvrir le paquet du site, vide, et écrire `docs/plan-site.md`

## Dire ce que la mise à jour apporte

Une mise à jour arrive toute seule et ne dit rien de ce qu'elle change. Le site
portera le journal des versions, `commit-and-tag-version` l'écrivant déjà à
chaque publication depuis les messages de commit.

- [ ] Publier le journal des versions sur le site, à une adresse qui ne bougera plus
- [ ] Poser dans À propos un lien vers ce journal, à côté de « Aller voir » et « Aller le dire », qui ouvre le navigateur par défaut
- [ ] Décider si le panneau de mise à jour renvoie au journal quand une version est prête
