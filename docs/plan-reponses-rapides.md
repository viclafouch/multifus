# Les réponses rapides sur leur propre écran

Elles vivaient en bas de l'écran Raccourcis, sous les cinq actions, dans un
panneau qu'il fallait dérouler. Elles prennent leur ligne dans la barre de
gauche, entre Raccourcis et AutoFocus.

## Ce que l'écran dit

La phrase est du texte parlé : elle porte la police de titre (Fraunces), en
`text-row`, là où elle était en `text-note` grise. Tout autour est de la
machinerie, en Inter et en mono. C'est le seul écart de l'écran, et il sert à ce
que l'œil tombe sur les phrases.

La combinaison a d'abord été mise à gauche, la phrase à droite, comme un
dictionnaire. À l'écran, la ligne flottait : une colonne large et vide, et une
phrase sans champ visible au milieu de nulle part. La phrase reprend donc la
largeur de la ligne, dans un vrai champ, et les touches restent à droite comme
sur l'écran Raccourcis.

Une ligne vide dit ses deux manques, chacun sous ce qui lui appartient : « Sans
touches, il ne se passera rien. » sous les touches, « Sans texte, il n'y aura
rien à coller. » sous la phrase.

L'attente est partie. `ShortcutStatus::Pending` disait « Un instant, Multifus
s'en occupe. » à une ligne dont le système n'avait pas encore parlé. La seule
ligne dans ce cas était une réponse qu'on venait d'ajouter, parce que
`add_quick_reply` n'appelle pas `shortcuts::apply` : la phrase promettait un
travail que personne ne faisait, et elle restait là. L'état n'existe plus, ni
côté Rust ni côté écran, et une réponse absente de la table se lit désormais
pour ce qu'elle est, sans combinaison.

## Ce qui a bougé

- `ScreenName` gagne `quickReplies`, `Screen::QuickReplies` côté Rust, et la
  barre système la nomme comme la barre de gauche
- `src/screens/quick-replies/` : `index.tsx`, `reply-row.tsx`, `empty-replies.tsx`
- `src/constants/strings/quick-replies.ts` : les mots, sortis de `shortcuts.ts`,
  sous `strings.quickReplies`
- `ShortcutField` et `ShortcutUndoButton` servent deux écrans : ils passent dans
  `src/components/`
- `quickReplyEditLabel` dans `helpers/wording.ts` : deux lignes ne portent plus
  le même nom accessible

## À vérifier sur l'autre machine

- [ ] La barre système ouvre bien l'écran depuis « Réponses rapides »
- [ ] Une réponse qu'on vient d'ajouter dit « Sans touches, il ne se passera rien. », et plus « Un instant, Multifus s'en occupe. »
- [ ] Une réponse sans texte se laisse écrire, et la ligne cesse de le dire
- [ ] Deux réponses au même texte : le champ des touches garde deux noms lisibles
- [ ] Une combinaison déjà prise par le Défilement est refusée par son nom, et
      l'écran Raccourcis nomme toujours la réponse fautive
