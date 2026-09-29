import React from 'react'
import { Button } from '@multifus/retro'

type PickChipProps = Readonly<{
  isPicked: boolean
  detail: string
  onPick: () => void
  children: React.ReactNode
}>

export const PickChip = ({
  isPicked,
  detail,
  onPick,
  children
}: PickChipProps) => {
  return (
    <Button
      variant="bare"
      aria-pressed={isPicked}
      onClick={onPick}
      className="h-auto flex-col items-start gap-0.5 rounded-lg border border-border px-3 py-2 aria-pressed:border-primary/45 aria-pressed:bg-primary/8"
    >
      <span className="text-aside font-medium">{children}</span>
      <span className="font-mono text-mark text-muted-foreground">
        {detail}
      </span>
    </Button>
  )
}
