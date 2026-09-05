import type { KnownCheck } from '@/@types/onboarding'

type StepStateProps = Readonly<{
  check: KnownCheck
  line: string
}>

export const StepState = ({ check, line }: StepStateProps) => {
  return (
    <p
      data-check={check}
      className="badge flex items-center gap-2.5 text-aside font-medium"
    >
      <span aria-hidden className="pip size-2 shrink-0 rounded-full" />
      {line}
    </p>
  )
}
