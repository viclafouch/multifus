import { afterEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@lingui/core'
import { screen, waitFor } from '@testing-library/react'
import type { Language } from '@/@types/language'
import { SOURCE_LANGUAGE, speak } from '@/lib/i18n'

const bridge = {
  language: vi.fn<() => Promise<Language>>()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { mount } = await import('@/boot')

const Screen = () => {
  return <p>{i18n.locale}</p>
}

const root = () => {
  const element = document.createElement('div')

  element.id = 'root'
  document.body.append(element)

  return element
}

describe('the boot of an entry point', () => {
  afterEach(() => {
    speak(SOURCE_LANGUAGE)
    document.querySelector('#root')?.remove()
  })

  it('speaks the language Rust gives before rendering anything', async () => {
    bridge.language.mockResolvedValueOnce('en')
    root()

    mount('index.html', <Screen />)

    await waitFor(() => {
      expect(screen.getByText('en')).not.toBeNull()
    })
    expect(document.documentElement.lang).toBe('en')
  })

  it('falls back to French when Rust does not answer', async () => {
    bridge.language.mockRejectedValueOnce(new Error('no answer'))
    root()

    mount('index.html', <Screen />)

    await waitFor(() => {
      expect(screen.getByText(SOURCE_LANGUAGE)).not.toBeNull()
    })
    expect(document.documentElement.lang).toBe(SOURCE_LANGUAGE)
  })

  it('refuses to boot on a page without a root', () => {
    expect(() => {
      mount('banner.html', <Screen />)
    }).toThrow('banner.html')
  })
})
