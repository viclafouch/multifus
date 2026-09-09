import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { LoopsSeen } from '@/@types/loop'
import type { ScreenName } from '@/@types/snapshot'
import { MAPS } from '@/constants/world'
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

const { MapFrame } = await import('@/components/world/map-frame')

const MAPS_WITH_A_LOOP = ['characters', 'autoFocus', 'walk', 'runeTable']

const BUTTON = 'Voir la vidéo'

const frameOf = (map: ScreenName, loopsSeen: LoopsSeen) => {
  return (
    <MapFrame map={map} loopsSeen={loopsSeen} onLeave={() => {}} run={() => {}}>
      <p>La map</p>
    </MapFrame>
  )
}

const SEEN: LoopsSeen = {
  wheel: true,
  walk: true,
  runeTable: true,
  autoFocus: true
}

describe('le cadre d’une map', () => {
  it('pose le bouton de la vidéo au même endroit, sur les seules maps qui en ont une', () => {
    motion.matchIsStill.mockReturnValue(false)

    for (const map of MAPS) {
      const view = render(frameOf(map, SEEN))
      const isOffered = screen.queryByRole('button', { name: BUTTON }) !== null

      expect([map, isOffered]).toStrictEqual([
        map,
        MAPS_WITH_A_LOOP.includes(map)
      ])

      view.unmount()
    }
  })

  it('rend sa vidéo neuve à la map suivante, qui s’ouvre et s’enregistre à son tour', async () => {
    motion.matchIsStill.mockReturnValue(true)

    const view = render(frameOf('characters', { ...SEEN, walk: false }))

    expect(screen.queryByRole('dialog')).toBeNull()

    view.rerender(frameOf('walk', { ...SEEN, walk: false }))

    await findLateDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(bridge.setLoopSeen).toHaveBeenCalledExactlyOnceWith('walk')
  })
})
