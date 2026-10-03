# Tiptap writes the note, kept as its JSON

The note is written with Tiptap 3, limited to paragraphs, bold and bullet
lists, and kept on disk as the editor's JSON document. A `<textarea>` weighs
nothing, but players asked for bold and lists, and it shows neither. In the
audit of October 2026, Tiptap beat Lexical, whose API still moves before its
1.0, ProseKit, a 0.x with one maintainer, and bare ProseMirror, which leaves
more code to us. Tiptap ships the markdown input rules (`- `, `Mod-B`), handles
the dead keys of WebKit, and a company maintains it. JSON over Markdown or HTML
because it round-trips with nothing lost and every ProseMirror tool reads it,
where `@tiptap/markdown` is still an early release.

## Consequences

The file outlives the version that wrote it: a note saved today opens in every
later Multifus, so a change of format comes with its migration.
