import { describe, expect, it } from 'vitest'
import { languageOf, offerOf } from '@/helpers/language'

describe('languageOf', () => {
  it('reads French at the root', () => {
    expect(languageOf('/')).toBe('fr')
    expect(languageOf('/roue-des-personnages')).toBe('fr')
  })

  it('reads the language of the first segment', () => {
    expect(languageOf('/en')).toBe('en')
    expect(languageOf('/en/character-wheel')).toBe('en')
    expect(languageOf('/es/rueda-de-personajes')).toBe('es')
  })

  it('falls back on French in front of an unknown segment', () => {
    expect(languageOf('/de/etwas')).toBe('fr')
  })
})

describe('offerOf', () => {
  it('offers the language of the browser when the page is in another one', () => {
    expect(offerOf({ spoken: ['fr-FR', 'fr'], current: 'en' })).toBe('fr')
    expect(offerOf({ spoken: ['es'], current: 'fr' })).toBe('es')
  })

  it('offers nothing when the page is already in that language', () => {
    expect(offerOf({ spoken: ['fr-FR', 'en'], current: 'fr' })).toBeNull()
  })

  it('offers nothing of a language the site does not speak', () => {
    expect(offerOf({ spoken: ['de-DE', 'it'], current: 'fr' })).toBeNull()
  })

  it('offers nothing to a browser without a preference', () => {
    expect(offerOf({ spoken: [], current: 'fr' })).toBeNull()
  })

  it('skips the browser languages the site does not speak', () => {
    expect(offerOf({ spoken: ['de', 'it', 'es-MX'], current: 'en' })).toBe('es')
  })

  it('stops at the first language the site speaks', () => {
    expect(offerOf({ spoken: ['en-GB', 'fr'], current: 'es' })).toBe('en')
  })

  it('offers nothing when the best placed preference is the page', () => {
    expect(offerOf({ spoken: ['en-US', 'fr'], current: 'en' })).toBeNull()
  })

  it('reads a tag written in capitals', () => {
    expect(offerOf({ spoken: ['ES-es'], current: 'fr' })).toBe('es')
  })

  it('reads a tag with three parts', () => {
    expect(offerOf({ spoken: ['zh-Hant-TW', 'en-GB'], current: 'fr' })).toBe(
      'en'
    )
  })

  it('passes over a tag the browser wrote wrong', () => {
    expect(offerOf({ spoken: ['--', 'es'], current: 'fr' })).toBe('es')
  })
})
