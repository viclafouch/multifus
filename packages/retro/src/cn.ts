import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const FONT_SIZES = [
  'banner',
  'chapter',
  'herald',
  'sign',
  'motto',
  'action',
  'bar',
  'deed',
  'legend',
  'tale',
  'aside',
  'mark',
  'log',
  'way'
] as const satisfies readonly string[]

const CONTAINERS = [
  'cluster',
  'tale',
  'lintel',
  'scene',
  'roll',
  'world',
  'loop',
  'blurb',
  'lead',
  'stage'
] as const satisfies readonly string[]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: FONT_SIZES }],
      'max-w': [{ 'max-w': CONTAINERS }]
    }
  }
})

export function cn(...inputs: readonly ClassValue[]) {
  return twMerge(clsx(...inputs))
}
