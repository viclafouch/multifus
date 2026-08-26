# Vocabulaire

Les mots de Multifus, et rien d'autre. On en parle en français, on les écrit en anglais dans le code : l'identifiant est entre parenthèses.

**Personnage** (`Character`) : un personnage Dofus, identifié par son pseudo.

**Pseudo** (`nickname`) : le nom d'un personnage, lu dans le titre de sa fenêtre.

**Sexe** (`gender`) : homme ou femme, assigné à la main à un personnage.

**Classe** (`Class`) : la classe Dofus d'un personnage, choisie à la main parmi les douze. Croisée avec le sexe, elle donne le portrait que porte la fenêtre.

**Roster** (`Roster`) : l'ensemble des personnages connus de Multifus, connectés ou non.

**Connecté** (`online`) : se dit d'un personnage dont une fenêtre porte le pseudo en ce moment. Dofus Retro déconnecte tout seul un personnage qui ne fait rien, au bout d'un quart d'heure ou deux : sa fenêtre revient à l'écran de connexion, Multifus le voit repasser déconnecté, et le relais se tait pour lui. Sa fenêtre se tait avec : elle n'est plus la sienne, elle reprend l'icône et le bouton du jeu jusqu'à son retour. Personne n'a rien fait, et c'est le jeu qui décide.

**Fenêtre** (`GameWindow`) : l'incarnation d'un personnage à l'écran, un processus client par personnage.

**Trace** (`Trace`) : ce que Multifus a posé sur une fenêtre du jeu et n'a pas encore repris — la tête de classe, le titre court, le bouton mis à part dans la barre des tâches. Elle s'écrit quand on pose, elle s'efface quand on rend. Multifus tué la retrouve au démarrage suivant, et rend ce qu'il n'avait pas rendu : quitté, il ne reste rien de lui à l'écran.

**Focus** (`focus`) : l'action de faire passer une fenêtre au premier plan. Une fenêtre réduite en ressort.

**Défilement** (`cycle`) : le parcours des fenêtres au raccourci, dans un ordre choisi par l'utilisateur.

**Déplacement** (`Walk`) : le mécanisme qui passe au personnage suivant du défilement à chaque clic gauche dans une fenêtre de jeu. Il ne s'allume que d'un geste, jamais tout seul, et Multifus démarre toujours Déplacement éteint.

**Bascule** (`switch`) : le passage du premier plan d'une fenêtre à la suivante. Elle est finie quand le système la donne pour finie, pas quand on l'a demandée.

**Porte** (`ClickGate`) : ce qui décide, au moment du clic, si le clic compte. Fermée le temps d'une bascule, elle mange les clics qui arrivent trop tôt sur une fenêtre de jeu.

**Bannière** (`banner`) : la petite fenêtre sans bord posée devant tout le reste, qui porte la tête de classe et le pseudo du personnage sur lequel on vient d'arriver. Elle n'existe que Déplacement allumé, ne se montre qu'au-dessus d'une fenêtre de jeu, et son coin se choisit dans l'écran Déplacement.

**Tirage** (`drag`) : l'action de prendre une ligne par sa poignée, et de la porter plus haut ou plus bas pour changer l'ordre du défilement.

**De côté** (`asleep`) : état d'un personnage retiré du défilement.

**Inversion** (`swap`) : l'action de mettre de côté tous les personnages d'un sexe et de remettre ceux de l'autre dans le défilement.

**Notification de jeu** (`GameNotification`) : une notification système émise par un client Dofus. Son titre porte le pseudo du destinataire, son corps décrit l'événement.

**Type de notification** (`NotificationKind`) : la catégorie de l'événement, lue dans le corps : combat, échange, groupe, craft, message privé, défi, percepteur.

**AutoFocus** (`AutoFocus`) : le mécanisme qui focus la fenêtre d'un personnage quand une notification de jeu le concerne.

**Réponse rapide** (`QuickReply`) : un texte tout prêt d'une seule ligne, rangé sous une combinaison de touches.

**Collage** (`paste`) : le geste qui pose une réponse rapide là où l'utilisateur est en train d'écrire dans le jeu.

**Messages privés** (`Relay`) : le mécanisme qui envoie sur le téléphone de l'utilisateur les messages privés reçus pendant son absence. Le code dit `relay`, l'écran dit toujours les messages privés.

**Relayé** (`relayed`) : attribut d'un personnage dont les messages privés partent sur le téléphone.

**Robot** (`bot`) : le compte Telegram par lequel Multifus écrit. L'écran l'appelle par son code, jamais par son jeton.

**Salon** (`chat`) : la conversation Telegram où Multifus écrit, désignée par son identifiant.

**Avis** (`relayNoticeSent`) : ce que Multifus dit de lui-même et jamais du jeu, par exemple qu'il a cessé d'écouter.

**Écran tenu éveillé** (`displayAwake`) : l'état de la machine que Multifus maintient pour ne pas devenir sourd, ni extinction de l'écran, ni verrouillage de session.
