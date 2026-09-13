# Multifus

A multi-account window manager for Dofus Retro, on macOS and Windows.

Downloads, features and documentation: [multifus.app](https://multifus.app).

## Architecture

A pnpm workspace driven by Turborepo.

```
apps/
  desktop/    Tauri application, React and TypeScript front end, Rust back end
  website/    TanStack Start website, prerendered and served by Vercel
packages/
  ankama/     Ankama artwork, excluded from the MIT licence
  retro/      Shared styles and components
  runes/      Rune weights from the game
```

## Requirements

- [Node](https://nodejs.org) 24
- [pnpm](https://pnpm.io/installation) 12, or `corepack enable`
- [Rust](https://www.rust-lang.org/tools/install) stable, for `apps/desktop`
- The [Tauri prerequisites](https://tauri.app/start/prerequisites/) of your system

## Getting started

```sh
pnpm install    # also installs the git hook that replays the CI checks
pnpm dev:app    # runs the desktop application
pnpm dev:site   # runs the website
pnpm check      # formatting, lints and tests, both languages, every workspace
```

## Licence

[MIT](./LICENSE), except `packages/ankama`, which holds artwork owned by Ankama.

Dofus and Dofus Retro are trademarks of Ankama. This project is not affiliated
with them.
