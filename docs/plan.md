# Plan de développement

Ce document dit où en est multifus et ce qui vient ensuite. Rien d'autre.

Le vocabulaire est dans [CONTEXT.md](../CONTEXT.md), ce que le projet refuse de faire dans [perimetre.md](./perimetre.md), les décisions structurantes dans [adr](./adr), les règles d'écriture du code dans [.claude/rules](../.claude/rules).

---

## Où on en est

Les étapes 0 à 8 et l'étape 10 sont écrites, les sept premières sont vérifiées. De l'étape 11, les fondations et l'appariement sont posés, le relais lui-même attend. Leurs numéros restent des étiquettes, le code y renvoie.

| #     | Étape                       | Où                                             | État                                  |
| ----- | --------------------------- | ---------------------------------------------- | ------------------------------------- |
| 0-1   | Bootstrap et outillage      | `package.json`, `oxlint.config.ts`, `.husky`   | fait                                  |
| 2     | Cœur métier pur             | `src-tauri/src/domain`                         | fait, testé                           |
| 3     | Frontière avec le système   | `src-tauri/src/platform`                       | fait                                  |
| 4     | Implémentation macOS        | `platform::macos`                              | **vérifiée sur deux clients**         |
| 5     | Persistance                 | `src-tauri/src/config`                         | fait, testé                           |
| 6     | Interface React             | `src`, `src-tauri/src/app`                     | faite, AutoFocus prouvé               |
| 7     | Raccourcis globaux          | `app::shortcuts`                               | **vérifiés depuis le jeu**            |
| 8     | Barre système et session    | `app::tray`, `app::autostart`                  | **revient à l'ouverture de session**  |
| 10    | Distribution et mise à jour | `.github/workflows`, `app::update`             | écrite, à vérifier                    |
| 11a   | Fondations du relais        | `app::relay::secret`, `platform::display`      | écrites, testées                      |
| 11b-1 | Appariement du relais       | `app::relay::{telegram,pairing}`, écran Relais | **vérifié sur un vrai robot**         |
| 11b-2 | Le relais lui-même          | `app::relay::run`, barre système, balayage     | écrit, l'essai du quart d'heure reste |

Les versions font foi dans `package.json`, `tauri.conf.json` et `Cargo.toml`, nulle part ailleurs. `standard-version` les déplace ensemble, et le workflow de release refuse un tag qui ne dirait pas la même chose qu'elles.

**L'activation de processus fonctionne.** C'était le fil auquel tenaient l'AutoFocus et les deux raccourcis de défilement, et il tient. Sur l'application empaquetée, avec deux clients Retro connectés, le journal a écrit : Suivant alternant dix-huit fois entre les deux personnages, Précédent remontant, la Veille agissant sur celui de devant, et l'AutoFocus ramenant la bonne fenêtre sur trois types de notification distincts, échange, défi et combat. La garde tient aussi, un Suivant frappé sans fenêtre Dofus devant écrit « ignoré » et ne fait rien.

Ce qui avait été confronté à un vrai client Retro avant cela, hors de l'application et en lecture seule : le bundle est bien `com.dofus.d1elauncher`, le titre de la fenêtre principale est bien `Pseudo - Dofus Retro v1.48.21` et la regex le reconnaît, et lire `AXMainWindow` puis `AXTitle` coûte 0,05 ms en médiane.

Plus rien de macOS n'est en l'air, sauf ce que les étapes 8 et 10 viennent d'ajouter et qui n'a pas encore tourné. De l'étape 8, une seule chose a été confrontée à la vraie machine : l'application empaquetée dans `/Applications` revient bien d'elle-même après une ouverture de session.

### Le journal

**Il vit sur le disque, et c'est [ADR 0006](./adr/0006-journal-sur-disque.md).** Il était en mémoire, plafonné à 200 entrées, et mourait avec le processus, ce qui fait quelques minutes de jeu actif. `tauri-plugin-log` écrit chaque entrée en JSON dans le dossier de logs du système, un plafond de 1 Mo par fichier et huit fichiers gardés. Les 200 entrées en mémoire restent : elles sont ce que le tiroir dessine et ce que chaque snapshot transporte.

**Aucun corps de notification n'y entre, sous aucune forme.** Seul le type déduit voyage. La règle est tenue par un test qui compare la liste exacte des champs de l'événement, pas par la mémoire de qui relit le code. Le raisonnement et ce que ça coûte sont dans l'ADR.

**Deux exports, à deux distances de la panne.** Le bouton copier emporte ce qui est en mémoire avec un en-tête qui le rend lisible seul : version, système, autorisation, raccourcis posés avec leur état, chemin de la configuration, période couverte. « Montrer le journal » ouvre le fichier, depuis la fenêtre et depuis la barre système. Il est dans le menu parce que la règle du projet le demande : la fenêtre qui ne revient pas est l'une des pannes que ce journal sait écrire, donc un journal accessible par la seule fenêtre est un journal des bons jours.

L'écriture dans le presse-papiers passe par `tauri-plugin-clipboard-manager` et non par `navigator.clipboard`, la fenêtre étant servie par un protocole propre à Tauri. Ce plugin n'accorde rien par défaut, sa permission `default` est vide par conception : la capacité déclare `clipboard-manager:allow-write-text` et rien d'autre, multifus ne lisant jamais le presse-papiers. Ni `log:` ni `os:` ne sont accordés : les deux nouveaux plugins ne servent que depuis Rust, et le journal n'est pas un canal où React écrit.

**Ce qui échouait en silence et qui écrit maintenant une ligne.** Les trois fils qui pouvaient mourir sans un mot, balayage, raccourcis et barre système, survivent à un panic et le disent. Les mutations du roster et les réglages, qui n'écrivaient rien, écrivent leur ligne avec la surface d'où le clic est venu pour les deux que le menu porte. Une bannière que le système refuse de laisser lire écrit `NotificationUnreadable`, là où elle ne produisait rien du tout et où un journal vide voulait dire deux choses opposées. Et une configuration illisible qui n'a pas pu être déplacée n'est plus confondue avec une configuration que personne n'avait à déplacer.

---

## La suite, dans l'ordre

L'ordre ci-dessous n'est pas celui des numéros : la distribution est passée avant Windows, pour que macOS soit fini d'un bloc et que la session Windows trouve la chaîne de compilation déjà posée, à laquelle il ne restera qu'à ajouter un runner. Le relais s'insère par la même logique, avant Windows : il se vérifie entièrement sur macOS, et sa seule moitié propre à Windows est l'écran tenu éveillé, qui suivra le motif `NotImplemented` déjà en place dans `platform::windows`.

### Étape 8 — Barre système et démarrage automatique

**Le démarrage est vérifié sur l'application empaquetée**, dans `/Applications`, et sur une vraie ouverture de session : multifus revient de lui-même, avec `--from-session` et sans sa fenêtre, l'icône seule. Vérifiés aussi, sur ce même paquet : un lancement à la main qui ouvre la fenêtre, une fermeture qui la retire sans tuer le processus, et une réouverture qui la ramène sur ce même processus. Le reste attend la journée de jeu. L'icône est dans `app::tray`, le démarrage dans `app::autostart`, et le réglage est une ligne de l'écran À propos.

**Une ouverture de session n'ouvre pas la fenêtre.** Elle pose l'icône dans la barre système. Une application qu'on lance et qu'on oublie n'a pas à mettre un tableau de bord devant quelqu'un qui vient d'ouvrir sa session et qui ouvre ses clients. Un lancement à la main est l'inverse : double-cliquer une application, c'est demander à la voir, et rester muet là se lirait comme un lancement raté. Ce qui sépare les deux est l'argument `--from-session`, que le lanceur porte dans son enregistrement et que multifus relit dans les siens. Le Dock, lui, est toujours là : `Accessory` reste repoussé, voir plus bas.

Une condition s'ajoute à l'argument, et c'est la même que pour la fermeture : **sans icône dans la barre système, la fenêtre s'ouvre quand même**. Sinon une ouverture de session dont l'icône a échoué laisserait un processus sans fenêtre, sans menu et sans retour possible, ce que le reste de l'étape refuse déjà.

**Le clic sur l'icône du Dock ramène la fenêtre.** Rien ne répondait à `RunEvent::Reopen`, donc une fenêtre masquée laissait une icône sur laquelle un clic ne faisait rien. Le trou existait déjà après une fermeture, il devenait la situation normale une fois le démarrage silencieux posé. C'est la seule raison pour laquelle `run` prend maintenant une fonction et que `lib.rs` construit puis lance en deux temps.

Le menu ne liste que les personnages **connectés**, dans l'ordre du défilement, avec `(en veille)` sur ceux qui sont hors du cycle. Un clic ramène la fenêtre au premier plan. Un personnage hors ligne n'y figure pas : une barre système est un endroit d'où l'on saute, et une ligne qui ne peut rien faire n'y a pas sa place.

**Une fenêtre réduite ressort du Dock, et un réglage dit si l'AutoFocus a le droit de le faire.** Activer un client dont la fenêtre est réduite ramenait sa barre de menus et laissait la fenêtre où elle était : le focus disait « fait » et rien ne bougeait. `focus` pose donc `AXMinimized` à faux avant d'activer, lecture d'abord, écriture seulement si la fenêtre est bien rangée, pour qu'un refus du système sur ce point ne transforme pas un focus ordinaire en échec.

Sortir une fenêtre du Dock fait partie du focus et ne se règle pas. Ce qui se règle, c'est de demander le focus ou non, et c'est le **réveil des réduites** : coché par défaut, décoché il met une fenêtre réduite hors d'atteinte de l'AutoFocus, de quoi travailler ailleurs sans être ramené dans le jeu. Il ne vaut que pour l'AutoFocus : un raccourci et un clic dans la barre système ramènent toujours, puisque l'utilisateur les a demandés. Le journal le dit avec ses propres mots plutôt que de ressembler à un AutoFocus qui a raté.

Deux variantes de `Decision` et pas un drapeau sur une seule : savoir si une fenêtre est réduite coûte un appel au système, et la réponse ordinaire est de ne pas le poser. Seul celui qui décoche le paie.

Le réglage vit dans l'écran AutoFocus et dans le menu de la barre système, comme l'interrupteur maître, et pour la même raison : on le bascule au moment où l'on range ses clients pour faire autre chose, pas au moment où l'on ouvre la fenêtre. Il garde son état quand l'AutoFocus est coupé, la case s'atténue avec les sept types sans se griser, puisqu'elle dit ce qui se passera au retour et non ce qui se passe.

**Un interrupteur maître pour l'AutoFocus.** `AutoFocus::enabled` s'ajoute aux sept types plutôt que de les éteindre ensemble : les couper tous oublierait lesquels l'utilisateur avait choisis, et les rallumer lui en rendrait sept. `is_enabled(kind)` demande donc les deux, `is_kind_enabled(kind)` ne demande que la ligne, et c'est cette seconde question que l'écran dessine. Une case dans le menu de la barre système le porte, l'écran AutoFocus aussi, sans quoi couper depuis la barre laisserait sept interrupteurs allumés qui ne font rien.

**Un verbe sur tout ce qui bascule.** L'AutoFocus, seul réglage du menu, dit « Activer » ou « Désactiver » plutôt que de porter une coche. Un nom coché, posé au-dessus des quatre noms d'écrans, se lisait comme un cinquième : « AutoFocus » ressemblait à un endroit où aller, pas à un interrupteur. Une ligne qui commence par un verbe ne peut être qu'une action, et le verbe dit dans quel sens elle ira. Règle pour la suite : dans ce menu, tout ce qui bascule porte un verbe.

**Les quatre écrans, et pas « Ouvrir ».** Ouvrir la fenêtre n'est jamais ce qu'on veut, aller sur un de ses écrans l'est. Le menu les offre donc directement, et le rail se retrouve à un clic au lieu de trois. Ça passe par un second événement, `multifus://navigate`, séparé du snapshot : l'écran affiché n'est pas un état que multifus garde mais une demande faite une fois, et le mettre dans le snapshot ramènerait la fenêtre sur cet écran à chaque tour du balayage.

**Ce que le menu porte, et ce qu'il ne porte pas.** Autorisation manquante puis « Ouvrir Réglages Système » en tête quand le système refuse, parce que le sens de cette icône est justement de ne pas avoir à ouvrir la fenêtre pour apprendre que multifus est sourd. Puis les personnages, puis l'AutoFocus et le réveil des réduites. Ces deux-là y sont parce qu'ils se basculent en jouant, ou plutôt au moment où l'on cesse de jouer : réduire ses clients pour travailler ailleurs est exactement l'instant où l'on veut couper le second, et ouvrir la fenêtre pour ça serait perdu d'avance. Le démarrage avec la session n'y est pas : il se règle une fois pour toutes et n'a rien à faire dans un menu qu'on ouvre en jouant. Pas d'équivalent clavier affiché : dans un menu de barre système, un accélérateur ne se déclenche que si l'application est active, et multifus ne l'est jamais. En afficher promettrait des touches mortes.

**Une seule porte de sortie, `runtime::emit_snapshot`.** Une commande qui construisait sa réponse elle-même répondait à l'interface sans prévenir la barre système, et le menu ignorait alors tout ce qui venait de la fenêtre : une veille basculée, un roster réordonné, un personnage retiré. Toutes les commandes passent donc par cette fonction, qui rend le snapshot en plus de l'envoyer. Pour que ce soit tenable sans réfléchir, `tray::refresh` est **idempotent** : il compare les lignes à celles qui sont affichées et ne reconstruit rien quand elles n'ont pas bougé, ce qui rend gratuit l'appel sur un changement de raccourci ou d'AutoFocus.

Fermer la fenêtre ne quitte plus, on quitte par le menu. Ce n'est **pas** un réglage de `tauri.conf.json`, aucune clé du schéma v2 ne fait ça : c'est `WindowEvent::CloseRequested` avec `prevent_close` puis `hide`, et rien d'autre. La fermeture n'est interceptée que si l'icône est bien là, sinon une fenêtre fermée laisserait un processus sans retour possible.

Et surtout, **rien n'intercepte la sortie**. `RunEvent::ExitRequested` avec `prevent_exit` est le motif que tout le monde recopie, il n'a pas sa place ici : la fenêtre n'étant jamais détruite mais seulement masquée, la sortie « dernière fenêtre fermée » ne se produit pas, et la prévenir quand même retirerait `Cmd+Q` à un utilisateur macOS pour rien.

**Repoussé, décidé sur mesure.** `NSApplicationActivationPolicy.Accessory`, qui sortirait multifus du dock. La question ouverte est de savoir si une application accessoire garde le droit d'activer un autre processus, dont dépendent l'AutoFocus et les deux raccourcis de défilement. On ne sait pas non plus laquelle des deux portes de `AccessibilityWindowManager::focus` travaille aujourd'hui, `activateWithOptions` ou le repli `AXFrontmost`, le journal écrivant `Focused` dans les deux cas. Poser la porte au journal d'abord, mesurer, puis décider.

**Le logo.** `src-tauri/icons` porte encore celui du scaffolder Tauri, et `icons/tray.png` est un glyphe provisoire. `npm run tauri icon <fichier>` régénère les onze fichiers depuis un PNG carré à transparence, et ne touche pas à `tray.png`, qui obéit à d'autres règles : voir plus bas.

**Vérification.** Une journée de jeu sans jamais ouvrir la fenêtre. Et, sur le paquet cette fois, une ouverture de session qui ne montre que l'icône, puis un double-clic depuis `/Applications` qui montre la fenêtre.

### Étape 10 — Distribution et mise à jour

**Écrite, pas encore vérifiée. macOS seulement, Apple Silicon seulement.** Windows n'est pas abandonné, il attend que macOS soit fini pour démarrer d'un bloc : il rejoint ces workflows à l'étape 9, en ajoutant un runner `windows-latest` aux deux endroits qui sont aujourd'hui des jobs uniques. En attendant, un `ci` vert ne dit toujours rien de `platform::windows`, et rien de ce qui a été ajouté ici n'est propre à macOS.

Trois fichiers pour deux portes. `checks` porte les six commandes de la porte du projet et n'est déclenché par personne : il est appelé. `ci` l'appelle sur chaque poussée et chaque pull request, `release` l'appelle avant de signer quoi que ce soit. Une seule définition de « le code est en ordre », dans un seul fichier, et les deux portes passent par elle. Recopiée dans les deux, elle divergerait, et la copie qui divergerait serait celle qui garde la release.

`release` se déclenche sur un tag `v*`, compile, signe, notarise, et dépose le tout dans une release **en brouillon**.

**Le brouillon n'est pas de la prudence, c'est le mécanisme.** L'endpoint que l'updater interroge est `releases/latest/download/latest.json` : publier la release est donc l'acte qui annonce la version à tous les multifus installés. Ça doit rester une décision, pas l'effet de bord d'un `git push --tags`.

**La signature est le vrai sujet, et elle a son ADR.** Une signature ad hoc change à chaque compilation, TCC n'y reconnaît pas la même application et l'autorisation d'Accessibilité tombe à chaque version. Un certificat Developer ID donne une identité stable et l'autorisation survit. Voir [ADR 0005](./adr/0005-signature-developer-id-plutot-qu-ad-hoc.md), qui dit aussi pourquoi ça ne change rien en développement.

**Une seule version, cinq fichiers.** `standard-version` porte le numéro dans `package.json`, `package-lock.json`, `tauri.conf.json`, `Cargo.toml` et `Cargo.lock`, les deux derniers par `scripts/cargo-version.cjs`. Le workflow refuse ensuite de compiler si le tag et `tauri.conf.json` ne disent pas la même chose : deux versions qui divergent publieraient une mise à jour que personne ne se verrait jamais proposer, sans un mot.

**La mise à jour se propose, elle ne s'impose pas.** `app::update` demande une fois au démarrage, jamais en boucle, et l'écran À propos redemande à la main. Ce qu'il trouve voyage dans le snapshot, comme le reste, donc la barre système et la fenêtre disent la même chose sans que ni l'une ni l'autre ait à demander. Installer remplace le paquet et relance multifus, ce qui en pleine soirée coûte tous les clients d'un coup : c'est un clic, jamais un automatisme.

Rien de l'updater n'est exposé au webview. Pas de permission `updater:` dans la capacité, pas de paquet npm : la vérification et l'installation sont deux commandes de multifus, et React lit un état plutôt que d'appeler un plugin.

**Ce qui reste à faire à la main, et que le dépôt ne peut pas porter.**

| À faire                                                                  | Où                  |
| ------------------------------------------------------------------------ | ------------------- |
| Créer un certificat **Developer ID Application** et l'exporter en `.p12` | developer.apple.com |
| Poser les huit secrets du workflow `release`                             | Réglages du dépôt   |
| Remplacer le logo du scaffolder Tauri, voir « Le logo » à l'étape 8      | `src-tauri/icons`   |

Les huit secrets : `APPLE_CERTIFICATE` (le `.p12` en base64), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD` (un mot de passe d'application, pas celui du compte), `APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY` et `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, vide ici.

**La paire de clés de l'updater existe déjà, ne la régénère pas.** Elle a été créée en même temps que cette étape, dans `~/.tauri/multifus.key` et son `.pub`, sans mot de passe. **La moitié publique est déjà dans `tauri.conf.json`**, c'est le champ `plugins.updater.pubkey`. Il ne reste qu'à recopier le contenu de la moitié privée dans le secret. Relancer `npm run tauri signer generate` donnerait une paire qui ne correspond plus à la clé publiée : les archives seraient signées, les multifus installés les refuseraient, et rien dans le journal ne dirait pourquoi. Si elle doit changer un jour, les deux moitiés changent ensemble, et `pubkey` est à remettre à jour dans le même commit.

Perdue avant la première release, elle se régénère sans conséquence. Perdue après, plus aucune mise à jour n'est signable pour les versions déjà installées.

**Vérification.** Un tag sur une version d'essai, le brouillon relu, le DMG téléchargé depuis un autre compte pour que la quarantaine s'applique vraiment, puis une seconde version pour voir si l'autorisation d'Accessibilité tient et si la fenêtre propose la mise à jour.

### Étape 11 — Relais Telegram

**Les fondations sont écrites, le reste attend.** Le besoin : jouer en passif, ne guetter que les messages privés, et pouvoir aller faire autre chose dans la maison sans perdre ces messages.

#### 11a — Posé

`app::relay::secret` pour le trousseau, `platform::display` et sa moitié macOS, `relayed` sur le personnage avec les accesseurs de `Roster` qui vont avec, `config::Relay`, les trois dépendances et le fournisseur `rustls` dans `app::setup`. Ni interface, ni réseau, ni barre système.

#### 11b-1 — Posé

**L'appariement fonctionne de bout en bout, sauf l'essai avec un vrai robot.** `app::relay::telegram` porte les deux appels, `app::relay::pairing` porte le geste, l'écran Relais est le cinquième du rail et du menu, et `relayed` se coche par personnage. `cargo test` compte 112 cas.

**L'ordre de l'appariement prouve toute la chaîne avant d'écrire quoi que ce soit.** Le salon est lu, un message d'essai y est envoyé, et le jeton n'est rangé dans le trousseau qu'après. Un appariement qui se déclare réussi est donc un appariement dont le message est vraiment arrivé sur le téléphone, et pas un qui échouera au premier message privé. Le prix est un message d'essai orphelin si le trousseau refuse en dernier, ce qui est le bon sens de l'échange.

**Rien ne se fait sur le fil qui a demandé.** Deux allers-retours réseau et un trousseau que l'ADR 0009 a mesuré bloquant sur une boîte de dialogue : la commande rend la main tout de suite et la réponse arrive par un snapshot, comme `app::update`. L'écriture dans le trousseau passe par `spawn_blocking`, qui est le seul endroit où une attente de ce genre a le droit de vivre.

**Cinq motifs d'échec d'appariement et pas un.** Jeton vide, jeton refusé, personne n'a écrit au robot, trousseau qui refuse, réseau absent. Ils se réparent à cinq endroits différents, et un écran qui dirait « la connexion a échoué » enverrait l'utilisateur au mauvais deux fois sur trois. Les deux premiers cas ne sont pas des pannes du relais et n'écrivent rien au journal : ce sont des étapes que l'utilisateur finit.

**L'écran explique Telegram à quelqu'un qui ne l'a jamais ouvert.** C'est le seul écran de multifus qui demande d'aller faire quelque chose dans une autre application et de revenir, donc cinq étapes numérotées et pas un paragraphe. Deux d'entre elles disent **pourquoi** et pas seulement quoi : un robot n'a pas le droit d'écrire le premier, qui est l'étape que tout le monde rate, et BotFather répond en anglais, ce qui sans avertissement se lit comme une fausse route.

**Trois liens, et l'interface nomme une destination sans jamais fournir d'adresse.** `web.telegram.org` pour Telegram dans le navigateur, `t.me/botfather` pour le robot qui fabrique les robots, `telegram.org/faq/fr` pour ce qu'est un robot, qui est la seule page officielle en français sur le sujet, la documentation des robots n'existant qu'en anglais. Les URL sont des constantes de `app::relay::links` et React envoie un mot parmi trois. La capacité accorde pourtant `opener:default`, donc React **pourrait** ouvrir une URL lui-même : c'est le même refus que pour `reveal_quarantined_config`, rien qui traverse le pont ne désigne une cible.

**Tout le tutoriel se fait dans Telegram Web, sur la machine où tourne multifus.** C'est ce qui rend l'appariement supportable : le jeton se copie-colle au lieu d'être lu sur un téléphone et retapé à la main, cinquante caractères sans faute. Les cinq étapes sont donc cinq liens et cinq gestes sur le même écran, et le téléphone ne sert plus qu'à deux choses, se connecter à Telegram Web une fois et recevoir les messages ensuite.

**Les carrés à scanner ont existé une demi-journée et ont été retirés.** L'idée était juste tant que le tutoriel visait le téléphone : un bouton y aurait ouvert la page sur la mauvaise machine. Elle tombe dès que tout se passe dans le navigateur, où un lien est un lien. Retirés avec eux : la crate `qrcodegen`, la commande qui rendait les modules, le composant et son crochet. Ne pas les remettre sans que le tutoriel reparte sur le téléphone.

**Le rang d'une étape s'écrit comme un rang de défilement**, en mono et sur deux chiffres. Cet idiome veut déjà dire « le nième d'une liste ordonnée » dans cette fenêtre, et une pastille numérotée inventée ici aurait dit la même chose dans un second dialecte. Même raison pour `PanelHeader`, extrait dès qu'un second panneau en a voulu un : deux panneaux du même écran ne peuvent plus diverger d'un pixel.

**Trois événements de journal, et un test qui compte leurs champs.** `RelayPaired`, `RelayUnpaired`, `RelayFailed` avec ses trois motifs. Aucun corps de notification, la règle de l'ADR 0006 ne bouge pas. Et **aucun identifiant de salon**, ce qui n'est pas cette règle-là mais la même raison que le nom de machine absent de `Started` : ce fichier est fait pour être transmis.

#### 11b-2 — Écrit, et il reste l'essai du quart d'heure

`app::relay::run` porte le tout : l'interrupteur, le fil d'envoi, les avis de l'ADR 0010 et l'écran tenu éveillé. `cargo test` compte 128 cas, `tsc` et `oxlint` passent. Ce qui n'a pas encore tourné contre un vrai robot est en bas de cette étape.

**Ce qui tourne vit dans une fente à part, jamais dans `Multifus`.** Ce type est ce que `snapshot()` relit plusieurs fois par minute et rend à React, et l'ADR 0009 veut que « le jeton ne ressort jamais » soit une propriété du modèle et pas une discipline. Le jeton, le salon et la file sont donc dans un `Mutex` à eux, comme le watcher et la mise à jour en attente, et `Multifus` ne garde que `relay_active`, le jumeau exact de `listening`. Les deux verrous ne sont jamais tenus en même temps.

**Le fil d'envoi est une tâche et pas un fil.** `shortcuts::start` et `tray::start_worker` sont des `std::thread` parce que leur travail est un appel système bloquant ; un aller-retour réseau est déjà asynchrone, et un fil système posé dessus ne ferait que dormir. C'est donc une tâche unique sur `tauri::async_runtime::spawn`, qui possède le `Receiver` d'un `tauri::async_runtime::channel`, lui-même un `tokio::sync::mpsc` réexporté, donc zéro crate en plus. Un seul consommateur tient l'ordre sans y penser, et lâcher le `Sender` ferme la file et termine la tâche : la désactivation n'a pas de second mécanisme.

**Le client HTTP est construit une fois.** `telegram::send` le prend en paramètre au lieu d'en bâtir un, sans quoi une soirée de messages privés paierait une poignée de main TLS par message.

**Les avis sortent du balayage comme des faits.** `apply_windows` tourne sous le verrou et le corps d'un message Telegram n'a rien à y faire, donc les deux portes du roster rendent maintenant un `ScanChange` : ce qui a bougé, les pseudos relayés qui viennent de tomber, et s'il n'en reste aucun. `runtime::tick` rend le verrou, puis passe ces faits au relais. **`apply_denied` le rend aussi**, ce que le cadrage n'avait pas : l'autorisation retirée est le deuxième des quatre cas de l'ADR 0010, et sans ça une autorisation coupée pendant une absence rendait le relais muet sans un mot sur le téléphone.

**`DisplayAwake` s'écrit sur la transition et pas sur l'état.** `log_unless_repeated` ne compare qu'à la dernière entrée, et une soirée de `RelaySent` s'intercale : la ligne repasserait après chaque message privé et remplirait les 200 entrées. La transition se lit sur le keeper, `is_awake()` avant et après, donc l'appelant ne garde toujours aucun booléen, ce que le piège plus bas demande.

**Ce que la barre système a gagné, et pourquoi c'est un champ et pas trois.** `tray::Contents` ne voyait ni le salon, ni `relayed`, ni l'état vivant : apparier un robot laissait le menu proposer d'en configurer un, et activer le relais laissait le menu proposer de l'activer. Il gagne donc `relay: RelayItem`, une énumération à trois variantes. Trois booléens auraient laissé écrire « pas apparié et en marche », un état qui n'existe pas.

**Ce qui reste en l'air, et une seule chose l'est.** Une tâche asynchrone n'a pas de `catch_unwind` autour d'elle, contrairement aux trois fils, donc `Work` ne gagne pas de quatrième variante. C'est la même exposition que la tâche de `app::update`, et son corps se réduit à un `Result` et à une écriture de journal.

**Trois choses que la relecture a trouvées et qui sont corrigées.** `follow_display` appelait `release()` à chaque tour même relais éteint : sur Windows, où toute méthode du keeper rend `NotImplemented`, ça écrivait « Écran impossible à tenir éveillé » dès le premier balayage et à peu près à chaque tour ensuite, `log_unless_repeated` ne comparant qu'à la dernière entrée. Il sort maintenant tout de suite quand il n'y a ni assertion à poser ni assertion à relâcher. Le fil d'envoi émettait un snapshot par message, en plus de celui que `on_notification` venait d'émettre, ce qui clonait deux fois jusqu'à 200 entrées de journal pour rien : il n'en émet plus que sur un échec, la réussite voyageant avec le balayage suivant. Et l'activation remettait `PairingView::Idle`, donc effaçait ce que l'écran Relais disait du dernier appariement : elle n'y touche plus, un trousseau qui refuse se lit au journal et dans l'article de menu resté sur « Activer le relais ».

**L'avertissement d'économiseur ne se déclenche que sur un délai mesuré.** Il ne se déclenchait aussi sur `Unknown`, ce qui promettait sur Windows, où la lecture n'est pas écrite, une panne que personne n'a vue.

Cinq décisions sont tranchées et n'ont pas à être rejouées. Le service, [ADR 0007](./adr/0007-telegram-plutot-que-whatsapp-ou-ntfy.md), qui écarte WhatsApp, ntfy, Gotify, Bark et Pushover avec les motifs de chacun. Le corps du message, [ADR 0008](./adr/0008-corps-relaye-sur-consentement.md), qui explique pourquoi l'interdit de l'ADR 0006 ne s'applique pas ici et pourquoi le réglage est décoché par défaut. Le jeton, [ADR 0009](./adr/0009-jeton-dans-le-trousseau.md), qui le range dans le trousseau du système. Les avis, [ADR 0010](./adr/0010-le-relais-parle-de-lui-meme.md), qui disent quand le relais a cessé d'entendre. Le relais par personnage, [ADR 0011](./adr/0011-relais-par-personnage.md), qui revient sur un refus du périmètre.

**Ce qui décide de tout, et qu'aucun document ne disait : le quart d'heure.** Dofus déconnecte un client resté inactif, et le titre de sa fenêtre perd le pseudo. Le périmètre interdit d'y remédier, ce serait simuler une action de jeu. Le relais a donc une durée de vie utile d'environ quinze minutes par personnage, et rien ne la rallongera. Ça ne le condamne pas, ça le recadre : l'avis de déconnexion n'est pas un confort, c'est l'événement principal.

**Le message privé seul parmi les sept types, codé en dur.** Pas de jeu d'interrupteurs par type. Le périmètre écrit le refus et dit à quelle condition le rouvrir. Les avis de l'ADR 0010 ne sont pas des types de notification et n'ouvrent pas cette porte.

**Les personnages relayés se choisissent, et ça se garde.** L'attribut et ses accesseurs sont posés en 11a. Reste ce qui s'appuie dessus : l'écran Relais en dessine la liste, et le relais refuse de s'activer quand `has_relayed` est faux, ce qui est le seul garde-fou contre l'exclusion oubliée de l'ADR 0004. Voir ADR 0011.

**L'interrupteur est dans la barre système et nulle part ailleurs.** Un article avec un verbe, comme la règle de l'étape 8 l'exige pour tout ce qui bascule dans ce menu. Pas de cinquième raccourci global : les quatre flèches de `Control+Shift` sont prises, et on active le relais en se levant, un geste qui supporte d'aller à la barre des menus.

Trois états et non deux verbes, parce qu'un « Activer le relais » qui échoue est exactement ce que cette étape cherche à éviter. Le premier état a été mal nommé pendant tout le cadrage, et le corrigé est ici :

| État                                                | Ce que l'article dit                              | D'où vient la réponse          |
| --------------------------------------------------- | ------------------------------------------------- | ------------------------------ |
| Pas prêt : jamais apparié, **ou** personne de coché | `Configurer le relais…`, et le clic ouvre l'écran | la configuration, sans lecture |
| Prêt, relais coupé                                  | `Activer le relais`                               | idem                           |
| Relais actif                                        | `Désactiver le relais`                            | l'état vivant du processus     |

**Ce n'est pas « aucun jeton dans le trousseau », et ça ne pouvait pas l'être.** Le menu se reconstruit à chaque snapshot, donc plusieurs fois par minute, et l'ADR 0009 interdit d'interroger le trousseau ailleurs qu'à l'activation parce que chaque lecture peut ouvrir une boîte de dialogue. La question du menu est une question de préparation, pas de présence du secret, et elle se lit sur `relay.chat_id`, que l'appariement écrit et que le déliement efface en même temps que le jeton. Le tableau de l'ADR 0009 sépare les deux questions.

Le gain de bord est le quatrième état que le cadrage avait oublié : « le relais refuse de s'activer si personne n'est coché » avait besoin d'un endroit pour se dire, et un clic de menu qui ne fait rien ne le dit pas. Les deux cas partagent la même étiquette et le même clic, vers le seul écran où les deux se réparent.

**L'écran Relais est le cinquième du rail et du menu.** `Screen::ALL`, `tray::build_menu` et le rail passent de quatre à cinq. C'est la première fonctionnalité qui oblige à ouvrir la fenêtre pour être installée, et l'arbitrage est en bas de cette étape.

**L'état actif ne survit pas au processus.** Même raisonnement que l'[ADR 0004](./adr/0004-veille-ephemere-sexe-persiste.md) pour la veille : un multifus qui revient d'un plantage en tenant l'écran éveillé et en poussant des messages privés vers un téléphone, sans que personne ne l'ait demandé, est un comportement que ce projet refuse déjà ailleurs. Le jeton et l'identifiant de salon persistent, l'état actif non.

**Un des quatre raccourcis frappé coupe le relais.** Si un raccourci se déclenche, c'est qu'une fenêtre Dofus est devant et qu'une main est au clavier, donc que l'utilisateur est revenu. Le journal écrit la ligne. Aucun minuteur : « le relais se coupe au bout de deux heures » recréerait exactement la panne que toute l'étape cherche à éviter, un relais auquel on fait confiance et qui s'est arrêté pendant l'absence.

**L'écran est tenu éveillé tant qu'il y a quelque chose à écouter.** C'est la condition de survie de la fonctionnalité sur macOS, et elle découle de l'[ADR 0002](./adr/0002-notifications-macos-via-accessibility.md) : multifus ne lit pas des notifications, il lit des bannières. Écran éteint et session verrouillée, il n'y a plus de bannière et plus d'arbre d'accessibilité à parcourir, donc plus de relais, et un téléphone silencieux se lit comme « personne ne m'a écrit ». La frontière et l'implantation macOS sont posées en 11a ; reste à brancher `has_relayed_online` dessus, au tour de balayage.

**Elle demande le relais actif et au moins un personnage relayé connecté.** Une version de cette ligne disait « et pas l'interrupteur », ce qui, lu au pied de la lettre, tenait la machine éveillée dès le premier client ouvert, relais jamais activé : tout le monde entre dans le roster relayé, donc un portable sur batterie n'aurait plus jamais dormi. Ce que « pas l'interrupteur » voulait dire est la seconde moitié : à l'intérieur d'un relais actif, l'assertion suit les personnages et non la durée de l'interrupteur. C'est le quart d'heure qui l'impose, sans quoi une déconnexion à quinze minutes laisse la machine allumée une heure pour écouter le vide. Plus aucun personnage relayé connecté, l'assertion tombe. L'un d'eux revient, elle est reposée. **Le relais, lui, ne bouge pas** : seul un raccourci l'arrête, un relais qui s'arrêterait tout seul étant le minuteur que cette étape refuse plus haut. CONTEXT.md porte la définition.

**L'économiseur d'écran est un trou, et il n'est pas mesuré.** `PreventUserIdleDisplaySleep` empêche l'écran de s'éteindre. Rien ne documente qu'il empêche l'économiseur de démarrer, et un économiseur qui démarre verrouille la session, ce qui rend le relais muet exactement comme une extinction. La machine de développement a `idleTime` à zéro, donc aucun économiseur, et l'essai n'y prouverait rien. La lecture est écrite en 11a et rend `Never` sur cette machine-là.

**Elle est lue au démarrage et pas à l'activation, et une version de ce paragraphe demandait le contraire.** L'interrupteur est dans la barre système, donc la fenêtre est fermée au moment de l'activation : l'avertissement atterrirait sur un écran que personne ne regarde. Et rien ne persiste, donc l'écran Relais ne dirait rien tant qu'on n'a pas activé une fois dans la session. Une préférence ne coûte aucune boîte de dialogue, contrairement au trousseau de l'ADR 0009, donc rien ne justifiait de la retarder. `app::setup` la lit une fois, elle voyage dans `RelayView` à chaque snapshot, et l'écran Relais l'affiche dès qu'elle rend autre chose que `Never`, au moment où l'on installe le relais et où l'on peut encore changer le réglage. Prix accepté : une valeur périmée si l'économiseur change en cours de session.

**Le mot « veille » est interdit dans tout ce code.** Il désigne un personnage retiré du défilement. L'état de la machine s'appelle `display_awake`, et CONTEXT.md porte l'interdit.

**L'envoi part sur un autre fil.** `platform::notification` l'écrit noir sur blanc : le sink tourne sur le fil du watcher et ne doit pas bloquer, tout ce qui est plus long qu'un focus appartient à un autre fil. Un POST HTTPS est exactement ce que cette phrase interdit là. Et la règle en tête de `app::state` continue de s'appliquer, le verrou de `Multifus` ne se tient pas pendant l'appel.

**Le journal, et ce qu'il ne porte pas.** `RelayEnabled` seul, `RelayDisabled` avec son motif, `RelaySent` avec le pseudo, `RelayNoticeSent` avec le cas, `RelayFailed` avec sa raison, `DisplayAwake` avec l'état posé ou relâché, `DisplayAwakeFailed` avec ce que le système a dit. Ni `RelayEnabled` ni `RelaySent` ne portent le champ qu'une version de cette ligne leur donnait, une surface et un type : l'interrupteur a une seule porte et le message privé est le seul type relayé, donc les deux champs n'auraient qu'une valeur. Aucun corps, sous aucune forme, et un test qui compare la liste exacte des champs, comme celui qui garde déjà l'événement de notification. Trois échecs à ne pas confondre, parce qu'ils se réparent dans trois endroits différents : le trousseau qui refuse de rendre le jeton, Telegram qui refuse la requête, et le réseau qui n'est pas là.

**L'appariement.** L'utilisateur crée le robot chez BotFather, colle le jeton dans l'écran Relais, écrit un message au robot depuis son téléphone, puis clique Connecter. multifus appelle `getUpdates` une seule fois, prend l'identifiant de salon du premier message, l'écrit dans la configuration, range le jeton dans le trousseau et envoie un message d'essai. Aucune boucle de scrutation : multifus n'a aucune boucle réseau vivante aujourd'hui et cette étape ne lui en donne pas.

#### Ce qui a été mesuré

| Question                                         | Réponse                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `AXValue` tronque-t-il le corps ?                | **Non.** Entier jusqu'à 400 caractères, sans points de suspension. Six longueurs postées, six longueurs rendues    |
| L'assertion d'énergie se pose-t-elle ?           | **Oui.** Elle s'inscrit sous le pid de multifus avec son nom dans `pmset -g assertions`, et se relâche             |
| `keyring` ouvre-t-il une invite en `tauri dev` ? | **Oui.** Un binaire recompilé bloque sur une boîte de dialogue. Voir le tableau de l'ADR 0009                      |
| Que rend `getUpdates` sur un jeton invalide ?    | HTTP **401**, `{"ok":false,"error_code":401,"description":"Unauthorized"}`. Un jeton sans deux-points rend **404** |
| Combien de crates coûte l'étape ?                | **Trois** pour le relais, plus **une** pour les carrés à scanner, sur macOS comme sur Windows                      |
| Le titre après une déconnexion pour inactivité ? | **`Dofus Retro v1.48.21`**, sans tiret devant `Dofus`. Aucun pseudo n'y est lu, aucun personnage n'est inventé     |

La question du double déclenchement de l'observateur est traitée dans « Ce qui mord », parce que la mesure a rendu autre chose que ce qu'on lui demandait et qu'elle est douteuse.

Deux de ces lignes sont maintenant tenues par le code de 11a et non plus par un prototype. Les trois crates sont ce que `Cargo.lock` a réellement gagné, `keyring`, `keyring-core` et `apple-native-keyring-store`, et rien d'autre. L'assertion se pose et se relâche dans `cargo test`, et elle apparaît bien dans `pmset -g assertions` sous le nom `multifus relay`.

#### Ce qui reste à mesurer, et qui demande la vraie machine

**Ce que rend `getUpdates` sur un vrai robot à qui personne n'a écrit.** Ce n'est plus un préalable : la partition du code ne repose pas sur la forme exacte de cette réponse. Une erreur de transport est le réseau ; un HTTP non 2xx ou un `ok: false` est le jeton ; `ok: true` sans aucune mise à jour portant un `message.chat.id` est le seul cas restant, et c'est « écris à ton robot ». La commande reste bonne à passer pour confirmer :

```bash
curl -s "https://api.telegram.org/bot<JETON>/getUpdates"
```

Sans `offset`, cet appel ne consomme rien et Telegram garde les messages 24 heures. Cliquer Connecter deux fois marche donc, écrire au robot la veille non.

**Le verrouillage de session, et le protocole d'origine ne pouvait pas le détecter.** La machine a `displaysleep` à 120 minutes, `idleTime` à zéro et un verrouillage 300 secondes après extinction : elle ne se verrouille qu'au bout de deux heures et cinq minutes, donc les « vingt minutes » de la vérification passaient que l'assertion marche ou non. Pour que l'essai veuille dire quelque chose :

```bash
sudo pmset -a displaysleep 2
sysadminctl -screenLock immediate
```

Puis, sans multifus, trois minutes sans rien toucher, l'écran doit s'éteindre et verrouiller. Puis, relais actif, cinq minutes sans rien toucher, l'écran doit rester allumé et `pmset -g assertions` doit montrer la ligne de multifus. Enfin `sudo pmset -a displaysleep 120` et `sysadminctl -screenLock 300`.

#### Le client Telegram, tranché

`reqwest` en dépendance directe. Mesuré avec `cargo tree` sur `aarch64-apple-darwin`, en comparant à l'arbre existant :

| Ce qu'on ajoute                          | Crates en plus                                              |
| ---------------------------------------- | ----------------------------------------------------------- |
| `reqwest`, `json` + `rustls-no-provider` | **0**                                                       |
| `reqwest` avec ses réglages par défaut   | 7, dont `aws-lc-rs` et `aws-lc-sys`                         |
| `frankenstein` + `client-reqwest`        | 14, dont `aws-lc-sys`, `bon`, `prettyplease`, `async-trait` |
| `frankenstein` + `client-ureq`           | 20, dont `ureq`, `ureq-proto`, `webpki-roots`, `rand`       |

`teloxide` reste écarté sans mesure : deux appels ne justifient pas un cadriciel de dialogue.

**L'argument contre `frankenstein` était faux, et le vrai est plus fort.** Une version antérieure de ce document disait que son client bloquant ferait entrer une seconde pile TLS. C'est inexact : `ureq` 3 roule sur le `rustls 0.23.43` déjà dans le verrou. Le vrai coût est quatorze crates pour deux URL, et surtout `aws-lc-sys`, une bibliothèque C que `client-reqwest` fait entrer en activant le TLS par défaut de `reqwest`.

Les trois déclarations, à zéro crate près pour les deux premières :

```toml
reqwest = { version = "0.13", default-features = false, features = ["json", "rustls-no-provider"] }
rustls  = { version = "0.23", default-features = false, features = ["ring"] }
keyring = "4"
```

Le trait de `reqwest` s'appelle `rustls-no-provider` et pas `rustls-tls`. C'est celui que `tauri-plugin-updater` demande déjà, d'où le zéro.

**Et il manque une ligne que personne n'attend.** `rustls-no-provider` veut dire que personne n'installe le fournisseur cryptographique. Aujourd'hui c'est l'updater qui le fait, **dans sa boucle de vérification** et pas à l'initialisation du greffon :

```rust
// tauri-plugin-updater-2.10.1/src/updater.rs:446
if rustls::crypto::CryptoProvider::get_default().is_none() {
    let _ = rustls::crypto::ring::default_provider().install_default();
}
```

Un `sendMessage` parti avant la première vérification de mise à jour trouverait donc un `rustls` sans fournisseur et échouerait avec une erreur illisible. multifus pose le sien au démarrage, ce qui rend le garde de l'updater sans objet.

**Le greffon HTTP officiel n'est pas la réponse.** Sur les trente greffons du catalogue, un seul touche au sujet, et son intérêt est d'exposer un client HTTP **au webview**. Côté Rust il n'est rien d'autre que `reqwest`. Le prendre ajouterait une surface de permission là où l'ADR 0009 tient précisément à ne pas en avoir. Rien d'officiel ne couvre le trousseau, à part `stronghold` que l'ADR 0009 écarte, ni l'écran tenu éveillé.

#### Pièges connus d'avance

**Le jeton est dans l'URL, et `reqwest` met l'URL dans ses erreurs.** Sa propre documentation le signale et propose `without_url`. Recopier un `error.to_string()` de transport dans le journal y écrirait le jeton du robot, dans un fichier qui vit des semaines et qu'on colle dans un rapport de bug. `app::relay::telegram` le retire sur tous ses chemins d'erreur, et rien d'autre ne protège cette règle. Ne jamais formater une erreur `reqwest` de ce module autrement.

**L'activation lit le trousseau, donc elle ne peut pas vivre sur le fil principal.** `tray::on_menu_event` tourne sur le fil principal, et l'ADR 0009 a mesuré une lecture bloquée sur une boîte de dialogue. Branchée directement là, l'activation gèle la fenêtre et la boucle d'événements le temps que quelqu'un clique.

**Et la file du travailleur n'est pas la réponse, contrairement à ce que ce paragraphe disait.** Il demandait qu'elle devienne une énumération, `Focus(String)` et `ToggleRelay`. Ce travailleur est un fil unique et séquentiel : une activation bloquée sur la boîte du trousseau y bloque tout le reste, donc un clic sur un personnage dans le menu ne fait plus rien et rien ne l'écrit. C'est la panne que ce paragraphe cherche à éviter, déplacée d'un fil.

11b-1 avait déjà posé la bonne forme, et c'est celle qui est écrite : `relay::run::toggle` est appelé depuis `on_menu_event` et rend la main tout de suite, comme `update::install` juste au-dessus ; le réseau part sur `tauri::async_runtime::spawn` et le trousseau sur `spawn_blocking`, comme `pairing::pair`. La file du travailleur reste un `Sender<String>`.

Le clic sur l'état « pas prêt » ne part pas sur le travailleur non plus : il ouvre l'écran Relais, comme les cinq articles d'écran. `on_menu_event` lit la préparation en prenant le verrou, ce qu'il fait déjà pour trois de ses articles, et la règle du verrou interdit de le tenir et pas de le prendre.

**`PlatformDisplayKeeper` n'est posé nulle part.** `app::setup` gère le gestionnaire de fenêtres et le watcher, pas le keeper. C'est une ligne, et elle manque depuis 11a.

**Sur Windows le keeper échoue à chaque tour.** `keep_awake` rend `NotImplemented` et `is_awake` rend toujours `false`, donc chaque balayage avec un personnage relayé connecté retentera et échouera jusqu'à l'étape 9. `log_unless_repeated` le réduit à une ligne, c'est tenable. Sur macOS le keeper est idempotent en interne, donc l'appeler à chaque tour est gratuit et l'appelant ne garde aucun booléen.

**L'échec de l'écran tenu éveillé n'est pas un `RelayFailed`.** Le relais marche encore, jusqu'au verrouillage. Deux événements qui recopient le couple `Listening` / `ListeningFailed` déjà présent : `DisplayAwake { held }` et `DisplayAwakeFailed { detail }`.

**`RelayEnabled` ne porte pas de surface.** L'interrupteur est dans la barre système et nulle part ailleurs, donc le champ n'aurait qu'une valeur. `RelaySent` ne porte pas de type non plus, et pour la même raison : le message privé est le seul type relayé, codé en dur. C'est `RelayDisabled` qui porte quelque chose, et c'est un **motif** et non une surface.

**Quatre motifs et non trois.** Le raccourci, la barre système, le décochage du dernier personnage relayé, et le robot délié. Ce quatrième manquait, et son absence était un vrai trou : le fil d'envoi tient le jeton et le salon en mémoire, donc délier pendant que le relais tourne laissait l'écran dire « pas relié », le menu dire `Désactiver le relais`, et les messages privés continuer de partir. Même chose pour la remise à zéro, qui vide le salon. Les deux arrêtent le relais avant de toucher à la configuration.

**L'arrêt au raccourci se place derrière le garde du périmètre.** Un raccourci se déclenche à chaque appui, n'importe où, et `OutsideGame` est de loin l'issue la plus fréquente : branché dans `shortcuts::fire`, un `Control+Shift+flèche` frappé dans un éditeur de texte couperait le relais. Le point est dans `answer`, dans la branche `Ok(Some(window))`, avant `act` : une fenêtre du jeu est devant et une main est au clavier, ce qui est le raisonnement écrit plus haut. L'arrêt part quelle que soit l'issue de l'action, `NobodyInCycle` compris.

**Une notification n'est pas filtrée par l'application qui l'a émise.** L'observateur lit ce que le centre de notifications dessine, quelle qu'en soit la source, donc une notification web dont le titre finit par `- Dofus…` produit un pseudo. Sur le chemin de l'AutoFocus c'est sans effet, le pseudo n'ayant pas de fenêtre, et **le roster reste intact** : seul `apply_windows` crée un personnage, et il n'énumère que les processus du bundle `com.dofus.d1elauncher`. Sur le chemin du relais, qui n'a besoin d'aucune fenêtre par conception, le garde est que `relayed` est un attribut de personnage : un pseudo absent du roster n'est relayé par rien. Ne pas ajouter de filtre, il n'y a rien à filtrer.

**Ce n'est pas `journalLine` qui bute sur la complexité, c'est `runLine`.** Le seuil est `complexity: ["error", 20]`, dans `@viclafouch/oxc-config`. `journalLine` fait quatre branches et n'est pas le sujet ; `runLine` en portait onze plus deux ternaires, soit environ 15, et les trois événements de 11b-2 l'ont mené vers 18. Ça passe, à un ternaire près : les branches ajoutées délèguent donc à des fonctions nommées, comme `rosterLine` et `settingLine` le font déjà, et aucune ne porte de ternaire en ligne.

**Et ce qui casse d'abord n'est pas le lint, c'est le typage, ce qui donne l'ordre de travail.** Écrire les événements côté Rust, passer `cargo test`, puis laisser `tsc` énumérer : `TONES` échoue en premier, puis `PLAIN_LINES` et `DETAILED_LINES`, puis le `switch` de `actionLine` parce que `RunEventKind` n'a pas été mis à jour. Trois tables et deux fonctions se partagent le travail dans `src/lib/strings.ts`, et `ActionEventKind` est **dérivé** de son jumeau par `Exclude` : un événement ajouté côté Rust et oublié dans `RunEventKind` fait échouer la compilation de l'autre moitié. Ne pas remettre un seul `switch`, et ne pas non plus le résoudre par une assertion de type, que `no-unsafe-type-assertion` refuse.

**Aucun `parse_mode` demandé à Telegram.** Un corps de jeu qui contient une astérisque ou un souligné casse l'analyse Markdown, et Telegram rejette le message entier plutôt que de l'envoyer en clair. Texte brut, toujours.

**Telegram limite l'envoi vers un même salon**, de l'ordre d'un message par seconde en régime établi, et répond 429 avec un `retry_after`. Une soirée de messages privés nourris peut l'atteindre. Ne pas réessayer en boucle : écrire la ligne au journal et laisser tomber ce message. Un relais qui se met à retenir des messages pour les envoyer plus tard mentirait sur l'heure à laquelle on a été appelé.

**Le trousseau ne suit pas la configuration.** La question « le relais est-il configuré » se répond en interrogeant le trousseau, jamais en lisant un booléen du fichier, qui pourrait dire oui sur un jeton absent. Même famille d'erreur que le `is_enabled()` de `tauri-plugin-autostart`, qui ne vérifie que l'existence d'un fichier.

**Mais la question se pose à l'activation et pas au lancement**, et c'est la mesure de l'ADR 0009 qui l'impose : au lancement, chaque `tauri dev` ouvrirait une boîte de trousseau, y compris pour travailler sur les raccourcis. À l'activation, l'invite tombe quand l'utilisateur est devant sa machine. Un trousseau qui refuse empêche alors le relais de s'activer, plutôt que de laisser partir quelqu'un qui le croit en marche.

**Le relais ne passe pas par `Decision`.** Ce type est taillé pour l'AutoFocus, qui a besoin d'une fenêtre où sauter, et il rend `Ignored(NoWindow)` pour un pseudo qu'il ne voit plus. Le relais n'a besoin d'aucune fenêtre : le message est arrivé, c'est tout ce qui compte, et le cas où le client vient de tomber est justement celui où relayer sert le plus. Deux chemins depuis `on_notification`, et le plus naturel à écrire est celui qui avale ces messages.

**Le jeton ne ressort jamais vers React.** Il n'existe pas de commande qui le rende, et depuis 11a il ne peut pas y en avoir : une lecture rend un `BotToken`, qui n'est pas `Serialize`. L'écran affiche un état, relié ou pas relié, et un bouton pour délier qui efface l'entrée du trousseau.

**Le relais est indépendant de l'AutoFocus.** L'interrupteur maître coupé, le relais continue de relayer : l'un dit ce qui a le droit de ramener une fenêtre devant les yeux, l'autre ce qui a le droit de déranger quelqu'un qui n'est pas là. Ils ne partagent aucun réglage.

**Un personnage en veille est relayé comme les autres.** La veille retire du défilement, elle ne rend pas un personnage muet, l'AutoFocus s'applique déjà aux personnages endormis. C'est `relayed` qui dit qui est relayé, et rien d'autre : lier les deux ferait taire une mule qu'on a seulement sortie du défilement pour jouer plus confortablement. Voir ADR 0011.

#### Ce que ça arbitre contre le principe directeur

Le relais est la première fonctionnalité qui oblige à ouvrir la fenêtre pour être installée, puisqu'il faut y coller un jeton. L'arbitrage est le même que pour le démarrage avec la session : un réglage d'une seule fois, et un usage quotidien qui tient dans un clic de la barre système. Le principe visait les réglages qu'on visite, pas ceux qu'on pose une fois.

#### Vérification

De 11a et 11b-1, ce qui se vérifie sans le robot est fait : `cargo test` passe, `cargo tree` ne montre que les trois crates, un fichier de configuration écrit avant cette étape se relit avec tout le monde relayé, l'assertion se pose et se relâche, et la lecture de l'économiseur rend ce que `defaults -currentHost read com.apple.screensaver idleTime` rend. Ce qui suit demande le robot et la vraie machine.

**L'essai qui clôt 11b-1 est passé.** Robot créé chez BotFather dans Telegram Web, jeton collé, message écrit au robot, Connecter : le message d'essai est arrivé sur le téléphone et l'écran est passé à « Robot connecté ». L'invite de trousseau de l'ADR 0009 se produit bien en `tauri dev`, comme mesuré, et ne bloque rien une fois autorisée.

**Le chemin d'envoi de 11b-2 est passé aussi.** Deux essais, faits seul et sans deuxième joueur. L'activation depuis la barre système, tous les clients fermés, a fait partir l'avis collectif de l'ADR 0010 sur le téléphone : ça prouve d'un coup la lecture du trousseau, le salon, le client HTTPS, la file et la tâche d'envoi. Puis une bannière postée à `osascript`, au titre d'un client Retro et au corps d'un message privé, est arrivée sur le téléphone sous la forme attendue.

Reste, avec quelqu'un d'autre, un vrai message privé émis par un vrai client.

**Puis le quart d'heure, qui est l'essai qui compte.** Un seul personnage coché, la machine laissée seule vingt minutes. Il doit arriver un message privé, puis un avis de déconnexion vers la quinzième minute, puis plus rien. `pmset -g assertions` doit montrer la ligne de multifus avant l'avis et ne plus la montrer après. Le retour au clavier avec un raccourci de défilement doit couper le relais.

Le protocole de l'assertion est plus haut, avec les deux commandes qui rendent l'essai détectable ; l'exécuter séparément, sur une machine où l'écran s'éteint en deux minutes.

Enfin, deux personnages, un seul coché, un message privé sur chacun : un seul doit arriver sur le téléphone. Puis l'envoi du corps coché et décoché, pour voir les deux formes du message. Et le journal relu pour vérifier qu'aucune des formes n'y a laissé une trace du texte.

### Étape 9 — Implémentation Windows

**Objectif.** La parité, sur la machine où l'application sert vraiment.

Session à ouvrir sur le PC Windows, dépôt cloné. Prérequis : Microsoft C++ Build Tools avec la charge « Développement Desktop en C++ », puis `rustup default stable-msvc`. WebView2 est déjà présent sur un Windows 10 à jour.

Utiliser la crate `windows`, qui couvre WinRT nativement. `UserNotificationListener` pour l'écoute, `EnumWindows` et `GetWindowText` pour l'énumération. Implémenter aussi la suppression des toasts au focus, possible ici et impossible sur macOS.

**Filtrer sur le processus et pas sur le seul titre, et c'est un bug déjà vu.** `EnumWindows` balaie tout le bureau, et un onglet de navigateur intitulé `Quelque chose - Dofus Retro` satisfait la regex : le navigateur entre alors dans le roster comme un personnage et se fait ramener au premier plan. C'est arrivé. macOS n'a jamais eu ce trou parce que `dofus_applications` n'énumère que les processus du bundle `com.dofus.d1elauncher`, et Windows doit faire pareil : `GetWindowThreadProcessId`, puis le nom de l'exécutable du processus. Le titre reste ce qui donne le pseudo, il cesse d'être ce qui donne le droit d'entrer.

**Piège à ne pas reproduire.** Dracoon contourne la restriction de `SetForegroundWindow` en injectant une vraie frappe Alt dans l'application active. C'est la cause probable du bug de focus intermittent corrigé dans son commit `0b0525c`, et ça envoie une touche parasite dans le jeu. Passer par `AttachThreadInput`.

Ce qui attend déjà de ce côté : `platform::windows` compile en renvoyant `NotImplemented` méthode par méthode, la regex et la table `NOTIF_TYPES` sont dans `domain` et ne sont pas à réécrire, et les raccourcis globaux échouent franchement sur cette plateforme quand une combinaison est déjà prise, contrairement à macOS.

---

## Ce qui mord

**L'autorisation d'Accessibilité se donne à une identité de code, pas à un projet.** Le `target/debug/multifus` de `tauri dev` et l'application empaquetée sont deux choses distinctes, et en développement c'est le terminal qui porte l'autorisation, jamais multifus. Sur le paquet, une signature ad hoc change à chaque compilation et l'entrée reste cochée à l'écran sans plus s'appliquer. C'est ce que l'étape 10 répare, et le raisonnement complet est dans [ADR 0005](./adr/0005-signature-developer-id-plutot-qu-ad-hoc.md). Quand l'autorisation disparaît sans raison apparente, `tccutil reset Accessibility com.viclafouch.multifus` puis réaccorder. Le diagnostic ne se devine pas, il se lit : `sqlite3 "/Library/Application Support/com.apple.TCC/TCC.db" "select client, auth_value, datetime(last_modified,'unixepoch') from access where client like '%multifus%'"`. Une entrée autorisée mais datée d'avant le binaire installé, et c'est elle, l'autorisation appartient à une version qui n'existe plus.

**Une notarisation à moitié configurée ne fait pas échouer la compilation.** Lu dans `tauri-bundler`, `crates/tauri-bundler/src/bundle/macos/app.rs` : seul un identifiant d'équipe manquant est une erreur franche, tout le reste ne produit qu'un avertissement et la compilation continue. Un secret mal recopié sort donc un paquet signé mais non notarisé, qui s'installe très bien sur la machine qui l'a construit et se fait refuser partout ailleurs. Le seul contrôle qui vaille est de télécharger le DMG depuis une autre machine, ou au moins depuis un autre compte, pour que la quarantaine s'applique vraiment.

**Une release en brouillon n'annonce rien, et c'est une réponse et non une panne.** L'updater interroge `releases/latest/download/latest.json`, et GitHub ne considère pas un brouillon comme la dernière release : le fichier répond donc 404 tant que rien n'est publié. Or le plugin ne distingue pas ce cas dans son type de retour, il rend `Error::ReleaseNotFound`. Laissé tel quel, ça affichait « la mise à jour n'a pas abouti » à chaque démarrage, en anglais dans une interface française, avec une ligne d'avertissement au journal à chaque fois. `app::update` traite donc cette variante-là comme « à jour », et elle seule : un réseau qui tombe rend `Reqwest` ou `Network` et reste un échec. Lu dans `plugins/updater/src/updater.rs`, où une réponse non 2xx ne renseigne pas `last_error` et sort par `ok_or(Error::ReleaseNotFound)`.

**macOS relance lui-même les applications ouvertes au moment de la déconnexion, et ça fausse l'essai du démarrage avec la session.** La case « Rouvrir les fenêtres lors de la prochaine connexion » relance multifus par `loginwindow` et non par l'agent, donc sans `--from-session` et avec sa fenêtre. Quitter multifus avant de se déconnecter, ou décocher. Le diagnostic tient en une commande : `ps -o args= -p $(pgrep -f /Applications/multifus.app)`. L'argument est là, c'est l'agent ; il n'y est pas, c'est la reprise de macOS.

**Le paquet installé et le paquet compilé sont deux choses**, et l'agent porte le chemin du premier. Un `tauri build` ne change rien à ce qui démarre avec la session tant que `/Applications` n'a pas été remplacé, et l'argument n'entre dans le plist qu'au premier lancement à la main de la version qui sait l'écrire. Comparer les dates avant de chercher plus loin.

**Un `tauri build` local se termine sur une erreur, et le paquet est pourtant là.** `createUpdaterArtifacts` demande de signer l'archive, et sans `TAURI_SIGNING_PRIVATE_KEY` le bundler écrit les deux paquets, puis échoue sur cette seule signature. L'application et le DMG sont donc utilisables. Pour finir sans erreur : `TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/multifus.key)" npm run tauri build`. Fait une fois, ce qui a prouvé au passage que la moitié privée du disque va bien avec la `pubkey` publiée.

**Une mise à jour installée hérite des arguments du processus qui meurt.** `AppHandle::restart` relance le binaire avec `env.args_os` moins le premier, lu dans `tauri/src/process.rs`, et rien ne permet de lui en retirer un : `restart` reconstruit l'environnement lui-même. Donc un multifus lancé par la session et mis à jour revient sans sa fenêtre, sur le clic qui ressemble le plus à celui qui devrait en montrer une. Laissé tel quel, l'icône étant là et la fenêtre à un clic. Ne pas repartir chasser ça dans `app::update`, ce n'est pas là que ça se joue.

**Sur macOS, une combinaison déjà prise s'enregistre sans erreur et ne se déclenche jamais.** Carbon ne refuse qu'un doublon du même processus, donc ni le bureau ni une autre application ne provoquent d'échec à la pose, et aucune API ne permet de le savoir à l'avance. Ne pas chercher à faire dire au plugin ce qu'il ne sait pas : la seule preuve est un appui depuis le jeu et la ligne que le journal écrit. Windows, lui, refuse franchement.

**`Control+flèche` appartient à macOS**, Mission Control et le passage entre bureaux. Les combinaisons proposées au premier lancement sont donc `Control+Shift+flèche`. Et `Pause`, `ScrollLock` et `F21` à `F24` passent le parseur du plugin mais n'ont pas de code de touche sur macOS : elles échouent à la pose, ce que l'écran affiche.

**Ne jamais tenir le verrou de `Multifus` en touchant au watcher de notifications, au plugin de raccourcis ou à l'icône de barre système.** Le premier joint le thread qui exécute le sink, les deux autres attendent le fil principal où les commandes prennent ce verrou. Pour l'icône ce n'est pas une supposition : `TrayIcon::set_menu` passe par `run_item_main_thread!`, qui poste la tâche puis bloque sur `rx.recv()` sans délai (`tauri/src/menu/mod.rs`). C'est le seul interblocage que cette application sache construire, et la règle est écrite en tête de `app::state` et de `app::tray`.

**Le démarrage automatique enregistre un chemin, et personne ne s'en aperçoit.** `tauri-plugin-autostart` écrit `~/Library/LaunchAgents/<nom>.plist` avec le chemin absolu du binaire ; l'application déplacée, `launchd` échoue en silence. Et `is_enabled()` ne fait que vérifier l'existence du fichier, sans jamais comparer le chemin qu'il contient, donc il répondrait « oui » sur un enregistrement mort. D'où la règle : la configuration porte l'intention, `app::autostart::reconcile` réécrit l'enregistrement à chaque lancement, et une application déplacée se répare à sa première ouverture manuelle. Même raison pour macOS 13 et plus, où l'utilisateur peut couper l'entrée depuis Réglages Système sans que le plist bouge.

**L'image de barre système n'est pas le logo.** `tray-icon` fixe la hauteur de la `NSImage` à 18 points et déduit la largeur du rapport. Donc `icons/tray.png` est un PNG **RVBA 36 × 36**, noir pur, forme portée par le seul canal alpha, fond transparent, posé avec `icon_as_template(true)` pour que macOS le recolore selon la barre. Un logo en couleur mis là ressort gris et illisible. `tauri::include_image!` décode à la compilation et **refuse un PNG qui n'est pas en RVBA**.

**L'AutoFocus macOS dépend de l'affichage des bannières, et la livraison sans affichage a été essayée.** Décocher « Bureau » en gardant « Centre de notifications » ne donne rien du tout : macOS ne construit aucun élément tant que le panneau reste fermé, donc l'observateur n'a rien à lire. Mesuré sur un combat, un défi et un échange, journal vide et aucune fenêtre ramenée. Ne pas rouvrir cette piste, elle est dans ADR 0002. Le réglage le moins gênant qui marche est bannière sur le Bureau, style temporaire, son coupé, aperçus par défaut. Sur Windows c'est l'inverse, l'écoute passe par une API et les bannières peuvent rester coupées.

**Un client Dofus sur l'écran de connexion existe déjà en tant que processus** avec des fenêtres, mais sans titre exploitable. Toujours filtrer sur le titre, jamais sur la taille. Un client **déconnecté pour inactivité** ressemble à ça : la fenêtre reste, le pseudo quitte le titre, et le personnage passe hors ligne tout seul au tour de balayage suivant. C'est ce qui rend l'avis de déconnexion gratuit à détecter.

**Une mesure douteuse sur l'observateur de bannières, gardée ici et pas agie.** En postant des notifications avec `osascript`, `AXCreated` ne s'est déclenché que pour la première d'une série : tant qu'une bannière du même émetteur restait à l'écran, macOS **réemployait son élément** et seul `AXLayoutChanged` tirait, deux à trois fois, à moins de 11 ms d'écart. Le seuil observé était entre 4,1 et 5,1 secondes, ce qui est la durée de vie d'une bannière temporaire. Pris au pied de la lettre, ça voudrait dire que deux messages privés à trois secondes d'écart n'en produisent qu'un seul focus.

**Ne pas agir dessus en l'état.** `display notification` ne pose aucun identifiant de notification, donc macOS a très bien pu traiter ces envois comme des mises à jour d'une même notification et non comme des notifications distinctes. Un client Dofus en pose sûrement un différent à chaque fois, et l'usage réel n'a jamais montré d'AutoFocus manquant. L'essai qui tranche ne demande aucun outil : deux vrais clients, deux messages privés à trois secondes d'écart, puis le journal. Deux lignes `Message privé`, la mesure était un artefact. Une seule, il faut écouter `AXLayoutChanged` en plus d'`AXCreated` et dédoublonner sur une fenêtre courte, en comparant à la notification précédente et jamais à un ensemble, sans quoi le même message reçu deux fois dans la soirée n'en ferait qu'un.

**`Character` n'a pas de `#[serde(default)]` de structure, et `Settings` en a un.** Un champ ajouté au personnage sans défaut à lui fait échouer la lecture de tout fichier existant : la configuration part en quarantaine, les défauts se chargent, et les sexes assignés partent avec. Poser `#[serde(default)]` sur la structure pour s'en tirer ferait pire, un personnage tronqué revenant sans pseudo.

**Les traits de `keyring` 4 ne s'appellent pas comme on croit.** `apple-native` et `windows-native` n'existent pas, et nommer les vrais, `apple-native-keyring-store` seul, ne compile pas : le trait de `keyring` n'active pas le sous-trait `keychain` du magasin. La bonne déclaration est `keyring = "4"` sans rien, dont le trait par défaut `v1` fait déjà le bon choix par cible. Détail dans l'ADR 0009.

**`cargo check --target x86_64-pc-windows-msvc` échoue depuis macOS**, avant même de compiler une ligne du projet : le build script de Tauri réclame `llvm-rc`, absent de la machine. C'est antérieur au projet, constaté sur un dépôt neuf, ne pas partir chasser ça dans le code.

**TypeScript 7 a supprimé `baseUrl`.** Les `paths` du `tsconfig.json` se résolvent relativement au fichier lui-même. Ne pas le réintroduire, le build casse.

**shadcn 4.16 repose sur Base UI, pas sur Radix.** Les API de composants diffèrent de la plupart des tutoriels shadcn en circulation.

**Ce que la règle du verrou interdit, c'est de le tenir, pas de le prendre.** `shortcuts::fire` et le clic sur un personnage dans la barre système avalent l'échec de leur `send` parce qu'il n'y a plus rien à écrire : le worker n'a jamais démarré, ce que `start` a noté, ou il est mort, ce qu'un `catch_unwind` autour de chaque réponse empêche désormais. Ce n'est pas une question d'interblocage, et une version de ce texte l'a prétendu à tort : `tray::on_menu_event` prend ce verrou sur ce même fil principal pour trois de ses articles. L'interdit porte sur le fait de le tenir pendant un appel qui attend le fil principal.

**`tauri-plugin-log` écrit du `[INFO]` sur chaque ligne, et c'est voulu.** Le journal n'a pas de niveaux, il a des événements, et la gravité est une lecture que fait l'interface. Ne pas ajouter une table de gravité côté Rust pour rendre le fichier plus joli : ce serait une seconde source de vérité. Ne pas non plus passer par `.format()`, qui est écrasé par `.timezone_strategy()` appelé après lui.

**oxfmt réécrit `tableau[tableau.length - 1]` en `tableau.at(-1)`**, que la `lib` TypeScript du projet n'a pas, donc le code ne compile plus après un `lint:fix`. Passer l'index par une variable. Constaté dans `journalPeriod`.
