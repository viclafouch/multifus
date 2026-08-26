import { keyLabel } from '@/helpers/accelerator'

type KeyCapProps = Readonly<{
  token: string
}>

export const KeyCap = ({ token }: KeyCapProps) => {
  return (
    <kbd className="keycap inline-flex h-cap min-w-cap items-center justify-center rounded-sm border border-border bg-card px-1.5 font-mono text-mini leading-none font-medium text-foreground/90">
      {keyLabel(token)}
    </kbd>
  )
}
