import autoFocusPoster from '@multifus/ankama/loops/auto-focus-loop-poster.webp'
import autoFocusLoop from '@multifus/ankama/loops/auto-focus-loop.mp4'
import homePoster from '@multifus/ankama/loops/home-loop-poster.webp'
import homeLoop from '@multifus/ankama/loops/home-loop.mp4'
import quickRepliesPoster from '@multifus/ankama/loops/quick-replies-loop-poster.webp'
import quickRepliesLoop from '@multifus/ankama/loops/quick-replies-loop.mp4'
import relayPoster from '@multifus/ankama/loops/relay-loop-poster.webp'
import relayLoop from '@multifus/ankama/loops/relay-loop.mp4'
import runeTablePoster from '@multifus/ankama/loops/rune-table-loop-poster.webp'
import runeTableLoop from '@multifus/ankama/loops/rune-table-loop.mp4'
import walkPoster from '@multifus/ankama/loops/walk-loop-poster.webp'
import walkLoop from '@multifus/ankama/loops/walk-loop.mp4'
import wheelPoster from '@multifus/ankama/loops/wheel-loop-poster.webp'
import wheelLoop from '@multifus/ankama/loops/wheel-loop.mp4'
import type { Loop, LoopId } from '@/@types/page'

const FILMED_ON = '2026-09-08'

export const LOOPS = {
  home: {
    source: homeLoop,
    poster: homePoster,
    seconds: 12,
    filmed: FILMED_ON
  },
  autoFocus: {
    source: autoFocusLoop,
    poster: autoFocusPoster,
    seconds: 13,
    filmed: FILMED_ON
  },
  wheel: {
    source: wheelLoop,
    poster: wheelPoster,
    seconds: 12,
    filmed: FILMED_ON
  },
  walk: {
    source: walkLoop,
    poster: walkPoster,
    seconds: 14,
    filmed: FILMED_ON
  },
  runeTable: {
    source: runeTableLoop,
    poster: runeTablePoster,
    seconds: 14,
    filmed: FILMED_ON
  },
  relay: {
    source: relayLoop,
    poster: relayPoster,
    seconds: 13,
    filmed: FILMED_ON
  },
  quickReplies: {
    source: quickRepliesLoop,
    poster: quickRepliesPoster,
    seconds: 14,
    filmed: FILMED_ON
  }
} as const satisfies Record<LoopId, Loop>
