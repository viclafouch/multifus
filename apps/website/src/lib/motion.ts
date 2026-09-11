const STILL = '(prefers-reduced-motion: reduce)'

export const matchIsStill = () => {
  return window.matchMedia(STILL).matches
}

export const matchIsStillOnServer = () => {
  return false
}

export const watchStill = (onChange: () => void) => {
  const query = window.matchMedia(STILL)

  query.addEventListener('change', onChange)

  return () => {
    query.removeEventListener('change', onChange)
  }
}
