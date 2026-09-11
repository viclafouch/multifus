## Documentation & Sync

### Where a fact lives

- **CLAUDE.md** = operational instructions: stack without versions, commands, tools. The root holds what both applications share, `apps/desktop/CLAUDE.md` and `apps/website/CLAUDE.md` what concerns one of them alone
- **`CONTEXT.md`** = the words of the domain
- **`docs/plan.md`** = what remains to do, one line per thing. A line done is deleted, not ticked
- **`docs/design-system.md`** = the rules that decide what a screen looks like. It copies no value: the CSS holds them
- **`docs/plan-<subject>.md`** = the subject being worked right now. Deleted once shipped, handing back to `docs/plan.md` whatever it did not finish
- **`apps/website/CONTEXT.md`** = the words the site alone uses, and the traps its i18n has already paid for
- **`packages/*/README.md`** = what a shared package holds, and what it refuses to hold
- **`apps/desktop/package.json` / `apps/desktop/src-tauri/Cargo.toml`** = source of truth for versions

The root `package.json` carries no version: only the software is numbered, and
`commit-and-tag-version` numbers it from `apps/desktop`.

Never put a version number in a document (sync risk). Never copy into a document
a value the code already holds: point at the file instead.

### After Code Changes

1. Delete from `docs/plan.md` every line the change has done, and add the ones it revealed
2. Verify CLAUDE.md remains valid (stack, patterns, pointers)
3. `pnpm run lint:fix` from the root

### Adding a Dependency

1. Check if already installed, in the root and in every package
2. Consult official docs for peer dependencies
3. Install with exact required versions, in the package that imports it:
   `pnpm --filter @multifus/desktop add <name>`,
   `pnpm --filter @multifus/website add <name>`, or the shared package that
   imports it, `--filter @multifus/retro` or `--filter @multifus/runes`. The root
   takes only what the whole repository needs, the linters and the formatter
4. A types-only package goes to `devDependencies`, whichever package takes it
5. **A dependency without a consumer today does not get installed.** An idea
   worth keeping goes on a line of the plan that owns the subject, naming what
   would trigger it: `docs/plan-<subject>.md` while one is open, `docs/plan.md`
   otherwise

### Removing a Dependency

1. Remove from the right `package.json`, or from `Cargo.toml`
2. `pnpm install`
3. Search and remove orphan imports

### Checklist

- [ ] `docs/plan.md` up to date, lines done deleted
- [ ] CLAUDE.md consistent, every pointer resolving
- [ ] No orphan imports
- [ ] `pnpm run lint:fix` passes
