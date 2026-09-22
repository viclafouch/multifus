import { describe, expect, it } from 'vitest'
import { PAGE_DECORS } from '@/constants/decors'

const WIDEST_UPRIGHT_SHARE = 3 / 4

const UPRIGHT_DECORS = [...new Set(Object.values(PAGE_DECORS))].filter(
  (decor) => {
    return decor !== null
  }
)

describe('the decor a phone held upright gets', () => {
  it.each(UPRIGHT_DECORS)(
    'shows everything the wide one shows there, from $wide.src',
    ({ wide, upright }) => {
      expect(upright.height).toBe(wide.height)
      expect(upright.width / upright.height).toBeGreaterThanOrEqual(
        WIDEST_UPRIGHT_SHARE
      )
      expect((wide.width - upright.width) % 2).toBe(0)
    }
  )
})
