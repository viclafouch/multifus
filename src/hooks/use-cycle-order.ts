import React from 'react'
import type { DragEndEvent } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { moved } from '@/helpers/array'
import { arrange, matchIsArranged, nicknamesOf } from '@/helpers/cycle'
import { reorder } from '@/lib/multifus'

type UseCycleOrderParams = {
  readonly characters: readonly Character[]
  readonly run: (action: Promise<Snapshot>) => void
}

export const useCycleOrder = ({ characters, run }: UseCycleOrderParams) => {
  const [order, setOrder] = React.useState<readonly string[] | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [known, setKnown] = React.useState(characters)

  if (known !== characters) {
    setKnown(characters)

    if (!isDragging && matchIsArranged({ characters, order })) {
      setOrder(null)
    }
  }

  const rows = arrange({ characters, order })

  return {
    rows,
    handleDragStart: () => {
      setIsDragging(true)
      setOrder(nicknamesOf(rows))
    },
    handleDragEnd: ({ operation, canceled }: DragEndEvent) => {
      setIsDragging(false)

      const { source } = operation

      if (canceled || !isSortable(source)) {
        return
      }

      const next = moved({
        list: nicknamesOf(rows),
        item: String(source.id),
        delta: source.index - source.initialIndex
      })

      if (next === null) {
        return
      }

      setOrder(next)
      run(reorder(next))
    }
  }
}
