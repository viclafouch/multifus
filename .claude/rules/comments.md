## Comment Policy

### Principle

Write no comment. The code is the only thing kept true; a comment drifts from it
and is believed anyway. This holds everywhere: Rust, TypeScript, CSS, YAML,
configuration files. No module header, no doc comment on a type, a field, a
function or a test, no section banner, no note next to a line.

### The one exception

A line that reads as a mistake, and is not, may carry one comment of one line
saying why it stays. A `SAFETY:` note on an `unsafe` block is such a line, and it
names its invariant in one sentence.

Everything else is a naming problem, or a line for `docs/plan-<subject>.md`.

### Never

- Restating what the code does, or what a name already says
- Pointing at an ADR, a document or a plan: they move, the code does not
- Commented-out code: delete it
- A second line where a better name would do
