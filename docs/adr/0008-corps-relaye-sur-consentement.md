# Le corps d'un message privé quitte la machine sur consentement explicite

L'[ADR 0006](./0006-journal-sur-disque.md) interdit à un corps de notification d'entrer dans le journal, sous aucune forme, ni tronqué ni masqué. Le relais demande le contraire : le corps est ce qu'il transporte. Cette décision dit comment les deux règles tiennent ensemble.

## Le problème

Sans le corps, le relais annonce « Maître Forgeron, message privé » et rien d'autre. L'utilisateur sait qu'on lui écrit, il ne sait pas si ça valait de quitter sa cuisine, donc il revient à chaque fois et le relais n'a servi à rien.

Avec le corps, un texte écrit par une personne réelle part chez un tiers. C'est exactement la phrase de l'ADR 0006, retournée : là-bas elle interdisait, ici elle est la fonctionnalité.

## Pourquoi ce n'est pas une contradiction

Les deux canaux n'ont pas la même exposition, et ce sont deux propriétés distinctes qui les séparent.

Le journal est un fichier qui vit des semaines sur le disque, qui se copie dans le presse-papiers d'un seul clic et qui finit collé dans un rapport de bug. Sa valeur pour le corps était purement diagnostique, et l'ADR 0006 a jugé qu'aucune valeur de diagnostic ne payait ce prix.

Le relais est un canal vivant, adressé, à destination unique, que l'utilisateur a configuré lui-même vers un salon qu'il possède. Le corps n'y est pas un résidu utile au débogage, il est la charge utile demandée. Et rien ne s'y accumule que l'utilisateur ne voie.

## Décision

Le relais envoie toujours le pseudo et le type. Il n'envoie le corps que si le réglage `send_body` est vrai, et **ce réglage est faux par défaut**.

Le message qui part tient sur deux ou trois lignes, sans mise en forme :

```
Maître Forgeron
Message privé
de Toto : tu peux me forger un tir critique ?
```

La troisième ligne n'existe que si l'envoi du corps est coché. Aucun `parse_mode` n'est demandé à Telegram : un corps de jeu contenant une astérisque ou un souligné casserait l'analyse Markdown et Telegram rejetterait le message entier.

**La règle de l'ADR 0006 ne bouge pas d'un pouce.** Aucun événement de journal produit par le relais ne porte de corps, y compris `RelaySent` et y compris `RelayFailed`. Un test compare la liste exacte des champs de ces événements, comme celui qui garde déjà l'événement de notification, plutôt que de dépendre de la mémoire de qui relit le code.

Le réglage vit dans l'écran Relais et nulle part ailleurs. Il n'est pas dans le menu de la barre système : on ne décide pas de la vie privée d'un message en passant, entre deux clients Dofus, et ce menu est réservé à ce qu'on bascule en jouant.

## Ce que ça coûte

**Un réglage de plus dans une application qui en refuse.** L'arbitrage est le même que pour le démarrage avec la session : il se règle une fois pour toutes et n'entre jamais dans l'usage quotidien. Le principe directeur vise les réglages qu'on visite, pas ceux qu'on pose.

**Le relais est moins utile décoché**, et c'est assumé. Un premier lancement qui enverrait le texte de messages privés sans l'avoir demandé serait un défaut, pas une commodité.

**Le corps est complet sur macOS, et c'est mesuré.** La crainte était que le corps, lu dans l'élément de texte dessiné dans la bannière, ne porte que ce qui tient à l'écran, points de suspension compris. Six bannières de 30, 60, 90, 140, 240 et 400 caractères ont été postées et relues par un observateur d'accessibilité : `AXValue` a rendu les six longueurs exactes, sans troncature et sans points de suspension. Ce que la bannière montre et ce que l'arbre porte sont deux choses différentes.

L'écran a donc le droit de promettre le message entier quand l'envoi du corps est coché, sur les deux systèmes.

## Ce qui reste refusé

Un aperçu partiel, du type « les quarante premiers caractères ». Trois états au lieu de deux, pour une protection qui n'en est pas une : le début d'un message privé est justement ce qu'il contient de plus identifiant.
