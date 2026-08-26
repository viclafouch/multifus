import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDraft } from '@/hooks/use-draft'

const draftOf = (stored: string) => {
  return renderHook(
    ({ text }) => {
      return useDraft(text)
    },
    { initialProps: { text: stored } }
  )
}

describe('useDraft', () => {
  it('part du texte rangé dans la configuration', () => {
    const { result } = draftOf('Bon jeu à toi !')

    expect(result.current.draft).toBe('Bon jeu à toi !')
  })

  it('garde ce que l’utilisateur écrit', () => {
    const { result } = draftOf('Bon jeu à toi !')

    act(() => {
      result.current.setDraft('Prix libre')
    })

    expect(result.current.draft).toBe('Prix libre')
  })

  it('ne rend pas la main à un instantané qui dit la même chose', () => {
    const { result, rerender } = draftOf('Bon jeu à toi !')

    act(() => {
      result.current.setDraft('Prix')
    })
    rerender({ text: 'Bon jeu à toi !' })

    expect(result.current.draft).toBe('Prix')
  })

  it('reprend le texte quand la configuration change ailleurs', () => {
    const { result, rerender } = draftOf('Bon jeu à toi !')

    act(() => {
      result.current.setDraft('Prix')
    })
    rerender({ text: 'De rien' })

    expect(result.current.draft).toBe('De rien')
  })

  it('accepte un texte vide comme un texte comme un autre', () => {
    const { result, rerender } = draftOf('Bon jeu à toi !')

    rerender({ text: '' })

    expect(result.current.draft).toBe('')
  })
})
