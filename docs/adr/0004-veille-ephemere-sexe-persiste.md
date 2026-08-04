# La veille est éphémère, le sexe est persisté

Un personnage porte deux informations que multifus doit retenir, et elles n'ont pas la même durée de vie.

Le **sexe** est persisté indéfiniment. C'est un attribut intrinsèque du personnage, il ne change jamais, et le ressaisir à chaque session serait absurde. Il impose donc un roster stocké sur disque, indexé par pseudo.

L'**état de veille** est remis à zéro à chaque lancement. Les personnages endormis changent d'une session à l'autre selon ce que l'utilisateur fait, et une exclusion persistée que l'on a oubliée devient un piège : le défilement saute un personnage sans que l'on comprenne pourquoi, des semaines plus tard.

## Conséquences

Puisque la veille se resaisit à chaque session, elle doit être rapide à poser. D'où deux mécanismes qui n'existent pas dans Dracoon : un raccourci clavier qui endort ou réveille le personnage actuellement au premier plan, et deux boutons qui endorment ou réveillent d'un coup tous les personnages d'un sexe.

Ces boutons sont des **actions groupées**, pas un état de groupe. Cliquer sur « Endormir les femmes » pousse la veille sur chaque personnage concerné, exactement comme si l'on avait cliqué chaque ligne. On peut ensuite en réveiller une seule sans créer d'ambiguïté, parce que la veille reste une propriété du personnage et de rien d'autre.

Le roster ne se vide jamais tout seul. Un personnage que l'on ne joue plus reste visible, grisé, et se supprime à la main. Un oubli automatique après N jours effacerait silencieusement un sexe saisi à la main, et l'utilisateur retrouverait son personnage dans le mauvais camp sans comprendre.
