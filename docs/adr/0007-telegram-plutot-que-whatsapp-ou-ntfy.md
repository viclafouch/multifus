# Le relais écrit dans un salon Telegram, et pas dans WhatsApp

Le besoin est d'être averti d'un message privé pendant qu'on est loin de la machine. La question était par quel service, et elle a été posée pour WhatsApp en premier.

## Ce que le choix ne coûte pas

Tous les candidats sont une seule requête HTTPS depuis Rust. `reqwest` est déjà dans l'arbre de dépendances, tiré par `tauri-plugin-updater`, donc aucun paquet npm n'entre dans cette histoire et le relais ne vit pas dans React. Changer de service plus tard revient à réécrire une URL et deux champs.

Le choix se juge donc sur deux choses seulement : est-ce que la notification arrive vraiment, et qui peut lire ce qu'elle porte. Le coût d'intégration ne départage rien.

## Ce qui a été écarté, et pourquoi

| Service    | Gratuit           | Authentifié           | iOS | Android | Motif du refus                                       |
| ---------- | ----------------- | --------------------- | --- | ------- | ---------------------------------------------------- |
| WhatsApp   | non en pratique   | oui                   | oui | oui     | Fenêtre de 24 heures, numéro dédié, gabarits payants |
| ntfy       | oui, 250 par jour | non au palier gratuit | oui | oui     | Livraison iOS documentée comme peu fiable            |
| Gotify     | oui, auto-hébergé | oui                   | non | oui     | Pas d'application iOS, et un serveur à tenir         |
| Bark       | oui               | oui, clé              | oui | non     | iOS seulement, et multifus est distribué             |
| Pushbullet | non en pratique   | oui                   | oui | oui     | Palier gratuit plafonné, le reste est un abonnement  |
| Pushover   | non, 5 dollars    | oui                   | oui | oui     | Payant, écarté par l'utilisateur                     |
| Discord    | oui               | URL secrète           | oui | oui     | Le secret voyage dans une URL, sans révocation fine  |

**WhatsApp n'a aucune interface pour un compte personnel.** La voie officielle est la WhatsApp Business Platform, qui impose un portefeuille d'entreprise Meta, un numéro de téléphone dédié à l'interface et qui ne peut plus servir dans l'application grand public, et une fenêtre de service de 24 heures. Hors de cette fenêtre, seul un gabarit approuvé et facturé peut partir. Un relais permanent obligerait donc à écrire au robot chaque jour pour garder le canal ouvert, ou à payer un gabarit rigide par message privé reçu. Ces règles n'ont pas été relues sur la documentation de Meta pendant la session de cadrage, et le refus ne tient pas au détail de leur formulation : c'est le numéro dédié et la fenêtre qui l'emportent.

Les bibliothèques non officielles font tourner un vrai client WhatsApp Web. Elles violent les conditions d'utilisation, exposent le numéro personnel de l'utilisateur à un bannissement, et demanderaient un environnement Node dans une application Rust.

**ntfy est refusé sur la fiabilité et non sur le prix.** Son unique mission serait d'atteindre l'utilisateur au moment précis où il n'est pas devant sa machine, et c'est exactement là que son application iOS échoue : elle repose sur Firebase Cloud Messaging, le plan d'amélioration de mars 2026 la décrit en retard sur la version Android, et compte plus de quatre-vingts commentaires sur des notifications qui n'arrivent pas, plus un bug de notification muette sur iOS 26.2 et suivants. Un relais auquel on fait confiance et qui rate une livraison est pire qu'un relais absent : le silence se lit comme « personne ne m'a écrit ». S'ajoutent deux points mineurs, un palier gratuit sans réservation de sujet, donc un nom de sujet qui sert de mot de passe, et pas de chiffrement de bout en bout, l'issue qui le suit ne couvrant pas iOS.

**Bark a été le candidat le plus séduisant et il tombe sur un seul point.** Gratuit, ouvert, livraison directe par APNs, clé par appareil, et un chiffrement du corps que le serveur lui-même ne peut pas lire. Mais il n'existe que sur iOS, et multifus est distribué sous licence MIT avec un updater : un utilisateur Android n'aurait rien.

## Décision

Le relais écrit dans un salon Telegram par un robot que l'utilisateur crée lui-même. Deux appels, `getUpdates` une seule fois à l'appariement et `sendMessage` à chaque message privé relayé.

Gratuit sans plafond qui concerne cet usage, authentifié par un vrai couple de valeurs, un jeton et un identifiant de salon, et les deux systèmes de téléphone couverts par un seul chemin de code.

## Ce que ça coûte

**Un robot ne peut pas écrire le premier.** L'identifiant de salon n'existe donc qu'après que l'utilisateur a parlé au robot, ce qui impose un appariement en deux temps et interdit un écran où l'on colle un seul champ.

**Le corps du message privé transite par les serveurs de Telegram**, dont les conversations ordinaires ne sont pas chiffrées de bout en bout. C'est la raison pour laquelle l'envoi du corps est un consentement explicite et non un comportement par défaut, voir [ADR 0008](./0008-corps-relaye-sur-consentement.md).

**Un jeton de robot est un secret**, et il ne va pas dans le fichier de configuration, voir [ADR 0009](./0009-jeton-dans-le-trousseau.md). Ce qu'il permet à qui le détient est précis : écrire dans le salon en se faisant passer pour multifus, et lire ce que l'utilisateur envoie au robot. Il ne permet pas de relire les messages que le robot a déjà envoyés, l'interface des robots ne rendant pas cet historique.

## Ce qui reste possible sans rejouer cette décision

Un second service se brancherait derrière la même frontière, puisque tout se ramène à une requête. Ce n'est pas prévu : le périmètre refuse un catalogue d'intégrations, et un seul destinataire suffit à répondre au besoin.

## Sources

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [ntfy, plan d'amélioration iOS, mars 2026](https://github.com/binwiederhier/ntfy/issues/1680)
- [ntfy, chiffrement de bout en bout, non implémenté](https://github.com/binwiederhier/ntfy/issues/69)
- [ntfy, limites du palier gratuit](https://github.com/binwiederhier/ntfy/issues/1167)
- [Bark](https://github.com/Finb/Bark)
