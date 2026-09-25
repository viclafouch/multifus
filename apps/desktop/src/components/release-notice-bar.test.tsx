import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReleaseNotice, UpdateStatus } from '@/@types/system'

const bridge = {
  dismissReleaseNotice: vi.fn(),
  installUpdate: vi.fn(),
  openReleaseNotes: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { ReleaseNoticeBar } = await import('@/components/release-notice-bar')

type ShowParams = {
  readonly notice: ReleaseNotice
  readonly update?: UpdateStatus
}

const show = ({ notice, update = { kind: 'upToDate' } }: ShowParams) => {
  render(<ReleaseNoticeBar notice={notice} update={update} run={() => {}} />)
}

const buttonNamed = (label: string) => {
  return screen.getByRole('button', { name: label })
}

const READY = {
  kind: 'ready',
  version: '0.3.0'
} as const satisfies ReleaseNotice

const ARRIVED = {
  kind: 'arrived',
  version: '0.3.0'
} as const satisfies ReleaseNotice

describe('the release notice', () => {
  it('offers the version found, its notes, and to wait', () => {
    show({ notice: READY, update: { kind: 'available', version: '0.3.0' } })

    expect(screen.getByText('La version 0.3.0 est prête')).not.toBeNull()

    fireEvent.click(buttonNamed('Installer'))
    fireEvent.click(buttonNamed('Plus tard'))

    expect(bridge.installUpdate).toHaveBeenCalledWith()
    expect(bridge.dismissReleaseNotice).toHaveBeenCalledWith()
  })

  it('shows the download, with neither a second install nor a way to wait', () => {
    show({ notice: READY, update: { kind: 'installing' } })

    expect(screen.getByText('Téléchargement en cours…')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Installer' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Plus tard' })).toBeNull()
  })

  it('says why an install failed and installs again on the retry', () => {
    show({ notice: READY, update: { kind: 'failed', detail: 'coupure' } })

    expect(screen.getByText('La mise à jour a échoué : coupure')).not.toBeNull()

    fireEvent.click(buttonNamed('Réessayer'))

    expect(bridge.installUpdate).toHaveBeenCalledWith()
  })

  it('tells the version just installed and leads to its notes', () => {
    bridge.openReleaseNotes.mockResolvedValue(null)
    show({ notice: ARRIVED })

    expect(screen.getByText('Multifus est passé en 0.3.0')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Installer' })).toBeNull()

    fireEvent.click(buttonNamed('Voir le patch note'))
    fireEvent.click(buttonNamed('J’ai compris'))

    expect(bridge.openReleaseNotes).toHaveBeenCalledWith()
    expect(bridge.dismissReleaseNotice).toHaveBeenCalledWith()
  })
})
