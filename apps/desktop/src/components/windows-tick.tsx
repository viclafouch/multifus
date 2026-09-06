import { Tick } from '@/components/retro/tick'
import { WindowsOnly } from '@/components/windows-only'
import { IS_APPLE } from '@/constants/keyboard'

type WindowsTickProps = Readonly<{
  checked: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
}>

export const WindowsTick = ({
  checked,
  label,
  onCheckedChange
}: WindowsTickProps) => {
  if (IS_APPLE) {
    return <WindowsOnly />
  }

  return (
    <Tick
      checked={checked}
      aria-label={label}
      onCheckedChange={onCheckedChange}
    />
  )
}
