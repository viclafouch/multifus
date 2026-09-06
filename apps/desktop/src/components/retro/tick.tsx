import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cn } from '@/lib/utils'

export const Tick = ({ className, ...props }: SwitchPrimitive.Root.Props) => {
  return (
    <SwitchPrimitive.Root
      data-slot="tick"
      className={cn('tick size-tick shrink-0 sighted', className)}
      {...props}
    />
  )
}
