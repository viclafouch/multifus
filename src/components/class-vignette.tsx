import React from 'react'
import { Button } from '@/components/ui/button'

type ClassVignetteProps = Readonly<{
  label: string
  ariaLabel: string
  isCurrent: boolean
  onPick: () => void
  children: React.ReactNode
}>

export const ClassVignette = ({
  label,
  ariaLabel,
  isCurrent,
  onPick,
  children
}: ClassVignetteProps) => {
  return (
    <Button
      variant="ghost"
      aria-label={ariaLabel}
      aria-pressed={isCurrent}
      onClick={onPick}
      className="h-auto w-full flex-col gap-1 rounded-lg p-1.5 whitespace-normal aria-pressed:bg-primary/12 aria-pressed:ring-1 aria-pressed:ring-primary/40"
    >
      {children}
      <span className="w-full truncate text-center text-mini text-muted-foreground">
        {label}
      </span>
    </Button>
  )
}
