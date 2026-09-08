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

describe('le dialogue d’une vidéo', () => {
  it('se pose au-dessus de la page, jamais dans le flux', () => {
    show('/faux.gif')

    expect([...screen.getByRole('dialog').classList]).toContain('fixed')
  })

  it('montre la vidéo, et son titre par-dessus', () => {
    show('/faux.mp4')

    expect(screen.getByLabelText(CAPTION)).not.toBeNull()
    expect(
      screen.getByRole('heading', { name: 'La roue des personnages' })
    ).not.toBeNull()
  })

  it('joue la vidéo en boucle, sans son et sans jamais passer en plein écran', () => {
    show('/faux.mp4')

    const video = screen.getByLabelText<HTMLVideoElement>(CAPTION)

    expect(video.autoplay).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.muted).toBe(true)
    expect(video.playsInline).toBe(true)
  })

  it('se ferme à la croix, seul bouton posé sur la vidéo', () => {
    const close = vi.fn()

    show('/faux.mp4', close)

    expect(screen.getAllByRole('button')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(close.mock.calls[0]?.[0]).toBe(false)
  })

  it('ne montre que la légende tant qu’aucune vidéo n’est enregistrée', () => {
    show(null)

    expect(screen.queryByLabelText(CAPTION)).toBeNull()
    expect(screen.getByText(CAPTION)).not.toBeNull()
  })

  it('retient le titre tant que la vidéo ne joue pas', () => {
    show('/faux.mp4')

    expect(screen.getByRole('dialog').dataset.ready).toBeUndefined()

    fireEvent.playing(screen.getByLabelText(CAPTION))

    expect(screen.getByRole('dialog').dataset.ready).toBe('')
  })

  it('montre le titre tout de suite quand aucune vidéo n’est enregistrée', () => {
    show(null)

    expect(screen.getByRole('dialog').dataset.ready).toBe('')
  })

  it('montre le titre quand même quand la vidéo casse', () => {
    show('/faux.mp4')

    fireEvent.error(screen.getByLabelText(CAPTION))

    expect(screen.getByRole('dialog').dataset.ready).toBe('')
  })

  it('garde son titre sous la souris, quoi qu’elle fasse', () => {
    show('/faux.mp4')

    fireEvent.playing(screen.getByLabelText(CAPTION))
    fireEvent.pointerMove(screen.getByRole('dialog'))

    expect(
      screen.getByRole('heading', { name: 'La roue des personnages' })
    ).not.toBeNull()
    expect(screen.getByText('Ce que la vidéo raconte')).not.toBeNull()
  })
})
