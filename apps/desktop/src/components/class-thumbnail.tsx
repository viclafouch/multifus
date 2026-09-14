import React from 'react'
import { Button } from '@multifus/retro'

type ClassThumbnailProps = Readonly<{
  label: string
  ariaLabel: string
  onPick: () => void
  children: React.ReactNode
  isCurrent?: boolean
}>

export const ClassThumbnail = ({
  label,
  ariaLabel,
  onPick,
  children,
  isCurrent
}: ClassThumbnailProps) => {
  return (
    <Button
      variant="bare"
      aria-label={ariaLabel}
      aria-pressed={isCurrent}
      onClick={onPick}
      className="h-auto w-full flex-col gap-1 rounded-lg p-1.5 whitespace-normal aria-pressed:bg-primary/12 aria-pressed:ring-1 aria-pressed:ring-primary/40"
    >
      {children}
      <span className="w-full truncate text-center text-aside text-muted-foreground">
        {label}
      </span>
    </Button>
  )
}
