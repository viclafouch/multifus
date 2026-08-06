import React from 'react'
import { IconTile } from '@/components/layout/icon-tile'

type FieldRowProps = Readonly<{
  label: string
  description: string
  /** A glyph in a bordered tile, for a list whose rows need telling apart. */
  icon?: React.ReactNode
  children: React.ReactNode
}>

/**
 * One setting: what it is on the left, what it is set to on the right.
 * The description says what the setting gives when it is on, in one line.
 */
export const FieldRow = ({
  label,
  description,
  icon,
  children
}: FieldRowProps) => {
  return (
    <div className="flex items-center gap-4 border-b border-border/70 px-4 py-3.5 last:border-b-0">
      {icon === undefined ? null : <IconTile>{icon}</IconTile>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-row font-medium">{label}</p>
        <p className="text-note text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}
