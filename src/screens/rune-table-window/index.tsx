import React from 'react'
import { PLATE_DRAWN_WIDTH } from '@/constants/runes'
import { useFittedZoom } from '@/hooks/use-fitted-zoom'
import { useMeasuredRatio } from '@/hooks/use-measured-ratio'
import { useRuneTableLook } from '@/hooks/use-rune-table-look'
import { useWindowDrag } from '@/hooks/use-window-drag'
import {
  closeRuneTable,
  moveRuneTable,
  runeTableMeasured,
  runeTableSettled
} from '@/lib/multifus'
import { ignore } from '@/lib/utils'
import { RuneSheet } from '@/screens/rune-table-window/rune-sheet'

const tellRatio = (ratio: number) => {
  runeTableMeasured(ratio).catch(ignore)
}

const moveTable = (byX: number, byY: number) => {
  moveRuneTable(byX, byY).catch(ignore)
}

const settleTable = () => {
  runeTableSettled().catch(ignore)
}

const closeTable = () => {
  closeRuneTable().catch(ignore)
}

export const RuneTableWindow = () => {
  const plate = React.useRef<HTMLDivElement>(null)
  const drag = useWindowDrag({ onMove: moveTable, onSettle: settleTable })
  const look = useRuneTableLook()

  useFittedZoom(PLATE_DRAWN_WIDTH)
  useMeasuredRatio(plate, tellRatio)

  return <RuneSheet drag={drag} look={look} ref={plate} onClose={closeTable} />
}
