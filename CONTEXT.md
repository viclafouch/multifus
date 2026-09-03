# Vocabulaire

Les mots de Multifus, et rien d'autre. On en parle en français, on les écrit en anglais dans le code : l'identifiant est entre parenthèses.

**Langue** (`Language`) : la langue dans laquelle Multifus parle, le français, l'anglais ou l'espagnol. Elle n'a rien à voir avec celle du client Dofus, que Multifus ne lit pas et dont il ne se sert pour rien : un joueur peut jouer en anglais et lire Multifus en français. Elle se prend à la langue du système au premier lancement, et elle est fixée pour la durée du lancement : la changer recharge les quatre fenêtres de Multifus d'un coup, la fenêtre revient sur l'écran où l'on était, et les fenêtres du jeu ne bougent pas.

**Personnage** (`Character`) : un personnage Dofus, identifié par son pseudo.

**Pseudo** (`nickname`) : le nom d'un personnage, lu dans le titre de sa fenêtre.

**Sexe** (`gender`) : homme ou femme, assigné à la main à un personnage.

**Classe** (`Class`) : la classe Dofus d'un personnage, choisie à la main parmi les douze. Croisée avec le sexe, elle donne le portrait que porte la fenêtre.

**Couleur** (`Color`) : une des douze couleurs données à la main à un personnage, ou aucune. Le portrait dit la classe, la couleur dit qui : elle sépare six Sadidas femmes que le portrait ne sépare plus. Elle se voit au bord de toute ligne qui porte un personnage, celles du roster comme celles des Raccourcis et des Messages privés, en fond de part de roue, au bord de la bannière, et dans l'anneau du bouton de la barre des tâches sur Windows, jamais sur la bordure du médaillon, qui dit l'état. Elle ne se nomme qu'à deux endroits : le dialogue où on la choisit, et le journal, qui est du texte. Partout ailleurs elle se voit et ne se lit pas : le pseudo est déjà là pour dire qui est qui, et un joueur se moque de savoir que sa couleur s'appelle Sapin. Les douze se calculent, elles ne se choisissent pas : elles se séparent deux à deux en vision normale comme sous daltonisme, et aucune ne s'approche du vert du connecté ni de l'ambre d'une part sans couleur. Deux personnages ont le droit de porter la même : la grille montre creuse une couleur déjà prise, et dit qui la porte, mais elle ne la refuse pas. Elle n'arrive jamais toute seule, et un roster de deux personnages n'en a pas besoin.

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

**Réveil** (`wake`) : ce qui fait partir un tour avant l'heure. Le système prévient Multifus qu'une fenêtre du jeu vient d'apparaître, de changer de titre ou de disparaître, et le tour part tout de suite au lieu d'attendre la seconde. Il prévient aussi qu'une autre application est passée devant : ce réveil-là passe le mot au fil des raccourcis, qui arme ou rend sans attendre le tour, parce qu'un joueur clique sur son client et frappe dans la foulée. Le crochet du système ne fait que passer le mot, il ne lit ni ne pose rien lui-même : sur le Mac il parle depuis le fil de l'interface, qu'aucun travail n'a le droit de retenir. Un réveil demandé pendant qu'un tour tourne n'est jamais perdu, il sert le tour suivant, et une rafale de réveils ne vaut qu'un tour. La seconde reste sous tout ça : elle rattrape ce qu'aucun événement ne dit, un titre changé sans que le système prévienne, une autorisation retirée, un client tué de force. Entre deux tours il y a toujours un repos, réveil compris, pour qu'une rafale ne les fasse pas se suivre sans reprendre souffle.

**Visée** (`Aim`) : ce qu'un clic gauche vaut au Déplacement rapide. Le clic tombe hors du jeu, ou sur une fenêtre que le tour n'a pas donnée, ou personne n'est dans le défilement, ou le suivant est celui sur lequel on est déjà, ou bien il désigne la fenêtre où aller.

**Porte** (`ClickGate`) : ce qui décide, au moment du clic, si le clic compte. Fermée le temps d'une bascule, elle mange les clics qui arrivent trop tôt sur une fenêtre de jeu. Tenue le temps d'une roue, elle mange les deux boutons où qu'ils tombent, et elle les compte : la roue lit ce compte et se ferme au premier.

**Juge** (`ClickJudge`) : ce qui tient un clic pour un tout. Il décide à l'enfoncement du bouton, et le relâchement suit sa décision : mangé, un clic l'est en entier, et le jeu n'en voit jamais la moitié. Il garde une place par bouton, le gauche et le droit.

**Écoute des clics** (`Clicks`) : ce qui tient le crochet du système, et la porte avec. Deux mécanismes la demandent (`Asker`), le Déplacement rapide allumé et la roue ouverte : le premier qui demande ouvre le crochet, le dernier qui rend le ferme. L'autorisation refusée, le crochet ne s'ouvre pas : le Déplacement rapide ne s'allume pas, et la roue s'ouvre quand même, sans rien attendre du clic. Le Déplacement rapide éteint oublie les fenêtres qu'il parcourait, pour qu'un clic pris pendant une roue n'aille en réveiller aucune.

**Bannière** (`banner`) : la petite fenêtre sans bord posée devant tout le reste, qui porte la tête de classe et le pseudo du personnage sur lequel on vient d'arriver. Elle n'existe que Déplacement rapide allumé, ne se montre qu'au-dessus d'une fenêtre de jeu, et son coin se choisit dans l'écran Déplacement rapide.

**Roue** (`Wheel`) : le disque de têtes de classe qui s'ouvre au milieu de l'écran au maintien d'une combinaison, et qui se ferme dessus. Elle s'ouvre toujours au même endroit, quoi que fasse la souris : Multifus ne déplace jamais le curseur, c'est le joueur qui vient sur le disque. Ouverte, elle prend la souris et le jeu cesse de la voir : rien ne s'allume derrière le disque. Fermée, elle la rend, et le curseur la traverse comme si elle n'existait pas. Relâcher hors du disque annule, comme au centre. Un clic vaut un relâchement, du bouton gauche comme du droit : la part cliquée passe devant, et un clic au centre ou hors du disque annule. Ce clic-là est mangé avant tout le monde, le crochet du système le prenant le premier : ni le jeu ni Multifus ne le voient, et Multifus ne saute pas devant. Elle ne s'ouvre que dans le jeu, elle montre les personnages connectés, exclus compris, et la part relâchée passe devant. Elle est figée à l'ouverture : le tour passe pendant le maintien, la roue ne bouge pas. Elle ne se ferme jamais vraiment, sa fenêtre restant là : elle s'efface, attend que la fenêtre soit vide, et se cache alors seulement, pour que l'ouverture suivante n'ait rien d'ancien à montrer. Chaque ouverture porte son numéro (`generation`), et une roue ne répond que du sien : celle qu'une plus récente a remplacée ne vise plus, ne se cache plus, ne ramène plus aucune fenêtre. Elle porte le même nom partout, « la roue des personnages », l'écran, la ligne des Raccourcis, la barre de gauche et le menu de la barre des menus, jamais « Roue » seule ni « menu radial », qui ne disent rien du jeu.

**Part** (`Slice`) : un camembert de la roue, un personnage connecté. Toutes les parts font la même taille. Elle porte sa tête de classe et son pseudo dessous, sur une ligne coupée s'il le faut, et elle se remplit d'ambre au survol. La part de la fenêtre d'où l'on part porte déjà un fond ambré, plus pâle que le survol. Le centre de la roue porte la tête de la fenêtre où l'on est, et rien d'écrit. Une part sans classe porte le point d'interrogation du roster. Relâcher au centre ou hors du disque annule.

**Aperçu** (`preview`) : la vraie roue posée deux secondes et demie au milieu de l'écran, au bouton de l'écran Roue. Elle ne montre jamais vos personnages, toujours les mêmes faux, autant que la jauge en demande et six par défaut, et le premier fait celui d'où l'on part. Le survol y répond comme dans le jeu, mais relâcher ne ramène jamais une fenêtre : c'est un aperçu, rien n'arrive. Il ne tient pas la porte, et un clic ne l'arrête pas : il s'en va tout seul, au bout de ses deux secondes et demie. Les faux personnages sont écrits une seule fois, dans le Rust, et le dessin de l'écran les tient du même endroit.

**Tableau des runes** (`RuneTable`) : la table des poids de runes que Multifus pose sur la fenêtre du jeu, au raccourci ou à la barre système. Elle ne se montre que dans le jeu et se cache avec lui, mais elle ne se ferme qu'à la croix ou au raccourci : le tour ne la retire jamais. Elle se prend n'importe où, sauf sur sa croix, et garde sa place d'un lancement à l'autre, mesurée depuis le coin haut-gauche de la fenêtre du jeu, qu'elle suit quand celle-ci se déplace. Sa taille, elle, se compte en points de l'écran et ne dépend pas de la fenêtre : le tableau a le droit de déborder du jeu comme de l'écran, et rien ne le retient, la main le portant où elle veut. Perdu de vue, il se rappelle au bouton de l'écran Tableau des runes ou à la ligne de la barre système, qui jettent la place gardée et le reposent au coin haut droit de la fenêtre. La jauge de l'écran grossit le tableau d'un bloc, écriture comprise, et jamais sa largeur seule : il est dessiné pour la taille la plus étroite et la page se met à l'échelle de la fenêtre qu'on lui donne. La hauteur ne se règle pas ; le tableau dit sa forme, et Multifus en tire la hauteur. Une seconde jauge règle sa transparence, de zéro, le tableau qui couvre le jeu, à cent, le tableau fantôme. La jauge se lit de zéro à cent, mais elle ne va pas jusqu'au bout : poussé à fond, le tableau garde un cinquième de sa présence, se lit encore et prend toujours les clics, un tableau invisible ne servant à personne. On la retire à la croix ou au raccourci, jamais à la jauge. Pendant que la jauge bouge, l'aperçu suit à chaque cran, et le fichier ne s'écrit qu'une fois la jauge lâchée. Elle s'accroche à une seule fenêtre, celle où on l'a ouverte, sauf réglage contraire ; l'interrupteur bougé tableau posé prend effet sur-le-champ, et s'il s'éteint le tableau attend la prochaine fenêtre qui passera devant. Elle ne se pose pas sur un client en plein écran, reconnu à ce qu'il couvre l'écran entier d'un écran qui réserve une place à la barre des menus ou à la barre des tâches. La barre système et le raccourci la cachent d'un coup, aperçu compris ; Échap et la croix ne ferment que l'aperçu et rendent sa place au tableau posé. Elle prend ses clics elle-même et ne touche pas à l'écoute des clics : le jeu reçoit tout ce qui ne tombe pas sur elle. Un clic dessus ne ramène jamais Multifus devant, et le jeu garde le premier plan pendant tout le déplacement : sur le Mac elle porte pour cela un panneau non activant, sur Windows le style `WS_EX_NOACTIVATE` que la fenêtre non focusable lui donne déjà. Un clic sec ne fait rien du tout ; on maintient, on déplace, on lâche. Seule la croix répond à un clic. L'écran l'appelle « le tableau des runes » partout, jamais « la table », « la plaque » ni « les poids ».

**Ancre** (`Anchor`) : la fenêtre du jeu à laquelle le tableau des runes répond. Il en existe trois : toutes les fenêtres, celle-ci et pas une autre, ou la première qui passera devant. La troisième est ce qu'un tableau ouvert hors du jeu attend, et elle devient la deuxième dès qu'une fenêtre arrive.

**Aperçu du tableau** (`preview`) : le vrai tableau des runes posé au milieu de la fenêtre de Multifus, au bouton de l'écran Tableau des runes. Il se déplace comme l'autre, mais il ne retient rien : sa place ne se garde pas, et la suivante repart du milieu. Il s'efface dès que Multifus n'est plus au premier plan, et revient avec lui. Il ne part pas tout seul, et se ferme à Échap ou à sa croix. Ouvert par-dessus un tableau posé sur le jeu, il prend sa place et la lui rend en se fermant. Échap ne vaut que pour lui : le tableau posé sur le jeu ne l'entend jamais, Dofus en ayant besoin.

**Cadre** (`ScreenFrame`) : où est une fenêtre du jeu et quelle taille elle fait, en points de l'écran et non en pixels. Le Mac le lit par l'Accessibilité, qui parle déjà en points ; Windows le lit en pixels et le divise par l'échelle de la fenêtre. C'est la seule mesure d'une fenêtre que Multifus prend, et le tableau des runes est seul à la demander.

**Tirage** (`drag`) : l'action de prendre une ligne par sa poignée, et de la porter plus haut ou plus bas pour changer l'ordre du défilement. C'est aussi le geste qui déplace le tableau des runes : il se prend en entier, sauf là où le clic est arrêté, et un geste plus court que quatre points ne déplace rien et n'écrit rien.

**Exclu** (`excluded`) : état d'un personnage que l'utilisateur écarte à la main. Les raccourcis Fenêtre suivante et précédente le sautent, le Déplacement rapide aussi, et l'AutoFocus ne passe plus sa fenêtre devant. Ses messages privés partent comme avant. L'exclusion ne survit pas à un redémarrage de Multifus.

**Réintégrer** (`included`) : rendre à un exclu le défilement et l'AutoFocus. C'est le seul contraire d'exclure, et l'écran ne dit jamais « remettre ».

**Principal** (`main`) : le personnage qu'un raccourci ramène devant, où que l'on soit dans le jeu. Un seul à la fois, ou aucun. Il le reste déconnecté, exclu, et d'un lancement à l'autre. Être principal ne dit que cela : il défile et s'exclut comme les autres.

**Notification de jeu** (`GameNotification`) : une notification système émise par un client Dofus. Son titre porte le pseudo du destinataire, son corps décrit l'événement.

**Type de notification** (`NotificationKind`) : la catégorie de l'événement, lue dans le corps : combat, échange, groupe, craft, message privé, défi, percepteur.

**AutoFocus** (`AutoFocus`) : le mécanisme qui focus la fenêtre d'un personnage quand une notification de jeu le concerne. Il se tait pour un personnage exclu.

**Frappe** (`Press`) : un appui sur une combinaison, et ce que Multifus en fait. Elle ne vaut que dans le jeu, sans exception : hors du jeu, elle est refusée et le journal le dit.

**Le jeu est devant** (`game_in_front`) : l'état où la fenêtre au premier plan est celle d'un personnage. C'est un seul état, lu d'une seule manière, et trois mécanismes en dépendent : l'Armement, la bannière et la roue. Un client resté à l'écran de connexion n'y est pas, faute de pseudo à son titre.

**Armement** (`arm`) : la combinaison prise au système, qui la donne alors à Multifus et à personne d'autre. Elle n'est prise que pendant que le jeu est devant, et rendue dès qu'on en sort : ailleurs, la touche appartient à l'application où l'on écrit, et un raccourci du jeu ne coûte rien au reste de la machine. La règle est celle de la Frappe, avancée de la garde au registre du système. Le refus reste pour la course, une frappe partie juste avant que la combinaison soit rendue. Un rendu que le système refuse ne se croit jamais fait : les combinaisons restent armées, et le premier plan suivant redemande.

**Touche** (`key`) : une touche du clavier, gardée par sa **position** et jamais par sa lettre. `KeyW` nomme la position du W d'un QWERTY, et sur un AZERTY cette position porte un Z. Multifus arme la position, et écrit à l'écran la lettre que le clavier de l'utilisateur y a imprimée : sur un AZERTY, il affiche « Z » là où il garde `KeyW`. Le joueur lit ce qui est sur sa touche, et appuie dessus. Le Mac seul demande cette traduction, Carbon armant une position ; Windows résout déjà par la lettre, et la touche marquée W y déclenche. Les vingt-six lettres et onze signes suivent la disposition, les chiffres gardent leur chiffre : la rangée du haut d'un AZERTY rend `&` sans Maj, et personne n'appelle cette touche « esperluette ». Quand le système ne sait pas dire la lettre, la position s'écrit telle quelle.

**Mécanisme** (`Mechanisms`) : ce qu'une frappe met en marche sans toucher à une fenêtre : le Déplacement rapide, les messages privés, la réponse rapide.

**Réponse rapide** (`QuickReply`) : un texte tout prêt d'une seule ligne, rangé sous une combinaison de touches. Celle qu'un premier lancement offre est écrite en français, quelle que soit la langue de Multifus : une réponse rapide se tape dans le jeu, et la langue du client Dofus n'est pas celle de Multifus.

**Collage** (`paste`) : le geste qui pose une réponse rapide là où l'utilisateur est en train d'écrire dans le jeu.

**Messages privés** (`Relay`) : le mécanisme qui envoie sur le téléphone de l'utilisateur les messages privés reçus pendant son absence. Le code dit `relay`, l'écran dit toujours les messages privés.

**Relayé** (`relayed`) : attribut d'un personnage dont les messages privés partent sur le téléphone.

**Robot** (`bot`) : le compte Telegram par lequel Multifus écrit. L'écran l'appelle par son code, jamais par son jeton.

**Salon** (`chat`) : la conversation Telegram où Multifus écrit, désignée par son identifiant.

**Avis** (`relayNoticeSent`) : ce que Multifus dit de lui-même et jamais du jeu, par exemple qu'il a cessé d'écouter.

**Écran tenu éveillé** (`displayAwake`) : l'état de la machine que Multifus maintient pour ne pas devenir sourd, ni extinction de l'écran, ni verrouillage de session.
