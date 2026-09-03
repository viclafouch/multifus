import { t } from '@lingui/core/macro'

export const WindowsOnly = () => {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-micro font-medium tracking-micro text-muted-foreground uppercase">
      <span className="sr-only">{t`Uniquement sur Windows`}</span>
      <span aria-hidden>{t`Windows`}</span>
    </span>
  )
}
