import { TriangleAlert } from 'lucide-react'
import type { Check } from '@/@types/onboarding'

type StepDiscProps = Readonly<{
  rank: number
  check: Check
}>

export const StepDisc = ({ rank, check }: StepDiscProps) => {
  return (
    <span
      aria-hidden
      data-blocked={check === 'blocked' ? '' : undefined}
      className="toned tone-quiet flex size-medallion shrink-0 items-center justify-center rounded-full border font-mono text-mini data-blocked:tone-blocked"
    >
      {check === 'blocked' ? (
        <TriangleAlert className="size-3.5" strokeWidth={2.2} />
      ) : (
        rank
      )}
    </span>
  )
}
