import React from 'react'

const LINGER = 180

type Spot = Readonly<{
  left: number
  top: number
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

  const show = (event: React.SyntheticEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect()

    hold()
    setSpot({ left: box.left + box.width / 2, top: box.top })
  }

  const hide = () => {
    hold()
    leaving.current = window.setTimeout(() => {
      setSpot(null)
    }, LINGER)
  }

  return { spot, show, hide, hold }
}
