# L'écran À propos

Cet écran est le plus vieux de Multifus, écrit quand il ne savait faire que
l'AutoFocus. Depuis sont arrivés la roue, le tableau des runes, les réponses
rapides, le Déplacement rapide, le principal, l'exclusion et les messages
privés. L'écran n'en sait rien, et il ment sur deux points.

## Ce qu'on a trouvé

**Le système est dans l'instantané, et personne ne le montre.** `snapshot.system`
part de Rust à chaque tour, et seul le journal copié le lit. L'écran À propos,
que l'on ouvre justement quand rien ne marche, ne dit pas sur quoi Multifus
tourne. Le plan portait déjà cette ligne.

**Le mot du système est écrit pour une machine.** `tauri_plugin_os` rend
« macos 26.0.0 aarch64 ». On le donne à lire à un joueur, donc on l'écrit
« macOS 26.0.0 (arm64) ».

**« Tout remettre à neuf » énumérait, et mal.** L'écran promettait « Roster vidé,
sexes oubliés, raccourcis et AutoFocus d'origine » quand le `reset` de Rust remet
`Settings::default()` en entier et oublie le robot Telegram du trousseau. Une
liste de onze mots ne se lit pas : l'écran dit maintenant « Multifus repart comme
au premier lancement », qui couvre tout et se lit en une seconde.

**« Multifus ne touche pas au jeu » ne disait ni les paquets ni les clics.** Le
paquet est le mot du joueur : c'est par là que passent les robots, et c'est donc
la promesse qu'il attend. La phrase nomme maintenant les trois, la mémoire, les
fichiers et les paquets, puis dit ce que Multifus prend vraiment, les fenêtres,
les notifications et les clics. Le README porte la même promesse.

**Telegram se lisait comme une fatalité.** « Les messages privés relayés sur
Telegram » laissait croire que tout part sur le téléphone. Le relais est un
choix, et la ligne le dit : « seulement si vous reliez Telegram ».

**Rien ne mène au projet.** Aucun chemin vers le code, aucun vers l'endroit où
raconter un bug. C'est l'écran qui devrait les porter.

**Le chemin des réglages ne se copie ni ne s'ouvre.** Il est écrit en toutes
lettres sur deux lignes, et on ne peut rien en faire. Le journal, lui, a déjà
ses deux boutons.

**Le presse-papiers reste hors de l'écran, et c'est voulu.** Une réponse rapide
emprunte le presse-papiers du système, y pose le texte, frappe le collage, et le
rend 150 ms plus tard. Le paragraphe qui le racontait a été écrit, puis retiré :
il parlait de mécanique à quelqu'un qui vient lire trois lignes, et la ligne
« il ne joue jamais à votre place » dit déjà ce qui compte, la touche restant
celle du joueur. Ne pas le remettre.

## La voix de l'écran

Le lecteur a entre dix et trente ans, il joue, il n'a jamais écrit une ligne de
code et ne connaît pas GitHub. Il veut retourner jouer : une ligne par idée, et
il passe. L'écran ne dit donc ni dépôt, ni ticket, ni licence, il n'énumère
jamais ce qu'il peut résumer, et il évite le verbe faire, qui revenait partout.
Les mentions légales tiennent en trois lignes menées chacune par sa phrase en
gras, celle qu'on lit en diagonale : Multifus n'a rien à voir avec Ankama, il ne
touche pas au jeu, rien ne quitte votre ordinateur.

## Ce qu'on a décidé

L'écran passe en quatre panneaux :

1. **Identité** : le nom en Fraunces avec la pastille ambrée de la barre de
   gauche, une phrase qui dit ce qu'est Multifus, puis trois faits, la version,
   le système, et le chemin des réglages avec ses deux boutons, copier et ouvrir
   le dossier.
2. **Le projet** : la mise à jour, comment Multifus est développé, signaler un
   problème.
3. **Mentions légales** : trois paragraphes, chacun mené par sa phrase en gras.
4. **Tout remettre à neuf** : la même action, résumée en deux phrases.

## Ce que ça demande à Rust

- `system()` écrit « macOS 26.0.0 (arm64) » au lieu de « macos 26.0.0 aarch64 ».
  Le journal en profite : « Multifus 0.1.0 a démarré sur macOS 26.0.0 (arm64) ».
- `app/links.rs` : un seul endroit qui ouvre une adresse et qui montre un
  fichier dans son dossier, avec la ligne de journal quand le système refuse.
  Trois copies de ce bout de code existaient, dans `relay/links.rs`,
  `journal_file.rs` et `commands.rs`.
- `AboutLink` : deux adresses, le dépôt et ses tickets, tenues dans le Rust et
  jamais dans l'écran.
- `reveal_config` : montre `config.json` dans le Finder ou l'Explorateur.

## À vérifier sur les deux machines

- [ ] Le panneau Identité dit la vraie version, le vrai système et le vrai
      chemin, sur le Mac comme sur Windows
- [ ] Le bouton copier rend le chemin dans le presse-papiers, et la coche passe
      au vert deux secondes
- [ ] Le bouton du dossier ouvre le Finder sur `config.json`, l'Explorateur sur
      Windows
- [ ] « Aller voir » et « Aller le dire » ouvrent le navigateur par défaut,
      Multifus restant où il est
- [ ] Les trois phrases en gras des mentions légales se lisent d'un coup d'œil,
      et le reste du paragraphe suit sans les écraser
- [ ] Le navigateur absent ou refusé : le journal porte une ligne, et rien ne
      casse
- [ ] La ligne de démarrage du journal se lit « sur macOS 26.0.0 (arm64) »
- [ ] Le robot relié, puis « Tout réinitialiser » : l'écran des messages privés
      redemande un jeton, comme la ligne de l'écran l'annonce
