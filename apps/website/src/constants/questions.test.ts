/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { PageId } from '@/@types/page'
import { PAGE_IDS } from '@/constants/pages'
import { PAGE_QUESTIONS, QUESTIONS } from '@/constants/questions'
import { alphabetical } from '@/test-order'

type Screened = Readonly<{
  page: PageId
  screen: string
}>

const SCREENS = [
  { page: 'download', screen: 'download-screen.tsx' },
  { page: 'mac', screen: 'mac-screen.tsx' },
  { page: 'windows', screen: 'windows-screen.tsx' }
] as const satisfies readonly Screened[]

const TABLED_PAGES = ['faq'] as const satisfies readonly PageId[]

const ASKED = /QUESTIONS\.(\w+)\.ask/gu

const shownBy = (screen: string) => {
  const source = readFileSync(
    join(import.meta.dirname, '..', 'screens', screen),
    'utf8'
  )

  return [...source.matchAll(ASKED)].map((found) => {
    return found[1]
  })
}

const ASKING = PAGE_IDS.filter((page) => {
  return PAGE_QUESTIONS[page] !== null
})

const EVERY_ASKED = PAGE_IDS.flatMap((page) => {
  return PAGE_QUESTIONS[page] ?? []
})

describe('the questions of a page', () => {
  it.each(SCREENS)(
    'shows on $page the ones the markup announces, in the same order',
    ({ page, screen }) => {
      expect(shownBy(screen)).toStrictEqual([...PAGE_QUESTIONS[page]])
    }
  )

  it('knows a screen for every page that asks something', () => {
    const screened = SCREENS.map(({ page }) => {
      return page
    })

    expect([...screened, ...TABLED_PAGES].toSorted(alphabetical)).toStrictEqual(
      ASKING.toSorted(alphabetical)
    )
  })

  it('holds no question it never asks, and asks none it does not hold', () => {
    const asked = new Set(EVERY_ASKED)

    expect([...asked].toSorted(alphabetical)).toStrictEqual(
      Object.keys(QUESTIONS).toSorted(alphabetical)
    )
  })

  it.each(Object.entries(QUESTIONS))(
    'gives %s at least one line of answer',
    (_id, { answer }) => {
      expect(answer.length).toBeGreaterThan(0)
    }
  )
})
