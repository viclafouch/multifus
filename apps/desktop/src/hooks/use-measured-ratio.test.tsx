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

type RuneTableProps = {
  readonly report: (ratio: number) => void
}

const RuneTable = ({ report }: RuneTableProps) => {
  const table = React.useRef<HTMLDivElement>(null)

  useMeasuredRatio(table, report)

  return <div ref={table}>Tableau des runes</div>
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

describe('the shape the table says of itself', () => {
  afterEach(() => {
    watchers.length = 0

    vi.unstubAllGlobals()
  })

  it('returns the height over the width, and not the height alone', () => {
    const report = vi.fn()
    const measured = standing(WIDTH, 640)

    render(<RuneTable report={report} />)
    measured.mockRestore()

    expect(report).toHaveBeenCalledExactlyOnceWith(2)
  })

  it('keeps quiet about a table nobody has laid yet', () => {
    const report = vi.fn()
    const measured = standing(0, 0)

    render(<RuneTable report={report} />)
    measured.mockRestore()

    expect(report).not.toHaveBeenCalled()
  })

  it('measures again the table the gauge has just grown', () => {
    vi.stubGlobal('ResizeObserver', WatchingResizeObserver)

    const report = vi.fn()
    const narrow = standing(WIDTH, 640)

    render(<RuneTable report={report} />)
    narrow.mockRestore()

    const wide = standing(WIDTH * 2, 1400)

    resize(new WatchingResizeObserver(ignore))
    wide.mockRestore()

    expect(report).toHaveBeenLastCalledWith(1400 / (WIDTH * 2))
  })

  it('lets go of the observer on leaving', () => {
    vi.stubGlobal('ResizeObserver', WatchingResizeObserver)

    const measured = standing(WIDTH, 640)
    const { unmount } = render(<RuneTable report={vi.fn()} />)

    unmount()
    measured.mockRestore()

    expect(disconnect).toHaveBeenCalledWith()
  })
})
