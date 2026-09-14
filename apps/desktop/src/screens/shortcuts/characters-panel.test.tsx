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

  return screen.getByText(/il passe devant/u)
}

describe('the example given to the character shortcuts', () => {
  it('offers a function key alone on Windows, where it lands', async () => {
    const example = await exampleOn(WINDOWS_AGENT)

    expect(example.textContent).toContain('F1')
  })

  it('promises none on the Mac, which refuses them without a modifier', async () => {
    const example = await exampleOn(APPLE_AGENT)

    expect(example.textContent).not.toContain('F1')
    expect(example.textContent).toContain('Ctrl+Maj+1')
  })
})
