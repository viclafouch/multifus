Le logiciel, en Tauri v2 : `https://v2.tauri.app/llms.txt`.

On lance multifus et on l'oublie : une fonctionnalité qui oblige à ouvrir la
fenêtre a un raccourci clavier, ou elle n'existe pas.

`tauri dev` est le seul endroit où le vrai logiciel se voit. Pour l'œil, un
navigateur piloté suffit si `window.__TAURI_INTERNALS__` est bouchonné avant le
chargement de la page : `@tauri-apps/api` n'appelle que son `invoke`.
L'instantané bouchon doit porter les vraies formes, une valeur inventée cassant
l'écran sans rien dire.

La CI audite les dépendances Rust avec `cargo-deny`, qui n'est pas dans le
dépôt : `cargo install cargo-deny --locked` pour lancer `pnpm --filter
@multifus/desktop run deny:rust` ici. Le hook de commit ne le lance pas, il
faudrait le réseau à chaque commit.

Le logiciel active une instance globale de Lingui. Le menu de la barre système a
sa propre table, en Rust, parce qu'il doit exister sans fenêtre.
