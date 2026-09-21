# @multifus/desktop

The Multifus application, a Tauri shell with a React front end and a Rust back
end, built for macOS and Windows.

Requirements and bootstrap are in the [root README](../../README.md). The
commands are the scripts of `package.json`, and `pnpm run check` is the one CI
runs.

## The measuring key

`APTABASE_KEY` is read at compile time and baked into the binary. The release
workflow hands it over from the repository secrets, so only a CI build measures
anything. A local build compiles without it and sends nothing, whatever the
Settings box says.

To watch the events arrive in the Debug bucket of the dashboard, pass the key to
the dev command:

```
APTABASE_KEY=A-EU-... pnpm run dev:app
```

`build.rs` declares `cargo:rerun-if-env-changed=APTABASE_KEY`, so changing the
key recompiles the crate instead of reusing the one already built in.

## The Accessibility tick, on macOS

Every local build is signed ad-hoc, with a fresh signature each time. macOS ties
the Accessibility tick to that signature, so the tick dies at every build while
the Settings keep showing it as granted. The app is refused, and the screen says
otherwise.

`build:app` therefore clears the tick before it starts, with `tccutil`, so macOS
asks again instead of lying. On Windows and on a runner, the step does nothing.

`dev:app` leaves it alone, and `tccutil` would miss it anyway. macOS grants the
tick to the responsible process, which for a binary started from a shell is the
terminal application, never Multifus. So development runs on the terminal's own
tick, granted once and stable. To see Multifus answer for itself, bundle it and
let LaunchServices open it:

```
pnpm run build:app -- --debug
open src-tauri/target/debug/bundle/macos/Multifus.app
```
