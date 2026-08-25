# Plan de développement, l'agrandissement au lancement

**Le chantier en cours est l'écran Paramètres et son premier réglage**, plus bas.
Il ne porte qu'un chantier à la fois, sur les deux systèmes ensemble : une
fonctionnalité neuve arrive des deux côtés ou n'arrive pas. Ce document redescend
à sa liste quand le chantier est fini.

Les réponses rapides ont été livrées le 25 août 2026, vues marcher sur les deux
systèmes. Ce qui en reste est archivé : le geste et ses bords dans l'[ADR
0012](./adr/0012-une-reponse-rapide-se-colle-dans-le-jeu.md), les mesures dans
[macos.md](./macos.md) et [windows.md](./windows.md), les pièges dans
[pieges.md](./pieges.md).

**La session qui touche à l'interface démarre `/frontend-design` avant sa
première ligne**, la règle de `CLAUDE.md`.

| Où lire quoi                              |                                   |
| ----------------------------------------- | --------------------------------- |
| Le vocabulaire                            | [CONTEXT.md](../CONTEXT.md)       |
| Ce que le projet refuse de faire          | [perimetre.md](./perimetre.md)    |
| Les décisions déjà tranchées              | [adr](./adr)                      |
| Les pièges qui ne sont propres à personne | [pieges.md](./pieges.md)          |
| macOS, fait et archivé                    | [macos.md](./macos.md)            |
| Windows, fait et archivé                  | [windows.md](./windows.md)        |
| Les règles d'écriture du code             | [.claude/rules](../.claude/rules) |

---

## Ce qui attend

Rien de cette liste n'est du ressort d'une session qui écrit les paramètres.

| À faire                                                                  | Où                         |
| ------------------------------------------------------------------------ | -------------------------- |
| La soirée de vérification, deux vrais clients, sur les deux systèmes     | ci-dessous                 |
| Créer un certificat **Developer ID Application** et l'exporter en `.p12` | developer.apple.com        |
| Poser les huit secrets du workflow `release`                             | Réglages du dépôt          |
| Remplacer le logo du scaffolder Tauri                                    | `src-tauri/icons`          |
| Le certificat Authenticode, à trancher quand macOS sera publié           | [windows.md](./windows.md) |
| Confirmer `crate-type = ["rlib"]` par un `cargo build` sur le Mac        | [windows.md](./windows.md) |

Les huit secrets : `APPLE_CERTIFICATE` (le `.p12` en base64),
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`,
`APPLE_PASSWORD` (un mot de passe d'application, pas celui du compte),
`APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY` et
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, vide ici.

**La paire de clés de l'updater existe déjà, ne la régénère pas.** Elle est dans
`~/.tauri/multifus.key` et son `.pub`, sans mot de passe, et la moitié publique
est déjà le champ `plugins.updater.pubkey` de `tauri.conf.json`. Une nouvelle
paire rendrait insignables les mises à jour des versions déjà installées.

### La soirée de vérification

Elle ne demande que du jeu, et elle vaut sur les deux systèmes. Cinq choses n'ont
jamais été vues : une réponse rapide sans combinaison, qui ne doit rien faire et
dont l'écran doit le dire ; une combinaison déjà prise par le Défilement, qui doit
être refusée par son nom ; la même combinaison frappée hors du jeu, qui ne doit
rien faire du tout ; un texte copié avant, qui doit se retrouver dans le
presse-papiers après ; et le journal, qui doit porter une ligne par collage.

S'y ajoute, côté Windows seul, ce que [windows.md](./windows.md) attend depuis les
quatre lots : deux vrais clients, le roster qui les voit, les quatre raccourcis et
l'AutoFocus sur une vraie soirée.

---

## Le chantier : l'écran Paramètres et l'agrandissement au lancement

### Ce que c'est

Un client Dofus s'ouvre en petite fenêtre. L'**agrandissement au lancement** est
le réglage qui le fait remplir l'écran tout seul, une fois, dès que multifus voit
sa fenêtre. Ce que le réglage refuse de faire est dans
[perimetre.md](./perimetre.md).

Il arrive avec un **sixième écran**, `Paramètres`, qui tient ce que multifus fait
tout seul une fois réglé. Le démarrage avec la session y déménage depuis À
propos, qui redevient une carte d'identité : version, chemin, mise à jour,
mentions légales, remise à zéro.

### Ce qui est tranché, et qui ne se rejoue pas

| Question                          | Réponse                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------ |
| Le déclencheur                    | Une fenêtre de client titrée qu'aucun tour d'avant n'avait remplie              |
| L'écran de connexion              | **Compte.** La fenêtre grandit à l'ouverture du client, pas à l'entrée en jeu   |
| Une fenêtre sans titre            | Laissée : c'est un écran de chargement, pas encore le client                    |
| Le premier tour d'un lancement    | **N'agrandit rien.** Ce qui est déjà ouvert n'a pas été lancé                   |
| Le réglage qu'on vient de cocher  | N'agrandit rien non plus : le tour qui suit est un premier tour                 |
| Un agrandissement qui échoue      | **Retenté au tour suivant.** On ne retient qu'une fenêtre effectivement remplie |
| Deux fois la même fenêtre         | Jamais, une fois remplie. Réduite à la main ensuite, elle reste réduite         |
| Le premier lancement de multifus  | **Décoché.** Rien ne déplace une fenêtre sans qu'on l'ait demandé               |
| Le plein écran de macOS           | Refusé, il rangerait le client dans un bureau à lui                             |
| Le focus                          | Jamais demandé : agrandir n'est pas passer au premier plan                      |
| Le fil                            | Celui du balayage, jamais une commande, qui tourne sur le fil principal         |
| L'échec                           | Une ligne de journal, avec ce que le système a répondu                          |
| Un raccourci                      | Aucun. Le réglage se pose une fois et agit sans que la fenêtre soit ouverte     |

### Ce que le code fait

**La configuration.** `Settings` gagne `maximize_on_launch: bool`, faux par
défaut. `Settings` porte déjà `#[serde(default)]`, donc un fichier écrit avant ce
chantier s'ouvre sans le champ et ne bouge aucune fenêtre.

**Le roster n'a rien à voir là-dedans.** Une fenêtre n'y entre que si son titre
porte un pseudo, ce qui arrive à l'entrée en jeu et non à l'ouverture du client.
Le premier essai s'était branché là, et l'écran de sélection de personnage restait
petit. L'agrandissement demande donc au système sa propre question,
`client_windows`, qui rend les fenêtres d'un processus Dofus, pseudo ou pas.
`game_windows` ne bouge pas et le roster continue de filtrer sur le titre.

**Le souvenir d'un lancement à l'autre.** `Multifus` gagne
`seen_client_windows: Option<HashSet<WindowId>>`, qui garde toutes les fenêtres
de client remplies depuis le début du run et non celles du seul tour d'avant.
`None` veut dire que multifus n'était pas en train de regarder, et le tour qui
suit est alors un premier tour qui n'agrandit rien : c'est ce que laisse derrière
lui le réglage décoché.

**Une fenêtre n'entre dans cet ensemble qu'une fois remplie.** Un client encore
en train de charger refuse l'écriture, et la retenir à la vue au lieu du succès
laissait cette fenêtre petite pour toute la soirée. Elle est donc reproposée au
tour suivant, et un client fermé entre-temps disparaît de la liste tout seul :
c'est ce qui borne les tentatives sans compteur.

**La frontière.** `WindowManager` gagne deux verbes, `client_windows` et
`maximize`.

| Système | Lister                               | Agrandir                       |
| ------- | ------------------------------------ | ------------------------------ |
| Windows | `EnumWindows`, sans fenêtre possédée | `SetWindowPos` sur le `rcWork` |
| macOS   | Un pid par client qui dessine déjà   | `AXPosition` puis `AXSize`     |

Ce que ça a coûté : zéro crate des deux côtés. Windows gagne le trait
`Win32_Graphics_Gdi`, macOS une arête vers `dispatch2`, qui était déjà dans
`Cargo.lock`.

**Les deux moitiés exigent un titre, et ne le lisent pas.** C'est ce qui sépare
`client_windows` de `game_windows` : la seconde y cherche un pseudo, la première
veut seulement qu'il y en ait un. Une fenêtre sans titre est un écran de
chargement, et la remplir sur macOS brûlerait le pid du client avant que sa vraie
fenêtre existe. Sur Windows s'ajoute `GW_OWNER` : une fenêtre possédée est une
boîte de dialogue et reste où elle est.

Les deux posent le cadre de la fenêtre sur la zone utile de son écran, et
n'activent rien. Cette zone est le `rcWork` du `MONITORINFO` de
`MonitorFromWindow` sur Windows, le `visibleFrame` du `NSScreen` sur macOS. Sur
macOS il faut en plus lire la position de la fenêtre pour savoir de quel écran il
s'agit : les deux systèmes de coordonnées y sont retournés l'un par rapport à
l'autre, et c'est la hauteur du premier écran qui sert de charnière. Tout se
compare dans le repère retourné, jamais à cheval sur les deux.

**La position avant la taille.** AppKit garde une fenêtre dans l'écran où elle
est ; agrandir une fenêtre encore posée dans le coin d'un autre écran la ferait
rogner sur celui-là.

**Sur le fil du balayage, jamais sur une commande.** Poser un cadre attend la
boucle de messages du client, qui est justement en train de charger : sur Windows
`SetWindowPos` est synchrone sans `SWP_ASYNCWINDOWPOS`, sur macOS une écriture
d'accessibilité attend le délai de la messagerie. Une commande Tauri tourne sur
le fil principal, donc `maximize_new_clients` est appelé depuis `tick` et non
depuis `scan`, que `commands::refresh` et `commands::reset` traversent.

**Le journal gagne deux événements**, `ClientMaximized` et
`ClientMaximizeFailed`, qui porte ce que le système a répondu. Ni l'un ni l'autre
ne nomme un personnage : la fenêtre grandit à vue, et l'écran de connexion n'en
porte aucun.

**La barre système gagne un article**, `Paramètres`, comme les cinq autres
écrans. Elle ne gagne pas d'interrupteur : ce réglage se pose une fois, et un
interrupteur dans ce menu est fait pour être bougé en cours de soirée.

### L'écran

**Consistance avant créativité**, la règle de `.claude/rules/frontend.md`. Il
réemploie la grammaire de l'écran AutoFocus et n'en invente pas une seconde :
`Screen`, un `Panel`, deux `FieldRow` avec leur glyphe dans une tuile, un
`Switch` à droite.

La réserve de chaque interrupteur est **sur la ligne à laquelle elle
appartient** et non dans un paragraphe en dessous, comme l'écran AutoFocus l'a
tranché. La seule `Note` qui reste ne parle d'aucune ligne : elle dit où
l'application est passée quand on ferme sa fenêtre.

### Vérification de l'étape

**Vu marcher sur le Mac le 25 août 2026.** Un client ouvert, sa fenêtre remplit
l'écran dès l'écran de connexion, avant tout choix de personnage. Elle occupe la
zone utile : la barre des menus et le Dock restent visibles, ce qui est ce qu'on
demandait et non le plein écran du système.

`cargo test` compte 153 cas, `vitest` 203, `tsc`, `oxlint` et `clippy` passent.

La moitié Windows ne se compile pas depuis le Mac : `ring` n'y trouve pas de
chaîne C pour la cible, et il est sous `reqwest`. `client_windows` et `maximize`
ont donc été recopiées dans un bac à sable jetable qui ne dépend que de
`windows`, et elles passent `cargo check --target x86_64-pc-windows-msvc`. Ça dit
que les appels existent et que les types collent, rien de plus ; c'est
`checks.yml` sur `windows-latest` qui compile le vrai.

**Le chemin de l'agrandissement n'a pas de test.** `WindowManager` n'a pas de
doublure dans ce dépôt, donc `runtime::maximize_new_clients` — la garde du
réglage, la boucle, la ligne de journal — n'est exercé par rien. Seule la
comptabilité pure de `take_appeared_client_windows` et de
`remember_client_window` l'est. C'est le même trou que pour le focus, et le
boucher demande un `tauri::test::mock_app` que ce dépôt n'a jamais eu : c'est un
chantier, pas une ligne.

Ce qui reste à voir sur le Mac, et qui ne demande qu'une soirée : multifus lancé
avec trois clients déjà ouverts, qui ne doit rien bouger ; une fenêtre remise en
petit à la main, qui doit rester en petit ; une mule laissée inactive un quart
d'heure et reconnectée, qui doit rester comme on l'avait laissée ; le réglage
coché en cours de soirée, qui ne doit rien bouger de ce qui est déjà ouvert ; un
client qui s'ouvre pendant qu'on joue ailleurs, qui ne doit **pas** voler le
premier plan ; et sur deux écrans, la fenêtre qui doit remplir celui où elle est.

**Sur le PC, rien n'a été vu marcher**, et toute cette liste s'y rejoue. Deux
points n'ont pas d'équivalent sur le Mac : le vol du premier plan, là où
`SW_MAXIMIZE` mordait et que `SWP_NOACTIVATE` doit empêcher ; et les boîtes de
dialogue du client, qui ne doivent pas se retrouver à remplir l'écran.

---

## Ce qui mord, ici

**Le roster n'est pas la bonne liste.** Une fenêtre n'y entre qu'avec un pseudo
dans son titre, donc à l'entrée en jeu. Branché là, l'agrandissement laissait
l'écran de connexion en petit et ne partait qu'une fois le personnage choisi, ce
qui n'est pas ce qu'on demande. C'est `client_windows` qui répond, et elle est
faite pour ça seule : rien d'autre n'a le droit de s'en servir, une fenêtre sans
pseudo n'ayant pas de personnage à qui appartenir.

**`seen_client_windows` grossit et ne se vide jamais dans un run.** Comparé au
seul tour d'avant, il aurait rendu neuve toute fenêtre disparue une seconde de la
liste, et multifus aurait ré-agrandi une fenêtre que l'utilisateur venait de
remettre en petit. Ne pas le repurger, et surtout pas sur une erreur
d'énumération : `EnumWindows` échoue quand une fenêtre meurt en cours de route,
et repartir de zéro là ferait manquer le client qui vient de s'ouvrir.

**Le prix de ce choix est la réutilisation d'un identifiant.** Un client fermé
puis rouvert peut recevoir le même `HWND` sur Windows, et il ne serait alors pas
agrandi. Le `WindowId` est un pid sur macOS, où le cas ne se présente pas dans une
soirée. C'est le bon échange : une fenêtre oubliée une fois, contre un
gestionnaire qui se dispute avec l'utilisateur.

**`SW_MAXIMIZE` vaut `SW_SHOWMAXIMIZED`, et les deux activent la fenêtre.** C'est
le même 3 dans les deux constantes, et `ShowWindow` le documente : « Activates
the window and displays it as a maximized window ». Un client ouvert pendant
qu'on joue ailleurs aurait donc volé le premier plan trois secondes plus tard, ce
que macOS ne fait pas. D'où `SetWindowPos` avec `SWP_NOACTIVATE`, qui pose le
cadre et rien d'autre. Ne pas revenir à `ShowWindow` pour « faire plus simple ».

**`SetWindowPos` est synchrone par défaut.** Il envoie `WM_WINDOWPOSCHANGING` et
attend, sans délai maximal, que le client traite ses messages, ce qu'un client en
train de charger ne fait pas. `SWP_ASYNCWINDOWPOS` poste au lieu d'envoyer. Sans
lui, le fil du balayage se fige derrière un client occupé.

**`NSScreen` n'existe que sur le fil principal.** `platform::macos::on_main_thread`
y saute, et le balayage est un fil à lui. **Le verrou de `Multifus` ne se tient
pas pendant l'appel**, sinon le fil principal attendrait un verrou que le
balayage tient. La règle est en tête de `app::state` et dans
[pieges.md](./pieges.md).

**Sur macOS, un `WindowId` est un pid, donc un client n'a qu'une chance.**
Remplir la mauvaise fenêtre de ce processus, un écran de chargement par exemple,
retient le pid et la vraie fenêtre ne grandira jamais. D'où le titre exigé des
deux côtés de `client_window_element`, à la liste comme au remplissage.

**Une fenêtre possédée est une boîte de dialogue.** Sur Windows, filtrer sur le
seul exécutable aurait agrandi les dialogues du client comme sa fenêtre
principale. `GW_OWNER` les sépare, et le titre écarte les écrans de chargement.
