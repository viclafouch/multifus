# Tester la couche qui touche au système

## Ce qui bloquait

`PlatformWindowManager` était un alias de type vers `AccessibilityWindowManager`
sur macOS et `Win32WindowManager` sur Windows. `app.manage(windows)` rangeait
donc un type concret, et `app.state::<PlatformWindowManager>()` en ressortait un
autre selon la machine qui compile. Un test ne pouvait rien mettre à la place :
sur le Mac, il aurait fallu une vraie autorisation d'accessibilité et de vraies
fenêtres Dofus à l'écran. Le trait `WindowManager` existait déjà, avec ses
quinze méthodes ; il ne manquait que de le ranger derrière le trait plutôt que
derrière le type.

## La couture

`WindowState = Arc<dyn WindowManager>` et `PasteState = Arc<dyn PasteSender>`,
rangés par `app.manage` à côté de `AppState` et de `WatcherState`, repris par
`windows(app)` et `paste_sender(app)`. Le seul endroit qui nomme encore un type
concret est le montage de l'application, dans `app/setup`.

Le presse-papiers a demandé un trait de plus, `Clipboard`, parce qu'il vient
d'un greffon Tauri et non de la plateforme : l'implémentation de production est
`AppClipboard`, trois lignes au-dessus du collage.

## Pourquoi pas un faux `AppHandle`

`tauri::test::mock_app` rend un `App<MockRuntime>`, et tout le code de Multifus
parle à un `AppHandle<Wry>`. Les réconcilier demanderait un `<R: Runtime>` sur
une centaine de signatures, pour ne gagner que le câblage.

Le chemin pris : les fonctions qui décident prennent ce dont elles ont besoin
(`&dyn WindowManager`, `&AppState`, `&Multifus`) et se testent seules ; les
fonctions qui câblent gardent `&AppHandle` et ne font plus que passer. Quand
deux dépendances voyagent ensemble, elles voyagent dans un porteur : `Turn` pour
le tour de scan, `Paste` pour le collage.

## Les doubles

`src/test_doubles.rs`, à côté de `src/test-doubles.ts` du côté de l'interface :
ce que tous les tests demandent et qu'aucun module ne possède.

- `FakeWindowManager` répond ce que dit son `Desktop` et retient ce qu'on lui a
  demandé, un `Asked` par geste. Un test n'écrit du `Desktop` que les champs
  qu'il lit, le reste vient du `Default` : autorisation accordée, barre des
  tâches qui groupe. Un champ que personne ne lit ne s'écrit pas d'avance
- `directory`, `game_window`, `multifus`, `app_state`, `intact`, `journalled`

Le presse-papiers et l'envoi de la combinaison ont leurs doubles dans le module
du collage : personne d'autre ne s'en sert.

## Ce qui est couvert

Trente-six tests, de `runtime`, `shortcuts`, `walk`, `banner`, `tray` et
`quick_replies`.

- Le tour de scan : les fenêtres lues, la fenêtre partie, l'autorisation retirée
  qui passe tout le monde déconnecté sans perdre les personnages, la panne dite
  une fois et pas à chaque tour
- Les clients déjà ouverts au lancement laissés tels quels, celui qui s'ouvre
  ensuite agrandi une fois
- Le titre court demandé avec le suffixe appris au tour d'avant
- La tête de classe posée, le bouton mis à part, et rien de redemandé au tour
  suivant ; la fenêtre partie oubliée plutôt que poursuivie
- La trace rendue à l'extinction, et gardée pour le prochain lancement si le
  système refuse de la reprendre
- Le défilement : la fenêtre de chaque côté, la fenêtre fermée entre deux appuis
  distinguée d'une bascule refusée
- Une combinaison déjà prise refusée par le nom de son propriétaire, une
  combinaison illisible refusée, une case vide qui ne lie rien
- Le raccourci frappé hors du jeu et le premier plan illisible, dits chacun de
  deux façons selon qu'ils portent une action ou une réponse rapide
- La visée du Déplacement : le clic hors du jeu, le clic sur un client que le
  tour n'a pas donné, personne dans le cycle, le dernier du cycle
- La bascule finie seulement quand le système dit que la fenêtre est venue, et
  le refus dit par sa raison plutôt que par son retard
- La bannière : elle ne se montre qu'au-dessus d'une fenêtre du jeu, et un
  aperçu qu'un plus récent a remplacé ne parle plus pour elle
- Le menu : les personnages à l'écran, et rien de différent tant que rien de
  montré ne change
- Le collage : le texte emprunté rendu, la combinaison refusée qui rend quand
  même, le presse-papiers en écriture seule qui ne colle rien

## Ce qui reste dehors, et pourquoi

`answer` dans `shortcuts.rs` et `switch` dans `walk.rs` prennent encore
l'`AppHandle` entier. Ce qu'ils décident est extrait et testé — `refusal_said`,
`switch_said`, `aim` — mais leur enchaînement ne l'est pas : l'ordre du `SETTLE`,
de `gate.expect`, du `focus_fast` et de l'`await_arrival` reste à la main. C'est
la ligne qui reste dans [plan.md](./plan.md).

La pose de la bannière tient dans une `WebviewWindow` : son coin, sa condition
d'apparition et sa génération sont testés, `place`, `build` et `raise`
demanderaient un vrai écran.

L'émission d'un événement, la construction du menu par Tauri et
l'enregistrement d'une combinaison auprès du système n'ont rien à décider.

« Tout réinitialiser » vide le trousseau : le code le fait, le trousseau du Mac
n'est pas dans un test.
