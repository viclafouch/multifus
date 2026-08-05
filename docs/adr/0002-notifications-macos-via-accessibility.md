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

## La livraison sans affichage a été testée, et elle ne marche pas

macOS 26 sépare la destination d'une notification de son style : trois cases, **Bureau**, **Centre de notifications** et **Écran verrouillé**, puis un style d'alerte temporaire ou persistant. L'espoir était de décocher **Bureau** en gardant **Centre de notifications**, ce qui livre la notification sans rien dessiner à l'écran, et d'attraper quand même l'élément que le centre construirait dans sa liste. L'observateur écoute `AXCreated` sur tout le processus et non la seule bannière, donc rien n'interdisait a priori qu'une entrée de liste le déclenche.

Essayé sur un vrai combat, avec un défi et un échange en plus : **aucune ligne au journal, aucune fenêtre ramenée**. macOS ne construit rien tant que le panneau n'est pas ouvert. La bannière visible est donc la condition de l'AutoFocus sur ce système, sans contournement.

Le moins gênant qui fonctionne, et c'est ce que l'interface conseille : bannière autorisée sur le Bureau, style **temporaire** pour qu'elle s'efface seule, son **coupé**, et les aperçus laissés sur « Par défaut » puisque c'est le corps de la notification qui porte le type d'événement.

La suppression des notifications au moment du focus, que fait Dracoon sur Windows, reste impossible sur macOS. Aucune API publique ne le permet.

L'Accessibilité non plus, et c'est la seconde piste à avoir été essayée plutôt que supposée. Elle sait presser un bouton, et l'observateur tient déjà l'élément de la bannière au moment où il en lit le texte : fermer dans la foulée de la lecture aurait coûté un appel. L'arbre d'une vraie bannière Dofus a donc été relevé pendant qu'elle était à l'écran.

```text
group 1 → group 1 → scroll area 1 → group 1
   ├─ static text  "Pseudo - Dofus Retro v1.48.21"
   └─ static text  "Untel te défie. Acceptes-tu ?"
group 1 → group 1 → group 1          (vide)
```

Aucun `AXButton`, et aucune action sur aucun élément. Il n'y a rien à presser. Le second groupe, vide, est l'emplacement où macOS dessine le bouton de fermeture **au survol**, ce qui le mettrait hors de portée sans déplacer le curseur de l'utilisateur en pleine partie. C'est l'injection d'entrée parasite que ce projet refuse par ailleurs, pour la même raison que le contournement Alt de Dracoon.

Une bannière Dofus reste donc affichée le temps que macOS lui donne. Son style temporaire et son son coupé sont tout ce sur quoi on peut agir.
