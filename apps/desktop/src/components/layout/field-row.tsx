import React from 'react'
import { IconTile } from '@/components/layout/icon-tile'

type FieldRowProps = Readonly<{
  label: string
  description: string
  icon?: React.ReactNode
  mention?: string
  children: React.ReactNode
}>

export const FieldRow = ({
  label,
  description,
  icon,
  mention,
  children
}: FieldRowProps) => {
  return (
    <div className="flex items-center gap-4 border-b border-border/70 px-4 py-3.5 last:border-b-0">
      {icon === undefined ? null : <IconTile>{icon}</IconTile>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-row font-medium">
          {label}
          {mention === undefined ? null : (
            <span className="rounded-full border border-border bg-card px-1.5 py-px text-micro font-normal tracking-micro text-muted-foreground/85 uppercase">
              {mention}
            </span>
          )}
        </p>
        <p className="text-note text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}
