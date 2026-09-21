import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LoopDialog } from '@/components/loop-dialog'

const CAPTION = 'Ce que la vidéo montre'

const show = (
  source: string | null,
  onOpenChange = () => {},
  from: number | null = null
) => {
  render(
    <LoopDialog
      title="La roue des personnages"
      description="Ce que la vidéo raconte"
      caption={CAPTION}
      source={source}
      from={from}
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

  it('waits to be asked, then loops without sound and never goes full screen', () => {
    show('/faux.mp4')

    const video = screen.getByLabelText<HTMLVideoElement>(CAPTION)

    expect(video.autoplay).toBe(false)
    expect(video.loop).toBe(true)
    expect(video.muted).toBe(true)
    expect(video.playsInline).toBe(true)
  })

  it('carries on where the corner left it, running rather than waiting', () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue()

    show('/faux.mp4', () => {}, 4.5)

    const video = screen.getByLabelText<HTMLVideoElement>(CAPTION)

    fireEvent.loadedMetadata(video)

    expect(video.currentTime).toBe(4.5)
    expect(play).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog').dataset.ready).toBe('')

    play.mockRestore()
  })

  it('lays a play button on the video, and names what it will do', () => {
    show('/faux.mp4')

    expect(screen.getByRole('button', { name: 'Lire la vidéo' })).not.toBeNull()
  })

  it('plays on that button, which then offers to pause', () => {
    show('/faux.mp4')

    const video = screen.getByLabelText<HTMLVideoElement>(CAPTION)
    const play = vi.spyOn(video, 'play').mockResolvedValue()

    fireEvent.click(screen.getByRole('button', { name: 'Lire la vidéo' }))

    expect(play).toHaveBeenCalledTimes(1)

    Object.defineProperty(video, 'paused', { value: false, configurable: true })
    fireEvent.play(video)

    expect(
      screen.getByRole('button', { name: 'Mettre la vidéo en pause' })
    ).not.toBeNull()
  })

  it('closes on the cross, the only button beside the play one', () => {
    const close = vi.fn()

    show('/faux.mp4', close)

    expect(screen.getAllByRole('button')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(close.mock.calls[0]?.[0]).toBe(false)
  })

  it('shows only the caption while no video is recorded', () => {
    show(null)

    expect(screen.queryByLabelText(CAPTION)).toBeNull()
    expect(screen.getByText(CAPTION)).not.toBeNull()
  })

  it('holds the title back while the video says nothing of itself', () => {
    show('/faux.mp4')

    expect(screen.getByRole('dialog').dataset.ready).toBeUndefined()

    fireEvent.loadedMetadata(screen.getByLabelText(CAPTION))

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

    fireEvent.loadedMetadata(screen.getByLabelText(CAPTION))
    fireEvent.pointerMove(screen.getByRole('dialog'))

    expect(
      screen.getByRole('heading', { name: 'La roue des personnages' })
    ).not.toBeNull()
    expect(screen.getByText('Ce que la vidéo raconte')).not.toBeNull()
  })
})
