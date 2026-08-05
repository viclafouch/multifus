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
L'action de faire passer une fenêtre au premier plan.
_Avoid_: Activer, basculer, afficher

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

### Barre système

**Barre système** (`tray`):
L'endroit où multifus vit une fois sa fenêtre fermée : la barre des menus sur macOS, la zone de notification sur Windows. Son icône porte un menu qui liste les personnages connectés et permet de quitter. C'est le mot employé partout, y compris quand le texte doit dire à l'utilisateur où regarder.
_Avoid_: Barre des tâches, barre d'état, zone de notification, menu bar, systray

**Démarrage avec la session** (`start_at_login`):
Le réglage qui lance multifus à l'ouverture de session. Décoché par défaut. Ce que l'utilisateur a demandé, jamais ce que le système porte à un instant donné.
_Avoid_: Démarrage automatique, lancement au démarrage, autostart

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
