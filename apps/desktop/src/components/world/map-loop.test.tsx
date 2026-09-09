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

describe('le bouton de la vidéo', () => {
  it('porte le même mot sur chaque écran qui a une vidéo', () => {
    const named = Object.values(MAP_LOOPS).filter((loop) => {
      return loop !== null
    })

    expect(named).toHaveLength(4)

    for (const loop of named) {
      const view = show({ loop })

      expect(
        screen.getByRole('button', { name: 'Voir la vidéo' })
      ).not.toBeNull()

      view.unmount()
    }
  })

  it('ouvre la vidéo de son écran, et pas une autre', async () => {
    show({ loop: MAP_LOOPS.runeTable })

    fireEvent.click(screen.getByRole('button', { name: 'Voir la vidéo' }))

    await findLateDialog()

    expect(loopShown(RUNE_TABLE_CAPTION)).not.toBeNull()
    expect(loopShown()).toBeNull()
  })
})

describe('la vidéo d’un écran', () => {
  it('vient d’elle-même à la première arrivée, et ne revient plus', async () => {
    show({ isSeen: false })

    expect(loopShown()).toBeNull()

    await findLateDialog()

    expect(loopShown()).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(bridge.setLoopSeen).toHaveBeenCalledExactlyOnceWith('wheel')
  })

  it('ne s’ouvre jamais toute seule une fois vue', async () => {
    show()

    await new Promise((resolve) => {
      setTimeout(resolve, PAST_THE_WAIT_MS)
    })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('se rouvre au bouton, sans plus rien enregistrer', async () => {
    show()

    fireEvent.click(screen.getByRole('button', { name: 'Voir la vidéo' }))

    await findLateDialog()

    expect(loopShown()).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(bridge.setLoopSeen).not.toHaveBeenCalled()
  })

  it('n’enregistre qu’une fois, même rouverte avant que Rust ait répondu', async () => {
    show({ isSeen: false })
    await findLateDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Voir la vidéo' }))

    await findLateDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(bridge.setLoopSeen).toHaveBeenCalledTimes(1)
  })

  it('ne revient pas toute seule quand on l’a déjà ouverte à la main', async () => {
    show({ isSeen: false })

    fireEvent.click(screen.getByRole('button', { name: 'Voir la vidéo' }))
    await findLateDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    await new Promise((resolve) => {
      setTimeout(resolve, PAST_THE_WAIT_MS)
    })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('arrive sans attendre pour qui a demandé moins de mouvement', () => {
    show({ isSeen: false, isStill: true })

    expect(loopShown()).not.toBeNull()
  })
})
