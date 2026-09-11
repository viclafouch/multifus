import { cn } from '@multifus/retro'

type GlintProps = Readonly<{
  className?: string
}>

export const Glint = ({ className }: GlintProps) => {
  return (
    <span
      aria-hidden
      className={cn('glint block h-0.5 w-thread rounded-full', className)}
    />
  )
}
