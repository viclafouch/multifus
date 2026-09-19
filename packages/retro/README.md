# @multifus/retro

The design material shared by the desktop application and the website: the style
sheets, the `cn` helper, the portable React components, and the logo.

```ts
import { Button, cn } from '@multifus/retro'
import logo from '@multifus/retro/assets/logo.png'
```

```css
@import '@multifus/retro/styles/retro.css';
```

`retro.css` declares its own `@source`, so Tailwind scans the components of this
package without the consumer declaring anything.

`assets/logo.svg` is the logo. Everything else is drawn from it: `logo.png` here,
the icons of `apps/desktop/src-tauri/icons`, and the favicons of
`apps/website/public`. Change the logo in the SVG, then draw the rest again, or
the three surfaces drift apart.

`icon.icns` is the one that is not a cut-out logo: `pnpm --filter
@multifus/desktop run draw:icon` lays it on an opaque iron plate, edge to edge,
without a single transparent pixel on the border. macOS 26 shrinks any icon with
transparent edges and slides its own grey plate behind it; a plate that fills the
canvas is masked to the squircle instead, and keeps its colour. Only macOS 26
masks: from 13 to 15 the Dock draws the plate as it comes, square corners and
all, and that is the price of choosing the colour on 26. The Windows `ico` and
the favicons stay cut out, because neither surface draws a plate.

A package importing `retro.css` must list `@fontsource/bebas-neue` in its own
dependencies. Tailwind flattens the `@import` before Vite resolves the `url()`,
so the font files resolve from the consumer, never from here. It is a peer
dependency for that reason.

MIT.
