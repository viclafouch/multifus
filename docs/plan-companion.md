# Site compagnon : reprise sur Windows

Prototype sur la branche `feat/companion-site`. Un raccourci (`Ctrl+Shift+S` par
défaut) ouvre Dofus Retro Tools ou Solomonk dans un overlay collé à la fenêtre de
Dofus d'où il est frappé. Le site est choisi dans les Paramètres. Le cœur est
`apps/desktop/src-tauri/src/app/companion.rs`, le cadre est
`apps/desktop/src/screens/companion-window/`.

Tout est vérifié sur Mac, en jeu compris. Rien n'a tourné sous Windows : la
compilation croisée depuis le Mac s'arrête sur `ring`, qui demande MSVC.

## Étapes sur Windows

1. `pnpm run check` à la racine. Fini quand tout est vert. Le code Windows jamais
   compilé : `lay_above`, `matches_among_ours_above` et `matches_ours` dans
   `platform/windows.rs`.
2. Tendre à Victor les tests en jeu ci-dessous, dans l'ordre, et attendre son
   retour sur chacun. Fini quand chaque ligne a sa réponse.
   1. `Ctrl+Shift+S` depuis Dofus : le site s'ouvre sur la droite du client,
      Dofus garde le premier plan et le clavier.
   2. Fermer par la croix, puis par le raccourci, puis rouvrir : pas de
      plantage, et la page quittée revient.
   3. Clic dans un champ du site : l'overlay prend le premier plan, la saisie
      marche. Clic dans Dofus : le jeu reprend le clavier, le site reste visible
      au-dessus de son client.
   4. Pendant que le site a le premier plan, les raccourcis de Multifus ne
      répondent pas, puisqu'ils attendent une fenêtre de Dofus devant. À
      trancher avec Victor.
   5. Tableau des runes et site sur le même client : aucun clignotement là où
      ils se chevauchent.
   6. Raccourci frappé depuis un autre client : le site y part.
   7. Glisser la barre, tirer la poignée du coin bas-droit, Précédent, Accueil.
   8. Changer de site, puis de langue, site ouvert : le site recharge dans la
      bonne langue.
   9. Molette dans le site pendant que Dofus a le premier plan.
   10. Connexion au site : tenue après fermeture et réouverture, puis après un
       redémarrage de Multifus.

## Décisions et leur raison

- **Deuxième webview** : Dofus Retro Tools envoie `X-Frame-Options: SAMEORIGIN`,
  donc une iframe est impossible. La fenêtre porte deux webviews, via la feature
  Tauri `unstable`. Le cadre mesure le trou qu'il laisse (`companion_measured`)
  et Rust y pose le site.
- **Fenêtre jamais détruite** : détruire une fenêtre à deux webviews passée en
  `NSPanel` fait abandonner tauri-runtime-wry, reproduit sur Mac. Fermer cache la
  fenêtre et endort la page par `location.replace('about:blank')`. Rouvrir
  réveille la page quittée.
- **Clavier au clic** : sur Mac, le panneau `MultifusKeyPanel` peut devenir fenêtre
  clé sans activer Multifus. Il s'affiche par `orderFrontRegardless`, car le
  `show()` de tao fait `makeKeyAndOrderFront` et volerait le clavier. Sur Windows,
  la fenêtre est activable (`focusable(true)`). Chaque `show()` y reste en
  `SW_SHOWNOACTIVATE`, car tao n'efface jamais `MARKER_DONT_FOCUS` de son état
  gardé.
- **Pas de blanc au chargement** : le site reste caché jusqu'à `on_page_load` →
  `Finished`, et un spinner occupe le trou du cadre.
- **Sécurité** : la capability `companion.json` ne vise que `companion-frame`, et
  Tauri refuse l'IPC aux origines distantes. Aucun identifiant n'est stocké par
  Multifus : la session vit dans le profil webview, et l'autoremplissage de
  WebView2 est coupé.
- **Langue** : l'accueil de chaque site porte la langue de Multifus dans son
  adresse (`home()` dans `companion.rs`).
- **Pubs** : gardées, choix de Victor.

## Proposé, pas construit

- Forcer le thème de Dofus Retro Tools (`drt-theme` dans `localStorage` : light,
  dusk, dark) par un script injecté. Solomonk n'a pas de thème sombre.
- Garder position et taille sur disque. Aujourd'hui elles tiennent en mémoire
  seulement.
- Ne donner le clavier qu'au clic dans la page, pas dans la barre.
- Entrée dans le menu de l'icône, user agent propre, zoom du site, mention sur le
  site web de Multifus.
