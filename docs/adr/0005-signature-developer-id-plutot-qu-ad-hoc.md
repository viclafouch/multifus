# Signer avec une identité Apple, pour que l'autorisation survive aux versions

multifus ne peut rien faire sans l'Accessibilité. Lire les titres de fenêtres, changer le focus, entendre les bannières : les trois en dépendent. Cette autorisation se perdait à chaque compilation, et la cause n'est pas macOS qui oublie, c'est macOS qui ne reconnaît pas.

## Ce que TCC compare

macOS identifie un binaire par son **designated requirement**, l'expression que `codesign` associe à une signature. TCC enregistre cette expression dans la colonne `csreq` de sa base au moment où l'utilisateur accorde, puis la réévalue à chaque demande.

Pour du code signé ad hoc, ce qui est le cas de tout binaire macOS non configuré, cette expression dégénère en un `cdhash`, c'est-à-dire l'empreinte du binaire lui-même. Quinn, de l'assistance technique Apple :

> macOS tracks code identity using the code's designated requirement. Ad hoc signed code does not include a stable DR, and thus macOS is unable to tell that version N+1 of your app is the "same code" as version N.

Chaque compilation produit donc une application neuve aux yeux de TCC. L'entrée reste cochée dans Réglages Système, puisque le nom et l'identifiant n'ont pas bougé, et elle ne s'applique plus à rien. C'est exactement le symptôme observé, et c'est ce qui rendait `tccutil reset Accessibility com.viclafouch.multifus` nécessaire à chaque essai.

Signé avec une identité délivrée par Apple, le même binaire porte une expression de la forme `identifier "com.viclafouch.multifus" and anchor apple generic and certificate leaf[subject.CN] = "…"`. Aucune empreinte dedans : deux compilations successives satisfont la même expression, et l'autorisation tient d'une version à la suivante.

## Décision

Les paquets sont signés avec un certificat **Developer ID Application** puis notarisés, dans l'intégration continue et à partir de secrets. Ce n'est pas un choix entre deux options : distribuer hors de l'App Store impose ce type de certificat, et Apple impose la notarisation à ce qu'il signe. Un `Apple Development` donnerait la même stabilité d'identité mais ne peut pas être notarisé, donc ne peut pas être téléchargé sans être mis en quarantaine.

L'identité ne figure nulle part dans le dépôt. `APPLE_SIGNING_IDENTITY` porte un nom et un identifiant d'équipe, et ce projet s'écrit comme s'il était public.

## Ce que ça ne règle pas

**Rien pour `tauri dev`**, et pour deux raisons dont une seule aurait suffi.

D'abord `tauri dev` ne signe pas : la signature est une affaire d'empaquetage, `tauri build` la fait, le binaire brut de développement sort tel que l'éditeur de liens l'a laissé.

Ensuite, même signé, ça ne changerait rien. Un binaire lancé depuis un terminal voit TCC désigner le terminal comme **processus responsable** et lui attribuer la demande. C'est le terminal qui porte l'autorisation, jamais multifus. Ce qui a une conséquence rassurante : la boucle de développement est déjà stable, le terminal ne change pas de signature d'une compilation à l'autre.

L'autorisation qui se perdait ne concernait donc que l'application empaquetée, celle des soirées de vérification. C'est elle que cette décision répare, et rien d'autre.

## Ce qui reste à mesurer

Que l'autorisation survive effectivement d'une version signée à la suivante n'a pas encore été constaté, faute de deux versions signées à comparer. La bascule coûte de toute façon un `tccutil reset` de plus, une fois : l'entrée enregistrée aujourd'hui porte une expression liée à une empreinte, et la première version signée ne la satisfera pas.

## Sources

- [TN3127: Inside Code Signing: Requirements](https://developer.apple.com/documentation/technotes/tn3127-inside-code-signing-requirements)
- [Why does my app lose Screen Recording permission after updating (adhoc signature)?](https://developer.apple.com/forums/thread/795739)
- [The Curious Case of the Responsible Process](https://www.qt.io/blog/the-curious-case-of-the-responsible-process)
- [Tauri v2, signature macOS](https://v2.tauri.app/distribute/sign/macos/)
