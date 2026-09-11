import { cn } from '@multifus/retro'
import type { Gender } from '@/@types/roster'

const SIGIL_GLYPHS = {
  male: '♂',
  female: '♀'
} as const satisfies Record<Gender, string>

const SIGIL_SIGNS = {
  male: 'sign-male',
  female: 'sign-female'
} as const satisfies Record<Gender, string>

type GenderSigilProps = Readonly<{
  gender: Gender
  className?: string
}>

export const GenderSigil = ({ gender, className }: GenderSigilProps) => {
  return (
    <span
      aria-hidden
      className={cn(
        'sigil flex size-sigil items-center justify-center rounded-full border text-bar leading-none transition-row',
        SIGIL_SIGNS[gender],
        className
      )}
    >
      {SIGIL_GLYPHS[gender]}
    </span>
  )
}
