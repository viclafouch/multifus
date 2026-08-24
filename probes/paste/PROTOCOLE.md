# Protocole de mesure, les réponses rapides sur macOS

Ce dossier est jetable. Il répond aux quatre questions du temps 1 de
[plan.md](../../docs/plan.md), puis il est supprimé.

## Avant de commencer

**Accorder l'Accessibilité au terminal**, pas à multifus. Le binaire emprunte
l'autorisation de son lanceur, et sans elle `CGEventPost` échoue sans rien dire,
ce qui se lit comme « Dofus refuse le collage ». Réglages Système,
Confidentialité et sécurité, Accessibilité, puis cocher le terminal. Le binaire
le vérifie et s'arrête si l'autorisation manque.

Un client Dofus Retro connecté, une fenêtre de chat ouverte. **Vider le champ de
chat entre deux essais**, et ne jamais frapper Entrée.

Toutes les commandes se lancent depuis `probes/paste`.

## A — Question 1, la combinaison arrive-t-elle dans le chat

```bash
cargo run --release
```

Cinq secondes pour passer devant Dofus et cliquer dans le champ de chat.

| Ce que le chat porte    | Ce que ça dit                   |
| ----------------------- | ------------------------------- |
| `multifus prix libre`   | oui, l'ADR 0012 tient           |
| `ANCIEN-PRESSE-PAPIERS` | oui, mais 300 ms est trop court |
| rien                    | passer aux replis ci-dessous    |

Replis, dans cet ordre, et s'arrêter au premier qui écrit quelque chose :

```bash
cargo run --release -- --tap session
cargo run --release -- --tap annotated
cargo run --release -- --source combined
cargo run --release -- --combo ctrl
```

**La suite emploie la première commande qui a marché.** Si aucune n'écrit rien,
la mesure répond non, l'ADR 0012 est remplacé par sa version courte et le
périmètre ne s'ouvre pas.

## B — Question 4, le chat doit-il déjà avoir le focus

La même commande, mais **sans cliquer dans le champ de chat**. La fenêtre Dofus
est devant, le curseur n'est nulle part.

À rapporter : le texte arrive quand même, ou rien n'arrive. Si rien n'arrive,
« coller seulement » est confirmé et l'écran devra le dire.

## C — Question 2, les modificateurs encore enfoncés

C'est le piège qui coûte le plus de temps. Une réponse rapide posée sur `Control+K` part
avec le `Control` physiquement bas.

```bash
cargo run --release -- --wait 8
```

**Garder `Control` et `Shift` enfoncés** pendant tout le compte à rebours et
jusqu'à la ligne « Combinaison posée ». Puis la même chose avec le relâchement :

```bash
cargo run --release -- --wait 8 --flush
```

À rapporter : ce que le chat porte dans chacun des deux cas. Si le premier écrit
le texte, `send_paste_combination` n'a rien à relâcher. Si seul le second
l'écrit, le relâchement entre dans la fonction.

## D — Question 3, le délai avant de rendre le presse-papiers

Le témoin d'abord, sans restitution du tout. Il doit écrire le texte de la
réponse rapide, sinon le reste ne veut rien dire.

```bash
cargo run --release -- --restore-ms 0
```

Puis, du plus court au plus long, et s'arrêter au premier qui écrit
`multifus prix libre` au lieu de `ANCIEN-PRESSE-PAPIERS` :

```bash
cargo run --release -- --restore-ms 10
cargo run --release -- --restore-ms 25
cargo run --release -- --restore-ms 50
cargo run --release -- --restore-ms 100
cargo run --release -- --restore-ms 200
```

À rapporter : le plus petit délai qui colle encore la réponse rapide. Il devient une
constante nommée, avec la date de la mesure à côté.

## Ce qu'il faut rendre

Quatre lignes, et ce sont les quatre du plan.

1. La combinaison arrive, oui ou non, et avec quels réglages.
2. Faut-il relâcher les modificateurs.
3. Le plus petit délai qui tient.
4. Le chat doit-il déjà avoir le focus.
