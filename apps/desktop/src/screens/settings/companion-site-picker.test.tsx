import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { COMPANION_SITES, COMPANION_SITE_CARDS } from '@/constants/companion'
import { snapshotOf } from '@/test-doubles'
import COMPANION_SOURCE from '../../../src-tauri/src/app/companion.rs?raw'

const bridge = {
  setCompanionSite: vi.fn(async () => {
    return snapshotOf()
  })
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { CompanionSitePicker } =
  await import('@/screens/settings/companion-site-picker')

const run = vi.fn()

const site = (name: string) => {
  return screen.getByRole('button', { name: new RegExp(`^${name}`, 'u') })
}

describe('the choice of the companion site', () => {
  it('lights the site the shortcut opens', () => {
    render(<CompanionSitePicker current="solomonk" run={run} />)

    expect(site('Solomonk').getAttribute('aria-pressed')).toBe('true')
    expect(site('Dofus Retro Tools').getAttribute('aria-pressed')).toBe('false')
  })

  it('switches to the other site in one click', () => {
    render(<CompanionSitePicker current="dofusRetroTools" run={run} />)

    fireEvent.click(site('Solomonk'))

    expect(bridge.setCompanionSite).toHaveBeenCalledExactlyOnceWith('solomonk')
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('leaves the open site alone when its own button is pressed again', () => {
    render(<CompanionSitePicker current="dofusRetroTools" run={run} />)

    fireEvent.click(site('Dofus Retro Tools'))

    expect(bridge.setCompanionSite).not.toHaveBeenCalled()
    expect(run).not.toHaveBeenCalled()
  })

  it.each(COMPANION_SITES)(
    'shows for %s the address companion.rs opens',
    (shown) => {
      expect(COMPANION_SOURCE).toContain(
        `"https://${COMPANION_SITE_CARDS[shown].host}/`
      )
    }
  )
})
