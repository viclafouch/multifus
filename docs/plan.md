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
- [ ] Vérifier l'attestation de provenance à la première publication : les chemins des paquets donnés à `actions/attest-build-provenance`, et que `gh attestation verify <fichier> --repo viclafouch/multifus` répond

La paire de clés de l'updater existe déjà, dans `~/.tauri/multifus.key` et son
`.pub`, et sa moitié publique est le champ `plugins.updater.pubkey` de
`tauri.conf.json`. En régénérer une rendrait insignables les mises à jour des
versions déjà installées.

## Finir la FAQ et la vérification

La revue à deux axes a laissé ces quatre-là ouverts, sciemment.

- [ ] Sur Mac, la réponse « bannière » dit de garder la bannière, et le dialogue tend quand même le chemin et le bouton qui ouvrent le panneau des notifications : `QUESTION_PAGES.banner` ne connaît pas `IS_APPLE`
- [ ] Le verdict de la vérification compte l'essai parmi les « réglages » fermés, alors que `CONTEXT.md` dit qu'il n'en est pas un. Compter les quatre réglages et dire l'essai à part, ou trouver le mot qui couvre les cinq
- [ ] `@utility askmark` redessine le losange de `btn-way` au lieu de le partager, et leurs durées divergent, 0,2 s contre 0,3 s. La règle 34 de [design-system.md](./design-system.md) annonce pourtant un seul losange
- [ ] La FAQ et la vérification s'atteignent en ouvrant la fenêtre et en descendant les Paramètres, sans raccourci ni entrée de la barre système, ce que `CLAUDE.md` interdit. La vérification est justement ce qu'on veut lancer quand rien ne passe devant

## Poser les images qui manquent

- [ ] Enregistrer les cinq vidéos de la mise en route sur le Mac, et les mêmes sur Windows pour les étapes 2, 3 et 4, dont le dessin diffère. `PAGE_SHOTS` gagne son axe plateforme à ce moment-là, et pas avant : deux tables identiques en attendant les images ne seraient qu'une constante écrite deux fois. Posées, `PAGE_SHOTS` les prend et le cadre pointillé disparaît

## Essayer sur les vraies machines

Le code est écrit et les tests passent des deux côtés. Rien de ce qui suit ne se
prouve par un test : il faut la machine, et le jeu ouvert à côté. Sur le Mac,
l'essai se fait sur le build installé dans `/Applications`, un build ad-hoc
perdant son autorisation d'Accessibilité.

- [ ] Multifus laissé une heure à côté d'un navigateur, sur Windows : le gestionnaire des tâches ne doit rien lui voir prendre au processeur. Le reste du réveil du tour est essayé et bon, filtre de `DESTROY` compris
- [ ] Un client Dofus figé, sur le Mac : vérifier qu'il ne retient plus le fil de scan, donc que le roster, la roue et les titres courts continuent de suivre. `set_messaging_timeout` est posé à une demi-seconde dans `platform/macos.rs`
- [ ] Les notifications en rafale, sur le Mac : lancer trois échanges à deux secondes d'écart sur trois personnages, les trois doivent basculer. macOS remplit la bannière déjà à l'écran au lieu d'en créer une, et `AXLayoutChanged` est ce qui le dit. Puis ouvrir le Centre de notifications, qui expose les anciennes notifications : aucune fenêtre ne doit passer devant
- [ ] La reprise de l'écoute des notifications, sur le Mac : tuer le centre de notifications, le journal doit porter une ligne, une seule, puis « Écoute des notifications démarrée » cinq secondes plus tard. Windows est essayé et bon, par `Stop-Service WpnUserService_*`, qui rend `0x803E0105`. L'essai casse le jeu et non le logiciel : le client Dofus perd son inscription auprès de la plateforme et n'émet plus rien tant qu'on ne l'a pas relancé, Multifus se rebranchant seul
- [ ] Le raccourci rendu hors du jeu, sur le Mac : `Shift+Digit1` écrit le 1 dans Chrome, Multifus allumé, et colle toujours la réponse rapide dans le jeu. Puis cliquer sur un client et frapper aussitôt, il répond ; l'AutoFocus ramène une fenêtre devant, le raccourci suivant répond ; la roue maintenue puis relâchée bascule toujours
- [ ] Le journal ne se remplit pas de « raccourcis liés » quand on entre et sort du jeu vingt fois
- [ ] Le crochet de panic, des deux côtés : forcer un panic dans une commande, le journal doit porter « Une partie de Multifus a échoué brutalement » avec le fichier et la ligne ; puis dans le tour, où il doit porter « La lecture des fenêtres a échoué brutalement, et a repris », une seule ligne et non deux. Le verrou tenu par le fil qui panique fait tomber la première dans le fichier seul, sans passer par la fenêtre
- [ ] Un plantage de rendu dans la bannière, la roue ou le tableau des runes ne laisse aucune trace : elles montent par `boot.tsx` sans barrière, et l'écran de plantage de `main.tsx` ne convient pas à une fenêtre sans bord. Leur donner de quoi écrire au journal sans rien montrer
- [ ] La webview étranglée en arrière-plan, sur le Mac : ranger Multifus dans la barre système, attendre dix minutes, puis rouvrir la fenêtre. Le roster, le journal et les réglages doivent être à jour tout de suite. macOS 14+ suspend une webview cachée au bout de cinq minutes environ, et `backgroundThrottling: "disabled"` dans `tauri.conf.json` répond si les évènements de Rust n'arrivent plus
- [ ] Le premier clic sur la fenêtre principale, sur le Mac : revenir du jeu et cliquer droit sur un bouton du roster. Si macOS mange ce clic pour réveiller la fenêtre, `acceptFirstMouse: true` dans `tauri.conf.json` le fait passer, comme il le fait déjà pour les fenêtres à part
- [ ] Ouvrir Multifus sur un Mac en macOS 12.4, le plus vieux qu'il accepte : `@layer` demande Safari 15.4, et `build.target` de `vite.config.ts` tient ce plancher. Les couleurs translucides y sont opaques, `color-mix()` n'arrivant qu'en 16.2, et c'est voulu : Tailwind pose la couleur pleine puis l'améliore sous `@supports`
- [ ] L'instance unique, sur Windows : lancer Multifus une deuxième fois, le second lancement doit s'arrêter tout seul, la fenêtre du premier revenir devant, et le journal porter « Multifus tournait déjà ». À essayer aussi Multifus rangé dans la barre système, fenêtre fermée
- [ ] Le contrôle des notifications de Dofus, sur Windows : décocher Dofus dans « Notifications » des Paramètres, l'étape doit passer au rouge, et un avis se poser l'AutoFocus allumé. Multifus lit `ToastNotifier.Setting`, pas `Enabled` du registre, qui n'existait pas le soir où l'AutoFocus s'est tu
- [ ] L'avis de l'oreille sourde, sur les deux : AutoFocus allumé, Multifus qui écoute, et le jeu qui n'appelle pas pendant trois quarts d'heure. Le bandeau doit se poser une fois, le journal porter une ligne, et la première notification entendue doit tout éteindre pour le reste du lancement
- [ ] Un client Dofus lancé en administrateur, sur Windows : le titre court, la tête de classe et la bascule échouent tous en silence sur sa fenêtre, et le personnage reste pourtant dans le roster. Vérifier ce que dit le journal
- [ ] Est-ce que Dofus Retro passe vraiment sa fenêtre devant au début d'un tour, sur Windows, ou est-ce qu'il fait seulement clignoter son bouton dans la barre des tâches. La réponse décide s'il faut protéger un exclu du geste du jeu, et [audit-concurrents.md](./audit-concurrents.md) dit ce que ça coûterait

## Purger le cache Cargo après le déménagement

- [ ] Au premier `cargo` sur le Mac comme sur Windows, depuis `apps/desktop/src-tauri` : `rm -rf target/debug/build/tauri-* target/debug/build/multifus-*`. Les artefacts de `tauri-build` gardent les chemins absolus de l'ancien emplacement, et `cargo` réclame un fichier qui n'existe plus
- [ ] Vérifier `projectPath: apps/desktop` sur les deux `tauri-action` à la première publication : `ci.yml` ne les lance pas, seul un tag `v*` le fait

Le code Windows se compile et ses tests passent sur la machine Windows, où
`cargo test` prend `platform/windows.rs` comme n'importe quel autre fichier.
Depuis le Mac il ne se compile pas : `cargo check --target
x86_64-pc-windows-msvc` échoue, `ring` demandant un compilateur C. Une caisse
jetable hors du dépôt, qui ne dépend que de `windows` et bouchonne le reste, se
type-checke pour cette cible, `windows` étant du Rust pur. Ça n'essaie rien, mais
ça attrape les signatures et les constantes fausses.

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
