import arena from '@multifus/ankama/images/arena.webp'
import battle from '@multifus/ankama/images/battle.webp'
import camp from '@multifus/ankama/images/camp.webp'
import forest from '@multifus/ankama/images/forest.webp'
import harbour from '@multifus/ankama/images/harbour.webp'
import pen from '@multifus/ankama/images/pen.webp'
import standingStone from '@multifus/ankama/images/standing-stone.webp'
import village from '@multifus/ankama/images/village.webp'
import workshop from '@multifus/ankama/images/workshop.webp'
import type { Picture } from '@/@types/media'
import type { PageId } from '@/@types/page'

const DECOR_DIR = '@multifus/ankama/images'

type DecorId =
  | 'arena'
  | 'battle'
  | 'camp'
  | 'forest'
  | 'harbour'
  | 'pen'
  | 'standingStone'
  | 'village'
  | 'workshop'

const DECORS = {
  arena: { src: arena, width: 1100, height: 825 },
  battle: { src: battle, width: 1484, height: 864 },
  camp: { src: camp, width: 1100, height: 825 },
  forest: { src: forest, width: 1100, height: 825 },
  harbour: { src: harbour, width: 1100, height: 825 },
  pen: { src: pen, width: 1100, height: 825 },
  standingStone: { src: standingStone, width: 1484, height: 864 },
  village: { src: village, width: 1100, height: 825 },
  workshop: { src: workshop, width: 1030, height: 630 }
} as const satisfies Record<DecorId, Picture>

export const PAGE_DECORS = {
  home: DECORS.village,
  autoFocus: DECORS.battle,
  wheel: DECORS.camp,
  walk: DECORS.forest,
  runeTable: DECORS.workshop,
  relay: DECORS.pen,
  quickReplies: DECORS.harbour,
  mac: DECORS.village,
  comparison: DECORS.arena,
  download: DECORS.standingStone,
  journal: null,
  ankama: DECORS.village,
  legal: null
} as const satisfies Record<PageId, Picture | null>

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
  download: `${DECOR_DIR}/standing-stone.webp`,
  journal: `${DECOR_DIR}/standing-stone.webp`,
  ankama: `${DECOR_DIR}/village.webp`,
  legal: `${DECOR_DIR}/standing-stone.webp`
} as const satisfies Record<PageId, string>
