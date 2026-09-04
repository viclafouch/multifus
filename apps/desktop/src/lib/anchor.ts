import ReactDOM from 'react-dom'

const STILL = '(prefers-reduced-motion: reduce)'

export const showAnchor = (anchor: string, render: () => void) => {
  ReactDOM.flushSync(render)

  document.querySelector(`#${anchor}`)?.scrollIntoView({
    behavior: window.matchMedia(STILL).matches ? 'auto' : 'smooth',
    block: 'start'
  })
}
