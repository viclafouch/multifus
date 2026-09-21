import { describe, expect, it, vi } from 'vitest'
import { i18n } from '@lingui/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { WayList } from '@/components/world/way-list'
import { MAP_NAMES, MAPS } from '@/constants/world'

describe('the ways of the clearing', () => {
  it('names each map, and the name stays the name of the button', () => {
    render(<WayList onGo={() => {}} />)

    for (const map of MAPS) {
      expect(
        screen.getByRole('button', { name: i18n._(MAP_NAMES[map]) })
      ).not.toBeNull()
    }
  })

  it('says which map was taken', () => {
    const onGo = vi.fn()
    render(<WayList onGo={onGo} />)

    fireEvent.click(screen.getByRole('button', { name: 'Déplacement rapide' }))

    expect(onGo).toHaveBeenCalledWith('walk')
  })
})
