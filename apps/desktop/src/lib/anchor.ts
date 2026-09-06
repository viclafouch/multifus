import ReactDOM from 'react-dom'
import { matchIsStill } from '@/lib/motion'

export const showAnchor = (anchor: string, render: () => void) => {
  ReactDOM.flushSync(render)

  document.querySelector(`#${anchor}`)?.scrollIntoView({
    behavior: matchIsStill() ? 'auto' : 'smooth',
    block: 'start'
  })
}
