import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Loop } from '@/@types/loop'
import { MAP_LOOPS } from '@/constants/loops'
import { OPENING_WAIT_MS } from '@/hooks/use-late-opening'
import { findLateDialog, pending } from '@/test-doubles'

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

describe('the video of a screen', () => {
  it('comes by itself on the first arrival, and never comes back', async () => {
    show({ isSeen: false })

    expect(loopShown()).toBeNull()

    await findLateDialog()

    expect(loopShown()).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(bridge.setLoopSeen).toHaveBeenCalledExactlyOnceWith('wheel')
  })

  it('never opens on its own once seen', async () => {
    show()

    await new Promise((resolve) => {
      setTimeout(resolve, PAST_THE_WAIT_MS)
    })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens again on the button, without recording anything more', async () => {
    show()

    fireEvent.click(screen.getByRole('button', { name: 'Voir la vidéo' }))

    await findLateDialog()

    expect(loopShown()).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(bridge.setLoopSeen).not.toHaveBeenCalled()
  })

  it('records only once, even reopened before Rust has answered', async () => {
    show({ isSeen: false })
    await findLateDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Voir la vidéo' }))

    await findLateDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(bridge.setLoopSeen).toHaveBeenCalledTimes(1)
  })

  it('does not come back on its own when it was already opened by hand', async () => {
    show({ isSeen: false })

    fireEvent.click(screen.getByRole('button', { name: 'Voir la vidéo' }))
    await findLateDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    await new Promise((resolve) => {
      setTimeout(resolve, PAST_THE_WAIT_MS)
    })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('comes without waiting for whoever asked for less motion', () => {
    show({ isSeen: false, isStill: true })

    expect(loopShown()).not.toBeNull()
  })
})
