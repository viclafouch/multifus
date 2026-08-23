# Le relais dit aussi quand il a cessé d'entendre

Le périmètre écrit « Le message privé seul, codé en dur ». Cette décision ajoute une seconde chose que le relais envoie, et dit pourquoi ce n'est pas la même question.

## Le problème

Le relais devient muet dans quatre cas, et dans les quatre l'utilisateur est loin de sa machine et ne peut pas le savoir.

**Dofus déconnecte un client resté inactif un quart d'heure.** C'est le cas dominant, et il n'est pas accidentel : il se produit à tous les coups, sur un minuteur. On part faire la cuisine, personne n'écrit pendant quinze minutes, le jeu ferme la session, et à partir de là plus aucun message privé ne peut arriver.

**L'autorisation d'Accessibilité peut être retirée** à tout moment depuis les réglages du système, et l'écoute des bannières s'arrête au tour de balayage suivant.

**La session peut se verrouiller quand même**, si l'économiseur d'écran démarre là où l'assertion d'énergie ne l'a pas empêché.

**Tous les clients peuvent se fermer**, une mise à jour du jeu, un plantage, une coupure de connexion.

Dans les quatre, le téléphone se tait. Et l'[ADR 0007](./0007-telegram-plutot-que-whatsapp-ou-ntfy.md) a déjà tranché ce que vaut un silence : « un relais auquel on fait confiance et qui rate une livraison est pire qu'un relais absent : le silence se lit comme personne ne m'a écrit ». C'est le motif qui a écarté ntfy. Le refuser à un service et l'accepter de sa propre implantation ne tient pas.

## Pourquoi ce n'est pas ce que le périmètre refuse

La phrase « Le message privé seul, codé en dur » refuse de relayer **les six autres types de notification de jeu**, combat, échange, groupe, défi, craft, percepteur. Le motif est écrit à côté : sept interrupteurs de plus pour un besoin qui ne s'est pas présenté.

Un avis ne fait pas partie de ces sept. Ce n'est pas une notification de jeu, c'est multifus qui parle de lui-même, et il n'ajoute aucun interrupteur puisqu'il n'est pas réglable. Le périmètre dit par ailleurs « Le relais dit s'il faut revenir », et un quart d'heure de déconnexion est exactement le moment où il faut revenir.

## Décision

Le relais envoie un **avis** quand il cesse d'entendre. Deux cas, auxquels s'est ajoutée depuis la bascule de l'interrupteur, voir plus bas :

```
multifus
Maître Forgeron s'est déconnecté.
```

```
multifus
Plus aucun personnage relayé n'est connecté.
```

Un avis part une fois par événement et ne se répète pas. Il ne porte **aucun corps de notification**, ce qui laisse la règle de l'[ADR 0006](./0006-journal-sur-disque.md) et celle de l'[ADR 0008](./0008-corps-relaye-sur-consentement.md) exactement où elles sont. Il porte un pseudo, ce que le fichier de configuration porte déjà.

**Un balayage produit au plus un message, et les deux phrases peuvent y voyager ensemble.**

```
multifus
Maître Forgeron s'est déconnecté.
Plus aucun personnage relayé n'est connecté.
```

Deux messages séparés diraient deux fois la même chose dans le cas dominant, un seul personnage coché qui tombe au quart d'heure. Et ils deviendraient une rafale dans le cas de l'autorisation retirée, plus haut : six personnages relayés passent hors ligne au même balayage, ce qui ferait sept messages en une seconde, contre une limite Telegram de l'ordre d'un par seconde. Les phrases ne changent pas, leur emballage si.

**« Une fois par événement » se lit sur le front et jamais sur l'état.** Un personnage qui se reconnecte puis retombe produit deux avis, un par déconnexion, et c'est juste : le téléphone doit refléter chaque fait. Ce qui est interdit est de répéter l'avis à chaque tour de balayage tant qu'il reste hors ligne. Accrocher l'avis à la transition que `apply_windows` calcule déjà donne les deux propriétés sans mémoire supplémentaire.

**L'activation est un troisième déclencheur.** Le relais allumé alors qu'aucun personnage relayé n'est connecté n'écoute rien, et aucune transition ne se produira jamais pour le dire. L'avertissement part donc tout de suite, pendant que le téléphone est encore dans la main. Sans ça, l'utilisateur part avec un relais armé et sourd, ce qui est très exactement la panne que cette décision existe pour empêcher.

**Mais il voyage dans la confirmation d'activation et jamais seul, ce qui n'était pas le cas au départ.** Envoyé seul, ce téléphone qui affichait « Plus aucun personnage relayé n'est connecté » à la seconde où l'on active se lisait comme une panne, et non comme un relais qui vient de démarrer. Toute bascule de l'interrupteur écrit donc maintenant sur le téléphone, « Relais activé » ou « Relais désactivé », et l'avertissement est la seconde ligne de la première. La confirmation est ce que l'utilisateur attend en tenant son téléphone ; l'avertissement est ce qu'il doit lire ensuite.

**Le relais ne s'arrête pas pour autant.** Seul un des quatre raccourcis le coupe, et un relais qui s'arrêterait tout seul serait le minuteur que le plan refuse. L'écran tenu éveillé, lui, tombe : il n'a plus rien à garder lisible, voir CONTEXT.md.

## Ce que ça ne coûte pas

La détection est déjà écrite. Le balayage tourne toutes les trois secondes, `extract_nickname` ne reconnaît un pseudo que devant `- Dofus`, et un client déconnecté perd le sien dans le titre de sa fenêtre. Le personnage passe hors ligne et `CharacterOffline` part au journal sans une ligne de plus. Il n'y a rien à écouter en plus, seulement quelque chose à dire.

## Ce que ça coûte

**Un second type de message sur le téléphone**, donc un salon qui n'est plus une file de messages privés purs. C'est assumé : un salon qui ne contient que des messages privés et qui reste vide ne dit pas s'il est vide parce que personne n'écrit ou parce que le relais est mort.

**Un pseudo de plus qui quitte la machine.** L'avis de déconnexion nomme le personnage. Sans le pseudo il ne servirait à rien avec plusieurs personnages relayés, et le nom d'un personnage n'est pas de la même nature que le texte qu'une personne réelle a écrit.

## Ce qui reste refusé

Un avis au retour, du type « je réentends ». Il doublerait le trafic pour dire ce que le premier avis a déjà rendu inutile : une fois qu'on sait qu'on est déconnecté, on rentre.

Un avis pour chaque changement d'état de multifus. La liste ne s'allonge pas sans un besoin constaté, exactement comme pour les sept types. La bascule de l'interrupteur est le seul besoin qui se soit présenté, et il était réel : l'avertissement du troisième déclencheur, envoyé seul, se lisait comme une panne. Tout le reste, l'appariement, le déliement, la remise à zéro, se dit dans la fenêtre et pas sur le téléphone.
