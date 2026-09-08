import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const FONT_SIZES = [
  'chapter',
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
  'loop'
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

export const ignore = () => {}

export const errorMessage = (error: unknown) => {
  const carriesMessage =
    typeof error === 'object' && error !== null && 'message' in error

  return carriesMessage ? String(error.message) : String(error)
}
