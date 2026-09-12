# Plan

Ce qui reste à faire, une ligne par chose. Une ligne faite se supprime, elle ne
se coche pas. C'est la seule liste : un sujet en cours ouvre son
`plan-<sujet>.md`, qui s'efface une fois livré et rend ici ce qu'il n'a pas fini.

## Publier la première version

- [ ] Dessiner le logo de Multifus. [logo.md](./logo.md) porte le prompt et le test qui tranche, la silhouette noire à 16 pixels. Il remplace `packages/retro/src/assets/logo.png`, celui du scaffolder Tauri, que la clairière, l'écran À propos et la barre du site montrent tous les trois : un seul fichier à changer pour les trois. Et `apps/desktop/src-tauri/icons`, que Tauri tire à part
- [ ] Créer un certificat **Developer ID Application** sur developer.apple.com, et l'exporter en `.p12`
- [ ] Poser les huit secrets du workflow `release` dans les réglages du dépôt : `APPLE_CERTIFICATE` (le `.p12` en base64), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` (un mot de passe d'application), `APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (vide)
- [ ] Trancher les Mac Intel : le workflow ne compile que `aarch64-apple-darwin`, et le README annonce Apple Silicon. Ajouter la cible `x86_64-apple-darwin`, ou s'en tenir là. `/mac` l'écrit maintenant en toutes lettres dans ce que Multifus ne fait pas, donc la trancher retouche aussi `apps/website/src/constants/bodies.ts`
- [ ] Trancher le certificat Authenticode de Windows, une fois la version macOS publiée
- [ ] Trancher qui relance Multifus après une mise à jour sur Windows. `tauri-plugin-updater` ouvre `restart_after_install`, vrai par défaut : l'installateur relance lui-même, et le `app.restart()` de `apps/desktop/src-tauri/src/app/update.rs` ne sert plus qu'au Mac. À vérifier sur la machine Windows, une fenêtre ouverte deux fois se voyant
- [ ] Vérifier l'attestation de provenance à la première publication : les chemins des paquets donnés à `actions/attest-build-provenance`, et que `gh attestation verify <fichier> --repo viclafouch/multifus` répond
- [ ] Vérifier `projectPath: apps/desktop` sur les deux `tauri-action` à la première publication : `ci.yml` ne les lance pas, seul un tag `v*` le fait

La paire de clés de l'updater existe déjà, dans `~/.tauri/multifus.key` et son
`.pub`, et sa moitié publique est le champ `plugins.updater.pubkey` de
`tauri.conf.json`. En régénérer une rendrait insignables les mises à jour des
versions déjà installées.

## Ouvrir le site

Le socle, le dessin et le texte sont posés : douze pages prérendues dans trois
langues, une par adresse. [apps/website/README.md](../apps/website/README.md) dit
comment il tient, [CONTEXT.md](../apps/website/CONTEXT.md) ses mots. Restent la
mise en ligne, trois vidéos qui mentent et deux défauts vus.

- [ ] Acheter `multifus.app`. Libre au 11 septembre 2026, aucun serveur de nom sur `.app`, `.io`, `.gg`, `.net` ni `.org`. Pas de `.fr`, le site parle trois langues. Jamais « dofus » dans le domaine, l'article 13.3 des CGU demandant une autorisation écrite pour les marques. `HOST` le vise déjà dans `apps/website/src/constants/site.ts`
- [ ] Écrire à `contact@ankama.com` le jour où le domaine est acheté, pour un logiciel et un site gratuits et ouverts. Un site existant se défend mieux qu'un projet
- [ ] Créer le projet Vercel, racine `apps/website`, et vérifier qu'il sert bien `dist/client`
- [ ] Tourner les trois boucles qui sont aujourd'hui des doublures, avec `make-loop` : les messages privés, les réponses rapides, et le montage de l'accueil. Les fichiers existent et mentent, `relay-loop.mp4` montrant l'AutoFocus, `quick-replies-loop.mp4` le Déplacement rapide, `home-loop.mp4` la roue. Chacune porte aussi son affiche, réencodée et non copiée, et sa durée en secondes est à corriger dans `constants/loops.ts` des deux côtés
- [ ] Reprendre les quatre phrases neuves du logiciel, la description et la légende des deux vidéos des Messages privés et des Réponses rapides : elles racontent ce que la vraie boucle montrera, et la doublure montre autre chose
- [ ] Donner leur vraie adresse aux deux liens de `/telecharger`, le bouton et la ligne qui offre l'autre système. Ils pointent tous les deux sur `releases/latest`, la page, faute de savoir le nom du fichier : c'est la lecture de l'API GitHub à la compilation qui la leur donnera, et `RELEASES` est l'unique endroit à reprendre. C'est là que `zod` entre, et pas avant : une réponse d'API qu'on lit sans la valider casse le build en silence le jour où GitHub change un champ
- [ ] Le crochet de déploiement Vercel dans le workflow `release`, appelé après la publication, pour que le numéro de version soit juste à la seconde où la release sort
- [ ] Dessiner l'image Open Graph, de la matière à nous et sans fichier d'Ankama, et la poser dans `headOf`. `twitter:card` est retombé à `summary` en attendant : annoncer `summary_large_image` sans `og:image` donne une carte vide dans Discord et sur X
- [ ] Brancher `/journal` sur `apps/desktop/CHANGELOG.md`, que la première release écrira. C'est la dernière page de `kind: 'plain'`, elle n'a que son titre et sa promesse, et rien ne dit encore comment le fichier devient la page
- [ ] Ouvrir `/journal` depuis l'écran À propos du logiciel, à côté de « Aller voir » et « Aller le dire », et trancher si le panneau de mise à jour y renvoie quand une version est prête
- [ ] Vercel Analytics, un seul événement personnalisé, le clic sur « Télécharger » avec le système dedans
- [ ] Déclarer le site à la Search Console et y déposer le sitemap
- [ ] Revérifier dans le code des concurrents les quatre notes à moitié du comparatif, déduites du tableau de [concurrents.md](./concurrents.md) et non lues ligne à ligne : le tableau des runes de Retro Toolbox, le rangement de Dosoft, et les compositions d'équipe de Dosoft et de Retro Toolbox. Les deux autres sont sourcées, l'attestation de Focus Retro et la licence de Retro Toolbox. La page promet une case lue dans le code, donc une note qui ne l'est pas est exactement ce qu'elle reproche aux autres
- [ ] Reprendre la barre du haut sous 480 points. Relevé le 12 septembre 2026 sur toutes les pages, l'accueil comme `/telecharger` : le nom, le menu, le comparatif, les drapeaux et le bouton ne tiennent pas, la ligne se replie et déborde à droite au lieu de s'empiler. Le `ml-auto` du cartouche n'a plus de sens sur une ligne repliée. C'est le cadre, pas une page
- [ ] Ouvrir le site dans Firefox, qui ne connaît pas `animation-timeline` : le repli est écrit dans un `@supports`, il n'a pas été vu tourner
- [ ] Relire l'anglais et l'espagnol une fois le français figé. Les trois catalogues sont pleins, et ils portent le corps des sept fonctionnalités : c'est du texte suivi, et il n'a été relu par personne
