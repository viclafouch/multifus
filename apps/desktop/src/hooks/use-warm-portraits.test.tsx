import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { CLASS_PORTRAITS } from '@/constants/classes'
import { useWarmPortraits } from '@/hooks/use-warm-portraits'

const EVERY_PORTRAIT = Object.values(CLASS_PORTRAITS)
  .flatMap((byGender) => {
    return Object.values(byGender)
  })
  .toSorted((one, other) => {
    return one.localeCompare(other)
  })

const warmed = () => {
  const asked: string[] = []

  const SpyImage = function SpyImage(this: { src: string }) {
    Object.defineProperty(this, 'src', {
      set(source: string) {
        asked.push(source)
      }
    })
  }

  vi.stubGlobal('Image', SpyImage)

  return asked
}

const askedInOrder = (asked: readonly string[]) => {
  return asked.toSorted((one, other) => {
    return one.localeCompare(other)
  })
}

describe('useWarmPortraits', () => {
  it('demande les vingt-quatre portraits, hommes et femmes', () => {
    const asked = warmed()

    renderHook(() => {
      useWarmPortraits()
    })

    expect(askedInOrder(asked)).toStrictEqual(EVERY_PORTRAIT)
  })

  it('ne les redemande pas à chaque rendu', () => {
    const asked = warmed()

    const { rerender } = renderHook(() => {
      useWarmPortraits()
    })

    rerender()
    rerender()

    expect(asked).toHaveLength(EVERY_PORTRAIT.length)
  })
})
