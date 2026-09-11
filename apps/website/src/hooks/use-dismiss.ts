import React from 'react'

export const useDismiss = (
  disclosure: React.RefObject<HTMLDetailsElement | null>
) => {
  React.useEffect(() => {
    const close = () => {
      const element = disclosure.current

      if (element !== null) {
        element.open = false
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      const element = disclosure.current
      const { target } = event

      if (
        element !== null &&
        target instanceof Node &&
        !element.contains(target)
      ) {
        close()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [disclosure])
}
