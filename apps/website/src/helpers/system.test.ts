import { describe, expect, it } from 'vitest'
import { systemOf } from '@/helpers/system'

const MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'

const WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'

const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36'

const LINUX =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'

describe('systemOf', () => {
  it('reconnaît les deux systèmes que Multifus sert', () => {
    expect(systemOf(MAC)).toBe('macos')
    expect(systemOf(WINDOWS)).toBe('windows')
  })

  it('ne met rien en avant sur un téléphone, que l’iPhone se dise Mac ou non', () => {
    expect(systemOf(IPHONE)).toBeNull()
    expect(systemOf(ANDROID)).toBeNull()
  })

  it('ne met rien en avant sur un système que Multifus ne sert pas', () => {
    expect(systemOf(LINUX)).toBeNull()
    expect(systemOf('')).toBeNull()
  })
})
