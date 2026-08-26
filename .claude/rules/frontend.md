---
paths: ['src/**/*.{ts,tsx}']
---

## Frontend design

### React

- Use `React.useState`, `React.useEffect`, etc. Never destructure React imports.
- **NEVER use `useCallback` or `useMemo`** unless you have a proven performance problem. These are premature optimizations that add complexity without benefit in 99% of cases. Only valid uses:
  - Passing callbacks to heavily memoized child components (`React.memo`)
  - Expensive computations that are measurably slow (profile first)
  - Dependencies in `useEffect` that would cause infinite loops without memoization
- **NEVER return null in child components** - conditional rendering must happen in the parent, not inside the child. If a component might not render, the parent decides whether to render it at all. Child components should always render something when called.
- **Use functional updates for state derived from previous state** - `setState(prev => !prev)` instead of `setState(!state)`. This avoids bugs with React's batching.
- **Extract logic into custom hooks** - any useEffect, useState combo, or reusable logic should become a custom hook in `src/hooks/`. Keep components focused on rendering. Hooks go in dedicated files named `use-*.ts`.

### Libraries

- ALWAYS use shadcn components instead of raw HTML elements, `<Input>` instead of `<input>`, `<Textarea>` instead of `<textarea>`, etc.
- **Never modify code** in `src/components/ui` - run `npm run lint:fix` first (auto-fixes formatting), then rely on the override in `oxlint.config.ts` for the remaining errors
- **No margins on icons in buttons** - shadcn Button has built-in `gap` spacing

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
- Define custom utilities in global CSS (`src/index.css`) and reuse them
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
- Buttons already have built-in hover states via shadcn - don't override with custom transforms
- Links use `hover:text-primary` or `hover:text-foreground` - keep it simple
- **Consistency over creativity**: match existing patterns, don't invent new interactions

### Animations

- **Respect `prefers-reduced-motion`**
- **Standard durations**: 0.2s (fast), 0.3s (normal), 0.5s (slow)
- **Standard easings**: `[0.4, 0, 0.2, 1]` (ease-out), `[0.4, 0, 1, 1]` (ease-in)
- When CSS transitions or keyframes are used, add a named class and include it in the `@media (prefers-reduced-motion: reduce)` block of `src/index.css` with `transition: none`
