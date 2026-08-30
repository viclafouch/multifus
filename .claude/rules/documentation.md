## Documentation & Sync

### Principle

- **CLAUDE.md** = Operational instructions (stack without versions, commands, tools)
- **`docs/plan.md`** = Detailed specs, milestones, exact versions
- **`apps/desktop/package.json` / `apps/desktop/src-tauri/Cargo.toml`** = Source of truth for versions

The root `package.json` carries no version: only the software is numbered, and
`commit-and-tag-version` numbers it from `apps/desktop`.

Never put version numbers in CLAUDE.md (sync risk).

### After Code Changes

1. Update `docs/plan.md` if applicable (step reached, decisions taken, libs added)
2. Verify CLAUDE.md remains valid (stack, patterns)
3. `pnpm run lint:fix` from the root

### Adding a Dependency

1. Check if already installed, in the root and in every package
2. Consult official docs for peer dependencies
3. Install with exact required versions, in the package that imports it:
   `pnpm --filter @multifus/desktop add <name>`. The root takes only what the
   whole repository needs, the linters and the formatter
4. Document in the plan

### Removing a Dependency

1. Remove from the right `package.json`, or from `Cargo.toml`
2. `pnpm install`
3. Search and remove orphan imports
4. Remove from plan

### Checklist

- [ ] Plan up to date (step, decisions, libs)
- [ ] CLAUDE.md consistent
- [ ] No orphan imports
- [ ] `pnpm run lint:fix` passes
