import ReactDOM from 'react-dom'
import { matchIsStill } from '@/lib/motion'

export const FILM_MORPH = 'loop-film'

export const morph = (change: () => void) => {
  if (matchIsStill() || typeof document.startViewTransition !== 'function') {
    change()

    return
  }

  document.startViewTransition(() => {
    ReactDOM.flushSync(change)
  })
}
