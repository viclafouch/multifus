# Plan de développement

**Aucun chantier en cours.** Les réponses rapides ont été livrées le 25 août 2026,
vues marcher sur les deux systèmes. Ce qui en reste est archivé : le geste et ses
bords dans l'[ADR 0012](./adr/0012-une-reponse-rapide-se-colle-dans-le-jeu.md),
les mesures dans [macos.md](./macos.md) et [windows.md](./windows.md), les pièges
dans [pieges.md](./pieges.md).

**La session qui ouvre le chantier suivant écrit son cadrage ici**, et ce document
redescend à cette liste quand il est fini. Il ne porte qu'un chantier à la fois,
sur les deux systèmes ensemble : une fonctionnalité neuve arrive des deux côtés ou
n'arrive pas.

| Où lire quoi                              |                                   |
| ----------------------------------------- | --------------------------------- |
| Le vocabulaire                            | [CONTEXT.md](../CONTEXT.md)       |
| Ce que le projet refuse de faire          | [perimetre.md](./perimetre.md)    |
| Les décisions déjà tranchées              | [adr](./adr)                      |
| Les pièges qui ne sont propres à personne | [pieges.md](./pieges.md)          |
| macOS, fait et archivé                    | [macos.md](./macos.md)            |
| Windows, fait et archivé                  | [windows.md](./windows.md)        |
| Les règles d'écriture du code             | [.claude/rules](../.claude/rules) |

---

## Ce qui attend

| À faire                                                                  | Où                         |
| ------------------------------------------------------------------------ | -------------------------- |
| La soirée de vérification, deux vrais clients, sur les deux systèmes     | ci-dessous                 |
| Créer un certificat **Developer ID Application** et l'exporter en `.p12` | developer.apple.com        |
| Poser les huit secrets du workflow `release`                             | Réglages du dépôt          |
| Remplacer le logo du scaffolder Tauri                                    | `src-tauri/icons`          |
| Le certificat Authenticode, à trancher quand macOS sera publié           | [windows.md](./windows.md) |
| Confirmer `crate-type = ["rlib"]` par un `cargo build` sur le Mac        | [windows.md](./windows.md) |

Les huit secrets : `APPLE_CERTIFICATE` (le `.p12` en base64),
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`,
`APPLE_PASSWORD` (un mot de passe d'application, pas celui du compte),
`APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY` et
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, vide ici.

**La paire de clés de l'updater existe déjà, ne la régénère pas.** Elle est dans
`~/.tauri/multifus.key` et son `.pub`, sans mot de passe, et la moitié publique
est déjà le champ `plugins.updater.pubkey` de `tauri.conf.json`. Une nouvelle
paire rendrait insignables les mises à jour des versions déjà installées.

### La soirée de vérification

Elle ne demande que du jeu, et elle vaut sur les deux systèmes. Cinq choses n'ont
jamais été vues : une réponse rapide sans combinaison, qui ne doit rien faire et
dont l'écran doit le dire ; une combinaison déjà prise par le Défilement, qui doit
être refusée par son nom ; la même combinaison frappée hors du jeu, qui ne doit
rien faire du tout ; un texte copié avant, qui doit se retrouver dans le
presse-papiers après ; et le journal, qui doit porter une ligne par collage.

S'y ajoute, côté Windows seul, ce que [windows.md](./windows.md) attend depuis les
quatre lots : deux vrais clients, le roster qui les voit, les quatre raccourcis et
l'AutoFocus sur une vraie soirée.
