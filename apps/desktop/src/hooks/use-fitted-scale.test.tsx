import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useFittedScale } from '@/hooks/use-fitted-scale'

const DRAWN = 320

type RuneTableProps = {
  readonly drawn: number
}

const RuneTable = ({ drawn }: RuneTableProps) => {
  useFittedScale(drawn)

  return <div>Tableau des runes</div>
}

const roomOf = (width: number) => {
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(
    width
  )
}

describe('the page cut for the window that carries it', () => {
  afterEach(() => {
    document.body.removeAttribute('style')
  })

  it('grows as one block, writing included, rather than stretching', () => {
    roomOf(DRAWN * 2)

    render(<RuneTable drawn={DRAWN} />)

    expect(document.body.style.transform).toBe('scale(2)')
    expect(document.body.style.transformOrigin).toBe('top left')
    expect(document.body.style.width).toBe(`${DRAWN}px`)
  })

  it('keeps the size where it was drawn when the window is already there', () => {
    roomOf(DRAWN)

    render(<RuneTable drawn={DRAWN} />)

    expect(document.body.style.transform).toBe('scale(1)')
  })

  it('shrinks as one block, without the engine raising the writing', () => {
    roomOf(DRAWN / 2)

    render(<RuneTable drawn={DRAWN} />)

    expect(document.body.style.transform).toBe('scale(0.5)')
    expect(document.body.style.zoom).toBe('')
  })

  it('touches nothing while nobody has measured the window', () => {
    roomOf(0)

    render(<RuneTable drawn={DRAWN} />)

    expect(document.body.style.transform).toBe('')
    expect(document.body.style.width).toBe('')
  })
})
