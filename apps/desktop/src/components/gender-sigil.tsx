import { Mars, Venus, type LucideIcon } from 'lucide-react'
import type { Gender } from '@/@types/roster'
import { cn } from '@/lib/utils'

const SIGIL_GLYPHS = {
  male: Mars,
  female: Venus
} as const satisfies Record<Gender, LucideIcon>

const SIGIL_TONES = {
  male: 'sign-male',
  female: 'sign-female'
} as const satisfies Record<Gender, string>

type GenderSigilProps = Readonly<{
  gender: Gender
  className?: string
}>

export const GenderSigil = ({ gender, className }: GenderSigilProps) => {
  const Glyph = SIGIL_GLYPHS[gender]

  return (
    <span
      aria-hidden
      className={cn(
        'sigil flex size-sigil items-center justify-center rounded-full border transition-row',
        SIGIL_TONES[gender],
        className
      )}
    >
      <Glyph className="size-glyph" strokeWidth={2} />
    </span>
  )
}
