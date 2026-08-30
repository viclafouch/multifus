# La couture du Tour

Le Tour tourne une fois par seconde et n'a pas un test. Huit étapes dans
`tick`, et trois d'entre elles prennent l'`AppHandle` : rien ne peut les jouer
hors d'une application Tauri vivante. L'ordre des étapes, et le fait que
l'instantané ne parte qu'à un vrai changement, ne sont vérifiés nulle part.

## Le patron est déjà dans le dépôt

`shortcuts.rs` a résolu le même problème pour la Frappe. `Mechanisms`
(`shortcuts.rs:232`) nomme les sept effets qu'une frappe met en marche,
`AppMechanisms` les branche sur l'`AppHandle`, `Press` réunit `windows`, `state`
et `mechanisms`, et `on_struck` est la seule ligne qui touche l'`AppHandle`.
`answer` et `act_on` sont testables, et vingt-quatre tests s'en servent avec un
`FakeMechanisms` qui note les gestes.

Le Tour reçoit la même forme.

## Ce qui passe derrière la couture

Les huit étapes de `tick` se rangent en deux tas. Cinq ne demandent que
`windows` et `state`, elles restent où elles sont. Les autres deviennent les
méthodes de `TurnMechanisms` :

- `follow_authorization` : le crochet des notifications s'ouvre ou se ferme
- `announce_relay` : les messages privés apprennent qui vient de partir
- `follow_display` : l'écran tenu éveillé suit l'état des messages privés
- `refresh_walk` : le Déplacement rapide s'éteint s'il n'a plus de fenêtre
- `follow_wheel` : la roue suit la fenêtre du premier plan
- `shows_main_window` : la fenêtre de Multifus est-elle à l'écran
- `tell_clients` : le compte des clients part vers l'écran Paramètres
- `emit_snapshot` : l'instantané part, et la barre système se rafraîchit

`tick` ne fait plus que construire les trois moitiés et appeler `turn_over`,
qui est la boucle et qui se joue dans un test.

## Ce qui ne bouge pas

`follow_authorization`, `start_listening` et `stop_listening` restent des
fonctions libres : `request_authorization` les appelle aussi, hors du Tour.
`AppTurnMechanisms` ne fait que les rappeler.

`Turn` ne prend pas les mécanismes en champ, contrairement à `Press`.
`Turn::of(app)` est rendu par valeur, et un `AppTurnMechanisms(app)` construit
dedans serait un temporaire emprunté. Trois fonctions prennent donc les
mécanismes en second paramètre, et `clients`, `maximize_all` et `on_run_event`,
qui n'en ont pas besoin, gardent leur `Turn` seul.

## Ce que les tests disent maintenant

- Le tour passe ses huit étapes dans l'ordre écrit
- L'instantané ne part pas quand le tour n'a rien changé
- L'instantané part dès qu'une seule étape a écrit quelque chose
- Le compte des clients ne part pas quand personne ne regarde
- Le compte des clients ne part pas deux fois pour le même compte
- La roue et le Déplacement rapide sont touchés à chaque tour, changement ou non

## Ce que ça ne fait pas

Rien ne change à l'écran, et rien ne change de vitesse. C'est une couture, pas
une fonctionnalité.
