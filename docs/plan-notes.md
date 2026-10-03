# Notes

Players asked for a small notepad they can keep over Dofus Retro. The Notes are
that: one note for every character, above every application, kept across
restarts, and never costing the game a keystroke it was owed. The words are in
`CONTEXT.md`. The two decisions that are hard to reverse are
`docs/adr/0001-the-notes-keep-the-keyboard-through-a-switch.md` and
`docs/adr/0002-tiptap-writes-the-note-kept-as-its-json.md`.

Victor asks for this whole plan in one autonomous session. Every behaviour a
player can see is settled below, and where a platform refuses one, its fallback
is named beside it. Everything else is the session's call. The website is out
of scope: it gets its own session once the Notes ship.

## What the player gets

### Opening and closing

- A new shortcut action, Control+Shift+N by default, acting in the game like
  every other shortcut. A player who already bound that combination keeps it,
  and the Notes start with no shortcut.
- A tray item, « Ouvrir les notes » or « Fermer les notes », that works outside
  the game and needs no connected character.
- The action has its line in the Shortcuts screen. No setting, no place on the
  map, no entry in the onboarding.
- ✕ in the window closes it. The Notes are closed at every launch.

### The window

- It stays where the player left it on the screen, above every application, on
  every Space, and over a client in fullscreen on macOS. It follows no client.
- The player moves it by its top bar and resizes it from every edge and corner.
  The system moves and resizes it, so it is as smooth as any window. Position
  and size survive restarts, and a place saved on a screen that is gone falls
  back to the default one.
- A long note scrolls inside.
- Opaque, with no transparency. Drawn with `/frontend-design`, in the family of
  the overlay sheet the rune table wears.

### The keyboard

- Opening the Notes gives them the keyboard, the caret at the end of the note.
- Moving, resizing, scrolling and the buttons leave the keyboard where it was.
  A click in the note takes it. Fallback, Windows only: if a click on the bar
  cannot leave the keyboard to the client, any click in the Notes may take it.
- Escape, ✕ and the shortcut close the Notes, and the player stays where they
  are: the keyboard goes back to the window in front, no switch. A click on a
  client takes it too, and leaves the Notes open.
- While the Notes hold the keyboard they count as in the game, so the shortcuts
  stay live. Every switch brings its client in front and leaves the keyboard in
  the Notes. The client in front stays known, so « Personnage suivant » starts
  from it.
- Quick texts belong to the game chat. While the Notes hold the keyboard, a
  quick text shortcut does nothing, and the journal says why.

### The note

- One note for every character, with paragraphs, bold and bullet lists.
  Markdown input rules (`- ` starts a list, Mod+B bolds), and the usual text
  keys on both systems: copy, cut, paste, select all, undo, redo. The
  right-click menu stays off, as in every Multifus window.
- Empty, it shows « Notez ici ce que vous ne voulez pas oublier. »
- « Vider » clears it in one click, with no confirmation, and Cmd/Ctrl+Z brings
  it back.
- It is never lost: saved soon after the typing stops, on close, before a
  change of language reloads the webviews, and on quit. It lives in its own file
  beside the configuration, written the way the configuration is, and a file
  that cannot be read is set aside, never overwritten.

### Words

French is the source. The name is « Notes » in French and English, « Notas » in
Spanish. The tray says « Ouvrir les notes » and « Fermer les notes », « Open
notes » and « Close notes », « Abrir las notas » and « Cerrar las notas ».

## Traps already found

- The code calls the patch notes `notes`. Rename them to patch notes first,
  keeping the key already stored in the players' configuration, so the word
  belongs to the Notes.
- A new default shortcut takes its combination from a character or a quick
  text that holds it, since actions claim first. Nothing handles that collision
  on an upgrade yet.
- On Windows the foreground hook skips Multifus's own windows, so the Notes
  taking the keyboard wakes nothing.
- On Windows, Tauri's `setFocus` falls back to a synthetic Alt press when the
  system refuses the foreground. That is a simulated action: give the keyboard
  through Multifus's own platform calls.
- On Windows a non-focusable window gets no keyboard in WebView2, so the Notes
  stay focusable there.
- On macOS, `startResizeDragging` is not supported, and a borderless resizable
  window resizes from its native edges.
- Tauri's "visible on all workspaces" only joins every Space. Showing over a
  client in fullscreen is ours to add.
- Above window level 20, macOS cannot show its input method window, and the
  accent popup needs it.
- Destroying an NSPanel overlay aborted in tauri-runtime-wry on the companion
  branch. Keep the Notes window for the whole session, and hide it.
- Overlay sheets turn text selection off. The note needs it on.
- macOS keeps Tauri's default Edit menu, which carries Cmd+C, V, A and Z.
  Whether its key equivalents reach a panel while Multifus is not the active
  application is unverified.
- Tiptap 3 emits an update on `setContent` and `clearContent` by default.
  Loading the note must not save it back.
- Tauri 2.12 pulls tao 0.37, whose `show()` activates a non-focusable window on
  Windows and can minimise a client in fullscreen. Stay on the Tauri the
  lockfile holds until [tao #1358](https://github.com/tauri-apps/tao/pull/1358)
  ships.
- The tests that list every shortcut action, snapshot field, tray item and IPC
  call fail when one is added. They are the checklist.

## Sources in the repository

- `app/overlay.rs` builds every overlay. `app/rune_table.rs`, with its sheet in
  `src/screens/rune-table-window/`, is the closest model.
- The branch `feat/companion-site`, one commit on `main`, and its
  `docs/plan-companion.md`. It holds an overlay that takes the keyboard on a
  click: on macOS a key panel shown without taking the key window, on Windows an
  activable window shown without activation. It also moves the sheet styles and
  the crown button into shared pieces. Lift those, not the companion site, and
  read it with `git show`, since it is not merged. It leaves open the keyboard
  on a click in the text only, Escape, and the shortcuts and AutoFocus while it
  holds the keyboard.
- Shortcuts: `app/shortcuts.rs`, `app/view.rs`, `config/settings.rs`, and the
  "in the game" predicate in `platform/window.rs`.
- Switches: every switch reaches the window manager's `focus` or `focus_fast`,
  written per system in `platform/macos.rs` and `platform/windows.rs`. On
  Windows, `lay_above` already raises a window without activating it.
- AutoFocus: `on_notification` in `app/runtime.rs`, which `app/state.rs`
  decides.
- Tray: `app/tray.rs`, with its own string table.
- Storage: `config/store.rs`.
- Quit and change of language: `app/runtime.rs`.
- Front: `src/lib/multifus.ts`, whose test reads the Rust command list,
  `src/boot.tsx`, `vite.config.ts`, `src-tauri/capabilities/`.
- Journal and stats: `app/journal.rs`, `app/stats/`. The rune table opens are
  counted. Count the Notes opens the same way, in the same report.

## Skills

- `/frontend-design` before drawing the window.
- `lingui:lingui-best-practices` and `lingui:enhanced-message-context` for every
  new message.
- `react-useeffect` before syncing the editor with Rust.
- `modern-web-guidance:modern-web-guidance` for the styles and the scrolling of
  the editor.
- `changelog` for the patch notes line.
- `mattpocock-skills:writing-for-agents` before touching any `.md` but the
  changelogs.
- `simplify` on the finished diff.

## Packages

Tiptap 3, as a minimal set and without StarterKit: `@tiptap/react`,
`@tiptap/core`, `@tiptap/pm`, `@tiptap/extension-document`,
`@tiptap/extension-paragraph`, `@tiptap/extension-text`,
`@tiptap/extension-bold`, `@tiptap/extension-list`, `@tiptap/extensions`. No
Rust crate: Multifus builds its own panel, and `tauri-nspanel` is a reference
only. A `core:window` permission goes to the Notes window alone.

## Read first

Fetch these at the start, since versions move.

Tauri:

- [Window JS API](https://v2.tauri.app/reference/javascript/api/namespacewindow/#startresizedragging):
  `startDragging`, `startResizeDragging`, `ResizeDirection`.
- [Window customization](https://v2.tauri.app/learn/window-customization/):
  drag regions.
- [Core permissions](https://v2.tauri.app/reference/acl/core-permissions/) and
  [capabilities](https://v2.tauri.app/security/capabilities/): which
  `core:window` permissions sit outside the default set, and how to scope one to
  a window.
- [WebviewWindowBuilder](https://docs.rs/tauri/2/tauri/webview/struct.WebviewWindowBuilder.html):
  focusable, focused, always on top, all workspaces, shadow, minimum size.
- [Default macOS menu](https://docs.rs/tauri/2/tauri/struct.Builder.html#method.enable_macos_default_menu)
  and [Tauri #2397](https://github.com/tauri-apps/tauri/issues/2397): the Edit
  menu carries the text keys.
- [Resizing an undecorated window on Windows](https://github.com/tauri-apps/tauri/blob/30da1fd6e17de6107ecc850c95dfb16b5729f2dd/crates/tauri-runtime-wry/src/undecorated_resizing.rs#L107-L117):
  native edges with no JavaScript.
- Open issues: [non-focusable WebView2 gets no keyboard](https://github.com/tauri-apps/tauri/issues/14386),
  [a click activates a non-focusable window on macOS](https://github.com/tauri-apps/tauri/issues/14102),
  [dragging moves the focus on Windows](https://github.com/tauri-apps/tauri/issues/10767).

tao, read at commit `37b7e8b`, to compare with the version the lockfile holds:

- macOS: [key and main window](https://github.com/tauri-apps/tao/blob/37b7e8bc90a050e93be988df636f322c3ef147b6/src/platform_impl/macos/window.rs#L410-L431),
  [first show](https://github.com/tauri-apps/tao/blob/37b7e8bc90a050e93be988df636f322c3ef147b6/src/platform_impl/macos/window.rs#L627-L635),
  [resize dragging refused](https://github.com/tauri-apps/tao/blob/37b7e8bc90a050e93be988df636f322c3ef147b6/src/platform_impl/macos/window.rs#L961-L963),
  [borderless and resizable](https://github.com/tauri-apps/tao/blob/37b7e8bc90a050e93be988df636f322c3ef147b6/src/platform_impl/macos/window.rs#L217-L222),
  [all workspaces](https://github.com/tauri-apps/tao/blob/37b7e8bc90a050e93be988df636f322c3ef147b6/src/platform_impl/macos/window.rs#L1537-L1547).
- Windows: [focusable and WS_EX_NOACTIVATE](https://github.com/tauri-apps/tao/blob/37b7e8bc90a050e93be988df636f322c3ef147b6/src/platform_impl/windows/window_state.rs#L293-L295),
  [show without activation](https://github.com/tauri-apps/tao/blob/37b7e8bc90a050e93be988df636f322c3ef147b6/src/platform_impl/windows/window_state.rs#L455-L466),
  [dragging](https://github.com/tauri-apps/tao/blob/37b7e8bc90a050e93be988df636f322c3ef147b6/src/platform_impl/windows/window.rs#L493-L527),
  [the synthetic Alt behind `set_focus`](https://github.com/tauri-apps/tao/blob/37b7e8bc90a050e93be988df636f322c3ef147b6/src/platform_impl/windows/window.rs#L1514-L1541),
  [hit testing an undecorated window](https://github.com/tauri-apps/tao/blob/37b7e8bc90a050e93be988df636f322c3ef147b6/src/platform_impl/windows/event_loop.rs#L2128-L2181).

macOS:

- [NSPanel](https://developer.apple.com/documentation/appkit/nspanel),
  [nonactivatingPanel](https://developer.apple.com/documentation/appkit/nswindow/stylemask-swift.struct/nonactivatingpanel),
  [canBecomeKey](https://developer.apple.com/documentation/appkit/nswindow/canbecomekey),
  [becomesKeyOnlyIfNeeded](https://developer.apple.com/documentation/appkit/nspanel/becomeskeyonlyifneeded),
  [needsPanelToBecomeKey](https://developer.apple.com/documentation/appkit/nsview/needspaneltobecomekey),
  [makeKey()](https://developer.apple.com/documentation/appkit/nswindow/makekey()),
  [orderFrontRegardless()](https://developer.apple.com/documentation/appkit/nswindow/orderfrontregardless()).
- [CollectionBehavior](https://developer.apple.com/documentation/appkit/nswindow/collectionbehavior-swift.struct),
  with [fullScreenAuxiliary](https://developer.apple.com/documentation/appkit/nswindow/collectionbehavior-swift.struct/fullscreenauxiliary),
  and [Level](https://developer.apple.com/documentation/appkit/nswindow/level-swift.struct).
- [activate(options:)](https://developer.apple.com/documentation/appkit/nsrunningapplication/activate(options:)),
  [activate(from:options:)](https://developer.apple.com/documentation/appkit/nsrunningapplication/activate(from:options:)),
  [yieldActivation(to:)](https://developer.apple.com/documentation/appkit/nsapplication/yieldactivation(to:)),
  [didActivateApplicationNotification](https://developer.apple.com/documentation/appkit/nsworkspace/didactivateapplicationnotification).
- objc2-app-kit: [NSPanel](https://docs.rs/objc2-app-kit/latest/objc2_app_kit/struct.NSPanel.html),
  [NSWindow](https://docs.rs/objc2-app-kit/latest/objc2_app_kit/struct.NSWindow.html),
  [NSRunningApplication](https://docs.rs/objc2-app-kit/latest/objc2_app_kit/struct.NSRunningApplication.html).
- [tauri-nspanel](https://github.com/ahkohd/tauri-nspanel): a key panel without
  activation, as a reference. Its issues on
  [the input method window](https://github.com/ahkohd/tauri-nspanel/issues/104)
  and [activation on recent macOS](https://github.com/ahkohd/tauri-nspanel/issues/123).

Windows:

- [SetWindowPos](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwindowpos),
  [extended window styles](https://learn.microsoft.com/en-us/windows/win32/winmsg/extended-window-styles),
  [WM_MOUSEACTIVATE](https://learn.microsoft.com/en-us/windows/win32/inputdev/wm-mouseactivate),
  [SetForegroundWindow](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setforegroundwindow),
  [AttachThreadInput](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-attachthreadinput),
  [WM_NCHITTEST](https://learn.microsoft.com/en-us/windows/win32/inputdev/wm-nchittest),
  [ShowWindow](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-showwindow).
- [windows-rs SetWindowPos](https://microsoft.github.io/windows-docs-rs/doc/windows/Win32/UI/WindowsAndMessaging/fn.SetWindowPos.html).

Tiptap:

- [React install](https://tiptap.dev/docs/editor/getting-started/install/react),
  [performance](https://tiptap.dev/docs/guides/performance),
  [editor API](https://tiptap.dev/docs/editor/api/editor),
  [events](https://tiptap.dev/docs/editor/api/events),
  [upgrade from v2](https://tiptap.dev/docs/guides/upgrade-tiptap-v2).
- Extensions: [Document](https://tiptap.dev/docs/editor/extensions/nodes/document),
  [Paragraph](https://tiptap.dev/docs/editor/extensions/nodes/paragraph),
  [Text](https://tiptap.dev/docs/editor/extensions/nodes/text),
  [Bold](https://tiptap.dev/docs/editor/extensions/marks/bold),
  [BulletList](https://tiptap.dev/docs/editor/extensions/nodes/bullet-list),
  [ListItem](https://tiptap.dev/docs/editor/extensions/nodes/list-item),
  [UndoRedo](https://tiptap.dev/docs/editor/extensions/functionality/undo-redo),
  [Placeholder](https://tiptap.dev/docs/editor/extensions/functionality/placeholder).
- [Keyboard shortcuts](https://tiptap.dev/docs/editor/core-concepts/keyboard-shortcuts),
  [input rules](https://tiptap.dev/docs/editor/api/input-rules),
  [clearContent](https://tiptap.dev/docs/editor/api/commands/content/clear-content),
  [setContent](https://tiptap.dev/docs/editor/api/commands/content/set-content),
  [focus](https://tiptap.dev/docs/editor/api/commands/selection/focus).
- WebKit: [autocorrect](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocorrect),
  [spellcheck](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/spellcheck),
  [ProseMirror #934](https://github.com/ProseMirror/prosemirror/issues/934),
  the Safari composition still open.

## Finished when

- `pnpm run check` passes at the root.
- Tests prove what can regress in silence: the shortcut collision on an
  upgrade, the note file round trip and the set-aside of a broken one, in the
  game while the Notes hold the keyboard, a switch that leaves the keyboard in
  the Notes, and the quick text refused.
- The patch notes line is in the three changelogs.
- What only Victor can run is handed over, in this order:
  1. `pnpm --filter @multifus/desktop dev:app` on the Mac, through the
     scenarios below.
  2. A Windows build, through the same scenarios.
  3. An evening of real play on the Mac, watching for a letter lost during a
     switch.

The scenarios:

1. The shortcut from Dofus shows the Notes, ready to write in.
2. The tray, outside the game, shows the Notes over the browser.
3. A click in the note, then accents (é, ê, ñ), Mod+B, and `- ` for a list.
4. Copy, cut, paste, select all, undo, redo.
5. Drag by the bar, resize from each edge and corner: smooth, and the keyboard
   stays where it was.
6. A long note scrolls by wheel and by trackpad while a client holds the
   keyboard.
7. While typing: an AutoFocus notification, « Personnage suivant », the wheel.
   The client comes in front and the typing goes on in the note.
8. A quick text shortcut while typing does nothing.
9. Escape closes the Notes over any window, Chrome in fullscreen included, and
   nothing moves.
10. « Vider », then Cmd/Ctrl+Z.
11. Quit and relaunch: the note comes back, and the Notes open where they were.
12. A change of language with the Notes open loses nothing.
13. On macOS, the Notes show over a client in fullscreen.
14. With the screen holding the Notes unplugged, they reopen on a screen that
    exists.
