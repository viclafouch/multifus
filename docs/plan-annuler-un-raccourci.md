# Annuler un raccourci, sans tout remettre à zéro

## Le manque

Une combinaison frappée écrase l'ancienne, et l'ancienne est perdue. Le seul
retour en arrière était la remise à zéro de toute la configuration, dans
À propos : le roster, les réponses rapides et le lien Telegram partaient avec.

## Ce qu'on voit à l'écran

L'écran Raccourcis gagne deux gestes, tous deux sur les quatre actions du
défilement. Les réponses rapides ne changent pas.

**Sous le panneau**, hors du cadre et aligné à droite sous les touches, un bouton
discret : « ↺ Remettre les touches d'origine ». Il rend aux quatre lignes les
touches du premier jour, Ctrl Maj et les flèches, sans boîte de dialogue. Même
taille et même ton que le bouton d'annulation : c'est un dépannage, pas une
section. Il ne paraît que si une des quatre lignes porte d'autres touches que
celles d'origine, et il s'efface dès qu'elles y sont toutes revenues : sur une
configuration neuve, l'écran ne propose rien à remettre.

Le clic efface aussi la mémoire d'annulation. Les quatre lignes reviennent aux
touches d'origine, sans un bouton sous aucune : on repart de la page blanche.

**Sous une ligne qui vient de changer**, un bouton discret : « ↺ Remettre » suivi
des touches d'avant, en touches de clavier. Un clic les repose et le bouton
s'efface. Quand les touches d'avant étaient vides, il dit « Remettre : aucune
touche ».

Le bouton ne paraît que si les touches d'avant sont différentes de celles qui
sont là. Refrapper la même combinaison n'offre rien à annuler.

## Ce que ça ne fait pas

L'annulation vit dans l'écran, pas dans le fichier de configuration. Elle part
quand on quitte l'écran Raccourcis, et quand on ferme Multifus. C'est un geste de
la seconde qui suit, pas un historique.

## Le code

- `reset_shortcuts` dans `state.rs` repose `Shortcuts::default()` et enregistre.
  Les touches d'origine restent définies au seul endroit qui les connaît, dans
  `config/settings.rs`, et la commande les réapplique par `shortcuts::apply`.
- `ShortcutView.is_default` dit à l'écran si la ligne porte encore ses touches
  d'origine. La comparaison se fait dans `snapshot`, contre un
  `Shortcuts::default()`, parce que l'écran ne connaît pas ces touches et n'a
  aucune raison de les recopier.
- `use-shortcut-undo.ts` tient la mémoire, une entrée par action. `remember` la
  nourrit avant l'appel au noyau, `undoFor` rend le bouton ou rien, `forgetAll`
  la vide sur la remise aux touches d'origine.
- `actions-panel.tsx` prend les quatre lignes que l'écran portait, comme
  `quick-replies-panel.tsx` porte les réponses.

## À vérifier sur l'autre machine

- [ ] Une combinaison changée fait paraître « Remettre » avec les touches d'avant
- [ ] Le clic sur « Remettre » repose les touches d'avant, et le bouton s'efface
- [ ] Retour arrière sur une ligne, puis « Remettre », rend les touches effacées
- [ ] « Remettre les touches d'origine » rend Ctrl Maj Flèches aux quatre lignes,
      et laisse les réponses rapides, le roster et le lien Telegram en place
- [ ] Après ce bouton, aucune ligne ne propose « Remettre »
- [ ] Le bouton paraît dès qu'une ligne change, et s'en va quand les quatre
      lignes ont retrouvé leurs touches d'origine, à la main ou par le bouton
- [ ] Une ligne vidée au retour arrière fait paraître le bouton
- [ ] Les touches rendues répondent dans le jeu, sans redémarrer Multifus
- [ ] Refrapper la même combinaison ne propose rien à annuler
