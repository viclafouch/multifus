import React from 'react'
import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { moved } from '@/helpers/array'
import { arrange } from '@/helpers/cycle'
import { reorder } from '@/lib/multifus'

type UseCycleOrderParams = {
  readonly characters: readonly Character[]
  readonly run: (action: Promise<Snapshot>) => void
}

/**
 * The cycle order while it is being rearranged: the roster the Rust side stored,
 * except while a row is dragged, when a local copy follows the pointer.
 */
export const useCycleOrder = ({ characters, run }: UseCycleOrderParams) => {
  const [order, setOrder] = React.useState<readonly string[] | null>(null)
  const [dragged, setDragged] = React.useState<string | null>(null)
  const [known, setKnown] = React.useState(characters)

  // A new roster drops the local copy during render and not in an effect: an
  // effect would clear it a frame later and the list would visibly jump back.
  if (known !== characters) {
    setKnown(characters)

    // A scan landing mid-drag keeps the copy: pulling a row out from under the
    // pointer is worse than being one scan behind.
    if (dragged === null) {
      setOrder(null)
    }
  }

  const rows = arrange({ characters, order })

  const commit = (next: readonly string[]) => {
    setOrder(next)
    run(reorder(next))
  }

  return {
    rows,
    dragged,
    handleMove: (nickname: string, delta: number) => {
      const next = moved({ list: nicknamesOf(rows), item: nickname, delta })

      if (next !== null) {
        commit(next)
      }
    },
    handleDragStart: (nickname: string) => {
      setDragged(nickname)
      setOrder(nicknamesOf(rows))
    },
    handleDragOver: (nickname: string) => {
      if (dragged === null || dragged === nickname) {
        return
      }

      setOrder((current) => {
        const list = current ?? nicknamesOf(characters)
        const delta = list.indexOf(nickname) - list.indexOf(dragged)

        return moved({ list, item: dragged, delta }) ?? list
      })
    },
    handleDragEnd: () => {
      setDragged(null)

      if (order !== null) {
        run(reorder(order))
      }
    }
  }
}

const nicknamesOf = (characters: readonly Character[]) => {
  return characters.map((character) => {
    return character.nickname
  })
}
