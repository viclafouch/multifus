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

const show = (isAmbient: boolean) => {
  return render(
    <I18nProvider i18n={SPEAKERS.fr}>
      <LoopPlate loop="home" caption={CAPTION} isAmbient={isAmbient} />
    </I18nProvider>
  )
}

describe('la plaque de boucle', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', watchMotion)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('laisse la boucle à l’arrêt tant que personne ne la lance', () => {
    const play = spyOnPlayback()

    show(false)

    expect(play).not.toHaveBeenCalled()
  })

  it('reste dans la page sur iOS plutôt que de passer en plein écran', () => {
    spyOnPlayback()

    const { container } = show(false)
    const loop = container.querySelector('video')

    expect(loop?.hasAttribute('playsinline')).toBe(true)
    expect(loop?.muted).toBe(true)
  })

  it('offre toute la surface de la boucle au clic, badge à l’appui', () => {
    const play = spyOnPlayback()

    show(false)

    const surface = screen.getByRole('button', { name: 'Lire' })

    expect(surface.querySelector('svg')).not.toBeNull()

    surface.click()

    expect(play).toHaveBeenCalledWith()
  })

  it('lance la boucle d’ambiance d’entrée, sous sa seule pastille', () => {
    const play = spyOnPlayback()

    show(true)

    expect(play).toHaveBeenCalledWith()
    expect(
      screen.getByRole('button', { name: 'Lire' }).querySelector('svg')
    ).toBeNull()
  })
})
