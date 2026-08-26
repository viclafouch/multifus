# Reconnaître ses clients à leur tête de classe

## Le manque

Huit clients ouverts, huit boutons identiques dans la barre des tâches, tous
avec le même logo Dofus. Pour retrouver son Enu, on lit les titres un par un, ou
on fait défiler au raccourci jusqu'à tomber dessus. Dans Multifus, la liste des
personnages ne dit pas mieux : douze pseudos alignés, et rien qui distingue un
Iop d'une Eniripsa au premier regard.

Dracoon sait faire : on assigne une classe à chaque personnage, et la fenêtre du
client porte le portrait de la classe dans la barre des tâches. C'est ce qu'on
reprend, images comprises.

## Ce qu'on voit à l'écran

### La ligne d'un personnage, redessinée

Elle avait sept zones et s'était remplie par accrétion. Elle en a cinq :

```
avant   ⠿  01  ●  Chafoin              [♂|♀]  (—o)  ✕
                        De côté

après   ⠿  01  ⟨◉⟩  Chafoin                    (—o)  ✕
                     Iop · De côté
```

Un **médaillon rond de 32 px** remplace la lampe et les deux boutons de sexe. Il
porte le portrait de la classe, et son anneau prend les couleurs que la lampe
portait : vert pour un connecté, ambre pour un de côté, gris pour un déconnecté.
La sous-ligne dit `Classe · État` là où elle ne disait que l'état.

Un personnage sans classe, ou sans sexe, montre **l'initiale de son pseudo en
Fraunces** dans un anneau en pointillés. Le pointillé dit « à remplir », et il
disparaît dès que le portrait arrive.

Un personnage déconnecté a son portrait en **niveaux de gris**, en plus de
l'opacité qu'il avait déjà. La liste se lit d'un coup : en couleur, il est là.

Le clic sur le médaillon ouvre la modale. La poignée de tirage ne bouge pas, et
le médaillon ne prend pas le tirage.

### La modale

Titre : le pseudo. En haut, un segment **Homme / Femme**, qui démarre sur
aucun des deux. En dessous, les **douze classes en 4 × 3**, dans l'ordre de
l'écran de création de Dofus — Féca, Osamodas, Enutrof, Sram, Xélor, Ecaflip,
Eniripsa, Iop, Crâ, Sadida, Sacrieur, Pandawa — chaque vignette avec son nom
dessous. Une treizième case, « Aucune », enlève la classe.

Changer le sexe **repeint les douze vignettes** : la grille montre toujours les
portraits du sexe choisi. Tant qu'aucun sexe n'est choisi, elle montre les
portraits d'homme, et **elle se clique quand même** : on vient là pour cliquer
une tête, pas pour répondre à un formulaire.

Un clic sur une classe l'écrit et **ferme la modale**. Si le sexe manque, la
modale ne ferme pas : elle pose la question qui reste, `Iop — homme ou femme ?`,
avec les **deux vraies têtes du Iop en grand**. Un clic écrit les deux réponses
et ferme. « Changer de classe » revient à la grille.

Aucun bouton Appliquer, aucun bouton Réinitialiser : partout ailleurs dans
Multifus un réglage s'applique au clic. Échap ferme sans rien écrire.

### Les actions groupées

Le bandeau Hommes / Femmes du haut d'écran ne change pas de forme, mais ses
boutons sont **grisés tant qu'un personnage connecté n'a pas de sexe**, avec un
tooltip qui nomme les manquants : « Chafoin, Bilou et 2 autres n'ont pas de
sexe ». Grisé, il ne ment pas ; actif, il est complet.

La note du bas d'écran (« Marquez vos personnages homme ou femme… ») disparaît :
le tooltip fait son travail, et mieux, puisqu'il nomme.

### Les réglages

Une ligne apparaît, **et seulement si Windows combine les boutons de la barre des
tâches** : « Un bouton par personnage dans la barre des tâches », éteinte par
défaut. Sur une machine réglée sur « Ne jamais combiner », elle n'existe pas.

Sur macOS, rien de tout ça : le médaillon et la modale marchent, la fenêtre du
client garde son icône, et l'écran n'explique pas pourquoi.

## Les décisions, et ce qu'elles écartent

**Pas de couleur.** Dracoon superpose un anneau parmi dix couleurs et un
portrait, deux axes indépendants. La classe suffit, et deux Iops se distinguent
au pseudo.

**Douze classes, pas vingt-quatre vignettes.** Dracoon fait choisir `iop_f` ou
`iop_m` parce qu'il ne connaît pas le sexe. Multifus le connaît : on choisit une
classe, le portrait se déduit.

**Rond dans la ligne, carré dans la fenêtre.** Le rond porte l'anneau d'état et
remplace la lampe ; à 16 px dans la barre des tâches, le carré garde les épaules
du personnage et 27 % de pixels en plus.

**On ne restaure pas l'icône en partant, on restaure le regroupement.** L'icône
meurt avec le client et rend service jusque-là. Le regroupement est une
modification du bureau de quelqu'un : on la lui rend.

**Le rang chiffré reste.** C'est le seul endroit qui dit quel coup de raccourci
tombe où, et les trous (`·`) sont l'information.

## Ce que ça ne fait pas

- Aucune icône personnalisée hors des douze classes : pas de fichier à soi.
- Aucun raccourci clavier. C'est de la configuration, faite une fois par
  personnage, jamais en jeu.
- Rien sur macOS côté fenêtre. `WM_SETICON` n'a pas d'équivalent : on ne repeint
  pas le Dock d'une autre application.
- Aucune écriture dans le réglage Windows de regroupement. Il est global, il
  concerne tous les logiciels, et il appartient à celui qui l'a mis.

## Le code

### Le vocabulaire

`CONTEXT.md` gagne une entrée, et une seule :

**Classe** (`Class`) : la classe Dofus d'un personnage, choisie à la main parmi
les douze. Croisée avec le sexe, elle donne le portrait que porte la fenêtre.

Le portrait et l'icône de fenêtre restent des mots de code : ils ne sont pas
propres à Dofus.

### Les images

Les 24 PNG de `Dracoon/src/ressources/portraits/` (256 × 256, RGBA, ~25 ko
pièce) sont copiés dans `src/assets/portraits/`, nommés `<classe>_<f|m>.png`.
`dofus_icon.png` n'est pas repris.

Le README gagne une ligne : ces visuels appartiennent à Ankama, ils sont repris
d'un outil communautaire, et ils vivent dans un dossier qu'un `git rm` suffit à
retirer.

24 `.ico` (16, 32 et 48 px) en sont tirés dans `src-tauri/icons/portraits/`,
committés. Le front lit les PNG par un import Vite, Rust lit les `.ico` par
`include_bytes!` : une source, un dérivé, aucun encodeur d'images dans le
binaire.

### Le noyau

- `domain/character.rs` : `Class`, un enum de douze variantes, `Serialize` en
  minuscules. `Character` gagne `pub class: Option<Class>`. Le champ est
  persisté comme `gender` l'est déjà : rien à migrer, le fichier existant se
  relit avec `class` à `None`.
- `app/state.rs` : `set_class(&mut self, nickname, class)`, sur le modèle de
  `set_gender`. La vue `Character` du snapshot porte `class`.
- `app/commands.rs` : `set_class`, enregistrée dans `lib.rs`, appelée par
  `setClass` dans `src/lib/multifus.ts`.
- `config/settings.rs` : `ungroup_taskbar: bool`, à `false` par défaut, avec sa
  commande `set_ungroup_taskbar`.

### La frontière

`platform/window.rs`, sur `WindowManager` :

```rust
fn set_window_icon(&self, window: WindowId, icon: Option<&[u8]>) -> Result<()>;
fn taskbar_combines(&self) -> Result<bool>;
fn set_window_group(&self, window: WindowId, group: Option<&str>) -> Result<()>;
```

`macos.rs` répond `Ok(())` et `Ok(false)`, comme `apply_short_titles` le fait
déjà.

`windows.rs` :

- `set_window_icon` : `LookupIconIdFromDirectoryEx` puis
  `CreateIconFromResourceEx` sur les octets embarqués, deux `SendMessageW`
  `WM_SETICON` (`ICON_SMALL` et `ICON_BIG`), et `DestroyIcon` sur l'ancien
  handle. Si l'appel se révèle capricieux, le repli est celui de Dracoon : écrire
  un `.ico` temporaire et `LoadImageW`.
- `taskbar_combines` : `RegGetValueW` sur
  `HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced`,
  `TaskbarGlomLevel`. `2` = jamais combiner, donc `false`. Absente ou autre
  valeur : `true`.
- `set_window_group` : `SHGetPropertyStoreForWindow` et
  `PKEY_AppUserModel_ID`, un identifiant par fenêtre pour dégrouper, `VT_EMPTY`
  pour rendre la fenêtre à son groupe d'origine.

Trois features à ajouter au bloc `windows` de `Cargo.toml` :
`Win32_System_Registry`, `Win32_UI_Shell`, `Win32_UI_Shell_PropertiesSystem`.
`Win32_UI_WindowsAndMessaging` et `Win32_System_Com` sont déjà là.

### La boucle

`app/runtime.rs`, dans `tick`, une quatrième étape à côté de
`apply_short_titles` : `apply_window_icons`. Elle tient la même comptabilité —
quelle fenêtre porte déjà quelle icône — pour ne repeindre que ce qui a changé :
un client qui apparaît, une classe qu'on vient de choisir, un sexe qu'on vient
de changer. Le dégroupage suit le même chemin, sous la condition du réglage.

À la fermeture, `set_window_group(window, None)` sur chaque fenêtre dégroupée.
Les icônes restent.

### L'écran

- `src/@types/roster.ts` : `Class` et `Character.class`.
- `src/constants/classes.ts` : les douze classes dans l'ordre du jeu, leur nom
  français, et les 24 imports de portraits.
- `src/helpers/portrait.ts` : `portraitFor({ class, gender })`, qui rend le PNG
  ou `null`. Testé.
- `src/components/character-medallion.tsx` : le médaillon, son anneau d'état,
  son repli en initiale. Partagé, parce que la modale l'utilise aussi en aperçu.
- `src/components/class-dialog.tsx` : la modale. `dialog.tsx` manque à
  `components/ui` — à sortir de la CLI shadcn, `alert-dialog.tsx` est le seul
  présent.
- `src/components/character-row.tsx` : la ligne redessinée, `Lamp` et
  `GenderButton` en moins.
- `src/screens/characters-screen.tsx` : les boutons groupés grisés, la `Note` du
  bas retirée.
- `src/constants/strings/characters.ts` : les noms de classes, le titre de la
  modale, le tooltip des boutons grisés. `noGenderYet` disparaît.

`Lamp` reste : le journal et l'écran Messages privés s'en servent.

## Ce qui a bougé en écrivant le code

**L'icône se lit à la main, pas par `LookupIconIdFromDirectoryEx`.** Cette
fonction lit un `RT_GROUP_ICON`, dont l'entrée fait 14 octets et finit par un
identifiant. Un fichier `.ico` a des entrées de 16 octets qui finissent par un
décalage : elle s'y trompe d'un champ. `platform/window.rs` porte donc
`icon_image(icon, side)`, quinze lignes qui choisissent l'image la plus proche de
la taille demandée et rendent ses octets. Elle est pure, elle est testée, et elle
ne connaît pas Windows.

**Les icônes qu'on détruit sont les nôtres, et elles ne sont plus sur la
fenêtre.** `WM_SETICON` rend l'ancien handle, mais celui-là appartient au
client : le détruire serait détruire l'icône de quelqu'un d'autre.
`Win32WindowManager` tient donc sa propre table, et ne détruit que ce qu'il a
créé. Petite et grande sont posées une par une : celle qu'on remplace n'est
détruite qu'une fois le message passé, sinon un `WM_SETICON` qui expire pendant
un écran de chargement laisserait la fenêtre pointer sur une icône morte. Un
client fermé emporte ses deux handles : la table oublie les fenêtres qui ne
répondent plus à `IsWindow`.

**L'identifiant de groupe est alloué par `CoTaskMemAlloc`.** Le `PROPVARIANT`
de `windows` a un `Drop` qui appelle `PropVariantClear`, et pour un `VT_LPWSTR`
cela veut dire `CoTaskMemFree`. Lui donner un `Vec<u16>` rendait à l'allocateur
COM un bloc qu'il n'avait pas donné : corruption du tas à chaque fenêtre
dégroupée. Le nom est donc copié dans un bloc de l'allocateur COM, que le `Drop`
rend correctement.

**Les deux tailles viennent du système, pas d'une constante.** `SM_CXSMICON` et
`SM_CXICON` valent 16 et 32 à 100 %, 24 et 48 à 150 % : les `.ico` portent déjà
l'image 48, autant la laisser choisir plutôt que d'étirer la 32. En cas de
réponse nulle, on retombe sur 16 et 32.

**Le garde d'une boucle tient le verrou jusqu'au bout.** Écrire
`for (window, look) in lock(app).looks_to_paint()` garde le `MutexGuard`
temporaire vivant pendant toute la boucle, et le corps reprend le même mutex :
Multifus se bloquait sur lui-même au premier tour dès qu'un client était ouvert,
fenêtre grise et « ne répond pas ». La liste se lit dans un `let` avant la
boucle, comme `maximize_new_clients` le faisait déjà.

**Le réglage Windows de regroupement se relit à chaque tour.** Le lire une fois
au démarrage laissait la ligne des Réglages absente pour qui bascule
« Ne jamais combiner » en « Toujours combiner » sans relancer Multifus. Une
lecture de registre par seconde ne coûte rien, et `follow_taskbar` prend sa place
à côté de `follow_authorization`.

**On ne pose rien sur une fenêtre qu'on n'a jamais peinte.** Un personnage sans
classe garde le logo Dofus : la boucle ne touche à l'icône que si un portrait
arrive, ou si elle en avait posé un qu'on vient de retirer. Sans cette garde, le
premier tour effaçait l'icône de tous les clients ouverts.

**Le groupe n'est écrit que si on l'a défait.** Poser `VT_EMPTY` sur une fenêtre
qu'on n'a jamais dégroupée écraserait l'identifiant qu'elle s'est peut-être
donné. La boucle n'appelle `set_window_group` que si le réglage est allumé, ou si
la comptabilité dit qu'on avait dégroupé cette fenêtre.

**Les noms de classes sont dans `strings/`, pas dans `constants/classes.ts`.**
Le plan les mettait avec les portraits ; la règle du dépôt veut que toute chaîne
française de l'interface vive dans `constants/strings/`. `classes.ts` ne garde
que l'ordre du jeu et les vingt-quatre imports.

**Le verrou du sexe est tombé, la question a changé de place.** La première
version éteignait les douze vignettes tant qu'aucun sexe n'était choisi : un
portrait est le produit des deux réponses, donc la grille attendait. À l'usage
c'est faux : on ouvre la modale pour cliquer une tête, et une grille morte
n'explique jamais pourquoi. Les vingt-quatre choix se posent donc en douze puis
deux — la classe, puis le sexe s'il manque, en montrant les deux portraits de
cette classe-là plutôt qu'un segment abstrait. Le segment Sexe reste sous la
grille, pour qui veut le changer seul : les actions groupées en ont besoin même
sans classe.

**Le tooltip ne nomme que deux manquants.** `missingGenderLine` est dans
`helpers/wording.ts`, avec le reste de ce qui met des choses en mots, et elle est
testée : accord du verbe, « et 1 autre », « et 2 autres ».

**`Intl.ListFormat` a demandé `ES2021.Intl`** dans le `lib` de `tsconfig.json`.

**La conversion ne reste pas dans le dépôt.** Les 24 `.ico` ont été tirés des
PNG une fois, par `sharp` et `png-to-ico` ; les deux dépendances et le script qui
les appelait sont partis avec. Refaire ce travail voudrait dire ajouter des
portraits, ce qui n'arrivera pas : les classes de Retro sont douze.

## À vérifier sur l'autre machine

- [ ] Le médaillon d'un personnage sans classe montre son initiale en pointillés
- [ ] Cliquer une tête sur un personnage sans sexe demande « homme ou femme ? » avec les deux portraits de cette classe
- [ ] « Changer de classe » revient à la grille sans rien écrire
- [ ] Choisir Homme puis Iop pose le portrait dans la ligne et sur la fenêtre
- [ ] Passer de Homme à Femme sur un Iop change le portrait aux deux endroits
- [ ] Un déconnecté a son portrait en gris, un connecté en couleur
- [ ] L'anneau passe au vert, à l'ambre et au gris comme la lampe le faisait
- [ ] Les boutons Hommes / Femmes sont grisés tant qu'un connecté n'a pas de
      sexe, et le tooltip nomme les manquants
- [ ] Fermer un client puis le rouvrir fait revenir l'icône tout seul
- [ ] Redémarrer l'ordinateur et relancer : les classes sont toujours là
- [ ] Sur une barre réglée sur « Ne jamais combiner », le réglage de dégroupage
      n'apparaît pas dans Réglages
- [ ] Sur une barre qui combine, allumer le réglage donne un bouton par client,
      et quitter Multifus les regroupe
- [ ] Quitter Multifus laisse les icônes en place sur les clients ouverts
- [ ] macOS : la modale et le médaillon marchent, la fenêtre ne change pas
