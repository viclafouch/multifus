import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react'

export const HINGE_PANEL =
  'canopy absolute top-full left-0 z-50 gap-1 rounded-xl p-2'

export const HINGE_ENTRY =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate/50'

export const HINGE_NAME =
  'font-carve text-deed tracking-wide text-cream uppercase'

type HingeTabProps = Readonly<{
  label: MessageDescriptor
  isHere: boolean
}>

export const HingeTab = ({ label, isHere }: HingeTabProps) => {
  const { i18n } = useLingui()

  return (
    <summary
      aria-current={isHere ? 'location' : undefined}
      className="tab sighted flex cursor-pointer list-none items-center gap-2 text-deed"
    >
      {i18n._(label)}
      <span aria-hidden className="askmark" />
    </summary>
  )
}
