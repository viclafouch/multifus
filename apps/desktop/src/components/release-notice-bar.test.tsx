import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReleaseNotice } from '@/@types/system'

const bridge = {
  dismissReleaseNotice: vi.fn(),
  openAboutLink: vi.fn(),
  openReleaseNotes: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { ReleaseNoticeBar } = await import('@/components/release-notice-bar')

const show = (notice: ReleaseNotice) => {
  render(<ReleaseNoticeBar notice={notice} run={() => {}} />)
}

const buttonNamed = (label: string) => {
  return screen.getByRole('button', { name: label })
}

const PUBLISHED = {
  kind: 'published',
  version: '0.3.0'
} as const satisfies ReleaseNotice

const ARRIVED = {
  kind: 'arrived',
  version: '0.3.0'
} as const satisfies ReleaseNotice

describe('the release notice', () => {
  it('leads to the download page of the version found, its notes, and to wait', () => {
    bridge.openAboutLink.mockResolvedValue(null)
    show(PUBLISHED)

    expect(screen.getByText('La version 0.3.0 est sortie')).not.toBeNull()

    fireEvent.click(buttonNamed('Télécharger'))
    fireEvent.click(buttonNamed('Plus tard'))

    expect(bridge.openAboutLink).toHaveBeenCalledWith('download')
    expect(bridge.dismissReleaseNotice).toHaveBeenCalledWith()
  })

  it('tells the version just installed and leads to its notes', () => {
    bridge.openReleaseNotes.mockResolvedValue(null)
    show(ARRIVED)

    expect(screen.getByText('Multifus est passé en 0.3.0')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Télécharger' })).toBeNull()

    fireEvent.click(buttonNamed('Voir le patch note'))
    fireEvent.click(buttonNamed('J’ai compris'))

    expect(bridge.openReleaseNotes).toHaveBeenCalledWith()
    expect(bridge.dismissReleaseNotice).toHaveBeenCalledWith()
  })
})
