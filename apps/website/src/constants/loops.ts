import autoFocusLoop from '@multifus/ankama/loops/auto-focus-loop.mp4'
import runeTableLoop from '@multifus/ankama/loops/rune-table-loop.mp4'
import walkLoop from '@multifus/ankama/loops/walk-loop.mp4'
import wheelLoop from '@multifus/ankama/loops/wheel-loop.mp4'
import type { LoopId } from '@/@types/page'

export const LOOPS = {
  autoFocus: autoFocusLoop,
  wheel: wheelLoop,
  walk: walkLoop,
  runeTable: runeTableLoop
} as const satisfies Record<LoopId, string>
