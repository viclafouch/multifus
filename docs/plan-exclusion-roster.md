# L'exclusion, dite sur l'écran Personnages

## Ce qui n'allait pas

- L'interrupteur d'une ligne n'avait pas de nom à l'écran : on ne savait pas ce
  qu'il coupe.
- « Actions groupées » alignait deux blocs de trois éléments (une icône, un mot,
  deux boutons) pour deux gestes.
- Les blocs se coupaient entièrement tant qu'un connecté n'avait pas de sexe, et
  le seul indice était une infobulle sur un `div` `aria-disabled`.
- Un personnage écarté ne se distinguait d'un autre que par sa sous-ligne.
- L'AutoFocus continuait de ramener devant un personnage écarté, ce qui rendait
  la bascule à moitié vraie.

## Le mot

**De côté** (`asleep`) devient **Exclu** (`excluded`), partout : CONTEXT.md, les
chaînes françaises, le journal, la barre système, et les identifiants des deux
côtés du pont. Le contraire est **réintégrer**. `is_in_cycle` garde son nom : il
répond toujours à la question du défilement, il ne répond plus tout seul à celle
de l'AutoFocus.

Renommages : `toggle_asleep` → `toggle_excluded`, `set_gender_asleep` →
`set_gender_excluded`, `set_asleep_for_gender` → `set_excluded_for_gender`,
`is_sleepable` → `is_excludable`, `has_awake` → `has_in_cycle`,
`ShortcutAction::ToggleAsleep` → `ToggleExcluded`, `RosterChange::Slept`/`Woke`
→ `Excluded`/`Included`, `Swapped { awake }` → `Swapped { kept }`,
`LampState 'asleep'` → `'excluded'`.

Le fichier de réglages n'écrit jamais `asleep` (`store.rs` le vérifie) : rien à
migrer, et l'exclusion repart à zéro à chaque démarrage.

## Ce que fait l'exclusion, maintenant

`Character::excluded` coupe trois choses : les raccourcis Fenêtre suivante et
précédente le sautent, le Déplacement rapide aussi (`next_in_cycle`), et
`State::decide` rend `Decision::Ignored(Outcome::Excluded)` avant même de
chercher la fenêtre. Les messages privés continuent : `is_relayed_online` ne lit
pas l'exclusion.

Le contrôle se pose juste après le test du type de notification, pour que le
journal dise « type désactivé » quand c'est le type, et « personnage exclu »
quand c'est le personnage.

## Ce qui est livré à l'écran

Le panneau porte un en-tête : titre « Exclusion », et sous lui la phrase qui dit
ce que l'exclusion coupe et ce qu'elle ne coupe pas. À droite de cet en-tête, les
deux sigils du dialogue de classe, homme et femme.

Un sigil suit l'état de son sexe : allumé si au moins un connecté de ce sexe
défile, éteint sinon. Cliquer un sigil allumé exclut tout ce sexe, cliquer un
sigil éteint le réintègre. Rien n'est jamais coupé : si un connecté n'a pas de
sexe, l'infobulle le nomme et dit qu'il ne bougera pas ; si personne de ce sexe
n'est connecté, elle le dit aussi.

Une ligne exclue porte son pseudo barré en rouge, son médaillon, son
interrupteur éteint et son fond teintés de rouge, au survol comme au repos. Un
exclu qui se déconnecte garde son rouge, pâli : sinon son retour le remettrait
devant sans que rien ne l'ait annoncé.

L'écran AutoFocus dit maintenant qu'un personnage exclu ne bouge pas, au lieu de
promettre que cela vaut pour tous.

## Décisions

- `PanelHeader` prend un `children` optionnel, posé à droite du titre. Même
  patron que l'`icon` de `FieldRow`.
- `GenderSigil` est repris tel quel, avec le couple `aria-pressed` /
  `sigil-lit` déjà employé dans `ClassDialog`.
- `matchIsInCycle`, `genderGroupOf` et `genderlessNicknames` vivent dans
  `helpers/cycle.ts` : la ligne, l'écran et le rang lisent la même règle.
- `data-excluded` et `data-offline` ne se disputent aucune propriété : le rouge
  tient la couleur du pseudo, le pâli tient l'opacité de la ligne. La sous-ligne
  reste grise, son mot suffit.
- `data-excluded:hover:` double `data-excluded:` pour passer devant `hover:` :
  deux sélecteurs valent plus qu'un.
- `GENDERS` vit dans `constants/roster.ts` : un sexe n'appartient pas au domaine
  des classes.
- Les phrases françaises du journal vivent dans `constants/journal.ts` avec les
  autres tables, jamais dans `helpers/`.
- Le nom accessible d'un sigil ne dit pas son état : `aria-pressed` le porte
  déjà. « Hommes dans le défilement et l'AutoFocus », pressé ou non.
- Le journal range les deux phrases de groupe dans une table par sexe : « Tous
  les hommes connectés sont exclus. », « Toutes les femmes connectées sont
  réintégrées. » L'ancienne phrase construite à la main écrivait « Tous les
  femmes connectés ».

## À vérifier sur la vraie machine

- [ ] Un personnage exclu qui reçoit un combat : sa fenêtre ne bouge pas, et le
      journal porte « personnage exclu, sa fenêtre reste où elle est »
- [ ] Le même réintégré : le combat suivant le ramène devant
- [ ] Deux hommes connectés, un exclu : le sigil homme reste allumé
- [ ] Le dernier homme exclu éteint le sigil homme
- [ ] Un clic sur le sigil éteint réintègre tous les hommes, et le rang se
      renumérote
- [ ] Un personnage sans sexe : les deux sigils répondent, et l'infobulle le
      nomme
- [ ] Un personnage exclu qui se déconnecte garde son rouge, en plus pâle, et
      le retrouve entier à son retour
- [ ] Le rouge tient au survol de la ligne, et le tirage par la poignée marche
      toujours sur une ligne exclue
- [ ] La barre système écrit « Bravo (exclu) »
- [ ] Le raccourci Exclure sur la fenêtre du dessus, et le journal le dit
