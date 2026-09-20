import { describe, expect, it } from 'vitest'
import { MONSTERS } from '@/constants/monsters'
import { PAGE_IDS } from '@/constants/pages'
import { hauntsOf } from '@/lib/haunts'

const ROWS_CLEARING_A_MONSTER = 7

const ROWS_THE_SHORTEST_PAGE_SHOWS = 2

const FIRST_ROW_THE_MASK_CAN_LIGHT = 65

describe('the monsters haunting the background', () => {
  it.each(PAGE_IDS)('deals %s the same hand every time', (page) => {
    expect(hauntsOf(page)).toStrictEqual(hauntsOf(page))
  })

  it.each(PAGE_IDS)('never sets two monsters on one cell of %s', (page) => {
    const cells = hauntsOf(page).map(({ span, rise }) => {
      return `${span},${rise}`
    })

    expect(new Set(cells).size).toBe(cells.length)
  })

  it.each(PAGE_IDS)('never repeats a monster on %s', (page) => {
    const drawn = hauntsOf(page).map(({ monster }) => {
      return monster.src
    })

    expect(new Set(drawn).size).toBe(drawn.length)
  })

  it.each(PAGE_IDS)('drops every cell of %s on the isometric grid', (page) => {
    for (const { span, rise } of hauntsOf(page)) {
      expect(Number.isInteger(span)).toBe(true)
      expect(Number.isInteger(rise)).toBe(true)
      expect((span + rise) % 2).toBe(1)
    }
  })

  it.each(PAGE_IDS)('splits the monsters of %s on both sides', (page) => {
    const sides = hauntsOf(page)
      .slice(0, ROWS_THE_SHORTEST_PAGE_SHOWS)
      .map(({ way }) => {
        return way
      })

    expect(new Set(sides)).toStrictEqual(new Set(['west', 'east']))
  })

  it.each(PAGE_IDS)('never stacks two monsters of %s', (page) => {
    const rows = hauntsOf(page).map(({ rise }) => {
      return rise
    })

    for (const [rank, row] of rows.slice(1).entries()) {
      expect(row - rows[rank]).toBeGreaterThanOrEqual(ROWS_CLEARING_A_MONSTER)
    }
  })

  it.each(PAGE_IDS)(
    'starts the cells of %s where the mask can light them',
    (page) => {
      for (const { rise } of hauntsOf(page)) {
        expect(rise).toBeGreaterThanOrEqual(FIRST_ROW_THE_MASK_CAN_LIGHT)
      }
    }
  )

  it('shows every monster somewhere on the site', () => {
    const seen = new Set(
      PAGE_IDS.flatMap((page) => {
        return hauntsOf(page).map(({ monster }) => {
          return monster.src
        })
      })
    )

    expect(seen.size).toBe(MONSTERS.length)
  })

  it('gives two pages different hands', () => {
    const home = hauntsOf('home').map(({ monster }) => {
      return monster.src
    })
    const windows = hauntsOf('windows').map(({ monster }) => {
      return monster.src
    })

    expect(home).not.toStrictEqual(windows)
  })
})
