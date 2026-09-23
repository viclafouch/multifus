# Windows 11

Ce que seule la machine Windows tranche. Rien ici ne se vérifie depuis le Mac :
la compilation croisée vers Windows casse sur `ring`, qui réclame les en-têtes
MSVC.

Dans l'ordre. La première ligne garde les trois autres.

- [ ] Lancer `tauri dev` et voir la fenêtre s'ouvrir : `constants/system.ts` lit au chargement un objet que seul `tauri_plugin_os::init()` pose dans la page, et une fenêtre blanche est le seul symptôme
- [ ] Vérifier que Dofus Retro apparaît dans Paramètres › Confidentialité et sécurité › Notifications, et que Multifus entend une notification : sans `UserNotificationListener`, le logiciel n'entend rien et le reste ne compte plus
- [ ] Vérifier qu'un bouton par personnage sépare les fenêtres dans la barre des tâches, l'identifiant d'application étant posé fenêtre par fenêtre
- [ ] Relire la mise en route sur l'écran : les mots doivent être ceux que Windows 11 affiche, et les cinq captures manquantes se prennent là, jamais sur Windows 10

Une notification se rejoue sans le jeu. Un script PowerShell qui l'envoie sous un
identifiant d'application contenant « dofus » suffit à `UserNotificationListener`.

Le site répond déjà « Oui » à « Ça marche sur Windows 11 ? », dans
`apps/website/src/constants/questions.ts`. Cette réponse tient à la troisième
ligne.
