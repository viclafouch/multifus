import { t } from '@lingui/core/macro'

export const WindowsOnly = () => {
  return (
    <span className="plaque rounded-xs px-1.5 py-px font-carve text-mark tracking-widest text-khaki/70 uppercase">
      <span className="sr-only">{t`Uniquement sur Windows`}</span>
      <span aria-hidden>{t`Windows`}</span>
    </span>
  )
}
