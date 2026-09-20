# Multifus

A multi-account window manager for Dofus Retro, on macOS and Windows. A
notification arrives in the game, Multifus brings the window of that character to
the front. You start it, you forget it.

Nothing is released yet and nobody has it installed, so a breaking change is
cheap and the clean fix beats the compatible one.

In this file, **you** is the agent reading it, **I** is Victor, the only
developer.

## The repository

A pnpm workspace driven by Turborepo: `apps/desktop` the software, `apps/website`
the site, `packages/` what they both carry. Each has its own `CLAUDE.md` or
README.

[docs/plan.md](./docs/plan.md) is what is left to do, and the only list. In a
plan, a done box is removed, and no box is added: what is missing is offered, to
be done now.

The `/frontend-design` skill before drawing a screen, and the
`/mattpocock-skills:writing-for-agents` skill before touching a `.md` of the
repository, except the ones a reader reads on screen, `CHANGELOG.md`.

## What makes Multifus special

You have played Dofus Retro for twenty years, and Multifus serves nothing else.
Use the words of the game, and go and look up the ones you are unsure of: your
memories of Retro are thinner than you think, and this is not today's Dofus.

1. **Ankama's tolerance is the frame.** No file of the game is read, extracted or
   embedded, no memory is touched, no action is simulated, and an action only
   ever aims at the window in the foreground, never at several at once. Anything
   that looks like a macro is out. These two rules hold the project, and a task
   that fights one of them is a conversation to have.
2. **The player is at the keyboard, in the game.** Multifus works behind the
   window they are looking at. A change that steals the foreground, eats a
   keystroke the game was owed, or makes a switch slower is a regression, whatever
   it adds.
3. **Three languages by construction.** French is the source and Lingui carries
   the rest. Text is not shared between the software and the site: each keeps its
   own catalogue. One language working is half a feature.
4. **Two webviews, then every browser.** The software only runs in WebKit on Mac
   and Chromium on Windows, so its fallbacks aim at those two alone. The site is
   open to every browser, and its fallbacks are written instead of hoped for.

## Cost discipline

The Vercel account is on the Pro plan, and Web Analytics with its custom events
rides on that one bill. Every other service sits on a free tier and stays there:
the Search Console, GitHub. A feature that adds a second bill does not exist.
Before anything that runs on a schedule or calls an API on a hot path, say out
loud how many calls a month it costs at current traffic.

## A note from Victor

I like simple systems and code that looks obvious. Find the real constraint, then
build the smallest thing that makes the correct behaviour unsurprising.
Complexity that is already there has to earn its place again, and machinery that
looks serious is still machinery.

Fight scope creep, including your own. Asked for the rune table, I want the rune
table. Tell me about the four adjacent improvements, let me pick.

I read code better than paragraphs. Short answers. A reply that needs a table of
contents is too long.

Everything below is a good default. What I ask for in the conversation wins over
it.

## The ways to hurt yourself

1. **The dev server is mine.** It is already running on my side. Same for
   anything interactive: a build that signs, a command that waits for input. Hand
   me the exact command and wait for me to come back.
2. **The other machine is mine.** Windows is tested there, and so is every
   evening of real play. What only I can run is listed at the end, in order,
   never guessed at.
3. **The software is two processes.** A Rust decision and the screen that shows
   it drift apart in silence. A change on one side says what the other side now
   shows.
4. **A window belongs to the game, not to us.** Titles, icons and positions are
   borrowed, and they are given back when Multifus quits. Code that takes
   something has to hand it back on every path out.

## Hit every surface

The most common defect here is a change that works on the path you tested and is
missing everywhere else. Before calling a change done, walk this list and say
which entries applied.

- **The three locales.** French first, then English and Spanish, in the catalogue
  of the application you touched.
- **Both systems.** macOS and Windows, and the setting that exists on one of them
  only.
- **Both applications.** A word, a colour or a component that moves is often
  carried by both, through `packages/`.
- **Both directions.** A way in comes with the way out and the way to see it. A
  dialog that opens meets one that is already open. A one way door is a bug.
- **Phone and desktop**, for the site, layout and touch targets alike.
- **Discoverability.** A new public route means sitemap, metadata and structured
  data, or it is invisible.

## Research before writing

Read the documentation of a library rather than recall it. Versions move fast
here and the remembered answer is often one major behind. My assertions get the
same treatment: check the premise, and tell me when it is wrong instead of
building on it.

Several unknowns left means asking before writing code. One round of questions is
cheaper than a plan built on a guess. An unknown with an obvious default is yours
to take, out loud.

## Verifying

Prove the change with the smallest thing that proves it: type check and lint the
scope you touched, run the tests covering the behaviour you changed, write a
targeted script when the logic is data shaped. Behaviour that can regress in
silence earns a test rather than a paragraph.

The running application is invisible to you. When the last proof is visual, on
Windows, or in the game, say what to look at and on which surface, and let me
confirm.

A task is finished when nothing is left that only I can run. Anything left is
listed, in order.

## Reporting back

French, plain technical language, short sentences. The first line says the
outcome.

- What changed and why, then stop.
- What is dangerous. After a dependency bump or a refactor I want the risk and
  what to test, not the list of bugs upstream fixed.
- A confidence level when you are guessing, and what would raise it.
- A step skipped or a thing gone wrong belongs in the first sentence.
- A session ending mid feature hands over: what is done, what is not, what to
  read first, which commands are still pending.

## Scope

The specification is what I asked for in the conversation. Prose about the code
goes stale the day the code moves, and I will move the code without moving the
prose. What outlives a feature belongs in one of three places instead: a rule in
`.claude/rules/`, a line in `docs/plan.md`, or the README of the package it
describes.

## Git

Commit and push on my word only. `main` is the branch, it deploys the site, and
nobody guards it: the last look at the diff happens before the push, not after.
One concern per commit, conventional title, English for messages and branches.

## Taste

Write code a person would write. The tell of the other kind is defensive noise: a
triple guard where the type already answers, a ternary chain nobody can read out
loud, an abstraction wrapping a single call. When you catch yourself producing
it, name the real constraint and write the small version instead.
