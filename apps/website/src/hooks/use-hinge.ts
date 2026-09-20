import React from 'react'
import { useDismiss } from '@/hooks/use-dismiss'

export const useHinge = () => {
  const hinge = React.useRef<HTMLDetailsElement>(null)

  const close = () => {
    const element = hinge.current

    if (element !== null) {
      element.open = false
    }
  }

  useDismiss(hinge)

  return { hinge, close }
}
