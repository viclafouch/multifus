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
- [ ] Vérifier l'attestation de provenance à la première publication : les chemins des paquets donnés à `actions/attest-build-provenance`, et que `gh attestation verify <fichier> --repo viclafouch/multifus` répond

La paire de clés de l'updater existe déjà, dans `~/.tauri/multifus.key` et son
`.pub`, et sa moitié publique est le champ `plugins.updater.pubkey` de
`tauri.conf.json`. En régénérer une rendrait insignables les mises à jour des
versions déjà installées.

Le code Windows se compile et ses tests passent sur la machine Windows, où
`cargo test` prend `platform/windows.rs` comme n'importe quel autre fichier.

Depuis le Mac, il ne se compile pas : `cargo check --target
x86_64-pc-windows-msvc` échoue, `ring` demandant un compilateur C pour Windows.
Une caisse jetable hors du dépôt, qui ne dépend que de `windows` et porte le code
à vérifier avec des bouchons pour le reste, se type-checke pour cette même cible :
`windows` est du Rust pur, sans C. Ça n'essaie rien, mais ça attrape les
signatures et les constantes fausses. La CI, elle, compile sur `windows-latest`,
et la publication en dépend.

## Lire le bon interrupteur des notifications de Dofus, sur Windows

L'AutoFocus s'est tu une soirée entière, et la Prise en main affichait l'étape au
vert. Multifus lit `Enabled` sous
`Notifications\Settings\com.dofus.d1elauncher`, une valeur qui n'existait pas.
L'interrupteur que les Paramètres montrent est ailleurs, dans `wpndatabase.db`,
sous `HandlerSettings` : `s:toast` valait zéro, et Dofus n'émettait plus rien
depuis une heure et demie. Vu le 04/09/2026.

- [ ] Lire `s:toast` du handler `com.dofus.d1elauncher` dans
      `%LOCALAPPDATA%\Microsoft\Windows\Notifications\wpndatabase.db`, ou trouver
      l'API qui le dit, et faire de ce contrôle celui de l'étape. `Enabled` du
      registre reste vrai quand il existe, mais son absence ne prouve rien
- [ ] Poser un avis quand Multifus écoute, l'AutoFocus allumé, et n'a rien
      entendu depuis longtemps : c'est le seul symptôme qu'a vu le joueur

## Essayer sur les vraies machines

Le code est écrit et les tests passent des deux côtés. Rien de ce qui suit ne se
prouve par un test : il faut la machine, et le jeu ouvert à côté.

- [ ] Multifus laissé une heure à côté d'un navigateur, sur Windows : le gestionnaire des tâches ne doit rien lui voir prendre au processeur. Le reste du réveil du tour est essayé et bon, filtre de `DESTROY` compris
- [ ] Un client Dofus figé, sur le Mac : vérifier qu'il ne retient plus le fil de scan, donc que le roster, la Roue et les titres courts continuent de suivre. `set_messaging_timeout` est posé à une demi-seconde dans `platform/macos.rs`
- [ ] La reprise de l'écoute des notifications, sur le Mac : tuer le centre de notifications, le journal doit porter une ligne, une seule, puis « Écoute des notifications démarrée » cinq secondes plus tard. Windows est essayé et bon, par `Stop-Service WpnUserService_*`, qui rend `0x803E0105`. L'essai casse le jeu et non le logiciel : le client Dofus perd son inscription auprès de la plateforme et n'émet plus rien tant qu'on ne l'a pas relancé, Multifus se rebranchant seul

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
