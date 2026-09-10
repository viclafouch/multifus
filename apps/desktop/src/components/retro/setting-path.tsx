import React from 'react'
import { cn } from '@/lib/utils'

type SettingPathProps = Readonly<{
  path: readonly string[]
  className?: string
}>

export const SettingPath = ({ path, className }: SettingPathProps) => {
  const last = path.length - 1

  return (
    <p
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-1.5 text-aside text-khaki/70',
        className
      )}
    >
      {path.map((label, rank) => {
        return (
          <React.Fragment key={label}>
            {rank === 0 ? null : (
              <span aria-hidden className="text-band">
                ›
              </span>
            )}
            <span
              data-target={rank === last ? '' : undefined}
              className="data-target:font-medium data-target:text-khaki"
            >
              {label}
            </span>
          </React.Fragment>
        )
      })}
    </p>
  )
}
