# Le relais se règle par personnage, contrairement à l'AutoFocus

Le périmètre refusait « Les réglages de relais par personnage. Même refus que pour l'AutoFocus, et pour la même raison ». Cette décision revient dessus.

## Le problème

On joue six clients. Un seul reçoit des messages privés qui appellent un retour, le personnage principal. Les cinq autres sont des mules, et ce qu'on leur écrit ne fait pas quitter la cuisine.

Relayer tout le monde rend le relais bruyant, et un relais bruyant finit coupé. Coupé, il ne sert à rien du tout. C'est la même pente qu'une notification système qu'on désactive parce qu'elle sonne trop.

## Pourquoi le refus initial ne s'applique pas

Le refus des réglages d'AutoFocus par personnage porte sur une grandeur précise, et le périmètre la chiffre : « une grille de sept icônes par personnage, soit quarante-deux boutons pour six comptes, avec la logique de synchronisation global/local qui va avec ».

Le relais par personnage est **une case par ligne**. Pas sept, une. Il n'y a pas de réglage global à synchroniser avec un réglage local, puisqu'il n'existe pas de version globale de cette question. Et l'écran dessine déjà une ligne par personnage, portant un sexe et un interrupteur de défilement.

Quarante-deux boutons et une colonne de cases ne sont pas le même objet. Le refus a été recopié par analogie, sur un mot, et l'analogie ne tient pas.

## Décision

`relayed` est un attribut de personnage. **Persisté indéfiniment**, comme le sexe et pour la même raison : quel personnage est le principal ne change pas d'une session à l'autre, et le ressaisir chaque soir serait un réglage à visiter, ce que le principe directeur refuse.

Un personnage entre dans le roster **relayé**. Le défaut sûr est de tout relayer : un message perdu est la pire panne de cette fonctionnalité, un message de trop n'est qu'un buzz.

Le réglage vit sur l'écran Relais et pas sur l'écran Personnages, dont les lignes portent déjà trois commandes.

## Le piège de l'ADR 0004, et ce qui le désamorce

L'[ADR 0004](./0004-veille-ephemere-sexe-persiste.md) garde la veille pour la session seule, avec un motif qui vise droit ici : « une exclusion persistée que l'on a oubliée devient un piège : le défilement saute un personnage sans que l'on comprenne pourquoi, des semaines plus tard ».

Le même piège existe, et il coûte plus cher : un principal décoché il y a six semaines fait perdre un vrai message privé, en silence.

Ce n'est pas la persistance qui le désamorce, c'est un refus. **Le relais refuse de s'activer quand plus aucun personnage n'est relayé**, et l'écran dit pourquoi. L'état « le relais est armé et ne peut rien transporter » n'existe donc pas. Un décochage partiel reste possible et reste visible, l'écran Relais listant les personnages avec leur case.

**Et le décochage du dernier personnage pendant que le relais tourne l'arrête.** Le refus ci-dessus ne gardait que l'activation, ce qui laissait revenir par la porte de derrière l'état que cette section vient de déclarer inexistant. Trois règles se rencontrent ici : celle-là, « seul un raccourci arrête le relais », et la règle d'interface qui interdit de désactiver un bouton plutôt que d'expliquer. C'est la deuxième qui cède, et de peu : elle vise le **minuteur**, un relais qui s'arrêterait tout seul pendant une absence. Décocher la dernière case est un geste délibéré, fait au clavier, dans la fenêtre, sous les yeux de son auteur. Le journal écrit l'arrêt avec ce motif-là, distinct du raccourci et de la barre système.

## Ce que ça coûte

**Un champ de plus dans le fichier de configuration**, sur chaque personnage. Un fichier écrit par une version antérieure n'en a pas, et un champ absent prend son défaut, donc tout le monde est relayé, ce qui est le comportement sûr.

**Un écran de plus dans le rail et dans le menu de la barre système**, qui passent de quatre à cinq. L'écran Relais devait exister de toute façon pour coller le jeton.

## Ce qui reste refusé

Les réglages de relais **par type de notification**, qui restent le refus d'origine du périmètre avec son motif d'origine.

Réemployer la veille pour dire qui est relayé. CONTEXT.md et le plan écrivent qu'un personnage en veille est relayé comme les autres, et lier les deux ferait taire une mule qu'on a seulement sortie du défilement pour jouer plus confortablement.
