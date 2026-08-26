import { Switch } from '@/components/ui/switch'
import { WindowsOnly } from '@/components/windows-only'
import { IS_APPLE } from '@/constants/keyboard'

type WindowsSwitchProps = Readonly<{
  checked: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
}>

export const WindowsSwitch = ({
  checked,
  label,
  onCheckedChange
}: WindowsSwitchProps) => {
  if (IS_APPLE) {
    return <WindowsOnly />
  }

  return (
    <Switch
      checked={checked}
      aria-label={label}
      onCheckedChange={onCheckedChange}
    />
  )
}
