import autoFocusPeek from '@multifus/ankama/loops/auto-focus-loop-peek.webp'
import autoFocusPoster from '@multifus/ankama/loops/auto-focus-loop-poster.webp'
import autoFocusLoop from '@multifus/ankama/loops/auto-focus-loop.mp4'
import homePoster from '@multifus/ankama/loops/home-loop-poster.webp'
import homeLoop from '@multifus/ankama/loops/home-loop.mp4'
import quickTextsPeek from '@multifus/ankama/loops/quick-texts-loop-peek.webp'
import quickTextsPoster from '@multifus/ankama/loops/quick-texts-loop-poster.webp'
import quickTextsLoop from '@multifus/ankama/loops/quick-texts-loop.mp4'
import relayPeek from '@multifus/ankama/loops/relay-loop-peek.webp'
import relayPoster from '@multifus/ankama/loops/relay-loop-poster.webp'
import relayLoop from '@multifus/ankama/loops/relay-loop.mp4'
import runeTablePeek from '@multifus/ankama/loops/rune-table-loop-peek.webp'
import runeTablePoster from '@multifus/ankama/loops/rune-table-loop-poster.webp'
import runeTableLoop from '@multifus/ankama/loops/rune-table-loop.mp4'
import walkPeek from '@multifus/ankama/loops/walk-loop-peek.webp'
import walkPoster from '@multifus/ankama/loops/walk-loop-poster.webp'
import walkLoop from '@multifus/ankama/loops/walk-loop.mp4'
import wheelPeek from '@multifus/ankama/loops/wheel-loop-peek.webp'
import wheelPoster from '@multifus/ankama/loops/wheel-loop-poster.webp'
import wheelLoop from '@multifus/ankama/loops/wheel-loop.mp4'
import type { Size } from '@/@types/media'
import type { FeatureId, Loop, LoopId } from '@/@types/page'

const FILMED_ON = '2026-09-08'

const REFILMED_ON = '2026-09-16'

export const POSTER_SIZE = { width: 1280, height: 720 } as const satisfies Size

export const PEEK_SIZE = { width: 720, height: 406 } as const satisfies Size

export const LOOPS = {
  home: {
    source: homeLoop,
    size: { width: 1280, height: 720 },
    poster: homePoster,
    seconds: 18,
    filmed: REFILMED_ON
  },
  autoFocus: {
    source: autoFocusLoop,
    size: { width: 1384, height: 778 },
    poster: autoFocusPoster,
    seconds: 13,
    filmed: FILMED_ON
  },
  wheel: {
    source: wheelLoop,
    size: { width: 1386, height: 780 },
    poster: wheelPoster,
    seconds: 12,
    filmed: FILMED_ON
  },
  walk: {
    source: walkLoop,
    size: { width: 1386, height: 780 },
    poster: walkPoster,
    seconds: 14,
    filmed: FILMED_ON
  },
  runeTable: {
    source: runeTableLoop,
    size: { width: 1384, height: 778 },
    poster: runeTablePoster,
    seconds: 14,
    filmed: FILMED_ON
  },
  relay: {
    source: relayLoop,
    size: { width: 1152, height: 648 },
    poster: relayPoster,
    seconds: 5,
    filmed: REFILMED_ON
  },
  quickTexts: {
    source: quickTextsLoop,
    size: { width: 800, height: 450 },
    poster: quickTextsPoster,
    seconds: 12,
    filmed: REFILMED_ON
  }
} as const satisfies Record<LoopId, Loop>

export const PEEKS = {
  autoFocus: autoFocusPeek,
  wheel: wheelPeek,
  walk: walkPeek,
  runeTable: runeTablePeek,
  relay: relayPeek,
  quickTexts: quickTextsPeek
} as const satisfies Record<FeatureId, string>
