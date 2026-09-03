import type { Modifiers } from '@dnd-kit/abstract'
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers'
import { Accessibility, type Draggable } from '@dnd-kit/dom'
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent
} from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { t } from '@lingui/core/macro'

export const DRAG_MODIFIERS = [RestrictToVerticalAxis] satisfies Modifiers

const nicknameOf = (source: Draggable | null) => {
  return source === null ? null : String(source.id)
}

const movedTo = (nickname: string, rank: number) => {
  return t`${nickname} passe en position ${rank}.`
}

const dropped = (nickname: string, canceled: boolean) => {
  return canceled
    ? t`Déplacement annulé. ${nickname} reste à sa place.`
    : t`${nickname} est posé.`
}

let configured: ReturnType<typeof Accessibility.configure> | null = null

export const dragAccessibility = () => {
  configured ??= Accessibility.configure({
    screenReaderInstructions: {
      draggable: t`Pour prendre une ligne, appuyez sur la barre d’espace. Déplacez-la avec les flèches. Appuyez de nouveau sur la barre d’espace pour la poser, ou sur Échap pour annuler.`
    },
    announcements: {
      dragstart: ({ operation }: DragStartEvent) => {
        const nickname = nicknameOf(operation.source)

        return nickname === null ? undefined : t`${nickname} est pris.`
      },
      dragover: ({ operation }: DragOverEvent) => {
        const { source } = operation

        return isSortable(source)
          ? movedTo(String(source.id), source.index + 1)
          : undefined
      },
      dragend: ({ operation, canceled }: DragEndEvent) => {
        const nickname = nicknameOf(operation.source)

        return nickname === null ? undefined : dropped(nickname, canceled)
      }
    }
  })

  return configured
}
