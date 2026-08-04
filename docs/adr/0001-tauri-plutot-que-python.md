# Tauri v2 plutôt que Python ou Electron

multifus reprend les idées de [Dracoon](https://github.com/Slyss42/Dracoon), écrit en Python dans un fichier Tkinter unique de 2120 lignes, exclusivement Windows. Le projet devait devenir multiplateforme et rester maintenable par un développeur TypeScript, ce que Python n'offrait pas.

Nous avons retenu **Tauri v2**, avec l'interface en React et TypeScript et la couche système en Rust.

## Options écartées

**Portage Python propre.** Le chemin le plus rapide, puisque le code de référence existe et que `pywin32` et `pyobjc` couvrent les deux systèmes. Écarté parce que le mainteneur ne veut pas entretenir du Python, et que produire un binaire signé sur deux plateformes avec PyInstaller est pénible.

**Electron.** Tout en TypeScript, aucun Rust à apprendre. Écarté sur un point technique dur : l'AutoFocus Windows repose sur `UserNotificationListener`, une API WinRT sans binding Node maintenu. La fonctionnalité principale du projet serait devenue son maillon faible. À quoi s'ajoutait un binaire de 150 Mo pour une application de barre système.

## Conséquences

Le mainteneur écrit l'essentiel du projet dans un langage qu'il maîtrise. Le Rust reste confiné à la couche système, quelques centaines de lignes derrière deux interfaces stables. La crate `windows` couvre WinRT nativement, ce qui règle précisément le point qui a disqualifié Electron.
