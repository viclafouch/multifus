import React from 'react'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'

/** How long the caller is told the copy worked. */
const FEEDBACK_DURATION = 2000

/**
 * Puts text on the clipboard, and says for a moment that it worked.
 *
 * The clipboard goes through the Tauri plugin rather than `navigator.clipboard`:
 * the window is served over a custom protocol, and the plugin is the route the
 * documentation guarantees. It needs `clipboard-manager:allow-write-text` in the
 * capability, and nothing more, since multifus never reads the clipboard.
 *
 * A refusal leaves `hasCopied` false and shows nothing. There is no wording for
 * a clipboard that will not take text, and inventing one would be a sentence the
 * reader can do nothing with; the button simply does not confirm.
 */
export const useCopy = () => {
  const [hasCopied, setHasCopied] = React.useState(false)
  const reset = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // A component unmounted inside the feedback window would otherwise be told to
  // change state after it is gone.
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
