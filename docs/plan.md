# Plan de développement, les réponses rapides

**Ce document ne porte qu'un chantier à la fois, et c'est celui des réponses rapides.**
Une session qui travaille ici n'en ouvre pas un autre, ne refactorise pas ce qui
marche, et ne réorganise rien de `src`.

Il vise **macOS et Windows ensemble**. Les deux systèmes ont leur code écrit et
leur parité tenue, donc une fonctionnalité neuve arrive des deux côtés dans le
même chantier ou n'arrive pas.

**La session qui écrit l'écran démarre `/frontend-design` avant sa première ligne
d'interface.** C'est la règle de `CLAUDE.md`, elle vaut pour le temps 4 et pour
toute retouche d'interface qui viendrait après.

| Où lire quoi                              |                                   |
| ----------------------------------------- | --------------------------------- |
| Le vocabulaire                            | [CONTEXT.md](../CONTEXT.md)       |
| Ce que le projet refuse de faire          | [perimetre.md](./perimetre.md)    |
| Les décisions déjà tranchées              | [adr](./adr)                      |
| Les pièges qui ne sont propres à personne | [pieges.md](./pieges.md)          |
| macOS, fait et archivé                    | [macos.md](./macos.md)            |
| Windows, fait et archivé                  | [windows.md](./windows.md)        |
| Les règles d'écriture du code             | [.claude/rules](../.claude/rules) |

Les archives se relisent quand un comportement surprend, jamais pour être
reprises. **Ce document ne recopie rien d'elles** : c'est ce qui l'a fait rouler
la dernière fois, et le nettoyage du 24 août 2026 a séparé les trois choses qui
s'y étaient mélangées, le chantier en cours, l'archive d'un système, et les
pièges durables.

---

## Ce qui attend encore, hors de ce chantier

Rien de cette liste n'est du ressort d'une session qui écrit les réponses rapides.

| À faire                                                                  | Où                         |
| ------------------------------------------------------------------------ | -------------------------- |
| Créer un certificat **Developer ID Application** et l'exporter en `.p12` | developer.apple.com        |
| Poser les huit secrets du workflow `release`                             | Réglages du dépôt          |
| Remplacer le logo du scaffolder Tauri                                    | `src-tauri/icons`          |
| La soirée de vérification Windows, deux vrais clients                    | [windows.md](./windows.md) |
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

---

## Le chantier : les réponses rapides

### Ce que c'est

On répond toujours la même chose aux mêmes questions. Une **réponse rapide** est un texte
rangé sous une combinaison de touches : la combinaison frappée depuis le jeu met
le texte dans le presse-papiers, pose la combinaison de collage vers la fenêtre,
et rend le presse-papiers d'avant. Le mot est dans
[CONTEXT.md](../CONTEXT.md), l'ouverture du périmètre qu'il demande est dans
l'[ADR 0012](./adr/0012-une-reponse-rapide-se-colle-dans-le-jeu.md).

### Ce qui est tranché, et qui ne se rejoue pas

| Question                                  | Réponse                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| Le geste                                  | Presse-papiers **et** collage posé sur le système, ADR 0012                |
| Jusqu'où va la frappe                     | **Coller seulement.** Pas d'Entrée, pas d'ouverture du chat                |
| Le presse-papiers                         | Emprunté et rendu, délai mesuré. Non textuel, perdu et dit à l'écran       |
| La garde                                  | Inerte hors du jeu, comme les quatre autres                                |
| Le relais                                 | Une réponse rapide frappée le coupe, comme les quatre autres               |
| L'identité d'une réponse rapide           | **Le texte seul**, pas de nom à tenir à jour                               |
| Le texte                                  | Une ligne, saut de ligne replié, aucune longueur maximale imposée ici      |
| Le premier lancement                      | **Zéro réponse rapide**, aucun maximum                                     |
| Par personnage                            | Non, une réponse rapide est globale                                        |
| Les combinaisons prises ailleurs          | Aucune liste noire. On pose, et le statut par ligne dit ce qui s'est passé |
| La combinaison de collage comme raccourci | Refusée à la capture, elle se déclencherait elle-même                      |

### Temps 1 — La mesure, faite sur le Mac le 24 août 2026

**Un binaire jetable, avant une ligne de l'application.** Il est dans
`probes/paste`, avec son protocole, et il a été lancé contre un vrai client
Retro. Les quatre réponses sont ci-dessous, et **elles ne valent que pour
macOS** : aucune ne se transporte d'un système à l'autre, voir
[windows.md](./windows.md).

**Il se supprime quand la vérification de l'étape sera faite sur les deux
machines**, et pas avant : tant que personne n'a vu une réponse rapide partir depuis la
fenêtre, c'est le seul instrument qui sépare « le collage ne marche pas » de
« multifus s'y prend mal ».

| #   | Question                                               | Réponse mesurée                                                        |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| 1   | La combinaison posée arrive-t-elle dans le chat ?      | **Oui.** `Super+V` par `CGEventPost`, tap HID, source privée           |
| 2   | Faut-il relâcher les modificateurs physiques d'abord ? | **Non.** `Control` et `Shift` tenus, le texte arrive quand même        |
| 3   | Quel délai avant de rendre l'ancien presse-papiers ?   | **50 ms suffisent, 10 ms rendent le champ vide.** La constante est 150 |
| 4   | Le chat doit-il déjà avoir le focus ?                  | **Non mesurée**, l'écran reste donc prudent là-dessus                  |

La question 1 répondant oui, l'**ADR 0012 tient** et le périmètre s'ouvre du cran
qu'il décrit. La marge de la constante est trois fois le plancher mesuré, une
machine chargée étant plus lente que celle de la mesure. Elle vit dans
`app::quick_replies`, avec la date à côté.

**Sur le Mac, le binaire jetable emprunte l'autorisation de son lanceur.**
`CGEventPost` demande l'Accessibilité, et en développement c'est le terminal qui
la porte et jamais multifus, ce que [macos.md](./macos.md) écrit. Un essai lancé
depuis un terminal non autorisé échoue sans rien dire, et ça se lit comme « Dofus
n'accepte pas le collage ».

**Sur le PC, les quatre questions sont entières.** Le code Windows est écrit et
compile, il n'a jamais été vu marcher. La seconde est celle qui mordra :
`SendInput` écrit dans le même flux que le clavier, donc un modificateur de la
réponse rapide encore enfoncé se mélange au collage, là où la source privée de macOS le
tient à l'écart. Le protocole est le même que celui du Mac, un binaire jetable
qui pose la combinaison après un compte à rebours.

### Temps 2 — La configuration et le cœur, écrit

**Écrit et testé, `cargo test` compte 144 cas.** Ce qui suit décrit ce qui est
dans le code, et les trois endroits où il s'écarte du cadrage sont dits en fin de
section.

**La forme en configuration.**

```rust
pub struct QuickReply {
    pub id: QuickReplyId,
    pub text: String,
    pub shortcut: Option<Shortcut>,
}
```

`Settings` gagne `quick_replies: Vec<QuickReply>`, vide par défaut. `QuickReplyId` est un `u32`
enveloppé, alloué à la création comme le plus grand identifiant existant plus un :
aucun compteur à persister, aucune crate d'identifiants, et un identifiant qui
survit à une réécriture du texte comme à un réordonnancement. `Settings` porte
déjà `#[serde(default)]`, donc un fichier écrit avant ce chantier s'ouvre sans
réponse rapide. **Poser un défaut par champ sur `QuickReply`** dès maintenant, le piège de
`Character` étant écrit dans [pieges.md](./pieges.md).

**Le lien touche vers action, et `ShortcutAction` ne bouge pas.** Il garde ses
quatre valeurs, son `ALL` de taille fixe et sa table de chaînes exhaustive, dont
le commentaire dit qu'une cinquième action doit échouer à la compilation. Un type
neuf porte les deux familles :

```rust
pub enum Binding {
    Action(ShortcutAction),
    QuickReply(QuickReplyId),
}
```

Il ne sert qu'à trois endroits : la table `claimed` de `shortcuts::apply`, qui
détecte alors les doublons **entre les deux familles** d'un seul coup, la file que
`fire` alimente, et la répartition dans `answer`. Il reste `Copy`, comme
`ShortcutAction`, donc `fire` ne change pas de forme.

`ShortcutStatus::Duplicate` porte désormais un `Binding` et non une
`ShortcutAction`. Les quatre actions se posent avant les réponses rapides, pour qu'un
doublon nomme l'action qui tient la combinaison et non l'inverse.

**La file porte l'identifiant et jamais le texte.** Le texte se lit sous le verrou
au moment où la touche part, sinon une réponse rapide modifiée pendant que multifus tourne
collerait son ancienne version.

**Les commandes.** `add_quick_reply`, `set_quick_reply_text`, `set_quick_reply_shortcut`,
`remove_quick_reply`. Toutes passent par `runtime::emit_snapshot`, qui est la seule
porte de sortie. `set_quick_reply_shortcut` rappelle `shortcuts::apply`, comme
`set_shortcut`.

**Le journal gagne deux événements.** `QuickReplyPasted` avec un extrait du texte,
quarante caractères, et `QuickReplyFailed` avec son motif. Le test qui compare la
liste exacte des champs les couvre comme les autres. L'extrait est le texte de
l'utilisateur et non le corps d'un message reçu, donc l'ADR 0006 ne s'y oppose
pas ; le fichier étant fait pour être transmis, l'ADR 0012 écrit ce que ça coûte.

**La barre système ne gagne rien.** Une réponse rapide a une combinaison, donc le principe
directeur est satisfait, et un sous-menu de réponses rapides dans une barre système est
exactement le réglage qu'on ne visite jamais.

#### Ce que le code fait autrement, et pourquoi

Cinq écarts, tous trouvés par la relecture et tous écrits ici plutôt que corrigés
en douce dans le tableau des décisions.

**`QuickReplyFailure` porte six motifs et non trois.** Le cadrage n'avait compté que
les trois refus du système. Il en manquait trois qui se réparent ailleurs : la
garde de perimetre.md, qui doit écrire une ligne comme elle le fait pour les
quatre actions, sinon une réponse rapide qui ne part jamais laisse un journal muet ; le
premier plan illisible, qui est le même cas que `ForegroundUnknown` chez les
actions ; et la réponse rapide retirée entre l’appui et le collage, que la file rend
possible puisqu'elle ne porte qu'un identifiant. Le sixième est le presse-papiers
qui n'est pas rendu, seul motif qui suit un collage réussi.

**Le presse-papiers illisible n'est pas un motif.** Un presse-papiers qui porte
une image répond « pas de texte » exactement comme un presse-papiers vide, et le
plugin ne distingue pas les deux. La lecture qui échoue vaut donc « rien à
rendre », ce que la `Note` de l'écran annonce, et non un échec de journal.

**`ShortcutsBound` porte un `BindingView` et non un `ShortcutView`.** La ligne du
journal doit dire la même chose des deux familles, et un `ShortcutView` porte une
action. Le nouveau type porte un `Binding`, une combinaison et un statut, et rien
d'autre : pas de texte, parce que ce fichier est fait pour être transmis. Le
journal nomme donc une réponse rapide par son numéro, là où l'écran la nomme par son
texte. Les deux fonctions qui nomment s'appellent `journalBindingLabel` et
`bindingLabel`, et le préfixe est là pour qu'on ne les confonde jamais : importer
la seconde dans le journal ferait fuir le texte de l'utilisateur dans le fichier.

**Un saut de ligne est replié, pas refusé.** Le tableau des décisions dit « saut
de ligne refusé », et refuser voudrait dire refuser quoi : la frappe est
impossible dans un `<Input>`, et le seul chemin qui reste est un fichier de
configuration écrit à la main. Refuser là ferait échouer la lecture de tout le
fichier, ce que le piège de `Character` interdit. `QuickReply::set_text` replie donc
les lignes en une seule, et rien n'est perdu. L'interdit de l'ADR 0012 est tenu :
aucune réponse rapide ne peut porter un saut de ligne.

**Le texte est aussi rogné à la sortie du champ, côté React.** Sans ça, une
réponse rapide tapée avec une espace en trop à la fin revenait rognée du Rust, la valeur
stockée ne bougeait pas, le brouillon gardait son espace, et chaque sortie du
champ réécrivait le disque pour rien.

### Temps 3 — Le collage, écrit des deux côtés

**Écrit. Vu marcher sur le Mac, jamais sur le PC.** L'interface est
`platform::paste::PasteSender`, quatrième de la frontière, et les deux moitiés
sont `CoreGraphicsPasteSender` et `SendInputPasteSender`.

**Une seule chose traverse la frontière : poser la combinaison.** Le
presse-papiers passe par `tauri-plugin-clipboard-manager`, qui est déjà une
dépendance et qui est le même code sur les deux systèmes. La sauvegarde, le
remplacement, le délai et la restitution vivent donc **au-dessus** de la
frontière, dans `app::quick_replies`, écrits une fois. `platform` gagne une interface
qui ne sait faire qu'une chose.

L'ordre, sur le fil des raccourcis qui existe déjà et qui a le droit de bloquer :

1. lire le texte du presse-papiers, et retenir qu'il n'y en avait pas ;
2. y écrire le texte de la réponse rapide ;
3. poser la combinaison de collage vers le premier plan ;
4. attendre le délai de la mesure 3 ;
5. réécrire l'ancien texte, s'il y en avait un.

**La garde est posée une fois et lue une fois**, dans `shortcuts::answer`, qui
répartit ensuite vers l'action ou vers le collage avec la fenêtre en main.
`quick_replies::paste` ne reçoit donc que l'identifiant : ce module ne sait pas
ce qu'est le premier plan, et le refus s'écrit au seul endroit qui l'a demandé.

**Jamais le fil principal, jamais le verrou tenu.** Le texte de la réponse rapide se lit
sous le verrou de `Multifus`, qui est rendu avant l'étape 1. La règle en tête de
`app::state` s'applique telle quelle.

| Système | Appel         | Ce que ça a coûté                                                                                                      |
| ------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| macOS   | `CGEventPost` | **Zéro crate.** `objc2-core-graphics` était déjà dans `Cargo.lock`, en dépendance indirecte, et n'a gagné qu'une arête |
| Windows | `SendInput`   | Zéro crate. Un trait de plus, `Win32_UI_Input_KeyboardAndMouse`                                                        |

Sur macOS l'autorisation d'Accessibilité est déjà accordée et déjà exigée par
l'AutoFocus : poser un événement n'en demande pas une seconde. Elle est quand
même relue avant de poser, parce qu'un événement posé sans elle ne fait rien du
tout et se lit comme un jeu qui refuse le collage. Sur Windows rien n'est à
demander.

**La source de l'événement est privée, sur macOS.** C'est ce qui empêche les
modificateurs que l'utilisateur tient au même moment de se mélanger aux drapeaux
posés. La mesure 2 dit que ça marche, et c'est la ligne qui n'a pas d'équivalent
Windows.

**La combinaison est `Control+V` sur Windows et `Super+V` sur macOS.** Deux
constantes nommées, jamais un caractère écrit à la volée.

### Temps 4 — L'écran, écrit

**Écrit. `tsc`, `oxlint` et 193 cas de `vitest` passent, et personne ne l'a
encore vu à l'écran.**

**Démarrer `/frontend-design` avant d'y toucher**, la règle du projet l'exige pour
toute session de design. Et la règle qu'il croise ici est celle de
`.claude/rules/frontend.md` : consistance avant créativité. Cette section
réemploie la grammaire de l'écran, elle n'en invente pas une seconde.

**Un second panneau sous les quatre actions**, dans `src/screens/shortcuts/`.

- `SectionRow` porte le titre « Réponses rapides », sa description, et le bouton
  « Ajouter » à droite. C'est le composant fait pour un sujet plus une action, et
  `PanelHeader` n'aurait pas de place pour le bouton.
- Une ligne par réponse rapide, dans un composant `QuickReplyRow` : un `<Input>` d'une ligne
  à gauche, le champ de combinaison à droite, un bouton de retrait au bout. Le
  retrait ne demande pas de confirmation, comme le retrait d'un personnage.
- Aucune réponse rapide, aucun `EmptyState` : ce composant remplace le contenu d'un écran
  entier, pas le corps d'un panneau. Une ligne atténuée dans le panneau, et le
  bouton reste dans l'en-tête.
- Une `Note` sous le panneau dit ce que la restitution ne sait pas rendre : un
  presse-papiers qui portait une image ou un fichier est perdu.

**`ShortcutField` se généralise, et c'est la seule retouche de l'existant.** Il
lisait `strings.shortcuts.actions[shortcut.action]` pour son `aria-label`, et il
ne connaît plus les quatre actions du tout. Il prend trois propriétés : la
combinaison, l'étiquette du bouton, et **la ligne de statut déjà mise en mots**.

Cette troisième est ce que le cadrage n'avait pas vu. Un doublon nomme le binding
qui tient les touches, et ce binding peut être une réponse rapide, qui n'a de nom que son
texte. Le champ aurait donc eu besoin de la liste des réponses rapides pour écrire une
ligne, ce qui lui rendait tout ce qu'on venait de lui retirer. C'est l'écran qui
appelle `shortcutStatusLine`, et le champ ne fait plus que la remplacer pendant
une capture.

**La capture refuse la combinaison de collage.** `CaptureRejection` gagne une
troisième valeur, `pasteCombination`, sa phrase dans `REJECTION_LINES`, et son cas
dans `accelerator.test.ts`. Sans ça, une réponse rapide posée sur `Control+V` se
déclencherait elle-même.

Cette combinaison s'écrit à trois endroits qui doivent dire la même chose :
`PASTE_COMBINATION` dans `constants/keyboard.ts`, `PASTE_KEY` avec son drapeau
dans `platform::macos`, et `VK_V` avec `VK_CONTROL` dans `platform::windows`.
Elle traverse deux langages et un `cfg`, donc aucune constante ne peut les tenir
ensemble ; c'est cette ligne qui le fait.

**Deux chaînes existantes ont été réécrites, et le cadrage disait que
`ShortcutField` serait la seule retouche.** La ligne d'un raccourci sans
combinaison disait « cette action », qui est faux sous une réponse rapide, et la ligne du
doublon portait des guillemets que le libellé porte maintenant lui-même. Les deux
sont des conséquences directes de la généralisation, pas un élargissement.

**Le champ de texte répond à Entrée et à Échap**, qui sortent du champ et qui
annulent. Rien ne le demandait, et un champ qui ne répond pas à Entrée est un
champ qu'on croit cassé.

**Le texte s'écrit à la sortie du champ et non à chaque frappe.** La configuration
va sur le disque, et une réponse rapide de trente caractères vaudrait trente écritures.

**Les chaînes** vont dans `src/constants/strings/shortcuts.ts`, sous une clé
`quickReplies`. La ligne du doublon doit maintenant nommer soit une action soit une réponse rapide, donc `shortcutStatusLine` gagne ce cas dans `helpers/wording.ts`, avec ses
tests. Une réponse rapide se nomme par les trente premiers caractères de son texte, et
« une réponse rapide sans texte » quand elle n'en a pas encore.

**Une seule capture à la fois pour tout l'écran.** L'état est un `Binding` et non
plus une `ShortcutAction`, sans quoi une action et une réponse rapide pourraient
écouter le clavier ensemble et répondre toutes les deux au même appui. Il
descend tel quel jusqu'aux deux familles de lignes, qui posent la même question
avec le même prédicat, `matchIsSameBinding` de `helpers/binding.ts`.

**La limite des 200 lignes de JSX** met la section dans ses propres fichiers,
`quick-replies-panel.tsx` et `quick-reply-row.tsx`, l'`index.tsx` de l'écran orchestrant sans
implémenter. Le champ qui s'écrit à la sortie est un crochet, `use-draft.ts` :
c'est un état qui suit une propriété, donc il se corrige pendant le rendu et
jamais dans un effet.

### Vérification de l'étape

**Le chemin principal est vu marcher sur le Mac, le 24 août 2026.** Une réponse
rapide créée depuis la fenêtre, une combinaison capturée dessus, la combinaison
frappée depuis le jeu, et le texte arrive dans le chat sans partir. L'écran tient
après le renommage et après le nettoyage.

Ce qui reste à voir sur le Mac, et qui ne demande qu'une soirée de jeu : une
réponse rapide sans combinaison, qui ne doit rien faire et dont l'écran doit le
dire ; une combinaison déjà prise par le Défilement, qui doit être refusée par
son nom ; la même combinaison frappée hors du jeu, qui ne doit rien faire du
tout ; un texte copié avant, qui doit se retrouver dans le presse-papiers après ;
et le journal, qui doit porter une ligne par collage.

**Sur le PC, rien n'a été vu marcher**, et les quatre mesures du temps 1 s'y
rejouent avant tout le reste.

---

## Ce qui mord, ici

**Le presse-papiers rendu trop tôt ne colle rien du tout.** Le client lit le
presse-papiers quand il traite l'événement, pas quand il le reçoit. Mesuré sur le
Mac : à 10 ms le champ de chat reste vide, et il ne porte même pas l'ancien
contenu, ce que la mesure attendait. La constante est `GIVE_BACK_AFTER` dans
`app::quick_replies`, avec la date à côté.

**Les modificateurs de la réponse rapide sont encore enfoncés quand le collage part.**
`Control+K` frappé, le `Control` est physiquement bas au moment où la combinaison
de collage est posée, et le client peut lire tout autre chose. Réglé sur le Mac
par une source d'événement privée, mesure 2 à l'appui. **Entier sur Windows**, où
`SendInput` écrit dans le flux du clavier et n'a pas cette porte.

**Un `let ... else` qui prend le verrou n'interbloque pas.** Les temporaires de
l'initialisation meurent avant que la branche `else` s'exécute, donc
`let Some(x) = lock(app).lire() else { lock(app).ecrire() }` est correct.
Vérifié plutôt que supposé, parce que la réponse inverse aurait figé le fil des
raccourcis sans un mot.

**Une réponse rapide posée sur la combinaison de collage se déclenche elle-même.** Refusé
à la capture, temps 4.

**Ne pas accorder `clipboard-manager:allow-read-text` à la capacité.** Le
presse-papiers est lu depuis Rust, où la capacité ne s'applique pas. La fenêtre
n'a jamais lu le presse-papiers et n'a aucune raison de commencer : la capacité
n'accorde que `allow-write-text`, pour le bouton de copie du journal.

**Un client AIR n'est pas une application native.** Tout ce qui se lit ailleurs
sur `SendInput` et `CGEventPost` est écrit contre des applications natives. La
mesure 1 est la seule source qui vaille ici.

**Le verrou de `Multifus` ne se tient pas pendant un collage.** Cinq étapes dont
une attente mesurée en centaines de millisecondes, sur un verrou que le balayage
prend plusieurs fois par minute. La règle est en tête de `app::state`, et
[pieges.md](./pieges.md) la répète.
