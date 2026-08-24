# Plan de développement, les phrases

**Ce document ne porte qu'un chantier à la fois, et c'est celui des phrases.**
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

Rien de cette liste n'est du ressort d'une session qui écrit les phrases.

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

## Le chantier : les phrases

### Ce que c'est

On répond toujours la même chose aux mêmes questions. Une **phrase** est un texte
rangé sous une combinaison de touches : la combinaison frappée depuis le jeu met
le texte dans le presse-papiers, pose la combinaison de collage vers la fenêtre,
et rend le presse-papiers d'avant. Le mot est dans
[CONTEXT.md](../CONTEXT.md), l'ouverture du périmètre qu'il demande est dans
l'[ADR 0012](./adr/0012-une-phrase-se-colle-dans-le-jeu.md).

### Ce qui est tranché, et qui ne se rejoue pas

| Question                                  | Réponse                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| Le geste                                  | Presse-papiers **et** collage posé sur le système, ADR 0012                |
| Jusqu'où va la frappe                     | **Coller seulement.** Pas d'Entrée, pas d'ouverture du chat                |
| Le presse-papiers                         | Emprunté et rendu, délai mesuré. Non textuel, perdu et dit à l'écran       |
| La garde                                  | Inerte hors du jeu, comme les quatre autres                                |
| Le relais                                 | Une phrase frappée le coupe, comme les quatre autres                       |
| L'identité d'une phrase                   | **Le texte seul**, pas de nom à tenir à jour                               |
| Le texte                                  | Une ligne, saut de ligne refusé, aucune longueur maximale imposée ici      |
| Le premier lancement                      | **Zéro phrase**, aucun maximum                                             |
| Par personnage                            | Non, une phrase est globale                                                |
| Les combinaisons prises ailleurs          | Aucune liste noire. On pose, et le statut par ligne dit ce qui s'est passé |
| La combinaison de collage comme raccourci | Refusée à la capture, elle se déclencherait elle-même                      |

### Temps 1 — La mesure, et rien d'autre

**Un binaire jetable, avant une ligne de l'application.** Sur le Mac d'abord,
puisque c'est la machine où le code s'écrit et que rien de `platform::windows` ne
se relit d'ici, voir [windows.md](./windows.md). Sur le PC ensuite, et les quatre
réponses s'y rejouent : aucune ne se transporte d'un système à l'autre.

| #   | Question                                                                             | Ce que la réponse décide                      |
| --- | ------------------------------------------------------------------------------------ | --------------------------------------------- |
| 1   | La combinaison de collage posée sur le système arrive-t-elle dans le chat de Dofus ? | L'ADR 0012 tient, ou il est remplacé          |
| 2   | Faut-il attendre que les modificateurs physiques soient relâchés avant ?             | La forme de `send_paste_combination`          |
| 3   | Quel délai avant de rendre l'ancien presse-papiers ?                                 | Une constante nommée, et pas un nombre deviné |
| 4   | Le chat doit-il déjà avoir le focus ?                                                | Confirme « coller seulement »                 |

`Super+V` sur macOS, `Control+V` sur Windows. Dofus Retro est un client **AIR** :
il ne lit pas forcément le presse-papiers du système comme une application
native, et un événement posé n'est pas une frappe réelle. Rien de ce qui suit ne
s'écrit avant que la question 1 ait une réponse vue à l'écran.

**Une session distante ne peut pas jouer ce temps-là.** Il demande un vrai client
Dofus au premier plan et un résultat vu à l'écran. Ce qu'elle peut faire est
écrire le binaire jetable et le protocole, que l'utilisateur lance sur sa machine
et dont il rapporte les quatre réponses. Les temps 2 à 4 s'écrivent ensuite sans
la machine.

**Sur le Mac, le binaire jetable emprunte l'autorisation de son lanceur.**
`CGEventPost` demande l'Accessibilité, et en développement c'est le terminal qui
la porte et jamais multifus, ce que [macos.md](./macos.md) écrit. Un essai lancé
depuis un terminal non autorisé échoue sans rien dire, et ça se lit comme « Dofus
n'accepte pas le collage ». Accorder l'Accessibilité au terminal avant de
mesurer, sinon la question 1 rend une fausse réponse négative.

**Si la question 1 répond non**, la phrase se réduit à remplir le presse-papiers,
l'utilisateur colle lui-même, l'ADR 0012 est remplacé par cette version courte et
le périmètre ne s'ouvre pas. Le reste du plan tient presque tel quel, seul le
temps 3 disparaît.

### Temps 2 — La configuration et le cœur

**La forme en configuration.**

```rust
pub struct Phrase {
    pub id: PhraseId,
    pub text: String,
    pub shortcut: Option<Shortcut>,
}
```

`Settings` gagne `phrases: Vec<Phrase>`, vide par défaut. `PhraseId` est un `u32`
enveloppé, alloué à la création comme le plus grand identifiant existant plus un :
aucun compteur à persister, aucune crate d'identifiants, et un identifiant qui
survit à une réécriture du texte comme à un réordonnancement. `Settings` porte
déjà `#[serde(default)]`, donc un fichier écrit avant ce chantier s'ouvre sans
phrase. **Poser un défaut par champ sur `Phrase`** dès maintenant, le piège de
`Character` étant écrit dans [pieges.md](./pieges.md).

**Le lien touche vers action, et `ShortcutAction` ne bouge pas.** Il garde ses
quatre valeurs, son `ALL` de taille fixe et sa table de chaînes exhaustive, dont
le commentaire dit qu'une cinquième action doit échouer à la compilation. Un type
neuf porte les deux familles :

```rust
pub enum Binding {
    Action(ShortcutAction),
    Phrase(PhraseId),
}
```

Il ne sert qu'à trois endroits : la table `claimed` de `shortcuts::apply`, qui
détecte alors les doublons **entre les deux familles** d'un seul coup, la file que
`fire` alimente, et la répartition dans `answer`. Il reste `Copy`, comme
`ShortcutAction`, donc `fire` ne change pas de forme.

`ShortcutStatus::Duplicate` porte désormais un `Binding` et non une
`ShortcutAction`. Les quatre actions se posent avant les phrases, pour qu'un
doublon nomme l'action qui tient la combinaison et non l'inverse.

**La file porte l'identifiant et jamais le texte.** Le texte se lit sous le verrou
au moment où la touche part, sinon une phrase modifiée pendant que multifus tourne
collerait son ancienne version.

**Les commandes.** `add_phrase`, `set_phrase_text`, `set_phrase_shortcut`,
`remove_phrase`. Toutes passent par `runtime::emit_snapshot`, qui est la seule
porte de sortie. `set_phrase_shortcut` rappelle `shortcuts::apply`, comme
`set_shortcut`.

**Le journal gagne deux événements.** `PhrasePasted` avec un extrait du texte,
quarante caractères, et `PhraseFailed` avec son motif. Trois motifs qui se
réparent à trois endroits différents : le presse-papiers illisible, l'écriture du
presse-papiers refusée, le collage refusé par le système. Le test qui compare la
liste exacte des champs les couvre comme les autres. L'extrait est le texte de
l'utilisateur et non le corps d'un message reçu, donc l'ADR 0006 ne s'y oppose
pas ; le fichier étant fait pour être transmis, l'ADR 0012 écrit ce que ça coûte.

**La barre système ne gagne rien.** Une phrase a une combinaison, donc le principe
directeur est satisfait, et un sous-menu de phrases dans une barre système est
exactement le réglage qu'on ne visite jamais.

### Temps 3 — Le collage, des deux côtés

**Une seule chose traverse la frontière : poser la combinaison.** Le
presse-papiers passe par `tauri-plugin-clipboard-manager`, qui est déjà une
dépendance et qui est le même code sur les deux systèmes. La sauvegarde, le
remplacement, le délai et la restitution vivent donc **au-dessus** de la
frontière, dans `app::phrases`, écrits une fois. `platform` gagne une interface
qui ne sait faire qu'une chose.

L'ordre, sur le fil des raccourcis qui existe déjà et qui a le droit de bloquer :

1. lire le texte du presse-papiers, et retenir qu'il n'y en avait pas ;
2. y écrire le texte de la phrase ;
3. poser la combinaison de collage vers le premier plan ;
4. attendre le délai de la mesure 3 ;
5. réécrire l'ancien texte, s'il y en avait un.

**Jamais le fil principal, jamais le verrou tenu.** Le texte de la phrase se lit
sous le verrou de `Multifus`, qui est rendu avant l'étape 1. La règle en tête de
`app::state` s'applique telle quelle.

| Système | Appel         | Trait ou crate                                                        |
| ------- | ------------- | --------------------------------------------------------------------- |
| macOS   | `CGEventPost` | une crate de plus, `objc2-core-graphics` ou l'équivalent, à confirmer |
| Windows | `SendInput`   | `Win32_UI_Input_KeyboardAndMouse`, à ajouter à `Cargo.toml`           |

Sur macOS l'autorisation d'Accessibilité est déjà accordée et déjà exigée par
l'AutoFocus : poser un événement n'en demande pas une seconde. Sur Windows rien
n'est à demander.

**La combinaison est `Control+V` sur Windows et `Super+V` sur macOS.** Deux
constantes nommées, jamais un caractère écrit à la volée.

### Temps 4 — L'écran

**Démarrer `/frontend-design` avant d'y toucher**, la règle du projet l'exige pour
toute session de design. Et la règle qu'il croise ici est celle de
`.claude/rules/frontend.md` : consistance avant créativité. Cette section
réemploie la grammaire de l'écran, elle n'en invente pas une seconde.

**Un second panneau sous les quatre actions**, dans `src/screens/shortcuts/`.

- `SectionRow` porte le titre « Phrases », sa description, et le bouton
  « Ajouter » à droite. C'est le composant fait pour un sujet plus une action, et
  `PanelHeader` n'aurait pas de place pour le bouton.
- Une ligne par phrase, dans un composant `PhraseRow` : un `<Input>` d'une ligne
  à gauche, le champ de combinaison à droite, un bouton de retrait au bout. Le
  retrait ne demande pas de confirmation, comme le retrait d'un personnage.
- Aucune phrase, aucun `EmptyState` : ce composant remplace le contenu d'un écran
  entier, pas le corps d'un panneau. Une ligne atténuée dans le panneau, et le
  bouton reste dans l'en-tête.
- Une `Note` sous le panneau dit ce que la restitution ne sait pas rendre : un
  presse-papiers qui portait une image ou un fichier est perdu.

**`ShortcutField` se généralise, et c'est la seule retouche de l'existant.** Il
lit aujourd'hui `strings.shortcuts.actions[shortcut.action]` pour son
`aria-label`. Il prend désormais ce libellé en propriété et ne connaît plus les
quatre actions, ce qui le rend employable par les deux familles sans copie. Sa
propriété `shortcut` se réduit à ce qu'il lit vraiment, la combinaison et le
statut.

**La capture refuse la combinaison de collage.** `CaptureRejection` gagne une
troisième valeur, `pasteCombination`, sa phrase dans `REJECTION_LINES`, et son cas
dans `accelerator.test.ts`. Sans ça, une phrase posée sur `Control+V` se
déclencherait elle-même.

**Le texte s'écrit à la sortie du champ et non à chaque frappe.** La configuration
va sur le disque, et une phrase de trente caractères vaudrait trente écritures.

**Les chaînes** vont dans `src/constants/strings/shortcuts.ts`, sous une clé
`phrases`. La ligne du doublon doit maintenant nommer soit une action soit une
phrase, donc `shortcutStatusLine` gagne ce cas dans `helpers/wording.ts`, avec ses
tests.

**La limite des 200 lignes de JSX** met la section dans ses propres fichiers,
`phrases-panel.tsx` et `phrase-row.tsx`, l'`index.tsx` de l'écran orchestrant sans
implémenter.

### Vérification de l'étape

Sur les deux machines, avec un vrai client au premier plan. Trois phrases créées
depuis la fenêtre, dont une sans combinaison. La combinaison frappée depuis le jeu
écrit le texte dans le chat, sans l'envoyer. Un texte copié avant se retrouve
dans le presse-papiers après. La phrase sans combinaison ne fait rien et l'écran
le dit. Une combinaison déjà prise par le Défilement est refusée par son nom. La
même combinaison frappée hors du jeu ne fait rien du tout. Et le journal porte une
ligne par collage.

---

## Ce qui mord, ici

**Le presse-papiers rendu trop tôt colle l'ancien contenu.** Le client lit le
presse-papiers quand il traite l'événement, pas quand il le reçoit. C'est la
mesure 3, et le nombre qu'elle rend devient une constante nommée avec la date de
la mesure à côté.

**Les modificateurs de la phrase sont encore enfoncés quand le collage part.**
`Control+K` frappé, le `Control` est physiquement bas au moment où la combinaison
de collage est posée, et le client peut lire tout autre chose. C'est la mesure 2,
et c'est le piège qui fera perdre le plus de temps si personne ne le mesure.

**Une phrase posée sur la combinaison de collage se déclenche elle-même.** Refusé
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
