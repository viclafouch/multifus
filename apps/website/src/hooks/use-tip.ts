import React from 'react'

const LINGER = 180

const TIP_WIDE = 288

const TIP_EDGE = 8

type Spot = Readonly<{
  left: number
  top: number
  wide: number
}>

export const useTip = () => {
  const [spot, setSpot] = React.useState<Spot | null>(null)
  const leaving = React.useRef<number | null>(null)

  React.useEffect(() => {
    const close = () => {
      setSpot(null)
    }

    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSpot(null)
      }
    }

    if (spot !== null) {
      window.addEventListener('scroll', close, true)
      window.addEventListener('resize', close)
      window.addEventListener('keydown', escape)
    }

    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', escape)
    }
  }, [spot])

  React.useEffect(() => {
    return () => {
      if (leaving.current !== null) {
        window.clearTimeout(leaving.current)
      }
    }
  }, [])

  const hold = () => {
    if (leaving.current !== null) {
      window.clearTimeout(leaving.current)
      leaving.current = null
    }
  }

  const spotOn = (anchor: HTMLElement): Spot => {
    const box = anchor.getBoundingClientRect()
    const wide = Math.min(TIP_WIDE, window.innerWidth - TIP_EDGE * 2)
    const middle = box.left + box.width / 2

    return {
      left: Math.min(
        Math.max(middle, TIP_EDGE + wide / 2),
        window.innerWidth - TIP_EDGE - wide / 2
      ),
      top: box.top,
      wide
    }
  }

  const show = (event: React.SyntheticEvent<HTMLElement>) => {
    hold()
    setSpot(spotOn(event.currentTarget))
  }

  const toggle = (event: React.SyntheticEvent<HTMLElement>) => {
    const anchor = event.currentTarget

    hold()
    setSpot((shown) => {
      return shown === null ? spotOn(anchor) : null
    })
  }

  const hide = () => {
    hold()
    leaving.current = window.setTimeout(() => {
      setSpot(null)
    }, LINGER)
  }

  return { spot, show, toggle, hide, hold }
}
