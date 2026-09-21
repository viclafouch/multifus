# @multifus/ankama

Artwork owned by Ankama Games: images, loops, monsters, portraits and icons.
Monsters are the dungeon illustrations.

**Not covered by the MIT licence of this repository.** The
[licence](../../LICENSE) excludes this directory, no right over its contents is
granted, and this project is not affiliated with Ankama. A
`git rm -r packages/ankama` removes all of it at once.

Everything but the icons is imported by path, and the icons are read from disk at
build time.

```ts
import camp from '@multifus/ankama/images/camp.webp'
```

An image holding text the player reads carries its language before the
extension, one file per language: `multifus-mac.fr.webp`.
