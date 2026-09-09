import React from 'react'
import { useStill } from '@/hooks/use-still'
import { ignore } from '@/lib/utils'

const GLIDE_MS = 500
const GLIDE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const STIR_PX = 0.5
const STIR_RATIO = 0.01

const NO_SHIFT = { x: 0, y: 0, scale: 1 }

type Box = {
  left: number
  top: number
  width: number
}

const placesOf = (element: HTMLElement) => {
  return Array.from(element.querySelectorAll<HTMLElement>('[data-place]'))
}

const shiftOf = (place: HTMLElement) => {
  const painted = window.getComputedStyle(place).transform

  if (painted === '' || painted === 'none') {
    return NO_SHIFT
  }

  const matrix = new DOMMatrixReadOnly(painted)

  return { x: matrix.m41, y: matrix.m42, scale: matrix.m11 }
}

const boxOf = (place: HTMLElement): Box => {
  const seen = place.getBoundingClientRect()
  const shift = shiftOf(place)

  return {
    left: seen.left - shift.x,
    top: seen.top - shift.y,
    width: seen.width / shift.scale
  }
}

const boxesOf = (places: readonly HTMLElement[]) => {
  const boxes = new Map<string, Box>()

  for (const place of places) {
    const key = place.dataset.place

    if (key !== undefined) {
      boxes.set(key, boxOf(place))
    }
  }

  return boxes
}

const hold = (places: readonly HTMLElement[]) => {
  for (const place of places) {
    if (place.dataset.going === undefined && place.style.position !== '') {
      place.removeAttribute('style')
    }
  }

  const leaving = places
    .filter((place) => {
      return place.dataset.going !== undefined && place.style.position === ''
    })
    .map((place) => {
      return {
        place,
        left: place.offsetLeft,
        top: place.offsetTop,
        width: place.offsetWidth,
        height: place.offsetHeight
      }
    })

  for (const { place, left, top, width, height } of leaving) {
    place.style.position = 'absolute'
    place.style.left = `${left}px`
    place.style.top = `${top}px`
    place.style.width = `${width}px`
    place.style.height = `${height}px`
  }
}

export const useGlide = (
  holder: React.RefObject<HTMLElement | null>,
  roll: string
) => {
  const isStill = useStill()
  const boxes = React.useRef(new Map<string, Box>())
  const moves = React.useRef(new Map<string, Animation>())

  React.useLayoutEffect(() => {
    const element = holder.current

    if (element === null || isStill) {
      return ignore
    }

    const remember = () => {
      boxes.current = boxesOf(placesOf(element))
    }

    const watcher = new ResizeObserver(remember)

    watcher.observe(element)

    return () => {
      watcher.disconnect()
    }
  }, [holder, isStill])

  React.useLayoutEffect(() => {
    const element = holder.current

    if (element === null || isStill) {
      return
    }

    const places = placesOf(element)

    hold(places)

    const shifts = new Map(
      places.map((place) => {
        return [place, shiftOf(place)] as const
      })
    )

    for (const move of moves.current.values()) {
      move.cancel()
    }

    moves.current.clear()

    const kept = new Map<string, Box>()

    for (const place of places) {
      const key = place.dataset.place

      if (key === undefined) {
        continue
      }

      const after = boxOf(place)

      kept.set(key, after)

      const before = boxes.current.get(key)
      const shift = shifts.get(place) ?? NO_SHIFT

      if (before === undefined || after.width === 0) {
        continue
      }

      const dx = before.left + shift.x - after.left
      const dy = before.top + shift.y - after.top
      const ratio = (before.width * shift.scale) / after.width

      const isSettled =
        Math.abs(dx) < STIR_PX &&
        Math.abs(dy) < STIR_PX &&
        Math.abs(ratio - 1) < STIR_RATIO

      if (isSettled) {
        continue
      }

      moves.current.set(
        key,
        place.animate(
          [
            {
              transformOrigin: '0 0',
              transform: `translate(${dx}px, ${dy}px) scale(${ratio})`
            },
            { transformOrigin: '0 0', transform: 'none' }
          ],
          { duration: GLIDE_MS, easing: GLIDE_EASE }
        )
      )
    }

    boxes.current = kept
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- l’effet lit le DOM, et « roll » n’est là que pour dire qu’il a changé
  }, [holder, roll, isStill])
}
