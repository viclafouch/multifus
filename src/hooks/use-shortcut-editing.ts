import React from 'react'
import type { Binding } from '@/@types/shortcuts'
import { resumeShortcuts, suspendShortcuts } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

export const useShortcutEditing = () => {
  const [binding, setBinding] = React.useState<Binding | null>(null)

  React.useEffect(() => {
    if (binding === null) {
      return ignore
    }

    suspendShortcuts().catch(ignore)

    return () => {
      resumeShortcuts().catch(ignore)
    }
  }, [binding])

  const open = (opened: Binding) => {
    setBinding(opened)
  }

  const close = () => {
    setBinding(null)
  }

  return { binding, open, close }
}
