# Déplacement rapide sans une fenêtre à parcourir

Le Déplacement rapide restait allumé quand le dernier client du jeu se fermait :
la case restait cochée dans la fenêtre, le menu de la barre système aussi, et
Multifus gardait le tap sur les clics pour un défilement vide.

## Ce qu'on change

- Le tour qui ne voit plus une seule fenêtre de jeu éteint le Déplacement rapide
- L'écran et le menu de la barre système repassent sur ÉTEINT au même tour, et la
  bannière se ferme avec
- Le journal écrit « Déplacement rapide éteint depuis Multifus, qui n'avait plus
  une fenêtre à parcourir »

## Décidé

- L'extinction se lit sur un passage, pas sur un état : `Walk::remember` compare
  ce que le Déplacement rapide surveillait à ce qu'il surveille maintenant, sous
  le verrou du plan, et dit le passage. Allumé sans un seul client ouvert, il
  reste allumé et attend, sinon il s'éteindrait dans la seconde qui suit le geste
  du joueur
- Trois passages mènent à la même extinction, et le journal n'en distingue aucun :
  les clients fermés, les clients revenus à l'écran de connexion après un quart
  d'heure sans rien faire, et l'autorisation retirée. Dans les trois cas Multifus
  n'a plus une fenêtre où aller. Une phrase qui parlerait de fermeture mentirait
  deux fois sur trois, et Retro déconnecte une team qui attend
- `walk::refresh` rend un booléen plutôt que d'émettre lui-même le snapshot : le
  tour tient déjà la décision d'émettre, et walk n'a pas à connaître `runtime`.
  Le tour dirait déjà oui par un autre chemin, les personnages passant hors ligne
  au même tour ; le drapeau tient quand même sa ligne, comme les cinq autres du
  tour, et ne fait pas dépendre l'écran d'un raisonnement de côté

## À vérifier sur l'autre machine

- [ ] Deux clients ouverts, Déplacement rapide allumé, fermer les deux : la case
      de l'écran se décoche seule, la barre système dit ÉTEINT, la bannière part
- [ ] Rouvrir un client : le Déplacement rapide reste éteint, et le raccourci le
      rallume
- [ ] L'allumer au raccourci sans un seul client ouvert : il reste allumé
- [ ] Laisser la team se déconnecter toute seule, les clients ouverts sur l'écran
      de connexion : le Déplacement rapide s'éteint, et la ligne du journal se lit
      sans mentir
- [ ] Le tour ne marque pas d'à-coup pendant l'extinction : elle ferme la bannière
      et arrête l'écoute des clics depuis le fil du scan
