import React from 'react'

type StateBadgeProps = Readonly<{
  children: React.ReactNode
}>

export const StateBadge = ({ children }: StateBadgeProps) => {
  return (
    <p className="toned flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-micro font-medium tracking-micro uppercase">
      <span
        aria-hidden
        className="size-lamp shrink-0 rounded-full bg-current"
      />
      {children}
    </p>
  )
}
