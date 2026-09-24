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

## Releasing

A `v*` tag builds both systems into a draft release. Test the draft files, then
publish it: the site rebuilds itself and points its buttons at them.

The updater key pair lives in `~/.tauri/multifus.key` and its `.pub`, and the
public half is `plugins.updater.pubkey` in `tauri.conf.json`. A new pair would
leave every installed copy unable to trust an update. The key has an empty
password, so `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` stays unset: a missing secret
expands to the empty string the key expects.

The Developer ID Application certificate expires on 17 September 2031. Its
private key, the `.p12` and its password are in `~/.apple-developer-id/`. The
first notarization of the account took Apple about ten hours; the next ones take
minutes.

The Windows installer is not Authenticode signed, so SmartScreen warns on the
first download of each version. Azure Artifact Signing needs a registered
company in France, and SignPath shows "SignPath Foundation" as the publisher:
the question comes back if Windows installs drop. Until then, send every
published `.exe` to https://www.microsoft.com/wdsi/filesubmission as a software
developer.

0.1.0 could not prove the updater. 0.1.1 is its first run: it must install on
both systems, and on Windows without SmartScreen.
