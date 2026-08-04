# Lire les notifications macOS par l'API Accessibility, pas par la base usernoted

Sur Windows, `UserNotificationListener` fournit les notifications des autres applications de façon officielle et événementielle. macOS n'a aucune API équivalente. Nous lisons donc le **texte de la bannière affichée**, via un `AXObserver` posé sur le processus `com.apple.notificationcenterui`.

La route évidente était la base SQLite du centre de notifications, `~/Library/Group Containers/group.com.apple.usernoted/db2/db`. Elle contient bien le titre et le corps, dans un format identique à Windows. **Elle est écrite 5,1 secondes après l'affichage**, au moment où la bannière quitte l'écran. Inutilisable pour un changement de tour en combat.

## Mesures

Chaque route a été testée sur macOS 26.3 en postant une notification et en mesurant le délai de détection.

| Route                                             | Latence    | Contenu lisible            |
| ------------------------------------------------- | ---------- | -------------------------- |
| Base SQLite `usernoted`                           | 5115 ms    | oui                        |
| Création d'une fenêtre de bannière (CoreGraphics) | jamais     | non                        |
| Journal unifié `log stream`                       | 110 ms     | non, masqué en `<private>` |
| **Bannière via Accessibility**                    | **235 ms** | **oui**                    |

Les 235 ms incluent la surcouche AppleScript du prototype et le polling. Un `AXObserver` natif en push élimine cette marge.

Les bannières ne créent pas de fenêtre, elles sont dessinées dans une fenêtre permanente du centre de notifications, ce qui ferme la détection par CoreGraphics.

## Conséquences

multifus n'a **pas besoin de l'Accès complet au disque** sur macOS. L'Accessibilité suffit, et elle est de toute façon nécessaire pour lire les titres de fenêtres et changer le focus. Une seule autorisation à accorder.

En contrepartie, si l'utilisateur coupe les bannières pour Dofus dans les réglages système, l'AutoFocus cesse de fonctionner. Cette dépendance à un réglage système n'existe pas sur Windows, où l'écoute se fait au niveau de l'API et non de l'affichage.

La suppression des notifications au moment du focus, que fait Dracoon sur Windows, reste impossible sur macOS. Aucune API publique ne le permet.
