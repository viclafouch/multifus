# Plan

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
- [ ] Désigner le domaine principal dans Vercel, pour que l'autre variante réponde en 308
- [ ] Tourner les trois boucles doublures avec `make-loop` : messages privés, textes rapides, accueil, et recouper les deux aperçus qui en descendent
- [ ] Reprendre les quatre phrases des Messages privés et des Textes rapides, les vraies boucles tournées
- [ ] Poser le crochet de déploiement Vercel dans le workflow `release`, après la publication
- [ ] Brancher `/journal` sur `apps/desktop/CHANGELOG.md`, que la première release écrira
- [ ] Ouvrir `/journal` depuis À propos, et trancher si le panneau de mise à jour y renvoie
- [ ] Poser Vercel Analytics, un seul événement, le clic sur « Télécharger » avec le système dedans
- [ ] Déclarer le site à la Search Console et y déposer le sitemap
- [ ] Étoffer les treize pages, 250 à 370 mots chacune : c'est le seul écart qui reste avec Retro Toolbox
- [ ] Porter `softwareVersion` et `releaseNotes` dans le `SoftwareApplication`, une fois `/journal` branché
- [ ] Ouvrir une issue chez TanStack Start sur l'espace de noms du sitemap, écrit en `https` au lieu de `http`
- [ ] Retirer `scripts/tidy-build.mjs` le jour où cet espace de noms est corrigé en amont
- [ ] Passer les pages au Rich Results Test, à `validator.schema.org` et à un valideur de sitemap, une fois en ligne
- [ ] Ouvrir le site dans Firefox, qui ne connaît pas `animation-timeline` : les replis n'ont jamais tourné
- [ ] Repasser le site en ligne sur l'adresse réelle et sur un téléphone : icônes, `robots.txt`, 404

La paire de clés de l'updater existe déjà, dans `~/.tauri/multifus.key` et son
`.pub`, et sa moitié publique est le champ `plugins.updater.pubkey` de
`tauri.conf.json`. En régénérer une rendrait insignables les mises à jour des
versions déjà installées.
