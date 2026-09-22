import arena from '@multifus/ankama/images/arena.webp'
import battleSmall from '@multifus/ankama/images/battle-760.webp'
import battle from '@multifus/ankama/images/battle.webp'
import bones from '@multifus/ankama/images/bones.webp'
import camp from '@multifus/ankama/images/camp.webp'
import forest from '@multifus/ankama/images/forest.webp'
import harbour from '@multifus/ankama/images/harbour.webp'
import marsh from '@multifus/ankama/images/marsh.webp'
import pen from '@multifus/ankama/images/pen.webp'
import standingStone from '@multifus/ankama/images/standing-stone.webp'
import village from '@multifus/ankama/images/village.webp'
import workshop from '@multifus/ankama/images/workshop.webp'
import zaap from '@multifus/ankama/images/zaap.webp'
import type { Picture, Shot } from '@/@types/media'
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

type BandId = 'bones' | 'marsh' | 'zaap'

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

export const BAN_DECOR = {
  full: DECORS.battle,
  small: { src: battleSmall, width: 760, height: 443 }
} as const satisfies Shot

export const BAND_DECORS = {
  bones: { src: bones, width: 1484, height: 432 },
  marsh: { src: marsh, width: 1356, height: 373 },
  zaap: { src: zaap, width: 1484, height: 432 }
} as const satisfies Record<BandId, Picture>

export const PAGE_DECORS = {
  home: DECORS.village,
  autoFocus: DECORS.battle,
  wheel: DECORS.camp,
  walk: DECORS.forest,
  runeTable: DECORS.workshop,
  relay: DECORS.pen,
  quickTexts: DECORS.harbour,
  mac: DECORS.village,
  windows: DECORS.camp,
  comparison: DECORS.arena,
  download: DECORS.standingStone,
  faq: DECORS.standingStone,
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
  quickTexts: `${DECOR_DIR}/harbour.webp`,
  mac: `${DECOR_DIR}/village.webp`,
  windows: `${DECOR_DIR}/camp.webp`,
  comparison: `${DECOR_DIR}/arena.webp`,
  download: `${DECOR_DIR}/standing-stone.webp`,
  faq: `${DECOR_DIR}/standing-stone.webp`,
  journal: `${DECOR_DIR}/standing-stone.webp`,
  ankama: `${DECOR_DIR}/village.webp`,
  legal: `${DECOR_DIR}/standing-stone.webp`
} as const satisfies Record<PageId, string>
