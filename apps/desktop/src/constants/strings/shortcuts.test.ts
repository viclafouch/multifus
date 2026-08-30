import { describe, expect, it, vi } from 'vitest'
import { APPLE_AGENT, WINDOWS_AGENT } from '@/test-doubles'

const wordsOn = async (agent: string) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: agent })

  const { SHORTCUTS_STRINGS } = await import('@/constants/strings/shortcuts')

  return SHORTCUTS_STRINGS.shortcuts
}

describe('l’exemple donné aux raccourcis de personnage', () => {
  it('propose une touche de fonction seule sur Windows, où elle se pose', async () => {
    const words = await wordsOn(WINDOWS_AGENT)

    expect(words.charactersDescription).toContain('F1')
  })

  it('n’en promet pas sur le Mac, qui les refuse sans modificateur', async () => {
    const words = await wordsOn(APPLE_AGENT)

    expect(words.charactersDescription).not.toContain('F1')
    expect(words.charactersDescription).toContain('Ctrl+Maj+1')
  })
})
