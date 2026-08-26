# Multifus

Gestionnaire de fenêtres pour **Dofus Retro** en multicompte, sur macOS et Windows.

Une notification arrive dans le jeu, Multifus met devant vous la fenêtre du personnage concerné. On le lance, on l'oublie.

## Ce qu'il sait faire

- [x] Ramener une fenêtre au premier plan sur sept événements : combat, échange, groupe, craft, message privé, défi, percepteur
- [x] Deux raccourcis pour passer au personnage suivant ou précédent, dans l'ordre que vous rangez vous-même
- [x] Un raccourci pour mettre un personnage de côté : il sort du défilement, et une notification le ramène quand même
- [x] Un sexe par personnage, et un raccourci qui met tous vos hommes de côté pendant qu'il remet vos femmes dans le défilement
- [x] Des réponses rapides : une combinaison colle un texte tout prêt dans le chat, la touche Entrée reste la vôtre
- [x] Vos messages privés sur votre téléphone par Telegram, tant que vous êtes loin du clavier
- [x] Un client qui s'ouvre remplit l'écran tout seul, une seule fois
- [x] Une fenêtre de client titrée du seul pseudo, six clients lisibles d'un coup d'œil dans la barre des tâches (Windows)
- [x] Une classe par personnage, et la fenêtre du client porte le portrait de sa classe dans la barre des tâches (Windows)
- [x] Une icône de barre système qui liste les personnages connectés, un clic ramène la fenêtre
- [x] Un démarrage à l'ouverture de session
- [x] Un journal qui se copie d'un clic, pour le jour où rien ne se passe
- [x] Une mise à jour proposée quand une version sort, à installer d'un clic

Les quatre derniers réglages sont décochés par défaut. Fermer la fenêtre ne quitte pas Multifus, qui continue dans la barre système ; on le quitte par le menu de son icône.

## Compatibilité

| Système             | Version minimale                    | État                     |
| ------------------- | ----------------------------------- | ------------------------ |
| macOS               | 10.13 High Sierra                   | Vérifié sur macOS 26     |
| Windows             | 10, mise à jour 1709 d'octobre 2017 | En cours de vérification |
| Linux, iOS, Android |                                     | Hors périmètre           |

Sur macOS, Multifus demande l'**Accessibilité**, et il ne peut rien faire sans elle : ni lire le titre des fenêtres, ni les amener au premier plan, ni entendre les notifications du jeu. L'écran d'accueil mène au bon panneau des Réglages Système.

Sur Windows, il demande l'**accès aux notifications**. La mise à jour 1709 est le plancher, c'est elle qui a apporté l'écoute des notifications.

Dans les deux cas, les notifications en arrière-plan doivent être activées dans le jeu, par Options puis Général. Sur macOS, les bannières de Dofus doivent rester visibles dans les réglages du système, faute de quoi Multifus n'a rien à lire.

Le portrait de classe et le bouton par personnage dans la barre des tâches sont réservés à Windows : on ne repeint pas le Dock d'une autre application. Le médaillon et la modale, eux, marchent partout.

Le titre court est le seul autre réglage réservé à un système : le client de macOS garde son titre quoi qu'on lui demande, et l'interrupteur y est grisé.

## Installation

Sur macOS, télécharger le DMG de la [dernière release](https://github.com/viclafouch/multifus/releases/latest) et glisser Multifus dans les Applications. Le paquet est signé et notarisé par Apple, il s'ouvre donc sans avertissement. Les versions suivantes se proposent d'elles-mêmes, depuis l'écran À propos et depuis la barre système.

## Ce qu'il ne fait pas

Multifus ne lit pas la mémoire du client, ne simule aucune action de jeu, n'empêche pas la déconnexion pour inactivité et ne modifie aucun fichier. Il gère des fenêtres et lit des notifications système, rien d'autre. Les outils de type macro sont interdits par Ankama et restent hors de ce projet.

Dofus et Dofus Retro sont des marques déposées d'Ankama. Ce projet n'y est pas affilié.

## Développement

Construit avec [Tauri](https://v2.tauri.app), React et TypeScript pour l'interface, Rust pour la couche système. Prérequis : [Rust](https://www.rust-lang.org/tools/install), Node 24, et les [prérequis Tauri](https://tauri.app/start/prerequisites/) de votre système. Les commandes sont les scripts de `package.json`, et `npm install` pose les hooks git qui font passer `npm run lint` à chaque commit.

Une release se prépare par `npm run release`, qui écrit le changelog et pose le tag, puis se déclenche en poussant ce tag : le workflow compile, signe, notarise et dépose un brouillon qu'il reste à publier.

Les vingt-quatre portraits de `src/assets/portraits` appartiennent à Ankama. Ils sont repris d'un outil communautaire, et ils vivent dans un dossier qu'un `git rm` suffit à retirer. Leurs vingt-quatre `.ico` de `src-tauri/icons/portraits`, que Rust embarque, en ont été tirés une fois pour toutes.

Les mots du projet sont dans [CONTEXT.md](./CONTEXT.md), ce qui reste à faire dans [docs/plan.md](./docs/plan.md).

## Licence

MIT
