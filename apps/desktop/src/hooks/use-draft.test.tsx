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
  it('starts from the text kept in the configuration', () => {
    const { result } = draftOf('Bon jeu à toi !')

    expect(result.current.draft).toBe('Bon jeu à toi !')
  })

  it('keeps what the user writes', () => {
    const { result } = draftOf('Bon jeu à toi !')

    act(() => {
      result.current.setDraft('Prix libre')
    })

    expect(result.current.draft).toBe('Prix libre')
  })

  it('does not hand back to a snapshot that says the same thing', () => {
    const { result, rerender } = draftOf('Bon jeu à toi !')

    act(() => {
      result.current.setDraft('Prix')
    })
    rerender({ text: 'Bon jeu à toi !' })

    expect(result.current.draft).toBe('Prix')
  })

  it('takes the text back when the configuration changes elsewhere', () => {
    const { result, rerender } = draftOf('Bon jeu à toi !')

    act(() => {
      result.current.setDraft('Prix')
    })
    rerender({ text: 'De rien' })

    expect(result.current.draft).toBe('De rien')
  })

  it('takes an empty text as a text like any other', () => {
    const { result, rerender } = draftOf('Bon jeu à toi !')

    rerender({ text: '' })

    expect(result.current.draft).toBe('')
  })
})
