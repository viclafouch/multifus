import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@lingui/react'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within
} from '@testing-library/react'
import { RivalTable } from '@/components/rival-table'
import {
  PEEK_TRAITS,
  RIVAL_IDS,
  RIVALS,
  TRAIT_IDS,
  TRAIT_NAMES
} from '@/constants/rivals'
import { SPEAKERS } from '@/lib/i18n'
import { HOVER } from '@/lib/media'

const HALF_NOTE = 'Sur Mac, l’outil se dit lui-même en bêta.'

const pixels = (written: string) => {
  return Number(written.replace('px', ''))
}

const pointAt = (kind: 'cursor' | 'finger') => {
  vi.stubGlobal('matchMedia', (query: string) => {
    return {
      matches: query === HOVER && kind === 'cursor',
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {}
    }
  })
}

const show = (isPeek = false) => {
  return render(
    <I18nProvider i18n={SPEAKERS.fr}>
      <RivalTable isPeek={isPeek} />
    </I18nProvider>
  )
}

describe('the table of the comparison', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('gives its column to Multifus', () => {
    show()

    expect(screen.getByRole('columnheader', { name: 'Multifus' })).toBeDefined()
  })

  it.each(RIVAL_IDS)('leads to the code of %s, in another tab', (rival) => {
    show()

    const { name, code } = RIVALS[rival]
    const link = screen.getByRole('link', { name: new RegExp(`^${name}`, 'u') })

    expect(link.getAttribute('href')).toBe(code)
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it.each(TRAIT_IDS)('lays the %s row', (trait) => {
    show()

    expect(
      screen.getByRole('rowheader', {
        name: SPEAKERS.fr._(TRAIT_NAMES[trait])
      })
    ).toBeDefined()
  })

  it('says no under Multifus where Multifus does nothing', () => {
    show()

    const row = screen.getByRole('row', {
      name: /Fenêtres rangées côte à côte/u
    })
    const [mine] = within(row).getAllByRole('img')

    expect(mine.getAttribute('aria-label')).toBe('non')
  })

  it('says each cell in full words', () => {
    show()

    expect(screen.getAllByRole('img', { name: 'oui' }).length).toBeGreaterThan(
      0
    )
    expect(screen.getAllByRole('img', { name: 'non' }).length).toBeGreaterThan(
      0
    )
    expect(
      screen.getAllByRole('img', { name: 'à moitié' }).length
    ).toBeGreaterThan(0)
  })

  it('delivers the reason of a half cell without it being hovered', () => {
    show()

    expect(screen.getByText('Code publié, sans licence libre.')).toBeDefined()
  })

  it('raises the bubble when the cursor lands on a half cell', () => {
    pointAt('cursor')
    show()

    const asked = screen.getAllByRole('button')[0]

    expect(screen.queryByRole('tooltip')).toBeNull()

    fireEvent.mouseEnter(asked)

    expect(screen.getByRole('tooltip').textContent).toBe(HALF_NOTE)

    vi.useFakeTimers()
    fireEvent.mouseLeave(asked)
    act(() => {
      vi.runAllTimers()
    })
    vi.useRealTimers()

    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('opens and shuts the bubble under a finger', () => {
    pointAt('finger')
    show()

    const asked = screen.getAllByRole('button')[0]

    fireEvent.click(asked)

    expect(screen.getByRole('tooltip').textContent).toBe(HALF_NOTE)

    fireEvent.click(asked)

    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('keeps the bubble inside the screen near an edge', () => {
    pointAt('finger')
    show()

    const asked = screen.getAllByRole('button')[0]

    asked.getBoundingClientRect = () => {
      return new DOMRect(window.innerWidth - 11, 40, 22, 22)
    }

    fireEvent.click(asked)

    const bubble = screen.getByRole('tooltip')
    const wide = pixels(bubble.style.getPropertyValue('--tip-wide'))
    const left = pixels(bubble.style.left)

    expect(left + wide / 2).toBeLessThanOrEqual(window.innerWidth)
    expect(left - wide / 2).toBeGreaterThanOrEqual(0)
  })

  it('dates its record in French', () => {
    show()

    expect(screen.getByText(/21 septembre 2026/u)).toBeDefined()
  })

  it('holds back most of its rows in a peek', () => {
    show(true)

    expect(PEEK_TRAITS.length).toBeLessThan(TRAIT_IDS.length)
    expect(screen.getAllByRole('rowheader')).toHaveLength(PEEK_TRAITS.length)
  })

  it('leaves no bubble to open under the veil of its peek', () => {
    show(true)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
