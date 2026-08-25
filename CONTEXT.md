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
Se dit d'un personnage dont une fenêtre porte le pseudo en ce moment. La fenêtre seule ne suffit pas : Dofus déconnecte un client resté inactif un quart d'heure, et son titre perd le pseudo sans que la fenêtre disparaisse. Le personnage cesse alors d'être connecté, ce que le balayage voit tout seul. Un personnage non connecté reste visible dans le roster mais n'est ni focusable ni endormable.
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

**Titre court** (`short_title`):
Le titre d'une fenêtre ramené au seul pseudo, `Alpha` au lieu de `Alpha - Dofus Retro v1.48.21`. C'est ce que la barre des tâches montre sur Windows et la barre de titre sur macOS, et six clients y deviennent lisibles d'un coup d'œil. Réglage global, décoché par défaut ; décoché à nouveau, chaque fenêtre renommée depuis le lancement en cours retrouve le titre que Dofus lui avait écrit. Il ne cache rien à multifus, qui reconnaît un titre court et y lit le pseudo sans avoir eu besoin de se souvenir de l'avoir écrit : rien d'autre dans l'application ne change de comportement, un relancement compris.
_Avoid_: Renommage, titre raccourci, alias, étiquette

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

### Réponses rapides

**Réponse rapide** (`QuickReply`):
Un texte tout prêt, rangé sous une combinaison de touches, que le raccourci colle là où l'utilisateur est en train d'écrire dans le jeu. On en crée autant qu'on veut, le texte tient sur une ligne, et une réponse rapide n'appartient à aucun personnage. Elle existe parce qu'on répond toujours la même chose aux mêmes questions. Le mot dit ce que c'est à quelqu'un qui veut juste jouer, là où « phrase », le premier mot employé ici, ne disait pas qu'on peut la coller.
_Avoid_: Phrase, macro, modèle, texte prédéfini, message, raccourci de texte

**Collage** (`paste`):
Le geste complet d'une réponse rapide : l'ancien presse-papiers est gardé, le texte le remplace, la combinaison de collage du système est posée vers la fenêtre du jeu, puis l'ancien presse-papiers revient. Il colle et n'envoie pas, la touche Entrée restant à l'utilisateur. Comme les quatre raccourcis, il ne part que si une fenêtre Dofus est au premier plan. Voir [ADR 0012](./docs/adr/0012-une-reponse-rapide-se-colle-dans-le-jeu.md).
_Avoid_: Macro, automatisation, envoi, frappe

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

### Relais

**Relais** (`Relay`):
Le mécanisme qui envoie sur le téléphone de l'utilisateur les messages privés reçus pendant son absence, et les avis qui disent qu'il a cessé de les entendre. Il s'active au moment où l'on quitte son bureau, depuis la barre système ou depuis l'écran Relais, et ne porte que les personnages relayés. Son état actif n'est jamais persisté et repart à zéro à chaque lancement.
_Avoid_: Intégration, passerelle, pont, webhook, notification poussée

**Relayé** (`relayed`):
Attribut d'un personnage qui dit si le relais transporte ses messages privés. Coché à l'entrée dans le roster et conservé indéfiniment, comme le sexe. On relaie son personnage principal et pas ses mules, dont les messages privés n'appellent aucun retour. Voir [ADR 0011](./docs/adr/0011-relais-par-personnage.md).
_Avoid_: Suivi, surveillé, abonné, actif

**Robot** (`bot`):
Le compte Telegram par lequel le relais écrit. L'utilisateur le crée en dehors de multifus. Son jeton vit dans le trousseau du système et jamais dans le fichier de configuration, voir [ADR 0009](./docs/adr/0009-jeton-dans-le-trousseau.md).
_Avoid_: Bot, compte, application, intégration

**Salon** (`chat`):
La conversation Telegram où le relais écrit, désignée par son identifiant. Un robot ne pouvant pas écrire le premier, cet identifiant n'existe qu'après que l'utilisateur a parlé au robot.
_Avoid_: Canal, conversation, discussion, groupe, fil

**Avis** (`RelayNotice`):
Ce que le relais dit de lui-même et jamais du jeu : qu'un personnage relayé s'est déconnecté, qu'il n'entend plus rien du tout, ou que l'interrupteur vient d'être bougé. Il existe parce qu'un téléphone muet se lit « personne ne m'a écrit », alors qu'il veut souvent dire « multifus n'écoute plus ». Ne porte jamais de corps de notification. Voir [ADR 0010](./docs/adr/0010-le-relais-parle-de-lui-meme.md).
_Avoid_: Alerte, erreur, panne, notification, statut

**Essai** (`RelayTest`):
Le message que l'utilisateur demande depuis l'écran Relais pour voir arriver quelque chose sur son téléphone. Il emprunte le vrai chemin d'envoi, part que le relais soit en marche ou à l'arrêt, ne nomme aucun personnage et ne porte aucun corps. Il ne prouve pas que les bons personnages sont cochés, seulement que la chaîne jusqu'à Telegram fonctionne.
_Avoid_: Test, ping, diagnostic, vérification, démo

**Envoi du corps** (`send_body`):
Le réglage qui dit si le texte du message privé accompagne le pseudo et le type. Décoché par défaut. C'est le seul endroit du projet où un corps de notification quitte la machine, voir [ADR 0008](./docs/adr/0008-corps-relaye-sur-consentement.md).
_Avoid_: Aperçu, contenu, détail, texte

**Écran tenu éveillé** (`display_awake`):
L'état de la machine tant que le relais a quelque chose à écouter : ni extinction de l'écran faute d'activité, ni économiseur, donc ni verrouillage de session. Il ne couvre pas un geste explicite : capot fermé, la machine dort et le relais avec elle, voir [perimetre.md](./docs/perimetre.md). Il demande deux choses ensemble, le relais actif **et** au moins un personnage relayé connecté. Relais coupé, la machine dort comme d'habitude ; relais actif, il suit les personnages et non la durée de l'interrupteur : plus aucun d'eux à l'écran, il tombe, l'un d'eux revient, il est reposé. Le relais, lui, ne s'arrête que sur un raccourci. Le mot « veille » ne le désigne jamais, il appartient aux personnages.
_Avoid_: Veille, mise en veille, éveil, assertion, caffeinate
