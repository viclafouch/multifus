import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { cleanup, render, screen } from '@testing-library/react'
import { LoopPlate } from '@/components/loop-plate'
import { SPEAKERS } from '@/lib/i18n'

const CAPTION = 'Les six mécanismes à l’œuvre dans le jeu'

const watchMotion = () => {
  return {
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {}
  }
}

const spyOnPlayback = () => {
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockReturnValue()

  return vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
}

const show = (isAuto: boolean) => {
  return render(
    <I18nProvider i18n={SPEAKERS.fr}>
      <LoopPlate loop="home" caption={CAPTION} isAuto={isAuto} />
    </I18nProvider>
  )
}

describe('the loop plate', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', watchMotion)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('leaves the loop stopped while nobody starts it', () => {
    const play = spyOnPlayback()

    show(false)

    expect(play).not.toHaveBeenCalled()
  })

  it('stays in the page on iOS rather than going full screen', () => {
    spyOnPlayback()

    const { container } = show(false)
    const loop = container.querySelector('video')

    expect(loop?.hasAttribute('playsinline')).toBe(true)
    expect(loop?.muted).toBe(true)
  })

  it('offers the whole surface of the loop to the click, badge included', () => {
    const play = spyOnPlayback()

    show(false)

    const surface = screen.getByRole('button', { name: 'Lire' })

    expect(surface.querySelector('svg')).not.toBeNull()

    surface.click()

    expect(play).toHaveBeenCalledWith()
  })

  it('starts the loop of the entrance on its own, behind the same curtain', () => {
    const play = spyOnPlayback()

    show(true)

    expect(play).toHaveBeenCalledWith()
    expect(
      screen.getByRole('button', { name: 'Lire' }).querySelector('svg')
    ).not.toBeNull()
  })
})
