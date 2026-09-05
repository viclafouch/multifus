import React from 'react'

type SettingPathProps = Readonly<{
  path: readonly string[]
}>

export const SettingPath = ({ path }: SettingPathProps) => {
  const last = path.length - 1

  return (
    <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-aside text-khaki/70">
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
