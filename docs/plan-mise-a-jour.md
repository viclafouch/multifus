# Mise à jour des dépendances

Session du 30 août 2026, avant la première version de production. Tout ce qui a
une version plus récente la prend, et rien ne reste en arrière sans raison
écrite ici.

## Fait

### npm

Huit paquets montés à la dernière version publiée :

| Paquet                   | Avant  | Après  |
| ------------------------ | ------ | ------ |
| `@testing-library/react` | 16.3.2 | 16.3.3 |
| `@types/react-dom`       | 19.2.4 | 19.2.5 |
| `@vitejs/plugin-react`   | 6.0.5  | 6.1.1  |
| `lucide-react`           | 1.28.0 | 1.37.0 |
| `shadcn`                 | 4.16.1 | 4.19.0 |
| `vite`                   | 8.2.0  | 8.2.2  |
| `vitest`                 | 4.1.10 | 4.1.11 |

`npm install` refusait le passage à `@vitejs/plugin-react` 6.1.1 : ce paquet
déclare `@rolldown/plugin-babel` en pair facultatif, et npm résolvait sa chaîne
Babel vers une version candidate incompatible avec le `@babel/core` de l'arbre.
`node_modules` et `package-lock.json` effacés, l'installation neuve passe. Le
verrou est donc réécrit en entier.

### Le compilateur React allumé

`@vitejs/plugin-react` 6.1 sait faire tourner le compilateur React par
`oxc-transform-react`, écrit en Rust. Multifus n'écrit ni `useMemo`, ni
`useCallback`, ni `memo` : le compilateur les pose maintenant tout seul.

`vite.config.ts` porte `react({ compiler: true })`. Cent cinquante-trois
fichiers passent par le compilateur, aucun diagnostic, ni fatal ni récupérable :
le code suit déjà les règles de React. Le paquet principal grossit de 337 à
383 ko, 108 à 123 ko compressés, ce que coûtent les caches de mémoïsation. Sur
une application de bureau qui lit son paquet depuis le disque, ce poids ne se
paie pas ; le rendu, lui, se gagne.

Vitest lit le même `vite.config.ts` : les 902 tests tournent sur le code
compilé, et ils passent.

### `@types/node` ramené sur la ligne 24

`.nvmrc` dit 24, la machine dit 24, et Node 24 est la version LTS active.
`@types/node` était en 26 : TypeScript acceptait des API que Node 24 n'a pas.
Il est maintenant en `^24.13.3`.

### `standard-version` remplacé par `commit-and-tag-version`

`standard-version` n'a rien publié depuis 2022 et son dépôt renvoie vers
`commit-and-tag-version`, qui est sa suite et qui lit le même
`.versionrc.json`. Le script `release` appelle le nouveau nom, et rien d'autre
ne change.

### GitHub Actions

`actions/checkout` de v5 à v7, `actions/setup-node` de v6 à v7. Les deux passent
en ESM et gardent leurs entrées. `checkout` v7 refuse de sortir une branche de
fork sur `pull_request_target` et `workflow_run` : Multifus n'emploie ni l'un ni
l'autre.

`swatinem/rust-cache` v2, `tauri-apps/tauri-action` v1 et
`dtolnay/rust-toolchain@stable` sont déjà au dernier rang.

### Rust, les versions

Chaque dépendance directe est déjà sur son dernier majeur : Tauri 2, `reqwest`
0.13, `keyring` 4, `windows` 0.62, la famille `objc2` 0.3 et 0.6. `cargo update`
a monté cent une caisses indirectes, `keyring` 4.1.6 à 4.2.0 et `log` 0.4.33 à
0.4.34 compris.

Quatre caisses indirectes restent en arrière, tenues par une exigence exacte
d'un paquet tiers : `generic-array` 0.14.7, `toml` 0.8.2, `toml_datetime` 0.6.3
et `toml_edit` 0.20.2. Rien à faire de notre côté.

### Rust, l'édition 2024

`edition = "2024"`. La migration a demandé trois lignes : les blocs
`extern "C"` de `macos.rs` prennent leur `unsafe`. `windows.rs` n'a pas un seul
bloc `extern`, pas une `unsafe fn` et pas un `static mut` : il n'avait rien à
migrer.

Deux avertissements sont sortis, sur l'ordre où tombent les temporaires en fin
d'expression, aux deux `runningApplicationsWithBundleIdentifier` de `macos.rs`.
Les deux en tirent une valeur possédée, un `Retained` copié par `to_vec` et un
`pid_t`, jamais un emprunt sur le temporaire : l'ordre nouveau ne change rien.

`cargo fmt` de l'édition 2024 range les `use` autrement et coupe les longues
assertions : trente et un fichiers touchés, aucun changement de sens.

### Rust, le profil de publication

`Cargo.toml` n'avait pas de `[profile.release]`. Il en porte un :

```toml
codegen-units = 1
lto = true
opt-level = 3
strip = true
```

Deux réglages que Tauri conseille sont écartés :

`panic = "abort"` casserait Multifus. Cinq endroits attrapent une panique par
`catch_unwind`, le tour, les raccourcis, la barre système, la surcouche et le
tableau des runes : une panique dans le tour tue aujourd'hui le tour, elle
tuerait alors l'application entière au milieu d'une soirée.

`opt-level = "s"` vise la taille. Multifus vise la bascule, et le plan porte un
chantier de vitesse. On garde le 3, qui est la valeur par défaut de `release`,
écrite ici pour qu'on ne la remplace pas par le « s » du guide Tauri.

`cargo build --release` passe : deux minutes onze sur le Mac, et un binaire de
dix mégaoctets.

## Vérifié

`oxlint`, `oxfmt --check`, `tsc && vite build`, 902 tests vitest, `cargo fmt`,
`cargo clippy --all-targets -- -D warnings` et 479 tests Rust. Tout passe.

`shadcn diff` ne trouve rien à reprendre sur les sept composants installés.

## Reste à faire

- [ ] Le code Windows n'a pas été compilé : `cargo check --target x86_64-pc-windows-msvc` échoue ici, `ring` demandant un compilateur C pour Windows. La CI le compile sur `windows-latest` et le travail de publication en dépend, mais rien n'est vu tant que la CI n'a pas tourné
- [ ] Tirer une ligne du roster par sa poignée, sur les deux machines : `@dnd-kit/react` suit le geste par des signaux, et le compilateur React mémoïse maintenant la ligne. Les tests le voient à travers un double, pas la vraie bibliothèque
- [ ] Regarder une soirée entière avec le compilateur allumé : la roue, la bannière et le tableau des runes redessinent à chaque tour, et c'est là que le gain se verrait

### Les composants shadcn qu'on n'a pas pris

Le registre porte `kbd`, `empty`, `field` et `badge`, que Multifus écrit à la
main dans `key-cap.tsx`, `empty-roster.tsx`, `empty-replies.tsx`,
`shortcut-field.tsx` et `state-badge.tsx`. Les échanger ne rend rien de plus
rapide : c'est du code à nous contre du code à eux, et les nôtres portent des
mots français, des tests et des comportements que le registre ne connaît pas. À
reprendre un jour où l'un d'eux gênera, pas la veille d'une publication.
