const STILL = '(prefers-reduced-motion: reduce)'

export const matchIsStill = () => {
  return window.matchMedia(STILL).matches
}
