# Une réponse rapide se colle dans le jeu, et le périmètre s'ouvre d'un cran

Le périmètre refusait « toute forme d'automatisation du jeu », et nommait la
simulation d'une action de jeu. Cette décision ouvre une exception, une seule, et
en écrit les bords.

## Le problème

On fait ses métiers. Quelqu'un demande un craft, le relais le fait savoir, on
revient devant le client. Suivent toujours les mêmes trois questions, et toujours
les mêmes trois réponses : le prix, un merci, un de rien. On les retape à la main
plusieurs fois par soirée.

Un texte tout prêt sous une combinaison ferme ce trou. La question n'est pas de
savoir si c'est utile, elle est de savoir si multifus a le droit d'écrire dans le
jeu.

## Ce que le refus visait

Le refus d'origine vise l'outil qui joue à la place du joueur : lire la mémoire
du client, enchaîner des actions, empêcher la déconnexion pour inactivité. Le
périmètre le dit ailleurs en toutes lettres, un anti-inactivité est exactement ce
qu'Ankama interdit.

Le plan garde d'ailleurs une trace du geste voisin, et l'appelle un piège :
Dracoon injecte une vraie frappe Alt dans l'application active pour contourner
une restriction de `SetForegroundWindow`, ce qui envoie une touche parasite dans
le jeu. multifus ne l'a jamais fait et ne le fera pas.

Les mots employés, « ne simule aucune action de jeu », sont plus larges que ce
qu'ils visaient. Ils attrapent au passage un copier-coller.

## Ce qu'une réponse rapide n'est pas

Elle ne part que sur un appui de l'utilisateur, jamais toute seule et jamais sur
un minuteur. Elle ne part que si une fenêtre Dofus est au premier plan. Elle
colle un texte que l'utilisateur a écrit lui-même, là où il était déjà en train
d'écrire : le chat, un message privé, un champ quelconque du jeu. multifus ne
choisit pas la destination et ne l'ouvre pas. Elle n'envoie rien.

Elle ne rallonge aucune absence, ne gagne aucun tour de combat, ne décide rien à
la place de personne. Ce qu'elle remplace est le copier-coller que l'utilisateur
ferait à la main, deux gestes plus loin.

C'est le point le plus discutable du projet, et il est écrit ici plutôt que caché
dans une fonction.

## Décision

multifus a le droit de poser **une combinaison et une seule** sur le système, la
combinaison de collage, `Control+V` sur Windows et `Super+V` sur macOS, vers la
fenêtre du jeu au premier plan, en réponse à un appui de l'utilisateur.

Le presse-papiers est emprunté et rendu. Son contenu textuel est relu avant le
collage et réécrit après, pour que ce que l'utilisateur avait copié survive à une
réponse rapide.

Rien d'autre n'est posé sur le système. Pas de touche Entrée, pas d'ouverture du
chat, pas de séquence.

## Ce que ça coûte

**Du code natif neuf des deux côtés.** `SendInput` sur Windows, `CGEventPost` sur
macOS. C'est la première fois que multifus écrit vers le système au lieu de le
lire, et la frontière `platform` gagne une quatrième interface pour ça.

**Le presse-papiers de l'utilisateur, le temps d'un collage.** Rendre l'ancien
contenu trop tôt colle l'ancien contenu, le client lisant le presse-papiers quand
il traite l'événement. Le délai se mesure et ne se devine pas. Un presse-papiers
qui ne porte pas de texte, une image ou un fichier, ne se rend pas : il est
perdu, et l'écran le dit.

**Un extrait du texte dans le journal.** Ce fichier est fait pour être transmis,
et il portera désormais les quarante premiers caractères de ce que l'utilisateur
a écrit. C'est son texte à lui et non le corps d'un message reçu, donc
l'[ADR 0006](./0006-journal-sur-disque.md) ne s'y oppose pas, mais la ligne est
nouvelle et elle est écrite ici.

## Ce qui reste refusé

**L'envoi.** Coller n'est pas envoyer, et la touche Entrée reste celle de
l'utilisateur.

**Le texte sur plusieurs lignes.** Un saut de ligne collé dans le chat envoie le
message, ce qui ferait rentrer l'envoi par la porte de derrière.

**Les réponses rapides par personnage.** Même refus que l'AutoFocus par
personnage, avec le motif d'origine du périmètre.

**Répondre depuis le téléphone.** Le relais reste à sens unique. Une réponse
rapide se frappe au clavier, devant le jeu.

## Ce qui remplaçait cet ADR, et ne le remplace plus

La mesure, faite le 24 août 2026 sur un vrai client Retro, sur le Mac. Un
`Super+V` posé par `CGEventPost` arrive dans le chat, avec `Control` et `Shift`
physiquement tenus, et l'ancien presse-papiers revient. Cet ADR tient donc, et
les quatre réponses sont dans [plan.md](../plan.md).

**Sur Windows, la mesure n'a pas été faite.** Le code est écrit et n'a jamais été
vu marcher. Si `SendInput` n'arrive pas jusqu'au jeu de ce côté-là, ce n'est pas
cet ADR qui tombe mais la parité : la réponse rapide se colle sur un système et
remplit seulement le presse-papiers sur l'autre, et ça s'écrira ici.

## Le mot

Cette fonctionnalité s'est appelée « phrase » pendant tout son cadrage, et le mot
est mort à la première relecture de l'écran : il ne dit pas qu'on peut coller. Le
mot est **réponse rapide** partout depuis, interface et code compris, et
CONTEXT.md le porte.
