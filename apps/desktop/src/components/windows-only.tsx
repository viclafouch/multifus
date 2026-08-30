import { strings } from '@/constants/strings'

export const WindowsOnly = () => {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-micro font-medium tracking-micro text-muted-foreground uppercase">
      <span className="sr-only">{strings.settings.windowsOnlyLabel}</span>
      <span aria-hidden>{strings.settings.windowsOnly}</span>
    </span>
  )
}
