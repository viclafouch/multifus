import { describe, expect, it } from 'vitest'
import { languageOf, offerOf } from '@/helpers/language'

describe('languageOf', () => {
  it('lit le français à la racine', () => {
    expect(languageOf('/')).toBe('fr')
    expect(languageOf('/roue-des-personnages')).toBe('fr')
  })

  it('lit la langue du premier segment', () => {
    expect(languageOf('/en')).toBe('en')
    expect(languageOf('/en/character-wheel')).toBe('en')
    expect(languageOf('/es/rueda-de-personajes')).toBe('es')
  })

  it('retombe sur le français devant un segment inconnu', () => {
    expect(languageOf('/de/etwas')).toBe('fr')
  })
})

describe('offerOf', () => {
  it('propose la langue du navigateur quand la page est dans une autre', () => {
    expect(offerOf({ spoken: ['fr-FR', 'fr'], current: 'en' })).toBe('fr')
    expect(offerOf({ spoken: ['es'], current: 'fr' })).toBe('es')
  })

  it('ne propose rien quand la page est déjà dans cette langue', () => {
    expect(offerOf({ spoken: ['fr-FR', 'en'], current: 'fr' })).toBeNull()
  })

  it('ne propose rien d’une langue que le site ne parle pas', () => {
    expect(offerOf({ spoken: ['de-DE', 'it'], current: 'fr' })).toBeNull()
  })

  it('ne propose rien à un navigateur sans préférence', () => {
    expect(offerOf({ spoken: [], current: 'fr' })).toBeNull()
  })

  it('saute les langues du navigateur que le site ne parle pas', () => {
    expect(offerOf({ spoken: ['de', 'it', 'es-MX'], current: 'en' })).toBe('es')
  })

  it('s’arrête à la première langue que le site parle', () => {
    expect(offerOf({ spoken: ['en-GB', 'fr'], current: 'es' })).toBe('en')
  })

  it('ne propose rien quand la préférence la mieux placée est la page', () => {
    expect(offerOf({ spoken: ['en-US', 'fr'], current: 'en' })).toBeNull()
  })

  it('lit une étiquette écrite en majuscules', () => {
    expect(offerOf({ spoken: ['ES-es'], current: 'fr' })).toBe('es')
  })

  it('lit une étiquette à trois parties', () => {
    expect(offerOf({ spoken: ['zh-Hant-TW', 'en-GB'], current: 'fr' })).toBe(
      'en'
    )
  })

  it('passe sur une étiquette que le navigateur a mal écrite', () => {
    expect(offerOf({ spoken: ['--', 'es'], current: 'fr' })).toBe('es')
  })
})
