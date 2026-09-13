# @multifus/website

The Multifus website.

## Install

Node 24 and pnpm. From the repository root, once for the whole monorepo:

```sh
pnpm install
```

## Run

```sh
pnpm --filter @multifus/website run dev
```

Every script below runs the same way, with `dev` replaced by its name. From
`apps/website`, `pnpm run <script>` is enough.

## Scripts

| Script         | What it does                                          |
| -------------- | ----------------------------------------------------- |
| `dev`          | Development server                                    |
| `build`        | Prerenders the site into `dist/client`                |
| `preview`      | Serves `dist/client` as production does               |
| `typecheck`    | `tsc --noEmit`                                        |
| `test`         | Runs the tests once                                   |
| `test:watch`   | Runs the tests in watch mode                          |
| `i18n:extract` | Collects the source strings into the three catalogues |
| `i18n:check`   | Compiles the catalogues and fails on a missing string |
| `verify:html`  | Reads back the HTML in `dist/client` after a `build`  |
| `check`        | All of the above, in order. This is what CI runs      |

## Elsewhere

What is left to do lives in [docs/plan.md](../../docs/plan.md).
