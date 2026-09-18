import { describe, expect, it } from 'vitest'
import { MENU_FEATURES } from '@/constants/pages'
import { PAGE_PORTRAITS } from '@/constants/portraits'

describe('the portraits of the features', () => {
  it('gives every feature its own head', () => {
    const heads = MENU_FEATURES.map((feature) => {
      return PAGE_PORTRAITS[feature]
    })

    expect(new Set(heads).size).toBe(MENU_FEATURES.length)
  })
})
