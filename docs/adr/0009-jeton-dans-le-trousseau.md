# Le jeton du robot vit dans le trousseau du système

Le relais a besoin d'un jeton de robot Telegram. Le fichier de configuration de multifus est du JSON en clair.

## Le problème

Ce fichier porte déjà des pseudos, des sexes assignés et l'ordre du défilement, ce que l'ADR 0006 assume. Un jeton n'est pas de la même nature : qui le détient peut écrire dans le salon de l'utilisateur en se faisant passer pour multifus, et lire ce que l'utilisateur envoie au robot.

Le fichier n'est protégé que par les droits du dossier personnel. Un secret qui s'y trouve part avec une sauvegarde, avec une synchronisation de dossier, et avec la configuration qu'on copie sur une autre machine sans y penser.

## Ce qui a été écarté

**Le fichier en clair**, refusé pour ce qui précède.

**Une variable d'environnement.** Il faudrait la poser dans l'environnement d'une application lancée par `launchd` à l'ouverture de session, ce qui est le plus mauvais endroit pour un secret et le plus fragile pour un réglage.

**`tauri-plugin-stronghold`**, la voie officielle du catalogue Tauri. Deux motifs, dont un suffit : ses mainteneurs l'annoncent dépréciée et retirée en v3, et elle n'utilise pas le trousseau du système, elle chiffre un coffre avec un mot de passe qu'il faut ensuite ranger quelque part.

**Le plugin communautaire qui enveloppe `keyring`.** Il expose des liaisons JavaScript, donc un chemin de lecture du secret vers le webview, alors que la décision ci-dessous consiste précisément à ne jamais en avoir un.

## Décision

La crate `keyring`, en version 4, appelée depuis Rust et depuis Rust seul. Trousseau sur macOS, Credential Manager sur Windows, ce qui tient la règle du périmètre sur les deux systèmes avec une seule dépendance. Aucun plugin, aucun paquet npm, comme pour l'updater dont rien n'est exposé au webview.

**La déclaration est `keyring = "4"`, sans liste de traits**, et une version antérieure de cette décision demandait le contraire. Elle nommait `apple-native` et `windows-native` : ces traits n'existent pas en version 4, où ils s'appellent `apple-native-keyring-store` et `windows-native-keyring-store`. Et les nommer explicitement ne compile pas :

```
error: At least one of the `keychain` or `protected` features
       must be enabled on macOS
```

parce que le trait de `keyring` n'active pas le sous-trait du magasin. Le trait par défaut `v1` fait déjà exactement ce que la consigne cherchait : il active `apple-native-keyring-store/keychain` sur macOS et `windows-native-keyring-store` sur Windows, déjà conditionnés par cible, et installe le magasin tout seul à la première entrée. Trois crates en plus dans l'arbre, sur chacun des deux systèmes.

**Le jeton se lit à l'activation du relais, et pas au lancement.** C'est la conséquence directe de la mesure ci-dessous. Lu au lancement, il ouvre une boîte de trousseau à chaque `tauri dev`, y compris pour travailler sur les raccourcis. Lu à l'activation, l'invite tombe au seul moment où l'utilisateur est devant sa machine pour y répondre, et il garde le jeton pour la durée de l'activation. Un trousseau qui refuse **empêche alors le relais de s'activer**, plutôt que de laisser partir quelqu'un qui le croit en marche.

**Le jeton entre par une commande et ne ressort jamais.** React l'envoie une fois à l'appariement, ne le relit pas, et l'écran n'affiche qu'un état, relié ou pas relié. C'est une propriété du modèle et pas une discipline à tenir : il n'existe aucune commande qui rende le jeton.

Le fichier de configuration garde l'identifiant de salon, qui n'est pas un secret, et le réglage d'envoi du corps. Le trousseau ne garde que le jeton.

**Deux questions, et une seule s'adresse au trousseau.** Une version antérieure de cette décision écrivait ici « la question _le relais est-il configuré_ se répond en interrogeant le trousseau une fois au lancement », ce qui contredit le paragraphe précédent et rouvre l'invite que la mesure interdit. Les deux questions se séparent ainsi :

| La question                              | Qui répond                                 | Quand                           |
| ---------------------------------------- | ------------------------------------------ | ------------------------------- |
| Le relais peut-il s'activer maintenant ? | le trousseau                               | à l'activation, une fois        |
| Le relais a-t-il déjà été installé ici ? | la configuration, par la présence du salon | à chaque snapshot, gratuitement |

La seconde est celle que dessinent l'écran Relais et l'article de la barre système, qui se reconstruisent plusieurs fois par minute. Le salon et le jeton sont écrits et effacés ensemble par l'appariement, donc le fichier répond fidèlement. Une réponse périmée coûte un clic qui atterrit sur l'écran Relais au lieu d'allumer, et l'activation, elle, lit le trousseau et corrige la vue.

## Ce que l'ADR 0005 ne dit pas ici

L'[ADR 0005](./0005-signature-developer-id-plutot-qu-ad-hoc.md) explique que la boucle de développement est stable pour l'Accessibilité, parce que TCC désigne le terminal comme processus responsable et lui attribue l'autorisation. **Cette règle ne s'applique pas au trousseau**, dont l'accès s'évalue sur la signature du binaire qui demande. Un `target/debug/multifus` qui change à chaque compilation peut donc provoquer une invite de trousseau à chaque essai.

C'est une gêne de développement, sur une seule machine, et jamais celle de quelqu'un qui a installé l'application signée avec un certificat Developer ID, dont l'identité est stable d'une version à la suivante. Elle ne justifie pas de laisser un secret en clair.

**L'invite se produit vraiment, et c'est mesuré.** Un binaire de débogage écrit une entrée, la relit, puis on modifie une ligne de source, on recompile et on relit :

| Ce qui lit                                  | Réponse                                 |
| ------------------------------------------- | --------------------------------------- |
| le binaire qui a écrit                      | rendu en 1 s                            |
| le même binaire, seconde lecture            | rendu en 1 s                            |
| le binaire recompilé après une modification | bloqué, une boîte de dialogue attendait |

Cliquer « Toujours autoriser » ne sert à rien : l'autorisation est accordée à l'identité du binaire, et une signature ad hoc change à chaque compilation. C'est ce qui décide de lire le jeton à l'activation plutôt qu'au lancement.

## Ce que ça coûte

**Un chemin d'échec nouveau.** Le trousseau peut refuser. L'écran et le journal doivent alors dire « le jeton n'est plus lisible » et non « le relais est en panne », qui enverrait le lecteur chercher un problème de réseau.

**Une configuration qui ne suffit plus à elle seule.** Copier son fichier de configuration sur une autre machine y amène le roster, les raccourcis et l'identifiant de salon, mais pas le jeton, qu'il faut recoller. C'est le prix direct de la décision et il est accepté.

**Une dépendance et deux implantations à vérifier**, une par système. La crate est active, seize millions de téléchargements et une publication cette semaine, mais son architecture a changé en version 4 : le cœur est passé dans `keyring-core` et les magasins dans des crates séparées. La déclaration reste `keyring = "4"` sans liste de traits, pour la raison que la section « Décision » démontre en citant l'erreur du compilateur. Une version antérieure de ce paragraphe demandait ici le contraire, `apple-native` et `windows-native` : ces traits n'existent pas, et les vrais noms ne compilent pas davantage.

**Un chemin réseau où le secret circule dans une URL.** Le jeton est le chemin de l'appel Telegram, et `reqwest` met l'URL dans le `Display` de ses erreurs, ce que sa propre documentation signale. Une erreur de transport recopiée telle quelle dans le journal y écrirait le jeton, dans un fichier qui vit des semaines et qu'on colle dans un rapport de bug. `crate::app::relay::telegram` retire l'URL avant toute mise en chaîne, et c'est la seule chose qui tient cette règle.

## Sources

- [keyring-rs](https://github.com/open-source-cooperative/keyring-rs)
- [Tauri, stockage de secrets, dépréciation de stronghold](https://github.com/orgs/tauri-apps/discussions/7846)
- [tauri-plugin-stronghold](https://v2.tauri.app/plugin/stronghold/)
