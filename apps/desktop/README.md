# @multifus/desktop

The Multifus application, a Tauri shell with a React front end and a Rust back
end, built for macOS and Windows.

Requirements and bootstrap are in the [root README](../../README.md). The
commands are the scripts of `package.json`, and `pnpm run check` is the one CI
runs.

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
