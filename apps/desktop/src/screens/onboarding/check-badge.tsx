import type { LucideIcon } from 'lucide-react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import type { KnownCheck, Step } from '@/@types/onboarding'
import { checkLine } from '@/helpers/onboarding'

const CHECK_MARKS = {
  ready: CircleCheck,
  blocked: CircleAlert
} as const satisfies Record<KnownCheck, LucideIcon>

type CheckBadgeProps = Readonly<{
  step: Step
  check: KnownCheck
}>

export const CheckBadge = ({ step, check }: CheckBadgeProps) => {
  const Mark = CHECK_MARKS[check]

  return (
    <p
      data-check={check}
      className="toned flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-note data-[check=blocked]:tone-blocked data-[check=ready]:tone-live"
    >
      <Mark className="size-glyph shrink-0" strokeWidth={1.9} aria-hidden />
      {checkLine(step, check)}
    </p>
  )
}
