import type React from 'react'
import { X } from 'lucide-react'
import { Button } from '@multifus/retro'

type CloseButtonProps = Readonly<{
  label: string
  onClick: () => void
}>

const handlePointerDown = (event: React.PointerEvent) => {
  event.stopPropagation()
}

export const CloseButton = ({ label, onClick }: CloseButtonProps) => {
  return (
    <Button
      variant="bare"
      size="icon-tight"
      aria-label={label}
      className="shrink-0 text-muted-foreground hover:bg-destructive/20 hover:text-foreground"
      onPointerDown={handlePointerDown}
      onClick={onClick}
    >
      <X aria-hidden strokeWidth={2} />
    </Button>
  )
}
