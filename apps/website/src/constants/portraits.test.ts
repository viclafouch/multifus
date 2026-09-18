import { describe, expect, it } from 'vitest'
import { MENU_FEATURES } from '@/constants/pages'
import { FEATURE_PORTRAITS } from '@/constants/portraits'

describe('the portraits of the features menu', () => {
  it('gives every menu feature its own head', () => {
    const heads = MENU_FEATURES.map((feature) => {
      return FEATURE_PORTRAITS[feature]
    })

    expect(new Set(heads).size).toBe(MENU_FEATURES.length)
  })
})
