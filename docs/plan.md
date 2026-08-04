# Plan de développement

Ce document est la feuille de route de multifus. Il existe pour qu'un développeur, humain ou assistant, puisse reprendre le projet sans rien redécouvrir.

Avant toute chose : lire [CONTEXT.md](../CONTEXT.md) pour le vocabulaire, [perimetre.md](./perimetre.md) pour ce qui est dans le périmètre et surtout ce qui n'y est pas, et [adr](./adr) pour les décisions qu'il ne faut pas reprendre à zéro.

---

## Étape 0 — Bootstrap ✅

Faite. Le dépôt contient un projet Tauri v2 fonctionnel.

Tauri 2.11, React 19.2, Vite 8.2, TypeScript 7.0, Tailwind 4.3, shadcn 4.16 en style `base-vega`. Alias `@` vers `src`, thème sombre activé sur le `<html>`, police Inter Variable. Rust 1.97 stable.

Vérification : `npm run build` passe.

---

## Étape 1 — Outillage

**Objectif.** Le projet respecte les conventions du mainteneur et peut produire des releases.

Brancher **`@viclafouch/oxc-config`** pour oxlint et oxfmt, avec les scripts `lint`, `lint:fix`, `format`, `format:check` calqués sur les autres dépôts viclafouch. Ajouter un `.nvmrc` sur Node 24. Poser la licence **MIT** et remplir les champs `author`, `license`, `repository`, `bugs` du `package.json`. Installer **`standard-version`** pour le changelog, puisque l'historique est déjà en conventional commits.

**Vérification.** `npm run lint` et `npm run format:check` sortent en zéro.

---

## Étape 2 — Cœur métier en Rust, sans système

**Objectif.** Toute la logique de multifus est testable sans ouvrir une fenêtre ni lire une notification.

Modéliser `Character` (pseudo, sexe, veille, connecté) et `Roster`. Écrire les fonctions pures : personnage suivant et précédent en sautant les personnages en veille, bascule de veille, bascule de sexe, et la classification d'une notification.

Porter depuis Dracoon deux éléments qui ont fait leurs preuves et qu'il ne faut pas réinventer. Le premier est l'extraction du pseudo depuis un titre de fenêtre ou de notification, par la regex `^(.+?)\s*-\s*Dofus`. Le second est la table de patterns par type de notification, en français, anglais et espagnol, vérifiée valide sur les deux systèmes. Elle se trouve dans `Dracoon.pyw` sous le nom `NOTIF_TYPES`.

**Vérification.** `cargo test` couvre le défilement avec des personnages en veille, le cas où tout le monde dort, et la classification des sept types dans les trois langues. Aucun appel système dans ce module.

---

## Étape 3 — Frontière entre le cœur et le système

**Objectif.** Le portage Windows ne doit rien réécrire du cœur.

Définir deux interfaces. `WindowManager` énumère les fenêtres de jeu avec leur pseudo, en focus une, et dit si la fenêtre au premier plan est une fenêtre Dofus. `NotificationWatcher` démarre une écoute et remonte le titre et le corps de chaque notification de jeu.

Créer `platform::macos` et `platform::windows`, sélectionnés par `cfg`. Le module Windows compile mais renvoie une erreur « non implémenté ».

**Pourquoi maintenant.** Concevoir cette frontière en ne connaissant qu'un seul système garantit de tout réécrire au moment du portage. La réalité Windows est connue en détail grâce à Dracoon, les deux côtés peuvent donc être pris en compte dès le premier jour.

**Vérification.** Le projet compile sur macOS, et `cargo check --target x86_64-pc-windows-msvc` compile aussi une fois la cible ajoutée.

---

## Étape 4 — Implémentation macOS

**Objectif.** L'AutoFocus fonctionne sur macOS.

La route est validée par prototype, voir [ADR 0002](./adr/0002-notifications-macos-via-accessibility.md). Poser un `AXObserver` sur le processus `com.apple.notificationcenterui` et lire les `AXStaticText` de la bannière à sa création. L'arbre observé pendant le prototype est le suivant, le premier texte est le titre et le second le corps :

```
window "Notification Center"
└─ group 1 → group 1 → scroll area 1 → group 1
   ├─ static text  "Pseudo - Dofus Retro v1.48.21"
   └─ static text  "de Untel : a ton tour de jouer"
```

Pour les fenêtres : filtrer les processus dont le bundle est `com.dofus.d1elauncher`, lire l'`AXTitle` de leur fenêtre principale, et ne retenir que celles dont le titre matche la regex. Un client encore sur l'écran de connexion a des fenêtres mais pas de titre exploitable, il faut donc filtrer sur le titre et jamais sur la taille. Le focus se fait en activant le processus par son pid, un processus correspondant à un client.

Demander l'autorisation d'Accessibilité avec `AXIsProcessTrustedWithOptions`, et afficher un écran d'explication tant qu'elle n'est pas accordée.

Crates pressenties : `objc2`, `objc2-app-kit`, `objc2-application-services`.

**Vérification.** Deux clients ouverts, une notification de combat sur le second, le focus bascule dessus en moins de 300 ms.

---

## Étape 5 — Persistance

**Objectif.** Les réglages survivent au redémarrage, la veille non.

Un fichier JSON dans le dossier de configuration standard du système, via `app_config_dir` de Tauri. Il contient le roster (pseudo, sexe, position dans le défilement), les quatre raccourcis, les sept interrupteurs AutoFocus, et l'option de démarrage automatique. Il ne contient **pas** l'état de veille, voir [ADR 0004](./adr/0004-veille-ephemere-sexe-persiste.md).

**Vérification.** Relancer multifus conserve les sexes et l'ordre, et réveille tout le monde.

---

## Étape 6 — Interface React

**Objectif.** Un tableau de bord que l'on consulte, pas un panneau de réglages que l'on visite.

Quatre écrans. **Personnages** : la liste, avec l'état connecté ou non, la bascule de veille, l'assignation du sexe, le drag and drop du défilement, les deux boutons d'action groupée, et la suppression au survol pour les personnages non connectés. **Raccourcis** : capture des quatre combinaisons. **AutoFocus** : les sept interrupteurs globaux. **À propos** : version, mentions légales Ankama, réinitialisation.

Un journal repliable, masqué par défaut, indispensable le jour où l'AutoFocus ne se déclenche pas.

Les chaînes d'interface sont en français et centralisées dans un seul fichier, le code et les commentaires sont en anglais.

---

## Étape 7 — Raccourcis globaux

**Objectif.** Les quatre raccourcis de [perimetre.md](./perimetre.md) fonctionnent depuis le jeu.

Utiliser `tauri-plugin-global-shortcut`. Chaque raccourci reste inerte tant qu'une fenêtre Dofus n'est pas au premier plan.

**Piège à ne pas reproduire.** Dracoon retire tous ses raccourcis puis les réenregistre à chaque modification, dans un `try` dont l'exception est avalée. Une combinaison invalide laisse donc l'utilisateur sans aucun raccourci et sans aucun message. Il faut valider avant d'appliquer, et remonter l'échec à l'écran.

---

## Étape 8 — Barre système et démarrage automatique

**Objectif.** L'application se lance et s'oublie.

Une icône de barre système avec un menu listant les personnages et leur état de veille, cliquables. Fermer la fenêtre ne quitte pas l'application, on quitte par le menu de l'icône. Le démarrage à l'ouverture de session est une option via `tauri-plugin-autostart`, **décochée par défaut**.

---

## Étape 9 — Implémentation Windows

**Objectif.** La parité, sur la machine où l'application sert vraiment.

Prérequis sur la machine Windows : Microsoft C++ Build Tools avec la charge « Développement Desktop en C++ », puis `rustup default stable-msvc`. WebView2 est déjà présent sur un Windows 10 à jour.

Utiliser la crate `windows`, qui couvre WinRT nativement. `UserNotificationListener` pour l'écoute, `EnumWindows` et `GetWindowText` pour l'énumération. Implémenter aussi la suppression des toasts au focus, possible ici et impossible sur macOS.

**Piège à ne pas reproduire.** Dracoon contourne la restriction de `SetForegroundWindow` en injectant une vraie frappe Alt dans l'application active. C'est la cause probable du bug de focus intermittent corrigé dans son commit `0b0525c`, et ça envoie une touche parasite dans le jeu. Passer par `AttachThreadInput`.

---

## Étape 10 — Intégration continue et distribution

**Objectif.** Produire les binaires sans jamais installer de chaîne de build sur le PC de jeu.

Un workflow GitHub Actions basé sur `tauri-action`, déclenché sur tag, qui compile pour macOS et Windows et publie une release. C'est la voie retenue plutôt que de compiler à la main.

---

## Pièges connus

**TypeScript 7 a supprimé `baseUrl`.** Les `paths` du `tsconfig.json` se résolvent désormais relativement au fichier lui-même. Ne pas réintroduire `baseUrl`, le build casse.

**shadcn 4.16 repose sur Base UI, pas sur Radix.** Les API de composants diffèrent de la plupart des tutoriels shadcn en circulation.

**L'AutoFocus macOS dépend de l'affichage des bannières.** Si l'utilisateur les désactive pour Dofus dans les réglages système, l'écoute cesse de fonctionner. Le README de Dracoon recommande justement de les désactiver sur Windows, où l'écoute passe par l'API et non par l'affichage. Cette asymétrie doit être expliquée dans l'interface.

**Un client Dofus sur l'écran de connexion existe déjà en tant que processus** avec des fenêtres, mais sans titre exploitable. Toujours filtrer sur le titre.
