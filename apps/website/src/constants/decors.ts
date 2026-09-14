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

const DECOR_DIR = '@multifus/ankama/images'

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
  ankama: null,
  legal: null
} as const satisfies Record<PageId, string | null>

export const OG_DECOR_FILES = {
  home: `${DECOR_DIR}/village.webp`,
  autoFocus: `${DECOR_DIR}/battle.webp`,
  wheel: `${DECOR_DIR}/camp.webp`,
  walk: `${DECOR_DIR}/forest.webp`,
  runeTable: `${DECOR_DIR}/workshop.webp`,
  relay: `${DECOR_DIR}/pen.webp`,
  quickReplies: `${DECOR_DIR}/harbour.webp`,
  mac: `${DECOR_DIR}/village.webp`,
  comparison: `${DECOR_DIR}/arena.webp`,
  download: `${DECOR_DIR}/dolmen.webp`,
  journal: `${DECOR_DIR}/dolmen.webp`,
  ankama: `${DECOR_DIR}/village.webp`,
  legal: `${DECOR_DIR}/dolmen.webp`
} as const satisfies Record<PageId, string>
