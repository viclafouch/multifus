# @multifus/ankama

Artwork owned by Ankama Games: images, loops, monsters, portraits and icons.

**Not covered by the MIT licence of this repository.** The
[licence](../../LICENSE) excludes this directory, no right over its contents is
granted, and this project is not affiliated with Ankama. A
`git rm -r packages/ankama` removes all of it at once.

Images, loops, monsters and portraits are imported by path. Monsters are the
dungeon monster illustrations, each one 100 by 120.

```ts
import camp from '@multifus/ankama/images/camp.webp'
```

An image holding text the player reads is taken once per language, and carries
that language before its extension. Every language of the application has its
own file, so the importer can pick one without a fallback.

```ts
import optionsGeneralFrench from '@multifus/ankama/images/dofus-options-general.fr.webp'
```

Icons have no entry in `exports`: they are read from disk at build time.
