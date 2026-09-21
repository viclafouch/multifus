# Aptabase

Le logiciel est mesuré. Le client est écrit à la main dans
`src-tauri/src/app/stats/` plutôt que pris sur étagère : le paquet publié
`tauri-plugin-aptabase` s'arrête à la version 1.0.0, sans drapeau TLS et sur
`reqwest 0.12`, alors que le projet est sur `reqwest 0.13` avec `rustls` et
`ring`. Le prendre ajoutait une seconde pile TLS et un second `reqwest`.

Une seule caisse est entrée, `time`, pour l'horodatage RFC 3339. Elle était déjà
compilée par `tauri-plugin-log`.

Aptabase mesure une application de bureau sans identifiant, sans cookie et sans
adresse IP gardée : sessions, versions, systèmes, pays, et la répartition de
chaque propriété qu'on lui envoie. Gratuit jusqu'à vingt mille événements par
mois, dix dollars ensuite.

Il ne sait pas dire combien de personnes ont le logiciel. Sans identifiant
persistant, deux sessions du même joueur à deux jours d'écart sont
incomparables : ni utilisateurs actifs mensuels, ni rétention. Le nombre
d'installations se lit ailleurs, dans le compteur de téléchargements de GitHub.

## Ce que seul Victor fait

Dans l'ordre :

- [ ] Créer le compte sur aptabase.com, ajouter l'application `Multifus`, choisir l'Union européenne, relever la clé `A-EU-...`
- [ ] Poser `APTABASE_KEY` dans les secrets du dépôt
- [ ] `APTABASE_KEY=A-EU-... pnpm run dev:app`, et voir `app_started` arriver dans le bac Debug du tableau de bord
- [ ] Décocher la case dans l'écran Réglages, relancer, vérifier que plus rien n'arrive
- [ ] Quitter Multifus réseau coupé, et chronométrer la fermeture. Le plafond est de cinq secondes, dans `ANSWER_CEILING`
- [ ] Regarder la ligne dans l'écran Réglages. Le badge « Anonyme » doit lire franchement vert, pas vert olive : il porte `plaque-leaf`, créé à côté de `plaque` dans `packages/retro`. Et la description doit tenir sur une ligne, 84 caractères contre 69 pour la plus longue ligne existante de cet écran. Si elle passe à la ligne, couper à « Ce que vous écrivez ne part pas. »

## Ce qui reste offert, à faire maintenant ou jamais

- [ ] Un script `pnpm downloads` qui lit `GET /repos/viclafouch/multifus/releases` et imprime le compte par fichier, donc la répartition Mac et Windows des installations. Trente appels par mois sur un quota de cinq mille par heure
- [ ] Le serveur MCP d'Aptabase, branché sur Claude Code, pour interroger les statistiques sans ouvrir le tableau de bord
- [ ] `authorized` part dans `app_stopped` et non dans `app_started` : au lancement, le premier balayage n'a pas encore répondu. Le porter aussi au lancement demande d'attendre ce balayage
- [ ] Dire la mesure dans la mise en route, et non seulement sur la page légale du site. La case est cochée d'avance : un joueur qui ne va jamais dans Réglages ne saura pas qu'elle existe

## Ce qui a été tranché, et pourquoi

- **Les douze classes, une propriété chacune**, `class_iop`, `class_eniripsa`
  et les dix autres, valant le compte de personnages de cette classe. Les douze
  partent toujours, même à zéro, sinon le tableau de bord confond « aucun
  Sacrieur » et « propriété absente ». Une seule chaîne triée aurait fait un
  groupe par joueur, illisible. Les classes sont posées par le joueur dans
  Multifus, jamais lues dans un fichier du jeu.
- **`characters_excluded` et la case `walk`.** Ni l'un ni l'autre n'est écrit
  dans le fichier de configuration : au lancement ils valent toujours zéro et
  faux. La promenade est couverte autrement, par `walk_turned_on` dans
  `app_stopped`, qui sépare « activée » de « utilisée ».
- **`health_checks`, `walk_switches`, `rune_table_opens`.** Aucun des trois ne
  passe par le journal : une bascule de promenade réussie et une ouverture de
  table des runes n'écrivent rien, et le raccourci de santé délègue à la
  fenêtre. Ils sont comptés à la main, respectivement dans `check_health`, dans
  `walk::switch_over` et dans `Multifus::set_rune_table_shown`.
- **`named_kind`, `named_class` et les autres tables de noms** répètent ce que
  serde déclare déjà sur ces énumérations. C'est voulu : si un `rename_all`
  bouge un jour, l'historique du tableau de bord reste comparable.

## Le budget

Deux événements par session, les rares compris, soit 2,1 en moyenne. Cent
joueurs qui ouvrent Multifus une fois et demie par jour font quatre mille cinq
cents sessions par mois, donc **9 450 événements**. Le palier gratuit de vingt
mille arrive vers deux cent dix joueurs actifs, le suivant tient jusqu'à deux
mille.

Aucun envoi ne part d'un chemin chaud : une bascule de fenêtre incrémente un
entier en mémoire, rien d'autre.
