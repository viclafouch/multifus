# multifus

Gestionnaire de fenêtres pour Dofus Retro en multicompte, sur macOS et Windows. Il ramène automatiquement au premier plan la fenêtre du personnage concerné par une notification de jeu, et permet de naviguer entre ses fenêtres au clavier.

Le vocabulaire métier se discute en français, le code s'écrit en anglais. Chaque terme donne son identifiant de code entre parenthèses.

## Language

### Personnages

**Personnage** (`Character`):
Un personnage Dofus, identifié par son pseudo. Il entre dans le roster dès qu'une fenêtre porte son pseudo et n'en sort que sur suppression manuelle.
_Avoid_: Compte, joueur, client

**Pseudo** (`nickname`):
Le nom du personnage, lu dans le titre de sa fenêtre. C'est l'identité d'un personnage, deux personnages ne peuvent pas partager le même.
_Avoid_: Nom, identifiant

**Sexe** (`gender`):
Attribut d'un personnage, homme ou femme. Assigné à la main, conservé indéfiniment. Sert à endormir ou réveiller plusieurs personnages d'un coup.
_Avoid_: Genre, groupe, équipe, catégorie

**Roster** (`Roster`):
L'ensemble des personnages connus de multifus, y compris ceux qui ne sont pas connectés en ce moment.
_Avoid_: Liste, équipe, collection

**Connecté** (`online`):
Se dit d'un personnage dont la fenêtre existe actuellement. Un personnage non connecté reste visible dans le roster mais n'est ni focusable ni endormable.
_Avoid_: Actif, ouvert, lancé

### Fenêtres

**Fenêtre** (`GameWindow`):
L'incarnation d'un personnage à l'écran. Un processus client par personnage, sur les deux systèmes.
_Avoid_: Client, instance, écran

**Focus** (`focus`):
L'action de faire passer une fenêtre au premier plan. Une fenêtre réduite en ressort.
_Avoid_: Activer, basculer, afficher

**Réduite** (`minimized`):
Se dit d'une fenêtre que l'utilisateur a rangée dans le Dock ou la barre des tâches. Le personnage reste connecté : sa fenêtre existe toujours, elle n'est plus à l'écran.
_Avoid_: Minimisée, masquée, iconifiée, cachée

### Veille et défilement

**En veille** (`asleep`):
État d'un personnage retiré du défilement. L'AutoFocus continue de s'appliquer à lui, pour qu'un échange proposé à une mule la fasse remonter. Remis à zéro à chaque lancement de multifus.
_Avoid_: Exclu, désactivé, ignoré, masqué

**Défilement** (`cycle`):
Le parcours des fenêtres au raccourci clavier, dans un ordre choisi par l'utilisateur. Ignore les personnages en veille. Sans rapport avec l'ordre d'initiative en combat.
_Avoid_: Rotation, navigation, ordre d'initiative

**Bascule** (`swap`):
L'action d'endormir tous les personnages d'un sexe et de réveiller tous ceux de l'autre.
_Avoid_: Inversion, permutation, changement d'équipe

### Journal

**Journal** (`Journal`):
Le compte-rendu que multifus fait de lui-même, une entrée par événement. Il existe pour un seul jour, celui où une notification arrive et où aucune fenêtre ne remonte. Le tiroir de la fenêtre en montre les dernières entrées, le fichier sur le disque en garde des semaines.
_Avoid_: Log, historique, trace, debug

**Entrée** (`JournalEntry`):
Une ligne du journal : un moment et un événement structuré. Jamais une phrase, la langue de l'interface étant écrite ailleurs. Ne porte jamais le corps d'une notification de jeu, voir [ADR 0006](./docs/adr/0006-journal-sur-disque.md).
_Avoid_: Ligne de log, message, enregistrement

### Barre système

**Barre système** (`tray`):
L'endroit où multifus vit une fois sa fenêtre fermée : la barre des menus sur macOS, la zone de notification sur Windows. Son icône porte un menu qui liste les personnages connectés et permet de quitter. C'est le mot employé partout, y compris quand le texte doit dire à l'utilisateur où regarder.
_Avoid_: Barre des tâches, barre d'état, zone de notification, menu bar, systray

**Démarrage avec la session** (`start_at_login`):
Le réglage qui lance multifus à l'ouverture de session. Décoché par défaut. Ce que l'utilisateur a demandé, jamais ce que le système porte à un instant donné.
_Avoid_: Démarrage automatique, lancement au démarrage, autostart

### Distribution

**Mise à jour** (`update`):
Une version plus récente que celle qui tourne. multifus la cherche une fois au démarrage et la propose, dans la barre système et dans l'écran À propos. Il ne l'installe jamais de lui-même : installer relance l'application.
_Avoid_: Update, upgrade, nouvelle version

### Notifications

**Notification de jeu** (`GameNotification`):
Une notification système émise par un client Dofus. Son titre porte le pseudo du personnage destinataire, son corps décrit l'événement.
_Avoid_: Toast, alerte, message, popup

**Type de notification** (`NotificationKind`):
La catégorie d'un événement de jeu reconnue par multifus : combat, échange, groupe, craft, message privé, défi, percepteur. Déterminée par le corps de la notification.
_Avoid_: Catégorie, événement, déclencheur

**AutoFocus** (`AutoFocus`):
Le mécanisme qui focus la fenêtre d'un personnage lorsqu'une notification de jeu le concernant arrive. Activable par type de notification, globalement.
_Avoid_: Switch automatique, auto-switch, suivi

**Réveil des réduites** (`wakes_minimized`):
Le réglage qui dit si l'AutoFocus sort une fenêtre réduite. Coché par défaut. Décoché, réduire une fenêtre la met hors d'atteinte de l'AutoFocus, ce qui laisse travailler ailleurs sans être ramené dans le jeu. Ne concerne que l'AutoFocus : un raccourci et un clic dans la barre système sortent toujours la fenêtre, puisque l'utilisateur les a demandés.
_Avoid_: Mode concentration, ne pas déranger, restaurer
