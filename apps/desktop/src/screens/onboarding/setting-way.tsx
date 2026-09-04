import React from 'react'

type SettingWayProps = Readonly<{
  way: readonly string[]
  align?: 'start' | 'center'
}>

export const SettingWay = ({ way, align = 'start' }: SettingWayProps) => {
  const last = way.length - 1

  return (
    <p
      data-align={align}
      className="text-note text-muted-foreground data-[align=center]:text-center data-[align=start]:truncate"
    >
      {way.map((label, rank) => {
        return (
          <React.Fragment key={label}>
            {rank === 0 ? null : (
              <span
                aria-hidden
                className="px-1.5 text-row text-muted-foreground/70"
              >
                ›
              </span>
            )}
            <span
              data-target={rank === last ? '' : undefined}
              className="data-target:text-foreground/85"
            >
              {label}
            </span>
          </React.Fragment>
        )
      })}
    </p>
  )
}
