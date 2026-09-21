import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Loop } from '@/@types/loop'
import { MAP_LOOPS } from '@/constants/loops'
import { OPENING_WAIT_MS } from '@/hooks/use-late-opening'
import { findLateDialog, findLateButton, pending } from '@/test-doubles'

const bridge = {
  setLoopSeen: vi.fn(pending)
}

const motion = vi.hoisted(() => {
  return { matchIsStill: vi.fn() }
})

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

vi.mock(import('@/lib/motion'), async (importOriginal) => {
  return { ...(await importOriginal()), ...motion }
})

const { MapLoop } = await import('@/components/world/map-loop')

const PAST_THE_WAIT_MS = OPENING_WAIT_MS + 100

const WHEEL = MAP_LOOPS.characters

const WHEEL_CAPTION =
  'Les touches maintenues dans le jeu : la roue s’ouvre au milieu de l’écran, la tête visée s’allume, et sa fenêtre passe devant.'

const RUNE_TABLE_CAPTION =
  'Les touches frappées pendant une casse : le tableau s’ouvre sur le jeu, les poids sous les yeux, et la souris ne quitte pas l’atelier.'

type ShowParams = {
  readonly loop?: Loop
  readonly isSeen?: boolean
  readonly isStill?: boolean
}

const show = ({
  loop = WHEEL,
  isSeen = true,
  isStill = false
}: ShowParams = {}) => {
  motion.matchIsStill.mockReturnValue(isStill)

  return render(<MapLoop loop={loop} isSeen={isSeen} run={() => {}} />)
}

const loopShown = (caption = WHEEL_CAPTION) => {
  return screen.queryByLabelText(caption)
}

describe('the video button', () => {
  it('opens the video again without recording anything more', async () => {
    show()

    fireEvent.click(screen.getByRole('button', { name: 'Voir la vidéo' }))

    await findLateDialog()

    expect(loopShown()).not.toBeNull()
    expect(bridge.setLoopSeen).not.toHaveBeenCalled()
  })

  it('stands alone once the video is seen, with no corner and no dialog', async () => {
    show()

    await new Promise((resolve) => {
      setTimeout(resolve, PAST_THE_WAIT_MS)
    })

    expect(
      screen.queryByRole('button', { name: 'Voir la vidéo en grand' })
    ).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('carries the same word on every screen that has a video', () => {
    const named = Object.values(MAP_LOOPS).filter((loop) => {
      return loop !== null
    })

    expect(named).toHaveLength(6)

    for (const loop of named) {
      const view = show({ loop })

      expect(
        screen.getByRole('button', { name: 'Voir la vidéo' })
      ).not.toBeNull()

      view.unmount()
    }
  })

  it('opens the video of its screen, and not another one', async () => {
    show({ loop: MAP_LOOPS.runeTable })

    fireEvent.click(screen.getByRole('button', { name: 'Voir la vidéo' }))

    await findLateDialog()

    expect(loopShown(RUNE_TABLE_CAPTION)).not.toBeNull()
    expect(loopShown()).toBeNull()
  })
})

describe('the porthole of a first arrival', () => {
  const PEEK = 'Voir la vidéo en grand'

  it('plays in the corner instead of opening the dialog', async () => {
    show({ isSeen: false })

    await findLateButton(PEEK)

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(loopShown()).not.toBeNull()
    expect(bridge.setLoopSeen).not.toHaveBeenCalled()
  })

  it('plays once, without sound, and never on its own again', async () => {
    show({ isSeen: false })

    await findLateButton(PEEK)

    const video = screen.getByLabelText<HTMLVideoElement>(WHEEL_CAPTION)

    expect(video.autoplay).toBe(true)
    expect(video.loop).toBe(false)
    expect(video.muted).toBe(true)
  })

  it('opens the video in full on the corner, and records it as seen', async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue()

    show({ isSeen: false })

    fireEvent.click(await findLateButton(PEEK))

    await findLateDialog()

    expect(screen.queryByRole('button', { name: PEEK })).toBeNull()
    expect(bridge.setLoopSeen).toHaveBeenCalledExactlyOnceWith('wheel')

    play.mockRestore()
  })

  it('hands the big screen the second it had reached', async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue()

    show({ isSeen: false })

    const corner = await findLateButton(PEEK)
    const smallFilm = screen.getByLabelText<HTMLVideoElement>(WHEEL_CAPTION)

    smallFilm.currentTime = 6.25
    fireEvent.click(corner)

    await findLateDialog()

    const wideFilm = screen.getByLabelText<HTMLVideoElement>(WHEEL_CAPTION)

    fireEvent.loadedMetadata(wideFilm)

    expect(wideFilm.currentTime).toBe(6.25)

    play.mockRestore()
  })

  it('goes away on its cross, leaving the button behind', async () => {
    show({ isSeen: false, isStill: true })

    fireEvent.click(await findLateButton('Cacher l’aperçu'))

    expect(screen.queryByRole('button', { name: PEEK })).toBeNull()
    expect(screen.getByRole('button', { name: 'Voir la vidéo' })).not.toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(bridge.setLoopSeen).toHaveBeenCalledExactlyOnceWith('wheel')
  })

  it('goes away once the video has run to its end', async () => {
    show({ isSeen: false, isStill: true })

    await findLateButton(PEEK)

    fireEvent.ended(screen.getByLabelText(WHEEL_CAPTION))

    expect(screen.queryByRole('button', { name: PEEK })).toBeNull()
    expect(bridge.setLoopSeen).toHaveBeenCalledExactlyOnceWith('wheel')
  })

  it('peeks without waiting for whoever asked for less motion', () => {
    show({ isSeen: false, isStill: true })

    expect(screen.getByRole('button', { name: PEEK })).not.toBeNull()
  })
})
