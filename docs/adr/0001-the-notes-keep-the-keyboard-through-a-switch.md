# The Notes keep the keyboard through a switch

The Notes are the only overlay that takes the keyboard: when they open, so the
player writes at once, and on a click in the note. While they hold it they count as in the game, so the shortcuts
stay live, and every switch brings its client in front without
handing it the keyboard: the player keeps typing. On Windows the client rises
in the stack with no activation, the call the rune table already makes. On
macOS a client in front means its application is active, so Multifus activates
it and hands the keyboard straight back to the Notes, which leaves a gap of a
few milliseconds where a keystroke can land in the game.

## Considered options

- A switch that hands the keyboard to the client: the end of the sentence lands
  in Dofus, where a letter can open the inventory.
- No switch while the Notes hold the keyboard: the player misses the turn
  AutoFocus was there to announce.
- Shortcuts off while the Notes hold the keyboard, as they are outside the
  game: the shortcut that opens the Notes could no longer close them.
