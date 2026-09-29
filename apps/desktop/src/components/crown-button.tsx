import React from 'react'
import { Button, cn } from '@multifus/retro'

type CrownButtonProps = Readonly<{
  label: string
  isClosing?: boolean
  onClick: () => void
  children: React.ReactNode
}>

const holdTheDrag = (event: React.PointerEvent) => {
  event.stopPropagation()
}

export const CrownButton = ({
  label,
  isClosing = false,
  onClick,
  children
}: CrownButtonProps) => {
  return (
    <Button
      variant="bare"
      size="icon-tight"
      aria-label={label}
      className={cn(
        'shrink-0 text-muted-foreground hover:text-foreground',
        isClosing ? 'hover:bg-destructive/20' : 'hover:bg-foreground/8'
      )}
      onPointerDown={holdTheDrag}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
