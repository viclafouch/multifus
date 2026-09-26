---
paths:
  - '**/*.css'
  - '**/*.tsx'
---

## Subpixel snapping

Text resting on screen moves only when the player moves it. On a display at
device pixel ratio 1 (Windows at 100 % scaling), a transform animation leaves
settled text half a pixel sideways or one pixel down from where it lands once
the motion stops, and the jump shows right after the motion or at the next
repaint. A Retina screen hides it: judge motion at ratio 1.

Every box is fractional. A centred column in a container of odd width, a
scrollbar gutter, a line height, a percentage: each puts a box between two
pixels, so a layout that looks whole on paper is fractional on screen.

### When you

- **Add a screen or a view:** it appears whole the moment it mounts. Its
  blocks carry no entrance animation.
- **Build a guided sequence** that reveals its parts in order (an onboarding):
  reveal each part with `opacity`, and keep the delays.
- **Reveal an element that then stays** (a notice, a button that shows up):
  show it at once, or fade it with `opacity`.
- **Animate `transform`, `translate`, `scale` or `rotate` freely** on what
  leaves the screen or never rests: an exit, the decor, a ring, a progress
  bar, things nobody reads while they move.
- **Move or scale an element that then rests** (a head landing, a dialog
  zooming in): check its last frames at ratio 1, as below. When it lands off,
  give it a permanent layer, `will-change: transform`, so it rounds the same
  way before, during and after the motion. One layer per element that jumps,
  never a blanket rule: each layer costs GPU memory.
- **Mount a view whose parts can also arrive later** (heads on a stone): what
  is there at mount appears at once; only what arrives afterwards animates.
- **Lay text on a surface:** keep `backdrop-filter` off it; a translucent
  background is fine. The filter puts the surface on its own layer; when an
  ancestor animates, that layer keeps its old pixel alignment, and the next
  hover repaints its text one pixel away.

### Why, in the engine

- Blink drops the fractional part of a box's position under a non-translation
  transform, or while a transform animation that is not a pure translation
  runs: `CanPropagateSubpixelAccumulation()` says no, and the paint offset is
  rounded with `ToRoundedVector2d`.
  [paint_property_tree_builder.cc](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/core/paint/paint_property_tree_builder.cc)
- The compositor freezes a layer's pixel alignment while it animates: "Keep the
  non-ideal raster translation unchanged for transform animations to avoid
  re-rasterization during animation", for an animating layer or one with
  `will-change: transform`. A pure translation therefore still lands a pixel
  off; a permanent layer never unfreezes, so it never jumps; a fade animates
  no transform and escapes both.
  [picture_layer_impl.cc](https://github.com/chromium/chromium/blob/main/cc/layers/picture_layer_impl.cc)
- Chromium documents none of this outside its source.
  [paint/README.md, "Pixel snapping and bluriness"](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/core/paint/README.md)
- The symptom in the wild:
  [primer/css#574](https://github.com/primer/css/issues/574) (animated text
  shifting by 1 px in Chrome and Safari),
  [w3c/csswg-drafts#9802](https://github.com/w3c/csswg-drafts/issues/9802)
  (a 1 px offset that follows an odd or even container width).

### Checking a change

Check on the real window: headless Chromium hides scrollbars, and with them
the gutter that makes a column fractional. Hand the developer this command,
the app being theirs to start, and wait for the window:

```powershell
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9222"; pnpm dev:app
```

Through the Chrome DevTools Protocol on `127.0.0.1:9222`, slow every animation
with `Animation.setPlaybackRate` at 0.1, trigger the change, capture frames
with `Page.captureScreenshot`, and compare each text and image region with the
settled frame. Frames stuck at ±0.5 or ±1 px that drop to 0 when the motion
ends are the jump; a smooth decay to 0 is the motion itself.
