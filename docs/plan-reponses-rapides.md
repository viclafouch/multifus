# Les réponses rapides sur leur propre écran

Elles vivaient en bas de l'écran Raccourcis, sous les cinq actions, dans un
panneau qu'il fallait aller chercher. Elles prennent leur ligne dans la barre de
gauche, entre Raccourcis et AutoFocus, et la barre système les nomme pareil.

## Ce que l'écran dit

La réponse est ce dont l'écran parle : elle porte la police de titre en
`text-row`, là où elle était en `text-note` grise, et le reste de la ligne est de
la machinerie, en Inter et en mono. C'est le seul écart de l'écran, et il sert à
ce que l'œil tombe sur les réponses.

La combinaison a d'abord été mise à gauche, la réponse à droite, comme un
dictionnaire. À l'écran, la ligne flottait : une colonne large et vide, et une
réponse sans champ visible au milieu de nulle part. La réponse a donc repris la
largeur de la ligne, dans un vrai champ, et les touches sont restées à droite
comme sur l'écran Raccourcis. La ligne est celle d'avant, à la police et au
message près : c'est ce qui tient debout.

Une ligne vide dit ses deux manques, chacun sous ce qui lui appartient : « Sans
touches, il ne se passera rien. » sous les touches, « Sans texte, il n'y aura
rien à coller. » sous la réponse.

« Ajouter une réponse » ferme le panneau, à l'endroit où la nouvelle ligne
apparaîtra. Le panneau vidé de ses lignes laisse la place à un cadre en
pointillés qui montre à quoi ressemble une réponse rangée — `Ctrl` `Alt` `B`
« Bon jeu à toi ! » en grisé, sous un accélérateur d'exemple qui n'est rangé sous
rien — puis « Aucune réponse rangée » et le bouton.

L'attente est partie. `ShortcutStatus::Pending` disait « Un instant, Multifus
s'en occupe. » à une ligne dont le système n'avait pas encore parlé. La seule
ligne dans ce cas était une réponse qu'on venait d'ajouter, parce que
`add_quick_reply` n'appelle pas `shortcuts::apply` : la phrase promettait un
travail que personne ne faisait, et elle restait là. L'état n'existe plus, ni
côté Rust ni côté écran, et une réponse absente de la table se lit désormais
pour ce qu'elle est, sans combinaison.

## Ce qui a bougé

- `ScreenName` gagne `quickReplies`, `Screen::QuickReplies` côté Rust, et les
  deux barres portent le même libellé
- `src/screens/quick-replies/` : `index.tsx`, `reply-row.tsx`, `empty-replies.tsx`
- `src/constants/strings/quick-replies.ts` : les mots, sortis de `shortcuts.ts`,
  sous `strings.quickReplies`. Ils disent « réponse », jamais « phrase » :
  CONTEXT.md ne connaît que la réponse rapide
- `ShortcutField` et `ShortcutUndoButton` servent deux écrans : ils passent dans
  `src/components/`
- `use-shortcut-editing.ts` : les deux écrans tenaient le même état d'édition
- `quickReplyEditLabel` nomme les touches par le rang de la ligne, et par son
  texte quand elle en a un : deux lignes au même texte, ou deux lignes vides, ne
  portent plus le même nom
- `quickReplyOf`, `strike` et `keyCapsOf` passent dans `src/test-doubles.ts` :
  les deux écrans les recopiaient

## À vérifier sur l'autre machine

- [ ] La barre système ouvre bien l'écran depuis « Réponses rapides »
- [ ] Une réponse qu'on vient d'ajouter dit « Sans touches, il ne se passera rien. », et plus « Un instant, Multifus s'en occupe. »
- [ ] Une réponse sans texte se laisse écrire, et la ligne cesse de le dire
- [ ] Une combinaison déjà prise par le Défilement est refusée par son nom, et
      l'écran Raccourcis nomme toujours la réponse fautive
- [ ] L'indice sous un champ de touches se lit sans plisser les yeux, sur les
      deux écrans : il est passé de `text-muted-foreground/75` au ton plein
