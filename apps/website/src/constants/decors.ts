import arena from '@multifus/ankama/images/arena.webp'
import battle from '@multifus/ankama/images/battle.webp'
import camp from '@multifus/ankama/images/camp.webp'
import dolmen from '@multifus/ankama/images/dolmen.webp'
import forest from '@multifus/ankama/images/forest.webp'
import harbour from '@multifus/ankama/images/harbour.webp'
import pen from '@multifus/ankama/images/pen.webp'
import village from '@multifus/ankama/images/village.webp'
import workshop from '@multifus/ankama/images/workshop.webp'
import type { PageId } from '@/@types/page'

export const PAGE_DECORS = {
  home: village,
  autoFocus: battle,
  wheel: camp,
  walk: forest,
  runeTable: workshop,
  relay: pen,
  quickReplies: harbour,
  mac: village,
  comparison: arena,
  download: dolmen,
  journal: null,
  ankama: null
} as const satisfies Record<PageId, string | null>
