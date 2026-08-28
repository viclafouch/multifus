# Vocabulaire

Les mots de Multifus, et rien d'autre. On en parle en français, on les écrit en anglais dans le code : l'identifiant est entre parenthèses.

**Personnage** (`Character`) : un personnage Dofus, identifié par son pseudo.

**Pseudo** (`nickname`) : le nom d'un personnage, lu dans le titre de sa fenêtre.

**Sexe** (`gender`) : homme ou femme, assigné à la main à un personnage.

**Classe** (`Class`) : la classe Dofus d'un personnage, choisie à la main parmi les douze. Croisée avec le sexe, elle donne le portrait que porte la fenêtre.

**Roster** (`Roster`) : l'ensemble des personnages connus de Multifus, connectés ou non.

**Connecté** (`online`) : se dit d'un personnage dont une fenêtre porte le pseudo en ce moment. Dofus Retro déconnecte tout seul un personnage qui ne fait rien, au bout d'un quart d'heure ou deux : sa fenêtre revient à l'écran de connexion, Multifus le voit repasser déconnecté, et le relais se tait pour lui. Sa fenêtre se tait avec : elle n'est plus la sienne, elle reprend l'icône et le bouton du jeu jusqu'à son retour. Personne n'a rien fait, et c'est le jeu qui décide.

**Fenêtre** (`GameWindow`) : l'incarnation d'un personnage à l'écran, un processus client par personnage.

**Trace** (`Trace`) : ce que Multifus a posé sur une fenêtre du jeu et n'a pas encore repris : la tête de classe, le titre court, le bouton mis à part dans la barre des tâches. Elle s'écrit quand on pose, elle s'efface quand on rend. Multifus tué la retrouve au démarrage suivant, et rend ce qu'il n'avait pas rendu : quitté, il ne reste rien de lui à l'écran.

**Focus** (`focus`) : l'action de faire passer une fenêtre au premier plan. Une fenêtre réduite en ressort.

**Agrandir** (`maximize`) : étendre une fenêtre du jeu à toute la zone de travail de son écran, sans lui faire quitter le bureau : le Dock et la barre des menus restent là sur macOS, la barre des tâches sur Windows. C'est tout ce que Multifus fait à la taille d'une fenêtre, et un réglage le fait à l'ouverture d'un client.

**Agrandir tout** (`MaximizeAll`) : agrandir d'un coup toutes les fenêtres du jeu ouvertes, connectées ou non. C'est le rattrapage de l'agrandissement à l'ouverture, pour les clients qui étaient déjà là quand Multifus a démarré. Il se demande de trois endroits, la barre système, un raccourci et les paramètres, et il n'arrive jamais tout seul. Le code dit `MaximizeAll`, l'écran dit partout « Agrandir les fenêtres ». Multifus demande l'agrandissement, il ne voit pas la fenêtre grandir : Windows accepte sans rien promettre, et le journal dit donc ce qui a été demandé, jamais ce qui est arrivé.

**En petit** (`small`) : état d'une fenêtre du jeu qui ne couvre pas la zone de travail de son écran. Windows le sait d'un mot, `IsZoomed` ; le Mac n'a pas ce mot, et Multifus y compare le cadre de la fenêtre à la zone de travail, à deux points près. Le système ne dit que ce qu'il peut jurer : une fenêtre qu'il ne confirme pas agrandie est comptée en petit, et le doute laisse le geste offert plutôt qu'il ne le retire.

**Illisible** (`readable` à faux) : l'état où Multifus ne peut pas lire les fenêtres du tout, faute d'autorisation ou parce que le système a refusé. Ce n'est pas « aucun client ouvert », et l'écran ne dit jamais l'un pour l'autre.

**Plein écran** : le mode du système, pris au bouton vert d'une fenêtre sur macOS, qui donne au client un bureau à lui. Il n'a pas d'identifiant, parce qu'il n'a pas de code : Multifus ne le donne jamais, et conseille de s'en passer. La bascule y devient un glissement d'un bureau à l'autre, et la bannière n'a pas le droit de se poser par-dessus. Le mot ne désigne que lui, jamais une fenêtre agrandie.

**Défilement** (`cycle`) : le parcours des fenêtres au raccourci, dans un ordre choisi par l'utilisateur.

**Déplacement rapide** (`Walk`) : le mécanisme qui passe au personnage suivant du défilement à chaque clic gauche dans une fenêtre de jeu. Un joueur emmène ainsi toute sa team d'une map à l'autre sans lâcher la souris. Il ne s'allume que d'un geste, jamais tout seul, et Multifus démarre toujours avec lui éteint. Il s'éteint seul dès que Multifus n'a plus une fenêtre à parcourir, les clients fermés comme revenus à l'écran de connexion : plus une fenêtre où aller, plus un clic à prendre. Son nom porte ses deux mots partout, jamais « déplacement » seul, qui se lirait comme le tirage d'une ligne du roster.

**Bascule** (`switch`) : le passage du premier plan d'une fenêtre à la suivante. Elle est finie quand le système la donne pour finie, pas quand on l'a demandée.

**Tour** (`Turn`) : un passage de Multifus sur les fenêtres du jeu, une fois par seconde. Il lit ce qui est à l'écran, pose ce qui manque, et reprend ce qui n'a plus lieu d'être.

**Visée** (`Aim`) : ce qu'un clic gauche vaut au Déplacement rapide. Le clic tombe hors du jeu, ou sur une fenêtre que le tour n'a pas donnée, ou personne n'est dans le défilement, ou le suivant est celui sur lequel on est déjà, ou bien il désigne la fenêtre où aller.

**Porte** (`ClickGate`) : ce qui décide, au moment du clic, si le clic compte. Fermée le temps d'une bascule, elle mange les clics qui arrivent trop tôt sur une fenêtre de jeu.

**Juge** (`ClickJudge`) : ce qui tient un clic pour un tout. Il décide à l'enfoncement du bouton, et le relâchement suit sa décision : mangé, un clic l'est en entier, et le jeu n'en voit jamais la moitié.

**Bannière** (`banner`) : la petite fenêtre sans bord posée devant tout le reste, qui porte la tête de classe et le pseudo du personnage sur lequel on vient d'arriver. Elle n'existe que Déplacement rapide allumé, ne se montre qu'au-dessus d'une fenêtre de jeu, et son coin se choisit dans l'écran Déplacement rapide.

**Roue** (`Wheel`) : le disque de têtes de classe qui s'ouvre au milieu de l'écran au maintien d'une combinaison, et qui se ferme dessus. Elle s'ouvre toujours au même endroit, quoi que fasse la souris : Multifus ne déplace jamais le curseur, c'est le joueur qui vient sur le disque. Ouverte, elle prend la souris et le jeu cesse de la voir : rien ne s'allume derrière le disque. Fermée, elle la rend, et le curseur la traverse comme si elle n'existait pas. Relâcher hors du disque annule, comme au centre. Elle ne s'ouvre que dans le jeu, elle montre les personnages connectés, exclus compris, et la part relâchée passe devant. Elle est figée à l'ouverture : le tour passe pendant le maintien, la roue ne bouge pas. Elle ne se ferme jamais vraiment, sa fenêtre restant là : elle s'efface, attend que la fenêtre soit vide, et se cache alors seulement, pour que l'ouverture suivante n'ait rien d'ancien à montrer. Chaque ouverture porte son numéro (`generation`), et une roue ne répond que du sien : celle qu'une plus récente a remplacée ne vise plus, ne se cache plus, ne ramène plus aucune fenêtre. L'écran et la ligne des Raccourcis l'appellent « la roue des personnages », la barre de gauche « Roue » faute de place, jamais « menu radial », qui ne dit rien du jeu.

**Part** (`Slice`) : un camembert de la roue, un personnage connecté. Toutes les parts font la même taille. Elle porte sa tête de classe et son pseudo dessous, sur une ligne coupée s'il le faut, et elle se remplit d'ambre au survol. La part de la fenêtre d'où l'on part porte déjà un fond ambré, plus pâle que le survol. Le centre de la roue porte la tête de la fenêtre où l'on est, et rien d'écrit. Une part sans classe porte le point d'interrogation du roster. Relâcher au centre ou hors du disque annule.

**Aperçu** (`preview`) : la vraie roue posée deux secondes et demie au milieu de l'écran, au bouton de l'écran Roue. Elle ne montre jamais vos personnages, toujours les mêmes faux, autant que la jauge en demande et six par défaut, et le premier fait celui d'où l'on part. Le survol y répond comme dans le jeu, mais relâcher ne ramène jamais une fenêtre : c'est un aperçu, rien n'arrive. Les faux personnages sont écrits une seule fois, dans le Rust, et le dessin de l'écran les tient du même endroit.

**Tirage** (`drag`) : l'action de prendre une ligne par sa poignée, et de la porter plus haut ou plus bas pour changer l'ordre du défilement.

**Exclu** (`excluded`) : état d'un personnage que l'utilisateur écarte à la main. Les raccourcis Fenêtre suivante et précédente le sautent, le Déplacement rapide aussi, et l'AutoFocus ne passe plus sa fenêtre devant. Ses messages privés partent comme avant. L'exclusion ne survit pas à un redémarrage de Multifus.

**Réintégrer** (`included`) : rendre à un exclu le défilement et l'AutoFocus. C'est le seul contraire d'exclure, et l'écran ne dit jamais « remettre ».

**Principal** (`main`) : le personnage qu'un raccourci ramène devant, où que l'on soit dans le jeu. Un seul à la fois, ou aucun. Il le reste déconnecté, exclu, et d'un lancement à l'autre. Être principal ne dit que cela : il défile et s'exclut comme les autres.

**Notification de jeu** (`GameNotification`) : une notification système émise par un client Dofus. Son titre porte le pseudo du destinataire, son corps décrit l'événement.

**Type de notification** (`NotificationKind`) : la catégorie de l'événement, lue dans le corps : combat, échange, groupe, craft, message privé, défi, percepteur.

**AutoFocus** (`AutoFocus`) : le mécanisme qui focus la fenêtre d'un personnage quand une notification de jeu le concerne. Il se tait pour un personnage exclu.

**Frappe** (`Press`) : un appui sur une combinaison, et ce que Multifus en fait. Elle ne vaut que dans le jeu, sauf celles du Déplacement rapide et d'Agrandir tout, qui répondent de partout et laissent les messages privés partir.

**Touche** (`key`) : une touche du clavier, gardée par sa **position** et jamais par sa lettre. `KeyW` nomme la position du W d'un QWERTY, et sur un AZERTY cette position porte un Z. Multifus arme la position, et écrit à l'écran la lettre que le clavier de l'utilisateur y a imprimée : sur un AZERTY, il affiche « Z » là où il garde `KeyW`. Le joueur lit ce qui est sur sa touche, et appuie dessus. Le Mac seul demande cette traduction, Carbon armant une position ; Windows résout déjà par la lettre, et la touche marquée W y déclenche. Les vingt-six lettres et onze signes suivent la disposition, les chiffres gardent leur chiffre : la rangée du haut d'un AZERTY rend `&` sans Maj, et personne n'appelle cette touche « esperluette ». Quand le système ne sait pas dire la lettre, la position s'écrit telle quelle.

**Mécanisme** (`Mechanisms`) : ce qu'une frappe met en marche sans toucher à une fenêtre : le Déplacement rapide, les messages privés, la réponse rapide.

**Réponse rapide** (`QuickReply`) : un texte tout prêt d'une seule ligne, rangé sous une combinaison de touches.

**Collage** (`paste`) : le geste qui pose une réponse rapide là où l'utilisateur est en train d'écrire dans le jeu.

**Messages privés** (`Relay`) : le mécanisme qui envoie sur le téléphone de l'utilisateur les messages privés reçus pendant son absence. Le code dit `relay`, l'écran dit toujours les messages privés.

**Relayé** (`relayed`) : attribut d'un personnage dont les messages privés partent sur le téléphone.

**Robot** (`bot`) : le compte Telegram par lequel Multifus écrit. L'écran l'appelle par son code, jamais par son jeton.

**Salon** (`chat`) : la conversation Telegram où Multifus écrit, désignée par son identifiant.

**Avis** (`relayNoticeSent`) : ce que Multifus dit de lui-même et jamais du jeu, par exemple qu'il a cessé d'écouter.

**Écran tenu éveillé** (`displayAwake`) : l'état de la machine que Multifus maintient pour ne pas devenir sourd, ni extinction de l'écran, ni verrouillage de session.
