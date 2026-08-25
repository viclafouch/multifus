# Plan de développement, l'écran Paramètres

**Le chantier en cours est l'écran Paramètres et ses deux réglages**, plus bas :
l'agrandissement au lancement, puis le titre court.
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

| Question                         | Réponse                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------- |
| Le déclencheur                   | Une fenêtre de client titrée qu'aucun tour d'avant n'avait remplie               |
| L'écran de connexion             | **Compte.** La fenêtre grandit à l'ouverture du client, pas à l'entrée en jeu    |
| Une fenêtre sans titre           | Laissée : c'est un écran de chargement, pas encore le client                     |
| Le premier tour d'un lancement   | **N'agrandit rien.** Ce qui est déjà ouvert n'a pas été lancé                    |
| Le réglage qu'on vient de cocher | N'agrandit rien non plus : le tour qui suit est un premier tour                  |
| Un agrandissement qui échoue     | **Retenté au tour suivant.** On ne retient qu'une fenêtre effectivement remplie  |
| Deux fois la même fenêtre        | Jamais, une fois remplie. Réduite à la main ensuite, elle reste réduite          |
| Le premier lancement de multifus | **Décoché.** Rien ne déplace une fenêtre sans qu'on l'ait demandé                |
| Le plein écran de macOS          | Refusé, il rangerait le client dans un bureau à lui                              |
| Le focus                         | **Pris sur Windows**, seul `SW_MAXIMIZE` y agrandissant vraiment. Rien sur macOS |
| Le fil                           | Celui du balayage, jamais une commande, qui tourne sur le fil principal          |
| L'échec                          | Une ligne de journal, avec ce que le système a répondu                           |
| Un raccourci                     | Aucun. Le réglage se pose une fois et agit sans que la fenêtre soit ouverte      |

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

**Une fenêtre n'entre dans cet ensemble qu'une fois la demande passée.** Sur
macOS, un client encore en train de charger refuse l'écriture d'accessibilité, et
la retenir à la vue au lieu du succès laissait cette fenêtre petite pour toute la
soirée : elle est reproposée au tour suivant, et un client fermé entre-temps
disparaît de la liste tout seul, ce qui borne les tentatives sans compteur.
Windows ne refuse plus rien, la demande y étant postée au client, et c'est tant
mieux : `SW_MAXIMIZE` activant la fenêtre, un tour qui la repropose serait un vol
du premier plan toutes les secondes jusqu'au bout de la soirée.

**La frontière.** `WindowManager` gagne deux verbes, `client_windows` et
`maximize`.

| Système | Lister                               | Agrandir                       |
| ------- | ------------------------------------ | ------------------------------ |
| Windows | `EnumWindows`, sans fenêtre possédée | `ShowWindowAsync(SW_MAXIMIZE)` |
| macOS   | Un pid par client qui dessine déjà   | `AXPosition` puis `AXSize`     |

Ce que ça a coûté : zéro crate des deux côtés, et pas un trait de plus sur
Windows, où `ShowWindow` était déjà là pour l'AutoFocus. macOS gagne une arête
vers `dispatch2`, qui était déjà dans `Cargo.lock`.

**Les deux moitiés exigent un titre, et ne le lisent pas.** C'est ce qui sépare
`client_windows` de `game_windows` : la seconde y cherche un pseudo, la première
veut seulement qu'il y en ait un. Une fenêtre sans titre est un écran de
chargement, et la remplir sur macOS brûlerait le pid du client avant que sa vraie
fenêtre existe. Sur Windows s'ajoute `GW_OWNER` : une fenêtre possédée est une
boîte de dialogue et reste où elle est.

Les deux remplissent l'écran où la fenêtre est déjà. Sur Windows le système
choisit lui-même cet écran et sa zone utile, c'est tout ce que `SW_MAXIMIZE`
fait ; sur macOS c'est le `visibleFrame` du `NSScreen`, posé à la main, et il
faut en plus lire la position de la fenêtre pour savoir de quel écran il s'agit :
les deux systèmes de coordonnées y sont retournés l'un par rapport à l'autre, et
c'est la hauteur du premier écran qui sert de charnière. Tout se compare dans le
repère retourné, jamais à cheval sur les deux.

**La position avant la taille.** AppKit garde une fenêtre dans l'écran où elle
est ; agrandir une fenêtre encore posée dans le coin d'un autre écran la ferait
rogner sur celui-là.

**Sur le fil du balayage, jamais sur une commande.** Sur macOS, agrandir attend
la boucle de messages du client, qui est justement en train de charger : une
écriture d'accessibilité y attend le délai de la messagerie. Une commande Tauri
tourne sur le fil principal, donc `maximize_new_clients` est appelé depuis `tick`
et non depuis `scan`, que `commands::refresh` et `commands::reset` traversent.

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
client qui s'ouvre pendant qu'on joue ailleurs, qui **prend** le premier plan sur
Windows et pas sur macOS ; et sur deux écrans, la fenêtre qui doit remplir celui
où elle est.

**Sur le PC, rien n'a été vu marcher**, et toute cette liste s'y rejoue. Deux
points n'ont pas d'équivalent sur le Mac : le premier plan, que `SW_MAXIMIZE`
prend et qui doit rester supportable à une seconde de balayage ; et les boîtes de
dialogue du client, qui ne doivent pas se retrouver à remplir l'écran.

---

## Le chantier : le titre court

### Ce que c'est

Un client Dofus titre sa fenêtre `Alpha - Dofus Retro v1.48.21`, et la barre des
tâches n'en montre que les premiers caractères. Le **titre court** est le réglage
qui la ramène au seul `Alpha`. Il vit dans le même écran Paramètres, sur une
troisième ligne, et ce qu'il refuse de faire est dans
[perimetre.md](./perimetre.md).

### Ce qui est tranché, et qui ne se rejoue pas

| Question                     | Réponse                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| Le déclencheur               | Un titre de fenêtre qui porte un pseudo, donc l'entrée en jeu            |
| L'écran de connexion         | **Laissé.** Aucun pseudo à mettre, et le client charge encore            |
| Rejouer                      | **Oui, à chaque tour.** Un client qui réécrit son titre est resservi     |
| Décocher le réglage          | Chaque fenêtre retrouve le titre que Dofus lui avait écrit               |
| Le reste des fonctionnalités | **Inchangé.** La frontière garde le titre d'origine et continue d'y lire |
| Le fil                       | Celui du balayage, comme l'agrandissement, et jamais une commande        |
| L'attente après un clic      | **Aucune.** La commande sonne le balayage au lieu d'attendre son tour    |
| L'échec                      | Une ligne de journal, et un nouvel essai au tour suivant                 |
| Relancer multifus            | **Relit les titres courts** sans rien avoir retenu, voir plus bas        |
| Quitter multifus             | **Ne rend rien.** Le client réécrit son titre, voir perimetre.md         |
| Un raccourci                 | Aucun. Le réglage se pose une fois                                       |

### Ce que le code fait

**La configuration.** `Settings` gagne `short_titles: bool`, faux par défaut.

**Le pseudo se relit dans le titre court, et rien ne s'en souvient.** C'est la
décision qui porte tout le reste. Une table `fenêtre → pseudo` tenue en mémoire
paraissait suffire, et elle est vide au lancement suivant : six fenêtres laissées
titrées `Alpha` n'auraient plus appartenu à personne, roster vide, barre système
vide, raccourcis morts, jusqu'à ce que chaque client réécrive son titre de
lui-même. La règle est donc lue dans le titre : **un client écrit `Dofus` dans
tous les titres qu'il produit** — fenêtre de jeu, écran de connexion, chargement
— donc une fenêtre titrée d'un processus Dofus sans `Dofus` dedans est une
fenêtre que multifus a raccourcie. C'est `matches_short_title`, et
`GameWindow::from_client_title` la pose derrière `from_title`.

**La règle est « un pseudo Dofus est un seul mot ».** Tous les titres qu'un
client écrit portent une espace, `Dofus Retro` comme
`Pseudo - Dofus Retro v1.48.21`. Chercher le mot `Dofus` paraissait plus simple
et était faux : un personnage nommé `Dofusito` serait passé hors ligne au moment
même où l'on coche, et sa fenêtre serait restée renommée pour toujours.

**Cette seconde porte ne s'ouvre que si une fenêtre courte est à l'écran**, et
c'est lu sur l'écran et jamais sur le réglage. Le drapeau posé depuis le réglage
faisait disparaître tout le roster dans un cas précis : coché, on quitte, on
relance — les titres sont relus, mais la table est vide —, puis on décoche, et
plus rien ne savait lire ces fenêtres-là. Il est donc posé à la fin de la
tournée, d'après ce qu'elle a vu : une fenêtre qu'on n'a pas pu rendre reste une
fenêtre dont cette règle est le seul lecteur. Une écriture refusée le pose à
vrai, faute d'écran confirmé.

**Une fenêtre possédée reste dehors.** Un titre court étant un mot, une boîte de
dialogue du client titrée `Erreur` en est un aussi : sans le filtre `GW_OWNER`,
elle entrait au roster comme un personnage. `titled_window` fait donc le même
test que `is_client_window`, et sur macOS `game_window` essaie tous les titres
écrits par le client avant de retomber sur la lecture courte.

**`tick` appelle `apply_short_titles` avant le balayage.** Dans l'autre ordre, un
lancement réglage coché ne verrait personne pendant son premier tour.

**Ce que la table garde, c'est seulement quoi remettre.** `OriginalTitles` est un
`WindowId → titre d'origine`, et la perdre ne coûte que la restauration. Elle
n'est jamais tenue pendant une écriture : elle est sortie du mutex, travaillée à
part, puis remise, parce que les raccourcis lisent ce même mutex depuis le fil
principal et qu'une écriture attend un client que multifus ne commande pas.

| Système | Écrire un titre                              | Où ça se voit                   |
| ------- | -------------------------------------------- | ------------------------------- |
| Windows | `WM_SETTEXT` par `SendMessageTimeoutW`       | Barre des tâches, Alt+Tab       |
| macOS   | `AXTitle` par `AXUIElementSetAttributeValue` | Barre de titre, Mission Control |

**Jamais `SetWindowTextW`.** Il envoie `WM_SETTEXT` et attend la boucle de
messages du client sans délai maximal, ce qui est exactement le gel que
`ShowWindowAsync` évite pour l'agrandissement. Poster n'est pas une option non
plus : le système ne transporte le texte entre deux processus que pour un message
envoyé. D'où `SendMessageTimeoutW` avec `SMTO_ABORTIFHUNG` et cent millisecondes,
et `GetLastError` pour séparer la fenêtre fermée du client qui n'a pas répondu.

**Le balayage a un réveil, et c'est ce qui rend le clic instantané.** Le réglage
écrivait la configuration et s'arrêtait là : le renommage attendait le tour
suivant, donc jusqu'à une seconde de rien, ce qui se lit comme une application
qui n'a pas entendu le clic. `runtime` tient un `NEXT_TURN`, un `Mutex<bool>` et
sa `Condvar` ; la boucle y dort au lieu d'un `thread::sleep`, et
`commands::set_short_titles` la sonne. Le travail ne bouge pas de son fil pour
autant : renommer depuis le clic gèlerait la fenêtre le temps que six clients
répondent. Dracoon, lui, renomme dans le handler de sa case, et c'est ce qu'on ne
peut pas copier.

**`runs_dofus` est passé en dernier des tests de `titled_window`.** Il ouvre le
processus derrière une fenêtre, et `EnumWindows` en présente plusieurs centaines
à chaque tour, trois fois par seconde depuis ce chantier. Visible, non possédée,
titrée, et alors seulement le processus : il ne reste qu'une poignée de fenêtres
à ouvrir au lieu de tout l'écran. `is_client_window` fait pareil.

**Deux balayages par tour, et c'est le prix du fil.** `apply_short_titles` refait
l'énumération que `game_windows` vient de faire, au lieu de rouler avec elle. Les
fusionner ferait renommer depuis `commands::refresh` et `commands::reset`, qui
traversent `scan` sur le fil principal : c'est exactement le gel que
l'agrandissement évite en n'étant appelé que depuis `tick`. Le réglage décoché,
la moitié système sort avant d'énumérer quoi que ce soit, donc ce prix n'est payé
que par qui l'a coché.

### Vérification de l'étape

`cargo test` compte 151 cas sur le PC, `vitest` 206, `tsc`, `oxlint` et `clippy`
passent. Les cinq cas neufs de `platform::window` verrouillent ce qui compte :
une fenêtre laissée courte par le lancement d'avant porte toujours son personnage
sans que rien ne s'en souvienne, un titre que le client a écrit se lit comme il
s'est toujours lu, rien ne se lit comme un titre court tant que personne ne l'a
demandé, et un personnage nommé `Dofusito` est un personnage comme un autre.

**Vu marcher sur le PC le 25 août 2026**, et une seule chose : cocher la case
pose le pseudo dans la barre des tâches sur-le-champ, sans l'attente d'une
seconde qu'avait la première version. C'est le réveil du balayage, plus haut.

**Tout le reste n'a été vu sur aucun des deux systèmes.** Ce qui demande
une soirée : six clients connectés, la barre des tâches qui montre six pseudos ;
le réglage décoché, les titres d'origine qui reviennent ; un personnage changé
sans quitter le client, le titre qui suit ; une mule laissée inactive un quart
d'heure, qui doit repasser hors ligne comme avant ; et surtout les quatre
raccourcis, l'AutoFocus, la barre système et le relais, qui doivent se comporter
exactement comme réglage décoché.

**`AXTitle` est en lecture seule sur beaucoup d'applications**, et rien ne dit
encore que le client Retro accepte l'écriture. S'il la refuse, le journal le
dira, ligne par ligne, et c'est ce qui tranchera si la moitié macOS reste ou si
`perimetre.md` gagne un refus de plus.

---

## Ce qui mord, ici

**Une fenêtre manquée un seul tour perd son titre d'origine.** Le `retain` de
`write_titles` élague sur ce que la tournée a vu, et `runs_dofus` fait un
`OpenProcess` qui peut échouer une fois pour rien ; côté macOS c'est
`dofus_applications()`. La fenêtre reste alors courte pour de bon. Depuis que la
lecture est sans mémoire, ça ne coûte plus qu'un titre non rendu et plus jamais
un personnage hors ligne, et c'est ce qui rend le compromis tenable.

**Trois `EnumWindows` par seconde quand tout est coché**, contre deux avant :
`apply_short_titles`, `game_windows`, `client_windows`. La première ne reprend sa
sortie anticipée que quand plus aucune fenêtre courte n'est à l'écran : décocher
après un relancement laisse des fenêtres que multifus ne sait plus rendre, donc
le troisième balayage dure jusqu'à ce que le client réécrive son titre. En
échange, `runs_dofus` est passé en dernier des quatre tests de `titled_window` :
il ouvre le processus derrière la fenêtre, et le bureau en présente plusieurs
centaines à chaque tour.

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

**`SW_MAXIMIZE` active la fenêtre, et c'est accepté.** Il vaut
`SW_SHOWMAXIMIZED`, le même 3, et `ShowWindow` le documente : « Activates the
window and displays it as a maximized window ». C'est pourtant le seul appel qui
agrandit vraiment. Poser le cadre sur le `rcWork` avec `SWP_NOACTIVATE` ne volait
rien, mais laissait une fenêtre à l'état normal qui remplissait l'écran, bouton
Agrandir compris : ni le bouton Restaurer, ni la taille d'avant qu'un clic dessus
redonne. Allumer `WS_MAXIMIZE` à la main pour rattraper ça n'a pas été gardé,
Dracoon obtenant la même chose avec la ligne simple. Le premier plan pris est le
prix, et `SCAN_INTERVAL` descend à une seconde pour qu'il le soit tant que le
client qu'on vient de lancer est encore devant.

**`ShowWindow` est synchrone, `ShowWindowAsync` ne l'est pas.** Le premier
attend, sans délai maximal, que le client traite ses messages, ce qu'un client en
train de charger ne fait pas : le fil du balayage se figerait derrière lui, et
avec lui le roster et le relais. Le second poste la demande au fil du client et
rend la main. `IsHungAppWindow` avait été essayé comme garde et jeté : il ne dit
vrai qu'après les cinq secondes du système, donc il laisse passer exactement les
deux ou trois secondes d'une connexion.

**Rien ne relit l'état après coup.** `IsZoomed` juste après la demande la
dirait fausse, puisqu'elle n'est pas encore traitée, et une fenêtre reproposée
tour après tour volerait le premier plan à chaque fois. Une demande postée ne se
refuse pas : elle est donc retenue à l'envoi, comme Dracoon la retient à la vue.

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
