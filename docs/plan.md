# Plan

- [ ] Dessiner le logo : `packages/retro/src/assets/logo.png` porte encore celui du scaffolder Tauri
- [ ] Tirer les icônes de `apps/desktop/src-tauri/icons` du logo, Tauri les prenant à part
- [ ] Créer un certificat Developer ID Application sur developer.apple.com, et l'exporter en `.p12`
- [ ] Poser les huit secrets Apple et Tauri du workflow `release` dans les réglages du dépôt
- [ ] Trancher les Mac Intel : ajouter la cible `x86_64-apple-darwin`, ou s'en tenir au README et à `/mac`
- [ ] Trancher le certificat Authenticode de Windows, une fois la version macOS publiée
- [ ] Trancher qui relance Multifus après une mise à jour sur Windows, `restart_after_install` ou `app.restart()`
- [ ] Vérifier l'attestation de provenance à la première publication, et que `gh attestation verify` répond
- [ ] Vérifier `projectPath: apps/desktop` sur les deux `tauri-action` à la première publication
- [ ] Enregistrer les cinq écrans manquants de la mise en route, `PAGE_SHOTS` n'en portant qu'un
- [ ] Sortir `lucide-react` du dépôt, une quinzaine de fichiers, tous des glyphes seuls
- [ ] Sortir `theme.css` quand plus aucun composant shadcn ne sert
- [ ] Acheter `multifus.app`, sans « dofus » dedans, `HOST` le visant déjà
- [ ] Écrire à `contact@ankama.com` le jour où le domaine est acheté
- [ ] Créer le projet Vercel, racine `apps/website`, sur `dist/client`, sans réécriture attrape-tout
- [ ] Tourner les trois boucles doublures avec `make-loop` : messages privés, réponses rapides, accueil, et recouper les deux aperçus qui en descendent
- [ ] Réduire les sept boucles, onze mégaoctets, `walk-loop.mp4` en pesant 2,2 à lui seul
- [ ] Reprendre les quatre phrases des Messages privés et des Réponses rapides, les vraies boucles tournées
- [ ] Donner leur vraie adresse aux deux liens de `/telecharger`, par l'API GitHub lue avec `zod`
- [ ] Poser le crochet de déploiement Vercel dans le workflow `release`, après la publication
- [ ] Brancher `/journal` sur `apps/desktop/CHANGELOG.md`, que la première release écrira
- [ ] Ouvrir `/journal` depuis À propos, et trancher si le panneau de mise à jour y renvoie
- [ ] Poser Vercel Analytics, un seul événement, le clic sur « Télécharger » avec le système dedans
- [ ] Déclarer le site à la Search Console et y déposer le sitemap
- [ ] Ouvrir le site dans Firefox, qui ne connaît pas `animation-timeline` : les replis n'ont jamais tourné
- [ ] Repasser le site en ligne sur l'adresse réelle et sur un téléphone : icônes, `robots.txt`, 404

La paire de clés de l'updater existe déjà, dans `~/.tauri/multifus.key` et son
`.pub`, et sa moitié publique est le champ `plugins.updater.pubkey` de
`tauri.conf.json`. En régénérer une rendrait insignables les mises à jour des
versions déjà installées.
