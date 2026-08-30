import React from 'react'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'

const FEEDBACK_DURATION = 2000

export const useCopy = () => {
  const [hasCopied, setHasCopied] = React.useState(false)
  const reset = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (reset.current !== null) {
        clearTimeout(reset.current)
      }
    }
  }, [])

  const copy = (text: string) => {
    writeText(text)
      .then(() => {
        setHasCopied(true)

        if (reset.current !== null) {
          clearTimeout(reset.current)
        }

        reset.current = setTimeout(() => {
          setHasCopied(false)
        }, FEEDBACK_DURATION)
      })
      .catch(() => {
        setHasCopied(false)
      })
  }

  return { hasCopied, copy }
}
