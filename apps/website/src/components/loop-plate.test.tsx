import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { IDLE_AFTER } from '@multifus/retro'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LoopPlate } from '@/components/loop-plate'
import { captionOf } from '@/constants/loops'
import { SPEAKERS } from '@/lib/i18n'

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
      <LoopPlate loop="home" isAuto={isAuto} />
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

  it('says out loud what the loop shows', () => {
    spyOnPlayback()

    const { container } = show(false)

    expect(container.querySelector('video')?.getAttribute('aria-label')).toBe(
      SPEAKERS.fr._(captionOf('home'))
    )
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

  it('starts the loop of the entrance with its curtain already out', () => {
    const play = spyOnPlayback()

    show(true)

    expect(play).toHaveBeenCalledWith()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeDefined()
  })

  it('holds the loop of the entrance until the page has loaded', () => {
    const play = spyOnPlayback()
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading')

    show(true)

    expect(play).not.toHaveBeenCalled()

    window.dispatchEvent(new Event('load'))

    expect(play).toHaveBeenCalledWith()
  })

  it('sends the curtain to sleep once the pointer stops moving', () => {
    vi.useFakeTimers()
    spyOnPlayback()

    show(true)

    const surface = screen.getByRole('button', { name: 'Pause' })

    act(() => {
      vi.advanceTimersByTime(IDLE_AFTER)
    })

    expect(surface.hasAttribute('data-idle')).toBe(true)

    fireEvent.pointerMove(surface)

    expect(surface.hasAttribute('data-idle')).toBe(false)

    vi.useRealTimers()
  })

  it('leaves the curtain awake while the loop stays stopped', () => {
    vi.useFakeTimers()
    spyOnPlayback()

    show(false)

    const surface = screen.getByRole('button', { name: 'Lire' })

    act(() => {
      vi.advanceTimersByTime(IDLE_AFTER)
    })

    expect(surface.hasAttribute('data-idle')).toBe(false)

    vi.useRealTimers()
  })
})
