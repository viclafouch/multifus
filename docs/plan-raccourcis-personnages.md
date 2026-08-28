# Un personnage, une touche

Chaque personnage du roster peut recevoir sa propre combinaison, qui ramène sa
fenêtre devant depuis n'importe quelle fenêtre du jeu. Personne n'en a par
défaut, deux personnages ne peuvent pas garder la même, et le raccourci
Personnage principal reste à part : le principal répond donc à deux
combinaisons, et c'est voulu. L'écran n'en dit rien : la ligne du principal est
une ligne comme les autres.

## Ce que l'écran dit

L'écran Raccourcis gagne un second panneau sous les cinq actions, « Un
personnage, une touche ». Une ligne par personnage du roster, dans l'ordre du
défilement : la tête de classe, le pseudo, « Iop · Connecté » en dessous, et le
même champ de combinaison que les cinq actions. Déconnecté, la ligne pâlit et la
tête passe en gris, comme sur l'écran des messages privés.

L'exemple de la description suit la machine. Sur Windows, une touche de fonction
se pose seule : « F1 sur l'Eniripsa, F2 sur le Sacrieur ». Sur le Mac, où `F1` à
`F12` sont au système, la description montre `Ctrl+Maj+1` et ne promet aucune
touche seule.

Le personnage principal porte l'étoile allumée à côté de son pseudo, la même que
sur l'écran Personnages, et c'est le même composant. Elle ne se clique pas : elle
dit seulement qui il est.

Une ligne sans touches ne dit rien : c'est le cas normal, et non un
avertissement. La phrase sous le champ ne revient que pour un refus ou un
doublon.

Roster vide, le panneau porte une ligne : le personnage arrive tout seul dès
qu'on entre en jeu.

Les deux notes du bas de l'écran valent pour les deux panneaux. « Remettre les
touches d'origine » ne touche qu'aux cinq actions : les personnages n'ont pas de
touches d'origine à retrouver.

## Ce que le code fait

`Binding` gagne `Character { nickname }` et perd `Copy` : un pseudo est une
`String`. `bindings()` réclame les combinaisons dans l'ordre actions,
personnages, réponses rapides, mais ce n'est pas cet ordre qui tranche un
doublon : `claiming_order` fait passer devant tout ce qui tient déjà sa
combinaison, et le reste demande ensuite. Celui qui l'a eue en premier la garde,
et c'est le nouveau venu qui porte le refus, où qu'il soit dans la liste.
Multifus se souvient pour cela de la combinaison que chaque raccourci a
réellement obtenue, et `set_bound` la met à jour à chaque `apply`.

La combinaison se range sur le `Character`, dans `shortcut`. Retirer le
personnage du roster emporte sa touche, et `remove_character` rejoue
`shortcuts::apply` pour que le système la rende. Tirer une ligne ne rejoue rien :
depuis que le tenant passe devant, l'ordre de la liste ne décide plus d'un
doublon.

`Shortcut` a quitté `config::settings` pour `domain::shortcut`. Sans ce
déménagement, `domain::character` importerait `config`, qui importe déjà
`domain` : les deux modules se seraient tenus l'un l'autre.

La frappe passe par `decide_character_shortcut`, qui rend un `CharacterAim` :
la fenêtre où aller, ou une issue réglée d'avance. Le journal porte
`CharacterShortcut { nickname, outcome }`, et son `CharacterShortcutOutcome` ne
liste que les sept issues qu'un raccourci de personnage peut avoir — le pseudo
est sur l'événement, pas répété dans l'issue. La ligne « Raccourcis : » saute
les personnages sans touches : ils sont la majorité du roster, et leur silence
n'apprend rien.

## La saisie rend les touches au système

Une combinaison posée est un raccourci global : le système la garde pour
Multifus et ne la redescend plus à personne, pas même à la fenêtre de Multifus.
Le champ ouvert ne voyait donc jamais une touche déjà posée ailleurs, et la
frappe se perdait sans un mot.

Un champ ouvert appelle `suspend_shortcuts`, qui rend tout au système, et sa
fermeture appelle `resume_shortcuts`, qui repose ce qui doit l'être. Les deux
tiennent à un effet monté sur le champ en cours : quelle que soit la sortie —
une combinaison posée, Échap, un clic ailleurs, l'écran quitté — les touches
sont reprises, et rien ne peut rester rendu.

`apply` tient le verrou d'un bout à l'autre : deux appels lancés en même temps
ne peuvent plus se lire l'un l'autre à moitié. Il ne répète plus sa ligne de
journal quand rien n'a changé, sinon chaque champ ouvert puis refermé en
écrirait une, et les deux commandes renvoient le tableau de bord pour que
l'écran suive.

## À vérifier sur les deux machines

- [ ] `F1` posée sur un personnage sous Windows, `Ctrl+Maj+1` sur le Mac : la frappe depuis une autre fenêtre du jeu le ramène devant
- [ ] La même touche posée sur un second personnage : c'est lui qui porte le refus, même s'il est plus haut dans la liste
- [ ] Le premier des deux libère sa touche : le second la prend, et le refus part
- [ ] Une touche déjà prise par une action : la ligne du personnage est refusée. La même touche posée ensuite sur une réponse rapide : c'est la réponse rapide qui est refusée
- [ ] Frapper la touche en étant déjà sur le personnage : rien, et le journal le dit
- [ ] Un personnage déconnecté : la frappe ne bouge rien, et le journal parle de sa fenêtre disparue
- [ ] Retirer le personnage du roster : sa touche part avec lui, et la reposer sur un autre personnage marche du premier coup
- [ ] Le principal porte l'étoile à côté de son pseudo, et lui seul
- [ ] Le principal répond à sa touche comme au raccourci Personnage principal
- [ ] « Remettre les touches d'origine » ne touche pas aux personnages
- [ ] Quitter Multifus et le relancer : les touches des personnages sont les mêmes
- [ ] Le journal ne porte pas une ligne de personnages sans touches à chaque `apply`
- [ ] `F2` posée sur un personnage, puis frappée dans le champ d'un autre : le champ la prend, et la ligne dit qui la tient déjà
- [ ] Une touche déjà posée reste frappable dans n'importe quel champ, et le journal ne se remplit pas de lignes « Raccourcis : » à chaque ouverture
- [ ] Un champ ouvert puis quitté au clic ailleurs, à Échap, ou en changeant d'écran : les raccourcis répondent de nouveau dans le jeu
- [ ] Une ligne sans touches ne porte aucune phrase sous son champ
- [ ] Tirer une ligne du roster ne coupe pas les raccourcis le temps du tirage
