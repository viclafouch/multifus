# Plan de développement

Ce document dit où en est multifus et ce qui vient ensuite. Rien d'autre.

Le vocabulaire est dans [CONTEXT.md](../CONTEXT.md), ce que le projet refuse de faire dans [perimetre.md](./perimetre.md), les décisions structurantes dans [adr](./adr). Le pourquoi des choix d'implémentation vit dans les commentaires de module du code, au contact de ce qu'il explique et là où il se périme le moins vite. Ce document ne le recopie pas.

---

## Où on en est

Les étapes 0 à 7 sont écrites. Leurs numéros restent des étiquettes, le code y renvoie.

| #   | Étape                     | Où                                 | État                          |
| --- | ------------------------- | ---------------------------------- | ----------------------------- |
| 0-1 | Bootstrap et outillage    | `package.json`, `oxlint.config.ts` | fait                          |
| 2   | Cœur métier pur           | `src-tauri/src/domain`             | fait, testé                   |
| 3   | Frontière avec le système | `src-tauri/src/platform`           | fait                          |
| 4   | Implémentation macOS      | `platform::macos`                  | **vérifiée sur deux clients** |
| 5   | Persistance               | `src-tauri/src/config`             | fait, testé                   |
| 6   | Interface React           | `src`, `src-tauri/src/app`         | faite, AutoFocus prouvé       |
| 7   | Raccourcis globaux        | `app::shortcuts`                   | **vérifiés depuis le jeu**    |

Les versions font foi dans `package.json` et `Cargo.toml`, nulle part ailleurs.

**L'activation de processus fonctionne.** C'était le fil auquel tenaient l'AutoFocus et les deux raccourcis de défilement, et il tient. Sur l'application empaquetée, avec deux clients Retro connectés, le journal a écrit : Suivant alternant dix-huit fois entre les deux personnages, Précédent remontant, la Veille agissant sur celui de devant, et l'AutoFocus ramenant la bonne fenêtre sur trois types de notification distincts, échange, défi et combat. La garde tient aussi, un Suivant frappé sans fenêtre Dofus devant écrit « ignoré » et ne fait rien.

Ce qui avait été confronté à un vrai client Retro avant cela, hors de l'application et en lecture seule : le bundle est bien `com.dofus.d1elauncher`, le titre de la fenêtre principale est bien `Pseudo - Dofus Retro v1.48.21` et la regex le reconnaît, et lire `AXMainWindow` puis `AXTitle` coûte 0,05 ms en médiane.

Plus rien de macOS n'est en l'air.

Le journal se copie depuis son en-tête, puisque c'est ce qu'on en fait : on le relit ailleurs. Il part en texte brut, une ligne par entrée, l'heure devant. L'écriture passe par `tauri-plugin-clipboard-manager` et non par `navigator.clipboard`, la fenêtre étant servie par un protocole propre à Tauri. Ce plugin n'accorde rien par défaut, sa permission `default` est vide par conception : la capacité déclare `clipboard-manager:allow-write-text` et rien d'autre, multifus ne lisant jamais le presse-papiers.

---

## La suite, dans l'ordre

L'ordre ci-dessous n'est pas celui des numéros : la distribution passe avant Windows, pour la raison donnée à sa section.

### Étape 8 — Barre système, logo et démarrage automatique

**Objectif.** L'application se lance et s'oublie.

Une icône de barre système avec un menu listant les personnages et leur état de veille, cliquables. Fermer la fenêtre ne quitte plus l'application, on quitte par le menu de l'icône ; `tauri.conf.json` bascule ici et pas avant, sinon la fenêtre se cache sans moyen de revenir. Le démarrage à l'ouverture de session est une option via `tauri-plugin-autostart`, **décochée par défaut**.

**Le logo.** `src-tauri/icons` porte encore celui du scaffolder Tauri. Il sert au dock, à l'application empaquetée et à l'icône de barre système de cette étape, donc il se pose ici. `npm run tauri icon <fichier>` régénère les onze fichiers depuis un PNG carré à transparence.

**Vérification.** Une journée de jeu sans jamais ouvrir la fenêtre.

### Étape 10 — Intégration continue et distribution

**Objectif.** Produire les binaires sans installer de chaîne de build sur le PC de jeu, et savoir enfin si le code Windows compile.

Un workflow GitHub Actions basé sur `tauri-action`, déclenché sur tag, qui compile pour macOS et Windows et publie une release.

**Pourquoi avant Windows.** `cargo check --target x86_64-pc-windows-msvc` échoue depuis le Mac, donc personne ne sait aujourd'hui si `platform::windows` compile encore. Un runner `windows-latest` le dit gratuitement, et la session Windows démarre alors avec une boucle de retour au lieu de la découvrir à la fin.

### Étape 9 — Implémentation Windows

**Objectif.** La parité, sur la machine où l'application sert vraiment.

Session à ouvrir sur le PC Windows, dépôt cloné. Prérequis : Microsoft C++ Build Tools avec la charge « Développement Desktop en C++ », puis `rustup default stable-msvc`. WebView2 est déjà présent sur un Windows 10 à jour.

Utiliser la crate `windows`, qui couvre WinRT nativement. `UserNotificationListener` pour l'écoute, `EnumWindows` et `GetWindowText` pour l'énumération. Implémenter aussi la suppression des toasts au focus, possible ici et impossible sur macOS.

**Piège à ne pas reproduire.** Dracoon contourne la restriction de `SetForegroundWindow` en injectant une vraie frappe Alt dans l'application active. C'est la cause probable du bug de focus intermittent corrigé dans son commit `0b0525c`, et ça envoie une touche parasite dans le jeu. Passer par `AttachThreadInput`.

Ce qui attend déjà de ce côté : `platform::windows` compile en renvoyant `NotImplemented` méthode par méthode, la regex et la table `NOTIF_TYPES` sont dans `domain` et ne sont pas à réécrire, et les raccourcis globaux échouent franchement sur cette plateforme quand une combinaison est déjà prise, contrairement à macOS.

---

## Ce qui mord

**L'autorisation d'Accessibilité se donne à un binaire, pas à un projet.** Le `target/debug/multifus` de `tauri dev` et l'application empaquetée sont deux entrées distinctes dans Réglages Système, et un `cargo build` qui remplace le binaire peut faire perdre la confiance accordée à la version de développement. Vérifier sur l'application empaquetée. Aucune identité de signature n'est configurée, donc chaque compilation change la signature ad hoc du binaire : l'entrée peut rester cochée à l'écran sans plus s'appliquer. Quand l'autorisation disparaît sans raison apparente, `tccutil reset Accessibility com.viclafouch.multifus` puis réaccorder.

**Sur macOS, une combinaison déjà prise s'enregistre sans erreur et ne se déclenche jamais.** Carbon ne refuse qu'un doublon du même processus, donc ni le bureau ni une autre application ne provoquent d'échec à la pose, et aucune API ne permet de le savoir à l'avance. Ne pas chercher à faire dire au plugin ce qu'il ne sait pas : la seule preuve est un appui depuis le jeu et la ligne que le journal écrit. Windows, lui, refuse franchement.

**`Control+flèche` appartient à macOS**, Mission Control et le passage entre bureaux. Les combinaisons proposées au premier lancement sont donc `Control+Shift+flèche`. Et `Pause`, `ScrollLock` et `F21` à `F24` passent le parseur du plugin mais n'ont pas de code de touche sur macOS : elles échouent à la pose, ce que l'écran affiche.

**Ne jamais tenir le verrou de `Multifus` en touchant au watcher de notifications ou au plugin de raccourcis.** Le premier joint le thread qui exécute le sink, le second attend le fil principal où les commandes prennent ce verrou. C'est le seul interblocage que cette application sache construire, et la règle est écrite en tête de `app::state`.

**L'AutoFocus macOS dépend de l'affichage des bannières, et la livraison sans affichage a été essayée.** Décocher « Bureau » en gardant « Centre de notifications » ne donne rien du tout : macOS ne construit aucun élément tant que le panneau reste fermé, donc l'observateur n'a rien à lire. Mesuré sur un combat, un défi et un échange, journal vide et aucune fenêtre ramenée. Ne pas rouvrir cette piste, elle est dans ADR 0002. Le réglage le moins gênant qui marche est bannière sur le Bureau, style temporaire, son coupé, aperçus par défaut. Sur Windows c'est l'inverse, l'écoute passe par une API et les bannières peuvent rester coupées.

**Un client Dofus sur l'écran de connexion existe déjà en tant que processus** avec des fenêtres, mais sans titre exploitable. Toujours filtrer sur le titre, jamais sur la taille.

**`cargo check --target x86_64-pc-windows-msvc` échoue depuis macOS**, avant même de compiler une ligne du projet : le build script de Tauri réclame `llvm-rc`, absent de la machine. C'est antérieur au projet, constaté sur un dépôt neuf, ne pas partir chasser ça dans le code.

**TypeScript 7 a supprimé `baseUrl`.** Les `paths` du `tsconfig.json` se résolvent relativement au fichier lui-même. Ne pas le réintroduire, le build casse.

**shadcn 4.16 repose sur Base UI, pas sur Radix.** Les API de composants diffèrent de la plupart des tutoriels shadcn en circulation.
