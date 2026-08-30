import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { useMeasuredRatio } from '@/hooks/use-measured-ratio'
import { ignore } from '@/lib/utils'

const WIDTH = 320

const watchers: ResizeObserverCallback[] = []

const disconnect = vi.fn()

class WatchingResizeObserver implements ResizeObserver {
  constructor(watch: ResizeObserverCallback) {
    watchers.push(watch)
  }

  observe = ignore
  unobserve = ignore
  disconnect = disconnect
}

type PlateProps = {
  readonly report: (ratio: number) => void
}

const Plate = ({ report }: PlateProps) => {
  const plate = React.useRef<HTMLDivElement>(null)

  useMeasuredRatio(plate, report)

  return <div ref={plate}>Tableau des runes</div>
}

const standing = (width: number, height: number) => {
  return vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(0, 0, width, height))
}

const resize = (observer: ResizeObserver) => {
  act(() => {
    for (const watch of watchers) {
      watch([], observer)
    }
  })
}

describe('la forme que la plaque dit d’elle-même', () => {
  afterEach(() => {
    watchers.length = 0

    vi.unstubAllGlobals()
  })

  it('rend la hauteur sur la largeur, et non la hauteur seule', () => {
    const report = vi.fn()
    const measured = standing(WIDTH, 640)

    render(<Plate report={report} />)
    measured.mockRestore()

    expect(report).toHaveBeenCalledExactlyOnceWith(2)
  })

  it('se tait sur une plaque que personne n’a encore posée', () => {
    const report = vi.fn()
    const measured = standing(0, 0)

    render(<Plate report={report} />)
    measured.mockRestore()

    expect(report).not.toHaveBeenCalled()
  })

  it('remesure la plaque que la jauge vient de grossir', () => {
    vi.stubGlobal('ResizeObserver', WatchingResizeObserver)

    const report = vi.fn()
    const narrow = standing(WIDTH, 640)

    render(<Plate report={report} />)
    narrow.mockRestore()

    const wide = standing(WIDTH * 2, 1400)

    resize(new WatchingResizeObserver(ignore))
    wide.mockRestore()

    expect(report).toHaveBeenLastCalledWith(1400 / (WIDTH * 2))
  })

  it('lâche l’observateur en partant', () => {
    vi.stubGlobal('ResizeObserver', WatchingResizeObserver)

    const measured = standing(WIDTH, 640)
    const { unmount } = render(<Plate report={vi.fn()} />)

    unmount()
    measured.mockRestore()

    expect(disconnect).toHaveBeenCalledWith()
  })
})
