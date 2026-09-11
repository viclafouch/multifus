---
paths:
  - 'apps/desktop/src/**/*.{ts,tsx}'
  - 'apps/website/src/**/*.{ts,tsx}'
  - 'packages/retro/src/**/*.{ts,tsx}'
---

## Frontend design

### React

- Use `React.useState`, `React.useEffect`, etc. Never destructure React imports.
- **NEVER use `useCallback` or `useMemo`** unless you have a proven performance problem. These are premature optimizations that add complexity without benefit in 99% of cases. Only valid uses:
  - Passing callbacks to heavily memoized child components (`React.memo`)
  - Expensive computations that are measurably slow (profile first)
  - Dependencies in `useEffect` that would cause infinite loops without memoization
- **NEVER return null in child components** - conditional rendering must happen in the parent, not inside the child. If a component might not render, the parent decides whether to render it at all. Child components should always render something when called. The one exception is an error boundary, whose whole job is to replace what fell: `QuietBoundary` renders nothing on purpose, a borderless window having no room for a crash screen.
- **Use functional updates for state derived from previous state** - `setState(prev => !prev)` instead of `setState(!state)`. This avoids bugs with React's batching.
- **Never nest a hook call inside another hook call**, `useOffer(useLanguage())`. Give the inner one its own `const` on its own line, then pass it. No exception: it is ugly, and it hides the order in which the two run.
- **Extract logic into custom hooks** - any useEffect, useState combo, or reusable logic should become a custom hook in the `src/hooks/` of the application you are in. Keep components focused on rendering. Hooks go in dedicated files named `use-*.ts`.

### Libraries

- **Reach for `packages/retro` first**, in both applications: `Button`, `Panel`, `Shade`, `Tale`, `Scene`, `cn`. A component the two would both hold belongs there, and `packages/retro/README.md` says what it refuses
- **In the software, use shadcn components instead of raw HTML elements**, `<Input>` instead of `<input>`, `<Textarea>` instead of `<textarea>`, etc.
- **Edit `apps/desktop/src/components/ui` only to give a component the retro matter** - nothing is regenerated from shadcn anymore. Run `pnpm run lint:fix` first (auto-fixes formatting), then rely on the override in `oxlint.config.ts` for the remaining errors
- **The site adds neither shadcn nor Base UI of its own**, and plain HTML carries what `packages/retro` does not. It reaches Base UI only through `Button`, which `packages/retro` builds on it. A page that needs JavaScript to show itself has no place in a prerendered site: `<details>` holds the features menu, and the seven addresses sit in the delivered HTML, robot included
- **No margins on icons in buttons** - `Button` has built-in `gap` spacing

### Accessibility (WCAG 2.1 AA)

- Keyboard navigation support
- Screen reader compatibility
- Focus management
- ARIA attributes usage
- Labels with `htmlFor`/`id` matching
- `aria-invalid`, `aria-describedby` on inputs
- `role="alert"` on error messages
- `aria-busy` on loading buttons
- `aria-hidden` on decorative icons
- **Color contrast**: minimum 4.5:1 for normal text, 3:1 for large text. Secondary text must not go below what the muted token already gives

### UX Patterns

- **Never disable buttons** - always allow clicks, explain constraints in dialog/feedback
- Show "why not" instead of blocking - users understand context better than silent disabled states

### JSX Size Limit

- **Max 200 lines** for components with specific logic (forms, modals, interactive features)
- Split into sub-components when exceeded (e.g., FormField, SuccessState, etc.)
- Static content screens (mentions légales, à propos) are exempt

### Separation of Concerns

- Each file has **one clear responsibility**
- Extract logic into dedicated files organized by domain (`components/`, `hooks/`, `lib/`, `screens/`)
- Keep entry points minimal - they orchestrate, not implement

### Component Architecture

- Reusable component patterns
- Props API design
- State management decisions
- Composition vs inheritance
- Error boundary placement

### Tailwind CSS

- **No arbitrary values in components** (e.g., `font-[Bricolage_Grotesque]`, `text-[14px]`)
- Define custom utilities in `packages/retro/src/styles/retro.css`, which holds the design system for the software and the site alike, and reuse them. `apps/desktop/src/index.css` keeps only what the main window needs, `apps/website/src/styles.css` only what the site needs
- A utility that moves to `retro.css` must keep its `@media (prefers-reduced-motion: reduce)` block with it, and `retro.css` carries its own `@source '../components'`: without that line Tailwind never emits a class that lives only in the package, nothing breaks, nothing warns, and the screen paints unstyled
- Keep styling consistent: one source of truth for design tokens (fonts, colors, spacing)
- If a value is used more than once, it should be a utility class or CSS variable
- **Prefer `gap`/`space-y`/`space-x`** over `mt-*`/`mb-*` for spacing between siblings

### Attribute-Driven Styling

- **Never use dynamic classes for state**: use `aria-*` or `data-*` attributes on the element, then style with Tailwind modifiers (`aria-selected:bg-primary`, `data-active:bg-accent`)
- **Tailwind `data-*` shorthand**: use `data-foo:` instead of `data-[foo]:` for boolean data attributes. Use bracket syntax `data-[foo=value]:` only when matching a specific value
- Avoid `cn("bg-muted", isActive && "bg-primary")`, prefer setting an attribute and letting CSS handle the rest
- **Exceptions**: variant props (size, color), layout changes without a semantic attribute, third-party constraints

### Hover & Interaction Consistency

- **No custom hover effects** that don't exist elsewhere in the application
- **Forbidden hover effects**: `hover:scale-*`, `hover:rotate-*`, `hover:-translate-y-*` (lift effects)
- **Allowed hover effects**: `hover:bg-*`, `hover:text-*`, `hover:border-*` (color transitions only)
- Buttons already have built-in hover states - don't override with custom transforms
- Links use `hover:text-primary` or `hover:text-foreground` in the software, `hover:text-cream` on the site - keep it simple
- **Consistency over creativity**: match existing patterns, don't invent new interactions
- `btn-way` is the one place that moves on hover, and `docs/design-system.md` holds that exception under « Le mouvement ». It carries the clearing menu of the software and the features list of the site's home, which are the same menu. Leave it alone

### Animations

- **Respect `prefers-reduced-motion`**
- **Standard durations**: 0.2s (fast), 0.3s (normal), 0.5s (slow)
- **Standard easings**: `[0.4, 0, 0.2, 1]` (ease-out), `[0.4, 0, 1, 1]` (ease-in)
- When CSS transitions or keyframes are used, add a named class and include it in the `@media (prefers-reduced-motion: reduce)` block of the sheet that declares it, `retro.css` or `index.css`. Cancel the delays too, not only the durations
