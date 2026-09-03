import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { APPLE_AGENT, WINDOWS_AGENT, speakFrench } from '@/test-doubles'

const exampleOn = async (agent: string) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: agent })

  await speakFrench()

  const { CharactersPanel } =
    await import('@/screens/shortcuts/characters-panel')

  render(
    <CharactersPanel
      characters={[]}
      quickReplies={[]}
      editing={null}
      actions={{
        handleShortcut: () => {},
        handleOpen: () => {},
        handleClose: () => {}
      }}
    />
  )

  return screen.getByText(/sa fenêtre passe devant/u)
}

describe('l’exemple donné aux raccourcis de personnage', () => {
  it('propose une touche de fonction seule sur Windows, où elle se pose', async () => {
    const example = await exampleOn(WINDOWS_AGENT)

    expect(example.textContent).toContain('F1')
  })

  it('n’en promet pas sur le Mac, qui les refuse sans modificateur', async () => {
    const example = await exampleOn(APPLE_AGENT)

    expect(example.textContent).not.toContain('F1')
    expect(example.textContent).toContain('Ctrl+Maj+1')
  })
})
