## Code Style

Expert code simplification and review specialist. Enhances code clarity, consistency, and maintainability while preserving exact functionality. Prioritizes readable, explicit code over compact solutions.

## Scope

Analyze recently modified code and apply refinements. Focus on code touched in the current session unless instructed otherwise.

## Core Principles

### 1. Preserve Functionality and Type Contracts

Never change what the code does - only how it does it. All original features, outputs, and behaviors must remain intact.

**Never remove explicit types that serve as contracts**: return types that constrain a function's output to a specific shape or union, types validated against library/external types, or `as const satisfies Type` patterns. If an explicit type would catch a bug at compile time that inference alone would miss, it must stay.

### 2. Clarity Over Brevity

- **Avoid nested ternaries** - prefer switch/if-else for multiple conditions
- Choose explicit code over compact one-liners
- Dense code is not better code

### 3. Maintain Balance

Avoid over-simplification that could:

- Reduce maintainability
- Create "clever" solutions hard to understand
- Combine too many concerns
- Remove helpful abstractions
- Prioritize "fewer lines" over readability

## Review Checklist

### Naming Conventions

- Variables: descriptive, meaningful names
- Module-scope constants: `SCREAMING_SNAKE_CASE`, tables and thresholds alike.
  Functions and components keep their own case, whatever they hold
- Booleans: `is*`, `has*`, `should*`, `can*`
- Boolean functions: `matchIs*`, `matchAs*`
- Event handlers: `handle*`, `on*`
- No single-letter variables
- No abbreviations unless universal (`id`, `url`, `api`)

### Self-Documented Code

- Code readable without comments
- Complex logic extracted into well-named functions
- Magic numbers replaced with named constants
- No comments - code should speak for itself

### Comments

None, in any language of the repository. The one exception, one line long, is in
[comments.md](./comments.md).

### Unicode

- Write UTF-8 directly, never `\uXXXX` for printable characters: `"Début"` not `'D\u00e9but'`
- Invisible characters (`\u00a0`, `\u200b`): use named constants

### JSX

- No empty lines between sibling JSX elements (blank lines are forbidden inside JSX blocks)

### Conditionals

- **Always use ternary** instead of `&&` for conditional expressions

### No Unnecessary Abstractions

**FORBIDDEN:**

- Wrapper functions that just call another function
- Re-exporting without transformation
- Abstractions "for future use"

**Justified when:**

- Adding error handling, logging, or transformation
- Combining multiple calls
- Providing simpler API for complex operations

### Function Parameters

- **Max 2 positional parameters** - use object destructuring beyond that
- Define a dedicated type for the params object (named `*Params`)
- Required properties first, optional last in type definition
- Destructure directly in function signature, not in body

### Arrow Functions

- **Always use block body with explicit `return`**, never use implicit returns
- **Never remove curly braces** from arrow functions
- This applies to all arrow functions: callbacks, handlers, `.map()`, `.filter()`, etc.

### Oxlint Disables

- **NEVER disable a rule at the file level** (`/* oxlint-disable rule-name */`), only per-line (`// oxlint-disable-next-line rule-name`)
- **Exception : `no-console`**, seule règle autorisée en disable global fichier (`/* oxlint-disable no-console */`)
- Always include a description explaining why: `// oxlint-disable-next-line rule-name -- reason`
- Before disabling, ask: can the rule be satisfied by fixing the code? If yes, fix it
- A disable is only justified when the rule conflicts with a library API, a specific pattern that cannot be avoided, or a known oxlint false positive
- If the same rule is disabled on many lines in a file, that is a code smell, reconsider the approach

### Code Structure

- Functions do one thing well
- Under 30 lines when possible
- Max 3 levels of nesting
- Early returns over nested conditions
- Group related code together

### No Mutations

Never mutate objects or arrays. Always return new instances.
Use `toSorted()`, `toReversed()`, spread operators, etc.

### Modern Web APIs

Always use native modern APIs (Intl, URLSearchParams, structuredClone, etc.) instead of manual implementations or libraries.

### Single Source of Truth

**NEVER duplicate constants, helpers, or types across files.**

**Global constants and helpers** (used across multiple screens):

- `src/helpers/` of the application you are in - One file per domain (`accelerator.ts`, `portrait.ts` in the software, `page.ts`, `schema.ts` on the site). **Pure functions only**, computing from what they are given
- `src/lib/` of the same application - What talks to something outside the code: the platform, the browser, a library's setup. `lib/i18n.ts`, `lib/motion.ts`, `lib/keepsake.ts`. A function that reads `window` or calls out belongs here, never in `helpers/`
- `src/constants/` of the same application - One file per domain too (`keyboard.ts`, `journal.ts` in the software, `pages.ts`, `rivals.ts` on the site)
- What the two applications would both hold goes to `packages/retro`, and `packages/retro/README.md` says what it refuses

**Component-specific constants** (used only by one component/screen):

- Co-locate at the top of the component file, above the component
- Extract to a `constants.ts` next to it once there is more than a handful

Before creating a constant or helper, search if it already exists.

### Extract & Reuse (CRITICAL)

Before writing ANY function, component, type, or constant inside a feature file, ask: **"Could this be reused elsewhere?"** If yes (or even maybe), extract it immediately, not later.

**What to extract:**

- **Pure functions** (formatting, validation, string manipulation) → shared helpers
- **Generic UI components** (dialogs, confirm modals, badges, cards) → shared components. Never define a reusable UI pattern inline in a page/feature file.
- **Custom hooks** (state logic, effects, mutations) → dedicated hook files
- **Types shared across files** → co-locate with the source or in shared type files

**When writing new code:**

- Scan existing helpers, components, and hooks FIRST, the function you need may already exist
- If you define something locally and realize it's generic, extract it in the same task, don't leave it for later
- If a sub-component is defined locally in a file, ask whether another file could benefit from it

**Red flags (things that should NOT live in feature/page files):**

- Pure functions with no dependency on local state or props
- UI components that receive generic props (title, description, onConfirm, etc.)
- Logic that appears in 2+ files in slightly different forms

### Interface text

The phrase lives where it is read, in French, and Lingui carries it elsewhere.

- **`msg` at module scope, never `t` at module scope.** A module is evaluated
  before any language is activated, so a `t` there freezes the French. This one
  holds in both applications
- **Only `@lingui/core/macro`, in both applications.** `@lingui/react/macro` is
  not transformed here: a `<Trans>` leaves the build without its import, and on
  the site it prerenders the page with an empty body without a word of warning
- **The software renders with `t` in a function body**, because it activates one
  global instance and has one window and one language at a time
- **The site renders through `i18n._()`**, the `i18n` coming from `useLingui()`.
  It holds three instances, none of them global, and prerenders fourteen pages in
  three languages in parallel, so a `t` has no instance to read. The explicit
  form with the instance says the same thing and the macro transforms it, but
  Lingui v6 deprecates `t` and oxlint refuses the line
- **A phrase written in a language other than the page's takes that language's
  own voice**, `SPEAKERS[language]._()`, never `useLingui()`. One component does
  this on purpose, the line offering the other language, and it is the whole
  reason the three instances are kept apart
- **A count goes through `plural`**, and `Intl` takes `i18n.locale`
- The same French twice in one file is one `const`. The same French meaning two
  things takes a `context`
- A language names itself and is never translated: `Français`, `English`
- **A word the reader will find written on their own screen goes in guillemets**
  when it sits inside a sentence, through `quoted`: a System Settings panel, a
  menu of the game, a checkbox. The guillemets say Multifus is quoting, not
  inventing. A list where every word is the system's own needs none: the shape
  already says it. `systemWords` holds those words, once, for every screen that
  names them. This is the software's business alone: the site never names a
  system panel, and `apps/website/CONTEXT.md` says why
- **No metaphor stands in for the word the system uses.** The screen and the
  system have to be searchable with the same word
- `pnpm --filter @multifus/desktop run i18n:extract`, or
  `pnpm --filter @multifus/website run i18n:extract`, after touching a phrase.
  The two catalogues never meet: the software's phrases are instructions to
  someone who has installed, the site's are a promise to someone who has nothing

Tests read the French the user reads, written out in full, never the `msg` table
the code under test reads. Walking a table to check every member reaches the
screen is another thing, and it is welcome. No test writes an English word: the
build refuses a catalogue with a hole.

**Rules:**

- Pure functions, no side effects
- One file per domain
