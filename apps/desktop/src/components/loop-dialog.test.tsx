import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LoopDialog } from '@/components/loop-dialog'

const CAPTION = 'Ce que la vidéo montre'

const show = (source: string | null, onOpenChange = () => {}) => {
  render(
    <LoopDialog
      title="La roue des personnages"
      description="Ce que la vidéo raconte"
      caption={CAPTION}
      source={source}
      isOpen
      onOpenChange={onOpenChange}
    />
  )
}

describe('the dialog of a video', () => {
  it('sits above the page, never in the flow', () => {
    show('/faux.gif')

    expect([...screen.getByRole('dialog').classList]).toContain('fixed')
  })

  it('shows the video, and its title on top of it', () => {
    show('/faux.mp4')

    expect(screen.getByLabelText(CAPTION)).not.toBeNull()
    expect(
      screen.getByRole('heading', { name: 'La roue des personnages' })
    ).not.toBeNull()
  })

  it('plays the video in a loop, without sound and never going full screen', () => {
    show('/faux.mp4')

    const video = screen.getByLabelText<HTMLVideoElement>(CAPTION)

    expect(video.autoplay).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.muted).toBe(true)
    expect(video.playsInline).toBe(true)
  })

  it('closes on the cross, the only button laid on the video', () => {
    const close = vi.fn()

    show('/faux.mp4', close)

    expect(screen.getAllByRole('button')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(close.mock.calls[0]?.[0]).toBe(false)
  })

  it('shows only the caption while no video is recorded', () => {
    show(null)

    expect(screen.queryByLabelText(CAPTION)).toBeNull()
    expect(screen.getByText(CAPTION)).not.toBeNull()
  })

  it('holds the title back while the video is not playing', () => {
    show('/faux.mp4')

    expect(screen.getByRole('dialog').dataset.ready).toBeUndefined()

    fireEvent.playing(screen.getByLabelText(CAPTION))

    expect(screen.getByRole('dialog').dataset.ready).toBe('')
  })

  it('shows the title right away when no video is recorded', () => {
    show(null)

    expect(screen.getByRole('dialog').dataset.ready).toBe('')
  })

  it('shows the title anyway when the video breaks', () => {
    show('/faux.mp4')

    fireEvent.error(screen.getByLabelText(CAPTION))

    expect(screen.getByRole('dialog').dataset.ready).toBe('')
  })

  it('keeps its title under the mouse, whatever it does', () => {
    show('/faux.mp4')

    fireEvent.playing(screen.getByLabelText(CAPTION))
    fireEvent.pointerMove(screen.getByRole('dialog'))

    expect(
      screen.getByRole('heading', { name: 'La roue des personnages' })
    ).not.toBeNull()
    expect(screen.getByText('Ce que la vidéo raconte')).not.toBeNull()
  })
})
