import { useKeyLabels } from '@/components/key-labels-provider'
import { acceleratorParts, keyLabel } from '@/helpers/accelerator'

type KeyStoneProps = Readonly<{
  accelerator: string
}>

export const KeyStone = ({ accelerator }: KeyStoneProps) => {
  const printed = useKeyLabels()

  return (
    <span className="flex items-center gap-0.5">
      {acceleratorParts(accelerator).map((token) => {
        return (
          <kbd
            key={token}
            className="plaque inline-flex h-4 min-w-4 items-center justify-center rounded-xs px-1 font-carve text-mark leading-none tracking-wide uppercase"
          >
            {keyLabel(token, printed)}
          </kbd>
        )
      })}
    </span>
  )
}
