import type { Modifiers } from '@dnd-kit/abstract'
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers'
import { Accessibility, type Draggable } from '@dnd-kit/dom'
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent
} from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { strings } from '@/constants/strings'

export const DRAG_MODIFIERS = [RestrictToVerticalAxis] satisfies Modifiers

const nicknameOf = (source: Draggable | null) => {
  return source === null ? null : String(source.id)
}

export const DRAG_ACCESSIBILITY = Accessibility.configure({
  screenReaderInstructions: {
    draggable: strings.characters.drag.instructions
  },
  announcements: {
    dragstart: ({ operation }: DragStartEvent) => {
      const nickname = nicknameOf(operation.source)

      return nickname === null
        ? undefined
        : strings.characters.drag.picked(nickname)
    },
    dragover: ({ operation }: DragOverEvent) => {
      const { source } = operation

      return isSortable(source)
        ? strings.characters.drag.movedTo(String(source.id), source.index + 1)
        : undefined
    },
    dragend: ({ operation, canceled }: DragEndEvent) => {
      const nickname = nicknameOf(operation.source)

      return nickname === null
        ? undefined
        : strings.characters.drag.dropped(nickname, canceled)
    }
  }
})
