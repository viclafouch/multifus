import { describe, expect, it, vi } from 'vitest'
import { i18n } from '@lingui/core'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { WayList } from '@/components/world/way-list'
import { MAP_NAMES, MAPS } from '@/constants/world'

describe('les chemins de la clairière', () => {
  it('nomme chaque map, et le nom reste le nom du bouton', () => {
    render(<WayList asking={null} onGo={() => {}} />)

    for (const map of MAPS) {
      expect(
        screen.getByRole('button', { name: i18n._(MAP_NAMES[map]) })
      ).not.toBeNull()
    }
  })

  it('dit quelle map on a prise', () => {
    const onGo = vi.fn()
    render(<WayList asking={null} onGo={onGo} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Roue des personnages' })
    )

    expect(onGo).toHaveBeenCalledWith('wheel')
  })

  it('ne marque « À régler » que sur la map qui le demande', () => {
    render(<WayList asking="settings" onGo={() => {}} />)

    const settings = screen.getByRole('button', { name: /^Paramètres/u })

    expect(within(settings).getByText('À régler')).not.toBeNull()
    expect(screen.getAllByText('À régler')).toHaveLength(1)
  })
})
