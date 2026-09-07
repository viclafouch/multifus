import { cn } from '@/lib/utils'

type ShadeEdge = 'top' | 'bottom'

type ShadeProps = Readonly<{
  edge: ShadeEdge
}>

const SHADE_EDGES = {
  top: 'top-0',
  bottom: 'fall-up bottom-ledger'
} as const satisfies Record<ShadeEdge, string>

export const Shade = ({ edge }: ShadeProps) => {
  return (
    <div
      aria-hidden
      className={cn(
        'fall pointer-events-none absolute inset-x-0 z-20 h-fall bg-iron/95',
        SHADE_EDGES[edge]
      )}
    />
  )
}
