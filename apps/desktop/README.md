# @multifus/desktop

The Multifus application, a Tauri shell with a React front end and a Rust back
end, built for macOS and Windows.

Requirements and bootstrap are in the [root README](../../README.md). The
commands are the scripts of `package.json`, and `pnpm run check` is the one CI
runs.

## Measuring

The Aptabase key is written in `src-tauri/src/app/stats/mod.rs`. It can only
send events, and any binary shows it to `strings`, so it is no secret.

Every build measures, `pnpm run dev:app` included: a debug build lands in the
Debug bucket of the dashboard, apart from the players. Untick the Settings box to
keep a machine out.

The client in `stats/` is written by hand. The published `tauri-plugin-aptabase`
would bring a second `reqwest` and a second TLS stack.

`named_kind`, `named_class` and the other name tables repeat what serde already
declares, on purpose: a `rename_all` that moves would otherwise break the history
of the dashboard.

A session ends after 24 hours of wall-clock time, because Aptabase drops every
event of a session older than seven days, and a Mac put to sleep keeps Multifus
open for weeks.

About two events leave per session. The free tier of 20,000 a month holds around
200 active players, and past it Aptabase pauses the measuring until the month
ends, it never bills.

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
