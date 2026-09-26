import React from 'react'

export const LANDING_ANIMATIONS = new Set(['alight', 'flare'])

const matchIsLandingIn = (seat: HTMLElement, animation: Animation) => {
  return (
    animation instanceof CSSAnimation &&
    LANDING_ANIMATIONS.has(animation.animationName) &&
    animation.effect instanceof KeyframeEffect &&
    animation.effect.target !== null &&
    seat.contains(animation.effect.target)
  )
}

export const useAlreadyLanded = (seat: React.RefObject<HTMLElement | null>) => {
  React.useLayoutEffect(() => {
    const element = seat.current

    if (element === null) {
      return
    }

    for (const animation of document.getAnimations()) {
      if (matchIsLandingIn(element, animation)) {
        animation.finish()
      }
    }
  }, [seat])
}
