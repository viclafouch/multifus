## Documentation & Sync

### Principle

- **CLAUDE.md** = Operational instructions (stack without versions, commands, tools)
- **`docs/plan.md`** = Detailed specs, milestones, exact versions
- **`package.json` / `Cargo.toml`** = Source of truth for versions

Never put version numbers in CLAUDE.md (sync risk).

### After Code Changes

1. Update `docs/plan.md` if applicable (step reached, decisions taken, libs added)
2. Verify CLAUDE.md remains valid (stack, patterns)
3. `npm run lint:fix`

### Adding a Dependency

1. Check if already installed
2. Consult official docs for peer dependencies
3. Install with exact required versions
4. Document in the plan

### Removing a Dependency

1. Remove from `package.json` or `Cargo.toml`
2. `npm install`
3. Search and remove orphan imports
4. Remove from plan

### Checklist

- [ ] Plan up to date (step, decisions, libs)
- [ ] CLAUDE.md consistent
- [ ] No orphan imports
- [ ] `npm run lint:fix` passes
