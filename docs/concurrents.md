# Concurrents

Les gestionnaires de fenêtres Dofus Retro et Dofus 1.29, de quoi décider quel
sujet mérite un audit. Le dossier illustré est dans
[concurrents.html](./concurrents.html), à ouvrir dans un navigateur.

Relevé du 31 août 2026. Les chiffres de téléchargement sont la somme des
ressources de toutes les versions publiées sur GitHub. Un outil distribué hors
GitHub n'est pas mesurable, et pèse souvent plus lourd qu'il n'y paraît.

## À auditer en premier

1. **Focus Retro**, le seul autre outil sur les deux systèmes, écrit en Rust
   comme nous. Audité, dépôt lu en entier, tout est dans
   [audit-concurrents.md](./audit-concurrents.md). Rien à reprendre
   sans une raison neuve.
2. **Dracoon**, notre jumeau fonctionnel sur Windows. Son `README` ment par
   omission : il annonce trois fonctions, le code en porte quinze. Lire
   `src/core/` et `src/ressources/i18n.json`, jamais la page d'accueil.
3. **Retro Toolbox**, pour son split 2 et 4 fenêtres. Le seul manque que tous
   les concurrents nous opposent, et Victor l'a refusé le 1er septembre 2026 :
   Multifus ne rangera pas les fenêtres côte à côte. Ne pas le reproposer à la
   prochaine veille ; il reste à auditer pour le reste.

## Les huit qui comptent

| Outil          | Dépôt et site                                                                                                    | Langage       | Systèmes        | Dernière version     | Vivant     | Poids                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------- | ------------- | --------------- | -------------------- | ---------- | ------------------------------------ |
| Dracoon        | [Slyss42/Dracoon](https://github.com/Slyss42/Dracoon)                                                            | Python, PyQt6 | Windows         | v4.0.2, 19 août 2026 | oui        | 1 928 téléch., 20 ★, 12 forks        |
| Focus Retro    | [alacroix/focusretro](https://github.com/alacroix/focusretro), [site](https://alacroix.github.io/focusretro/)    | Rust          | macOS + Windows | v0.7.0, 6 avril 2026 | au ralenti | 4 154 téléch., 6 ★                   |
| Dosoft         | [luframecode/dosoft](https://github.com/luframecode/dosoft), [site](https://www.dosoft.fr/fr)                    | Python        | Windows         | v1.2.1, 5 avril 2026 | au ralenti | 4 714 téléch., 8 ★                   |
| Retro Toolbox  | [Webn-Benjamin/retro_toolbox](https://github.com/Webn-Benjamin/retro_toolbox), [site](https://retro-toolbox.fr/) | Python        | Windows         | v2.2, juin 2026      | oui        | non mesurable                        |
| ROrganizer     | [Loulouw/ROrganizer](https://github.com/Loulouw/ROrganizer), [site](https://rorganizer.loulouw-labs.fr/)         | Rust          | Windows         | v1.3.2, 17 août 2026 | oui        | 330 téléch., 10 ★                    |
| nAiO Organizer | [naio.fr](https://naio.fr/)                                                                                      | fermé         | Windows         | depuis 2010          | oui        | non mesurable, base installée énorme |
| Xixou Switcher | [xixou.io](https://xixou.io/)                                                                                    | fermé         | Windows         | inconnue             | oui        | non mesurable, compte obligatoire    |
| Dofus Console  | [dofus-console.com](https://dofus-console.com/en/)                                                               | Rust annoncé  | Windows         | inconnue             | oui        | dépôt introuvable, hors CGU          |

## Le tableau des fonctionnalités

`o` oui, `~` à moitié, `-` non, `?` non documenté et code non publié.

|                                     | Multifus | Dracoon             | Focus Retro   | ROrganizer              | Dosoft   | Retro Toolbox  | Supertools | nAiO | Xixou |
| ----------------------------------- | -------- | ------------------- | ------------- | ----------------------- | -------- | -------------- | ---------- | ---- | ----- |
| macOS                               | o        | -                   | o             | -                       | -        | -              | -          | -    | -     |
| Windows                             | o        | o                   | o             | o                       | o        | o              | o          | o    | o     |
| Défilement suivant, précédent       | o        | o                   | o             | o                       | o        | o              | o          | o    | o     |
| Une touche par personnage           | o        | o                   | o             | o                       | o        | o              | ?          | o    | ?     |
| Retour au personnage principal      | o        | o                   | -             | -                       | -        | o              | -          | -    | ?     |
| Retour à la fenêtre d'où l'on vient | -        | o                   | -             | -                       | -        | -              | -          | -    | ?     |
| Roue des personnages                | o        | -                   | o             | -                       | o        | -              | -          | -    | -     |
| Déplacement rapide au clic gauche   | o        | o                   | -             | -                       | -        | -              | -          | -    | -     |
| Bouton de souris comme raccourci    | -        | -                   | o             | o                       | -        | -              | -          | -    | ?     |
| Grille ou split 2 et 4 fenêtres     | -        | -                   | o             | -                       | ~        | o              | -          | -    | -     |
| Agrandissement à l'ouverture        | o        | o                   | -             | -                       | -        | o              | -          | -    | -     |
| Compositions d'équipe enregistrées  | -        | o                   | -             | -                       | ~        | ~              | -          | -    | ?     |
| AutoFocus sur notification          | o        | o                   | o             | -                       | -        | o              | o          | -    | o     |
| Événements couverts                 | 7        | 7                   | 1             | 0                       | 0        | 5              | 3          | 0    | ?     |
| Exclure un personnage               | o        | o                   | -             | -                       | -        | -              | -          | -    | -     |
| Sauter les tours d'un Sadida        | -        | o                   | -             | -                       | -        | -              | -          | -    | -     |
| Portrait de classe sur la fenêtre   | o        | o                   | ~             | non, déclaré impossible | -        | -              | -          | ~    | -     |
| Titre de fenêtre raccourci          | o        | o                   | -             | -                       | -        | o              | -          | -    | -     |
| Bannière du personnage              | o        | o                   | -             | -                       | -        | -              | -          | -    | -     |
| Couleur par personnage              | o        | o                   | o             | -                       | -        | -              | -          | -    | -     |
| Messages renvoyés sur téléphone     | o        | -                   | -             | -                       | -        | -              | -          | -    | -     |
| Réponses toutes prêtes              | o        | -                   | -             | -                       | -        | -              | -          | -    | -     |
| Tableau des runes posé sur le jeu   | o        | -                   | -             | -                       | -        | ~              | -          | -    | -     |
| Exclure tous les hommes ou femmes   | o        | -                   | -             | -                       | -        | -              | -          | -    | -     |
| Code source publié                  | o        | o                   | o             | o                       | o        | ~              | o          | -    | -     |
| Licence libre                       | MIT      | MIT                 | MIT           | Apache 2                | Apache 2 | non            | non        | non  | non   |
| Binaire signé                       | o        | non, alerte Windows | ~ attestation | non, SmartScreen        | -        | non, antivirus | -          | -    | -     |
| Mise à jour dans l'application      | o        | o                   | o             | ?                       | ?        | o              | o          | o    | ?     |
| Téléchargement sans compte          | o        | o                   | o             | o                       | o        | o              | o          | o    | non   |
| Plusieurs langues                   | fr en es | fr en es            | fr en es      | fr en es                | ~        | -              | -          | -    | -     |
| Ne fait que gérer des fenêtres      | o        | o                   | o             | o                       | o        | o              | non        | o    | o     |

## Ce que fait Dracoon, et que son README tait

Vérifié dans son code, pas sur sa page. C'est le seul concurrent qui nous égale
sur presque tout, et il faut le relire à chaque version.

AutoFocus sur sept événements, les mêmes que nous : combat, échange, groupe, MP,
défi, craft, pvp. Les motifs de reconnaissance sont dans `src/core/config.py`,
constante `NOTIF_TYPES`, en trois langues.

Mode Déplacement au clic gauche, par crochet souris bas niveau `WH_MOUSE_LL`,
avec un délai réglable de 95 ms et un temps mort de 96 ms. C'est notre
Déplacement rapide, et il a une bannière avec.

Mode Dradidas : on désigne ses Sadidas et un nombre de tours, et l'AutoFocus
cesse de ramener ce personnage devant pendant ce nombre de tours de combat, le
temps qu'il pousse sa Puissance Sylvestre. Rien n'est envoyé au jeu.

Presets d'équipe nommés, personnage principal, retour à la fenêtre d'où l'on
vient, exclusion avec étiquette, vingt-quatre portraits par classe et par sexe,
titre court, agrandissement, mise à jour intégrée avec son propre exécutable de
mise à jour, thème, instance unique, migration de registre.

Cent vingt-six chaînes d'interface en français, anglais et espagnol, dans un
seul `i18n.json`. Cinq onglets : Personnages, Raccourcis, Outils, Paramètres,
Infos.

Il n'a ni roue, ni Telegram, ni réponses prêtes, ni tableau des runes, ni bouton
de souris, ni macOS. L'auteur écrit dans sa FAQ que tout est fait avec de l'IA.

## Ce qui nous manque

Trois lignes sont dans [plan.md](./plan.md) : la grille et le split, la couleur
libre par personnage, l'interface en anglais et en espagnol.

Cinq restent à creuser avant de décider :

- Les compositions d'équipe enregistrées, chez Dracoon.
- Le retour à la fenêtre d'où l'on vient, chez Dracoon. Ce n'est pas le
  personnage principal, qui est fixe : c'est un aller-retour entre deux fenêtres.
- Le mode Sadida, chez Dracoon. La seule idée du marché qui vienne d'un joueur.
- Le bouton de souris comme raccourci, chez ROrganizer et Focus Retro. Vérifier
  d'abord si le logiciel de la souris ne le fait pas déjà à notre place.

## Ce que nous refusons

Rien qui interroge un service extérieur : prix d'hôtel de vente, suivi
d'archimonstres, base de recettes. Rien qui oblige à recopier le jeu dans
l'outil : initiative, niveau, serveur, équipement, kamas. Rien qui tape un mot
de passe, diffuse une frappe sur plusieurs clients, passe un tour ou accepte un
échange à la place du joueur.

Les outils qui franchissent la ligne, pour mémoire : Supertools et Retro Multi
Manager pour la connexion automatique, Dofus Console, Minobot, Skyfus et Doframe
pour la diffusion des frappes, DofusPouletFlemmards et Minobot pour le passage de
tour automatique.

## Ce qui nous reste en propre

Les deux systèmes, le Déplacement rapide sur Mac, la roue couplée à sept
événements, le renvoi des messages privés sur Telegram, les réponses toutes
prêtes, le tableau des runes posé sur le jeu, les sigils qui excluent tous les
hommes ou toutes les femmes, et un binaire signé et notarisé.

Dracoon connaît le sexe de chaque personnage et n'en fait rien. Personne n'a
Telegram. Personne n'a les réponses prêtes.

## À ne pas installer

[multixi-dofus.com](https://multixi-dofus.com/),
[dofus-helper.com](https://www.dofus-helper.com/),
[multix-dofus.com](https://www.multix-dofus.com/dofus-multicompte),
[dofus-switcher.com](https://www.dofus-switcher.com/) : quatre sites jumeaux,
même page, même promesse d'open source. `Chrixii/Multixi` et
`Dofus-Helper/Dofus-Helper` ne contiennent qu'un `README`, des captures et une
archive compilée, sans une ligne de code. `ChrixiDofus/MultiX` et
`DofusHelper/Dofus-Helper` répondent 404. Aucun numéro de version, une seule
archive déposée et jamais mise à jour, 220 téléchargements cumulés.

## Morts, gardés pour mémoire

[Retro Multi Manager](https://github.com/DetroitApps/RetroMultiManager), archivé,
dernière version en décembre 2020, et pourtant 2 958 téléchargements orphelins.
[Dofus Retro Supertools](https://github.com/keytrap-x86/Dofus.Retro.Supertools),
sans commit depuis avril 2023.
[Skyfus](https://github.com/Skylli202/Skyfus-app), depuis janvier 2024.
[Organizer-Dofus](https://github.com/valyriaa/DofusOrganizer), figé en décembre 2025. [Dofus Retro Optimizer](https://github.com/HyouKash/Dofus-Retro-Optimizer),
depuis 2021.

## Les sites, pour la veille du design

Sites produits : [dosoft.fr](https://www.dosoft.fr/fr),
[retro-toolbox.fr](https://retro-toolbox.fr/),
[rorganizer.loulouw-labs.fr](https://rorganizer.loulouw-labs.fr/),
[organizer-dofus.com](https://www.organizer-dofus.com/),
[dofus-console.com](https://dofus-console.com/en/),
[dosoft-dofus.com](https://www.dosoft-dofus.com/) pour Doframe,
[dosoft-organizer-dofus.netlify.app](https://dosoft-organizer-dofus.netlify.app/)
qui en est un clone, [dracoon-dofus.com](https://www.dracoon-dofus.com/) qui
capte le nom de Dracoon sans lui appartenir,
[appsgard.com/squadmaster](https://appsgard.com/squadmaster),
[naio.fr](https://naio.fr/), [xixou.io](https://xixou.io/).

Pages de projet : [alacroix.github.io/focusretro](https://alacroix.github.io/focusretro/),
[minutesback.github.io/multi-tofu](https://minutesback.github.io/multi-tofu/),
[ducrosr.github.io](https://ducrosr.github.io/Dofus-Unity-Retro-Window-Manager-StreamDeck-Overlay/),
[dofus-tabs-macos.vercel.app](https://dofus-tabs-macos.vercel.app/),
[dofus-organizer.vercel.app](https://dofus-organizer.vercel.app/) en espagnol.

La référence à battre est la page de Focus Retro : comparatif intégré, captures,
avertissement de sécurité, deux systèmes. Attention, son comparatif est faux, il
coche « pas d'auto-focus » en face de Dracoon dont c'est l'argument principal.

## Ce que leur texte dit

Relevé le 11 septembre 2026. Les phrases sont recopiées telles qu'elles sont
écrites.

**Tous promettent la même chose, et aucun ne promet la même façon de le dire.**
Focus Retro ouvre sur « Le multicompte, sans la prise de tête. » Dosoft sur
« Révolutionnons ensemble le multi-compte Dofus. » Retro Toolbox sur « Logiciel
Multi-Compte Dofus Rétro Gratuit ». Multi-Tofu, en anglais, sur « Play Dofus
multi-account on a Mac without fighting your windows. »

**Le titre qui marche est celui qui dit la douleur.** « sans la prise de tête »
et « without fighting your windows » nomment ce que le joueur vit ;
« Révolutionnons ensemble » ne parle que de celui qui écrit ; le titre de Retro
Toolbox n'est pas une phrase, c'est une requête Google recopiée, et c'est
pourtant lui qui tient la première page. Les deux ne s'excluent pas : la balise
`title` peut porter la requête et le `h1` la douleur.

**Gratuit est répété partout, donc il ne distingue rien.** Dosoft l'écrit trois
fois, « Gratuit · Open Source · Toléré par Ankama », « Gratuit pour toujours »,
« Télécharger Dosoft — Gratuit » ; Retro Toolbox met « gratuitement » dans ses
deux boutons. Le mot doit être là, il ne doit pas porter la page.

**La sécurité est déjà un argument de vente, et mal tenu.** Focus Retro écrit
« Téléchargez uniquement depuis GitHub » et « Des sites tiers redistribuent des
binaires modifiés d'outils communautaires Dofus, certains contiennent des
keyloggers ou des stealers » : il nomme le danger sans rien prouver du sien.
Retro Toolbox affirme « Aucun virus, malware ou code de vol de données
personnelles n'a été trouvé », une phrase qui ne vaut que ce que vaut celui qui
la signe. SquadMaster reconnaît le problème en note technique, « un antivirus
peut être plus curieux avec ce type de binaire self-contained ». **Personne ne
montre une attestation vérifiable.** C'est là que Multifus passe devant, et
`gh attestation verify` est la phrase que personne d'autre ne peut écrire.

**Personne ne se dit officiel, tous se dédouanent en pied de page.** « Non
affilié à Ankama », « Dosoft n'est pas affilié à Ankama Games », « Certaines
illustrations sont la propriété d'Ankama Games ». Notre ligne visible sans
défiler est donc un vrai écart, pas une précaution de plus.

**Deux formules à ne pas reprendre.** « 100 % CGU Ankama » (Retro Toolbox) et
« Toléré par Ankama » (Dosoft) affirment un accord qu'aucun des deux ne produit.
Le README de Multifus cite les deux messages publics d'Ankama en entier : montrer
la source bat l'affirmation.

**Dosoft chiffre ce qu'il promet, et c'est ce qui se retient** : « 0ms de délai
de switch », « Plus rapide qu'Organizer. Par design ». En face, « Des centaines
de joueurs utilisent déjà Dosoft » est la seule preuve sociale du marché, et elle
est vague. Xixou, lui, chiffre vraiment : « 6 000+ objets », « 1 452 lieux »,
« 2 217 membres ».

**Xixou tient « poids des runes » avec une seule phrase**, « Poids des runes : la
référence forgemagie ». Le mot « référence » est le mot à prendre, et la table
elle-même est ce qui le mérite.

**Multi-Tofu est le seul à écrire ce que le logiciel ne fait pas**, en intertitre
et non en note : « It does not automate anything ». Et il transforme sa faiblesse
en explication honnête, « The app is not signed with a paid Apple developer
account, so the first launch needs a right click then Open ». C'est exactement
l'endroit où `/mac` gagne : Multifus est signé et notarisé, donc il n'a pas cette
phrase à écrire, et c'est cette absence qu'il faut rendre visible.

**Les intertitres qui reviennent**, dans cet ordre : ce que ça fait, la démo, le
comparatif, l'installation, la FAQ, « C'est autorisé par Ankama ? ». Le dernier
est une question que tout le monde se pose, et `/telecharger` y répond sous
« Avant d'installer », sans employer le mot « FAQ », que les Paramètres du
logiciel gardent pour la liste des pannes.

**Les boutons.** « Télécharger le .dmg (Apple Silicon) », « Télécharger
l'installeur .exe », « Tous les téléchargements sur GitHub » chez Focus Retro ;
« Download for macOS » chez Multi-Tofu. Le système dans le libellé, l'extension
entre parenthèses : le joueur sait où il clique avant de cliquer.

Trois sites n'ont pas pu être lus : `organizer-dofus.com` et `dofus-console.com`
répondent 403 à un client automatisé, et `rorganizer.loulouw-labs.fr` ne rend
qu'un choix de langue avant tout contenu.

## Le reste du recensement

Une soixantaine d'autres dépôts, la plupart à zéro étoile et sans version
publiée. Aucun n'a mérité une fiche, mais la liste sert si l'un d'eux grossit.

Retro dédié : [DetroitApps/RetroMultiManager](https://github.com/DetroitApps/RetroMultiManager),
[Madgique/dofus-multi-organizer](https://github.com/Madgique/dofus-multi-organizer),
[Celldwaller/minobot](https://github.com/Celldwaller/minobot),
[scaryztw/DofusPouletFlemmards](https://github.com/scaryztw/DofusPouletFlemmards),
[Skylli202/Skyfus-app](https://github.com/Skylli202/Skyfus-app),
[HyouKash/Dofus-Retro-Optimizer](https://github.com/HyouKash/Dofus-Retro-Optimizer),
[NicolasIrarrazabal/DofusTabs](https://github.com/NicolasIrarrazabal/DofusTabs) en
espagnol, [Ducrosr/Dofus-Unity-Retro-Window-Manager-StreamDeck-Overlay](https://github.com/Ducrosr/Dofus-Unity-Retro-Window-Manager-StreamDeck-Overlay).

macOS : [MinutesBack/multi-tofu](https://github.com/MinutesBack/multi-tofu),
[Marti-Ferret/dofus-tabs-macos](https://github.com/Marti-Ferret/dofus-tabs-macos),
[Shamzic/hammerspoon-dofus-window-switcher](https://github.com/Shamzic/hammerspoon-dofus-window-switcher),
[nathanpeck/dofus-window-switcher](https://github.com/nathanpeck/dofus-window-switcher).
Linux : [EmilyDimpfl/dofus-switcher](https://github.com/EmilyDimpfl/dofus-switcher).

Tous clients, Retro à vérifier :
[CharlesBinard/Dofus-Multi-Helper](https://github.com/CharlesBinard/Dofus-Multi-Helper),
[silverspy/Dofus-MultiCompte-Enhancer](https://github.com/silverspy/Dofus-MultiCompte-Enhancer),
[tolkee/doclick](https://github.com/tolkee/doclick),
[pboutin/dofus-team](https://github.com/pboutin/dofus-team),
[JPDevOpti/DofusTabs](https://github.com/JPDevOpti/DofusTabs),
[camilorav31/Dofus-Tabs-Organizer](https://github.com/camilorav31/Dofus-Tabs-Organizer),
[Unclerein/dofus-organizer](https://github.com/Unclerein/dofus-organizer),
[tiwabs/twDofusOrganiser](https://github.com/tiwabs/twDofusOrganiser),
[Gabann/DofusWindowOrganizer](https://github.com/Gabann/DofusWindowOrganizer),
[Leogrc01/Dofus-Window-Manager](https://github.com/Leogrc01/Dofus-Window-Manager),
[AzaWoodyy/dofus-window-cycler](https://github.com/AzaWoodyy/dofus-window-cycler),
[underfr/dofus-switcher](https://github.com/underfr/dofus-switcher),
[Nicolasjpg/DofusSwitcher](https://github.com/Nicolasjpg/DofusSwitcher),
[aarnow/dofus-switcher](https://github.com/aarnow/dofus-switcher),
[feuteon/Dofus-Organizer](https://github.com/feuteon/Dofus-Organizer),
[mayerjordan1/dofusteam-organizer](https://github.com/mayerjordan1/dofusteam-organizer),
[Misaki-ux/DofusMultiCompteCLI](https://github.com/Misaki-ux/DofusMultiCompteCLI),
[Paradow-dev/dofus-multi-account](https://github.com/Paradow-dev/dofus-multi-account),
[Readix1/dofusOverlay_OpenSource](https://github.com/Readix1/dofusOverlay_OpenSource),
[GautierBlandin/dofus-hotkey-manager](https://github.com/GautierBlandin/dofus-hotkey-manager),
[CarlCochet/DofusMultiUnity](https://github.com/CarlCochet/DofusMultiUnity),
[Leidvor/SquadMaster](https://github.com/Leidvor/SquadMaster).

Scripts AutoHotkey : [Yokani/DofusHeroes](https://github.com/Yokani/DofusHeroes),
[phoegasus/DofusMultiUtility](https://github.com/phoegasus/DofusMultiUtility),
[PatrickJAMET/MultiXasa](https://github.com/PatrickJAMET/MultiXasa),
[JanDupont/Dofus_Multiaccount_Run_Script](https://github.com/JanDupont/Dofus_Multiaccount_Run_Script).

## Refaire la recherche

`gh search repos` sur « dofus organizer », « dofus switcher », « dofus window »,
« dofus multi », « dofus multicompte », « dofus tabs », « dofus retro ». Puis les
sujets GitHub `dofus-retro`, `dofus`, `multicompte`, `multiboxing`,
`dofus-unity`. Les compteurs de téléchargement viennent de
`gh api repos/OWNER/REPO/releases --jq '[.[].assets[].download_count] | add'`.

Un concurrent ne se juge jamais sur sa page d'accueil : lire l'arbre du dépôt,
son fichier de traduction et ses modules.

## Homonymes

Trois dépôts portent déjà le nom Multifus, dont
[Sehyn/Multifus](https://github.com/Sehyn/Multifus), un outil multicompte Dofus
en C# sous GPL de 2021, et [Ovvyy/Multifus](https://github.com/Ovvyy/Multifus).
Le domaine `multifus.net` a servi à un autre projet Dofus en 2020 et ne répond
plus. Les noms se font voler vite dans ce milieu : l'auteur de Dracoon met
lui-même en garde contre les copies de son outil.
