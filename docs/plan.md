# Plan

Ce qui reste à faire, une ligne par chose. Une ligne faite se supprime, elle ne
se coche pas.

## Publier la première version

- [ ] Dessiner le logo de Multifus, et remplacer celui du scaffolder Tauri dans `apps/desktop/src-tauri/icons`
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

Une caisse jetable hors du dépôt, qui ne dépend que de `windows` et porte le
code à vérifier avec des bouchons pour le reste, se type-checke pour cette même
cible : `windows` est du Rust pur, sans C. Ça n'essaie rien, mais ça attrape les
signatures et les constantes fausses avant que la CI ne les voie.

## Rattraper les concurrents

Les manques retenus après la veille de [concurrents.md](./concurrents.md).

- [ ] L'interface en anglais et en espagnol, sur la langue du système. Dracoon, ROrganizer et Focus Retro le font déjà, et la communauté hispanophone n'a rien

## Passer le dépôt en monorepo

Le déménagement est fait, et la CI est verte sur les deux systèmes.

- [ ] Purger le cache Cargo au premier `cargo` après le déménagement, sur le Mac comme sur Windows : depuis `apps/desktop/src-tauri`, `rm -rf target/debug/build/tauri-* target/debug/build/multifus-*`. Les artefacts de `tauri-build` gardent les chemins absolus de l'ancien emplacement, et `cargo` réclame un fichier qui n'existe plus
- [ ] Vérifier `projectPath: apps/desktop` sur les deux `tauri-action` à la première publication : `ci.yml` ne les lance pas, seul un tag `v*` le fait
- [ ] Rouvrir Turborepo, et `packages/`, quand le site existera et qu'un paquet partagé reliera les deux applications

## Dire ce que la mise à jour apporte

Une mise à jour arrive toute seule et ne dit rien de ce qu'elle change. Le site
portera le journal des versions, `commit-and-tag-version` l'écrivant déjà à
chaque publication depuis les messages de commit.

- [ ] Publier le journal des versions sur le site, à une adresse qui ne bougera plus
- [ ] Poser dans À propos un lien vers ce journal, à côté de « Aller voir » et « Aller le dire », qui ouvre le navigateur par défaut
- [ ] Décider si le panneau de mise à jour renvoie au journal quand une version est prête
