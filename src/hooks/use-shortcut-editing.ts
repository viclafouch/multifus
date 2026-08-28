import React from 'react'
import type { Binding } from '@/@types/shortcuts'

export const useShortcutEditing = () => {
  const [binding, setBinding] = React.useState<Binding | null>(null)

  const open = (opened: Binding) => {
    setBinding(opened)
  }

  const close = () => {
    setBinding(null)
  }

  return { binding, open, close }
}
