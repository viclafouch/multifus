# Abandon de l'ordre d'initiative et du réordonnancement de la barre des tâches

Dracoon confond deux notions sous le même nom. L'**ordre d'initiative** détermine qui joue avant qui en combat ; il est dynamique et change avec l'équipement. L'**ordre de défilement** est la séquence parcourue par les raccourcis clavier ; il sert aux échanges et aux crafts. Dracoon les fusionne, et va jusqu'à réordonner physiquement la barre des tâches Windows pour refléter l'initiative.

multifus ne garde que le **défilement**, et supprime l'ordre d'initiative ainsi que le réordonnancement de la barre des tâches.

L'AutoFocus rend l'ordre d'initiative inutile : la notification de combat désigne nommément le personnage qui doit jouer, ce qui est plus précis et plus rapide que n'importe quel classement maintenu à la main.

## Conséquences

Disparaît avec cette décision toute la manipulation COM de Dracoon : `SHGetPropertyStoreForWindow`, l'écriture de l'`AppUserModelID` pour dégrouper puis regrouper les fenêtres, et le pilotage du Z-order. C'était le code le plus fragile du projet, avec des indices de vtable écrits en dur, et il n'avait aucun équivalent possible sur macOS où le Dock ne groupe pas de la même façon.

Une liste réordonnable au drag and drop subsiste, mais elle ne pilote plus que le défilement. Elle n'a plus aucun effet sur l'affichage du système.
