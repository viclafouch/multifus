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

A package importing `retro.css` must list `@fontsource/bebas-neue` in its own
dependencies. Tailwind flattens the `@import` before Vite resolves the `url()`,
so the font files resolve from the consumer, never from here. It is a peer
dependency for that reason.

MIT.
